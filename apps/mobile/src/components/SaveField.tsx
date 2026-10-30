import { Ionicons } from '@expo/vector-icons'
import { useRef, useState } from 'react'
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { extractHttpUrl, isValidHttpUrl } from '@xunji/shared'

import { titleHintFrom } from '../local/util'
import { LivePostmark } from './Postmark'
import { makeStyles, useTheme } from '../theme'

export interface SaveResult {
  id: string
  duplicate: boolean
}

interface SaveFieldProps {
  /** 返回 null＝没存上（错误提示由调用方的 toast 承担）；SaveField 只管签名。 */
  onSave: (url: string, titleHint: string | null) => Promise<SaveResult | null>
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
 * 首页的「收藏」面：ticket card + 单行 filled field，识别成功才点亮保存按钮。
 *
 * 签名动作：保存成功的一瞬，一枚销戳从高处以 expressive spring 弹压到
 * 票面右上角（−24° → −8°，缩放收敛），然后作为收据留场——挂本机轮询，
 * 虚圈自己变实圈或划销。系统开启「移除动画」时直接落位。
 */
export function SaveField({ onSave, onFocus, disabled = false }: SaveFieldProps) {
  const theme = useTheme()
  const styles = useStyles()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const [stamped, setStamped] = useState<SaveResult | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const press = useRef(new Animated.Value(0)).current

  const detectedUrl = extractHttpUrl(value) ?? withScheme(value)
  const extraText = detectedUrl !== null && value.trim() !== detectedUrl
  const ready = !disabled && !busy && detectedUrl !== null && isValidHttpUrl(detectedUrl)

  async function stampPress() {
    const reduced = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false)
    if (reduced) {
      press.setValue(1)
      return
    }
    press.setValue(0)
    Animated.spring(press, {
      toValue: 1,
      damping: 14,
      stiffness: 190,
      mass: 0.8,
      useNativeDriver: true,
    }).start()
  }

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
      const result = await onSave(detectedUrl, titleHintFrom(value, detectedUrl))
      if (result) {
        setValue('')
        if (!result.duplicate) {
          setStamped(result)
          setSavedAt(new Date().toISOString())
          void stampPress()
        }
      }
    } catch {
      setError('保存失败，请稍后重试。')
    } finally {
      setBusy(false)
    }
  }

  const stampScale = press.interpolate({ inputRange: [0, 1], outputRange: [1.5, 1] })
  const stampRotate = press.interpolate({ inputRange: [0, 1], outputRange: ['-24deg', '-8deg'] })

  return (
    <View style={styles.card}>
      {stamped && savedAt && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.stamp,
            { opacity: press, transform: [{ scale: stampScale }, { rotate: stampRotate }] },
          ]}
        >
          <LivePostmark
            docId={stamped.id}
            savedAt={savedAt}
            status="pending"
            size={56}
          />
        </Animated.View>
      )}
      <View style={styles.head}>
        <View style={styles.softicon}>
          <Ionicons name="add" size={20} color={theme.colors.onPrimaryContainer} />
        </View>
        <View style={[styles.headText, stamped && styles.headTextStamped]}>
          <Text style={styles.label}>收藏</Text>
          <Text style={styles.sub}>粘贴链接，自动抓取正文</Text>
        </View>
      </View>
      <View style={styles.segment} />

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
          placeholderTextColor={theme.colors.textMuted}
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
    position: 'relative',
    padding: theme.spacing.lg + 2,
    borderRadius: theme.shape.md,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.md,
    ...theme.elevation.level1,
  },
  stamp: {
    position: 'absolute',
    top: -10,
    right: 14,
    zIndex: 1,
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
  headTextStamped: {
    // 给销戳让位：收据压在票面右上，标题行不再顶满。
    paddingRight: 64,
  },
  segment: {
    height: 1,
    backgroundColor: theme.colors.divider,
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
