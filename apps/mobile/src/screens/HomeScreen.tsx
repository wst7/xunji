import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
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
import type { SaveResult } from '../components/SaveField'
import { SearchField } from '../components/SearchField'
import { EmptyState } from '../components/ui/EmptyState'
import { Notice } from '../components/ui/Notice'
import { Screen } from '../components/ui/Screen'
import { processPendingQueue } from '../local/pipeline'
import * as repo from '../local/repo'
import { useLocalRevision } from '../local/useLocalRevision'
import { useToast } from '../providers/ToastProvider'
import { makeStyles, useTheme } from '../theme'

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

/** Small top app bar：品牌标 + 标题，右侧是「仅本机」assist chip。 */
function BrandBar() {
  const theme = useTheme()
  const styles = useStyles()

  return (
    <View style={styles.brandbar}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Ionicons name="bookmark" size={16} color={theme.colors.onPrimary} />
        </View>
        <Text style={styles.brandname}>{APP_NAME}</Text>
      </View>
      <View style={styles.localchip}>
        <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.primary} />
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
  const theme = useTheme()
  const styles = useStyles()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')

  const inResults = lastQuery.length > 0
  const bottomPad = insets.bottom + theme.layout.navBarHeight + theme.spacing.lg

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

  async function handleSave(url: string, titleHint: string | null): Promise<SaveResult | null> {
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
      return { id: res.id, duplicate: res.duplicate }
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_URL') {
        toast('这不是一个可以保存的链接。', { type: 'error' })
      } else {
        toast(errorMessage(e, '保存失败，请稍后重试。'), { type: 'error' })
      }
      return null
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
                style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
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
                <ActivityIndicator size="small" color={theme.colors.primary} />
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
                {results.map((item, index) => (
                  <SearchResultCard
                    key={item.document_id}
                    item={item}
                    strongest={index === 0}
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
                value={query}
                onChangeText={setQuery}
                onSubmit={() => void runSearch(query)}
                loading={searching}
              />
              <SaveField onSave={handleSave} onFocus={revealSaveField} />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      <AppTabBar active="home" />
    </Screen>
  )
}

const useStyles = makeStyles((theme) => ({
  flex: {
    flex: 1,
  },
  homeContent: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.gutter,
  },
  resultsContent: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.gutter,
  },
  brandbar: {
    minHeight: theme.layout.appBarSmall,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    // 齿孔：点状边露出底纸 canvas，与来源邮票同一语言。
    borderWidth: 2.5,
    borderStyle: 'dotted',
    borderColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandname: {
    ...theme.type.titleLarge,
    color: theme.colors.text,
  },
  localchip: {
    height: 32,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.shape.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  localchipText: {
    ...theme.type.labelMedium,
    color: theme.colors.textMuted,
  },
  hero: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  heroTitle: {
    ...theme.type.headlineLarge,
    color: theme.colors.text,
  },
  heroEm: {
    color: theme.colors.primary,
  },
  heroLede: {
    ...theme.type.bodyLarge,
    color: theme.colors.textMuted,
  },
  actions: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  searchhead: {
    marginTop: theme.spacing.lg,
  },
  resulthead: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultcount: {
    ...theme.type.bodyMedium,
    color: theme.colors.textMuted,
  },
  resultcountStrong: {
    ...theme.type.titleMedium,
    color: theme.colors.text,
  },
  textButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  viewall: {
    ...theme.type.labelLarge,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  notice: {
    marginBottom: theme.spacing.md,
  },
  cards: {
    gap: theme.spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    ...theme.type.bodySmall,
    color: theme.colors.textMuted,
  },
  pressed: {
    opacity: 0.55,
  },
}))
