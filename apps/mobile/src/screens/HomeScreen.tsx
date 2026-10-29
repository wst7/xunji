import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ScrollViewInstance } from 'react-native'
import type { ParseStatus, SearchResult } from '@xunji/shared'
import { errorMessage, STATUS_TEXT } from '@xunji/shared'

import { AppTabBar } from '../components/AppTabBar'
import { AskCard } from '../components/AskCard'
import { SearchResultCard } from '../components/DocumentCard'
import { SaveField } from '../components/SaveField'
import { SearchField } from '../components/SearchField'
import { EmptyState } from '../components/ui/EmptyState'
import { Notice } from '../components/ui/Notice'
import { Screen } from '../components/ui/Screen'
import { processPendingQueue } from '../local/pipeline'
import * as repo from '../local/repo'
import { useLocalRevision } from '../local/useLocalRevision'
import { useToast } from '../providers/ToastProvider'
import { colors, layout, radius, spacing, type } from '../theme'

const APP_NAME = '寻迹'

function terminalToastContent(status: ParseStatus): {
  message: string
  type: 'success' | 'warning' | 'error'
} {
  switch (status) {
    case 'completed':
      return { message: '已完成整理，可以通过描述内容搜索它。', type: 'success' }
    case 'failed':
      return { message: STATUS_TEXT.failed, type: 'error' }
    default:
      return { message: STATUS_TEXT.partial, type: 'warning' }
  }
}

function BrandBar() {
  return (
    <View style={styles.brandbar}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Ionicons name="bookmark" size={15} color={colors.surface} />
        </View>
        <Text style={styles.brandname}>{APP_NAME}</Text>
      </View>
      <View style={styles.localchip}>
        <Ionicons name="shield-checkmark-outline" size={12} color={colors.accent} />
        <Text style={styles.localchipText}>仅本机</Text>
      </View>
    </View>
  )
}

