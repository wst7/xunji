import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import { makeStyles, useTheme, withAlpha } from '../../theme'
import type { AppTheme } from '../../theme'

type IconName = ComponentProps<typeof Ionicons>['name']
type Variant = 'standard' | 'filled' | 'tonal' | 'outlined'

interface IconButtonProps {
  name: IconName
  onPress: () => void
  accessibilityLabel: string
  variant?: Variant
  /** Override the icon color, e.g. error red for delete actions. */
  color?: string
  disabled?: boolean
  iconSize?: number
  style?: StyleProp<ViewStyle>
}

function foreground(theme: AppTheme, variant: Variant): string {
  switch (variant) {
    case 'filled':
      return theme.colors.onPrimary
    case 'tonal':
      return theme.colors.onSecondaryContainer
    case 'outlined':
    case 'standard':
      return theme.colors.onSurfaceVariant
  }
}

/** 40dp visual container inside a 48dp touch target. */
export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  variant = 'standard',
  color,
  disabled = false,
  iconSize = 22,
  style,
}: IconButtonProps) {
  const theme = useTheme()
  const styles = useStyles()
  const fg = color ?? foreground(theme, variant)

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      android_ripple={{ color: withAlpha(fg, 0.16), borderless: true, radius: 24 }}
      style={[styles.hit, style]}
    >
      <View
        style={[
          styles.container,
          variant === 'filled' && styles.filled,
          variant === 'tonal' && styles.tonal,
          variant === 'outlined' && styles.outlined,
          disabled && styles.disabled,
        ]}
      >
        <Ionicons name={name} size={iconSize} color={fg} />
      </View>
    </Pressable>
  )
}

const useStyles = makeStyles((theme) => ({
  hit: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: theme.colors.primary,
  },
  tonal: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  disabled: {
    opacity: 0.38,
  },
}))
