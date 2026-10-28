import { defineConfig } from 'vite'

/**
 * 静态说明页，不依赖前端框架。
 * __APP_URL__ 在构建时替换为应用地址：默认开发环境 5173，
 * Docker 构建时通过 XUNJI_APP_URL 传入（见 docker-compose.yml）。
 */
const appUrl = process.env.XUNJI_APP_URL || 'http://localhost:5173'

export default defineConfig({
  server: { port: 5174 },
  preview: { port: 5174 },
  plugins: [
    {
      name: 'recall-app-url',
      transformIndexHtml(html) {
        return html.split('__APP_URL__').join(appUrl)
      },
    },
  ],
})
