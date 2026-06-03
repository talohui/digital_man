/**
 * lazy 路由/重组件的占位骨架,代替 Suspense fallback={null} 的白屏。
 * variant:
 *   - 'page' 整页式(用于路由级 Suspense)
 *   - 'inline' 小块占位(用于 Live2DStage 等内嵌组件)
 */
interface Props {
  variant?: 'page' | 'inline'
  label?: string
}

function RouteSkeleton({ variant = 'page', label = '加载中…' }: Props) {
  if (variant === 'inline') {
    return (
      <div className="route-skeleton route-skeleton--inline" aria-hidden>
        <div className="route-skeleton__shimmer" />
      </div>
    )
  }
  return (
    <div className="route-skeleton" role="status" aria-live="polite">
      <div className="route-skeleton__bar route-skeleton__bar--lg" />
      <div className="route-skeleton__bar route-skeleton__bar--md" />
      <div className="route-skeleton__bar route-skeleton__bar--sm" />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default RouteSkeleton
