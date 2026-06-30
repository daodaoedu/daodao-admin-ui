# Onboarding Tracking Plan

> 建立日期：2026-05-30
> 狀態：規劃中

## 目標

追蹤八項使用者行為指標，供 admin-ui 分析使用：

1. **註冊來源**：使用者從哪個入口進來（Landing page、測驗、Action Maker）
2. **實踐建立方式**：主題實踐如何被建立（自建、複製、行動產生器）
3. **Onboarding Badge 完成**：使用者是否完成 onboarding 並獲得 badge
4. **任務完成天數**：使用者花幾天完成各任務
5. **學習風格測驗**：使用者測驗結果為哪種角色（探究者/行動者/結構者/流動者/連結者）
6. **人物誌填寫狀況**：使用者是否填寫學習人物誌 Q&A、填寫了幾題
7. **Email 序列**：onboarding 6 封信（L0/A/B/C/D/E）的寄送率與開信率
8. **使用者參與度**：打卡 streak、實踐數量/放棄率、最後活躍時間

---

## 現況分析

### 已存在的欄位

| 欄位 | 位置 | 說明 |
|------|------|------|
| `referral_source` | `users` table | 使用者自填從哪聽到（instagram/facebook/etc），**不是**流程入口 |
| `user_source` | `user_onboarding` | 衍生欄位 S1/S2/S3，由 `deriveUserSource()` 計算 |
| `creation_method` | `user_onboarding` | 第一次建立實踐的方式（self_created/copied/action_generator），僅限 onboarding Task C |
| `source_practice_id` | `practices` | 被複製時記錄來源 practice ID |
| `copy_count` | `practices` | 被複製次數 |
| `badge_granted` | `user_onboarding` | Boolean：是否獲得 badge |
| `badge_granted_at` | `user_onboarding` | Badge 獲得時間 |
| `completed_at` | `user_onboarding` | Onboarding 完成時間 |
| `days_to_complete` | `user_onboarding` | 完成整個 onboarding 花的天數（已計算） |
| `task_states` | `user_onboarding` | JSONB `{ A: "done", B: "done", ... }` |
| `result_type` | `quiz_results` | 學習風格測驗結果 `L\|C\|A\|D\|O`（已有完整 table） |
| `scores` | `quiz_results` | JSONB，各維度分數 |
| `answers` | `quiz_results` | JSONB，原始答題紀錄 |

**學習風格測驗五型**（程式碼常數 `ROLE_IDS`）：

| 代碼 | 角色名稱 | 島嶼 | 英文 |
|------|----------|------|------|
| D | 探究者 | 探探島 | Explorer |
| A | 行動者 | 動動島 | Actor |
| O | 結構者 | 構構島 | Organizer |
| L | 流動者 | 跨跨島 | Linker |
| C | 連結者 | 連連島 | Connector |

**人物誌（學習人物誌 Q&A）**：使用者回答 `persona_questions` 問題，答案存於 `persona_answers`。需答滿 5 題才能查看他人人物誌（unlock gate）。目前無 admin 彙總分析。

### 缺口

| 需求 | 問題 |
|------|------|
| 區分 Landing page / 測驗 / Action Maker 入口 | `user_source` S1/S2/S3 是依 referral_source 推算，不是實際入口流程 |
| 所有實踐的建立來源 | `creation_method` 只記錄 onboarding 第一次，之後的實踐沒有 |
| 各任務完成的時間點 | `task_states` 只記錄「done/not done」，沒有時間戳 |
| 學習風格測驗分布分析 | `quiz_results` 有資料但無 admin 彙總 API，也未與 onboarding 指標交叉分析 |
| 未做測驗的使用者比例 | 需 LEFT JOIN users 才能知道有多少人從未做測驗 |
| 人物誌填寫狀況 | `persona_answers` 有資料但無 admin 彙總 API（填寫率、平均填題數） |
| Admin-UI 呈現上述資料 | 需要新 API endpoint 供 admin 查詢 |

---

## 規劃

### 1. 註冊來源追蹤

**目標**：明確記錄使用者透過哪個「功能入口」完成註冊。

#### 1.1 daodao-server — DB 新增欄位

**Migration 檔案**：`/Users/xiaoxu/Projects/daodao/daodao-storage/schema/850_add_registration_flow.sql`

```sql
ALTER TABLE user_onboarding
  ADD COLUMN registration_flow VARCHAR(30)
    CHECK (registration_flow IN ('landing_page', 'quiz', 'action_maker'))
    DEFAULT 'landing_page';
```

