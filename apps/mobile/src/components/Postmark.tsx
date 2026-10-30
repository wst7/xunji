import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import type { ParseStatus } from '@xunji/shared'
import { STATUS_TEXT, formatDate } from '@xunji/shared'

import { useLiveStatus } from '../hooks/useLiveStatus'
import { useTheme, withAlpha } from '../theme'

/**
 * 邮戳形状编码状态（先看形，再看色）：实圈＝完成，虚圈＝整理中，
 * 划销＝部分/失败。日期用等宽数字，账簿式对齐。
 *
 * 整枚戳不自带旋转——旋转属于「盖」这个动作，由调用方给出
 * （静态票面 −8deg；保存动画从 −24deg 弹压到 −8deg）。
 */
const SHAPE_BY_STATUS: Record<ParseStatus, 'solid' | 'dashed' | 'struck'> = {
  pending: 'dashed',
  fetching: 'dashed',
  parsing: 'dashed',
  analyzing: 'dashed',
  indexing: 'dashed',
  completed: 'solid',
  partial: 'struck',
  failed: 'struck',
}

interface PostmarkProps {
  savedAt: string
  status: ParseStatus
  /** 56 = 票面，60 = 最强命中，64 = 详情页。 */
  size?: number
  style?: StyleProp<ViewStyle>
}

export function Postmark({ savedAt, status, size = 56, style }: PostmarkProps) {
  const theme = useTheme()
  const shape = SHAPE_BY_STATUS[status]
  const date = new Date(savedAt)
  const valid = !Number.isNaN(date.getTime())
  const year = valid ? String(date.getFullYear()) : '—'
  const monthDay = valid
    ? `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
    : '—'

  const ink = theme.colors.text
  const ringWidth = size >= 60 ? 1.75 : 1.25
  const strikeColor =
    status === 'failed'
      ? theme.colors.error
      : status === 'partial'
        ? theme.colors.warning
        : ink

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`邮戳 ${formatDate(savedAt)}，${STATUS_TEXT[status]}`}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          borderStyle: shape === 'dashed' ? 'dashed' : 'solid',
          borderColor: ink,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: 5,
          left: 5,
          right: 5,
          bottom: 5,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: withAlpha(ink, 0.45),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: Math.max(8, Math.round(size * 0.15)),
            letterSpacing: 0.8,
            fontWeight: '500',
            color: withAlpha(ink, 0.7),
          }}
        >
          {year}
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: Math.round(size * 0.2),
            fontWeight: '700',
            color: ink,
          }}
        >
          {monthDay}
        </Text>
      </View>
      {shape === 'struck' && (
        <View
          style={{
            position: 'absolute',
            left: -3,
            right: -3,
            height: 1.5,
            top: size / 2 - 0.75,
            backgroundColor: strikeColor,
            borderRadius: 1,
            transform: [{ rotate: '-14deg' }],
          }}
        />
      )}
    </View>
  )
}

interface LivePostmarkProps extends PostmarkProps {
  docId: string
  /** 与 LiveStatusBadge 相同：到达终态时回调一次（提示、刷新都挂这里）。 */
  onTerminal?: (status: ParseStatus) => void
}

/** 挂本机轮询的销戳：处理中的票会自己从虚圈变成实圈或划销。 */
export function LivePostmark({
  docId,
  status: initialStatus,
  onTerminal,
  ...rest
}: LivePostmarkProps) {
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  useLiveStatus(docId, status, setStatus, onTerminal)

  return <Postmark {...rest} status={status} />
}
