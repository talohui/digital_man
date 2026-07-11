import type { ReactNode } from 'react'

import '../../styles/map/mapToolRail.css'

export type MapMobileToolRailItem = {
  id: string
  label: string
  icon?: ReactNode
  active?: boolean
  expanded?: boolean
  danger?: boolean
  vertical?: boolean
  disabled?: boolean
  onClick?: () => void
}

type MapMobileToolRailProps = {
  side: 'left' | 'right'
  items: MapMobileToolRailItem[]
  ariaLabel: string
  className?: string
  assistantAnchor?: string
}

function renderLabel(label: string, vertical?: boolean) {
  if (!vertical) {
    return label
  }

  return label.split('').map((char, index) => <b key={`${char}-${index}`}>{char}</b>)
}

export function MapMobileToolRail({ side, items, ariaLabel, className, assistantAnchor }: MapMobileToolRailProps) {
  return (
    <div
      className={['map-mobile-toolrail', `map-mobile-toolrail--${side}`, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      data-guide-assistant-anchor={assistantAnchor}
    >
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={[
            'map-mobile-toolrail__item',
            item.active ? 'is-active' : '',
            item.danger ? 'is-danger' : '',
            item.icon ? '' : 'has-no-icon',
            item.vertical ? 'has-vertical-label' : ''
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={item.onClick}
          disabled={item.disabled}
          aria-pressed={item.active}
          aria-expanded={item.expanded}
          aria-label={item.label}
        >
          {item.icon ? <span className="map-mobile-toolrail__icon" aria-hidden="true">{item.icon}</span> : null}
          <em className="map-mobile-toolrail__label">{renderLabel(item.label, item.vertical)}</em>
        </button>
      ))}
    </div>
  )
}
