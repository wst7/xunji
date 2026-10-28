import { hostOf, oneLine } from './util'

/**
 * 在手机上抓取并抽取正文。
 *
 * 不引入 Readability / jsdom 这类依赖：React Native 里没有 DOMParser，
 * 也不该为了打开一篇文章塞进一个浏览器环境。这里用一套克制的启发式：
 * 优先 <article> / <main>，去掉脚本、导航、页脚，再把常见块级标签
 * 变成 Markdown，交给 App 自己的受限渲染器显示。
 */
export interface ExtractedArticle {
  url: string
  title: string | null
  siteName: string | null
  author: string | null
  description: string | null
  language: string | null
  markdown: string
  plainText: string
}

const MAX_HTML_CHARS = 2_000_000
const FETCH_TIMEOUT_MS = 25_000

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  copy: '©',
  reg: '®',
  middot: '·',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
}

export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
    if (code.startsWith('#')) {
      const num = code[1]?.toLowerCase() === 'x'
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10)
      if (!Number.isFinite(num)) return whole
      try {
        return String.fromCodePoint(num)
      } catch {
        return whole
      }
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? whole
  })
}

function metaMap(html: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    const value = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]
    if (key && value) map.set(key.toLowerCase(), decodeEntities(value).trim())
  }
  return map
}

function firstMatch(html: string, pattern: RegExp): string | null {
  const match = pattern.exec(html)
  return match?.[1] ? match[1] : null
}

function stripBlocks(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|form|template|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
}

function pickBody(html: string): string {
  const candidates = [
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i,
  ]
  for (const pattern of candidates) {
    const body = firstMatch(html, pattern)
    if (!body) continue
    const stripped = stripBlocks(body).replace(/<[^>]+>/g, ' ')
    if (decodeEntities(stripped).replace(/\s+/g, '').length >= 200) return stripBlocks(body)
  }
  return stripBlocks(html)
}

function toMarkdown(html: string): string {
  let text = html
    .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_whole, code: string) => {
      const clean = decodeEntities(code.replace(/<[^>]+>/g, '')).trim()
      return clean ? `\n\n\`\`\`\n${clean}\n\`\`\`\n\n` : ' '
    })
    .replace(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_w, _lvl, inner: string) => `\n\n## ${inner.replace(/<[^>]+>/g, ' ')}\n\n`)
    .replace(/<h[4-6]\b[^>]*>([\s\S]*?)<\/h[4-6]>/gi, (_w, inner: string) => `\n\n### ${inner.replace(/<[^>]+>/g, ' ')}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_w, inner: string) => `\n- ${inner.replace(/<[^>]+>/g, ' ')}`)
    .replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_w, inner: string) => `\n> ${inner.replace(/<[^>]+>/g, ' ')}`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|main|li|blockquote|tr|table|ul|ol)>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')

  text = decodeEntities(text)
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^-\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

export function extractFromHtml(html: string, url: string): ExtractedArticle {
  const meta = metaMap(html)
  const rawTitle = meta.get('og:title') ?? meta.get('twitter:title')
    ?? firstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i)
    ?? firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  const title = rawTitle ? oneLine(decodeEntities(rawTitle.replace(/<[^>]+>/g, ' ')), 220) : null

  const description = meta.get('og:description') ?? meta.get('description') ?? meta.get('twitter:description') ?? null
  const siteName = meta.get('og:site_name') ?? hostOf(url)
  const author = meta.get('article:author') ?? meta.get('author') ?? null
  const language = firstMatch(html, /<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i)

  const markdown = toMarkdown(pickBody(html))
  const plainText = toPlainText(markdown)

  return {
    url,
    title,
    siteName: siteName ? oneLine(siteName, 80) : null,
    author: author ? oneLine(author, 80) : null,
    description: description ? oneLine(description, 300) : null,
    language: language ? language.slice(0, 16) : null,
    markdown,
    plainText,
  }
}

export async function fetchArticle(url: string): Promise<ExtractedArticle> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Xunji/0.1; local-first)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    })
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const contentType = response.headers.get('content-type') ?? ''
  const raw = (await response.text()).slice(0, MAX_HTML_CHARS)

  if (!/html|xml/i.test(contentType) && !/<html|<body|<article/i.test(raw.slice(0, 2000))) {
    const text = raw.trim()
    return {
      url,
      title: hostOf(url),
      siteName: hostOf(url),
      author: null,
      description: text ? oneLine(text, 300) : null,
      language: null,
      markdown: text,
      plainText: text,
    }
  }

  return extractFromHtml(raw, url)
}
