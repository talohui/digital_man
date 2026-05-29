# 灵山胜境地图与 3D 构建开发记录

## 2026-05-28

### 阶段名称

阶段一：灵山景区空间数据层初始化。

### 本次目标

新增独立的灵山景区空间数据层，为后续园区边界判断、园内手工路线、POI 绑定、到点讲解触发和 3D 场景坐标映射做准备。

### 本次约束

- 只新增空间数据层。
- 不改动地图页面 UI。
- 不改动 `GuideMapPage.tsx`。
- 不改动数字人、聊天、语音、RAG 相关模块。
- 不删除 `guideData.ts` 的任何原有导出。
- 不记录任何 API Key、密钥、token、账号或敏感信息。

### 修改文件清单

- 新增 `src/data/lingshanMapData.ts`
- 新增 `docs/map-3d-development-log.md`

### 新增类型说明

- `LingshanPoiCategory`：定义景区 POI 分类，包括景点、入口、服务点、卫生间、餐饮、观光车、出口和观景点。
- `PoiBindStatus`：定义 POI 与外部地图数据或人工校验的绑定状态。
- `LingshanPoi`：定义统一 POI 数据结构，包含展示坐标、导航坐标、腾讯 POI 预留字段、3D 场景坐标预留字段和到点触发半径。
- `LingshanRoutePath`：定义后续手工路线、腾讯路线或兜底路线的路径数据结构。

### 数据来源说明

本次 `lingshanPois` 从现有 `guideData.ts` 的 `guideSpots` 自动派生，复用 `LatLngPoint`、`guideSpots` 和 `guideRoutes`。当前没有新增外部地图数据，也没有写入腾讯 POI 真实绑定信息。

### 实现方式说明

- `lingshanPois` 使用 `guideSpots.map(...)` 自动生成。
- `id`、`name`、`stayMinutes`、`intro` 直接来自现有景点数据。
- `displayLocation` 和 `navLocation` 暂时都使用现有 `{ lat, lng }` 坐标。
- `triggerRadiusMeters` 默认设置为 35 米。
- `bindStatus` 默认设置为 `candidate`。
- `aliases` 默认空数组。
- 分类推断规则：
  - 名称包含“南门”“入园”“入口”时归类为 `gate`。
  - id 包含 `exit` 或名称包含“出口”时归类为 `exit`。
  - 其他点位默认归类为 `spot`。
- `lingshanPresetRoutePaths` 当前为空数组，占位后续手工园区路线。
- `lingshanBoundary` 当前为空数组，占位后续真实园区边界。

### 为什么这样设计

现有 `guideData.ts` 同时承担景点文案、路线站点和坐标来源。本阶段先新增旁路空间数据层，不改现有地图渲染链路，可以避免破坏当前 Demo。`displayLocation` 和 `navLocation` 分离后，后续可以分别支持“地图展示点”和“导航落点”，例如建筑入口、广场中心、室内景点入口可能并不完全一致。`scenePosition` 预留给后续 3D 符号化场景映射，避免后续再改 POI 主结构。

### 未完成事项

- `lingshanBoundary` 当前是占位数据，后续需要补充灵山胜境真实边界。
- `lingshanPresetRoutePaths` 当前是占位数据，后续需要补充三条主题路线的手工园区路径。
- 腾讯 POI 绑定字段目前为空，后续需要按点位逐个校验。
- 尚未接入定位、入园判断、到点讲解触发。
- 尚未改造 `GuideMapPage.tsx` 使用新空间数据层。

### 验证方式

- 检查新增文件只依赖现有 `guideData.ts` 导出。
- 执行 `npm run build` 验证 TypeScript 编译和 Vite 构建。

### npm run build 结果

通过。执行 `npm run build` 后，`tsc -b && vite build` 成功完成。Vite 输出了部分 chunk 超过 500 kB 的体积提示，这是当前项目打包体积提示，不影响本次构建结果。

### 下一步建议

第二阶段建议补充 `lingshanPresetRoutePaths`，优先为现有三条路线提供手工园区路线 polyline，并保持 `routePlanning.ts` 的腾讯 walking route 作为兜底。

## 2026-05-28

### 阶段名称

阶段二：预设园内路线优先机制接入

### 本次目标

在不改变现有地图 UI 和默认行为的前提下，为 `GuideMapPage.tsx` 接入“预设园内路线优先、腾讯 walking 路线兜底”的路线绘制机制。

### 本次约束

- 只涉及地图路线数据与 `GuideMapPage` 的路线绘制逻辑。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不改变页面 UI 样式。
- 不填充真实手工路线数据。
- 不修改 API Key、`.env` 或任何敏感配置。
- 不读取、不输出、不修改上层无关 `.env` 或 Fay 配置改动。

### 修改文件清单

- 更新 `src/data/lingshanMapData.ts`
- 更新 `src/lib/routePlanning.ts`
- 更新 `src/pages/GuideMapPage.tsx`
- 更新 `docs/map-3d-development-log.md`

### 实现方式说明

- 在 `lingshanMapData.ts` 中新增 `getLingshanPresetRoutePath(routeId)`，用于按当前路线 ID 查询预设园区路线。
- 在 `routePlanning.ts` 中新增 `buildPlannedRouteFromPath(path, options)`，用于把已有 `{ lat, lng }[]` 路径转换成 `PlannedRoute`。
- `buildPlannedRouteFromPath` 对长度不足 2 的 path 返回 `usedFallback: true`，对有效 path 累计估算距离与步行耗时。
- 在 `GuideMapPage.tsx` 的 `renderRoute()` 中先查询预设路线：
  - 如果存在当前 `route.id` 对应的预设路线，且 `path.length >= 2`，直接使用预设 path 绘制。
  - 如果不存在有效预设路线，继续调用原有 `buildWalkingRoute(routeSpots)`。
  - `buildWalkingRoute` 内部既有腾讯 WebService 请求、缓存和失败兜底逻辑保持不变。

### 为什么不在本阶段填充真实路线

本阶段只接入机制，不填真实路线，是为了把“代码接入”和“园区路线数据校准”分开。真实手工路线需要基于灵山胜境园区道路、入口、台阶、观光车、禁行区域和现场坐标逐段校验，直接在本阶段填充容易引入错误路径，影响当前可演示导览。

### 对现有地图行为的影响

当前 `lingshanPresetRoutePaths` 仍为空数组，因此现阶段地图仍会走原腾讯 walking 路线规划逻辑。页面 UI、Marker、InfoWindow、路线切换和地图初始化逻辑没有改变。本阶段只是为后续人工园区路线接入打基础。

### 验证方式

- 检查 `lingshanPresetRoutePaths` 仍为空数组。
- 检查 `GuideMapPage.tsx` 在无有效预设路线时仍调用 `buildWalkingRoute(routeSpots)`。
- 执行 `npm run build` 验证 TypeScript 编译和 Vite 构建。

### npm run build 结果

通过。执行 `npm run build` 后，`tsc -b && vite build` 成功完成。Vite 仍输出部分 chunk 超过 500 kB 的体积提示，这是当前项目打包提示，不影响本阶段构建结果。

### 下一步建议

第三阶段建议先为一条路线补充少量人工校验 path，验证预设路线确实能跳过腾讯 walking 请求；随后再扩展到三条主题路线，并补充真实园区边界数据。

## 2026-05-28

### 阶段名称

阶段三：预设园内路线骨架生成

### 本次目标

基于现有 `guideRoutes` 和 `guideSpots` 自动生成 `lingshanPresetRoutePaths`，让每条现有主题路线都有一条可被阶段二机制识别的预设路线骨架。

### 本次约束

- 只修改地图数据层和开发记录。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `routePlanning.ts`。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不改变页面 UI。
- 不修改 API Key、`.env` 或任何敏感配置。
- 不接入真实园区步道折线。
- 不新增真实边界数据，`lingshanBoundary` 继续保持空数组和 TODO。

### 修改文件清单

- 更新 `src/data/lingshanMapData.ts`
- 更新 `docs/map-3d-development-log.md`

### 实现方式说明

- 将 `lingshanPresetRoutePaths` 从空数组改为 `guideRoutes.map(...)` 自动生成。
- 每条路线使用 `route.id` 作为 `routeId`。
- 每个 `route.stops` 中的 `spotId` 会反查 `guideSpots`。
- 找到景点后提取 `{ lat, lng }` 加入 path。
- 找不到对应景点时过滤该点，不抛异常。
- 每条路线的 `source` 设置为 `manual`。
- 每条路线的 `note` 明确说明当前只是基于路线站点生成的预设路线骨架，后续需要替换为更精细的园区步道折线。

### 为什么先用 route stops 生成路线骨架

现有 `guideRoutes` 已经表达了每条导览路线的站点顺序，`guideSpots` 已经保存了这些站点的坐标。先用这两份现有数据生成路线骨架，可以用最小改动验证阶段二的“预设路线优先”机制是否能闭环，同时不引入未经校验的新道路数据。

### 当前路线骨架的局限性

- 本阶段没有接入真实园区步道折线。
- 当前 path 只是景点之间的骨架连线，不代表真实可步行道路。
- 路线没有体现道路转折、台阶、桥梁、出入口、观光车动线、禁行区域和无障碍路径。
- 站点坐标本身仍来自现有演示数据，后续需要逐点校准。
- 因为路径点较少，绘制效果更接近站点连线，而不是精细游步道。

### 对现有地图行为的影响

由于阶段二已经接入预设路线优先机制，本阶段完成后，地图页理论上会优先使用 `lingshanPresetRoutePaths`，而不是腾讯 walking。页面 UI、Marker、InfoWindow、路线切换和地图初始化逻辑没有改动。本阶段没有修改 `GuideMapPage.tsx`。

### 验证方式

- 检查 `lingshanPresetRoutePaths` 由 `guideRoutes.map(...)` 生成，不再为空数组。
- 检查 `getLingshanPresetRoutePath(routeId)` 保留并继续按 routeId 查询。
- 执行 `npm run build` 验证 TypeScript 编译和 Vite 构建。

### npm run build 结果

通过。执行 `npm run build` 后，`tsc -b && vite build` 成功完成。Vite 仍输出部分 chunk 超过 500 kB 的体积提示，这是当前项目打包提示，不影响本阶段构建结果。

### 下一步建议

第四阶段建议在地图页或调试日志中验证预设路线是否确实被优先使用，然后逐条替换为人工校验后的园区步道折线，并补充灵山胜境真实边界数据用于后续入园判断。

## 2026-05-28

### 阶段名称

阶段四：预设路线启用开关

### 本次目标

为预设园内路线增加显式启用开关，让 `GuideMapPage` 只有在开关开启时才使用 `lingshanPresetRoutePaths`，默认继续使用腾讯 walking 路线规划。

### 本次约束

- 只涉及地图路线选择逻辑和开发记录。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不改变页面 UI。
- 不修改 API Key、`.env` 或任何敏感配置。
- 不新增真实园区道路折线。
- 不新增 3D 功能。

### 修改文件清单

- 更新 `src/data/lingshanMapData.ts`
- 更新 `src/pages/GuideMapPage.tsx`
- 更新 `docs/map-3d-development-log.md`

### 实现方式说明

