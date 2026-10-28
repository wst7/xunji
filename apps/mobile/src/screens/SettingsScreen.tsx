import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatDate } from '@xunji/shared'

import { AppTabBar } from '../components/AppTabBar'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Screen } from '../components/ui/Screen'
import { API_BASE } from '../config/env'
import { useAuth } from '../auth/AuthProvider'
import { useOutbox } from '../providers/OutboxProvider'
import { colors, fonts, radius, shadow, spacing, type } from '../theme'

const APP_NAME = '寻迹'

export function SettingsScreen() {
  const { user, signOut } = useAuth()
  const { pendingCount, flushing, retry } = useOutbox()
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  const initial = user?.email?.charAt(0).toUpperCase() ?? '拾'

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>我的</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? '正在读取账号……'}
            </Text>
            <Text style={styles.meta}>
              {user ? `加入于 ${formatDate(user.created_at)}` : '网络可用后会自动刷新账号信息。'}
            </Text>
          </View>
        </View>

        <Text style={styles.groupLabel}>同步</Text>
        <View style={styles.groupCard}>
          <View style={styles.row}>
            <View
              style={[
                styles.rowIcon,
                { backgroundColor: pendingCount > 0 ? colors.warningSoft : colors.successSoft },
              ]}
            >
              <Ionicons
                name={pendingCount > 0 ? 'cloud-offline-outline' : 'cloud-done-outline'}
                size={19}
                color={pendingCount > 0 ? colors.warning : colors.success}
              />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>待保存链接</Text>
              <Text style={styles.rowSub}>
                {pendingCount > 0
                  ? `${pendingCount} 条等待提交，联网后自动同步。`
                  : '没有待保存的内容，所有链接都已提交。'}
              </Text>
            </View>
            {pendingCount > 0 && (
              <Button
                label={flushing ? '同步中' : '同步'}
                onPress={retry}
                loading={flushing}
                variant="secondary"
                size="small"
              />
            )}
          </View>
        </View>

        <Text style={styles.groupLabel}>连接</Text>
        <View style={styles.groupCard}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="server-outline" size={19} color={colors.inkSoft} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>服务地址</Text>
              <Text style={styles.code} selectable>
                {API_BASE}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.note}>
            真机调试需把 API 地址设为电脑的局域网地址，并让 API 监听 0.0.0.0。
          </Text>
        </View>

        <Text style={styles.groupLabel}>隐私</Text>
        <View style={styles.groupCard}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="shield-checkmark-outline" size={19} color={colors.inkSoft} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>按账号隔离</Text>
              <Text style={styles.rowSub}>
                收藏、摘要与索引都只属于你，其他用户无法看到或搜索到。
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="key-outline" size={19} color={colors.inkSoft} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>登录状态</Text>
              <Text style={styles.rowSub}>
                令牌保存在系统钥匙串 / Keystore 中，最长保留 30 天；待保存队列只记录链接。
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => setConfirmingSignOut(true)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={19} color={colors.error} />
          <Text style={styles.signOutText}>退出登录</Text>
        </Pressable>

        <Text style={styles.footer}>{APP_NAME} · Xunji · Save anything. Find it by memory.</Text>
      </ScrollView>
      <AppTabBar active="settings" />
      <ConfirmDialog
        visible={confirmingSignOut}
        title="退出登录？"
        message="本机保存的登录状态会被清除，尚未同步的待保存链接也会清空。"
        confirmLabel="退出"
        destructive
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={() => {
          setConfirmingSignOut(false)
          void signOut()
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    ...type.display,
    color: colors.ink,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadow.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  profileBody: {
    flex: 1,
    gap: 2,
  },
  email: {
    ...type.title,
    color: colors.ink,
  },
  meta: {
    ...type.caption,
    color: colors.faint,
  },
  groupLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    ...type.caption,
    color: colors.faint,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.xs,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...type.body,
    fontWeight: '600',
    color: colors.ink,
  },
  rowSub: {
    ...type.caption,
    color: colors.muted,
  },
  code: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginVertical: spacing.md,
    marginLeft: 48,
  },
  note: {
    ...type.caption,
    color: colors.faint,
    marginLeft: 48,
  },
  signOut: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  signOutText: {
    ...type.body,
    color: colors.error,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  footer: {
    marginTop: spacing.xl,
    textAlign: 'center',
    ...type.caption,
    color: colors.faint,
  },
})
