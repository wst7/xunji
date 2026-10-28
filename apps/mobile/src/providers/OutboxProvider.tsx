import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { AppState } from 'react-native'

import { useAuth } from '../auth/AuthProvider'
import { flushOutbox } from '../outbox/flush'
import { enqueueOutbox, listOutbox, type OutboxItem, type OutboxSource } from '../storage/outboxStore'
import { useToast } from './ToastProvider'

interface OutboxContextValue {
  items: OutboxItem[]
  pendingCount: number
  flushing: boolean
  enqueue: (
    url: string,
    source: OutboxSource,
  ) => Promise<'added' | 'duplicate' | 'trimmed' | 'unauthenticated'>
  retry: () => void
}

const OutboxContext = createContext<OutboxContextValue | null>(null)

const FOREGROUND_INTERVAL_MS = 60_000

export function OutboxProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<OutboxItem[]>([])
  const [flushing, setFlushing] = useState(false)
  const userId = user?.id

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([])
      return
    }
    try {
      setItems(await listOutbox(userId))
    } catch {
      // AsyncStorage 不可用时保持上一次的内存视图。
    }
  }, [userId])

  const retry = useCallback(() => {
    if (!userId || status !== 'authenticated') return
    setFlushing(true)
    void (async () => {
      try {
        const result = await flushOutbox(userId)
        await refresh()
        if (result.synced > 0) {
          toast(`已自动保存 ${result.synced} 条待保存内容。`, { type: 'success' })
        }
        if (result.failed > 0) {
          toast(`${result.failed} 条内容无法保存，已移出待保存队列。`, { type: 'warning' })
        }
        if (result.stopped === 'server') {
          toast('同步暂时不可用，稍后会自动重试。', { type: 'warning' })
        }
      } catch {
        // 本地存储或网络层意外失败：保留队列，等待下一次触发。
        await refresh()
      } finally {
        setFlushing(false)
      }
    })()
  }, [userId, status, refresh, toast])

  const enqueue = useCallback(
    async (
      url: string,
      source: OutboxSource,
    ): Promise<'added' | 'duplicate' | 'trimmed' | 'unauthenticated'> => {
      if (!userId) return 'unauthenticated'
      const result = await enqueueOutbox(userId, url, source)
      await refresh()
      return result
    },
    [userId, refresh],
  )

  // 登录后或已登录启动时：先载入队列，再尝试同步一次。
  useEffect(() => {
    if (status !== 'authenticated' || !userId) {
      setItems([])
      return
    }
    void refresh()
    retry()
  }, [status, userId, refresh, retry])

  // 回到前台时立即尝试同步。
  useEffect(() => {
    if (status !== 'authenticated' || !userId) return
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') retry()
    })
    return () => sub.remove()
  }, [status, userId, retry])

  // 前台时每 60 秒尝试一次，仅在队列非空时开启。
  useEffect(() => {
    if (status !== 'authenticated' || !userId || items.length === 0) return
    const timer = setInterval(retry, FOREGROUND_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [status, userId, items.length, retry])

  const value = useMemo(
    () => ({
      items,
      pendingCount: items.length,
      flushing,
      enqueue,
      retry,
    }),
    [items, flushing, enqueue, retry],
  )

  return <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>
}

export function useOutbox(): OutboxContextValue {
  const value = useContext(OutboxContext)
  if (!value) throw new Error('useOutbox must be used within OutboxProvider')
  return value
}
