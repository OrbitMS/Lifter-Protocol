const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow bundling .tflite model files with require()
config.resolver.assetExts.push('tflite');

module.exports = config;
