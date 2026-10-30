import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'

import { Button } from './Button'
import { makeStyles, useTheme } from '../../theme'

interface EmptyStateProps {
  /** 空状态用一个贴题的图标，而不是所有页面共用一个“空托盘”。 */
  icon?: 'file-tray-outline' | 'bookmarks-outline' | 'search-outline' | 'cloud-offline-outline'
  title: string
  body?: string
  action?: { label: string; onPress: () => void }
}

export function EmptyState({ icon = 'file-tray-outline', title, body, action }: EmptyStateProps) {
  const theme = useTheme()
  const styles = useStyles()

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={32} color={theme.colors.onSecondaryContainer} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body && <Text style={styles.body}>{body}</Text>}
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="tonal"
          size="small"
          style={styles.action}
        />
      )}
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  wrap: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 68,
    height: 68,
    // 空状态＝一枚还没贴票的位子：邮票形、齿孔打穿露底纸。
    borderRadius: 6,
    backgroundColor: theme.colors.secondaryContainer,
    borderWidth: 3,
    borderStyle: 'dotted',
    borderColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    transform: [{ rotate: '-6deg' }],
  },
  title: {
    ...theme.type.headlineSmall,
    color: theme.colors.text,
    textAlign: 'center',
  },
  body: {
    ...theme.type.bodyMedium,
    color: theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    marginTop: theme.spacing.lg,
  },
}))
