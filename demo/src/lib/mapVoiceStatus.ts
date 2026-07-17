export type MapVoiceStatus = 'idle' | 'recording' | 'answering' | 'answered' | 'error'

type MapVoiceStatusInput = {
  isRecording: boolean
  isSending: boolean
  hasAnswered: boolean
  error: string
}

export function getMapVoiceStatus({
  isRecording,
  isSending,
  hasAnswered,
  error
}: MapVoiceStatusInput): MapVoiceStatus {
  if (isRecording) return 'recording'
  if (isSending) return 'answering'
  if (error.trim()) return 'error'
  return hasAnswered ? 'answered' : 'idle'
}
