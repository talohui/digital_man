import type { GuideAssistantMode } from './guideAssistantEvents'

export function XiaolingFloatingCompanion({
  mode,
  onOpen,
  onRoute
}: {
  mode: GuideAssistantMode
  onOpen: () => void
  onRoute: () => void
}) {
  const showRouteShortcut = mode === 'browse'

  return (
    <aside className="guide-floating-companion" aria-label="小灵导览入口">
      <button type="button" className="guide-floating-companion__avatar" onClick={onOpen} aria-label="打开小灵导览">
        <span aria-hidden="true">灵</span>
      </button>
      <div className="guide-floating-companion__bubble">
        <span>想找路线、听讲解、问服务点，都可以问我。</span>
        <div>
          <button type="button" onClick={onOpen}>问小灵</button>
          {showRouteShortcut ? <button type="button" onClick={onRoute}>路线</button> : null}
        </div>
      </div>
    </aside>
  )
}
