import { DynamicInkMistCanvas, type DynamicInkMistStatus } from './DynamicInkMistCanvas'

export type BuddhaRealmAtmosphereMode = 'intro' | 'normal' | 'tour' | 'focus'
export type BuddhaRealmClearMaskShape = 'round' | 'route-ellipse'
export type BuddhaRealmClearMaskSize = 'wide' | 'balanced' | 'compact'

type BuddhaRealmAtmosphereProps = {
  mode: BuddhaRealmAtmosphereMode
  visible: boolean
  edgeMistLevel?: 'normal' | 'strong'
  clearMaskShape?: BuddhaRealmClearMaskShape
  clearMaskSize?: BuddhaRealmClearMaskSize
  dynamicMistEnabled?: boolean
  onDynamicMistStatusChange?: (status: DynamicInkMistStatus) => void
}

export function BuddhaRealmAtmosphere({
  clearMaskShape = 'round',
  clearMaskSize = 'wide',
  dynamicMistEnabled = false,
  edgeMistLevel = 'normal',
  mode,
  onDynamicMistStatusChange,
  visible
}: BuddhaRealmAtmosphereProps) {
  if (!visible) {
    return null
  }

  return (
    <div
      className={`map-3d-guide-atmosphere map-3d-guide-atmosphere--${mode} map-3d-guide-atmosphere--edge-${edgeMistLevel} map-3d-guide-atmosphere--clear-${clearMaskShape} map-3d-guide-atmosphere--clear-${clearMaskSize}`}
      aria-hidden="true"
    >
      <div className="map-3d-guide-atmosphere__sky" />
      <div className="map-3d-guide-atmosphere__ink-horizon" />
      <div className="map-3d-guide-atmosphere__forest" />
      <div className="map-3d-guide-atmosphere__water" />
      <DynamicInkMistCanvas
        enabled={dynamicMistEnabled}
        intro={mode === 'intro'}
        onStatusChange={onDynamicMistStatusChange}
        visible={dynamicMistEnabled}
      />
      <div className="map-3d-guide-atmosphere__edge" />
      <div className="map-3d-guide-atmosphere__route" />
      <div className="map-3d-guide-atmosphere__glow" />
      <div className="map-3d-guide-atmosphere__gold-dust" />
      <div className="map-3d-guide-atmosphere__vignette" />
    </div>
  )
}
