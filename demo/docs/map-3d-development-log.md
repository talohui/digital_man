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
