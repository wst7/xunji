import Constants, { ExecutionEnvironment } from 'expo-constants'
import { lazy, Suspense } from 'react'

const NativeShareIntentBridge = lazy(() => import('./NativeShareIntentBridge'))

/**
 * Expo Go 不包含原生分享模块，直接 import 会崩溃。
 * Expo Go 中跳过分享桥，其余页面仍可用于调试。
 */
export function ShareIntentBridge() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null
  }
  return (
    <Suspense fallback={null}>
      <NativeShareIntentBridge />
    </Suspense>
  )
}
