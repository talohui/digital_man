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

The renderer consumes `useMapGuideUiStore` directly: `poiVisibilityMode` chooses `core` or `all`, and `serviceFacilitiesEnabled` is an independent switch. The service branch remains intentionally empty until verified coordinates exist. A marker with a detail page routes directly to that detail page.

## Route Rendering

Every route page selects `getScenicRouteConfig(routeId)`. The route polyline uses verified/candidate geometry when available and falls back to the mapped POI sequence otherwise.

- `preview`: full deep-green solid route and all numbered station markers.
- `active` / `arrived`: completed path is deep green; remaining path is a pale dashed line; the current station and next station retain distinct warm highlights.
- `joining`: the shared protocol supplies `joinStopIndex` (zero-based). Segments before that station are muted and the joining station becomes the active entry point. A URL fallback remains safe for direct route links.

The renderer consumes `mapFocusMode` from `useMapGuideUiStore`. `overview` fits the active route camera; `current` focuses the current station. Preview always uses overview. Expanded active/arrived cards narrow the marker field to current, next, and at most three nearby core POIs; collapsed cards restore all numbered route stations without resetting the camera.

## Ownership Boundary

This worktree only changes map data, TMap marker/polyline layers and camera presentation. It does not modify route cards, drawers, mobile CSS, or Fay. Navigation and state-machine protocol are consumed as published by their dedicated modules.
