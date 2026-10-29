import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import { colors, radius, type } from '../../theme'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'default' | 'small'
type IconName = ComponentProps<typeof Ionicons>['name']

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  icon?: IconName
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

const ICON_COLORS: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.ink,
  ghost: colors.accent,
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  icon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'small' ? styles.small : styles.defaultSize,
        variantStyles[variant],
        pressed && !inactive && pressedStyles[variant],
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? colors.white : colors.accent} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={18} color={ICON_COLORS[variant]} />}
          <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
        </View>
      )}
    </Pressable>
  )
}

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.lineStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
})

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accentDeep, borderColor: colors.accentDeep },
  secondary: { backgroundColor: colors.surfaceMuted },
  ghost: { backgroundColor: colors.accentSoft },
})

const labelStyles = StyleSheet.create({
  primary: { color: colors.white },
  secondary: { color: colors.ink },
  ghost: { color: colors.accent },
})

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  defaultSize: {
    minHeight: 52,
  },
  small: {
    minHeight: 44,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    ...type.body,
    fontWeight: '600',
  },
})
