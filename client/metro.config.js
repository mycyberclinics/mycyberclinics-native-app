const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add cjs to the sourceExts if not present
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'cjs'];

// Enable transpilation for zustand (ESM fix)
config.unstable = config.unstable || {};
config.unstable.transpilePackages = ['zustand', '@zustand/middleware', '@zustand/vanilla'];

config.transformer = config.transformer || {};
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

module.exports = withNativeWind(config, { input: './global.css' });