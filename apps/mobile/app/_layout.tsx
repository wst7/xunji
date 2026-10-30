import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { AppState, Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { ClipboardPrompt } from '../src/components/ClipboardPrompt'
import { getDb } from '../src/local/db'
import { processPendingQueue } from '../src/local/pipeline'
import { ToastProvider } from '../src/providers/ToastProvider'
import { ShareIntentBridge } from '../src/share/ShareIntentBridge'
import { ThemeProvider, makeStyles, useTheme } from '../src/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedShell />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

/** StatusBar 与 Toast 都要跟着明暗切换，所以放在 ThemeProvider 里层。 */
function ThemedShell() {
  const theme = useTheme()
  // Android 的根视图默认是白底，跟随主题换掉，避免切换/启动时闪一下。
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.canvas).catch(() => undefined)
  }, [theme])
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ToastProvider>
        <RootNavigator />
      </ToastProvider>
    </>
  )
}

function RootNavigator() {
  const [ready, setReady] = useState(false)
  const theme = useTheme()
  const styles = useStyles()

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
          contentStyle: { backgroundColor: theme.colors.canvas },
        }}
      />
      <ShareIntentBridge />
      <ClipboardPrompt enabled={ready} />
      {!ready && (
        <View style={styles.splash}>
          <View style={styles.mark}>
            <Ionicons name="bookmark" size={30} color={theme.colors.onPrimary} />
          </View>
          <Text style={styles.brand}>寻迹 · Xunji</Text>
          <Text style={styles.tagline}>Save anything. Find it by memory.</Text>
        </View>
      )}
    </View>
  )
}

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 7,
    backgroundColor: theme.colors.primary,
    // 齿孔：点状边露出底纸 canvas，与原生 splash 图标、首页品牌标同一语言。
    borderWidth: 4,
    borderStyle: 'dotted',
    borderColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  brand: {
    ...theme.type.headlineMedium,
    color: theme.colors.text,
  },
  tagline: {
    ...theme.type.bodyMedium,
    color: theme.colors.textMuted,
  },
}))
