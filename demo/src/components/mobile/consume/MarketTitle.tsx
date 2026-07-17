import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import '../../../styles/c-app/marketTitle.css'

type MarketTitleProps = {
  title: string
  eyebrow?: string
  description?: string
  aside?: ReactNode
  action?: ReactNode
  id?: string
  level?: 1 | 2 | 3
  variant?: 'title' | 'welcome'
  animated?: boolean
  animationDelay?: number
  className?: string
}

function MarketTitle({
  title,
  eyebrow,
  description,
  aside,
  action,
  id,
  level = 2,
  variant = 'title',
  animated = true,
  animationDelay = 0,
  className = ''
}: MarketTitleProps) {
  const rootRef = useRef<HTMLElement>(null)
  const Heading = level === 1 ? 'h1' : level === 3 ? 'h3' : 'h2'
  const style = {
    '--market-title-delay': `${animationDelay}ms`
  } as CSSProperties

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const updateTravel = () => {
      const roller = root.querySelector<HTMLElement>('.market-title__roller--end')
      if (!roller) return
      const travel = Math.max(0, root.getBoundingClientRect().width - roller.getBoundingClientRect().width)
      root.style.setProperty('--market-title-travel', `${travel}px`)
    }

    updateTravel()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateTravel)
    observer?.observe(root)
    if (!observer) window.addEventListener('resize', updateTravel)

    return () => {
      observer?.disconnect()
      if (!observer) window.removeEventListener('resize', updateTravel)
    }
  }, [])

  return (
    <header
      ref={rootRef}
      className={`market-title market-title--bamboo-scroll market-title--${variant} ${animated ? 'is-animated' : ''} ${className}`.trim()}
      style={style}
    >
      <i className="market-title__roller market-title__roller--start" aria-hidden="true"><b /><b /><b /></i>
      <div className="market-title__paper">
        <div className="market-title__copy">
          {eyebrow ? <span>{eyebrow}</span> : null}
          <Heading id={id}>{title}</Heading>
          {description ? <p>{description}</p> : null}
        </div>
        {aside ? <div className="market-title__aside">{aside}</div> : null}
        {action ? <div className="market-title__action">{action}</div> : null}
      </div>
      <i className="market-title__roller market-title__roller--end" aria-hidden="true"><b /><b /><b /></i>
    </header>
  )
}

export default MarketTitle
export type { MarketTitleProps }
