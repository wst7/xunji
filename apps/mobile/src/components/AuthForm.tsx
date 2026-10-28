import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { colors, radius, shadow, spacing, type } from '../theme'
import { Button } from './ui/Button'
import { Notice } from './ui/Notice'
import { Screen } from './ui/Screen'
import { TextField } from './ui/TextField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const APP_NAME = '拾回'

interface AuthFormProps {
  title: string
  submitLabel: string
  onSubmit: (email: string, password: string) => Promise<void>
  newPassword?: boolean
  footerText: string
  footerLinkLabel: string
  onFooterPress: () => void
}

/** 登录/注册共用：邮箱格式 + 密码至少 8 位；服务端错误显示在表单顶部。 */
export function AuthForm({
  title,
  submitLabel,
  onSubmit,
  newPassword = false,
  footerText,
  footerLinkLabel,
  onFooterPress,
}: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (busy) return
    const nextEmailError = EMAIL_PATTERN.test(email.trim()) ? null : '请输入有效的邮箱地址。'
    const nextPasswordError = password.length >= 8 ? null : '密码至少需要 8 位。'
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    if (nextEmailError || nextPasswordError) return

    setFormError(null)
    setBusy(true)
    try {
      await onSubmit(email.trim(), password)
      // 登录成功后的跳转统一交给根布局（可能还要消费未登录时的分享）。
    } catch (e) {
      setFormError(
        e && typeof e === 'object' && 'message' in e && (e as Error).message
          ? (e as Error).message
          : '请求失败，请稍后重试。',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      {/*
        Android 启用 edge-to-edge 后系统不再自动为键盘缩小窗口，
        所以两端都必须显式做 padding，否则按钮会被键盘盖住。
      */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.mark}>
              <Ionicons name="bookmark" size={28} color={colors.surface} />
            </View>
            <Text style={styles.brandName}>{APP_NAME}</Text>
            <Text style={styles.tagline}>你只需要记得，你想找什么。</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {formError && <Notice text={formError} tone="error" />}

            <TextField
              label="邮箱"
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                if (emailError) setEmailError(null)
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              error={emailError}
            />
            <TextField
              label="密码"
              value={password}
              onChangeText={(text) => {
                setPassword(text)
                if (passwordError) setPasswordError(null)
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={newPassword ? 'newPassword' : 'password'}
              placeholder="至少 8 位"
              error={passwordError}
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
            />

            <Button
              label={busy ? '提交中…' : submitLabel}
              onPress={() => void submit()}
              loading={busy}
              style={styles.blockButton}
            />

            <Text style={styles.footer}>
              {footerText}
              <Text style={styles.footerLink} onPress={onFooterPress} accessibilityRole="link">
                {footerLinkLabel}
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  brandName: {
    ...type.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  tagline: {
    ...type.caption,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadow.card,
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  blockButton: {
    marginTop: spacing.xs,
  },
  footer: {
    textAlign: 'center',
    ...type.caption,
    color: colors.muted,
  },
  footerLink: {
    color: colors.accent,
    fontWeight: '600',
  },
})
