import { Platform } from 'react-native'
import type { TextStyle } from 'react-native'

/**
 * 冷中性 + 单一靛蓝强调色。
 * 画布是浅冷灰、卡片是纯白、文字接近纯黑，靠层次而不是暖色纸纹制造质感；
 * 强调色只出现在可操作项与当前选中态，避免满屏彩色。
 */
export const colors = {
  paper: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF0F4',
  ink: '#0E1116',
  inkSoft: '#333A45',
  muted: '#5A6472',
  faint: '#626B79',
  line: '#E6E9EF',
  lineStrong: '#D3D8E0',
  accent: '#4F46E5',
  accentDeep: '#3730A3',
  accentSoft: '#EEF0FF',
  success: '#15803D',
  successSoft: '#E8F6ED',
  warning: '#B45309',
  warningSoft: '#FEF3E2',
  warningLine: '#F2D4A6',
  error: '#C62828',
  errorSoft: '#FDECEC',
  errorLine: '#F3C9C9',
  codeBg: '#F3F4F7',
  white: '#FFFFFF',
  tabInactive: '#626B79',
} as const

/**
 * 系统无衬线：现代 App 的默认选择。
 * iOS 留空即 SF Pro；Android 显式写 sans-serif，中文才不会回退到旧式衬线。
 */
export const fonts = {
  display: Platform.select({ android: 'sans-serif', default: undefined }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
}

export const type = {
  /** 大标题：字重实、字距略收紧，是移动端标题最稳的做法。 */
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 37, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontFamily: fonts.display, fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontFamily: fonts.display, fontSize: 15, lineHeight: 23, fontWeight: '400' },
  caption: { fontFamily: fonts.display, fontSize: 12.5, lineHeight: 18, fontWeight: '400' },
} satisfies Record<string, TextStyle>

export const radius = { control: 12, card: 18, pill: 999 } as const

/** 8 点栅格：所有间距取 4 / 8 / 12 / 16 / 24 / 32。 */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

/** 最小可点击区域 44×44。 */
export const touch = 44

/** 阴影用中性冷灰，不偏褐；卡片靠柔和投影浮起，不再叠一圈描边。 */
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
} as const
