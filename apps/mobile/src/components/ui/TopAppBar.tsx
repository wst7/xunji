import type { ComponentProps, ReactNode } from 'react'
import { Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import { IconButton } from './IconButton'
import { makeStyles } from '../../theme'

type IconName = ComponentProps<typeof IconButton>['name']

interface TopAppBarProps {
  title?: string
  subtitle?: string
  /** small = 64；large = 152，标题沉在底部，随内容一起滚走。 */
  variant?: 'small' | 'large'
  onBack?: () => void
  backIcon?: IconName
  backLabel?: string
  centerTitle?: boolean
  actions?: ReactNode
  style?: StyleProp<ViewStyle>
}

export function TopAppBar({
  title,
  subtitle,
  variant = 'small',
  onBack,
  backIcon = 'arrow-back',
  backLabel = '返回',
  centerTitle = false,
  actions,
  style,
}: TopAppBarProps) {
  const styles = useStyles()
  const leading = onBack ? (
    <IconButton name={backIcon} onPress={onBack} accessibilityLabel={backLabel} />
  ) : null

  if (variant === 'large') {
    return (
      <View style={[styles.large, style]}>
        <View style={styles.largeTop}>
          <View style={styles.largeLead}>{leading}</View>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
        <View>
          {title ? <Text style={styles.largeTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.largeSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.small, style]}>
      {leading}
      <Text style={[styles.title, centerTitle && styles.titleCentered]} numberOfLines={1}>
        {title ?? ''}
      </Text>
      {actions ? (
        <View style={styles.actions}>{actions}</View>
      ) : centerTitle ? (
        <View style={styles.actionPlaceholder} />
      ) : null}
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  small: {
    minHeight: theme.layout.appBarSmall,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.type.titleLarge,
    flex: 1,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.sm,
  },
  titleCentered: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionPlaceholder: {
    width: theme.layout.iconButton,
  },
  large: {
    minHeight: theme.layout.appBarLarge,
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing.xl + theme.spacing.xs,
    justifyContent: 'space-between',
  },
  largeTop: {
    height: theme.layout.appBarSmall,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -theme.spacing.md,
  },
  largeLead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeTitle: {
    ...theme.type.headlineMedium,
    color: theme.colors.text,
  },
  largeSubtitle: {
    ...theme.type.bodyMedium,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
}))
