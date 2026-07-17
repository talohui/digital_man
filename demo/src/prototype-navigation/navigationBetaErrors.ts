export type NavigationBetaErrorKind =
  | 'insecure-context'
  | 'permission-denied'
  | 'location-timeout'
  | 'location-unavailable'
  | 'poor-accuracy'
  | 'coordinate-transform'
  | 'route-network'
  | 'route-not-found'
  | 'route-key-or-quota'
  | 'target-location-missing'
  | 'reroute-failed'
  | 'session-expired'
  | 'unknown'

export function resolveNavigationBetaError(kind: NavigationBetaErrorKind, debugMessage?: string) {
  const messages: Record<NavigationBetaErrorKind, { title: string; message: string; retryable: boolean }> = {
    'insecure-context': { title: '无法使用实时定位', message: '当前页面不是安全连接，暂时无法使用真实定位。', retryable: false },
    'permission-denied': { title: '定位权限未开启', message: '请在浏览器或系统设置中允许位置权限后重试。', retryable: true },
    'location-timeout': { title: '暂时无法获取当前位置', message: '请到室外开阔区域后重新尝试。', retryable: true },
    'location-unavailable': { title: '暂时无法获取当前位置', message: '请到室外开阔区域后重新尝试。', retryable: true },
    'poor-accuracy': { title: '当前位置暂时不可用于导航', message: '定位精度不足，请稍后重新定位。', retryable: true },
    'coordinate-transform': { title: '当前位置暂时不可用于导航', message: '请稍后重新定位。', retryable: true },
    'route-network': { title: '步行路线规划失败', message: '请检查网络后重试。', retryable: true },
    'route-not-found': { title: '暂未找到可用步行路线', message: '你仍可以查看完整导览路线。', retryable: false },
    'route-key-or-quota': { title: '步行路线规划暂不可用', message: '请稍后再试。', retryable: false },
    'target-location-missing': { title: '导航位置尚未完善', message: '该站点暂时无法使用实时导航。', retryable: false },
    'reroute-failed': { title: '重新规划失败', message: '请继续沿当前路线或稍后重试。', retryable: true },
    'session-expired': { title: '上一次导航已失效', message: '请重新开始导航。', retryable: true },
    unknown: { title: '导航暂时不可用', message: '请稍后重试。', retryable: true }
  }
  return { kind, ...messages[kind], debugMessage }
}

export function classifyNavigationError(message?: string): NavigationBetaErrorKind {
  const value = message?.toLowerCase() ?? ''
  if (value.includes('安全') || value.includes('secure')) return 'insecure-context'
  if (value.includes('拒绝') || value.includes('permission')) return 'permission-denied'
  if (value.includes('超时') || value.includes('timeout')) return 'location-timeout'
  if (value.includes('不可用') || value.includes('unavailable')) return 'location-unavailable'
  if (value.includes('坐标转换')) return 'coordinate-transform'
  if (value.includes('key') || value.includes('quota')) return 'route-key-or-quota'
  if (value.includes('路线') || value.includes('腾讯')) return 'route-network'
  return 'unknown'
}
