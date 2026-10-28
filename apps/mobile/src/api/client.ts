import { createApiClient } from '@recall/api'

import { API_BASE } from '../config/env'
import { emitUnauthorized } from '../auth/sessionEvents'
import { clearStoredToken, getCachedToken, whenTokenReady } from '../auth/tokenStore'

export const api = createApiClient({
  baseUrl: API_BASE,
  // 页面可能在 SecureStore 读取完成前就发起请求；先等 token 就绪。
  getToken: async () => {
    await whenTokenReady()
    return getCachedToken()
  },
  onUnauthorized: (tokenUsed) => {
    // 忽略旧会话迟到的 401：期间可能已经退出或切换了账号。
    if (getCachedToken() !== tokenUsed) return
    void clearStoredToken()
    emitUnauthorized()
  },
  timeoutMs: 15_000,
}).api
