import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { DocumentDetail, ParseStatus, RelatedItem } from '@xunji/shared'
import {
  domainOf,
  errorMessage,
  formatDate,
  sourceLabel,
  SOURCE_TYPE_LABELS,
} from '@xunji/shared'

import { LiveStatusBadge } from '../components/LiveStatusBadge'
import { Markdown } from '../components/Markdown'
import { RelatedList } from '../components/RelatedList'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { IconButton } from '../components/ui/IconButton'
import { Notice } from '../components/ui/Notice'
import { Screen } from '../components/ui/Screen'
import { TopAppBar } from '../components/ui/TopAppBar'
import { processPendingQueue } from '../local/pipeline'
import * as repo from '../local/repo'
import { useToast } from '../providers/ToastProvider'
import { makeStyles, useTheme, withAlpha } from '../theme'

export function DocumentDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { toast } = useToast()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const styles = useStyles()

  const [doc, setDoc] = useState<DocumentDetail | null>(null)
  const [related, setRelated] = useState<RelatedItem[]>([])
  const [status, setStatus] = useState<ParseStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reprocessing, setReprocessing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [detail, relatedItems] = await Promise.all([
        repo.getDocument(id),
        repo.relatedDocuments(id),
      ])
      if (!detail) {
        setError('这篇收藏不存在，可能已经被删除。')
        return
      }
      setDoc(detail)
      setStatus(detail.parse_status)
      setRelated(relatedItems)
      setError(null)
    } catch (e) {
      setError(errorMessage(e, '加载收藏详情失败，请稍后重试。'))
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/documents')
  }, [router])

  async function handleReprocess() {
    if (!id || reprocessing) return
    setReprocessing(true)
    try {
      await repo.markForRetry(id)
      setStatus('pending')
      toast('已重新排入本机解析队列，正在整理内容……')
      void processPendingQueue()
    } catch (e) {
      toast(errorMessage(e, '重新解析失败，请稍后重试。'), { type: 'error' })
    } finally {
      setReprocessing(false)
    }
  }

  async function doDelete() {
    if (!id) return
    setDeleting(true)
    try {
      await repo.deleteDocument(id)
      toast('已删除这篇收藏。')
      if (router.canGoBack()) router.back()
      else router.replace('/documents')
    } catch (e) {
      toast(errorMessage(e, '删除失败，请稍后重试。'), { type: 'error' })
      setDeleting(false)
    }
  }

  function confirmDelete() {
    if (deleting) return
    setConfirmingDelete(true)
  }

  async function openOriginal() {
    if (!doc) return
    try {
      await Linking.openURL(doc.url)
    } catch {
      toast('无法打开原始链接。', { type: 'error' })
    }
  }

  const topBar = (
    <TopAppBar
      title="收藏详情"
      centerTitle
      onBack={goBack}
      actions={
        doc ? (
          <IconButton
            name="trash-outline"
            onPress={confirmDelete}
            accessibilityLabel="删除这篇收藏"
            color={theme.colors.error}
            disabled={deleting}
          />
        ) : null
      }
    />
  )

  if (error) {
    return (
      <Screen>
        {topBar}
        <View style={styles.stateWrap}>
          <Notice text={error} tone="error" />
          <Button label="重试" onPress={() => void load()} variant="secondary" />
        </View>
      </Screen>
    )
  }

  if (!doc || status === null) {
    return (
      <Screen>
        {topBar}
        <View style={styles.stateWrap}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>正在加载……</Text>
        </View>
      </Screen>
    )
  }

  const bodySource = doc.content_markdown ?? doc.plain_text ?? ''
  const canReprocess = status === 'partial' || status === 'failed'
  const fabBottom = insets.bottom + theme.spacing.md

  return (
    <Screen>
      {topBar}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              insets.bottom + theme.layout.fabHeight + theme.spacing.md + theme.spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.domainChip}>
          <Ionicons
            name="globe-outline"
            size={14}
            color={theme.colors.onSecondaryContainer}
          />
          <Text style={styles.domainText} numberOfLines={1}>
            {domainOf(doc.url)}
          </Text>
        </View>

        <Text style={styles.title}>{doc.title || doc.url}</Text>

        <Text style={styles.meta}>
          {sourceLabel(doc.url, doc.site_name, SOURCE_TYPE_LABELS[doc.source_type])}
          {doc.author ? ` · ${doc.author}` : ''} · 收藏于 {formatDate(doc.saved_at)}
        </Text>

        {status !== 'completed' && (
          <View style={styles.statusRow}>
            <LiveStatusBadge
              docId={doc.id}
              status={status}
              onTerminal={(next) => {
                setStatus(next)
                void load()
              }}
            />
            {canReprocess && (
              <Button
                label={reprocessing ? '提交中…' : '重新解析'}
                onPress={() => void handleReprocess()}
                variant="ghost"
                size="small"
                disabled={reprocessing}
              />
            )}
          </View>
        )}

        {(doc.summary_short || doc.summary_long) && (
          <View style={styles.summaryBlock}>
            <View style={styles.blockLabelRow}>
              <Ionicons name="sparkles" size={16} color={theme.colors.onPrimaryContainer} />
              <Text style={styles.label}>摘要</Text>
            </View>
            {doc.summary_short && <Text style={styles.summaryLead}>{doc.summary_short}</Text>}
            {doc.summary_long && <Text style={styles.summaryLong}>{doc.summary_long}</Text>}
          </View>
        )}

        {doc.keywords.length > 0 && (
          <View style={styles.keywordBlock}>
            <Text style={styles.keywordLabel}>关键词</Text>
            <View style={styles.chips}>
              {doc.keywords.map((keyword) => (
                <View key={keyword} style={styles.chip}>
                  <Text style={styles.chipText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.body}>
          {bodySource ? (
            <Markdown source={bodySource} />
          ) : (
            <Text style={styles.emptyBody}>
              {doc.parse_error_code === 'APP_ONLY_LINK'
                ? '这条内容在飞书 App 里。标题和链接已经保存，点下方「打开原文」可以直接回到飞书查看。'
                : doc.parse_error_code === 'CONTENT_SCRIPT_ONLY'
                  ? '这个链接需要在对应的 App 内打开（比如飞书、微信），正文无法直接读取；链接已保留，点下方「打开原文」可以回到原处。'
                  : doc.parse_error_code === 'FETCH_BLOCKED'
                    ? '页面要求验证或登录，正文暂时无法读取；原始链接始终为你保留。'
                    : '正文暂时无法读取，原始链接始终为你保留。'}
            </Text>
          )}
        </View>

        {related.length > 0 && (
          <RelatedList items={related} onPress={(nextId) => router.push(`/documents/${nextId}`)} />
        )}
      </ScrollView>

      <Pressable
        onPress={() => void openOriginal()}
        accessibilityRole="button"
        accessibilityLabel="打开原文"
        android_ripple={{
          color: withAlpha(theme.colors.onPrimaryContainer, 0.12),
          borderless: false,
        }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: fabBottom },
          pressed && styles.fabPressed,
        ]}
      >
        <Ionicons name="open-outline" size={20} color={theme.colors.onPrimaryContainer} />
        <Text style={styles.fabLabel}>打开原文</Text>
      </Pressable>

      <ConfirmDialog
        visible={confirmingDelete}
        title="删除这篇收藏？"
        message="删除后无法恢复。"
        confirmLabel="删除"
        destructive
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false)
          void doDelete()
        }}
      />
    </Screen>
  )
}

