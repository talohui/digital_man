# Map Final Layer Cleanup

## Audited layer ownership

| Layer | Owner | Purpose | Affected by core/all or 2D/3D |
| --- | --- | --- | --- |
| Generic custom POI | `PoiLayerController: generic` | Browse and 2D route-context name markers | Hidden for `scenic3d` and `all` |
| Route stop markers | `PoiLayerController: routeStops` | Numbered route stations | Always retained for route pages |
| Route state markers | `PoiLayerController: routeState` | Current and next stop emphasis | Always retained for route pages |
| Selected POI marker | `landmarkHighlightLayerRef` | Selected landmark halo | Independent from generic POI visibility |
| Route geometry | `routeLayerRef` | Preview/progress polylines | Independent `MultiPolyline` layer |
| GLB models | Landmark inspector and scene controllers | 3D landmark models | Existing 3D policy remains unchanged |
| Tencent native POI | `baseMap` point/label features | All-POI base map labels | Enabled only by `all` |

## Final display policy

- `ink2d + core`: generic custom POI may render; GLB remains hidden.
- `scenic3d + core`: generic custom POI is not created; route stop/state layers remain on route pages and GLB uses the existing runtime policy.
- `all`: generic custom POI is not created; Tencent native POI is requested through `setBaseMap`; route stop/state layers remain on route pages.

## Tencent native controls

The sole `TMap.Map` construction requests `showControl: false`. Tencent GLJS exposes `showControl` plus corresponding getter/setter symbols in the currently loaded GLJS runtime. A scoped CSS fallback hides only known TMap control DOM inside `.map-3d-guide-map`, because QQ WebView can inject native zoom/compass elements after map creation. The application's portal-based tool rail is outside that container and is unaffected.
