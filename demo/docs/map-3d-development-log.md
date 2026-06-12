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

## 2026-05-29 阶段二十六：沉浸式 3D 地图视觉风格升级方案生成

### 本次目标

生成一份可执行的沉浸式 3D 地图视觉风格升级方案，明确当前 `/scenic-3d-map` 已有能力、与 Chartogne-Taillet 酒庄地图和水墨杭州风格的差距、后续分阶段升级路径，以及 3D 艺术地图与腾讯真实地图的职责边界。

### 本次约束

- 只生成视觉风格升级方案文档。
- 不修改功能代码。
- 不修改 `/scenic-3d-map` 代码。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `docs/lingshan-immersive-3d-visual-upgrade-plan.md`
- `docs/map-3d-development-log.md`

### 方案文档内容说明

新增 `docs/lingshan-immersive-3d-visual-upgrade-plan.md`，内容包括：

- 当前系统的双层地图结构：`/scenic-3d-map` 作为 3D 艺术地图层，`/map` 作为真实地图导航层，`/three-preview` 作为资产测试层。
- 当前 `/scenic-3d-map` 的能力盘点：地形底盘、水面意象、山体、雾效、光照、4 个核心低模地标、3D 路线曲线、景点标签、选点高亮、跳转真实地图闭环。
- 与 Chartogne-Taillet 和水墨杭州参考风格的差距分析。
- 灵山胜境 3D 地图视觉关键词和明确不做的方向。
- 3D 地图替代腾讯地图视觉层的可行性分析。
- 真实导航数据和 3D 展示数据的分层方式。
- 通过 `poiId` 连接真实地图坐标、3D 场景位置、模型资产、讲解内容、路线站点和真实地图跳转。
- 阶段 A 到阶段 E 的视觉和导航升级路线。
- 阶段二十七建议优先做 `/scenic-3d-map` 代码级视觉升级。
- 风险与注意事项。

### 关于 3D 地图替代腾讯地图视觉层的结论

文档结论是：3D 地图可以替代腾讯原始地图样式中的“用户主视觉导览入口”，但不应替代“真实地理坐标与导航兜底能力”。

推荐产品形态是：

```text
3D 艺术地图主入口 + 腾讯地图真实导航兜底
```

后续可以让首页和主要地图入口优先进入 `/scenic-3d-map`，在需要真实定位、真实 POI、路线兜底和导航详情时再跳转 `/map`。

### 为什么本阶段只做方案、不改代码

当前 `/scenic-3d-map` 已经具备基础闭环，但视觉升级方向涉及场景构图、材质、雾效、标签、路线表达、交互反馈和后续 Blender 资产。先形成方案可以避免直接写代码时混入范围过大的设计决策，也能明确哪些升级可以先通过 Three.js 代码完成，哪些需要 Blender 资产支持。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。文档为后续视觉升级提供路线，建议下一步先做代码级视觉升级，不接入真实模型、不改导航逻辑。

### 对 /map 的影响

本阶段没有修改 `/map` 或 `GuideMapPage.tsx`。腾讯地图真实导览、POI 聚焦、sceneRoute 映射和路线规划保持不变。

### 验证方式

- 检查 `docs/lingshan-immersive-3d-visual-upgrade-plan.md` 已生成。
- 检查文档包含当前定位、能力盘点、差距分析、视觉目标、替代可行性、导航接入、分阶段路线、第一批代码改造建议、风险和结论。
- 检查本阶段未修改功能代码。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### 下一步建议

- 阶段二十七优先做 `/scenic-3d-map` 代码级视觉升级。
- 建议只修改 `src/components/scenic3d/Scenic3DMapScene.tsx`、`src/pages/Scenic3DMapPage.tsx` 和开发记录。
- 暂不修改 `/map`，暂不引入真实 `.glb`，先优化颜色、雾效、水面、山体、路线、标签、高亮和页面浮层风格。

## 2026-05-29 阶段二十七：沉浸式 3D 地图代码级视觉轻量升级

### 本次目标

在不改变 `/scenic-3d-map` 功能逻辑的前提下，对沉浸式 3D 地图做代码级视觉轻量升级，让它更接近“水墨留白 + 低多边形 + 东方山水 + 金线导览”的视觉方向。

### 本次约束

- 只优化 `/scenic-3d-map` 的视觉表现。
- 只修改 3D 场景组件、3D 地图页面和开发记录。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标或 `scenePosition` 数据。
- 不修改 `lingshanMapData.ts`。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### 场景视觉升级说明

`Scenic3DMapScene.tsx` 做了轻量视觉升级：

- 背景从工程测试感浅青色调整为更柔和的浅米白、青灰色。
- fog 色彩和距离调整为水墨留白方向，远景更柔和。
- 地形底盘增加外层宣纸色大地台、浅灰绿内层和软边界环。
- 水面改为低饱和淡蓝灰半透明材质，保留太湖/水面意象。
- 山体远景改为更低饱和的青灰、墨绿色，并降低视觉抢占。
- 金色路线升级为三层导览金线，并增加路线节点圆环。
- 景点标签改为米白底、深绿/墨色文字、轻阴影和圆角的手绘地图标注感。
- selectedPoiId 对应地标增加底座光环和路线节点强调，非选中状态保持低饱和。
- 光照调整为更柔和的暖色主光和青灰补光，避免纯白过曝。

### 页面 UI 升级说明

`Scenic3DMapPage.tsx` 做了轻量 UI 升级：

- 页面背景调整为米白到青灰绿的整体氛围。
- 左侧路线浮层改为半透明宣纸色卡片，圆角和阴影更柔和。
- 路线站点列表增加序号节点感，当前选中站点更清晰。
- 右下角景点信息卡统一为文旅导览卡片风格。
- 信息卡明确显示“当前为艺术化 3D 占位”。
- 保留“查看该景点真实地图”“查看整条路线真实地图”“返回真实地图”按钮。
- 保持 `/map?poi=xxx` 和 `/map?sceneRoute=xxx` 跳转 URL 不变。

### 为什么本阶段不引入真实 glb 模型

本阶段目标是先验证整体视觉方向、色彩、雾效、路线、标签和信息卡是否更接近目标风格。真实 `.glb` 模型会引入资产体积、加载、LOD、版权和宗教景观表达等问题，适合在视觉语言稳定后再进入 Blender 资产替换阶段。

### 为什么本阶段不修改 /map

`/map` 是腾讯地图真实导览页，负责真实 POI、路线规划、InfoWindow、query poi 聚焦和真实地图兜底。本阶段只优化 3D 艺术地图视觉，不应影响真实地图的稳定交互和导航职责。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 的视觉更接近沉浸式文旅导览地图：色彩更柔和，地形、水面、山体、路线和标签更统一。景点选择、高亮、路线站点列表和真实地图跳转能力保持不变。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx` 或腾讯地图路线规划逻辑。真实地图导航页行为不变。

### 验证方式

- 检查 `Scenic3DMapScene.tsx` 保留 `selectedPoiId`、`onSelectPoi`、`routePoiSequence`、OrbitControls 和 4 个核心地标。
- 检查 `Scenic3DMapPage.tsx` 保留路线站点、景点信息和真实地图跳转按钮。
- 检查未修改 `/map`、`GuideMapPage.tsx`、`routePlanning.ts`、`lingshanMapData.ts`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 在浏览器中手动打开 `/scenic-3d-map`，检查桌面和移动端的视觉层次、标签遮挡、路线可读性和按钮可点击性。
- 后续可继续做 hover 高亮、点击镜头推进、路线分段播放，但仍应保持真实导航由 `/map` 兜底。

## 2026-05-29 阶段二十八：沉浸式 3D 地图构图与镜头优化

### 本次目标

优化 `/scenic-3d-map` 的 3D 场景构图、初始镜头、远景山体和路线曲线，让页面更像完整的沉浸式景区导览地图，而不是低模模型陈列。

### 本次约束

- 只优化 `/scenic-3d-map` 的 3D 场景构图和页面展示体验。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 真实经纬度坐标。
- 原则上不修改 `lingshanMapData.ts`；如果修改也只能调整 4 个核心 POI 的 `scenePosition`。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### 初始镜头优化说明

`Scenic3DMapScene` 的初始相机从偏低的模型展示视角调整为更高、更俯视的导览地图视角：

- camera position 调整为 `[4.8, 7.8, 8.6]`。
- fov 调整为 `38`，减少广角变形，让 4 个核心地标和金色路线更像沙盘地图。
- OrbitControls target 调整到 `[0.05, 0.42, -0.7]`，让核心路线处于画面中心区域。

初始打开页面时更容易同时看到九龙灌浴、灵山大佛、梵宫、五印坛城和整条金色导览路线。

### OrbitControls 限制说明

保留用户旋转、缩放和平移能力，但限制过低视角：

- `minDistance` 调整为 `5.2`。
- `maxDistance` 调整为 `13.2`。
- 新增 `minPolarAngle={Math.PI * 0.2}`。
- `maxPolarAngle` 调整为 `Math.PI * 0.42`。

这样用户仍可以观察场景，但不容易拖到被山体或低角度模型遮挡的视角。

### 山体与远景优化说明

远景山体从较靠近主场景的位置移到更靠后的边缘区域，并降低高度、透明度和视觉存在感：

- 山体整体后移到场景上缘和侧缘。
- 高度降低，避免压住核心地标。
- 透明度从较明显状态降低到更柔和的背景意象。
- 第二块水面也向左后方移动，减少对主路线的干扰。

山体现在更像水墨山水远景，不抢主视觉，也不遮挡核心路线。

### 路线曲线优化说明

金色路线仍由 `routePoiSequence -> lingshanPois.scenePosition` 驱动，没有改成写死路线。

本次将相邻景点之间的路线从简单中点连接，改为根据两点方向计算少量垂直偏移控制点：

- 每段路线保留起点和终点。
- 在相邻景点之间插入两个轻微偏移的中间控制点。
- 偏移方向按段落交替，形成更自然的游览路径。
- 保留三层金色路线和路线节点圆环。

路线现在更像导览路径，而不是直接连线。

### scenePosition 调整说明

本阶段没有修改 `src/data/lingshanMapData.ts`，也没有调整任何 POI 的 `scenePosition`。

当前优化通过相机、OrbitControls、远景位置和路线控制点完成。`scenePosition` 仍是艺术化 3D 场景坐标，不是真实经纬度，也不用于真实导航。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 初始构图更接近完整景区导览地图：

- 主要地标和路线更集中在画面中心。
- 山体作为远景背景，不再抢占核心地标。
- 路线更自然，游览动线感更强。
- 左侧卡片和右下信息卡略收窄，减少对主场景的遮挡。

功能逻辑保持不变：景点选择、高亮、路线站点列表、`/map?poi=xxx` 和 `/map?sceneRoute=xxx` 跳转都没有变化。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx` 或腾讯地图路线规划逻辑。真实地图导览页行为不变。

### 验证方式

- 检查 `Scenic3DMapScene.tsx` 中相机、OrbitControls、山体、水面和路线曲线逻辑。
- 检查 `Scenic3DMapPage.tsx` 中浮层尺寸和按钮跳转逻辑保持不变。
- 确认没有修改 `GuideMapPage.tsx`、`routePlanning.ts`、`lingshanMapData.ts`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 在浏览器中手动验证 `/scenic-3d-map` 的初始画面，确认 4 个核心地标、金色路线和标签都在可读范围内。
- 下一阶段可考虑增加轻量 hover 反馈或点击镜头推进，但仍不建议改动 `/map` 的真实导航职责。

## 2026-05-29 阶段二十八：核心游线 3D 空间表达规划生成

### 本次目标

基于现有 `guideRoutes`、`guideSpots`、`lingshanPois` 和 `lingshanSceneRoutes`，生成一份核心游线驱动的 3D 景区地图空间规划文档，用于指导后续 `scenePosition` 调整、低模场景布局、Blender/3D 重建资产制作。

### 本次约束

- 只生成/更新规划文档和开发记录。
- 不修改功能代码。
- 不修改 `/scenic-3d-map` 代码。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 POI 坐标或 `scenePosition`。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `docs/lingshan-3d-core-route-spatial-plan.md`
- `docs/map-3d-development-log.md`

### 为什么从完整景区收敛到核心游线

当前 demo 的目标不是完整景区数字孪生，而是能向用户清楚表达核心游线、核心景点和真实地图兜底能力。完整景区重建会带来边界、路网、模型体积、性能、资产制作和导航准确性风险。

基于现有三条真实路线和一条 3D 原型线，核心游线已经覆盖：

- 南门/入口区
- 灵山大照壁/胜境广场
- 九龙灌浴
- 灵山大佛
- 梵宫
- 五印坛城
- 祥符禅寺
- 出口/回程节点

这些点足以支撑一个完整的艺术化 3D 导览地图主体验。

### 山体/水系/道路/广场的真实空间表达原则

文档明确：

- 山体作为背景意象，位于真实方位相近的场景边缘，不遮挡核心建筑和路线。
- 太湖/水系用大色块表达，参考真实水域方向，不追求精确岸线。
- 道路使用金线/墨线表达主游线，优先表达路线顺序和导览节奏，不还原所有小路。
- 广场使用浅色地台、圆盘、平台表达，用于承接核心建筑和游客停留点。
- `scenePosition` 是艺术化 3D 坐标，不是经纬度，但应保持真实相对方向和路线顺序。
- `displayLocation` 和 `navLocation` 继续服务真实地图，`scenePosition` 服务 3D 展示，`poiId` 是两者连接桥梁。

### 核心建筑 3D 重建建议

文档建议：

- `giant_buddha`、`jiulong_guanyu`、`fan_gong`、`wuyin_tancheng` 作为第一批 core_3d 建模/重建候选。
- `xiangfu_temple`、`lingshan_wall`、`shengjing_square`、`foqian_square`、`fan_gong_square` 等作为 simple_3d 或低模环境资产。
- `south_gate` 和 `exit` 第一阶段用入口/出口符号、标牌或 Marker 表达即可。
- 服务设施暂时 marker_only 或极简符号，不进入第一批建模。

### 为什么本阶段只做规划、不改代码

后续是否新增更多 `scenePosition`、是否拆出 `src/data/scenic3d/lingshanSceneLayout.ts`、哪些建筑进入 Blender 资产制作，都需要先明确空间范围和表达边界。本阶段先规划，避免直接修改代码时把完整景区重建、核心游线、真实导航和艺术化布局混在一起。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。文档为后续核心游线驱动的 3D 场景布局提供依据，建议下一步补充 8-10 个核心 POI 的艺术化 `scenePosition`。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx` 或腾讯地图路线规划逻辑。真实地图导航页继续承担 POI、真实路线和导航兜底职责。

### 验证方式

- 检查 `docs/lingshan-3d-core-route-spatial-plan.md` 已生成。
- 检查文档包含规划目标、核心点筛选、推荐场景范围、真实空间关系原则、山水路广场规范、核心建筑建模建议、scenePosition 调整建议、后续阶段、风险边界和结论。
- 检查本阶段未修改功能代码。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### 下一步建议

- 阶段二十九可为核心 8-10 个 POI 补充 `scenePosition`，但仍不修改真实经纬度。
- 后续可考虑新增 `src/data/scenic3d/lingshanSceneLayout.ts`，把 3D 展示布局从真实 POI 数据中分离出来。

## 2026-05-29 阶段二十九：19 个核心游线 POI scenePosition 补充

### 本次目标

为 `guideData.ts` 中当前 19 个去重景点/地点全部补充艺术化 3D `scenePosition`，让后续 `/scenic-3d-map` 可以基于更完整的核心游线数据展示入口、照壁、广场、道路节点、寺院、核心建筑、出口等空间节点。

### 本次约束

- 只修改 POI 数据层和开发记录。
- 不修改 `/scenic-3d-map` 组件代码。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 `displayLocation`。
- 不修改 `navLocation`。
- 不修改腾讯 POI 字段。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/data/lingshanMapData.ts`
- `docs/map-3d-development-log.md`

### 本次补充 scenePosition 的 POI 列表

本阶段为当前 19 个去重 POI 全部补充了艺术化 3D `scenePosition`：

- `south_gate`：南门入园
- `lingshan_wall`：灵山大照壁
- `shengjing_square`：胜境广场
- `fozu_tan`：佛足坛
- `jiulong_guanyu`：九龙灌浴
- `puti_avenue`：菩提大道
- `foshou_square`：佛手广场
- `xiangfu_temple`：祥符禅寺
- `xingtan_square`：杏坛广场
- `foqian_square`：佛前广场
- `giant_buddha`：灵山大佛
- `baizi_mile`：百子戏弥勒
- `fan_gong`：梵宫
- `fan_gong_square`：梵宫广场
- `wuyin_tancheng`：五印坛城
- `manfeilong_tower`：曼飞龙塔
- `lingshan_jingshe`：灵山精舍
- `sansheng_hall`：三圣殿
- `exit`：景区出口

原有 4 个核心地标 `giant_buddha`、`jiulong_guanyu`、`fan_gong`、`wuyin_tancheng` 的坐标保持不变，避免影响当前 `/scenic-3d-map` 的既有构图。其余 15 个点根据核心游线顺序补充为入口区、前中段路线节点、大佛中轴区、梵宫/坛城片区、辅助文化点和出口回程节点。

### 未找到的 POI id

本阶段要求覆盖的 19 个 POI id 均存在于当前 `lingshanPois` 数据来源中，没有未找到的 POI id。

### scenePosition 不是经纬度的说明

`scenePosition` 是艺术化 3D 导览坐标，不是经纬度，也不用于真实导航判断。

- `displayLocation` 继续用于真实地图展示点。
- `navLocation` 继续用于真实导航终点。
- `scenePosition` 只用于 3D 场景中的空间表达。
- `poiId` 是真实地图坐标、3D 坐标、模型资产、讲解内容和路线站点之间的连接桥梁。

### 为什么为 19 个去重点位补齐，而不是按 28 个站点位次重复补

当前 3 条真实路线合计有 28 个站点位次，但其中多个景点在不同路线中复用，例如南门入园、景区出口、灵山大佛、九龙灌浴、梵宫、五印坛城等。

3D 地图中同一个真实地点应只有一个 `scenePosition`，不同路线通过 `poiId` 复用该空间节点。这样可以避免同一景点在 3D 场景中出现多个位置，也能让后续路线、模型、讲解和真实地图跳转保持一致。

### 为什么本阶段只补数据、不改 3D 渲染代码

本阶段目标是先把核心游线空间数据补齐，为后续扩展渲染层做准备。当前 `/scenic-3d-map` 仍只渲染已有核心地标和当前 3D 路线，不在本阶段扩大显示范围，避免数据补充和渲染策略混在同一次改动中。

### 对 /scenic-3d-map 的影响

当前 `/scenic-3d-map` 组件代码没有修改。由于现有渲染仍基于当前资产映射和 3D 原型路线，页面视觉不会因为本阶段直接扩大节点显示。后续可以基于完整 `scenePosition` 数据逐步增加入口、照壁、广场、道路节点、寺院、出口等空间表达。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯地图路线规划逻辑、真实经纬度坐标、`displayLocation` 或 `navLocation`。真实地图导航页行为不变。

### 验证方式

- 检查 `src/data/lingshanMapData.ts` 中 19 个 POI id 都有 `scenePosition`。
- 检查 `displayLocation`、`navLocation`、腾讯 POI 字段和 `bindStatus` 未改动。
- 检查未修改 `/scenic-3d-map` 组件代码、`/map`、`GuideMapPage.tsx`、`routePlanning.ts`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 后续阶段可考虑新增 `src/data/scenic3d/lingshanSceneLayout.ts`，把 3D 展示布局从真实 POI 数据中进一步分离。
- 下一步可基于 19 个 `scenePosition` 选择性渲染入口、照壁、广场、路线节点和出口，但仍不应把 3D 艺术路线当作真实导航路线。

## 2026-05-29 阶段三十：19 个核心游线节点 3D 可视化

### 本次目标

基于 `lingshanPois` 中已经补齐的 19 个 `scenePosition`，让 `/scenic-3d-map` 从“4 个核心地标”升级为“核心游线结构地图”，在 3D 场景中展示入口、照壁、广场、道路节点、文化点、核心建筑和出口等空间节点。

### 本次约束

- 只修改 `/scenic-3d-map` 的 3D 场景展示和开发记录。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 真实经纬度 `displayLocation` / `navLocation`。
- 不修改 `scenePosition` 数据。
- 不新增真实 `.glb`、`.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### 19 个 scenePosition 如何被用于 3D 节点渲染

`Scenic3DMapScene` 现在会从 `lingshanPois` 中读取所有拥有 `scenePosition` 的 POI。4 个已有 `core_3d` 继续按原有 `PlaceholderLandmark` 模型渲染；其余具有 `scenePosition` 的 POI 会被渲染为低模节点。

这些节点仍通过 `poiId` 与真实地图、讲解内容和后续模型资产连接。点击节点会调用 `onSelectPoi(poi.id)`，从而更新当前选中 POI。

### 核心地标、文化点、广场/道路节点的分层表达方式

- 核心地标：`giant_buddha`、`jiulong_guanyu`、`fan_gong`、`wuyin_tancheng` 继续使用现有低模 placeholder 模型和常显标签。
- 文化点 / 寺院节点：`xiangfu_temple`、`manfeilong_tower`、`lingshan_jingshe`、`sansheng_hall`、`baizi_mile` 使用稍大的低矮圆柱地台和竖向符号表达，并显示小标签。
- 广场 / 道路 / 入口出口节点：`south_gate`、`lingshan_wall`、`shengjing_square`、`fozu_tan`、`puti_avenue`、`foshou_square`、`xingtan_square`、`foqian_square`、`fan_gong_square`、`exit` 使用浅色小圆盘、路线节点或小牌表达。
- 起点和出口：`south_gate`、`exit` 额外使用小型方牌，让入口/出口与普通广场节点有所区分。
- 高亮：`selectedPoiId` 对应的核心地标或辅助节点会放大/变亮，并显示更明显的光环和标签。

### 为什么本阶段不修改路线数据

当前 `lingshanSceneRoutes` 的 `routePoiSequence` 仍是一条 4 点经典 3D 原型线。本阶段目标是先把 19 个核心游线节点可视化，而不是重新设计路线数据。

路线升级应在后续阶段单独处理，例如映射到真实 `guideRoutes`、增加多路线切换或基于 19 点生成更完整的 3D 主游线，避免与节点渲染混在同一次改动中。

### 为什么本阶段不引入真实 glb 模型

本阶段只做低模/符号化节点表达，不引入真实 `.glb` 模型。这样可以先验证核心游线空间结构、节点密度、标签可读性和点击交互，再决定哪些节点需要 Blender 或 3D 重建模型。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 现在会显示 19 个 `scenePosition` 节点。左侧仍保留当前经典 3D 主线列表，不把 19 个点全部塞进左侧 UI。右下角信息卡可以显示辅助节点的名称、`poiId` 和介绍，并继续保留“查看该景点真实地图”“查看整条路线真实地图”“返回真实地图”等按钮。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯地图路线规划逻辑、真实经纬度坐标、`displayLocation`、`navLocation` 或 `scenePosition` 数据。真实地图导览页行为不变。

### 验证方式

- 检查 `Scenic3DMapScene.tsx` 会从 `lingshanPois` 渲染所有拥有 `scenePosition` 的节点。
- 检查 4 个核心地标仍使用现有 placeholder 模型。
- 检查文化点、广场/道路节点、入口出口使用不同低模符号表达。
- 检查点击辅助节点后右下信息卡可显示对应名称和 `poiId`。
- 检查未修改 `lingshanMapData.ts`、`GuideMapPage.tsx`、`routePlanning.ts`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/scenic-3d-map` 检查 19 个节点的标签密度和遮挡情况。
- 后续可单独做 3D 路线升级，让 `routePoiSequence` 支持完整核心游线或多条 guideRoute 映射。

## 2026-05-29 阶段三十一：3D 导览路线对齐 guideRoutes 三路线

### 本次目标

让 `/scenic-3d-map` 的 3D 金线导览路线基于 `src/data/guideData.ts` 中现有三条业务路线 `guideRoutes.stops`，支持历史文化、自然风光和亲子三类 3D 艺术化导览路线切换。

### 本次约束

- 只修改 3D sceneRoute 数据、3D 页面路线选择展示和开发记录。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不新增真实 `.glb` / `.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/data/lingshanMapData.ts`
- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### 为什么使用 guideRoutes.stops 作为 3D 路线基础

阶段三十一 A 只读扫描确认：项目内没有真实土建道路折线、道路网、GeoJSON LineString 或可提交的腾讯 walking route 缓存数据。当前最可靠的业务路线数据是 `guideData.ts` 中的三条 `guideRoutes`。

`guideRoutes.stops` 已经承载导览站点顺序和讲解叙事，因此适合作为 3D 艺术化路线的基础顺序。3D 页面通过 `poiId -> lingshanPois.scenePosition` 将这些站点顺序映射到 3D 场景中的金色导览线。

### 为什么这些路线不等同真实步行路线

`guideRoutes.stops` 是业务导览顺序，不是园区道路折线。它没有道路转折、台阶、禁行区域、桥梁、出入口通道、无障碍路径或真实步行 geometry。

本阶段生成的 3D 路线表达的是游览节奏和空间叙事，不应作为精确步行导航。真实定位、路线规划、POI 聚焦和导航兜底仍由 `/map` 的腾讯地图导览页承担。

### 新增/调整的 lingshanSceneRoutes 列表

- `classic_3d_scene`：灵山经典 3D 导览线，兼容既有入口，对应 `historical_culture`，`poiSequence` 使用历史文化路线 12 站顺序。
- `historical_3d_scene`：历史文化 3D 导览线，对应 `historical_culture`，`poiSequence` 使用历史文化路线 12 站顺序。
- `natural_3d_scene`：自然风光 3D 导览线，对应 `natural_scenery`，`poiSequence` 使用自然风光路线 9 站顺序。
- `family_3d_scene`：亲子 3D 导览线，对应 `family`，`poiSequence` 使用亲子路线 7 站顺序。

`classic_3d_scene` 保留为历史文化线的兼容别名，避免阶段二十以来已有 `/map?sceneRoute=classic_3d_scene` 跳转失效。

### lingshanSceneRouteToGuideRouteMap 映射说明

本阶段补齐艺术化 3D 路线到真实 guideRoute 的映射：

- `classic_3d_scene -> historical_culture`
- `historical_3d_scene -> historical_culture`
- `natural_3d_scene -> natural_scenery`
- `family_3d_scene -> family`

这些映射用于 `/map?sceneRoute=xxx` 跳转真实地图时切换对应的腾讯地图导览路线。

### /scenic-3d-map 路线选择 UI 说明

`Scenic3DMapPage` 新增 3D 导览路线选择区，展示 `lingshanSceneRoutes` 中的路线名称。点击路线后：

- 更新当前 `currentSceneRoute`。
- 将 `routePoiSequence` 传给 `Scenic3DMapScene`。
- 3D 金线随所选路线变化。
- 左侧站点列表随所选路线变化。
- 默认选中该路线第一个站点。
- 站点列表区域支持滚动，避免历史文化 12 站撑出屏幕。
- “查看整条路线真实地图”继续跳转 `/map?sceneRoute=<currentSceneRoute.id>`。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯地图路线规划逻辑、Marker、Polyline、InfoWindow、query poi 聚焦或真实路线绘制逻辑。`/map?sceneRoute=xxx` 的解析能力沿用已有实现，只因为数据层映射补齐而支持更多 sceneRoute。

### 验证方式

- 检查 `lingshanSceneRoutes` 已包含 classic、historical、natural、family 四个 sceneRoute。
- 检查每条 3D route 的 `poiSequence` 来自对应 `guideRoutes.stops`。
- 检查 `lingshanSceneRouteToGuideRouteMap` 包含四条映射。
- 检查 `/scenic-3d-map` 左侧可以切换 3D 路线，站点列表随路线变化。
- 检查“查看整条路线真实地图”使用当前 sceneRoute id。
- 检查未修改 `/map`、`GuideMapPage.tsx`、`routePlanning.ts`、真实经纬度坐标和 `scenePosition`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/scenic-3d-map`，分别切换历史文化、自然风光和亲子路线，检查金线是否覆盖对应站点。
- 后续可继续优化 3D 路线视觉，例如给不同路线使用不同金线层级、增加当前路线段高亮或路线分段播放。
- 如果后续获得真实园区道路折线，应新增独立数据层，把真实步行 geometry 与艺术化 `poiSequence` 区分管理。

## 2026-05-29 阶段三十二：真实坐标到 3D scenePosition 映射评估

### 本次目标

建立一个可复用的真实经纬度到 3D 场景坐标的映射工具，并生成当前 19 个 POI 的真实投影坐标与现有 `scenePosition` 的对比评估报告。

本阶段只做工具和评估，不直接覆盖现有 `scenePosition`。

### 本次约束

- 新增真实经纬度到 3D 坐标的映射工具。
- 生成对比/评估文档。
- 不修改现有 `scenePosition`。
- 不修改 `/scenic-3d-map` 渲染逻辑。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `displayLocation` / `navLocation`。
- 不新增真实 `.glb` / `.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/lib/scenic3d/geoToScene.ts`
- `docs/lingshan-scene-position-mapping-report.md`
- `docs/map-3d-development-log.md`

### geoToScenePosition 工具说明

新增 `src/lib/scenic3d/geoToScene.ts`，导出：

- `ScenePoint`
- `GeoPoint`
- `GeoToSceneOptions`
- `geoToScenePosition(point, options)`

工具使用近似局部平面投影：

- `x` 表示东西方向。
- `z` 表示南北方向。
- `y` 默认是 `0`。
- `center` 作为投影中心。
- `scale` 默认是 `0.01`。

该工具不依赖 Three.js，不读取环境变量，适合后续在数据层或构建脚本中复用。

### 为什么不直接覆盖现有 scenePosition

当前 `/scenic-3d-map` 的视觉构图已经围绕人工 `scenePosition` 做过镜头、山体、水面、标签和路线优化。直接用真实投影坐标覆盖会改变入口区、大佛区、梵宫区、坛城区和出口之间的画面关系，可能破坏现有演示效果。

本阶段报告显示：部分 POI 与真实投影方向大致一致，但入口区、灵山大佛、五印坛城、三圣殿等点存在明显人工构图偏移。因此更稳妥的方向是后续采用“真实投影坐标 + artisticOffset”或独立 `lingshanSceneLayout.ts`，而不是直接覆盖现有 `scenePosition`。

### 当前 3D 地图与真实地图的绑定关系说明

当前系统通过 `poiId` 建立真实地图和 3D 艺术地图之间的连接：

- `displayLocation` / `navLocation`：真实地图坐标，用于 `/map` 和腾讯地图能力。
- `scenePosition`：3D 场景坐标，用于 `/scenic-3d-map`。
- `lingshanSceneRoutes.poiSequence`：通过 `poiId` 连接 3D 导览路线和站点。
- `lingshanSceneRouteToGuideRouteMap`：通过 sceneRoute id 连接 3D 艺术路线和真实 guideRoute。

本阶段新增的投影工具用于评估真实坐标和 3D 坐标之间的关系，不改变上述运行逻辑。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map` 渲染逻辑。页面仍读取现有 `scenePosition`，仍显示 19 个核心游线节点，并支持三条 3D 导览路线切换。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯地图路线规划逻辑、真实 POI 坐标、Marker、Polyline 或 InfoWindow。真实地图导览页行为不变。

### 验证方式

- 检查 `src/lib/scenic3d/geoToScene.ts` 只包含纯函数和类型定义，不依赖 Three.js 或环境变量。
- 检查 `docs/lingshan-scene-position-mapping-report.md` 已包含 19 个 POI 的当前 `scenePosition` 与投影坐标对比表。
- 检查没有修改 `src/data/lingshanMapData.ts` 中现有 `scenePosition`、`displayLocation`、`navLocation` 或腾讯 POI 字段。
- 检查没有修改 `/scenic-3d-map` 渲染逻辑、`/map`、`GuideMapPage.tsx`、`routePlanning.ts`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 下一阶段可以新增独立 `src/data/scenic3d/lingshanSceneLayout.ts`，同时保存投影坐标、人工偏移和最终 3D 展示坐标。
- 可以考虑新增 `scenePositionSource` 或 `artisticOffset`，明确哪些点来自真实投影，哪些点经过人工构图。
- 不建议直接覆盖现有 `scenePosition`，应先在独立 layout 数据层做 A/B 对比，再决定是否迁移。

## 2026-05-29 阶段三十三：scenePosition 来源与偏移字段补充

### 本次目标

为 `LingshanPoi` 的 3D 坐标体系增加来源字段和未来偏移字段，使后续可以从当前 manual `scenePosition` 渐进迁移到 projected + artisticOffset 布局。

本阶段只做数据结构准备，不改变当前 `/scenic-3d-map` 视觉效果。

### 本次约束

- 只修改 POI 类型与数据结构、文档记录。
- 不改变当前 `scenePosition` 数值。
- 不改变 `/scenic-3d-map` 渲染逻辑。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `displayLocation` / `navLocation`。
- 不新增真实 `.glb` / `.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/data/lingshanMapData.ts`
- `docs/lingshan-scene-position-mapping-report.md`
- `docs/map-3d-development-log.md`

### 新增字段说明

`LingshanPoi` 新增：

- `scenePositionSource?: 'manual' | 'projected' | 'projected_with_offset'`
- `sceneOffset?: { x: number; y?: number; z: number }`

字段含义：

- `manual`：当前 `scenePosition` 为人工艺术化坐标。
- `projected`：未来可表示 `scenePosition` 由真实经纬度投影生成。
- `projected_with_offset`：未来可表示 `scenePosition` 由投影坐标加艺术偏移得到。
- `sceneOffset`：未来用于记录相对于投影坐标的视觉构图偏移。

### 为什么当前设置为 manual

当前 19 个拥有 `scenePosition` 的 POI 均来自人工艺术化布局，而不是 `geoToScenePosition` 自动投影。

阶段三十二的评估报告显示，部分点与真实投影方向一致，但也有入口区、灵山大佛、五印坛城、三圣殿等点存在明显人工构图偏移。将这些现有坐标标记为 `manual`，可以准确表达当前数据来源，也为后续逐步迁移留出空间。

### 为什么本阶段不改变 scenePosition 数值

当前 `/scenic-3d-map` 已经围绕现有 `scenePosition` 完成 19 个节点展示、三条 3D 路线切换、镜头、山水背景、标签和金线视觉优化。

直接调整或覆盖 `scenePosition` 会改变当前演示效果，并可能引入标签遮挡、路线变形和构图失衡。本阶段只补元数据，不改变任何坐标值。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map` 渲染逻辑。页面仍按原方式读取 `scenePosition`，视觉效果保持不变。

新增字段只是数据层元信息，当前页面不会读取 `scenePositionSource` 或 `sceneOffset`。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯地图路线规划逻辑、真实 POI 坐标、Marker、Polyline 或 InfoWindow。真实地图导览页行为不变。

### 验证方式

- 检查 `LingshanPoi` 已新增 `scenePositionSource` 和 `sceneOffset` 可选字段。
- 检查 19 个已有 `scenePosition` 的 POI 均生成 `scenePositionSource: 'manual'`。
- 检查没有修改 `LINGSHAN_SCENE_POSITIONS` 中任何坐标数值。
- 检查没有修改 `displayLocation`、`navLocation`、腾讯 POI 字段或 `bindStatus`。
- 检查没有修改 `/scenic-3d-map` 渲染逻辑、`/map`、`GuideMapPage.tsx`、`routePlanning.ts`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 后续可新增 `src/data/scenic3d/lingshanSceneLayout.ts`，集中管理 projected 坐标、artistic offset、final scene position、标签偏移和显示层级。
- 可在不影响当前页面的前提下做一套 projected layout 预览，用于和现有 manual 布局 A/B 对比。
- 等视觉和空间关系确认后，再考虑将部分 POI 迁移为 `projected_with_offset`。

## 2026-05-29 阶段三十四：3D 布局模式切换对比

### 本次目标

为 `/scenic-3d-map` 增加 3D 布局模式切换能力，用于对比当前艺术构图布局和基于真实经纬度投影生成的真实投影布局。

本阶段只做可视化对比能力，不覆盖现有 `scenePosition`，不修改真实 POI 坐标。

### 本次约束

- 只修改 `/scenic-3d-map` 的布局模式选择和 3D 场景位置计算。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 `displayLocation` / `navLocation`。
- 不修改现有 `scenePosition` 数值。
- 不新增真实 `.glb` / `.gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不使用 `git add .`。

### 修改文件清单

- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### layoutMode 说明

`Scenic3DMapScene` 新增 `layoutMode?: 'manual' | 'projected'`。

默认值为 `manual`，确保 `/scenic-3d-map` 打开后仍保持现有艺术化视觉构图。

### manual 模式说明

`manual` 模式保持原有行为：

- 核心地标读取 `lingshanPois.scenePosition`。
- 19 个核心游线节点读取 `lingshanPois.scenePosition`。
- `routePoiSequence` 生成金色路线时也读取 `scenePosition`。
- 如果某个点没有 `scenePosition`，继续使用原有核心地标 fallback。

该模式对应当前人工艺术化构图，更适合演示、讲解和水墨导览视觉。

### projected 模式说明

`projected` 模式在运行时基于真实坐标计算 3D 位置：

- 对每个 POI 读取 `displayLocation`。
- 使用 `geoToScenePosition(displayLocation, { center: scenicCenter })` 得到 3D 坐标。
- 核心地标、19 个节点、标签、选中高亮和金色路线都使用 projected 坐标。
- 如果某个点无法生成 projected 坐标，则 fallback 到现有 `scenePosition`。

该模式用于对比真实空间方位，不代表最终视觉方案已经采用。

### geoToScenePosition 如何用于 projected 模式

`Scenic3DMapScene` 在 `projected` 模式下调用阶段三十二新增的 `geoToScenePosition` 工具。工具使用 `scenicCenter` 作为中心点，将经纬度近似投影为 Three.js 场景中的 `x/y/z`。

`x` 表示东西方向，`z` 表示南北方向，`y` 保持为 `0`。该计算只发生在前端运行时，不写回数据文件。

### 为什么本阶段不覆盖 scenePosition

现有 `scenePosition` 已经服务于当前水墨导览构图、镜头、标签、路线和核心地标摆放。直接覆盖会破坏当前可演示效果。

本阶段增加切换对比，是为了评估真实投影布局是否适合作为后续 `projected + artisticOffset` 的基础。确认方案前，不应修改现有数据。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 左侧新增“3D 布局模式”切换：

- 艺术构图：默认选中，使用现有人工 `scenePosition`。
- 真实投影：使用真实 `lat/lng` 运行时投影结果。

切换后，核心地标、节点、标签、选中高亮和金色路线会随布局模式更新。路线选择、站点列表、真实地图跳转按钮和 `/map?poi`、`/map?sceneRoute` 参数保持不变。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯地图路线规划逻辑、真实 POI 坐标、Marker、Polyline 或 InfoWindow。真实地图导览页行为不变。

### 验证方式

