# 地图状态机与导航协议

所有路由导航只能通过 `src/lib/mapGuideNavigation.ts` 的 helper 完成。停止序号在 URL 中是 **1-based**，在 TypeScript API 和状态对象中是 **0-based**。

## 页面与路线状态

| 页面模式 | URL | 说明 |
| --- | --- | --- |
| browse | `/map-3d-guide-c` | 自由浏览。 |
| route preview | `/map-3d-guide-c/route/:routeId` | 路线预览。 |
| route joining | `/map-3d-guide-c/route/:routeId?stage=joining&joinStop=N` | 正在前往选定第 N 站；此前站点不算完成。 |
| route active | `/map-3d-guide-c/route/:routeId?stage=active&stop=N` | 当前处于/已完成第 N 站，下一站为 N+1。 |
| route arrived | `/map-3d-guide-c/route/:routeId?stage=arrived&stop=N` | 已到达第 N 站。 |
| poi detail | `/map-3d-guide-c/poi/:poiId?...` | 景点详情，按返回上下文恢复路线。 |

`RouteStage` 为 `preview | joining | active | arrived | paused | completed`。`parseRouteNavigationState(searchParams, stopCount?)` 会验证阶段所需参数；缺失、非整数、非正数或超过 `stopCount` 的站点参数都会安全回退到 `preview`，避免白屏或不可能状态。

## 加入路线

点击“开始游览”后的三种入口（从起点、最近站、手动选择）都使用：

```ts
goToRouteJoining(navigate, routeId, joinStopIndex, presentation)
```

到达后使用 `goToRouteActive(navigate, routeId, joinStopIndex, presentation)`。helper 会转换 `joinStopIndex` 为 URL 的 `joinStop=N`。

## POI 详情返回

从路线进入 POI 时使用对象签名，明确记录 POI 属于哪一站，以及返回路线时的状态：

```ts
goToPoiFromRoute(navigate, 'xiangfu_temple', {
  routeId: 'historical_culture',
  poiStopIndex: 2,
  returnStage: 'active',
  returnStopIndex: 1,
  presentation
})
```

上例生成 `from=route&routeId=historical_culture&stop=3&returnStage=active&returnStop=2`。POI 返回按钮调用：

```ts
goBackFromPoi(navigate, {
  from: 'route',
  routeId,
  poiStopIndex: stopIndex,
  returnStage,
  returnStopIndex,
  presentation
})
```

这样 active 第 2 站查看第 3 站详情后仍恢复 `active&stop=2`，而 arrived 第 3 站详情会恢复 `arrived&stop=3`。现有旧的 `goToPoiFromRoute(navigate, poiId, routeId, poiStopIndex)` 签名仍可用：它会从当前 URL 推断 active/arrived/joining/preview 返回状态，供页面逐步迁移。

## 统一 helper

- `goToMapBrowse`
- `goToRoutePreview`（路线轮播切换传 `{ replace: true }`，避免历史堆积）
- `goToRouteJoining`
- `goToRouteActive`
- `goToRouteArrived`
- `goToPoiFromBrowse`
- `goToPoiFromRoute`
- `goBackFromPoi`
- `goContinueNextStop`
- `setMapPresentation`
- `toggleMapPresentation`

所有 helper 会保留当前的有效 `presentation` 与无关 query；`setMapPresentation`/`toggleMapPresentation` 仅改写 `presentation`，因此会保留 `path`、`routeId`、`stage`、`stop`、`joinStop`、`returnStage` 和 `returnStop`。它们默认 `replace: true`，避免 2D/3D 切换制造浏览历史。

`presentation=ink2d` 表示 3D 按钮不高亮，`presentation=scenic3d` 表示按钮整项高亮；按钮文案始终为“3D”。

## UI 瞬时状态

`src/store/useMapGuideUiStore.ts` 保存选中 POI、卡片展开、小灵抽屉、图层/服务面板、POI 图层、服务设施和地图焦点模式。它不保存腾讯地图实例、渲染器、路线 geometry、GLB 或 Fay 状态。切换 presentation 不调用 `resetMapGuideUi()`，因此这些 UI 状态保持不变。

面板互斥（服务面板与小灵/图层）由 UI 调用方根据交互语义组合 setter；store 不强加视觉策略。普通页面跳转如需清理瞬时状态，可显式调用 `resetMapGuideUi()`。

## A/B Codex 接入

- 路线页使用 `parseRouteNavigationState(searchParams, route.stops.length)` 替换自行解析 `stage`/`stop`/`joinStop`。
- POI 页使用 `parsePoiRouteReturnContext(searchParams, route?.stops.length)`，把结果传给 `goBackFromPoi`；进入详情一律采用 `goToPoiFromRoute` 的对象签名。
- 2D/3D 按钮调用 `toggleMapPresentation(navigate)`；不要手写或重置 query。
- UI 控件从 `useMapGuideUiStore` 读写瞬时状态，页面跳转与 presentation 切换不创建地图实例。
