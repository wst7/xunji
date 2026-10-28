import AsyncStorage from '@react-native-async-storage/async-storage'

import { PENDING_SHARE_KEY } from '../storage/keys'

export async function savePendingShare(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_SHARE_KEY, url)
  } catch {
    // 写入失败时只能提示用户重新分享；不阻断登录流程。
  }
}

export async function hasPendingShare(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PENDING_SHARE_KEY)) !== null
  } catch {
    return false
  }
}

/** 取出后即删除；返回 null 表示没有待处理分享。 */
export async function takePendingShare(): Promise<string | null> {
  try {
    const url = await AsyncStorage.getItem(PENDING_SHARE_KEY)
    if (url !== null) {
      try {
        await AsyncStorage.removeItem(PENDING_SHARE_KEY)
      } catch {
        // 取出成功但删除失败时仍继续保存，最坏结果是下次再尝试一次（服务端会去重）。
      }
    }
    return url
  } catch {
    return null
  }
}

export async function clearPendingShare(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_SHARE_KEY)
  } catch {
    // 忽略；调用方在退出登录时已清除内存会话。
  }
}
