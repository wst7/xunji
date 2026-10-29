import { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, Text, View } from 'react-native'

import { makeStyles, useTheme, withAlpha } from '../../theme'

interface ConfirmDialogProps {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 应用内确认框：原生 Alert 的按钮颜色跟随系统主题，会跳出品牌色，
 * 所以删除、退出这类动作统一用这里，配色与页面一致。
 * MD3 basic dialog：surfaceContainerHigh、28 圆角、弹性缩放进出。
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = '取消',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme()
  const styles = useStyles()
  const enter = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) {
      enter.setValue(0)
      return
    }
    Animated.spring(enter, {
      toValue: 1,
      useNativeDriver: true,
      ...theme.motion.spring.standard,
    }).start()
  }, [visible, enter, theme.motion.spring.standard])

  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View
        style={[styles.scrim, { backgroundColor: withAlpha(theme.colors.scrim, 0.32), opacity: enter }]}
      >
        <Pressable style={styles.scrimFill} onPress={onCancel} accessibilityLabel="关闭对话框" />
        <Animated.View
          style={[styles.card, { opacity: enter, transform: [{ scale }] }]}
          accessibilityViewIsModal
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              android_ripple={{ color: withAlpha(theme.colors.primary, 0.12) }}
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              android_ripple={{
                color: withAlpha(destructive ? theme.colors.onError : theme.colors.onPrimary, 0.16),
              }}
              style={({ pressed }) => [
                styles.confirm,
                destructive ? styles.destructive : styles.filled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={destructive ? styles.destructiveText : styles.confirmText}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const useStyles = makeStyles((theme) => ({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  scrimFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.xl,
    padding: theme.spacing.xl,
    ...theme.elevation.level3,
  },
  title: {
    ...theme.type.headlineSmall,
    color: theme.colors.text,
  },
  message: {
    ...theme.type.bodyMedium,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  cancel: {
    minHeight: 40,
    minWidth: 80,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirm: {
    minHeight: 40,
    minWidth: 88,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: theme.colors.primary,
  },
  destructive: {
    backgroundColor: theme.colors.error,
  },
  cancelText: {
    ...theme.type.labelLarge,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  confirmText: {
    ...theme.type.labelLarge,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  destructiveText: {
    ...theme.type.labelLarge,
    fontWeight: '600',
    color: theme.colors.onError,
  },
  pressed: {
    opacity: 0.75,
  },
}))
