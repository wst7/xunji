import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ApiError, errorMessage, isValidHttpUrl } from '@xunji/shared'

import { api } from '../api/client'
import { EmptyState } from '../components/ui/EmptyState'
import { Screen } from '../components/ui/Screen'
import { savePendingShare } from '../auth/pendingShare'
import { useAuth } from '../auth/AuthProvider'
import { useOutbox } from '../providers/OutboxProvider'
import { useToast } from '../providers/ToastProvider'
import { colors } from '../theme'

/** 分享进入后的保存结果页：自动提交一次，然后跳到详情或首页。 */
export function ShareScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ url?: string | string[] }>()
  const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url
  const url = rawUrl && isValidHttpUrl(rawUrl) ? rawUrl : null
  const { status } = useAuth()
  const { enqueue } = useOutbox()
  const { toast } = useToast()

  const started = useRef<string | null>(null)
  const pendingSaved = useRef(false)
  const [error, setError] = useState<string | null>(null)

  // 未登录直接进入 /share 时，先留下链接，登录后由根布局继续保存。
  useEffect(() => {
    if (status !== 'unauthenticated' || !url || pendingSaved.current) return
    pendingSaved.current = true
    void savePendingShare(url)
  }, [status, url])

  useEffect(() => {
    if (!url || status !== 'authenticated') return
    if (started.current === url) return
    started.current = url

    void (async () => {
      try {
        const res = await api.createDocument(url)
        if (res.duplicate) {
          toast('这篇内容已经保存过了。')
        } else {
          toast('已保存，正在整理内容……')
        }
        router.replace(`/documents/${res.id}`)
      } catch (e) {
        if (e instanceof ApiError && e.code === 'NETWORK_ERROR') {
          try {
            const queued = await enqueue(url, 'share')
            toast(
              queued === 'added'
                ? '已保存到本地，联网后会自动同步。'
                : queued === 'trimmed'
                  ? '已保存到本地；队列已满，最早的一条被移出。'
                  : '这条链接已经在待保存队列里了。',
              { type: 'warning' },
            )
            router.replace('/')
          } catch {
            setError('保存失败，请稍后重试。')
          }
          return
        }
        setError(errorMessage(e, '保存失败，请稍后重试。'))
      }
    })()
  }, [url, status, enqueue, router, toast])

  return (
    <Screen>
      <View style={styles.topbar}>
        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel="返回首页"
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={21} color={colors.ink} />
        </Pressable>
        <Text style={styles.topbarTitle}>保存分享</Text>
        <View style={styles.iconPlaceholder} />
      </View>
      <View style={styles.content}>
        {!url ? (
          <EmptyState
            title="没有可保存的链接。"
            body="这次分享里没有找到网页地址。可以回到首页，手动粘贴链接或分享文字。"
            action={{ label: '回到首页', onPress: () => router.replace('/') }}
          />
        ) : error ? (
          <EmptyState
            title="保存没有完成。"
            body={error}
            action={{ label: '回到首页', onPress: () => router.replace('/') }}
          />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>正在保存……</Text>
          </View>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  topbarTitle: {
    color: colors.ink,
    fontSize: 15.5,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  loading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.faint,
    fontSize: 12.5,
  },
})
