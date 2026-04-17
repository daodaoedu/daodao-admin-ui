# 架構說明

## 整體架構

```
瀏覽器（/admin/*）
      │
      ▼
┌─────────────────────────────────────────┐
│           nginx container               │
│                                         │
│  /admin/*  → 靜態檔案（Vite 建置產物）   │
│  /api/*    → proxy → backend-dev:8000   │
│  /health   → 200 ok                     │
└─────────────────────────────────────────┘
      │  /api/*
      ▼
┌─────────────────────────────────────────┐
│        daodao-ai-backend                │
│        FastAPI（port 8000）             │
│        /api/v1/admin/*                  │
└─────────────────────────────────────────┘
      │
      ▼
  PostgreSQL / Redis / ClickHouse
```

admin-ui 為**純靜態前端**，所有 API 呼叫皆透過同 origin（nginx reverse proxy）轉送至後端，不需 CORS 設定。

---

## 目錄結構

```
src/
├── api/
│   ├── client.ts        # Axios instance，JWT interceptor，401/403 自動登出
│   ├── admin.ts         # 所有 admin API 函式（ping、dashboard、prompts…）
│   └── types.ts         # 所有 API 請求 / 回應 TypeScript 型別
│
├── auth/
│   ├── AuthContext.tsx  # JWT 狀態管理（isAuthenticated、adminInfo、login、logout）
│   └── ProtectedRoute.tsx  # 未登入 → 導向 /login
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx # 外框：Sidebar + main 捲動區（p-6）
│   │   └── Sidebar.tsx  # 導覽列：品牌標題 + nav items + 登出
│   └── ui/
│       ├── button.tsx   # Button（variant: primary/secondary/destructive/ghost × size: default/sm/xs）
│       ├── input.tsx    # Input、Textarea
│       └── badge.tsx    # Badge（variant: default/primary/success/error/warning）
│
├── lib/
│   └── utils.ts         # cn()（clsx + tailwind-merge）
│
└── pages/
    ├── LoginPage.tsx        # JWT token 輸入 → 呼叫 ping 驗證
    ├── DashboardPage.tsx    # 費用 / 查詢 KPI + Recharts 圖表
    ├── QueryLogsPage.tsx    # AI 呼叫紀錄表格 + 篩選 + 詳情面板
    ├── SystemPromptsPage.tsx # Prompt CRUD（建立 / 編輯 / 刪除）
    ├── ModelManagementPage.tsx # LLM 模型唯讀資訊（後端匯入）
    ├── UserQuotasPage.tsx   # 使用者 token 配額設定（modal）
    └── PlaygroundPage.tsx   # 三欄式 AI 對話測試（左：設定，中：對話，右：統計）
```

---

## 資料流

### 認證流程

```
LoginPage
  └─ 使用者貼入 JWT
       └─ localStorage.setItem('daodao_admin_token', token)
            └─ ping() → GET /api/v1/admin/ping
                 ├─ 成功 → setIsAuthenticated(true)，navigate('/')
                 └─ 失敗 → localStorage.removeItem，顯示錯誤
```

每次 API 請求，Axios request interceptor 自動讀取 localStorage 附加 `Authorization: Bearer <token>`。

### 資料請求模式

所有頁面使用 **TanStack Query**：

```typescript
// 查詢
const { data, isLoading } = useQuery({
  queryKey: ['system-prompts'],
  queryFn: () => listSystemPrompts().then((r) => r.data.data),
})

// 寫入（建立 / 更新 / 刪除）
const mut = useMutation({
  mutationFn: createSystemPrompt,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['system-prompts'] }),
})
```

API 回應包裝格式（`ApiResponse<T>`）：

```typescript
interface ApiResponse<T> {
  success: boolean
  data: T
  error: null | { code: string; message: string }
  pagination: null | OffsetPagination
}
```

---

## 樣式系統

### 色彩 Tokens（OKLCH）

對齊 `daodao-f2e/packages/ui/src/styles/globals.css`：

| Token | 值 | 用途 |
|-------|---|------|
| `--primary` / `--logo-cyan` | `oklch(0.711 0.12 190.6)` | 主色、active 狀態、按鈕 |
| `--primary-lightest` | `oklch(0.953 0.024 196.8)` | accent hover |
| `--logo-orange` | `oklch(0.786 0.17 68.2)` | 警示、tips |
| `--success` | `oklch(0.763 0.172 132.6)` | 成功狀態、圖表線 |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 錯誤、刪除 |
| `--tips` | `oklch(0.766 0.169 60)` | 進度條警告（80%+ 使用量） |

### 字型

```css
font-family: "Noto Sans TC", system-ui, sans-serif;
```

由 Google Fonts CDN 載入，涵蓋繁體中文字符集。

### 共用 UI 元件

`src/components/ui/` 提供三個基本元件，避免在各頁面重複樣式字串：

```tsx
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Button variants
<Button>主要動作</Button>
<Button variant="secondary">取消</Button>
<Button variant="destructive">刪除</Button>
<Button variant="ghost">ghost</Button>

// Button sizes
<Button size="default">預設</Button>
<Button size="sm">小</Button>
<Button size="xs">超小（表格用）</Button>

// Badge variants
<Badge variant="primary">backend</Badge>
<Badge variant="success">active</Badge>
<Badge variant="error">failed</Badge>
```

所有元件均透過 `cn()`（`src/lib/utils.ts`）合併 className，支援 `className` prop 覆寫個別樣式。

---

## API 端點對照

| 頁面 | 端點 |
|------|------|
| Auth | `GET /api/v1/admin/ping` |
| Dashboard | `GET /api/v1/admin/dashboard/stats` |
| Query Logs | `GET /api/v1/admin/query-logs` |
| System Prompts | `GET/POST/PUT/DELETE /api/v1/admin/system-prompts` |
| LLM Models | `GET/POST/PUT/DELETE /api/v1/admin/llm-models` |
| User Quotas | `GET /api/v1/admin/users` · `GET/PUT /api/v1/admin/users/:id/quota` |
| Playground | `POST /api/v1/admin/playground/chat` |

---

## 建置產物

Vite 建置後輸出至 `dist/`，結構如下：

```
dist/
├── index.html          # 入口（SPA shell）
└── assets/
    ├── index-[hash].js   # vendor chunk（react / router）
    ├── charts-[hash].js  # recharts
    ├── query-[hash].js   # tanstack query
    └── index-[hash].css
```

所有 JS/CSS 含 content hash，nginx 設定 1 年永久快取（`Cache-Control: public, immutable`）。