- 检查 `Scenic3DMapScene` 新增 `layoutMode` 并默认为 `manual`。
- 检查 `manual` 模式继续使用 `lingshanPois.scenePosition`。
- 检查 `projected` 模式使用 `geoToScenePosition(displayLocation, { center: scenicCenter })`。
- 检查核心地标、19 个节点和 `routePoiSequence` 金线都按当前 `layoutMode` 计算位置。
- 检查 `/scenic-3d-map` 页面可以切换“艺术构图 / 真实投影”。
- 检查没有修改 `lingshanMapData.ts`、真实坐标、现有 `scenePosition`、`/map`、`GuideMapPage.tsx` 或 `routePlanning.ts`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/scenic-3d-map`，在三条 3D 导览路线下分别切换艺术构图和真实投影，观察节点相对方位、标签遮挡和路线可读性。
- 如果 projected 模式的真实空间关系更合理，下一阶段可新增独立 `lingshanSceneLayout.ts`，保存 projected 坐标、artistic offset 和最终布局坐标。
- 不建议直接把 projected 模式写回 `scenePosition`，应先通过 UI 对比确认视觉和导览体验。

## 阶段三十五：默认使用 projected 真实投影布局

### 日期

2026-05-29

### 本次目标

将 `/scenic-3d-map` 的用户可见布局收敛到 `projected` 真实投影模式，让沉浸式 3D 地图默认依据景点真实经纬度生成空间骨架。

### 本次约束

- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 `displayLocation` / `navLocation`。
- 不修改现有 `scenePosition` 数值。
- 不删除 `scenePositionSource` 或 `sceneOffset` 字段。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/Scenic3DMapPage.tsx`
- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `docs/map-3d-development-log.md`

### 为什么废弃 manual 作为用户可见模式

`manual` 使用人工 `scenePosition`，适合作为开发回退和早期构图试验，但当前效果既不够真实，也不适合作为用户主视觉继续优化。继续把 `manual` 暴露给普通用户会让 3D 地图方向分散，并可能误导用户把人工构图理解为真实空间关系。

本阶段移除 `/scenic-3d-map` 页面中用户可见的“艺术构图 / 真实投影”切换入口，让普通用户只看到基于真实坐标近似投影的 3D 地图。

### 为什么 projected 更适合作为真实空间骨架

`projected` 模式基于 `displayLocation` 的真实经纬度计算 3D 场景坐标，能保留核心景点之间更接近真实的相对方向和空间关系。后续水墨风格、低模节点、金线路线和 Blender 资产都可以在这个真实空间骨架上继续美化，而不是围绕人工坐标反复调整。

### projected 模式如何计算坐标

`Scenic3DMapScene` 默认 `layoutMode` 改为 `projected`。

在 `projected` 模式下，组件通过 `geoToScenePosition(displayLocation, { center: scenicCenter })` 将 POI 的真实 `lat/lng` 近似投影为 Three.js 场景坐标：

- `x` 表示东西方向。
- `z` 表示南北方向。
- `y` 保持为 `0`。
- 核心地标、19 个核心游线节点、标签、高亮状态和金色路线都使用该模式下计算出的坐标。

该计算只发生在前端运行时，不写回 `lingshanMapData.ts`。

### manual 模式保留用途

`Scenic3DMapScene` 仍保留 `layoutMode?: 'manual' | 'projected'` 的兼容能力，避免已有调用或后续开发调试需要回退时失效。

`manual` 分支继续读取现有 `scenePosition`，但不再作为 `/scenic-3d-map` 的普通用户可见入口。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 默认并固定传入 `layoutMode="projected"`。页面文案更新为真实投影说明，强调该 3D 地图依据景点真实经纬度进行近似投影，用于表达景区核心游线与空间关系。

路线选择、站点点击、高亮、`/map?poi=xxx`、`/map?sceneRoute=xxx` 和返回真实地图按钮保持不变。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯地图路线规划逻辑、真实 POI 坐标、Marker、Polyline 或 InfoWindow。真实地图导览页行为不变。

### 验证方式

- 检查 `/scenic-3d-map` 页面不再显示“艺术构图 / 真实投影”切换入口。
- 检查 `Scenic3DMapPage` 固定向 `Scenic3DMapScene` 传入 `layoutMode="projected"`。
- 检查 `Scenic3DMapScene` 的 `layoutMode` 默认值为 `projected`。
- 检查 `projected` 模式仍使用 `displayLocation` 和 `geoToScenePosition` 运行时计算坐标。
- 检查没有修改 `displayLocation`、`navLocation` 或现有 `scenePosition` 数值。
- 检查没有修改 `/map`、`GuideMapPage.tsx`、`routePlanning.ts` 或腾讯地图路线规划逻辑。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/scenic-3d-map`，检查三条 3D 导览路线在 projected 布局下的节点分布、标签遮挡和金线路线可读性。
- 后续可基于 projected 真实空间骨架做视觉优化，例如局部 artistic offset、标签避让、镜头参数、山水背景与路线层级。
- 不建议重新把 `manual` 作为用户可见模式，除非作为开发调试入口单独隔离。

## 阶段三十六：真实地图 sceneRoute 骨架线调试叠加

### 日期

2026-05-29

### 本次目标

在 `/map` 中增加一个可选调试叠加层，用于把 3D `sceneRoute` 的 POI 中心骨架连线叠加到腾讯地图真实底图上，方便对比 3D 导览线与腾讯 walking 路线之间的差异。

### 本次约束

- 不修改 `/scenic-3d-map`。
- 不修改腾讯 walking route 规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### debugSceneRoute 查询参数说明

新增调试入口：

- `/map?sceneRoute=<sceneRouteId>&debugSceneRoute=1`
- `/map?sceneRoute=<sceneRouteId>&debugSceneRoute=true`

只有同时存在 `sceneRoute`，并且 `debugSceneRoute` 为 `1` 或 `true` 时，才会在真实腾讯地图上额外绘制 3D `sceneRoute` 骨架线。

普通 `/map`、`/map?sceneRoute=classic_3d_scene`、`/map?poi=xxx` 不会显示调试线。

### 3D sceneRoute 骨架线的数据来源

调试线从 `lingshanSceneRoutes` 中按 `sceneRoute` id 查找路线，读取其 `poiSequence`，再逐个将 `poiId` 转换为真实地图坐标：

1. 优先使用 `lingshanPois.displayLocation`。
2. 如果缺少对应 POI，则回退到 `guideSpots` 中的 `lat/lng`。
3. 生成 `LatLngPoint[]` 后，用独立的 `TMap.MultiPolyline` 图层绘制。

调试图层使用独立 `sceneRouteDebugLayerRef` 管理。关闭调试、切换 `sceneRoute` 或页面卸载时，会清理旧图层，避免地图残留多条调试线。

### 骨架线为什么不等同真实步行道路

3D `sceneRoute` 的 `poiSequence` 表达的是导览站点顺序和讲解节奏。调试线只是把这些 POI 的真实坐标按顺序直连，属于 POI 中心骨架连线。

它不包含腾讯 walking route 的道路折线、转弯、步道绕行、入口点或真实可通行路网，因此不能作为真实步行导航使用。

### 如何与腾讯 walking 路线对比

真实地图页原有蓝绿色路线仍由腾讯 walking route 或当前真实地图路线逻辑绘制。新增金色调试线用于显示 3D `sceneRoute` 的 POI 骨架连线。

页面在调试模式下显示轻量提示：

- 金色线为 3D `sceneRoute` 的 POI 骨架连线，不代表真实步行道路。
- 蓝绿色路线为腾讯 walking 或当前真实地图路线。

如果金色线明显穿过建筑、水面或核心地台，说明 3D 艺术路线需要后续通过真实路径点串、人工控制点或 `artisticOffset` 进行修正。

### 对 /map 的影响

`/map` 增加了一个仅 query 参数开启的调试叠加层。默认访问 `/map` 时行为不变：

- 不显示调试线。
- 不改变 Marker、Polyline、InfoWindow。
- 不改变 `/map?poi=xxx` 的聚焦逻辑。
- 不改变 `/map?sceneRoute=xxx` 到 guideRoute 的映射逻辑。
- 不改变腾讯 walking route 规划、缓存或兜底逻辑。

当 `/map?poi=xxx&sceneRoute=xxx&debugSceneRoute=1` 同时存在时，`poi` 仍用于初始聚焦，调试线可以同时显示。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、3D 场景、3D 路线、`scenePosition`、`layoutMode` 或任何模型资产。该调试能力只服务于真实地图页上的空间对照。

### 验证方式

- 检查 `/map` 普通访问时不显示金色调试线。
- 检查 `/map?sceneRoute=classic_3d_scene` 不显示金色调试线。
- 检查 `/map?sceneRoute=classic_3d_scene&debugSceneRoute=1` 显示金色 POI 骨架线和调试提示。
- 检查 `/map?sceneRoute=classic_3d_scene&debugSceneRoute=true` 同样启用调试线。
- 检查 `/map?poi=giant_buddha&sceneRoute=classic_3d_scene&debugSceneRoute=1` 仍优先聚焦灵山大佛，同时显示调试线。
- 检查关闭或切换 query 后旧调试图层被清理。
- 检查没有修改 `/scenic-3d-map`、`routePlanning.ts`、真实 POI 坐标、`displayLocation`、`navLocation` 或 `scenePosition`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 用 `/map?sceneRoute=<id>&debugSceneRoute=1` 分别检查历史文化、自然风光和亲子 3D 路线的骨架线。
- 对明显穿越建筑或偏离真实道路的位置，优先记录需要人工控制点的路线段。
- 后续可以新增独立的 3D route control points 数据层，用真实地图调试结果反向修正 `/scenic-3d-map` 的金线路线。

## 阶段三十七：路线诊断信息增强与手机端局域网验证指南

### 日期

2026-05-29

### 本次目标

增强 `/map` 在 `debugSceneRoute` 调试模式下的路线诊断信息，让开发者能判断蓝绿色路线是腾讯 walking 成功结果，还是 fallback 直线兜底。同时新增手机端局域网人工验证指南，用于在真实移动端环境下验证地图、3D 和路线表现。

### 本次约束

- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不新增 `routeGeometry`。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/mobile-lan-route-verification.md`
- `docs/map-3d-development-log.md`

### plannedRoute 调试字段说明

`/map?sceneRoute=<sceneRouteId>&debugSceneRoute=1` 或 `debugSceneRoute=true` 时，真实地图调试提示中新增 `plannedRoute` 诊断信息：

- `activeRouteId`：当前真实地图正在展示的 guideRoute id。
- `query sceneRoute`：URL 中传入的 3D sceneRoute id。
- `path 点数`：`plannedRoute.path.length`。
- `距离`：`plannedRoute.distanceMeters`。
- `耗时`：`plannedRoute.durationMinutes`。
- `usedFallback`：是否存在 fallback。
- `fallbackReason`：如果存在，则显示腾讯路线规划失败或兜底原因。
- `路线来源`：根据 `usedFallback` 判断是腾讯 walking route 成功，还是存在 fallback 直线兜底段或整条路线兜底。

如果 `plannedRoute` 尚未生成，调试区域显示“路线生成中”。

### fallbackReason 暴露的意义

此前页面只显示“兜底路线”，无法判断路线不贴路是腾讯 walking 返回结果本身的问题，还是请求失败后的 POI 直线兜底。暴露 `usedFallback`、`fallbackReason` 和 `path 点数` 后，可以更直接地区分：

- `usedFallback=false`：蓝绿色线来自腾讯 walking route 成功返回的 polyline。
- `usedFallback=true`：至少存在一段 fallback，蓝绿色线可能包含 POI 直线连接。

这能帮助后续判断是否应优先修正 Key / 请求 / 路网问题，还是建设园区自有 `routeGeometry`。

### 为什么需要手机端局域网人工验证

电脑端和手机端在地图 SDK、WebGL、触摸手势、视口尺寸和网络环境上表现可能不同。用户实际更接近手机端场景，因此需要通过局域网访问 Mac 上的 Vite dev server，验证：

- `/scenic-3d-map` 是否能在移动端加载和交互。
- `/map` 是否能在移动端显示腾讯地图、Marker 和 InfoWindow。
- 手机端蓝绿色路线是否比电脑端更合理。
- `debugSceneRoute` 调试信息是否足够判断 fallback 状态。

新增 `docs/mobile-lan-route-verification.md` 记录了启动 dev server、获取 Mac 局域网 IP、手机访问前提、验证 URL、验证清单和 iPhone Safari 远程调试建议。

### 对 /map 的影响

普通 `/map` 行为不变。新增诊断信息只在 `debugSceneRoute=1` 或 `debugSceneRoute=true` 时展示。

本阶段没有改变 Marker、InfoWindow、Polyline 核心逻辑，没有改变 `/map?poi=xxx` 聚焦逻辑，也没有改变 `sceneRoute` 到 guideRoute 的映射逻辑。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、3D 场景、3D 路线、`scenePosition`、`layoutMode` 或模型资产。

### 验证方式

- 检查普通 `/map` 不显示 plannedRoute 诊断信息。
- 检查 `/map?sceneRoute=historical_3d_scene&debugSceneRoute=1` 显示 activeRouteId、query sceneRoute、path 点数、距离、耗时、usedFallback 和路线来源。
- 检查 fallbackReason 缺失时页面不报错。
- 检查 plannedRoute 尚未生成时显示“路线生成中”。
- 检查没有修改 `routePlanning.ts`、腾讯 walking route 规划算法、POI 坐标、`navLocation`、`scenePosition` 或 `/scenic-3d-map`。
- 检查 `docs/mobile-lan-route-verification.md` 已生成，并包含手机端局域网验证流程。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 使用手机访问 `/map?sceneRoute=historical_3d_scene&debugSceneRoute=1`、`natural_3d_scene`、`family_3d_scene`，记录 `usedFallback` 和路线贴路情况。
- 如果 `usedFallback=true`，优先排查腾讯 walking 请求、Key 权限和网络加载。
- 如果 `usedFallback=false` 但仍明显不贴园区道路，后续应优先建设 `navLocation` 人工修正和园区 `routeGeometry` 数据。

## 阶段三十八：腾讯 walking path JSON 导出按钮

### 日期

2026-05-29

### 本次目标

在 `/map` 的 `debugSceneRoute` 调试模式中增加“复制腾讯路线 path JSON”按钮，让开发者可以把当前运行时腾讯 walking 返回的 `plannedRoute.path` 复制出来，作为后续整理静态 `routeGeometry` 的候选数据。

### 本次约束

- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不新增 `routeGeometry` 静态数据。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 为什么 usedFallback=false 后仍需要导出 path

`usedFallback=false` 只能说明腾讯 walking route 请求成功，并且返回了 polyline。它不代表路线一定完全贴合园区内部真实步道。

园区内部道路可能存在腾讯路网不完整、POI 终点落在建筑中心、入口点不准确等问题。因此需要先把腾讯返回的 path 导出，作为第一版候选路线，再结合真实园区导览图和人工观察进行修正。

### 导出 JSON 字段说明

调试按钮复制的 JSON 结构包含：

- `routeId`：当前真实地图使用的 guideRoute id。
- `sceneRoute`：URL 中的 3D sceneRoute id。
- `generatedAt`：导出时间，ISO 字符串。
- `source`：固定为 `tencent_walking_runtime`。
- `pointCount`：`plannedRoute.path.length`。
- `distanceMeters`：腾讯 walking 或兜底结果距离。
- `durationMinutes`：腾讯 walking 或兜底结果耗时。
- `usedFallback`：是否存在 fallback。
- `fallbackReason`：fallback 原因，没有则为 `null`。
- `path`：腾讯 walking 返回的经纬度点串。

复制优先使用 `navigator.clipboard.writeText`。如果浏览器不支持或复制失败，则把 JSON 字符串输出到控制台，并在页面提示“复制失败，已输出到控制台。”

### 导出的 path 后续如何用于 routeGeometry

导出的 `path` 是真实经纬度点串，可以作为人工建设 `routeGeometry` 的第一版候选数据：

1. 先按 guideRoute / sceneRoute 收集三条路线的腾讯 walking path。
2. 在真实地图上对照园区道路，删除不合理绕行或穿越建筑的点段。
3. 对关键路线段补充人工控制点。
4. 保存为后续静态 `routeGeometry` 数据。
5. 3D 场景中使用时，需要通过 `geoToScenePosition` 或后续路线映射转换为 Three.js 坐标。

### 为什么本阶段不自动写入静态数据

运行时腾讯 path 只是候选数据，仍需要人工确认是否贴合园区真实步道。自动写入源码会把未经校验的路线固化，后续可能误导真实导航和 3D 路线表达。

本阶段只提供复制能力，不下载文件、不写入源码、不新增静态 `routeGeometry`。

### 对 /map 的影响

普通 `/map` 行为不变。只有 `debugSceneRoute=1` 或 `debugSceneRoute=true` 时，调试卡片中显示导出说明和复制按钮。

本阶段没有改变 Marker、Polyline、InfoWindow、`/map?poi=xxx` 聚焦逻辑、sceneRoute 映射逻辑或腾讯 walking route 规划逻辑。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、3D 场景、3D 路线、`scenePosition`、`layoutMode` 或任何模型资产。

### 验证方式

- 检查普通 `/map` 不显示“复制腾讯路线 path JSON”按钮。
- 检查 `/map?sceneRoute=historical_3d_scene&debugSceneRoute=1` 显示复制按钮。
- 检查路线尚未生成时按钮不可用或提示“路线尚未生成”。
- 检查路线生成后点击按钮能复制包含 routeId、sceneRoute、generatedAt、source、pointCount、distanceMeters、durationMinutes、usedFallback、fallbackReason 和 path 的 JSON。
- 检查 Clipboard API 不可用或失败时，JSON 输出到控制台并显示失败提示。
- 检查没有修改 `routePlanning.ts`、腾讯 walking route 规划算法、POI 坐标、`displayLocation`、`navLocation`、`scenePosition` 或 `/scenic-3d-map`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 分别打开三条路线的 debug URL，复制腾讯 walking path JSON。
- 将导出的 JSON 先保存为人工工作材料，不直接进入源码。
- 下一阶段可以新增 routeGeometry 草稿文档或数据导入任务，对腾讯 path 进行人工修正和分段标注。

## 阶段三十八 B：腾讯 walking path JSON 下载按钮

### 日期

2026-05-29

### 本次目标

在 `/map` 的 `debugSceneRoute` 调试模式中，在已有“复制腾讯路线 path JSON”能力旁边新增“下载腾讯路线 path JSON”按钮，让开发者可以直接从浏览器下载当前 `plannedRoute.path` 及元信息。

### 本次约束

- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不新增 `routeGeometry` 静态数据。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 为什么不能让 Codex 直接保存浏览器运行时 path

腾讯 walking path 是浏览器运行时通过 `/map` 页面请求并解码得到的数据，Codex 在代码编辑环境中无法直接读取浏览器内存、剪贴板或当前页面状态。即使页面已经显示路线，运行时 `plannedRoute.path` 也只存在于浏览器环境中。

因此需要在页面内提供下载按钮，让开发者从浏览器导出 JSON 文件，再人工放入 `tmp/route-exports` 或交给后续任务整理。

### 下载按钮实现方式

`GuideMapPage` 复用阶段三十八已有的导出 payload，新增 `handleDownloadWalkingRoutePathJson`：

1. 如果当前 `plannedRoute` 尚未生成，提示“路线尚未生成”。
2. 将 payload 用 `JSON.stringify(payload, null, 2)` 转成字符串。
3. 使用 `Blob` 创建 `application/json;charset=utf-8` 文件内容。
4. 使用 `URL.createObjectURL` 创建临时下载地址。
5. 创建临时 `a` 标签并触发 `click()`。
6. 下载后释放 object URL。
7. 成功后提示“已生成下载文件”。

本阶段不自动写入源码，也不自动写入 `tmp/route-exports`。

### 下载 JSON 字段说明

下载内容与复制按钮保持一致，包含：

- `routeId`：当前真实地图使用的 guideRoute id。
- `sceneRoute`：URL 中的 3D sceneRoute id。
- `generatedAt`：下载时间，ISO 字符串。
- `source`：固定为 `tencent_walking_runtime`。
- `pointCount`：`plannedRoute.path.length`。
- `distanceMeters`：腾讯 walking 或兜底结果距离。
- `durationMinutes`：腾讯 walking 或兜底结果耗时。
- `usedFallback`：是否存在 fallback。
- `fallbackReason`：fallback 原因，没有则为 `null`。
- `path`：腾讯 walking 返回的经纬度点串。

### 下载文件命名规则

如果 URL 中存在 `querySceneRoute`，下载文件名为：

`<querySceneRoute>.tencent-walking.json`

例如：

- `historical_3d_scene.tencent-walking.json`
- `natural_3d_scene.tencent-walking.json`
- `family_3d_scene.tencent-walking.json`

如果没有 `querySceneRoute`，则使用当前 `activeRouteId`：

`<activeRouteId>.tencent-walking.json`

### 后续如何把下载文件整理为 routeGeometry

下载得到的 JSON 可以先由人工暂存到 `tmp/route-exports`，再执行后续整理任务：

1. 按路线收集腾讯 walking runtime path。
2. 对照真实地图和园区导览图检查是否穿越建筑、水面或不可通行区域。
3. 删除不合理点段或补充人工控制点。
4. 转换为静态 `routeGeometry` 候选数据。
5. 3D 使用时再通过 `geoToScenePosition` 或路线映射转换为 Three.js 坐标。

### 对 /map 的影响

普通 `/map` 行为不变。只有 `debugSceneRoute=1` 或 `debugSceneRoute=true` 时，调试卡片中显示复制和下载按钮。

本阶段没有改变 Marker、Polyline、InfoWindow、`/map?poi=xxx` 聚焦逻辑、sceneRoute 映射逻辑或腾讯 walking route 规划逻辑。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、3D 场景、3D 路线、`scenePosition`、`layoutMode` 或任何模型资产。

### 验证方式

- 检查普通 `/map` 不显示“下载腾讯路线 path JSON”按钮。
- 检查 `/map?sceneRoute=historical_3d_scene&debugSceneRoute=1` 显示下载按钮。
- 检查路线尚未生成时下载按钮不可用或提示“路线尚未生成”。
- 检查路线生成后点击下载按钮会生成 `<querySceneRoute>.tencent-walking.json` 文件。
- 检查 JSON 字段包含 routeId、sceneRoute、generatedAt、source、pointCount、distanceMeters、durationMinutes、usedFallback、fallbackReason 和 path。
- 检查复制按钮功能仍保留。
- 检查没有修改 `routePlanning.ts`、腾讯 walking route 规划算法、POI 坐标、`displayLocation`、`navLocation`、`scenePosition` 或 `/scenic-3d-map`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 在浏览器中分别打开三条路线的 debug URL，并下载对应 JSON。
- 将浏览器下载得到的 JSON 人工暂存到 `tmp/route-exports`，不要直接提交。
- 后续新增 routeGeometry 草稿阶段时，再由 Codex 读取这些人工确认的导出文件进行整理。

## 阶段四十：3D 金线优先使用 routeGeometry

### 日期

2026-05-29

### 本次目标

让 `/scenic-3d-map` 的金色路线优先使用阶段三十九生成的 `lingshanRouteGeometries` 候选路线几何。当前 `sceneRoute` 如果存在对应 `routeGeometry.path`，则将经纬度点串投影为 3D 坐标绘制金线；如果不存在，则回退到原有 `routePoiSequence` 节点连线。

### 本次约束

- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不提交 `tmp/route-exports` 原始 JSON。

### 修改文件清单

- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### routeGeometryPath 如何从 lingshanRouteGeometries 传入 Scenic3DMapScene

`Scenic3DMapPage` 根据当前 `currentRoute.id` 调用：

`getLingshanRouteGeometryBySceneRouteId(currentRoute.id)`

如果找到候选几何，则把 `currentRouteGeometry.path` 作为 `routeGeometryPath` 传给 `Scenic3DMapScene`。页面同时显示路线几何来源：

- 有 routeGeometry：`腾讯 walking 候选路径`
- 无 routeGeometry：`POI 节点骨架`

页面还展示候选路径点数和状态，例如 `candidate，需要人工核对`。

### routeGeometryPath 如何经 geoToScenePosition 映射到 3D

`Scenic3DMapScene` 新增 `routeGeometryPath?: Array<{ lat: number; lng: number }>`。

当 `routeGeometryPath.length >= 2` 时，场景组件使用：

`geoToScenePosition(point, { center: scenicCenter })`

将每个经纬度点转换为 Three.js 场景坐标，并生成 3D 金线路线点。该过程使用与 projected layout 一致的 `scenicCenter` 和默认 scale。

这些几何点只用于路线曲线，不会被渲染成节点、标签或可点击对象，避免几百个 path 点影响 UI 复杂度。

### 为什么比 POI 中心连线更合理

原有金线由 `routePoiSequence` 的 POI 中心点连接而成，容易穿过建筑、地台或水面，只能表达站点顺序。

候选 `routeGeometry.path` 来自腾讯 walking runtime 返回的 polyline，包含更多中间路径点，更接近真实步行路线形态，因此比 POI 中心直连更适合作为 3D 金线基础。

### 为什么 routeGeometry 仍是 candidate

虽然三条候选路线的 `usedFallback=false`，说明腾讯 walking 请求成功，但这不代表路线已经人工确认完全贴合园区内部步道。腾讯路网、POI 终点位置和园区内部道路精度仍可能存在偏差。

因此当前 `routeGeometry` 仍是 `candidate`，后续需要人工核对后才能升级为 `verified`。

### fallback 到 routePoiSequence 的条件

如果当前 `sceneRoute.id` 找不到对应 `routeGeometry`，或传入的 `routeGeometryPath` 不存在、点数不足 2，`Scenic3DMapScene` 会继续使用原有 `routePoiSequence` 逻辑生成金线。

这保证没有候选几何的兼容路线仍可显示导览路径，不会出现空路线。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 的金色路线优先使用候选 routeGeometry 投影后的路线几何。站点列表、POI 节点、标签、核心地标、选中高亮、跳转真实地图按钮和路线切换逻辑保持不变。

当前页面会显示路线几何来源、候选路径点数和状态，提醒该路径来自腾讯 walking runtime，仍需人工核对。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯 walking route 规划逻辑、Marker、Polyline、InfoWindow 或 query 参数行为。

### 验证方式

- 检查 `Scenic3DMapScene` 新增 `routeGeometryPath` prop。
- 检查 `routeGeometryPath.length >= 2` 时，金线使用 `geoToScenePosition(pathPoint, { center: scenicCenter })` 的投影结果。
- 检查缺少 routeGeometry 时，金线 fallback 到 `routePoiSequence`。
- 检查 `Scenic3DMapPage` 根据 `currentRoute.id` 读取 `getLingshanRouteGeometryBySceneRouteId`。
- 检查页面显示路线几何来源、候选路径点数和 `candidate` 状态。
- 检查没有修改 `/map`、`GuideMapPage.tsx`、`routePlanning.ts`、POI 坐标、`displayLocation`、`navLocation`、`scenePosition` 或 `lingshanRouteGeometries.ts` 数据内容。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 手动打开 `/scenic-3d-map`，分别切换历史文化、自然风光和亲子 3D 路线，观察金线是否更接近真实步行路径。
- 对金线仍穿越建筑或不合理绕行的局部段，建立人工修正清单。
- 后续可新增 `hybrid_corrected` 路线几何，逐段替换腾讯 walking 候选 path。

## 阶段三十九：腾讯 walking path 静态 routeGeometry 候选数据生成

### 日期

2026-05-29

### 本次目标

读取 `tmp/route-exports` 中三条腾讯 walking runtime 导出的 path JSON，校验后整理为正式的静态候选路线几何数据文件 `src/data/lingshanRouteGeometries.ts`，供后续 `/map` 和 `/scenic-3d-map` 接入 routeGeometry 使用。

### 本次约束

- 不修改 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯 walking route 规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不提交 `tmp/route-exports` 原始导出文件。

### 修改文件清单

- `src/data/lingshanRouteGeometries.ts`
- `docs/map-3d-development-log.md`

### 读取的 tmp/route-exports 文件列表

- `tmp/route-exports/historical_3d_scene.tencent-walking.json`
- `tmp/route-exports/natural_3d_scene.tencent-walking.json`
- `tmp/route-exports/family_3d_scene.tencent-walking.json`

三个文件均存在，且 `path` 为数组，点位均包含 `lat` / `lng`，`pointCount` 与 `path.length` 一致。

### 路线数据摘要

| sceneRoute | guideRoute | pointCount | distanceMeters | durationMinutes | usedFallback |
|---|---|---:|---:|---:|---|
| `historical_3d_scene` | `historical_culture` | 417 | 4945 | 76 | false |
| `natural_3d_scene` | `natural_scenery` | 365 | 4607 | 71 | false |
| `family_3d_scene` | `family` | 198 | 2497 | 37 | false |

### 为什么这些数据是 candidate 而不是 verified

这些几何数据来自腾讯 walking route 的运行时导出。`usedFallback=false` 说明腾讯请求成功并返回了 polyline，但不代表路线已经人工确认完全贴合灵山胜境园区内部步道。

腾讯路线可能仍受内部路网精度、POI 终点位置、园区可通行道路缺失等因素影响，因此当前状态统一标记为 `candidate`，需要后续结合园区导览图和人工现场/地图核对后，才能升级为 `manual_verified` 或 `verified`。

### 为什么不提交 tmp/route-exports 原始 JSON

`tmp/route-exports` 是浏览器下载的运行时中间产物，适合作为人工导出和临时交换目录，不应作为正式源码资产提交。

正式可复用数据已经整理进入 `src/data/lingshanRouteGeometries.ts`，后续只维护该结构化数据文件，避免提交重复的临时 JSON。

### 后续如何使用 lingshanRouteGeometries

`lingshanRouteGeometries.ts` 新增：

- `RouteGeometrySource`
- `RouteGeometryStatus`
- `RouteGeometryPoint`
- `LingshanRouteGeometry`
- `lingshanRouteGeometries`
- `getLingshanRouteGeometryBySceneRouteId`
- `getLingshanRouteGeometryByGuideRouteId`

后续可以：

1. 在 `/map` 中优先使用 candidate routeGeometry 作为预设路线调试图层。
2. 在 `/scenic-3d-map` 中把经纬度 path 通过 `geoToScenePosition` 转换为 3D 路线曲线。
3. 对不贴合园区步道的点段做人工修正，并将 `source` 升级为 `hybrid_corrected`。
4. 人工确认后将 `status` 从 `candidate` 升级为 `verified`。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯 walking route 规划逻辑、Marker、Polyline、InfoWindow 或 query 参数行为。新增数据文件尚未接入页面渲染。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、3D 场景、3D 路线、`scenePosition`、`layoutMode` 或模型资产。新增 routeGeometry 数据尚未接入 3D 场景。

### 验证方式

- 检查三个 `tmp/route-exports` JSON 文件存在。
- 校验每个 JSON 包含 `routeId`、`sceneRoute`、`source`、`pointCount`、`distanceMeters`、`durationMinutes`、`usedFallback`、`fallbackReason` 和 `path`。
- 校验 `path` 为数组，且每个点包含 `lat` / `lng`。
- 校验 `pointCount` 与 `path.length` 一致。
- 确认三个文件 `usedFallback=false`。
- 检查 `src/data/lingshanRouteGeometries.ts` 生成了 3 条 `candidate` routeGeometry。
- 检查没有修改 `/map`、`/scenic-3d-map`、`GuideMapPage.tsx`、`routePlanning.ts`、POI 坐标或 `scenePosition`。
- 运行 `npm run build`。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交，不提交 `tmp/route-exports` 原始 JSON。

### npm run build 结果

`npm run build` 通过。

构建输出仍有 Vite chunk size warning，这是体积提示，不是失败。

### 下一步建议

- 在 `/map` 中增加可控开关，使用 `lingshanRouteGeometries` 绘制候选 routeGeometry，与腾讯实时 walking route 对比。
- 在 `/scenic-3d-map` 中把 candidate routeGeometry 转换为 3D 曲线，替代简单 POI 顺序金线。
- 对明显不贴合园区步道的点段建立人工修正流程，再升级为 `hybrid_corrected`。

## 阶段四十一 A：忽略临时路线导出目录

### 日期

2026-05-29

### 本次目标

将 `tmp/` 临时目录加入 `.gitignore`，防止浏览器导出的腾讯 walking path 原始 JSON 被误提交。

### 本次约束

- 只修改 `.gitignore` 和开发记录。
- 不修改任何功能代码。
- 不修改 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 routeGeometry 数据。
- 不读取、不提交 `tmp/route-exports` 中的原始 JSON。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `.gitignore`
- `docs/map-3d-development-log.md`

### 临时目录说明

`tmp/route-exports` 是腾讯 walking path 原始导出的临时目录，用于浏览器下载运行时路线 JSON 后进行人工中转。

这些原始 JSON 是中间产物，不应提交到仓库。正式可复用的候选路线数据已经整理到 `src/data/lingshanRouteGeometries.ts`，后续应维护结构化 routeGeometry 数据，而不是提交临时导出文件。

### .gitignore 更新说明

新增忽略规则：

```gitignore
tmp/
```

保留已有环境变量忽略规则：

```gitignore
.env.local
.env*.local
```

本阶段没有添加普通 `.env` 忽略规则，也没有读取或修改任何环境变量文件。

### 对功能代码的影响

本阶段没有修改功能代码，不影响 `/map`、`/scenic-3d-map`、腾讯 walking route、routeGeometry、数字人、聊天、语音、RAG、Fay 或 Live2D 模块。

### 验证方式

- 检查 `.gitignore` 已包含 `tmp/`。
- 检查已有 `.env.local` / `.env*.local` 忽略规则仍保留。
- 运行 `git status`，确认 `tmp/` 不再作为未跟踪目录出现。
- 只添加 `.gitignore` 和 `docs/map-3d-development-log.md` 并提交。

### npm run build 结果

本阶段只修改 `.gitignore` 和 Markdown 文档，不涉及 TypeScript 或功能代码，因此未运行 `npm run build`。

### 下一步建议

- 保持 `tmp/route-exports` 作为本地人工导出中转目录。
- 后续如需整理路线数据，应从人工确认后的导出文件生成正式 `routeGeometry`，不要提交临时原始 JSON。

## 阶段四十一 B：routeGeometry 候选路线人工复核记录生成

### 日期

2026-05-29

### 本次目标

生成 `routeGeometry` 候选路线人工复核记录文档，明确当前三条候选路线的数据来源、候选状态、已知风险、人工复核方式和后续修正策略。

### 本次约束

- 只新增/更新文档。
- 不修改功能代码。
- 不修改 `src/data/lingshanRouteGeometries.ts`。
- 不修改 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。
- 不提交 `tmp/route-exports` 原始 JSON。

### 修改文件清单

- `docs/lingshan-route-geometry-review.md`
- `docs/map-3d-development-log.md`

### 当前 routeGeometry 来源说明

当前三条 `routeGeometry` 均来自腾讯 walking route runtime 导出，已整理到 `src/data/lingshanRouteGeometries.ts`：

| sceneRouteId | guideRouteId | source | status | pointCount | distanceMeters | durationMinutes | usedFallback |
|---|---|---|---|---:|---:|---:|---|
| `historical_3d_scene` | `historical_culture` | `tencent_walking_runtime` | `candidate` | 417 | 4945 | 76 | false |
| `natural_3d_scene` | `natural_scenery` | `tencent_walking_runtime` | `candidate` | 365 | 4607 | 71 | false |
| `family_3d_scene` | `family` | `tencent_walking_runtime` | `candidate` | 198 | 2497 | 37 | false |

### 为什么 usedFallback=false 仍不能直接 verified

`usedFallback=false` 只说明腾讯 walking 返回了路线 polyline，不代表景区内部步道完全准确。

灵山胜境内部广场、台阶、私有步道、观赏区和建筑入口可能不在腾讯路网中精确表达；如果 POI 起终点位于景点中心，也可能导致路线局部不贴路。因此 `usedFallback=false` 只能支持进入候选状态，不能直接升级为 `verified`。

### 已知问题说明

当前观察认为 `routeGeometry` 比 POI 中心连线更合理，但仍可能存在局部问题：

- 穿湖。
- 穿建筑。
- 不贴道路。
- 绕路异常。
- 入口点不合理。
- 需要现场或手机端进一步验证。

这些问题说明当前路线仍需人工逐段复核。

### 后续修正策略

- 策略 A：修正 `navLocation`，优先处理灵山大佛、梵宫、九龙灌浴、五印坛城等核心点。
- 策略 B：人工修正 `routeGeometry`，将局部异常段升级为 `hybrid_corrected`。
- 策略 C：建设园区自有路网，维护 road nodes / edges，自行生成路线。
- 策略 D：结合 `docs/mobile-lan-route-verification.md` 做手机端局域网人工验证。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯 walking route 规划逻辑、Marker、Polyline、InfoWindow 或 query 参数行为。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、3D 场景、3D 金线、`scenePosition`、`layoutMode` 或模型资产。文档仅记录候选路线复核方法和后续策略。

### 验证方式

- 检查 `docs/lingshan-route-geometry-review.md` 已生成。
- 检查文档记录三条 routeGeometry 的 `candidate` 状态。
- 检查文档说明 `usedFallback=false` 不等于 `verified`。
- 检查文档给出 `navLocation` 修正、人工 routeGeometry 修正、自有路网和手机端验证四类策略。
- 运行 `git status`。
- 只添加本阶段允许修改文件并提交。

### npm run build 结果

本阶段只修改 Markdown 文档，不涉及 TypeScript 或功能代码，因此未运行 `npm run build`。

### 下一步建议

- 按 `docs/lingshan-route-geometry-review.md` 的复核清单逐段记录问题。
- 对高风险路段先做截图或手机端记录，再决定是否修 `navLocation` 或新增 `hybrid_corrected` routeGeometry。

## 阶段四十二：3D 地图道路网络与水系意象层

### 日期

2026-05-29

### 本次目标

在 `/scenic-3d-map` 中增加两个视觉层：基于候选 `routeGeometry` 的淡色道路网络层，以及艺术化太湖/水系大色块层，让 3D 地图不只显示 POI 节点和当前路线金线。

### 本次约束

- 只修改 `/scenic-3d-map` 的 3D 场景视觉层和开发记录。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 真实经纬度 `displayLocation` / `navLocation`。
- 不修改 `scenePosition` 数值。
- 不修改 `src/data/lingshanRouteGeometries.ts` 的数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### 道路网络层数据来源说明

道路网络层从 `lingshanRouteGeometries` 读取全部候选路线几何。每条 `geometry.path` 是腾讯 walking runtime 导出的经纬度点串，场景内通过 `geoToScenePosition(point, { center: scenicCenter })` 投影为 3D 坐标。

三条候选路线全部作为淡色底网显示，当前选中路线仍由现有金色路线层高亮。

### 道路网络为什么仍是 candidate

这些道路来自腾讯 walking runtime 导出，虽然三条路线 `usedFallback=false`，但仍没有经过人工逐段核对。园区内部步道、广场、台阶、建筑入口和水域边界可能与腾讯路网存在局部偏差，因此只能作为 candidate 道路网络视觉层，不等同 verified 园区道路网。

### 水系/太湖意象层说明

本阶段在 projected 场景空间中增加了低饱和淡蓝灰、青灰色的大色块水面，用于表达太湖/水系环境意象。水面放置在不遮挡核心 POI、建筑和路线的位置，作为环境背景层。

### 为什么水面不是精确湖岸线

当前项目没有真实湖岸线 GeoJSON、水系边界数据或人工核验过的水域轮廓。本阶段水面只是艺术化大色块，不代表精确湖岸线，也不用于导航或地理判断。

### 图层顺序说明

当前场景图层顺序为：

1. 地形底盘。
2. 水系/太湖意象层。
3. 淡色候选道路网络层。
4. 当前路线金色高亮线。
5. POI 节点和核心地标。
6. 景点标签。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 现在会显示三条候选路线形成的淡色道路底网，并保留当前路线的金色高亮线。页面说明补充了道路网络来源和水面非精确表达的提示。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯 walking route、Marker、Polyline、InfoWindow 或 query 参数逻辑。

