import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'

import { makeStyles, useTheme } from '../../theme'

interface TextFieldProps extends TextInputProps {
  label?: string
  hint?: string
  error?: string | null
}

/**
 * MD3 filled text field: tonal container, rounded top corners and a 2dp
 * indicator that turns primary on focus and error on validation failure.
 */
export function TextField({ label, hint, error, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const theme = useTheme()
  const styles = useStyles()
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.field}>
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
          placeholderTextColor={theme.colors.outline}
          selectionColor={theme.colors.primary}
          cursorColor={theme.colors.primary}
          style={[styles.input, rest.multiline && styles.inputMultiline, style]}
          accessibilityLabel={rest.accessibilityLabel ?? label}
        />
        <View
          style={[
            styles.indicator,
            focused && styles.indicatorFocused,
            !!error && styles.indicatorError,
          ]}
        />
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  wrap: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.type.bodySmall,
    color: theme.colors.textMuted,
    paddingHorizontal: theme.spacing.lg,
  },
  field: {
    backgroundColor: theme.colors.field,
    borderTopLeftRadius: theme.shape.sm,
    borderTopRightRadius: theme.shape.sm,
    overflow: 'hidden',
  },
  input: {
    ...theme.type.bodyLarge,
    minHeight: 56,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  inputMultiline: {
    minHeight: 112,
    paddingTop: theme.spacing.lg,
    textAlignVertical: 'top',
  },
  indicator: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  indicatorFocused: {
    height: 2,
    backgroundColor: theme.colors.primary,
  },
  indicatorError: {
    height: 2,
    backgroundColor: theme.colors.error,
  },
  hint: {
    ...theme.type.bodySmall,
    color: theme.colors.textMuted,
    paddingHorizontal: theme.spacing.lg,
  },
  error: {
    ...theme.type.bodySmall,
    color: theme.colors.error,
    paddingHorizontal: theme.spacing.lg,
  },
}))
