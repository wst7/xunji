import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, shadow, spacing, type } from '../theme'

export type TabKey = 'home' | 'documents' | 'settings'

type IconName = ComponentProps<typeof Ionicons>['name']

const TABS: {
  key: TabKey
  label: string
  href: '/' | '/documents' | '/settings'
  icon: IconName
  activeIcon: IconName
}[] = [
  { key: 'home', label: '首页', href: '/', icon: 'home-outline', activeIcon: 'home' },
  {
    key: 'documents',
    label: '收藏',
    href: '/documents',
    icon: 'bookmarks-outline',
    activeIcon: 'bookmarks',
  },
  { key: 'settings', label: '我的', href: '/settings', icon: 'person-outline', activeIcon: 'person' },
]

/**
 * 悬浮式底部标签栏：白色圆角栏浮在画布之上，选中项用浅靛蓝底 + 实心图标，
 * 既保留 Android 的拇指区习惯，又不让整屏被一条通栏分割线切断。
 */
export function AppTabBar({ active }: { active: TabKey }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.sm }]}
    >
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const selected = tab.key === active
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                if (!selected) router.replace(tab.href)
              }}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected }}
              android_ripple={{ color: colors.accentSoft, borderless: true }}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <View style={[styles.iconPill, selected && styles.iconPillActive]}>
                <Ionicons
                  name={selected ? tab.activeIcon : tab.icon}
                  size={22}
                  color={selected ? colors.accent : colors.tabInactive}
                />
              </View>
              <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    paddingHorizontal: spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 6,
    borderRadius: radius.card + 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.floating,
  },
  tab: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderRadius: radius.control,
  },
  pressed: {
    opacity: 0.7,
  },
  iconPill: {
    width: 48,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: colors.accentSoft,
  },
  label: {
    ...type.caption,
    fontSize: 11,
    lineHeight: 15,
    color: colors.tabInactive,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
})