### 验证方式

- 运行 `npm run build`。
- 检查 `/scenic-3d-map` 仍能加载。
- 检查三条路线切换后当前金线仍随路线变化。
- 检查底层淡色道路网络可见但不抢当前金线。
- 检查水面作为背景层可见，且没有遮挡核心 POI。
- 检查页面说明明确道路网络仍需人工复核，水面不是精确湖岸线。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 结合 `docs/lingshan-route-geometry-review.md` 对候选道路网络逐段复核。
- 对明显穿湖、穿建筑或不贴路的段落生成 `hybrid_corrected` routeGeometry。
- 后续如获得真实湖岸线或园区水系数据，再替换当前艺术化水面大色块。

## 阶段四十三：腾讯地图增强模式设计文档生成

### 日期

2026-05-30

### 本次目标

生成腾讯地图增强模式设计文档，明确 `/map` 如何作为真实地理底座承接 POI、路线、调试图层、实时定位和导航兜底，并说明它与 `/scenic-3d-map` 的互补关系。

### 本次约束

- 只新增/更新文档。
- 不修改功能代码。
- 不修改 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不修改 `routeGeometry` 数据。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `docs/tencent-map-enhanced-mode-plan.md`
- `docs/map-3d-development-log.md`

### 为什么需要腾讯地图增强模式

当前项目已经形成 `/scenic-3d-map` 与 `/map` 的双地图结构。3D 地图适合作为沉浸式主视觉，但真实导航仍需要腾讯地图底图、真实坐标、POI 聚焦、路线兜底和后续实时定位能力。

腾讯地图增强模式用于把 `/map` 从真实地图页升级为真实地理工作台：保留腾讯底图，同时叠加项目自有 POI、routeGeometry、调试层、定位层和导航辅助层。

### 道路与水体数据策略

文档明确：

- 腾讯底图可以显示道路、水体、建筑轮廓和地名。
- 但腾讯底图是渲染服务，不等于项目可以直接批量提取完整道路网、水体 polygon 或建筑矢量数据。
- 道路应基于腾讯 walking path、routeGeometry candidate、相邻站点 segment path 和人工复核逐步建设。
- 水体在 `/map` 中直接依赖腾讯底图显示，在 `/scenic-3d-map` 中先作为艺术化水面意象；如需精确湖岸线，后续应使用官方或合规来源数据。

### 实时导航分阶段设计

文档将实时导航拆为五个阶段：

1. 当前位置显示：`navigator.geolocation`、用户 Marker、accuracy circle、自动跟随开关。
2. 路线进度：用户位置到 routeGeometry 最近点、进度百分比、下一站和距离。
3. 偏航判断：超过阈值后提示并提供重规划入口。
4. 重规划：用户当前位置到下一站 `navLocation` 的腾讯 walking 临时路线。
5. 3D 同步：将真实 lat/lng 通过 `geoToScenePosition` 映射到 3D，仅表达大致位置和导览进度。

### 与 /scenic-3d-map 的关系

文档明确两者不是互斥关系：

- `/scenic-3d-map` 负责主视觉、沉浸式游览、文化路线讲述和景点符号化。
- `/map` 负责真实底图、真实路线、实时定位、POI / `navLocation` 和现场导航纠偏。

交互流保持为：3D 选景点跳 `/map?poi=xxx`，3D 选路线跳 `/map?sceneRoute=xxx`，未来 `/map` 可增加返回 3D 导览模式的入口。

### 为什么本阶段只做文档、不改代码

腾讯地图增强模式涉及图层架构、实时定位、路线进度、偏航判断、重规划和 `navLocation` 校准。直接进入实现容易影响现有 `/map` 稳定性，因此本阶段先明确设计边界、数据策略、阶段拆分和风险，再分阶段开发。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯 walking route、Marker、Polyline、InfoWindow、query 参数或调试导出能力。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、3D 场景、routeGeometry 渲染、水系层、道路网络层、POI 节点或模型资产。

### 下一步建议

- 阶段 44：先做 `/map` 增强模式 UI 方案，包括图层开关、真实地图 / 3D 导览模式切换、POI 分类图例和路线状态卡片。
- 阶段 45：做实时定位基础能力和手机端局域网测试。
- 阶段 46：做 routeGeometry 最近点吸附、路线进度和下一站距离。
- 阶段 47：做偏航与重规划。
- 阶段 48：校准核心 POI 的 `navLocation`。

## 阶段四十四：腾讯地图增强模式 UI 雏形

### 日期

2026-05-30

### 本次目标

在 `/map` 中增加腾讯地图增强模式 UI 雏形，让真实地图页更像“真实地图导览工作台”，包含模式说明、进入 3D 导览地图入口、图层开关、路线状态卡片和调试入口说明。

### 本次约束

- 只修改 `/map` 页面的 UI 组织与轻量控制。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 增强模式 UI 说明

`/map` 右上角新增“腾讯地图增强模式 / 真实地图导览模式”说明卡片，明确当前页面基于腾讯地图底图显示真实 POI、路线和导航兜底，沉浸式体验可切换到 3D 导览地图。

该卡片承担真实地图模式入口说明和轻量控制面板角色，不改变地图初始化、Marker、Polyline、InfoWindow 或路线规划流程。

### 进入 3D 导览地图入口说明

新增“进入 3D 导览地图”按钮，点击后跳转 `/scenic-3d-map`。该入口不改变 `/map?poi=xxx`、`/map?sceneRoute=xxx` 或 debug 参数逻辑。

### 图层开关说明

新增四个轻量图层开关：

- 显示 POI 标记：控制 Marker layer 是否挂载到地图。
- 显示当前路线：控制当前 route Polyline 是否显示。
- 显示 sceneRoute 调试线：当 URL 存在 `sceneRoute` 时可用，用于显示或隐藏骨架调试线。
- 显示路线诊断信息：控制 plannedRoute 诊断卡片显示。

默认行为保持兼容：

- POI 标记默认显示。
- 当前路线默认显示。
- sceneRoute 调试线默认由 `debugSceneRoute` query 决定。
- 路线诊断信息默认由 `debugSceneRoute` query 决定。

### 路线状态卡片说明

增强模式卡片中补充当前路线状态：

- 当前真实路线。
- 路线来源：腾讯 walking route、预设路线、fallback 兜底或路线生成中。
- `usedFallback`。
- 距离和耗时。
- 如存在 `fallbackReason`，同步显示。

普通模式下显示简洁状态，详细诊断仍由路线诊断信息开关控制。

### 为什么本阶段不做实时定位

实时定位涉及浏览器权限、手机端精度、accuracy circle、跟随模式、路线吸附、下一站计算和偏航判断。直接实现会改变真实导航行为，本阶段先完成 UI 组织和图层控制，为后续定位能力预留入口。

### 为什么本阶段不修改路线规划算法

本阶段目标是腾讯地图增强模式 UI 雏形，不处理腾讯 walking route、预设路线、fallback 或 routeGeometry 生成算法。保持路线数据流稳定，可以降低对现有 `/map` 导览功能的风险。

### 对 /map 的影响

`/map` 新增增强模式说明卡、3D 入口、图层开关和路线状态卡片。已有 `/map` 默认路线、`/map?poi=xxx` 聚焦、`/map?sceneRoute=xxx` 路线映射、poi 优先规则、debugSceneRoute 调试线、plannedRoute 诊断、walking path JSON 复制/下载能力保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、3D 场景、routeGeometry 渲染、水系层、道路网络层、POI 节点或模型资产。新增入口只从 `/map` 跳转到已有 `/scenic-3d-map`。

### 验证方式

- 运行 `npm run build`。
- 检查 `/map` 普通进入仍显示默认路线。
- 检查“进入 3D 导览地图”按钮跳转 `/scenic-3d-map`。
- 检查 POI 标记开关可隐藏 / 显示 Marker layer。
- 检查当前路线开关可隐藏 / 显示 route Polyline。
- 检查带 `sceneRoute` 时可用 sceneRoute 调试线开关。
- 检查路线诊断信息开关可显示 / 隐藏诊断面板。
- 检查 `debugSceneRoute=1` 时原有诊断和复制 / 下载 path JSON 功能仍可用。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 阶段 45 可进入实时定位基础能力：`navigator.geolocation`、用户位置 Marker、GPS 精度圆和手机端局域网测试。
- 后续再增加路线进度、下一站距离、偏航判断和重规划到下一站。

## 阶段四十五：腾讯地图 GLModelOverlay 方案调研

### 日期

2026-05-30

### 本次目标

生成腾讯地图 GLModelOverlay 与 3D 模型覆盖物方案调研文档，判断该能力对当前 Web demo、未来 Android APK 和灵山 3D 模型资产路线的意义。

### 本次约束

- 只新增/更新文档。
- 不修改功能代码。
- 不修改 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `Scenic3DMapScene.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 坐标。
- 不修改 `routeGeometry` 数据。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `docs/tencent-map-glmodeloverlay-research.md`
- `docs/map-3d-development-log.md`

### GLModelOverlay 能力定位

GLModelOverlay 属于腾讯地图 Android Map SDK 方向，面向 Android 原生地图，用于在原生腾讯地图上叠加 3D 模型覆盖物。它适合把 glTF / GLB 类核心模型绑定到真实经纬度位置，例如灵山大佛、九龙灌浴、梵宫和五印坛城。

本阶段尝试联网读取官方文档但未能完整获取页面内容，因此文档中明确：当前分析基于官方文档入口、Android SDK 能力命名和方案判断，具体 API 参数、模型格式限制、缩放、旋转、生命周期等细节需后续 Android 开发时重新核对官方文档。

### 它与当前 Web 方案的区别

当前 Web 方案是 React + Vite + Tencent JS API GL + Three.js / React Three Fiber：

- `/scenic-3d-map` 是独立 Web 3D 场景。
- `/map` 是 Web 腾讯地图真实导览增强页。

GLModelOverlay 是 Android 原生 Map SDK 能力，不能直接在当前 React Web 页面中调用。Web 端继续保留 `/scenic-3d-map` + `/map` 双模式更稳妥。

### 对 Android APK 的意义

如果后续项目进入 Android APK 阶段，GLModelOverlay 很有价值：

- 真实底图、道路、水体、建筑轮廓由腾讯地图负责。
- 核心 glTF 模型可作为覆盖物贴到真实经纬度位置。
- Android 定位和导航能力可与模型覆盖物结合。
- 现有 `poiId`、`navLocation`、`guideRoutes`、`routeGeometry` 和模型资产规范可复用。

### 为什么本阶段只做文档、不改代码

GLModelOverlay 不属于当前 Web React 运行环境。直接修改 Web 代码无法调用 Android SDK 能力，也容易混淆 Web 独立 3D 地图、Web 腾讯地图增强模式和 Android 原生地图增强三条路线。因此本阶段只做调研文档，明确边界和后续 Android 验证任务。

### 对 /map 的影响

本阶段没有修改 `/map`、`GuideMapPage.tsx`、腾讯 walking route、Marker、Polyline、InfoWindow、图层开关或调试导出能力。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、Three.js 场景、routeGeometry 金线、道路网络层、水系意象层、POI 节点或模型资产。

### 下一步建议

- 后续单独做“Android GLModelOverlay 官方 API 参数核对”，读取并记录官方 API、模型格式、经纬度绑定、缩放、旋转、生命周期和性能限制。
- 如果确定做 Android APK，再做最小 Android demo：加载一个简单 glTF 模型并绑定到灵山景区某个经纬度点。
- Web 端继续推进 `/scenic-3d-map` 和 `/map` 双模式，不把 Android SDK 能力误用为 JS API 能力。

## 阶段四十六 B：腾讯地图增强模式 UI 调试入口收敛

### 日期

2026-05-30

### 本次目标

修正 `/map` 腾讯地图增强模式 UI 中普通游客可见的调试入口和容易误解的文案，让普通模式更聚焦真实导览，debug 模式继续保留开发诊断能力。

### 本次约束

- 只修改 `/map` 增强模式 UI 的调试入口可见性、文案和轻量移动端友好性。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 为什么要隐藏普通模式下的调试入口

普通游客进入 `/map` 时应看到真实地图、POI、路线和导览状态，不应直接看到 plannedRoute 诊断、sceneRoute 骨架线或 path JSON 导出入口。这些能力属于开发调试和路线复核流程，应只在 `debugSceneRoute=1` 或 `debugSceneRoute=true` 时显示。

本阶段将“显示路线诊断信息”和“显示 sceneRoute 调试线”控制收敛到 debug 模式，普通 `/map` 与普通 `/map?sceneRoute=xxx` 不再暴露这些开关。

### “显示 POI Marker”文案调整说明

原文案“显示 POI 标记”容易让用户理解为关闭所有 POI 信息。实际开关只控制地图上的 Marker layer，不影响已打开的信息窗。

本阶段将文案改为“显示 POI Marker”，并补充说明“仅控制地图上的景点标记，不影响已打开的信息窗”。

### debugSceneRoute 模式下仍保留哪些调试能力

当 URL 带 `debugSceneRoute=1` 或 `debugSceneRoute=true` 时，仍保留：

- plannedRoute 诊断信息。
- `path.length`、距离、耗时、`usedFallback`、`fallbackReason`。
- sceneRoute POI 骨架线开关。
- 腾讯 walking path JSON 复制。
- 腾讯 walking path JSON 下载。

### 移动端轻量优化说明

增强模式卡片新增“收起 / 展开”按钮。默认仍保持展开，桌面端不改变主要使用方式；小屏幕或地图被遮挡时，用户可以收起卡片正文，减少对地图区域的遮挡。

本阶段没有做大规模响应式重构，也没有改变地图底部景点抽屉。

### 对 /map 的影响

普通 `/map` 更接近游客导览模式：保留增强模式说明、进入 3D 导览地图入口、POI Marker 开关、当前路线开关和简洁路线状态。

debug 模式仍支持 sceneRoute 骨架线、plannedRoute 详细诊断、复制 / 下载 walking path JSON。`/map?poi=xxx` 聚焦、`/map?sceneRoute=xxx` 路线映射、poi 优先规则、Marker、Polyline、InfoWindow 和路线切换逻辑保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、3D 场景、routeGeometry 渲染、水系层、道路网络层、POI 节点或模型资产。

### 验证方式

- 运行 `npm run build`。
- 检查普通 `/map` 不显示“显示路线诊断信息”开关。
- 检查普通 `/map?sceneRoute=historical_3d_scene` 不显示“显示 sceneRoute 调试线”开关。
- 检查 `/map?sceneRoute=historical_3d_scene&debugSceneRoute=1` 仍显示 sceneRoute 调试线开关和路线诊断信息开关。
- 检查复制 / 下载腾讯路线 path JSON 按钮仍只在 debug 模式下出现。
- 检查“显示 POI Marker”文案和说明正确。
- 检查增强模式卡片可收起 / 展开。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 若验收通过，可进入实时定位基础能力阶段。
- 后续移动端可继续把增强模式卡片改成更完整的底部抽屉或浮动工具栏。

## 阶段四十七 A：真实地图基础定位与模拟定位能力

### 日期

2026-05-30

### 本次目标

在 `/map` 腾讯地图增强模式中增加基础当前位置显示能力，同时提供真实定位和模拟定位两种模式。真实定位用于景区现场测试，模拟定位用于开发、答辩或用户不在灵山胜境时演示后续导航流程。

### 本次约束

- 只修改 `/map` 页面和必要的定位工具代码。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/lib/geolocation.ts`
- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 真实定位说明

新增 `src/lib/geolocation.ts`，封装浏览器 `navigator.geolocation.watchPosition`：

- `isGeolocationSupported()` 判断浏览器是否支持定位。
- `watchUserLocation()` 以 `enableHighAccuracy: true`、`timeout: 10000`、`maximumAge: 5000` 获取定位。
- `clearUserLocationWatch()` 用于停止定位监听。
- 错误信息会转换为“浏览器不支持定位”“用户拒绝定位权限”“定位超时”“无法获取当前位置”等可读文案。

真实定位得到的位置标记为 `source: 'gps'`。

### 模拟定位说明

`/map` 增强模式中新增模拟定位模式，提供以下快捷点：

- 南门
- 九龙灌浴
- 灵山大佛
- 梵宫
- 五印坛城
- 景区出口

模拟定位会优先使用对应 `lingshanPois.navLocation`，如果没有则使用 `displayLocation`。本阶段没有修改任何 POI 坐标或 `navLocation`，只是读取现有数据设置一个 `source: 'mock'` 的当前位置，精度默认 8 米。

### 用户位置 Marker 说明

真实定位和模拟定位都会在腾讯地图上显示独立的用户位置 Marker。该 Marker 使用蓝色圆点图标，与景点 POI Marker 区分，并通过独立 `userLocationMarkerRef` 管理，不影响现有 Marker layer、Polyline、InfoWindow 或调试图层。

### 精度圆说明

当 `window.TMap.MultiCircle` 和 `window.TMap.CircleStyle` 可用时，会显示淡蓝色半透明精度圆。若当前腾讯地图 JS API 环境不支持圆形覆盖物，则跳过精度圆渲染，只在 UI 中显示 `accuracyMeters` 数值，避免页面报错。

### 不在景区时的提示说明

如果真实定位成功但当前位置距离 `scenicCenter` 超过 2km，页面会提示：

> 你当前可能不在灵山胜境景区内，可使用模拟定位体验导览流程。

距离判断使用前端 haversine 近似计算，仅用于 UI 提示，不参与导航判断。

### 为什么本阶段不做路线进度、偏航和重规划

本阶段只建立“当前位置可视化”和“模拟定位”基础能力。路线进度、下一站、偏航判断和重规划需要依赖稳定的 `routeGeometry`、最近点吸附、阈值策略和更多手机端实测，因此后续单独阶段实现，避免一次性改变真实地图导览逻辑。

### 手机端局域网定位限制说明

手机端真实定位依赖浏览器权限、HTTPS / localhost 安全上下文、系统定位授权和网络环境。通过局域网 IP 访问 Vite dev server 时，部分浏览器可能限制 geolocation，因此保留模拟定位作为答辩和开发兜底。

### 对 /map 的影响

`/map` 新增定位控制区、真实定位按钮、模拟定位按钮、定位到我按钮、定位状态卡片、用户位置 Marker 和可选精度圆。原有 `/map` 默认路线、`/map?poi=xxx` 聚焦、`/map?sceneRoute=xxx` 路线映射、debugSceneRoute 调试层、复制 / 下载 walking path JSON、图层开关、Marker、Polyline、InfoWindow 和路线切换逻辑保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、Three.js 场景、routeGeometry 金线、道路网络层、水系层、POI 节点或模型资产。

### 验证方式

- 运行 `npm run build`。
- 检查 `/map` 增强模式卡片中出现“当前位置”控制区。
- 检查“真实定位 / 模拟定位”模式切换。
- 检查模拟南门、九龙灌浴、灵山大佛、梵宫、五印坛城、景区出口后，地图显示蓝色用户位置 Marker。
- 检查“定位到我”可以把地图居中到当前用户位置。
- 检查真实定位不支持或权限失败时显示可读错误。
- 检查普通路线、POI 聚焦、sceneRoute 映射和 debugSceneRoute 调试能力不受影响。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 手机端局域网环境实测真实定位权限和 GPS 精度表现。
- 阶段四十七 B 可增加用户位置到当前 `routeGeometry` 的最近点吸附和路线进度计算。
- 后续再做下一站提示、偏航判断和重规划到下一站。

## 阶段四十八 A：routeGeometry 最近点吸附与下一站计算

### 日期

2026-05-30

### 本次目标

在 `/map` 中基于当前用户位置和候选 `routeGeometry` 增加路线进度预估能力，显示用户距离当前路线的距离、路线大致进度、下一站和距离下一站的大致距离。

### 本次约束

- 只修改 `/map` 页面和必要的几何计算工具。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/lib/routeProgress.ts`
- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### routeProgress 工具说明

新增 `src/lib/routeProgress.ts`，提供无副作用、无第三方依赖、无腾讯地图对象依赖的几何计算工具：

- `haversineDistanceMeters(a, b)`：计算两个经纬度点的近似距离。
- `findNearestRoutePoint(position, path)`：在 `routeGeometry.path` 中查找距离用户位置最近的点，并用 `nearestIndex / (path.length - 1)` 估算路线进度。
- `findNextStop(position, routeStops, spotLookup)`：根据当前路线站点和用户位置估算下一站。
- `formatDistanceMeters(distance)`：格式化米 / 公里显示。

### 最近点计算说明

本阶段使用 `routeGeometry.path` 的离散点做最近点查找，不做线段投影。返回结果包含最近点、最近点索引、距离路线多少米和近似 `progressRatio`。该结果用于导览 UI 的粗略进度展示，不参与真实导航判断。

### 下一站计算说明

第一版下一站计算采用简单规则：

- 先查找当前路线站点中距离用户最近的站点。
- 如果用户距离最近站点仍较远，则把该最近站点作为下一站。
- 如果用户已经接近最近站点，则把路线中的下一个站点作为下一站。
- 如果已经到终点附近，则保留终点作为下一站。

站点坐标优先使用 `lingshanPois.navLocation`，没有时使用 `displayLocation`，再 fallback 到 `guideSpots` 坐标。本阶段只读取这些数据，不修改任何坐标。

### 为什么本阶段只做估算、不做偏航和重规划

最近点和下一站只是后续导航流程的基础。偏航需要连续定位、阈值策略、用户速度和路线可信度判断；重规划需要调用腾讯 walking route 或自有 verified routeGeometry。本阶段先保持轻量，只显示估算，不触发自动偏航提示和重新规划。

### 模拟定位如何用于测试

阶段四十七 A 已提供南门、九龙灌浴、灵山大佛、梵宫、五印坛城、景区出口等模拟定位点。本阶段的路线进度估算会同时使用真实定位和模拟定位，因此开发和答辩时即使不在灵山胜境，也可以测试“距离路线、路线进度、下一站、距离下一站”的 UI。

### 对 /map 的影响

`/map` 增强模式卡片中新增“路线进度预估”区域：

- 未开启定位时提示开启真实定位或模拟定位。
- 已定位且存在 `routeGeometry` 时显示距离路线、约百分比进度、下一站、距离下一站。
- 无 `routeGeometry` 或路径点不足时显示不可计算提示。

原有 `/map` 默认路线、`/map?poi=xxx` 聚焦、`/map?sceneRoute=xxx` 路线映射、debugSceneRoute 调试层、复制 / 下载 walking path JSON、图层开关、真实 / 模拟定位、用户位置 Marker、精度圆、Marker、Polyline、InfoWindow 和路线切换逻辑保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、Three.js 场景、routeGeometry 金线、道路网络层、水系层、POI 节点或模型资产。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map`，确认未定位时显示“开启真实定位或模拟定位后查看路线进度”。
- 使用模拟南门、九龙灌浴、灵山大佛、梵宫、五印坛城或景区出口，确认路线进度预估区域显示距离路线、进度、下一站、距离下一站。
- 打开 `/map?sceneRoute=historical_3d_scene`、`/map?sceneRoute=natural_3d_scene`、`/map?sceneRoute=family_3d_scene`，确认会优先使用对应 sceneRoute 的 `routeGeometry`。
- 检查真实定位 / 模拟定位、用户位置 Marker、精度圆、POI 聚焦、sceneRoute 映射和 debugSceneRoute 调试能力不受影响。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 在手机端局域网环境用模拟定位和真实定位对比路线进度 UI。
- 后续可做阶段四十八 B：加入基于最近点距离的偏航提示，但先不自动重规划。
- 再后续可做重规划到下一站和当前站 / 下一站的导览状态机。

## 阶段四十八 B：定位与路线进度 UI 布局优化

### 日期

2026-05-30

### 本次目标

优化 `/map` 中定位状态与路线进度预估信息的布局，避免“距离当前路线、路线进度、下一站、距离下一站”等关键信息被底部景点卡片或其它浮层遮挡。

### 本次约束

- 只优化 `/map` 页面定位与路线进度 UI 的布局和可见性。
- 不修改 `routeProgress` 计算逻辑。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 问题现象

阶段四十八 A 把路线进度预估放入 `/map` 增强模式卡片后，在部分屏幕尺寸下，卡片内容过长，可能延伸到页面下方并被底部景点卡片遮挡，导致距离路线、进度、下一站和距离下一站等关键信息不稳定可见。

### UI 布局优化方式

本阶段将增强模式卡片调整为“标题固定、正文滚动”的结构：

- 外层增强模式卡片设置最大高度，避免继续向底部无限延伸。
- 展开状态下的正文区域使用 `overflowY: auto`。
- “路线进度预估”改为定位区域中的醒目蓝色浅底子卡。
- 路线进度信息移动到定位详情之前，优先显示距离路线、进度、下一站和距离下一站。
- 补充说明“基于候选 routeGeometry 和当前位置估算，仅用于导览参考”。

### 小屏幕滚动/折叠处理说明

原有增强模式卡片“收起 / 展开”按钮保持不变。展开状态下正文区域可滚动查看全部内容；收起状态只保留标题栏，减少对地图的遮挡。该处理不改变底部景点卡片和地图主交互。

### 保持不变的路线进度计算逻辑

本阶段没有修改 `src/lib/routeProgress.ts`，也没有修改最近点吸附、进度估算或下一站计算规则。UI 仍读取阶段四十八 A 已生成的 `routeProgressEstimate`。

### 对 /map 的影响

`/map` 的定位与路线进度信息更稳定可见，关键字段被放到更靠前、更醒目的区域。真实定位、模拟定位、用户位置 Marker、精度圆、路线状态、图层开关、debugSceneRoute、复制 / 下载 walking path JSON、POI 聚焦、sceneRoute 映射、Marker、Polyline、InfoWindow 和路线切换逻辑保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、Three.js 场景、routeGeometry 金线、道路网络层、水系层、POI 节点或模型资产。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map`，确认增强模式卡片展开后正文可滚动。
- 使用模拟定位点，确认“路线进度预估”区域优先展示距离当前路线、路线进度、下一站、距离下一站和 routeGeometry 状态 / 点数。
- 检查卡片收起后不遮挡地图。
- 检查真实定位 / 模拟定位、用户位置 Marker、精度圆、POI 聚焦、sceneRoute 映射和 debugSceneRoute 调试能力不受影响。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 手机端实际验证增强模式卡片滚动和底部景点卡片之间的遮挡情况。
- 如果仍拥挤，可将定位与路线进度拆成独立底部抽屉或移动端专用浮层。
- 后续再进入偏航提示和重规划能力，而不是继续在当前阶段修改计算逻辑。

## 阶段四十九 A：routeGeometry 偏航状态提示

### 日期

2026-05-30

### 本次目标

在 `/map` 中基于当前位置到当前候选 `routeGeometry` 的最近距离，增加轻量路线偏航状态提示，帮助用户判断自己是否仍在推荐路线附近。

### 本次约束

- 只修改 `/map` 页面和必要的 `routeProgress` 工具。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/lib/routeProgress.ts`
- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 偏航阈值说明

本阶段默认阈值：

- `distance <= 30m`：`on_route`，提示“你在推荐路线附近”。
- `30m < distance <= 80m`：`maybe_off_route`，提示“你可能偏离推荐路线”。
- `distance > 80m`：`off_route`，提示“你已明显偏离推荐路线”。

这些阈值只用于前端 UI 提醒，后续可结合手机端实测、GPS 精度和路线可信度调整。

### evaluateRouteDeviation 说明

`src/lib/routeProgress.ts` 新增：

- `RouteDeviationLevel`
- `RouteDeviationResult`
- `evaluateRouteDeviation(distanceMeters, options?)`

该函数是纯函数，不依赖腾讯地图对象，不读取环境变量，不引入第三方依赖。它只根据“用户位置到候选 routeGeometry 最近点的距离”返回偏航等级和提示文案。

### 偏航状态 UI 说明

`/map` 的“路线进度预估”区域新增“路线状态”提示：

- 绿色：你在推荐路线附近。
- 橙色：你可能偏离推荐路线。
- 红色：你已明显偏离推荐路线。

模拟定位和真实定位都会参与该判断，方便开发和答辩时用模拟点测试不同距离下的提示效果。

### 为什么本阶段不做重规划

本阶段只做偏航状态提示，不调用新的腾讯路线接口、不自动切换路线、不自动重规划。自动重规划需要明确下一站、重规划触发频率、连续偏离判断、用户确认机制和临时路线展示，后续单独阶段实现更稳。

### 模拟定位如何用于测试偏航

阶段四十七 A 已支持模拟定位到南门、九龙灌浴、灵山大佛、梵宫、五印坛城和景区出口。本阶段复用模拟定位产生的当前位置，直接用候选 `routeGeometry` 最近距离评估偏航状态，因此用户不在景区内也能测试提示 UI。

### 对 /map 的影响

`/map` 增强模式中的路线进度区域新增偏航状态提示。原有 `/map` 默认路线、`/map?poi=xxx` 聚焦、`/map?sceneRoute=xxx` 路线映射、debugSceneRoute 调试层、复制 / 下载 walking path JSON、图层开关、真实 / 模拟定位、用户位置 Marker、精度圆、路线进度、下一站、Marker、Polyline、InfoWindow 和路线切换逻辑保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、Three.js 场景、routeGeometry 金线、道路网络层、水系层、POI 节点或模型资产。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map`，使用模拟定位点，确认“路线状态”显示在“路线进度预估”区域。
- 检查不同模拟点下根据距离显示绿色、橙色或红色提示。
- 检查真实定位仍可参与偏航状态判断。
- 检查没有自动调用腾讯路线规划、没有自动重规划、没有自动切换路线。
- 检查 POI 聚焦、sceneRoute 映射、debugSceneRoute 调试能力不受影响。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 手机端实测不同 GPS 精度下的偏航阈值是否合理。
- 后续可做阶段四十九 B：连续多次偏离后再提示偏航，降低 GPS 抖动误报。
- 再后续可做“重规划到下一站”能力，但需要用户确认和临时路线图层。

## 阶段四十九 A 修正：偏航判断加入路线站点容忍区

### 日期

2026-05-30

### 本次目标

修正 `/map` 中仅按用户到候选 `routeGeometry` 最近距离判断偏航的问题，让偏航判断同时考虑用户是否靠近当前路线站点，避免模拟定位在当前路线景点中心时被误判为偏航。

### 本次约束

- 不做连续偏离计数。
- 不做自动重规划。
- 不调用新的腾讯路线接口。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/lib/routeProgress.ts`
- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 问题现象

阶段四十九 A 的偏航提示只依据“用户位置到 `routeGeometry` 折线最近点距离”。当模拟定位落在当前路线包含的景点中心时，如果该景点中心不在腾讯 walking path 折线上，页面仍可能显示“明显偏离推荐路线”。

### 原因分析：景点中心不一定在 routeGeometry 上

灵山大佛、梵宫、九龙灌浴、五印坛城等大体量景点的展示中心、观赏区、入口点和真实步道位置可能并不重合。`routeGeometry` 来自腾讯 walking runtime 的候选路径，更接近步行线；模拟定位使用 POI 的 `navLocation` 或 `displayLocation`，可能落在景点中心或广场点。景区导览中，靠近路线站点应视为合理上下文，不应直接按折线距离判为偏航。

### 新增 near_route_stop 状态说明

`src/lib/routeProgress.ts` 将 `RouteDeviationLevel` 扩展为：

- `on_route`
- `near_route_stop`
- `maybe_off_route`
- `off_route`

当用户离 `routeGeometry` 超过 30 米，但离当前路线任一站点不超过容忍距离时，返回 `near_route_stop`，提示“你在路线站点附近”。

### 路线站点容忍距离说明

本阶段默认阈值：

- `distanceToRouteMeters <= 30m`：`on_route`。
- `distanceToNearestStopMeters <= 80m`：`near_route_stop`。
- `distanceToRouteMeters <= 80m`：`maybe_off_route`。
- 其它情况：`off_route`。

80 米站点容忍区用于覆盖景区大体量景点、广场和观赏区，后续可结合手机端现场测试微调。

### 为什么本阶段不做连续偏航和重规划

本阶段只修复误判，不引入连续偏离计数、自动重规划或腾讯路线请求。连续偏航需要处理 GPS 抖动、定位精度、用户确认和临时路线图层；重规划还需要明确“下一站”与“恢复主路线”的状态机，适合后续独立阶段实现。

### 模拟定位如何用于测试

使用 `/map` 中已有模拟定位按钮，将位置设置到南门、九龙灌浴、灵山大佛、梵宫、五印坛城或景区出口。若该模拟点属于当前路线站点，即使它离 `routeGeometry` 折线较远，也应显示 `near_route_stop` 或 `on_route`，不应直接进入 `off_route`。

### 对 /map 的影响

`/map` 的“路线进度预估”区域新增“距离最近路线站点”展示，并将偏航状态判断改为同时参考路线折线距离和路线站点距离。原有默认路线、`/map?poi=xxx` 聚焦、`/map?sceneRoute=xxx` 映射、debugSceneRoute、路线 path JSON 复制 / 下载、图层开关、真实 / 模拟定位、用户位置 Marker、精度圆、路线进度、下一站、Marker、Polyline、InfoWindow 和路线切换逻辑保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、Three.js 场景、3D 金线、POI 节点、道路网络层、水系层或模型资产。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map`，选择包含模拟点的当前路线，点击“模拟在九龙灌浴 / 灵山大佛 / 梵宫 / 五印坛城”。
- 确认路线进度区域显示“距离最近路线站点”。
- 确认模拟定位在当前路线景点附近时显示“你在路线站点附近”或“你在推荐路线附近”，不再直接误判为明显偏航。
- 确认不触发新的腾讯路线请求、不做自动重规划、不影响 POI 聚焦和 sceneRoute 映射。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 结合手机端实测调整 80 米站点容忍阈值。
- 后续可做连续多次偏离后再提示偏航，降低 GPS 抖动误报。
- 再后续可设计“重规划到下一站”流程，但应保持用户确认和临时路线图层。

## 阶段四十九 C：sceneRoute query 与手动路线切换解耦

### 日期

2026-05-31

### 本次目标

修复 `/map?sceneRoute=xxx` 进入后，用户在页面内手动切换路线时，路线进度、下一站、偏航判断和 `routeGeometry` 状态仍可能继续受 URL 中 `sceneRoute` 影响的问题。

### 本次约束

- 不调用新的腾讯路线接口。
- 不做自动重规划。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 问题现象

直接打开 `/map?sceneRoute=family_3d_scene` 时，初始亲子路线正常；但如果从 `/map?sceneRoute=historical_3d_scene` 进入后手动切换到亲子路线，页面中的路线进度、下一站、偏航状态或 `routeGeometry` 状态可能仍按 URL 中的 `historical_3d_scene` 计算。

### 原因分析：query sceneRoute 长期影响 routeGeometry / routeProgress

此前 `currentRouteGeometry` 会优先通过 `querySceneRouteId` 查找 `lingshanRouteGeometries`，再 fallback 到 `activeRouteId`。这会让 URL 中的 `sceneRoute` 在用户手动切换路线后仍持续覆盖当前路线的几何数据，导致主路线状态与用户选择的 `activeRouteId` 不一致。

### 修复方式：sceneRoute 只作为初始意图，手动切换优先

`sceneRoute` 查询参数仍用于页面初次进入时映射真实 `guideRoute` 并设置 `activeRouteId`。同时新增手动路线切换标记：用户点击路线切换后，后续不再让 query sceneRoute effect 拉回原路线。这样 URL query 只表达初始进入意图，页面内交互以用户手动选择为准。

### routeGeometry 按 activeRouteId 查找的说明

普通路线进度、下一站、偏航判断和 `routeGeometry` 状态改为通过 `getLingshanRouteGeometryByGuideRouteId(activeRouteId)` 获取。手动切换到亲子路线后，对应数据会切换为 `family` 的 routeGeometry；切换到自然风光路线后，对应数据会切换为 `natural_scenery`。

### debugSceneRoute 保留 query sceneRoute 调试能力的说明

`debugSceneRoute=1` 的 sceneRoute 骨架线仍按 URL 中的 `querySceneRouteId` 绘制，因为它是调试指定 3D sceneRoute 的能力。该调试图层不再影响普通路线进度、下一站、偏航判断和主路线状态。

### 对 /map 的影响

- `/map?sceneRoute=historical_3d_scene` 初始仍切换到历史文化路线。
- `/map?sceneRoute=natural_3d_scene` 初始仍切换到自然风光路线。
- `/map?sceneRoute=family_3d_scene` 初始仍切换到亲子路线。
- 用户手动切换路线后，`routeGeometry`、路线进度、下一站和偏航状态跟随当前 `activeRouteId`。
- `poi` 与 `sceneRoute` 同时存在时，仍保持 `poi` 优先。
- debugSceneRoute、复制 / 下载腾讯路线 path JSON、图层开关、真实 / 模拟定位、用户位置 Marker、精度圆、Marker、Polyline、InfoWindow 和路线切换逻辑保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、Three.js 场景、3D routeGeometry 金线、道路网络层、水系层、POI 节点或模型资产。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map?sceneRoute=family_3d_scene`，确认初始显示亲子路线，`routeGeometry`、下一站和偏航判断按 `family` 处理。
- 打开 `/map?sceneRoute=historical_3d_scene`，确认初始显示历史文化路线；手动切换到亲子路线后，`routeGeometry`、下一站和偏航判断改为 `family`，不继续使用 `historical_3d_scene`。
- 打开 `/map?sceneRoute=historical_3d_scene&debugSceneRoute=1`，确认调试骨架线仍按 query sceneRoute 显示，但主路线状态跟随手动选择的 `activeRouteId`。
- 打开 `/map?poi=jiulong_guanyu&sceneRoute=historical_3d_scene`，确认仍以 `poi` 聚焦九龙灌浴为优先。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 浏览器人工验证上述 4 个入口场景。
- 后续如需让 debug route path 导出严格绑定当前手动路线，可单独增加“按当前 activeRoute 导出”的调试选项。

## 阶段四十九 B：连续偏离确认与重规划占位

### 日期

2026-05-31

### 本次目标

将 `/map` 的偏航提示从单次距离判断升级为连续偏离确认，降低 GPS 抖动、模拟定位切换或景区大体量 POI 带来的误报，并为后续“重新规划到下一站”预留 UI 入口。

### 本次约束

