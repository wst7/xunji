import type { ExpoConfig } from 'expo/config'

// 生产构建必须使用 HTTPS；开发构建才允许访问局域网 HTTP。
const isProduction = process.env.APP_VARIANT === 'production'

const config: ExpoConfig = {
  name: '拾回',
  slug: 'shihui',
  version: '0.1.0',
  scheme: 'shihui',
  platforms: ['ios', 'android'],
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#F5F6F8',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.shihui.app',
    infoPlist: {
      NSLocalNetworkUsageDescription: '拾回需要访问局域网内的服务器，以保存和找回你的收藏。',
      ...(isProduction
        ? {}
        : {
            NSAppTransportSecurity: {
              NSAllowsArbitraryLoads: true,
            },
          }),
    },
  },
  android: {
    package: 'com.shihui.app',
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: '#F5F6F8',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5F6F8',
        image: './assets/splash-icon.png',
        imageWidth: 160,
      },
    ],
    'expo-secure-store',
    [
      'expo-share-intent',
      {
        iosActivationRules: {
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsWebPageWithMaxCount: 1,
          NSExtensionActivationSupportsText: true,
        },
        androidIntentFilters: ['text/*'],
      },
    ],
    ...(isProduction
      ? []
      : [
          [
            'expo-build-properties',
            {
              android: {
                usesCleartextTraffic: true,
              },
            },
          ] as [string, Record<string, unknown>],
        ]),
  ],
}

export default config
