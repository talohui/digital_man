# /map-3d-guide-c 优化日志

## 1. 文档目的

本文记录最近几轮 `/map-3d-guide-c` 的工程优化和调试能力整理，重点覆盖：

- `debugGarden` 5 步园林配置工作台。
- 第一阶段加载优化：`debugGarden` 拆分与 GLB 分批创建。
- 第二阶段加载优化：路由级拆包与重资源隔离。
- 第三阶段准备：`debugPerf=1` 运行时加载诊断。

本文只记录当前仓库中已经能从源码、git diff、git log 或构建输出确认的能力。

## 2. 当前背景

`/map-3d-guide-c` 是 3D 园林资产版真实地图导览原型。它以腾讯地图 Web JS API GL 为坐标底座，通过地图锚定的路线、POI、模拟定位、重规划线、GLB 模型和园林资产形成导览表达。

C 版已经从早期“工程调试面板 + 树群撒点”推进到：

- Kenney Nature Kit 青绿材质树群资产。
- 航拍参考的中轴林带和大佛背后山林布局。
- debugGarden 图形化园林编辑器。
- 普通页与调试页分离。
- 路由级拆包和运行时诊断准备。

## 3. debugGarden 配置工作台优化

### 背景问题

早期 `debugGarden` 偏工程调试面板，字段多、入口散，容易遮挡地图和导览信息。用户需要的是可以按流程完成园林校准的工具，而不是长期暴露的游客 UI。

### 改动摘要

当前 `/map-3d-guide-c?debugGarden=1` 已改为 5 步向导式园林配置工作台：

1. 禁放区。
2. 放树区。
3. 生成预览。
4. 应用 GLB。
5. 导出配置。

编辑页会隐藏普通导览 UI，只保留：

- 3D 园林导览牌。
- 3D 视角切换卡片。
- `debugGarden` 面板。
- 返回普通页按钮。

地图编辑显示逻辑已收敛：

- zone / keepout 默认在地图上不显示边界和底色。
- 点击某个 zone / keepout 后才显示边框和可拖拽顶点。
- 选中区域仍不显示大面积底色。
- 支持双击地图完成绘制。
- 资产点默认显示 GLB 模型，但不显示编辑点。
- 选中资产点后才显示编辑标记。
- 资产点位置通过地图拖动修改。
- `scale`、`height`、`rotation` / `yaw` 在面板中修改。
- 资产修改必须点击“保存当前资产修改”才写入本地草稿。
- zone / keepout / asset 删除均有二次确认。
- 导出支持“复制完整配置”和“仅复制 assets”。

### 涉及文件

- `src/pages/Map3DGuidePage.tsx`
- `src/components/map3d/GardenDebugWizard.tsx`
- `docs/map-3d-guide-garden-editor-usage.md`

### 验收结果

- `/map-3d-guide-c` 普通页不显示编辑器。
- `/map-3d-guide-c?debugGarden=1` 显示 5 步工作台。
- 编辑模式下 zone / keepout 不再用大面积色块覆盖地图。
- 单个资产拖拽后需保存才写入草稿。
- 可以复制完整 TS 配置或只复制 assets。

### 后续注意事项

`debugGarden` 结果应最终固化到源码配置，不应依赖浏览器 `localStorage` 作为正式数据来源。

## 4. 第一阶段加载优化：debugGarden 拆分与 GLB 分批加载

### 背景问题

普通 `/map-3d-guide-c` 不需要加载完整园林编辑器。GLB 树群一次性创建过多也会影响首屏响应和地图、路线、POI 的可见时机。

### 改动摘要

当前代码已将 `debugGarden` 主体拆成独立 chunk：

- `Map3DGuidePage.tsx` 使用 `React.lazy` + `Suspense` 条件加载 `GardenDebugWizard`。
- 普通 `/map-3d-guide-c` 不直接加载 `GardenDebugWizard` 编辑器主体代码。
- 只有 `/map-3d-guide-c?debugGarden=1` 才加载工作台。

GLB 园林资产 overlay 生命周期已拆到：

- `src/hooks/useGardenAssetOverlays.ts`

该 hook 负责：

- 筛选当前可见 GLB 园林资产。
- 按 `priority` 和原始顺序排序。
- 分批创建 `TMap.model.GLTFModel`。
- 当前批大小为 `16`。
- 批次之间使用 `requestAnimationFrame` 和短延迟，让地图、路线、POI 和控制 UI 先完成绘制。
- 汇报 `createdCount`、`visibleCount`、`loadedIds`、`errorIds`、`assetUrls` 等轻量状态。

### 涉及文件

- `src/pages/Map3DGuidePage.tsx`
- `src/components/map3d/GardenDebugWizard.tsx`
- `src/hooks/useGardenAssetOverlays.ts`

### 验收结果

- 普通页面地图、路线、POI、导览牌、相机卡保持不变。
- `debugGarden` 页功能保持不变。
- 普通页出现轻量园林资产加载进度提示，但不显示编辑器。
- 单个 GLB 创建失败不会阻断其它资产。

### 后续注意事项

当前统计和进度偏向 overlay 创建过程。腾讯 `GLTFModel` 网络下载和 GPU 完整可见时机如果需要更精细判断，需要后续结合浏览器资源时序或腾讯事件能力再做专项分析。

## 5. 第二阶段加载优化：路由级拆包与重资源隔离

### 背景问题

优化前，应用入口包约 `2.72 MB`。普通 `/map-3d-guide-c` 首屏不应加载后台、Live2D、Cubism、ScenicModel、Scenic3DMapPage 等无关重资源。

### 改动摘要

当前代码已进行路由级拆包和重资源隔离：

- 页面路由级 `lazy loading`。
- 后台页按需加载。
- 移动端壳按需加载。
- AntD Provider 按需隔离到 `AppProviders`。
- PostHog 按需加载。
- Fay / Live2D 连接管理按需加载到 `ChatConnectionManager`。
- Cubism Core 从 `index.html` 前置脚本移除，改为通过 `loadCubismCore` 按需加载。

普通 `/map-3d-guide-c` 不再加载：

- `GardenDebugWizard`。
- `ScenicModel`。
- `Scenic3DMapPage`。
- 后台 chunk。
- Cubism Core / Cubism chunk。

`/map-3d-guide-c?debugGarden=1` 会加载 `GardenDebugWizard`，但仍不加载 `ScenicModel`。

### 涉及文件

