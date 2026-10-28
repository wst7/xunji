import { useEffect, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider, useAuth } from '../src/auth/AuthProvider'
import { takePendingShare } from '../src/auth/pendingShare'
import { OutboxProvider } from '../src/providers/OutboxProvider'
import { ToastProvider } from '../src/providers/ToastProvider'
import { ShareIntentBridge } from '../src/share/ShareIntentBridge'
import { colors, type } from '../src/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ToastProvider>
        <AuthProvider>
          <OutboxProvider>
            <RootNavigator />
          </OutboxProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  )
}

function RootNavigator() {
  const { status } = useAuth()
  const router = useRouter()
  const segments = useSegments()
  const inAuth = segments[0] === 'login' || segments[0] === 'register'

  // 未登录时只允许停留在登录/注册页；待保存队列不因 401 清空。
  useEffect(() => {
    if (status === 'unauthenticated' && !inAuth) {
      router.replace('/login')
    }
  }, [status, inAuth, router])

  // 登录完成（或已登录冷启动）后：优先消费未登录时留下的分享链接。
  const inAuthRef = useRef(inAuth)
  inAuthRef.current = inAuth
  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    void (async () => {
      const pending = await takePendingShare()
      if (cancelled) return
      if (pending) {
        router.replace({ pathname: '/share', params: { url: pending } })
      } else if (inAuthRef.current) {
        router.replace('/')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, router])

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
      <ShareIntentBridge />
      {status === 'booting' || (status === 'unauthenticated' && !inAuth) ? (
        <View style={styles.splash}>
          <View style={styles.mark}>
            <Ionicons name="bookmark" size={30} color={colors.surface} />
          </View>
          <Text style={styles.brand}>寻迹 · Xunji</Text>
          <Text style={styles.tagline}>Save anything. Find it by memory.</Text>
        </View>
      ) : null}
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
