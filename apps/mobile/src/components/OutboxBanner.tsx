import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, spacing, type } from '../theme'

interface OutboxBannerProps {
  count: number
  flushing: boolean
  onRetry: () => void
}

export function OutboxBanner({ count, flushing, onRetry }: OutboxBannerProps) {
  if (count === 0) return null
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
      <Text style={styles.text}>
        {flushing ? '正在同步待保存内容…' : `${count} 条待保存，联网后会自动提交。`}
      </Text>
      {flushing ? (
        <ActivityIndicator size="small" color={colors.warning} />
      ) : (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="重试同步"
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Text style={styles.action}>重试</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningLine,
    borderRadius: radius.control,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
  },
  text: {
    ...type.caption,
    flex: 1,
    color: colors.warning,
  },
  retry: {
    minHeight: 36,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  action: {
    ...type.caption,
    color: colors.accentDeep,
    fontWeight: '600',
  },
})
