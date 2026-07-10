# Map Rendering Notes

## Presentation

`Map3DGuideExperience` owns map presentation only:

- `scenic3d`: Tencent map plus existing 3D scene, GLB and billboard capability.
- `ink2d`: pitch/rotation are zero; GLB, 3D billboards and dynamic mist remain disabled; TMap `MultiMarker` and `MultiPolyline` provide the flat route map.

The existing map instance is safely rebuilt when presentation changes. Its last center and zoom are retained before destroy and used for the next map constructor, so the UI shell does not need to manipulate Tencent map instances.

### Mobile presentation transition

`Map3DGuideExperience` now exposes `onPresentationTransitionChange`, returning:

- `transition`: `idle`, `destroying`, `waiting-container`, `initializing`, `ready`, or `failed`.
- `isPresentationSwitching`: UI controls should disable repeated 2D/3D toggles while true.
- `presentationSwitchError`: a non-empty value explains an initialization failure or a recovered 3D-to-2D fallback.

The map page uses a generation token, two `requestAnimationFrame` waits, and a `ResizeObserver`/polling layout gate before creating TMap. Every old callback checks the current generation. TMap custom layers capture the map instance that created them, so an old asynchronous `createCustomLayer` result is detached instead of attaching to a newer map. If scenic3d fails, the existing URL is safely replaced with `presentation=ink2d` while preserving all route, stop, join and unrelated query state.

## Browse POIs

Browse mode (`viewMode === 'browse'`) never draws a route. It draws `core` POIs by default using the explicit `LINGSHAN_CORE_POI_IDS` whitelist in `src/data/lingshanMapData.ts`.

`getLingshanPoisForLayer(mode)` supports:

- `core`: explicit core whitelist.
- `all`: all non-service POIs, including core POIs.
- `services`: an empty list until verified service coordinates exist. No synthetic service points are rendered.

Only POIs with valid coordinates are eligible. Current project data provides **14 core POIs** and **19 all POIs**. The five additional all-layer POIs are `fozu_tan`（佛足坛）, `xingtan_square`（杏坛广场）, `fan_gong_square`（梵宫广场）, `lingshan_jingshe`（灵山精舍）, and `exit`（景区出口）. `ExternalPoiProvider` is reserved for a future verified external source; this build does not request Tencent place search.

The renderer consumes `useMapGuideUiStore` directly: `poiVisibilityMode` chooses `core` or `all`, and `serviceFacilitiesEnabled` is an independent switch. The service branch remains intentionally empty until verified coordinates exist. A marker with a detail page routes directly to that detail page.

## Route Rendering

Every route page selects `getScenicRouteConfig(routeId)`. The route polyline uses verified/candidate geometry when available and falls back to the mapped POI sequence otherwise.

- `preview`: full warm-gold solid route and all numbered station markers.
- `active` / `arrived`: completed path is dark warm gold (`#B7842A`); remaining path is pale gold (`#E7D09A`); both are solid. The current station uses dark gold (`#9C6815`) and the next station uses bright gold (`#F2C14E`).
- `joining`: the shared protocol supplies `joinStopIndex` (zero-based). Segments before that station use muted grey-gold (`#B9AD95`) and the joining station becomes the active entry point. A URL fallback remains safe for direct route links.

The renderer consumes `mapFocusMode` from `useMapGuideUiStore`. `overview` now derives the true geographic bounds of the current route geometry/stops, computes a Mercator fit zoom from the current container, and uses the bounds midpoint rather than a fixed landmark or a dense-path average. `current` focuses the current station. Preview always uses overview. Expanded active/arrived cards narrow the marker field to current, next, and at most three nearby core POIs; collapsed cards restore all numbered route stations without resetting the camera.

## OPPO QQ Browser Verification

Real-device verification remains required:

1. Open the mobile route page in QQ, then tap 3D once from ink2d.
2. Confirm the control is disabled while the transition reports `waiting-container` or `initializing`.
3. Confirm a single tap reaches `ready`, without a duplicate map or custom tile layer.
4. Repeat rapid 2D/3D taps; the final requested presentation must win and no stale layers should appear.
5. If 3D fails, confirm the URL retains `routeId`, `stage`, `stop`, `joinStop` and switches only `presentation=ink2d`.
6. Check all five route pages with Total View: the camera center must follow that route's bounds, not default to 九龙灌浴.

## Ownership Boundary

This worktree only changes map data, TMap marker/polyline layers and camera presentation. It does not modify route cards, drawers, mobile CSS, or Fay. Navigation and state-machine protocol are consumed as published by their dedicated modules.
