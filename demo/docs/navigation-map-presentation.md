# Navigation map presentation

## Layer ownership

- User location: `NavigationPrototypeUserMarkerLayer`; blue accuracy halo/dot plus a heading arrow derived from `heading.selectedHeading`.
- Navigation line: `NavigationPrototypeMapLayer`; independent blue Tencent `MultiPolyline`.
- Generic scenic POI: `PoiLayerController` kind `generic`; core/all chooses its dataset while Tencent native labels may coexist.
- Route stops: `PoiLayerController` kind `routeStops`; unaffected by the generic POI override.
- Current/next stops: `PoiLayerController` kind `routeState`; unaffected by the generic POI override.
- Tencent native POI: base-map `point + label`, enabled by the effective POI mode.
- GLB: existing landmark runtime; this change does not alter its lifecycle.

## Heading marker

The project SDK usage does not expose a verified dynamic rotation contract for the existing `MultiMarker` geometry. The heading arrow is therefore drawn into the same SVG marker as the blue dot. Its angle is visually interpolated over the shortest circular delta, with a 1.5 degree deadband and a shorter replay duration.

The map layer does not choose a heading source. It consumes the navigation Store's `selectedHeading` and `source` values. The arrow is hidden for idle, arrived, cancelled and error states.

## Temporary native labels

`effectivePoiMode` is derived as follows:

```text
active navigation session/local test + active navigation lifecycle -> all
otherwise -> user's poiVisibilityMode
```

This never calls `setPoiVisibilityMode('all')`, so cancelling or confirming navigation naturally reveals the user's previous core/all preference. Paused and arrival-confirm states retain Tencent point/label. Generic custom POI remains visible; route stop and current/next layers remain independently mounted.

## Local navigation test

With `navigationDebug=1`, the local-test panel uses the existing navigation Store actions. Once a real converted GCJ-02 origin is available, it saves the current Tencent camera, pans the existing map to the origin, and temporarily listens for one map target selection. A separate debug marker displays the selected coordinate and straight-line distance. Confirming the target enters the existing local-test planning action; cancelling, error or arrival removes the marker and restores the saved camera. No catalog POI, route stage or map instance is created.
