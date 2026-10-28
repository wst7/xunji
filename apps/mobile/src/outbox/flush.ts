import { ApiError } from '@xunji/shared'

import { api } from '../api/client'
import { getCachedToken } from '../auth/tokenStore'
import { listOutbox, noteOutboxFailure, removeOutboxItem } from '../storage/outboxStore'

export interface FlushResult {
  synced: number
  failed: number
  remaining: number
  stopped: 'network' | 'auth' | 'server' | null
}

let running: Promise<FlushResult> | null = null

async function run(userId: string): Promise<FlushResult> {
  const items = await listOutbox(userId)
  // 队列按用户隔离，但 token 是全局的；一旦退出/切换账号就停止，
  // 避免把上一个账号的链接提交到新账号。
  const tokenAtStart = getCachedToken()
  if (!tokenAtStart) {
    return { synced: 0, failed: 0, remaining: items.length, stopped: 'auth' }
  }
  let synced = 0
  let failed = 0
  let stopped: FlushResult['stopped'] = null

  for (const item of items) {
    if (getCachedToken() !== tokenAtStart) {
      stopped = 'auth'
      break
    }
    try {
      await api.createDocument(item.url)
      await removeOutboxItem(item.id)
      synced += 1
    } catch (e) {
      if (!(e instanceof ApiError)) {
        stopped = 'network'
        break
      }
      if (e.code === 'NETWORK_ERROR') {
        await noteOutboxFailure(item.id, e.message)
        stopped = 'network'
        break
      }
      if (e.code === 'UNAUTHORIZED') {
        stopped = 'auth'
        break
      }
      if (e.code.startsWith('HTTP_5')) {
        stopped = 'server'
        break
      }
      // 其他 4xx 是永久失败（例如链接无效），移出队列避免永久阻塞。
      await removeOutboxItem(item.id)
      failed += 1
    }
  }

  const remaining = (await listOutbox(userId)).length
  return { synced, failed, remaining, stopped }
}

/** 单飞：同一时间只允许一个刷新过程。 */
export function flushOutbox(userId: string): Promise<FlushResult> {
  if (!running) {
    running = run(userId).finally(() => {
      running = null
    })
  }
  return running
}
