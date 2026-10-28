# Xunji 前端：Vite 构建 → Nginx 托管并反代 API
# 构建上下文必须是仓库根目录（monorepo）：context: . ，dockerfile: apps/web/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY packages/api ./packages/api
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm run build -w @xunji/web

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
