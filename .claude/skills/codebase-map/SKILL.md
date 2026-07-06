---
name: codebase-map
description: daodao-admin-ui codebase 地圖——雙後端前綴規則、src 結構、API 層組織、部署載體。開工前先讀
---

# daodao-admin-ui Codebase 地圖

> 目錄結構有變動時必須同步更新本檔。最後校準：2026-07-06。

## 最重要的事實：這是雙後端 SPA

API 前綴決定打到哪個後端（proxy 定義在 `vite.config.ts`，dev 與 Docker preview 皆生效）：

| 前綴 | 後端 | dev proxy | Docker env |
|------|------|-----------|------------|
| `/api/v1/admin/*` | **daodao-ai-backend**（FastAPI） | localhost:8002 | `BACKEND_URL` |
| `/daodao-server/api/v1/*`（rewrite 去前綴） | **daodao-server**（Express） | localhost:4000 | `SERVER_BACKEND_URL` |

寫新 endpoint 前先確認 domain 歸屬：AI/LLM 管理（system-prompts、llm-models、query-logs、playground、quotas、notifications、email trigger-rules）走 ai-backend；其餘 admin 域（users、community、learning、trust、audit、events…）走 daodao-server。**前綴選錯會打到錯的後端**。

## src/ 結構

- `src/api/` — axios client（`client.ts`：`apiClient` timeout 30s、`slowApiClient` timeout 120s **專供 LLM/Playground**，誤用前者會逾時）；16 個 `admin-*.ts` domain 檔 + `admin.ts`（核心/auth）+ `types.ts`（千行集中型別，**手動維護，無 OpenAPI 自動同步**）。`admin-ai.ts`/`admin-server.ts` 是純 barrel。
- `src/hooks/` — 一域一檔的 React Query hooks（35 個）。
- `src/pages/` — 一頁一檔 `XxxPage.tsx`（約 49 個），多數 `React.lazy`。
- `src/App.tsx` — 集中式路由；`ProtectedRoute` → `AppShell` 巢狀。base path `/admin/`（`BrowserRouter basename` + vite `base`）。
- `src/auth/` — `AuthContext`（Google OAuth 經 server、角色白名單 admin/superadmin）、`ProtectedRoute`。
- `src/components/`（含 `ui/` 20 個 shadcn 元件、`layout/`）、`src/lib/`、`src/config.ts`（`VITE_SURVEY_PUBLIC_BASE`）。

## 新增功能的觸點

| 任務 | 動哪裡 |
|------|--------|
| 新增 admin 頁 | `src/pages/XxxPage.tsx` + `src/App.tsx` 加 lazy route + `Sidebar` 加入口 |
| 新增 API 呼叫 | 對應 domain 的 `src/api/admin-<domain>.ts` + `src/api/types.ts` 補型別 + `src/hooks/` 包 React Query hook |
| 新增 UI 元件 | 先看 `src/components/ui/` 有無 shadcn 元件；shadcn config 在 `components.json` |

## 慣例（與 daodao-f2e 的差異）

- **無 `@daodao/*` packages、非 monorepo、無 turbo**——f2e 的規範不適用這裡。
- HTTP 鐵律的本地版：一律用 `src/api/client.ts` 的 `apiClient`/`slowApiClient`，禁止裸 `fetch` 或另建 axios instance。
- 狀態：React Query（server state）+ AuthContext；無 Redux/Zustand。token 在 `localStorage.daodao_admin_token`；401/403 → 清 token → 導 `/admin/login`。
- Biome：single quote、no semicolons、2 space；禁 IIFE、禁巢狀三元、`<button>` 必帶 type。

## 品質與部署

- `pnpm lint`（biome check src）、`pnpm run typecheck`（tsc --noEmit）、`pnpm test`（vitest，jsdom；目前僅 3 個測試檔）、`pnpm build`（tsc && vite build）。
- Docker runtime **不是 nginx，是 `vite preview`** ——image 需保留 `node_modules` 與 `vite.config.ts`（preview proxy 讀 `BACKEND_URL`/`SERVER_BACKEND_URL`）。healthcheck 打 `http://localhost:3000/admin/`。

## 跨 repo

server/ai-backend 的 API contract 變更**不會自動反映**到 `src/api/types.ts`，要手動同步。詳見 `.claude/skills/system-map/SKILL.md`。
