import { Platform } from 'react-native'
import type { TextStyle } from 'react-native'

/**
 * 冷中性 + 单一靛蓝强调色。
 * 画布是浅冷灰、卡片是纯白、文字接近纯黑，靠层次而不是暖色纸纹制造质感；
 * 强调色只出现在可操作项与当前选中态，避免满屏彩色。
 */
export const colors = {
  paper: '#F4F5F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EFF1F5',
  ink: '#0E1116',
  inkSoft: '#333A45',
  muted: '#5A6472',
  faint: '#6B7482',
  line: '#E7EAF0',
  lineSoft: '#F0F2F6',
  lineStrong: '#D5DAE3',
  accent: '#4F46E5',
  accentDeep: '#3730A3',
  accentSoft: '#EEF0FF',
  accentLine: '#DDE0FF',
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
  tabInactive: '#6B7482',
  panel: '#161B25',
  panelSoft: '#A6AFBE',
  panelBar: '#7C77FF',
} as const

/** 域名首字的底色：同一来源始终同一色，列表看起来有节奏但不花。 */
export const tints = [
  { bg: '#EEF0FF', fg: '#4338CA' },
  { bg: '#E7F4F0', fg: '#0F766E' },
  { bg: '#FDF1E7', fg: '#B45309' },
  { bg: '#FDEDF2', fg: '#BE185D' },
  { bg: '#EAF2FE', fg: '#1D4ED8' },
  { bg: '#F3EDFD', fg: '#6D28D9' },
] as const

/** 由域名稳定地取一个色块，同一来源永远同色。 */
export function tintFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return tints[hash % tints.length]
}

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
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontFamily: fonts.display, fontSize: 15, lineHeight: 23, fontWeight: '400' },
  caption: { fontFamily: fonts.display, fontSize: 12.5, lineHeight: 18, fontWeight: '400' },
} satisfies Record<string, TextStyle>

export const radius = { control: 14, card: 20, pill: 999 } as const

/** 8 点栅格：所有间距取 4 / 8 / 12 / 16 / 24 / 32。 */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

/** 最小可点击区域 44×44。 */
export const touch = 44

/** 悬浮标签栏占用的额外高度，滚动内容据此留出底部空间。 */
export const layout = { tabBarSpace: 112 } as const

/** 阴影用中性冷灰，不偏褐；卡片靠柔和投影浮起，不再叠一圈描边。 */
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  accent: {
    shadowColor: '#4F46E5',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  /** 首页主操作面板：比普通卡片更沉一点，让“提问”成为视觉入口。 */
  action: {
    shadowColor: '#101828',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
} as const
