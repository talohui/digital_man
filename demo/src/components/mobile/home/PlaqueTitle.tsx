import type { ReactNode } from 'react'

type PlaqueTitleProps = {
  title: ReactNode
  id?: string
  className?: string
  size?: 'small' | 'medium' | 'large'
  level?: 2 | 3
}

function PlaqueTitle({
  title,
  id,
  className = '',
  size = 'medium',
  level = 2
}: PlaqueTitleProps) {
  const Heading = level === 3 ? 'h3' : 'h2'

  return (
    <div className={`home-plaque-title home-v2-plaque-title is-${size} ${className}`.trim()}>
      <Heading id={id}>{title}</Heading>
    </div>
  )
}

export default PlaqueTitle
