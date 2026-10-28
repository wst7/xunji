/** 本地层的小工具：URL 规范化、id、时间。不依赖 DOM 或 Node。 */

export function nowIso(): string {
  return new Date().toISOString()
}

/** 设备内的稳定 id。没有 crypto.randomUUID 时退化为时间戳 + 随机数。 */
export function newId(): string {
  const rnd = () => Math.random().toString(36).slice(2, 10)
  return `${Date.now().toString(36)}-${rnd()}-${rnd()}`
}

/**
 * 收藏去重用的规范化 URL：小写协议与主机、去掉 fragment、去掉末尾斜杠、
 * 去掉常见的跟踪参数。返回 null 表示不是可保存的 http(s) 链接。
 *
 * 这里不用 URL / URLSearchParams：React Native 的 polyfill 对后者的支持
 * 并不完整，手写解析在 iOS / Android / Hermes 上行为一致。
 */
export function normalizeUrl(raw: string): string | null {
  let input = raw.trim()
  if (!input) return null
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`

  const match = /^(https?):\/\/([^/?#\s]+)([^?#\s]*)(?:\?([^#\s]*))?/i.exec(input)
  if (!match) return null

  const protocol = `${match[1].toLowerCase()}:`
  const host = match[2].toLowerCase()
  if (!host.includes('.')) return null

  let path = match[3] || '/'
  const query = match[4] ?? ''

  const junk = /^(utm_|fbclid|gclid|spm|share_|ref$|source$|from$)/i
  const kept = query
    .split('&')
    .filter(Boolean)
    .filter((pair) => !junk.test(decodeURIComponent(pair.split('=')[0] ?? '')))

  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  const search = kept.length > 0 ? `?${kept.join('&')}` : ''
  return `${protocol}//${host}${path}${search}`
}

export function hostOf(url: string): string {
  const match = /^https?:\/\/([^/?#\s]+)/i.exec(url.trim())
  return (match?.[1] ?? url).toLowerCase().replace(/^www\./, '')
}

export function parseJsonArray(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function parseJsonObject(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

/** 把任意文本压成一行，用于标题/摘要这类单行展示。 */
export function oneLine(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}
