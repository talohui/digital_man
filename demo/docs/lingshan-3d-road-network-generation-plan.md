# 灵山胜境 3D 道路网络生成与导航绑定方案

## 1. 目标

`/scenic-3d-map` 后续不应只停留在艺术化展示层，而应逐步支持更可信的 3D 导览导航能力，包括实时定位、路线吸附、距离下一站、偏航判断，以及偏航后自动调用腾讯 walking route 重规划到下一站并投影到 3D 场景显示。

当前 3D 地图已有核心 POI、3D 路线和三条 `routeGeometry candidate`，但这些数据还不足以支撑完整的园区内导航。后续需要生成更完整的道路底网，让它同时服务：

- 3D 道路视觉层。
- 用户定位吸附。
- 路线进度估算。
- 偏航判断。
- 自动重规划后的 3D 路线显示。

第一版道路网建议基于腾讯 walking route 批量采样生成，而不是人工描线。这样可以先利用真实地图服务返回的步行路径，形成相对可信的候选道路结构，再通过人工复核和现场验证逐步修正。

## 2. 为什么当前 routeGeometry 不够

当前 `src/data/lingshanRouteGeometries.ts` 中只有三条主题路线：

- `historical_3d_scene`
- `natural_3d_scene`
- `family_3d_scene`

这些路线是从腾讯 walking route runtime 导出的候选路径，已经比 POI 中心连线更合理，但仍不够支撑完整 3D 导航：

- 只覆盖三条主题路线主线，不覆盖所有可走道路。
- 用户偏离当前路线后，缺少局部道路结构用于吸附和判断。
- 偏航后重规划得到的新路径无法和已有道路底网自然融合。
- 3D 道路视觉层只能看到主题路线附近的片段，不够像园区路网。
- 如果只依赖三条 routeGeometry，用户位置可能落在真实道路附近却无法匹配到当前候选路径。
- 当前数据不能可靠支持 3D 地图内的导航吸附、路线恢复和局部引导。

因此，三条 `routeGeometry` 适合作为主题导览路线候选数据，但不应被当成完整道路网络。

## 3. 道路网络数据来源

第一版道路网络建议使用以下数据来源：

1. 现有 19 个 POI。
2. `guideRoutes` 中相邻站点对。
3. POI 之间的近邻点对。
4. 南门 / 出口到核心 POI 的连接。
5. 后续人工补充的路口点和控制点。

生成方式：

- 对上述点对调用腾讯 walking route。
- 保存返回的 polyline / path。
- 将每段 path 作为候选道路 segment。
- 在 3D 地图中运行时通过 `geoToScenePosition` 投影到 3D 坐标。

明确边界：

- 不从腾讯底图直接提取矢量道路。
- 不抓取腾讯底图中的水体、建筑或道路矢量数据。
- 批量采样结果是 `candidate road network`，不是官方道路网。
- 后续需要人工审核、地图截图比对、手机端验证和现场验证。

## 4. 第一版采样策略

### A. 主题路线相邻站点采样

对每条 `guideRoute` 的相邻 stop 做腾讯 walking route：

- `historical_culture`
- `natural_scenery`
- `family`

例如一条路线有：

```ts
['south_gate', 'lingshan_wall', 'shengjing_square']
```

则生成：

- `south_gate -> lingshan_wall`
- `lingshan_wall -> shengjing_square`

这样得到的 segment 直接表达现有业务路线的游览顺序和局部道路。

### B. POI 近邻采样

基于 19 个 POI 的真实经纬度计算距离，对距离较近的 POI 对做 walking route 采样。

建议阈值：

- 第一轮：250m。
- 如果道路网过稀，可扩展到 350m。

近邻采样可以补齐主题路线之外的横向连接，避免道路网络只是一组单线。

### C. 核心锚点采样

将以下点作为核心锚点，采样到若干临近 POI：

- 南门入园。
- 胜境广场。
- 九龙灌浴。
- 灵山大佛。
- 梵宫。
- 五印坛城。
- 景区出口。