- 在 `lingshanMapData.ts` 中新增 `USE_LINGSHAN_PRESET_ROUTE_PATHS` 常量，并默认设置为 `false`。
- 在 `GuideMapPage.tsx` 中将预设路线查询包裹在该开关之后。
- 当 `USE_LINGSHAN_PRESET_ROUTE_PATHS` 为 `false` 时，`presetRoutePath` 固定为 `undefined`，地图页直接调用 `buildWalkingRoute(routeSpots)`。
- 当后续开关改为 `true`，并且当前路线存在有效预设 path 时，地图页才会使用 `buildPlannedRouteFromPath(...)` 绘制预设路线。

### 为什么默认关闭预设路线

当前 `lingshanPresetRoutePaths` 已有 3 条路线骨架，但这些路线只是由景点 stop 生成的景点连线，不是真实步道。默认关闭可以避免把骨架线误当作真实可步行路线展示，保证当前地图页继续使用腾讯 walking route，显示效果更接近真实步行路径。后续补完真实园区道路折线后，再考虑将开关改为 `true`。

### 对现有地图行为的影响

默认关闭后，地图页继续使用腾讯 walking route。Marker、InfoWindow、地图初始化、路线切换、页面 UI 均未改变。本次没有修改数字人、聊天、语音、RAG、Live2D 相关模块。

### 验证方式

- 检查 `USE_LINGSHAN_PRESET_ROUTE_PATHS` 默认值为 `false`。
- 检查 `GuideMapPage.tsx` 只有在开关为 `true` 时才调用 `getLingshanPresetRoutePath(route.id)`。
- 执行 `npm run build` 验证 TypeScript 编译和 Vite 构建。

### npm run build 结果

通过。执行 `npm run build` 后，`tsc -b && vite build` 成功完成。Vite 仍输出部分 chunk 超过 500 kB 的体积提示，这是当前项目打包提示，不影响本阶段构建结果。

### 下一步建议

下一阶段建议补充真实园区步道折线前，先整理每条路线需要经过的道路节点和关键转折点；待人工路线校验完成后，再将 `USE_LINGSHAN_PRESET_ROUTE_PATHS` 改为 `true` 进行地图页验证。

## 2026-05-28

### 阶段名称

阶段五：POI 绑定审计文档生成

### 本次目标

基于 `src/data/lingshanMapData.ts` 中由 `guideSpots` 派生的 `lingshanPois`，生成灵山胜境 POI 绑定审计表，为后续腾讯 POI 绑定、展示坐标校验和导航点修正做准备。

### 本次约束

- 只生成/更新文档，不修改功能代码。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `lingshanMapData.ts`。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不修改 API Key、`.env` 或任何敏感配置。
- 不运行 `npm run build`，因为本阶段没有修改代码。

### 修改文件清单

- 新增 `docs/lingshan-poi-binding-audit.md`
- 更新 `docs/map-3d-development-log.md`

### 文档内容说明

`docs/lingshan-poi-binding-audit.md` 包含审计说明、POI 审计表、后续人工绑定流程建议和当前未解决问题。审计表覆盖当前 19 个 `lingshanPois` 点位，列出 id、名称、当前分类、展示坐标、导航坐标、绑定状态、建议处理和备注。

### 为什么先做审计表而不是直接改坐标

当前点位来自 `guideData.ts` 自动迁移，`displayLocation` 和 `navLocation` 暂时相同，并不代表最终准确导航终点。直接改坐标容易把未经核验的数据写入功能代码。先做审计表可以把“需要人工确认的事项”集中列出，再按官方导览图、腾讯 POI 和现场可达点逐项校验，降低后续地图路线和到点讲解误判风险。

### 对功能代码的影响

本阶段没有修改功能代码，没有修改地图页面 UI，没有修改数字人、聊天、语音、RAG、Live2D 相关模块。当前应用运行逻辑不受影响。

### 验证方式

- 检查 `docs/lingshan-poi-binding-audit.md` 已成功生成。
- 检查审计表包含当前 19 个 POI 点位。
- 检查文档未记录任何 API Key、密钥、token、账号或敏感信息。
- 本阶段未运行 build，因为没有修改代码。

### 下一步建议

下一阶段建议按审计表逐点核对官方导览图和腾讯地图 POI，优先处理南门入园、景区出口、灵山大佛、梵宫、九龙灌浴、五印坛城等关键点位，并为没有腾讯 POI 的内部景点标记人工校验状态。

## 2026-05-28

### 阶段名称

阶段六：POI 分类规则细化

### 本次目标

基于当前 19 个 `lingshanPois` 的名称和 id，细化 POI 分类推断规则，让分类更适合后续地图 Marker、导航点绑定和 3D 资产绑定。

### 本次约束

- 只修改 POI 分类推断逻辑和开发记录。
- 不修改地图页面 UI。
- 不修改 `GuideMapPage.tsx`。
- 不修改路线规划逻辑。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不修改 API Key、`.env` 或任何敏感配置。
- 不新增真实腾讯 POI ID。
- 不修改任何坐标。

### 修改文件清单

- 更新 `src/data/lingshanMapData.ts`
- 更新 `docs/lingshan-poi-binding-audit.md`
- 更新 `docs/map-3d-development-log.md`

### 分类规则说明

本阶段将原先简单的 gate / exit / spot 推断改为可维护的关键词规则表，并新增 `includesAny(...)` 辅助函数。推断时同时检查 `spot.name` 和 `spot.id`。

- `gate`：南门、北门、东门、西门、入园、入口、胜境门楼、门楼。
- `exit`：出口、离园、出园。
- `service`：游客中心、服务中心、咨询、客服、售票、票务。
- `toilet`：厕所、卫生间、洗手间、盥洗。
- `food`：餐厅、素斋、咖啡、茶、饮品、小吃、餐饮。
- `bus`：观光车、车站、候车、接驳、停车。
- `viewpoint`：广场、观景、照壁、景观、平台、眺望。
- `spot`：其他核心景点默认归为景点，例如灵山大佛、九龙灌浴、梵宫、五印坛城、祥符禅寺等。

### 为什么先细化分类而不是直接绑定腾讯 POI

当前还没有经过官方导览图、腾讯地图搜索和现场可达点校验。先细化分类可以为后续 Marker 样式、POI 绑定优先级、导航点校验和 3D 资产归类建立更清晰的基础；直接绑定腾讯 POI ID 可能把未核验的点位关系固化进代码，后续修正成本更高。

### 对现有地图行为的影响

本阶段没有修改地图页面 UI，没有修改 `GuideMapPage.tsx`，没有修改路线规划逻辑，也没有修改任何坐标或新增腾讯 POI ID。当前地图运行行为不变。本阶段没有修改数字人、聊天、语音、RAG、Live2D 相关模块。

### 验证方式

- 检查 `inferPoiCategory(spot)` 使用新的关键词规则并同时检查名称和 id。
- 检查 `docs/lingshan-poi-binding-audit.md` 仍包含 19 个点位。
- 执行 `npm run build` 验证 TypeScript 编译和 Vite 构建。

### npm run build 结果

通过。执行 `npm run build` 后，`tsc -b && vite build` 成功完成。Vite 仍输出部分 chunk 超过 500 kB 的体积提示，这是当前项目打包提示，不影响本阶段构建结果。

### 下一步建议

下一阶段建议按照细化后的分类分批核验：先处理 gate / exit / viewpoint，再处理核心 spot；确认腾讯 POI 是否存在后，再逐步写入 `tencent` 字段并区分 `displayLocation` 与 `navLocation`。

## 2026-05-28

### 阶段名称

阶段七：POI 绑定优先级与导航点策略字段补充

### 本次目标

在 `LingshanPoi` 数据结构中补充绑定优先级、导航点策略、腾讯 POI 需求、独立导航点需求和 3D 资产绑定优先级字段，为后续腾讯 POI 绑定、导航点修正和 3D 资产绑定做准备。

### 本次约束

- 只修改 POI 数据结构、自动生成逻辑和文档。
- 不修改地图页面 UI。
- 不修改 `GuideMapPage.tsx`。
- 不修改路线规划逻辑。
- 不修改任何坐标。
- 不新增真实腾讯 POI ID。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- 更新 `src/data/lingshanMapData.ts`
- 更新 `docs/lingshan-poi-binding-audit.md`
- 更新 `docs/map-3d-development-log.md`

### 新增字段说明

- `bindingPriority`：标记 POI 后续绑定优先级，取值为 `high`、`medium`、`low`。
- `navPointStrategy`：标记导航点修正策略，包括复用展示点、需要入口点、需要最近可步行点、需要人工复核。
- `needsTencentPoi`：标记是否优先查找和绑定腾讯 POI。
- `needsSeparateNavPoint`：标记是否需要将 `navLocation` 与 `displayLocation` 分离。
- `assetBindingPriority`：标记后续 3D/Marker 资产绑定优先级，包括核心 3D、简单 3D 和仅 Marker。

### 推断规则说明

- gate、exit、service、bus 默认为高绑定优先级，且需要最近可步行导航点。
- toilet、food 默认为中绑定优先级，也需要最近可步行导航点。
- 灵山大佛、九龙灌浴、梵宫、五印坛城、祥符禅寺等核心景点为高绑定优先级，需要腾讯 POI 和人工复核导航点。
- 普通 spot 默认为中绑定优先级，策略为入口点优先。
- viewpoint 根据广场、照壁等关键词归为中优先级，默认可先复用展示点。
- 灵山大佛、九龙灌浴、梵宫、五印坛城为 `core_3d`；祥符禅寺、广场、照壁和普通景点为 `simple_3d`；门、出口、服务设施类倾向 `marker_only`。

### 为什么此阶段不直接绑定腾讯 POI

当前仍缺少官方导览图核验、腾讯地图搜索核验和现场可达点确认。直接写入腾讯 POI ID 容易把错误地点固化进数据层。本阶段只增加判断字段，用来指导后续人工核验顺序和导航点拆分策略。

### 对现有地图行为的影响

本阶段只是在数据层增加后续绑定和 3D 构建所需的判断字段，没有新增真实腾讯 POI ID，没有修改任何坐标，没有修改地图页面 UI，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。当前地图运行行为不变。

### 验证方式

- 检查 `LingshanPoi` 类型包含新增字段。
- 检查 `lingshanPois` 自动生成时填充新增字段。
- 检查 POI 审计表仍包含 19 个点位，并展示新增字段。
- 执行 `npm run build` 验证 TypeScript 编译和 Vite 构建。

### npm run build 结果

通过。执行 `npm run build` 后，`tsc -b && vite build` 成功完成。Vite 仍输出部分 chunk 超过 500 kB 的体积提示，这是当前项目打包提示，不影响本阶段构建结果。

### 下一步建议

下一阶段建议按 `bindingPriority` 从高到低处理 POI：先核验 gate、exit、核心景点和 bus/service 类，再处理 viewpoint 和普通 spot；核验后逐步补充 `tencent` 字段，并将需要独立导航点的 POI 拆分 `displayLocation` 与 `navLocation`。

## 2026-05-28

### 阶段名称

阶段八：腾讯 POI 绑定候选清单生成

### 本次目标

基于当前 `lingshanPois` 和 `docs/lingshan-poi-binding-audit.md`，生成腾讯 POI 人工绑定候选清单，用于后续逐个核对腾讯地图地点、确认腾讯 POI 和修正导航点。

