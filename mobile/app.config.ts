import type { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => {
  const local = process.env.EXPO_PUBLIC_BUILD_PROFILE === 'local'
  return {
    ...config,
    name: local ? 'LinkAtletas Local' : 'LinkAtletas',
    slug: 'linkatletas',
    version: '0.3.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    scheme: 'linkatletas',
    ios: {
      ...config.ios,
      supportsTablet: true,
      bundleIdentifier: 'br.edu.linkatletas.app',
    },
    android: {
      ...config.android,
      package: local ? 'br.edu.linkatletas.app.local' : 'br.edu.linkatletas.app',
    },
    plugins: [
      'expo-secure-store',
      'expo-document-picker',
      'expo-sharing',
      'expo-status-bar',
      './plugins/withLocalNetwork.cjs',
    ],
    extra: { ...config.extra, projectScope: 'academic-athlete-client' },
  }
}
