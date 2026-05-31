# daodao-admin-ui × daodao-server 架構說明

說明 `daodao-admin-ui`（前端 SPA）如何與 `daodao-server`（Express.js 後端）協作。

---

## 整體架構

```
瀏覽器（/admin/*）
      │
      ▼
┌──────────────────────────────────────────────┐
│               nginx / Vite dev proxy         │
│                                              │
│  /admin/*            → 靜態檔案 (Vite build) │
│  /daodao-server/*    → proxy → daodao-server │
└──────────────────────────────────────────────┘
      │  /daodao-server/*
      ▼
┌──────────────────────────────────────────────┐
│            daodao-server                     │
│            Express.js（port 4000）           │
│            /api/v1/admin/*                   │
│            /api/v1/auth/*                    │
└──────────────────────────────────────────────┘
      │
      ▼
  PostgreSQL + Redis（BullMQ / Session / Cache）
```

admin-ui 為**純靜態前端 SPA**，所有 API 呼叫皆透過 `/daodao-server/` 前綴轉送至後端。
API client 使用相對路徑 `baseURL: '/'`，token 存 `localStorage`，Cookie 帶 `withCredentials: true`。

---

## 認證機制

### Token 儲存

| 位置 | Key | 用途 |
|------|-----|------|
| `localStorage` | `daodao_admin_token` | JWT Bearer Token，由 client.ts request interceptor 自動注入 |
| HttpOnly Cookie | `auth_token` | Server 設定（OAuth 流程），`withCredentials: true` 帶入 |

### 登入流程

```
1. 前端 → POST /daodao-server/api/v1/auth/me（驗證既有 token）
         或 Google OAuth:
         → 導向 /daodao-server/api/v1/auth/google?redirectUrl=/dashboard&source=admin
         → Google OAuth 回調 → /daodao-server/api/v1/auth/google/callback
         → Server 設 auth_token cookie，redirect 回 /auth/callback

2. AuthContext 在 /auth/callback 讀取 token → 存入 localStorage
3. 後續所有 API request 透過 axios interceptor 帶 Authorization: Bearer <token>
4. 401 / 403 → 自動清除 token → redirect /login
```

### 角色驗證

前端 `AuthContext.tsx` 取得 `/api/v1/auth/me` 回應後，
驗證 `roles` 陣列包含以下任一值才允許進入後台：

```
['admin', 'superadmin', 'Admin', 'SuperAdmin']
```

後端 `daodao-server` 支援六個角色層級：

| 角色 | Level | 說明 |
|------|-------|------|
| super_admin | 5 | 所有權限 |
| admin | 4 | 大部分管理權限 |
| moderator | 3 | 內容審核 |
| editor | 2 | 建立 / 編輯內容 |
| user | 1 | 一般用戶 |
| guest | 0 | 唯讀 |

---

## API 呼叫規範

### HTTP Client（`src/api/client.ts`）

```typescript
// 標準呼叫（30s timeout）
import apiClient from '@/api/client'

// 慢速呼叫—LLM / 大型資料（120s timeout）
import { slowApiClient } from '@/api/client'
```

兩個 client 均已內建：
- Request interceptor：從 `localStorage['daodao_admin_token']` 讀取 token → `Authorization: Bearer`
- Response interceptor：401 / 403 → 清除 token → redirect `/login`
- `withCredentials: true`（帶 Cookie）

### 標準 API 回應格式

所有 admin API 回應皆包裝為 `ApiResponse<T>`（`src/api/types.ts`）：

```typescript
interface ApiResponse<T> {
  success: boolean
  data: T
  error: null | { code: string; message: string }
  pagination: null | OffsetPagination | CursorPagination | PagePagination
  cacheHit?: boolean
  processingTime?: number
  timestamp?: string
  requestId?: string
}
```

分頁型別：

| 型別 | 使用場景 | 欄位 |
|------|----------|------|
| `OffsetPagination` | 大多數列表 | total_count, limit, offset, has_next |
| `CursorPagination` | 無限捲動 | hasMore, nextCursor, count, limit |
| `PagePagination` | 頁碼顯示 | currentPage, totalPages, totalItems |

