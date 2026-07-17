import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import '../../styles/map/mapFolioPrimitives.css'

type MapFolioSurfaceProps = ComponentPropsWithoutRef<'section'>

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

export function MapFolioSurface({ className, ...props }: MapFolioSurfaceProps) {
  return (
    <section
      {...props}
      className={joinClassNames('map-folio-surface', className)}
      data-map-folio="true"
    />
  )
}

type MapFolioHeaderProps = {
  eyebrow: string
  title?: string
  meta?: ReactNode
  leading?: ReactNode
  action?: ReactNode
  className?: string
  copyClassName?: string
  eyebrowClassName?: string
  metaClassName?: string
  actionClassName?: string
}

export function MapFolioHeader({
  eyebrow,
  title,
  meta,
  leading,
  action,
  className,
  copyClassName,
  eyebrowClassName,
  metaClassName,
  actionClassName
}: MapFolioHeaderProps) {
  return (
    <header className={joinClassNames('map-folio-header', className)}>
      {leading}
      <div className={joinClassNames('map-folio-header__copy', copyClassName)}>
        <span className={joinClassNames('map-folio-header__eyebrow', eyebrowClassName)}>{eyebrow}</span>
        {title ? <h2>{title}</h2> : null}
      </div>
      {meta ? <span className={joinClassNames('map-folio-header__meta', metaClassName)}>{meta}</span> : null}
      {action ? <div className={joinClassNames('map-folio-header__action', actionClassName)}>{action}</div> : null}
    </header>
  )
}

export type MapFolioMetric = {
  label: string
  value: ReactNode
}

type MapFolioMetricsProps = {
  items: MapFolioMetric[]
  ariaLabel: string
  className?: string
}

export function MapFolioMetrics({ items, ariaLabel, className }: MapFolioMetricsProps) {
  return (
    <div className={joinClassNames('map-folio-metrics', className)} role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <span key={item.label} className="map-folio-metrics__item">
          <small>{item.label}</small>
          <b>{item.value}</b>
        </span>
      ))}
    </div>
  )
}

type MapFolioActionPairProps = {
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
  primaryDisabled?: boolean
  secondaryDisabled?: boolean
  className?: string
  primaryClassName?: string
  secondaryClassName?: string
}

export function MapFolioActionPair({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  primaryDisabled = false,
  secondaryDisabled = false,
  className,
  primaryClassName,
  secondaryClassName
}: MapFolioActionPairProps) {
  return (
    <div className={joinClassNames('map-folio-action-pair', className)}>
      <button
        type="button"
        className={joinClassNames('map-folio-action-pair__primary', primaryClassName)}
        onClick={onPrimary}
        disabled={primaryDisabled}
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        className={joinClassNames('map-folio-action-pair__secondary', secondaryClassName)}
        onClick={onSecondary}
        disabled={secondaryDisabled}
      >
        {secondaryLabel}
      </button>
    </div>
  )
}
