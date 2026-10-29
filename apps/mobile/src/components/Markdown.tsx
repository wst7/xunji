import type { ReactNode } from 'react'
import { Linking, Text, View } from 'react-native'

import { makeStyles } from '../theme'
import type { AppTheme } from '../theme'

/**
 * 受限 Markdown 渲染器：标题、段落、列表、引用、代码块、行内代码/粗体/斜体、
 * http(s) 链接。文本始终作为 Text 子节点输出，不解析原始 HTML，也不使用 WebView。
 * 样式由主题生成，渲染函数显式接收，切换明暗时随之更新。
 */

const INLINE_PATTERN = /(`[^`]+`|\*\*[^*]+?\*\*|\*[^*]+?\*|\[[^\]]+\]\([^)\s]+\))/g

type MdStyles = ReturnType<typeof markdownStyles>

function renderInline(text: string, keyPrefix: string, styles: MdStyles): ReactNode[] {
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
          {renderInline(part.slice(2, -2), key, styles)}
        </Text>,
      )
      return
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      nodes.push(
        <Text key={key} style={styles.italic}>
          {renderInline(part.slice(1, -1), key, styles)}
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
  const styles = useStyles()
  const blocks = renderBlocks(source, styles)
  return <View>{blocks.map((block) => block.node)}</View>
}

function renderBlocks(source: string, styles: MdStyles): Block[] {
  const lines = source.split(/\r?\n/)
  const blocks: Block[] = []
  const state = {
    paragraph: [] as string[],
    listItems: [] as string[],
    ordered: false,
    inFence: false,
    fenceBuffer: [] as string[],
    seq: 0,
  }

  const nextKey = (prefix: string) => {
    const key = `${prefix}-${state.seq}`
    state.seq += 1
    return key
  }

  const flushParagraph = () => {
    if (state.paragraph.length === 0) return
    const key = nextKey('p')
    blocks.push({
      key,
      node: (
        <Text key={key} style={styles.paragraph}>
          {renderInline(state.paragraph.join(' '), key, styles)}
        </Text>
      ),
    })
    state.paragraph = []
  }

  const flushList = () => {
    if (state.listItems.length === 0) return
    const key = nextKey('list')
    const items = state.listItems.map((item, i) => (
      <View key={`${key}-${i}`} style={styles.listRow}>
        <Text style={[styles.listMarker, state.ordered && styles.listMarkerOrdered]}>
          {state.ordered ? `${i + 1}.` : '·'}
        </Text>
        <Text style={styles.listText}>{renderInline(item, `${key}-${i}`, styles)}</Text>
      </View>
    ))
    blocks.push({ key, node: <View key={key} style={styles.list}>{items}</View> })
    state.listItems = []
  }

  const flushAll = () => {
    flushParagraph()
    flushList()
  }

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (state.inFence) {
        const key = nextKey('code')
        blocks.push({
          key,
          node: (
            <View key={key} style={styles.codeBlock}>
              <Text style={styles.codeText} selectable>
                {state.fenceBuffer.join('\n')}
              </Text>
            </View>
          ),
        })
        state.fenceBuffer = []
        state.inFence = false
      } else {
        flushAll()
        state.inFence = true
      }
      continue
    }

    if (state.inFence) {
      state.fenceBuffer.push(line)
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
      const headingStyle = [
        styles.h1,
        styles.h2,
        styles.h3,
        styles.h4,
        styles.h5,
        styles.h6,
      ][level - 1]
      blocks.push({
        key,
        node: (
          <Text key={key} style={[styles.heading, headingStyle]}>
            {renderInline(heading[2], key, styles)}
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
            <Text style={styles.quoteText}>{renderInline(quote[1], key, styles)}</Text>
          </View>
        ),
      })
      continue
    }

    const unorderedItem = /^[-*]\s+(.*)$/.exec(trimmed)
    if (unorderedItem) {
      flushParagraph()
      if (state.ordered) flushList()
      state.ordered = false
      state.listItems.push(unorderedItem[1])
      continue
    }

    const orderedItem = /^\d+\.\s+(.*)$/.exec(trimmed)
    if (orderedItem) {
      flushParagraph()
      if (!state.ordered) flushList()
      state.ordered = true
      state.listItems.push(orderedItem[1])
      continue
    }

    flushList()
    state.paragraph.push(trimmed)
  }

  if (state.inFence && state.fenceBuffer.length > 0) {
    const key = nextKey('code')
    blocks.push({
      key,
      node: (
        <View key={key} style={styles.codeBlock}>
          <Text style={styles.codeText} selectable>
            {state.fenceBuffer.join('\n')}
          </Text>
        </View>
      ),
    })
  }
  flushAll()

  return blocks
}

function markdownStyles(theme: AppTheme) {
  const heading = {
    ...theme.type.titleMedium,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  }
  return {
    paragraph: {
      ...theme.type.bodyLarge,
      lineHeight: 27,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    heading,
    h1: { ...theme.type.headlineMedium },
    h2: { ...theme.type.headlineSmall },
    h3: { ...theme.type.titleLarge },
    h4: { ...theme.type.titleMedium },
    h5: { ...theme.type.titleSmall },
    h6: { ...theme.type.labelLarge },
    listRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.sm,
      marginBottom: 6,
    },
    list: {
      marginBottom: theme.spacing.md,
    },
    listMarker: {
      ...theme.type.bodyLarge,
      lineHeight: 26,
      width: 14,
      color: theme.colors.primary,
    },
    listMarkerOrdered: {
      width: 24,
      color: theme.colors.textMuted,
      ...theme.type.bodyMedium,
    },
    listText: {
      ...theme.type.bodyLarge,
      lineHeight: 26,
      flex: 1,
      color: theme.colors.text,
    },
    quote: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.outlineVariant,
      paddingLeft: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    quoteText: {
      ...theme.type.bodyMedium,
      lineHeight: 24,
      color: theme.colors.textMuted,
    },
    codeBlock: {
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderRadius: theme.shape.sm,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    codeText: {
      fontFamily: theme.fonts.mono,
      color: theme.colors.text,
      fontSize: 12.5,
      lineHeight: 19,
    },
    inlineCode: {
      fontFamily: theme.fonts.mono,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.surfaceContainerHighest,
    },
    bold: {
      fontWeight: '600' as const,
      color: theme.colors.text,
    },
    italic: {
      fontStyle: 'italic' as const,
    },
    link: {
      color: theme.colors.primary,
      textDecorationLine: 'underline' as const,
    },
  }
}

const useStyles = makeStyles(markdownStyles)
