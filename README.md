# daodao-admin-ui

DaoDao 後台管理介面，供管理員操作 LLM 模型設定、System Prompt、AI 查詢日誌、使用者 Token 配額，以及測試 AI 對話的 Playground。

## 相關 Repo

| Repo | 說明 |
|------|------|
| [daodao-ai-backend](../daodao-ai-backend) | 後端 FastAPI，提供本 UI 所有 `/api/v1/admin/*` 端點 |
| [daodao-f2e](../daodao-f2e) | 終端用戶前端（品牌設計來源，UI tokens 對齊此 repo） |
| [daodao-storage](../daodao-storage) | 資料庫層（PostgreSQL、Qdrant、ClickHouse） |

---

## 快速開始

### 本地開發（Vite dev server）

```bash
# 1. 安裝依賴
pnpm install

# 2. 確保 daodao-ai-backend 已在 localhost:8002 執行
#    （vite.config.ts 會將 /api 反向代理至 http://localhost:8002）

# 3. 啟動開發伺服器
pnpm dev
# → http://localhost:5173/admin/
```

### Docker（連接後端容器）

```bash
# 複製環境設定
cp .env.dev.sample .env.dev

# 啟動（含自動建置）
make up-dev
# → nginx 服務於容器 port 80
# → /api/* 自動代理至 backend-dev:8000
```

詳細部署說明見 [docs/deployment.md](docs/deployment.md)。

---

## 功能頁面

| 路由 | 頁面 | 說明 |
|------|------|------|
| `/admin/dashboard` | Dashboard | 近 7 日費用、查詢次數、Token 用量統計圖表 |
| `/admin/query-logs` | AI 查詢日誌 | 查詢 AI 呼叫紀錄，支援 backend / context / status / 日期篩選 |
| `/admin/system-prompts` | System Prompts | 建立、編輯、刪除 System Prompt，管理版本與啟用狀態 |
| `/admin/models` | 模型管理 | 查看已匯入的 LLM 模型清單與費率資訊 |
| `/admin/user-quotas` | Token 配額 | 設定各使用者的月 / 日 Token 上限 |
| `/admin/playground` | Playground | 選擇模型與 System Prompt，即時測試 AI 對話 |

---

## 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | React 18 + TypeScript |
| 建置工具 | Vite 5 |
| 路由 | React Router v6 |
| 資料請求 | TanStack Query v5 |
| HTTP 客戶端 | Axios（JWT 自動注入、401/403 自動登出） |
| 樣式 | Tailwind CSS v3 + OKLCH 品牌色 tokens |
| UI 原語 | Radix UI |
| 圖表 | Recharts |
| 表單驗證 | React Hook Form + Zod |
| 程式碼品質 | Biome 2.4.9 |

---

## 常用指令

```bash
make dev          # 啟動 Vite dev server
make build        # 建置靜態產物
make check        # lint + typecheck
make format       # 自動修正 lint/format 問題

make up-dev       # 啟動 Docker dev 環境
make down-dev     # 停止 Docker dev 環境
make rebuild-dev  # 強制重建 dev image

make health-dev   # 確認 dev 容器健康狀態
make help         # 列出所有指令
```

---

## 專案結構

```
daodao-admin-ui/
├── src/
│   ├── api/               # HTTP 客戶端 + 所有 admin API 呼叫 + TypeScript 型別
│   ├── auth/              # JWT 驗證 Context + ProtectedRoute
│   ├── components/
│   │   └── layout/        # AppShell（外框）、Sidebar（導覽列）
│   └── pages/             # 各功能頁面元件
├── .github/workflows/
│   ├── ci.yml             # PR 觸發：pnpm lint + tsc --noEmit
│   ├── cd.yml             # push main/dev：SSH 部署至 Linode
│   └── code-review.yml    # AI Code Review（GitHub Models）
├── Dockerfile             # 兩階段建置：Node 20 build → nginx:alpine serve
├── nginx.conf.template    # nginx 設定（API proxy + SPA fallback）
├── docker-entrypoint.sh   # 啟動時注入 BACKEND_HOST / BACKEND_PORT
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Makefile
└── docs/
    ├── arch.md            # 架構說明
    └── deployment.md      # 部署指南
```

---

## 認證方式

登入頁（`/admin/login`）直接貼入 JWT Token。Token 儲存在 `localStorage`，由 Axios interceptor 自動附加至所有請求的 `Authorization: Bearer` header。收到 401/403 時自動清除 token 並跳回登入頁。

---

## 品牌風格

UI 色彩對齊 `daodao-f2e/packages/ui` 的 OKLCH 設計 tokens：

- Primary（品牌青色）：`oklch(0.711 0.12 190.6)`
- 字型：Noto Sans TC
- 詳見 `src/index.css` 與 `tailwind.config.js`