核心锚点用于保证入口、主轴线、核心地标和出口之间形成稳定的道路骨架。

### D. 后续补点

如果道路网缺口明显，后续再人工添加 `roadControlPoints`：

- 路口点。
- 广场边缘点。
- 台阶入口点。
- 桥 / 水边转折点。
- 需要避开建筑或水面的控制点。

这些点不等同 POI，可以只作为道路网络拓扑节点，不显示在普通游客 UI 中。

## 5. 推荐数据结构

后续可新增数据文件：

`src/data/lingshanRoadNetwork.ts`

建议类型：

```ts
export type LatLngPoint = {
  lat: number
  lng: number
}

export type RoadNetworkNode = {
  id: string
  name: string
  kind: 'poi' | 'control_point'
  location: LatLngPoint
  source: 'poi' | 'manual'
}

export type RoadNetworkSegment = {
  id: string
  fromNodeId: string
  toNodeId: string
  path: LatLngPoint[]
  distanceMeters?: number
  durationMinutes?: number
  source: 'tencent_walking'
  status: 'candidate' | 'verified' | 'corrected'
  generatedAt: string
  notes?: string
}

export type LingshanRoadNetwork = {
  version: string
  nodes: RoadNetworkNode[]
  segments: RoadNetworkSegment[]
}
```

设计说明：

- 第一版 `nodes` 直接来自 19 个 POI。
- `control_point` 后续再加，用于路口、桥、台阶、广场边缘等非 POI 道路结构。
- `segments` 来自腾讯 walking route 返回的 path。
- `status` 初始为 `candidate`。
- 人工核对后可升级为 `verified`。
- 人工修正后的 segment 可标记为 `corrected`。
- 不要把 `candidate` 说成 `verified` 或官方道路。

## 6. 道路合并与去重思路

第一版可以先不做复杂拓扑合并：

- 每个腾讯 walking path 独立保存为一个 segment。
- 3D 视觉层直接绘制所有 candidate segments。
- 路线吸附第一版在所有 segment path 上查找最近点。
- 路线进度第一版仍可优先使用当前 guideRoute / sceneRoute 的主路径。

后续再逐步优化：

- 折线简化，减少过密点。
- 近点合并，将相邻重复点归并。
- 重复 segment 去重，避免同一段路多次叠加。
- 建立 node / edge 拓扑。
- 标记主路、支路、广场连接、入口连接。
- 对穿湖、穿建筑、不贴路片段做人工修正。

视觉层可以把所有 candidate segment 以淡墨色 / 浅灰色道路底网显示，当前导览路线仍用金线高亮。

## 7. 与 3D 坐标系统的关系

`roadNetwork` 的源数据应存经纬度，而不是直接存 3D 坐标：

- `RoadNetworkNode.location` 存真实 lat/lng。
- `RoadNetworkSegment.path` 存真实 lat/lng 点串。
- `/scenic-3d-map` 运行时通过 `geoToScenePosition(point, { center: scenicCenter })` 投影到 3D。

这样做的原因：

- 可与 `/map` 共享同一份真实地理数据。
- 可与浏览器真实 GPS 定位统一。
- 可与腾讯 walking route 的输入输出统一。
- 可与后续自动重规划结果统一。
- 如果 3D 投影比例、中心点、视觉偏移需要调整，不需要重写道路源数据。

3D 坐标只应作为渲染结果或缓存，不应成为道路网络的权威源数据。

## 8. 3D 导航逻辑设计

后续 3D 导航可按以下流程设计：

1. 用户通过浏览器 GPS 获得真实 `lat/lng`。
2. 使用 `geoToScenePosition` 将用户位置投影到 3D 场景。
3. 在 `roadNetwork.segments` 的所有 path 上查找最近点。
4. 基于最近点计算用户在当前路线上的大致进度。
5. 基于当前 `guideRoute.stops` 计算下一站。
6. 如果连续偏航，自动调用腾讯 walking route：
   - 用户当前位置 -> 当前路线下一站 `navLocation`。
