import type { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => {
  const local = process.env.EXPO_PUBLIC_BUILD_PROFILE === 'local'
  return {
    ...config,
    name: local ? 'LinkAtletas Local' : 'LinkAtletas',
    slug: config.slug || 'linkatletas',
    android: {
      ...config.android,
      package: local ? 'br.edu.linkatletas.app.local' : 'br.edu.linkatletas.app',
    },
    plugins: [...(config.plugins || []), './plugins/withLocalNetwork.cjs'],
  }
}
