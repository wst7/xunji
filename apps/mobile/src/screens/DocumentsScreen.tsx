import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import type { DocumentSummary, ParseStatus } from '@recall/shared'
import { errorMessage, STATUS_TEXT } from '@recall/shared'

import { api } from '../api/client'
import { AppTabBar } from '../components/AppTabBar'
import { DocumentCard } from '../components/DocumentCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Notice } from '../components/ui/Notice'
import { Screen } from '../components/ui/Screen'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useToast } from '../providers/ToastProvider'
import { colors, radius, shadow, spacing, type } from '../theme'

const PAGE_SIZE = 20
const APP_NAME = '拾回'

export function DocumentsScreen() {
  const router = useRouter()
  const { toast } = useToast()

  const [keywordInput, setKeywordInput] = useState('')
  const [items, setItems] = useState<DocumentSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const keyword = useDebouncedValue(keywordInput.trim(), 300)
  const requestSeq = useRef(0)

  const load = useCallback(
    async (nextPage: number, mode: 'replace' | 'append') => {
      const seq = requestSeq.current + 1
      requestSeq.current = seq
      if (mode === 'replace') setLoading(true)
      else setLoadingMore(true)

      try {
        const res = await api.listDocuments({
          page: nextPage,
          page_size: PAGE_SIZE,
          keyword,
          sort: 'saved_at_desc',
        })
        if (seq !== requestSeq.current) return
        setItems((current) => (mode === 'replace' ? res.items : [...current, ...res.items]))
        setTotal(res.total)
        setPage(nextPage)
        setError(null)
      } catch (e) {
        if (seq !== requestSeq.current) return
        setError(errorMessage(e, '加载收藏列表失败，请稍后重试。'))
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false)
          setLoadingMore(false)
          setRefreshing(false)
        }
      }
    },
    [keyword],
  )

  useEffect(() => {
    void load(1, 'replace')
  }, [load])

  const reload = useCallback(() => {
    void load(1, 'replace')
  }, [load])

  // 从详情页返回时刷新，删除或重新解析后的状态才能反映到列表。
  const loadRef = useRef(load)
  loadRef.current = load
  const firstFocus = useRef(true)
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false
        return
      }
      void loadRef.current(1, 'replace')
    }, []),
  )

  function handleRefresh() {
    setRefreshing(true)
    void load(1, 'replace')
  }

  function handleTerminal(status: ParseStatus) {
    if (status === 'completed') {
      toast('已完成整理，可以通过描述内容搜索它。', { type: 'success' })
    } else if (status === 'failed') {
      toast(STATUS_TEXT.failed, { type: 'error' })
    } else {
      toast(STATUS_TEXT.partial, { type: 'warning' })
    }
    reload()
  }

  const hasMore = items.length < total

  return (
    <Screen>
      <View style={styles.titleBlock}>
        <View style={styles.titleText}>
          <Text style={styles.screenTitle}>收藏</Text>
          <Text style={styles.screenSub}>
            {loading ? '正在加载…' : total > 0 ? `${total} 条内容` : '你的所有链接'}
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(doc) => doc.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={ListSeparator}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.filterBox}>
              <Ionicons name="search-outline" size={18} color={colors.faint} />
              <TextInput
                value={keywordInput}
                onChangeText={setKeywordInput}
                placeholder="筛选收藏……"
                placeholderTextColor={colors.faint}
                style={styles.filterInput}
                selectionColor={colors.accent}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="按关键词筛选"
              />
              {keywordInput || keyword ? (
                <Pressable
                  onPress={() => setKeywordInput('')}
                  accessibilityRole="button"
                  accessibilityLabel="清除筛选"
                  hitSlop={8}
                  style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
                >
                  <Ionicons name="close-circle" size={18} color={colors.faint} />
                </Pressable>
              ) : null}
            </View>
            {error && <Notice text={error} tone="error" action={{ label: '重试', onPress: reload }} />}
          </View>
        }
        renderItem={({ item }) => (
          <DocumentCard
            doc={item}
            onPress={() => router.push(`/documents/${item.id}`)}
            onTerminal={handleTerminal}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.faint} />
              <Text style={styles.loadingText}>正在加载……</Text>
            </View>
          ) : error ? undefined : (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={keyword ? 'search-outline' : 'bookmarks-outline'}
                title={keyword ? '没有匹配的收藏。' : '还没有收藏。'}
                body={
                  keyword
                    ? '换一个关键词，或者清除筛选。'
                    : `回到首页粘贴第一个链接或分享文字，${APP_NAME} 会自动整理。`
                }
                action={
                  keyword
                    ? { label: '清除筛选', onPress: () => setKeywordInput('') }
                    : { label: '回到首页', onPress: () => router.replace('/') }
                }
              />
            </View>
          )
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footer}>
              {loadingMore ? (
                <ActivityIndicator size="small" color={colors.faint} />
              ) : (
                <Pressable
                  onPress={() => {
                    if (!loadingMore && !loading) void load(page + 1, 'append')
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.loadMoreButton, pressed && styles.pressed]}
                >
                  <Text style={styles.loadMore}>加载更多</Text>
                </Pressable>
              )}
            </View>
          ) : undefined
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasMore && !loading && !loadingMore) void load(page + 1, 'append')
        }}
      />
      <AppTabBar active="documents" />
    </Screen>
  )
}

function ListSeparator() {
  return <View style={styles.separator} />
}

const styles = StyleSheet.create({
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  titleText: {
    gap: 2,
  },
  screenTitle: {
    ...type.display,
    color: colors.ink,
  },
  screenSub: {
    ...type.caption,
    color: colors.faint,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
  header: {
    paddingTop: 2,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  filterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    minHeight: 52,
    ...shadow.card,
  },
  filterInput: {
    ...type.body,
    flex: 1,
    color: colors.ink,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  clearButton: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
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
  emptyWrap: {
    paddingTop: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  loadMoreButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadMore: {
    ...type.caption,
    color: colors.accent,
    fontWeight: '600',
  },
})
