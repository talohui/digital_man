import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'

type MountainGateVariant = 'route' | 'services' | 'crowd'

type MountainGateProps = {
  children: ReactNode
  variant?: MountainGateVariant
  className?: string
  delay?: number
  onClick?: MouseEventHandler<HTMLButtonElement>
  ariaLabel?: string
}

function GateDoors({ delay }: { delay: number }) {
  return (
    <span
      className="home-mountain-gate__doors home-v2-gate-doors"
      style={{ '--home-v2-gate-delay': `${delay}ms` } as CSSProperties}
      aria-hidden="true"
    >
      <i className="home-mountain-gate__door home-v2-gate-door home-v2-gate-door--left is-left" />
      <i className="home-mountain-gate__door home-v2-gate-door home-v2-gate-door--right is-right" />
    </span>
  )
}

function MountainGate({
  children,
  variant = 'services',
  className = '',
  delay = 0,
  onClick,
  ariaLabel
}: MountainGateProps) {
  if (variant === 'route') {
    return (
      <button
        className={`home-mountain-gate home-mountain-gate--route home-v2-journey-gate ${className}`.trim()}
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
      >
        <span className="home-mountain-gate__finial home-v2-journey-gate__finial" aria-hidden="true" />
        <span className="home-mountain-gate__route-eave home-v2-journey-gate__beam" aria-hidden="true" />
        <span className="home-mountain-gate__ornaments home-v2-journey-gate__ornaments" aria-hidden="true"><i /><i /><i /><i /></span>
        <GateDoors delay={delay} />
        {children}
      </button>
    )
  }

  return (
    <div className={`home-mountain-gate home-mountain-gate--${variant} home-v2-content-gate home-v2-content-gate--${variant} ${className}`.trim()}>
      <span className="home-mountain-gate__content-eave home-v2-content-gate__eave" aria-hidden="true" />
      <GateDoors delay={delay} />
      {children}
    </div>
  )
}

export default MountainGate
export type { MountainGateProps, MountainGateVariant }