7. 得到 reroute path。
8. 在 `/map` 中显示真实 reroute 线。
9. 在 `/scenic-3d-map` 中将 reroute path 投影为 3D 临时路线。
10. 用户到达下一站后，恢复原 guideRoute 后续路线。

关键原则：

- 3D 地图只做导览和可视化，不宣称精确导航权威。
- 精确导航仍以腾讯地图、真实坐标和后续 verified roadNetwork 为准。
- 自动重规划必须节流，避免频繁调用腾讯 API。

## 9. 与 /map 的关系

`/map` 仍是权威真实地图和导航兜底页面，`/scenic-3d-map` 是沉浸式 3D 导航视图。两者应共享：

- `guideRoute`
- `sceneRoute`
- `navLocation`
- `roadNetwork`
- `routeGeometry`
- reroute path

建议关系：

- `/map` 负责真实底图、真实 POI、腾讯 walking route、定位精度、导航兜底。
- `/scenic-3d-map` 负责 3D 视觉、核心游线、道路底网、当前位置意象、下一站和偏航提示。
- 腾讯 walking route 仍通过现有 `routePlanning.ts` 或后续封装调用。
- 不复制、不提取腾讯底图矢量数据。
- 不把候选道路网说成腾讯官方道路网。

## 10. 风险与限制

- 腾讯 walking route 在景区内部可能不完全贴合真实步道。
- candidate road network 不能声称是官方道路。
- 没有人工路口点时，道路网可能缺少支路和广场内部连接。
- GPS 在景区内会漂移，尤其在建筑、山体、树木或人流密集区域。
- 自动重规划需要节流，避免短时间频繁调用腾讯 API。
- 腾讯 API Key 权限、调用额度和域名限制需要单独确认。
- `navLocation` 不准会导致采样路径偏离真实可走入口。
- 现场验证前不能承诺精确导航。
- 3D 地图中的道路视觉表达需要明确“导览参考”而不是精确导航承诺。

## 11. 后续开发阶段建议

### 阶段五十四：roadNetwork 采样工具设计

- 生成 19 个 POI 的 pair 列表。
- 生成 guideRoutes 相邻站点 pair。
- 生成近邻 POI pair。
- 生成核心锚点 pair。
- 不调用腾讯 API，只输出采样计划。

### 阶段五十五：roadNetwork 腾讯 walking 批量采样

- 调用现有 `buildWalkingRoute` 或新封装。
- 对采样计划逐段请求 walking route。
- 导出 candidate segments JSON / TS。
- 记录 `usedFallback`、`fallbackReason`、pointCount、distanceMeters、durationMinutes。

### 阶段五十六：3D 道路底网接入

- `/scenic-3d-map` 读取 roadNetwork segments。
- 所有 segment path 通过 `geoToScenePosition` 投影。
- 淡色显示 candidate 道路底网。
- 当前路线继续金线高亮。

### 阶段五十七：3D 定位吸附与偏航判断

- 使用 roadNetwork segments 做最近点吸附。
- 在 3D 地图中显示用户当前位置。
- 计算距离路线、路线进度、下一站和偏航状态。

### 阶段五十八：3D 自动重规划到下一站

- 连续偏航后调用腾讯 walking route。
- 用户当前位置 -> 下一站 `navLocation`。
- 在 `/map` 和 `/scenic-3d-map` 同步显示 reroute path。
- 到达下一站后恢复原路线。

## 12. 结论

灵山胜境 3D 地图如果要承接更完整的步行导航，必须从三条主题 `routeGeometry` 升级为更完整的候选道路网络。

第一版不建议人工描线，而应围绕现有 19 个 POI、guideRoutes 相邻站点、近邻 POI 和核心锚点，批量调用腾讯 walking route 采样，形成 candidate roadNetwork。该数据既可用于 3D 道路视觉层，也可用于定位吸附、路线进度、偏航判断和自动重规划后的 3D 路线显示。

但 candidate 不等于 verified。后续必须通过人工复核、手机端验证和必要的现场验证，逐步将关键 segment 升级为 verified 或 corrected。
