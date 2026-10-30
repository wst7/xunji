import { Platform } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'

/**
 * Roboto on Android, SF Pro on iOS, both through the system font stack.
 * No font package: MD3's typeface is the platform default, and a bundled CJK
 * serif would add tens of megabytes for no gain.
 */
export const fontFamilies = {
  sans: Platform.select({ android: 'sans-serif', ios: undefined, default: undefined }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
}

/**
 * MD3 type scale. Chinese runs looser than Latin at the same tracking, so
 * body keeps 0 and only display/headline/title tighten slightly. Labels are
 * tracked (+0.5) and set like cancellation slips — the stamp world's voice —
 * while staying inside MD3's size/weight roles.
 */
export const typeScale = {
  displayLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  headlineLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headlineMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.35,
  },
  headlineSmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  titleLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  titleMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  titleSmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  bodyLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  labelLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
} satisfies Record<string, TextStyle>

export const shape = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  lgIncreased: 20,
  xl: 28,
  xlIncreased: 32,
  xxl: 48,
  full: 999,
} as const

/** 8dp grid with 4dp half-steps. */
export const spacingScale = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const

export const layoutTokens = {
  gutter: 16,
  appBarSmall: 64,
  appBarMedium: 112,
  appBarLarge: 152,
  navBarHeight: 80,
  /** Space scrolling content leaves for the navigation bar. */
  navBarClearance: 96,
  fabHeight: 56,
  iconButton: 48,
  minTouch: 48,
  maxContentWidth: 720,
} as const

/** MD3 expressive springs; only used where animation already exists. */
export const motion = {
  duration: { short: 150, medium: 250, long: 400 },
  spring: {
    expressive: { damping: 14, stiffness: 190, mass: 0.8 },
    standard: { damping: 20, stiffness: 230, mass: 0.9 },
    snappy: { damping: 26, stiffness: 320, mass: 0.8 },
  },
} as const

export type ElevationLevel = 'level0' | 'level1' | 'level2' | 'level3'

export type Elevation = Record<ElevationLevel, ViewStyle>

/**
 * Elevation is carried by the surface-container tones; these shadows only add
 * separation where two surfaces meet. Dark mode gets softer opacity because
 * black shadows disappear into a dark canvas.
 */
export function elevationFor(dark: boolean): Elevation {
  const shadowOpacity = dark ? 0.42 : 0.12
  return {
    level0: { elevation: 0, shadowOpacity: 0 },
    level1: {
      shadowColor: 'black',
      shadowOpacity: dark ? 0.3 : 0.07,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    level2: {
      shadowColor: 'black',
      shadowOpacity: dark ? 0.38 : 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    level3: {
      shadowColor: 'black',
      shadowOpacity: shadowOpacity,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  }
}
