import { useMapGuideUiStore } from '../../store/useMapGuideUiStore'
import '../../styles/map/mapLayerPanel.css'

type MapLayerPanelProps = {
  open: boolean
  className?: string
  onServiceFacilitiesChange?: (enabled: boolean) => void
}

/**
 * Shared UI for POI visibility controls. The map runtime owns rendering; this
 * component only reads and updates the map UI store.
 */
export function MapLayerPanel({ open, className, onServiceFacilitiesChange }: MapLayerPanelProps) {
  const poiVisibilityMode = useMapGuideUiStore((state) => state.poiVisibilityMode)
  const serviceFacilitiesEnabled = useMapGuideUiStore((state) => state.serviceFacilitiesEnabled)
  const setPoiVisibilityMode = useMapGuideUiStore((state) => state.setPoiVisibilityMode)
  const setServiceFacilitiesEnabled = useMapGuideUiStore((state) => state.setServiceFacilitiesEnabled)

  if (!open) {
    return null
  }

  const setServiceFacilities = (enabled: boolean) => {
    setServiceFacilitiesEnabled(enabled)
    onServiceFacilitiesChange?.(enabled)
  }

  return (
    <section className={['map-layer-panel', className].filter(Boolean).join(' ')} role="dialog" aria-label="地图图层">
      <strong>地图图层</strong>
      <button
        type="button"
        className={poiVisibilityMode === 'core' ? 'is-active' : ''}
        aria-pressed={poiVisibilityMode === 'core'}
        onClick={() => setPoiVisibilityMode('core')}
      >
        核心景点
      </button>
      <button
        type="button"
        className={poiVisibilityMode === 'all' ? 'is-active' : ''}
        aria-pressed={poiVisibilityMode === 'all'}
        onClick={() => setPoiVisibilityMode('all')}
      >
        全部景点
      </button>
      <label>
        <input
          type="checkbox"
          checked={serviceFacilitiesEnabled}
          onChange={(event) => setServiceFacilities(event.target.checked)}
        />
        服务设施
      </label>
      {serviceFacilitiesEnabled ? <small>服务设施数据建设中</small> : null}
    </section>
  )
}
