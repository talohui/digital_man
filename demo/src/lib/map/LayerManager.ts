export const LAYER_ORDER = {
  custom_tile: 100,
  route: 300,
  poi: 500,
  model: 700,
  debug: 999
} as const

export type ManagedLayerSnapshot = {
  name: string
  visible: boolean
  order: number
  hasSetMap: boolean
  hasSetVisible: boolean
  hasDestroy: boolean
}

type ManagedLayerRecord = {
  layer: any
  visible: boolean
  order: number
}

type LayerManagerListener = (snapshot: ManagedLayerSnapshot[]) => void

export class LayerManager {
  private map: any = null
  private listeners = new Set<LayerManagerListener>()
  readonly layers = new Map<string, any>()
  private records = new Map<string, ManagedLayerRecord>()

  init(map: any) {
    this.map = map
  }

  registerLayer(name: string, layer: any) {
    if (!name || !layer) {
      return
    }

    if (this.records.has(name)) {
      this.removeLayer(name)
    }

    const order = getLayerOrder(name)
    applyLayerOrder(layer, order)
    this.layers.set(name, layer)
    this.records.set(name, {
      layer,
      visible: true,
      order
    })
    this.notify()
  }

  register(name: string, layer: any) {
    this.registerLayer(name, layer)
  }

  removeLayer(name: string) {
    const record = this.records.get(name)

    if (!record) {
      this.layers.delete(name)
      return
    }

    detachLayer(record.layer, this.map)
    this.records.delete(name)
    this.layers.delete(name)
    this.notify()
  }

  getLayer(name: string) {
    return this.layers.get(name)
  }

  show(name: string) {
    this.setVisible(name, true)
  }

  hide(name: string) {
    this.setVisible(name, false)
  }

  setVisible(name: string, visible: boolean) {
    const record = this.records.get(name)

    if (!record) {
      return
    }

    record.visible = visible
    setLayerVisible(record.layer, this.map, visible)
    this.notify()
  }

  destroy() {
    Array.from(this.records.keys()).forEach((name) => this.removeLayer(name))
    this.map = null
    this.layers.clear()
    this.records.clear()
    this.notify()
  }

  subscribe(listener: LayerManagerListener) {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): ManagedLayerSnapshot[] {
    return Array.from(this.records.entries())
      .map(([name, record]) => ({
        name,
        visible: record.visible,
        order: record.order,
        hasSetMap: typeof record.layer?.setMap === 'function',
        hasSetVisible: typeof record.layer?.setVisible === 'function',
        hasDestroy: typeof record.layer?.destroy === 'function'
      }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
  }

  getActiveLayerNames() {
    return this.getSnapshot()
      .filter((layer) => layer.visible)
      .map((layer) => layer.name)
  }

  private notify() {
    if (!this.listeners.size) {
      return
    }

    const snapshot = this.getSnapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

function getLayerOrder(name: string) {
  if (name === 'custom_tile' || name.startsWith('custom_tile')) {
    return LAYER_ORDER.custom_tile
  }

  if (name === 'route' || name.startsWith('route')) {
    return LAYER_ORDER.route
  }

  if (name === 'poi' || name.startsWith('poi')) {
    return LAYER_ORDER.poi
  }

  if (name === 'model' || name.startsWith('model')) {
    return LAYER_ORDER.model
  }

  if (name === 'debug' || name.startsWith('debug')) {
    return LAYER_ORDER.debug
  }

  return LAYER_ORDER.debug
}

function applyLayerOrder(layer: any, order: number) {
  try {
    if (typeof layer?.setZIndex === 'function') {
      layer.setZIndex(order)
      return
    }

    if (typeof layer?.setOptions === 'function') {
      layer.setOptions({ zIndex: order })
      return
    }

    if ('zIndex' in Object(layer)) {
      layer.zIndex = order
    }
  } catch {
    // Tencent overlay implementations differ; constructor zIndex remains authoritative.
  }
}

function setLayerVisible(layer: any, map: any, visible: boolean) {
  try {
    if (typeof layer?.setVisible === 'function') {
      layer.setVisible(visible)
      return
    }

    if (typeof layer?.setMap === 'function') {
      layer.setMap(visible ? map : null)
    }
  } catch {
    // Visibility is best-effort; existing per-layer cleanup remains the source of truth.
  }
}

function detachLayer(layer: any, map: any) {
  let detachedByLayer = false

  try {
    layer?.setMap?.(null)
    detachedByLayer = typeof layer?.setMap === 'function'
  } catch {
    // Optional cleanup path.
  }

  if (!detachedByLayer && typeof layer?.destroy !== 'function') {
    try {
      map?.removeLayer?.(layer)
    } catch {
      // Some Tencent layers log/throw when already removed. Cleanup remains best-effort.
    }
  }

  try {
    layer?.destroy?.()
  } catch {
    // Optional cleanup path.
  }

  try {
    layer?.remove?.()
  } catch {
    // Optional cleanup path.
  }
}