- 不调用新的腾讯路线接口。
- 不做自动重规划。
- 不修改腾讯 walking route 规划算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 3D 场景。
- 不修改 POI 坐标。
- 不修改 `displayLocation` / `navLocation`。
- 不修改 `scenePosition`。
- 不修改 `lingshanRouteGeometries.ts` 数据内容。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/lib/routeProgress.ts`
- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 连续偏离确认规则

`src/lib/routeProgress.ts` 新增 `RouteDeviationConfirmState` 和 `evaluateRouteDeviationConfirmation` 纯函数。默认确认阈值为 3 次：

- `on_route`：连续偏离次数清零，不提示强警告，不建议重规划。
- `near_route_stop`：连续偏离次数清零，不提示强警告，不建议重规划。
- `maybe_off_route`：连续偏离次数加 1，达到 3 次后显示强提示，但不建议重规划。
- `off_route`：连续偏离次数加 1，达到 3 次后显示强提示，并显示“重新规划到下一站（暂未启用）”占位按钮。

### 为什么 near_route_stop 不计入偏航

`near_route_stop` 表示用户虽然不在候选 `routeGeometry` 折线附近，但处于当前路线站点容忍区内。景区导览中，用户在景点中心、广场、观赏点或入口附近是合理场景，不应累积偏航次数，否则会继续误报大佛、梵宫、九龙灌浴、五印坛城等大体量景点附近的位置。

### 为什么本阶段不做自动重规划

本阶段只完成偏航提示确认和 UI 占位，不调用腾讯 walking route，不自动切换路线，也不生成临时路线。真实重规划需要明确下一站、用户确认、请求节流、临时路线图层、到达下一站后的恢复策略，以及与 candidate / verified routeGeometry 的关系，因此后续单独阶段实现更稳。

### “重新规划到下一站（暂未启用）”按钮说明

当 `off_route` 连续达到 3 次后，`/map` 的“路线进度预估”区域会显示“重新规划到下一站（暂未启用）”按钮。点击按钮只显示“重新规划功能将在后续阶段接入”，不会调用接口、不会修改路线、不会触发腾讯路线规划。

### 模拟定位如何用于测试

模拟定位继续参与连续偏离判断。开发或答辩时可以先切换到当前路线外的模拟点，观察连续偏离次数增加；切回当前路线站点附近时，`near_route_stop` 会清零计数。切换路线、切换模拟定位点、停止真实定位也会清零计数，避免旧状态污染新测试。

### 为什么导航阶段暂时收尾，后续回到 3D 模型与场景

当前 `/map` 已具备真实定位 / 模拟定位、用户位置 Marker、精度圆、路线进度估算、下一站估算、偏航状态、连续偏离确认和重规划占位。作为 demo 阶段的导航闭环已足够支撑导览说明，后续更高价值的工作应回到 `/scenic-3d-map` 的核心模型、沉浸式场景、建筑资产和视觉表现。

### 对 /map 的影响

`/map` 的“路线进度预估”区域新增连续偏离次数、连续偏离强提示和“重新规划到下一站（暂未启用）”占位按钮。原有 `/map` 默认路线、`/map?poi=xxx` 聚焦、`/map?sceneRoute=xxx` 初始路线映射、手动路线切换、debugSceneRoute、路线 path JSON 复制 / 下载、图层开关、真实 / 模拟定位、用户位置 Marker、精度圆、路线进度、下一站、`near_route_stop`、Marker、Polyline、InfoWindow 和路线切换逻辑保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`、Three.js 场景、3D routeGeometry 金线、道路网络层、水系层、POI 节点或模型资产。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map`，使用模拟定位测试不同路线位置。
- 确认 `on_route` 和 `near_route_stop` 会清零连续偏离次数。
- 确认 `maybe_off_route` 连续 3 次后显示“连续多次检测到你可能偏离推荐路线”，但不显示重规划按钮。
- 确认 `off_route` 连续 3 次后显示“重新规划到下一站（暂未启用）”按钮。
- 点击占位按钮，确认只显示后续接入提示，不调用腾讯路线接口，不修改当前路线。
- 确认切换路线、切换模拟定位点、停止真实定位会清零计数。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，但这是体积提示，不是构建失败。

### 下一步建议

- 导航能力暂时收尾，优先回到 3D 模型资产和沉浸式场景优化。
- 后续如继续导航，可实现“用户确认后重规划到下一站”的临时路线图层。
- 手机端实测连续偏离阈值和站点容忍区是否需要按 GPS 精度动态调整。

## 阶段五十：GLB 模型加载能力接入

### 日期

2026-05-31

### 本次目标

为 `/three-preview` 和 `/scenic-3d-map` 打通前端 GLB 模型加载能力，让后续灵山大佛、九龙灌浴、梵宫、五印坛城等核心地标可以从低模 placeholder 渐进替换为 Blender / 3D 重建导出的 GLB 模型。

### 本次约束

- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改定位、路线进度、偏航相关代码。
- 不修改 POI 真实坐标。
- 不修改 `routeGeometry` 数据。
- 不新增真实大型 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/components/scenic3d/ScenicModel.tsx`
- `src/components/scenic3d/PlaceholderLandmark.tsx`
- `src/components/scenic3d/Scenic3DPreview.tsx`
- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/data/scenic3d/lingshanAssetMap.ts`
- `public/models/lingshan/README.md`
- `docs/map-3d-development-log.md`

### ScenicModel 组件说明

新增 `ScenicModel` 通用组件，接收 `poiId`、`active`、`modelUrl` 和可选 `transform`。组件内部使用 `@react-three/drei` 的 `useGLTF` 加载 GLB 模型，并保留 active 状态的基础高亮表达。该组件不引入新依赖，不加载远程未知模型，只根据资产映射中提供的 `modelUrl` 加载。

### GLB 加载与 placeholder fallback 机制

当 `modelUrl` 为空时，`ScenicModel` 直接渲染现有 `PlaceholderLandmark`。当 `modelUrl` 存在时，组件通过 `Suspense` 显示 placeholder 作为加载占位，并通过错误边界捕获 GLB 加载失败；加载失败时不会让整个 3D 页面崩溃，而是回退到 `PlaceholderLandmark`。

### /three-preview 如何使用模型加载能力

`Scenic3DPreview` 现在从 `lingshanAssetMap` 获取当前 `selectedPoiId` 对应资产，并将 `asset.modelUrl` 和 `asset.transform` 传给 `ScenicModel`。因此 `/three-preview` 后续只要在资产映射中填写存在的 `modelUrl`，即可验证对应 GLB；当前没有模型文件时仍显示低模 placeholder，并保留四个核心 POI 切换能力。

### /scenic-3d-map 如何使用模型加载能力

`Scenic3DMapScene` 的四个核心地标层改为渲染 `ScenicModel`。当前 `modelUrl` 为空时仍显示原有 placeholder；未来配置 GLB 后，核心地标会优先加载模型。19 个普通游线节点、routeGeometry 金线、道路网络层、水系层、标签、选中高亮和 `onSelectPoi` 逻辑保持不变。

### 为什么本阶段不提交真实大模型文件

本阶段目标是打通前端加载和 fallback 能力，不是制作资产。真实 GLB 可能体积较大，且需要统一原点、比例、朝向、面数、贴图压缩和双端兼容规范。仓库中只新增 `public/models/lingshan/README.md` 说明后续模型建议目录，不提交真实大型模型文件。

### 对 /map 的影响

本阶段没有修改 `/map`、腾讯地图增强模式、Marker、Polyline、InfoWindow、sceneRoute query、POI 聚焦、debugSceneRoute、定位、路线进度、偏航提示或重规划占位。

### 对导航功能的影响

本阶段没有修改导航 / 定位 / 偏航代码，没有调用新的腾讯路线接口，没有修改腾讯 walking route 规划算法，也没有修改 `routePlanning.ts`。导航阶段现有能力保持不变。

### 验证方式

- 运行 `npm run build`。
- 打开 `/three-preview`，切换 `giant_buddha`、`jiulong_guanyu`、`fan_gong`、`wuyin_tancheng`，确认没有模型文件时仍显示 placeholder。
- 打开 `/scenic-3d-map`，确认核心地标仍显示 placeholder，19 个节点、routeGeometry 金线、道路网络层和水系层不受影响。
- 后续可放入轻量测试 GLB 并在 `lingshanAssetMap` 填写 `modelUrl`，验证模型加载与失败 fallback。

### npm run build 结果

`npm run build` 已通过。构建过程中仍有 Vite chunk size warning，本阶段新增 `ScenicModel` 后相关 Three.js / drei 代码仍会进入懒加载 3D chunk；该 warning 是体积提示，不是构建失败。

### 下一步建议

- 制作或导出一个小体积测试 GLB，先在 `/three-preview` 验证加载、比例和原点。
- 制定核心四个地标的模型命名、比例、原点和压缩规范。
- 后续再逐个将 `lingshanAssetMap` 的 `modelUrl` 从空值切换为已存在模型路径。

## 阶段五十一：首个 GLB 模型接入与验收流程文档

### 日期

2026-05-31

### 本次目标

生成首个 GLB 模型接入与验收流程文档，指导后续将灵山大佛、梵宫、九龙灌浴、五印坛城等模型安全接入 `/three-preview` 和 `/scenic-3d-map`。

### 本次约束

- 不修改功能代码。
- 不修改 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `ScenicModel`。
- 不修改 `lingshanAssetMap`。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `docs/lingshan-first-glb-integration-guide.md`
- `docs/map-3d-development-log.md`

### 为什么先做文档而不是直接接模型

阶段五十已经打通前端 GLB 加载与 placeholder fallback 能力，但真实模型接入容易出现路径 404、比例错误、方向错误、原点偏移、材质丢失、文件过大和移动端性能问题。先建立接入流程和验收表，可以避免把大模型直接提交进仓库，也能让后续每个模型按同一标准验证。

### 首个模型推荐

文档建议首个接入模型为灵山大佛 `giant_buddha`。它是灵山胜境最核心地标，替换 placeholder 后视觉提升最明显，也适合作为模型加载、比例、朝向、原点、标签关系和 fallback 的首个验证对象。备选模型包括梵宫、九龙灌浴和五印坛城。

### 模型目录与 lingshanAssetMap 配置说明

文档建议模型放在：

- `public/models/lingshan/landmarks/`
- `public/models/lingshan/thumbnails/`

并说明 `public` 目录资源通过 `/models/...` 访问，不应放入 `src`。文档给出 `lingshanAssetMap` 配置示例，明确 `modelUrl`、`thumbnailUrl`、`status: 'model_ready'`、`transform` 和 fallback 行为，但本阶段没有实际修改资产映射代码。

### 验收流程说明

文档列出从放置 GLB、配置 `modelUrl`、运行 `npm run dev`、打开 `/three-preview`、检查模型问题，到打开 `/scenic-3d-map` 检查场景关系的完整流程。验收表覆盖加载、fallback、控制台错误、比例、原点、方向、贴地、标签、高亮和移动端性能。

### 对 /three-preview 的影响

本阶段没有修改 `/three-preview` 功能。文档说明后续首个模型应优先在 `/three-preview` 验证，确认加载、比例、朝向和 fallback 后再观察 `/scenic-3d-map` 中的实际表现。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map` 功能。文档说明后续模型接入后，需要检查模型在沉浸式 3D 地图中的位置、比例、标签遮挡和选中高亮效果。

### 对 /map 的影响

本阶段没有修改 `/map`、导航、定位、路线进度、偏航提示、腾讯地图路线规划或任何真实地图逻辑。模型接入流程不应影响真实导航兜底。

### 下一步建议

- 阶段五十二：接入第一个轻量 GLB 模型，例如灵山大佛。
- 阶段五十三：修正模型 `transform`。
- 阶段五十四：为核心 4 个地标批量接入模型。
- 阶段五十五：模型体积压缩与移动端性能测试。

### 验证方式

- 检查 `docs/lingshan-first-glb-integration-guide.md` 是否生成。
- 检查文档是否包含推荐模型、目录结构、制作规范、配置示例、验收流程、验收表格、常见问题和下一步建议。
- 运行 `git status`，确认只修改允许的 Markdown 文档。

### npm run build 结果

本阶段只修改 Markdown 文档，不涉及功能代码，不需要运行 `npm run build`。

## 阶段五十二：Blender MCP 与 AI 3D 建模路线方案

### 日期

2026-05-31

### 本次目标

生成 Blender MCP、AI 3D 生成 / 重建和手工 Blender 清理三种建模路线的调研与制作方案，明确灵山胜境首批 3D 模型资产的制作路线和首个模型建议。

### 本次约束

- 不修改功能代码。
- 不修改 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `ScenicModel`。
- 不修改 `lingshanAssetMap`。
- 不新增真实 `glb` / `gltf` 模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `docs/lingshan-blender-mcp-ai3d-modeling-plan.md`
- `docs/map-3d-development-log.md`

### Blender MCP 适用边界

Blender MCP 适合让 AI 在本地受控 Blender 环境中辅助创建低模符号化资产、规则几何体、地台、材质、缩放、居中、设置原点和 GLB 导出自动化。它不适合自动生成高质量佛像细节，也不能替代人工审美和宗教文化表达把关。因为可能执行 Blender Python，使用前应保存文件，并避免接触项目敏感配置。

### AI 3D 生成/重建适用边界

AI 3D 生成 / 重建适合快速获得复杂形体的第一版粗模或参考 mesh，但生成结果常见结构不准、贴图脏、面数高、原点 / 比例 / 法线混乱等问题。宗教建筑和佛像还存在失真风险，因此 AI 生成结果不能直接作为最终前端资产，必须进入 Blender 清理。

### 首个模型推荐

文档推荐首个模型为灵山大佛。原因是它是灵山胜境最核心地标，替换 placeholder 后视觉提升最大，也适合先做低模庄重剪影来验证 GLB 加载、比例、原点、朝向、fallback 和移动端性能。

### 为什么本阶段不直接生成模型

当前还没有经过验收的参考资产和 Blender 工作文件。直接生成模型容易引入体积过大、比例错误、宗教形象失真、移动端性能不稳定和仓库误提交大文件等问题。本阶段先制定路线和验收标准，确保后续模型制作和接入有明确边界。

### 对 /three-preview 的影响

本阶段没有修改 `/three-preview` 功能。文档说明后续第一个 GLB 应先在 `/three-preview` 验证加载、比例、朝向、原点和 fallback，再进入沉浸式地图。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map` 功能。文档说明后续模型通过 `/three-preview` 验收后，再接入 `/scenic-3d-map` 检查场景比例、标签关系和选中高亮。

### 对 /map 的影响

本阶段没有修改 `/map`、导航、定位、路线进度、偏航提示、腾讯地图路线规划或任何真实地图逻辑。模型制作路线不影响真实导航兜底。

### 下一步建议

- 先制作灵山大佛低模 GLB。
- 接入 `/three-preview`。
- 调整 `transform`。
- 再接入 `/scenic-3d-map`。
- 通过后再制作梵宫、九龙灌浴、五印坛城。

### 验证方式

- 检查 `docs/lingshan-blender-mcp-ai3d-modeling-plan.md` 是否生成。
- 检查文档是否包含三种路线对比、Blender MCP 边界、AI 3D 边界、首个模型推荐、制作流程、验收标准和下一步建议。
- 运行 `git status`，确认只修改允许的 Markdown 文档。

### npm run build 结果

本阶段只修改 Markdown 文档，不涉及功能代码，不需要运行 `npm run build`。

### 明确记录

- 本阶段没有修改功能代码。
- 本阶段没有新增真实模型文件。
- 本阶段没有修改 `/map`。
- 本阶段没有修改导航功能。
- 本阶段只是制定建模路线。

## 阶段五十二 B：scenic map GLB transform 数据流修复

### 日期

2026-06-01

### 本次目标

修复 `/scenic-3d-map` 中核心地标模型没有真正使用 `lingshanAssetMap.transform` 的问题，让灵山大佛 GLB 的本体缩放、旋转和局部偏移由资产映射数据控制。

### 本次约束

- 不修改 `/map`。
- 不修改导航、定位、路线进度、偏航相关代码。
- 不修改腾讯地图路线规划逻辑。
- 不修改 `routePlanning.ts`。
- 不修改 POI 真实坐标。
- 不修改 `routeGeometry` 数据。
- 不新增其它大型 `glb` / `gltf` 模型文件。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/data/scenic3d/lingshanAssetMap.ts`
- `public/models/lingshan/landmarks/lingshan_buddha_blockout_v1.glb`
- `docs/map-3d-development-log.md`

### 问题现象

`lingshan_buddha_blockout_v1.glb` 已经能加载，`giant_buddha` 也已经在 `lingshanAssetMap.ts` 中配置了 `transform.scale: [0.15, 0.15, 0.15]`，但 `/scenic-3d-map` 中模型大小没有明显变化。

### 原因分析

`Scenic3DMapScene.tsx` 的 `buildLandmarks()` 只读取了 `asset.modelUrl`，没有读取 `asset.transform`。核心地标外层 group 使用 `landmarkFallbackLayout` 中的硬编码 scale，`ScenicModel` 没有收到 `transform`，因此 `lingshanAssetMap.transform.scale` 只会影响 `/three-preview`，不会影响 `/scenic-3d-map`。

### 修复方式

将地图世界位置和模型局部 transform 分离：

- POI 的 projected / scenePosition 继续决定外层 group 的地图位置。
- `lingshanAssetMap.transform` 传给 `ScenicModel`，用于控制模型本体的局部 position、rotation 和 scale。
- `landmarkFallbackLayout` 仅作为没有 asset transform 时的兜底。
- 选中态只在最终模型 scale 基础上乘以小倍率，不再用硬编码 scale 覆盖 asset transform。

### giant_buddha GLB 当前 modelUrl 和 transform

`giant_buddha` 当前使用：

```ts
modelUrl: '/models/lingshan/landmarks/lingshan_buddha_blockout_v1.glb'
status: 'model_ready'
transform: {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [0.15, 0.15, 0.15],
}
```

该模型为 Blender MCP 生成的灵山大佛低模 blockout v1，用于本地预览和 transform 验证。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 中核心地标模型现在会使用 `lingshanAssetMap.transform`。灵山大佛 GLB 的缩放可通过 `transform.scale` 调整，POI 在地图上的位置仍由真实投影 / scenePosition 决定。

### 对 /three-preview 的影响

`/three-preview` 原本已经读取并传递 `asset.transform`，本阶段未改变该页面的模型加载语义。它仍可用于单模型 transform 验证。

### 对 /map 的影响

本阶段没有修改 `/map`、导航功能、定位能力、路线进度、偏航提示或腾讯地图路线规划逻辑。

### 验证方式

- 检查 `/scenic-3d-map` 核心地标渲染是否将 `asset.transform` 传给 `ScenicModel`。
- 检查 `giant_buddha` 的 GLB 文件是否位于 `public/models/lingshan/landmarks/lingshan_buddha_blockout_v1.glb`。
- 运行 `npm run build`。
- 运行 `git status`，确认仅暂存本阶段允许文件。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

## 阶段七十一：3D 园林资产导览原型 C

### 日期

2026-06-07

### 本次目标

新增 `/map-3d-guide-c`，作为“沉稳 3D 园林资产版”视觉原型。C 版不继续堆 PNG / SVG 贴片，而是使用腾讯地图 `TMap.model.GLTFModel` 加载低模 GLB 园林资产，形成更像园林沙盘的路线导览效果。

### 本次约束

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 的既有行为。
- 不修改 routeGeometry / roadNetwork 原始数据。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token。
- 不执行 `git push`。

### 修改文件

- `src/App.tsx`
- `src/pages/Map3DGuidePage.tsx`
- `src/pages/Map3DGuidePrototypeCPage.tsx`
- `src/data/lingshanMap3DGardenAssets.ts`
- `public/assets/map-3d-guide/glb-garden/*.glb`
- `docs/map-3d-guide-3d-garden-prototype.md`
- `docs/map-3d-guide-demo-plan.md`
- `docs/map-3d-guide-asset-licenses.md`
- `docs/map-3d-development-log.md`

### 为什么从 A/B 贴片转向 GLB 低模资产

A/B 已证明地图坐标锚定 marker 可行，但 PNG / SVG 贴片容易显得幼态、平面和拼贴。灵山胜境真实 3D 导览更需要空间体积、低饱和材质、园林沙盘感和克制的文化符号。因此 C 版禁用原 PNG / SVG 装饰贴片，改用小体积低模 GLB。

### 子 agent 搜索与审核结论

本阶段按用户要求分工调研：

- 子 agent A 调研自然园林资产，推荐 Quaternius / Poly Pizza 自然包、Kenney Nature Kit、flo-bit low poly nature pack、Poly Haven 少量 CC0 灌木和山石、明确 CC BY 且轻量的竹子 / 石阶资产。
- 子 agent B 调研东方建筑与佛教符号资产，推荐 CC0 低模桥、石桥、寺庙屋顶、院墙、香炉、莲台、法轮等候选。
- 子 agent C 做许可证审核，建议只允许 CC0 / Public Domain / MIT / Apache-2.0 / 可商用 CC BY；拒绝 NC、SA、ND、Editorial、自定义 Royalty-Free 和许可证不明资产。
- 子 agent D 做性能和风格审核，建议首屏大型 GLB 控制在 0-1 个，装饰 GLB 应小体积、低面数、低饱和，拒绝 25MB 级 AI 直出模型默认加载。

### 本阶段使用资产

本阶段没有直接下载外部 GLB。为了先打通 C 版运行链路，新增项目自制低模 fallback GLB：

- `garden_pine_cluster.glb`
- `garden_rock_cluster.glb`
- `garden_stone_steps.glb`
- `garden_courtyard_wall.glb`
- `garden_arch_bridge.glb`
- `garden_temple_roof.glb`
- `garden_lotus_pedestal.glb`
- `garden_dharma_wheel.glb`
- `garden_incense_burner.glb`

这些资产放在 `public/assets/map-3d-guide/glb-garden/`，单个约 9KB 到 55KB，总体约 300KB，属于项目自制低模 fallback。许可证记录见 `docs/map-3d-guide-asset-licenses.md`。

### 路线铺陈方式

新增 `src/data/lingshanMap3DGardenAssets.ts`。每个资产记录 `id`、`kind`、`assetUrl`、经纬度、`scale`、`height`、`yaw`、`visible`、`priority`、`routeFraction` 和说明。

资产沿历史文化路线布置：

- 南门：院墙、石阶。
- 照壁 / 胜境广场：松群、山石。
- 水边路段：小桥。
- 九龙灌浴：树群。
- 灵山大佛：石阶、莲台、山石。
- 祥符禅寺：香炉、寺庙屋顶。
- 梵宫：庭墙、庭树。
- 五印坛城：法轮、莲台。
- 出口：山石低调收束。

### 显现机制

C 版使用 `routeFraction` 和当前 `routeProgressRatio` 控制资产显现。普通模式只创建已到达或即将到达的 GLB 资产；`debugGarden=1` 显示全部资产。偏航 / 重规划时低优先级资产会暂时隐藏，避免干扰青蓝重规划路线。

由于腾讯 GLTFModel 运行时透明度能力未确认，第一版采用“创建 / 不创建模型”的方式实现路线唤醒，而不是材质级淡入。

### debugGarden 调试能力

新增 `/map-3d-guide-c?debugGarden=1`：

- 选择任一 3D 园林资产。
- 调整纬度、经度、scale、height、yaw、routeFraction、visible、priority。
- 自动保存到 `localStorage.lingshan-map-3d-guide-garden-assets-v1`。
- 支持复制 TS 配置片段。
- 支持复制调试摘要。
- 支持恢复默认配置。

### 保留能力

- `mapStyleId: 'style1'` 保留。
- 历史文化路线保留。
- 金色主路线保留。
- 当前站点 / 下一站 / 终点 marker 保留。
- 模拟定位、模拟前进、模拟偏航保留。
- 点击模拟偏航后仍调用腾讯 walking route 重规划到下一站。
- 重规划路线仍清楚。
- GLB 模型 Beta 开关保留。
- 相机模式保留。

### 对 /map 的影响

本阶段没有修改普通 `/map` 或 `/map?debugGltfModel=1`。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

- 选择 2-3 个外部 CC0 / CC BY 高质量 GLB 资产替换项目 fallback。
- 为外部资产保存许可证证据和署名记录。
- 继续压缩 MeshyAI 大佛模型，避免 25MB 级模型默认加载。
- 如果腾讯 GLTFModel 对多实例性能不足，可将重复树群 / 山石合并为组合 GLB。

## 阶段七十 A：3D 导览视觉原型 A

日期：2026-06-07

### 本次目标

新增 `/map-3d-guide-a`，用于验证“少量高质量素材反复组合”的青绿佛境导览视觉策略。

### 子 agent 辩论结论

- A 版主张高级克制：少量树木、山石、莲花、佛光、院落资产即可，路线、当前位置和下一站必须第一优先。
- B 版主张高密度冲击：更多素材沿路线铺陈，但需要安全区和层级控制。
- 风险审查结论：A/B 应复用同一套腾讯地图实例、路线、模拟定位、偏航重规划和 GLB Beta，不新增第二个地图实例，不默认加载大模型。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `src/pages/Map3DGuidePrototypeAPage.tsx`
- `src/App.tsx`
- `public/assets/map-3d-guide/shared/*.png`
- `docs/map-3d-guide-ab-visual-prototypes.md`
- `docs/map-3d-guide-asset-licenses.md`
- `docs/map-3d-development-log.md`

### 实现说明

- 将 `/map-3d-guide` 页面抽成可传入视觉变体的 `Map3DGuideExperience`。
- 默认 `/map-3d-guide` 仍使用原行为和原装饰配置。
- 新增 `/map-3d-guide-a`，传入 `prototype-a`。
- A 版装饰共 8 个地图锚点，沿历史文化路线铺陈。
- 外部 PNG 素材通过 `TMap.MultiMarker` 的经纬度 marker 使用，不作为固定屏幕覆盖层。
- 装饰仍随模拟定位进度逐步显现。

### 使用素材

- Kenney Foliage Pack (100x)，CC0，用于树木和山石。
- OpenGameArt Lotus Flowers，CC0，用于莲花节点。
- 佛光和院落仍使用项目内联 SVG。
- 许可证记录见 `docs/map-3d-guide-asset-licenses.md`。

### 保持能力

- 腾讯地图 3D 底座。
- `mapStyleId: 'style1'`。
- 历史文化路线。
- 当前站点 / 下一站 / 终点 marker。
- 模拟定位、模拟前进、模拟偏航。
- 腾讯 walking route 重规划到下一站。
- 重规划路线显示。
- GLB 模型 Beta。

### 对 /map 的影响

没有修改普通 `/map` 或 `/map?debugGltfModel=1`。

### 对 /scenic-3d-map 的影响

没有修改 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

阶段七十 B 接入 `/map-3d-guide-b`，在同一套业务逻辑上提高路线沿线资产密度，验证数字沙盘冲击力版本。

## 阶段七十 B：3D 导览视觉原型 B

日期：2026-06-07

### 本次目标

新增 `/map-3d-guide-b`，用于验证“更多素材密集铺陈”的数字沙盘视觉策略。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `src/pages/Map3DGuidePrototypeBPage.tsx`
- `src/App.tsx`
- `public/assets/map-3d-guide/shared/*.png`
- `docs/map-3d-guide-ab-visual-prototypes.md`
- `docs/map-3d-guide-asset-licenses.md`
- `docs/map-3d-development-log.md`

### 实现说明

- 新增 `/map-3d-guide-b` 路由。
- B 版复用 `Map3DGuideExperience`，只切换视觉变体为 `prototype-b`。
- B 版沿历史文化路线布置 32 个地图锚定装饰点。
- 关键节点周边增加树群、山石、莲花、佛光、院落、水意和云雾。
- 所有装饰仍通过 `TMap.MultiMarker` 经纬度锚定，随地图平移、缩放、旋转。
- 模拟偏航后，主线装饰仍按既有逻辑降透明，重规划路线附近显示青蓝水墨提示。

### 使用素材

- Kenney Foliage Pack (100x)，CC0，用于更密集树群、山石、叶片。
- OpenGameArt Lotus Flowers，CC0，用于密集莲花节点。
- 许可证记录见 `docs/map-3d-guide-asset-licenses.md`。

### 保持能力

- 腾讯地图 3D 底座。
- `mapStyleId: 'style1'`。
- 历史文化路线。
- 当前站点 / 下一站 / 终点 marker。
- 模拟定位、模拟前进、模拟偏航。
- 腾讯 walking route 重规划到下一站。
- 重规划路线显示。
- GLB 模型 Beta。

### 对 /map 的影响

没有修改普通 `/map` 或 `/map?debugGltfModel=1`。

### 对 /scenic-3d-map 的影响

没有修改 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

浏览器对比 `/map-3d-guide-a` 和 `/map-3d-guide-b`，决定后续产品主线采用克制版、密集版，或按设备性能提供视觉密度切换。

## 阶段七十补充：A/B 视觉装饰冒烟测试修复

日期：2026-06-07

### 本次目标

修复用户打开 `/map-3d-guide-a` 和 `/map-3d-guide-b` 后几乎看不到视觉改进的问题，优先确认装饰层确实渲染，而不是继续做审美微调。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 修复方式

- 确认 `/map-3d-guide-a` 和 `/map-3d-guide-b` 分别加载 `Map3DGuidePrototypeAPage` / `Map3DGuidePrototypeBPage`。
- 确认 A/B 都通过 `Map3DGuideExperience` 传入 `prototype-a` / `prototype-b`。
- 外部 PNG 不再包进 SVG data URL 的 `<image>` 中，而是直接作为 `TMap.MarkerStyle.src`，避免浏览器不加载嵌套外部图片。
- A/B 原型临时进入装饰冒烟测试模式：
  - A 版装饰尺寸放大 1.8 倍。
  - B 版装饰尺寸放大 2.5 倍。
  - A/B 原型装饰默认全部可见，透明度不低于 0.85。
  - B 版装饰数量明显多于 A 版。
- A/B 页面右上角增加 `Prototype A 已启用` / `Prototype B 已启用` 标签。
- 开发诊断折叠区新增视觉原型烟测信息：
  - 当前原型类型。
  - 配置装饰点数量。
  - 本次创建 marker 数量。
  - fallback 数量。
  - 素材 URL 和加载状态。

### 明显测试装饰

- 起点附近：树群 / 雾门。
- 灵山大佛附近：莲花 / 佛光 / 青松。
- 梵宫附近：院落 / 树影 / 云雾。

这些测试装饰仍然通过腾讯地图经纬度 marker 锚定，随地图平移、缩放、旋转移动。

### 验证结果

- `npm run build` 通过。
- `/map-3d-guide-a` dev server HTTP 返回 200。
- `/map-3d-guide-b` dev server HTTP 返回 200。
- 11 个 `/assets/map-3d-guide/shared/*.png` 素材 URL 均返回 200，没有发现 404。

### 保持不变

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改腾讯 walking route 算法。
- 不修改 routeGeometry / roadNetwork 原始数据。
- 保留 `mapStyleId: 'style1'`。

## 阶段五十三：3D 道路网络生成与导航绑定方案

### 日期

2026-06-03

### 本次目标

生成灵山胜境 3D 道路网络生成与导航绑定方案，明确后续如何围绕现有 19 个 POI、`guideRoutes` 相邻站点、近邻 POI 和核心锚点，通过腾讯 walking route 批量采样形成候选道路底网，并让该道路网服务 3D 道路视觉、定位吸附、路线进度、偏航判断和自动重规划后的 3D 路线显示。

### 本次约束

- 只新增 / 更新 Markdown 文档。
- 不修改 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `Scenic3DMapScene.tsx`。
- 不修改 `routePlanning.ts`。
- 不修改 `routeGeometry` 数据。
- 不修改 POI 坐标。
- 不调用腾讯 API。
- 不生成道路网数据文件。
- 不新增模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `docs/lingshan-3d-road-network-generation-plan.md`
- `docs/map-3d-development-log.md`

### 为什么当前 routeGeometry 不够

当前 `routeGeometry` 只有三条主题路线：`historical_3d_scene`、`natural_3d_scene` 和 `family_3d_scene`。它们适合作为导览主线候选路径，但只覆盖主题路线主干，不覆盖所有可走道路。用户偏离路线后缺少局部道路结构，重规划结果也难以和已有道路底网融合，因此不足以支撑 3D 地图内的完整导航吸附和偏航恢复。

### 为什么使用腾讯 walking route 批量采样

腾讯 walking route 可以根据真实经纬度返回步行 path。围绕 19 个 POI、`guideRoutes` 相邻站点和近邻 POI 批量采样，可以先形成比人工随意描线更接近真实地图服务的候选道路网络。该方式不从腾讯底图提取矢量道路，只保存 walking route 返回的候选 path。

### 为什么第一版不人工描线

人工描线容易受主观判断影响，也难以覆盖后续定位吸附、偏航判断和重规划融合所需的路径结构。第一版先用腾讯 walking route 采样建立候选底网，再做人工复核和局部修正，更适合作为可迭代的数据路线。

### roadNetwork 数据结构设计

方案文档建议后续新增 `src/data/lingshanRoadNetwork.ts`，包含：

- `RoadNetworkNode`：POI 或人工控制点。
- `RoadNetworkSegment`：由腾讯 walking route 返回的 segment path。
- `LingshanRoadNetwork`：包含版本、nodes 和 segments。

源数据保持经纬度，运行时由 `/scenic-3d-map` 使用 `geoToScenePosition` 投影到 3D，避免把 3D 坐标作为道路网络权威数据。

### candidate / verified 状态说明

第一版 segments 初始状态为 `candidate`，表示来自腾讯 walking route 批量采样但尚未人工验证。人工复核后可升级为 `verified`，人工修正后的路径可标记为 `corrected`。`candidate` 不能说成官方道路或已验证路线。

### 与 /scenic-3d-map 的关系

后续 `/scenic-3d-map` 可读取 roadNetwork segments，将 path 投影到 3D 中显示为道路底网，并用于用户位置吸附、路线进度、偏航判断和临时 reroute path 显示。当前路线仍可用金线高亮。

### 与 /map 的关系

`/map` 仍作为真实地图和导航兜底页面。`/map` 与 `/scenic-3d-map` 应共享 `guideRoute`、`sceneRoute`、`navLocation`、`roadNetwork` 和 reroute path。腾讯 walking route 仍通过现有 `routePlanning.ts` 或后续封装调用，不复制腾讯底图矢量数据。

### 为什么本阶段不写代码

本阶段需要先明确采样范围、数据结构、状态语义、3D 投影关系和导航绑定流程。如果直接写采样工具或道路网数据，容易在未确定边界时生成难以复核的 candidate 数据。本阶段只做方案，为后续阶段五十四到五十八拆分实现。

### 下一步建议

- 阶段五十四：roadNetwork 采样工具设计，只生成 POI pair / segment 计划，不调用 API。
- 阶段五十五：腾讯 walking 批量采样，导出 candidate segments。
- 阶段五十六：`/scenic-3d-map` 接入 3D 道路底网。
- 阶段五十七：3D 定位吸附与偏航判断。
- 阶段五十八：3D 自动重规划到下一站。

### 验证方式

- 检查 `docs/lingshan-3d-road-network-generation-plan.md` 是否生成。
- 检查文档是否包含 routeGeometry 不足、腾讯 walking 批量采样、roadNetwork 数据结构、candidate / verified 状态、3D 坐标投影关系、3D 导航逻辑和后续阶段建议。
- 运行 `git status`，确认只修改允许的 Markdown 文档。

### npm run build 结果

本阶段只修改 Markdown 文档，不涉及功能代码，不需要运行 `npm run build`。

### 明确记录

- 本阶段没有修改功能代码。
- 本阶段没有调用腾讯 API。
- 本阶段没有修改 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 `routeGeometry`。
- 本阶段只是明确后续 3D 导航道路网络的生成方案。

## 阶段五十四：3D 道路网络采样计划生成

### 日期

2026-06-03

### 本次目标

新增 3D 道路网络腾讯 walking route 采样计划数据，围绕现有 19 个 POI、3 条 `guideRoutes`、POI 近邻关系和核心锚点生成后续需要请求腾讯 walking route 的 POI pair 清单。本阶段只生成采样计划，不包含真实 walking path。

### 本次约束

