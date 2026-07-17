export type FayVoiceOption = {
  id: string
  label: string
  provider: 'aliyun-nls'
}

/** Curated female Aliyun NLS voices supported by the current Fay `tts_module=ali` setup. */
export const FAY_FEMALE_VOICE_OPTIONS: readonly FayVoiceOption[] = [
  { id: 'zhimiao_emo', label: '知妙 · 多情感女声', provider: 'aliyun-nls' },
  { id: 'zhimi_emo', label: '知米 · 亲和女声', provider: 'aliyun-nls' },
  { id: 'zhiyan_emo', label: '知燕 · 直播女声', provider: 'aliyun-nls' },
  { id: 'zhitian_emo', label: '知甜 · 甜美女声', provider: 'aliyun-nls' },
]
