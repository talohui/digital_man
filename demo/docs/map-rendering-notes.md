# Map Rendering Notes

## Presentation

`Map3DGuideExperience` owns map presentation only:

- `scenic3d`: Tencent map plus existing 3D scene, GLB and billboard capability.
- `ink2d`: pitch/rotation are zero; GLB, 3D billboards and dynamic mist remain disabled; TMap `MultiMarker` and `MultiPolyline` provide the flat route map.

The existing map instance is safely rebuilt when presentation changes. Its last center and zoom are retained before destroy and used for the next map constructor, so the UI shell does not need to manipulate Tencent map instances.

## Browse POIs

Browse mode (`viewMode === 'browse'`) never draws a route. It draws `core` POIs by default using the explicit `LINGSHAN_CORE_POI_IDS` whitelist in `src/data/lingshanMapData.ts`.

`getLingshanPoisForLayer(mode)` supports:

- `core`: explicit core whitelist.
- `all`: all non-service POIs, including core POIs.
- `services`: an empty list until verified service coordinates exist. No synthetic service points are rendered.

Until the state-machine contract lands, `?poiLayer=core|all|services` is a renderer-only compatibility input. A marker with a detail page routes directly to that detail page.

## Route Rendering

Every route page selects `getScenicRouteConfig(routeId)`. The route polyline uses verified/candidate geometry when available and falls back to the mapped POI sequence otherwise.

- `preview`: full deep-green solid route and all numbered station markers.
- `active` / `arrived`: completed path is deep green; remaining path is a pale dashed line; the current station and next station retain distinct warm highlights.
- `joining` compatibility: `?stage=joining&joinStop=N` is accepted before the shared type lands. Segments before N are muted and station N becomes the active entry point.

The renderer accepts a pending `mapFocusMode` state value (`overview` or `current`) without owning its type. `overview` fits the active route camera; `current` focuses the current station. The temporary query fallback is `?mapFocus=overview|current`.

## Ownership Boundary

This worktree only changes map data, TMap marker/polyline layers and camera presentation. It does not modify route cards, drawers, mobile CSS, navigation helpers, or the shared `MapGuideState` type. When `codex/state-machine` is merged, map rendering should consume the agreed `joining`, POI layer, and map-focus fields directly and remove the temporary query fallbacks.
