import { Ionicons } from '@expo/vector-icons'
import { useCallback, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppTabBar } from '../components/AppTabBar'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Screen } from '../components/ui/Screen'
import {
  DEFAULT_LLM,
  loadLlmState,
  saveLlmState,
  testLlmConnection,
} from '../local/llm'
import { emitChange } from '../local/bus'
import { clearAllDocuments } from '../local/db'
import * as repo from '../local/repo'
import type { DocumentStats } from '../local/repo'
import { useLocalRevision } from '../local/useLocalRevision'
import { useToast } from '../providers/ToastProvider'
import { colors, fonts, layout, radius, shadow, spacing, type } from '../theme'

const APP_NAME = '寻迹'

function statsFootnote(stats: DocumentStats): string {
  if (stats.total === 0) return '还没有收藏，回到首页粘贴第一个链接。'
  const parts: string[] = []
  if (stats.searchable > 0) parts.push(`${stats.searchable} 篇可检索`)
  if (stats.processing > 0) parts.push(`${stats.processing} 篇整理中`)
  if (stats.failed > 0) parts.push(`${stats.failed} 篇失败`)
  return parts.join(' · ')
}

export function SettingsScreen() {
  const { toast } = useToast()
  const revision = useLocalRevision()
  const insets = useSafeAreaInsets()

  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [hasKey, setHasKey] = useState(false)
  const [enabled, setEnabled] = useState(DEFAULT_LLM.enabled)
  const [baseUrl, setBaseUrl] = useState(DEFAULT_LLM.baseUrl)
  const [model, setModel] = useState(DEFAULT_LLM.model)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [confirmingClear, setConfirmingClear] = useState(false)

  const bottomPad = Math.max(insets.bottom, spacing.sm) + layout.tabBarSpace

  const reload = useCallback(async () => {
    try {
      const [nextStats, llm] = await Promise.all([repo.documentStats(), loadLlmState()])
      setStats(nextStats)
      setEnabled(llm.enabled)
      setBaseUrl(llm.baseUrl)
      setModel(llm.model)
      setHasKey(llm.hasKey)
    } catch {
      // 读本地库失败时保持上一次的值，不打断用户。
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void reload()
    }, [reload, revision]),
  )

  async function handleSave() {
    if (saving) return
    if (enabled) {
      if (!/^https?:\/\/\S+$/i.test(baseUrl.trim())) {
        toast('服务地址需要以 http:// 或 https:// 开头。', { type: 'error' })
        return
      }
      if (!model.trim()) {
        toast('请填写模型名称。', { type: 'error' })
        return
      }
      if (!hasKey && !apiKey.trim()) {
        toast('请填写 API Key，或先关闭大模型。', { type: 'error' })
        return
      }
    }

    setSaving(true)
    try {
      await saveLlmState(
        { enabled, baseUrl, model },
        apiKey.trim() ? apiKey : undefined,
      )
      setApiKey('')
      await reload()
      toast(enabled ? '已保存，新收藏会用这个模型整理。' : '已保存，将使用本地抽取式摘要。', {
        type: 'success',
      })
    } catch {
      toast('保存设置失败，请稍后重试。', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (testing) return
    if (!/^https?:\/\/\S+$/i.test(baseUrl.trim())) {
      toast('服务地址需要以 http:// 或 https:// 开头。', { type: 'error' })
      return
    }
    if (!hasKey && !apiKey.trim()) {
      toast('请先填写 API Key。', { type: 'error' })
      return
    }

    setTesting(true)
    try {
      const reply = await testLlmConnection({ enabled: true, baseUrl, model }, apiKey)
      toast(`连接成功，模型回复：${reply}`, { type: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '连接失败'
      toast(`连接失败：${message}`, { type: 'error' })
    } finally {
      setTesting(false)
    }
  }

  async function handleClear() {
    try {
      await clearAllDocuments()
      emitChange()
      await reload()
      toast('已清空本机收藏。', { type: 'success' })
    } catch {
      toast('清空失败，请稍后重试。', { type: 'error' })
    }
  }

  const total = stats?.total ?? 0
  const ratio = total > 0 && stats ? Math.round((stats.searchable / total) * 100) : 0

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>我的</Text>

          <View style={styles.panel}>
            <View style={styles.panelTop}>
              <Text style={styles.panelTopText}>本机收藏</Text>
              <Ionicons name="phone-portrait-outline" size={16} color={colors.panelSoft} />
            </View>
            <View style={styles.panelValueRow}>
              <Text style={styles.panelValue}>{stats === null ? '—' : stats.total}</Text>
              <Text style={styles.panelUnit}>条</Text>
            </View>
            <View style={styles.panelBar}>
              <View style={[styles.panelBarFill, { width: `${ratio}%` }]} />
            </View>
            <Text style={styles.panelFoot}>
              {stats === null ? '正在读取本机数据……' : statsFootnote(stats)}
            </Text>
          </View>

          <Text style={styles.groupLabel}>大模型（可选）</Text>
          <View style={styles.groupCard}>
            <View style={styles.switchRow}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>用大模型写摘要</Text>
                <Text style={styles.rowSub}>关闭时从原文离线抽取摘要和关键词。</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: colors.lineStrong, true: colors.accent }}
                thumbColor={colors.surface}
                ios_backgroundColor={colors.lineStrong}
                accessibilityLabel="使用大模型写摘要"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>服务地址</Text>
              <TextInput
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder={DEFAULT_LLM.baseUrl}
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.input}
                selectionColor={colors.accent}
                accessibilityLabel="大模型服务地址"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>模型名称</Text>
              <TextInput
                value={model}
                onChangeText={setModel}
                placeholder={DEFAULT_LLM.model}
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                selectionColor={colors.accent}
                accessibilityLabel="模型名称"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>API Key</Text>
              <TextInput
                value={apiKey}
                onChangeText={setApiKey}
                placeholder={hasKey ? '已保存在系统钥匙串，留空则不修改' : '填写你的 API Key'}
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                style={styles.input}
                selectionColor={colors.accent}
                accessibilityLabel="大模型 API Key"
              />
              <Text style={styles.fieldHint}>
                密钥只写入系统钥匙串，不会上传，也不会出现在日志里。
              </Text>
            </View>

            <View style={styles.actions}>
              <Button
                label={saving ? '保存中…' : '保存设置'}
                onPress={() => void handleSave()}
                loading={saving}
                size="small"
                style={styles.actionButton}
              />
              <Button
                label={testing ? '测试中…' : '测试连接'}
                onPress={() => void handleTest()}
                loading={testing}
                variant="secondary"
                size="small"
                style={styles.actionButton}
              />
            </View>
          </View>

          <Text style={styles.groupLabel}>数据</Text>
          <View style={styles.groupCard}>
            <View style={styles.row}>
              <View style={styles.softicon}>
                <Ionicons name="bookmark-outline" size={19} color={colors.inkSoft} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>本机存储</Text>
                <Text style={styles.rowSub}>正文、摘要和索引都在 xunji.db 里。</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.softicon}>
                <Ionicons name="sync-outline" size={19} color={colors.inkSoft} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>多端同步</Text>
                <Text style={styles.rowSub}>
                  暂未开启。数据已保留更新时间与删除标记，后续版本可以接上。
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => setConfirmingClear(true)}
            accessibilityRole="button"
            accessibilityLabel="清空全部收藏"
            style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.dangerText}>清空全部收藏</Text>
          </Pressable>

          <Text style={styles.footer}>{APP_NAME} · 只保存在这台手机上</Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppTabBar active="settings" />
      <ConfirmDialog
        visible={confirmingClear}
        title="清空全部收藏？"
        message="本机的正文、摘要和索引都会被删除，无法恢复。大模型设置会保留。"
        confirmLabel="清空"
        destructive
        onCancel={() => setConfirmingClear(false)}
        onConfirm={() => {
          setConfirmingClear(false)
          void handleClear()
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
  },
  screenTitle: {
    marginTop: spacing.sm,
    ...type.display,
    color: colors.ink,
  },
  panel: {
    marginTop: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.lg + 2,
    paddingVertical: spacing.lg,
    ...shadow.action,
    shadowOpacity: 0.18,
  },
  panelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTopText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.panelSoft,
  },
  panelValueRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  panelValue: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.1,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  panelUnit: {
    marginLeft: 5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.panelSoft,
  },
  panelBar: {
    marginTop: 14,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  panelBarFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.panelBar,
  },
  panelFoot: {
    marginTop: 10,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.panelSoft,
    fontVariant: ['tabular-nums'],
  },
  groupLabel: {
    marginTop: 18,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.faint,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: spacing.lg,
    ...shadow.card,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.xs,
  },
  softicon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.ink,
  },
  rowSub: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginVertical: 10,
  },
  field: {
    gap: spacing.xs,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.muted,
  },
  input: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
    letterSpacing: -0.1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    minHeight: 42,
    fontFamily: fonts.display,
  },
  fieldHint: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.faint,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
  dangerButton: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  dangerText: {
    ...type.body,
    color: colors.error,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  footer: {
    marginTop: spacing.xl,
    textAlign: 'center',
    ...type.caption,
    color: colors.faint,
  },
})
