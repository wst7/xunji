export interface Tint {
  bg: string
  fg: string
}

/**
 * Source stamps: a stable hash picks one pair, so the same site always gets
 * the same stamp. Six seeds from the stamp-world palette (vermilion, album
 * green, ink violet, ochre, wine, postal blue) run through the same tonal
 * method as the main scheme — tone 90/10 in light, 35/90 in dark — so every
 * pair clears 4.5:1 in both modes.
 */
export const lightTints: readonly Tint[] = [
  { bg: '#ffdad4', fg: '#400200' },
  { bg: '#c6ebdb', fg: '#002117' },
  { bg: '#e8ddff', fg: '#1e1731' },
  { bg: '#ffdf97', fg: '#251a00' },
  { bg: '#ffd9e3', fg: '#3a071e' },
  { bg: '#c6e7ff', fg: '#001e2d' },
]

export const darkTints: readonly Tint[] = [
  { bg: '#9d2514', fg: '#ffdad4' },
  { bg: '#38594d', fg: '#c6ebdb' },
  { bg: '#564e6b', fg: '#e8ddff' },
  { bg: '#684f00', fg: '#ffdf97' },
  { bg: '#7e3e55', fg: '#ffd9e3' },
  { bg: '#175877', fg: '#c6e7ff' },
]

export function tintFor(seed: string, tints: readonly Tint[]): Tint {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return tints[hash % tints.length]
}
