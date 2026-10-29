import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native'

import { IconButton } from './ui/IconButton'
import { makeStyles, useTheme } from '../theme'

interface SearchFieldProps {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  loading?: boolean
  autoFocus?: boolean
}

/**
 * MD3 search bar：surfaceContainerHigh、完整圆角、56 高，
 * 聚焦时描一圈 primary，尾部是 40dp 的填充式提交按钮。
 */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  loading = false,
  autoFocus = false,
}: SearchFieldProps) {
  const theme = useTheme()
  const styles = useStyles()
  const [focused, setFocused] = useState(false)
  const query = value.trim()
  const ready = query.length > 0 && !loading

  return (
    <View style={[styles.box, focused && styles.boxFocused]}>
      <Ionicons
        name="search-outline"
        size={20}
        color={focused ? theme.colors.primary : theme.colors.textMuted}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="描述你记得的内容"
        placeholderTextColor={theme.colors.outline}
        style={styles.input}
        selectionColor={theme.colors.primary}
        cursorColor={theme.colors.primary}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        accessibilityLabel="搜索你收藏过的内容"
        editable={!loading}
      />
      {value.length > 0 && (
        <IconButton
          name="close"
          onPress={() => onChangeText('')}
          accessibilityLabel="清空输入"
          iconSize={18}
        />
      )}
      <Pressable
        onPress={onSubmit}
        disabled={!ready}
        accessibilityRole="button"
        accessibilityLabel={loading ? '查找中' : '找回'}
        accessibilityState={{ disabled: !ready, busy: loading }}
        style={({ pressed }) => [styles.submitHit, pressed && styles.pressed]}
      >
        <View style={[styles.submit, !ready && styles.submitDisabled]}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <Ionicons
              name="arrow-forward"
              size={20}
              color={ready ? theme.colors.onPrimary : theme.colors.textMuted}
            />
          )}
        </View>
      </Pressable>
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 56,
    borderRadius: theme.shape.full,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.xs,
  },
  boxFocused: {
    borderColor: theme.colors.primary,
  },
  input: {
    ...theme.type.bodyLarge,
    flex: 1,
    minHeight: 44,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 0,
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
    backgroundColor: theme.colors.field,
  },
  pressed: {
    opacity: 0.75,
  },
}))
