import type { ComponentProps } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { makeStyles, useTheme, withAlpha } from '../theme'

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
 * MD3 NavigationBar：通栏贴在底部、surfaceContainer 底色，
 * 选中项是 64×32 的 secondaryContainer 胶囊 + 实心图标。
 */
export function AppTabBar({ active }: { active: TabKey }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const styles = useStyles()

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: insets.bottom }]}
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
              android_ripple={{ color: withAlpha(theme.colors.primary, 0.12) }}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <View style={[styles.iconPill, selected && styles.iconPillActive]}>
                <Ionicons
                  name={selected ? tab.activeIcon : tab.icon}
                  size={24}
                  color={selected ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant}
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

const useStyles = makeStyles((theme) => ({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: theme.colors.surfaceContainer,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.layout.navBarHeight,
    paddingHorizontal: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  iconPill: {
    width: 64,
    height: 32,
    borderRadius: theme.shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  label: {
    ...theme.type.labelMedium,
    color: theme.colors.onSurfaceVariant,
  },
  labelActive: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
}))
