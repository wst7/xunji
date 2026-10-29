export interface Tint {
  bg: string
  fg: string
}

/**
 * Source avatars: a stable hash picks one pair, so the same site always gets
 * the same color. Containers come from six seeds run through the same tonal
 * method as the main scheme, which is why they hold up in dark mode.
 */
export const lightTints: readonly Tint[] = [
  { bg: '#e2dfff', fg: '#0f0069' },
  { bg: '#72f7ea', fg: '#00201d' },
  { bg: '#ffdbca', fg: '#331200' },
  { bg: '#ffd9e0', fg: '#3f0019' },
  { bg: '#dce1ff', fg: '#001551' },
  { bg: '#ebddff', fg: '#250059' },
]

export const darkTints: readonly Tint[] = [
  { bg: '#3323cc', fg: '#e2dfff' },
  { bg: '#00504a', fg: '#72f7ea' },
  { bg: '#763300', fg: '#ffdbca' },
  { bg: '#8f0042', fg: '#ffd9e0' },
  { bg: '#0039b5', fg: '#dce1ff' },
  { bg: '#5b00c5', fg: '#ebddff' },
]

export function tintFor(seed: string, tints: readonly Tint[]): Tint {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return tints[hash % tints.length]
}
