import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { extractHttpUrl, isValidHttpUrl } from '@xunji/shared'

import { titleHintFrom } from '../local/util'
import { makeStyles, useTheme } from '../theme'

interface SaveFieldProps {
  onSave: (url: string, titleHint: string | null) => Promise<boolean>
  onFocus?: () => void
  disabled?: boolean
}

/** 只输入了域名（没有协议）时补上 https://，避免用户被“没有链接”挡住。 */
function withScheme(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 500 || /\s/.test(trimmed)) return null
  if (!/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i.test(trimmed)) return null
  return `https://${trimmed}`
}

/**
 * 首页的「收藏」面：filled card + 单行 filled field，
 * 识别成功才点亮保存按钮；分享进来的整段文字也能直接放进来。
 */
export function SaveField({ onSave, onFocus, disabled = false }: SaveFieldProps) {
  const theme = useTheme()
  const styles = useStyles()
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
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.softicon}>
          <Ionicons name="add" size={20} color={theme.colors.onPrimaryContainer} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.label}>收藏</Text>
          <Text style={styles.sub}>粘贴链接，自动抓取正文</Text>
        </View>
      </View>

      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text)
            if (error) setError(null)
          }}
          onFocus={() => {
            setFocused(true)
            onFocus?.()
          }}
          onBlur={() => setFocused(false)}
          placeholder="https://mp.weixin.qq.com/s/…"
          placeholderTextColor={theme.colors.outline}
          maxLength={4000}
          style={styles.input}
          selectionColor={theme.colors.primary}
          cursorColor={theme.colors.primary}
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
          style={({ pressed }) => [styles.submitHit, pressed && styles.pressed]}
        >
          <View style={[styles.submit, !ready && styles.submitDisabled]}>
            {busy ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Ionicons
                name="arrow-up"
                size={20}
                color={ready ? theme.colors.onPrimary : theme.colors.textMuted}
              />
            )}
          </View>
        </Pressable>
        <View style={[styles.indicator, focused && styles.indicatorFocused]} />
      </View>

      {error ? (
        <View style={styles.hintRow}>
          <Ionicons name="alert-circle-outline" size={14} color={theme.colors.error} />
          <Text style={[styles.hint, styles.error]} numberOfLines={1}>
            {error}
          </Text>
        </View>
      ) : extraText && detectedUrl ? (
        <View style={styles.hintRow}>
          <Ionicons name="link-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.hint} numberOfLines={1}>
            {detectedUrl}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing.lg + 2,
    borderRadius: theme.shape.lgIncreased,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.md,
    ...theme.elevation.level1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  softicon: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
  },
  label: {
    ...theme.type.titleMedium,
    color: theme.colors.text,
  },
  sub: {
    ...theme.type.bodySmall,
    marginTop: 1,
    color: theme.colors.textMuted,
  },
  field: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xs,
    borderTopLeftRadius: theme.shape.sm,
    borderTopRightRadius: theme.shape.sm,
    backgroundColor: theme.colors.field,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: 44,
    ...theme.type.bodyLarge,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  submitHit: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: 'transparent',
  },
  indicatorFocused: {
    backgroundColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -theme.spacing.xs,
  },
  hint: {
    ...theme.type.bodySmall,
    flex: 1,
    color: theme.colors.textMuted,
  },
  error: {
    color: theme.colors.error,
  },
}))
