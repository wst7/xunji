import { useEffect, useRef } from 'react'
import { useRouter } from 'expo-router'
import { useShareIntent } from 'expo-share-intent'
import { extractHttpUrl, isValidHttpUrl } from '@xunji/shared'

import { useAuth } from '../auth/AuthProvider'
import { savePendingShare } from '../auth/pendingShare'
import { useToast } from '../providers/ToastProvider'

/** 只在 development build / 正式包中加载，见 ShareIntentBridge。 */
export default function NativeShareIntentBridge() {
  const router = useRouter()
  const { status } = useAuth()
  const { toast } = useToast()
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    resetOnBackground: false,
  })

  const handledKey = useRef<string | null>(null)

  useEffect(() => {
    if (!hasShareIntent) {
      handledKey.current = null
      return
    }
    // 等启动阶段的认证状态确定后，再决定是保存还是先登录。
    if (status === 'booting') return

    const webUrl =
      shareIntent.webUrl && isValidHttpUrl(shareIntent.webUrl) ? shareIntent.webUrl : null
    const url = webUrl ?? extractHttpUrl(shareIntent.text ?? '')
    const key = `${shareIntent.type ?? ''}|${url ?? ''}|${shareIntent.text ?? ''}`
    if (handledKey.current === key) return
    handledKey.current = key

    // 必须在任何异步保存之前重置原生 payload，避免冷启动/重渲染重复处理。
    resetShareIntent()

    if (!url) {
      toast('这次分享里没有网页链接。', { type: 'warning' })
      return
    }

    if (status === 'unauthenticated') {
      void (async () => {
        await savePendingShare(url)
        toast('登录后会保存这条链接。')
        router.replace('/login')
      })()
      return
    }

    router.replace({ pathname: '/share', params: { url } })
  }, [hasShareIntent, shareIntent, status, router, toast])

  return null
}