- `src/App.tsx`
- `src/main.tsx`
- `src/lib/analytics.ts`
- `src/lib/loadCubismCore.ts`
- `src/components/AppProviders.tsx`
- `src/components/ChatConnectionManager.tsx`
- `src/components/Live2DStage.tsx`
- `src/components/admin/AdminLive2DPreview.tsx`
- `index.html`

### 验收结果

最新生产构建输出显示：

- 入口 `index` chunk 约 `188.09 kB`，gzip 约 `61.68 kB`。
- `GardenDebugWizard` 独立 chunk 约 `17.93 kB`，gzip 约 `3.98 kB`。
- `Map3DGuidePage` 独立 chunk 约 `126.28 kB`，gzip 约 `37.38 kB`。

剩余 Vite chunk warning 主要来自：

- `ScenicModel`：约 `963.09 kB`。
- `AdminDashboard`：约 `916.33 kB`。
- `admin` vendor：约 `601.51 kB`。

这些 warning 仍需要后续管理，但当前不是 `/map-3d-guide-c` 首屏主要问题。

### 后续注意事项

后续如果接入更多核心景点 GLB，应继续保持 `/map-3d-guide-c` 普通页只加载当前必要资源，避免把模型预览页、后台页或 Live2D 相关资源重新拉回首屏。

## 6. 第三阶段准备：运行时加载诊断

### 当前状态

当前代码已实现 `debugPerf=1` 运行时诊断框架：

```text
/map-3d-guide-c?debugPerf=1
/map-3d-guide-c?debugGarden=1&debugPerf=1
```

诊断信息包括：

- `mapInitMs`
- `routeDrawMs`
- `poiInitMs`
- GLB 总数 / 已创建 / 失败数
- 第一批 GLB 耗时
- 全部 GLB 完成耗时
- batch 列表
- 最慢 GLB asset
- 失败 asset 列表
- 重复 `assetUrl` 列表

诊断面板支持：

- 折叠 / 展开。
- 复制诊断 JSON。
- 清空当前诊断记录。

如果浏览器 Clipboard API 不可用，面板会显示手动复制 JSON 文本框。

### 涉及文件

- `src/lib/map3dPerf.ts`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `src/hooks/useGardenAssetOverlays.ts`
- `src/pages/Map3DGuidePage.tsx`

### 验收结果

- 普通 `/map-3d-guide-c` 默认不显示诊断面板。
- `/map-3d-guide-c?debugPerf=1` 显示性能诊断面板。
- `/map-3d-guide-c?debugGarden=1&debugPerf=1` 可同时显示工作台和诊断面板。
- 诊断记录当前统计 `TMap.model.GLTFModel` overlay 创建耗时，不等同于网络层 GLB 完整下载耗时。

### 后续注意事项

下一步上传核心景点 GLB 前，应先用 `debugPerf=1` 记录现有树群加载基线。接入每个新模型后，再比较 map 初始化、路线/POI 绘制、GLB 批次和失败列表，避免只凭肉眼判断性能。

## 7. 核心景点 GLB 正式配置接入

### 背景问题

此前 `/map-3d-guide-c` 的 GLB Beta 只加载单个灵山大佛模型，不能验证多个核心景点模型在腾讯地图坐标底座上的加载顺序、失败隔离和调试诊断。用户已手动将 11 个核心景点 GLB 移动到：

```text
public/models/lingshan/landmarks/
```

本轮目标是把这些文件作为 public URL 字符串接入配置，不通过 TypeScript import 打进 JS chunk。

### 改动摘要

- `giant_buddha` 的模型 URL 从旧 Meshy v1 切换为 `/models/lingshan/landmarks/lingshan-buddha-v2.glb`。
- 旧路径 `/models/lingshan/landmarks/lingshan_buddha_meshy_v1.glb` 在配置说明中保留，便于回退。
- 新增梵宫、百子戏弥勒、佛手广场、菩提大道、胜境广场、三圣殿、祥符禅寺、五印坛城、曼飞龙塔、佛前广场等模型配置。
- `/map-3d-guide-c` 的 GLB Beta 从单模型加载改为配置驱动的多地标模型加载。
- 地标模型按 `priority` 分批创建，避免 11 个 GLB 同时阻塞地图、路线和 POI 首屏。
- `debugPerf=1` 扩展记录 landmark GLB 的 id、name、modelUrl、status、durationMs 和 error。

### 锚定表

| 模型 | POI / anchor | modelUrl | 优先级 | 备注 |
| --- | --- | --- | --- | --- |
| 灵山大佛 | `giant_buddha` / 灵山大佛 | `/models/lingshan/landmarks/lingshan-buddha-v2.glb` | high | 已替换为新版，仍需校准 |
| 梵宫 | `fan_gong` / 梵宫 | `/models/lingshan/landmarks/fan-gong.glb` | high | 仍需校准 |
| 五印坛城 | `wuyin_tancheng` / 五印坛城 | `/models/lingshan/landmarks/wuyin-mandala.glb` | high | 仍需校准 |
| 佛手广场 | `foshou_square` / 佛手广场 | `/models/lingshan/landmarks/buddha-hand-plaza.glb` | high | 仍需校准 |
| 祥符禅寺 | `xiangfu_temple` / 祥符禅寺 | `/models/lingshan/landmarks/xiangfu-temple.glb` | high | 仍需校准 |
| 佛前广场 | `foqian_square` / 佛前广场 | `/models/lingshan/landmarks/buddha-front-plaza.glb` | high | 仍需校准 |
| 百子戏弥勒 | `baizi_mile` / 百子戏弥勒 | `/models/lingshan/landmarks/baizi-milefo.glb` | medium | 仍需校准 |
| 菩提大道 | `puti_avenue` / 菩提大道 | `/models/lingshan/landmarks/bodhi-avenue.glb` | medium | 文件体积较大，后续需压缩 |
| 胜境广场 | `shengjing_square` / 胜境广场 | `/models/lingshan/landmarks/shengjing-plaza.glb` | medium | 仍需校准 |
| 三圣殿 | `sansheng_hall` / 三圣殿 | `/models/lingshan/landmarks/sansheng-hall.glb` | medium | 用户口径“三胜殿”按现有 POI“三圣殿”锚定 |
| 曼飞龙塔 | `manfeilong_tower` / 曼飞龙塔 | `/models/lingshan/landmarks/manlong-flying-tower.glb` | medium | 文件名使用 manlong，POI 使用现有 manfeilong |

