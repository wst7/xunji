import AsyncStorage from '@react-native-async-storage/async-storage'

import type { User } from '@recall/shared'
import { USER_KEY } from './keys'

/** 只缓存非敏感展示信息，token 永远只放 SecureStore。 */
export async function loadCachedUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export async function saveCachedUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    // 缓存失败不影响登录；下次启动会重新从 /auth/me 获取。
  }
}

export async function clearCachedUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_KEY)
  } catch {
    // 退出登录以内存状态为准。
  }
}
