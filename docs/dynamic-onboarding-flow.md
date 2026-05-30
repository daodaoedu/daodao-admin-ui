# Dynamic Onboarding Flow

## 背景

原本 `daodao-f2e` 的 onboarding 流程是寫死的三步驟（個人資料、興趣、來源），admin-ui 雖然有 `OnboardingFlowsPage`，但因為：

1. `onboarding_flows` / `onboarding_steps` / `onboarding_responses` 三張 DB 表從未建立
2. 前端型別與後端實際欄位名稱不符（`isActive` vs `isEnabled`、`question` vs `questionText`）
3. f2e 完全不讀 API，流程硬編碼

所以 admin-ui 一直顯示假資料，f2e 的流程也無法從後台配置。

---

## 本次修改範圍

### 修正 admin-ui 假資料問題

**`src/api/admin-community.ts`**
- `isActive` → `isEnabled`
- `question` → `questionText`
- `type` → `questionType`
- 移除 `topAnswer`、`topPercent`、`avgDurationMinutes`、`newUsersThisMonth`（後端不回傳）
- `OnboardingFlowAnalytics` 改為對齊後端：`totalStarted`、`totalCompleted`、`averageTimeMinutes`、`dropOffSteps`

**`src/pages/OnboardingFlowsPage.tsx`**
- 移除所有寫死假資料（`FLOW_STEPS`、`FUNNEL_STEPS`）
- 用 `isEnabled` 找啟用流程
- 用 `useOnboardingFlowAnalytics` 拿真實數據
- 漏斗從 `dropOffSteps` 動態計算

---

### 建立 DB Schema（daodao-storage）

**`schema/840_create_onboarding_flow_tables.sql`**

```
onboarding_flows      id, name, is_enabled, created_at, updated_at
onboarding_steps      id, flow_id, question_text, question_type, options (JSONB),
                      field_key, sort_order, created_at, updated_at
onboarding_responses  id, user_id, flow_id, step_id, answer (JSONB),
                      completed_at, created_at
                      UNIQUE(user_id, step_id)
```

**`field_key`** 是關鍵欄位，讓動態步驟的答案可以映射到 user record：
- `"interests"` → `interestList`
- `"professional_fields"` → `professionalField`
- `"referral"` → `referralSource`

---

### 新增後端 Public API（daodao-server）

| Method | Path | Auth | 說明 |
|--------|------|------|------|
| GET | `/api/v1/onboarding/flows/active` | 無 | 取得啟用中的流程 + 步驟 |
| POST | `/api/v1/onboarding/flows/:id/responses` | 需登入 | 記錄用戶回答 |

`GET /flows/active` 放在 `router.use(authenticate)` 之前，確保不需 token 即可存取。

**新增檔案：**
- `src/services/onboarding-flow.service.ts`
- `src/controllers/onboarding.controller.ts`（新增兩個 handler）
- `src/routes/onboarding.routes.ts`（新增兩條路由）

---

### 修改 f2e 讀取動態流程（daodao-f2e）

**新增檔案：**
- `packages/api/src/services/onboarding-flow.ts` — `getActiveOnboardingFlow()`、`submitOnboardingFlowResponse()`
- `apps/product/.../use-active-flow.ts` — 取得啟用流程的 hook
- `apps/product/.../dynamic-step.tsx` — 依 `questionType` 渲染 single / multi / text

**修改檔案：**
- `schema.ts` — 主 schema 放寬 interests/referral/professionalFields 驗證（允許空值），以支援動態流程模式；step schema 獨立定義，仍強制必填
- `use-onboarding-step.ts` — 改為接受動態 `totalSteps` 參數
- `onboarding-form.tsx` — 整合動態流程邏輯（見下方流程說明）

---

## f2e Onboarding 流程邏輯

```
啟動 → 呼叫 GET /onboarding/flows/active

有啟用流程                    沒有啟用流程（fallback）
─────────────────             ─────────────────────────
Step 1: Profile（固定）       Step 1: Profile（固定）
Step 2..N: 動態步驟           Step 2: InterestsSection
Step N+1: Success             Step 3: ReferralSection
                              Step 4: Success
```

**Submit 時：**
1. 依 `fieldKey` 將動態答案映射到 user record（interests、professionalField、referralSource）
2. 呼叫 `createCurrentUserWithFormData` / `updateCurrentUserWithFormData`
3. 平行呼叫 `POST /onboarding/flows/:id/responses` 記錄每個步驟的回答（非阻塞，失敗不影響用戶）

---

## 啟用動態流程步驟

1. **執行 DB migration**（在 daodao-storage 執行）：
   ```
   schema/840_create_onboarding_flow_tables.sql
   ```

2. **在 admin-ui 建立流程**：
   - 進入 `/admin/onboarding-flows`
   - 建立新流程，新增步驟
   - 設定 `is_enabled = true`
   - 若要映射到 user record，在步驟的 `field_key` 設定對應值

3. f2e 的 `/auth/onboarding` 頁面會自動讀到新流程。
