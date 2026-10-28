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
import type { DocumentDetail, ParseStatus, RelatedItem } from '@recall/shared'
import {
  domainOf,
  errorMessage,
  formatDate,
  sourceLabel,
  SOURCE_TYPE_LABELS,
} from '@recall/shared'

import { api } from '../api/client'
import { LiveStatusBadge } from '../components/LiveStatusBadge'
import { Markdown } from '../components/Markdown'
import { RelatedList } from '../components/RelatedList'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Notice } from '../components/ui/Notice'
import { Screen } from '../components/ui/Screen'
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
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
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
      const [detail, relatedRes] = await Promise.all([api.getDocument(id), api.getRelated(id)])
      setDoc(detail)
      setStatus(detail.parse_status)
      setRelated(relatedRes.items)
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
      await api.reprocessDocument(id)
      setStatus('pending')
      toast('已重新提交解析任务，正在整理内容……')
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
      await api.deleteDocument(id)
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

  return (
    <Screen>
      <DetailTopBar onBack={goBack} onOpen={() => void openOriginal()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              <Ionicons name="sparkles" size={15} color={colors.accent} />
              <Text style={styles.label}>摘要</Text>
            </View>
            {doc.summary_short && <Text style={styles.summaryLead}>{doc.summary_short}</Text>}
            {doc.summary_long && <Text style={styles.summaryLong}>{doc.summary_long}</Text>}
          </View>
        )}

        {doc.keywords.length > 0 && (
          <View style={styles.keywordBlock}>
            <Text style={styles.label}>关键词</Text>
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
            <Text style={styles.emptyBody}>正文暂时无法读取，原始链接始终为你保留。</Text>
          )}
        </View>

        {related.length > 0 && (
          <RelatedList items={related} onPress={(nextId) => router.push(`/documents/${nextId}`)} />
        )}

        <View style={styles.footer}>
          <Button
            label="打开原文"
            onPress={() => void openOriginal()}
            icon="open-outline"
          />
          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityState={{ disabled: deleting, busy: deleting }}
            style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.deleteText}>{deleting ? '删除中…' : '删除这篇收藏'}</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
  },
  topbarTitle: {
    ...type.body,
    fontWeight: '600',
    color: colors.ink,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
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
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  domainText: {
    ...type.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  title: {
    ...type.display,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  meta: {
    ...type.caption,
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
    marginTop: spacing.xl,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  blockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...type.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  summaryLead: {
    ...type.title,
    fontSize: 16,
    lineHeight: 25,
    color: colors.ink,
  },
  summaryLong: {
    ...type.body,
    color: colors.inkSoft,
  },
  keywordBlock: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  chipText: {
    ...type.caption,
    color: colors.muted,
  },
  body: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadow.card,
  },
  emptyBody: {
    ...type.body,
    color: colors.muted,
  },
  footer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.6,
  },
  deleteText: {
    ...type.caption,
    color: colors.error,
  },
})
