# 今日新進 — Dashboard 註冊追蹤區塊

## 概述

在 DashboardPage 最頂部新增「今日新進」區塊，讓管理者一進儀表板就能看到：今天有多少人註冊、是誰、他們目前做了什麼。

## 需求

1. 顯示今日註冊人數（StatCard），含 vs 昨天的變化百分比
2. 列出今日新使用者清單（頭像、名稱、email、註冊來源、最後活動時間）
3. 每個使用者可展開查看最近活動時間軸（activity-timeline，最近 5 筆）
4. 點名字可跳到 UserDetailPage
5. StatCard 可點擊跳轉到 UserManagement 頁面（帶 createdFrom=today 篩選）

## 後端 API 變更

### `GET /daodao-server/api/v1/admin/users` 新增參數

| 參數 | 型別 | 說明 |
|------|------|------|
| `createdFrom` | `string` (YYYY-MM-DD) | 篩選 createdAt >= 當天 00:00:00 |
| `createdTo` | `string` (YYYY-MM-DD) | 篩選 createdAt <= 當天 23:59:59 |

前端查詢今日註冊：`createdFrom=2026-07-05&createdTo=2026-07-05&sortBy=createdAt&sortOrder=desc`

昨日數量（用於算變化百分比）：`createdFrom=2026-07-04&createdTo=2026-07-04&limit=1`（只需 pagination.total）

## 前端變更

### 1. `src/api/admin.ts` — 型別更新

`listAdminUsers` 的 params 新增 `createdFrom?: string` 和 `createdTo?: string`。

### 2. `src/hooks/useTodayRegistrations.ts` — 新 hook

```ts
useTodayRegistrations()
```

- 呼叫 `listAdminUsers({ createdFrom: today, createdTo: today, sortBy: 'createdAt', sortOrder: 'desc', limit: 50 })` 取得今日清單
- 呼叫 `listAdminUsers({ createdFrom: yesterday, createdTo: yesterday, limit: 1 })` 取得昨日總數（從 pagination.total）
- 回傳 `{ users, todayCount, yesterdayCount, changePercent, isLoading }`

### 3. `src/hooks/useActivityTimeline.ts` — 新 hook（或複用既有）

```ts
useActivityTimeline(userId: string, limit?: number)
```

- 呼叫 `getActivityTimeline(userId, { limit: 5 })`
- 按需載入（使用者展開某列時才 fetch）

### 4. `src/pages/DashboardPage.tsx` — 新增區塊

在 Header 和「用戶活躍」之間插入「今日新進」section：

```
┌─ 今日新進 ──────────────────────────────────────┐
│ [StatCard: 今日註冊 3 人  ▲50% vs 昨天]         │
│                                                  │
│ ┌──────────┬──────────┬────────┬──────┬────────┐ │
│ │ 頭像+名稱│ Email    │ 註冊來源│最後活│ 展開   │ │
│ ├──────────┼──────────┼────────┼──────┼────────┤ │
│ │ 王小明   │ a@b.com  │ 測驗   │ 2hr  │   ▼    │ │
│ │  └─ 活動時間軸：                              │ │
│ │     14:30 完成測驗                             │ │
│ │     14:25 首次登入                             │ │
│ │     14:20 註冊                                 │ │
│ ├──────────┼──────────┼────────┼──────┼────────┤ │
│ │ 李小花   │ c@d.com  │ 落地頁 │ 5hr  │   ▶    │ │
│ └──────────┴──────────┴────────┴──────┴────────┘ │
│                                                  │
│ (0 人時顯示空狀態：「今天還沒有新使用者註冊」)    │
└──────────────────────────────────────────────────┘
```

### UI 細節

- StatCard icon: `UserPlus`（lucide-react）
- 表格欄位：頭像+名稱（Link to `/users/:id`）、Email、註冊來源、最後活動（relative time）、展開箭頭
- 展開列顯示 activity-timeline：type icon + description + timestamp
- 0 人時顯示友善的空狀態文案
- 表格最多顯示 50 人（不分頁，dashboard 是概覽）
- StatCard 點擊：navigate to `/user-management?sortBy=createdAt_desc&datePreset=today`

### 5. `src/pages/UserManagementPage.tsx` — 支援 createdFrom/createdTo 篩選

- 日期篩選（DATE_PRESET_OPTIONS）改為作用於 `createdFrom`/`createdTo` 而非 `lastLoginFrom`/`lastLoginTo`
- 或新增獨立的「註冊日期」篩選器
- 支援從 URL query params 讀取初始篩選值（讓 Dashboard 跳轉帶參數能生效）

## 不做的事

- 不做即時推播 / WebSocket 通知
- 不做跨天歷史趨勢圖（已有 UserAnalyticsPage 的 signupTrend）
- 不做註冊漏斗分析（已有 Onboarding 頁面）

## 依賴

- 後端需先實作 `createdFrom` / `createdTo` 參數支援
- 既有 `getActivityTimeline` API 已可用，無需後端變更