- 不调用腾讯 API。
- 不修改 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `Scenic3DMapScene.tsx`。
- 不修改 `routePlanning.ts`。
- 不修改 `routeGeometry` 数据。
- 不修改 POI 坐标。
- 不新增模型文件。
- 不修改数字人、聊天、语音、RAG、Fay、Live2D 相关模块。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/data/lingshanRoadNetworkSamplingPlan.ts`
- `docs/map-3d-development-log.md`

### 为什么本阶段只生成采样计划、不调用腾讯 API

道路网络采样需要先明确哪些 POI pair 应该请求 walking route，避免下一阶段重复调用、漏采样或在未确定边界时消耗腾讯 API 调用额度。本阶段只生成 pair 计划，不读取 API Key，不请求腾讯服务，不生成真实道路 path。

### 采样 pair 来源

- `guide_route_adjacent`：从 3 条 `guideRoutes` 的相邻站点生成，优先级 `high`。
- `poi_nearby`：从 19 个 `guideSpots` 的经纬度近邻关系生成，优先级 `medium`。
- `core_anchor`：从南门、胜境广场、九龙灌浴、灵山大佛、梵宫、五印坛城、出口等核心锚点补充生成，优先级 `medium` 或 `low`。

### nearbyThresholdMeters 设置

`nearbyThresholdMeters` 设置为 `350`。距离小于等于 350 米的 POI 对会进入 `poi_nearby` 候选采样范围。核心锚点补充采样使用 500 米作为内部筛选上限。

### pair 去重策略

同一个无向 pair 只保留一次，避免下一阶段重复调用腾讯 walking route。如果同一 pair 同时被多个来源命中，保留优先级更高的来源：

1. `guide_route_adjacent`
2. `poi_nearby`
3. `core_anchor`

本次生成的采样计划共有 76 个 pair：

- `guide_route_adjacent`：24 个。
- `poi_nearby`：32 个。
- `core_anchor`：20 个。

### candidate / verified 边界说明

本阶段的 pair 只是采样计划，不包含真实道路几何，也不代表官方道路。下一阶段腾讯 walking route 返回的 segment 初始也只能标记为 `candidate`，需要人工复核和现场验证后才能升级为 `verified` 或 `corrected`。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。后续阶段可基于该采样计划调用腾讯 walking route 生成 candidate roadNetwork segments，再投影到 3D 地图中作为道路底网和导航吸附数据。

### 对 /map 的影响

本阶段没有修改 `/map`。真实地图页仍保持现有腾讯地图增强模式、定位、路线进度、偏航提示和重规划占位逻辑。

### 对导航功能的影响

本阶段没有修改导航功能，只为后续 3D 道路网络采样建立 pair 清单。后续生成 roadNetwork segments 后，才能进一步服务 3D 定位吸附、偏航判断和自动重规划显示。

### 验证方式

- 运行 `npm run build`，验证新增 TypeScript 数据文件通过类型检查和构建。
- 临时编译采样计划到 `/private/tmp` 后统计 pair 数量，确认总数和各来源数量。
- 运行 `git status`，确认只暂存本阶段允许文件。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

阶段五十五基于 `lingshanRoadNetworkSamplingPlan` 进行腾讯 walking route 批量采样，生成 roadNetwork candidate segments，并记录每段的 `usedFallback`、`fallbackReason`、pointCount、distanceMeters、durationMinutes 和 status。

### 明确记录

- 本阶段没有调用腾讯 API。
- 本阶段没有修改 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 `routeGeometry`。
- 本阶段没有修改 POI 坐标。
- 本阶段只是为后续道路网络采样建立 pair 计划。

## 阶段五十五 A：道路网络浏览器采样导出工具

### 日期

2026-06-03

### 本次目标

在 `/map` 的 `debugRoadNetwork` 模式中增加 roadNetwork 腾讯 walking 采样导出工具。用户进入 `/map?debugRoadNetwork=1` 或 `/map?debugRoadNetwork=true` 后，可手动点击按钮，让浏览器按 `lingshanRoadNetworkSamplingPlan` 的 76 个 pair 逐个调用现有 `buildWalkingRoute`，并下载 candidate roadNetwork JSON。

### 本次约束

- 只修改 `/map` debug 工具 UI 和开发记录。
- 新增 `roadNetworkExport` 工具只负责组织 JSON 和浏览器下载。
- 不修改腾讯 walking route 算法。
- 不修改 `routePlanning.ts`。
- 不修改 `/scenic-3d-map`。
- 不修改 `Scenic3DMapScene.tsx`。
- 不修改 POI 坐标。
- 不修改 `routeGeometry` 数据。
- 不生成最终 `lingshanRoadNetwork.ts`。
- 不自动调用腾讯 API，只有用户在浏览器中点击按钮才会采样。
- 不读取、不输出、不修改 API Key、`.env` 或任何敏感配置。

### 修改文件清单

- `src/pages/GuideMapPage.tsx`
- `src/lib/roadNetworkExport.ts`
- `docs/map-3d-development-log.md`

### 为什么在浏览器 debug 模式采样而不是 Codex/Node 直接调用腾讯 API

当前腾讯地图 Key 和 JSONP 路线请求逻辑已经在前端 `/map` 中运行。让浏览器复用现有 `buildWalkingRoute` 更符合当前调用方式，也避免 Codex / Node 直接读取 Key 或在命令行调用腾讯 API。本阶段只是增加手动触发的 debug 工具，不会在页面加载时自动采样。

### debugRoadNetwork 参数说明

访问以下地址可显示道路网络采样导出工具：

- `/map?debugRoadNetwork=1`
- `/map?debugRoadNetwork=true`

普通 `/map` 不显示该工具。

### sampling plan 76 pairs 说明

采样计划来自 `src/data/lingshanRoadNetworkSamplingPlan.ts`，总计 76 个 pair：

- `guide_route_adjacent`：24 个。
- `poi_nearby`：32 个。
- `core_anchor`：20 个。
- `nearbyThresholdMeters`：350。

### 采样状态 UI 说明

debug 工具显示：

- pair 总数。
- 按来源统计。
- 当前状态：未开始、采样中、已停止、已完成。
- 当前进度 `x / 76`。
- 成功 segment 数。
- 失败 / 跳过数。
- 当前 pair id / from / to。
- “开始采样并下载 JSON”按钮。
- “停止采样”按钮。
- “复制采样摘要”按钮。

采样并发为 1，每个 pair 之间等待 650ms，避免过快请求。

### 导出 JSON 字段说明

导出文件名为 `lingshan-road-network-candidates.json`。payload 包含：

- `version`
- `generatedAt`
- `source: tencent_walking_batch_export`
- `pairCount`
- `segmentCount`
- `segments`
- `skipped`

每个 segment 包含 pair id、from/to POI、source、guideRouteId、priority、status、path、distanceMeters、durationMinutes、pointCount、usedFallback、fallbackReason、generatedAt 和 notes。

### candidate / verified 边界说明

导出结果为 `candidate`，不代表官方道路网，也不代表 verified roadNetwork。下一阶段需要人工复核、地图比对和必要的现场验证后，才能整理为正式 `lingshanRoadNetwork` 数据。

### 对 /map 的影响

`/map` 新增 debugRoadNetwork 模式下的采样导出工具。普通 `/map`、`/map?poi=xxx`、`/map?sceneRoute=xxx`、`debugSceneRoute=1`、路线 path JSON 复制 / 下载、图层开关、定位、路线进度和偏航状态均保持原有逻辑。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。后续阶段五十五 B 可读取浏览器下载的 JSON，生成 `lingshanRoadNetwork` candidate 数据，再供 3D 地图使用。

### 对导航功能的影响

本阶段没有修改导航功能。采样工具只为后续道路网络生成提供候选 segments，不改变当前路线规划、定位、偏航或重规划占位逻辑。

### 验证方式

- 运行 `npm run build`。
- 检查 `/map?debugRoadNetwork=1` 仅在 debugRoadNetwork 模式显示采样导出工具。
- 检查工具不会自动开始采样，必须用户点击“开始采样并下载 JSON”。
- 检查停止按钮和采样摘要按钮存在。
- 运行 `git status`，确认只暂存本阶段允许文件。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

阶段五十五 B 读取浏览器导出的 `lingshan-road-network-candidates.json`，生成 `src/data/lingshanRoadNetwork.ts` candidate 数据文件，并继续保持 candidate / verified 边界。

### 明确记录

- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有修改 `routePlanning.ts`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 POI 坐标。
- 本阶段没有生成最终 roadNetwork 数据。
- 本阶段不会自动调用腾讯 API，只有用户在浏览器 debugRoadNetwork 模式点击按钮才会采样。

## 阶段五十五 A 补充：道路网络采样导出工具 UI 防遮挡修正

2026-06-04

### 问题现象

访问 `/map?debugRoadNetwork=1` 时，右侧“道路网络采样导出”工具内容较长，展开后容易与右下角景点信息卡产生视觉遮挡，影响查看采样状态、按钮和说明。

### 修复目标

让道路网络采样导出工具在右侧增强模式卡片中可完整查看，同时保持普通 `/map` 页面不受影响。

### 修改文件

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 修复方式

- 将右侧增强模式卡片高度限制调整为 `calc(100vh - 140px)`。
- 保持卡片内部滚动，并将内部滚动区域高度调整为 `calc(100vh - 218px)`。
- 将 `debugRoadNetwork` 工具改为默认折叠，只显示标题、pair 总数和“展开”按钮。
- 展开后再显示采样状态、来源统计、开始采样、停止采样、复制摘要和安全说明。
- 保留已有主卡片“收起 / 展开”能力。

### 不修改采样逻辑

本阶段只调整 UI 布局，不修改 roadNetwork 采样循环、pair 查找、`buildWalkingRoute` 调用、停止采样、复制摘要或下载 JSON 逻辑。

### 不调用腾讯 API

本阶段没有调用腾讯 API。`debugRoadNetwork` 工具仍然只有在用户进入 debug 页面并点击“开始采样并下载 JSON”后，才会由浏览器触发腾讯 walking route 请求。

### 对 /map 的影响

`/map?debugRoadNetwork=1` 中道路网络采样导出工具默认折叠，展开后可在右侧卡片内部滚动查看。普通 `/map`、`/map?poi=xxx`、`/map?sceneRoute=xxx`、`debugSceneRoute=1`、图层开关、定位、路线进度、偏航状态和路线 path JSON 复制 / 下载功能保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

## 阶段五十五 A 补充 2：道路网络采样工具移至左侧独立面板

2026-06-04

### 问题现象

`/map?debugRoadNetwork=1` 中道路网络采样导出工具原本放在右侧增强模式卡片内。右侧同时承载真实地图增强模式、图层开关、定位、路线状态等内容，右下角还有景点信息卡，即使加入滚动和折叠后，roadNetwork 工具仍然容易与右侧信息区域冲突。

### 修复目标

将 `debugRoadNetwork` 工具移动到地图左侧独立浮动面板，让道路网络采样导出入口更清晰，并让右侧增强模式卡片回到游客 / 导览信息承载职责。

### 修改文件

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 修复方式

- 新增左侧独立 `debugRoadNetwork` 浮动面板。
- 左侧面板使用独立宽度、`maxHeight` 和 `overflowY: auto`，便于查看较长采样状态。
- 面板默认展开，同时保留“收起 / 展开”按钮。
- 从右侧增强模式卡片中移除道路网络采样导出工具。
- 同时开启 `debugSceneRoute` 诊断面板时，roadNetwork 面板会下移，减少左侧调试面板之间的冲突。

### 不修改采样逻辑

本阶段只移动 UI 位置，不修改 roadNetwork 采样循环、pair 查询、`buildWalkingRoute` 调用、停止采样、复制摘要或下载 JSON 逻辑。

### 不调用腾讯 API

本阶段没有调用腾讯 API。浏览器仍然只有在用户进入 `debugRoadNetwork` 页面并点击“开始采样并下载 JSON”后，才会触发腾讯 walking route 请求。

### 对 /map 的影响

`/map?debugRoadNetwork=1` 会在左侧显示独立道路网络采样面板。普通 `/map`、`/map?poi=xxx`、`/map?sceneRoute=xxx`、`debugSceneRoute=1`、图层开关、定位、路线进度、偏航状态和路线 path JSON 复制 / 下载功能保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

## 阶段五十五 B：roadNetwork candidate 数据导入

2026-06-04

### 本次目标

读取浏览器 `/map?debugRoadNetwork=1` 导出的 roadNetwork candidate JSON，并转换为项目源码中的 `src/data/lingshanRoadNetwork.ts`。该数据作为后续 3D 道路底网、路线吸附、偏航判断和重规划显示的候选道路网络基础。

### 修改文件

- `src/data/lingshanRoadNetwork.ts`
- `docs/map-3d-development-log.md`

### 原始 JSON 来源

原始文件为 `tmp/road-network/lingshan-road-network-candidates.json`，来自阶段五十五 A 的浏览器 debug 工具导出。该 JSON 不提交到 Git，只作为本阶段转换输入。

### pairCount / segmentCount / skipped 数量

- `pairCount`：76。
- `segmentCount`：76。
- `skipped`：0。
- `source`：`tencent_walking_batch_export`。

按来源统计：

- `guide_route_adjacent`：24。
- `poi_nearby`：32。
- `core_anchor`：20。

### 清洗规则

- 删除 path 中连续重复的经纬度点。
- 本次共删除连续重复点 872 个。
- 如果删除过连续重复点，segment 标记 `duplicate_points_removed`。
- 如果 `distanceMeters <= 5`，segment 标记 `very_short`。
- 如果清洗后 `path.length <= 2`，segment 标记 `short_path`。
- 不删除 `very_short` 或 `short_path` segment，只打 `qualityFlags`，保留候选数据供后续人工复核。

质量标记统计：

- `duplicate_points_removed`：75 段。
- `very_short`：1 段。
- `short_path`：1 段。

### candidate / verified 边界说明

`lingshanRoadNetwork.ts` 中所有 segment 均保持 `status: candidate`，没有任何 `verified` segment。candidate roadNetwork 来自腾讯 walking route 批量采样，不代表官方景区道路，也未经人工复核或现场验证，不能对游客宣称为精确道路网。

### 为什么原始 JSON 不提交

`tmp/road-network/lingshan-road-network-candidates.json` 是浏览器运行时导出的临时采样文件。源码只提交规范化后的 TypeScript 数据文件，避免提交临时导出物，也便于后续统一类型、质量标记和数据访问函数。

### 对 /map 的影响

本阶段没有修改 `/map`。真实地图增强模式、debugRoadNetwork 导出工具、定位、路线进度、偏航提示和 route path JSON 导出能力保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。新增的 `lingshanRoadNetwork` 将在阶段五十六用于 3D 道路底网显示。

### 对导航功能的影响

本阶段不改变当前导航逻辑，只新增 candidate roadNetwork 源数据。后续可在 `/map` 和 `/scenic-3d-map` 中逐步复用该数据进行道路吸附、路线进度和偏航判断。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

阶段五十六在 `/scenic-3d-map` 接入 `lingshanRoadNetwork`，以淡色道路底网显示 candidate segments，并继续明确 candidate 不等于 verified。

### 明确记录

- 本阶段没有调用腾讯 API。
- 本阶段没有修改 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有修改 POI 坐标。
- 本阶段只是把浏览器导出的 candidate roadNetwork 转成源码数据。

### 下一步建议

- 在浏览器中打开 `/three-preview` 和 `/scenic-3d-map`，人工确认灵山大佛模型比例。
- 如仍不合适，继续只调整 `giant_buddha.transform.scale`、`position` 或 `rotation`。
- 确认效果后，再为梵宫、九龙灌浴和五印坛城接入低模 GLB。

### 明确记录

- 本阶段没有修改 `/map`。
- 本阶段没有修改导航功能。
- 本阶段没有修改腾讯地图路线规划逻辑。
- 本阶段只是修复 `/scenic-3d-map` 的模型 transform 应用。
- 本阶段保留首个灵山大佛低模 GLB 本地模型接入。

## 阶段五十六：3D 地图接入 candidate roadNetwork 道路底网

2026-06-04

### 本次目标

让 `/scenic-3d-map` 读取 `src/data/lingshanRoadNetwork.ts` 中的 candidate roadNetwork，并将 76 段候选道路 segment 投影为 3D 道路底网，增强 3D 景区地图的道路空间表达。

### 本次约束

- 只修改 `/scenic-3d-map` 的 3D 道路底网显示、页面说明和开发记录。
- 不修改 `/map`。
- 不修改 `GuideMapPage.tsx`。
- 不修改 `routePlanning.ts`。
- 不修改腾讯 walking route 算法。
- 不修改 roadNetwork 数据内容。
- 不修改 routeGeometry 数据内容。
- 不修改 POI 坐标。
- 不调用腾讯 API。

### 修改文件

- `src/components/scenic3d/Scenic3DMapScene.tsx`
- `src/pages/Scenic3DMapPage.tsx`
- `docs/map-3d-development-log.md`

### roadNetwork 数据概况

- nodes：19。
- segments：76。
- skipped：0。
- status：全部为 `candidate`。
- `duplicate_points_removed`：75 段。
- `very_short`：1 段。
- `short_path`：1 段。
- 没有 `verified` segment。

### 3D 投影方式

`Scenic3DMapScene.tsx` 读取 `lingshanRoadNetwork.segments`，对每个 segment 的 `path` 使用 `geoToScenePosition(point, { center: scenicCenter })` 投影到 3D 坐标。roadNetwork 源数据仍保持经纬度，3D 坐标只作为运行时渲染结果。

### 视觉层级

- roadNetwork candidate 底网：最淡、细线、低透明度，用浅灰绿 / 青灰色表达。
- routeGeometry candidate 层：保留原有三条腾讯 walking routeGeometry 的中等淡色道路网络层。
- 当前路线高亮层：继续使用金色多层线条，保持最高视觉优先级。

`very_short` 或 `short_path` segment 没有删除，仍以更低透明度绘制，方便后续人工复核。

### candidate / verified 边界说明

roadNetwork 来自腾讯 walking route 批量采样，是候选道路底网，不代表官方景区道路，也不是 verified roadNetwork。页面说明中明确 candidate 不等于 verified，不能对游客宣称为精确道路网。

### 对 /scenic-3d-map 的影响

`/scenic-3d-map` 现在显示更完整的候选道路底网。现有路线切换、当前路线金线、POI 节点、标签、水体意象层、placeholder / GLB 模型、跳转 `/map?poi=xxx` 和 `/map?sceneRoute=xxx` 保持不变。

### 对 /map 的影响

本阶段没有修改 `/map`。

### 对导航功能的影响

本阶段只做 3D 道路底网视觉接入，没有做定位吸附、偏航判断或自动重规划。后续阶段可基于 roadNetwork 继续做 3D 定位吸附和导航逻辑。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

阶段五十七可做 roadNetwork 质量审计或 3D 定位吸附，将当前 candidate 道路底网逐步用于路线吸附、距离路线、下一站和偏航判断。

### 明确记录

- 本阶段没有调用腾讯 API。
- 本阶段没有修改 roadNetwork 数据内容。
- 本阶段没有修改 routeGeometry 数据。
- 本阶段没有修改 `/map`。
- 本阶段没有做定位吸附、偏航或重规划，只做道路底网视觉接入。

## 阶段五十七 A：腾讯地图 Web 3D 能力最小验证与调研

2026-06-04

### 本次目标

在不重构 `/map` 主线逻辑的前提下，为腾讯地图 JS API GL 增加一个运行时 3D 能力调试入口，用于确认当前 Web 项目中可尝试的地图 3D 视角、三维底图 / 3D 建筑、自定义 WebGL 图层和 Web 模型覆盖物相关能力。

### 本次约束

- 不修改 `/scenic-3d-map`。
- 不修改 `routePlanning.ts`。
- 不修改腾讯 walking route 算法。
- 不调用额外腾讯路线 API。
- 不新增 GLB / glTF 模型。
- 不读取、不输出、不修改 API Key、`.env` 或敏感配置。
- 调试 UI 只在 `debugTencent3D=1` 或 `debugTencent3D=true` 时显示。

### 修改文件

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### debugTencent3D 参数说明

访问 `/map?debugTencent3D=1` 或 `/map?debugTencent3D=true` 时，页面显示“腾讯地图 Web 3D 能力调试”面板。普通 `/map` 页面不显示该面板。

### 调试能力说明

调试面板提供三个按钮：

- 切换 3D 视角：在确认方法存在后尝试调用 `easeTo`、`setPitch`、`setRotation` 和 `setZoom`。
- 恢复 2D 视角：在确认方法存在后尝试将 pitch / rotation 恢复为 0。
- 打印当前 TMap 能力：只打印当前 `TMap.Map` 实例方法名和 `window.TMap` 暴露的类名，不打印地图 Key 或配置。

### Web 3D 能力判断方式

本阶段只做运行时最小验证：

- 3D 视角通过当前 `TMap.Map` 实例是否暴露 `setPitch`、`setRotation`、`easeTo`、`setZoom` 等方法判断。
- 3D 建筑 / 三维底图通过 `window.TMap` 运行时类名中是否存在 building 相关类名做初步探测。
- Web GLB / glTF 模型覆盖物通过 `window.TMap` 类名中是否存在 model / glTF / GLB 相关类名做初步探测。
- CustomLayer / WebGLLayer 通过 `window.TMap` 类名中是否存在 custom layer / WebGL layer 相关类名做初步探测。

这些结果是当前浏览器运行时检查结果，不等同官方完整能力矩阵；正式集成仍需核对腾讯地图 JS API GL 官方文档。

### 与 Android GLModelOverlay 的差异

Android GLModelOverlay 仍属于腾讯地图 Android Map SDK 方向，不能直接用于当前 React + Vite Web 页面。本阶段只是确认 Web 端 JS API GL 的运行时能力，Android GLModelOverlay 仍作为后续 Android APK 原生增强方案。

### 对 /map 的影响

`/map` 普通模式、POI 聚焦、sceneRoute 初始切换、debugSceneRoute、debugRoadNetwork、路线导出、定位、路线进度和偏航提示均保持不变。新增面板只在 `debugTencent3D` 查询参数开启时显示。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### 对导航功能的影响

本阶段没有修改导航、定位、路线进度、偏航判断或重规划占位逻辑，也没有调用新的腾讯路线接口。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

在浏览器中打开 `/map?debugTencent3D=1`，点击“打印当前 TMap 能力”和“切换 3D 视角”，根据实际运行时结果判断是否继续做 Web 地图 3D 视角增强。若需要 GLB / glTF 与真实底图融合，仍建议将 Android GLModelOverlay 作为 Android 原生后续方案，Web 端优先保持 `/scenic-3d-map` 与 `/map` 双模式。

### 明确记录

- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 `routePlanning.ts`。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有调用额外腾讯路线 API。
- 本阶段没有新增 GLB / glTF 模型。
- 本阶段只是增加 `/map` 的腾讯地图 Web 3D 能力调试入口。

## 阶段五十七：腾讯地图 Web GLTF 模型覆盖物最小验证

2026-06-04

### 本次目标

基于腾讯地图 JavaScript API GL 的 GLTF 模型能力，在 `/map?debugGltfModel=1` 下做最小验证：加载 `libraries=model`，检查 `TMap.model.GLTFModel` 是否可用，并尝试在真实腾讯地图上叠加一个灵山大佛低模 GLB 调试覆盖物。

### 本次约束

- 只修改腾讯地图 loader、`/map` 调试 UI 和开发记录。
- 不修改 `/scenic-3d-map`。
- 不修改 roadNetwork 数据。
- 不修改 routeGeometry 数据。
- 不修改腾讯 walking route 算法。
- 不修改定位、路线进度、偏航和重规划逻辑。
- 不新增大型 GLB / glTF 模型文件。
- 不读取、不输出、不修改 API Key、`.env` 或敏感配置。

### 修改文件

- `src/lib/loadTMap.ts`
- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 官方能力确认

腾讯地图 JavaScript API GL 的 GL 模型文档说明 Web 端支持 GLTF 模型加载，文档路径为：

`https://lbs.qq.com/webApi/javascriptGL/glGuide/glModelGuide`

该能力需要在脚本加载时包含 `libraries=model`，并通过 `TMap.model.GLTFModel` 创建模型覆盖物。GLTFModel 可配置 `url`、`map`、`id`、`position`、`rotation` 和 `scale`，位置可绑定到 `TMap.LatLng(lat, lng, height)`。

### libraries=model 加载

`loadTMap.ts` 在腾讯地图 JS API GL 脚本 URL 中追加 `libraries=model`，使 `/map` 页面初始化时尝试加载 model 附加库。loader 仍只读取现有 Vite 环境变量，不输出 Key，也不改变地图路线请求逻辑。

### debugGltfModel 参数说明

访问 `/map?debugGltfModel=1` 或 `/map?debugGltfModel=true` 时，页面显示“腾讯地图 GLTF 模型覆盖物”调试面板。普通 `/map` 页面不显示该面板，也不会创建 GLTFModel。

### GLTFModel 最小实验

调试面板使用已有模型：

`/models/lingshan/landmarks/lingshan_buddha_blockout_v1.glb`

模型锚点为 `giant_buddha`，优先使用 `lingshanPois.navLocation`，回退到 `displayLocation`。创建模型前会检查 `window.TMap?.model?.GLTFModel` 是否存在；如果不可用，页面显示“当前 TMap 未加载 model 附加库或 GLTFModel 不可用”，不会导致页面崩溃。

### 调试控制

调试面板提供：

- 显示 / 隐藏测试 GLB 模型。
- 调整 `scale`。
- 调整 `height`。
- 调整 `rotationZ / yaw`。

由于 GLTFModel 的运行时增量更新 API 需要以官方文档为准，本阶段在参数变化时安全重建调试覆盖物，并在隐藏、组件卸载或关闭调试时调用 `setMap(null)` 清理。

### 与 Android GLModelOverlay 的关系

Web 端 `TMap.model.GLTFModel` 与 Android SDK 的 GLModelOverlay 不是同一个接口。前者属于腾讯地图 JavaScript API GL，可用于当前 React Web 页面调试模型覆盖物；后者仍是 Android 原生地图增强方案。两者都可能复用 GLB / glTF 模型资产，但加载方式、坐标、生命周期和性能约束需要分别验证。

### 对 /map 的影响

普通 `/map` 行为保持不变。POI Marker、路线、InfoWindow、sceneRoute、debugSceneRoute、debugRoadNetwork、定位、路线进度、偏航提示和路线导出功能均不受影响。GLTFModel 只在 `debugGltfModel` 查询参数开启时创建。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### 下一步建议

在浏览器访问 `/map?debugGltfModel=1` 验证 GLTFModel 是否可用、模型是否能正确显示、scale / height / rotation 是否符合预期。如果验证成功，后续可设计 `/map` 的真实 3D 景点模型增强模式，并建立 Web GLTFModel 与 `/scenic-3d-map` 模型资产的共用规范。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 明确记录

- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有修改定位、路线进度、偏航和重规划逻辑。
- 本阶段没有修改 roadNetwork 或 routeGeometry 数据。
- 本阶段没有新增大型 GLB / glTF 模型文件。
- 本阶段只新增 `/map` 的 Web GLTFModel 调试覆盖物能力。

## 阶段五十七补充：腾讯地图 GLTF 调试 3D 视角修正

2026-06-04

### 问题现象

`/map?debugGltfModel=1` 中已尝试创建 `TMap.model.GLTFModel`，但人工调试时模型不明显或不可见，地图仍停留在 2D 俯视视角。腾讯官方 GLTFModel 示例使用更高 zoom 和倾斜视角，例如 `zoom: 19`、`pitch: 50`、`rotation: -20`，当前调试页面缺少专门的相机切换入口。

### 修复方式

在 `debugGltfModel` 面板中增加：

- “进入 3D 视角”按钮：将地图中心移动到灵山大佛锚点，并尝试设置 `zoom=19`、`pitch=60`、`rotation=-25`。优先调用 `map.easeTo`，并在方法存在时回退调用 `setCenter`、`setZoom`、`setPitch`、`setRotation`。
- “恢复 2D 视角”按钮：尝试恢复 `pitch=0`、`rotation=0`，并将 zoom 恢复为进入调试前的 zoom 或 16。
- 所有地图方法调用前均做存在性判断，并用 `try/catch` 防止页面崩溃。

### 模型可见性增强

调整 `debugGltfModel` 默认参数：

- `scale=1000`。
- `height=50`。
- `rotationZ=0`。

scale 调试从连续滑块改为离散选项：`50`、`100`、`500`、`1000`、`3000`、`5000`，方便快速验证模型尺度。

### 加载诊断增强

`debugGltfModel` 面板现在显示：

- `GLTFModel` 是否可用。
- 当前模型 URL。
- 当前 position 的 lat / lng / height。
- 当前 scale。
- 目标 zoom / pitch / rotation。
- 模型 loaded / error 事件状态。

创建 GLTFModel 后，如果运行时对象提供 `on` 方法，则尝试监听 `loaded` 和 `error` 事件；如果没有事件监听方法，则显示“当前 SDK 未发现事件监听方法”，不阻断调试。

### 对 /map 的影响

普通 `/map` 不受影响。GLTFModel 调试覆盖物、3D 视角切换和模型诊断只在 `debugGltfModel=1` 或 `debugGltfModel=true` 时启用。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 明确记录

- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 roadNetwork。
- 本阶段没有修改 routeGeometry。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有修改定位、偏航或重规划逻辑。
- 本阶段没有新增大型模型文件。

## 阶段五十七补充 2：GLTF 模型实时调试与多视角预设

2026-06-04

### 问题现象

`/map?debugGltfModel=1` 已能显示 GLB 模型，但调节 `scale` 时视觉反馈不明显；同时调试面板只有一个固定 3D 视角，不方便从不同方向观察腾讯地图 Web GLTF 覆盖物。

### 原因分析

此前调试实现主要依赖参数变化后重建 `GLTFModel`，没有优先使用腾讯官方文档中的运行时更新方法。因此 `scale`、`height`、`rotation` 的调试反馈不够直接，也缺少运行时 getter 读数辅助判断。

### 修复方式

`debugGltfModel` 调试逻辑现在优先复用已创建的 `GLTFModel` 实例：

- `scale` 变化时优先调用 `model.setScale(scale)`。
- `rotationZ` 变化时优先调用 `model.setRotation([0, 0, rotationZ])`。
- `height` 变化时优先调用 `model.setPosition(new TMap.LatLng(lat, lng, height))`。
- 显示 / 隐藏模型时优先调用 `model.show()` / `model.hide()`。
- 如果对应方法不存在或调用失败，再 fallback 到重建模型。

调试面板同时显示 `getScale()`、`getRotation()`、`getPosition()` 的运行时读数；如果 getter 不可用则显示不可用。

### 多视角预设

新增 5 个 3D 视角预设：

- 正面近景：`zoom=19.5`、`pitch=65`、`rotation=0`。
- 左前侧：`zoom=19.5`、`pitch=65`、`rotation=-45`。
- 右前侧：`zoom=19.5`、`pitch=65`、`rotation=45`。
- 俯视检查：`zoom=18.5`、`pitch=0`、`rotation=0`。
- 远景鸟瞰：`zoom=17.5`、`pitch=55`、`rotation=-30`。

视角切换优先调用 `map.easeTo({ center, zoom, pitch, rotation }, { duration: 500 })`，并在方法存在时回退调用 `setCenter`、`setZoom`、`setPitch`、`setRotation`。所有方法调用均做存在性判断和异常保护。

### 默认参数

`debugGltfModel` 默认参数保持：

- `scale=1000`。
- `height=50`。
- `rotationZ=0`。
- 默认目标视角：`zoom=19.5`、`pitch=65`、`rotation=0`。

### 对 /map 的影响

普通 `/map` 不受影响。实时参数更新、多视角预设和运行时读数只在 `debugGltfModel=1` 或 `debugGltfModel=true` 时启用。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 明确记录

- 本阶段没有修改普通 `/map` 行为。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 roadNetwork。
- 本阶段没有修改 routeGeometry。
- 本阶段没有修改腾讯 walking route、定位、偏航或重规划逻辑。
- 本阶段没有新增模型文件。

## 阶段五十七补充 3：GLTF 模型 yaw 轴修正

2026-06-05

### 问题现象

`/map?debugGltfModel=1` 中 GLTF 模型已经能显示，`scale` 和 `height` 调节也能生效，但原先的 `rotationZ / yaw` 控制并不是改变模型水平朝向，而是让模型倾倒。

### 原因分析

腾讯地图 Web `GLTFModel` 的模型本地旋转轴和 Three.js 场景语义不完全一致。当前灵山大佛 GLB 的水平朝向更适合使用 `rotationY` 调整；继续把 yaw 绑定到 `rotationZ` 会更像在调 pitch / roll，从而导致模型倾倒。

### 修复方式

`debugGltfModel` 默认 yaw 控制改为 `rotationY`：

- 主 UI 文案从 `rotationZ / yaw` 改为 `yaw / rotationY`。
- 默认 `rotationX=0`、`rotationY=0`、`rotationZ=0`。
- 调整 yaw 时调用 `model.setRotation([0, yaw, 0])` 语义，即当前实现中的 `[rotationX, rotationY, rotationZ]`，默认 X/Z 均为 0。
- 创建模型时也使用同一组 `[rotationX, rotationY, rotationZ]`，避免初始创建和运行时调参不一致。

### 高级旋转调试

`debugGltfModel` 面板新增可折叠“高级旋转调试”区域：

- `rotationX`。
- `rotationY / yaw`。
- `rotationZ`。

面板说明中明确：yaw 通常使用 `rotationY`；如果模型倾倒，说明正在调节 pitch / roll，不是朝向；不同 GLB 的本地坐标轴可能不同，需要逐个模型校准。

### 模型调试状态

面板现在显示：

- 当前 `rotationX`。
- 当前 `rotationY / yaw`。
- 当前 `rotationZ`。
- 当前 `setRotation([rotationX, rotationY, rotationZ])` 数组。

### 对 /map 的影响

普通 `/map` 不受影响。所有旋转轴调试能力只在 `debugGltfModel=1` 或 `debugGltfModel=true` 时显示。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 明确记录

- 本阶段没有修改普通 `/map` 行为。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 roadNetwork。
- 本阶段没有修改 routeGeometry。
- 本阶段没有修改路线规划、定位、偏航或重规划逻辑。
- 本阶段没有新增模型文件。

## 阶段五十八：腾讯地图 GLB 景点覆盖物配置化

2026-06-05

### 本次目标

将 `/map?debugGltfModel=1` 中的腾讯地图 Web GLTFModel 覆盖物从单个硬编码测试模型升级为配置驱动的景点模型覆盖物系统，为后续接入 MeshyAI / GLB 生成的灵山大佛、梵宫、九龙灌浴、五印坛城等模型做数据结构准备。

### 修改文件

- `src/data/lingshanMapModelOverlays.ts`
- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 新增 lingshanMapModelOverlays.ts

新增 `src/data/lingshanMapModelOverlays.ts`，用于描述腾讯地图 Web `TMap.model.GLTFModel` 覆盖物配置。该文件只描述模型覆盖物，不改变 POI 真实坐标；模型 `status` 不等于景点数据状态；`missing_model` 表示等待后续 GLB 资产接入。当前配置仅供 `debugGltfModel` 模式使用，普通游客页面不会默认加载。

### 为什么从硬编码改为配置化

阶段五十七已验证 Web GLTFModel 可以显示灵山大佛低模模型，但模型 URL、锚点 POI、scale、height、rotation 等参数仍集中在 `GuideMapPage.tsx` 中。后续需要同时接入多个核心景点模型，因此必须将模型覆盖物配置抽离为数据文件，便于逐个景点接入、调试和校准。

### 当前配置的 POI

当前第一版配置包含：

- `giant_buddha`：灵山大佛。
- `fan_gong`：梵宫。
- `jiulong_guanyu`：九龙灌浴。
- `wuyin_tancheng`：五印坛城。

### debug_ready / missing_model 状态

- `giant_buddha`：`debug_ready`，modelUrl 为 `/models/lingshan/landmarks/lingshan_buddha_blockout_v1.glb`。
- `fan_gong`：`missing_model`，等待 MeshyAI / GLB 模型接入。
- `jiulong_guanyu`：`missing_model`，等待 MeshyAI / GLB 模型接入。
- `wuyin_tancheng`：`missing_model`，等待 MeshyAI / GLB 模型接入。

本阶段没有把任何模型标记为普通生产可用的 verified 状态。

### debugGltfModel 面板选择模型

`/map?debugGltfModel=1` 面板新增“选择模型配置”下拉框，读取 `getDebugMapModelOverlays()`。切换配置后会：

- 更新当前 `poiId`、`modelUrl`、`status`、`positionSource`。
- 将 `scale`、`height`、`rotationX/Y/Z` 重置为配置默认值。
- 清理旧 GLTFModel，并按当前配置重新创建模型。
- 如果配置缺少 `modelUrl` 或状态为 `missing_model`，显示“等待模型接入”，不创建 GLTFModel，也不报错。

### 调试能力保留

`debugGltfModel` 仍保留：

- 显示 / 隐藏模型。
- `scale` 实时调试。
- `height` 实时调试。
- `yaw / rotationY` 实时调试。
- 高级 `rotationX/Y/Z` 调试。
- 多个 3D 视角预设。
- loaded / error 状态和运行时 getter 读数。

这些调试值只影响当前页面调试态，不会写回配置文件。

### 对 /map 的影响

普通 `/map` 不受影响。GLTFModel 覆盖物只在 `debugGltfModel=1` 或 `debugGltfModel=true` 时启用。`debugRoadNetwork`、`debugSceneRoute`、POI 聚焦、路线切换、定位、路线进度和偏航提示保持不变。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### 对导航功能的影响

本阶段没有修改腾讯 walking route、定位、偏航或重规划逻辑。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

阶段五十九可接入 MeshyAI 生成的灵山大佛正式 GLB，或将当前调试后的 scale / height / rotation 校准参数保存回 `lingshanMapModelOverlays.ts`，再逐步接入梵宫、九龙灌浴和五印坛城。

### 明确记录

- 本阶段没有新增大型 GLB 文件。
- 本阶段没有修改 POI 坐标。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 roadNetwork。
- 本阶段没有修改腾讯 walking route。
- 本阶段只是将 `/map` 的 GLB 覆盖物调试从硬编码升级为配置化。

## 阶段五十九：腾讯地图 GLB 模型校准参数复制工具

2026-06-05

### 本次目标

在 `/map?debugGltfModel=1` 的腾讯地图 GLTFModel 调试面板中增加校准参数复制能力，让开发者在浏览器中调好 `scale`、`height`、`yaw / rotationY`、`rotationX/Y/Z` 后，可以直接复制 TypeScript 配置片段或调试摘要，后续人工保存回 `src/data/lingshanMapModelOverlays.ts`。

### 修改文件

- `src/pages/GuideMapPage.tsx`
- `docs/map-3d-development-log.md`

### 为什么复制配置而不是浏览器直接写源码

GLTFModel 调试发生在浏览器运行时，浏览器不能也不应该直接写入项目源码。配置复制工具只生成可审阅的 TypeScript 片段，由开发者人工确认后再写回 `lingshanMapModelOverlays.ts`，避免运行时参数误写源码，也避免引入文件写入权限和安全风险。

### 复制当前模型配置字段

`debugGltfModel` 面板新增“复制当前模型配置”按钮，复制内容包含：

- `poiId`
- `name`
- `modelUrl`（如果当前配置存在）
- `positionSource`
- 当前调试态 `height`
- 当前调试态 `scale`
- 当前 `rotation: [rotationX, rotationY, rotationZ]`
- 当前 `status`
- `enabledInDebug: true`
- 校准说明 `note`

如果当前 POI 仍为 `missing_model` 且没有 `modelUrl`，也可以复制配置片段，但不会伪造模型路径，`status` 保持当前配置状态。

### 复制调试摘要字段

新增“复制调试摘要”按钮，复制内容包含：

- `poiId`
- `name`
- `modelUrl`
- `positionSource`
- 当前 position `lat/lng/height`
- 当前 `scale`
- 当前 `rotationX/Y/Z`
- 当前 `setRotation` 数组
- 当前视角 `zoom / pitch / rotation`
- loaded / error 状态
- error 信息

### 复制兜底

优先使用浏览器 Clipboard API。若 Clipboard API 不可用或复制失败，则输出到控制台，并尝试用 `prompt` 展示文本供人工复制，页面不会报错。

### 对 /map 的影响

普通 `/map` 不受影响。复制工具只在 `debugGltfModel=1` 或 `debugGltfModel=true` 下显示。模型选择、显示隐藏、`scale`、`height`、`yaw / rotationY`、高级 `rotationX/Y/Z` 和视角预设均保持可用。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### 对导航功能的影响

本阶段没有修改 roadNetwork、routeGeometry、腾讯 walking route、定位、偏航或重规划逻辑。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

接入 MeshyAI 灵山大佛正式 GLB 后，可继续使用 `/map?debugGltfModel=1` 调整模型位置高度、比例和朝向，再通过“复制当前模型配置”把校准参数保存回 `lingshanMapModelOverlays.ts`。同一流程可复用于梵宫、九龙灌浴和五印坛城。

### 明确记录

- 本阶段没有修改普通 `/map` 行为。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 roadNetwork。
- 本阶段没有修改 routeGeometry。
- 本阶段没有修改腾讯 walking route。
- 本阶段没有修改定位、偏航或重规划逻辑。
- 本阶段没有新增大型模型文件。

## 阶段六十：真实 3D 地图增强模式架构收束文档

2026-06-05

### 本次目标

在腾讯地图 Web GLTFModel 验证完成后，重新收束真实导航与沉浸式 3D 沙盘的职责边界，明确后续真实游客导航主线应放在 `/map`，而 `/scenic-3d-map` 保留为沉浸式文化沙盘和展示模式。

### 本次约束

- 只修改 Markdown 文档。
- 不修改 `/map` 功能代码。
- 不修改 `/scenic-3d-map`。
- 不修改 `routePlanning.ts`。
- 不修改 roadNetwork。
- 不修改 routeGeometry。
- 不新增模型文件。
- 不调用腾讯 API。
- 不读取、不修改 `.env`、API Key、token 或敏感配置。

### 修改文件

- `docs/tencent-map-3d-overlay-navigation-architecture.md`
- `docs/map-3d-development-log.md`

### 新增架构文档

新增 `docs/tencent-map-3d-overlay-navigation-architecture.md`，文档标题为《腾讯地图 3D 模型覆盖与真实导航架构方案》。文档记录：

- 腾讯 Web JS API GL 已验证支持 `TMap.model.GLTFModel`。
- `/map?debugGltfModel=1` 已能加载 GLB。
- `scale`、`height`、`yaw / rotationY`、`rotationX/Y/Z` 可调。
- 视角预设可切换。
- `lingshanMapModelOverlays.ts` 已将模型覆盖物配置化。
- 调试面板可复制当前模型配置和调试摘要。

### /map 与 /scenic-3d-map 职责分工

文档明确：

- `/map` 应作为真实导航主模式。
- `/scenic-3d-map` 应作为沉浸式文化沙盘模式。
- 两者不是替代关系，而是互补关系。

`/map` 负责腾讯真实底图、真实道路水体建筑环境、walking route、实时定位、路线进度、偏航判断、自动重规划到下一站、GLB 景点模型覆盖物、POI 信息和讲解入口。

`/scenic-3d-map` 负责艺术化 3D 导览、路线故事、景点文化展示、展示和答辩视觉、低模场景表达，不作为真实导航权威。

### roadNetwork 重新定位

roadNetwork candidate 仍有价值，可用于 `/scenic-3d-map` 道路底网、后续吸附实验和路线质量审计。但真实游客导航应优先依赖腾讯地图 `/map`。roadNetwork candidate 不代表官方道路，也不代表 verified 精确步道。