export function HomeScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const revision = useLocalRevision()
  const insets = useSafeAreaInsets()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')

  const inResults = lastQuery.length > 0
  const bottomPad = Math.max(insets.bottom, spacing.sm) + layout.tabBarSpace

  const homeScroll = useRef<ScrollViewInstance>(null)
  const keyboardWait = useRef<{ remove: () => void } | null>(null)

  // 收藏框贴着屏幕底部，键盘弹起后要把它滚进可视区，否则会被键盘挡住。
  const revealSaveField = useCallback(() => {
    const reveal = () => homeScroll.current?.scrollToEnd({ animated: true })
    if (Keyboard.isVisible()) {
      requestAnimationFrame(reveal)
      return
    }
    keyboardWait.current?.remove()
    keyboardWait.current = Keyboard.addListener('keyboardDidShow', () => {
      keyboardWait.current?.remove()
      keyboardWait.current = null
      reveal()
    })
  }, [])

  useEffect(
    () => () => {
      keyboardWait.current?.remove()
    },
    [],
  )

  // 首页聚焦时把积压的本机任务推进一轮（保存、分享、重试都走这里）。
  useFocusEffect(
    useCallback(() => {
      void processPendingQueue()
    }, []),
  )

  // 本地数据变化（例如刚保存的那篇解析完成）时，刷新当前搜索结果。
  useEffect(() => {
    if (!lastQuery) return
    let cancelled = false
    void repo
      .searchDocuments(lastQuery)
      .then((next) => {
        if (!cancelled) setResults(next)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [revision, lastQuery])

  async function runSearch(raw: string) {
    const q = raw.trim()
    if (!q || searching) return
    setSearching(true)
    setSearchError(null)
    setLastQuery(q)
    setResults(null)
    try {
      setResults(await repo.searchDocuments(q))
    } catch (e) {
      setSearchError(errorMessage(e, '搜索暂时不可用，请稍后重试。'))
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setResults(null)
    setSearchError(null)
    setLastQuery('')
    setQuery('')
  }

  async function handleSave(url: string, titleHint: string | null): Promise<boolean> {
    try {
      const res = await repo.createDocument(url, titleHint)
      if (res.duplicate) {
        toast('这篇内容已经保存过了。', {
          action: {
            label: '打开已有收藏',
            onPress: () => router.push(`/documents/${res.id}`),
          },
        })
      } else {
        toast('已保存，正在本机整理内容……', { type: 'success' })
        void processPendingQueue()
      }
      return true
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_URL') {
        toast('这不是一个可以保存的链接。', { type: 'error' })
      } else {
        toast(errorMessage(e, '保存失败，请稍后重试。'), { type: 'error' })
      }
      return false
    }
  }

  function handleTerminal(status: ParseStatus) {
    const content = terminalToastContent(status)
    toast(content.message, { type: content.type })
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {inResults ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.resultsContent, { paddingBottom: bottomPad }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <BrandBar />

            <View style={styles.searchhead}>
              <SearchField
                value={query}
                onChangeText={setQuery}
                onSubmit={() => void runSearch(query)}
                loading={searching}
              />
            </View>

            <View style={styles.resulthead}>
              <Text style={styles.resultcount}>
                找到{' '}
                <Text style={styles.resultcountStrong}>
                  {searching ? '…' : results === null ? '—' : results.length}
                </Text>{' '}
                条相关
              </Text>
              <Pressable
                onPress={clearSearch}
                accessibilityRole="button"
                accessibilityLabel="清除搜索，回到首页"
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.viewall}>清除</Text>
              </Pressable>
            </View>

            {searchError && (
              <View style={styles.notice}>
                <Notice text={searchError} tone="error" />
              </View>
            )}

            {searching && results === null ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.loadingText}>正在找回……</Text>
              </View>
            ) : results === null ? null : results.length === 0 ? (
              searchError ? null : (
                <EmptyState
                  icon="search-outline"
                  title="没有足够相关的内容。"
                  body="换一种描述，或者先保存那篇内容。"
                />
              )
            ) : (
              <View style={styles.cards}>
                {results.map((item) => (
                  <SearchResultCard
                    key={item.document_id}
                    item={item}
                    onPress={() => router.push(`/documents/${item.document_id}`)}
                    onTerminal={handleTerminal}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView
            ref={homeScroll}
            style={styles.flex}
            contentContainerStyle={[styles.homeContent, { paddingBottom: bottomPad }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <BrandBar />

            <View style={styles.hero}>
              <Text style={styles.heroTitle}>
                今天想<Text style={styles.heroEm}>找</Text>点什么？
              </Text>
              <Text style={styles.heroLede}>用你记得的那句话，找回存过的内容。</Text>
            </View>

            <View style={styles.actions}>
              <AskCard
                style={styles.askCard}
                value={query}
                onChangeText={setQuery}
                onSubmit={() => void runSearch(query)}
                loading={searching}
              />
              <SaveField
                style={styles.saveCard}
                onSave={handleSave}
                onFocus={revealSaveField}
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      <AppTabBar active="home" />
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  homeContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
  },
  resultsContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: spacing.xs,
  },
  brandbar: {
    minHeight: 44,
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandname: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.ink,
  },
  localchip: {
    height: 26,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  localchipText: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
  },
  hero: {
    marginTop: 30,
    gap: spacing.sm,
  },
  heroTitle: {
    ...type.display,
    color: colors.ink,
  },
  heroEm: {
    color: colors.accent,
  },
  heroLede: {
    ...type.body,
    color: colors.muted,
  },
  actions: {
    flex: 1,
    minHeight: 0,
    marginTop: 26,
    gap: 14,
  },
  askCard: {
    flex: 1.12,
    minHeight: 170,
  },
  saveCard: {
    flex: 0.88,
    minHeight: 170,
  },
  searchhead: {
    marginTop: 14,
  },
  resulthead: {
    marginTop: 20,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultcount: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  resultcountStrong: {
    color: colors.ink,
    fontWeight: '700',
  },
  viewall: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.accent,
  },
  notice: {
    marginBottom: spacing.md,
  },
  cards: {
    gap: spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...type.caption,
    color: colors.faint,
  },
  pressed: {
    opacity: 0.55,
  },
})