> `user_source`（S1/S2/S3）保留，繼續做任務排序。
> `registration_flow` 是 **實際入口**，由 f2e 在呼叫 register/login API 時帶入。

#### 1.2 daodao-server — API 修改

**`POST /api/v1/auth/register`（或 `/api/v1/auth/complete-onboarding`）**

request body 新增選用參數：
```typescript
registration_flow?: 'landing_page' | 'quiz' | 'action_maker'
```

在 `onboarding.service.ts` 的 `initUserOnboarding()` 中接收並寫入 `registration_flow`。

#### 1.3 daodao-f2e — 傳入入口資訊

在三個不同的註冊/onboarding 入口帶入 `registration_flow`：

| 頁面/流程 | 傳入值 |
|-----------|--------|
| 一般 Landing page 註冊流程 | `'landing_page'` |
| `/quiz` 測驗完成後導入 | `'quiz'` |
| Action Maker 工具產生後導入 | `'action_maker'` |

具體傳入點：呼叫 `submitOnboardingFlowResponse` 或 `createCurrentUser` 時附帶。

---

### 2. 實踐建立方式追蹤

**目標**：記錄每一個實踐（不只 onboarding 第一個）的建立方式。

#### 2.1 daodao-server — DB 新增欄位

**Migration 檔案**：`/Users/xiaoxu/Projects/daodao/daodao-storage/schema/851_add_practice_creation_source.sql`

```sql
ALTER TABLE practices
  ADD COLUMN creation_source VARCHAR(20)
    CHECK (creation_source IN ('self_created', 'copied', 'action_generator'))
    DEFAULT 'self_created';
```

#### 2.2 daodao-server — 服務層修改

**`practice.service.ts`**

| 操作 | creation_source |
|------|-----------------|
| `create()` 一般建立 | `'self_created'` |
| `copy()` 複製 | `'copied'`（已有 `source_practice_id`） |
| 行動產生器建立（新增 query param） | `'action_generator'` |

在 `createPractice()` 的 request body 接受 `creation_source?: string`，預設 `'self_created'`。

**`POST /api/v1/practices`** 新增 request body：
```typescript
creation_source?: 'self_created' | 'copied' | 'action_generator'
```

**`POST /api/v1/practices/:id/copy`** 在 service 層自動設定 `creation_source = 'copied'`，不需 client 傳入。

> `user_onboarding.creation_method` 保留，繼續記錄 onboarding Task C 的第一次建立（Admin-UI 分析用）。

---

### 3. Onboarding Badge 完成追蹤

**現況**：欄位已完整，`badge_granted`、`badge_granted_at`、`days_to_complete` 均已存在。

**缺的是 Admin API 和 Admin-UI 頁面呈現。**

#### 3.1 daodao-server — 新增 Admin API

**`GET /api/v1/admin/onboarding/stats`**

Response：
```typescript
{
  totalUsers: number
  badgeGrantedCount: number
  badgeGrantedRate: number           // percentage
  avgDaysToComplete: number
  byRegistrationFlow: {
    landing_page: { total: number; badgeGranted: number }
    quiz: { total: number; badgeGranted: number }
    action_maker: { total: number; badgeGranted: number }
  }
  byCreationMethod: {
    self_created: number
    copied: number
    action_generator: number
  }
  completionByDay: Array<{           // histogram
    days: number
    count: number
  }>
}
```

**`GET /api/v1/admin/users/:id/onboarding`**

Response：
```typescript
{
  userId: string
  registrationFlow: 'landing_page' | 'quiz' | 'action_maker'
  userSource: 'S1' | 'S2' | 'S3'
  creationMethod: 'self_created' | 'copied' | 'action_generator'
  taskStates: Record<string, 'done' | 'pending'>
  taskCompletedAt: Record<string, string>   // 各任務完成時間（見下方 §4）
  badgeGranted: boolean
  badgeGrantedAt: string | null
  daysToComplete: number | null
  completedAt: string | null
}
```

---

### 4. 任務完成天數追蹤

**目標**：記錄每個任務（A/B/C/D/E）的完成時間，計算從 onboarding 開始到各任務完成的天數。

#### 4.1 daodao-server — DB 修改

**Migration 檔案**：`/Users/xiaoxu/Projects/daodao/daodao-storage/schema/852_add_task_completed_at.sql`

