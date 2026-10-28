import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, shadow, spacing, type } from '../theme'

const STEPS = [
  {
    icon: 'link-outline' as const,
    title: '保存一个链接',
    body: '粘贴到上面的输入框，或在浏览器、微信里直接分享到拾回。',
  },
  {
    icon: 'sparkles-outline' as const,
    title: '它会自己整理',
    body: '后台抓取正文、生成摘要和关键词，通常几秒到半分钟。',
  },
  {
    icon: 'search-outline' as const,
    title: '用一句话找回',
    body: '比如「那篇讲睡眠和记忆的文章」，不必记得标题。',
  },
]

/** 首页首次使用的轻量引导：只在还没有任何收藏时出现，不占后续流程。 */
export function HomeOnboarding() {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>三件事，就能用好拾回</Text>
      <View style={styles.steps}>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name={step.icon} size={17} color={colors.accent} />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>
                <Text style={styles.stepIndex}>{index + 1}</Text> {step.title}
              </Text>
              <Text style={styles.stepText}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.footRow}>
        <Ionicons name="shield-checkmark-outline" size={13} color={colors.faint} />
        <Text style={styles.foot}>内容只属于你这个账号，其他人搜索不到。</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadow.card,
  },
  heading: {
    ...type.title,
    color: colors.ink,
  },
  steps: {
    gap: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    ...type.body,
    fontWeight: '600',
    color: colors.ink,
  },
  stepIndex: {
    color: colors.accent,
    fontWeight: '700',
  },
  stepText: {
    ...type.caption,
    color: colors.muted,
  },
  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
  },
  foot: {
    ...type.caption,
    flex: 1,
    color: colors.faint,
  },
})
