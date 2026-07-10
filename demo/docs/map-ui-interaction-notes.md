# Map UI Interaction Notes

## Scope

This worktree owns the mobile assistant shell, cards, sheets, carousel behavior, copy, and presentation-only interactions. It does not change Tencent map initialization, POI marker rendering, route geometry, GLB runtime, camera control, or real Fay communication.

## One Persistent Xiaoling

`GlobalXiaolingAssistant` is mounted next to the map module routes in `App.tsx`, outside the individual browse, route, and POI page components. It remains mounted while navigating among the three map pages and portals its visible UI to `document.body`.

- Browse, route, and POI pages no longer render separate Xiaoling drawers.
- The old browse companion card, route-card portrait, POI hero assistant card, and POI floating portrait have been removed.
- Route recommendation text, `预览讲解`, and `继续问小灵` remain page-level triggers, but all open the same global drawer.
- Opening the assistant closes an open service panel. Opening a service panel closes the assistant. Layer controls may coexist with the assistant.
- The floating companion disappears while the drawer is open and returns after the drawer closes.

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

## Structured Guide UI

The drawer UI contains reusable renderers for:

- `route_cards`
- `poi_card`
- `navigation_card`
- `next_stop_card`
- `route_progress`

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

The preview title remains `路线预览`. Route cards use free horizontal scrolling and select the largest visible card after scrolling stops. Preview cards default to expanded; route switching is unavailable while collapsed. Active detail links preserve `returnStage: active`, arrived detail links preserve `returnStage: arrived`, and the presentation-only navigation action demonstrates arrival after a short delay.

## Still Mocked

- Real Fay/digital-human communication and speech recognition.
- Transparent production digital-human renderer asset.
- User location and single-point navigation.
- Service facility POIs.
- Arrival detection and route re-planning.
- Real model interaction beyond existing map presentation behavior.
