import { useEffect, useRef, useState } from 'react'
import type { ParseStatus } from '@recall/shared'

import { useLiveStatus } from '../hooks/useLiveStatus'
import { StatusBadge } from './StatusBadge'

interface LiveStatusBadgeProps {
  docId: string
  status: ParseStatus
  onTerminal?: (status: ParseStatus) => void
}

/**
 * 非终态每 1.5s 查询一次状态，到达终态后停止并回调。
 * 页面主体（详情）也可以直接使用 useLiveStatus 做同样的轮询。
 */
export function LiveStatusBadge({ docId, status: initialStatus, onTerminal }: LiveStatusBadgeProps) {
  const [status, setStatus] = useState<ParseStatus>(initialStatus)
  const onTerminalRef = useRef(onTerminal)
  onTerminalRef.current = onTerminal

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  useLiveStatus(docId, status, setStatus, (next) => {
    setStatus(next)
    onTerminalRef.current?.(next)
  })

  return <StatusBadge status={status} />
}
