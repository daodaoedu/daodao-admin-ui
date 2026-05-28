# DaoDao Admin UI

統一管理後台 — 島島阿學平台的營運管理中心。

## 功能模組

### 總覽
- **Dashboard** — 用戶 KPI + AI 成本摘要 + 系統健康

### 用戶管理
- **用戶管理** — 搜尋、篩選、角色指派、標籤篩選、匯出
- **用戶詳情** — 個人資料、活動時間軸、AI 用量、登入歷史
- **用戶分析** — DAU/WAU/MAU、漏斗分析、Cohort 留存
- **用戶標籤** — 手動/自動標籤、分群規則
- **角色權限** — 角色 CRUD、權限指派
- **Token 配額** — 用戶 token 額度管理

### AI 服務
- **查詢日誌** — AI 查詢記錄篩選、匯出
- **模型管理** — LLM 模型設定
- **System Prompts** — Prompt 版本管理
- **服務設定** — AI 服務組合設定
- **Playground** — 即時測試

### 內容管理
- **主題實踐** — 實踐管理、搜尋、篩選
- **內容績效** — 閱讀深度、停留時間、策展

### 溝通
- **站內通知** — 推送通知、排程、已讀統計
- **觸發式郵件** — 自動郵件規則、模板、成效追蹤

### 報表
- **排程報表** — 週/月 KPI 自動寄送
- **自訂報表** — 拖拉欄位組合查詢
- **異常警報** — 閾值監控、自動通知

### 支援
- **意見回饋** — 用戶回饋收件匣
- **FAQ 管理** — 前台 FAQ 編輯

### 系統
- **系統監控** — CPU/記憶體/DB/Redis
- **郵件管理** — 發送統計、SMTP 狀態
- **審計日誌** — 操作紀錄、合規鎖定

### 信任與審核
- **信任等級** — Lv0-Lv3 自動升降級
- **AutoMod** — 關鍵字過濾、檢舉佇列

### 學習
- **課程進度** — 完成率、卡關點分析
- **內容滴灌** — 時間閘門排程
- **測驗管理** — 題目、成績統計
- **證書管理** — 模板、發放、驗證
- **學習路徑** — 課程序列、先修條件

### 遊戲化
- **徽章** — 自動/手動頒發
- **挑戰** — 限時活動、進度追蹤
- **排行榜** — 活動加權排名

### 社群
- **Onboarding** — 新手引導問卷
- **會員名錄** — 自訂 Profile 欄位
- **AI 助手** — 知識庫 RAG 回答

### 活動
- **活動管理** — RSVP、簽到、週期模板

## 技術棧

- **Framework**: React 18 + TypeScript + Vite 5
- **Routing**: react-router-dom 6 (SPA)
- **Data Fetching**: @tanstack/react-query 5 + axios
- **UI**: Radix UI + Tailwind CSS 3 + tailwind-merge
- **Charts**: Recharts
- **Export**: xlsx (SheetJS)
- **Rich Text**: Tiptap
- **Drag & Drop**: @dnd-kit
- **Auth**: JWT token + AuthContext
- **Lint**: Biome

## 開發

```bash
pnpm install
pnpm run dev        # http://localhost:5173/admin
pnpm run build      # Production build
pnpm run test       # Vitest
pnpm run lint       # Biome lint
pnpm run typecheck  # TypeScript check
```

## 架構

```
src/
├── api/              # API client + 13 domain files
├── auth/             # AuthContext + ProtectedRoute
├── components/       # Shared components (ExportButton, StatCard, layout/)
├── hooks/            # Custom React Query hooks
├── lib/              # Utilities (cn)
├── pages/            # 39 page components (React.lazy loaded)
└── test/             # Test setup
```

## 相關 Repo

- [daodao-server](https://github.com/daodaoedu/daodao-server) — Backend API (157 admin endpoints)
- [daodao-f2e](https://github.com/daodaoedu/daodao-f2e) — Frontend (admin routes removed)
- [daodao-storage](https://github.com/daodaoedu/daodao-storage) — DB migrations (041-046)