### 本次约束

- 只生成/更新文档，不修改功能代码。
- 不修改 `src/data/lingshanMapData.ts`。
- 不修改地图页面 UI。
- 不修改 `GuideMapPage.tsx`。
- 不修改路线规划逻辑。
- 不新增真实腾讯 POI ID。
- 不修改任何坐标。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- 新增 `docs/lingshan-tencent-poi-binding-plan.md`
- 更新 `docs/map-3d-development-log.md`

### 文档内容说明

`docs/lingshan-tencent-poi-binding-plan.md` 包含绑定目标说明、绑定优先级说明、高/中/低优先级 POI 绑定表、人工绑定操作流程建议和后续数据写入规则建议。文档将当前 19 个点位按绑定优先级拆分为 7 个 high、12 个 medium、0 个 low，并为每个候选点提供推荐搜索关键词、建议绑定对象、导航点策略和人工复核备注。

### 为什么本阶段只生成候选清单、不直接写入腾讯 POI ID

腾讯 POI 必须经过人工检索和核验，尤其要确认名称、地址、类别、位置是否处于灵山胜境范围内，以及搜索结果是否适合作为真实导航终点。未经确认的搜索结果直接写入代码会增加导航误导风险。本阶段只生成候选清单，用来指导后续人工绑定腾讯 POI 和修正导航点。

### 对功能代码的影响

本阶段没有修改功能代码，没有新增真实腾讯 POI ID，没有修改任何坐标，没有修改地图页面 UI，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。当前应用运行逻辑不受影响。

### 验证方式

- 检查 `docs/lingshan-tencent-poi-binding-plan.md` 已成功生成。
- 检查文档包含高、中、低优先级 POI 绑定表。
- 检查高优先级 POI 数量为 7，中优先级 POI 数量为 12，低优先级 POI 数量为 0。
- 检查文档未记录任何 API Key、密钥、token、账号或敏感信息。
- 本阶段未运行 build，因为没有修改 TypeScript 或功能代码。

### 下一步建议

下一阶段建议按候选清单从 high 优先级开始人工检索腾讯 POI：先核验南门入园、景区出口、灵山大佛、九龙灌浴、梵宫、五印坛城、祥符禅寺，再处理中优先级广场和普通景点；确认后再单独提交数据层更新任务。

## 2026-05-28

### 阶段名称

阶段九：腾讯 POI 人工绑定结果模板生成

### 本次目标

基于 `docs/lingshan-tencent-poi-binding-plan.md` 和当前 `lingshanPois`，生成腾讯 POI 人工绑定结果填写模板，用于承接后续人工查询腾讯 POI 的结果。

### 本次约束

- 只生成/更新文档，不修改功能代码。
- 不修改 `src/data/lingshanMapData.ts`。
- 不修改 `GuideMapPage.tsx`。
- 不修改路线规划逻辑。
- 不新增真实腾讯 POI ID。
- 不修改任何坐标。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- 新增 `docs/lingshan-tencent-poi-binding-result-template.md`
- 更新 `docs/map-3d-development-log.md`

### 文档内容说明

`docs/lingshan-tencent-poi-binding-result-template.md` 包含填写说明、字段解释、高优先级 POI 结果填写表、中优先级 POI 结果填写表、低优先级说明和后续写入代码前检查清单。模板预置 7 个 high POI、12 个 medium POI，当前无 low POI；腾讯 POI 相关字段均留空，等待人工填写。

### 为什么先生成填写模板、不直接写入代码

腾讯 POI 查询结果需要人工核实名称、地址、类别、坐标和是否适合作为真实导航终点。直接写入代码会把未核实的 POI ID 或不可达坐标固化进数据层。本阶段先生成填写模板，用于规范后续人工记录，再在单独的数据更新任务中写入已确认结果。

### 对功能代码的影响

本阶段没有修改功能代码，没有新增真实腾讯 POI ID，没有修改任何坐标，没有修改地图页面 UI，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。当前应用运行逻辑不受影响。

### 验证方式

- 检查 `docs/lingshan-tencent-poi-binding-result-template.md` 已成功生成。
- 检查高优先级填写表包含 7 个 POI。
- 检查中优先级填写表包含 12 个 POI。
- 检查低优先级填写表说明当前无低优先级 POI。
- 检查文档未记录任何 API Key、密钥、token、账号或敏感信息。
- 本阶段未运行 build，因为没有修改 TypeScript 或功能代码。

### 下一步建议

下一阶段建议人工使用模板逐项填写腾讯 POI 查询结果，并为每条结果补充绑定依据；确认无误后，再创建单独任务将 `tencent` 字段、`bindStatus` 和必要的 `navLocation` 修正写回数据层。
## 2026-05-28 阶段十：Blender 3D 资产清单与交付规范生成

### 本次目标

生成灵山胜境 Blender 3D 资产清单与交付规范，基于当前 `lingshanPois` 的 `assetBindingPriority` 字段梳理 `core_3d`、`simple_3d`、`marker_only` 三类资产，为后续符号化 3D 场景制作提供明确交付标准。

### 本次约束

- 只生成/更新文档，不修改功能代码。
- 不修改 `src/data/lingshanMapData.ts`。
- 不修改 `GuideMapPage.tsx`。
- 不安装 Three.js 或任何新依赖。
- 不新增真实 `.glb`、`.gltf` 或模型文件。
- 不修改地图页面 UI。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `docs/lingshan-blender-asset-plan.md`
- `docs/map-3d-development-log.md`

### 文档内容说明

新增 `docs/lingshan-blender-asset-plan.md`，内容包括：

- 灵山胜境 3D 资产建设目标。
- `core_3d`、`simple_3d`、`marker_only` 资产优先级说明。
- 核心地标模型清单，包括灵山大佛、九龙灌浴、梵宫、五印坛城。
- 简化 3D 资产清单，包括照壁、广场、道路、寺院、殿堂等低模表达对象。
- 暂不制作 3D 模型的 Marker 点位清单。
- 推荐模型目录结构。
- Blender 制作规范，包括单位、原点、朝向、导出格式、模型大小、贴图和命名约束。
- 后续前端接入字段建议。
- 第一批建议制作清单。
- 风险与注意事项。

### 为什么先做 3D 资产规划而不是直接接入 Three.js

当前项目尚未形成真实模型文件、模型命名规范、目录结构、坐标映射规范和资产轻量化标准。如果直接接入 Three.js，容易先把渲染管线做出来，但后续模型文件命名、体量、朝向、比例、材质和加载策略不统一，反而增加返工成本。

本阶段先明确 Blender 资产清单与交付规范，可以让建模、地图数据、前端 Three.js 场景接入三部分先对齐资产边界，后续再按 `poiId` 建立模型映射。

### 对功能代码的影响

本阶段没有修改功能代码，没有新增 3D 模型文件，没有安装 Three.js，没有修改地图页面 UI，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。

### 验证方式

- 已确认 `docs/lingshan-blender-asset-plan.md` 成功生成。
- 已确认文档包含 core_3d、simple_3d、marker_only 三类资产清单。
- 本阶段未修改 TypeScript 或功能代码，因此不运行 `npm run build`。

### 下一步建议

- 基于该规范制作第一批核心 `.glb`：`lingshan_buddha.glb`、`fan_gong.glb`、`jiulong_guanyu.glb`、`wuyin_tancheng.glb`。
- 后续新增 `lingshanAssetMap.ts`，把 `poiId`、模型 URL、缩略图、transform、LOD 和状态字段结构化。
- 在接入 Three.js 前，先完成模型朝向、原点、比例和场景坐标映射方案。

## 2026-05-28 阶段十一：前端 3D 接入方案文档生成

### 本次目标

生成灵山胜境前端 3D 接入方案文档，基于当前 React + Vite 项目、阶段十 Blender 资产规划和现有地图页结构，为后续安装 Three.js、接入 3D 预览组件、连接 POI 与模型资产做准备。

### 本次约束

- 只生成/更新文档，不修改功能代码。
- 不安装 Three.js、`@react-three/fiber`、`@react-three/drei` 或任何新依赖。
- 不新增 3D 组件。
- 不新增 `.glb`、`.gltf` 或模型文件。
- 不修改 `src/data/lingshanMapData.ts`。
- 不修改 `GuideMapPage.tsx`。
- 不修改地图页面 UI。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `docs/lingshan-frontend-3d-integration-plan.md`
- `docs/map-3d-development-log.md`

### 文档内容说明

新增 `docs/lingshan-frontend-3d-integration-plan.md`，内容包括：

- 前端 3D 接入目标：第一阶段只做“灵山符号化 3D 预览面板”。
- 推荐技术栈：`three`、`@react-three/fiber`、`@react-three/drei`、`@types/three`。
- 推荐目录结构：`src/components/scenic3d/`、`src/data/scenic3d/`、`public/models/lingshan/`。
- 资产绑定数据设计：`LingshanAssetStatus` 和 `LingshanAssetBinding`。
- 地图页接入方式：地图 + 3D 预览分栏，不重构主地图逻辑。
- 组件职责说明：`Scenic3DPreview`、`LandmarkModel`、`PlaceholderLandmark`、`RouteRibbon3D`、`Scenic3DControls`。
- 分阶段实施路线。
- 性能和工程注意事项。
- 第一轮代码改造建议。

### 为什么先做接入方案而不是直接安装 Three.js

当前阶段还没有真实 `.glb` 模型、资产映射文件、3D 组件边界和地图联动方案。如果直接安装依赖并写组件，容易把地图页主逻辑、模型加载、占位渲染、性能策略和未来资产规范混在一起。

先形成接入方案，可以明确第一轮代码只做可关闭的 3D 预览面板和 placeholder，不影响腾讯地图 Marker、Polyline、InfoWindow、路线切换，也不触碰 Live2D 数字人链路。

### 对功能代码的影响

本阶段没有修改功能代码，没有安装 Three.js 或任何新依赖，没有新增 3D 组件，没有新增模型文件，没有修改地图页面 UI，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。

### 验证方式

- 已确认 `docs/lingshan-frontend-3d-integration-plan.md` 成功生成。
- 已确认文档包含推荐技术栈、目录结构、资产绑定类型、地图页接入方式、组件职责、分阶段实施路线、性能注意事项和第一轮代码改造建议。
- 本阶段未修改 TypeScript 或功能代码，因此不运行 `npm run build`。

### 下一步建议

- 下一阶段如开始写代码，先安装 `three`、`@react-three/fiber`、`@react-three/drei`、`@types/three`。
- 第一轮只新增空的 `Scenic3DPreview`、`PlaceholderLandmark` 和占位 `lingshanAssetMap.ts`。
- 先以可关闭面板接入 `GuideMapPage.tsx`，不加载真实 `.glb`，并确保 `npm run build` 通过。

## 2026-05-28 阶段十二 A：3D 依赖安装与构建验证

### 本次目标

为前端 3D 能力做准备，只安装 Three.js / React Three Fiber 相关依赖，并验证当前 React + Vite 项目可以通过 `npm run build`。

### 本次约束

