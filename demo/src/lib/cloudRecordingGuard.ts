export const MIN_CLOUD_RECORDING_MS = 800
export const MIN_CLOUD_RECORDING_BYTES = 1024

export function getCloudRecordingError(durationMs: number, totalBytes: number): string | null {
  if (durationMs < MIN_CLOUD_RECORDING_MS || totalBytes < MIN_CLOUD_RECORDING_BYTES) {
    return '请按住至少 1 秒再松手。'
  }
  return null
}