### 涉及文件

- `src/data/lingshanMapModelOverlays.ts`
- `src/pages/Map3DGuidePage.tsx`
- `src/lib/map3dPerf.ts`
- `src/components/map3d/Map3DPerfPanel.tsx`

### 验收结果

- `npm run build` 通过。
- 地标 GLB 仍通过 `/models/...` public URL 加载，没有进入 JS chunk。
- 普通 `/map-3d-guide-c` 默认不加载地标 GLB；打开“显示 3D 景点模型 Beta”后才按优先级分批创建。
- `/map-3d-guide-c?debugPerf=1` 可显示地标 GLB 的加载记录。

### 后续注意事项

当前只是初始锚定和保守 scale / height / rotation 配置，不代表最终校准。后续应逐个打开 GLB Beta，借助 debugPerf 和浏览器观察校准每个模型的 `scale`、`height`、`rotation`，并优先压缩体积较大的 `bodhi-avenue.glb`、`xiangfu-temple.glb`、`sansheng-hall.glb` 等文件。

## 8. Landmark GLB Inspector 单体加载检查器

### 背景问题

11 个核心地标 raw GLB 总体积约 1.1GB，不能在调试阶段或游客端默认一次性加载。上一阶段已完成配置接入，但如果继续使用“一键 GLB Beta”加载全部地标，会让后续压缩和校准难以定位单个模型问题。

### 改动摘要

本阶段新增 `Landmark GLB Inspector`，仅在以下入口显示：

```text
/map-3d-guide-c?debugPerf=1
/map-3d-guide-c?debugGarden=1&debugPerf=1
```

Inspector 复用 `src/data/lingshanMapModelOverlays.ts` 的配置，不维护第二份地标清单。每个地标支持：

- 单独加载。
- 单独卸载。
- 聚焦到对应 POI / anchor。
- 复制该地标诊断 JSON。

普通 `/map-3d-guide-c` 默认不显示 Inspector，也不会默认加载 11 个 raw 地标模型。

### 涉及文件

- `src/hooks/useLandmarkModelInspector.ts`
- `src/components/map3d/LandmarkGLBInspector.tsx`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `src/pages/Map3DGuidePage.tsx`
- `src/lib/map3dPerf.ts`
- `src/data/lingshanMapModelOverlays.ts`

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

`debugPerf` 的“复制诊断 JSON”会同时包含 `landmarkInspector` 当前状态，便于记录未加载、已加载、失败和已卸载状态。

### 命名兼容

现有 POI 仍使用 `manfeilong_tower` 作为锚点，Inspector 中统一显示为“曼龙飞塔 / `manlong_flying_tower`”。这样不破坏现有 POI 数据语义，也满足模型文件 `manlong-flying-tower.glb` 的调试命名。

### 后续注意事项

当前 Inspector 只服务 raw GLB 单体检查，不是游客端最终加载策略。后续应引入：

- optimized / runtime GLB。
- proxy 占位模型。
- 标准版分批加载。
- 点击后加载高质量版。

在完成压缩和校准前，不应让普通游客页默认全量加载 11 个 raw 地标模型。

## 9. Landmark Calibration Panel 地标模型校准面板

### 背景问题

11 个核心景点 raw GLB 已可通过 `Landmark GLB Inspector` 单体加载和卸载，但实测模型普遍需要人工校准：

- scale 偏小。
- height / Z 偏移不准。
- 水平朝向需要 `rotationY` 微调。
- 部分模型需要轻微经纬度 offset，不能直接修改 POI 坐标。

### 改动摘要

`Landmark GLB Inspector` 增加地标模型校准面板。点击某个地标的“校准”后，会自动聚焦并尝试加载该模型，然后显示调参区。

支持字段：

- `scale`
- `height`
- `rotationY`
- `lngOffset`
- `latOffset`

坐标微调用 offset 表达，不修改原始 POI 坐标。普通 `/map-3d-guide-c` 不读取或应用校准草稿，只有 `debugPerf=1` 调试态使用。

### 本地草稿

校准草稿保存到浏览器 localStorage：

```text
lingshan_landmark_calibration_draft_v1
```

草稿结构按地标 id 存储：

```ts
{
  [landmarkId]: {
    scale?: number
    height?: number
    rotationY?: number
    lngOffset?: number
    latOffset?: number
    updatedAt: string
  }
}
```

进入 `debugPerf=1` 后，Inspector 会读取草稿并优先用于后续单体加载。普通游客页面不应用该草稿，避免本地调试状态污染正式展示。

### 实时预览

调参时优先调用腾讯 `GLTFModel` 覆盖物的：

- `setScale`
- `setRotation`
- `setPosition`

如果当前覆盖物缺少这些方法或调用失败，则只重建当前地标模型 overlay，不重载全部地标，也不影响树群、路线或 POI。实时预览做了短延迟处理，避免输入框连续输入时频繁重建。

### 导出能力

校准面板支持：

- 保存当前校准到本地草稿。
- 重置当前模型校准。
- 清空全部地标校准草稿。
- 复制当前模型配置 patch。
- 复制全部地标校准 patch。

复制出的 patch 只用于后续人工确认和源码固化，不会自动写回 `lingshanMapModelOverlays.ts`。

### 涉及文件

- `src/hooks/useLandmarkModelInspector.ts`
- `src/components/map3d/LandmarkGLBInspector.tsx`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `src/lib/map3dPerf.ts`

### 后续注意事项

推荐流程为：

1. 打开 `/map-3d-guide-c?debugPerf=1`。
2. 单独加载一个地标 GLB。
3. 调整 `scale / height / rotationY / offset`。
4. 保存到本地草稿。
5. 复制 patch。
6. 人工确认后再固化到 `lingshanMapModelOverlays.ts`。

不要在未压缩和未校准前让游客端默认加载全部 raw GLB。

## 10. 三个核心地标校准 patch 固化与白模冲突记录

### 背景问题

在 `Landmark GLB Inspector` 中人工校准后，灵山大佛、五印坛城、梵宫三个核心地标已经得到可继续调试的初始参数。与此同时，梵宫等建筑类 GLB 会与腾讯地图自带 3D 白模建筑发生空间重叠。

重叠并不是 GLB 文件本身的问题，而是腾讯底图仍在渲染 3D 建筑白模。自定义 GLB 是叠加覆盖物，不会替换或删除底图中的白模建筑。

### 已固化校准

