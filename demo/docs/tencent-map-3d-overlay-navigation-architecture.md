# 腾讯地图 3D 模型覆盖与真实导航架构方案

## 1. 背景

当前项目已经完成腾讯地图 Web 3D 模型覆盖物的最小验证：

- 腾讯地图 Web JavaScript API GL 支持 `TMap.model.GLTFModel`。
- `/map?debugGltfModel=1` 可以加载 GLB 模型。
- `scale`、`height`、`yaw / rotationY`、`rotationX/Y/Z` 均可调试。
- 多个 3D 视角预设可切换，用于观察模型贴地、比例和朝向。
- `src/data/lingshanMapModelOverlays.ts` 已将景点 GLB 覆盖物配置化。
- 调试面板已支持复制当前模型配置和调试摘要，便于把浏览器校准参数回填到配置文件。

这些验证说明：真实地理底图、真实导航、实时定位和景点 3D 模型增强可以集中在 `/map` 中推进，而不必强行让独立 Three.js 沙盘承担完整真实导航职责。

## 2. 路线调整结论

后续地图体系建议明确分为两个互补模式：

- `/map`：真实导航主模式。
- `/scenic-3d-map`：沉浸式文化沙盘模式。

二者不是替代关系：

- `/map` 负责真实地理底图、定位、路线、偏航、重规划和 Web GLB 模型覆盖物。
- `/scenic-3d-map` 负责视觉展示、路线故事、文化导览和答辩演示。

真实游客导航主线应优先放在 `/map`。`/scenic-3d-map` 可以继续展示艺术化 3D 场景和候选道路底网，但不应被包装为真实导航权威。

## 3. /map 真实 3D 导航增强模式职责

`/map` 后续应作为真实 3D 导航增强模式的主承载页，职责包括：

- 腾讯真实底图。
- 真实道路、水体、建筑环境和地名显示。
- 腾讯 walking route 路线展示。
- 浏览器实时定位。
- 用户位置 Marker 和精度圆。
- 路线进度估算。
- 下一站和距离下一站提示。
- 偏航判断。
- 偏航后的自动重规划到下一站。
- GLB 景点模型覆盖物。
- POI 信息、讲解入口和真实导航兜底。

在该模式中，腾讯地图底图承担真实空间表达，项目自有图层负责增强：

- POI Marker。
- routeGeometry / roadNetwork 候选展示层。
- 当前位置和路线状态。
- GLB 模型覆盖物。
- 导览文案和讲解入口。

## 4. /scenic-3d-map 沉浸式文化沙盘职责

`/scenic-3d-map` 应保留为沉浸式文化沙盘和展示模式，职责包括：

- 艺术化 3D 导览。
- 主题路线故事表达。
- 景点文化展示。
- 展示和答辩视觉。
- 低模场景表达。
- 核心 POI、路线金线、道路底网和水系意象展示。
- 连接 `/map?poi=xxx` 和 `/map?sceneRoute=xxx` 的入口。

`/scenic-3d-map` 不作为真实导航权威，不承诺完整道路精度，不替代腾讯地图真实导航。

## 5. roadNetwork 的重新定位

`src/data/lingshanRoadNetwork.ts` 的 candidate roadNetwork 仍有价值，但定位需要收束：

- 可用于 `/scenic-3d-map` 的道路底网视觉层。
- 可用于后续 3D 定位吸附和偏航实验。
- 可用于理解景区核心 POI 之间的候选步行连接。
- 可用于辅助 `/map` 的调试和路线质量审计。

但真实游客导航应优先依赖 `/map` 中的腾讯地图底图和 walking route。roadNetwork candidate 不代表官方道路，也不代表已经现场验证的精确步道。

因此，后续应暂缓继续追求 `/scenic-3d-map` 的完整道路真实化，把真实导航主线转向 `/map`，只保留 roadNetwork 在 3D 沙盘中的视觉增强和实验价值。

## 6. GLB 模型资产流程

后续 GLB 景点模型建议按以下流程接入：

1. 使用 MeshyAI / AI 3D / 多图重建生成第一版模型。
2. 使用 Blender / Blender MCP 清理模型：
   - 降面。
   - 修原点。
   - 修比例。
   - 修朝向。
   - 合并或简化材质。
   - 压缩贴图。
3. 将 GLB 放入：
   - `public/models/lingshan/landmarks/`
4. 在 `src/data/lingshanMapModelOverlays.ts` 中配置：
   - `poiId`
   - `name`
   - `modelUrl`
   - `positionSource`
   - `height`
   - `scale`
   - `rotation`
   - `status`
5. 打开 `/map?debugGltfModel=1` 进行校准：
   - 选择 POI 模型配置。
   - 调整 `scale`。
   - 调整 `height`。
   - 调整 `yaw / rotationY`。
   - 必要时使用高级 `rotationX/Y/Z`。
   - 切换视角预设检查贴地、比例和朝向。
6. 使用“复制当前模型配置”回填配置文件。
7. 后续再决定是否在普通 `/map` 的真实 3D 模型增强模式中启用。

第一批建议继续围绕：

- 灵山大佛。
- 梵宫。
- 九龙灌浴。
- 五印坛城。

模型覆盖物只增强视觉识别，不参与路线规划，不替代真实导航。

## 7. 后续阶段建议

### 阶段六十一：接入 MeshyAI 灵山大佛正式 GLB

- 将正式 GLB 放入 `public/models/lingshan/landmarks/`。
- 更新 `lingshanMapModelOverlays.ts` 的 `giant_buddha` 配置。
- 使用 `/map?debugGltfModel=1` 校准 scale / height / rotation。
- 复制配置回填。

### 阶段六十二：配置梵宫、九龙灌浴、五印坛城模型覆盖物

- 逐个接入核心景点 GLB。
- 保持模型体积可控。
- 每个模型单独校准。
- 不一次性提交未优化大模型。

### 阶段六十三：/map 真实 3D 模型增强模式 UI

- 在普通 `/map` 中增加受控的“3D 模型增强”开关。
- 默认不强制开启大模型。
- 提供模型图例和加载状态。
- 保留低性能设备的关闭路径。

### 阶段六十四：/map 3D 导航状态卡

- 将当前定位、下一站、路线进度、偏航状态整理为更适合真实游客使用的状态卡。
- 区分普通游客信息和开发调试信息。
- 保持 `/map` 作为真实导航主界面。

### 阶段六十五：偏航后自动重规划到下一站并同步显示

- 连续偏航后调用腾讯 walking route。
- 用户当前位置 -> 下一站 `navLocation`。
- 在 `/map` 中显示临时 reroute 线。
- 必要时将 reroute path 同步给 3D 展示层。

## 8. 结论

腾讯地图 Web GLTFModel 验证完成后，项目架构应收束为“双地图互补”：

- `/map` 承担真实地图、真实导航、实时定位、重规划和 GLB 景点模型覆盖物。
- `/scenic-3d-map` 承担沉浸式文化沙盘、路线故事和展示视觉。

这样可以同时保留真实导航可信度和 3D 展示表现力，避免将独立 3D 沙盘过度包装为精确导航系统。
