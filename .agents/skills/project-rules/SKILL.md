---
name: project-rules
description: daodao-admin-ui 專案開發規範，涵蓋技術棧、API 模式、命名慣例、程式碼風格
---

# daodao-admin-ui 專案規範

## 專案概述

島島 AI 後台管理介面，獨立 SPA（非 monorepo），部署路徑 `/admin/`。

## 技術棧

- **Runtime**: Node.js 20+
- **Framework**: React 18 + TypeScript 5
- **Build**: Vite 5
- **Routing**: react-router-dom v6
- **State/Data**: @tanstack/react-query v5
- **HTTP Client**: axios（統一透過 `src/api/client.ts` 的 `apiClient`）
- **Form**: react-hook-form + zod
- **UI**: Radix UI primitives + Tailwind CSS 3 + lucide-react icons
- **Utility**: clsx + tailwind-merge + class-variance-authority
- **Date**: date-fns v3
- **Charts**: recharts
- **Linter/Formatter**: Biome 2
- **Package Manager**: pnpm
- **語言**: 繁體中文互動，註解用英文或繁體中文

## 目錄結構

```
src/
├── api/            # API client、型別定義、各 endpoint 函式
│   ├── client.ts   # axios instance（JWT 注入、403 自動登出）
│   ├── admin.ts    # 所有 admin API 函式
│   └── types.ts    # API 型別定義
├── auth/           # AuthContext、ProtectedRoute
├── components/     # 共用元件
│   ├── layout/     # 版面元件（AppShell、Sidebar）
│   └── ui/         # 通用 UI 元件（Button、Input、Dialog 等）
├── hooks/          # 共用 custom hooks
├── lib/            # 工具函式（cn、format 等）
├── types/          # 共用型別（非 API 專屬）
├── constants/      # 常數定義
├── pages/          # 頁面元件（一頁一檔）
├── index.css       # Tailwind base + CSS variables
├── App.tsx         # Root component + routes
└── main.tsx        # App entry
```

## API 規範

### HTTP Client

所有 API 呼叫必須透過 `src/api/client.ts` 的 `apiClient`（axios instance），禁止直接用 `fetch` 或另建 axios instance。

```typescript
import apiClient from '@/api/client'
```

`apiClient` 已內建：
- JWT token 自動注入（從 localStorage 讀取）
- 403 自動登出並跳轉 `/admin/login`

### API 函式風格

所有 endpoint 函式集中在 `src/api/admin.ts`，格式：

```typescript
export const listSomething = (params?: { limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<Something[]>>('/api/v1/admin/something', { params })

export const createSomething = (data: SomethingCreate) =>
  apiClient.post<ApiResponse<Something>>('/api/v1/admin/something', data)
```

### API 回應格式

後端統一回應 `ApiResponse<T>`（定義在 `src/api/types.ts`）：

```typescript
interface ApiResponse<T> {
  success: boolean
  data: T
  error: null | { code: string; message: string }
  pagination: null | OffsetPagination
}
```

### 錯誤處理

axios 會對非 2xx 拋異常，用 try/catch 處理：

```typescript
try {
  const res = await createSomething(data)
  // 成功邏輯
} catch (err) {
  // 錯誤處理：顯示 toast、重置 loading 狀態
}
```

搭配 react-query 時，善用 `onError` callback。

## 型別定義

### 所有 API 型別集中在 `src/api/types.ts`

檔案結構順序：API 回應外殼 → 各 domain 型別

### 命名慣例

- **Interface**: PascalCase，無前綴（`SystemPrompt`、`LLMModel`）
- **Create/Update DTO**: 加 `Create` / `Update` 後綴（`SystemPromptCreate`）
- **Component Props**: PascalCase + `Props` 後綴（`SidebarProps`）
- **常數**: UPPER_SNAKE_CASE（`TOKEN_KEY`）

## 元件規範

### 頁面元件

每頁一個檔案在 `src/pages/`，命名 `XxxPage.tsx`。

### 路由

集中在 `src/App.tsx`，使用 react-router-dom v6 的 `<Routes>` + `<Route>`。

### Auth

- `AuthProvider` 包在最外層，提供 `useAuth()` hook
- 需登入的頁面用 `<ProtectedRoute>` 包裹
- Token 存在 localStorage，key 為 `TOKEN_KEY`（定義在 `src/api/client.ts`）

### UI 元件

使用 Radix UI primitives + Tailwind CSS。Icon 統一用 `lucide-react`。

## 程式碼風格

### Biome 規則

- Single quote、no semicolons
- 2 space indent、100 line width
- 執行 `pnpm run lint` 檢查、`pnpm run check:fix` 自動修復

### 禁止事項

- 禁止 IIFE `(() => { ... })()`
- 禁止嵌套三元運算子
- 禁止直接 `fetch` 或另建 axios instance
- `<button>` 必須加 `type` 屬性（`type="button"` 或 `type="submit"`）
- `<label>` 必須用 `htmlFor` 關聯對應 input

### Path Alias

使用 `@/` 指向 `src/`：

```typescript
import { useAuth } from '@/auth/AuthContext'
import { listUsers } from '@/api/admin'
```

## 品質檢查指令

- `pnpm run lint` — Biome check
- `pnpm run lint:fix` — Biome check + auto fix
- `pnpm run format` — Biome format
- `pnpm run check:fix` — Biome check + fix（含 unsafe fixes）
- `pnpm run build` — TypeScript 類型檢查 + Vite build
