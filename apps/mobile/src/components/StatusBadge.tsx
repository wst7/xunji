import type { ParseStatus } from '@recall/shared'
import { STATUS_TEXT, statusTone } from '@recall/shared'
import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, type } from '../theme'

const TONE = {
  accent: { fg: colors.accent, bg: colors.accentSoft },
  success: { fg: colors.success, bg: colors.successSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  error: { fg: colors.error, bg: colors.errorSoft },
} as const

/** completed 是默认结果，不再占用视觉噪音。 */
export function StatusBadge({ status }: { status: ParseStatus }) {
  if (status === 'completed') return null
  const tone = TONE[statusTone(status)]
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.text, { color: tone.fg }]}>{STATUS_TEXT[status]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...type.caption,
    fontWeight: '600',
  },
})
