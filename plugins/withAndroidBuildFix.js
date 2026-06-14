// Upgrades Android Gradle Plugin to 8.9.1 and compileSdk to 36.
//
// react-native-vision-camera v5 pulls in androidx.camera:*:1.7.0-alpha01
// which requires AGP >= 8.9.1 and compileSdk >= 36.
// Expo SDK 52's default managed workflow uses AGP 8.6.0 / compileSdk 35,
// so without this plugin the Gradle build fails with:
//   "Dependency ... requires Android Gradle plugin 8.9.1 or higher."
const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

function withAndroidBuildFix(config) {
  // 1. Bump AGP classpath in root build.gradle
  config = withProjectBuildGradle(config, (cfg) => {
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /classpath\s*\(?["']com\.android\.tools\.build:gradle:[^"']+["']\)?/g,
      `classpath("com.android.tools.build:gradle:8.9.1")`,
    );
    return cfg;
  });

  // 2. Bump compileSdkVersion and targetSdkVersion in app/build.gradle
  config = withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = cfg.modResults.contents
      .replace(/compileSdkVersion\s+\d+/, 'compileSdkVersion 36')
      .replace(/compileSdk\s+\d+/, 'compileSdk 36')
      .replace(/targetSdkVersion\s+\d+/, 'targetSdkVersion 36')
      .replace(/targetSdk\s+\d+/, 'targetSdk 36');
    return cfg;
  });

  return config;
}

module.exports = withAndroidBuildFix;
