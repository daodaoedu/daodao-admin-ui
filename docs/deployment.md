# 部署指南

## 前置需求

| 工具 | 版本 |
|------|------|
| Node.js | >= 20.19.4 |
| pnpm | >= 10.20.0 |
| Docker | >= 24 |
| Docker Compose | >= 2.20 |

---

## 本地開發（無 Docker）

### 1. 安裝依賴

```bash
pnpm install
```

### 2. 確認後端已啟動

本地開發時，Vite dev server 將 `/api/*` 代理至 `http://localhost:8002`（見 `vite.config.ts`）。

確保 `daodao-ai-backend` 已在 port 8002 執行：

```bash
# 在 daodao-ai-backend 目錄
make up-dev
# 或手動：uvicorn src.main:app --port 8002 --reload
```

### 3. 啟動開發伺服器

```bash
pnpm dev
# 或
make dev
```

瀏覽器開啟 `http://localhost:5173/admin/`，使用有效的 admin JWT token 登入。

---

## Docker 部署

### 網路架構

admin-ui 與 daodao-ai-backend 必須在同一個 Docker network 才能互通：

```
dev-daodao-network   （開發環境）
prod-daodao-network  （生產環境）
```

若 network 尚未建立：

```bash
docker network create dev-daodao-network
docker network create prod-daodao-network
```

### 環境設定

```bash
# 複製範本
cp .env.dev.sample .env.dev
cp .env.prod.sample .env.prod
```

`.env.dev` / `.env.prod` 內容（無機密，可提交至版控）：

```env
BACKEND_HOST=backend-dev   # daodao-ai-backend 在 Docker network 上的 alias
BACKEND_PORT=8000
```

> `BACKEND_HOST` 對應 `daodao-ai-backend/docker-compose.dev.yml` 中
> `services.backend-dev.networks.dev-daodao-network.aliases` 的值。

### 啟動

```bash
# Dev
make up-dev

# Prod
make up-prod
```

### 健康確認

```bash
make health-dev    # 檢查 dev 容器健康狀態
make health-prod   # 檢查 prod 容器健康狀態
```

或直接 curl：

```bash
# 需先找到容器 IP 或 expose port
curl http://localhost/health   # → "ok"
```

---

## CI/CD 流程

### CI（`.github/workflows/ci.yml`）

觸發條件：PR 至 `main` 或 `dev`

```
Checkout → Node 20 + pnpm → pnpm install → pnpm lint → tsc --noEmit
```

### CD（`.github/workflows/cd.yml`）

觸發條件：push `main`（→ prod）或 `dev`（→ dev）

```
CI → build（設定 IMAGE_TAG）→ deploy
```

**deploy 步驟（SSH 至 Linode）：**

1. 更新程式碼（`git fetch --depth 1` + `git reset --hard`）
2. 準備 `.env.{dev|prod}`（若不存在則從 sample 複製）
3. `docker compose down --remove-orphans`
4. 刪除舊 image
5. `docker compose up -d --build`（在伺服器本地建置 image）
6. 輪詢 `docker inspect --format='{{.State.Health.Status}}'`，最多 12 次（60 秒）
7. 輸出系統資源報告

### GitHub Secrets 需求

| Secret | 說明 |
|--------|------|
| `LINODE_SSH_PRIVATE_KEY` | SSH 私鑰（對應伺服器 `~/.ssh/authorized_keys`） |
| `LINODE_INSTANCE_IP` | Linode 伺服器 IP |
| `GIT_HUB_USERNAME` | GitHub 帳號（用於 git clone） |
| `GIT_HUB_ACCESS_TOKEN` | GitHub PAT（repo read 權限） |

> admin-ui 無後端機密（DB 密碼等），不需額外 secrets。

### GitHub Environments

| Branch | Environment |
|--------|-------------|
| `main` | `production` |
| `dev` | `development` |

在 GitHub Repo → Settings → Environments 中設定上述 secrets。

---

## 常見問題

### 容器啟動後 `/admin/` 顯示 404

確認 Vite build 產物的 `index.html` 確實位於 `/usr/share/nginx/html/admin/`：

```bash
docker exec <container_id> ls /usr/share/nginx/html/admin/
# 應看到 index.html 與 assets/ 目錄
```

若目錄不存在，確認 `vite.config.ts` 的 `base: '/admin/'` 是否正確，重新建置。

### API 請求返回 502 Bad Gateway

nginx 無法連到後端。確認：

1. `.env.dev` 的 `BACKEND_HOST` 值與後端 compose 的 network alias 一致
2. 兩個容器確實在同一個 Docker network：

```bash
docker network inspect dev-daodao-network
# 確認 admin-ui-dev 與 backend-dev 都在清單中
```

### 容器健康檢查一直 `starting`

健康檢查最多等 15 秒（`start_period: 15s`）。若超過仍未 healthy：

```bash
docker logs <container_id>  # 查看 nginx 啟動日誌
```

常見原因：`docker-entrypoint.sh` 的 `envsubst` 失敗（缺少 `BACKEND_HOST` 或 `BACKEND_PORT` 環境變數）。

### 強制完整重建

```bash
make rebuild-dev   # dev
make rebuild-prod  # prod
```

---

## 伺服器目錄結構（Linode）

```
/root/daodao-admin-ui/
├── .env.dev
├── .env.prod
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Dockerfile
├── nginx.conf.template
├── docker-entrypoint.sh
└── src/
```

部署腳本每次以淺層克隆（`--depth 1`）更新至最新 commit，舊 Docker image 強制刪除後重建。
