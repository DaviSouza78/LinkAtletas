const assert = require('node:assert/strict')
const path = require('node:path')
const { satisfies, valid } = require('semver')

// Validate the SDK actually pinned and built, rather than a mutable online
// recommendation for a newer SDK patch. check:updates remains available.
const project = path.resolve(__dirname, '..')
const manifest = require(path.join(project, 'package.json'))
const sdkPath = require.resolve('expo/package.json', { paths: [project] })
const sdk = require(sdkPath)
const matrix = require(path.join(path.dirname(sdkPath), 'bundledNativeModules.json'))
const dependencies = []
for (const [name, declared] of Object.entries(manifest.dependencies)) {
  const installed = require(require.resolve(`${name}/package.json`, { paths: [project] })).version
  assert(valid(declared), `${name}: fixe uma versao exata no manifesto`)
  assert.equal(installed, declared, `${name}: a instalacao diverge do manifesto`)
  const expected = name === 'expo' ? sdk.version : matrix[name]
  assert(expected, `${name}: revisar compatibilidade antes de adicionar ao aplicativo`)
  assert(satisfies(installed, expected), `${name}: ${installed} nao atende ${expected} do SDK ${sdk.version}`)
  dependencies.push({ name, installed, expectedByInstalledSdk: expected })
}
console.log(JSON.stringify({
  executedAt: new Date().toISOString(),
  sdk: sdk.version,
  matrix: 'expo/bundledNativeModules.json from the installed locked SDK',
  scope: 'installed runtime dependencies; latest online recommendations are checked separately',
  passed: true,
  dependencies,
}, null, 2))
