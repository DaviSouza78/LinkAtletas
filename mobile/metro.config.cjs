const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')
const config = getDefaultConfig(__dirname)
// The platform-neutral catalogue is shared with the API and web client.
config.watchFolders = [path.resolve(__dirname, '../shared')]
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')]
module.exports = config
