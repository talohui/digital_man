# 灵山胜境首个 GLB 模型接入与验收指南

## 1. 目的

当前前端已经具备 GLB 加载能力：

- `ScenicModel` 可在 `modelUrl` 存在时加载 GLB。
- `/three-preview` 可用于单个景点模型预览。
- `/scenic-3d-map` 可在沉浸式 3D 地图中展示核心地标模型。
- 模型缺失或加载失败时，会 fallback 到 `PlaceholderLandmark`。

后续只需要准备模型文件，并在 `src/data/scenic3d/lingshanAssetMap.ts` 中配置 `modelUrl`。本文档用于规范首个模型接入流程，避免比例、朝向、原点、体积、路径和 fallback 等问题。

## 2. 推荐首个接入模型

建议优先接入：

- 灵山大佛：`giant_buddha`

原因：

- 灵山大佛是灵山胜境最核心的视觉地标。
- 替换 placeholder 后，对 `/three-preview` 和 `/scenic-3d-map` 的视觉提升最明显。
- 作为首个验证对象，能覆盖模型路径、加载、比例、朝向、原点、高亮、标签关系和 fallback 等关键流程。

备选模型：

- 梵宫：`fan_gong`
- 九龙灌浴：`jiulong_guanyu`
- 五印坛城：`wuyin_tancheng`

## 3. 推荐目录结构

模型建议放在：

```text
public/models/lingshan/landmarks/
  lingshan_buddha.glb
  fan_gong.glb
  jiulong_guanyu.glb
  wuyin_tancheng.glb
```

缩略图建议放在：

```text
public/models/lingshan/thumbnails/
  lingshan_buddha.webp
  fan_gong.webp
  jiulong_guanyu.webp
  wuyin_tancheng.webp
```

说明：

- `public` 目录下资源可通过 `/models/...` 路径访问。
- 不要把模型放到 `src` 里，避免被前端源码打包流程错误处理。
- 不要提交未压缩的大模型、原始工程文件或临时导出文件。
- 大体积模型应先压缩、减面、压缩贴图，再进入仓库。

## 4. 模型制作规范

- 格式：优先使用 GLB。
- 单位：米。
- 原点：模型底部中心。
- 朝向：正面朝向统一，例如面向 Three.js 场景前方。
- 比例：第一版先做相对比例，不追求真实 1:1。
- 面数：第一版尽量低面数，优先保证移动端可加载。
- 贴图：推荐 `webp` / `png`，控制贴图尺寸。
- 材质：尽量少材质，避免复杂 shader。
- 文件大小：第一版核心模型建议小于 3MB，最好小于 1MB。
- 风格：低模、庄重、符号化，不做娱乐化佛教形象。

## 5. Blender 导出注意事项

导出前建议检查：

- Apply Transform。
- 设置正确原点，推荐底部中心。
- 检查模型比例，避免导出后过大或过小。
- 删除隐藏对象、相机、灯光、参考图等无关对象。
- 合并材质或减少材质数量。
- 压缩贴图，并确认贴图被正确打包或引用。
- 导出 GLB。
- 在本地 glTF Viewer 中预览。
- 确认模型没有异常旋转、倒置、巨大偏移或材质丢失。

## 6. lingshanAssetMap 配置方式

示例配置如下，后续接入时按实际模型文件修改，不要在本阶段直接改代码：

```ts
{
  poiId: 'giant_buddha',
  modelUrl: '/models/lingshan/landmarks/lingshan_buddha.glb',
  thumbnailUrl: '/models/lingshan/thumbnails/lingshan_buddha.webp',
  status: 'model_ready',
  transform: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  },
  note: '首个 GLB 接入验证模型。'
}
```

配置说明：

- `modelUrl` 必须以 `/models/...` 开头。
- `status` 从 `placeholder` 改为 `model_ready`。
- `thumbnailUrl` 可选，用于后续资产管理或预览卡片。
- `transform.position` 用于微调模型位置。
- `transform.rotation` 用于微调模型朝向。
- `transform.scale` 用于微调模型大小。
- 如果模型加载失败，`ScenicModel` 会 fallback 到 `PlaceholderLandmark`。

## 7. 验收流程

1. 把 GLB 放到 `public/models/lingshan/landmarks/`。
2. 在 `lingshanAssetMap` 中配置对应 `modelUrl`。
3. 运行 `npm run dev`。
4. 打开 `/three-preview`。
5. 选择对应 `poiId`。
6. 检查模型是否加载。
7. 检查模型是否存在以下问题：
   - 太大
   - 太小
   - 倒置
   - 方向错误
   - 悬空
   - 埋入地面
   - 材质丢失
   - 贴图丢失
   - 页面报错
8. 打开 `/scenic-3d-map`。
9. 检查模型在 3D 地图中的位置、比例和标签关系。
10. 如果不合适，先调整 `transform`，不要立即改模型源文件。
11. 如果 `transform` 无法解决，再回 Blender 修模型。

## 8. 验收表格

| 检查项 | 通过标准 | 结果 | 备注 |
| --- | --- | --- | --- |
| `/three-preview` 能加载 | 选择对应 `poiId` 后模型出现 |  |  |
| `/scenic-3d-map` 能加载 | 3D 地图核心地标显示 GLB |  |  |
| fallback 正常 | 模型路径错误时回退 placeholder，不白屏 |  |  |
| 控制台无红色错误 | 无持续模型加载或渲染错误 |  |  |
| 模型比例合理 | 与其它地标、节点比例协调 |  |  |
| 模型原点正确 | 放置后不悬空、不巨大偏移 |  |  |
| 模型方向正确 | 正面朝向符合场景约定 |  |  |
| 模型贴地 | 底部与地面自然接触 |  |  |
| 标签不遮挡 | 景点标签不严重遮挡主体 |  |  |
| 选中高亮仍可用 | active 状态仍可识别 |  |  |
| 移动端性能可接受 | 手机端加载、旋转、缩放不卡顿 |  |  |

## 9. 常见问题与处理

- 404 找不到模型：检查文件是否在 `public/models/...` 下，检查 `modelUrl` 是否以 `/models/...` 开头。
- 模型过大：压缩贴图、减少面数、删除隐藏对象和无关材质。
- 模型太大 / 太小：优先调整 `transform.scale`。
- 模型方向错误：先调整 `transform.rotation`，如果旋转关系混乱，再回 Blender 修正。
- 模型悬空 / 埋地：调整 `transform.position`，必要时回 Blender 修正原点。
- 材质丢失：检查 GLB 是否内嵌贴图，或贴图路径是否被正确打包。
- 页面白屏：检查 `useGLTF` 报错，确认 fallback 是否生效，确认不是模型资源损坏。
- 加载慢：压缩模型；后续可考虑 Draco / KTX2 等优化，但首版先控制模型体积。

## 10. 不建议现在做的事

- 不要一次性接入所有模型。
- 不要提交几十 MB 的大模型。
- 不要直接使用高面数重建模型。
- 不要把整个景区完整建模。
- 不要让模型替代真实导航。
- 不要改 `/map` 路线逻辑来适配模型。

## 11. 下一步建议

- 阶段五十二：接入第一个轻量 GLB 模型，例如灵山大佛。
- 阶段五十三：修正模型 `transform`。
- 阶段五十四：为核心 4 个地标批量接入模型。
- 阶段五十五：模型体积压缩与移动端性能测试。
