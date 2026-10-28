import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'

import { colors, radius, spacing, type } from '../../theme'

interface TextFieldProps extends TextInputProps {
  label?: string
  hint?: string
  error?: string | null
}

export function TextField({ label, hint, error, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        placeholderTextColor={colors.faint}
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          style,
        ]}
        selectionColor={colors.accent}
        accessibilityLabel={rest.accessibilityLabel ?? label}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    ...type.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  input: {
    ...type.body,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.control,
    backgroundColor: colors.surfaceMuted,
    color: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  hint: {
    ...type.caption,
    color: colors.faint,
  },
  error: {
    ...type.caption,
    color: colors.error,
  },
})
