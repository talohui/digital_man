# 灵山胜境前端 3D 接入方案

## 接入目标

第一阶段不做完整 3D 数字孪生，只做“灵山符号化 3D 预览面板”。

3D 主要服务于地图美化、景点预览和路线展示，不改现有 Live2D 数字人链路。第一版不把腾讯地图和 Three.js 强行合并到同一个 WebGL 图层，而是采用地图 + 3D 预览分栏，降低接入风险。

## 推荐技术栈

后续建议安装：

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@types/three`

用途说明：

- `three`：底层 3D 渲染能力。
- `@react-three/fiber`：在 React 中声明式使用 Three.js。
- `@react-three/drei`：提供 `useGLTF`、`OrbitControls`、`Environment` 等常用工具。
- `@types/three`：补充 TypeScript 类型。

## 推荐目录结构

```text
src/components/scenic3d/
  Scenic3DPreview.tsx
  LandmarkModel.tsx
  PlaceholderLandmark.tsx
  RouteRibbon3D.tsx
  Scenic3DControls.tsx

src/data/scenic3d/
  lingshanAssetMap.ts

public/models/lingshan/
  landmarks/
  environment/
  props/
  effects/
  thumbnails/
```

- `Scenic3DPreview.tsx`：3D 画布容器，负责接收选中 POI、查找资产绑定、组织相机和灯光。
- `LandmarkModel.tsx`：加载真实 `.glb` 地标模型。
- `PlaceholderLandmark.tsx`：真实模型缺失时显示低模几何体占位。
- `RouteRibbon3D.tsx`：后续显示路线金线、墨线或带状导览路径。
- `Scenic3DControls.tsx`：提供视角重置、模型显示切换、自动旋转等控制。
- `lingshanAssetMap.ts`：维护 `poiId` 与模型 URL、缩略图、transform、LOD、状态之间的映射。
- `public/models/lingshan/landmarks/`：核心地标模型。
- `public/models/lingshan/environment/`：地形底座、道路、广场、山水环境。
- `public/models/lingshan/props/`：标识牌、树木、栏杆、灯具等复用道具。
- `public/models/lingshan/effects/`：雾效、水效、光效等辅助贴图或轻量资产。
- `public/models/lingshan/thumbnails/`：模型缩略图和景点预览图。

## 资产绑定数据设计

后续 `src/data/scenic3d/lingshanAssetMap.ts` 可采用如下类型：

```ts
type LingshanAssetStatus =
  | 'placeholder'
  | 'model_ready'
  | 'disabled'

type LingshanAssetBinding = {
  poiId: string
  modelUrl?: string
  thumbnailUrl?: string
  status: LingshanAssetStatus
  transform: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
  }
  lod?: {
    low?: string
    medium?: string
    high?: string
  }
  note?: string
}
```

字段说明：

- `poiId` 对应 `lingshanPois.id`。
- `modelUrl` 指向 `public/models/lingshan/` 下的 `.glb` 文件。
- `thumbnailUrl` 指向对应缩略图。
- `status` 为 `placeholder` 时，前端显示几何体占位。
- `status` 为 `model_ready` 时，加载真实 `.glb`。
- `status` 为 `disabled` 时，只显示地图 Marker 或缩略图，不加载 3D。
- `transform` 用于统一模型在 3D 场景里的位置、旋转和缩放。
- `lod` 用于后续区分低、中、高精度模型。

## 地图页接入方式

第一版建议不重构 `GuideMapPage` 主地图逻辑。

推荐方式：

- 在地图页右侧或底部新增 3D 预览区域。
- 选中 POI 时，把 `selectedSpotId` 或 `selectedPoiId` 传给 `Scenic3DPreview`。
- `Scenic3DPreview` 根据 `poiId` 查询 `lingshanAssetMap`。
- 如果有模型，加载 `.glb`。
- 如果没有模型，显示 `PlaceholderLandmark`。
- 3D 面板不影响腾讯地图 Marker、Polyline、InfoWindow 和路线切换。

## 组件职责说明

- `Scenic3DPreview`：3D 画布容器，接收 `selectedPoiId`，负责场景、灯光、相机和资产选择。
- `LandmarkModel`：加载真实 `.glb` 模型，并应用 transform。
- `PlaceholderLandmark`：没有真实模型时显示低模占位，保证交互链路可验证。
- `RouteRibbon3D`：后续显示路线金线、墨线或导览路径带。
- `Scenic3DControls`：控制视角重置、相机模式、模型显示开关等。

## 分阶段实施路线

- 阶段 A：只装依赖，新增空 3D 预览组件，确保 `npm run build` 通过。
- 阶段 B：新增 placeholder 几何体，不接真实 `.glb`。
- 阶段 C：接入 `lingshanAssetMap`，按 `poiId` 显示不同占位模型。
- 阶段 D：放入 Blender 导出的 `.glb`，逐个替换 placeholder。
- 阶段 E：与地图选中点联动。
- 阶段 F：增加路线 Ribbon、雾效、水面、山体等场景氛围。

## 性能和工程注意事项

- 3D 组件使用 `React.lazy` 或路由级懒加载。
- 控制 `.glb` 模型体积，必要时使用压缩和 LOD。
- 缩略图优先加载，模型按需加载。
- 移动端低性能设备可关闭 3D 面板。
- 3D 不承担真实导航判断，真实导航仍以腾讯地图和 `navLocation` 为准。
- 不要把腾讯地图截图作为贴图。
- 不要把 Live2D 数字人改成 3D 数字人。
- 先验证场景加载、相机、交互和构建稳定性，再逐步增加视觉效果。

## 第一轮代码改造建议

后续真正动代码时，第一轮只做：

- 安装 `three`、`@react-three/fiber`、`@react-three/drei`、`@types/three`。
- 新增 `Scenic3DPreview.tsx`。
- 新增 `PlaceholderLandmark.tsx`。
- 新增 `lingshanAssetMap.ts`，先使用占位数据。
- 在 `GuideMapPage.tsx` 中以可关闭面板形式接入。
- 不加载真实 `.glb`。
- `npm run build` 必须通过。