已将以下人工确认 patch 固化到 `src/data/lingshanMapModelOverlays.ts`：

| 地标 | scale | height | rotationY | lngOffset | latOffset |
| --- | ---: | ---: | ---: | ---: | ---: |
| 灵山大佛 | 380 | 73 | 15 | 0 | 0.00005 |
| 五印坛城 | 420 | 32 | 9 | -0.00001 | 0 |
| 梵宫 | 900 | 48 | 9 | -0.00009 | 0.00101 |

灵山大佛继续使用新版：

```text
/models/lingshan/landmarks/lingshan-buddha-v2.glb
```

旧灵山大佛模型仍保留在 `public/models/lingshan/landmarks/`，可用于回退说明。

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

`Landmark GLB Inspector` 对 `fan_gong` 增加轻量备注：如果出现腾讯白模建筑穿插，不要全局关闭白模，也不要通过异常 `height / scale` 硬遮挡；应在 `style1` 中弱化白模视觉，并后续制作真正 3D 场地底座 / 低模场景。polygon footprint mask 仅作为高级实验保留。

### 梵宫 footprint mask 实验结论

梵宫配置保留 `footprintMask` 草稿字段，但该能力已从推荐方案降级为高级实验功能。`/map-3d-guide-c?debugPerf=1` 下进入 `fan_gong` 校准时，仍可在 `Landmark GLB Inspector` 中展开“高级实验：梵宫 polygon footprint mask”进行验证，但默认关闭且不再作为梵宫最终处理方向。

尝试过的方案：

- `solid` polygon mask：实心矩形会像大贴片一样压在梵宫下面。
- `ring` polygon mask：中间留空后不再压住主体，但周边铺装仍然突兀。

结论：

- `TMap.MultiPolygon` 更适合地图区域标记，不适合作为核心建筑的自然 3D 底座。
- polygon footprint mask 不作为梵宫最终方案。
- 默认配置改为 `enabled: false`、`mode: 'none'`。
- 实验代码保留，因为以后某些广场类资产可能仍可用于区域提示。
- 草稿仍可保存到 localStorage，也可复制 `fan_gong footprint mask patch`，但不建议固化为梵宫正式效果。

后续推荐方向：

1. 在腾讯 `style1` 中弱化 3D 白模建筑的颜色、阴影、对比度，但不全局关闭。
2. 为梵宫制作真正的 3D 低矮场地底座或低模场景，使其与 GLB 统一材质和深度关系。
3. 或在梵宫 GLB 模型本身中整合场地 / 底座。

### 注意事项

本轮只固化已确认参数，不做模型压缩、不替换 GLB、不修改 POI 坐标、不改变路线或树群生成逻辑。`debugPerf` 本地校准草稿仍可继续覆盖这些默认值，方便后续微调。

## 11. 第二批核心地标校准 patch 固化与祥符禅寺白模冲突记录

### 背景问题

在继续使用 `Landmark GLB Inspector` 进行单体地标校准后，佛手广场、佛前广场、祥符禅寺三处模型已经得到可作为默认展示基线的人工校准参数。与此同时，祥符禅寺作为建筑类核心地标，也出现了与梵宫类似的腾讯底图 3D 白模建筑重叠或穿插问题。

这类问题不是单纯通过 `scale / height` 能彻底解决的模型校准问题。自定义 GLB 是叠加覆盖物，不能直接替换或删除腾讯底图中的白模建筑。

### 已固化校准

已将第二批人工确认 patch 固化到 `src/data/lingshanMapModelOverlays.ts`：

| 地标 | scale | height | rotationY | lngOffset | latOffset |
| --- | ---: | ---: | ---: | ---: | ---: |
| 佛手广场 | 194 | 9 | 30 | -0.00017 | -0.00017 |
| 祥符禅寺 | 618 | 12 | 31 | -0.00006 | 0.00009 |
| 佛前广场 | 103 | 3 | 28 | -0.00004 | 0.00005 |

这些参数只作为当前默认基线。`/map-3d-guide-c?debugPerf=1` 下的 localStorage calibration draft 仍可覆盖默认值，便于后续继续微调。

### 祥符禅寺白模冲突

人工观察发现：

- `xiangfu_temple` 属于建筑类核心地标。
- 祥符禅寺 GLB 可能与腾讯地图原生 3D 白模建筑发生视觉重叠或穿插。
- 这与梵宫白模冲突属于同一类问题。
- 不建议通过异常放大模型、抬高模型或 polygon mask 硬遮挡。

当前没有为祥符禅寺新增 `footprintMask`，也没有复用梵宫 polygon mask。梵宫 solid / ring polygon mask 实验已证明贴片感明显，不适合作为建筑主体最终方案。

### 后续统一方向

建筑类核心地标的白模冲突后续应统一进入“弱化腾讯白模 + 真正 3D 底座 / 低模场景”任务：

1. 不全局关闭腾讯 3D 白模建筑。
2. 非核心白模尽量在 `style1` 中弱化为背景，保留景区空间密度。
3. 核心建筑后续制作真正的 3D 低矮场地底座 / 低模场景。
4. 如果模型制作条件允许，也可在 GLB 本身整合场地、铺装和底座。

### 注意事项

本轮不修改 GLB 文件、不压缩模型、不修改路线、POI 数据语义、树群生成算法或 debugGarden 5 步工作台。旧灵山大佛模型仍保留，已固化的灵山大佛、五印坛城、梵宫参数不受影响。

### npm run build 结果

`npm run build` 通过。当前输出中 `Map3DGuidePage` chunk 约 `156.55 kB`，gzip 约 `45.59 kB`。Vite 仍提示部分既有 chunk 超过 500 kB，主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor；本阶段没有上传、替换、压缩或通过 TypeScript import 引入任何 GLB 文件。

## 12. 第三批核心地标校准 patch 固化与建筑底座方向记录

### 背景问题

继续通过 `Landmark GLB Inspector` 人工校准后，梵宫得到新的更合适参数；曼龙飞塔、三圣殿、百子戏弥勒、胜境广场也得到可作为默认展示基线的初始校准 patch。本轮只固化人工确认参数，不制作或替换模型，也不改变游客端加载策略。

同时，祥符禅寺仍存在建筑类白模冲突风险。它的位置、scale 和高度已经初步校准，但仍需要后续制作真正的 3D 场地底座 / 低模底座，而不是使用 polygon mask 硬盖。

### 已固化校准

