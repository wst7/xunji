import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, spacing, type } from '../../theme'

interface EmptyStateProps {
  /** 空状态用一个贴题的图标，而不是所有页面共用一个“空托盘”。 */
  icon?: 'file-tray-outline' | 'bookmarks-outline' | 'search-outline' | 'cloud-offline-outline'
  title: string
  body?: string
  action?: { label: string; onPress: () => void }
}

export function EmptyState({ icon = 'file-tray-outline', title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body && <Text style={styles.body}>{body}</Text>}
      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...type.title,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    ...type.body,
    color: colors.muted,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  actionPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  actionText: {
    ...type.body,
    color: colors.accent,
    fontWeight: '600',
  },
})
