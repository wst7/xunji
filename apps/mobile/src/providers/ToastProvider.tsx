import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Animated, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { makeStyles, useTheme, withAlpha } from '../theme'

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

const ICON: Record<ToastType, 'checkmark-circle' | 'information-circle' | 'warning' | 'alert-circle'> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  warning: 'warning',
  error: 'alert-circle',
}

/**
 * MD3 snackbar：inverseSurface 底色浮在导航栏之上，保持最多 3 条。
 * 语义靠图标形状区分，颜色统一用 inversePrimary，深浅两套主题都够清楚。
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const styles = useStyles()

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
          {
            paddingBottom:
              insets.bottom + theme.layout.navBarHeight + theme.spacing.lg,
          },
        ]}
      >
        {items.map((item) => (
          <Snackbar key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

function Snackbar({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const theme = useTheme()
  const styles = useStyles()
  const enter = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      ...theme.motion.spring.expressive,
    }).start()
  }, [enter, theme.motion.spring.expressive])

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.snackbar,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
            },
          ],
        },
      ]}
    >
      <Ionicons
        name={ICON[item.type]}
        size={20}
        color={theme.colors.inversePrimary}
        style={styles.icon}
      />
      <View style={styles.body}>
        <Text style={styles.message}>{item.message}</Text>
        {item.action && (
          <Pressable
            onPress={() => {
              item.action?.onPress()
              onDismiss()
            }}
            accessibilityRole="button"
            android_ripple={{ color: withAlpha(theme.colors.inversePrimary, 0.16) }}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          >
            <Text style={styles.action}>{item.action.label}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.inversePrimary} />
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
        <Ionicons name="close" size={18} color={theme.colors.inverseOnSurface} />
      </Pressable>
    </Animated.View>
  )
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used within ToastProvider')
  return value
}

const useStyles = makeStyles((theme) => ({
  host: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: 0,
    gap: theme.spacing.sm,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.inverseSurface,
    borderRadius: theme.shape.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md + 2,
    ...theme.elevation.level3,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  message: {
    ...theme.type.bodyMedium,
    color: theme.colors.inverseOnSurface,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    minHeight: 32,
  },
  action: {
    ...theme.type.labelLarge,
    fontWeight: '600',
    color: theme.colors.inversePrimary,
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
}))
