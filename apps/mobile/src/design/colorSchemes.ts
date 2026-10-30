/**
 * Material Design 3 color roles — 集邮册与销戳 (stamp album & postmark).
 *
 * Generated from the world's seeds with @material/material-color-utilities
 * (0.3.0): vermilion #c2402c (pressed to #b53823 as light primary so
 * vermilion text clears 4.5:1 on every surface), ink violet #2e2742,
 * album green #35564a; neutral ramps keep the paper #f3ede0 / cloth #1c2422
 * hues at low chroma. surfaceContainerLowest is pinned warm (#fffdf7):
 * the HCT solver drifts bluish at tone 99, which reads dirty on paper.
 *
 * Every on-/container pair the UI renders was checked against WCAG 4.5:1
 * (3:1 for outlines and large icons) before committing. Regenerate rather
 * than hand-editing individual tones: each role is tonally paired with its
 * `on-` role, and changing one breaks contrast.
 */

export const lightRoles = {
  primary: '#b53823',
  onPrimary: '#ffffff',
  primaryContainer: '#ffdad4',
  onPrimaryContainer: '#400200',
  secondary: '#625a78',
  onSecondary: '#ffffff',
  secondaryContainer: '#e8ddff',
  onSecondaryContainer: '#1e1731',
  tertiary: '#446559',
  onTertiary: '#ffffff',
  tertiaryContainer: '#c6ebdb',
  onTertiaryContainer: '#002117',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',
  success: '#006d30',
  onSuccess: '#ffffff',
  successContainer: '#95f8a7',
  onSuccessContainer: '#00210a',
  warning: '#9b4500',
  onWarning: '#ffffff',
  warningContainer: '#ffdbca',
  onWarningContainer: '#331200',
  background: '#f3ede0',
  onBackground: '#2e2742',
  surface: '#f3ede0',
  onSurface: '#2e2742',
  surfaceVariant: '#e7e2d9',
  onSurfaceVariant: '#55524b',
  surfaceDim: '#ded9d1',
  surfaceBright: '#fbf6ed',
  surfaceContainerLowest: '#fffdf7',
  surfaceContainerLow: '#fbf6ed',
  surfaceContainer: '#f4efe5',
  surfaceContainerHigh: '#ede8de',
  surfaceContainerHighest: '#e7e2d9',
  surfaceTint: '#b53823',
  outline: '#827e77',
  outlineVariant: '#cbc6bd',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#3f3753',
  inverseOnSurface: '#f6f0e7',
  inversePrimary: '#ffb4a6',
} as const

/** Same keys as the light scheme, checked at compile time. */
export const darkRoles: Record<ColorRole, string> = {
  primary: '#ff8f73',
  onPrimary: '#670600',
  primaryContainer: '#8c1809',
  onPrimaryContainer: '#ffdad4',
  secondary: '#ccc1e4',
  onSecondary: '#332c48',
  secondaryContainer: '#4a425f',
  onSecondaryContainer: '#e8ddff',
  tertiary: '#aacebf',
  onTertiary: '#15362b',
  tertiaryContainer: '#2c4d41',
  onTertiaryContainer: '#c6ebdb',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffb4ab',
  success: '#79db8d',
  onSuccess: '#003916',
  successContainer: '#005323',
  onSuccessContainer: '#95f8a7',
  warning: '#ffb68e',
  onWarning: '#532200',
  warningContainer: '#763300',
  onWarningContainer: '#ffdbca',
  background: '#1c2422',
  onBackground: '#eae5d6',
  surface: '#1c2422',
  onSurface: '#eae5d6',
  surfaceVariant: '#434846',
  onSurfaceVariant: '#c8cdcb',
  surfaceDim: '#1e2321',
  surfaceBright: '#434846',
  surfaceContainerLowest: '#181d1b',
  surfaceContainerLow: '#242927',
  surfaceContainer: '#2a2f2e',
  surfaceContainerHigh: '#333836',
  surfaceContainerHighest: '#3c413f',
  surfaceTint: '#ff8f73',
  outline: '#8d9290',
  outlineVariant: '#434846',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#ede8de',
  inverseOnSurface: '#3f3753',
  inversePrimary: '#ad311f',
}

export type ColorRole = keyof typeof lightRoles
