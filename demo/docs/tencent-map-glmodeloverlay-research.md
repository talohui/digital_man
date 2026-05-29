# 腾讯地图 GLModelOverlay 与灵山 3D 模型覆盖方案调研

## 1. 调研背景

用户希望将 3D 模型、道路和水体更自然地附着在腾讯地图真实底图上，使灵山胜境的核心建筑、路线和环境表达更贴近真实空间。

当前 Web 版已经形成两条路线：

- `/scenic-3d-map`：独立 Three.js 沉浸式 3D 导览地图，负责视觉体验、路线故事和艺术化导览。
- `/map`：腾讯地图 JS API GL 真实导览页，负责真实底图、POI、路线、调试和导航兜底。

腾讯 Android Map SDK 的 GLModelOverlay 文档入口为：

<https://lbs.qq.com/mobile/androidMapSDK/developerGuide/GLModelOverlay>

该能力看起来提供了在原生 Android 腾讯地图上叠加 glTF / 3D 模型覆盖物的可能性。

说明：本阶段尝试联网读取官方文档但未能完整获取页面内容，因此下文基于官方文档入口、Android SDK 能力命名和地图 SDK 常见覆盖物设计进行方案分析。具体 API 参数、类名、生命周期和模型格式限制，后续 Android 开发前必须再次核对腾讯地图官方文档，不在本阶段编造具体 API 参数。

## 2. GLModelOverlay 能力定位

基于文档入口和命名可谨慎判断：

- GLModelOverlay 属于腾讯地图 Android Map SDK。
- 它面向 Android 原生地图，而不是 Web React 页面。
- 它用于在 Android 原生腾讯地图上叠加 3D 模型覆盖物。
- 模型通常可能使用 glTF / GLB 类资源。
- 它适合把核心建筑、地标或符号化 3D 模型放在真实地图经纬度位置上。

适合表达：

- 灵山大佛模型。
- 梵宫模型。
- 九龙灌浴模型。
- 五印坛城模型。
- 入口门楼、广场节点等轻量模型。

不应误解为：

- 可直接导出腾讯地图道路网。
- 可直接获取水体 polygon。
- 可在当前 React + Vite Web 项目中直接调用。
- 可替代路线规划、定位或导航能力。

## 3. 与当前 Web 方案的区别

### 当前 Web 方案

- React + Vite。
- Tencent JS API GL。
- Three.js / React Three Fiber。
- `/scenic-3d-map` 是独立 3D 场景。
- `/map` 是真实地图增强页。

当前 Web 方案的特点：

- 视觉可控。
- 适合答辩展示和沉浸式讲解。
- 可以快速迭代 3D 场景、路线、标签、低模节点。
- 但 3D 场景中的道路、水体和建筑关系需要项目自己建模、投影或艺术化表达。

### Android GLModelOverlay 方案

- Android 原生 App。
- 腾讯 Android Map SDK。
- 3D 模型作为地图覆盖物。
- 真实底图、道路、水体、建筑轮廓由腾讯地图负责。
- glTF / GLB 模型可绑定到经纬度位置。

Android GLModelOverlay 的特点：

- 模型与真实地图融合度更高。
- 道路和水体天然依托腾讯底图显示。
- 更适合现场 Android APK 导览。
- 需要原生 Android 开发和 SDK 集成。

结论：

- Android GLModelOverlay 不能直接在当前 React Web 页面中调用。
- 如果当前 demo 继续 Web 路线，仍应保留 `/scenic-3d-map` + `/map` 双模式。
- 如果未来做 Android APK，GLModelOverlay 很有价值。

## 4. 对灵山胜境项目的价值

GLModelOverlay 可用于把灵山核心模型放在真实地图位置上：

- 灵山大佛 glTF 模型贴到真实地图对应位置。
- 梵宫 glTF 模型贴到真实地图对应位置。
- 九龙灌浴模型贴到真实地图对应位置。
- 五印坛城模型贴到真实地图对应位置。

真实道路、水体、建筑轮廓和地名仍由腾讯地图底图显示。3D 模型只作为增强覆盖物，不承担路线规划。

这种模式适合未来 Android 现场导览：

- 用户看到真实腾讯地图底图。
- 重要景点以 3D 模型增强识别。
- 路线仍使用腾讯导航或项目 verified routeGeometry。
- POI、navLocation、routeGeometry 和讲解内容继续沿用现有数据体系。

## 5. 适合的应用场景

### Web Demo 当前阶段

推荐继续：

- `/scenic-3d-map` 做沉浸式 3D 体验。
- `/map` 做腾讯地图增强模式。
- 不强行把 Three.js 模型叠进腾讯 JS 地图。

原因：

- 当前 Web 方案已经可用。
- 双模式边界清晰。
- 强行做 Web 地图 WebGL 模型叠加会显著增加相机同步、坐标转换和生命周期管理复杂度。

### Android APK / 原生地图阶段

可考虑：

- 腾讯 Android Map SDK。
- GLModelOverlay。
- 将 glTF 核心地标叠加到真实地图上。
- 结合 Android 定位和导航能力做现场导览。

适用条件：

- 项目进入原生 Android APK 阶段。
- 已有可用 glTF / GLB 核心模型。
- 已校准核心 POI 的 `navLocation`。
- 已验证模型体积、纹理、朝向、缩放和性能。

