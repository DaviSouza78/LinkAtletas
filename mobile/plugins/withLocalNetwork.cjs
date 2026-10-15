const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins')
const { mkdir, writeFile, rm } = require('node:fs/promises')
const path = require('node:path')

module.exports = (config) => {
  const local = process.env.EXPO_PUBLIC_BUILD_PROFILE === 'local'
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application[0].$
    // Re-running prebuild for production must remove the local exception.
    application['android:usesCleartextTraffic'] = 'false'
    if (local)
      application['android:networkSecurityConfig'] = '@xml/linkatletas_local_network'
    else if (application['android:networkSecurityConfig'] === '@xml/linkatletas_local_network')
      delete application['android:networkSecurityConfig']
    return mod
  })
  return withDangerousMod(config, ['android', async (mod) => {
    const directory = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml')
    const destination = path.join(directory, 'linkatletas_local_network.xml')
    if (local) {
      await mkdir(directory, { recursive: true })
      await writeFile(destination, `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="false">127.0.0.1</domain>
    <domain includeSubdomains="false">10.0.2.2</domain>
  </domain-config>
</network-security-config>
`)
    } else {
      await rm(destination, { force: true })
    }
    return mod
  }])
}
