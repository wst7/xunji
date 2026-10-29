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
  // 域名要有后缀，但也允许 localhost 这类局域网地址。
  if (!host.replace(/:\d+$/, '').includes('.') && !/^localhost(:\d+)?$/.test(host)) return null

  let path = match[3] || '/'
  const query = match[4] ?? ''

  const junk = /^(utm_|fbclid|gclid|spm|share_|ref$|source$|from$)/i
  const kept = query
    .split('&')
    .filter(Boolean)
    .filter((pair) => {
      const rawKey = pair.split('=')[0] ?? ''
      let key = rawKey
      try {
        key = decodeURIComponent(rawKey)
      } catch {
        // 非法的百分号编码按原文判断，不能让整条链接保存失败。
      }
      return !junk.test(key)
    })

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

/**
 * 分享 / 剪贴板里通常同时带着标题和链接。取链接以外的第一行非空文字，
 * 作为标题种子；抓不到正文时至少还能显示“这是什么”，而不是一串网址。
 */
export function titleHintFrom(text: string, url: string): string | null {
  const withoutUrl = text.split(url).join('\n').replace(/https?:\/\/\S+/g, '\n')
  for (const raw of withoutUrl.split('\n')) {
    const line = raw
      .replace(/^(?:分享|分享自|来自|文章|标题|链接)\s*[：:]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (line.length < 2) continue
    if (/^[\s，。、；：！？·…—\-()（）【】“”‘’"'.,;:!?]+$/.test(line)) continue
    return oneLine(line, 140)
  }
  return null
}

/** 根据域名判断来源类型；只影响展示，不改变抓取逻辑。 */
export function sourceTypeOf(url: string): 'web' | 'wechat' | 'github' | 'youtube' | 'bilibili' | 'twitter' {
  const host = hostOf(url).replace(/:\d+$/, '')
  if (host === 'mp.weixin.qq.com') return 'wechat'
  if (host === 'github.com' || host.endsWith('.github.com') || host === 'gist.github.com') return 'github'
  if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return 'youtube'
  if (host === 'bilibili.com' || host.endsWith('.bilibili.com') || host === 'b23.tv') return 'bilibili'
  if (host === 'x.com' || host === 'twitter.com' || host.endsWith('.twitter.com')) return 'twitter'
  return 'web'
}
