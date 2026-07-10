# Map Rendering Notes

## Presentation

`Map3DGuideExperience` owns map presentation only:

- `scenic3d`: Tencent map plus existing 3D scene, GLB and billboard capability.
- `ink2d`: pitch/rotation are zero; GLB, 3D billboards and dynamic mist remain disabled; TMap `MultiMarker` and `MultiPolyline` provide the flat route map.

## Browse POIs

Browse mode (`viewMode === 'browse'`) never draws a route. It draws `core` POIs by default using the explicit `LINGSHAN_CORE_POI_IDS` whitelist in `src/data/lingshanMapData.ts`.

`getLingshanPoisForLayer(mode)` supports:

- `core`: explicit core whitelist.
- `all`: all non-service POIs, including core POIs.
- `services`: an empty list until verified service coordinates exist. No synthetic service points are rendered.

Only POIs with valid coordinates are eligible. Current project data provides **14 core POIs** and **19 known all-layer POIs**. The five additional known POIs are `fozu_tan`（佛足坛）, `xingtan_square`（杏坛广场）, `fan_gong_square`（梵宫广场）, `lingshan_jingshe`（灵山精舍）, and `exit`（景区出口）.

## Route Rendering

Every route page selects `getScenicRouteConfig(routeId)`. The route polyline uses verified/candidate geometry when available and falls back to the mapped POI sequence otherwise.

- `preview`: the whole route is a three-layer solid line: cream casing, dark-gold border and bright-gold center (`#F0B82E`).
- `active` / `arrived`: completed path is neutral grey (`#9E9A91`) with a light-grey casing; remaining path keeps the three-layer bright-gold treatment.
- `joining`: segments before the joining station use a lighter grey treatment and the joining station becomes the active entry point.

Every route layer is solid. No green route and no dash array remains.

## OPPO QQ Browser Verification

1. Open the mobile route page in QQ, then tap 3D once from ink2d.
2. Confirm the control is disabled while the transition reports `waiting-container` or `initializing`.
3. Confirm a single tap reaches `ready`, without a second user tap, duplicate map or duplicate custom tile layer.
4. Repeat rapid 2D/3D taps; the final requested presentation must win and no stale layer may report `Cannot read properties of null (reading 'getLayer')`.
5. Toggle `core`/`all` without moving the map: core shows custom named markers; all shows Tencent labels plus invisible known-POI hit areas.

## Final Runtime Update

- `TMap.Map` is now created from a runtime generation, not `presentation`. Normal `ink2d` / `scenic3d` switching preserves the instance, center, zoom, route state and custom-layer ownership; `destroy()` is reserved for unmount and one guarded context-loss recovery.
- Each delayed map, custom-layer and model callback verifies map identity and instance generation. `window.__LINGSHAN_MAP_DEBUG__` reports map create/destroy counts, presentation, context-loss recovery, POI mode and last error.
- The cloud transition is rendered through a Portal to `document.body`, outside the map-only error boundary. It exists only during switching; persistent fog, mountain silhouettes, canvas mist, horizon haze and native animated sky/fog remain removed.
- `all` base-map mode now contains Tencent vector `point` + `label`; `core` excludes ordinary Tencent points and uses named project markers. `PoiLayerController` owns one custom marker layer and click listener.
- `scenicPoiCatalog.ts` is the shared coordinate source for `lingshanMapData`, route stop resolution and GLB anchor lookup. A GLB offset remains model calibration, never a POI coordinate edit.
- Tencent verification runs only in development through bounded `TMap.service.Search.searchRectangle`; see `poi-tencent-search-results.md` for the review gate.