```sql
ALTER TABLE user_onboarding
  ADD COLUMN task_completed_at JSONB DEFAULT '{}';
-- 格式：{ "A": "2026-01-15T10:30:00Z", "B": "2026-01-16T...", ... }
```

> 選擇 JSONB 而非多個 TIMESTAMPTZ 欄位，理由：
> - 任務集合可能因 `user_source` 不同而有增減
> - 不影響既有 schema，migration 無 breaking change

#### 4.2 daodao-server — 服務層修改

**`onboarding.service.ts`** 的 `updateTaskState()` 修改：

```typescript
// 原有：
task_states: { ...current.task_states, [taskKey]: 'done' }

// 新增：
task_completed_at: {
  ...current.task_completed_at,
  [taskKey]: new Date().toISOString()
}
```

#### 4.3 天數計算

在 Admin API 回應中計算（不需額外儲存）：

```typescript
const daysToTask = (taskKey: string) => {
  const completedAt = user_onboarding.task_completed_at[taskKey]
  if (!completedAt) return null
  return differenceInDays(new Date(completedAt), user_onboarding.created_at)
}
```

---

### 5. 學習風格測驗分布追蹤

**現況**：`quiz_results` table 已完整儲存每次測驗結果（`result_type` L/C/A/D/O、`scores`、`answers`）。每個 user 可做多次，取最新一次為代表。

**缺的是 Admin 彙總 API 和交叉分析。**

#### 5.1 daodao-server — 新增 Admin API

**`GET /api/v1/admin/quiz/stats`**

```typescript
{
  totalUsers: number               // 平台總用戶數
  quizCompletedCount: number       // 做過測驗的用戶數
  quizCompletedRate: number        // 測驗完成率 %
  byRole: {                        // 各角色人數與佔比
    D: { count: number; rate: number }
    A: { count: number; rate: number }
    O: { count: number; rate: number }
    L: { count: number; rate: number }
    C: { count: number; rate: number }
  }
  byRoleAndBadge: {                // 各角色的 badge 完成率（交叉分析）
    D: { badgeGranted: number; total: number }
    A: { badgeGranted: number; total: number }
    O: { badgeGranted: number; total: number }
    L: { badgeGranted: number; total: number }
    C: { badgeGranted: number; total: number }
  }
  byRoleAndRegistrationFlow: {    // 各角色的來源分布
    D: Record<'landing_page' | 'quiz' | 'action_maker', number>
    A: Record<'landing_page' | 'quiz' | 'action_maker', number>
    O: Record<'landing_page' | 'quiz' | 'action_maker', number>
    L: Record<'landing_page' | 'quiz' | 'action_maker', number>
    C: Record<'landing_page' | 'quiz' | 'action_maker', number>
  }
}
```

SQL 核心邏輯（取每位用戶最新測驗）：
```sql
WITH latest_quiz AS (
  SELECT DISTINCT ON (user_id)
    user_id, result_type
  FROM quiz_results
  ORDER BY user_id, completed_at DESC
)
SELECT result_type, COUNT(*) FROM latest_quiz GROUP BY result_type;
```

#### 5.2 User Detail 新增學習風格

**`GET /api/v1/admin/users/:id/onboarding`** 回應加入：

```typescript
learningStyle: {
  resultType: 'L' | 'C' | 'A' | 'D' | 'O' | null  // null = 未做測驗
  completedAt: string | null
  attemptCount: number
} | null
```

---

### 6. 人物誌填寫狀況追蹤

**現況**：`persona_answers` 已記錄每位用戶的答題紀錄，`persona_skips` 記錄跳過。需達 5 題才能 unlock 查看他人。**不需新增 DB schema**，缺的是 Admin 彙總 API。

#### 6.1 daodao-server — 新增 Admin API

**`GET /api/v1/admin/persona/stats`**

```typescript
{
  totalUsers: number
  anyAnswerCount: number           // 至少填了 1 題的用戶數
  anyAnswerRate: number            // %
  unlockedCount: number            // 達 5 題（可查看他人）的用戶數
  unlockedRate: number             // %
  avgAnswerCount: number           // 每位有填過的用戶平均填幾題
  answerCountDistribution: Array<{ // 填題數分布直方圖
    answerCount: number
    userCount: number
  }>
  topQuestions: Array<{            // 最多人回答的前 N 題
    questionId: number
    prompt: string
    answerCount: number
  }>
}
```

