import { Ionicons } from '@expo/vector-icons'
import type { DocumentSummary, SearchResult } from '@xunji/shared'
import { domainOf, formatRelativeDate, sourceLabel, SOURCE_TYPE_LABELS } from '@xunji/shared'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, shadow, spacing, type } from '../theme'
import { LiveStatusBadge } from './LiveStatusBadge'

function domainInitial(url: string): string {
  const host = domainOf(url).replace(/^www\./i, '')
  return host.charAt(0).toUpperCase() || '拾'
}

interface DocumentCardProps {
  doc: DocumentSummary
  onPress: () => void
  onTerminal?: (status: DocumentSummary['parse_status']) => void
}

export function DocumentCard({ doc, onPress, onTerminal }: DocumentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={doc.title || doc.url}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{domainInitial(doc.url)}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {doc.title || doc.url}
          </Text>
          {doc.summary_short && (
            <Text style={styles.summary} numberOfLines={2}>
              {doc.summary_short}
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.meta} numberOfLines={1}>
              {sourceLabel(doc.url, doc.site_name, SOURCE_TYPE_LABELS[doc.source_type])} ·{' '}
              {formatRelativeDate(doc.saved_at)}
            </Text>
            <LiveStatusBadge docId={doc.id} status={doc.parse_status} onTerminal={onTerminal} />
          </View>
        </View>
      </View>
    </Pressable>
  )
}

interface SearchResultCardProps {
  item: SearchResult
  onPress: () => void
  onTerminal?: (status: SearchResult['parse_status']) => void
}

export function SearchResultCard({ item, onPress, onTerminal }: SearchResultCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title || item.url}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{domainInitial(item.url)}</Text>
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
            <Text style={styles.summary} numberOfLines={3}>
              {item.summary}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.matchBox}>
        <View style={styles.matchHead}>
          <Ionicons name="sparkles-outline" size={13} color={colors.accent} />
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
    padding: spacing.lg,
    ...shadow.card,
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
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.xs,
  },
  title: {
    ...type.title,
    color: colors.ink,
  },
  summary: {
    ...type.body,
    color: colors.muted,
  },
  meta: {
    ...type.caption,
    flexShrink: 1,
    color: colors.faint,
  },
  matchBox: {
    marginTop: spacing.md,
    marginLeft: 52,
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  matchHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchLabel: {
    ...type.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  matchText: {
    ...type.body,
    color: colors.inkSoft,
  },
  excerpt: {
    ...type.caption,
    color: colors.muted,
    fontStyle: 'italic',
  },
})