- 只安装 3D 相关依赖。
- 不新增组件。
- 不新增页面。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `App.tsx` 或路由。
- 不修改地图路线逻辑。
- 不新增真实 `.glb`、`.gltf` 或模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`，不触碰上层无关 `.env` 或 Fay 配置。

### 修改文件清单

- `package.json`
- `package-lock.json`
- `docs/map-3d-development-log.md`

### 安装依赖说明

安装 dependencies：

- `three@^0.184.0`
- `@react-three/fiber@^8.18.0`
- `@react-three/drei@^9.122.0`

安装 devDependencies：

- `@types/three@^0.184.1`

首次直接安装最新 `@react-three/fiber` 时，npm 解析到 9.x，要求 React 19；当前项目使用 React 18.3.1，因此改为安装兼容 React 18 的 `@react-three/fiber@8` 与 `@react-three/drei@9`。安装过程中 npm 还暴露了项目既有的 Ant Design peer dependency 冲突，因此使用 `--legacy-peer-deps` 保持现有依赖解析策略。

安装过程中出现过一次 `ECONNRESET` 网络中断，重试后安装成功。

### 为什么先只安装依赖、不新增组件

当前阶段的目标是验证依赖层是否能与现有 React + Vite + TypeScript 项目共存。如果同时新增 3D 组件和页面接入，构建失败时难以区分是依赖兼容问题、组件实现问题还是页面接入问题。先只安装依赖，可以把风险收敛在依赖树和构建链路。

### 对现有功能的影响

本阶段没有新增 3D 组件，没有修改 `GuideMapPage.tsx`，没有修改地图页面 UI，没有修改地图路线逻辑，没有新增模型文件，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。

### 验证方式

- 使用项目现有 npm 包管理器安装依赖。
- 运行 `npm run build`。

### npm run build 结果

`npm run build` 通过。

构建输出中存在 Vite chunk size warning：`dist/assets/index-*.js` 超过 500 kB。这是构建体积提示，不是失败；本阶段未做代码拆分或构建优化。

### 下一步建议

- 阶段十二 B 可新增空的 `Scenic3DPreview.tsx` 和 `PlaceholderLandmark.tsx`，不接入真实 `.glb`。
- 如接入页面，优先使用可关闭的 3D 预览面板，避免影响腾讯地图主流程。
- 后续真实模型加载前，先建立 `lingshanAssetMap.ts` 占位数据和懒加载策略。

## 2026-05-28 阶段十二 B：独立 3D 占位组件新增

### 本次目标

新增一个可编译、可复用、但暂未接入页面的灵山 3D 预览组件。组件当前只显示低模 placeholder，不加载真实模型，为后续接入地图页和替换 Blender `.glb` 资产做准备。

### 本次约束

- 新增 3D 占位组件文件。
- 新增 3D 资产映射占位数据文件。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `App.tsx` 或路由。
- 不修改任何现有页面。
- 不修改地图路线逻辑。
- 不新增真实 `.glb`、`.gltf` 或模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`，不触碰上层无关 `.env` 或 Fay 配置。

### 修改文件清单

- `src/components/scenic3d/Scenic3DPreview.tsx`
- `src/components/scenic3d/PlaceholderLandmark.tsx`
- `src/data/scenic3d/lingshanAssetMap.ts`
- `docs/map-3d-development-log.md`

### 新增资产映射说明

新增 `src/data/scenic3d/lingshanAssetMap.ts`，定义：

- `LingshanAssetStatus`
- `LingshanAssetBinding`
- `lingshanAssetMap`

当前先放入 4 个 core_3d 占位点位：

- `giant_buddha`
- `jiulong_guanyu`
- `fan_gong`
- `wuyin_tancheng`

这些资产的 `status` 均为 `placeholder`，暂不填写 `modelUrl`，不依赖真实模型文件。`transform` 只提供简单位置、旋转和缩放，用于后续独立预览组件验证。

### 新增组件说明

新增 `PlaceholderLandmark.tsx`：

- 接收 `poiId` 和 `active`。
- 使用 React Three Fiber JSX 元素渲染低模占位。
- `giant_buddha` 使用圆柱基座和简化竖向轮廓。
- `jiulong_guanyu` 使用圆形水池和中心莲台。
- `fan_gong` 使用盒体和穹顶占位。
- `wuyin_tancheng` 使用多层圆柱结构。
- 其他 POI 使用普通盒体。
- 不加载贴图，不使用复杂动画。

新增 `Scenic3DPreview.tsx`：

- 接收 `selectedPoiId` 和 `height`。
- 内部使用 `Canvas`。
- 添加基础相机、`ambientLight`、`directionalLight` 和 `OrbitControls`。
- 根据 `selectedPoiId` 显示 `PlaceholderLandmark`。
- `selectedPoiId` 为空时默认显示 `giant_buddha`。
- 只使用 inline style 保证独立使用时有高度。
- 不依赖 `GuideMapPage`、Ant Design 或数字人组件。

### 为什么本阶段仍不接入 GuideMapPage

本阶段目标是先验证 3D 组件本身可以在当前 React + Vite + TypeScript 项目中编译通过。暂不接入 `GuideMapPage`，可以避免把 3D Canvas、地图交互、POI 选择状态和页面布局问题混在一起，后续再单独处理页面接入与交互联动。

### 对现有地图行为的影响

本阶段没有修改 `GuideMapPage.tsx`，没有接入地图页面 UI，没有修改 Marker、Polyline、InfoWindow、路线切换或路线规划逻辑。当前地图行为不受影响。

本阶段没有新增真实 `.glb`、`.gltf` 模型，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。

### 验证方式

- 检查新增 3D 资产映射和组件文件。
- 运行 `npm run build`。

### npm run build 结果

`npm run build` 通过。

构建输出中仍存在 Vite chunk size warning：`dist/assets/index-*.js` 超过 500 kB。这是构建体积提示，不是失败；本阶段未做代码拆分或构建优化。

### 下一步建议

- 阶段十二 C 可新增页面接入前的轻量导出或 Story/本地验证入口，但仍建议避免直接改动地图主逻辑。
- 后续接入 `GuideMapPage` 时，使用可关闭的右侧或底部 3D 面板。
- 接入真实 `.glb` 前，先保持 placeholder 链路稳定，再逐个替换核心地标模型。

## 2026-05-28 阶段十三：独立 3D 预览测试页新增

### 本次目标

新增独立 3D 预览测试页，用于在浏览器中验证 `Scenic3DPreview` 是否能正常渲染和切换 POI，占位模型是否可见，`OrbitControls` 是否可用。本阶段不接入 `GuideMapPage`。

### 本次约束

- 新增一个独立 3D 测试页。
- 在路由中新增测试路由。
- 不修改 `GuideMapPage.tsx`。
- 不修改地图路线逻辑。
- 不接入地图页面 UI。
- 不新增真实 `.glb`、`.gltf` 或模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`，不触碰上层无关 `.env` 或 Fay 配置。

### 修改文件清单

- `src/pages/Scenic3DPreviewPage.tsx`
- `src/App.tsx`
- `docs/map-3d-development-log.md`

### 新增页面说明

新增 `src/pages/Scenic3DPreviewPage.tsx`：

- 使用已有 `Scenic3DPreview` 组件。
- 不引入数字人组件。
- 不引入地图组件。
- 页面标题为“灵山 3D 预览测试页”。
- 默认选中 `giant_buddha`。
- 提供 4 个按钮切换 `selectedPoiId`：
  - `giant_buddha`
  - `jiulong_guanyu`
  - `fan_gong`
  - `wuyin_tancheng`
- 页面展示当前 `selectedPoiId`。
- 3D 预览区域高度为 520px。
- 使用简单 inline style，不依赖复杂 UI。

### 路由说明

在 `src/App.tsx` 中新增测试路由：

- `/three-preview`

该路由指向 `Scenic3DPreviewPage`。本次没有改变已有首页、地图页、景点页、数字人相关页面行为。移动端分支也为 `/three-preview` 保留独立测试路由，其他移动端路径仍按原逻辑进入 `MobileShell`。

### 为什么先做独立测试页而不是接入 GuideMapPage

独立测试页可以先验证 3D Canvas、占位模型、POI 切换和 `OrbitControls` 的基本可用性。这样后续接入 `GuideMapPage` 时，可以把风险集中在地图选中状态、布局和交互联动，而不是同时排查 3D 渲染基础问题。

### 对现有地图行为的影响

本阶段没有修改 `GuideMapPage.tsx`，没有接入地图页面 UI，没有修改地图路线逻辑，没有新增真实 `.glb`、`.gltf` 模型，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。现有地图 Marker、Polyline、InfoWindow 和路线切换逻辑不受影响。

### 验证方式

- 检查 `/three-preview` 路由已添加。
- 检查测试页包含 4 个 POI 切换按钮。
- 运行 `npm run build`。

### npm run build 结果

`npm run build` 通过。

构建输出中仍存在 Vite chunk size warning：`dist/assets/index-*.js` 超过 500 kB。这是构建体积提示，不是失败；本阶段未做代码拆分或构建优化。

### 下一步建议

- 可运行本地 dev server，手动打开 `/three-preview` 验证 Canvas、切换按钮和 OrbitControls。
- 下一阶段如接入 `GuideMapPage`，建议使用可关闭的 3D 预览面板，并将地图选中 POI 映射到 `Scenic3DPreview` 的 `selectedPoiId`。
- 接入真实模型前，继续保持 placeholder 兜底，避免模型资源缺失导致页面不可用。

## 2026-05-28 阶段十四：独立 3D 预览测试页轻量优化

### 本次目标

把 `/three-preview` 从简单工程测试页优化成更适合展示和检查 3D 资产的预览页面，提升核心 POI 切换、占位模型辨识度和预览区域观感。本阶段仍不接入地图页。

### 本次约束

- 只优化 `/three-preview` 测试页和相关 3D 预览体验。
- 不修改 `GuideMapPage.tsx`。
- 不修改地图路线逻辑。
- 不接入地图页面 UI。
- 不新增真实 `.glb`、`.gltf` 或模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`，不触碰上层无关 `.env` 或 Fay 配置。

### 修改文件清单

- `src/pages/Scenic3DPreviewPage.tsx`
- `src/components/scenic3d/Scenic3DPreview.tsx`
- `src/components/scenic3d/PlaceholderLandmark.tsx`
- `docs/map-3d-development-log.md`

### 页面优化说明

`Scenic3DPreviewPage.tsx` 改为左右布局：

- 顶部标题改为“灵山胜境 3D 资产预览测试页”。
- 左侧为 4 个核心 POI 选择列表：
  - `giant_buddha`：灵山大佛
  - `jiulong_guanyu`：九龙灌浴
  - `fan_gong`：梵宫
  - `wuyin_tancheng`：五印坛城
- 每个条目显示中文名称、`poiId`、当前状态 `placeholder` 和简短说明。
- 右侧显示当前选中名称、当前 `selectedPoiId`、`Scenic3DPreview` 和提示文案。
- 3D 预览区域高度调整为 560px，更适合查看占位模型。

### 组件优化说明

`Scenic3DPreview.tsx`：

- 保持独立可复用，不依赖地图页。
- 预览容器背景改为浅色展陈风格。
- Canvas 内增加基础雾效、半球光、辅助方向光和圆形地台。
- 保留 `OrbitControls`。
- 不加载真实模型文件。

`PlaceholderLandmark.tsx`：

