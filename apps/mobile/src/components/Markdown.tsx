import type { ReactNode } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'

import { colors, fonts, radius } from '../theme'

/**
 * 受限 Markdown 渲染器：标题、段落、列表、引用、代码块、行内代码/粗体/斜体、
 * http(s) 链接。文本始终作为 Text 子节点输出，不解析原始 HTML，也不使用 WebView。
 */

const INLINE_PATTERN = /(`[^`]+`|\*\*[^*]+?\*\*|\*[^*]+?\*|\[[^\]]+\]\([^)\s]+\))/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const parts = text.split(INLINE_PATTERN)

  parts.forEach((part, i) => {
    if (!part) return
    const key = `${keyPrefix}-${i}`

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      nodes.push(
        <Text key={key} style={styles.inlineCode}>
          {part.slice(1, -1)}
        </Text>,
      )
      return
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      nodes.push(
        <Text key={key} style={styles.bold}>
          {renderInline(part.slice(2, -2), key)}
        </Text>,
      )
      return
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      nodes.push(
        <Text key={key} style={styles.italic}>
          {renderInline(part.slice(1, -1), key)}
        </Text>,
      )
      return
    }

    const linkMatch = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (linkMatch && /^https?:\/\//i.test(linkMatch[2])) {
      nodes.push(
        <Text
          key={key}
          style={styles.link}
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(linkMatch[2]).catch(() => undefined)
          }}
        >
          {linkMatch[1]}
        </Text>,
      )
      return
    }

    nodes.push(part)
  })

  return nodes
}

interface Block {
  key: string
  node: ReactNode
}

export function Markdown({ source }: { source: string }) {
  const blocks = renderBlocks(source)
  return <View>{blocks.map((block) => block.node)}</View>
}

function renderBlocks(source: string): Block[] {
  const lines = source.split(/\r?\n/)
  const blocks: Block[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let ordered = false
  let inFence = false
  let fenceBuffer: string[] = []
  let seq = 0

  const nextKey = (prefix: string) => {
    const key = `${prefix}-${seq}`
    seq += 1
    return key
  }

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const key = nextKey('p')
    blocks.push({
      key,
      node: (
        <Text key={key} style={styles.paragraph}>
          {renderInline(paragraph.join(' '), key)}
        </Text>
      ),
    })
    paragraph = []
  }

  const flushList = () => {
    if (listItems.length === 0) return
    const key = nextKey('list')
    const items = listItems.map((item, i) => (
      <View key={`${key}-${i}`} style={styles.listRow}>
        <Text style={[styles.listMarker, ordered && styles.listMarkerOrdered]}>
          {ordered ? `${i + 1}.` : '·'}
        </Text>
        <Text style={styles.listText}>{renderInline(item, `${key}-${i}`)}</Text>
      </View>
    ))
    blocks.push({ key, node: <View key={key} style={styles.list}>{items}</View> })
    listItems = []
  }

  const flushAll = () => {
    flushParagraph()
    flushList()
  }

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inFence) {
        const key = nextKey('code')
        blocks.push({
          key,
          node: (
            <View key={key} style={styles.codeBlock}>
              <Text style={styles.codeText} selectable>
                {fenceBuffer.join('\n')}
              </Text>
            </View>
          ),
        })
        fenceBuffer = []
        inFence = false
      } else {
        flushAll()
        inFence = true
      }
      continue
    }

    if (inFence) {
      fenceBuffer.push(line)
      continue
    }

    const trimmed = line.trim()
    if (trimmed === '') {
      flushAll()
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flushAll()
      const level = heading[1].length as 1 | 2 | 3 | 4 | 5 | 6
      const key = nextKey('h')
      blocks.push({
        key,
        node: (
          <Text key={key} style={[styles.heading, headingStyles[level]]}>
            {renderInline(heading[2], key)}
          </Text>
        ),
      })
      continue
    }

    const quote = /^>\s?(.*)$/.exec(trimmed)
    if (quote) {
      flushAll()
      const key = nextKey('q')
      blocks.push({
        key,
        node: (
          <View key={key} style={styles.quote}>
            <Text style={styles.quoteText}>{renderInline(quote[1], key)}</Text>
          </View>
        ),
      })
      continue
    }

    const unorderedItem = /^[-*]\s+(.*)$/.exec(trimmed)
    if (unorderedItem) {
      flushParagraph()
      if (ordered) flushList()
      ordered = false
      listItems.push(unorderedItem[1])
      continue
    }

    const orderedItem = /^\d+\.\s+(.*)$/.exec(trimmed)
    if (orderedItem) {
      flushParagraph()
      if (!ordered) flushList()
      ordered = true
      listItems.push(orderedItem[1])
      continue
    }

    flushList()
    paragraph.push(trimmed)
  }

  if (inFence && fenceBuffer.length > 0) {
    const key = nextKey('code')
    blocks.push({
      key,
      node: (
        <View key={key} style={styles.codeBlock}>
          <Text style={styles.codeText} selectable>
            {fenceBuffer.join('\n')}
          </Text>
        </View>
      ),
    })
  }
  flushAll()

  return blocks
}

const headingStyles = StyleSheet.create({
  1: { fontSize: 22, lineHeight: 31 },
  2: { fontSize: 20, lineHeight: 29 },
  3: { fontSize: 18, lineHeight: 27 },
  4: { fontSize: 16, lineHeight: 25 },
  5: { fontSize: 15, lineHeight: 24 },
  6: { fontSize: 14.5, lineHeight: 23 },
})

const styles = StyleSheet.create({
  paragraph: {
    color: colors.inkSoft,
    fontSize: 15.5,
    lineHeight: 27,
    marginBottom: 14,
  },
  heading: {
    fontWeight: '700',
    color: colors.ink,
    marginTop: 8,
    marginBottom: 10,
  },
  listRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  list: {
    marginBottom: 12,
  },
  listMarker: {
    color: colors.accent,
    fontSize: 15.5,
    lineHeight: 26,
    width: 14,
  },
  listMarkerOrdered: {
    width: 22,
    color: colors.muted,
    fontSize: 14,
  },
  listText: {
    flex: 1,
    color: colors.inkSoft,
    fontSize: 15.5,
    lineHeight: 26,
  },
  quote: {
    borderLeftWidth: 2,
    borderLeftColor: colors.lineStrong,
    paddingLeft: 12,
    marginBottom: 14,
  },
  quoteText: {
    color: colors.muted,
    fontSize: 14.5,
    lineHeight: 24,
  },
  codeBlock: {
    backgroundColor: colors.codeBg,
    borderRadius: radius.control,
    padding: 12,
    marginBottom: 14,
  },
  codeText: {
    fontFamily: fonts.mono,
    color: colors.ink,
    fontSize: 12.5,
    lineHeight: 19,
  },
  inlineCode: {
    fontFamily: fonts.mono,
    fontSize: 13.5,
    color: colors.accentDeep,
    backgroundColor: colors.codeBg,
  },
  bold: {
    fontWeight: '600',
    color: colors.ink,
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
})
