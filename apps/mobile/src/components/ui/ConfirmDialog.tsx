import { useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, shadow, spacing, type } from '../../theme'

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
  const enter = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(enter, {
      toValue: visible ? 1 : 0,
      duration: visible ? 160 : 120,
      useNativeDriver: true,
    }).start()
  }, [visible, enter])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.scrim, { opacity: enter }]}>
        <Pressable style={styles.scrimFill} onPress={onCancel} accessibilityLabel="关闭对话框" />
        <Animated.View
          style={[
            styles.card,
            {
              opacity: enter,
              transform: [
                { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
              ],
            },
          ]}
          accessibilityViewIsModal
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              style={({ pressed }) => [styles.action, styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.action,
                destructive ? styles.destructive : styles.confirm,
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

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(14, 17, 22, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
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
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadow.floating,
  },
  title: {
    ...type.title,
    fontSize: 18,
    color: colors.ink,
  },
  message: {
    ...type.body,
    color: colors.muted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  action: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    backgroundColor: colors.surfaceMuted,
  },
  confirm: {
    backgroundColor: colors.accent,
  },
  destructive: {
    backgroundColor: colors.errorSoft,
  },
  cancelText: {
    ...type.body,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  confirmText: {
    ...type.body,
    fontWeight: '600',
    color: colors.white,
  },
  destructiveText: {
    ...type.body,
    fontWeight: '600',
    color: colors.error,
  },
  pressed: {
    opacity: 0.75,
  },
})
