const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure font assets are properly resolved
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

module.exports = withNativeWind(config, { input: "./global.css" });
