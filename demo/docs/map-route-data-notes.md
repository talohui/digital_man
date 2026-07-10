# Map Route Data Notes

## Route Entry Points

All routes share the same map renderer. There is not one map per route.

- URL registration: `src/App.tsx`
- Route page: `src/pages/Map3DRouteGuidePage.tsx`
- Shared map renderer: `src/pages/Map3DGuidePage.tsx`
- Route config assembly: `src/data/lingshanScenicRoutes.ts`
- Route station source: `src/data/guideData.ts`
- Route geometry source: `src/data/lingshanRouteGeometries.ts`

The route page reads `/map-3d-guide-c/route/:routeId`, builds a `MapGuideState`, and passes it to `Map3DGuideExperience`. The map page then resolves the same route id into a `ScenicRouteConfig`.

## Route IDs

Current guide route ids:

| routeId | Name | Station Source |
| --- | --- | --- |
| `historical_culture` | 历史文化路线 | `guideRoutes[].stops` in `guideData.ts` |
| `prayer_meditation` | 祈福静心路线 | `guideRoutes[].stops` in `guideData.ts` |
| `highlights_checkin` | 精华打卡路线 | `guideRoutes[].stops` in `guideData.ts` |
| `natural_scenery` | 自然风光路线 | `guideRoutes[].stops` in `guideData.ts` |
| `family` | 亲子路线 | `guideRoutes[].stops` in `guideData.ts` |

Each route has `id`, `name`, `durationLabel`, `tags`, `description`, `stops`, `experiences`, and `walkIntensity`.

## Station Resolution

`lingshanScenicRoutes.ts` converts guide route stops into renderable scenic route stops:

1. Read `GuideRoute.stops[].spotId`.
2. Resolve aliases such as `lingshan_wall` to map POI ids when needed.
3. Find coordinates from `lingshanPois`.
4. Attach display name, category, theme, narrative, and `poiId`.

For UI work, prefer these helpers from `src/data/lingshanScenicRoutes.ts`:

- `getScenicRouteById(routeId)`
- `getScenicRouteConfig(routeId)`
- `resolveScenicRouteId(routeId)`
- `getRouteStops(routeId)`
- `getRouteStopByIndex(routeId, stopIndex)`
- `getNextRouteStop(routeId, stopIndex)`
- `getRoutePoiId(routeId, stopIndex)`

These helpers return already-resolved route and stop data suitable for route cards, POI links, and map markers.

## Geometry Coverage

`lingshanRouteGeometries.ts` provides explicit Tencent walking candidate geometry for:

- `historical_culture`
- `natural_scenery`
- `family`

Routes without explicit geometry use generated candidate geometry:

- `prayer_meditation`
- `highlights_checkin`

Generated geometry is stitched from `lingshanRoadNetwork` using the route stop sequence. If a road segment is missing, the generator can locally fall back to POI-to-POI line segments. If no usable geometry is available, `Map3DGuidePage.tsx` falls back again to `getRouteStopLocations(currentGuideRoute)`, so the route remains renderable instead of blanking.

## Map Rendering Path

`Map3DGuidePage.tsx` resolves:

```ts
currentRouteConfig = getScenicRouteConfig(currentRouteId)
currentRoutePath =
  currentRouteConfig.geometry?.length
    ? currentRouteConfig.geometry
    : getRouteStopLocations(currentGuideRoute)
```

This means:

- Explicit geometry is preferred.
- Generated geometry is accepted.
- POI line fallback is the final safety path.
- Both `ink2d` and `scenic3d` use the same route path data.

## Stop Index Convention

URL query `stop` is 1-based:

```text
/map-3d-guide-c/route/historical_culture?stage=active&stop=2
```

Internal `stopIndex` is 0-based. The conversion lives in `src/types/mapGuide.ts`:

- `parseStopParam(value)` converts URL `stop` to internal index.
- `formatStopParam(stopIndex)` converts internal index back to URL.

`Map3DRouteGuidePage.tsx` clamps out-of-range stop values to the nearest valid station, so invalid stop params do not crash the page.

## Presentation State

Route pages support:

```text
?presentation=ink2d
?presentation=scenic3d
```

Mobile route pages default to `ink2d`; desktop 3D can be requested with `presentation=scenic3d`.

The route id, stage, stop, and presentation can coexist:

```text
/map-3d-guide-c/route/historical_culture?stage=active&stop=2&presentation=scenic3d
```

`Map3DRouteGuidePage.tsx` reads the full query state and passes the current presentation into `Map3DGuideExperience`.

## Adding Real Geometry Later

To replace a generated or fallback route with verified geometry:

1. Add a `LingshanRouteGeometry` item in `lingshanRouteGeometries.ts`.
2. Set `guideRouteId` to the matching `guideRoutes[].id`.
3. Store the verified path in `path`.
4. Keep `status`, `source`, `pointCount`, and `distanceMeters` accurate.
5. The map will pick the explicit geometry automatically through `getLingshanRouteGeometryByGuideRouteId`.

No route overlay UI changes are required when adding geometry.
