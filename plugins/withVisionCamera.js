// Local plugin replacing react-native-vision-camera's missing app.plugin.js.
// Vision-camera v5 ships ESM-only lib/ (export * without .js extensions) which
// Node.js can't load as CJS. This file handles all the config work the package
// plugin would do, without importing from lib/.
const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const ANDROID_CAMERA = 'android.permission.CAMERA';
const ANDROID_MIC = 'android.permission.RECORD_AUDIO';

function addAndroidPermission(manifest, name) {
  const perms = manifest['uses-permission'] ?? [];
  if (!perms.some((p) => p.$?.['android:name'] === name)) {
    perms.push({ $: { 'android:name': name } });
  }
  manifest['uses-permission'] = perms;
}

function withVisionCamera(config, options = {}) {
  const {
    cameraPermissionText = 'Allow $(PRODUCT_NAME) to use the camera.',
    enableMicrophonePermission = false,
  } = options;

  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    addAndroidPermission(manifest, ANDROID_CAMERA);
    if (enableMicrophonePermission) addAndroidPermission(manifest, ANDROID_MIC);
    return cfg;
  });

  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.NSCameraUsageDescription ??= cameraPermissionText;
    if (enableMicrophonePermission) {
      cfg.modResults.NSMicrophoneUsageDescription ??= 'Allow $(PRODUCT_NAME) to use the microphone.';
    }
    return cfg;
  });

  return config;
}

module.exports = withVisionCamera;
