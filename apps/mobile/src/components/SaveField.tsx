import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { extractHttpUrl, isValidHttpUrl } from '@xunji/shared'

import { titleHintFrom } from '../local/util'
import { colors, radius, shadow, spacing, type } from '../theme'

interface SaveFieldProps {
  onSave: (url: string, titleHint: string | null) => Promise<boolean>
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

/** 只输入了域名（没有协议）时补上 https://，避免用户被“没有链接”挡住。 */
function withScheme(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 500 || /\s/.test(trimmed)) return null
  if (!/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i.test(trimmed)) return null
  return `https://${trimmed}`
}

/**
 * 首页的「收藏」面：粘贴链接后立刻识别出 URL，
 * 识别成功才点亮保存按钮；分享进来的整段文字也能直接放进来。
 */
export function SaveField({ onSave, disabled = false, style }: SaveFieldProps) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  const detectedUrl = extractHttpUrl(value) ?? withScheme(value)
  const extraText = detectedUrl !== null && value.trim() !== detectedUrl
  const ready = !disabled && !busy && detectedUrl !== null && isValidHttpUrl(detectedUrl)

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
      const accepted = await onSave(detectedUrl, titleHintFrom(value, detectedUrl))
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
    <View style={[styles.card, style]}>
      <View style={styles.head}>
        <View style={styles.softicon}>
          <Ionicons name="add" size={20} color={colors.accent} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.label}>收藏</Text>
          <Text style={styles.sub}>粘贴链接，自动抓取正文</Text>
        </View>
      </View>

      <View style={[styles.field, focused && styles.fieldFocused]}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text)
            if (error) setError(null)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="https://mp.weixin.qq.com/s/…"
          placeholderTextColor={colors.faint}
          maxLength={4000}
          style={styles.input}
          selectionColor={colors.accent}
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
          accessibilityLabel="粘贴要保存的链接或分享文字"
          editable={!disabled && !busy}
        />
        <Pressable
          onPress={() => void submit()}
          disabled={!ready}
          accessibilityRole="button"
          accessibilityLabel={busy ? '保存中' : '保存链接'}
          accessibilityState={{ disabled: !ready, busy }}
          style={({ pressed }) => [
            styles.round,
            !ready && styles.roundDisabled,
            pressed && styles.pressed,
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons
              name="arrow-up"
              size={20}
              color={ready ? colors.surface : colors.faint}
            />
          )}
        </Pressable>
      </View>

      {error ? (
        <View style={styles.hintRow}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
          <Text style={[styles.hint, styles.error]} numberOfLines={1}>
            {error}
          </Text>
        </View>
      ) : extraText && detectedUrl ? (
        <View style={styles.hintRow}>
          <Ionicons name="link-outline" size={13} color={colors.muted} />
          <Text style={styles.hint} numberOfLines={1}>
            {detectedUrl}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg + 4,
    borderRadius: radius.card + 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    gap: spacing.md + 2,
    ...shadow.card,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  softicon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
  },
  label: {
    ...type.title,
    color: colors.ink,
  },
  sub: {
    ...type.caption,
    marginTop: 1,
    color: colors.faint,
  },
  field: {
    flex: 1,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md + 2,
    borderRadius: radius.control + 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceMuted,
  },
  fieldFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.ink,
    padding: 0,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.accent,
  },
  roundDisabled: {
    backgroundColor: colors.lineStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.75,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -spacing.xs,
  },
  hint: {
    ...type.caption,
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.muted,
  },
  error: {
    color: colors.error,
  },
})
