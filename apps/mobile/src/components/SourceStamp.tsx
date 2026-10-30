import { Text, View } from 'react-native'
import { domainOf } from '@xunji/shared'

import { useTheme } from '../theme'

interface SourceStampProps {
  url: string
  siteName: string | null
  /** 齿孔色＝这张票贴着的底纸颜色，打穿后露出的就是它。 */
  hole: string
  /** 40 = 常规票，44 = 最强命中（更重的视觉重量）。 */
  size?: number
}

/**
 * 来源邮票：站点稳定决定票面颜色（tint），首字压在票面中央，
 * 四周用点状边打齿孔——点＝底纸打穿的孔，这是集邮册里区分票与卡的形状。
 */
export function SourceStamp({ url, siteName, hole, size = 40 }: SourceStampProps) {
  const theme = useTheme()
  const seed = (siteName && siteName.trim()) || domainOf(url).replace(/^www\./i, '') || '拾'
  const tint = theme.tintFor(seed)
  const initial = Array.from(seed.trim())[0] ?? '拾'

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        backgroundColor: tint.bg,
        borderWidth: 3,
        borderStyle: 'dotted',
        borderColor: hole,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: Math.round(size * 0.4),
          lineHeight: Math.round(size * 0.48),
          fontWeight: '600',
          color: tint.fg,
        }}
      >
        {initial}
      </Text>
    </View>
  )
}
