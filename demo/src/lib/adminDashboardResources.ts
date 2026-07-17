export type ResourceStatus = 'loading' | 'ready' | 'stale' | 'error'

export type ResourceState<T> = {
  data: T
  status: ResourceStatus
  fetchedAt?: string
  error?: string
}

export function isAdminDemoEnabled(env: Record<string, unknown>): boolean {
  return String(env.VITE_ADMIN_DEMO_DATA ?? '').trim().toLowerCase() === 'true'
}

export function loadingResource<T>(data: T): ResourceState<T> {
  return { data, status: 'loading' }
}

export function readyResource<T>(data: T, fetchedAt = new Date().toISOString()): ResourceState<T> {
  return { data, status: 'ready', fetchedAt }
}

export function failResource<T>(previous: ResourceState<T>, error: string): ResourceState<T> {
  return {
    ...previous,
    status: previous.fetchedAt ? 'stale' : 'error',
    error,
  }
}

export function settleResource<T>(
  previous: ResourceState<T>,
  result: PromiseSettledResult<T>,
  sourceLabel: string,
  fetchedAt = new Date().toISOString(),
): ResourceState<T> {
  if (result.status === 'fulfilled') return readyResource(result.value, fetchedAt)

  const reason = result.reason instanceof Error ? result.reason.message.trim() : ''
  const suffix = /timeout|abort/i.test(reason) ? '（请求超时）' : ''
  return failResource(previous, `${sourceLabel}暂不可用${suffix}`)
}
