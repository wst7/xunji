import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'

import { makeStyles, useTheme } from '../theme'

interface AskCardProps {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  loading?: boolean
}

/**
 * 首页的「提问」面：MD3 elevated card + filled text field，
 * 提交按钮只输入内容后点亮，避免空查询发出无意义的请求。
 */
export function AskCard({ value, onChangeText, onSubmit, loading = false }: AskCardProps) {
  const theme = useTheme()
  const styles = useStyles()
  const [focused, setFocused] = useState(false)
  const ready = value.trim().length > 0 && !loading

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.softicon}>
          <Ionicons name="sparkles" size={20} color={theme.colors.onSecondaryContainer} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>提问</Text>
          <Text style={styles.sub}>描述你记得的内容，我来找</Text>
        </View>
      </View>

      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="比如：那篇讲睡眠不足为什么会让焦虑加重的文章"
          placeholderTextColor={theme.colors.outline}
          multiline
          maxLength={200}
          textAlignVertical="top"
          style={styles.input}
          selectionColor={theme.colors.primary}
          cursorColor={theme.colors.primary}
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
        <View style={[styles.indicator, focused && styles.indicatorFocused]} />
      </View>
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing.lg + 2,
    borderRadius: theme.shape.lgIncreased,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.md,
    ...theme.elevation.level1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  softicon: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.full,
    backgroundColor: theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
  },
  title: {
    ...theme.type.titleMedium,
    color: theme.colors.text,
  },
  sub: {
    ...theme.type.bodySmall,
    marginTop: 1,
    color: theme.colors.textMuted,
  },
  field: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopLeftRadius: theme.shape.sm,
    borderTopRightRadius: theme.shape.sm,
    backgroundColor: theme.colors.field,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    ...theme.type.bodyLarge,
    color: theme.colors.text,
    padding: 0,
    paddingTop: 1,
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
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: 'transparent',
  },
  indicatorFocused: {
    backgroundColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
}))
