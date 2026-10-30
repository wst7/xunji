import type { ParseStatus, StatusTone } from '@xunji/shared'
import { STATUS_TEXT, statusTone } from '@xunji/shared'
import { Text, View } from 'react-native'

import { makeStyles, useTheme } from '../theme'
import type { AppTheme } from '../theme'

function toneFor(theme: AppTheme, tone: StatusTone): { bg: string; fg: string } {
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

/**
 * 与 Postmark 同一套形语义：虚圈＝整理中，划销＝部分/失败；文字始终在。
 * 环内保持透明——填充会盖住 dash，虚圈就退化成实心点了。
 */
function ringStyle(status: ParseStatus, fg: string) {
  const struck = status === 'partial' || status === 'failed'
  return {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: struck ? ('solid' as const) : ('dashed' as const),
    borderColor: fg,
    backgroundColor: 'transparent' as const,
  }
}

/** completed 是默认结果，不再占用视觉噪音。MD3 assist chip，保留状态环。 */
export function StatusBadge({ status }: { status: ParseStatus }) {
  const theme = useTheme()
  const styles = useStyles()
  if (status === 'completed') return null
  const tone = toneFor(theme, statusTone(status))
  const struck = status === 'partial' || status === 'failed'
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <View style={ringStyle(status, tone.fg)}>
        {struck && <View style={[styles.strike, { backgroundColor: tone.fg }]} />}
      </View>
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
  strike: {
    position: 'absolute',
    left: -2,
    right: -2,
    height: 1.5,
    top: 4.75,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
  text: {
    ...theme.type.labelMedium,
    fontWeight: '600',
  },
}))
