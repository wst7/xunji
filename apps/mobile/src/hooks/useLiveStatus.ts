import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import type { ParseStatus } from '@recall/shared'
import { isTerminalStatus } from '@recall/shared'

import { api } from '../api/client'

const POLL_INTERVAL_MS = 1500

/**
 * 仅在 App 处于前台且状态未终止时轮询；终态回调只触发一次。
 * 调用方负责把新状态写回自己的状态，hook 本身不持有文档。
 */
export function useLiveStatus(
  documentId: string | undefined,
  status: ParseStatus | null | undefined,
  onStatus: (status: ParseStatus) => void,
  onSettled?: (status: ParseStatus) => void,
): void {
  const [active, setActive] = useState(AppState.currentState === 'active')
  const statusRef = useRef(status)
  const onStatusRef = useRef(onStatus)
  const onSettledRef = useRef(onSettled)

  statusRef.current = status
  onStatusRef.current = onStatus
  onSettledRef.current = onSettled

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'))
    return () => sub.remove()
  }, [])

  const terminal = status ? isTerminalStatus(status) : false

  useEffect(() => {
    if (!documentId || terminal || !active) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let inFlight = false

    const tick = async () => {
      if (cancelled) return
      if (!inFlight) {
        inFlight = true
        try {
          const res = await api.getDocumentStatus(documentId)
          if (cancelled) return
          if (res.status !== statusRef.current) {
            statusRef.current = res.status
            onStatusRef.current(res.status)
            if (isTerminalStatus(res.status)) {
              onSettledRef.current?.(res.status)
              return
            }
          }
        } catch {
          // 网络抖动或超时：继续静默轮询，由页面自身决定是否提示。
        } finally {
          inFlight = false
        }
      }
      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS)
    }

    timer = setTimeout(tick, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [documentId, terminal, active])
}