已将以下最新人工确认 patch 固化到 `src/data/lingshanMapModelOverlays.ts`：

| 地标 | scale | height | rotationY | lngOffset | latOffset |
| --- | ---: | ---: | ---: | ---: | ---: |
| 梵宫 | 1012 | 50 | 10 | -0.00004 | 0.0006 |
| 曼龙飞塔 | 207.5 | 35 | 15 | -0.00005 | -0.00006 |
| 三圣殿 | 763 | 46 | 53 | 0.00011 | -0.00021 |
| 百子戏弥勒 | 145 | 9 | 20 | 0.00009 | 0 |
| 胜境广场 | 150 | 8 | 30 | 0.00001 | 0 |

梵宫的 `footprintMask` 字段保留为高级实验配置，但默认仍为：

```ts
enabled: false
mode: 'none'
```

`/map-3d-guide-c?debugPerf=1` 下的 localStorage calibration draft 仍可覆盖这些默认值，便于后续继续微调。

### 曼龙飞塔 id 兼容

模型文件与用户调试口径使用“曼龙飞塔 / `manlong_flying_tower`”。现有 POI anchor 仍为 `manfeilong_tower`，因此配置中继续保留：

- `poiId: 'manfeilong_tower'`
- `inspectorId: 'manlong_flying_tower'`

这样不会改变 POI 数据语义，也能让 Inspector 和导出 patch 使用用户当前口径。

### 祥符禅寺底座方向

祥符禅寺不新增 polygon footprint mask，也不复用梵宫 polygon mask。当前结论保持：

- 祥符禅寺当前位置、scale、高度已初步校准。
- 建筑类白模冲突仍存在。
- polygon footprint mask 对建筑主体容易产生贴片感，不推荐作为最终方案。
- 后续应制作真正 3D 低矮场地底座 / 低模场景，或将底座整合进 GLB。
- 腾讯 `style1` 中的非核心白模仍应尽量弱化为背景，但不全局关闭白模。

### 注意事项

本轮没有加载或校准菩提大道，没有压缩 GLB，没有制作 3D 底座，没有修改 `style1`，也没有恢复游客端 GLB 一键全量加载。

### npm run build 结果

`npm run build` 通过。当前输出中 `Map3DGuidePage` chunk 约 `156.55 kB`，gzip 约 `45.59 kB`。Vite 仍提示部分既有 chunk 超过 500 kB，主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor；本阶段没有上传、替换、压缩或通过 TypeScript import 引入任何 GLB 文件。

## safe-v2 runtime GLB 切换：五印坛城与梵宫

### 背景问题

raw 地标 GLB 体积较大，影响后续游客端按需加载策略。第一轮压缩试验中 safe 版本可打开，Draco 版本当前打不开，因此运行时优先采用 safe-compatible 路线。

### 改动摘要

- 五印坛城正式 `modelUrl` 切换到 `/models/lingshan/optimized/wuyin-mandala.safe-v2.glb`。
- 梵宫正式 `modelUrl` 切换到 `/models/lingshan/optimized/fan-gong.safe-v2.glb`。
- 保留原始 raw 路径用于本地回退和 `debugPerf` 对比测试。
- `Landmark GLB Inspector` 保留 raw / safe-v1 / safe-v2 版本切换，不加入 Draco。
- safe-v1 / draco 试验产物不提交，raw GLB 继续精确忽略。

### 涉及文件

- `src/data/lingshanMapModelOverlays.ts`
- `src/data/lingshanOptimizedModelCandidates.ts`
- `src/hooks/useLandmarkModelInspector.ts`
- `src/components/map3d/LandmarkGLBInspector.tsx`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `src/lib/map3dPerf.ts`
- `.gitignore`
- `public/models/lingshan/optimized/wuyin-mandala.safe-v2.glb`
- `public/models/lingshan/optimized/fan-gong.safe-v2.glb`

### 验收结果

人工测试确认五印坛城和梵宫 raw / safe-v1 / safe-v2 均可显示，safe-v2 材质、尺寸、朝向和卸载未发现明显问题。Draco 继续暂停，不作为腾讯地图运行时候选。菩提大道仍不处理，后续单独制定策略。

## 阶段：8 个核心地标 safe-v2 runtime 正式切换

### 背景问题

第一批 safe-v2 已在五印坛城和梵宫上验证并正式启用。随后生成了剩余 8 个核心地标的 safe-v2 候选，并通过 `/map-3d-guide-c?debugPerf=1` 人工确认可正常加载、显示和卸载。

### 改动摘要

正式切换到 safe-v2 的地标：

- 灵山大佛
- 佛手广场
- 佛前广场
- 曼龙飞塔
- 三圣殿
- 祥符禅寺
- 百子戏弥勒
- 胜境广场

当前 safe-v2 runtime 已覆盖 10 个核心地标：灵山大佛、梵宫、五印坛城、佛手广场、佛前广场、祥符禅寺、三圣殿、百子戏弥勒、曼龙飞塔、胜境广场。

### 涉及文件

- `src/data/lingshanMapModelOverlays.ts`
- `src/data/lingshanOptimizedModelCandidates.ts`
- `public/models/lingshan/optimized/*.safe-v2.glb`
- `docs/lingshan-glb-optimization-trial.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-development-log.md`

### 验收结果

- 8 个 safe-v2 已人工验证可正常加载、显示、卸载。
- 正式 `modelUrl` 已切换到 safe-v2。
- raw GLB 仍本地保留，但继续被 `.gitignore` 精确忽略。
- safe-v1 / draco 试验产物不提交。
- `fan_gong.footprintMask` 仍默认关闭。
- `xiangfu_temple` 没有新增 polygon mask。

### 后续注意事项

- 三圣殿和祥符禅寺 safe-v2 仍超过 100 MB，后续需要二次优化、拆分、低模或底座策略。
- 菩提大道仍未处理，继续单独规划。
- Draco 当前打不开，继续不作为腾讯地图运行时候选。

## 阶段：酒庄航拍 / 水墨杭州式相机体验优化

### 背景问题

`/map-3d-guide-c` 已具备腾讯真实底图、路线、POI、树群和核心地标 GLB，但默认视角和地标聚焦仍偏普通地图操作感。为了让 C 版更像“酒庄航拍 / 水墨杭州式”的沉浸导览，需要将镜头从普通平面导航视角收敛为斜俯、慢推、主轴线和地标停顿的 3D 沙盘镜头。

### 改动摘要

