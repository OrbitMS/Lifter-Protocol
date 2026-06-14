import * as FileSystem from 'expo-file-system';

export const MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf';
export const MODEL_FILENAME = 'qwen2.5-1.5b-q4.gguf';
export const MODEL_SIZE_MB = 935;

export function getModelPath(): string {
  return `${FileSystem.documentDirectory}${MODEL_FILENAME}`;
}

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(getModelPath());
  return info.exists && (info as FileSystem.FileInfo & { size?: number }).size! > 0;
}

export type DownloadProgress = {
  bytesDownloaded: number;
  bytesTotal: number;
  fraction: number;
};

export function createModelDownload(
  onProgress: (p: DownloadProgress) => void,
): FileSystem.DownloadResumable {
  return FileSystem.createDownloadResumable(
    MODEL_URL,
    getModelPath(),
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress({
        bytesDownloaded: totalBytesWritten,
        bytesTotal: totalBytesExpectedToWrite,
        fraction: totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0,
      });
    },
  );
}

export async function deleteModel(): Promise<void> {
  const info = await FileSystem.getInfoAsync(getModelPath());
  if (info.exists) await FileSystem.deleteAsync(getModelPath());
}
