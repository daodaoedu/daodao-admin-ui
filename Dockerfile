# ====== Stage 1: Build ======
FROM node:20-alpine AS builder

WORKDIR /app

# 啟用 pnpm（Node.js 20 內建 corepack）
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# 先複製 lock 檔安裝依賴（利用 Docker 層快取）
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 複製原始碼並建置
COPY . .
RUN pnpm build

# ====== Stage 2: Serve with vite preview ======
FROM node:20-alpine AS runtime

# wget 供 Docker healthcheck 使用
RUN apk add --no-cache wget

WORKDIR /app

# 複製建置產物
COPY --from=builder /app/dist ./dist

# 複製 node_modules（含 vite binary，供 vite preview 使用）
COPY --from=builder /app/node_modules ./node_modules

# 複製 vite 設定（preview proxy 從此讀取 BACKEND_URL）
COPY --from=builder /app/package.json ./package.json
COPY vite.config.ts tsconfig.node.json ./

# 健康檢查：確認 vite preview 已開始回應
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:3000/admin/ || exit 1

EXPOSE 3000

CMD ["node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
