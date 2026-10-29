import type { ExpoConfig } from 'expo/config'

// 生产构建必须使用 HTTPS；开发构建才允许访问局域网 HTTP。
const isProduction = process.env.APP_VARIANT === 'production'

// 版本号跟发布 tag 走：CI 打 v* 标签时注入 XUNJI_APP_VERSION（v0.3.1 → 0.3.1）。
// 本地构建回退到这里的默认值。Android 的 versionCode 由版本号推导，升级安装不会退版。
const rawVersion: string = process.env.XUNJI_APP_VERSION ?? '0.3.1'
const appVersion = rawVersion.replace(/^v/, '')
const [versionMajor = 0, versionMinor = 0, versionPatch = 0] = appVersion
  .split('.')
  .map((part) => Number.parseInt(part, 10) || 0)
const versionCode = versionMajor * 10000 + versionMinor * 100 + versionPatch

const config: ExpoConfig = {
  name: '寻迹',
  slug: 'xunji',
  version: appVersion,
  scheme: 'xunji',
  platforms: ['ios', 'android'],
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#F4F5F8',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.xunji.app',
    buildNumber: String(versionCode),
    infoPlist: {
      NSLocalNetworkUsageDescription: '寻迹会直接读取你保存的链接，也可能连接你自己配置的大模型服务。',
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
    package: 'com.xunji.app',
    versionCode,
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: '#F4F5F8',
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
        backgroundColor: '#F4F5F8',
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