文档建议暂缓继续追求 `/scenic-3d-map` 完整道路真实化，把真实导航主线转向 `/map`。

### GLB 模型资产流程

文档梳理后续 GLB 流程：

- MeshyAI / AI 3D 生成。
- Blender / Blender MCP 清理。
- 放入 `public/models/lingshan/landmarks/`。
- 在 `lingshanMapModelOverlays.ts` 配置。
- 通过 `/map?debugGltfModel=1` 校准。
- 使用“复制当前模型配置”回填。
- 后续再决定是否在普通 `/map` 真实 3D 模式启用。

### 后续阶段建议

文档建议：

- 阶段六十一：接入 MeshyAI 灵山大佛正式 GLB。
- 阶段六十二：配置梵宫、九龙灌浴、五印坛城模型覆盖物。
- 阶段六十三：`/map` 真实 3D 模型增强模式 UI。
- 阶段六十四：`/map` 3D 导航状态卡。
- 阶段六十五：偏航后自动重规划到下一站并同步显示。

### 对 /map 的影响

本阶段没有修改 `/map` 功能代码，只通过文档明确后续 `/map` 是真实导航和 3D 模型覆盖物增强的主线。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。文档明确 `/scenic-3d-map` 保留为沉浸式文化沙盘和展示视觉，不承担真实导航权威。

### npm run build 结果

本阶段只修改 Markdown 文档，不需要运行 `npm run build`。

### 明确记录

- 本阶段没有修改功能代码。
- 本阶段没有修改 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 `routePlanning.ts`。
- 本阶段没有修改 roadNetwork。
- 本阶段没有修改 routeGeometry。
- 本阶段没有新增模型文件。
- 本阶段没有调用腾讯 API。

## 阶段六十一：接入 MeshyAI 灵山大佛正式 GLB

2026-06-05

### 本次目标

将 MeshyAI 生成的灵山大佛正式 GLB 接入腾讯地图 Web GLTFModel 覆盖物配置，让 `/map?debugGltfModel=1` 后续可以直接选择 `giant_buddha` 进行正式模型的 scale / height / yaw 校准。

### 源文件查找与整理

按指定规则先执行查找命令：

```bash
find .. ~/Downloads -maxdepth 5 \( -iname 'Meshy_AI_Golden_Standing_Buddh_0605091202_texture*' -o -iname '*Golden_Standing_Buddh*' \) -print
```

该命令未返回结果。随后确认项目模型目录中已有未跟踪源 GLB：

`public/models/lingshan/landmarks/Meshy_AI_Golden_Standing_Buddh_0605091202_texture.glb`

该文件为 `.glb`，大小约 25MB。本阶段将其复制为规范项目路径：

`public/models/lingshan/landmarks/lingshan_buddha_meshy_v1.glb`

原始源文件不加入提交，提交规范化后的 `lingshan_buddha_meshy_v1.glb`。

### 修改文件

- `public/models/lingshan/landmarks/lingshan_buddha_meshy_v1.glb`
- `src/data/lingshanMapModelOverlays.ts`
- `docs/map-3d-development-log.md`

### giant_buddha 配置更新

`src/data/lingshanMapModelOverlays.ts` 中 `giant_buddha` 的 `modelUrl` 已从低模 blockout：

`/models/lingshan/landmarks/lingshan_buddha_blockout_v1.glb`

切换为 MeshyAI 正式模型：

`/models/lingshan/landmarks/lingshan_buddha_meshy_v1.glb`

`height`、`scale`、`rotation` 继续沿用当前配置，不凭空写入最终校准值。`note` 中记录源文件名、原 blockout 路径和仍需在 `/map?debugGltfModel=1` 中校准。

### 对 /map 的影响

普通 `/map` 不默认加载 GLB。模型仍只在 `debugGltfModel=1` 或 `debugGltfModel=true` 下由调试面板创建。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### 对导航功能的影响

本阶段没有修改 roadNetwork、routeGeometry、腾讯 walking route、定位、偏航或重规划逻辑。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

打开 `/map?debugGltfModel=1`，选择灵山大佛模型，使用视角预设检查 MeshyAI GLB 的贴地、比例和朝向；调好后使用“复制当前模型配置”回填 `lingshanMapModelOverlays.ts`。如果模型体积或加载性能影响明显，后续需要进行 GLB 压缩和贴图优化。

### 明确记录

- 本阶段没有修改普通 `/map` 逻辑。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 roadNetwork。
- 本阶段没有修改 routeGeometry。
- 本阶段没有修改腾讯 walking route。
- 本阶段没有修改定位、偏航或重规划逻辑。
- 本阶段没有读取或修改 `.env`、API Key、token 或敏感配置。

## 阶段六十二：独立 /map-3d-guide 真实 3D 地图导览 Demo

2026-06-06

### 本次目标

新增独立页面 `/map-3d-guide`，作为“灵山胜境真实 3D 地图导览模式”的第一版可运行 demo。页面使用腾讯地图 JavaScript API GL，默认进入倾斜 3D 视角，固定演示历史文化路线，展示风格化金色导览线、模拟定位、偏航重规划和 GLB 景点模型 Beta。

### 本次约束

- 不修改普通 `/map` 行为。
- 不修改 `/scenic-3d-map`。
- 不修改 `/three-preview`。
- 不修改腾讯 walking route 算法。
- 不修改 routeGeometry / roadNetwork 数据。
- 不读取、不修改 `.env`、API Key、token 或敏感配置。
- 不使用 `git add .`。
- 不执行 push。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `src/App.tsx`
- `docs/map-3d-guide-demo-plan.md`
- `docs/map-3d-development-log.md`

### 页面能力

`/map-3d-guide` 第一版实现：

- 使用腾讯地图 GL JS 初始化地图。
- 默认 `pitch` / `rotation` / `zoom` 进入 3D 倾斜视角。
- 固定演示历史文化路线 `historical_culture`。
- 优先使用 `lingshanRouteGeometries` 中的历史文化候选路线作为主路线。
- 主路线以金色风格化导览线显示。
- 页面叠加水墨青绿、佛教金色和宣纸雾化风格 UI，不是裸腾讯地图。
- 显示当前路线、当前位置、下一站、距离下一站、路线进度、终点和偏航状态。
- 提供跳转 `/map` 与 `/scenic-3d-map` 的入口。

### 模拟定位

页面不接真实 GPS，仅提供模拟定位：

- 上一站。
- 下一站。
- 模拟前进。
- 模拟偏航。
- 回到路线。

模拟位置以风格化当前位置 Marker 显示在腾讯地图上。

### 偏航与重规划

点击“模拟偏航”后，页面会将模拟位置移动到主路线外，并调用现有 `buildWalkingRoute([偏航位置, 下一站位置])` 进行腾讯 walking route 重规划。页面加载时不会调用腾讯 walking route。

重规划结果以青绿色临时路线显示，并在状态卡中展示距离、耗时和状态。如果请求失败或返回 fallback，页面显示兜底提示，不崩溃。

### 3D 景点模型 Beta

页面复用 `lingshanMapModelOverlays.ts`，提供“显示 3D 景点模型 Beta”开关，至少尝试加载 `giant_buddha` GLB。模型默认不加载，加载失败不会影响地图导览。模型调参仍保留在 `/map?debugGltfModel=1`。

### 风格化地图皮肤

本阶段未引入外部素材。页面使用 CSS 渐变、半透明覆盖层、SVG data URL Marker 和玻璃拟态面板实现高级东方、水墨青绿、佛教金色和宣纸雾化风格，因此不需要新增素材许可证文档。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`。普通 `/map`、`/map?debugGltfModel=1`、`/map?debugRoadNetwork=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### 验证方式

- 运行 `npm run build`。
- 检查 `/map-3d-guide` 路由已在 `src/App.tsx` 注册。
- 检查页面代码只在点击“模拟偏航”时调用 `buildWalkingRoute`。
- 检查工作区未触碰 `.env`、API Key 或 token。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建；本阶段新增 `Map3DGuidePage` 独立 chunk。

### 下一步建议

后续可以在 `/map-3d-guide` 中继续完善普通游客可用的 3D 模型增强模式 UI、重规划状态卡，以及 MeshyAI 模型的正式校准参数。若要进入生产展示，应进一步实机验证腾讯 GLTFModel 性能和 Key 白名单配置。

### 明确记录

- 本阶段没有修改普通 `/map` 行为。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 `/three-preview`。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有修改 routeGeometry。
- 本阶段没有修改 roadNetwork。
- 本阶段没有新增外部素材。

## 阶段六十三：/map-3d-guide 艺术化主视觉层

2026-06-06

### 本次目标

将 `/map-3d-guide` 从“腾讯地图加滤镜”的视觉表达，升级为“腾讯地图坐标底座 + 灵山胜境艺术化主视觉层”的定制 3D 导览地图。腾讯地图继续负责真实坐标、3D 相机、路线重规划和 GLB 锚定，自绘层负责用户看到的山水、建筑、佛光、金色游线和核心 POI 立牌。

### 本次约束

- 只修改 `/map-3d-guide` 相关代码。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token 或敏感配置。
- 不引入未确认许可证素材。
- 不使用 `git add .`。
- 不执行 push。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-guide-demo-plan.md`
- `docs/map-3d-development-log.md`

### 为什么从滤镜皮肤转向艺术化主视觉层

前一版已经有水墨青绿、佛教金色和宣纸雾化风格，但视觉基础仍主要依赖腾讯底图，容易看起来像“真实地图加滤镜”。本阶段改为在腾讯地图上叠加内联 SVG / HTML / CSS 的艺术地图层，让灵山定制视觉成为主表达，同时保留腾讯地图作为真实导航底座。

### 艺术化主视觉层

新增艺术层包含：

- 青绿山体块面。
- 墨蓝水体块面。
- 宣纸纹理噪声。
- 核心游线区域柔光。
- 金色主路线丝带。
- 简化建筑 / 广场块面。
- 灵山大佛区域佛光强调。
- 核心 POI 立牌式标签。

这些元素均为内联 SVG / CSS 自绘，不使用外部素材。

### 腾讯地图底座

腾讯地图仍然初始化和保留在底层，负责：

- 真实经纬度和地图相机。
- 主路线和临时重规划路线的真实坐标绘制。
- 点击“模拟偏航”后调用现有腾讯 walking route。
- GLB 模型覆盖物 Beta 的真实锚点。

本阶段降低腾讯底图视觉权重，使普通地名、停车场等信息退到背景，但路线、当前位置、下一站和核心 POI 仍通过自绘层和导览 UI 保持清楚。

### POI 立牌增强

新增一组核心 POI 立牌：

- 当前站点使用金色高亮。
- 下一站使用青金色高亮。
- 终点 / 出口使用红金边。
- 普通路线站点使用低调玉牌编号。

立牌可点击并复用原有 `moveToStop` 逻辑，不改变路线数据。

### 路线视觉

主历史文化路线继续保留腾讯 MultiPolyline 的真实坐标线，同时新增 SVG 艺术金色丝带作为第一视觉重点。偏航后的临时重规划路线仍由腾讯 walking route 返回路径绘制，保留蓝绿色发光路线，与主路线区分。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 和 `/map?debugGltfModel=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### 验证方式

- 运行 `npm run build`。
- 浏览器打开 `/map-3d-guide`，检查自绘山体、水体、建筑块面、佛光、金色游线和 POI 立牌。
- 检查“模拟偏航”仍可触发腾讯 walking route 重规划到下一站。
- 检查 `/map`、`/map?debugGltfModel=1`、`/scenic-3d-map` 均可打开。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建；本阶段新增的艺术化主视觉层进入 `Map3DGuidePage` 独立 chunk。

### 下一步建议

后续可以进一步把艺术层的关键节点与腾讯地图投影坐标绑定，使立牌和 SVG 游线在不同相机角度下更贴合真实地图；也可以为不同路线建立独立艺术层。

### 明确记录

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 routeGeometry。
- 本阶段没有修改 roadNetwork。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有调用新的腾讯 API。
- 本阶段没有新增外部素材。

## 阶段六十四：/map-3d-guide 固定艺术覆盖层移除与腾讯底图样式能力核验

### 日期

2026-06-06

### 本次目标

修正 `/map-3d-guide` 中固定屏幕艺术覆盖层导致的空间错位问题，并核验腾讯地图 Web JS API GL 在当前运行时是否暴露自定义底图样式相关方法。

### 本次约束

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 规划算法。
- 不读取、不输出、不修改 `.env`、API Key、token。
- 不新增外部素材。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 固定覆盖层问题

前一版 `/map-3d-guide` 使用了固定在屏幕上的 SVG 艺术主视觉，包括大面积水体、山体色块、佛像 / 莲花符号、建筑块面、金色斜线路线和百分比定位 POI 立牌。这些元素不随腾讯地图缩放、旋转、平移变化，容易遮挡真实道路、白模、POI 和路线，不符合真实 3D 导览地图的空间一致性要求。

### 修复方式

本阶段移除固定 SVG 艺术主视觉、固定 POI 立牌、大面积水体 / 山体 / 聚焦色块，仅保留低透明宣纸纹理、边缘雾化和轻微青绿滤镜。主路线、重规划路线、当前位置、核心 POI 和 GLB 模型继续使用腾讯地图经纬度覆盖物：

- 主路线：`TMap.MultiPolyline`
- 临时重规划路线：`TMap.MultiPolyline`
- POI / 当前站 / 下一站 / 终点：`TMap.MultiMarker`
- 模拟当前位置：`TMap.MultiMarker`
- GLB 模型 Beta：`TMap.model.GLTFModel`

### 腾讯自定义地图样式核验

用户已在腾讯位置服务控制台创建并发布“我的自定义样式1”，并绑定当前项目使用的 Web Key。但强制刷新 `/map-3d-guide` 后底图样式没有变化，因此不能假设“控制台绑定 Key 后 Web 页面自动生效”。

本阶段在 `/map-3d-guide` 中增加了只读运行时探测，检查 `TMap.Map` 实例及原型链是否存在以下样式相关方法：

- `setMapStyleId`
- `setStyle`
- `setMapStyle`
- `setBaseMap`
- 其它明显包含 `style` / `baseMap` / `theme` / `skin` 的方法名

该探测只读取方法名，不调用未知接口，不硬编码未知 `styleId`，不读取或输出 API Key。

### 当前结论

腾讯自定义地图样式是更正确的底图风格化方向，但当前项目尚未确认 JS API GL 自定义样式的运行时接入方式。控制台 Key 绑定目前没有在 Web 页面中自动生效。后续如果确认官方 Web GL 样式接入 API，应通过明确的 styleId / style 方法接入，而不是继续使用固定大面积 CSS / SVG 覆盖层承担主视觉空间表达。

### 对 /map-3d-guide 的影响

`/map-3d-guide` 继续保留腾讯 3D 地图底座、历史文化路线、模拟定位、模拟偏航、腾讯 walking route 重规划、重规划路线和 GLB 模型 Beta。页面视觉从“静态海报覆盖地图”收敛为“腾讯真实地图被低透明灵山风格包装”。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 和 `/map?debugGltfModel=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map-3d-guide`，确认不再出现固定大莲花、大色块、大斜线覆盖地图主体。
- 缩放、旋转、平移地图时，路线和 POI 仍跟随腾讯地图。
- 点击“模拟偏航”，确认仍调用腾讯 walking route 并显示临时重规划路线。
- 检查 `/map`、`/map?debugGltfModel=1`、`/scenic-3d-map` 正常。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

优先查证腾讯地图 JS API GL 自定义样式的官方 Web 接入方式。如果确认有可用 style API，再将控制台发布的自定义 styleId 接入 `/map-3d-guide` 的地图初始化或运行时样式设置；水体、山体等艺术化空间元素后续应使用经纬度 polygon / overlay 方式实现，而不是固定屏幕覆盖。

### 明确记录

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 routeGeometry。
- 本阶段没有修改 roadNetwork。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有调用新的腾讯 API。
- 本阶段没有读取或输出 API Key。
- CSS 固定层只保留轻量氛围，不承担主视觉空间表达。

## 阶段六十六：腾讯个性化地图样式接入方式专项核验

### 日期

2026-06-06

### 本次目标

专项核验腾讯地图 Web JavaScript API GL 的个性化地图样式接入方式，避免误判“控制台绑定 Web Key 后自动生效”。本阶段只做运行时能力探测和诊断展示，不做大范围视觉改造。

### 当前背景

用户已在腾讯位置服务控制台创建并发布“我的自定义样式1”，且绑定当前项目使用的 Web Key。但强制刷新 `/map-3d-guide` 后底图样式没有自动变化，因此不能把控制台绑定视为 Web 页面已经接入个性化样式。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 代码核验范围

本阶段检查了当前项目的腾讯地图加载和初始化方式：

- `src/lib/loadTMap.ts` 负责加载 `https://map.qq.com/api/gljs?v=1.exp`，当前只附加 `libraries=model`。
- `/map-3d-guide` 中的 `TMap.Map` 初始化设置了 `center`、`zoom`、`pitch`、`rotation`，未传入已确认的自定义样式参数。
- 本阶段未修改普通 `/map` 的腾讯地图加载逻辑。

### 运行时样式能力探测

`/map-3d-guide` 新增小型只读诊断区域，展示：

- 个性化地图样式：待接入。
- 控制台 Key 绑定：用户已确认，但页面未自动生效。
- `TMap.Map` 实例 / 原型链上的候选方法：
  - `setMapStyleId`
  - `setStyle`
  - `setMapStyle`
  - `setBaseMap`
- `window.TMap` 上名称包含 `style` / `Style` / `baseMap` / `theme` / `skin` 的相关对象或方法。

该探测只读取方法名，不调用未知接口，不硬编码未知 `styleId`，不读取或输出 API Key，也不访问腾讯控制台私有接口。

### 探测结论

当前不能确认“控制台 Key 绑定会自动让 Web 页面生效”。页面运行时会显示是否探测到候选 style API：

- 如果探测到可能的样式接入方法，页面提示“需提供官方 styleId 或确认参数后再启用”。
- 如果没有探测到明确方法，页面提示“暂以轻量滤镜和地图锚定元素实现风格化”。

公开检索中可以看到第三方资料提到 `mapStyleId` 方向，但本阶段未找到可直接作为项目代码依据的腾讯官方 Web GL 样式接入页面，因此没有把 `mapStyleId` 写入运行时代码。

### 架构边界

腾讯个性化地图样式仍是更正确的底图风格化方向。固定 CSS 层只保留低透明宣纸纹理、边缘雾化和轻微滤镜，不承担主视觉空间表达。路线、POI、当前位置、重规划线、GLB 模型仍必须绑定腾讯地图经纬度或现有 TMap overlay。

### 对 /map-3d-guide 的影响

`/map-3d-guide` 增加一个很小的只读诊断区，不自动改变地图底图样式，不调用样式接口，不影响历史文化路线、模拟定位、模拟偏航、腾讯 walking route 重规划、重规划路线和 GLB 模型 Beta。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 和 `/map?debugGltfModel=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map-3d-guide`，检查诊断区显示候选样式方法 true / false。
- 确认不再出现固定大莲花、大色块、大斜线。
- 确认路线、POI、当前位置、重规划线仍随腾讯地图缩放、旋转、平移。
- 检查 `/map`、`/map?debugGltfModel=1`、`/scenic-3d-map` 正常。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

需要用户提供腾讯控制台中发布样式对应的官方 Web GL 接入说明或 styleId 参数来源。确认官方参数后，再在 `/map-3d-guide` 中以可选常量或配置方式接入，避免硬编码未知 styleId 或误用其它平台的样式接口。

### 明确记录

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 routeGeometry / roadNetwork 数据。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有读取、输出或修改 API Key。

## 阶段六十六 B：腾讯 mapStyleId 初始化接入验证

### 日期

2026-06-06

### 本次目标

根据用户提供的腾讯 JS API GL 个性化地图示例，在 `/map-3d-guide` 的 `TMap.Map` 初始化参数中显式传入 `mapStyleId`，验证 Web 页面是否需要代码侧指定样式 ID 才能使用控制台发布的个性化地图样式。

### 当前发现

用户提供的示例显示 `TMap.Map` 初始化支持：

```ts
mapStyleId: 'style2'
```

这说明此前控制台 Key 绑定未自动生效，可能是因为 Web JS API GL 需要在 `new TMap.Map(...)` 初始化时显式传入 `mapStyleId`。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 修改内容

- 在 `/map-3d-guide` 中新增 `MAP_3D_GUIDE_STYLE_ID = 'style2'`。
- 初始化 `TMap.Map` 时传入 `mapStyleId: MAP_3D_GUIDE_STYLE_ID`。
- 在页面个性化地图样式诊断区域展示当前尝试使用的 `mapStyleId`。
- 保留既有 `TMap.Map` / `window.TMap` 样式能力探测信息。

### 边界说明

- 本阶段只在 `/map-3d-guide` 接入 `mapStyleId`。
- 未修改普通 `/map`。
- 未修改 `/scenic-3d-map`。
- 未修改 `loadTMap`、Web Key、`.env` 或任何敏感配置。
- 未恢复固定大面积艺术覆盖层。
- 路线、POI、当前位置、重规划线和 GLB 模型仍绑定腾讯地图经纬度 / TMap overlay。

### 对 /map-3d-guide 的影响

`/map-3d-guide` 会在创建腾讯地图实例时尝试使用 `style2`。如果 `style2` 与用户控制台发布样式匹配且当前 Key 有权限，底图应呈现对应个性化样式；如果不匹配或未生效，页面不应崩溃，仍保留轻量宣纸 / 雾化层和地图锚定导览元素。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 和 `/map?debugGltfModel=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map-3d-guide`，人工确认底图是否应用控制台自定义样式。
- 检查 `/map`、`/map?debugGltfModel=1`、`/scenic-3d-map` 正常。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

需要浏览器人工确认 `style2` 是否对应控制台“我的自定义样式1”并实际生效。如果不生效，应回到腾讯控制台核对该样式在 Web JS API GL 中对应的真实 styleId / 序号 / 发布状态 / Key 绑定关系。

### 明确记录

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 routeGeometry / roadNetwork 数据。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有读取、输出或修改 API Key。
- 本阶段没有写入示例代码中的腾讯 Key。

## 阶段六十六 C：腾讯 mapStyleId 改为 style1 验证

### 日期

2026-06-06

### 本次目标

根据用户在腾讯控制台截图中确认的样式信息，将 `/map-3d-guide` 当前尝试使用的腾讯个性化地图样式从 `style2` 调整为 `style1`，用于验证控制台“Style 1 我的自定义样式1”是否能在 Web JS API GL 中生效。

### 当前发现

控制台显示绑定样式为 `Style 1 我的自定义样式1`。上一阶段使用 `mapStyleId: 'style2'` 很可能与控制台样式序号不匹配，因此本阶段改为 `mapStyleId: 'style1'`。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 修改内容

- 将 `MAP_3D_GUIDE_STYLE_ID` 从 `style2` 改为 `style1`。
- 页面个性化地图样式诊断区继续显示当前尝试使用的 `mapStyleId`。
- 保留既有 TMap style API 探测信息。

### 对 /map-3d-guide 的影响

`/map-3d-guide` 创建腾讯地图实例时现在传入 `mapStyleId: 'style1'`。如果 `style1` 与控制台“我的自定义样式1”匹配且当前 Web Key 权限正确，底图应呈现对应个性化样式；如果不生效，页面仍应正常显示腾讯地图和导览覆盖物。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### 验证方式

- 运行 `npm run build`。
- 打开 `/map-3d-guide`，人工确认底图是否应用控制台自定义样式。
- 检查 `/map` 正常。
- 检查 `/scenic-3d-map` 正常。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

需要浏览器人工确认 `style1` 是否实际生效。如果仍不生效，应核对腾讯控制台中样式是否已发布、是否绑定当前 Web Key、样式 ID 是否确实为 Web JS API GL 使用的 `style1`，以及当前页面请求是否使用了该 Key。

### 明确记录

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 routeGeometry / roadNetwork 数据。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有读取、输出或修改 API Key。

## 阶段六十七：腾讯地图 3D 渲染氛围参数实验

### 日期

2026-06-06

### 本次目标

在不恢复固定大面积艺术覆盖层的前提下，尝试使用腾讯地图 JS API GL 的原生 3D 渲染参数增强 `/map-3d-guide` 的导览氛围，让真实腾讯地图底座、地图锚定路线、POI、当前位置、重规划线和 GLB 模型继续保持空间一致。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 为什么使用 renderOptions

上一阶段已经确认固定大莲花、大色块、大斜线等屏幕覆盖层会破坏地图空间一致性，也会遮挡腾讯真实道路、水体、白模、路线和 POI。本阶段改为在 `new TMap.Map(...)` 初始化中传入 `renderOptions`，优先探索腾讯地图原生 3D 渲染能力，而不是用静态大图层盖住地图主体。

### enableBloom

本阶段新增 `MAP_3D_GUIDE_RENDER_OPTIONS`，并启用：

```ts
enableBloom: true
```

页面右侧诊断区显示 `enableBloom：开启，泛光实验中`。该效果用于验证腾讯地图原生泛光是否能增强 3D 氛围，但不应让金色路线、POI 标签和导览信息变糊。

### fogOptions

本阶段未配置 `fogOptions`。本地项目没有腾讯 JS API GL 的字段类型定义，当前只确认文档中存在该方向，但未确认内部字段名和取值结构。为了避免传入未知对象导致运行时异常，本阶段仅保留注释和诊断说明，等待后续按官方字段补充。

### skyOptions

本阶段未配置 `skyOptions`。原因同上：淡青灰 / 米白 / 晨雾感天空是后续方向，但需要确认腾讯 JS API GL 的具体字段结构后再启用。

### 页面诊断区

`/map-3d-guide` 右侧导览牌新增“3D 氛围实验”只读信息：

- `enableBloom` 当前是否开启。
- `fogOptions` 是否配置。
- `skyOptions` 是否配置。
- 明确说明本阶段只实验腾讯地图原生 3D 渲染氛围，不使用固定大图层覆盖地图。

### 对 /map-3d-guide 的影响

`/map-3d-guide` 初始化腾讯地图时会传入 `renderOptions`。历史文化路线、金色主路线、模拟定位、模拟前进、模拟偏航、腾讯 walking 重规划、重规划路线、GLB 模型 Beta 和相机模式保持原有逻辑。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 和 `/map?debugGltfModel=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### 当前限制

`renderOptions.enableBloom` 已接入；`fogOptions` 和 `skyOptions` 的字段仍需以腾讯 JS API GL 实际支持为准。后续如果拿到官方字段示例，再补轻微远景雾化和晨雾天空，避免影响路线、文字和核心 POI 清晰度。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

在浏览器中人工打开 `/map-3d-guide`，观察 `enableBloom` 是否实际影响 3D 视觉。如果效果过强或无效，可在后续阶段加入 debug 开关或关闭；如果腾讯官方字段确认，再小范围启用 `fogOptions` / `skyOptions`。

### 明确记录

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 routeGeometry / roadNetwork 数据。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有读取、输出或修改 API Key。
- 本阶段没有新增任何未确认许可证素材。

## 阶段六十八：/map-3d-guide 产品模式收敛与底图降噪

### 日期

2026-06-06

### 本次目标

将 `/map-3d-guide` 从偏调试页的状态收敛为更像正式产品 demo 的真实 3D 导览页面。保留腾讯地图真实坐标底座和地图锚定路线 / POI / 当前位置 / 重规划线 / GLB 模型，不恢复固定大面积艺术覆盖层。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 右侧信息产品化

右侧“灵山导览牌”默认只保留游客能理解的关键信息：

- 当前路线。
- 当前站点。
- 下一站。
- 距离下一站。
- 当前状态。
- 3D 景点模型 Beta 开关。
- 偏航 / 重规划状态提示。

原本直接暴露的个性化地图样式探测、`renderOptions` 氛围实验等信息移入“开发诊断”区域，默认收起。

### 开发诊断默认折叠

新增默认收起的 `details` 诊断区，包含：

- 个性化地图样式探测。
- 当前 `mapStyleId`。
- `TMap.Map` style 相关方法探测。
- 3D 氛围实验信息。
- `enableBloom / fogOptions / skyOptions` 状态。

这些内容仍可供开发排查，但不再占据正式导览视图的主要阅读区域。

### 底图降噪方式

本阶段没有继续研究 `mapStyleId`，也没有引入固定大面积插画覆盖。底图降噪采用轻量方式：

- 降低腾讯地图底图饱和度。
- 略微提高亮度、降低对比度。
- 增强低透明宣纸 / 晨雾 / 边缘雾化层。

该处理用于弱化普通地名、商业 POI 和道路噪声。当前路线、当前位置、下一站、终点和核心 POI 仍通过 TMap overlay 保持醒目。

### 保留的导览能力

- 历史文化路线固定演示。
- 金色主路线。
- 当前站点 / 下一站 / 终点标识。
- 相机模式。
- 模拟前进。
- 模拟偏航。
- 腾讯 walking route 重规划到下一站。
- 青蓝 / 橙金临时重规划路线。
- GLB 模型 Beta 开关。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 和 `/map?debugGltfModel=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

在浏览器中人工查看 `/map-3d-guide`，确认右侧默认信息是否更像游客导览牌，并观察底图降噪是否足够克制。如果普通底图仍抢眼，后续应优先继续验证腾讯控制台个性化样式，而不是恢复固定大面积艺术覆盖。

### 明确记录

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 routeGeometry / roadNetwork 数据。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有读取、输出或修改 API Key。
- 本阶段没有新增任何未确认许可证素材。

## 阶段六十八 B：补充 mapStyleId 官方说明与诊断折叠

### 日期

2026-06-06

### 本次目标

补充腾讯 JS API GL 个性化地图官方接入说明，不做视觉大改。当前 `/map-3d-guide` 已保留 `mapStyleId: 'style1'`，本阶段只把官方说明和排查建议放入默认折叠的“开发诊断”区域。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 本次说明补充

- 保留 `MAP_3D_GUIDE_STYLE_ID = 'style1'`。
- 保留 `new TMap.Map(...)` 初始化时传入 `mapStyleId: MAP_3D_GUIDE_STYLE_ID`。
- 在开发诊断中补充：官方文档确认 `mapStyleId` 应在 `new TMap.Map(...)` 初始化参数中传入。
- 说明控制台样式已由用户确认绑定 Web Key，但页面是否生效仍需以浏览器实际效果为准。

### Console 排查建议

如果 `style1` 未生效，建议打开浏览器 Console 检查是否出现：

- 样式未绑定。
- 无效 ID。
- 默认样式显示。
- `custom map` 相关提示。
- `mapStyleId` 相关提示。

### 离线资源包边界

本阶段明确记录：腾讯控制台下载的离线样式资源包不适合直接接入 Web JS GL 页面，当前只作为资源和配色参考，不进入 `/map-3d-guide` 运行链路。

### 默认产品 UI

右侧默认产品 UI 不显示 `mapStyleId`、`renderOptions`、style API 探测等开发字段。相关内容继续放在“开发诊断”折叠区，默认收起。

### 不恢复错误方向

本阶段没有恢复固定大莲花、大色块、大斜线等固定屏幕覆盖物。固定层仍只保留低透明宣纸、雾化和滤镜；路线、POI、当前位置、重规划线、GLB 模型继续绑定腾讯地图坐标。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 和 `/map?debugGltfModel=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 明确记录

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 routeGeometry / roadNetwork 数据。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有读取、输出或修改 API Key。
- 本阶段没有新增外部素材。

## 阶段六十六 D：修正 hybrid 底图导致 mapStyleId 不生效的问题

### 日期

2026-06-06

### 本次目标

修正 `/map-3d-guide` 中自定义地图样式验证可能被 hybrid 混合底图干扰的问题。用户在浏览器 Network 中看到 style / tile 请求包含 `styleid=0` 和 `mapType=hybrid`，说明当前实际请求可能落在 hybrid 底图链路，`mapStyleId: 'style1'` 没有生效或被默认样式覆盖。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 问题现象

Network 请求显示：

- `mapType=hybrid`
- `styleid=0`

这不适合作为腾讯个性化地图 `style1` 是否生效的判断基础。自定义样式应优先在普通矢量地图底图上验证，而不是在 hybrid / satellite 底图上验证。

### 修复方式

本阶段在 `/map-3d-guide` 的 `TMap.Map` 初始化参数中显式加入普通矢量底图：

```ts
baseMap: {
  type: 'vector',
  features: ['base', 'building3d', 'label']
}
```

同时保留：

```ts
mapStyleId: 'style1'
```

`features` 保留基础底图、3D 建筑和道路 / 地名标签，不启用普通 POI 点图层，以降低普通商业 POI 对导览主线的干扰。

### 开发诊断补充

“开发诊断”折叠区新增提示：

- 当前底图为普通矢量底图 `vector`。
- 当前需使用普通矢量底图验证 `mapStyleId`。
- hybrid / satellite 底图可能不支持自定义样式。

### 保留能力

- 保留 3D pitch / rotation / zoom。
- 保留 `mapStyleId: 'style1'`。
- 保留金色主路线、POI、模拟定位、模拟偏航、腾讯 walking 重规划路线。
- 保留 GLB 模型 Beta。
- 不恢复固定大莲花、大色块、大斜线等固定屏幕覆盖物。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 和 `/map?debugGltfModel=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `Scenic3DMapPage.tsx` 或 `Scenic3DMapScene.tsx`，`/scenic-3d-map` 不受影响。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 后续验证

需要在浏览器 Network 中重新打开 `/map-3d-guide`，检查 tile / style 请求是否不再包含 `mapType=hybrid`，并观察 `styleid` 是否仍为 `0`。如果仍为 `0`，下一步应继续核对腾讯控制台 styleId、发布状态、Web Key 绑定和域名白名单。

### 明确记录

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 routeGeometry / roadNetwork 数据。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有读取、输出或修改 API Key。

## 阶段六十六 E：简化 baseMap 配置验证 mapStyleId

### 日期

2026-06-06

### 本次目标

继续排查 `/map-3d-guide` 中 `mapStyleId: 'style1'` 未生效的问题。上一阶段已显式传入普通矢量底图，但用户在 Network 中仍看到 `styleid=0` 和 `mapType=hybrid`，说明仍需进一步排除 `baseMap` 配置本身导致 SDK 回退或忽略的可能。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 问题背景

只读检查没有发现 `/map-3d-guide` 中显式设置 `hybrid`、`satellite`、`mapType` 或 `mapTypeId`，也没有发现后续调用 `setBaseMap`。但当前 `baseMap` 使用了：

```ts
{
  type: 'vector',
  features: ['base', 'building3d', 'label']
}
```

其中 `features` 的字段名和取值未在项目内类型定义中得到确认，可能不是腾讯 JS API GL 支持的合法配置，进而导致 `baseMap` 被忽略或回退。

### 修复方式

本阶段将 `/map-3d-guide` 的 `baseMap` 简化为最保守的普通矢量底图配置：

```ts
const MAP_3D_GUIDE_BASE_MAP = {
  type: 'vector'
} as const
```

同时继续保留：

```ts
mapStyleId: 'style1'
```

本阶段不再传 `features: ['base', 'building3d', 'label']`。如果本次验证后底图样式生效，后续再逐步按腾讯官方确认字段恢复 3D building / label 等能力。

### 诊断提示

“开发诊断”折叠区补充：

- 当前已简化 `baseMap` 以验证 `mapStyleId`。
- 如果 Network 仍显示 `styleid=0` 或 `mapType=hybrid`，说明问题可能不在 `baseMap` 配置。
- 如果底图样式生效，再逐步尝试恢复 3D building / label 等能力。

### 对 /map 的影响

本阶段没有修改 `GuideMapPage.tsx`，普通 `/map` 和 `/map?debugGltfModel=1` 不受影响。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map` 相关代码。

### 保持不变

- 保留 `/map-3d-guide` 的历史文化路线、金色主路线、模拟定位、模拟偏航和腾讯 walking 重规划。
- 保留 GLB 模型 Beta。
- 保留相机模式。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不读取、输出或修改 API Key。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步人工验证

打开 `/map-3d-guide`，在浏览器 Network 中过滤 tile / style 请求：

- 检查是否仍出现 `mapType=hybrid`。
- 检查 `styleid` 是否仍为 `0`。
- 观察底图是否变成腾讯控制台自定义样式。

## 阶段六十六 F：回滚 baseMap 简化以恢复路线显示

### 日期

2026-06-06

### 本次目标

恢复 `/map-3d-guide` 的主历史文化路线显示稳定性。阶段六十六 E 将 `baseMap` 简化为 `{ type: 'vector' }` 后，用户在浏览器中发现主历史文化路线不可见。当前 `/map-3d-guide` 的第一优先级是路线、当前位置、下一站、偏航重规划和核心 POI 可见，`mapStyleId` 验证不应优先于导览主功能。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 问题现象

- 阶段六十六 E 简化 `baseMap` 后，主历史文化路线不可见。
- `mapStyleId: 'style1'` 仍未确认成功生效。
- 继续用 `baseMap` 简化排查样式会牺牲正式 demo 的核心可用性。

### 修复方式

本阶段恢复到六十六 E 前路线可见的稳定底图配置：

```ts
const MAP_3D_GUIDE_BASE_MAP = {
  type: 'vector',
  features: ['base', 'building3d', 'label']
} as const
```

同时继续保留：

```ts
mapStyleId: 'style1'
```

但页面诊断中明确：当前 `style1` 未确认生效，不再阻塞正式 demo。后续如继续验证腾讯个性化底图，应在不影响导览主线显示的前提下单独实验。

### 保留能力

- 历史文化路线。
- 金色主路线。
- 当前站点 / 下一站 / 终点 marker。
- 模拟定位。
- 模拟偏航。
- 腾讯 walking route 重规划。
- 重规划路线。
- GLB 模型 Beta。
- 相机模式。

### 后续风格化方向

当前阶段不继续把 `mapStyleId` 作为主风格化方案。后续 `/map-3d-guide` 风格化继续依靠：

- 轻量宣纸 / 雾化 / 滤镜固定氛围层。
- 地图坐标绑定的路线、POI、当前位置、重规划线和 GLB 模型。
- 不恢复固定大莲花、大色块、大斜线等屏幕覆盖物。

### 对 /map 的影响

本阶段没有修改普通 `/map` 或 `/map?debugGltfModel=1`。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### 保持不变

- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不读取、输出或修改 API Key。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

## 阶段六十六 G：确认腾讯个性化地图样式生效

### 日期

2026-06-06

### 本次目标

记录腾讯个性化地图样式最终生效原因，并更新 `/map-3d-guide` 的开发诊断文案。用户已确认 `/map-3d-guide` 中 `mapStyleId: 'style1'` 生效，底图已经变成腾讯控制台自定义样式。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 结论

- 腾讯官方要求 `mapStyleId` 在 `new TMap.Map(...)` 初始化参数中传入。
- `/map-3d-guide` 使用 `mapStyleId: 'style1'` 的写法是正确的。
- 此前不生效的根因不是代码写法，而是腾讯控制台样式绑定类型错误：样式绑定到了“地图 SDK”，不是当前项目使用的 JavaScript API GL / Web key。
- 将样式绑定到 JavaScript API GL 对应 Web key 后，`/map-3d-guide` 的 `mapStyleId: 'style1'` 生效。

### 诊断文案更新

开发诊断区继续默认折叠，并更新为：

- 当前 `mapStyleId: style1`。
- 状态：已生效 / 已绑定 JavaScript API GL key。
- 根因说明：此前样式绑定到了地图 SDK，不是当前 JavaScript API GL key。

默认产品 UI 仍不展示开发字段。

### 风格化方向

这证明 `/map-3d-guide` 的底图风格化主方案应使用腾讯个性化地图样式。固定大面积艺术覆盖层不再作为主方案，后续仍保持：

- 腾讯地图真实坐标底座。
- 轻量宣纸 / 雾化 / 滤镜固定氛围层。
- 地图坐标绑定的路线、POI、当前位置、重规划线和 GLB 模型。
- 不恢复固定大莲花、大色块、大斜线等屏幕覆盖物。

### 对 /map 的影响

本阶段没有修改普通 `/map` 或 `/map?debugGltfModel=1`。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### 保持不变

- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不读取、输出或修改 API Key。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

## 阶段六十九：基于腾讯个性化底图的 /map-3d-guide 视觉精修

### 日期

2026-06-06

### 本次目标

在腾讯个性化地图样式已经生效的基础上，继续打磨 `/map-3d-guide` 的正式产品感。目标不是恢复固定大面积艺术覆盖层，而是在真实腾讯地图底座上强化地图坐标绑定的路线、POI、当前位置、下一站、重规划路线和 GLB 模型。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 视觉优化范围

- 主路线从单一金线细化为多层金色导览丝带：底部阴影、柔和光晕、主金线和内芯线分层。
- 已走过路线增加淡青绿覆盖段，降低已完成路段权重。
- 当前站点到下一站增加更亮的金色引导段，表达“正在前往”。
- 偏航后的临时重规划路线继续保留青蓝 / 青金色，与主路线区分。
- 当前站点、下一站和终点 marker 继续使用 TMap Marker，样式升级为更清晰的编号莲花 / 玉牌表达。
- 固定 UI 卡片改为更轻的宣纸、玉牌、青绿和佛教金色系统，减少普通网页控件感。
- 底部导览控制台强化正式操作台质感，当前路线、当前站点、下一站、距离和状态更清楚。

### 保持地图坐标绑定原则

本阶段没有新增固定大莲花、大色块、大斜线或屏幕贴纸式主视觉。路线、POI、当前位置、重规划线和 GLB 模型仍然全部通过腾讯地图 overlay 或经纬度锚点绑定地图，随地图平移、缩放和旋转变化。

### 保留能力

- `/map-3d-guide` 可打开。
- 历史文化路线固定演示。
- 模拟定位。
- 上一站 / 下一站 / 模拟前进。
- 模拟偏航。
- 点击模拟偏航后仍调用腾讯 walking route 到下一站。
- 重规划路线显示。
- 回到路线。
- GLB 模型 Beta 开关。
- 相机模式。
- `mapStyleId: 'style1'` 保留。

### 对 /map 的影响

本阶段没有修改普通 `/map` 或 `/map?debugGltfModel=1`。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### 保持不变

- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不读取、输出或修改 API Key。
- 不新增外部素材。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

## 阶段六十九 B：路线唤醒水墨园林装饰层

### 日期

2026-06-07

### 本次目标

将 `/map-3d-guide` 从“腾讯地图底图 + 路线 UI”进一步推进为“水墨杭州式的路线唤醒艺术导览地图”。本阶段只覆盖历史文化路线沿线核心区域，不覆盖全园区。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`
- `docs/map-3d-guide-demo-plan.md`
- `docs/map-3d-guide-asset-licenses.md`