- 轻量增强四个核心占位模型的形态差异。
- 灵山大佛增加前平台。
- 九龙灌浴增加环形锥体，强化水景中心结构。
- 梵宫增加两侧建筑体块。
- 五印坛城增加塔顶和中心竖向结构。
- 不使用复杂动画，不使用贴图，不引入额外依赖。

### 为什么仍不接入 GuideMapPage

本阶段目标是把独立测试页打磨到可以用于检查 3D 占位资产和交互。暂不接入 `GuideMapPage`，可以继续避免 3D 展示、地图选中状态、路线逻辑和页面布局相互影响。后续接入地图页时，只需要把已验证的 `Scenic3DPreview` 作为可关闭面板接入。

### 对现有地图行为的影响

本阶段没有修改 `GuideMapPage.tsx`，没有接入地图页面 UI，没有修改地图路线逻辑，没有新增真实 `.glb`、`.gltf` 模型，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。现有地图行为不受影响。

### 验证方式

- 检查 `/three-preview` 页面布局和 POI 列表代码。
- 检查 `Scenic3DPreview` 仍独立于地图页。
- 检查 `PlaceholderLandmark` 不加载贴图和真实模型。
- 运行 `npm run build`。

### npm run build 结果

`npm run build` 通过。

构建输出中仍存在 Vite chunk size warning：`dist/assets/index-*.js` 超过 500 kB。这是构建体积提示，不是失败；本阶段未做代码拆分或构建优化。

### 下一步建议

- 启动 dev server 后打开 `/three-preview`，手动检查四个 POI 的模型可见性和 OrbitControls 操作体验。
- 下一阶段可以考虑给 `/three-preview` 增加截图检查或更明确的资产状态说明。
- 接入 `GuideMapPage` 前，先确认移动端和小屏布局是否需要单独处理。

## 2026-05-29 阶段十五：3D 预览测试页懒加载优化

### 本次目标

优化 `/three-preview` 路由加载方式，让 `Scenic3DPreviewPage` 通过 `React.lazy` 和 `Suspense` 懒加载，避免 Three.js 相关代码直接进入主入口包。

### 本次约束

- 只优化 `/three-preview` 路由加载方式。
- 不修改 `GuideMapPage.tsx`。
- 不接入地图页面 UI。
- 不修改地图路线逻辑。
- 不新增真实 `.glb`、`.gltf` 或模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`，不触碰上层无关 `.env` 或 Fay 配置。

### 修改文件清单

- `src/App.tsx`
- `docs/map-3d-development-log.md`

### 懒加载实现方式

`src/App.tsx` 中将原来的静态导入：

```ts
import Scenic3DPreviewPage from './pages/Scenic3DPreviewPage'
```

改为：

```ts
const Scenic3DPreviewPage = lazy(() => import('./pages/Scenic3DPreviewPage'))
```

并新增 `ThreePreviewRoute`，只在 `/three-preview` 路由 element 内使用 `Suspense` 包裹测试页，fallback 为“正在加载 3D 预览...”。没有重构整个路由系统。

`/three-preview` 路径保持不变。桌面端和移动端分支均继续保留 `/three-preview` 独立测试路由。

### 为什么要先优化 3D 页面加载方式再接入 GuideMapPage

Three.js、React Three Fiber 和 Drei 会显著增加前端包体积。先把独立 3D 测试页改成懒加载，可以验证 3D 代码能够从主入口拆出，降低后续接入地图页时对首页、地图页和数字人相关页面首屏加载的影响。

本阶段先解决加载边界，再考虑地图页接入，可以避免把性能问题、地图交互问题和 3D 渲染问题混在一起。

### 对现有地图行为的影响

本阶段没有修改 `GuideMapPage.tsx`，没有接入地图页面 UI，没有修改地图路线逻辑，没有新增真实 `.glb`、`.gltf` 模型，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。

现有地图 Marker、Polyline、InfoWindow、路线切换和腾讯地图逻辑不受影响。

### 验证方式

- 检查 `src/App.tsx` 中 `/three-preview` 使用 `lazy` 和 `Suspense`。
- 运行 `npm run build`。
- 检查构建产物中出现独立 `Scenic3DPreviewPage-*.js` chunk。

### npm run build 结果

`npm run build` 通过。

构建结果生成独立 chunk：

- `dist/assets/Scenic3DPreviewPage-*.js`

主入口 `dist/assets/index-*.js` 约 2.63 MB，3D 测试页 chunk 约 891.86 kB。构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/three-preview`，确认懒加载 fallback 和 3D 预览页面正常。
- 后续如接入 `GuideMapPage`，继续保持 3D 面板懒加载，避免地图主流程首屏直接加载 Three.js。
- 可进一步考虑将 Drei/Three 相关逻辑集中在 3D 组件边界内，避免普通页面误引入 3D 依赖。

## 2026-05-29 阶段十六：地图页可开关 3D 预览面板接入

### 本次目标

将已有独立 3D 预览能力以可开关面板形式接入 `GuideMapPage`，让地图页可以预览当前选中景点对应的低模占位模型，为后续地图点位与 Blender 资产绑定做准备。

### 本次约束

- 只在地图页中接入一个可开关的 3D 预览面板。
- 3D 面板默认关闭。
- 只有用户点击打开时才显示 3D 预览。
- 不修改地图路线规划逻辑。
- 不修改 Marker、Polyline、InfoWindow 的核心逻辑。
- 不新增真实 `.glb`、`.gltf` 或模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`，不触碰上层无关 `.env` 或 Fay 配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### GuideMapPage 接入方式说明

在 `GuideMapPage.tsx` 中新增本地状态：

```ts
const [show3DPreview, setShow3DPreview] = useState(false)
```

默认值为 `false`。在现有景点抽屉操作区增加按钮：

- `打开 3D 预览`
- `关闭 3D 预览`

当 `show3DPreview` 为 `true` 时，在景点抽屉内部显示 3D 面板。面板包含：

- 标题：灵山 3D 预览。
- 当前景点名称。
- `Scenic3DPreview` 组件。
- 提示文字：当前为低模占位预览，后续可替换为 Blender 导出的 `.glb` 模型。

`Scenic3DPreview` 的 `selectedPoiId` 使用当前 `selectedSpot.id`，高度为 320px。

### 懒加载实现说明

本阶段没有静态导入 `Scenic3DPreview`，而是使用：

```ts
const Scenic3DPreview = lazy(() => import('../components/scenic3d/Scenic3DPreview'))
```

3D 面板内容使用 `Suspense` 包裹，fallback 为“正在加载 3D 预览...”。构建后生成独立 `Scenic3DPreview-*.js` chunk。

### 为什么 3D 面板默认关闭

Three.js、React Three Fiber 和 Drei 相关代码体积较大。默认关闭可以避免地图页初始交互被 3D 预览影响，也能确保游客进入地图页时仍优先看到腾讯地图、路线、Marker、InfoWindow 和景点抽屉。用户明确点击后才加载和显示 3D 预览，更符合当前阶段的试验性质。

### 对现有地图行为的影响

本阶段没有修改地图路线规划逻辑，没有修改 Marker、Polyline、InfoWindow 的核心逻辑，没有修改地图初始化参数，没有修改导航/讲解页面跳转，也没有新增真实 `.glb`、`.gltf` 模型。

本阶段没有修改数字人、聊天、语音、RAG、Live2D 相关模块。现有地图导览主流程不受影响。

### 验证方式

- 检查 `GuideMapPage.tsx` 中 `Scenic3DPreview` 使用 `lazy` 动态导入。
- 检查 3D 面板默认关闭。
- 检查按钮可切换显示状态。
- 运行 `npm run build`。
- 检查构建产物中出现独立 `Scenic3DPreview-*.js` chunk。

### npm run build 结果

`npm run build` 通过。

构建结果生成独立 chunk：

- `dist/assets/Scenic3DPreview-*.js`

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/map`，确认默认不显示 3D 面板。
- 点击“打开 3D 预览”，确认低模占位模型可见且不会影响地图 Marker、Polyline、InfoWindow 和路线切换。
- 后续可为 `lingshanAssetMap` 扩展更多 POI 映射，逐步把真实 `.glb` 模型替换到核心景点。

## 2026-05-29 阶段十六回滚：撤掉地图页 3D 小面板

### 本次目标

撤掉 `/map` 页面中阶段十六接入的 3D 预览小面板，让地图页恢复为腾讯地图导览主流程，同时保留独立 3D 测试页和已有 3D 基础能力。

### 本次约束

- 只撤掉 `/map` 页面里的 3D 预览小面板。
- 不删除 `/three-preview` 测试页。
- 不删除 `Scenic3DPreview`、`PlaceholderLandmark`、`lingshanAssetMap`。
- 不卸载 `three`、`@react-three/fiber`、`@react-three/drei`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 POI 数据层。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不读取、不输出、不修改 API Key、`.env` 或敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 为什么撤掉地图页 3D 小面板

阶段十六的小面板验证了 3D 预览可以接入地图页，但它仍然属于附加浮层能力。当前更清晰的方向是把 3D 能力从普通地图导览页中拆出来，后续新增独立的沉浸式 `/scenic-3d-map` 页面，避免在 `/map` 中混合腾讯地图导览、景点抽屉、数字人讲解入口和 3D 场景预览。

撤掉小面板后，`/map` 可以继续专注腾讯地图、路线、POI 和讲解入口，3D 资产验证继续通过独立页面承载。

### 保留了哪些 3D 基础能力

- 保留 `/three-preview` 作为 3D 资产测试页。
- 保留 Three.js 相关依赖。
- 保留 `Scenic3DPreview` 组件。
- 保留 `PlaceholderLandmark` 低模占位组件。
- 保留 `src/data/scenic3d/lingshanAssetMap.ts` 资产映射占位数据。
- 保留 `/three-preview` 的懒加载路由。

### 对 /map 的影响

已从 `GuideMapPage.tsx` 撤掉：

- `Scenic3DPreview` 的 `lazy` import。
- 3D 面板相关 `Suspense`。
- `show3DPreview` 状态。
- 打开/关闭 3D 预览按钮。
- 3D 预览面板 UI。
- 将 `selectedSpot.id` 传给 `Scenic3DPreview` 的逻辑。

保留原腾讯地图初始化、Marker、Polyline、InfoWindow、路线切换、看全线、预设路线开关逻辑、`buildWalkingRoute` 兜底逻辑和景点点击跳转逻辑。

### 对 /three-preview 的影响

无影响。`/three-preview` 仍保留为独立 3D 资产测试页，并继续通过懒加载方式加载 3D 预览能力。

### npm run build 结果

`npm run build` 通过。

构建结果仍生成独立 `Scenic3DPreviewPage-*.js` chunk，说明 `/three-preview` 测试页和 3D 基础能力仍保留。构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 后续不要再把 3D 小面板直接塞回 `/map`。
- 新增独立沉浸式 `/scenic-3d-map` 页面，专门承载 3D 场景、路线 Ribbon、资产 POI 绑定和场景交互。
- `/map` 继续保持腾讯地图导览主流程，真实导航仍以腾讯地图和 `navLocation` 为准。

## 2026-05-29 阶段十七：全屏沉浸式 3D 景区地图原型页新增

### 本次目标

