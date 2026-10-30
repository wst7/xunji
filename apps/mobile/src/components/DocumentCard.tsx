import { Ionicons } from '@expo/vector-icons'
import type { SearchResult } from '@xunji/shared'
import { formatRelativeDate, sourceLabel, SOURCE_TYPE_LABELS } from '@xunji/shared'
import { Pressable, Text, View } from 'react-native'
import { makeStyles, useTheme, withAlpha } from '../theme'
import { LivePostmark } from './Postmark'
import { SourceStamp } from './SourceStamp'

interface SearchResultCardProps {
  item: SearchResult
  onPress: () => void
  onTerminal?: (status: SearchResult['parse_status']) => void
  /** 最强命中：票与戳都大一号——排名用视觉重量表达，不用数字角标。 */
  strongest?: boolean
}

/**
 * 结果票：来源邮票居左，票面承载标题与摘要，底部一条发丝线分出
 * 「为什么找到它」的注记段，销戳压在注记右侧（形状即状态）。
 */
export function SearchResultCard({
  item,
  onPress,
  onTerminal,
  strongest = false,
}: SearchResultCardProps) {
  const theme = useTheme()
  const styles = useStyles()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title || item.url}
      android_ripple={{ color: withAlpha(theme.colors.onSurface, 0.08) }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <SourceStamp
          url={item.url}
          siteName={item.site_name}
          hole={theme.colors.card}
          size={strongest ? 44 : 40}
        />
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title || item.url}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {sourceLabel(item.url, item.site_name, SOURCE_TYPE_LABELS[item.source_type])} ·{' '}
            {formatRelativeDate(item.saved_at)}
          </Text>
          {item.summary && (
            <Text style={styles.summary} numberOfLines={2}>
              {item.summary}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.segment} />

      <View style={styles.noteRow}>
        <View style={styles.note}>
          <View style={styles.noteHead}>
            <Ionicons name="sparkles" size={13} color={theme.colors.primary} />
            <Text style={styles.noteLabel}>为什么找到它</Text>
          </View>
          <Text style={styles.noteText}>{item.match_reason}</Text>
          {item.matched_excerpt && (
            <Text style={styles.excerpt} numberOfLines={3}>
              {item.matched_excerpt}
            </Text>
          )}
        </View>
        <LivePostmark
          docId={item.document_id}
          savedAt={item.saved_at}
          status={item.parse_status}
          onTerminal={onTerminal}
          size={strongest ? 60 : 56}
          style={styles.postmark}
        />
      </View>
    </Pressable>
  )
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.shape.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
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
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...theme.type.titleMedium,
    color: theme.colors.text,
  },
  meta: {
    ...theme.type.bodySmall,
    marginTop: 2,
    flexShrink: 1,
    color: theme.colors.textMuted,
  },
  summary: {
    ...theme.type.bodyMedium,
    marginTop: 4,
    color: theme.colors.textMuted,
  },
  segment: {
    height: 1,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.divider,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  note: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  noteLabel: {
    ...theme.type.labelSmall,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.colors.primary,
  },
  noteText: {
    ...theme.type.bodyMedium,
    color: theme.colors.text,
  },
  excerpt: {
    ...theme.type.bodySmall,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  postmark: {
    // 票面上的戳：盖歪 −8°，并且不参与布局压缩（注记优先占宽）。
    transform: [{ rotate: '-8deg' }],
    marginBottom: -4,
  },
}))
