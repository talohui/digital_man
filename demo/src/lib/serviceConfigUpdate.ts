import type { ServiceConfig } from '../api/serviceConfig'

const MASK_PREFIX = '••••'
const SENSITIVE_FIELDS = new Set([
  'gpt_api_key',
  'big_model_api_key',
  'embedding_api_key',
  'ali_nls_key_id',
  'ali_nls_key_secret',
  'ali_nls_app_key',
  'ali_tss_key_id',
  'ali_tss_key_secret',
  'ali_tss_app_key',
  'ms_tts_key',
  'volcano_tts_access_token',
  'baidu_emotion_api_key',
  'baidu_emotion_secret_key',
])

export function buildServiceConfigUpdate(
  original: ServiceConfig,
  draft: ServiceConfig,
): ServiceConfig {
  return Object.fromEntries(
    Object.entries(draft).filter(([field, value]) => {
      if (value === original[field]) return false
      if (SENSITIVE_FIELDS.has(field) && (!value || value.startsWith(MASK_PREFIX))) return false
      return true
    }),
  )
}
