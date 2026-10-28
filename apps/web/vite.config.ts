import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // 本机 8000 被占用时可用 RECALL_API_TARGET=http://127.0.0.1:8010 覆盖
        target: process.env.RECALL_API_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
})
