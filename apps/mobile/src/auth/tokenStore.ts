import * as SecureStore from 'expo-secure-store'

import { TOKEN_KEY } from '../storage/keys'

let cachedToken: string | null = null

let ready = false
let markReady: (() => void) | null = null
const tokenReady = new Promise<void>((resolve) => {
  markReady = resolve
})

function finishLoading(): void {
  if (ready) return
  ready = true
  markReady?.()
  markReady = null
}

/**
 * 页面可能在 SecureStore 读取完成前就发起请求（例如首页挂载时的最近收藏）。
 * API 客户端先等待这里，避免无 token 的请求触发 401 并误删有效会话。
 */
export function whenTokenReady(): Promise<void> {
  return ready ? Promise.resolve() : tokenReady
}

/** API 客户端在启动后同步读取；启动时由 AuthProvider 调 loadToken 填充。 */
export function getCachedToken(): string | null {
  return cachedToken
}

export async function loadToken(): Promise<string | null> {
  try {
    cachedToken = await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    cachedToken = null
  } finally {
    finishLoading()
  }
  return cachedToken
}

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    cachedToken = token
  } catch (e) {
    // 写入失败时不把 token 留在内存里，避免界面以为已登录但重启后会话丢失。
    cachedToken = null
    throw e
  }
}

export async function clearStoredToken(): Promise<void> {
  cachedToken = null
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  } catch {
    // 密钥链不可用时，内存中的 token 已经清除。
  }
}
