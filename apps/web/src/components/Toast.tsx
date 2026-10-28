import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: number
  message: string
  type: ToastType
  action?: ToastAction
}

interface ToastContextValue {
  toast: (message: string, options?: { type?: ToastType; action?: ToastAction }) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast 必须在 ToastProvider 内使用')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<ToastContextValue['toast']>((message, options) => {
    const id = nextId.current++
    const item: ToastItem = { id, message, type: options?.type ?? 'info', action: options?.action }
    setItems((prev) => [...prev, item])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 6000)
  }, [])

  const value: ToastContextValue = { toast, dismiss }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast-message">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" className="toast-close" aria-label="关闭提示" onClick={() => dismiss(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
