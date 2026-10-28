import AsyncStorage from '@react-native-async-storage/async-storage'

import { OUTBOX_KEY } from '../storage/keys'

export type OutboxSource = 'manual' | 'share'

export interface OutboxItem {
  id: string
  url: string
  userId: string
  source: OutboxSource
  createdAt: string
  attempts: number
  lastError?: string
}

const MAX_ITEMS = 50

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 客户端去重键：只对协议/主机大小写和尾部斜杠做保守归一化。 */
export function outboxKey(url: string): string {
  try {
    const u = new URL(url.trim())
    u.hash = ''
    u.protocol = u.protocol.toLowerCase()
    u.hostname = u.hostname.toLowerCase()
    const text = u.toString()
    return text.endsWith('/') ? text.slice(0, -1) : text
  } catch {
    return url.trim()
  }
}

async function readAll(): Promise<OutboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as OutboxItem[]) : []
  } catch {
    return []
  }
}

async function writeAll(items: OutboxItem[]): Promise<void> {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(items))
}

export async function listOutbox(userId: string): Promise<OutboxItem[]> {
  const items = await readAll()
  return items.filter((item) => item.userId === userId)
}

export async function enqueueOutbox(
  userId: string,
  url: string,
  source: OutboxSource,
): Promise<'added' | 'duplicate' | 'trimmed'> {
  const items = await readAll()
  const key = outboxKey(url)
  if (items.some((item) => item.userId === userId && outboxKey(item.url) === key)) {
    return 'duplicate'
  }
  items.push({
    id: newId(),
    url,
    userId,
    source,
    createdAt: new Date().toISOString(),
    attempts: 0,
  })
  // 上限按用户计算，避免同一台设备上的其他账号挤掉这个账号的队列。
  const mine = items.filter((item) => item.userId === userId)
  let trimmed = false
  if (mine.length > MAX_ITEMS) {
    const oldest = mine[0]
    const index = items.findIndex((item) => item.id === oldest.id)
    if (index >= 0) {
      items.splice(index, 1)
      trimmed = true
    }
  }
  await writeAll(items)
  return trimmed ? 'trimmed' : 'added'
}

export async function removeOutboxItem(id: string): Promise<void> {
  const items = await readAll()
  await writeAll(items.filter((item) => item.id !== id))
}

export async function noteOutboxFailure(id: string, message: string): Promise<void> {
  const items = await readAll()
  const next = items.map((item) =>
    item.id === id ? { ...item, attempts: item.attempts + 1, lastError: message } : item,
  )
  await writeAll(next)
}

export async function clearOutbox(): Promise<void> {
  await AsyncStorage.removeItem(OUTBOX_KEY)
}
