import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { AppState, StyleSheet, Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { ClipboardPrompt } from '../src/components/ClipboardPrompt'
import { getDb } from '../src/local/db'
import { processPendingQueue } from '../src/local/pipeline'
import { ToastProvider } from '../src/providers/ToastProvider'
import { ShareIntentBridge } from '../src/share/ShareIntentBridge'
import { colors, type } from '../src/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ToastProvider>
        <RootNavigator />
      </ToastProvider>
    </SafeAreaProvider>
  )
}

function RootNavigator() {
  const [ready, setReady] = useState(false)

  // 打开本地库后继续处理上次没整理完的收藏；回到前台时再扫一遍。
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await getDb()
      } finally {
        if (!cancelled) setReady(true)
      }
      void processPendingQueue()
    })()

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void processPendingQueue()
    })
    return () => {
      cancelled = true
      sub.remove()
    }
  }, [])

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
      <ShareIntentBridge />
      <ClipboardPrompt enabled={ready} />
      {!ready && (
        <View style={styles.splash}>
          <View style={styles.mark}>
            <Ionicons name="bookmark" size={30} color={colors.surface} />
          </View>
          <Text style={styles.brand}>寻迹 · Xunji</Text>
          <Text style={styles.tagline}>Save anything. Find it by memory.</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brand: {
    ...type.display,
    fontSize: 32,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  mark: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tagline: {
    color: colors.muted,
    fontSize: 13,
  },
})
