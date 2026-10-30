import { Ionicons } from '@expo/vector-icons'
import type { RelatedItem } from '@xunji/shared'
import { dedupeRelated, domainOf, RELATION_LABELS } from '@xunji/shared'
import { Pressable, Text, View } from 'react-native'

import { makeStyles, useTheme } from '../theme'

export function RelatedList({
  items,
  onPress,
}: {
  items: RelatedItem[]
  onPress: (id: string) => void
}) {
  const theme = useTheme()
  const styles = useStyles()
  // The API can return the same document once per relation type; show each once.
  const unique = dedupeRelated(items)

  if (unique.length === 0) return null
  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Ionicons name="git-network-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.heading}>相关收藏</Text>
      </View>
      <View style={styles.card}>
        {unique.map((item, index) => (
          <Pressable
            key={item.document_id}
            onPress={() => onPress(item.document_id)}
            accessibilityRole="button"
            accessibilityLabel={item.title || item.url}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.divider,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title || item.url}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {RELATION_LABELS[item.relation_type] ?? item.relation_type} · {domainOf(item.url)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.outline} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  wrap: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  heading: {
    ...theme.type.labelMedium,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.shape.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 64,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  pressed: {
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.type.bodyLarge,
    fontWeight: '500',
    color: theme.colors.text,
  },
  meta: {
    ...theme.type.bodySmall,
    color: theme.colors.textMuted,
  },
}))
