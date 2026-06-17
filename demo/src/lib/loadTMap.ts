const TMAP_SCRIPT_ID = 'tmap-gl-script'
const TMAP_SCRIPT_BASE = 'https://map.qq.com/api/gljs?v=1.exp'
const TMAP_SCRIPT_LIBRARIES = 'model'
const TMAP_GLOBAL_READY_TIMEOUT_MS = 10000
const TMAP_GLOBAL_READY_POLL_MS = 80

function getMapKey() {
  const key = import.meta.env.VITE_TMAP_WEB_KEY?.trim()

  if (!key) {
    throw new Error(
      '未检测到 VITE_TMAP_WEB_KEY。请在 demo 根目录创建 .env.local，并填写腾讯地图 Web Key 后重启开发服务器。'
    )
  }

  return key
}

export async function loadTMap() {
  if (window.TMap) {
    return window.TMap
  }

  if (window.__tmapLoader) {
    return window.__tmapLoader
  }

  const key = getMapKey()

  window.__tmapLoader = new Promise((resolve, reject) => {
    const existing = document.getElementById(TMAP_SCRIPT_ID) as HTMLScriptElement | null

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        waitForTMapGlobal(resolve, reject)
        return
      }

      existing.addEventListener(
        'load',
        () => {
          existing.dataset.loaded = 'true'
          waitForTMapGlobal(resolve, reject)
        },
        { once: true }
      )
      existing.addEventListener(
        'error',
        () => {
          window.__tmapLoader = undefined
          reject(new Error('腾讯地图脚本加载失败，请检查 Key 白名单和网络状态。'))
        },
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.id = TMAP_SCRIPT_ID
    script.async = true
    script.charset = 'utf-8'
    script.src = `${TMAP_SCRIPT_BASE}&key=${encodeURIComponent(key)}&libraries=${encodeURIComponent(TMAP_SCRIPT_LIBRARIES)}`
    script.onload = () => {
      script.dataset.loaded = 'true'
      waitForTMapGlobal(resolve, reject)
    }
    script.onerror = () => {
      window.__tmapLoader = undefined
      reject(new Error('腾讯地图脚本加载失败，请检查 Key 白名单和网络状态。'))
    }

    document.head.appendChild(script)
  })

  return window.__tmapLoader
}

function waitForTMapGlobal(resolve: (value: any) => void, reject: (reason?: unknown) => void) {
  const startedAt = Date.now()

  const poll = () => {
    if (window.TMap) {
      resolve(window.TMap)
      return
    }

    if (Date.now() - startedAt >= TMAP_GLOBAL_READY_TIMEOUT_MS) {
      window.__tmapLoader = undefined
      reject(new Error('腾讯地图脚本已加载，但未检测到 TMap 对象。'))
      return
    }

    window.setTimeout(poll, TMAP_GLOBAL_READY_POLL_MS)
  }

  poll()
}
