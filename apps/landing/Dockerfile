# Recall 说明页（静态站点）：构建上下文必须是仓库根目录
FROM node:20-alpine AS build
WORKDIR /app

# 应用地址在构建时注入；compose 里传 http://localhost:3000
ARG RECALL_APP_URL=http://localhost:3000
ENV RECALL_APP_URL=${RECALL_APP_URL}

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/landing/package.json apps/landing/
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY apps/landing ./apps/landing
RUN npm run build -w @recall/landing

FROM nginx:1.27-alpine
COPY --from=build /app/apps/landing/dist /usr/share/nginx/html
EXPOSE 80