SQL 核心邏輯：
```sql
SELECT
  COUNT(DISTINCT user_id)                                    AS any_answer_count,
  COUNT(DISTINCT CASE WHEN cnt >= 5 THEN user_id END)        AS unlocked_count,
  AVG(cnt)                                                   AS avg_answer_count
FROM (
  SELECT user_id, COUNT(*) AS cnt
  FROM persona_answers
  GROUP BY user_id
) sub;
```

#### 6.2 User Detail 新增人物誌填寫狀況

**`GET /api/v1/admin/users/:id/onboarding`** 回應加入：

```typescript
persona: {
  answerCount: number              // 已填題數
  isUnlocked: boolean              // >= 5 題
  lastAnsweredAt: string | null
} | null
```

---

### 7. Email 序列追蹤

**現況**：`email_logs` 已完整記錄每封信的寄送與開信狀況。Onboarding 序列共 6 種信件類型，依 `user_source`（S1/S2/S3）決定發送哪些信。**不需新增 migration。**

| 欄位 | 說明 |
|------|------|
| `email_type` | `L0`（歡迎信）、`A`～`E`（對應 onboarding 任務） |
| `status` | sent / failed |
| `opened_at` | 首次開信時間（pixel tracking） |
| `open_count` | 開信次數 |
| `tracking_token` | 每封信的唯一追蹤 token |

#### 7.1 daodao-server — 新增 Admin API

**`GET /api/v1/admin/email/onboarding-stats`**

```typescript
{
  byEmailType: Record<'L0' | 'A' | 'B' | 'C' | 'D' | 'E', {
    sentCount: number
    openedCount: number
    openRate: number        // opened_at IS NOT NULL %
    failedCount: number
  }>
  byUserSource: Record<'S1' | 'S2' | 'S3', {
    sentCount: number
    openedCount: number
    openRate: number
  }>
}
```

#### 7.2 User Detail 新增 Email 序列狀況

**`GET /api/v1/admin/users/:id/onboarding`** 回應加入：

```typescript
emailSequence: Array<{
  emailType: 'L0' | 'A' | 'B' | 'C' | 'D' | 'E'
  status: 'sent' | 'failed' | 'not_sent'
  sentAt: string | null
  openedAt: string | null
  openCount: number
}>
```

---

### 8. 使用者參與度追蹤

**現況**：資料已分散在 `practice_checkins`、`practices`、`users` 等 table，缺的是彙總 Admin API。**不需新增 migration。**

#### 8.1 指標定義

| 指標 | 計算方式 | 資料來源 |
|------|----------|----------|
| **打卡 streak** | 連續打卡天數（最長 / 當前） | `practice_checkins.checkin_date` |
| **實踐總數** | 每位用戶建立的 practices 數 | `practices` |
| **活躍實踐數** | 有打卡記錄的 practices 數 | `practices` JOIN `practice_checkins` |
| **實踐放棄率** | 從未打卡的 practices / 總 practices | 同上 |
| **最後活躍時間** | 最近一次打卡或登入時間 | `practice_checkins.created_at` |

#### 8.2 daodao-server — 新增 Admin API

**`GET /api/v1/admin/engagement/stats`**

```typescript
{
  practiceStats: {
    avgPracticeCount: number         // 每位用戶平均建幾個實踐
    avgActivePracticeCount: number   // 平均活躍（有打卡）實踐數
    abandonmentRate: number          // 從未打卡的實踐佔比 %
  }
  checkinStats: {
    avgMaxStreak: number             // 平均最長連續打卡天數
    usersWithStreak7Plus: number     // 曾連續打卡 7 天以上的用戶數
    usersWithStreak30Plus: number    // 曾連續打卡 30 天以上的用戶數
  }
  retentionByDay: Array<{           // 第 N 天還有打卡的用戶比例
    day: number
    retentionRate: number
  }>
}
```

#### 8.3 User Detail 新增參與度

**`GET /api/v1/admin/users/:id/onboarding`** 回應加入：

```typescript
engagement: {
  practiceCount: number
  activePracticeCount: number
  maxCheckinStreak: number
  lastActiveAt: string | null        // 最近一次打卡時間
}
```

---

## Admin-UI 實作規劃

### 目標頁面

修改現有的 `OnboardingFlowsPage.tsx`，新增統計分析區塊。

### 新增顯示區塊

#### A. 註冊來源分布

