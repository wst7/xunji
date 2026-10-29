import { Ionicons } from '@expo/vector-icons'
import type { SearchResult } from '@xunji/shared'
import { domainOf, formatRelativeDate, sourceLabel, SOURCE_TYPE_LABELS } from '@xunji/shared'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, shadow, spacing, tintFor } from '../theme'
import { LiveStatusBadge } from './LiveStatusBadge'

/** 有站点名就用站点名首字（“知”“少”），否则退回域名首字母；颜色由来源稳定决定。 */
function sourceSeed(url: string, siteName: string | null): string {
  return (siteName && siteName.trim()) || domainOf(url).replace(/^www\./i, '') || '拾'
}

function initialOf(seed: string): string {
  return Array.from(seed.trim())[0] ?? '拾'
}

interface SearchResultCardProps {
  item: SearchResult
  onPress: () => void
  onTerminal?: (status: SearchResult['parse_status']) => void
}

export function SearchResultCard({ item, onPress, onTerminal }: SearchResultCardProps) {
  const seed = sourceSeed(item.url, item.site_name)
  const tint = tintFor(seed)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title || item.url}
      style={({ pressed }) => [styles.card, styles.stacked, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
          <Text style={[styles.avatarText, { color: tint.fg }]}>{initialOf(seed)}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title || item.url}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta} numberOfLines={1}>
              {sourceLabel(item.url, item.site_name, SOURCE_TYPE_LABELS[item.source_type])} ·{' '}
              {formatRelativeDate(item.saved_at)}
            </Text>
            <LiveStatusBadge
              docId={item.document_id}
              status={item.parse_status}
              onTerminal={onTerminal}
            />
          </View>
          {item.summary && (
            <Text style={styles.summary} numberOfLines={2}>
              {item.summary}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.matchBox}>
        <View style={styles.matchHead}>
          <Ionicons name="sparkles" size={13} color={colors.accent} />
          <Text style={styles.matchLabel}>为什么找到它</Text>
        </View>
        <Text style={styles.matchText}>{item.match_reason}</Text>
        {item.matched_excerpt && (
          <Text style={styles.excerpt} numberOfLines={3}>
            {item.matched_excerpt}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: spacing.lg,
    ...shadow.card,
  },
  stacked: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: colors.surfaceMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  metaRow: {
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.xs,
  },
  title: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors.ink,
  },
  summary: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  meta: {
    fontSize: 11.5,
    lineHeight: 16,
    flexShrink: 1,
    color: colors.faint,
  },
  matchBox: {
    marginTop: spacing.md,
    marginLeft: 52,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentLine,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs,
  },
  matchHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  matchLabel: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.accent,
  },
  matchText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkSoft,
  },
  excerpt: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.muted,
  },
})

