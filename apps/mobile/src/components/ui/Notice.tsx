import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'

import { makeStyles, useTheme } from '../../theme'
import type { AppTheme } from '../../theme'

type Tone = 'info' | 'warning' | 'error'
type IconName = ComponentProps<typeof Ionicons>['name']

interface NoticeProps {
  text: string
  tone?: Tone
  action?: { label: string; onPress: () => void }
}

function toneFor(theme: AppTheme, tone: Tone): { icon: IconName; bg: string; fg: string } {
  switch (tone) {
    case 'warning':
      return {
        icon: 'warning-outline',
        bg: theme.colors.warningContainer,
        fg: theme.colors.onWarningContainer,
      }
    case 'error':
      return {
        icon: 'alert-circle-outline',
        bg: theme.colors.errorContainer,
        fg: theme.colors.onErrorContainer,
      }
    case 'info':
    default:
      return {
        icon: 'information-circle-outline',
        bg: theme.colors.surfaceContainerHigh,
        fg: theme.colors.onSurfaceVariant,
      }
  }
}

/** 色块 banner：用 container 色表达语气，不再叠描边。 */
export function Notice({ text, tone = 'info', action }: NoticeProps) {
  const appTheme = useTheme()
  const styles = useStyles()
  const palette = toneFor(appTheme, tone)

  return (
    <View style={[styles.base, { backgroundColor: palette.bg }]} accessibilityRole="alert">
      <Ionicons name={palette.icon} size={20} color={palette.fg} />
      <Text style={[styles.text, { color: palette.fg }]}>{text}</Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [styles.actionHit, pressed && styles.pressed]}
        >
          <Text style={[styles.action, { color: palette.fg }]}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.shape.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  text: {
    ...theme.type.bodyMedium,
    flex: 1,
  },
  actionHit: {
    minHeight: 32,
    justifyContent: 'center',
  },
  action: {
    ...theme.type.labelLarge,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
}))
