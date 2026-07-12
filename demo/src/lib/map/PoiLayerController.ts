import type { LayerManager } from './LayerManager'

export type PoiLayerKind = 'generic' | 'routeStops' | 'routeState'

type PoiLayerBuildResult = {
  layer: any
  onClick?: (event: any) => void
}

type PoiLayerUpdateOptions = {
  kind: PoiLayerKind
  key: string
  build: (map: any) => PoiLayerBuildResult | null
}

type PoiLayerRecord = {
  layer: any
  clickHandler?: (event: any) => void
  renderKey: string
}

const layerNameByKind: Record<PoiLayerKind, string> = {
  generic: 'poi_generic',
  routeStops: 'poi_route_stops',
  routeState: 'poi_route_state'
}
const poiLayerKinds: PoiLayerKind[] = ['generic', 'routeStops', 'routeState']

/**
 * Owns the three semantically distinct custom POI layers.
 *
 * Generic browse labels update independently from Tencent native labels and
 * route numbering/current-next markers. Each kind retains its own
 * render key and click listener so an update is idempotent per layer.
 */
export class PoiLayerController {
  private map: any = null
  private records = new Map<PoiLayerKind, PoiLayerRecord>()

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

  update({ kind, key, build }: PoiLayerUpdateOptions) {
    const map = this.map
    if (!map || !this.isCurrentMap(map)) {
      return null
    }

    const current = this.records.get(kind)
    if (key === current?.renderKey && current.layer) {
      return current.layer
    }

    this.clear(kind)
    const result = build(map)
    if (!result || !this.isCurrentMap(map)) {
      result?.layer?.setMap?.(null)
      return null
    }

    const record: PoiLayerRecord = {
      layer: result.layer,
      clickHandler: result.onClick,
      renderKey: key
    }
    this.records.set(kind, record)
    if (record.clickHandler) {
      record.layer?.on?.('click', record.clickHandler)
    }
    this.layerManager.registerLayer(layerNameByKind[kind], record.layer, map)
    return record.layer
  }

  getLayer(kind: PoiLayerKind) {
    return this.records.get(kind)?.layer ?? null
  }

  clear(kind?: PoiLayerKind) {
    if (kind) {
      this.clearKind(kind)
      return
    }
    poiLayerKinds.forEach((layerKind) => this.clearKind(layerKind))
  }

  destroy() {
    this.clear()
    this.map = null
  }

  private clearKind(kind: PoiLayerKind) {
    const record = this.records.get(kind)
    if (!record) {
      return
    }

    if (record.clickHandler) {
      try {
        record.layer?.off?.('click', record.clickHandler)
      } catch {
        // Tencent can detach a layer during hard map recovery.
      }
    }
    this.layerManager.removeLayer(layerNameByKind[kind], record.layer)
    this.records.delete(kind)
  }
}