```
Landing Page  ██████████████  68%  (340人)
測驗           █████████       42%  (210人)
Action Maker  ████            18%  ( 90人)
```

#### B. 實踐建立方式

```
自建    ███████████  52%
複製    ████████     38%
產生器  ██           10%
```

#### C. Onboarding Badge 完成率

```
已完成 badge  ████████████████  72%  (360 / 500人)
平均完成天數  4.2 天
```

#### D. 任務完成天數分布（Histogram）

橫軸：天數（1-30天）
縱軸：人數

各任務（A/B/C/D/E）可切換查看。

#### E. 學習風格測驗分布

```
測驗完成率  ████████████████  78%（390 / 500人）

D 探探島（探究者）  ██████████  25%
A 動動島（行動者）  ████████    20%
O 構構島（結構者）  ███████     18%
L 跨跨島（流動者）  ██████      15%
C 連連島（連結者）  █████████   22%
```

第二層交叉分析（Tab 切換）：
- **角色 × Badge 完成率**：哪種學習風格最容易完成 onboarding？
- **角色 × 註冊來源**：測驗入口帶來哪種學習風格居多？

#### F. 人物誌填寫狀況

```
至少填 1 題  ████████████  62%（310 / 500人）
已解鎖（5題以上）  ████████  40%（200 / 500人）
平均填題數  3.8 題
```

填題數分布直方圖（0 題 / 1-4 題 / 5-9 題 / 10 題以上）。

#### G. Email 序列開信率

```
L0 歡迎信   ████████████████████  85%  已寄 500 封
A  任務A     ████████████████      72%  已寄 490 封
B  任務B     ████████████          58%  已寄 485 封
C  任務C     ████████              42%  已寄 420 封
D  任務D     ██████                31%  已寄 380 封
E  任務E     █████                 28%  已寄 340 封
```

#### H. 參與度指標

```
平均建立實踐數    3.2 個
平均活躍實踐數    1.8 個
實踐放棄率        44%（從未打卡）
曾達 7 天 streak  ████████████  38%
曾達 30 天 streak ████          12%
```

### Admin-UI API 函式（新增到 `src/api/admin-community.ts`）

```typescript
export const getOnboardingStats = () =>
  apiClient.get<ApiResponse<OnboardingStats>>('/api/v1/admin/onboarding/stats')

export const getUserOnboardingDetail = (userId: string) =>
  apiClient.get<ApiResponse<UserOnboardingDetail>>(`/api/v1/admin/users/${userId}/onboarding`)

export const getQuizStats = () =>
  apiClient.get<ApiResponse<QuizStats>>('/api/v1/admin/quiz/stats')

export const getPersonaStats = () =>
  apiClient.get<ApiResponse<PersonaStats>>('/api/v1/admin/persona/stats')

export const getEmailOnboardingStats = () =>
  apiClient.get<ApiResponse<EmailOnboardingStats>>('/api/v1/admin/email/onboarding-stats')

export const getEngagementStats = () =>
  apiClient.get<ApiResponse<EngagementStats>>('/api/v1/admin/engagement/stats')
```

### 型別新增（`src/api/types.ts`）

