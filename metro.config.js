const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
 
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;
config.transformer.unstable_allowRequireContext = true;

module.exports = withNativewind(config);