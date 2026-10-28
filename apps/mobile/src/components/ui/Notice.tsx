import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, spacing, type } from '../../theme'

type Tone = 'info' | 'warning' | 'error'

const TONE: Record<
  Tone,
  { name: 'information-circle-outline' | 'warning-outline' | 'alert-circle-outline'; fg: string; bg: string; border: string }
> = {
  info: { name: 'information-circle-outline', fg: colors.muted, bg: colors.surface, border: colors.line },
  warning: { name: 'warning-outline', fg: colors.warning, bg: colors.warningSoft, border: colors.warningLine },
  error: { name: 'alert-circle-outline', fg: colors.error, bg: colors.errorSoft, border: colors.errorLine },
}

interface NoticeProps {
  text: string
  tone?: Tone
  action?: { label: string; onPress: () => void }
}

export function Notice({ text, tone = 'info', action }: NoticeProps) {
  const theme = TONE[tone]
  return (
    <View
      style={[styles.base, { backgroundColor: theme.bg, borderColor: theme.border }]}
      accessibilityRole="alert"
    >
      <Ionicons name={theme.name} size={18} color={theme.fg} />
      <Text style={[styles.text, { color: theme.fg }]}>{text}</Text>
      {action && (
        <Text style={styles.action} onPress={action.onPress} accessibilityRole="button">
          {action.label}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  text: {
    ...type.caption,
    flex: 1,
  },
  action: {
    ...type.caption,
    color: colors.accent,
    fontWeight: '600',
    paddingVertical: spacing.xs,
  },
})
