# Email 模板與管理介面說明

說明 daodao 系統中 email 模板的架構、資料流、管理介面，以及如何新增 / 修改 email 功能。

---

## 整體架構

```
┌─────────────────────────────────────────────────────────────┐
│                    daodao-admin-ui                          │
│                                                             │
│  EmailManagementPage      TriggeredEmailsPage               │
│  ├── 統計卡片              ├── 觸發規則列表                   │
│  ├── 歷史紀錄 (History)    ├── 啟用 / 停用 toggle            │
│  ├── 手動發送 (Compose)    └── 執行日誌                      │
│  ├── 批次重試 (Retry)                                        │
│  └── 模板管理 (Templates)                                    │
└────────────────┬────────────────────────────────────────────┘
                 │  /daodao-server/api/v1/admin/email*
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    daodao-server                            │
│                                                             │
│  Routes: email.routes.ts + admin.routes.ts                  │
│  Controllers: email.controller.ts                           │
│               admin-email-trigger.controller.ts             │
│               email-history.controller.ts                   │
│  Services:  EmailService → 核心發送                         │
│             EmailLogService → 紀錄與追蹤                    │
│             AdminEmailTriggerService → 模板 & 規則           │
│  Queue:     BullMQ（Generic Email Queue）                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         PostgreSQL               Redis（BullMQ）
  email_logs                 Generic Email Queue
  email_trigger_rules        → async 發送 + retry
  email_trigger_logs
```

---

## 一、Email 模板系統

### 1-1 兩種模板層次

| 層次 | 存放位置 | 誰管理 | 說明 |
|------|----------|--------|------|
| **內建系統模板** | 原始碼（TypeScript 檔案）| 開發者 | 歡迎信、驗證信等固定格式，HTML 寫死在 service 層 |
| **可編輯模板（EmailTemplate）** | 資料庫（Prisma）| 管理後台 | 可在後台 CRUD，支援 `{{variable}}` 變數語法 |

### 1-2 內建系統模板

位置：`daodao-server/src/services/email/`

| 檔案 | 用途 | 特殊邏輯 |
|------|------|---------|
| `welcome-template.ts` | 歡迎信 | 依 `referralSource` 分 3 種版本：social-media / community / default |
| `verification-template.ts` | Email 驗證 | 含驗證連結 |
| `password-reset-template.ts` | 密碼重設 | 含重設連結，限時有效 |
| `contact-template.ts` | 聯絡表單 | 轉發給管理員 |
| `marathon-template.ts` | 活動 / 馬拉松 | 活動報名通知 |
| `base-template.ts` | 共用元件 | Header、Banner、CTA Button、Footer、Divider |

**`base-template.ts` 提供的共用元件：**

```typescript
createEmailHeader(metadata)     // Email 頂部 metadata
createBannerSection(url)        // 橫幅圖片
createMainContent(html)         // 主內容包裝
createCTAButton(text, url, color) // CTA 按鈕（color: 'orange' | 'cyan'）
createFooter(unsubscribeUrl)    // 頁尾含退訂連結
createAuthorSection(author)     // 作者區塊
createDivider()                 // 分隔線
```

### 1-3 可編輯模板（資料庫）

**Prisma 資料模型：**（schema 約 line 1081）

```
email_trigger_rules
├── id
├── name            VARCHAR(100)
├── description     VARCHAR(500)
├── trigger_type    VARCHAR(50)  -- dormant_days | no_action_days | tag_change
├── trigger_config  JSON         -- 觸發條件設定
├── template        VARCHAR(50)  -- 對應模板名稱
├── subject         VARCHAR(255)
├── enabled         BOOLEAN
├── sent_count      INT
├── open_rate       FLOAT
├── created_at / updated_at
└── created_by      FK → users
```

**EmailTemplate 型別**（前端 `src/api/types.ts`）：

```typescript
interface EmailTemplate {
  id: number
  name: string
  subject: string
  body: string          // HTML 內容，支援 {{variable}} 語法
  variables: string[]   // 可用變數清單，例如 ['userName', 'actionUrl']
  createdAt: string
}
```

### 1-4 Email 類型清單

定義於 `daodao-server/src/types/email/base.types.ts`：

```
認證類：  AUTH_REGISTER, AUTH_PASSWORD_RESET, AUTH_EMAIL_VERIFY
練習類：  PRACTICE_CREATED, PRACTICE_FIRST_CHECKIN,
         PRACTICE_WEEKLY_SUMMARY, PRACTICE_FINAL_SUMMARY
活動類：  CONTACT, MARATHON
通知類：  NOTIFICATION, NOTIFICATION_DIGEST, NOTIFICATION_WEEKLY,
         REACTION_NOTIFICATION
歡迎類：  WELCOME_LETTER
入門類：  ONBOARDING_L0, ONBOARDING_A~E
```

---

## 二、Email 發送流程

### 2-1 正常發送流程

