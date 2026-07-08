const CUBISM_CORE_SCRIPT_ID = 'live2d-cubism-core'
const CUBISM_CORE_URL = 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js'

let cubismCorePromise: Promise<void> | null = null

export function loadCubismCore() {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if ((window as unknown as { Live2DCubismCore?: unknown }).Live2DCubismCore) {
    return Promise.resolve()
  }

  cubismCorePromise ??= new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(CUBISM_CORE_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Cubism Core 加载失败')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = CUBISM_CORE_SCRIPT_ID
    script.src = CUBISM_CORE_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Cubism Core 加载失败'))
    document.head.appendChild(script)
  })

  return cubismCorePromise
}
