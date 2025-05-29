const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)
const path = require('path');

const exclusionList = require('metro-config/src/defaults/exclusionList');
const fs = require('fs');
const rnwPath = fs.realpathSync(
  path.resolve(require.resolve('react-native-windows/package.json'), '..'),
);

config.resolver = {
  ...config.resolver,
  blockList: exclusionList([
    // This stops "npx @react-native-community/cli run-windows" from causing the metro server to crash if its already running
    new RegExp(
      `${path.resolve(__dirname, 'windows').replace(/[/\\]/g, '/')}.*`,
    ),
    // This prevents "npx @react-native-community/cli run-windows" from hitting: EBUSY: resource busy or locked, open msbuild.ProjectImports.zip or other files produced by msbuild
    new RegExp(`${rnwPath}/build/.*`),
    new RegExp(`${rnwPath}/target/.*`),
    /.*\.ProjectImports\.zip/,
  ])
}

module.exports = withNativeWind(config, { input: './global.css' })
module.transformer = {
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
}