```
API 請求
  │
  ▼
EmailController
  │  validate() — Zod schema 驗證
  ▼
EmailService.sendEmail()
  ├── 1. createEmailLog() — 建 pending 紀錄，產生 tracking token
  ├── 2. 將 tracking pixel 注入 HTML（</body> 前插入 <img>）
  ├── 3. enqueueEmail() — 送入 BullMQ Generic Email Queue
  │        │  queue 不可用時 fallback 同步發送
  │        ▼
  │   BullMQ Worker
  │        ├── nodemailer 發送
  │        └── updateEmailLogStatus() — 更新 sent / failed
  └── 4. 回傳 email log ID
```

### 2-2 失敗重試流程

```
管理後台「Retry」Tab
  │
  ├── 批次重試（最多 50 封）
  │     POST /api/v1/email/retry-failed
  │     → findFailedEmailsForRetry() 取得候選
  │     → markEmailLogRetrying() 遞增 retry_count
  │     → 重新 enqueue
  │
  └── 單封重試
        POST /api/v1/email/retry/:logId
        → 直接 re-enqueue
```

### 2-3 觸發規則（Trigger Rules）流程

```
觸發事件（用戶休眠 N 天、標籤變更等）
  │
  ▼
BullMQ Worker 定期掃描 email_trigger_rules（enabled=true）
  │
  ▼
AdminEmailTriggerService
  ├── 比對 trigger_type + trigger_config
  ├── 找到符合用戶
  ├── EmailService.sendEmail()（套用 template + subject）
  └── 寫入 email_trigger_logs（rule_id, recipient, status）
```

---

## 三、前端介面

### 3-1 EmailManagementPage（`/email-management`）

路由：`/email-management` → 系統區段

**四個 Tab：**

#### History（歷史紀錄）
元件：`EmailHistoryTable.tsx`

| 功能 | 說明 |
|------|------|
| 收件人搜尋 | 模糊比對 email 地址 |
| 狀態篩選 | 全部 / sent / failed / pending |
| Email 類型篩選 | 輸入 email_type 字串 |
| 日期區間 | 起始 / 結束日期 |
| 分頁 | 上一頁 / 下一頁 |
| 單封重試 | failed 狀態顯示 Retry 按鈕 → `retrySingleEmail()` |

狀態 badge 顏色：`sent` 綠、`failed` 紅、`pending` 黃

#### Compose（手動發送）
- 輸入：收件人、主旨、純文字內容（自動轉為 HTML `<p>` 段落）
- 顯示：SMTP 連線狀態、提供者名稱、最後確認時間
- 呼叫：`sendCustomEmail()` → POST `/api/v1/admin/email/send`

#### Retry（批次重試）
- 顯示目前 queue 待發數量、退信率
- 一鍵重試最多 50 封失敗 email
- 呼叫：`retryFailedEmails()` → POST `/api/v1/email/retry-failed`

#### Templates（模板管理）
- 列出所有可編輯模板（資料庫模板）
- 新增模板：name、subject、body（HTML）、variables（以逗號分隔輸入）
- 編輯模板：inline 表單
- 刪除模板：確認對話框，提示「會影響使用此模板的觸發規則」
- API：`listEmailTemplates / createEmailTemplate / updateEmailTemplate / deleteEmailTemplate`

### 3-2 TriggeredEmailsPage（`/triggered-emails`）

路由：`/triggered-emails` → 溝通區段

| 區塊 | 說明 |
|------|------|
| 統計卡片 | 啟用規則數、本月發送數、平均開信率 |
| 規則列表 | 名稱、觸發類型、模板、發送次數、開信率 |
| 啟用 toggle | 即時切換 `enabled`，呼叫 `toggleEmailTriggerRule()` |
| 執行日誌 | 最近 10 筆：規則名稱、收件人、發送時間、狀態 |
| 新增規則 | 目前顯示「功能開發中」（待實作） |

---

## 四、API 端點

### Email 模板 CRUD

| Method | 端點 | 說明 |
|--------|------|------|
| GET | `/api/v1/admin/email-templates` | 取得所有模板 |
| POST | `/api/v1/admin/email-templates` | 新增模板 |
| PUT | `/api/v1/admin/email-templates/:id` | 更新模板 |
| DELETE | `/api/v1/admin/email-templates/:id` | 刪除模板 |

### Email 觸發規則

| Method | 端點 | 說明 |
|--------|------|------|
| GET | `/api/v1/admin/email-triggers` | 列出所有規則 |
| POST | `/api/v1/admin/email-triggers` | 建立規則 |
| PUT | `/api/v1/admin/email-triggers/:id` | 更新規則 |
| DELETE | `/api/v1/admin/email-triggers/:id` | 刪除規則 |
| GET | `/api/v1/admin/email-triggers/:id/logs` | 規則執行日誌 |
| GET | `/api/v1/admin/email-triggers/:id/stats` | 規則統計 |

### Email 歷史 & 發送

| Method | 端點 | 說明 |
|--------|------|------|
| GET | `/api/v1/admin/email/history` | 歷史紀錄（分頁 + 篩選）|
| GET | `/api/v1/admin/email/stats` | 統計數據 |
| GET | `/api/v1/admin/email/health` | SMTP 健康狀態 |
| POST | `/api/v1/admin/email/send` | 手動發送單封 |
| POST | `/api/v1/email/retry-failed` | 批次重試失敗 |
| POST | `/api/v1/email/retry/:logId` | 單封重試 |