---

## 模組對應：前端 API 檔 → 後端 Route

| 前端 API 模組 | 後端 Route 檔 | 主要端點前綴 |
|--------------|--------------|------------|
| `admin.ts` | `admin.routes.ts` | `/api/v1/admin` |
| `admin-users.ts` | `admin-user.controller.ts` | `/api/v1/admin/users` |
| `admin-system.ts` | `admin-system.controller.ts` | `/api/v1/admin/system` |
| `admin-audit.ts` | `admin-audit.controller.ts` | `/api/v1/admin/audit-logs` |
| `admin-communication.ts` | `admin-notification.controller.ts` | `/api/v1/admin/notifications` |
| `admin-trust.ts` | `admin-trust.controller.ts` | `/api/v1/admin/trust` |
| `admin-trust.ts` (automod) | `admin-automod.controller.ts` | `/api/v1/admin/automod` |
| `admin-learning.ts` | `admin-learning.controller.ts` | `/api/v1/admin/learning` |
| `admin-gamification.ts` | `admin-gamification.controller.ts` | `/api/v1/admin/gamification` |
| `admin-community.ts` | `admin-community.controller.ts` | `/api/v1/admin/community` |
| `admin-events.ts` | `admin-events.controller.ts` | `/api/v1/admin/events` |
| `admin-roadmap.ts` | `admin-roadmap.controller.ts` | `/api/v1/admin/roadmap` |
| `admin-reports.ts` | `admin-reports.controller.ts` | `/api/v1/admin/reports` |
| `admin-support.ts` | `admin-feedback.controller.ts` | `/api/v1/admin/feedback` |
| `admin-survey.ts` | `admin-survey.controller.ts` | `/api/v1/surveys` |
| `admin-content.ts` | （各 resource/practice routes）| `/api/v1/admin` |
| `admin-ai-assistant.ts` | `admin.controller.ts`（AI 部分）| `/api/v1/admin` |

---

## 前端頁面 → API 模組對應

| 功能區 | 頁面（`src/pages/`）| 主要 API 模組 |
|--------|-------------------|--------------|
| **儀表板** | DashboardPage | `admin.ts` |
| **用戶管理** | UserManagementPage, UserDetailPage, UserAnalyticsPage, UserTagsPage, UserQuotasPage, RolesPermissionsPage | `admin.ts`, `admin-users.ts` |
| **AI 服務** | QueryLogsPage, SystemPromptsPage, AIServiceConfigsPage, ModelManagementPage, PlaygroundPage | `admin.ts` |
| **內容** | PracticesPage, ContentPerformancePage | `admin.ts`, `admin-content.ts` |
| **溝通** | NotificationsPage, TriggeredEmailsPage, EmailManagementPage | `admin-communication.ts`, `admin-system.ts` |
| **報表** | ScheduledReportsPage, CustomReportsPage, AnomalyAlertsPage | `admin-reports.ts` |
| **支援** | FeedbackPage, FAQManagementPage | `admin-support.ts` |
| **系統** | AuditLogPage, SystemMonitorPage | `admin-audit.ts`, `admin-system.ts` |
| **信任 & 審核** | TrustLevelsPage, AutoModPage | `admin-trust.ts` |
| **學習** | LearningProgressPage, DripContentPage, QuizzesPage, CertificatesPage, LearningPathsPage | `admin-learning.ts` |
| **遊戲化** | BadgesPage, ChallengesPage, LeaderboardsPage | `admin-gamification.ts` |
| **社群** | OnboardingFlowsPage, MemberDirectoryPage, AIAssistantPage | `admin-community.ts`, `admin-ai-assistant.ts` |
| **活動** | EventsPage | `admin-events.ts` |
| **許願池** | WishInboxPage, RoadmapItemsPage, RoadmapReportsPage | `admin-roadmap.ts` |
| **問卷** | SurveyManagementPage | `admin-survey.ts` |

---

