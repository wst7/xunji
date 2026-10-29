/**
 * State layers, scrims and ripples are defined as `on-*` roles at low opacity.
 * RN styles take rgba strings, so alpha has to be composed from the hex role
 * instead of duplicating a second hex table.
 */
export function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((char) => char + char)
          .join('')
      : raw.slice(0, 6)
  const value = Number.parseInt(full, 16)
  if (full.length !== 6 || Number.isNaN(value)) return hex
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  const a = Math.min(1, Math.max(0, alpha))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