---

## 五、前端程式碼對應

### API 函式（`src/api/`）

| 函式 | 所在檔案 | 說明 |
|------|---------|------|
| `listEmailTemplates()` | `admin-system.ts` | 列出模板 |
| `createEmailTemplate()` | `admin-system.ts` | 新增模板 |
| `updateEmailTemplate()` | `admin-system.ts` | 更新模板 |
| `deleteEmailTemplate()` | `admin-system.ts` | 刪除模板 |
| `getEmailHistory()` | `admin-system.ts` | 歷史（基本）|
| `getEmailHistoryFiltered()` | `admin-system.ts` | 歷史（進階篩選）|
| `getEmailStats()` | `admin-system.ts` | 統計 |
| `getEmailHealth()` | `admin-system.ts` | SMTP 健康 |
| `sendCustomEmail()` | `admin-system.ts` | 手動發送 |
| `retryFailedEmails()` | `admin-system.ts` | 批次重試 |
| `retrySingleEmail()` | `admin-system.ts` | 單封重試 |
| `listEmailTriggerRules()` | `admin-communication.ts` | 列出規則 |
| `createEmailTriggerRule()` | `admin-communication.ts` | 建立規則 |
| `updateEmailTriggerRule()` | `admin-communication.ts` | 更新規則 |
| `toggleEmailTriggerRule()` | `admin-communication.ts` | 啟用 / 停用 |
| `deleteEmailTriggerRule()` | `admin-communication.ts` | 刪除規則 |
| `getEmailTriggerStats()` | `admin-communication.ts` | 規則統計 |
| `listEmailTriggerLogs()` | `admin-communication.ts` | 執行日誌 |

### Hooks（`src/hooks/`）

| Hook | 檔案 | 說明 |
|------|------|------|
| `useEmailStats()` | `useEmailManagement.ts` | email 統計 |
| `useEmailHealth()` | `useEmailManagement.ts` | SMTP 健康 |
| `useEmailHistory()` | `useEmailManagement.ts` | 歷史紀錄 |
| `useSendEmail()` | `useEmailManagement.ts` | 發送 mutation |
| `useEmailTemplates()` | `useEmailTemplates.ts` | 模板列表 |
| `useCreateEmailTemplate()` | `useEmailTemplates.ts` | 新增 mutation |
| `useUpdateEmailTemplate()` | `useEmailTemplates.ts` | 更新 mutation |
| `useDeleteEmailTemplate()` | `useEmailTemplates.ts` | 刪除 mutation |
| `useEmailTriggerRules()` | `useEmailTrigger.ts` | 規則列表 |
| `useEmailTriggerStats()` | `useEmailTrigger.ts` | 規則統計 |
| `useEmailTriggerLogs()` | `useEmailTrigger.ts` | 執行日誌 |
| `useToggleEmailTriggerRule()` | `useEmailTrigger.ts` | 啟用 toggle |

---

## 六、Email 追蹤機制

```
1. 發送時：EmailService 注入 tracking pixel
   <img src="{BACKEND_URL}/api/v1/email/track/open/{token}" width="1" height="1">

2. 收件人開信：瀏覽器請求 tracking pixel
   GET /api/v1/email/track/open/:token（公開端點，有 rate limit）

3. EmailLogService.recordEmailOpen()
   → 寫入 email_logs.opened_at（首次）
   → 遞增 email_logs.open_count
```

Tracking token：`crypto.randomUUID()`，在 `createEmailLog()` 時產生。

---

## 七、新增 Email 功能標準流程

### 新增一種系統 email 類型

1. **新增 email type 常數**（`daodao-server/src/types/email/base.types.ts`）
2. **建立 template 函式**（`src/services/email/xxx-template.ts`），使用 `base-template.ts` 的共用元件
3. **在 EmailService 新增發送方法**（`email.service.ts`）
4. **建立 route + controller**（`email.routes.ts` + `email.controller.ts`）

### 新增可編輯模板（後台管理）

1. 在後台 EmailManagementPage → Templates Tab → 點「新增」
2. 填入 name、subject、HTML body（可使用 `{{variable}}` 語法）、variables 清單
3. 呼叫 `POST /api/v1/admin/email-templates`，存入資料庫

### 新增觸發規則

1. 後台 TriggeredEmailsPage → 點「新增規則」（目前待開發）
2. 設定：name、trigger_type（dormant_days / no_action_days / tag_change）、trigger_config、template、subject
3. 呼叫 `POST /api/v1/admin/email-triggers`

---

## 八、資料庫模型位置

Prisma schema（`daodao-server/prisma/schema.prisma`）：

| 模型 | 約略行號 | 說明 |
|------|---------|------|
| `email_logs` | ~1055 | 發送紀錄（含 tracking token、開信時間、retry 次數）|
| `email_trigger_rules` | ~1081 | 自動觸發規則設定 |
| `email_trigger_logs` | ~1101 | 觸發執行紀錄 |
| `admin_notifications` | ~1114 | 管理員建立的通知 |
