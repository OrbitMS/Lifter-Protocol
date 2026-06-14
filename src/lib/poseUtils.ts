import * as FileSystem from 'expo-file-system';

// ─── Model management ────────────────────────────────────────────────────────

/**
 * MoveNet SinglePose Lightning TFLite (float16, ~3.8 MB).
 * Downloaded once on first camera open, stored in document directory.
 * TF Hub canonical URL: redirects to GCS download, no auth required.
 */
export const MOVENET_URL =
  'https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/float16/4?lite-format=tflite';
export const MOVENET_FILENAME = 'movenet_lightning.tflite';

export function getModelFilePath(): string {
  return `${FileSystem.documentDirectory}${MOVENET_FILENAME}`;
}

export async function isModelReady(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(getModelFilePath());
  return info.exists && (info as FileSystem.FileInfo & { size?: number }).size! > 0;
}

export type ModelDownloadProgress = {
  fraction: number;
  downloadedMB: number;
  totalMB: number;
};

export function createModelDownload(
  onProgress: (p: ModelDownloadProgress) => void,
): FileSystem.DownloadResumable {
  return FileSystem.createDownloadResumable(
    MOVENET_URL,
    getModelFilePath(),
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress({
        fraction: totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0,
        downloadedMB: totalBytesWritten / 1_000_000,
        totalMB: totalBytesExpectedToWrite / 1_000_000,
      });
    },
  );
}

// ─── MoveNet keypoint indices (17 points) ────────────────────────────────────

export const KP = {
  NOSE: 0,
  LEFT_EYE: 1, RIGHT_EYE: 2,
  LEFT_EAR: 3, RIGHT_EAR: 4,
  LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
  LEFT_WRIST: 9, RIGHT_WRIST: 10,
  LEFT_HIP: 11, RIGHT_HIP: 12,
  LEFT_KNEE: 13, RIGHT_KNEE: 14,
  LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
} as const;

export interface Keypoint {
  x: number;   // 0–1 normalised (column)
  y: number;   // 0–1 normalised (row)
  score: number;
}

export interface PoseAngles {
  leftKnee: number;
  rightKnee: number;
  leftHip: number;
  rightHip: number;
  leftElbow: number;
  rightElbow: number;
  // derived
  kneeSymmetry: number; // abs(leftKnee - rightKnee) — knee cave proxy
  avgKnee: number;
  avgHip: number;
}

// ─── Skeleton connections (pairs of KP indices) ──────────────────────────────

export const SKELETON_EDGES: [number, number][] = [
  [KP.NOSE, KP.LEFT_EYE], [KP.NOSE, KP.RIGHT_EYE],
  [KP.LEFT_EYE, KP.LEFT_EAR], [KP.RIGHT_EYE, KP.RIGHT_EAR],
  [KP.LEFT_SHOULDER, KP.RIGHT_SHOULDER],
  [KP.LEFT_SHOULDER, KP.LEFT_ELBOW], [KP.LEFT_ELBOW, KP.LEFT_WRIST],
  [KP.RIGHT_SHOULDER, KP.RIGHT_ELBOW], [KP.RIGHT_ELBOW, KP.RIGHT_WRIST],
  [KP.LEFT_SHOULDER, KP.LEFT_HIP], [KP.RIGHT_SHOULDER, KP.RIGHT_HIP],
  [KP.LEFT_HIP, KP.RIGHT_HIP],
  [KP.LEFT_HIP, KP.LEFT_KNEE], [KP.LEFT_KNEE, KP.LEFT_ANKLE],
  [KP.RIGHT_HIP, KP.RIGHT_KNEE], [KP.RIGHT_KNEE, KP.RIGHT_ANKLE],
];

// ─── Pure math (no imports — safe to call from worklets) ─────────────────────

/** Angle at vertex B formed by points A–B–C (degrees). */
export function angleDeg(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): number {
  const v1x = ax - bx, v1y = ay - by;
  const v2x = cx - bx, v2y = cy - by;
  const dot = v1x * v2x + v1y * v2y;
  const mag = Math.sqrt((v1x * v1x + v1y * v1y) * (v2x * v2x + v2y * v2y));
  if (mag < 1e-9) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI);
}

/** Parse the flat float32 MoveNet output (shape 1×1×17×3) into keypoints. */
export function parseMoveNetOutput(buffer: ArrayBuffer): Keypoint[] {
  const view = new Float32Array(buffer);
  const kps: Keypoint[] = [];
  for (let i = 0; i < 17; i++) {
    // MoveNet output order: y, x, score
    kps.push({ y: view[i * 3], x: view[i * 3 + 1], score: view[i * 3 + 2] });
  }
  return kps;
}

