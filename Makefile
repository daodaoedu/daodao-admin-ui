# =========================================
# 🧱 基本設定
# =========================================

IMAGE_NAME   = daodao-admin-ui
TAG          = latest

COMPOSE_DEV  = docker compose --env-file .env.dev  -f docker-compose.dev.yml
COMPOSE_PROD = docker compose --env-file .env.prod -f docker-compose.prod.yml

# =========================================
# 📘 Help 列出所有指令
# =========================================
.PHONY: help \
        up-dev down-dev rebuild-dev \
        up-prod down-prod rebuild-prod \
        health-dev health-prod health \
        lint typecheck format check \
        dev build preview

help: ## 列出所有可用指令
	@echo "💡 可用指令如下："
	@grep -E '^[a-zA-Z0-9_-]+:.*?##' Makefile | \
		awk -F ':.*?##' '{printf " - \033[36m%-20s\033[0m %s\n", $$1, $$2}'


# =========================================
# ⚙️ Docker 操作
# =========================================

up-dev: ## 啟動 Dev 環境（含建置）
	$(COMPOSE_DEV) up -d --build

down-dev: ## 停止並移除 Dev 容器
	$(COMPOSE_DEV) down --remove-orphans

rebuild-dev: ## 強制重建 Dev image（不使用快取）
	$(COMPOSE_DEV) down --remove-orphans
	@docker image inspect $(IMAGE_NAME):dev > /dev/null 2>&1 && docker rmi $(IMAGE_NAME):dev || true
	$(COMPOSE_DEV) build --no-cache
	$(COMPOSE_DEV) up -d

up-prod: ## 啟動 Prod 環境（含建置）
	$(COMPOSE_PROD) up -d --build

down-prod: ## 停止並移除 Prod 容器
	$(COMPOSE_PROD) down --remove-orphans

rebuild-prod: ## 強制重建 Prod image（不使用快取）
	$(COMPOSE_PROD) down --remove-orphans
	@docker image inspect $(IMAGE_NAME):prod > /dev/null 2>&1 && docker rmi $(IMAGE_NAME):prod || true
	$(COMPOSE_PROD) build --no-cache
	$(COMPOSE_PROD) up -d


# =========================================
# 🏥 健康檢查
# =========================================

health-dev: ## 確認 Dev 容器健康狀態
	@container_id=$$($(COMPOSE_DEV) ps -q admin-ui-dev 2>/dev/null); \
	if [ -z "$$container_id" ]; then \
		echo "❌ admin-ui-dev 容器未執行"; exit 1; \
	fi; \
	status=$$(docker inspect --format='{{.State.Health.Status}}' $$container_id 2>/dev/null); \
	if [ "$$status" = "healthy" ]; then \
		echo "✅ admin-ui-dev 健康狀態：$$status"; \
	else \
		echo "❌ admin-ui-dev 健康狀態：$$status"; exit 1; \
	fi

health-prod: ## 確認 Prod 容器健康狀態
	@container_id=$$($(COMPOSE_PROD) ps -q admin-ui-prod 2>/dev/null); \
	if [ -z "$$container_id" ]; then \
		echo "❌ admin-ui-prod 容器未執行"; exit 1; \
	fi; \
	status=$$(docker inspect --format='{{.State.Health.Status}}' $$container_id 2>/dev/null); \
	if [ "$$status" = "healthy" ]; then \
		echo "✅ admin-ui-prod 健康狀態：$$status"; \
	else \
		echo "❌ admin-ui-prod 健康狀態：$$status"; exit 1; \
	fi

health: health-dev health-prod ## 確認所有環境健康狀態


# =========================================
# 🧪 程式碼品質
# =========================================

lint: ## Biome lint + format 檢查（不修改）
	pnpm lint

typecheck: ## TypeScript 型別檢查
	pnpm exec tsc --noEmit

format: ## 自動修正 lint + format 問題
	pnpm check:fix

check: lint typecheck ## 執行完整品質檢查（lint + typecheck）


# =========================================
# 🔧 本地開發
# =========================================

dev: ## 啟動 Vite dev server（port 5173）
	pnpm dev

build: ## 建置靜態產物到 dist/
	pnpm build

preview: ## 本地預覽建置產物（port 4173）
	pnpm preview
