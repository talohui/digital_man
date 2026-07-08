const TMAP_SCRIPT_ID = 'tmap-gl-script'
const TMAP_SCRIPT_BASE = 'https://map.qq.com/api/gljs?v=1.exp'
const TMAP_LIBRARIES = 'visualization,model'

// 'heat'(默认)— 等热力扩展库(visualization.Heat)就绪,供需要热力图的页面(如 ScenicMapPage)。
// 'core'        — 核心 SDK(window.TMap.Map)就绪即返回,不阻塞等待扩展库;
//                 用于不使用热力图/3D 模型的页面(如移动端导览图),让底图尽快出图。
type TMapWaitTarget = 'core' | 'heat'

function getMapKey() {
  const key = import.meta.env.VITE_TMAP_WEB_KEY?.trim()

  if (!key) {
    throw new Error(
      '未检测到 VITE_TMAP_WEB_KEY。请在 demo 根目录创建 .env.local，并填写腾讯地图 Web Key 后重启开发服务器。'
    )
  }

  return key
}

// 注入主脚本,并在核心 SDK(window.TMap.Map)就绪时 resolve。
// 扩展库(visualization 热力 / model GLTF)在主脚本之后异步就绪,此处不等待——
// 它们仍会继续后台加载,供需要的页面在 waitForHeat / GLTFModel 可用性检查里取用。
function ensureTMapScript(): Promise<any> {
  if (window.TMap?.Map) {
    return Promise.resolve(window.TMap)
  }

  if (window.__tmapScriptLoader) {
    return window.__tmapScriptLoader
  }

  window.__tmapScriptLoader = new Promise((resolve, reject) => {
    const fail = (message: string) => {
      window.__tmapScriptLoader = undefined
      reject(new Error(message))
    }

    const onReady = () => {
      if (window.TMap?.Map) {
        resolve(window.TMap)
      } else {
        fail('腾讯地图脚本已加载，但未检测到 TMap 对象。')
      }
    }

    const existing = document.getElementById(TMAP_SCRIPT_ID) as HTMLScriptElement | null

    if (existing) {
      // 脚本可能早已加载完成(load 事件不会再触发),直接判断
      if (window.TMap?.Map) {
        resolve(window.TMap)
        return
      }
      existing.addEventListener('load', onReady, { once: true })
      existing.addEventListener(
        'error',
        () => fail('腾讯地图脚本加载失败，请检查 Key 白名单和网络状态。'),
        { once: true }
      )
      return
    }

    let key: string
    try {
      key = getMapKey()
    } catch (error) {
      window.__tmapScriptLoader = undefined
      reject(error as Error)
      return
    }

    const script = document.createElement('script')
    script.id = TMAP_SCRIPT_ID
    script.async = true
    script.charset = 'utf-8'
    script.src = `${TMAP_SCRIPT_BASE}&key=${encodeURIComponent(key)}&libraries=${TMAP_LIBRARIES}`
    script.onload = onReady
    script.onerror = () => fail('腾讯地图脚本加载失败，请检查 Key 白名单和网络状态。')

    document.head.appendChild(script)
  })

  return window.__tmapScriptLoader
}

// 扩展库在主脚本之后异步就绪,轮询等待热力图模块可用。
// 若已就绪,首次 check 立即 resolve(无额外延迟)。
function waitForHeat(): Promise<any> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const check = () => {
      if (window.TMap?.visualization?.Heat) {
        resolve(window.TMap)
      } else if (Date.now() - startedAt > 8000) {
        reject(new Error('腾讯地图 visualization 热力库加载超时,请刷新页面重试。'))
      } else {
        window.setTimeout(check, 100)
      }
    }
    check()
  })
}

export async function loadTMap(options?: { waitFor?: TMapWaitTarget }): Promise<any> {
  const waitFor = options?.waitFor ?? 'heat'

  // 快路径:已满足目标条件,直接返回。
  if (window.TMap?.Map && (waitFor === 'core' || window.TMap?.visualization?.Heat)) {
    return window.TMap
  }

  await ensureTMapScript()

  if (waitFor === 'core') {
    return window.TMap
  }

  return waitForHeat()
}
