import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, spacing, type } from '../theme'

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

/** 底部标签栏固定在拇指区，选中项用品牌色 + 实心图标，不只靠颜色区分。 */
export function AppTabBar({ active }: { active: TabKey }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
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
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Ionicons
              name={selected ? tab.activeIcon : tab.icon}
              size={24}
              color={selected ? colors.accent : colors.tabInactive}
            />
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
  },  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 52,
  },
  pressed: {
    opacity: 0.55,
  },
  label: {
    ...type.caption,
    color: colors.tabInactive,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
})
