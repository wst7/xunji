import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { colors, radius, shadow, spacing, type } from '../theme'

interface SearchFieldProps {
  onSubmit: (query: string) => void
  loading?: boolean
}

export function SearchField({ onSubmit, loading = false }: SearchFieldProps) {
  const [value, setValue] = useState('')
  const query = value.trim()

  function submit() {
    if (!query || loading) return
    onSubmit(query)
  }

  return (
    <View style={styles.box}>
      <Ionicons name="search-outline" size={20} color={colors.faint} />
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="想找回什么？描述一下内容"
        placeholderTextColor={colors.faint}
        style={styles.input}
        selectionColor={colors.accent}
        returnKeyType="search"
        onSubmitEditing={submit}
        accessibilityLabel="搜索你收藏过的内容"
        editable={!loading}
      />
      {query ? (
        <Pressable
          onPress={submit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="找回"
          accessibilityState={{ disabled: loading, busy: loading }}
          style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons name="arrow-forward" size={20} color={colors.surface} />
          )}
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingLeft: spacing.lg,
    paddingRight: 6,
    ...shadow.card,
  },
  input: {
    ...type.body,
    flex: 1,
    minHeight: 44,
    color: colors.ink,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  submit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
})
