import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, touch } from '../../theme'

interface ScreenHeaderProps {
  title?: string
  backLabel?: string
  onBack?: () => void
  right?: ReactNode
}

export function ScreenHeader({ title, backLabel = '返回', onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={8}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>‹ {backLabel}</Text>
          </Pressable>
        )}
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  side: {
    width: 84,
    justifyContent: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  back: {
    minHeight: touch,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  backText: {
    color: colors.accent,
    fontSize: 15,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
})
