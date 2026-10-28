/** 极小的变更通知：写入本地库后让界面知道该重新读一次。 */
type Listener = () => void

const listeners = new Set<Listener>()

export function emitChange(): void {
  for (const listener of [...listeners]) listener()
}

export function subscribeChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
