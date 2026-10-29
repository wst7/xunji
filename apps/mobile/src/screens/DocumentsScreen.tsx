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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { DocumentSummary, ParseStatus } from '@xunji/shared'
import {
  domainOf,
  errorMessage,
  formatRelativeDate,
  sourceLabel,
  SOURCE_TYPE_LABELS,
  STATUS_TEXT,
} from '@xunji/shared'

import { AppTabBar } from '../components/AppTabBar'
import { LiveStatusBadge } from '../components/LiveStatusBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { Notice } from '../components/ui/Notice'
import { Screen } from '../components/ui/Screen'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import * as repo from '../local/repo'
import { useToast } from '../providers/ToastProvider'
import { colors, layout, radius, shadow, spacing, tintFor, type } from '../theme'

const PAGE_SIZE = 20
const APP_NAME = '寻迹'
const GUTTER = 20

interface DocumentRowProps {
  doc: DocumentSummary
  onPress: () => void
  onTerminal: (status: ParseStatus) => void
}

/** 列表行，而不是一张张卡片：整屏只浮起一张白色面板。 */
function DocumentRow({ doc, onPress, onTerminal }: DocumentRowProps) {
  const seed = (doc.site_name && doc.site_name.trim()) || domainOf(doc.url).replace(/^www\./i, '')
  const tint = tintFor(seed || '拾')

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={doc.title || doc.url}
      android_ripple={{ color: colors.surfaceMuted }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
        <Text style={[styles.avatarText, { color: tint.fg }]}>
          {Array.from(seed.trim())[0] ?? '拾'}
        </Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {doc.title || doc.url}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {sourceLabel(doc.url, doc.site_name, SOURCE_TYPE_LABELS[doc.source_type])} ·{' '}
          {formatRelativeDate(doc.saved_at)}
        </Text>
      </View>
      <LiveStatusBadge docId={doc.id} status={doc.parse_status} onTerminal={onTerminal} />
      <Ionicons name="chevron-forward" size={16} color={colors.lineStrong} />
    </Pressable>
  )
}

export function DocumentsScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const insets = useSafeAreaInsets()

  const [keywordInput, setKeywordInput] = useState('')
  const [items, setItems] = useState<DocumentSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterFocused, setFilterFocused] = useState(false)

  const keyword = useDebouncedValue(keywordInput.trim(), 300)
  const requestSeq = useRef(0)
  const bottomPad = Math.max(insets.bottom, spacing.sm) + layout.tabBarSpace

  const load = useCallback(
    async (nextPage: number, mode: 'replace' | 'append') => {
      const seq = requestSeq.current + 1
      requestSeq.current = seq
      if (mode === 'replace') setLoading(true)
      else setLoadingMore(true)

      try {
        const res = await repo.listDocuments({
          page: nextPage,
          pageSize: PAGE_SIZE,
          keyword,
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
      <FlatList
        data={items}
        keyExtractor={(doc) => doc.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
            <Text style={styles.screenTitle}>收藏</Text>
            <Text style={styles.screenSub}>
              {loading
                ? '正在加载…'
                : keyword
                  ? `${total} 条匹配`
                  : total > 0
                    ? `${total} 条内容`
                    : '你的所有链接'}
            </Text>

            <View style={[styles.filterBox, filterFocused && styles.filterBoxFocused]}>
              <Ionicons
                name="search-outline"
                size={18}
                color={filterFocused ? colors.accent : colors.faint}
              />
              <TextInput
                value={keywordInput}
                onChangeText={setKeywordInput}
                onFocus={() => setFilterFocused(true)}
                onBlur={() => setFilterFocused(false)}
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

            {error && (
              <View style={styles.notice}>
                <Notice text={error} tone="error" action={{ label: '重试', onPress: reload }} />
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.rowWrap,
              index === 0 && styles.rowFirst,
              index === items.length - 1 && styles.rowLast,
            ]}
          >
            <DocumentRow
              doc={item}
              onPress={() => router.push(`/documents/${item.id}`)}
              onTerminal={handleTerminal}
            />
          </View>
        )}
        ItemSeparatorComponent={RowDivider}
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

function RowDivider() {
  return (
    <View style={styles.dividerWrap}>
      <View style={styles.dividerLine} />
    </View>
  )
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: GUTTER,
    paddingTop: spacing.sm,
  },
  header: {
    paddingBottom: spacing.lg,
  },
  screenTitle: {
    marginTop: spacing.sm,
    ...type.display,
    color: colors.ink,
  },
  screenSub: {
    ...type.caption,
    marginTop: 3,
    color: colors.faint,
  },
  filterBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    minHeight: 52,
    ...shadow.card,
  },
  filterBoxFocused: {
    borderColor: colors.accent,
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
  notice: {
    marginTop: spacing.md,
  },
  rowWrap: {
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.lineSoft,
    overflow: 'hidden',
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingLeft: spacing.lg,
    paddingRight: 14,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.ink,
  },
  rowMeta: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.faint,
  },
  dividerWrap: {
    height: 1,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.lineSoft,
    paddingLeft: 68,
    paddingRight: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    backgroundColor: colors.lineSoft,
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
    paddingTop: spacing.xl,
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
  pressed: {
    opacity: 0.55,
  },
})
