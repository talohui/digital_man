# PR: Add immersive 3D scenic map and route geometry workflow

## Summary

This PR adds an immersive 3D scenic guide map for Lingshan Scenic Area and connects it with the existing Tencent Maps guide page for real POI display, route viewing, and navigation fallback.

The map experience is organized into three layers:

- `/scenic-3d-map`: immersive 3D scenic guide entry for exploration, route storytelling, and visual navigation.
- `/map`: Tencent Maps real guide page for real POIs, route display, and navigation fallback.
- `/three-preview`: 3D asset test page for validating placeholder assets and future Blender / glb models.

Product flow:

Home page -> immersive 3D guide map -> select a spot or route -> jump to the real map through `/map?poi=xxx` or `/map?sceneRoute=xxx`.

## What Changed

### 1. 新增沉浸式 3D 景区地图

Added `/scenic-3d-map` as a full-screen Three.js scenic map prototype with:

- Full-screen Three.js scene.
- Terrain base.
- Taihu / water-area visual metaphor.
- Distant mountain background.
- Ink-wash whitespace visual direction.
- 19 core route POI nodes.
- Low-poly placeholder core landmarks.
- Route selection.
- Selected POI highlighting.
- Jump links to the real Tencent map.

### 2. 新增 3D 资产测试页

Added `/three-preview` as a development-only 3D asset preview page. It is used to validate low-poly placeholders now and future Blender / glb model replacements later.

### 3. 新增 3D 数据层

Added and extended the Lingshan 3D data layer, including:

- `lingshanPois.scenePosition`
- `scenePositionSource`
- `sceneOffset`
- `lingshanSceneRoutes`
- `lingshanSceneRouteToGuideRouteMap`
- `lingshanAssetMap`
- `lingshanRouteGeometries`

### 4. 打通 3D 地图和真实地图

The 3D map can now pass user intent into the real map:

- `/map?poi=xxx`: focuses a real POI on the Tencent map.
- `/map?sceneRoute=xxx`: maps a 3D scene route to a real guide route.
- If `poi` and `sceneRoute` both exist, `poi` takes priority.

### 5. routeGeometry 候选路线流程

Added a workflow for turning Tencent walking route runtime output into route geometry candidates:

- `debugSceneRoute` overlay on `/map`.
- `plannedRoute` diagnostic fields.
- Tencent walking path JSON copy / download.
- Static `lingshanRouteGeometries`.
- Current route geometry status is `candidate`.
- `usedFallback=false` means Tencent returned a walking route, but it does not mean the route is manually verified.

### 6. 文档补充

Added or updated planning, audit, review, and verification documents:

- `map-3d-development-log.md`
- `lingshan-poi-binding-audit.md`
- `lingshan-tencent-poi-binding-plan.md`
- `lingshan-tencent-poi-binding-result-template.md`
- `lingshan-blender-asset-plan.md`
- `lingshan-frontend-3d-integration-plan.md`
- `lingshan-immersive-3d-visual-upgrade-plan.md`
- `lingshan-3d-core-route-spatial-plan.md`
- `lingshan-scene-position-mapping-report.md`
- `lingshan-route-geometry-review.md`
- `mobile-lan-route-verification.md`

## Technical Notes

New 3D dependencies:

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@types/three`

React 18 compatibility:

- `@react-three/fiber` uses the React 18-compatible 8.x line.
- `@react-three/drei` uses the React 18-compatible 9.x line.

Architecture:

- The 3D art map layer is the primary visual guide surface.
- The Tencent map layer remains the real navigation and geographic fallback surface.
- The two layers are connected by stable `poiId` and `sceneRoute` identifiers.

## Validation

- `npm run build` has been run during the staged implementation work.
- Build passed.
- Vite chunk size warning is currently only a warning.

## Manual Test Checklist

### 首页入口

- [ ] 首页是否出现沉浸式 3D 导览地图入口
- [ ] 点击后是否进入 `/scenic-3d-map`

### 3D 导览地图

- [ ] `/scenic-3d-map` 是否正常加载
- [ ] 三条路线是否可切换
- [ ] 路线金线是否随路线变化
- [ ] 站点列表是否正常滚动
- [ ] 点击站点后节点高亮和信息卡是否同步
- [ ] 查看该景点真实地图是否跳转 `/map?poi=xxx`
- [ ] 查看整条路线真实地图是否跳转 `/map?sceneRoute=xxx`

### 腾讯地图页

- [ ] `/map` 是否保持原有导览功能
- [ ] `/map?poi=jiulong_guanyu` 是否自动聚焦
- [ ] `/map?sceneRoute=historical_3d_scene` 是否切换历史文化路线
- [ ] `/map?sceneRoute=natural_3d_scene` 是否切换自然风光路线
- [ ] `/map?sceneRoute=family_3d_scene` 是否切换亲子路线
- [ ] poi 与 sceneRoute 同时存在时是否 poi 优先

### 路线调试

- [ ] `/map?sceneRoute=historical_3d_scene&debugSceneRoute=1` 是否显示调试卡片
- [ ] 是否显示 plannedRoute 诊断字段
- [ ] 是否可以复制/下载腾讯 walking path JSON

## Known Limitations

- Core buildings are still low-poly placeholders.
- `routeGeometry` data is `candidate`, not `verified`.
- Tencent walking routes may still be locally inaccurate inside the scenic area.
- The 3D map expresses the core route area, not a full digital twin of the entire scenic area.
- Mobile WebGL performance and touch interactions still need real-device validation.
- `/map` depends on a Tencent Maps key in local environment configuration. The key must not be committed.

## Files / Areas Touched

Main areas touched by this feature branch:

- `src/pages/HomePage.tsx`
- `src/pages/GuideMapPage.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `src/pages/Scenic3DPreviewPage.tsx`
- `src/components/scenic3d/`
- `src/data/lingshanMapData.ts`
- `src/data/scenic3d/lingshanAssetMap.ts`
- `src/data/lingshanRouteGeometries.ts`
- `src/lib/scenic3d/geoToScene.ts`
- `docs/`
- `.gitignore`
- `package.json`
- `package-lock.json`

Areas intentionally not modified:

- Fay / Live2D / RAG / digital human core chains.
- Tencent walking route planning algorithm.
- `routePlanning.ts` route request logic.
- Real POI latitude / longitude coordinates.
- `.env` / `.env.local`.

## Follow-up Work

1. Manually review and correct `routeGeometry` route candidates.
2. Add `verified` / `hybrid_corrected` route geometry versions.
3. Calibrate core spot `navLocation` values.
4. Replace low-poly placeholders with Blender / 3D reconstruction assets.
5. Optimize mobile touch interaction and WebGL performance.
6. Add current station, next station, and route progress guide behavior.
