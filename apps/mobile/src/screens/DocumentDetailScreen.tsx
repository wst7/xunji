import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
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
import { Notice } from '../components/ui/Notice'
import { Screen } from '../components/ui/Screen'
import { processPendingQueue } from '../local/pipeline'
import * as repo from '../local/repo'
import { useToast } from '../providers/ToastProvider'
import { colors, radius, shadow, spacing, type } from '../theme'

function DetailTopBar({
  onBack,
  onOpen,
}: {
  onBack: () => void
  onOpen?: () => void
}) {
  return (
    <View style={styles.topbar}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="返回"
        hitSlop={8}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={21} color={colors.ink} />
      </Pressable>
      <Text style={styles.topbarTitle}>收藏详情</Text>
      {onOpen ? (
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel="打开原文"
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons name="open-outline" size={19} color={colors.ink} />
        </Pressable>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  )
}

export function DocumentDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { toast } = useToast()
  const insets = useSafeAreaInsets()

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

  if (error) {
    return (
      <Screen>
        <DetailTopBar onBack={goBack} />
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
        <DetailTopBar onBack={goBack} />
        <View style={styles.stateWrap}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>正在加载……</Text>
        </View>
      </Screen>
    )
  }

  const bodySource = doc.content_markdown ?? doc.plain_text ?? ''
  const canReprocess = status === 'partial' || status === 'failed'
  const actionBarPad = Math.max(insets.bottom, spacing.md)

  return (
    <Screen>
      <DetailTopBar onBack={goBack} onOpen={() => void openOriginal()} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 84 + actionBarPad + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.domainChip}>
          <Ionicons name="globe-outline" size={12} color={colors.accent} />
          <Text style={styles.domainText}>{domainOf(doc.url)}</Text>
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
              <Pressable
                onPress={() => void handleReprocess()}
                accessibilityRole="button"
                style={({ pressed }) => [styles.textActionButton, pressed && styles.pressed]}
              >
                <Text style={[styles.textAction, reprocessing && styles.textActionDisabled]}>
                  {reprocessing ? '提交中…' : '重新解析'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {(doc.summary_short || doc.summary_long) && (
          <View style={styles.summaryBlock}>
            <View style={styles.blockLabelRow}>
              <Ionicons name="sparkles" size={14} color={colors.accent} />
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

        <Pressable
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityState={{ disabled: deleting, busy: deleting }}
          style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={styles.deleteText}>{deleting ? '删除中…' : '删除这篇收藏'}</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: actionBarPad }]}>
        <Button
          label="打开原文"
          onPress={() => void openOriginal()}
          icon="open-outline"
          style={styles.openButton}
        />
      </View>

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

const styles = StyleSheet.create({
  topbar: {
    minHeight: 52,
    paddingTop: spacing.xs,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  topbarTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.ink,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
  },
  stateWrap: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  loadingText: {
    ...type.caption,
    color: colors.faint,
    textAlign: 'center',
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    height: 24,
    paddingHorizontal: 10,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  domainText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.accent,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.7,
    color: colors.ink,
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.faint,
    marginTop: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  textActionButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  textAction: {
    ...type.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  textActionDisabled: {
    color: colors.faint,
  },
  summaryBlock: {
    marginTop: 18,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentLine,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: 7,
  },
  blockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.muted,
  },
  summaryLead: {
    fontSize: 15.5,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.ink,
  },
  summaryLong: {
    fontSize: 13.5,
    lineHeight: 22,
    color: colors.inkSoft,
  },
  keywordBlock: {
    marginTop: 18,
  },
  keywordLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    height: 26,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  body: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadow.card,
  },
  emptyBody: {
    ...type.body,
    color: colors.muted,
  },
  delete: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  deleteText: {
    ...type.caption,
    color: colors.error,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    ...shadow.action,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
  },
  openButton: {
    minHeight: 48,
  },
  pressed: {
    opacity: 0.6,
  },
})