### 地图锚定装饰层

新增水墨园林装饰层，使用 `TMap.MultiMarker` 渲染内联 SVG 装饰图形。装饰点全部保存经纬度，随腾讯地图平移、缩放和旋转改变屏幕位置，不使用固定屏幕大贴图。

第一版装饰类型包括：

- 松树 / 树影。
- 柳树。
- 水体墨痕。
- 院落。
- 小桥。
- 山石。
- 云雾。
- 莲花。
- 佛光 / 光点。
- 石阶。

### 路线唤醒机制

每个装饰点带有 `routeIndex`。模拟定位沿历史文化路线前进时，根据当前 `routePathIndex` 逐步提升装饰透明度和尺寸，形成“导览路径唤醒地图”的效果。

未到达区域的装饰保持隐藏或低透明，已到达区域显现。偏航或重规划时，主线装饰会略微降低透明度，临时重规划路线附近会出现青蓝水墨雾气提示。

### debugDecor 调试能力

新增 `/map-3d-guide?debugDecor=1`：

- 可选择任一装饰点。
- 可调整类型、纬度、经度、缩放、旋转、透明度、显现索引和层级。
- 调整结果自动保存到 `localStorage`。
- 下次打开 debug 模式自动恢复。
- 支持复制 TS 配置片段，方便后续整理为 `lingshanMapDecorOverlays.ts`。
- 支持复制调试摘要。

### 素材与许可证

本阶段没有引入外部图片、外部 SVG 或第三方素材包。水墨装饰全部由项目内联 SVG / CSS 生成。

新增 `docs/map-3d-guide-asset-licenses.md`，记录：

- 本阶段素材来源为项目自绘。
- 参考页面只作为视觉方向，不复用其素材。
- 后续外部素材必须记录来源、许可证、商用和署名要求。

### 保持地图坐标绑定原则

本阶段没有恢复固定大莲花、大色块、大斜线或屏幕贴纸式主视觉。路线、POI、当前位置、重规划线、GLB 模型和新增水墨装饰均通过腾讯地图 overlay 或经纬度锚点绑定地图。

### 保留能力

- `/map-3d-guide` 可打开。
- 历史文化路线固定演示。
- 金色主路线。
- 当前站点 / 下一站 / 终点 marker。
- 模拟定位。
- 模拟前进。
- 模拟偏航。
- 点击模拟偏航后仍调用腾讯 walking route 到下一站。
- 重规划路线显示。
- 回到路线。
- GLB 模型 Beta 开关。
- 相机模式。
- `mapStyleId: 'style1'` 保留。

### 对 /map 的影响

本阶段没有修改普通 `/map` 或 `/map?debugGltfModel=1`。

### 对 /scenic-3d-map 的影响

本阶段没有修改 `/scenic-3d-map`。

### 保持不变

- 不修改 routeGeometry / roadNetwork 原始数据。
- 不修改腾讯 walking route 算法。
- 不读取、输出或修改 API Key。
- 不新增未确认许可证素材。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

## 阶段七十二：C 版 3D 园林资产树群重做

### 日期

2026-06-07

### 本次目标

重做 `/map-3d-guide-c` 的 3D 园林资产层，将上一版桥、院墙、香炉、法轮、莲台、石阶等粗糙 fallback 暂时退出默认展示，先做更稳的“树群 / 山林氛围”版本。

### 本次约束

- 只修改 `/map-3d-guide-c` 相关代码和文档。
- 不修改 `/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b`。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 routeGeometry / roadNetwork 原始数据。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token。
- 不执行 push。

### 修改文件

- `src/data/lingshanMap3DGardenAssets.ts`
- `src/pages/Map3DGuidePage.tsx`
- `public/assets/map-3d-guide/glb-garden/trees/ink_pine_cluster_v2.glb`
- `public/assets/map-3d-guide/glb-garden/trees/ink_mixed_grove_v2.glb`
- `public/assets/map-3d-guide/glb-garden/trees/ink_bamboo_grove_v2.glb`
- `public/assets/map-3d-guide/glb-garden/trees/ink_shrub_mass_v2.glb`
- `public/assets/map-3d-guide/glb-garden/trees/ink_forest_edge_v2.glb`
- `docs/map-3d-guide-3d-garden-prototype.md`
- `docs/map-3d-guide-asset-licenses.md`
- `docs/map-3d-development-log.md`

### 资产搜索结论

联网调研确认以下方向可作为后续正式树群资产候选：

- Kenney Nature Kit：CC0，含树、山石、灌木等 3D nature assets。
- Eclair Assets 的 Kenney Nature Kit GLB convenience pack：基于 Kenney CC0 Nature Kit，提供 GLB 包装，适合后续快速试接。
- Quaternius / Poly Pizza Stylized Nature MegaKit：Public Domain / CC0，含树、松、草、灌木和石块。
- Quaternius 官方 Stylized Nature MegaKit：页面说明 CC0，可用于个人、教育和商业项目。

本阶段没有直接下载外部 GLB，因为仍需要逐项挑选、检查大小、确认风格和压缩策略。为避免把不稳定素材直接放入 demo，当前采用项目自制树群 fallback GLB。

### 许可证审核结论

本阶段实际新增的 5 个树群 GLB 均为项目自制低模 fallback，许可证记为项目自有，可商用，无需署名。

后续外部资产只允许：

- CC0 / Public Domain。
- MIT / Apache-2.0。
- 明确允许商用和改编的 CC BY。

继续拒绝：

- NC / ND / SA。
- Personal use only。
- 许可证不明。
- 权利链不清的 AI 生成资产。
- 过大、过卡、过卡通、过现代或过西式的模型。

### 俯拍布局原则

根据用户提供的灵山胜境俯拍结构，本阶段不再沿路线均匀撒点，而是按真实空间关系布置树群：

- 南门到大佛中轴两侧形成林带。
- 胜境广场、九龙灌浴、佛前广场等开阔空间保留留白。
- 灵山大佛周边和背后形成高密度山林背景。
- 祥符禅寺、梵宫、五印坛城只在建筑边缘和水岸边缘布置适量树群。
- 道路中心、路线主线、建筑主体、当前站点、下一站和重规划线不被树遮挡。

### 性能审核结论

新增 5 个树群 GLB 总体积约 189KB，采用少量模型多实例复用：

- 松群。
- 混合树群。
- 竹林。
- 灌木团。
- 林缘。

`src/data/lingshanMap3DGardenAssets.ts` 当前配置 19 个实例。普通模式仍按路线进度逐步显现；`debugGarden=1` 才显示全部，避免首屏一次性堆满模型。

### 禁用的旧资产

以下第一版非树资产不再进入 C 版默认配置：

- 桥。
- 院墙。
- 香炉。
- 法轮。
- 莲台。
- 石阶。
- 粗糙山石作为主视觉。

文件可以暂留仓库作为历史 fallback，但不再被 `/map-3d-guide-c` 的默认资产数据引用。

### debugGarden 更新

`/map-3d-guide-c?debugGarden=1` 保持可用：

- 调整 lat / lng。
- 调整 scale。
- 调整 height。
- 调整 yaw。
- 设置 visible。
- 设置 priority。
- 设置 routeFraction。
- 复制 TS 配置片段。

localStorage key 升级为 `lingshan-map-3d-guide-garden-assets-v2`，避免用户浏览器继续恢复上一版桥、院墙、香炉等旧配置。

### 对 /map-3d-guide-c 的影响

C 版现在更偏“树群 / 山林氛围”而不是“符号模型集合”。模型仍绑定腾讯地图经纬度，跟随地图缩放、旋转和平移。

### 对其它页面的影响

本阶段不修改：

- `/map-3d-guide`
- `/map-3d-guide-a`
- `/map-3d-guide-b`
- `/map`
- `/map?debugGltfModel=1`
- `/scenic-3d-map`

### 保持能力

- `mapStyleId: 'style1'` 保留。
- 历史文化路线保留。
- 模拟前进保留。
- 模拟偏航保留。
- 腾讯 walking route 重规划保留。
- 重规划路线保留。
- GLB 模型 Beta 保留。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

1. 从 Kenney / Quaternius CC0 资源中挑选 2-3 个正式树模型进行替换验证。
2. 用浏览器截图和俯拍图逐点校准树群经纬度。
3. 后续只在位置、比例、文化语境都确认后，再恢复桥、院墙、香炉、法轮、莲台等非树类资产。

## 阶段七十四：接入 Kenney CC0 开源自然资产替换 C 版 fallback 树群

### 日期

2026-06-07

### 本次目标

将 `/map-3d-guide-c` 从项目自制 fallback 树群升级为真正可商用的开源低模自然资产，让 C 版更接近沉稳 3D 园林沙盘，而不是 debug 占位模型。

### 本次约束

- 只修改 `/map-3d-guide-c` 相关资产、配置和文档。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 行为。
- 不修改 `routeGeometry` / `roadNetwork` 原始数据。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token。
- 不恢复桥、院墙、香炉、法轮、莲台、亭子、寺庙屋顶等复杂非树资产。

### 修改文件

- `src/data/lingshanMap3DGardenAssets.ts`
- `src/pages/Map3DGuidePage.tsx`
- `public/assets/map-3d-guide/glb-garden/vendor/KENNEY_NATURE_KIT_LICENSE.txt`
- `public/assets/map-3d-guide/glb-garden/vendor/kenney_tree_pine_tall_a.glb`
- `public/assets/map-3d-guide/glb-garden/vendor/kenney_tree_pine_round_c.glb`
- `public/assets/map-3d-guide/glb-garden/vendor/kenney_tree_default_dark.glb`
- `public/assets/map-3d-guide/glb-garden/vendor/kenney_bush_detailed.glb`
- `public/assets/map-3d-guide/glb-garden/vendor/kenney_bush_large.glb`
- `public/assets/map-3d-guide/glb-garden/vendor/kenney_rock_large_c.glb`
- `public/assets/map-3d-guide/glb-garden/vendor/kenney_rock_tall_h.glb`
- `docs/map-3d-guide-asset-licenses.md`
- `docs/map-3d-guide-3d-garden-prototype.md`
- `docs/map-3d-development-log.md`

### 资产来源

本阶段接入 Kenney 官方 `Nature Kit`，来源为 `https://kenney.nl/assets/nature-kit`。页面和包内 `License.txt` 均标注 Creative Commons Zero / CC0，可用于个人、教育和商业项目，署名 Kenney 非强制。

调研中 Quaternius / Stylized Nature MegaKit 仍是后续优先候选，官方页面标注 CC0，并提供 glTF 格式。但本阶段没有稳定取得可自动下载、可逐项检查并落地的 Quaternius GLB 包，因此没有强行接入，避免把未验证文件放进项目。

### 新资产说明

本阶段从 Kenney Nature Kit 中抽取少量已存在的 GLB：

- `kenney_tree_pine_tall_a.glb`：松树。
- `kenney_tree_pine_round_c.glb`：针叶树 / 林缘。
- `kenney_tree_default_dark.glb`：深色阔叶树。
- `kenney_bush_detailed.glb`：灌木。
- `kenney_bush_large.glb`：大灌木，当前作为候选文件保留。
- `kenney_rock_large_c.glb`：低矮山石。
- `kenney_rock_tall_h.glb`：竖向山石。

单个文件均远小于 300KB。没有提交原始下载 ZIP，原始包仅保留在 `tmp/map-3d-guide-assets/vendor-source/` 供本地核验。

### C 版配置调整

`src/data/lingshanMap3DGardenAssets.ts` 中的 `assetUrl` 已从项目自制 `glb-garden/trees/ink_*.glb` 切换到 `glb-garden/vendor/kenney_*.glb`。

保留的布局思想：

- 南门到大佛中轴两侧林带。
- 大佛周边和背后树群。
- 祥符禅寺、梵宫、五印坛城边缘树群。
- 广场和主路线留白。

本阶段将少量旧灌木点替换为山石点，用于增加自然边界，但仍禁用桥、院墙、香炉、法轮、莲台、亭台等复杂非树资产。

### debugGarden 更新

`/map-3d-guide-c?debugGarden=1` 保持可用：

- 可以继续调整位置、scale、height、yaw、显现进度、visible 和 priority。
- 支持复制 TS 配置和调试摘要。
- localStorage key 升级为 `lingshan-map-3d-guide-garden-assets-v3-vendor-nature`，避免浏览器继续恢复旧 fallback 树群配置。
- 面板提示如果仍看到旧 fallback 树群，可点击“恢复默认”切回 vendor 树群配置。

### 对 /map-3d-guide-c 的影响

C 版继续以腾讯地图真实坐标为底座，所有自然 GLB 仍通过 `TMap.model.GLTFModel` 绑定经纬度，跟随地图缩放、旋转和平移。

### 对其它页面的影响

本阶段不修改：

- `/map`
- `/map?debugGltfModel=1`
- `/map-3d-guide`
- `/map-3d-guide-a`
- `/map-3d-guide-b`
- `/scenic-3d-map`

### 保持能力

- 历史文化路线保留。
- 当前站点 / 下一站保留。
- 模拟定位保留。
- 模拟偏航保留。
- 腾讯 walking route 重规划保留。
- 重规划路线保留。
- GLB 模型 Beta 保留。
- `mapStyleId: 'style1'` 保留。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

1. 用浏览器实际观察 Kenney GLB 在腾讯地图倾斜视角下的比例和朝向。
2. 用 `debugGarden=1` 微调个别点的 scale / height / yaw。
3. 如果仍需更东方、更沉稳的树种，可继续下载并核验 Quaternius CC0 glTF 包。
4. 只有在位置、比例和文化语境明确后，再恢复桥、院墙、香炉、法轮、莲台等复杂非树资产。

## 阶段七十五：C 版树群密度、种类与显现逻辑增强

### 日期

2026-06-07

### 本次目标

解决 `/map-3d-guide-c` 中树群数量太少、种类不明显、未到区域隐藏过强的问题，让 C 版更接近灵山胜境俯拍图中的“山林包围、中轴林带、节点绿化”空间关系。

### 本次约束

- 只修改 `/map-3d-guide-c` 相关配置和文档。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 行为。
- 不修改 `routeGeometry` / `roadNetwork`。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token。

### 修改文件

- `src/data/lingshanMap3DGardenAssets.ts`
- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-guide-3d-garden-prototype.md`
- `docs/map-3d-development-log.md`

### 树群实例数量

C 版默认 3D 园林实例从 19 个增加到 67 个。

### 使用的 Kenney 资产类型

仍使用阶段七十四接入的 Kenney Nature Kit CC0 GLB，覆盖：

- `pine_cluster`：松树。
- `bamboo_grove`：针叶树。
- `mixed_grove`：深色阔叶树。
- `forest_edge`：林缘 / 山林边界。
- `shrub_mass`：灌木 / 低树。
- `rock_cluster`：低矮山石。
- `stone_mass`：竖向山石。

每类资产均有多个实例，通过 `scale`、`height`、`yaw` 和位置微调做变化，避免视觉上只有一种树。

### 参考俯拍图的布局调整

本阶段按灵山胜境俯拍结构调整布局：

- 南门到大佛中轴两侧形成连续林带。
- 大佛背后和两侧增加最高密度山林背景。
- 祥符禅寺、梵宫、五印坛城边缘布置中密度树群。
- 水体和广场边缘使用灌木、低树和少量山石。
- 胜境广场、佛手广场、九龙灌浴水景、建筑主体和主路线保持留白。

### 显现逻辑调整

旧逻辑按 `routeFraction <= progress` 过滤资产，导致未到区域几乎不可见。新逻辑改为：

- 所有 `visible=true` 的树群默认始终创建。
- 未到区域低透明、略小 scale，作为整体山林氛围。
- 当前进度附近提高透明度并略微放大，形成路线唤醒效果。
- 已经过区域保持可见，不突然消失。
- 偏航 / 重规划时只轻微降低低优先级树群，不隐藏主林带。

如果腾讯 `GLTFModel` 支持 `setOpacity`，会应用计算后的透明度；如果不支持，则至少通过 scale 和常显策略保证总览中树群连续可见。

### debugGarden

`/map-3d-guide-c?debugGarden=1` 保持可用：

- 支持位置、scale、height、yaw、opacity、routeFraction、visible、priority 调整。
- localStorage key 升级为 `lingshan-map-3d-guide-garden-assets-v4-dense-grove`，避免旧 19 点配置覆盖新默认配置。
- “恢复默认”会回到高密度 Kenney 树群配置。
- 复制 TS 配置和调试摘要仍可用。

### 保持能力

- `mapStyleId: 'style1'` 保留。
- 历史文化路线保留。
- 模拟前进保留。
- 模拟偏航保留。
- 腾讯 walking route 重规划保留。
- 重规划路线保留。
- GLB 模型 Beta 保留。

### 对其它页面的影响

本阶段不修改普通 `/map`、`/map?debugGltfModel=1`、`/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 和 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

1. 用浏览器实际检查 67 个模型在腾讯地图倾斜视角下的性能和遮挡。
2. 如有性能压力，按距离或 progress 分组做加载节流。
3. 用 `debugGarden=1` 微调大佛背后、梵宫和水岸附近的树群高度与比例。

## 阶段七十六：航拍参考 vegetation zones 重做 C 版树群

### 日期

2026-06-07

### 本次目标

继续重做 `/map-3d-guide-c` 的树群布局与材质。上一版虽然从 19 个点增加到 67 个点，但仍偏“路线撒点”，总览下不形成山林面，且树木偏黑。目标是参考用户提供的腾讯卫星俯视图，将 C 版改为区域化林带布局。

### 本次约束

- 只修改 `/map-3d-guide-c` 相关配置、资产和文档。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 行为。
- 不修改 `routeGeometry` / `roadNetwork`。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token。
- 不恢复桥、院墙、香炉、法轮、莲台、亭子、寺庙屋顶等复杂非树资产。

### 修改文件

- `src/data/lingshanMap3DGardenAssets.ts`
- `src/pages/Map3DGuidePage.tsx`
- `public/assets/map-3d-guide/glb-garden/vendor/*_sage.glb`
- `docs/map-3d-guide-asset-licenses.md`
- `docs/map-3d-guide-3d-garden-prototype.md`
- `docs/map-3d-development-log.md`

### 为什么从路线撒点改成 vegetation zones

路线撒点适合验证 GLTFModel 和 debugGarden，但不适合形成真实航拍里的山林空间。灵山胜境的视觉结构更像：

- 大佛背后是连续山体林面。
- 中轴路线两侧是线性林带。
- 核心广场和水景保持开阔。
- 建筑边缘和水体边缘有中低密度绿化。

因此本阶段在 `lingshanMap3DGardenAssets.ts` 中新增 deterministic vegetation zones，用椭圆区域生成树群，而不是手工沿 routeFraction 撒点。

### vegetation zones

当前定义 15 个区域：

- 大佛背后北侧山体。
- 大佛西侧山坡。
- 大佛东侧山坡。
- 佛前广场边缘低树。
- 中轴西侧连续林带。
- 中轴东侧连续林带。
- 九龙灌浴西侧林地。
- 九龙灌浴东侧边缘绿化。
- 胜境广场西侧林带。
- 胜境广场东侧林带。
- 祥符禅寺边缘林带。
- 梵宫边缘庭林。
- 五印坛城水岸林缘。
- 南门外侧低密缓冲。
- 出口边缘收束林带。

每个 zone 定义中心、半径、旋转、数量、资产池、scale / height / opacity 范围和 routeFraction 范围。生成使用固定 hash 与黄金角采样，不使用 `Math.random()`，刷新不会改变布局。

### keepout 留白规则

新增 8 个 keepout circle，并叠加主路线 corridor：

- 南门中轴入口。
- 胜境广场中心。
- 九龙灌浴水景核心。
- 佛前广场和大佛 marker 周边。
- 祥符禅寺建筑主体。
- 梵宫主体。
- 五印坛城主体。
- 南侧停车场主区域。

这些规则避免树群压住主路线、当前位置、站点 marker、核心广场、建筑主体和停车场主区域。

### 树群数量

C 版默认 3D 园林实例从 67 个增加到 187 个。

类型分布：

- 松树 `pine_cluster`：35。
- 针叶树 `bamboo_grove`：30。
- 阔叶树 `mixed_grove`：42。
- 林缘 `forest_edge`：34。
- 灌木 `shrub_mass`：31。
- 低矮山石 `rock_cluster`：10。
- 竖向山石 `stone_mass`：5。

### 材质和色调处理

本阶段复制 Kenney Nature Kit GLB 并生成 `_sage.glb` 派生版本，仅修改 GLB JSON 材质：

- 叶子 / 草：深青绿、灰绿、墨绿。
- 树干：低饱和灰褐色。
- 山石 / 土色：灰米色、青灰色。

默认 C 版 assetUrl 已切换到这些 `_sage.glb`，目标是减少黑色占位感和过亮卡通感。

### 显现逻辑

继续保留“整体常显 + 当前唤醒”：

- 所有 `visible=true` 树群始终创建。
- 未到区域低透明、略小 scale。
- 当前进度附近提高透明度并略微放大。
- 已经过区域保持可见。
- 偏航 / 重规划时只轻微降低低优先级树群，不隐藏主林带。

如果腾讯 `GLTFModel` 支持 `opacity` 或 `setOpacity`，会应用透明度；不支持时仍能通过区域密度和 scale 表现山林结构。

### debugGarden

`/map-3d-guide-c?debugGarden=1` 继续可用：

- 支持 lat/lng、scale、height、yaw、opacity、visible、priority、routeFraction 调整。
- localStorage key 升级为 `lingshan-map-3d-guide-garden-assets-v5-aerial-zones`，避免旧点状配置覆盖新布局。
- “恢复默认”会回到航拍参考树群布局。
- 复制 TS 配置仍可用。

### 保持能力

- `mapStyleId: 'style1'` 保留。
- 历史文化路线保留。
- 相机模式保留。
- 模拟前进保留。
- 模拟偏航保留。
- 腾讯 walking route 重规划保留。
- 重规划路线保留。
- GLB 模型 Beta 保留。

### 对其它页面的影响

本阶段不修改普通 `/map`、`/map?debugGltfModel=1`、`/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 和 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

1. 浏览器实测 187 个 GLTFModel 在目标机器上的性能。
2. 如果帧率下降，按 camera distance 或 route progress 做 zone 级加载。
3. 用 `debugGarden=1` 继续校准大佛背后、中轴林带、梵宫和坛城边缘的高度与密度。
4. 后续仍只在树群足够稳定后，再考虑恢复桥、院墙、香炉、法轮、莲台等复杂资产。

## 阶段七十六：C 版树群人工校准与配置固化

日期：2026-06-07

### 本次目标

继续推进 `/map-3d-guide-c` 作为 3D 园林沙盘主线，对上一阶段的 vegetation zones 做人工校准和调试工具增强。目标是让树群更贴近用户提供的航拍结构：大佛背后形成山林面，中轴两侧形成连续林带，建筑边缘有绿化，广场、路线和建筑主体保持留白。

### 本次约束

- 只修改 `/map-3d-guide-c` 相关代码、树群配置和文档。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 行为。
- 不修改 `routeGeometry` / `roadNetwork` 原始数据。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token。
- 不恢复桥、院墙、香炉、法轮、莲台等复杂非树资产。

### 修改文件

- `src/data/lingshanMap3DGardenAssets.ts`
- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-guide-3d-garden-prototype.md`
- `docs/map-3d-development-log.md`

### C 版成为主线

用户确认 C 版方向明显变好，因此本阶段继续在 C 版上做校准。A / B 贴片原型暂不继续作为主线，仍保留可打开和回归验证，但不再投入新的视觉配置。

### 默认树群配置调整

默认配置仍采用 deterministic vegetation zones，不依赖浏览器 localStorage。主要调整：

- 大佛背后北侧山体实例从 25 增加到 31，并提高 scale / height，强化山林背景面。
- 大佛西侧、东侧山坡分别增加到 16，补齐大佛两翼密林。
- 中轴西侧林带增加到 20，中轴东侧林带增加到 17，让主轴两侧更连续。
- 祥符禅寺、梵宫、五印坛城边缘小幅加密，仍通过 keepout 避开建筑主体。
- 南门和出口缓冲区减少到 4 + 4，避免停车场、入口道路和出口区域过密。

树群实例数量从 187 个固化为 199 个。

### 留白规则调整

本阶段扩大 keepout，并将主路线 corridor 从 23m 加宽到 29m：

- 胜境广场中心留白更大。
- 九龙灌浴水景核心留白更大。
- 佛前广场和大佛 marker 周边留白更大。
- 祥符禅寺、梵宫、五印坛城建筑主体留白更大。
- 南门、停车场、主路线、站点 marker 周边继续避免树群压住导览主体。

### debugGarden 增强能力

`/map-3d-guide-c?debugGarden=1` 新增：

- 按 zone 筛选。
- 按 kind 筛选。
- 按 priority 筛选。
- 按 visible 筛选。
- 选中当前筛选首项。
- 批量显示 / 隐藏当前筛选资产。
- 批量缩放当前筛选资产。
- 批量调整 height。
- 批量调整 opacity。
- 批量微调 lat / lng 偏移。
- 保留单点 lat / lng、scale、height、yaw、opacity、visible、priority、routeFraction 调参。
- 保留复制 TS 配置片段和复制调试摘要。

localStorage key 升级为 `lingshan-map-3d-guide-garden-assets-v6-calibrated-aerial-zones`，避免旧配置污染新的 199 点默认布局。调试面板仍保留“恢复默认”，可回到当前航拍参考树群布局。

### 配置固化

本阶段没有把正确布局放在浏览器 localStorage 中，而是固化在 `src/data/lingshanMap3DGardenAssets.ts` 的 zone 参数里。默认打开 `/map-3d-guide-c` 即可得到稳定可复现的 199 个实例。

### 保持能力

- `mapStyleId: 'style1'` 保留。
- 历史文化路线保留。
- 相机模式保留。
- 模拟前进保留。
- 模拟偏航保留。
- 腾讯 walking route 重规划保留。
- 重规划路线保留。
- GLB 模型 Beta 保留。

### 对其它页面的影响

本阶段不修改普通 `/map`、`/map?debugGltfModel=1`、`/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 和 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

1. 在浏览器中用 `debugGarden=1` 做小范围人工点位校准。
2. 如果某些树仍遮挡路线或站点，可先用 zone 筛选批量微移，再复制 TS 配置固化。
3. 后续如需继续增强，可按 zone 做距离相机的加载策略，降低 199 个 GLTFModel 的运行压力。

## 阶段七十七：C 版林带连续性与林地底色增强

日期：2026-06-08

### 本次目标

继续优化 `/map-3d-guide-c` 的树群效果。上一阶段的密度和色调方向已经正确，但总览下仍容易看到一棵棵独立树，缺少真实航拍中的连续山林面。本阶段不改变 C 版方向，而是用地图坐标锚定的林地 patch 连接树群，增强大佛背后、中轴两侧和建筑边缘的林带连续性。

### 本次约束

- 只修改 `/map-3d-guide-c` 相关代码、树群配置和文档。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 行为。
- 不修改 `routeGeometry` / `roadNetwork`。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token。
- 不恢复固定屏幕大贴图。

### 修改文件

- `src/data/lingshanMap3DGardenAssets.ts`
- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-guide-3d-garden-prototype.md`
- `docs/map-3d-development-log.md`

### 林地 patch

新增 `lingshanMap3DForestPatches`，当前 9 个：

- 大佛背后山林底色。
- 大佛西侧山坡底色。
- 大佛东侧山坡底色。
- 中轴西侧林带底色。
- 中轴东侧林带底色。
- 九龙西侧林地底色。
- 祥符禅寺边缘底色。
- 梵宫边缘庭林底色。
- 五印坛城水岸底色。

这些 patch 不是固定 CSS 或固定屏幕覆盖层。运行时优先使用 `TMap.MultiPolygon` 以经纬度椭圆面渲染，随腾讯地图平移、缩放、旋转。如果运行时没有 `MultiPolygon` / `PolygonStyle`，则降级到经纬度锚定的 `MultiMarker` SVG patch。

### 林带连续性

树群总量保持 199 个，不继续无限增加 GLTFModel 数量。连续性主要由 patch 承担：

- 大佛背后 patch 最明显，连接最高密度山林。
- 中轴两侧 patch 中等透明，形成连续林带底色。
- 祥符禅寺、梵宫、五印坛城边缘 patch 更淡，只作为绿化衔接。
- 九龙西侧 patch 用于连接水景边缘林地。

### 留白与可读性

- patch 透明度克制，避免遮挡腾讯底图结构。
- 主金线、当前位置、下一站、终点、重规划路线继续保持最高可读层。
- 广场中心、主路线 corridor、建筑主体仍由 keepout 和低透明 patch 控制。
- 偏航 / 重规划时非核心 patch 会略降透明，避免抢临时重规划线。

### debugGarden

`/map-3d-guide-c?debugGarden=1` 增强：

- 显示林地 patch 数量。
- 显示 patch 是否使用 marker fallback。
- 支持一键显示 / 隐藏林地 patch。
- 复制 TS 配置时同时输出树群资产和 forest patch 配置。

localStorage key 升级为 `lingshan-map-3d-guide-garden-assets-v7-forest-patches`，避免旧配置覆盖本阶段 patch 诊断和默认效果。

### 保持能力

- `mapStyleId: 'style1'` 保留。
- 历史文化路线保留。
- 当前站点 / 下一站保留。
- 模拟前进保留。
- 模拟偏航保留。
- 腾讯 walking route 重规划保留。
- 重规划路线保留。
- GLB 模型 Beta 保留。

### 对其它页面的影响

本阶段不修改普通 `/map`、`/map?debugGltfModel=1`、`/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 和 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

1. 在浏览器中确认 `MultiPolygon` 是否可用；如果 fallback 为 marker 但视觉足够稳定，可继续保留。
2. 人工检查 patch 是否压住路线局部，如有需要可在 patch 配置中微调半径和透明度。
3. 继续把 C 版作为主线，后续再考虑 zone 级懒加载或更细的材质优化。

## 阶段七十七 B：C 版图形化园林编辑器

日期：2026-06-08

### 本次目标

在 `/map-3d-guide-c?debugGarden=1` 中增加第一版图形化园林资产编辑器，用于后续人工绘制林地 zone、留白 keepout、生成半透明预览点，并一键应用为地图坐标锚定的 GLB 树群资产。目标是减少纯数字输入校准成本，让 C 版从“代码调参”进入“浏览器可视化校准”。

### 本次约束

- 只修改 `/map-3d-guide-c` 相关代码、树群配置导出能力和文档。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 行为。
- 不修改 `routeGeometry` / `roadNetwork`。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `src/data/lingshanMap3DGardenAssets.ts`
- `docs/map-3d-guide-3d-garden-prototype.md`
- `docs/map-3d-development-log.md`

### 图形化编辑器能力

`debugGarden` 面板升级为可拖拽浮动窗口，新增：

- `inspect` / `drawVegetation` / `drawKeepout` / `addAsset` 四种编辑模式。
- 点击地图添加 vegetation zone 顶点。
- 点击地图添加 keepout zone 顶点。
- 顶点以腾讯地图 Marker 显示，可拖拽校准。
- vegetation / keepout 多边形优先用 `TMap.MultiPolygon` 显示，保持地图经纬度锚定。
- 可编辑 zone 的 `density`、`assetPool`、`assetRatios`、`minScale`、`maxScale`、`height`、`opacity`、`priority`、`visible`。
- 可编辑 keepout 的 `reason` 与 `visible`。
- 可添加单个 GLB 资产点。

### 预览与应用

- “生成预览点”会根据 vegetation zone、keepout zone、主路线留白距离，生成半透明预览 Marker。
- “应用为 GLB 树群”会把当前预览点转换为 `TMap.model.GLTFModel` 树群实例。
- 生成结果不写源码文件，而是先进入浏览器运行态和 localStorage。
- “保存到本地”会显式写入编辑器状态和当前 GLB 树群到 localStorage。
- “复制 assets”可单独复制生成后的 `lingshanMap3DGardenAssets` TS 片段。
- “导出完整配置”会复制 vegetation zones、keepouts 和生成后的 `lingshanMap3DGardenAssets` TS 片段，供后续固化。

### localStorage

新增编辑器专用 localStorage key：

`lingshan-map-3d-guide-garden-editor-v1`

它只保存图形化编辑器的 zone / keepout / preview 状态，不覆盖 C 版默认固化树群。普通 `/map-3d-guide-c` 不依赖 localStorage 才能显示稳定树群。

### 默认产品态调整

为避免普通 C 页面出现不自然的大面积林地 patch，本阶段将 forest patch 默认限制在 `debugGarden` 模式下显示。普通 `/map-3d-guide-c` 继续以 GLB 树群、路线、POI 和轻量氛围为主；patch 作为调试与校准辅助。

### 保持能力

- `mapStyleId: 'style1'` 保留。
- 历史文化路线保留。
- 当前站点 / 下一站保留。
- 模拟前进保留。
- 模拟偏航保留。
- 腾讯 walking route 重规划保留。
- 重规划路线保留。
- GLB 模型 Beta 保留。

### 对其它页面的影响

本阶段不修改普通 `/map`、`/map?debugGltfModel=1`、`/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 和 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

1. 用浏览器在 `debugGarden=1` 下人工绘制 1 个小范围 zone 和 keepout，检查拖拽顶点和预览点生成。
2. 将导出的 TS 配置整理成下一版默认 `lingshanMap3DGardenAssets.ts` 数据。
3. 后续可加入“撤销一步”和“删除选中顶点 / 删除选中 zone”能力。

## 阶段七十八 B：图形化园林编辑器可用性优化

日期：2026-06-08

### 本次目标

优化 `/map-3d-guide-c?debugGarden=1` 图形化园林编辑器的日常使用体验，解决本地草稿残留、zone / keepout 底色过重和操作说明不够清楚的问题。目标是让用户可以不用 DevTools，直接在页面中清空旧草稿、恢复默认航拍参考布局，并按说明完成“画禁放区 -> 画放树区 -> 生成预览 -> 应用 GLB -> 导出配置”的流程。

### 本次约束

- 只修改 `/map-3d-guide-c` 相关代码和文档。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 行为。
- 不修改 `routeGeometry` / `roadNetwork`。
- 不修改腾讯 walking route 算法。
- 不读取、不修改 `.env`、API Key、token。

### 修改文件

- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-guide-garden-editor-usage.md`
- `docs/map-3d-guide-3d-garden-prototype.md`
- `docs/map-3d-development-log.md`

### 区域显示修正

vegetation zone 和 keepout zone 默认不再使用明显的大面积填充色：

- vegetation zone 改为青绿色边框为主。
- keepout zone 改为红棕色边框为主，并尝试使用虚线边框。
- 非选中区域只保留近似透明的极低填充，避免覆盖地图细节。
- 选中区域保留约 0.08 的弱填充，用于提示当前编辑对象。

普通 `/map-3d-guide-c` 不显示编辑区域；`debugGarden` 中也尽量避免色块压住路线、POI、当前位置和树群。

### 草稿管理

debugGarden 面板新增本地草稿状态提示：

- `正在使用 localStorage 草稿`
- `当前为默认航拍参考布局`

新增“清空本地草稿”，并强化“重置为默认航拍参考布局”。两者都会清理 debugGarden 相关 localStorage，包括旧版 garden editor / garden assets key，并恢复源码内置默认配置。用户不需要手动打开浏览器 DevTools 删除 localStorage。

### 使用说明

新增 `docs/map-3d-guide-garden-editor-usage.md`，记录：

- 打开方式。
- 编辑器用途。
- 推荐先画 keepout、再画 vegetation。
- 如何生成预览点。
- 如何应用为 GLB 树群。
- 如何添加单个资产。
- 如何保存、清空草稿、重置默认。
- 如何导出完整 TS 配置。
- 注意事项：主路线和广场留白、建筑主体留白、大佛背后高密、中轴两侧林带。

面板内新增“使用说明 / 帮助”折叠区，提供简明操作流程并指向该文档。

### 保持能力

- 多边形 vegetation zone 绘制保留。
- 多边形 keepout zone 绘制保留。
- 顶点拖拽保留。
- 预览点生成保留。
- 应用 GLB 保留。
- 单个资产添加保留。
- localStorage 保存 / 恢复保留。
- 导出配置保留。
- 模拟偏航和腾讯 walking route 重规划保留。
- `mapStyleId: 'style1'` 保留。

### 对其它页面的影响

本阶段不修改普通 `/map`、`/map?debugGltfModel=1`、`/map-3d-guide`、`/map-3d-guide-a`、`/map-3d-guide-b` 和 `/scenic-3d-map`。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍为体积提示，不阻断构建。

### 下一步建议

1. 用户在 `debugGarden=1` 中完成大佛背后、中轴两侧、建筑边缘和水边的人工 zone / keepout 校准。
2. 将“导出完整配置”结果交给 Codex，整理固化到 `src/data/lingshanMap3DGardenAssets.ts`。
3. 后续可继续补“删除选中 zone / 删除选中顶点 / 撤销一步”等编辑器能力。

## 阶段七十九 A：map-3d-guide-c 运行时加载诊断框架

日期：2026-06-10

### 本次目标

在上传新的核心景点 GLB 前，为 `/map-3d-guide-c` 增加仅由 `debugPerf=1` 开启的运行时诊断能力，用于观察腾讯地图初始化、路线 / POI overlay 创建、GLB 园林资产批次加载、失败记录和重复 URL 情况。普通游客页面默认不显示诊断面板，也不改变当前视觉风格。

### 本次约束

- 不修改 Tencent Key。
- 不修改 `mapStyleId: 'style1'`。
- 不修改路线逻辑、POI 数据、树群生成算法或默认 assets 数据。
- 不上传、不替换新的核心景点 GLB。
- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不读取、不修改 `.env`、API Key、token。

### 修改文件

- `src/lib/map3dPerf.ts`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `src/hooks/useGardenAssetOverlays.ts`
- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-development-log.md`

