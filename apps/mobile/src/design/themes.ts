import { darkRoles, lightRoles } from './colorSchemes'
import type { ColorRole } from './colorSchemes'
import { darkTints, lightTints, tintFor as pickTint } from './tints'
import type { Tint } from './tints'
import {
  elevationFor,
  fontFamilies,
  layoutTokens,
  motion,
  shape,
  spacingScale,
  typeScale,
} from './tokens'

/**
 * Raw MD3 roles plus semantic aliases. Aliases exist because the role that
 * means "card" in light (surfaceContainerLowest) is darker than the canvas in
 * dark; `card` flips to surfaceContainerLow so cards always sit above it.
 */
export type AppColors = Record<ColorRole, string> & {
  canvas: string
  card: string
  cardMuted: string
  field: string
  divider: string
  text: string
  textMuted: string
}

export interface AppTheme {
  scheme: 'light' | 'dark'
  dark: boolean
  colors: AppColors
  tints: readonly Tint[]
  tintFor: (seed: string) => Tint
  type: typeof typeScale
  shape: typeof shape
  spacing: typeof spacingScale
  elevation: ReturnType<typeof elevationFor>
  motion: typeof motion
  layout: typeof layoutTokens
  fonts: typeof fontFamilies
}

function colorsFor(roles: Record<ColorRole, string>, dark: boolean): AppColors {
  return {
    ...roles,
    canvas: roles.surface,
    card: dark ? roles.surfaceContainerLow : roles.surfaceContainerLowest,
    cardMuted: dark ? roles.surfaceContainerHigh : roles.surfaceContainerLow,
    field: roles.surfaceContainerHighest,
    divider: roles.outlineVariant,
    text: roles.onSurface,
    textMuted: roles.onSurfaceVariant,
  }
}

function buildTheme(scheme: 'light' | 'dark'): AppTheme {
  const dark = scheme === 'dark'
  const roles = dark ? darkRoles : lightRoles
  const colors = colorsFor(roles, dark)
  const tints = dark ? darkTints : lightTints
  return {
    scheme,
    dark,
    colors,
    tints,
    tintFor: (seed: string) => pickTint(seed, tints),
    type: typeScale,
    shape,
    spacing: spacingScale,
    elevation: elevationFor(dark, colors.primary),
    motion,
    layout: layoutTokens,
    fonts: fontFamilies,
  }
}

/** Module-level identities: the style cache is keyed on these objects. */
export const lightTheme = buildTheme('light')
export const darkTheme = buildTheme('dark')
