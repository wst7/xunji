import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import type { DocumentSummary, ParseStatus, SearchResult } from '@xunji/shared'
import { errorMessage, STATUS_TEXT } from '@xunji/shared'

import { AppTabBar } from '../components/AppTabBar'
import { DocumentCard, SearchResultCard } from '../components/DocumentCard'
import { HomeOnboarding } from '../components/HomeOnboarding'
import { SaveField } from '../components/SaveField'
import { SearchField } from '../components/SearchField'
import { EmptyState } from '../components/ui/EmptyState'
import { Notice } from '../components/ui/Notice'
import { Screen } from '../components/ui/Screen'
import { processPendingQueue } from '../local/pipeline'
import * as repo from '../local/repo'
import { useLocalRevision } from '../local/useLocalRevision'
import { useToast } from '../providers/ToastProvider'
import { colors, spacing, type } from '../theme'

const RECENT_COUNT = 6
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

export function HomeScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const revision = useLocalRevision()

  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [recent, setRecent] = useState<DocumentSummary[] | null>(null)
  const [recentError, setRecentError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastQuery, setLastQuery] = useState('')

  const loadRecent = useCallback(async () => {
    try {
      const res = await repo.listDocuments({ page: 1, pageSize: RECENT_COUNT })
      setRecent(res.items)
      setRecentError(null)
    } catch (e) {
      setRecentError(errorMessage(e, '加载最近收藏失败，请稍后重试。'))
      setRecent((current) => current ?? [])
    }
  }, [])

  // 本地写入（保存、解析完成、删除）都会推进 revision，列表随之重读。
  useFocusEffect(
    useCallback(() => {
      void loadRecent()
      void processPendingQueue()
    }, [loadRecent]),
  )

  useFocusEffect(
    useCallback(() => {
      void loadRecent()
    }, [loadRecent, revision]),
  )

  // 搜索结果也跟随本地数据变化（例如刚保存的那篇解析完成）。
  useEffect(() => {
    if (results === null || !lastQuery) return
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, lastQuery])

  async function handleRefresh() {
    setRefreshing(true)
    await processPendingQueue()
    await loadRecent()
    setRefreshing(false)
  }

  async function handleSearch(query: string) {
    setSearching(true)
    setSearchError(null)
    setLastQuery(query)
    try {
      setResults(await repo.searchDocuments(query))
    } catch (e) {
      setResults(null)
      setSearchError(errorMessage(e, '搜索暂时不可用，请稍后重试。'))
    } finally {
      setSearching(false)
    }
  }

  async function handleSave(url: string): Promise<boolean> {
    try {
      const res = await repo.createDocument(url)
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
      await loadRecent()
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
    void loadRecent()
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          <View style={styles.topbar}>
            <View style={styles.brandRow}>
              <View style={styles.mark}>
                <Ionicons name="bookmark" size={15} color={colors.surface} />
              </View>
              <Text style={styles.brand}>{APP_NAME}</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>Save anything. Find it by memory.</Text>
            <Text style={styles.heroTitle}>
              今天想<Text style={styles.heroEm}>找</Text>点什么？
            </Text>
            <Text style={styles.heroLede}>用一句话，找回你收藏过的内容。</Text>
          </View>

          <View style={styles.fields}>
            <SearchField onSubmit={(query) => void handleSearch(query)} loading={searching} />
            <SaveField onSave={handleSave} />
          </View>

          {searchError && <Notice text={searchError} tone="error" />}

          {results !== null ? (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>
                  搜索结果 <Text style={styles.count}>{results.length} 条</Text>
                </Text>
                <Pressable
                  onPress={() => setResults(null)}
                  accessibilityRole="button"
                  accessibilityLabel="清除搜索结果"
                  style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
                >
                  <Text style={styles.sectionLink}>清除</Text>
                  <Ionicons name="close" size={14} color={colors.accent} />
                </Pressable>
              </View>

              {results.length === 0 ? (
                <EmptyState
                  icon="search-outline"
                  title="没有足够相关的内容。"
                  body="换一种描述，或者先保存那篇内容。"
                />
              ) : (
                <View style={styles.cardList}>
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
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>最近收藏</Text>
                <Pressable
                  onPress={() => router.push('/documents')}
                  accessibilityRole="button"
                  accessibilityLabel="查看全部收藏"
                  style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
                >
                  <Text style={styles.sectionLink}>查看全部</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.accent} />
                </Pressable>
              </View>

              {recentError && <Notice text={recentError} tone="error" />}

              {recent === null ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.faint} />
                  <Text style={styles.loadingText}>正在加载……</Text>
                </View>
              ) : recent.length === 0 ? (
                <HomeOnboarding />
              ) : (
                <View style={styles.cardList}>
                  {recent.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onPress={() => router.push(`/documents/${doc.id}`)}
                      onTerminal={handleTerminal}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <AppTabBar active="home" />
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingTop: spacing.xs,
  },
  brandRow: {
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
  brand: {
    ...type.title,
    fontSize: 20,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  hero: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  heroEyebrow: {
    ...type.caption,
    fontSize: 11,
    letterSpacing: 0.9,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.accent,
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
  fields: {
    gap: spacing.md,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...type.title,
    color: colors.ink,
  },
  count: {
    ...type.caption,
    color: colors.faint,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingLeft: spacing.sm,
  },
  sectionLink: {
    ...type.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.55,
  },
  cardList: {
    gap: spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...type.caption,
    color: colors.faint,
  },
})