新增独立的 `/scenic-3d-map` 页面，作为灵山胜境艺术化 3D 景区地图原型。该页面不替换 `/map`，而是用于验证类似酒庄探索地图/水墨杭州风格的全屏 3D 景区导览方向。

### 本次约束

- 新增一个全屏 3D 景区地图原型页。
- 新增沉浸式 3D 场景组件。
- 使用现有 `lingshanPois` 和 `lingshanAssetMap` 数据。
- 不替换 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不删除 `/three-preview`。
- 不修改腾讯地图路线规划逻辑。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `src/App.tsx`
- `docs/map-3d-development-log.md`

### 为什么从小面板转向全屏 3D 景区地图

阶段十六的小面板更适合验证 3D 预览能否嵌入地图页，但不适合承载完整的艺术化景区导览体验。全屏 3D 地图可以把地形、水面、远山、路线、景点标签和模型占位组织成一个完整主视觉，避免与腾讯地图真实导览页争夺空间和交互焦点。

因此本阶段将 3D 方向拆成独立页面：`/map` 继续负责真实腾讯地图导览，`/scenic-3d-map` 负责艺术化 3D 景区地图原型。

### 新增 Scenic3DMapScene 说明

新增 `src/components/scenic3d/Scenic3DMapScene.tsx`：

- 使用 `Canvas` 渲染全屏 3D 场景。
- 不依赖腾讯地图对象。
- 不依赖数字人组件。
- 不加载真实 `.glb`。
- 不加载贴图。
- 复用 `lingshanPois` 获取核心景点名称。
- 复用 `lingshanAssetMap` 获取核心 3D POI。
- 包含大面积地形底盘、太湖/水面意象区域、远景山体、淡色雾效、半球光和方向光。
- 放置 4 个核心低模 placeholder：
  - `giant_buddha`
  - `jiulong_guanyu`
  - `fan_gong`
  - `wuyin_tancheng`
- 使用金色路线曲线作为艺术化路线占位。
- 使用 `Html` 标签显示景点名称。
- 支持 `OrbitControls`。
- 支持 `selectedPoiId` 和 `onSelectPoi`，点击模型或标签可切换高亮。

### 新增 /scenic-3d-map 页面说明

新增 `src/pages/Scenic3DMapPage.tsx`：

- 全屏展示 3D 景区地图。
- 页面标题为“灵山胜境 3D 导览地图”。
- 左侧浮层显示 4 个核心景点列表：
  - 灵山大佛
  - 九龙灌浴
  - 梵宫
  - 五印坛城
- 点击列表项会更新 `selectedPoiId`，并高亮 3D 场景中的对应模型。
- 右下角信息浮层显示当前景点名称、`poiId`、低模占位说明和真实导航提示。
- 提供“返回真实地图”按钮，点击后跳转到 `/map`。

### 与腾讯地图 /map 的关系

`/scenic-3d-map` 是独立艺术化 3D 导览原型，不替换 `/map`。真实 POI、真实导航、路线规划、腾讯地图底图和 `navLocation` 仍以 `/map` 为准。

`/map` 是真实导览页，`/three-preview` 是单资产测试页，`/scenic-3d-map` 是全屏艺术化 3D 景区地图原型页。

### 对现有地图行为的影响

本阶段没有修改 `GuideMapPage.tsx`，没有修改腾讯地图路线规划逻辑，没有新增真实 `.glb`、`.gltf` 模型，也没有修改数字人、聊天、语音、RAG、Live2D 相关模块。

现有 `/map`、`/three-preview`、首页和景点页路由行为保持不变。

### 验证方式

- 检查新增 `Scenic3DMapScene.tsx` 和 `Scenic3DMapPage.tsx`。
- 检查 `src/App.tsx` 中新增 `/scenic-3d-map` 懒加载路由。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建结果生成独立 `Scenic3DMapPage-*.js` chunk。构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/scenic-3d-map`，检查全屏布局、OrbitControls、POI 列表切换、模型高亮和返回真实地图按钮。
- 后续可继续增加水墨风格层次、路线 Ribbon、区域雾效和更多 POI。
- 在接入真实 `.glb` 前，继续保持 placeholder 兜底。
- 后续真实导航仍应以腾讯地图 POI 与 `navLocation` 为准。

## 2026-05-29 阶段十八：3D 景点 scenePosition 数据化

### 本次目标

将沉浸式 3D 景区地图中的核心景点位置改为数据驱动，为后续路线、导航和 Blender 模型绑定打基础。本阶段让 `/scenic-3d-map` 中 4 个核心 POI 的摆放位置来自 `lingshanPois.scenePosition`，而不是写死在 `Scenic3DMapScene.tsx` 中。

### 本次约束

- 只处理 3D 场景位置数据化。
- 不替换 `/map`。
- 不修改腾讯地图路线规划逻辑。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/data/lingshanMapData.ts`
- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `docs/map-3d-development-log.md`

### scenePosition 字段说明

为 4 个核心 POI 补充 `scenePosition`：

- `giant_buddha`
- `jiulong_guanyu`
- `fan_gong`
- `wuyin_tancheng`

`scenePosition` 结构为：

```ts
scenePosition: { x: number; y: number; z: number }
```

本阶段没有修改 `displayLocation`、`navLocation`、腾讯 POI 字段或 `bindStatus`。

### 为什么 scenePosition 不等于经纬度

`scenePosition` 是艺术化 3D 场景坐标，用于 Three.js 场景中的视觉摆放，不是经纬度，也不用于真实导航。真实地图展示、真实路线规划和导航点仍以腾讯地图、`displayLocation`、`navLocation` 和后续人工 POI 绑定结果为准。

将它独立出来，可以让 3D 场景根据视觉构图调整位置，同时不污染真实地理数据。

### Scenic3DMapScene 如何从数据层读取位置

`Scenic3DMapScene.tsx` 现在通过 `lingshanPois.find((poi) => poi.id === poiId)?.scenePosition` 读取 POI 的 3D 场景坐标。

如果某个 POI 暂时没有 `scenePosition`，组件会使用 `landmarkFallbackLayout` 中的 fallback 位置，避免页面报错。

场景中的金色路线曲线也改为基于核心 POI 的 `scenePosition` 生成关键节点，同时保留地形底盘、水面意象、山体、雾效、景点标签、`OrbitControls` 和 selectedPoiId 高亮逻辑。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 的 4 个核心低模地标位置现在由 `lingshanPois.scenePosition` 驱动。页面仍保持全屏艺术化 3D 景区地图原型，不加载真实 `.glb` 模型。

### 对 /map 的影响

本阶段没有修改 `/map`，没有修改 `GuideMapPage.tsx`，没有修改腾讯地图路线规划逻辑，也没有影响 Marker、Polyline、InfoWindow 或腾讯地图初始化。

### 验证方式

- 检查 4 个核心 POI 已生成 `scenePosition`。
- 检查 `Scenic3DMapScene.tsx` 从 `lingshanPois` 读取 `scenePosition`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/scenic-3d-map`，确认 4 个核心 POI 的空间分布符合艺术化导览预期。
- 后续可将艺术化路线 Ribbon 的控制点也抽到数据层。
- 后续真实 `.glb` 接入时，通过 `poiId` 同时关联 `scenePosition`、模型 URL、缩放和旋转。

## 2026-05-29 阶段十九：3D 导览路线数据化

### 本次目标

为 `/scenic-3d-map` 增加明确的 3D 导览路线数据结构，让 3D 场景中的金色路线曲线和页面路线站点列表都由同一份 `poiSequence` 驱动。

### 本次约束

- 只处理 `/scenic-3d-map` 的 3D 路线数据化与展示。
- 不替换 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/data/lingshanMapData.ts`
- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### LingshanSceneRoute 说明

新增类型：

```ts
export type LingshanSceneRoute = {
  id: string
  name: string
  description: string
  poiSequence: string[]
}
```

新增 `lingshanSceneRoutes`，当前包含一条 3D 原型路线：

- `id`: `classic_3d_scene`
- `name`: `灵山经典 3D 导览线`
- `description`: `以灵山大佛、九龙灌浴、梵宫、五印坛城为核心的艺术化 3D 导览路线。`
- `poiSequence`: `['jiulong_guanyu', 'giant_buddha', 'fan_gong', 'wuyin_tancheng']`

`poiSequence` 使用 `lingshanPois.id`，用于连接 3D 路线、景点数据和场景坐标。

### poiSequence 如何连接 lingshanPois.scenePosition

`Scenic3DMapScene` 新增 `routePoiSequence?: string[]`。组件会根据 `routePoiSequence` 查找 `lingshanPois` 中对应 POI 的 `scenePosition`，再生成金色 3D 路线曲线。

如果 `routePoiSequence` 为空，或者有效点位不足 2 个，则回退到默认核心点顺序：

- `jiulong_guanyu`
- `giant_buddha`
- `fan_gong`
- `wuyin_tancheng`

这样 3D 路线、场景地标和页面站点列表都通过 `poiId` 连接到同一批 POI 数据。

### 为什么 3D 路线不等于真实步行路线

`lingshanSceneRoutes` 是艺术化 3D 导览路线，用于控制全屏 3D 场景中的视觉叙事顺序和路线 Ribbon，不直接代表真实园区步行道路。

真实路线规划、导航终点、POI 校准和兜底逻辑仍属于 `/map` 的腾讯地图导览体系。后续可以再把 `lingshanSceneRoutes` 与 `guideRoutes`、真实园区步道折线或人工导航点建立关联。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 现在读取 `lingshanSceneRoutes[0]` 作为当前 3D 导览路线，并将 `currentRoute.poiSequence` 传给 `Scenic3DMapScene`。

页面左侧浮层显示当前路线名称、路线说明和路线站点列表。点击站点会更新 `selectedPoiId`，并高亮场景中的对应模型。

### 对 /map 的影响

本阶段没有修改 `/map`，没有修改 `GuideMapPage.tsx`，没有修改腾讯地图路线规划逻辑，也没有影响 Marker、Polyline、InfoWindow、路线切换或腾讯地图初始化。

### 验证方式

