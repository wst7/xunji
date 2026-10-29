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

import { colors, radius, shadow, spacing, type } from '../theme'

interface AskCardProps {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  loading?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * 首页的「提问」面：整块可书写的浅灰输入区，而不是一条细输入框。
 * 提交按钮只输入内容后点亮，避免空查询发出无意义的请求。
 */
export function AskCard({ value, onChangeText, onSubmit, loading = false, style }: AskCardProps) {
  const [focused, setFocused] = useState(false)
  const ready = value.trim().length > 0 && !loading

  return (
    <View style={[styles.card, style]}>
      <View style={styles.head}>
        <View style={styles.softicon}>
          <Ionicons name="sparkles" size={19} color={colors.accent} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>提问</Text>
          <Text style={styles.sub}>描述你记得的内容，我来找</Text>
        </View>
      </View>

      <View style={[styles.field, focused && styles.fieldFocused]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="比如：那篇讲睡眠不足为什么会让焦虑加重的文章"
          placeholderTextColor={colors.faint}
          multiline
          maxLength={200}
          textAlignVertical="top"
          style={styles.input}
          selectionColor={colors.accent}
          returnKeyType="search"
          submitBehavior="submit"
          onSubmitEditing={() => {
            if (ready) onSubmit()
          }}
          accessibilityLabel="描述你想找回的内容"
          editable={!loading}
        />
        <Pressable
          onPress={onSubmit}
          disabled={!ready}
          accessibilityRole="button"
          accessibilityLabel={loading ? '查找中' : '开始查找'}
          accessibilityState={{ disabled: !ready, busy: loading }}
          style={({ pressed }) => [
            styles.round,
            !ready && styles.roundDisabled,
            pressed && styles.pressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons
              name="arrow-forward"
              size={20}
              color={ready ? colors.surface : colors.faint}
            />
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg + 4,
    borderRadius: radius.card + 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.md + 2,
    ...shadow.action,
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
  title: {
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
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    alignSelf: 'stretch',
    fontSize: 15.5,
    lineHeight: 24,
    color: colors.ink,
    padding: 0,
    paddingTop: 1,
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
})