```typescript
type LearningStyleType = 'L' | 'C' | 'A' | 'D' | 'O'  // 學習風格測驗結果
type RegistrationFlow = 'landing_page' | 'quiz' | 'action_maker'
type CreationMethod = 'self_created' | 'copied' | 'action_generator'

interface OnboardingStats {
  totalUsers: number
  badgeGrantedCount: number
  badgeGrantedRate: number
  avgDaysToComplete: number
  byRegistrationFlow: Record<RegistrationFlow, { total: number; badgeGranted: number }>
  byCreationMethod: Record<CreationMethod, number>
  completionByDay: Array<{ days: number; count: number }>
}

interface UserOnboardingDetail {
  userId: string
  registrationFlow: RegistrationFlow | null
  userSource: 'S1' | 'S2' | 'S3'
  creationMethod: CreationMethod | null
  taskStates: Record<string, 'done' | 'pending'>
  taskCompletedAt: Record<string, string>
  badgeGranted: boolean
  badgeGrantedAt: string | null
  daysToComplete: number | null
  completedAt: string | null
  learningStyle: {
    resultType: LearningStyleType | null
    completedAt: string | null
    attemptCount: number
  } | null
  persona: {
    answerCount: number
    isUnlocked: boolean
    lastAnsweredAt: string | null
  } | null
  emailSequence: Array<{
    emailType: OnboardingEmailType
    status: 'sent' | 'failed' | 'not_sent'
    sentAt: string | null
    openedAt: string | null
    openCount: number
  }>
  engagement: {
    practiceCount: number
    activePracticeCount: number
    maxCheckinStreak: number
    lastActiveAt: string | null
  }
}

interface QuizStats {
  totalUsers: number
  quizCompletedCount: number
  quizCompletedRate: number
  byRole: Record<LearningStyleType, { count: number; rate: number }>
  byRoleAndBadge: Record<LearningStyleType, { badgeGranted: number; total: number }>
  byRoleAndRegistrationFlow: Record<LearningStyleType, Record<RegistrationFlow, number>>
}

interface PersonaStats {
  totalUsers: number
  anyAnswerCount: number
  anyAnswerRate: number
  unlockedCount: number
  unlockedRate: number
  avgAnswerCount: number
  answerCountDistribution: Array<{ answerCount: number; userCount: number }>
  topQuestions: Array<{ questionId: number; prompt: string; answerCount: number }>
}

type OnboardingEmailType = 'L0' | 'A' | 'B' | 'C' | 'D' | 'E'

interface EmailOnboardingStats {
  byEmailType: Record<OnboardingEmailType, {
    sentCount: number
    openedCount: number
    openRate: number
    failedCount: number
  }>
  byUserSource: Record<'S1' | 'S2' | 'S3', {
    sentCount: number
    openedCount: number
    openRate: number
  }>
}

interface EngagementStats {
  practiceStats: {
    avgPracticeCount: number
    avgActivePracticeCount: number
    abandonmentRate: number
  }
  checkinStats: {
    avgMaxStreak: number
    usersWithStreak7Plus: number
    usersWithStreak30Plus: number
  }
  retentionByDay: Array<{ day: number; retentionRate: number }>
}
```

---

## 實作順序

### Phase 1：DB 與後端（daodao-server + daodao-storage）

1. `daodao-storage/schema/850_add_registration_flow.sql` — `user_onboarding.registration_flow`
2. `daodao-storage/schema/851_add_practice_creation_source.sql` — `practices.creation_source`
3. `daodao-storage/schema/852_add_task_completed_at.sql` — `user_onboarding.task_completed_at`
4. `onboarding.service.ts` — `updateTaskState()` 寫入 `task_completed_at`
5. `onboarding.service.ts` — `initUserOnboarding()` 接收 `registration_flow`
6. `practice.service.ts` — `create()` / `copy()` 設定 `creation_source`
7. 新增 admin route：`GET /api/v1/admin/onboarding/stats`
8. 新增 admin route：`GET /api/v1/admin/users/:id/onboarding`（含 learningStyle + persona 欄位）
9. 新增 admin route：`GET /api/v1/admin/quiz/stats`（學習風格測驗分布彙總）
10. 新增 admin route：`GET /api/v1/admin/persona/stats`（人物誌填寫狀況彙總，不需 migration）
11. 新增 admin route：`GET /api/v1/admin/email/onboarding-stats`（Email 序列開信率，不需 migration）
12. 新增 admin route：`GET /api/v1/admin/engagement/stats`（打卡 streak / 實踐放棄率，不需 migration）

### Phase 2：前端傳入（daodao-f2e）

1. 三個入口各自帶入 `registration_flow` 參數
2. Action Maker 建立實踐時帶入 `creation_source: 'action_generator'`

### Phase 3：Admin-UI 呈現（daodao-admin-ui）

1. `src/api/types.ts` — 新增 `LearningStyleType`、`OnboardingEmailType`、`OnboardingStats`、`UserOnboardingDetail`、`QuizStats`、`PersonaStats`、`EmailOnboardingStats`、`EngagementStats` 型別
2. `src/api/admin-community.ts` — 新增 `getOnboardingStats()`、`getUserOnboardingDetail()`、`getQuizStats()`、`getPersonaStats()`、`getEmailOnboardingStats()`、`getEngagementStats()`
3. `src/pages/OnboardingFlowsPage.tsx` — 新增統計分析區塊（8 個圖表/統計卡：A~H）
4. `src/pages/UserDetailPage.tsx` — 新增 onboarding 詳情 section（含學習風格、人物誌、email 序列、參與度）

---

## 相關檔案索引

### daodao-storage

