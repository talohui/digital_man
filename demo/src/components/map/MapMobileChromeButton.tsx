import '../../styles/map/mapMobileControls.css'

type MapMobileChromeButtonKind = 'back' | 'more' | 'close'

type MapMobileChromeButtonProps = {
  kind: MapMobileChromeButtonKind
  label: string
  className?: string
  onClick?: () => void
}

function getKindContent(kind: MapMobileChromeButtonKind) {
  if (kind === 'more') {
    return (
      <span className="map-mobile-chrome-button__dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    )
  }

  if (kind === 'close') {
    return <span className="map-mobile-chrome-button__close" aria-hidden="true" />
  }

  return <span className="map-mobile-chrome-button__back" aria-hidden="true" />
}

export function MapMobileChromeButton({ kind, label, className, onClick }: MapMobileChromeButtonProps) {
  return (
    <button
      type="button"
      className={['map-mobile-chrome-button', `map-mobile-chrome-button--${kind}`, className].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-label={label}
    >
      {getKindContent(kind)}
    </button>
  )
}
