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

The map page uses a generation token, per-instance token, two `requestAnimationFrame` waits, and a `ResizeObserver`/polling layout gate before creating TMap. Every delayed layer/model callback checks both the current React generation and the exact TMap instance that created it. Layer cleanup is idempotent and owned by `LayerManager`, so an old asynchronous `createCustomLayer` or GLB callback cannot detach a newer map's layer.

A single scenic3d request gets at most two internal attempts. A temporary first-attempt failure performs a full cleanup, waits 360 ms, creates a new generation, and retries once without synthesizing another click. Two failures safely replace only `presentation=ink2d` in the URL while preserving route, stop, join and unrelated query state. The UI receives `isPresentationSwitching` and `presentationSwitchError`; repeated presentation input is disabled while the transition is active.

The switch is covered by a lightweight CSS cloud transition for roughly 650-1000 ms. It is mounted only during a presentation change and removed after ready/fallback. Persistent fog, mountain silhouettes, canvas mist, horizon haze and native animated sky/fog are no longer created. Tencent's map, routes, POIs and real landmark GLBs remain.

## Browse POIs

Browse mode (`viewMode === 'browse'`) never draws a route. It draws `core` POIs by default using the explicit `LINGSHAN_CORE_POI_IDS` whitelist in `src/data/lingshanMapData.ts`.

`getLingshanPoisForLayer(mode)` supports:

- `core`: explicit core whitelist.
- `all`: all non-service POIs, including core POIs.
- `services`: an empty list until verified service coordinates exist. No synthetic service points are rendered.

Only POIs with valid coordinates are eligible. Current project data provides **14 core POIs** and **19 known all-layer POIs**. The five additional known POIs are `fozu_tan`（佛足坛）, `xingtan_square`（杏坛广场）, `fan_gong_square`（梵宫广场）, `lingshan_jingshe`（灵山精舍）, and `exit`（景区出口）. `ExternalPoiProvider` is reserved for a future verified external source; this build does not request Tencent place search.

The two browse modes now have different render ownership:

- `core`: Tencent's ordinary POI labels are omitted from the base-map feature set; the project renders named custom markers for the 14 core POIs.
- `all`: Tencent's native label feature is enabled; visible project markers are replaced by 44x44 transparent hit areas for the 19 known POIs. The map therefore owns the visual labels while the project preserves known-detail navigation without drawing a second label set.

Tencent map click payloads are mapped by exact normalized name when the runtime exposes stable `poi`/`poiInfo` data. Unknown native POIs remain display-only in this iteration. The transparent known-POI hit areas are the reliable fallback and are removed when returning to `core`.

The renderer consumes `useMapGuideUiStore` directly: `poiVisibilityMode` chooses `core` or `all`, and `serviceFacilitiesEnabled` is an independent switch. The service branch remains intentionally empty until verified coordinates exist. A marker with a detail page routes directly to that detail page.

## Route Rendering

Every route page selects `getScenicRouteConfig(routeId)`. The route polyline uses verified/candidate geometry when available and falls back to the mapped POI sequence otherwise.

- `preview`: the whole route is a three-layer solid line: cream casing, dark-gold border and bright-gold center (`#F0B82E`).
- `active` / `arrived`: completed path is neutral grey (`#9E9A91`) with a light-grey casing; remaining path keeps the three-layer bright-gold treatment. The current segment receives a cream halo and dark-gold edge; current/next station markers retain their separate highlights.
- `joining`: the shared protocol supplies `joinStopIndex` (zero-based). Segments before that station use a lighter grey treatment and the joining station becomes the active entry point. A URL fallback remains safe for direct route links.

Every route layer is solid. No green route and no dash array remains.

The renderer consumes `mapFocusMode` from `useMapGuideUiStore`. `overview` now derives the true geographic bounds of the current route geometry/stops, computes a Mercator fit zoom from the current container, and uses the bounds midpoint rather than a fixed landmark or a dense-path average. `current` focuses the current station. Preview always uses overview. Expanded active/arrived cards narrow the marker field to current, next, and at most three nearby core POIs; collapsed cards restore all numbered route stations without resetting the camera.

## OPPO QQ Browser Verification

Real-device verification remains required:

1. Open the mobile route page in QQ, then tap 3D once from ink2d.
2. Confirm the control is disabled while the transition reports `waiting-container` or `initializing`.
3. Confirm a single tap reaches `ready`, without a second user tap, duplicate map or duplicate custom tile layer.
4. Temporarily interrupt the first initialization and confirm there is only one automatic retry before fallback.
5. Repeat rapid 2D/3D taps; the final requested presentation must win and no stale layer may report `Cannot read properties of null (reading 'getLayer')`.
6. If both 3D attempts fail, confirm the URL retains `routeId`, `stage`, `stop`, `joinStop` and switches only `presentation=ink2d`.
7. Confirm the cloud transition disappears after ready/fallback and that scenic3d has no persistent cloud, fog, mountain or canvas overlay.
8. Check all five route pages with Total View: the camera center must follow that route's bounds, not default to 九龙灌浴.
9. Toggle `core`/`all` without moving the map: core shows custom named markers; all shows Tencent labels plus invisible known-POI hit areas.

## Ownership Boundary

This worktree only changes map data, TMap marker/polyline layers and camera presentation. It does not modify route cards, drawers, mobile CSS, or Fay. Navigation and state-machine protocol are consumed as published by their dedicated modules.