## 目錄結構速覽

### daodao-admin-ui（前端）

```
src/
├── api/
│   ├── client.ts          # axios instance（JWT 注入、401/403 自動登出）
│   ├── types.ts           # 所有 API TypeScript 型別（78 exports）
│   ├── admin.ts           # 核心 admin 端點（Auth、Dashboard、AI、Users…）
│   ├── admin-*.ts         # 各功能領域 API 模組（共 15 個）
│   └── admin-server.ts    # re-export（向後相容）
├── auth/
│   ├── AuthContext.tsx    # JWT 狀態、login / logout、角色驗證
│   └── ProtectedRoute.tsx # 未登入 redirect /login
├── components/
│   ├── layout/            # AppShell、Header、Sidebar
│   └── ui/                # Radix UI 基礎元件
├── hooks/                 # 32 個 custom hooks（各自封裝 API + React Query）
├── pages/                 # 46 個頁面元件（一頁一檔）
├── App.tsx               # 路由定義（React Router v6）
└── main.tsx              # 進入點
```

### daodao-server（後端）

```
src/
├── server.ts              # 進入點（Express app + BullMQ queues）
├── app.ts                 # 路由註冊
├── routes/                # 36 個路由檔
├── controllers/           # 56 個 controllers（含 18 個 admin controllers）
├── services/              # 76 個 services
│   ├── admin/             # Admin 專屬 services
│   ├── auth/              # Auth、JWT、OAuth
│   ├── email/             # Email 發送（17 個 service 檔）
│   └── database/          # Prisma、Redis
├── middleware/            # 15+ middleware（JWT、Roles、Permissions、Validation…）
├── validators/            # 55+ Zod validators
├── queues/                # 8 個 BullMQ job queues
├── types/                 # TypeScript 型別定義
└── prisma/                # Prisma schema（93 個資料模型）
```

---

## 環境設定

### daodao-admin-ui（`.env.dev.sample`）

```
VITE_API_BASE_URL=/daodao-server    # proxy 前綴
VITE_APP_ENV=development
```

### daodao-server（`.env` 關鍵設定）

```
PORT=4000
NODE_ENV=local|dev|test|prod
JWT_SECRET=<hex string>
JWT_EXPIRATION=6h
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3001
ADMIN_FRONTEND_URL=http://localhost:5173
COOKIE_DOMAIN=<deployed domain>
R2_PUBLIC_URL=https://image.daoedu.tw
```

---

## 後端非同步基礎設施

後端透過 **BullMQ（Redis-based）** 處理非同步工作，前端無需感知，但影響資料可見時機：

| Queue | 觸發時機 | 週期 |
|-------|----------|------|
| Practice Email Queue | 練習提醒 | 每日排程 |
| Practice Status Queue | 過期練習自動完成 | 每小時 |
| Notification In-App Queue | 即時通知 | 即時 |
| Notification Email Queue | Email 通知 | 即時 |
| Notification Weekly Queue | 每週摘要 | 每週 |
| Social Notification Queue | 追蹤 / 連結 fan-out | 即時 |
| Onboarding Email Queue | 入門 email 序列 | 觸發式 |
| Generic Email Queue | 通用 email（含 retry） | 觸發式 |

---

## 新增 Admin 功能的標準流程

1. **後端**：在 `src/routes/admin-*.routes.ts` 新增路由，實作 controller + service，加上 `authenticateJWT + requireAdmin()` middleware
2. **型別**：在 `src/api/types.ts` 新增對應的 TypeScript 介面
3. **API 函式**：在 `src/api/admin-*.ts` 對應模組新增呼叫函式（透過 `apiClient`）
4. **Hook**：在 `src/hooks/use*.ts` 封裝成 custom hook（搭配 React Query）
5. **頁面**：在 `src/pages/` 新增 `XxxPage.tsx`
6. **路由**：在 `src/App.tsx` 的 `<ProtectedRoute>` 內新增 `<Route>`
7. **側邊欄**：在 `src/components/layout/Sidebar.tsx` 新增導覽項目