- 检查 `lingshanMapData.ts` 已导出 `LingshanSceneRoute` 和 `lingshanSceneRoutes`。
- 检查 `Scenic3DMapScene` 通过 `routePoiSequence` 生成路线。
- 检查 `/scenic-3d-map` 页面显示路线名称、说明和站点列表。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/scenic-3d-map`，检查站点列表顺序、路线曲线和模型高亮是否一致。
- 后续可为 `LingshanSceneRoute` 增加路线主题、颜色、控制点或停留讲解文案。
- 后续可将 3D 艺术路线与真实 `guideRoutes` 或园区步道折线建立映射，但不要让它替代腾讯地图真实导航。

## 2026-05-29 阶段二十：3D 地图跳转真实地图参数入口

### 本次目标

在 `/scenic-3d-map` 中增加跳转真实腾讯地图页 `/map` 的参数入口，让 3D 地图可以向真实地图传递当前景点或当前 3D 路线意图，为后续 `/map` 聚焦真实 POI 做准备。

### 本次约束

- 只修改 `/scenic-3d-map` 页面跳转真实地图的入口逻辑。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### 新增跳转入口说明

在 `/scenic-3d-map` 的右下信息卡中新增两个真实地图入口：

- `查看该景点真实地图`
- `查看整条路线真实地图`

同时保留原有 `返回真实地图` 普通入口。

页面提示文案也进一步明确：3D 地图为艺术化导览，真实定位和导航以腾讯地图页 POI 与 `navLocation` 为准。

### /map?poi=xxx 的作用

点击 `查看该景点真实地图` 时，会跳转到：

```text
/map?poi=<selectedPoiId>
```

例如：

```text
/map?poi=giant_buddha
```

该参数用于表达“希望真实地图聚焦某个 POI”的意图。本阶段只负责从 3D 地图传出参数，暂不要求 `/map` 解析。

### /map?sceneRoute=xxx 的作用

点击 `查看整条路线真实地图` 时，会跳转到：

```text
/map?sceneRoute=<currentSceneRoute.id>
```

例如：

```text
/map?sceneRoute=classic_3d_scene
```

该参数用于表达“希望真实地图理解当前 3D 场景路线”的意图。后续可以把 `sceneRoute` 映射到 `guideRoutes` 或真实园区路线。

### 为什么本阶段不让 /map 解析参数

当前任务只建立从 3D 地图到真实地图的跳转意图，不改变 `/map` 的腾讯地图导览行为。让 `/map` 解析 `poi` 或 `sceneRoute` 会涉及选中点初始化、路线切换、地图聚焦、InfoWindow 展示和可能的 route 映射，应该放到独立阶段处理，避免本阶段影响真实地图主流程。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 现在可以：

- 从当前选中的 3D 景点跳转到 `/map?poi=<selectedPoiId>`。
- 从当前 3D 导览路线跳转到 `/map?sceneRoute=<currentSceneRoute.id>`。
- 继续保留路线站点列表、`selectedPoiId` 高亮和 `Scenic3DMapScene` 的 `routePoiSequence` 传参。

### 对 /map 的影响

本阶段没有修改 `/map`，没有修改 `GuideMapPage.tsx`，没有修改腾讯地图路线规划逻辑，也没有影响 Marker、Polyline、InfoWindow、路线切换或腾讯地图初始化。

当前 `/map` 是否解析 `poi` 或 `sceneRoute` 参数，留到下一阶段实现。

### 验证方式

- 检查 `Scenic3DMapPage.tsx` 中两个新按钮的 `navigate` 目标。
- 检查未修改 `/map` 和 `GuideMapPage.tsx`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 下一阶段可让 `/map` 读取 `poi` 参数，初始化 `selectedSpotId` 并聚焦对应 Marker/InfoWindow。
- 再下一步可让 `/map` 读取 `sceneRoute` 参数，并映射到真实 `guideRoutes` 或园区路线。
- 继续保持 3D 艺术路线和真实腾讯地图导航的职责边界。

## 2026-05-29 阶段二十一：真实地图 poi 查询参数聚焦

### 本次目标

让 `/map` 读取 `/scenic-3d-map` 传入的查询参数，支持 `/map?poi=<spotId>` 自动选中并聚焦对应景点，打通 3D 艺术地图到真实腾讯地图的 POI 聚焦闭环。

### 本次约束

- 修改 `GuideMapPage.tsx` 以读取查询参数。
- 支持 `/map?poi=<spotId>` 自动选中并聚焦景点。
- 安全识别 `/map?sceneRoute=<sceneRouteId>`，但不做复杂路线映射。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### /map?poi=xxx 处理逻辑

`GuideMapPage.tsx` 现在通过 `useSearchParams` 读取 `poi` 参数：

```text
/map?poi=giant_buddha
```

处理逻辑：

- 如果 `poi` 存在，并且能在 `guideSpots` 中找到对应景点：
  - 设置 `selectedSpotId` 为该 POI。
  - 如果当前路线不包含该 POI，则切换到第一个包含该 POI 的现有 `guideRoute`。
  - 等地图对象和 `InfoWindow` 就绪后，复用现有 `focusSpot` 聚焦该点。
- 如果 `poi` 不存在或找不到对应景点：
  - 不报错。
  - 保持当前默认景点和默认路线行为。

该逻辑只处理入口参数和聚焦，不改变路线规划算法。

### /map?sceneRoute=xxx 本阶段处理策略

`GuideMapPage.tsx` 现在会读取 `sceneRoute` 参数：

```text
/map?sceneRoute=classic_3d_scene
```

本阶段只通过 `console.debug` 安全识别该参数，说明已经收到但暂不映射到 `guideRoutes`。如果 `sceneRoute` 找不到或没有后续映射，也不会报错。

本阶段不会因为 `sceneRoute` 修改当前 `activeRouteId`。

### 为什么本阶段不做 sceneRoute 到 guideRoutes 的映射

`sceneRoute` 是艺术化 3D 导览路线，`guideRoutes` 是真实地图导览路线。二者不一定一一对应，直接映射会涉及路线语义、POI 覆盖关系、路线优先级和后续真实路线数据设计。

本阶段先打通最小闭环：从 3D 地图传 POI 到真实地图并聚焦。`sceneRoute -> guideRoute` 映射留到后续独立阶段处理，避免影响 `/map` 当前真实导览主流程。

### 对 /map 的影响

`/map` 新增查询参数读取能力：

- `/map?poi=xxx` 可聚焦有效景点。
- `/map?sceneRoute=xxx` 可被安全识别但暂不映射。

本阶段没有修改腾讯地图路线规划逻辑，没有修改 `buildWalkingRoute`，没有修改预设路线开关逻辑，没有修改 Marker 点击跳转逻辑，没有修改 InfoWindow 内容，也没有修改地图初始化参数。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。它已有的 `/map?poi=...` 与 `/map?sceneRoute=...` 跳转入口现在可以被 `/map` 读取，其中 `poi` 已形成聚焦闭环。

### 验证方式

- 检查 `GuideMapPage.tsx` 使用 `useSearchParams` 读取 `poi` 和 `sceneRoute`。
- 检查 `/map?poi=<spotId>` 有效时会设置 `selectedSpotId` 并在地图 ready 后调用 `focusSpot`。
- 检查 `/map?sceneRoute=<sceneRouteId>` 只安全识别，不改变当前路线。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/scenic-3d-map`，点击“查看该景点真实地图”，确认跳转到 `/map?poi=<selectedPoiId>` 后地图聚焦对应景点。
- 下一阶段可以设计 `sceneRoute -> guideRoute` 映射表，让 `/map?sceneRoute=classic_3d_scene` 切换到合适的真实导览路线。
- 继续保持 3D 艺术路线和腾讯地图真实导航的职责边界。

## 2026-05-29 阶段二十二：修复真实地图 query poi 最终聚焦

### 本次目标

修复从 `/scenic-3d-map` 跳转到 `/map?poi=<spotId>` 后，地图最终视野被路线全貌覆盖的问题。目标是 URL 带有效 `poi` 参数时，地图最终聚焦到对应景点并打开 InfoWindow。

### 本次约束

- 只修复 `/map?poi=xxx` 的最终聚焦行为。
- 不修改 `/scenic-3d-map`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 问题现象

从 `/scenic-3d-map` 点击“查看该景点真实地图”后，可以跳转到类似：

```text
/map?poi=giant_buddha
```

`GuideMapPage` 能识别 `poi` 参数，也能显示对应景点信息，但地图最终视野停留在整条路线全貌，而不是聚焦到该景点。

### 原因分析

`GuideMapPage` 中 query poi 的 `focusSpot` 会先执行，但路线绘制 effect 在 Polyline 创建完成后会继续无条件调用 `fitMapToRoute(mapRef.current, routeSpots)`。这会用路线 bounds 覆盖前面的景点聚焦视野。

因此原因确认为：路线绘制完成后的 `fitMapToRoute` 覆盖了 query poi 的 `focusSpot`。

### 修复方式

采用最小改动：

- 增加 `appliedQueryPoiIdRef`，让有效 query poi 的初始选中和必要路线切换只应用一次，避免用户后续手动切换路线时被反复拉回。
- 在路线绘制完成后判断当前 URL 是否有有效 `queryPoiSpot`，且当前 route 包含该 POI。
- 如果有，则不执行 `fitMapToRoute`，改为最终调用 `focusSpot(mapRef.current, infoWindowRef.current, queryPoiSpot)`。
- 如果没有有效 query poi，则保持原有 `fitMapToRoute` 行为。

### /map?poi=xxx 的最终行为

当 URL 为：

```text
/map?poi=<spotId>
```

且 `<spotId>` 能匹配到 `guideSpots` 时：

- 页面会选中该景点。
- 如果当前路线不包含该景点，会切到第一个包含该景点的现有 `guideRoute`。
- Marker、Polyline 和 InfoWindow 正常渲染。
- 路线绘制完成后，地图最终聚焦到该景点，并打开对应 InfoWindow。

无效 `poi` 仍保持默认行为，不报错。

### 对普通 /map 的影响

普通 `/map` 没有有效 query poi，因此仍保持原来的路线全貌展示逻辑，`fitMapToRoute` 继续生效。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。它已有的 `/map?poi=...` 跳转入口现在能在真实地图页获得更稳定的最终聚焦体验。

### 验证方式

- 检查 `GuideMapPage.tsx` 中路线绘制完成后的视野控制逻辑。
- 确认普通 `/map` 仍走 `fitMapToRoute`。
- 确认有效 `/map?poi=<spotId>` 走最终 `focusSpot(queryPoiSpot)`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动从 `/scenic-3d-map` 点击“查看该景点真实地图”，确认 `/map?poi=giant_buddha` 最终聚焦大佛 Marker 并打开 InfoWindow。
- 后续可继续处理 `/map?sceneRoute=xxx` 到真实 `guideRoutes` 的映射。
- 后续如增加用户手动交互状态，可进一步区分 query 初始化聚焦和用户主动地图操作。

## 2026-05-29 阶段二十三：query poi 景点级缩放修复

### 本次目标

为 `/map?poi=xxx` 的真实地图聚焦增加景点级缩放。目标是 URL 带有效 `poi` 参数时，地图最终居中到该景点，并缩放到适合查看景点的级别，而不是停留在整条路线或景区全貌级别。

### 本次约束

- 只修复 `/map?poi=xxx` 的景点级缩放体验。
- 不修改 `/scenic-3d-map`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不修改 InfoWindow 内容。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 问题现象

`/map?poi=jiulong_guanyu` 已经能识别 POI，页面右下角景点信息和 InfoWindow 都能显示九龙灌浴，但地图视野仍偏向整条路线或景区全貌，没有缩放到景点级别。

### 原因分析

阶段二十二已经确保路线绘制完成后最终执行 query poi 的 `focusSpot`，因此居中与 InfoWindow 打开已生效。但现有 `focusSpot` 只负责 `setCenter` 和打开 InfoWindow，没有设置 zoom。地图保留了之前 `fitMapToRoute` 或初始化阶段的较低缩放级别，所以视觉上仍像全貌视野。

### 修复方式

新增常量：

```ts
const QUERY_POI_FOCUS_ZOOM = 17
```

新增 query poi 专用聚焦函数：

```ts
function focusQueryPoiSpot(map, infoWindow, spot) {
  focusSpot(map, infoWindow, spot)
  if (map && typeof map.setZoom === 'function') {
    map.setZoom(QUERY_POI_FOCUS_ZOOM)
  }
}
```

