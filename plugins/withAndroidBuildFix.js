// Fixes CameraX version incompatibility for react-native-vision-camera v5.
//
// VisionCamera v5 hardcodes camerax_version = "1.7.0-alpha01" in its build.gradle.
// CameraX 1.7.0-alpha01 declares it requires Android Gradle Plugin 8.9.1+ and
// compileSdk 36+. Expo SDK 52 / React Native 0.76 pins AGP to 8.6.0.
//
// Fix: force all androidx.camera artifacts to 1.4.2 via a Gradle resolution
// strategy on :app. VisionCamera v5's Java/Kotlin source uses only stable CameraX
// APIs present since 1.3.x — it lists 1.7.0-alpha01 as a build.gradle dependency
// but does not use any 1.7-exclusive APIs, so downgrading at the resolution layer
// is safe and the compilation succeeds.
const { withAppBuildGradle } = require('@expo/config-plugins');

const CAMERAX_VERSION = '1.4.2';

// camera-camera2-pipe is listed in vision-camera's build.gradle but is NEVER
// imported by its Java/Kotlin source. It does not exist on Maven at 1.4.2, so
// we exclude it entirely to prevent Gradle from trying to resolve it.
const CAMERAX_FORCE = [
  'camera-core',
  'camera-camera2',
  'camera-lifecycle',
  'camera-video',
  'camera-view',
  'camera-extensions',
];

function buildResolutionBlock() {
  const forces = CAMERAX_FORCE
    .map((a) => `        force "androidx.camera:${a}:${CAMERAX_VERSION}"`)
    .join('\n');
  return `
// Force CameraX to ${CAMERAX_VERSION} — vision-camera v5 pulls in 1.7.0-alpha01
// which requires AGP 8.9.1, but Expo SDK 52 ships AGP 8.6.0. VisionCamera v5
// only uses stable CameraX APIs available since 1.3.x so the downgrade is safe.
// camera-camera2-pipe is excluded because it has no 1.4.2 release and is
// never actually imported by vision-camera's Java/Kotlin source.
configurations.all {
    resolutionStrategy {
${forces}
    }
    exclude group: 'androidx.camera', module: 'camera-camera2-pipe'
}
`;
}

function withAndroidBuildFix(config) {
  config = withAppBuildGradle(config, (cfg) => {
    const block = buildResolutionBlock();
    if (!cfg.modResults.contents.includes('force "androidx.camera:camera-core:')) {
      cfg.modResults.contents += block;
    }
    return cfg;
  });
  return config;
}

module.exports = withAndroidBuildFix;
