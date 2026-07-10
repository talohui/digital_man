import type { GuideAssistantMode } from './guideAssistantEvents'

function XiaolingFace() {
  return (
    <span className="guide-xiaoling-face" aria-hidden="true">
      <i />
    </span>
  )
}

export function XiaolingFloatingCompanion({
  mode,
  onOpen,
  onRoute
}: {
  mode: GuideAssistantMode
  onOpen: () => void
  onRoute: () => void
}) {
  if (mode === 'browse') {
    return (
      <aside className="guide-floating-companion guide-floating-companion--browse" aria-label="小灵陪伴入口">
        <button type="button" className="guide-floating-companion__avatar" onClick={onOpen} aria-label="问小灵">
          <XiaolingFace />
        </button>
        <button type="button" className="guide-floating-companion__tip" onClick={onOpen}>
          小灵：想找路线、听讲解、问服务点，都可以问我。
        </button>
        <div className="guide-floating-companion__actions">
          <button type="button" onClick={onOpen}>问小灵</button>
          <button type="button" className="is-route" onClick={onRoute}>路线</button>
        </div>
      </aside>
    )
  }

  return (
    <aside className={`guide-floating-companion guide-floating-companion--avatar-only is-${mode}`} aria-label="小灵导览入口">
      <button type="button" className="guide-floating-companion__avatar" onClick={onOpen} aria-label="打开小灵导览">
        <XiaolingFace />
      </button>
    </aside>
  )
}
