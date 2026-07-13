/*
 * 灵山数字人 demo — 极简 Service Worker
 *
 * 策略:
 *   - vendor-* / *.css / 字体 / .png/.jpg/.svg → cache-first(content-hash 不变就永久命中)
 *   - 其他 GET → stale-while-revalidate(先吐缓存再后台更新)
 *   - HTML / 接口 POST / API GET → 直接走网络
 *
 * 第二次访问近 0 网络请求,移动端隧道掉线也能用上次的视图。
 */

// 资源优化(webp 纹理/开屏图、原地压缩图标)后必须升版本,否则旧 SW 的 cache-first
// 会持续喂旧的大体积缓存,优化在已访问过的设备上不生效。activate 时会清掉旧版本缓存。
const CACHE_VERSION = 'lingshan-v2'
const ASSETS_CACHE = `${CACHE_VERSION}-assets`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

const STATIC_EXT = /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|gif|ico)$/
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  // 新版本立即激活,不等待老 SW 关掉所有 tab
  self.skipWaiting()
  // 预缓存离线兜底页:首次访问即断网也能给出友好提示而非浏览器错误页
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((c) => c.add(OFFLINE_URL).catch(() => {}))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // 清理旧版本缓存
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k))
        )
      ),
      self.clients.claim()
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // 同源限定,不缓存第三方(腾讯地图、PostHog 等)
  if (url.origin !== self.location.origin) return

  // HTML 导航:网络优先,失败再回缓存,避免拿到旧版本壳套不上新 vendor
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy))
          return res
        })
        .catch(() =>
          caches
            .match(req)
            .then((r) => r || caches.match('/'))
            .then((r) => r || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // 静态资源(带 content hash):cache-first
  if (STATIC_EXT.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(ASSETS_CACHE).then((c) => c.put(req, copy))
            }
            return res
          })
      )
    )
    return
  }

  // 其余:stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || networkFetch
    })
  )
})
