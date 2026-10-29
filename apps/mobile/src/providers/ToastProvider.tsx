import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, shadow, spacing, type } from '../theme'

type ToastType = 'info' | 'success' | 'warning' | 'error'

interface ToastAction {
  label: string
  onPress: () => void
}

interface ToastOptions {
  type?: ToastType
  action?: ToastAction
  duration?: number
}

interface ToastItem {
  id: number
  message: string
  type: ToastType
  action?: ToastAction
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE: Record<
  ToastType,
  { icon: 'checkmark-circle' | 'information-circle' | 'warning' | 'alert-circle'; fg: string }
> = {
  info: { icon: 'information-circle', fg: colors.muted },
  success: { icon: 'checkmark-circle', fg: colors.success },
  warning: { icon: 'warning', fg: colors.warning },
  error: { icon: 'alert-circle', fg: colors.error },
}

/** 按压反馈用 120ms 的线性位移，成功态直接给一个勾，而不是只换文字。 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const insets = useSafeAreaInsets()

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = nextId.current++
      const item: ToastItem = {
        id,
        message,
        type: options.type ?? 'info',
        action: options.action,
      }
      setItems((current) => [...current.slice(-2), item])
      const timer = setTimeout(() => dismiss(id), options.duration ?? 6000)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer))
      timers.current.clear()
    },
    [],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={[
          styles.host,
          { paddingBottom: Math.max(insets.bottom, spacing.sm) + 64 + spacing.sm },
        ]}
      >
        {items.map((item) => (
          <ToastCard
            key={item.id}
            item={item}
            onDismiss={() => dismiss(item.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const enter = useRef(new Animated.Value(0)).current
  const tone = TONE[item.type]

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    }).start()
  }, [enter])

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
            },
          ],
        },
      ]}
    >
      <Ionicons name={tone.icon} size={20} color={tone.fg} style={styles.icon} />
      <View style={styles.body}>
        <Text style={styles.message}>{item.message}</Text>
        {item.action && (
          <Pressable
            onPress={() => {
              item.action?.onPress()
              onDismiss()
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Text style={styles.action}>{item.action.label}</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.accent} />
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="关闭提示"
        hitSlop={10}
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={16} color={colors.faint} />
      </Pressable>
    </Animated.View>
  )
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used within ToastProvider')
  return value
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    gap: spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow.floating,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  message: {
    ...type.body,
    color: colors.inkSoft,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    minHeight: 32,
  },
  action: {
    ...type.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  close: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
})
