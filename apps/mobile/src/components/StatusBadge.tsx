import type { ParseStatus } from '@xunji/shared'
import { STATUS_TEXT, statusTone } from '@xunji/shared'
import { Text, View } from 'react-native'

import { makeStyles, useTheme } from '../theme'
import type { AppTheme } from '../theme'

function toneFor(theme: AppTheme, tone: ReturnType<typeof statusTone>): { bg: string; fg: string } {
  switch (tone) {
    case 'success':
      return { bg: theme.colors.successContainer, fg: theme.colors.onSuccessContainer }
    case 'warning':
      return { bg: theme.colors.warningContainer, fg: theme.colors.onWarningContainer }
    case 'error':
      return { bg: theme.colors.errorContainer, fg: theme.colors.onErrorContainer }
    case 'accent':
    default:
      return { bg: theme.colors.secondaryContainer, fg: theme.colors.onSecondaryContainer }
  }
}

/** completed 是默认结果，不再占用视觉噪音。MD3 assist chip，保留状态点。 */
export function StatusBadge({ status }: { status: ParseStatus }) {
  const theme = useTheme()
  const styles = useStyles()
  if (status === 'completed') return null
  const tone = toneFor(theme, statusTone(status))
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.text, { color: tone.fg }]}>{STATUS_TEXT[status]}</Text>
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    borderRadius: theme.shape.sm,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...theme.type.labelMedium,
    fontWeight: '600',
  },
}))
