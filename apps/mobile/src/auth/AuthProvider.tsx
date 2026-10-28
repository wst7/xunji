import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@recall/shared'
import { ApiError } from '@recall/shared'

import { api } from '../api/client'
import { onUnauthorized } from './sessionEvents'
import { clearStoredToken, loadToken, saveToken } from './tokenStore'
import { clearPendingShare } from './pendingShare'
import { clearCachedUser, loadCachedUser, saveCachedUser } from '../storage/cachedUser'
import { clearOutbox } from '../storage/outboxStore'

export type AuthStatus = 'booting' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('booting')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const token = await loadToken()
      if (cancelled) return
      if (!token) {
        setStatus('unauthenticated')
        return
      }

      // 先乐观进入，避免离线时被挡在登录页；随后在后台校验 token。
      const cached = await loadCachedUser()
      if (cancelled) return
      setUser(cached)
      setStatus('authenticated')

      try {
        const fresh = await api.me()
        if (cancelled) return
        setUser(fresh)
        void saveCachedUser(fresh)
      } catch (e) {
        if (cancelled) return
        if (e instanceof ApiError && e.code === 'UNAUTHORIZED') {
          await clearStoredToken()
          await clearCachedUser()
          if (cancelled) return
          setUser(null)
          setStatus('unauthenticated')
        }
        // 网络错误时保留登录态，待保存队列仍可查看与重试。
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(
    () =>
      onUnauthorized(() => {
        setUser(null)
        setStatus('unauthenticated')
        void clearCachedUser()
      }),
    [],
  )

  const establishSession = useCallback(async (email: string, password: string, register: boolean) => {
    const res = register
      ? await api.register(email.trim(), password)
      : await api.login(email.trim(), password)
    await saveToken(res.token)
    await saveCachedUser(res.user)
    setUser(res.user)
    setStatus('authenticated')
  }, [])

  const signIn = useCallback(
    (email: string, password: string) => establishSession(email, password, false),
    [establishSession],
  )

  const signUp = useCallback(
    (email: string, password: string) => establishSession(email, password, true),
    [establishSession],
  )

  const signOut = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // best-effort：即使服务端不可达也要清掉本机会话。
    }
    await Promise.allSettled([
      clearStoredToken(),
      clearCachedUser(),
      clearOutbox(),
      clearPendingShare(),
    ])
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