### Web 高级阶段

需进一步调研：

- 腾讯 JS API GL 是否支持自定义 WebGL 图层。
- Three.js 与腾讯地图相机矩阵同步。
- 经纬度到地图 WebGL 坐标转换。
- 地图缩放、旋转、倾斜时模型同步。
- 模型拾取、遮挡、生命周期和性能。

这比当前独立 Three.js 场景复杂，不建议当前阶段实现。

## 6. 三种技术路线对比

| 方案 | 技术栈 | 优点 | 缺点 | 当前建议 |
|---|---|---|---|---|
| Web 独立 3D 地图 | `/scenic-3d-map` + Three.js / React Three Fiber | 视觉易控，适合答辩展示和沉浸式导览，迭代速度快 | 道路、水体、建筑关系需要自建、投影或艺术化，不能天然获得腾讯底图细节 | 继续作为主视觉 |
| Web 腾讯地图增强模式 | `/map` + Tencent JS API GL | 真实底图、真实路线、POI 聚焦和导航兜底能力强 | 难直接叠复杂 3D 模型，WebGL 图层同步复杂 | 作为真实导航模式 |
| Android GLModelOverlay | Android Map SDK + glTF model overlay | 真实底图与 3D 模型融合度高，适合现场 APK 导览 | 需要原生 Android 开发，API 和模型限制需官方文档核对 | 作为后续 APK 高级方案 |

## 7. 推荐架构

建议形成三层：

### 1. Web 沉浸式导览层

- `/scenic-3d-map`
- 视觉展示。
- 路线故事。
- 文化导览。

### 2. Web 真实地图增强层

- `/map`
- POI。
- 路线。
- 定位。
- 调试。
- 导航兜底。

### 3. Android 原生增强层

- Android Tencent Map SDK。
- GLModelOverlay。
- glTF 核心模型。
- 现场导览增强。

三层共享：

- 统一 POI id。
- `guideRoutes`。
- `routeGeometry`。
- `navLocation` 设计。
- 讲解内容和景点元数据。

模型资产 glb / glTF 可在 Web 和 Android 之间复用，但加载方式、坐标绑定、缩放、旋转和性能约束不同。

## 8. 对模型资产制作的影响

Blender / 3D 重建生成的 glTF / GLB 模型应尽量平台通用。

每个模型需要：

- 统一坐标原点。
- 合理比例。
- 低面数。
- 压缩纹理。
- 清晰命名。
- 可独立加载。
- 不依赖 Web 专属材质或 shader。

Android GLModelOverlay 可能对模型大小、纹理格式、坐标、朝向、缩放、动画和生命周期有额外要求，后续需要按官方文档验证。

目前仍建议先做核心 4 个模型：

- 灵山大佛。
- 九龙灌浴。
- 梵宫。
- 五印坛城。

这些模型同时服务：

- `/scenic-3d-map` 的 Web 3D 导览。
- `/three-preview` 的资产验证。
- 未来 Android GLModelOverlay 原生地图增强。

## 9. 后续验证任务

### 阶段 46：Android GLModelOverlay 官方 API 参数核对

- 仔细阅读官方文档。
- 记录加载模型 API。
- 记录经纬度定位 API。
- 记录缩放、旋转和朝向 API。
- 记录生命周期管理方式。
- 记录模型格式、纹理、大小和性能限制。

### 阶段 47：Android 最小 Demo

- 新建或使用现有 Android demo。
- 加载一个简单 glTF 模型。
- 绑定到某个经纬度点。
- 验证缩放。
- 验证旋转。
- 验证地图缩放、旋转、倾斜下模型表现。
- 验证手机端性能。

### 阶段 48：Web 与 Android 模型资产共用规范

- 统一 glb 目录。
- 统一模型命名。
- 统一缩放和原点规则。
- 制定模型体积限制。
- 制定贴图大小和压缩规范。
- 制定 Web / Android 双端验收流程。

## 10. 风险与注意事项

- Android GLModelOverlay 不能直接用于 Web React 项目。
- 不能把 Android SDK 文档误认为 JS API 能力。
- 模型覆盖物不等于道路 / 水体矢量提取。
- 腾讯地图底图数据仍不可直接批量导出。
- glTF 模型体积和性能要控制。
- 宗教文化建筑表达应庄重克制。
- 真实导航仍应依赖腾讯地图路线或自有 verified routeGeometry。
- Android API 参数必须以官方文档为准，不能依赖本阶段推断。

## 11. 结论

GLModelOverlay 对未来 Android APK 很有价值，尤其适合把灵山大佛、九龙灌浴、梵宫、五印坛城等核心 glTF 模型贴到腾讯真实地图底图上。

当前 Web demo 不应直接切换到该方案。现阶段应继续保持：

- `/scenic-3d-map`：Web 沉浸式 3D 导览主视觉。
- `/map`：腾讯地图真实导览增强模式。
- `/three-preview`：Web 3D 资产验证页。

后续如果做 Android 原生版本，可基于 GLModelOverlay 将核心 glTF 模型叠加到腾讯地图真实底图上。

模型资产制作应提前考虑 Web 与 Android 复用。
