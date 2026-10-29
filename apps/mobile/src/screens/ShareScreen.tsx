import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { errorMessage, isValidHttpUrl } from '@xunji/shared'

import { EmptyState } from '../components/ui/EmptyState'
import { Screen } from '../components/ui/Screen'
import { processPendingQueue } from '../local/pipeline'
import * as repo from '../local/repo'
import { useToast } from '../providers/ToastProvider'
import { colors, radius, spacing, type } from '../theme'

/** 分享进入后的保存结果页：保存到本机一次，然后跳到详情。 */
export function ShareScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ url?: string | string[]; hint?: string | string[] }>()
  const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url
  const rawHint = Array.isArray(params.hint) ? params.hint[0] : params.hint
  const url = rawUrl && isValidHttpUrl(rawUrl) ? rawUrl : null
  const { toast } = useToast()

  const started = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    if (started.current === url) return
    started.current = url

    void (async () => {
      try {
        const res = await repo.createDocument(url, rawHint ?? null)
        if (res.duplicate) {
          toast('这篇内容已经保存过了。')
        } else {
          toast('已保存，正在本机整理内容……', { type: 'success' })
          void processPendingQueue()
        }
        router.replace(`/documents/${res.id}`)
      } catch (e) {
        if (e instanceof Error && e.message === 'INVALID_URL') {
          setError('这不是一个可以保存的链接。')
          return
        }
        setError(errorMessage(e, '保存失败，请稍后重试。'))
      }
    })()
  }, [url, rawHint, router, toast])

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
            <Text style={styles.loadingText}>正在保存到本机……</Text>
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
    paddingHorizontal: 20,
    minHeight: 52,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
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
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.ink,
  },
  pressed: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: spacing.xl,
  },
  loading: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 40,
  },
  loadingText: {
    ...type.caption,
    color: colors.faint,
  },
})
