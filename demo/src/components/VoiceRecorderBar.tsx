import { AudioOutlined } from '@ant-design/icons'

type Props = {
  isRecording: boolean
  isSupported: boolean
  voiceDraft: string
  justSent?: boolean
  idleHint?: string
  useCloudAsr?: boolean
}

function VoiceRecorderBar({
  isRecording,
  isSupported,
  voiceDraft,
  justSent,
  idleHint,
  useCloudAsr
}: Props) {
  if (!isSupported) {
    return (
      <div className="chat-card__voice-bar chat-card__voice-bar--unsupported" role="status">
        <AudioOutlined />
        <span>
          当前浏览器无法使用麦克风，请使用 Chrome / Edge，或通过 http://127.0.0.1 访问；您仍可打字提问。
        </span>
      </div>
    )
  }

  if (justSent) {
    return (
      <div className="chat-card__voice-bar chat-card__voice-bar--sent" role="status">
        <span>已发送语音内容</span>
      </div>
    )
  }

  if (isRecording) {
    const preview = voiceDraft.trim() || '请说话…'
    return (
      <div className="chat-card__voice-bar chat-card__voice-bar--recording" aria-live="polite">
        <span className="chat-card__voice-bar__pulse" aria-hidden />
        <div className="chat-card__voice-bar__main">
          <strong>松手发送</strong>
          <span className="chat-card__voice-bar__sub">
            {useCloudAsr ? '松手后上传至 Fay 云端识别' : '正在听您说话'}
          </span>
        </div>
        <p className="chat-card__voice-bar__preview">
          {useCloudAsr ? '录音中：' : '正在识别：'}
          {preview}
        </p>
      </div>
    )
  }

  return (
    <div className="chat-card__voice-bar chat-card__voice-bar--idle" role="status">
      <AudioOutlined className="chat-card__voice-bar__icon" />
      <span>
        {idleHint ??
          '按住下方麦克风说话，松手自动发送（电脑可在按钮外松手）'}
      </span>
    </div>
  )
}

export default VoiceRecorderBar
