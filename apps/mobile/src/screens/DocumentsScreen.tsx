import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
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
import { IconButton } from '../components/ui/IconButton'
import { Notice } from '../components/ui/Notice'
import { Screen } from '../components/ui/Screen'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import * as repo from '../local/repo'
import { useToast } from '../providers/ToastProvider'
import { makeStyles, useTheme, withAlpha } from '../theme'

const PAGE_SIZE = 20
const APP_NAME = '寻迹'

interface DocumentRowProps {
  doc: DocumentSummary
  onPress: () => void
  onTerminal: (status: ParseStatus) => void
}

/** MD3 两行列表项：头像、标题与元信息，右侧状态与箭头。 */
function DocumentRow({ doc, onPress, onTerminal }: DocumentRowProps) {
  const theme = useTheme()
  const styles = useStyles()
  const seed = (doc.site_name && doc.site_name.trim()) || domainOf(doc.url).replace(/^www\./i, '')
  const tint = theme.tintFor(seed || '拾')

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={doc.title || doc.url}
      android_ripple={{ color: withAlpha(theme.colors.onSurface, 0.08) }}
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
      <Ionicons name="chevron-forward" size={18} color={theme.colors.outline} />
    </Pressable>
  )
}

export function DocumentsScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const styles = useStyles()

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
  const bottomPad = insets.bottom + theme.layout.navBarHeight + theme.spacing.lg

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
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surfaceContainerHigh}
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

            <View style={[styles.searchBar, filterFocused && styles.searchBarFocused]}>
              <Ionicons
                name="search-outline"
                size={20}
                color={filterFocused ? theme.colors.primary : theme.colors.textMuted}
              />
              <TextInput
                value={keywordInput}
                onChangeText={setKeywordInput}
                onFocus={() => setFilterFocused(true)}
                onBlur={() => setFilterFocused(false)}
                placeholder="筛选收藏……"
                placeholderTextColor={theme.colors.outline}
                style={styles.searchInput}
                selectionColor={theme.colors.primary}
                cursorColor={theme.colors.primary}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="按关键词筛选"
              />
              {keywordInput ? (
                <IconButton
                  name="close"
                  onPress={() => setKeywordInput('')}
                  accessibilityLabel="清除筛选"
                  iconSize={18}
                />
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
          <View>
            <DocumentRow
              doc={item}
              onPress={() => router.push(`/documents/${item.id}`)}
              onTerminal={handleTerminal}
            />
            {index < items.length - 1 ? <RowDivider /> : null}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
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
                <ActivityIndicator size="small" color={theme.colors.primary} />
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
  const styles = useStyles()
  return (
    <View style={styles.dividerWrap}>
      <View style={styles.dividerLine} />
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.gutter,
  },
  header: {
    paddingBottom: theme.spacing.sm,
  },
  screenTitle: {
    ...theme.type.headlineMedium,
    marginTop: theme.spacing.sm,
    color: theme.colors.text,
  },
  screenSub: {
    ...theme.type.bodyMedium,
    marginTop: theme.spacing.xs,
    color: theme.colors.textMuted,
  },
  searchBar: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.shape.full,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.xs,
    minHeight: 56,
  },
  searchBarFocused: {
    borderColor: theme.colors.primary,
  },
  searchInput: {
    ...theme.type.bodyLarge,
    flex: 1,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 0,
  },
  notice: {
    marginTop: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 72,
    paddingVertical: theme.spacing.md,
  },
  rowPressed: {
    backgroundColor: theme.colors.cardMuted,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...theme.type.titleMedium,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    ...theme.type.bodyLarge,
    fontWeight: '500',
    color: theme.colors.text,
  },
  rowMeta: {
    ...theme.type.bodySmall,
    color: theme.colors.textMuted,
  },
  dividerWrap: {
    height: 1,
    paddingLeft: 68,
    paddingRight: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    backgroundColor: theme.colors.divider,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    ...theme.type.bodySmall,
    color: theme.colors.textMuted,
  },
  emptyWrap: {
    paddingTop: theme.spacing.xl,
  },
  footer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  loadMoreButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  loadMore: {
    ...theme.type.labelLarge,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.55,
  },
}))