- 新增 `src/lib/map3dCamera.ts`，集中管理相机预设和飞行逻辑。
- 默认进入视角调整为 `overviewEstate`，以较高斜俯角展示核心园区和路线关系。
- 相机预设调整为：`overviewEstate`、`axisCruise`、`routeOverview`、`landmarkFocus`、`closeInspect`、内部跟随 `guideFollow`。
- 地标聚焦从单段跳转改为两段式：先轻微回拉，再平滑慢推靠近地标。
- `Landmark GLB Inspector` 的聚焦复用同一套相机逻辑，debugPerf 下使用更近的 `closeInspect`。
- `debugPerf` 增加 camera event 记录：preset、targetPoiId、targetLandmarkId、startedAt、finishedAt、durationMs。

### 涉及文件

- `src/lib/map3dCamera.ts`
- `src/pages/Map3DGuidePage.tsx`
- `src/hooks/useLandmarkModelInspector.ts`
- `src/lib/map3dPerf.ts`
- `src/components/map3d/Map3DPerfPanel.tsx`

### 验收结果

- `npm run build` 通过。
- 普通游客页不显示 debugPerf 面板。
- debugPerf JSON 和面板可查看最近相机事件。
- 本阶段未修改 GLB、树群算法、路线逻辑、POI 语义、Tencent key 或 `mapStyleId: 'style1'`。

### 后续注意事项

后续视觉优化仍应继续围绕腾讯底图配色、白模弱化、树群资产筛选、建筑底座和游客端加载节奏推进。本阶段只处理镜头体验，不改变资产和底图策略。

## 阶段：佛境沙盘导览第一轮特色交互

### 背景问题

上一轮已将 `/map-3d-guide-c` 的相机体验从普通地图视角调整为酒庄航拍式斜俯、慢推和地标聚焦。本轮继续沿用 `src/lib/map3dCamera.ts`，把单次相机预设升级为可播放、可中止的轻量叙事交互，让 C 版更接近“佛境沙盘导览”。

### 改动摘要

- 新增“佛境巡游”按钮，按“南门 / 胜境广场 → 佛手广场 → 梵宫 → 五印坛城 → 灵山大佛”自动飞行。
- 佛境巡游复用 `landmarkFocus` 预设，并通过两段式飞行形成轻微回拉、转向、慢推和短暂停顿。
- 新增“路线预演”按钮，基于当前历史文化路线站点顺序播放，不重算路线、不改路线数据。
- 路线预演在现有路线 layer 上叠加临时淡金 / 米白进度高亮，并让相机沿站点序列滑行。
- 新增 active landmark highlight：用 TMap marker 绘制克制的淡金呼吸环，巡游和路线预演经过地标时显示，停止后清除。
- 新增 `tourMode`、`activeTourStepId`、`activeLandmarkId` 和 `routePreviewProgressIndex` 等轻量状态，避免巡游、预演和手动相机打架。
- 用户点击地图、切换相机预设、切站点、模拟前进、模拟偏航、回到路线或再次点击播放按钮时，会中止当前巡游 / 预演。
- `debugGarden` 下不自动播放巡游，保留按钮但不影响绘制入口。
- `debugPerf` 记录 tour / route preview 事件，并在诊断面板展示最近事件。

### 设计目标

本轮目标是把 3D 导览从“地图镜头”向“佛境沙盘导览”推进，参考酒庄航拍、Apple Flyover City Tour 和 Google route preview 的轻量思路：镜头有叙事顺序，路线有预演状态，地标有克制反馈，但不引入大面积遮罩和水墨 overlay。

### 涉及文件

- `src/lib/map3dCamera.ts`
- `src/pages/Map3DGuidePage.tsx`
- `src/lib/map3dPerf.ts`
- `src/components/map3d/Map3DPerfPanel.tsx`
- `docs/map-3d-guide-c-optimization-log.md`
- `docs/map-3d-guide-performance-notes.md`
- `docs/map-3d-development-log.md`

### 边界

本轮未修改 Tencent key，未修改 `mapStyleId: 'style1'`，未修改底图配色，未修改 GLB 文件，未压缩模型，未处理菩提大道，未修改树群生成算法，未修改 POI 数据语义，未改地标 scale / height / rotationY / offset，未重新启用 `fan_gong.footprintMask`，未让游客页默认加载 raw GLB。

### 验收结果

`npm run build` 通过。由于 in-app Browser 安全策略拒绝访问 `http://127.0.0.1:5173`，本轮浏览器交互验收未能在当前工具中完成，需要人工打开 `/map-3d-guide-c`、`/map-3d-guide-c?debugPerf=1` 和 `/map-3d-guide-c?debugGarden=1&debugPerf=1` 继续确认按钮、播放、停止、呼吸光和诊断事件。

## 阶段：佛境巡游 route-following 体验修正

### 背景问题

第一版“佛境巡游”按 5 个核心地标直接 `flyTo`，虽然有停顿和呼吸光，但从一个景点直接飞到下一个景点，路线不顺，镜头节奏偏机械。用户反馈希望巡游摄像头循着当前导航路线走，而不是突然跳到下一个景点。

### 改动摘要

- “佛境巡游”改为优先沿当前页面实际显示的 `demoRoutePath` / `demoRouteGeometry.path` 采样 waypoint。
- 普通路段按路线距离间隔采样，转弯处补充采样点，避免硬切方向。
- 根据 route segment bearing 计算相机 rotation，并对 bearing 做平滑，降低突然转向。
- 普通 waypoint 使用 `guideFollow`，不再每段两段式回拉；只保留轻微 zoom / pitch 起伏，形成航拍滑行感。
- 5 个核心节点改为 route 上的兴趣点：根据地标 anchor 找到最近 route point，在接近地标前插入 slow waypoint，在地标附近插入 pause waypoint。
- pause waypoint 触发淡金呼吸光、`activeLandmarkId` 切换和 1.3-1.7 秒停顿，然后继续沿路线推进。
- 巡游时复用 route preview progress polyline，当前 progress 之前的路线会叠加淡金 / 米白高亮，强化“沿路线推进”的感觉。
- 若 route geometry 不存在，才回退到第一版 POI 序列巡游。

### debugPerf

`debugPerf` 事件扩展为可记录 route-following 细节：

- `tourWaypoint`
- `tourLandmarkPause`
- `tourCompleted`

事件包含 progress、target lat/lng、bearing、nearbyLandmarkId、camera preset、duration 和 stop reason。诊断面板中也展示 progress 和 bearing。

