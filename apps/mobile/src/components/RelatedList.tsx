import { Ionicons } from '@expo/vector-icons'
import type { RelatedItem } from '@recall/shared'
import { dedupeRelated, domainOf, RELATION_LABELS } from '@recall/shared'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, shadow, spacing, type } from '../theme'

export function RelatedList({
  items,
  onPress,
}: {
  items: RelatedItem[]
  onPress: (id: string) => void
}) {
  // The API can return the same document once per relation type; show each once.
  const unique = dedupeRelated(items)

  if (unique.length === 0) return null
  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Ionicons name="git-network-outline" size={15} color={colors.muted} />
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
            <Ionicons name="chevron-forward" size={16} color={colors.faint} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
  heading: {
    ...type.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...type.body,
    fontWeight: '600',
    color: colors.ink,
  },
  meta: {
    ...type.caption,
    color: colors.faint,
  },
})
