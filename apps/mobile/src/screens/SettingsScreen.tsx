import { Ionicons } from '@expo/vector-icons'
import { useCallback, useState } from 'react'
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect } from 'expo-router'

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
import { useLocalRevision } from '../local/useLocalRevision'
import { useToast } from '../providers/ToastProvider'
import { colors, fonts, radius, shadow, spacing, type } from '../theme'

const APP_NAME = '寻迹'

export function SettingsScreen() {
  const { toast } = useToast()
  const revision = useLocalRevision()

  const [count, setCount] = useState<number | null>(null)
  const [hasKey, setHasKey] = useState(false)
  const [enabled, setEnabled] = useState(DEFAULT_LLM.enabled)
  const [baseUrl, setBaseUrl] = useState(DEFAULT_LLM.baseUrl)
  const [model, setModel] = useState(DEFAULT_LLM.model)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [confirmingClear, setConfirmingClear] = useState(false)

  const reload = useCallback(async () => {
    try {
      const [total, llm] = await Promise.all([repo.countDocuments(), loadLlmState()])
      setCount(total)
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

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>我的</Text>

          <View style={styles.statsCard}>
            <View style={styles.statsIcon}>
              <Ionicons name="phone-portrait-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.statsBody}>
              <Text style={styles.statsValue}>
                {count === null ? '—' : `${count} 条收藏`}
              </Text>
              <Text style={styles.statsMeta}>只保存在这台手机上，不需要账号。</Text>
            </View>
          </View>

          <Text style={styles.groupLabel}>大模型（可选）</Text>
          <View style={styles.groupCard}>
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>用大模型写摘要</Text>
                <Text style={styles.rowSub}>
                  关闭时从原文抽取摘要和关键词，不联网调用任何模型。
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: colors.lineStrong, true: colors.accentSoft }}
                thumbColor={enabled ? colors.accent : colors.surface}
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
              <Text style={styles.fieldHint}>
                任何兼容 OpenAI Chat Completions 的服务都可以，例如自建网关。
              </Text>
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
                密钥只写入系统钥匙串 / Keystore，不会上传，也不会显示在日志里。
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
              <View style={styles.rowIcon}>
                <Ionicons name="archive-outline" size={19} color={colors.inkSoft} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>本机存储</Text>
                <Text style={styles.rowSub}>
                  正文、摘要和索引都在手机本地数据库（xunji.db）里。
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="sync-outline" size={19} color={colors.inkSoft} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>多端同步</Text>
                <Text style={styles.rowSub}>
                  暂未开启。数据已按同步需要保留更新时间与删除标记，后续版本可以接上。
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
            <Ionicons name="trash-outline" size={19} color={colors.error} />
            <Text style={styles.dangerText}>清空全部收藏</Text>
          </Pressable>

          <Text style={styles.footer}>
            {APP_NAME} · Xunji · Save anything. Find it by memory.
          </Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    ...type.display,
    color: colors.ink,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadow.card,
  },
  statsIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBody: {
    flex: 1,
    gap: 2,
  },
  statsValue: {
    ...type.title,
    fontSize: 18,
    color: colors.ink,
  },
  statsMeta: {
    ...type.caption,
    color: colors.faint,
  },
  groupLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    ...type.caption,
    color: colors.faint,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.xs,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...type.body,
    fontWeight: '600',
    color: colors.ink,
  },
  rowSub: {
    ...type.caption,
    color: colors.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginVertical: spacing.md,
    marginLeft: 48,
  },
  field: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  fieldLabel: {
    ...type.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  input: {
    ...type.body,
    color: colors.ink,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    fontFamily: fonts.display,
  },
  fieldHint: {
    ...type.caption,
    color: colors.faint,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
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
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    ...shadow.card,
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