### 诊断字段

新增 `map3dPerf` 轻量 recorder，记录：

- `mapInitMs`
- `routeDrawMs`
- `poiInitMs`
- `gardenTotal`
- `gardenLoaded`
- `gardenFailed`
- `gardenFirstBatchMs`
- `gardenAllDoneMs`
- GLB batch 数量和耗时
- 最慢 10 个 GLB asset
- failed asset 列表
- 重复 `assetUrl` 列表

GLB 统计接入 `useGardenAssetOverlays` 的分批创建流程。当前统计的是 `TMap.model.GLTFModel` overlay 创建耗时，不等同于浏览器网络层完整下载耗时；该限制已在代码注释中说明。

### debugPerf 面板

`/map-3d-guide-c?debugPerf=1` 显示轻量悬浮诊断面板：

- 默认显示摘要。
- 展开后显示最慢 GLB、重复 URL、批次和失败列表。
- 支持复制诊断 JSON。
- 支持清空当前诊断记录。

`/map-3d-guide-c?debugGarden=1&debugPerf=1` 可同时显示 debugGarden 工作台和性能诊断面板；两者位置分离，避免互相遮挡。

### 对普通页面的影响

普通 `/map-3d-guide-c` 不显示诊断面板。`debugPerf` 关闭时 recorder 方法为 no-op，避免引入重型依赖或额外 UI。

### 保持能力

- 历史文化路线保留。
- 当前站点 / 下一站保留。
- 模拟前进保留。
- 模拟偏航保留。
- 腾讯 walking route 重规划保留。
- 重规划路线保留。
- GLB 模型 Beta 保留。
- debugGarden 工作台保留。

### npm run build 结果

`npm run build` 通过。Vite chunk size warning 仍主要来自既有大块：`admin`、`AdminDashboard`、`ScenicModel` 等，不阻断构建。

## 阶段七十九 B：map-3d-guide-c 加载优化文档整理

日期：2026-06-10

### 本次目标

将最近几轮 `/map-3d-guide-c` 的加载优化、`debugGarden` 工作台优化、路由级拆包和运行时诊断能力整理为项目维护文档。本阶段只修改 Markdown，不修改业务代码、资产、路线、POI、树群生成算法或腾讯地图配置。

### 修改文件

- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-guide-garden-editor-usage.md`
- `docs/map-3d-development-log.md`

### 文档整理内容

新增 `docs/map-3d-guide-c-optimization-log.md`，记录：

- `debugGarden` 5 步园林配置工作台。
- 第一阶段加载优化：`React.lazy` + `Suspense` 拆分 `GardenDebugWizard`。
- GLB 园林资产 overlay 生命周期拆到 `useGardenAssetOverlays.ts`。
- GLB 分批创建，当前批大小约 16 个。
- 第二阶段加载优化：路由级拆包、Provider 隔离、PostHog 按需加载、Cubism Core 按需加载。
- 第三阶段准备：`debugPerf=1` 运行时诊断。

新增 `docs/map-3d-guide-performance-notes.md`，记录：

- 入口包从约 2.72 MB 降至当前生产入口约 188.09 kB，gzip 约 61.68 kB。
- 普通 `/map-3d-guide-c` 不再加载 `GardenDebugWizard`、`ScenicModel`、`Scenic3DMapPage`、后台 chunk、Cubism Core / Cubism chunk。
- `/map-3d-guide-c?debugGarden=1` 会加载 `GardenDebugWizard`，但仍不加载 `ScenicModel`。
- 当前剩余 Vite chunk warning 主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor，不是 C 版普通首屏问题。
- `debugPerf=1` 的诊断字段和限制。

重写 `docs/map-3d-guide-garden-editor-usage.md`，对齐当前 5 步工作台：

- 第 1 步禁放区。
- 第 2 步放树区。
- 第 3 步生成预览。
- 第 4 步应用 GLB。
- 第 5 步导出配置。
- 记录 zone / keepout 默认不显示边界和底色，选中后才显示边框和顶点。
- 记录资产点默认显示 GLB，选中后才显示编辑标记。
- 记录单个资产拖动后必须点击“保存当前资产修改”才写入草稿。

### 验证方式

本阶段不运行构建，因为只整理 Markdown 文档。按要求使用 `git diff -- docs README.md` 查看文档差异；当前仓库没有 `README.md` 时，以 `docs` 差异为准。

### 对功能的影响

本阶段没有修改功能代码，不影响 `/map-3d-guide-c`、`/map`、`/map?debugGltfModel=1` 或 `/scenic-3d-map`。

## 阶段八十：map-3d-guide-c 核心景点 GLB 配置接入

日期：2026-06-11

### 本次目标

将用户已手动移动到 `public/models/lingshan/landmarks/` 的 11 个核心景点 GLB 正式接入 `/map-3d-guide-c` 的 GLB Beta 配置。重点是替换灵山大佛模型为新版 `lingshan-buddha-v2.glb`，并让其它核心景点具备初始锚定和加载诊断能力。

本阶段只做模型配置接入、初始锚定和 `debugPerf` 诊断扩展，不做精细位置 / 比例 / 朝向校准。

### 修改文件

- `src/data/lingshanMapModelOverlays.ts`
- `src/pages/Map3DGuidePage.tsx`
- `src/lib/map3dPerf.ts`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-development-log.md`

### GLB 文件确认

本阶段确认以下文件存在于 `public/models/lingshan/landmarks/`：

- `lingshan-buddha-v2.glb`
- `fan-gong.glb`
- `baizi-milefo.glb`
- `buddha-hand-plaza.glb`
- `bodhi-avenue.glb`
- `shengjing-plaza.glb`
- `sansheng-hall.glb`
- `xiangfu-temple.glb`
- `wuyin-mandala.glb`
- `manlong-flying-tower.glb`
- `buddha-front-plaza.glb`

旧灵山大佛 Meshy v1 文件 `lingshan_buddha_meshy_v1.glb` 仍保留在目录中，未删除。配置 note 中保留旧路径说明，便于后续回退。

### 模型配置与锚定

新增或更新的模型配置均写入 `lingshanMapModelOverlays.ts`，并继续使用 public URL 字符串，不通过 TypeScript import 引入 GLB。

| POI | 模型文件 | 当前锚定 |
| --- | --- | --- |
| 灵山大佛 | `lingshan-buddha-v2.glb` | `giant_buddha` |
| 梵宫 | `fan-gong.glb` | `fan_gong` |
| 百子戏弥勒 | `baizi-milefo.glb` | `baizi_mile` |
| 佛手广场 | `buddha-hand-plaza.glb` | `foshou_square` |
| 菩提大道 | `bodhi-avenue.glb` | `puti_avenue` |
| 胜境广场 | `shengjing-plaza.glb` | `shengjing_square` |
| 三圣殿 | `sansheng-hall.glb` | `sansheng_hall` |
| 祥符禅寺 | `xiangfu-temple.glb` | `xiangfu_temple` |
| 五印坛城 | `wuyin-mandala.glb` | `wuyin_tancheng` |
| 曼飞龙塔 | `manlong-flying-tower.glb` | `manfeilong_tower` |
| 佛前广场 | `buddha-front-plaza.glb` | `foqian_square` |

用户口径中的“三胜殿”按现有 POI 数据中的“三圣殿”锚定；“曼龙飞塔”文件按现有 POI “曼飞龙塔”锚定。未新增或修改 POI 坐标语义。

### 加载策略

`/map-3d-guide-c` 的 GLB Beta 从单个灵山大佛覆盖物扩展为配置驱动的多地标覆盖物：

- 普通页面默认不加载地标 GLB。
- 用户打开“显示 3D 景点模型 Beta”后才开始加载。
- 地图、路线、POI、导览牌和树群先显示。
- 地标 GLB 按 priority 分批创建，当前每批 3 个。
- 单个模型创建失败会记录到诊断，不会导致整页崩溃。

### debugPerf 扩展

`/map-3d-guide-c?debugPerf=1` 现在同时记录 Garden GLB 与 Landmark GLB。地标模型记录字段包含：

- `id`
- `name`
- `modelUrl`
- `category`
- `priority`
- `batchIndex`
- `status`
- `durationMs`
- `error`

当前统计的是腾讯 `TMap.model.GLTFModel` overlay 创建耗时，不等同于浏览器网络层完整下载耗时。

### 保持不变

- 本阶段没有修改普通 `/map`。
- 本阶段没有修改 `/scenic-3d-map`。
- 本阶段没有修改 `/map-3d-guide-a` 或 `/map-3d-guide-b`。
- 本阶段没有修改 routeGeometry / roadNetwork 数据。
- 本阶段没有修改腾讯 walking route 算法。
- 本阶段没有修改 POI 坐标语义。
- 本阶段没有修改树群生成算法或 debugGarden 5 步工作台交互。
- 本阶段没有读取、输出或修改 API Key / `.env`。

### npm run build 结果

`npm run build` 通过。Vite 仍提示部分既有 chunk 超过 500 kB，主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor；本阶段接入的 GLB 通过 public URL 加载，没有进入 JS chunk。

### 下一步建议

下一阶段建议先在 `/map-3d-guide-c?debugPerf=1` 中启用 GLB Beta，记录每个地标模型加载耗时和失败情况；随后逐个校准 `scale`、`height`、`rotation`。体积较大的 `bodhi-avenue.glb`、`xiangfu-temple.glb`、`sansheng-hall.glb` 应优先做压缩、贴图降采样和材质整理。

## 阶段八十一：Landmark GLB Inspector 单体加载检查器

日期：2026-06-11

### 本次目标

在 11 个核心景点 raw GLB 已配置到 `/map-3d-guide-c` 后，新增只在 `debugPerf=1` 下显示的 `Landmark GLB Inspector`。它用于逐个加载、卸载、聚焦和复制诊断单个地标 GLB，避免游客端或普通调试流程一次性加载约 1.1 GB 的 raw 模型。

### 本次约束

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide-a` 或 `/map-3d-guide-b`。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不修改 POI 数据语义、树群生成算法或 debugGarden 5 步工作台交互。
- 不上传、不替换、不删除任何 GLB 文件。
- 不读取、输出或修改 API Key / `.env`。

### 修改文件

- `src/hooks/useLandmarkModelInspector.ts`
- `src/components/map3d/LandmarkGLBInspector.tsx`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `src/lib/map3dPerf.ts`
- `src/pages/Map3DGuidePage.tsx`
- `src/data/lingshanMapModelOverlays.ts`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-development-log.md`

### 实现方式

`Landmark GLB Inspector` 只在以下入口显示：

```text
/map-3d-guide-c?debugPerf=1
/map-3d-guide-c?debugGarden=1&debugPerf=1
```

普通 `/map-3d-guide-c` 不显示 Inspector，也不会默认批量创建 11 个 raw 地标 GLB。C 版的 GLB Beta 面板会提示 raw 地标 GLB 体积较大，应进入 `debugPerf=1` 逐个检查。

Inspector 每个条目支持：

- 加载：为单个地标创建腾讯 `TMap.model.GLTFModel`。
- 卸载：尝试 `setMap(null)`、`remove()` 和 `destroy()` 清理覆盖物。
- 聚焦：移动腾讯地图相机到当前地标锚点。
- 复制诊断：复制单个模型的当前状态 JSON。

### 诊断字段

单个地标诊断包含：

- `id`
- `poiId`
- `name`
- `modelUrl`
- `fileSizeLabel`
- `anchorId`
- `priority`
- `status`
- `durationMs`
- `error`
- `loadCount`
- `unloadCount`

`debugPerf` 的“复制诊断 JSON”会同时包含 `landmarkInspector` 当前状态，便于记录未加载、加载中、已加载、失败和已卸载状态。

### 命名兼容

现有 POI 锚点仍使用 `manfeilong_tower`，模型文件为 `manlong-flying-tower.glb`。本阶段通过 `inspectorId: 'manlong_flying_tower'` 兼容 Inspector 显示与调试命名，不改变 POI 数据语义。

### 对现有功能的影响

- 普通 `/map-3d-guide-c` 默认不开启诊断 UI。
- `/map-3d-guide-c?debugPerf=1` 可显示性能诊断面板和 Landmark GLB Inspector。
- `/map-3d-guide-c?debugGarden=1&debugPerf=1` 可同时显示 debugGarden 工作台和性能诊断面板。
- 单个地标模型加载失败只记录到诊断，不应导致整页崩溃。
- 地图、路线、POI、树群、导览牌、相机卡和模拟偏航 / 腾讯重规划逻辑保持不变。

### npm run build 结果

`npm run build` 通过。当前输出中 `Map3DGuidePage` chunk 约 `136.87 kB`，gzip 约 `39.98 kB`。Vite 仍提示部分既有 chunk 超过 500 kB，主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor；本阶段没有把 GLB 通过 TypeScript import 打进 JS chunk。

### 下一步建议

后续不应让普通游客端直接加载 11 个 raw GLB。建议先用 Inspector 逐个记录加载耗时、失败情况和视觉校准参数，再制作 optimized / runtime GLB 或 proxy 占位模型，并按当前站点、下一站或视野范围逐步启用。

## 阶段八十二：Landmark GLB Inspector 校准面板

日期：2026-06-11

### 本次目标

为 `/map-3d-guide-c?debugPerf=1` 的 `Landmark GLB Inspector` 增加地标模型校准能力。当前 11 个地标 GLB 已可逐个加载和卸载，但仍需要人工微调 scale、height、水平旋转和坐标 offset。本阶段只做调试态校准工具，不压缩 GLB、不改模型文件、不自动写回源码配置。

### 本次约束

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide-a` 或 `/map-3d-guide-b`。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不修改 POI 数据语义、树群生成算法或 debugGarden 5 步工作台。
- 不删除、不替换、不压缩任何 GLB 文件。
- 不读取、输出或修改 API Key / `.env`。
- 普通 `/map-3d-guide-c` 不默认加载全部 raw 地标 GLB，也不应用 debug 校准草稿。

### 修改文件

- `src/hooks/useLandmarkModelInspector.ts`
- `src/components/map3d/LandmarkGLBInspector.tsx`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `src/lib/map3dPerf.ts`
- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-development-log.md`

### 校准字段

每个地标支持以下 debug-only 校准字段：

- `scale`：模型整体缩放。
- `height`：腾讯 `TMap.LatLng(lat, lng, height)` 的高度 / Z 偏移。
- `rotationY`：水平朝向旋转。
- `lngOffset`：经度微调。
- `latOffset`：纬度微调。

经纬度微调只作为模型 overlay offset 存在，不修改 POI 坐标。

### 本地草稿

校准草稿保存到浏览器 localStorage：

```text
lingshan_landmark_calibration_draft_v1
```

`debugPerf=1` 下加载地标时优先应用本地草稿。普通游客页不读取和应用该草稿，避免调试状态污染正式展示。

### 实时预览

调整参数后，当前已加载地标会在短延迟后更新：

- 优先调用 `GLTFModel.setScale`。
- 优先调用 `GLTFModel.setRotation`。
- 优先调用 `GLTFModel.setPosition`。
- 如果运行环境不支持上述方法或调用失败，只重建当前单个地标 overlay。

单个模型更新失败不会影响树群 overlay、路线、POI 或其它地标。

### 导出与重置

校准面板支持：

- 保存当前校准到本地草稿。
- 复制当前模型配置 patch。
- 复制全部地标校准 patch。
- 重置当前模型校准。
- 清空全部地标校准草稿。

复制 patch 只用于后续人工确认后固化到 `lingshanMapModelOverlays.ts`，本阶段不会自动修改源码配置。

### debugPerf 扩展

诊断快照增加：

- `calibrationDraftCount`
- `activeCalibrationId`
- `lastCalibrationUpdatedAt`
- `activeCalibration`

`Map3DPerfPanel` 摘要区会显示当前校准草稿数量和当前校准地标 id；复制完整诊断 JSON 时也会带上 `landmarkInspector` 的当前状态。

### 保持不变

- `mapStyleId: 'style1'` 保留。
- 普通 `/map-3d-guide-c` 默认不显示 Inspector。
- `/map-3d-guide-c?debugGarden=1&debugPerf=1` 可同时使用 debugGarden 工作台和 Landmark 校准。
- 地图、路线、POI、树群、导览牌、相机卡和模拟偏航 / 腾讯重规划逻辑保持不变。

### npm run build 结果

`npm run build` 通过。当前输出中 `Map3DGuidePage` chunk 约 `147.45 kB`，gzip 约 `42.98 kB`。Vite 仍提示部分既有 chunk 超过 500 kB，主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor；本阶段没有把 GLB 通过 TypeScript import 打进 JS chunk。

### 下一步建议

人工逐个校准地标后，复制 patch 交由 Codex 或人工整理，统一固化到 `lingshanMapModelOverlays.ts`。体积过大的模型仍应在固化前做压缩、贴图降采样和材质合并。

## 阶段八十三：核心地标校准 patch 固化与腾讯白模冲突记录

日期：2026-06-11

### 本次目标

将已经人工确认的灵山大佛、五印坛城、梵宫三个核心地标校准 patch 固化到 `lingshanMapModelOverlays.ts`，并记录腾讯底图 3D 白模建筑与自定义 GLB 地标重叠的问题。代码层面只固化 scale / height / rotationY / offset，不通过异常抬高模型或放大模型遮挡白模。

### 本次约束

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide-a` 或 `/map-3d-guide-b`。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不修改 POI 数据语义、树群生成算法或 debugGarden 5 步工作台。
- 不删除、不替换、不压缩任何 GLB 文件。
- 不修改 Tencent key。
- 不修改 `mapStyleId: 'style1'`。
- 不读取、输出或修改 API Key / `.env`。

### 修改文件

- `src/data/lingshanMapModelOverlays.ts`
- `src/hooks/useLandmarkModelInspector.ts`
- `src/components/map3d/LandmarkGLBInspector.tsx`
- `src/pages/Map3DGuidePage.tsx`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-development-log.md`

### 固化 patch

已固化：

```ts
[
  {
    id: 'giant_buddha',
    scale: 380,
    height: 73,
    rotationY: 15,
    lngOffset: 0,
    latOffset: 0.00005
  },
  {
    id: 'wuyin_tancheng',
    scale: 420,
    height: 32,
    rotationY: 9,
    lngOffset: -0.00001,
    latOffset: 0
  },
  {
    id: 'fan_gong',
    scale: 900,
    height: 48,
    rotationY: 9,
    lngOffset: -0.00009,
    latOffset: 0.00101
  }
]
```

`rotationY` 继续映射到配置中的 `rotation[1]`。`lngOffset / latOffset` 作为模型 overlay 的坐标微调字段，不修改 POI 坐标。

灵山大佛继续使用：

```text
/models/lingshan/landmarks/lingshan-buddha-v2.glb
```

旧灵山大佛模型文件仍保留，未删除。

### debugPerf 草稿覆盖

`useLandmarkModelInspector` 的默认校准值现在会读取 overlay 配置中的 `lngOffset / latOffset`。`debugPerf=1` 下如果存在 localStorage 校准草稿，草稿仍会覆盖这些固化默认值，便于后续继续微调和复制 patch。

### 腾讯底图白模建筑与自定义 GLB 地标重叠

现象：

- 梵宫等建筑类 GLB 与腾讯地图自带 3D 白模建筑重叠。
- 导入 GLB 只是叠加层，不会替换底图白模。

结论：

- 不建议全局关闭腾讯 3D 建筑白模，否则非核心建筑也会消失，景区空间密度会下降。
- 不应靠抬高模型或放大模型硬遮挡白模。
- 推荐采用混合策略：非核心建筑保留腾讯白模，但在 `style1` 中弱化颜色、阴影和对比度；核心地标使用自定义 GLB 表现。
- 冲突严重的核心地标增加局部 footprint mask / 场地底座，先在梵宫验证。
- 腾讯底图继续提供坐标、道路、水系、弱化建筑背景和空间参照；核心地标由自定义 GLB 提供。

后续动作：

1. 在腾讯地图样式编辑器中检查 `style1`。
2. 找到建筑物 / 3D 建筑 / 白模建筑相关图层。
3. 不全局关闭白模，优先降低非核心建筑的颜色、阴影和对比度。
4. 保持道路、水系、绿地、地名和非核心建筑轮廓可读。
5. 在 `/map-3d-guide-c?debugPerf=1` 中先为梵宫验证局部 footprint mask / 场地底座。
6. 如果可行，再推广到五印坛城、祥符禅寺、三胜殿等建筑类地标。

### Inspector 提示

`LandmarkGLBInspector` 对 `fan_gong` 增加轻量提示：如果出现腾讯白模建筑穿插，不要全局关闭白模，也不要通过异常 height / scale 硬遮挡；应在 `style1` 中弱化白模视觉，并后续制作真正 3D 场地底座 / 低模场景。polygon footprint mask 仅作为高级实验保留。

### 梵宫 footprint mask MVP

梵宫配置新增 `footprintMask` 草稿字段，默认关闭。`/map-3d-guide-c?debugPerf=1` 下进入 `fan_gong` 校准时，可以在 `Landmark GLB Inspector` 中启用和调试梵宫局部遮罩 / 场地底座。

- `mode` 支持 `none`、`solid`、`ring`。
- `ring` 和 `solid` 均只作为实验模式保留，后续实测已不再推荐用于梵宫最终效果。
- `width / depth` 控制外层场地范围。
- `innerWidth / innerDepth` 控制中间留空区域，避免覆盖梵宫 GLB 主体。
- `rotationY / lngOffset / latOffset` 控制对齐，`color / opacity` 控制视觉强度。
- 当前 MVP 使用腾讯地图 `MultiPolygon` 绘制地面 footprint。`ring` 模式由四块周边 polygon 组成，不依赖 polygon holes；中间留空，不压住 GLB 主体。
- 第一版实心 polygon mask 会像贴片一样干扰梵宫 GLB，因此不作为推荐方案。
- 这是局部视觉处理，不是删除腾讯底图白模。
- 草稿保存到 localStorage，可复制 `fan_gong footprint mask patch`。

如果白模仍在梵宫主体内部穿插，ring mask 不能从技术上删除腾讯白模。后续应继续通过 `style1` 弱化白模视觉、更完整的 GLB 自身遮挡，或真正的 3D 场地底座 / 低模替换方案解决。

## 阶段八十四：梵宫 ring footprint mask 修正（后续已降级为实验）

日期：2026-06-11

### 本次目标

修正梵宫 footprint mask 的默认处理方式：不再把实心矩形遮罩作为推荐方案，改为默认 ring 场地铺装 mask。ring mask 只显示梵宫周边铺装，中间留空，避免遮挡或干扰梵宫 GLB 主体。

### 本次约束

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide-a` 或 `/map-3d-guide-b`。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不修改 POI 数据语义、树群生成算法或 debugGarden 5 步工作台。
- 不删除、不替换、不压缩任何 GLB 文件。
- 不修改 Tencent key。
- 不修改 `mapStyleId: 'style1'`。
- 不读取、输出或修改 API Key / `.env`。
- 不全局关闭腾讯 3D 建筑白模。

### 修改文件

- `src/data/lingshanMapModelOverlays.ts`
- `src/hooks/useLandmarkModelInspector.ts`
- `src/components/map3d/LandmarkGLBInspector.tsx`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-development-log.md`

### ring mask 设计

`footprintMask` 新增 / 明确以下字段：

- `mode: 'none' | 'solid' | 'ring'`
- `innerWidth`
- `innerDepth`

其中：

- `none`：不显示 mask。
- `solid`：保留旧实心矩形能力，仅作为临时调试备用，UI 中提示它可能像贴片一样干扰模型。
- `ring`：推荐模式，外层为场地范围，中间留出建筑主体区域。

当前实现没有依赖 polygon holes，而是用四块 `TMap.MultiPolygon` 几何组成 ring：

- 上侧铺装。
- 下侧铺装。
- 左侧铺装。
- 右侧铺装。

这样可以兼容不确定 holes 支持的运行环境，也能保证中间区域不被 footprint mask 覆盖。

### Inspector 调试能力

`LandmarkGLBInspector` 的梵宫局部遮罩 / 场地底座区域增加：

- `mode` 选择。
- `innerWidth`。
- `innerDepth`。
- solid 模式风险提示。
- ring 参数校验提示：`innerWidth / innerDepth` 必须小于外层 `width / depth`。

保存草稿、复制 `fan_gong footprint mask patch` 和重置功能保持不变。

### 策略说明

实心 polygon mask 不能作为梵宫最终处理方式，因为它会像大贴片一样压在 GLB 下方并干扰模型主体。ring mask 只能做周边铺装和场地统一，不能删除腾讯白模。如果白模仍在梵宫主体内部穿插，后续仍应通过 `style1` 弱化白模视觉、更完整的 GLB 自身遮挡，或真正的 3D 底座 / 低模替换方案解决。

### 保持不变

- 普通 `/map-3d-guide-c` 不显示 footprint mask。
- 普通 `/map-3d-guide-c` 不应用 debug mask 草稿。
- 普通 `/map-3d-guide-c` 不默认加载全部 raw 地标 GLB。
- debugGarden 工作台保持不变。
- 模拟前进、模拟偏航、腾讯 walking route 重规划保持不变。
- 树群、路线、POI、导览牌、相机卡保持不变。

### npm run build 结果

`npm run build` 通过。当前输出中 `Map3DGuidePage` chunk 约 `156.38 kB`，gzip 约 `45.49 kB`。Vite 仍提示部分既有 chunk 超过 500 kB，主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor；本阶段没有上传、替换、压缩或通过 TypeScript import 引入任何 GLB 文件。

## 阶段八十五：梵宫 polygon footprint mask 实验结论

日期：2026-06-12

### 本次目标

废弃当前 `fan_gong` 的 polygon footprint mask 作为推荐方案。实测 `solid` 和 `ring` 两种 `TMap.MultiPolygon` mask 都过于突兀，视觉上像贴片，会干扰梵宫 GLB。代码保留为高级实验功能，但默认彻底关闭，不再作为梵宫白模冲突的推荐处理方式。

### 本次约束

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide-a` 或 `/map-3d-guide-b`。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不修改 POI 数据语义、树群生成算法或 debugGarden 5 步工作台。
- 不删除、不替换、不压缩任何 GLB 文件。
- 不修改 Tencent key。
- 不修改 `mapStyleId: 'style1'`。
- 不读取、输出或修改 API Key / `.env`。
- 不让普通游客页默认加载全部 raw 地标 GLB。

### 修改文件

- `src/data/lingshanMapModelOverlays.ts`
- `src/components/map3d/LandmarkGLBInspector.tsx`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-development-log.md`

### 默认行为修正

`fan_gong` 的 `footprintMask` 默认值改为：

```ts
footprintMask: {
  enabled: false,
  mode: 'none'
}
```

已有 `width / depth / innerWidth / innerDepth / color / opacity` 等实验参数保留，便于后续临时调试或复用到更适合 polygon 区域标记的广场类资产。但普通 `/map-3d-guide-c` 不显示 footprint mask，也不应用 debug footprint mask 草稿。

### Inspector 文案修正

`LandmarkGLBInspector` 中梵宫相关提示改为：

- polygon footprint mask 是实验功能。
- `TMap polygon footprint mask` 实测容易产生贴片感，不推荐作为最终方案。
- 梵宫白模冲突应优先通过弱化腾讯白模视觉，或后续制作真正 3D 场地底座 / 低模场景解决。
- `solid` 和 `ring` 模式均标注为实验，不再显示“推荐”。
- 梵宫 footprint mask 调试区默认折叠到高级实验区。

### 实验结论

尝试方案：

1. `solid` polygon mask。
2. `ring` polygon mask。

实测问题：

- `solid` mask 会像大贴片一样压在梵宫下面。
- `ring` mask 虽然避开主体，但周边铺装仍然突兀。
- `TMap.MultiPolygon` 更适合地图区域标记，不适合作为核心建筑的自然 3D 底座。

结论：

- polygon footprint mask 不作为梵宫最终方案。
- 默认关闭。
- 代码保留为高级实验能力，不删除。
- 不通过异常 `height / scale` 硬遮挡腾讯白模。
- 不全局关闭腾讯 3D 建筑白模。

### 后续推荐方向

1. 在腾讯 `style1` 中弱化 3D 白模建筑的颜色、阴影、对比度，但不全局关闭。
2. 为梵宫制作真正的 3D 低矮场地底座或低模场景，使其与 GLB 统一材质和深度关系。
3. 或在梵宫 GLB 模型本身中整合场地 / 底座。

### 保持不变

- 普通 `/map-3d-guide-c` 正常。
- `/map-3d-guide-c?debugPerf=1` 正常。
- debugGarden 工作台保持不变。
- 模拟前进、模拟偏航、腾讯 walking route 重规划保持不变。
- 树群、路线、POI、导览牌、相机卡保持不变。

### npm run build 结果

`npm run build` 通过。当前输出中 `Map3DGuidePage` chunk 约 `156.55 kB`，gzip 约 `45.58 kB`。Vite 仍提示部分既有 chunk 超过 500 kB，主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor；本阶段没有上传、替换、压缩或通过 TypeScript import 引入任何 GLB 文件。

## 阶段八十六：第二批地标校准 patch 固化与祥符禅寺白模冲突记录

日期：2026-06-12

### 本次目标

固化第二批已人工确认的核心地标校准 patch：佛手广场、佛前广场、祥符禅寺。同时记录祥符禅寺也存在与梵宫类似的腾讯 3D 白模建筑冲突，后续统一进入建筑类地标白模冲突处理任务。

### 本次约束

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide-a` 或 `/map-3d-guide-b`。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不修改 POI 数据语义、树群生成算法或 debugGarden 5 步工作台。
- 不删除、不替换、不压缩任何 GLB 文件。
- 不修改 Tencent key。
- 不修改 `mapStyleId: 'style1'`。
- 不新增祥符禅寺 polygon footprint mask。
- 不读取、输出或修改 API Key / `.env`。

### 修改文件

- `src/data/lingshanMapModelOverlays.ts`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-development-log.md`

### 第二批固化参数

已将以下人工确认 patch 固化到 `lingshanMapModelOverlays.ts`：

| 地标 | scale | height | rotationY | lngOffset | latOffset |
| --- | ---: | ---: | ---: | ---: | ---: |
| 佛手广场 | 194 | 9 | 30 | -0.00017 | -0.00017 |
| 祥符禅寺 | 618 | 12 | 31 | -0.00006 | 0.00009 |
| 佛前广场 | 103 | 3 | 28 | -0.00004 | 0.00005 |

`debugPerf=1` 下的 localStorage calibration draft 仍可覆盖这些默认值，便于后续继续微调。

### 祥符禅寺白模冲突

人工观察发现，`xiangfu_temple` 也存在与 `fan_gong` 类似的腾讯底图 3D 白模建筑重叠或穿插问题。该问题不应通过异常放大模型、抬高模型或 polygon mask 硬遮挡。

本阶段没有为祥符禅寺新增 `footprintMask`，也没有复用梵宫 polygon mask。建筑类核心地标后续应统一进入“弱化腾讯白模 + 真正 3D 低矮场地底座 / 低模场景”任务：

1. 不全局关闭腾讯 3D 白模建筑。
2. 非核心白模尽量在 `style1` 中弱化为背景。
3. 核心建筑后续制作真正的 3D 低矮场地底座 / 低模场景。
4. polygon footprint mask 对建筑主体容易产生贴片感，不推荐作为最终方案。

### 保持不变

- 已固化的灵山大佛、五印坛城、梵宫参数保持不变。
- 旧灵山大佛模型仍保留，不删除。
- 普通 `/map-3d-guide-c` 不默认加载全部 raw 地标 GLB。
- debugGarden 工作台保持不变。
- 模拟前进、模拟偏航、腾讯 walking route 重规划保持不变。

### npm run build 结果

`npm run build` 通过。当前输出中 `Map3DGuidePage` chunk 约 `156.55 kB`，gzip 约 `45.59 kB`。Vite 仍提示部分既有 chunk 超过 500 kB，主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor；本阶段没有上传、替换、压缩或通过 TypeScript import 引入任何 GLB 文件。

## 阶段八十七：第三批地标校准 patch 固化与祥符禅寺底座方向记录

日期：2026-06-12

### 本次目标

固化最新一批人工确认的核心地标校准 patch，包括重新校准后的梵宫，以及曼龙飞塔、三圣殿、百子戏弥勒、胜境广场。同时记录祥符禅寺仍需要后续制作真正 3D 场地底座 / 低模底座，不使用 polygon mask 硬盖。

### 本次约束

- 不修改普通 `/map`。
- 不修改 `/scenic-3d-map`。
- 不修改 `/map-3d-guide-a` 或 `/map-3d-guide-b`。
- 不修改 routeGeometry / roadNetwork 数据。
- 不修改腾讯 walking route 算法。
- 不修改 POI 数据语义、树群生成算法或 debugGarden 5 步工作台。
- 不删除、不替换、不压缩任何 GLB 文件。
- 不修改 Tencent key。
- 不修改 `mapStyleId: 'style1'`。
- 不新增祥符禅寺 polygon footprint mask。
- 不重新启用梵宫 polygon footprint mask。
- 不读取、输出或修改 API Key / `.env`。

### 修改文件

- `src/data/lingshanMapModelOverlays.ts`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-development-log.md`

### 最新固化参数

已将以下人工确认 patch 固化到 `lingshanMapModelOverlays.ts`：

| 地标 | scale | height | rotationY | lngOffset | latOffset |
| --- | ---: | ---: | ---: | ---: | ---: |
| 梵宫 | 1012 | 50 | 10 | -0.00004 | 0.0006 |
| 曼龙飞塔 | 207.5 | 35 | 15 | -0.00005 | -0.00006 |
| 三圣殿 | 763 | 46 | 53 | 0.00011 | -0.00021 |
| 百子戏弥勒 | 145 | 9 | 20 | 0.00009 | 0 |
| 胜境广场 | 150 | 8 | 30 | 0.00001 | 0 |

`debugPerf=1` 下的 localStorage calibration draft 仍可覆盖这些默认值，便于后续继续微调。

### 梵宫 footprint mask 状态

梵宫 `footprintMask` 实验字段保留，但默认仍关闭：

```ts
enabled: false
mode: 'none'
```

本阶段没有重新启用 `solid` 或 `ring` polygon mask。梵宫白模冲突后续仍应走弱化腾讯白模 + 真正 3D 场地底座 / 低模场景方向。

### 曼龙飞塔 id 兼容

用户调试口径使用 `manlong_flying_tower`，现有 POI anchor 仍为 `manfeilong_tower`。本阶段保持：

- `poiId: 'manfeilong_tower'`
- `inspectorId: 'manlong_flying_tower'`

这样不会修改 POI 数据语义，也能保持 Inspector 和导出 patch 与用户口径一致。文档中文名称统一使用“曼龙飞塔”。

### 祥符禅寺后续底座

祥符禅寺当前位置、scale 和高度已初步校准，但建筑类白模冲突仍存在。当前不新增祥符禅寺 polygon footprint mask，不使用 TMap polygon 面片硬盖。后续应制作真正 3D 场地底座 / 低模底座，或将底座直接整合进 GLB。

### 保持不变

- 已固化的灵山大佛、五印坛城、佛手广场、佛前广场、祥符禅寺参数保持不变。
- 普通 `/map-3d-guide-c` 不默认加载全部 raw 地标 GLB。
- debugGarden 工作台保持不变。
- 模拟前进、模拟偏航、腾讯 walking route 重规划保持不变。
- 本阶段没有加载或校准菩提大道。

### npm run build 结果

`npm run build` 通过。当前输出中 `Map3DGuidePage` chunk 约 `156.55 kB`，gzip 约 `45.59 kB`。Vite 仍提示部分既有 chunk 超过 500 kB，主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor；本阶段没有上传、替换、压缩或通过 TypeScript import 引入任何 GLB 文件。

## 阶段：五印坛城与梵宫 safe-v2 runtime GLB 切换

日期：2026-06-12

### 本次目标

将已经人工验证通过的五印坛城和梵宫 safe-v2 压缩候选正式切换为 `/map-3d-guide-c` 地标 runtime GLB，同时保留 debugPerf 中 raw / safe-v1 / safe-v2 的对比能力。

### 修改文件

- `.gitignore`
- `src/data/lingshanMapModelOverlays.ts`
- `src/data/lingshanOptimizedModelCandidates.ts`
- `src/hooks/useLandmarkModelInspector.ts`
- `src/components/map3d/LandmarkGLBInspector.tsx`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `src/lib/map3dPerf.ts`
- `src/pages/Map3DGuidePage.tsx`
- `docs/lingshan-glb-optimization-trial.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-guide-c-optimization-log.md`
- `public/models/lingshan/optimized/wuyin-mandala.safe-v2.glb`
- `public/models/lingshan/optimized/fan-gong.safe-v2.glb`

### 人工测试结论

- 五印坛城 raw / safe-v1 / safe-v2 均可显示。
- 梵宫 raw / safe-v1 / safe-v2 均可显示。
- safe-v2 材质、尺寸、朝向和卸载流程未发现明显问题。
- Draco 当前打不开，继续暂停作为腾讯地图运行时候选。

### 正式切换

- `wuyin_tancheng` 正式 `modelUrl` 切换为 `/models/lingshan/optimized/wuyin-mandala.safe-v2.glb`。
- `fan_gong` 正式 `modelUrl` 切换为 `/models/lingshan/optimized/fan-gong.safe-v2.glb`。
- 不改变既有 scale / height / rotationY / offset。
- 梵宫 `footprintMask` 继续保持 `enabled=false`、`mode=none`。

### 提交边界

- raw GLB 继续精确忽略，不进入 Git。
- safe-v1 / draco 试验产物精确忽略，不进入 Git。
- 本阶段只提交两个 safe-v2 runtime GLB。
- 菩提大道不参与本阶段处理。

### 验证

`npm run build` 通过。普通 `/map-3d-guide-c` 不显示候选版本切换；`/map-3d-guide-c?debugPerf=1` 中 `Landmark GLB Inspector` 仍可对五印坛城和梵宫进行 raw / safe-v1 / safe-v2 对比测试。
