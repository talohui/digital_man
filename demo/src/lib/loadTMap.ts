const TMAP_SCRIPT_ID = 'tmap-gl-script'
const TMAP_SCRIPT_BASE = 'https://map.qq.com/api/gljs?v=1.exp'
const TMAP_LIBRARIES = 'visualization,model'

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
  // visualization.Heat 是 B 端热力图硬依赖；model.GLTFModel 是 3D 地图 Beta 叠加，
  // 页面里会按可用性降级，不阻塞基础地图加载。
  if (window.TMap?.visualization?.Heat) {
    return window.TMap
  }

  if (window.__tmapLoader) {
    return window.__tmapLoader
  }

  const key = getMapKey()

  window.__tmapLoader = new Promise((resolve, reject) => {
    const fail = (message: string) => {
      window.__tmapLoader = undefined
      reject(new Error(message))
    }

    // 扩展库在主脚本之后异步就绪,轮询等待热力图模块可用再 resolve。
    // 若已就绪,首次 check 立即 resolve(无额外延迟)。
    const waitReady = () => {
      const startedAt = Date.now()
      const check = () => {
        if (window.TMap?.visualization?.Heat) {
          resolve(window.TMap)
        } else if (Date.now() - startedAt > 8000) {
          fail('腾讯地图 visualization 热力库加载超时,请刷新页面重试。')
        } else {
          window.setTimeout(check, 100)
        }
      }
      check()
    }

    const existing = document.getElementById(TMAP_SCRIPT_ID) as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener('load', waitReady, { once: true })
      existing.addEventListener(
        'error',
        () => fail('腾讯地图脚本加载失败，请检查 Key 白名单和网络状态。'),
        { once: true }
      )
      // 脚本可能早已加载完成(load 事件不会再触发),直接尝试等待
      if (window.TMap) {
        waitReady()
      }
      return
    }

    const script = document.createElement('script')
    script.id = TMAP_SCRIPT_ID
    script.async = true
    script.charset = 'utf-8'
    script.src = `${TMAP_SCRIPT_BASE}&key=${encodeURIComponent(key)}&libraries=${TMAP_LIBRARIES}`
    script.onload = () => {
      if (!window.TMap) {
        fail('腾讯地图脚本已加载，但未检测到 TMap 对象。')
        return
      }
      waitReady()
    }
    script.onerror = () => fail('腾讯地图脚本加载失败，请检查 Key 白名单和网络状态。')

    document.head.appendChild(script)
  })

  return window.__tmapLoader
}
