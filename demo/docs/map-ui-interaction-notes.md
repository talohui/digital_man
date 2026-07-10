# Map UI Interaction Notes

## Scope

This UI worktree owns mobile cards, sheets, carousel behavior, copy, and presentation-only interactions. It does not change Tencent map initialization, POI marker rendering, route geometry, GLB runtime, camera control, or Fay communication.

## Browse Overlay

`Map3DGuidePrototypeCPage.tsx` keeps the map as the main surface and renders a compact, always-visible Xiaoling companion card instead of a default route recommendation card.

- `问小灵` opens the existing browse-mode mock sheet.
- `路线` always enters the `historical_culture` route preview.
- The right rail contains `定位` / `3D` / `服务` / `图层`.
- The 3D rail item reflects the real `presentation` query state. No separate fake 3D state is maintained.
- The layer panel supports core POIs, all POIs, and an independent service-facility switch. Service facilities only show a construction notice and never render fake points.
- The service panel is compact, has no full-screen scrim, leaves the map usable, supports close and downward swipe, and is exclusive with Xiaoling and the layer panel.
- The layer panel and Xiaoling sheet may coexist.

## Route Preview Carousel

The preview title is always `路线预览`; the selected route name remains inside the card.

- Route card order is fixed: `historical_culture`, `prayer_meditation`, `highlights_checkin`, `natural_scenery`, `family`.
- Cards use free horizontal scrolling without scroll snap.
- While scrolling, the current route URL and map data remain unchanged.
- After 160 ms without a scroll event, the UI calculates the visible intersection area for each card and selects the largest visible card.
- The selected route then uses a temporary replace-navigation adapter. After merging `codex/state-machine`, this adapter must switch to the shared preview-selection helper.
- The dots are indicators only, not navigation controls.
- Preview cards default to expanded. A collapsed summary keeps the route name, duration/station count, start action, and expand control; route switching is unavailable while collapsed.
- Xiaoling recommendation copy is keyed by `routeId` rather than hard-coded to historical culture.

## Route Active And Arrived

- `预览讲解` opens the route-mode Xiaoling sheet and injects one guide-style question for the next stop with a mock response.
- `继续问小灵` opens the same sheet without injecting another question, preserving the current local conversation state.
- `导航到下一站` shows a planning message and, after 1.4 seconds, demonstrates arrival at the following station. This is a presentation-only transition.
- Active card detail wording is `下一站详情`.
- Arrived collapsed-card primary wording is `景点详情`.
- Card-collapse state remains local until the state-machine branch provides the shared UI-store bridge. Do not use collapse to mutate map camera state.

## State-Machine Merge Points

`codex/state-machine` is expected to own the final navigation protocol, especially `returnStage`, `returnStop`, joining, and the route-arrival transition. This worktree deliberately leaves small TODO adapters in `Map3DRouteGuidePage.tsx` rather than changing the shared navigation helper or `mapGuide` types.

After the merge:

1. Replace the preview route `navigate(..., { replace: true })` adapter with the shared preview helper.
2. Replace POI detail navigation so active uses `returnStage=active` and arrived uses `returnStage=arrived`.
3. Replace the demo arrival timeout with the state-machine navigation helper.
4. Publish `cardCollapsed` to the shared UI store if the map visibility policy requires it.

## Still Mocked

- Xiaoling/Fay answers and voice input.
- User location and single-point navigation.
- Service facility POIs.
- Actual 3D mode behavior beyond the existing presentation query.
- Arrival detection and route re-planning.
