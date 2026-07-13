/**
 * 空闲帧预热重组件:用户停留在 home 时,把"下一个 tab 可能用到"的 chunk
 * 提前拉进浏览器缓存。等真正切 tab 时,React.lazy 直接命中,秒开。
 *
 * 重要:不要在初次挂载就同步触发(那等于把 lazy 拆分白做了)。
 * 用 requestIdleCallback 等空闲时机,确保不抢首屏关键资源。
 */

let _prefetched = false

const onIdle = (cb: () => void): void => {
  if (typeof window === 'undefined') return
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined
  if (typeof ric === 'function') {
    ric(cb, { timeout: 4000 })
  } else {
    setTimeout(cb, 2000)
  }
}

/**
 * 在 home/欢迎页挂载后调用一次即可。
 * 重复调用安全(内部去重)。
 */
export function prefetchHeavyTabs(): void {
  if (_prefetched) return
  _prefetched = true

  onIdle(() => {
    // Live2D chunk(685kB)— 切到「小灵」前先吃缓存
    void import('../components/Live2DStage').catch(() => { /* ignore */ })
    // ChatPanel chunk(含 antd 部分依赖)
    void import('../components/ChatPanel').catch(() => { /* ignore */ })
  })

  onIdle(() => {
    // 移动端 5 个懒加载 tab 页:首屏不背它们,空闲时预热,切 tab 秒开
    void import('../mobile/MobileGuidePage').catch(() => { /* ignore */ })
    void import('../mobile/MobileMapPage').catch(() => { /* ignore */ })
    void import('../mobile/MobileProfilePage').catch(() => { /* ignore */ })
    void import('../mobile/MobileTicketPage').catch(() => { /* ignore */ })
    void import('../mobile/MobileConsumePage').catch(() => { /* ignore */ })
  })

  onIdle(() => {
    // TMap SDK 与 MobileMapPage 不可懒;但 loadTMap 内部的脚本拉取可预热
    void import('./loadTMap')
      .then((mod) => {
        try { return mod.loadTMap?.() } catch { /* ignore */ }
      })
      .catch(() => { /* ignore */ })
  })
}
