// Fixes two native build issues for Expo SDK 52 + react-native-vision-camera v5:
//
// 1. KGP classpath version mismatch:
//    expo-build-properties sets ext.kotlinVersion=2.1.0 (needed because
//    vision-camera v5's Nitrogen-generated Kotlin files are compiled with 2.1.0).
//    expo-modules-core checks if kotlinVersion >= 2 and applies the
//    org.jetbrains.kotlin.plugin.compose plugin. That plugin then tries to add
//    kotlin-compose-compiler-plugin-embeddable at the *actual KGP version*
//    (1.9.25 from RN's libs.versions.toml), but that artifact only exists for
//    Kotlin 2.x. Fix: explicitly version the KGP classpath to match ext.kotlinVersion
//    so the actual compiler version matches the configured one.
//
// 2. CameraX 1.7.0-alpha01 requires AGP 8.9.1+:
//    VisionCamera v5 hardcodes camerax_version = "1.7.0-alpha01" but Expo SDK 52 /
//    RN 0.76 pins AGP to 8.6.0. Fix: force CameraX to 1.4.2 via a Gradle
//    resolution strategy. VisionCamera v5's Java/Kotlin source only uses stable
//    CameraX APIs present since 1.3.x so the downgrade is safe.
const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

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
  // Fix 1: pin the Kotlin Gradle Plugin classpath to the same version as
  // ext.kotlinVersion so that expo-modules-core's Compose plugin check works.
  config = withProjectBuildGradle(config, (cfg) => {
    const OLD = "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')";
    const NEW = 'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}")';
    if (cfg.modResults.contents.includes(OLD)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(OLD, NEW);
    }
    return cfg;
  });

  // Fix 2: force CameraX to 1.4.2 to satisfy AGP 8.6.0.
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
