import type { LayerManager } from './LayerManager'

type PoiLayerBuildResult = {
  layer: any
  onClick?: (event: any) => void
}

type PoiLayerUpdateOptions = {
  key: string
  build: (map: any) => PoiLayerBuildResult | null
}

/**
 * Single owner for the map's custom POI marker layer.
 *
 * It deliberately does not know route/UI semantics. Map3DGuidePage supplies a
 * stable render key and the existing marker factory; this controller only
 * guarantees one layer, one click handler and idempotent cleanup per map.
 */
export class PoiLayerController {
  private map: any = null
  private layer: any = null
  private clickHandler?: (event: any) => void
  private renderKey = ''

  constructor(
    private readonly layerManager: LayerManager,
    private readonly isCurrentMap: (map: any) => boolean
  ) {}

  init(map: any) {
    if (this.map === map) {
      return
    }
    this.destroy()
    this.map = map
  }

  update({ key, build }: PoiLayerUpdateOptions) {
    const map = this.map
    if (!map || !this.isCurrentMap(map)) {
      return null
    }

    if (key === this.renderKey && this.layer) {
      return this.layer
    }

    this.clear()
    const result = build(map)
    if (!result || !this.isCurrentMap(map)) {
      result?.layer?.setMap?.(null)
      return null
    }

    this.layer = result.layer
    this.clickHandler = result.onClick
    this.renderKey = key
    if (this.clickHandler) {
      this.layer?.on?.('click', this.clickHandler)
    }
    this.layerManager.registerLayer('poi_route', this.layer, map)
    return this.layer
  }

  getLayer() {
    return this.layer
  }

  clear() {
    const layer = this.layer
    if (!layer) {
      this.renderKey = ''
      return
    }

    if (this.clickHandler) {
      try {
        layer.off?.('click', this.clickHandler)
      } catch {
        // Tencent layer may already be detached during a hard map recovery.
      }
    }
    this.layerManager.removeLayer('poi_route', layer)
    this.layer = null
    this.clickHandler = undefined
    this.renderKey = ''
  }

  destroy() {
    this.clear()
    this.map = null
  }
}
