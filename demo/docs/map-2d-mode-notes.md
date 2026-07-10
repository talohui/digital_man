# Map 2D Mode Notes

## Scope

`ink2d` is the mobile-first presentation mode for `/map-3d-guide-c` and `/map-3d-guide-c/route/:routeId`.
It only changes the map presentation layer. Route cards, Xiaoling bubbles, tool rails, typography, and detail pages are handled separately.

## Controls

In `ink2d`, Tencent default map controls are hidden with CSS scoped to the map container:

- compass / rotation controls
- zoom in / zoom out controls
- default scale / control containers when exposed by Tencent's runtime classes

The rule is scoped under `.map-3d-guide-shell--ink2d .map-3d-guide-map`, so desktop `scenic3d` is not affected.

## Development Pills

Visitor-facing prototype status pills are no longer rendered in the map page. Debug information should live in `debugPerf=1` diagnostics rather than a top-level title-area badge.

## Clarity

The active production base layer is the Tencent hosted custom layer:

- layer id: `6a4b665a9818`
- mode: `TMap.ImageTileLayer.createCustomLayer`
- opacity: `1`

The local `/map/ink/tiles/...` path remains only as a disabled fallback. `ink2d` removes the extra map container filter so the hosted custom layer is not softened by CSS. The map is still limited by the resolution and styling of the hosted Tencent layer itself.

## 2D Presentation Rules

In `ink2d`:

- pitch is `0`
- rotation is `0`
- landmark GLB runtime is disabled
- 3D POI billboards are disabled
- dynamic mist and 3D atmosphere layers are disabled
- route polyline and 2D POI markers remain active

Desktop defaults to `scenic3d`. Mobile defaults to `ink2d`. The URL can override with:

- `?presentation=ink2d`
- `?presentation=scenic3d`

Route guide pages default to `ink2d`, while still honoring `?presentation=ink2d` and `?presentation=scenic3d`.

## Known Limits

If the map still looks soft on real devices, the remaining likely causes are hosted layer source resolution, Tencent tile serving level, or the underlying approved custom layer artwork. The current frontend no longer uses a stretched single image or blur/filter to fake clarity in `ink2d`.
