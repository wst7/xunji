import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { colors, radius, shadow, spacing, type } from '../theme'

interface SearchFieldProps {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  loading?: boolean
  autoFocus?: boolean
}

/**
 * 搜索结果页的搜索条：聚焦时整圈靛蓝 + 柔和外圈，
 * 输入框里直接给一个清空按钮，回车或右箭头发起检索。
 */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  loading = false,
  autoFocus = false,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false)
  const query = value.trim()
  const ready = query.length > 0 && !loading

  return (
    <View style={[styles.box, focused && styles.boxFocused]}>
      <Ionicons
        name="search-outline"
        size={20}
        color={focused ? colors.accent : colors.faint}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="描述你记得的内容"
        placeholderTextColor={colors.faint}
        style={styles.input}
        selectionColor={colors.accent}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        accessibilityLabel="搜索你收藏过的内容"
        editable={!loading}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="清空输入"
          hitSlop={8}
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
        >
          <Ionicons name="close-circle" size={18} color={colors.faint} />
        </Pressable>
      )}
      <Pressable
        onPress={onSubmit}
        disabled={!ready}
        accessibilityRole="button"
        accessibilityLabel={loading ? '查找中' : '找回'}
        accessibilityState={{ disabled: !ready, busy: loading }}
        style={({ pressed }) => [
          styles.submit,
          !ready && styles.submitDisabled,
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
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
    minHeight: 56,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    paddingLeft: spacing.lg,
    paddingRight: 6,
    ...shadow.card,
  },
  boxFocused: {
    borderColor: colors.accent,
    ...shadow.accent,
    shadowOpacity: 0.18,
  },
  input: {
    ...type.body,
    flex: 1,
    minHeight: 44,
    color: colors.ink,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  clear: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.accent,
  },
  submitDisabled: {
    backgroundColor: colors.lineStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.75,
  },
})