const useStyles = makeStyles((theme) => ({
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.spacing.xs,
  },
  stateWrap: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  loadingText: {
    ...theme.type.bodyMedium,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 32,
    maxWidth: '100%',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.shape.sm,
    backgroundColor: theme.colors.secondaryContainer,
    marginBottom: theme.spacing.md,
  },
  domainText: {
    ...theme.type.labelMedium,
    fontWeight: '500',
    color: theme.colors.onSecondaryContainer,
    flexShrink: 1,
  },
  title: {
    ...theme.type.headlineSmall,
    color: theme.colors.text,
  },
  meta: {
    ...theme.type.bodySmall,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    marginLeft: -theme.spacing.xs,
  },
  summaryBlock: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.shape.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  blockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...theme.type.labelMedium,
    color: theme.colors.onPrimaryContainer,
    fontWeight: '600',
  },
  summaryLead: {
    ...theme.type.titleMedium,
    color: theme.colors.onPrimaryContainer,
  },
  summaryLong: {
    ...theme.type.bodyMedium,
    color: theme.colors.onPrimaryContainer,
  },
  keywordBlock: {
    marginTop: theme.spacing.lg,
  },
  keywordLabel: {
    ...theme.type.labelMedium,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    height: 32,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.shape.sm,
  },
  chipText: {
    ...theme.type.labelMedium,
    color: theme.colors.textMuted,
  },
  body: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.shape.lg,
    padding: theme.spacing.lg,
    ...theme.elevation.level1,
  },
  emptyBody: {
    ...theme.type.bodyMedium,
    color: theme.colors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: theme.layout.gutter,
    height: theme.layout.fabHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg + 2,
    borderRadius: theme.shape.lg,
    backgroundColor: theme.colors.primaryContainer,
    overflow: 'hidden',
    ...theme.elevation.level3,
  },
  fabPressed: {
    opacity: 0.9,
  },
  fabLabel: {
    ...theme.type.labelLarge,
    fontWeight: '600',
    color: theme.colors.onPrimaryContainer,
  },
}))
