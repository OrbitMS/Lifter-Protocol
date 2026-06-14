import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  useVideoOutput,
} from 'react-native-vision-camera';
import type { Frame } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useRunOnJS } from 'react-native-worklets-core';
import { spacing, radius, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import {
  centerCropResize,
  computeAngles,
  createModelDownload,
  describeTechnique,
  getModelFilePath,
  isModelReady,
  SKELETON_EDGES,
  parseMoveNetOutput,
  type Keypoint,
  type ModelDownloadProgress,
  type PoseAngles,
} from '@/lib/poseUtils';
import { dbInsertTechnique } from '@/lib/db';
import { useActiveProfile } from '@/store/useProfileStore';

type ScreenState = 'checking' | 'needs-download' | 'downloading' | 'ready';

const MODEL_SIZE_MB = 4;
const INFERENCE_EVERY_N = 6; // ~5fps at 30fps camera
const MIN_KP_CONFIDENCE = 0.3;

export default function RecordScreen() {
  const router = useRouter();
  const { exercise = 'Squat' } = useLocalSearchParams<{ exercise?: string }>();
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const active = useActiveProfile();

  // ── Model download gate ──────────────────────────────────────────────────────
  const [screen, setScreen] = useState<ScreenState>('checking');
  const [dlProgress, setDlProgress] = useState<ModelDownloadProgress>({
    fraction: 0,
    downloadedMB: 0,
    totalMB: MODEL_SIZE_MB,
  });
  const downloadRef = useRef<ReturnType<typeof createModelDownload> | null>(null);

  useEffect(() => {
    isModelReady().then((ok) => setScreen(ok ? 'ready' : 'needs-download'));
  }, []);

  const startDownload = useCallback(async () => {
    setScreen('downloading');
    const dl = createModelDownload(setDlProgress);
    downloadRef.current = dl;
    try {
      await dl.downloadAsync();
      setScreen('ready');
    } catch {
      setScreen('needs-download');
    }
  }, []);

  // ── Camera permissions ───────────────────────────────────────────────────────
  const { hasPermission, requestPermission } = useCameraPermission();
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const device = useCameraDevice('back');

  // ── TFLite model ─────────────────────────────────────────────────────────────
  const modelPlugin = useTensorflowModel(
    screen === 'ready' ? { url: `file://${getModelFilePath()}` } : (null as never),
    [],
  );

  // ── Pose state (updated from worklet via useRunOnJS) ─────────────────────────
  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [angles, setAngles] = useState<PoseAngles | null>(null);
  const frameCount = useRef(0);

  const onPoseResult = useRunOnJS(
    (kps: Keypoint[]) => {
      setKeypoints(kps);
      setAngles(computeAngles(kps));
    },
    [],
  );

  // ── Frame processor ──────────────────────────────────────────────────────────
  const model = modelPlugin.state === 'loaded' ? modelPlugin.model : null;

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        frameCount.current += 1;
        if (frameCount.current % INFERENCE_EVERY_N !== 0 || !model) {
          frame.dispose();
          return;
        }

        const raw = frame.getPixelBuffer();
        const copy = raw.slice(0);
        frame.dispose();

        const resized = centerCropResize(copy, frame.width, frame.height, 192);
        const outputs = model.runSync([resized]);
        if (outputs.length === 0) return;

        const kps = parseMoveNetOutput(outputs[0]);
        const confident = kps.filter((k) => k.score > MIN_KP_CONFIDENCE);
        onPoseResult(confident);
      },
      [model, onPoseResult],
    ),
  });

  // ── Video recording ──────────────────────────────────────────────────────────
  const videoOutput = useVideoOutput({ enableAudio: false });
  const recorderRef = useRef<{ stopRecording(): Promise<void> } | null>(null);
  const [recording, setRecording] = useState(false);
  const anglesLog = useRef<PoseAngles[]>([]);

  const handleRecordingDone = useCallback(
    (filePath: string) => {
      if (!active || anglesLog.current.length === 0) return;
      const worst = anglesLog.current.reduce(
        (min, a) => (a.avgKnee < min.avgKnee ? a : min),
        anglesLog.current[0],
      );
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      dbInsertTechnique({
        id,
        profile_id: active.id,
        exercise_name: exercise as string,
        date: new Date().toISOString(),
        video_path: filePath,
        angles_json: JSON.stringify(anglesLog.current),
        summary: describeTechnique(worst, exercise as string),
      });
      router.push({ pathname: '/playback/[sessionId]', params: { sessionId: id } });
    },
    [active, exercise, router],
  );

  const startRecording = useCallback(async () => {
    if (recorderRef.current) return;
    anglesLog.current = [];
    const recorder = await videoOutput.createRecorder({});
    recorderRef.current = recorder;
    await recorder.startRecording(
      (filePath) => {
        recorderRef.current = null;
        setRecording(false);
        handleRecordingDone(filePath);
      },
      (err) => {
        console.warn('Recording error', err);
        recorderRef.current = null;
        setRecording(false);
      },
    );
    setRecording(true);
  }, [videoOutput, handleRecordingDone]);

  // Accumulate angles while recording
  useEffect(() => {
    if (recording && angles) anglesLog.current.push(angles);
  }, [recording, angles]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    await recorderRef.current.stopRecording(); // triggers onRecordingFinished above
  }, []);

  // ── Skeleton overlay dimensions ───────────────────────────────────────────────
  const [viewSize, setViewSize] = useState({ width: 1, height: 1 });

  // ─── Render gates ─────────────────────────────────────────────────────────────
  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>Record · {exercise}</Text>
    </View>
  );

  if (!hasPermission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <View style={styles.centred}>
          <Text style={styles.msg}>Camera permission required.</Text>
          <Pressable style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Grant permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'checking') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <View style={styles.centred}>
          <ActivityIndicator color={c.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'needs-download') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <View style={styles.centred}>
          <Text style={styles.emptyTitle}>Download pose model</Text>
          <Text style={styles.msg}>
            A small (~{MODEL_SIZE_MB} MB) AI model enables real-time technique analysis. Downloaded
            once, runs fully on-device.
          </Text>
          <Pressable style={styles.btn} onPress={startDownload}>
            <Text style={styles.btnText}>Download now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'downloading') {
    const pct = Math.round(dlProgress.fraction * 100);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <View style={styles.centred}>
          <Text style={styles.emptyTitle}>Downloading…</Text>
          <Text style={styles.msg}>
            {dlProgress.downloadedMB.toFixed(0)} / {dlProgress.totalMB.toFixed(0)} MB · {pct}%
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <View style={styles.centred}>
          <Text style={styles.msg}>No back camera found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main camera UI ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['bottom']}>
      {header}

      <View
        style={{ flex: 1 }}
        onLayout={(e) =>
          setViewSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          outputs={[frameOutput, videoOutput]}
        />

        {/* Skeleton SVG overlay */}
        {keypoints.length > 0 && (
          <Svg
            style={StyleSheet.absoluteFill}
            viewBox={`0 0 ${viewSize.width} ${viewSize.height}`}
          >
            {SKELETON_EDGES.map(([a, b], i) => {
              const kA = keypoints[a];
              const kB = keypoints[b];
              if (
                !kA ||
                !kB ||
                kA.score < MIN_KP_CONFIDENCE ||
                kB.score < MIN_KP_CONFIDENCE
              )
                return null;
              return (
                <Line
                  key={i}
                  x1={kA.x * viewSize.width}
                  y1={kA.y * viewSize.height}
                  x2={kB.x * viewSize.width}
                  y2={kB.y * viewSize.height}
                  stroke="#21B8E8"
                  strokeWidth={2}
                  opacity={0.85}
                />
              );
            })}
            {keypoints.map((kp, i) =>
              kp.score >= MIN_KP_CONFIDENCE ? (
                <Circle
                  key={i}
                  cx={kp.x * viewSize.width}
                  cy={kp.y * viewSize.height}
                  r={4}
                  fill="#2FCC74"
                  opacity={0.9}
                />
              ) : null,
            )}
          </Svg>
        )}

        {/* Angle readout HUD */}
        {angles && (
          <View style={styles.hud}>
            <Text style={styles.hudText}>Knee {angles.avgKnee}°</Text>
            <Text style={styles.hudText}>Hip {angles.avgHip}°</Text>
            {angles.kneeSymmetry > 8 && (
              <Text style={[styles.hudText, { color: '#F2922C' }]}>
                ⚠ Asymmetry {angles.kneeSymmetry}°
              </Text>
            )}
          </View>
        )}

        {/* Model loading indicator */}
        {modelPlugin.state === 'loading' && (
          <View style={styles.modelLoading}>
            <ActivityIndicator size="small" color="#21B8E8" />
            <Text style={styles.modelLoadingText}>Loading pose model…</Text>
          </View>
        )}
      </View>

      {/* Record button */}
      <View style={styles.controls}>
        <Pressable
          style={[styles.recordBtn, recording && styles.recordBtnActive]}
          onPress={recording ? stopRecording : startRecording}
        >
          <View style={[styles.recordDot, recording && styles.recordDotStop]} />
        </Pressable>
        {recording && <Text style={styles.recordingLabel}>Recording — tap to finish</Text>}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: '#000',
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backText: { color: c.accent, fontSize: 28, lineHeight: 30 },
    headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
    centred: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.md,
    },
    emptyTitle: { color: c.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
    msg: { color: c.textMuted, textAlign: 'center', lineHeight: 20 },
    btn: {
      backgroundColor: c.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    btnText: { color: c.onAccent, fontWeight: '800', fontSize: 16 },
    progressTrack: {
      width: '80%',
      height: 6,
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: c.accent, borderRadius: radius.pill },
    hud: { position: 'absolute', top: spacing.md, left: spacing.md, gap: 4 },
    hudText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
      textShadowColor: '#000',
      textShadowRadius: 4,
    },
    modelLoading: {
      position: 'absolute',
      bottom: spacing.md,
      left: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    modelLoadingText: { color: '#fff', fontSize: 12, opacity: 0.8 },
    controls: {
      backgroundColor: '#000',
      alignItems: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    recordBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordBtnActive: { borderColor: '#FF3B30' },
    recordDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF3B30' },
    recordDotStop: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#FF3B30' },
    recordingLabel: { color: '#fff', fontSize: 13, opacity: 0.8 },
  });
