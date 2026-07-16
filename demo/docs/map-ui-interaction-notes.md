# Map UI Interaction Notes

## Scope

This worktree owns the mobile assistant shell, cards, sheets, carousel behavior, copy, and presentation-only interactions. It does not change Tencent map initialization, POI marker rendering, route geometry, GLB runtime, camera control, or real Fay communication.

## One Persistent Xiaoling

`GlobalXiaolingAssistant` is mounted next to the map module routes in `App.tsx`, outside the individual browse, route, and POI page components. It remains mounted while navigating among the three map pages and portals its visible UI to `document.body`.

- Browse, route, and POI pages no longer render separate Xiaoling drawers.
- The old page-owned browse companion card, route-card portrait, POI hero assistant card, and POI floating portrait have been removed. Browse mode now renders the single global `XiaolingFloatingCompanion` as a travel-note card.
- Route recommendation text, `预览讲解`, and `继续问小灵` remain page-level triggers, but all open the same global drawer.
- Opening the assistant closes an open service panel. Opening a service panel closes the assistant. Layer controls may coexist with the assistant.
- While the browse service sheet is open, it suppresses the global floating companion through `guideAssistantEvents.companionSuppression`; closing or unmounting the sheet restores the companion. This avoids raising the service sheet above the entire assistant drawer layer.
- The floating companion disappears while the drawer is open and returns after the drawer closes.

The browse companion visual is maintained in `src/styles/guide/guideAssistant.css`. Its paper surface, green top rail, gold linework, portrait rings, and equal-width actions follow the C-side visual component baseline in `docs/c-app-visual-components.md`; preview-only duplicate styles are not retained.

Page-level triggers use a small custom-event adapter only to express open/close intent. Session state is owned by `useGuideSessionStore`, while `GuideContextBridge` updates the active browse/route/POI context after navigation.

## Portal And QQ Browser Adaptation

The assistant root is a fixed portal layer above map overlays. Its root is pointer-transparent; only the floating entry, drawer, scrim, controls, and cards receive pointer events. Closing the drawer unmounts both drawer and scrim, so no transparent layer remains to block the map.

- Drawer height is constrained to 86% of the dynamic viewport.
- `window.visualViewport` height and offset are exposed as local CSS variables for QQ browser and soft-keyboard changes.
- `100dvh` remains the CSS fallback and safe-area bottom padding protects the composer.
- The message timeline scrolls independently while the input composer remains visible.
- Downward close gestures are captured only by the drawer handle, not the conversation scroller.

## Borderless Digital Human Stage

`DigitalHumanStage` provides `idle`, `listening`, `thinking`, `speaking`, and `offline` visual states. The figure is an independent, pointer-transparent layer blended into the drawer background with both `mask-image` and `-webkit-mask-image`.

The repository does not currently contain a suitable transparent Xiaoling half-body bitmap or animation asset. The first UI shell therefore uses an integrated CSS fallback figure rather than a black-background screenshot, native video, or framed media card. `DigitalHumanStage` is the renderer adapter boundary for a later transparent Live2D/canvas implementation.

## Formal Conversation Visual

The formal `/map-3d-guide-c` drawer and `/guide` route reuse `XiaolingConversationSurface`. Their paper top bar, Fay state note, one-line quick asks, square-corner message bubbles, recommendation notes, and square composer now share the confirmed C-side visual language in `docs/c-app-visual-components.md`. The fullscreen page keeps its existing companion / reading layout switch, return context, message thread, and whitelisted card actions; this visual synchronization does not change Fay transport or map navigation behavior. The temporary `/map-v2/conversation` review route and its preview-only files were removed after synchronization.

## Structured Guide UI

The drawer UI contains reusable renderers for:

- `route_cards`
- `poi_card`
- `navigation_card`
- `next_stop_card`
- `route_progress`

These payloads now converge on `GuideRecommendationCard`. The card accepts route, POI, navigation, next-stop, progress, service, event, and product kinds; optional images use a small paper picture frame and collapse after both the primary and fallback image fail. Legacy route-, POI-, and navigation-specific card shells have been removed.

The demonstration request “我只有两个小时，想轻松一点，主要想拍照。” is handled by Guide Core and returns a structured recommendation led by `highlights_checkin`. Messages come from the persistent `GuideMessage` store, cards render `GuideUiPayload`, and all card navigation runs through `GuideActionRegistry`. No component-local conversation store remains.

Guide Core integration details:

- `GuideContextBridge` and `GlobalXiaolingAssistant` are sibling mounts at the application route root.
- `useGuideSessionStore` preserves messages and drawer state across browse, route, and POI navigation.
- Route recommendation actions call `executeGuideAction({ type: 'open_route_preview', ... })`; card components do not build URLs.
- The drawer closes after a successful action, and reopening it shows the persisted conversation.
- `预览讲解` sends the same guide-style prompt through `sendGuideMessage`; `继续问小灵` only opens the existing session.

## Route Page Triggers

- `预览讲解` opens the global route-mode drawer and appends one guide-style request for the next stop.
- `继续问小灵` opens the same drawer without adding another request.
- Preview recommendation copy stays keyed by `routeId`.
- Removing the embedded route-card portrait prevents it from covering the route title.

## Existing Route UI Behavior

The preview title remains `路线预览`. Route cards now use the confirmed square paper folio, framed route image, annotated title hierarchy, continuous stop axis, square primary action, and line-style pager maintained in `mapRouteMobile.css`. They still use free horizontal scrolling and select the largest visible card after scrolling stops. Preview cards default to expanded; route switching is unavailable while collapsed. Active detail links preserve `returnStage: active`, arrived detail links preserve `returnStage: arrived`, and the presentation-only navigation action demonstrates arrival after a short delay. The temporary `/map-v2/route-panel` review surface was removed after migration.

The active-route sheet now shares the preview folio's square paper frame, green-and-gold top rule, destination hierarchy, square Xiaoling entry, quiet two-line description, and equal-width action row. Its leader note must remain fully visible. Collapsing still switches to the existing `RouteCollapsedBar`, now rendered as a compact `64px` folio without changing the expand or primary-action handlers. The temporary active-card review route was removed after the remaining route states were synchronized.

The arrived sheet reuses the same confirmed folio and collapsed bar without introducing a second card language. A square cinnabar arrival seal is the only state-specific accent; Xiaoling narration, POI detail, and continue-to-next-stop handlers remain unchanged.

The joining sheet also reuses the same folio and compact collapsed bar. Its two actions fill an equal-width row, while target resolution, prototype navigation, POI detail, and route-progress commitment remain unchanged. The temporary `/map-v2/route-joining-card` review route was removed after synchronization.

The completed sheet uses the same folio but is vertically centered as a route-closing acknowledgement. It contains a single full-width return action and a local five-star rating interaction that locks after submission. This local interaction is not a backend write; the required eligibility, idempotency, error, and analytics contract is documented in `docs/route-rating-backend-integration.md`. The temporary `/map-v2/route-completed-card` review route was removed after synchronization.

## Still Mocked

真实 Fay 地图会话桥接、状态机、结构化推荐安全边界与异常验收方案见 `docs/xiaoling-fay-runtime-integration.md`。在该文档的完成定义全部满足前，以下能力仍应视为未完成或未验证。

- Real Fay/digital-human communication and speech recognition.
- Transparent production digital-human renderer asset.
- User location and single-point navigation.
- Service facility POIs.
- Arrival detection and route re-planning.
- Real model interaction beyond existing map presentation behavior.
