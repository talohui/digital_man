# 灵山胜境 routeGeometry 候选路线人工复核记录

## 1. 文档目的

本文档用于记录 `src/data/lingshanRouteGeometries.ts` 中三条候选路线的人工复核情况。

当前 `routeGeometry` 来自腾讯 walking route runtime 导出。`usedFallback=false` 表示腾讯 walking 请求成功返回路线，不是 from/to 直线兜底；但这不代表路线已经人工验证，也不代表完全贴合灵山胜境园区内部真实步道。

因此这些路线当前状态为 `candidate`，不是 `verified`。

## 2. 当前 routeGeometry 数据来源

| sceneRouteId | guideRouteId | source | status | pointCount | distanceMeters | durationMinutes | usedFallback | 备注 |
|---|---|---|---|---:|---:|---:|---|---|
| `historical_3d_scene` | `historical_culture` | `tencent_walking_runtime` | `candidate` | 417 | 4945 | 76 | false | 历史文化路线候选几何，需人工核对园区步道贴合情况。 |
| `natural_3d_scene` | `natural_scenery` | `tencent_walking_runtime` | `candidate` | 365 | 4607 | 71 | false | 自然风光路线候选几何，需人工核对园区步道贴合情况。 |
| `family_3d_scene` | `family` | `tencent_walking_runtime` | `candidate` | 198 | 2497 | 37 | false | 亲子路线候选几何，需人工核对园区步道贴合情况。 |

## 3. 当前观察到的问题

`routeGeometry` 比 POI 中心连线更接近真实路线，因为它包含腾讯 walking 返回的中间路径点，不只是站点中心直连。

但腾讯 walking route 仍可能因为园区内部路网不完整、景点中心点、地图数据抽象等原因，出现局部不贴路。当前观察到个别段落可能穿过湖面、建筑区域或非步道区域。

这些问题说明 `routeGeometry` 仍需要人工复核，不能直接作为最终路线。

## 4. 为什么 usedFallback=false 仍不能直接 verified

`usedFallback=false` 只说明腾讯 walking 返回了路线 polyline。

腾讯 walking 返回路线不等于景区内部步道完全准确。景区内部广场、台阶、私有步道、观赏区可能不在腾讯路网中精确表达；POI 起终点如果是景点中心，也可能影响路线贴合程度。

因此 `usedFallback=false` 是“可作为候选数据”的条件，不是“已验证”的条件。

## 5. 人工复核清单

| 路线 | 待复核段落 | 问题类型 | 复核结果 | 是否需要人工修正 | 备注 |
|---|---|---|---|---|---|
| 历史文化路线 | 待逐段核对 | 待现场验证 | 未复核 | 待定 | 重点关注大佛、梵宫、五印坛城、三圣殿相关段落。 |
| 自然风光路线 | 待逐段核对 | 待现场验证 | 未复核 | 待定 | 重点关注菩提大道、曼飞龙塔、灵山精舍、梵宫广场相关段落。 |
| 亲子路线 | 待逐段核对 | 待现场验证 | 未复核 | 待定 | 重点关注九龙灌浴、佛手广场、百子戏弥勒、梵宫、五印坛城相关段落。 |

问题类型可选：

- 穿湖
- 穿建筑
- 不贴道路
- 绕路异常
- 入口点不合理
- 可接受
- 待现场验证

## 6. 后续修正策略

### 策略 A：修 navLocation

适用于起点或终点落在景点中心，而真实导航应落在入口、广场或道路边的情况。

可优先修正灵山大佛、梵宫、九龙灌浴、五印坛城等核心点的 `navLocation`，让后续路线规划终点更接近可步行到达位置。

### 策略 B：人工修 routeGeometry

适用于腾讯 walking 路径局部穿湖、穿建筑，但整体路线可用的情况。

后续可新增 `hybrid_corrected` 版本，对局部异常点段进行人工替换、插点或删点。修正后路线状态可从 `candidate` 变为 `manual_review_required`，人工确认后再变为 `verified`。

### 策略 C：建设园区自有路网

适用于腾讯 walking 对园区内部路网整体不可靠的情况。

后续可维护 road nodes / edges，自行生成园区内部路线。该方式成本更高，但可控性最好，适合需要更精细导航或偏航提示时推进。

### 策略 D：手机端局域网现场验证

结合 `docs/mobile-lan-route-verification.md`，用手机访问本地 demo，实际查看路线显示、触摸交互、POI 聚焦和 3D 金线表现。

手机端更接近游客使用场景，适合确认路线是否在小屏上可理解、是否与真实地图表现一致。

## 7. routeGeometry 状态规则建议

- `candidate`：腾讯 walking runtime 导出，未人工复核。
- `manual_review_required`：发现局部问题，需要人工修正。
- `verified`：已人工核对，确认适合用于路线展示。
- `hybrid_corrected`：基于腾讯 path 人工修正后的路线来源。

## 8. 对 /map 与 /scenic-3d-map 的影响

`/scenic-3d-map` 当前使用 `routeGeometry` 作为 3D 金线候选路径。该路径比 POI 中心连线更适合表达路线形态，但仍需要人工复核。

`/map` 仍使用腾讯 walking 实时路线或既有逻辑。未来可考虑让 `/map` 也支持 `verified routeGeometry` 作为展示层，但真实导航仍需腾讯地图或自有路网兜底。

## 9. 结论

`routeGeometry` 是比 POI 中心连线更好的第一版路径基础，但目前仍是 `candidate`。

下一步应结合地图截图、手机验证和人工判断，逐段修正高风险路线段，再决定哪些路线可以升级为 `verified`。
