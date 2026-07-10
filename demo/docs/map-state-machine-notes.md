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

这样 active 第 2 站查看第 3 站详情后仍恢复 `active&stop=2`，而 arrived 第 3 站详情会恢复 `arrived&stop=3`。现有旧的 `goToPoiFromRoute(navigate, poiId, routeId, poiStopIndex)` 签名仍可用：它会从当前 URL 推断返回状态，供页面逐步迁移。

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

所有 helper 会保留当前有效的 `presentation` 与无关 query；`setMapPresentation`/`toggleMapPresentation` 仅改写 `presentation`，因此保留 path、routeId、stage、stop、joinStop、returnStage 和 returnStop。它们默认 replace，避免 2D/3D 切换制造浏览历史。

`presentation=ink2d` 表示 3D 按钮不高亮，`presentation=scenic3d` 表示按钮整项高亮；按钮文案始终为“3D”。

## UI 瞬时状态

`src/store/useMapGuideUiStore.ts` 保存选中 POI、卡片展开、小灵抽屉、图层/服务面板、POI 图层、服务设施和地图焦点模式。它不保存腾讯地图实例、渲染器、路线 geometry、GLB 或 Fay 状态。切换 presentation 不调用 `resetMapGuideUi()`，因此这些 UI 状态保持不变。

面板互斥由 UI 调用方按交互语义组合 setter；store 不强加视觉策略。普通页面跳转如需清理瞬时状态，可显式调用 `resetMapGuideUi()`。

## 地图页面接入

- 路线页使用 `parseRouteNavigationState(searchParams, route.stops.length)` 解析 stage/stop/joinStop。
- POI 页使用 `parsePoiRouteReturnContext(searchParams, route?.stops.length)`，进入详情优先采用 `goToPoiFromRoute` 对象签名。
- 2D/3D 按钮调用 `toggleMapPresentation(navigate)`，不要手写或重置 query。
- UI 控件从 `useMapGuideUiStore` 读写瞬时状态，页面跳转与 presentation 切换不创建地图实例。

## 小灵 Guide Session 核心

## 边界

本模块维护跨 `browse / route / poi` 的单一会话、可靠页面上下文、结构化消息和白名单动作。本阶段使用确定性 mock，不连接 Fay、地图实例、定位或真实导航。

## Store API

`useGuideSessionStore` 使用 `sessionStorage` 持久化，包含 `sessionId`、消息、上下文、偏好、推荐路线、抽屉状态与数字人状态。主要动作：

- `ensureSessionId()`
- `setContext(context)`
- `setDrawerOpen(open)`
- `addMessage(message)`
- `sendGuideMessage(text)`
- `markRecommendedRouteOpened(routeId)`
- `resetGuideSession()`

## 上下文

`GuideContextBridge` 挂在 `App` 的稳定上层，基于 Router URL、`mapGuide` 解析器和 `lingshanScenicRoutes` 数据更新：页面、presentation、路线、阶段、当前/下一站、POI 与返回状态。它不读取 DOM 文案。

## 消息与动作

消息可携带 `route_cards / poi_card / navigation_card / next_stop_card / route_progress`。动作仅接受白名单 routeId 和已知 poiId，页面跳转统一调用 `mapGuideNavigation` helper，禁止自由 URL。

## UI 接入

1. 全局数字人 UI 订阅 `useGuideSessionStore`，不在各页面创建独立会话。
2. 输入调用 `sendGuideMessage(text)`。
3. 根据 `message.ui.type` 渲染业务卡片。
4. 路线卡按钮调用 `executeGuideAction({ type: 'open_route_preview', routeId }, { navigate, presentation })`。
5. 抽屉开关使用 `isDrawerOpen / setDrawerOpen`。
6. `status` 驱动 idle/listening/thinking/speaking/error 视觉。

## 推荐规则

规则从时间、兴趣、节奏和同行人评分五条真实路线。“两小时 + 轻松 + 拍照”额外提升 `highlights_checkin`，确保主推荐稳定。进入刚由小灵推荐的路线后，仅追加一次连续引导语。
