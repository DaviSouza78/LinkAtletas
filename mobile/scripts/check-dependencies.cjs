const assert = require('node:assert/strict')
const path = require('node:path')
const { satisfies, valid } = require('semver')

// Validate the SDK actually pinned and built, rather than a mutable online
// recommendation for a newer SDK patch. check:updates remains available.
const project = path.resolve(__dirname, '..')
const manifest = require(path.join(project, 'package.json'))
const sdkPath = require.resolve('expo/package.json', { paths: [project] })
const sdk = require(sdkPath)
const matrix = require(
  path.join(path.dirname(sdkPath), 'bundledNativeModules.json'),
)
const dependencies = []
const reviewedNative = {
  'react-native-nitro-google-signin': '2.3.0',
  'react-native-nitro-modules': '0.37.1',
}
for (const [name, declared] of Object.entries(manifest.dependencies)) {
  const installed = require(
    require.resolve(`${name}/package.json`, { paths: [project] }),
  ).version
  assert(valid(declared), `${name}: fixe uma versao exata no manifesto`)
  assert.equal(
    installed,
    declared,
    `${name}: a instalacao diverge do manifesto`,
  )
  const expected =
    name === 'expo' ? sdk.version : matrix[name] || reviewedNative[name]
  assert(
    expected,
    `${name}: revisar compatibilidade antes de adicionar ao aplicativo`,
  )
  assert(
    satisfies(installed, expected),
    `${name}: ${installed} nao atende ${expected} do SDK ${sdk.version}`,
  )
  if (reviewedNative[name]) {
    const native = require(
      require.resolve(`${name}/package.json`, { paths: [project] }),
    )
    for (const [peer, range] of Object.entries(native.peerDependencies || {})) {
      if (!manifest.dependencies[peer]) continue
      const version = require(
        require.resolve(`${peer}/package.json`, { paths: [project] }),
      ).version
      assert(satisfies(version, range), `${name}: peer ${peer} incompativel`)
    }
  }
  dependencies.push({
    name,
    installed,
    expectedByInstalledSdk:
      name === 'expo' ? sdk.version : matrix[name] || null,
    ...(reviewedNative[name]
      ? { reviewedNativeVersion: reviewedNative[name] }
      : {}),
  })
}
console.log(
  JSON.stringify(
    {
      executedAt: new Date().toISOString(),
      sdk: sdk.version,
      matrix: 'expo/bundledNativeModules.json from the installed locked SDK',
      scope:
        'installed runtime dependencies; latest online recommendations are checked separately',
      passed: true,
      dependencies,
    },
    null,
    2,
  ),
)
