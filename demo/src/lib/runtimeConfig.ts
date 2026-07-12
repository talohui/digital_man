function getCurrentHost() {
  if (typeof window === 'undefined') return '127.0.0.1'
  return window.location.hostname || '127.0.0.1'
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '')
}

function httpBase(port: number) {
  const protocol =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
  return `${protocol}//${getCurrentHost()}:${port}`
}

function wsBase(port: number) {
  const protocol =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${getCurrentHost()}:${port}`
}

export function getFayHttpBase() {
  const env = import.meta.env.VITE_FAY_HTTP?.trim()
  return normalizeBaseUrl(env || httpBase(5000))
}

export function getFayWsBase() {
  const env = import.meta.env.VITE_FAY_WS?.trim()
  return normalizeBaseUrl(env || wsBase(10003))
}

export function getAnalyticsApiBase() {
  const env = import.meta.env.VITE_ANALYTICS_HTTP?.trim()
  return normalizeBaseUrl(env || httpBase(5002)) + '/api'
}

export function getKbApiBase() {
  // 灵山知识库管理服务（B1.x），默认 5011；与电脑同机/同网时按当前 host 推导
  const env = import.meta.env.VITE_KB_HTTP?.trim()
  return normalizeBaseUrl(env || httpBase(5011))
}
