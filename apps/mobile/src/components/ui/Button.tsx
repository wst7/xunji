import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import { makeStyles, useTheme, withAlpha } from '../../theme'
import type { AppTheme } from '../../theme'

/** primary = filled，tonal = 次要强调，secondary = outlined，ghost = text。 */
type Variant = 'primary' | 'tonal' | 'secondary' | 'ghost'
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

/** 文字/图标颜色：填充按钮用 onPrimary，其余用 primary 语义色。 */
function foreground(theme: AppTheme, variant: Variant): string {
  switch (variant) {
    case 'primary':
      return theme.colors.onPrimary
    case 'tonal':
      return theme.colors.onSecondaryContainer
    case 'secondary':
    case 'ghost':
      return theme.colors.primary
  }
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
  const theme = useTheme()
  const styles = useStyles()
  const inactive = disabled || loading
  const fg = foreground(theme, variant)
  const iconSize = size === 'small' ? 16 : 18

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      android_ripple={{ color: withAlpha(fg, 0.16) }}
      style={({ pressed }) => [
        styles.base,
        size === 'small' ? styles.small : styles.defaultSize,
        styles[variant],
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={iconSize} color={fg} />}
          <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const useStyles = makeStyles((theme) => ({
  base: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: theme.shape.full,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  defaultSize: {
    minHeight: 48,
  },
  small: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.lg,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  tonal: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  secondary: {
    borderColor: theme.colors.outline,
  },
  ghost: {},
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.38,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.type.labelLarge,
    fontWeight: '600',
  },
}))
