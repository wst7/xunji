import { Ionicons } from '@expo/vector-icons'
import type { SearchResult } from '@xunji/shared'
import { domainOf, formatRelativeDate, sourceLabel, SOURCE_TYPE_LABELS } from '@xunji/shared'
import { Pressable, Text, View } from 'react-native'

import { makeStyles, useTheme, withAlpha } from '../theme'
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

/** MD3 elevated card：卡面承载标题与摘要，命中理由单独一块 secondaryContainer。 */
export function SearchResultCard({ item, onPress, onTerminal }: SearchResultCardProps) {
  const theme = useTheme()
  const styles = useStyles()
  const seed = sourceSeed(item.url, item.site_name)
  const tint = theme.tintFor(seed)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title || item.url}
      android_ripple={{ color: withAlpha(theme.colors.onSurface, 0.08) }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
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
          <Ionicons name="sparkles" size={14} color={theme.colors.onSecondaryContainer} />
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

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.shape.lg,
    padding: theme.spacing.lg,
    ...theme.elevation.level1,
  },
  pressed: {
    backgroundColor: theme.colors.cardMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.shape.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...theme.type.titleMedium,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metaRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: theme.spacing.sm,
    rowGap: theme.spacing.xs,
  },
  title: {
    ...theme.type.titleMedium,
    color: theme.colors.text,
  },
  summary: {
    ...theme.type.bodyMedium,
    marginTop: 4,
    color: theme.colors.textMuted,
  },
  meta: {
    ...theme.type.bodySmall,
    flexShrink: 1,
    color: theme.colors.textMuted,
  },
  matchBox: {
    marginTop: theme.spacing.md,
    marginLeft: 52,
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: theme.shape.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  matchHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchLabel: {
    ...theme.type.labelMedium,
    fontWeight: '600',
    color: theme.colors.onSecondaryContainer,
  },
  matchText: {
    ...theme.type.bodyMedium,
    color: theme.colors.onSecondaryContainer,
  },
  excerpt: {
    ...theme.type.bodySmall,
    color: theme.colors.onSecondaryContainer,
    opacity: 0.8,
  },
}))
