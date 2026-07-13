export type ServiceConfigField = {
  key: string
  label: string
  sensitive?: boolean
  placeholder?: string
}

export type ServiceConfigGroup = {
  id: 'llm' | 'embedding' | 'asr' | 'tts' | 'emotion'
  title: string
  description: string
  fields: ServiceConfigField[]
}

export const SERVICE_CONFIG_GROUPS: ServiceConfigGroup[] = [
  {
    id: 'llm',
    title: 'LLM 对话服务',
    description: '游客问答与大模型调用',
    fields: [
      { key: 'chat_module', label: '对话模块' },
      { key: 'gpt_model_engine', label: '模型名称' },
      { key: 'gpt_base_url', label: 'Base URL', placeholder: 'https://…/v1' },
      { key: 'gpt_api_key', label: 'API Key', sensitive: true },
      { key: 'big_model_engine', label: '备用模型名称' },
      { key: 'big_model_base_url', label: '备用 Base URL', placeholder: 'https://…/v1' },
      { key: 'big_model_api_key', label: '备用 API Key', sensitive: true },
    ],
  },
  {
    id: 'embedding',
    title: 'Embedding 检索服务',
    description: '知识库向量检索参数',
    fields: [
      { key: 'embedding_api_model', label: 'Embedding 模型' },
      { key: 'embedding_api_base_url', label: 'Embedding Base URL', placeholder: 'https://…/v1' },
      { key: 'embedding_api_key', label: 'Embedding API Key', sensitive: true },
    ],
  },
  {
    id: 'asr',
    title: 'ASR 语音识别',
    description: '阿里云 NLS 与语音输入',
    fields: [
      { key: 'ASR_mode', label: '识别模式' },
      { key: 'ali_nls_key_id', label: 'NLS Key ID', sensitive: true },
      { key: 'ali_nls_key_secret', label: 'NLS Key Secret', sensitive: true },
      { key: 'ali_nls_app_key', label: 'NLS App Key', sensitive: true },
    ],
  },
  {
    id: 'tts',
    title: 'TTS 语音合成',
    description: '阿里云、微软与火山引擎音色',
    fields: [
      { key: 'tts_module', label: 'TTS 模块' },
      { key: 'ali_tss_key_id', label: '阿里云 Key ID', sensitive: true },
      { key: 'ali_tss_key_secret', label: '阿里云 Key Secret', sensitive: true },
      { key: 'ali_tss_app_key', label: '阿里云 App Key', sensitive: true },
      { key: 'ms_tts_key', label: '微软 TTS Key', sensitive: true },
      { key: 'ms_tts_region', label: '微软 Region' },
      { key: 'volcano_tts_appid', label: '火山 AppID' },
      { key: 'volcano_tts_access_token', label: '火山 Access Token', sensitive: true },
      { key: 'volcano_tts_cluster', label: '火山 Cluster' },
      { key: 'volcano_tts_voice_type', label: '火山 Voice Type' },
    ],
  },
  {
    id: 'emotion',
    title: '情绪识别服务',
    description: '百度情绪识别参数',
    fields: [
      { key: 'baidu_emotion_app_id', label: 'App ID' },
      { key: 'baidu_emotion_api_key', label: 'API Key', sensitive: true },
      { key: 'baidu_emotion_secret_key', label: 'Secret Key', sensitive: true },
    ],
  },
]