### 边界

本轮只改佛境巡游镜头逻辑和诊断文档。未修改底图配色，未修改 `mapStyleId: 'style1'`，未修改 GLB 文件，未压缩模型，未处理菩提大道，未修改树群生成算法，未修改 POI 数据语义，未改地标 scale / height / rotationY / offset，未重新启用 `fan_gong.footprintMask`，未让游客页默认加载 raw GLB。

### 路线预演关系

路线预演保持第一版实现：仍强调路线理解，按站点序列更快地预览路径，停顿更少。佛境巡游则强调佛境叙事、路线滑行、地标减速停顿和呼吸光。两者继续通过 `tourMode` 互斥，不会同时运行。

### 验收结果

`npm run build` 通过。浏览器交互仍需人工打开 `/map-3d-guide-c` 验证路线滑行、地标停顿、呼吸光和停止按钮。

## 阶段：佛境巡游 requestAnimationFrame 连续时间轴

### 背景问题

上一版已经改为沿 route geometry 采样 waypoint，但执行层仍是每个 waypoint 单独触发一段 `flyTo` / `easeTo`。视觉上路线方向正确，但段与段之间仍会“一顿顿前进”，缺少无人机连续飞行感。

### 改动摘要

- 新增 `requestAnimationFrame` 驱动的佛境巡游连续时间轴。
- 巡游不再为普通 waypoint 串行调用 `flyMap3DCamera`，而是每帧按当前 progress 直接更新相机 center / zoom / pitch / rotation。
- progress 以整条路线 0 → 1 推进，并用 route path 累计距离插值当前位置。
- bearing 使用路线前后窗口计算，并通过 `lerpAngle` 平滑，处理 359° 到 1° 的跨 0 度问题。
- 普通路段使用连续速度推进；接近地标通过速度曲线自然减速。
- 地标 pause 只暂停时间轴推进，不再重新触发两段式 flyTo；pause 期间保留轻微 zoom 漂移和淡金呼吸光。
- 停止巡游会 `cancelAnimationFrame`，并清除 active landmark、路线进度和计时状态。

### debugPerf

`debugPerf` 不再逐帧记录。巡游 progress 只按 10% 桶记录 `tourProgress`，地标停顿记录 `tourLandmarkPause`，结束记录 `tourCompleted`。这样可以观察路线进度、bearing 和地标停顿，又不会让诊断面板卡顿。

### 边界

本轮只修佛境巡游运动连续性。路线预演保持现有 waypoint 预演实现；底图、`style1`、Tencent key、GLB、树群、POI 语义、地标 transform 和游客端 raw GLB 加载策略均未修改。

### 验收结果

`npm run build` 通过。人工验收重点应放在 `/map-3d-guide-c` 的巡游连续性：镜头是否像无人机一样平滑沿路线滑行，转弯是否自然，地标 pause 是否不破坏整体连续感。

## 阶段：佛境巡游遨游感优化

### 背景问题

上一版已经使用 `requestAnimationFrame` 连续沿 route geometry 推进，修复了 waypoint 分段 `flyTo` 导致的明显顿挫。但实际手感仍偏“路线跟随”：相机中心过于贴合路线当前点，转向响应偏直接，地标 pause 容易像播放暂停，缺少无人机航拍 / 佛境沙盘遨游感。

### 改动摘要

- 在 `map3dCamera.ts` 集中新增佛境巡游参数，包含 duration、lookAhead、相机 smoothing、侧向偏移、地标 slowdown / pause 和 drift 参数。
- 佛境巡游目标帧新增 lookAhead 前视点：rotation / bearing 不只看当前 route segment，而是看当前点到前方路线点，提前感知转弯。
- 连续播放器加入 camera inertia smoothing：center、rotation、zoom、pitch 每帧通过 ref 状态插值，不再把目标帧直接落到相机。
- 巡游中心点加入 6-22 米级轻微侧向偏移，让镜头像从路线旁侧掠过，而不是压在线路正上方。
- 速度曲线保持 0 → 1 route progress，但开头、结尾和地标附近使用更柔和的 smoothstep 减速 / 恢复。
- 地标 pause 只暂停路线 progress，相机仍保留极轻微 center / rotation / zoom / pitch 慢漂移，形成悬停观察感。
- bearing 计算使用按路线长度自适应的前后窗口，过滤 route path 小折线造成的方向噪声。

### debugPerf

`debugPerf` 仍按 10% progress 节流记录，不逐帧刷屏。`tourStarted`、`tourProgress`、`tourLandmarkPause` 可附带 smoothingEnabled、lookAheadProgress、lateralOffsetMeters、averageFrameMs 和 estimatedFps，便于判断平滑层是否启用以及播放帧率是否稳定。

### 边界

本轮只优化佛境巡游的平稳性和遨游感。路线预演保持现有逻辑；底图配色、`style1`、Tencent key、GLB、模型压缩、菩提大道、树群算法、POI 语义、地标 transform、梵宫 footprint mask 和游客端 raw GLB 加载策略均未修改。

## 阶段：佛境巡游路线进度连续化

### 背景问题

佛境巡游镜头已经由 rAF 连续时间轴驱动，但路线进度灰线仍沿用离散 `routePreviewProgressIndex` / route point index 更新。结果是灰线推进速度和相机 progress 不完全一致，视觉上会一段段跳；当前往和返回路线在空间上重叠时，如果用最近点或离散 index 推断，还会出现已走线与原路线抢显示。

### 改动摘要

- 佛境巡游 route progress 改为跟随同一个 continuous `frame.progress`，不再从相机中心点反推最近路线点。
- 新增 `splitRouteByProgress(path, progress)`，按 route path 累计距离切分 traveled / remaining path，并在当前段内插入插值点。
- 切分严格按 route sequence 执行，不做空间去重；即使前往 / 返回路段坐标重叠，也只按 path 顺序判断已走和未走。
- 佛境巡游期间隐藏原先 route layer 中的 completed / active / preview 离散高亮，改用临时 progress overlay 绘制剩余路线和已走路线。
- progress overlay 用 ref 驱动，约 30fps 更新，不通过 React state 重建整条路线 layer。
- 停止、完成、被打断或启动路线预演时清理临时 overlay，恢复普通路线显示。

### debugPerf

新增 route progress 诊断事件：

- `routeProgressStarted`
- `routeProgressUpdate`
- `routeProgressStopped`
- `routeProgressCompleted`
- `routeProgressOverlayReset`

