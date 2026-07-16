import type { CSSProperties } from 'react'

import type { GuideAssistantMode } from './guideAssistantEvents'
import { XiaolingAvatar } from './XiaolingAvatar'

export function XiaolingFloatingCompanion({
  mode,
  onOpen,
  onRoute,
  floatingStyle,
  routeAnchorReady = true
}: {
  mode: GuideAssistantMode
  onOpen: () => void
  onRoute: () => void
  floatingStyle?: CSSProperties
  routeAnchorReady?: boolean
}) {
  if (mode === 'browse') {
    return (
      <aside
        className="guide-floating-companion guide-floating-companion--browse"
        aria-label="小灵陪伴入口"
        data-visual-style="travel-note"
      >
        <button type="button" className="guide-floating-companion__avatar" onClick={onOpen} aria-label="问小灵">
          <span className="guide-floating-companion__live-anchor" data-xiaoling-live2d-anchor="badge">
            <XiaolingAvatar size="floating" />
          </span>
        </button>
        <div className="guide-floating-companion__content">
          <button type="button" className="guide-floating-companion__tip" onClick={onOpen}>
            想找路线、听讲解，问我吧
          </button>
          <button type="button" onClick={onOpen}>问小灵</button>
          <button type="button" className="is-route" onClick={onRoute}>路线</button>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`guide-floating-companion guide-floating-companion--avatar-only is-${mode}${
        mode === 'route' && !routeAnchorReady ? ' is-route-anchor-pending' : ''
      }`}
      aria-label="小灵导览入口"
      style={floatingStyle}
    >
      <button type="button" className="guide-floating-companion__avatar" onClick={onOpen} aria-label="打开小灵导览">
        <span className="guide-floating-companion__live-anchor" data-xiaoling-live2d-anchor="badge">
          <XiaolingAvatar size="floating" />
        </span>
      </button>
    </aside>
  )
}