/** Compute biomechanical angles from 17 keypoints. */
export function computeAngles(kps: Keypoint[]): PoseAngles {
  const lk = angleDeg(
    kps[KP.LEFT_HIP].x, kps[KP.LEFT_HIP].y,
    kps[KP.LEFT_KNEE].x, kps[KP.LEFT_KNEE].y,
    kps[KP.LEFT_ANKLE].x, kps[KP.LEFT_ANKLE].y,
  );
  const rk = angleDeg(
    kps[KP.RIGHT_HIP].x, kps[KP.RIGHT_HIP].y,
    kps[KP.RIGHT_KNEE].x, kps[KP.RIGHT_KNEE].y,
    kps[KP.RIGHT_ANKLE].x, kps[KP.RIGHT_ANKLE].y,
  );
  const lh = angleDeg(
    kps[KP.LEFT_SHOULDER].x, kps[KP.LEFT_SHOULDER].y,
    kps[KP.LEFT_HIP].x, kps[KP.LEFT_HIP].y,
    kps[KP.LEFT_KNEE].x, kps[KP.LEFT_KNEE].y,
  );
  const rh = angleDeg(
    kps[KP.RIGHT_SHOULDER].x, kps[KP.RIGHT_SHOULDER].y,
    kps[KP.RIGHT_HIP].x, kps[KP.RIGHT_HIP].y,
    kps[KP.RIGHT_KNEE].x, kps[KP.RIGHT_KNEE].y,
  );
  const le = angleDeg(
    kps[KP.LEFT_SHOULDER].x, kps[KP.LEFT_SHOULDER].y,
    kps[KP.LEFT_ELBOW].x, kps[KP.LEFT_ELBOW].y,
    kps[KP.LEFT_WRIST].x, kps[KP.LEFT_WRIST].y,
  );
  const re = angleDeg(
    kps[KP.RIGHT_SHOULDER].x, kps[KP.RIGHT_SHOULDER].y,
    kps[KP.RIGHT_ELBOW].x, kps[KP.RIGHT_ELBOW].y,
    kps[KP.RIGHT_WRIST].x, kps[KP.RIGHT_WRIST].y,
  );
  return {
    leftKnee: Math.round(lk),
    rightKnee: Math.round(rk),
    leftHip: Math.round(lh),
    rightHip: Math.round(rh),
    leftElbow: Math.round(le),
    rightElbow: Math.round(re),
    kneeSymmetry: Math.round(Math.abs(lk - rk)),
    avgKnee: Math.round((lk + rk) / 2),
    avgHip: Math.round((lh + rh) / 2),
  };
}

/**
 * Center-crop + nearest-neighbour resize an RGB buffer to dstSize×dstSize.
 * Pure math — safe to call inside a frame-processor worklet.
 */
export function centerCropResize(
  rgbBuffer: ArrayBuffer,
  srcWidth: number,
  srcHeight: number,
  dstSize: number,
): ArrayBuffer {
  const cropSize = Math.min(srcWidth, srcHeight);
  const xOff = Math.floor((srcWidth - cropSize) / 2);
  const yOff = Math.floor((srcHeight - cropSize) / 2);
  const src = new Uint8Array(rgbBuffer);
  const dst = new Uint8Array(dstSize * dstSize * 3);
  for (let y = 0; y < dstSize; y++) {
    for (let x = 0; x < dstSize; x++) {
      const sx = xOff + Math.floor((x * cropSize) / dstSize);
      const sy = yOff + Math.floor((y * cropSize) / dstSize);
      const si = (sy * srcWidth + sx) * 3;
      const di = (y * dstSize + x) * 3;
      dst[di] = src[si];
      dst[di + 1] = src[si + 1];
      dst[di + 2] = src[si + 2];
    }
  }
  return dst.buffer;
}

/** Describe the session for coach context (injected into trainingSummary). */
export function describeTechnique(angles: PoseAngles, exerciseName: string): string {
  const parts: string[] = [];
  const name = exerciseName.toLowerCase();

  if (name.includes('squat')) {
    parts.push(`knee angle ${angles.avgKnee}°`);
    if (angles.kneeSymmetry > 10) parts.push(`knee asymmetry ${angles.kneeSymmetry}°`);
    parts.push(`hip angle ${angles.avgHip}°`);
  } else if (name.includes('deadlift')) {
    parts.push(`hip hinge ${angles.avgHip}°`);
  } else if (name.includes('bench') || name.includes('press')) {
    parts.push(`elbow angle at bottom ${Math.round((angles.leftElbow + angles.rightElbow) / 2)}°`);
    if (Math.abs(angles.leftElbow - angles.rightElbow) > 10)
      parts.push(`elbow asymmetry ${Math.abs(angles.leftElbow - angles.rightElbow)}°`);
  }

  return parts.length ? parts.join(', ') : `knee ${angles.avgKnee}°, hip ${angles.avgHip}°`;
}