| 檔案 | 說明 |
|------|------|
| `schema/840_create_onboarding_flow_tables.sql` | 最新已執行的 migration（參考編號） |
| `schema/850_add_registration_flow.sql` | 新增：`user_onboarding.registration_flow` |
| `schema/851_add_practice_creation_source.sql` | 新增：`practices.creation_source` |
| `schema/852_add_task_completed_at.sql` | 新增：`user_onboarding.task_completed_at` |

### daodao-server

| 檔案 | 說明 |
|------|------|
| `src/utils/onboarding-source.ts` | `deriveUserSource()` S1/S2/S3 衍生邏輯 |
| `src/services/onboarding.service.ts` | `initUserOnboarding()`、`updateTaskState()` |
| `src/services/practice.service.ts` | `create()`、`copy()` |
| `src/services/quiz.service.ts` | `saveResult()`、`getLatestResult()` |
| `src/services/persona.service.ts` | 人物誌 Q&A 邏輯（答題、跳過、共鳴、輪播） |
| `src/routes/onboarding.routes.ts` | Onboarding 路由 |
| `src/routes/quiz.routes.ts` | 學習風格測驗路由（POST `/api/v1/quiz`） |
| `src/routes/persona.routes.ts` | 人物誌路由（`/api/v1/persona/*`） |
| `src/services/email/onboarding-email.service.ts` | Onboarding email 序列邏輯 |
| `src/types/email/onboarding.types.ts` | Email 類型 L0/A/B/C/D/E、UserSource S1/S2/S3 |
| `prisma/schema.prisma`（`email_logs`） | 寄信紀錄（status、opened_at、open_count） |
| `prisma/schema.prisma` （`practice_checkins`） | 打卡紀錄（checkin_date、streak 計算來源） |
| `src/types/onboarding.types.ts` | Task 定義、任務順序 |
| `prisma/schema.prisma` L1038 | `quiz_results` model（result_type L/C/A/D/O） |

### daodao-f2e

| 檔案 | 說明 |
|------|------|
| `apps/product/.../onboarding-form.tsx` | Onboarding 主流程 |
| `apps/product/.../referral-section.tsx` | 問卷問題 |
| `src/constants/referral-source.ts` | referral_source 選項 |
| `packages/api/src/services/onboarding-flow.ts` | `submitOnboardingFlowResponse()` |
| `packages/features/quiz/src/types/index.ts` | `AnswerKeyType = "L"\|"C"\|"A"\|"D"\|"O"` |
| `packages/features/quiz/src/utils/store.ts` | 計分演算法（各維度 +1，最高者為結果） |

### daodao-admin-ui

| 檔案 | 說明 |
|------|------|
| `src/pages/OnboardingFlowsPage.tsx` | Onboarding 管理頁面（主要修改點） |
| `src/api/admin-community.ts` | Community 相關 API（新增函式） |
| `src/api/types.ts` | 型別定義（新增型別） |

---

## 注意事項

- **歷史資料**：`registration_flow` 和 `task_completed_at` 新增後，舊資料為 NULL/`{}`，統計需排除或標示為「未知」。
- **`user_source` 保留**：S1/S2/S3 邏輯不動，仍用於任務排序。
- **`creation_method` 保留**：user_onboarding 上的欄位繼續記錄 onboarding Task C，`practices.creation_source` 是新增的更細粒度追蹤。
- **學習風格取最新一次**：同一用戶可多次做測驗，admin 分析以最新 `quiz_results.completed_at` 為準（`DISTINCT ON (user_id) ORDER BY completed_at DESC`）。
- **未做測驗的用戶**：`quiz_results` 無對應資料，在 admin-ui 顯示為「未測驗」，不計入角色分布百分比分母，但計入測驗完成率分母。
- **人物誌 unlock 門檻**：`persona_answers` 答題數 ≥ 5 視為 unlocked，此邏輯已在 server 端實作，admin 計算時沿用相同標準。
- **Migration 順序**：850 → 851 → 852，各自獨立無相依；學習風格、人物誌、Email 序列、參與度分析均不需新增 migration（相關 table 已存在）。
- **Email 開信追蹤**：依賴 `email_logs.opened_at`，需確認 pixel tracking 在 production 正常運作；若 `opened_at IS NULL` 代表未開信或追蹤失效。
- **打卡 streak 計算**：streak 需從 `practice_checkins` 的 `checkin_date` 逐日比對，建議在 API 層計算而非前端，避免 N+1。