仅在 URL query poi 触发的聚焦路径中使用 `focusQueryPoiSpot`。普通 `focusSpot`、Marker 点击、路线切换、InfoWindow 内容和路线规划逻辑保持不变。

### QUERY_POI_FOCUS_ZOOM 说明

`QUERY_POI_FOCUS_ZOOM` 当前设置为 `17`。该值用于灵山景区内部点位的景点级查看，相比更大的 zoom 更稳，不会过度放大到只看到极小局部。

### 对 /map?poi=xxx 的影响

有效 URL：

```text
/map?poi=<spotId>
```

现在会：

- 选中对应景点。
- 正常加载路线、Marker、Polyline 和 InfoWindow。
- 路线绘制完成后最终聚焦该景点。
- 将地图 zoom 设置到 `17`。

无效 `poi` 仍保持默认行为，不报错。

### 对普通 /map 的影响

普通 `/map` 没有 query poi，不会调用 `focusQueryPoiSpot`。路线绘制完成后仍走原来的 `fitMapToRoute`，继续显示整条路线全貌。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。它已有的 `/map?poi=...` 跳转入口会受益于真实地图页的景点级缩放体验。

### 验证方式

- 检查 `GuideMapPage.tsx` 中 `QUERY_POI_FOCUS_ZOOM` 为 `17`。
- 检查 query poi 聚焦路径调用 `focusQueryPoiSpot`。
- 检查普通 `/map` 仍保留 `fitMapToRoute`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动验证 `/map?poi=jiulong_guanyu` 和 `/map?poi=giant_buddha`，确认最终 zoom 为景点级别。
- 如后续发现局部仍不够清晰，可在验证后将 `QUERY_POI_FOCUS_ZOOM` 从 `17` 调整为 `18`。
- 继续保持 `/map` 普通入口的全路线视野和真实导航职责。

## 2026-05-29 阶段二十四：sceneRoute 到真实 guideRoute 映射

### 本次目标

让 `/map?sceneRoute=classic_3d_scene` 能够映射到真实腾讯地图导览路线 `historical_culture`，打通 3D 艺术路线到真实地图路线的映射闭环。

### 本次约束

- 只处理 `/map?sceneRoute=xxx` 到现有 `guideRoute` 的映射。
- 不修改 `/scenic-3d-map`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `src/data/lingshanMapData.ts`
- `docs/map-3d-development-log.md`

### 新增 lingshanSceneRouteToGuideRouteMap 说明

新增映射：

```ts
export const lingshanSceneRouteToGuideRouteMap: Record<string, string> = {
  classic_3d_scene: 'historical_culture'
}
```

该映射用于把艺术化 3D 导览路线映射到腾讯地图真实导览路线。key 是 `lingshanSceneRoutes` 中的 sceneRoute id，value 是 `guideRoutes` 中的真实导览路线 id。

### classic_3d_scene 如何映射到 historical_culture

当 URL 为：

```text
/map?sceneRoute=classic_3d_scene
```

`GuideMapPage` 会读取 `sceneRoute`，从 `lingshanSceneRouteToGuideRouteMap` 找到 `historical_culture`，再确认该 route id 存在于 `guideRoutes` 中。确认后设置 `activeRouteId` 为 `historical_culture`。

### sceneRoute 参数处理逻辑

`GuideMapPage` 现在会：

- 读取 `sceneRoute` 查询参数。
- 从 `lingshanSceneRouteToGuideRouteMap` 查找真实 `guideRouteId`。
- 如果找到有效 `guideRoute`，设置 `activeRouteId`。
- 不设置 `selectedSpotId` 为某个具体点。
- 让地图按普通路线逻辑绘制并显示路线全貌。
- 如果映射不存在或 route id 无效，不报错，保持默认路线行为。

### poi 与 sceneRoute 同时存在时为什么 poi 优先

如果 URL 同时包含：

```text
/map?poi=giant_buddha&sceneRoute=classic_3d_scene
```

则 `poi` 优先。原因是 `poi` 表示用户明确希望聚焦某个真实景点；`sceneRoute` 只表示希望进入某条真实路线。为了保证从 3D 地图点击具体景点后的闭环体验，具体 POI 聚焦优先于路线全貌。

### 对 /map 的影响

`/map?sceneRoute=classic_3d_scene` 现在会切换到 `historical_culture` 并显示路线全貌。

普通 `/map` 仍显示默认路线。`/map?poi=xxx` 仍按阶段二十二、二十三逻辑聚焦并缩放到对应景点。

本阶段没有修改腾讯地图路线规划逻辑，没有修改 `buildWalkingRoute`，没有修改预设路线开关逻辑，没有修改 Marker、Polyline、InfoWindow 或地图初始化参数。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。它已有的 `/map?sceneRoute=classic_3d_scene` 跳转入口现在可以被 `/map` 映射到真实导览路线。

### 验证方式

- 检查 `lingshanSceneRouteToGuideRouteMap` 映射存在。
- 检查 `GuideMapPage.tsx` 读取 `sceneRoute` 并设置有效 `activeRouteId`。
- 检查同时存在 `poi` 和 `sceneRoute` 时 `poi` 优先。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动验证 `/map?sceneRoute=classic_3d_scene` 是否显示历史文化路线全貌。
- 手动验证 `/map?poi=jiulong_guanyu&sceneRoute=classic_3d_scene` 是否仍聚焦九龙灌浴。
- 后续可继续扩展更多 `sceneRoute -> guideRoute` 映射，并补充场景路线与真实路线的说明文案。

## 2026-05-29 阶段二十四 B：query poi 后手动选点 InfoWindow 同步修复

### 本次目标

修复从 `/map?poi=xxx` 进入真实地图后，用户手动点击路线站点时地图 InfoWindow 仍停留在 query poi 的问题。URL 中的 `poi` 参数只作为一次性初始聚焦意图，后续用户手动选点应完全由用户交互驱动。

### 本次约束

- 只修复 `GuideMapPage` 中 query poi 后手动选点的地图聚焦和 InfoWindow 同步问题。
- 不修改 `/scenic-3d-map`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不修改 `lingshanMapData.ts`。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 问题现象

打开 `/map?poi=jiulong_guanyu&sceneRoute=classic_3d_scene` 后，初始 InfoWindow 能显示九龙灌浴。但在右下角景点卡片中点击曼飞龙塔、灵山精舍、梵宫广场等其它站点后，页面选中状态会变化，地图上的 InfoWindow 却仍可能停留在九龙灌浴。

### 原因分析

`poi` 查询参数的初始聚焦逻辑和后续用户手动选点没有完全解耦。同时 `routeSpots` 每次渲染都会生成新数组，导致选点渲染也可能触发路线绘制 effect。路线绘制完成后仍根据 `queryPoiSpot` 执行 `focusQueryPoiSpot`，从而把 InfoWindow 拉回 URL 中的初始 POI。

### 修复方式

- 使用 `useMemo` 缓存当前路线的 `routeSpots`，避免用户选点时不必要地触发路线重绘。
- 新增 `appliedQueryPoiFocusIdRef`，让 query poi 的地图聚焦只执行一次。
- 保留 query poi 初始进入时的 `focusQueryPoiSpot` 和 `zoom=17` 行为。
- 路线绘制完成后，只有当前选中点仍然是 query poi 时才执行 query poi 聚焦；用户手动选择其它站点后不再被 query poi 拉回。
- 右下角站点按钮继续调用 `setSelectedSpotId` 和 `focusSpot`，手动选点会立即更新地图中心与 InfoWindow。

### query poi 为什么应作为一次性初始意图

`/map?poi=xxx` 表示从 3D 艺术地图或外部入口进入真实地图时，希望初始定位到某个景点。进入页面之后，用户的点击、路线切换和地图操作应拥有更高优先级，否则 URL 参数会持续覆盖用户的真实交互，造成 InfoWindow 与当前选中景点不一致。

### 用户手动选点后的新行为

用户在路线站点列表中点击其它景点时：

- `selectedSpotId` 更新为用户点击的景点。
- `focusSpot` 使用该景点坐标更新地图中心。
- InfoWindow 内容和位置同步切换到该景点。
- 已消费的 query poi 不再把 InfoWindow 拉回初始景点。

### 对 /map?poi=xxx 的影响

`/map?poi=jiulong_guanyu` 和 `/map?poi=jiulong_guanyu&sceneRoute=classic_3d_scene` 仍会初始聚焦九龙灌浴，并保持景点级缩放。初始聚焦完成后，用户手动选择其它站点时地图 InfoWindow 会跟随新站点。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。它跳转到 `/map?poi=xxx` 的入口保持不变。

### 验证方式

- 打开 `/map?poi=jiulong_guanyu&sceneRoute=classic_3d_scene`。
- 初始显示九龙灌浴 InfoWindow。
- 点击右下角景点卡片中的曼飞龙塔。
- 地图 InfoWindow 应切换到曼飞龙塔。
- 再点击梵宫广场。
- 地图 InfoWindow 应切换到梵宫广场。
- 页面不应被 query poi 自动拉回九龙灌浴。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 在浏览器中手动验证 query poi 初始聚焦和后续站点点击的完整交互。
- 后续如果要让 Marker 点击停留在地图页而不是进入讲解页，可以单独设计地图内选点交互，不应和本阶段修复混在一起。

## 2026-05-29 阶段二十五：首页接入沉浸式 3D 地图入口

### 本次目标

在首页增加进入 `/scenic-3d-map` 的普通用户入口，让用户不需要手动输入 URL 就能打开全屏艺术化 3D 景区导览地图。

### 本次约束

- 只在 `HomePage` 增加进入 `/scenic-3d-map` 的入口。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `/map`。
- 不修改 3D 场景逻辑。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/pages/HomePage.tsx`
- `docs/map-3d-development-log.md`

### 首页入口说明

首页推荐面板中新增“沉浸式 3D 导览地图”入口区，包含：

- 主标题：沉浸式 3D 导览地图
- 副文案：以艺术化 3D 场景探索灵山核心景点，真实导航可一键切回腾讯地图。
- 按钮：进入 3D 导览地图

点击按钮后使用 `react-router-dom` 的 `navigate('/scenic-3d-map')` 跳转到沉浸式 3D 景区地图页面。

### 为什么本阶段只改首页、不改地图页

`/map` 是腾讯地图真实导览页，刚完成 `poi` 和 `sceneRoute` 的真实地图闭环修复。为了避免影响真实地图交互，本阶段只增加首页入口，不在 `/map` 中嵌入或改造 3D 场景，也不修改路线规划、Marker、Polyline、InfoWindow 等真实地图逻辑。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 页面本身没有修改。新增首页入口后，普通用户可以从首页直接进入该页面。

### 对 /map 的影响

本阶段没有修改 `/map` 或 `GuideMapPage.tsx`。真实腾讯地图导览、路线切换、POI 聚焦和 sceneRoute 映射行为保持不变。

### 验证方式

- 检查首页新增入口按钮文案与跳转路径。
- 确认 `/three-preview` 未暴露给普通用户。
- 确认 `GuideMapPage.tsx` 没有改动。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动从首页点击“进入 3D 导览地图”，确认跳转到 `/scenic-3d-map`。
- 继续保留 `/map` 作为真实腾讯地图导览入口，后续可在 3D 地图页面继续优化与真实地图的联动说明。