事件按 10% progress 节流记录，包含 source=`tourProgress`、progress、traveledPointCount、remainingPointCount、currentLat/currentLng，以及是否检测到重复/重叠 route segment。

### 边界

本轮只修佛境巡游路线进度渲染和重叠路线显示稳定性。未改相机手感主逻辑，未改底图、模型、树群、POI 语义、地标 transform 或 GLB 加载策略。

## 阶段：首屏地图黑底 ready gating

### 背景问题

进入 `/map-3d-guide-c` 时，`new TMap.Map(...)` 完成后页面会立即把 `mapStatus` 置为 ready，路线、POI、树群和 UI 也会开始显示。但腾讯底图瓦片 / 3D 底图可能还没有完成首帧稳定渲染，用户会短暂看到黑色地图 canvas，视觉上像黑色沙盘。

### 改动摘要

- 新增 map visual ready gating：map 实例创建不再等同于视觉 ready。
- 监听 `idle`、`tilesloaded`、`rendercomplete` 等腾讯地图稳定事件；同时保留 900ms 保守兜底。
- 增加 4.8s visual ready timeout 轻提示，地图加载慢时继续用浅色 curtain 兜底，不暴露黑底。
- 新增浅色佛境 loading curtain，使用米白 / 浅青绿 / 雾感样式，覆盖地图主体但不遮挡主要 UI 面板。
- 地图容器本身增加浅米绿背景，腾讯 canvas 未绘制或透明时不再露出黑色。
- visual loading 期间降低 skin / paperedge 的压暗效果，避免首屏被视觉 overlay 压黑。
- 不等待全部 GLB 树群加载，树群仍可后台分批创建；curtain 只防止底图首帧黑底暴露。

### debugPerf

新增 map visual 诊断事件：

- `mapCreated`
- `mapFirstIdle`
- `mapVisualReady`
- `mapReadyTimedOut`
- `loadingCurtainShown`
- `loadingCurtainHidden`

诊断面板显示 map visual ready time、loading curtain duration 和 timeout 状态。

### 边界

本轮未修改 Tencent key、`mapStyleId: 'style1'`、底图 style、模型、树群算法、路线数据、POI 语义或地标 transform。佛境巡游、路线预演、地标呼吸光和树群 overlay 去重逻辑保持兼容。

## 阶段：首屏启动阶段分层 gating

### 背景问题

上一轮已经加入浅色 loading curtain，但 `mapStatus=ready` 后路线、POI 和树群仍可能开始创建；如果腾讯底图瓦片 / 3D 底图视觉 ready 晚于这些 overlay，用户仍可能看到路线或树群先出现在黑底 canvas 上。

### 改动摘要

- 新增 `MapStartupStage`：`loadingSdk`、`creatingMap`、`waitingBaseMap`、`baseMapReady`、`overlaysReady`、`gardenLoading`、`ready`、`slow`、`failed`。
- `mapVisualReady` 判断改为更保守：地图实例创建 + 初始 camera 参数已应用 + 收到 `idle` / `tilesloaded` / `rendercomplete` 之一 + 最小可视延迟 + 2 帧 `requestAnimationFrame`。
- 移除 900ms 直接 ready fallback；4.8s 未 ready 时进入 `slow`，继续保持浅米绿 / 雾感 curtain，不暴露黑底。
- `mapVisualReadyForOverlays` 成为路线、POI、用户点、重规划线、地标高亮、debugGarden 编辑 overlay 的统一显示开关。
- `useGardenAssetOverlays` 新增 `shouldLoadGardenAssets`，树群 GLB 只有底图 visual ready 后才开始分批创建；不改变树群生成算法和资产数据。
- loading curtain 在慢加载 / 失败时提供“继续等待 / 重新加载地图”轻操作，仍保持浅色兜底。

### debugPerf

新增启动诊断事件：

- `startupStageChanged`
- `tmapScriptLoadStarted`
- `tmapScriptLoaded`
- `initialCameraApplied`
- `baseMapEventReceived`
- `mapSlow`
- `mapFailed`
- `overlaysStart`
- `routePoiShown`
- `gardenLoadStartedAfterMapReady`

面板展示当前 startup stage、map visual ready 耗时、curtain 时长、route/POI 显示耗时，以及 garden 是否等底图 ready 后才开始加载。

### 边界

本轮只重排启动阶段时序和首屏 gating。未修改 Tencent key、`mapStyleId: 'style1'`、底图配色、GLB 文件、模型压缩、树群生成算法、POI 语义、地标 transform、菩提大道、梵宫 footprint mask、佛境巡游相机逻辑或路线预演逻辑。

## 阶段：沙盘视野边界与交互轻量模式

### 背景问题

手动缩放 / 拖动时，199 个 GLB 树群和多层 route / POI overlay 同时参与渲染，容易造成缩放手感不够流畅。用户缩得过远时，灵山核心景区会缩到画面角落或变得过小，削弱 3D 沙盘导览感。

### 改动摘要

- 新增 `SCENIC_CAMERA_BOUNDS`，集中配置沙盘 zoom 范围、中心点最大偏移距离、交互恢复延迟和 garden LOD 参数。
- 地图初始化增加 `minZoom` / `maxZoom`，并在 `zoomend` / `moveend` / `idle` 后做温和兜底回弹。
- 新增用户交互轻量模式：wheel / pointer / touch 开始时停止佛境巡游和路线预演，清理临时 progress 与地标高亮。
- 交互结束后延迟约 460ms 恢复普通视觉层级，避免缩放过程中频繁切换。
- 新增树群 zoom LOD：远景或交互中只降低现有 GLB overlay opacity，不销毁、不重建。
- debugGarden 下保留更高可见度，避免编辑时完全看不见树群。

### debugPerf

新增诊断事件 / 字段：

- `mapInteractionStarted`
- `mapInteractionEnded`
- `zoomClamped`
- `gardenLodChanged`
- `gardenInteractionLiteMode`
- `gardenOpacityUpdated`
- 当前 zoom、interaction 状态、garden LOD tier、garden opacity、live garden overlay count

### 边界

本轮只优化手动缩放 / 拖动流畅性、沙盘视野边界和树群显示策略。未修改 Tencent key、`mapStyleId: 'style1'`、底图、路线数据、POI 语义、地标 transform、GLB 文件、模型压缩、树群生成算法或默认资产数据。
