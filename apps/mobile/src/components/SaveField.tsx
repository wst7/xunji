import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { extractHttpUrl, isValidHttpUrl } from '@xunji/shared'

import { colors, radius, shadow, spacing, type } from '../theme'

interface SaveFieldProps {
  onSave: (url: string) => Promise<boolean>
  disabled?: boolean
}

/** 接受纯链接或分享文字，实时提取第一段 http(s) URL。 */
export function SaveField({ onSave, disabled = false }: SaveFieldProps) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectedUrl = extractHttpUrl(value)
  const extraText = detectedUrl !== null && value.trim() !== detectedUrl
  const inactive = disabled || busy || !detectedUrl

  async function submit() {
    if (busy || disabled) return
    if (!detectedUrl) {
      setError('没有找到可保存的网页链接。')
      return
    }
    if (!isValidHttpUrl(detectedUrl)) {
      setError('请输入有效的网页链接。')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const accepted = await onSave(detectedUrl)
      if (accepted) {
        setValue('')
      }
    } catch {
      setError('保存失败，请稍后重试。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="add" size={20} color={colors.accent} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.label}>保存新链接</Text>
          <Text style={styles.sub}>粘贴链接或分享文字，自动整理</Text>
        </View>
      </View>

      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text)
            if (error) setError(null)
          }}
          placeholder="粘贴链接……"
          placeholderTextColor={colors.faint}
          multiline
          maxLength={4000}
          style={styles.input}
          selectionColor={colors.accent}
          accessibilityLabel="粘贴要保存的链接或分享文字"
          editable={!disabled && !busy}
        />
        <Pressable
          onPress={() => void submit()}
          disabled={inactive}
          accessibilityRole="button"
          accessibilityLabel={busy ? '保存中' : '保存链接'}
          accessibilityState={{ disabled: inactive, busy }}
          style={({ pressed }) => [
            styles.saveButton,
            inactive && styles.saveButtonInactive,
            pressed && styles.pressed,
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons name="arrow-up" size={20} color={colors.surface} />
          )}
        </Pressable>
      </View>

      {extraText && detectedUrl && (
        <View style={styles.hintRow}>
          <Ionicons name="link-outline" size={13} color={colors.muted} />
          <Text style={styles.hint} numberOfLines={1}>
            {detectedUrl}
          </Text>
        </View>
      )}
      {error && (
        <View style={styles.hintRow}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
          <Text style={[styles.hint, styles.error]}>{error}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...type.title,
    color: colors.ink,
  },
  sub: {
    ...type.caption,
    color: colors.faint,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.control,
    backgroundColor: colors.surfaceMuted,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  input: {
    ...type.body,
    flex: 1,
    minHeight: 44,
    maxHeight: 96,
    color: colors.ink,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonInactive: {
    backgroundColor: colors.lineStrong,
  },  pressed: {
    opacity: 0.75,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hint: {
    ...type.caption,
    flex: 1,
    color: colors.muted,
  },
  error: {
    color: colors.error,
  },
})
