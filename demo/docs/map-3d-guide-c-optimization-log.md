# /map-3d-guide-c 优化日志

## 1. 文档目的

本文记录最近几轮 `/map-3d-guide-c` 的工程优化和调试能力整理，重点覆盖：

- `debugGarden` 5 步园林配置工作台。
- 第一阶段加载优化：`debugGarden` 拆分与 GLB 分批创建。
- 第二阶段加载优化：路由级拆包与重资源隔离。
- 第三阶段准备：`debugPerf=1` 运行时加载诊断。

本文只记录当前仓库中已经能从源码、git diff、git log 或构建输出确认的能力。

### 当前状态提示（2026-06-19）

- `/map-3d-guide-c` 当前正式沉浸播放入口只保留“佛境巡游”。
- 早期章节中提到的路线预演 / `routePreview` 为历史探索记录；当前源码、UI、事件、临时 overlay、相机逻辑和 debugPerf 字段均已移除。
- 水墨瓦片已默认启用，当前优化重点是正式水墨沙盘视野限制、边缘雾幕和佛境巡游镜头收紧。

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

## 阶段：debugGarden 毛茸茸树木候选池

### 背景问题

当前默认树群仍偏“单棵树撒点”，后续需要测试更圆冠、更蓬松、更像林团的树木资产。但直接替换默认树群风险较高，容易同时影响游客页视觉、树群生成密度和已有编辑数据。

### 改动摘要

- 新增 `public/models/lingshan/tree-candidates/` 候选目录。
- 从项目已有 Kenney Nature Kit 官方 CC0 源包中抽取 5 个未接入的圆冠 / 灌木候选 GLB。
- 新增候选类型：`fluffy_round_tree`、`bushy_canopy_tree`、`dense_shrub_cluster`、`soft_forest_clump`、`fluffy_tree_mix`。
- 候选类型只加入 debugGarden 资产候选池，普通游客页和默认树群布局不自动使用。
- 单点添加候选树时使用更保守的 scale / height，避免手动测试时尺寸过大。
- 新增 `docs/lingshan-tree-asset-candidates.md`，记录来源、许可、路径、体积和接入状态。

### 资产与许可

- 已接入候选来自 Kenney Nature Kit，许可为 CC0 1.0 Universal，无需署名。
- 本轮同时评估 Quaternius Stylized Nature MegaKit；该资源为 CC0，但官方下载走 itch.io 流程，没有稳定直接下载链接，因此本轮未导入。
- 候选 GLB 未使用 Draco、Meshopt、KTX2、WebP 或 AVIF；仅移除 `KHR_materials_unlit` 扩展标记，最终 `extensionsUsed` 为空。

### 边界

本轮只接入 debugGarden 候选资源。未替换现有 Kenney 树群，未修改默认 199 个树群资产、vegetation zones、keepout zones、树群生成算法、路线逻辑、POI 语义、地标模型配置、腾讯底图或 `style1`。

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

## 阶段：debugGarden 空白园林试验场

### 背景问题

默认 199 个树群会遮挡候选树比选，也会让调试者难以判断新的圆冠 / 灌木候选在空白园林中的比例、颜色和林团观感。直接删除或替换默认树群风险较高，因此本轮只在 `debugGarden` 中提供临时空白试验场。

### 改动摘要

- `/map-3d-guide-c?debugGarden=1&debugPerf=1` 默认隐藏默认 199 个树群 overlay，但默认 assets、vegetation zones、keepout zones 和生成算法保持不变。
- 新增默认树群显示 / 隐藏开关，可随时恢复默认树群作为参照。
- 地图 visual ready 后自动加载核心地标参照层，使用现有 safe-v2 runtime modelUrl；不加载 raw GLB，不加载菩提大道。
- 新增 Tree Candidate Lab，支持选择 5 个候选树类型、4 种林团模式和 count / radius / minDistance / scale / height / seed 参数。
- 支持“点击地图添加”和“一键生成 5 种候选对比”；对比组按路线外横向间距展开，便于人工比较。
- 测试树使用独立 localStorage 草稿 `lingshan_tree_candidate_lab_draft_v1`，不会写入默认 garden assets 草稿。

### debugPerf

新增或补充字段：

- `treeCandidateLabEnabled`
- `defaultGardenHidden`
- `landmarkReferenceLoaded`
- `testTreeCount`
- `candidateType`
- `clusterMode`
- `liveDefaultGardenOverlayCount`
- `liveTestTreeOverlayCount`

### 边界

本轮只修改 debugGarden 试验模式和候选树 overlay 输入。普通 `/map-3d-guide-c` 默认视觉不变，未修改 Tencent key、`mapStyleId: 'style1'`、底图、路线数据、POI 语义、地标模型 transform、GLB 文件、模型压缩、树群生成算法、默认 vegetation zones / keepout zones / assets 数据或菩提大道。

## 阶段：新增三处核心景点 runtime-v1 GLB 接入

### 背景问题

此前菩提大道仍指向 464M raw GLB，九龙灌浴仍是 `missing_model`，灵山大照壁尚未进入地标 GLB overlay 配置。用户已手动生成并放入三个 runtime-v1 GLB，本轮只做配置接入和 Inspector 调试入口。

### 改动摘要

- 菩提大道 `puti_avenue` 正式 `modelUrl` 切换为 `/models/lingshan/optimized/bodhi-avenue.runtime-v1.glb`，不再引用旧 464M raw `/models/lingshan/landmarks/bodhi-avenue.glb`。
- 九龙灌浴 `jiulong_guanyu` 从 `missing_model` 切换为 `/models/lingshan/optimized/jiulong-guanyu.runtime-v1.glb`。
- 灵山大照壁新增 overlay：POI anchor 使用现有 `lingshan_wall`，Inspector id 使用 `lingshan_dazhaobi`，modelUrl 为 `/models/lingshan/optimized/lingshan-dazhaobi.runtime-v1.glb`。
- 三个模型均加入 Landmark Inspector，可单独加载、卸载、聚焦、进入校准并复制 patch。
- debugGarden 核心地标参照层增加这三处新 runtime-v1 地标。

### 后续校准

本轮 transform 均为保守初始值，仅保证进入 Inspector 后可见、可调。菩提大道属于线性场景资产，九龙灌浴和灵山大照壁为新增核心参照地标，三者均需要后续人工确认 scale、height、rotationY、lngOffset 和 latOffset。

### 边界

本轮未修改 GLB 文件、未压缩模型、未处理旧 464M `bodhi-avenue.glb`、未修改 Tree Candidate Lab、未改树群生成算法或默认树群数据、未改路线逻辑、POI 语义、Tencent key、`mapStyleId: 'style1'`、底图配色或佛境巡游。树候选方向暂时暂停，后续树木可考虑用 Meshy AI 统一生成更明亮、更毛茸茸的树团资产。

## 阶段：新增三处核心景点人工校准 patch 固化

### 改动摘要

- 灵山大照壁 `lingshan_dazhaobi` 固化人工校准：scale 150、height 6、rotationY 28、lngOffset -0.00005、latOffset 0。
- 菩提大道 `puti_avenue` runtime-v1 固化人工校准：scale 180、height 11、rotationY 30、lngOffset 0.00009、latOffset 0.00005。
- 九龙灌浴 `jiulong_guanyu` 固化人工校准：scale 240、height 51、rotationY 0、lngOffset 0.00003、latOffset 0。
- 三处模型继续使用 runtime-v1 路径，并已进入 Landmark Inspector 与 debugGarden 核心地标参照层。

### 资产边界

- 菩提大道 runtime-v1 约 23M。
- 九龙灌浴 runtime-v1 约 44M。
- 灵山大照壁 runtime-v1 约 28M。
- 旧 464M 菩提大道 raw 文件仍不处理、不提交、不作为运行时引用。
- debugPerf 本地 calibration draft 仍可覆盖默认配置，方便后续微调。

### 边界

本轮只固化三处新增地标 transform 和对应文档 / runtime-v1 资产。未修改 Tree Candidate Lab、树群算法、默认树群数据、路线数据、POI 语义、其它地标 transform、Tencent key、`mapStyleId: 'style1'`，也未重新启用 `fan_gong.footprintMask`。

## 阶段：祥符禅寺 3D 底座实验入口

### 背景问题

祥符禅寺与梵宫同属建筑类核心地标，校准后仍可能与腾讯地图原生 3D 白模建筑产生视觉穿插。此前梵宫 polygon footprint mask 实测贴片感明显，因此祥符禅寺不继续走 polygon mask 方案。

### 改动摘要

- 为 `xiangfu_temple` 新增 companion/base model 配置 `xiangfu_temple_base`。
- 约定底座模型路径为 `/models/lingshan/optimized/xiangfu-temple-base.runtime-v1.glb`。
- 底座默认 `enabled: false`，普通游客页不加载，只在 `debugPerf` 的 Landmark Inspector 中手动测试。
- Landmark Inspector 新增“祥符禅寺 3D 底座实验”折叠区，支持加载、卸载、聚焦、调 scale / height / rotationY / offset、保存底座草稿、复制底座 patch 和重置草稿。
- 若底座 GLB 尚未放入约定路径，Inspector 显示友好缺失提示，不影响祥符禅寺主模型。

### 边界

本轮未生成或修改 GLB 文件，未改游客端默认加载，未修改树群、路线数据、POI 语义、其它地标 transform、Tencent key、`mapStyleId: 'style1'`，也未重新启用 `fan_gong.footprintMask`。后续可由 Meshy / Blender 生成浅米灰石台或院落铺装 GLB 后放入约定路径继续校准。

## 阶段：祥符禅寺轻量 3D 底座 GLB 生成

### 改动摘要

- 新增 `scripts/create-xiangfu-temple-base.mjs`，使用 Three.js + GLTFExporter 生成纯几何 GLB。
- 生成 `/models/lingshan/optimized/xiangfu-temple-base.runtime-v1.glb`，文件约 35KB。
- 底座结构为低矮矩形石台、浅米灰顶面铺装、四周低边框和前侧浅台阶。
- 材质均为纯色 matte 石材色，不使用贴图、不使用 Draco、不使用 Meshopt。

### 定位

该底座不是精细资产，只用于验证祥符禅寺建筑落地感、院落承托和腾讯白模穿插缓解效果。后续可根据 Landmark Inspector 调参结果，再决定是否用 Meshy / Blender 制作更精细的浅米灰石台 / 院落铺装版本。

### 边界

本轮只生成简单底座 GLB 和记录文档，未修改祥符禅寺主模型 transform，未修改树群、路线数据、POI 语义、Tencent key、`mapStyleId: 'style1'`，未重新启用 polygon footprint mask 或 TMap polygon mask。

## 阶段：祥符禅寺主模型与 3D 底座校准固化

### 改动摘要

- 祥符禅寺主模型 `xiangfu_temple` 重新固化人工校准：
  - scale 670
  - height 23
  - rotationY 31
  - lngOffset 0.00001
  - latOffset -0.00001
- 祥符禅寺底座 `xiangfu_temple_base` 已默认启用：
  - scale 120
  - height -2
  - rotationY 31
  - lngOffset -0.00005
  - latOffset 0.00007
- 底座继续使用 `/models/lingshan/optimized/xiangfu-temple-base.runtime-v1.glb`，作为 `xiangfu_temple` 的 companion model，不合并进主模型。

### 设计边界

底座是 Three.js 纯几何生成的轻量 GLB，约 35KB，用于增强祥符禅寺落地感、弱化腾讯白模穿插。当前仍不采用 polygon footprint mask 方案，也不启用 TMap polygon mask；`fan_gong.footprintMask` 仍保持默认关闭。

## 阶段：Meshy 毛茸茸菩提树团接入 Tree Candidate Lab

### 改动摘要

- 将 `fluffy-bodhi-grove.runtime-v1.glb` 接入 debugGarden 的 Tree Candidate Lab。
- 新增候选 id：`fluffy_bodhi_grove`，显示为“毛茸茸菩提树团”。
- Tree Candidate Lab 候选下拉分为“推荐候选”和“旧候选 / legacy”，新树团作为推荐主树团候选，原 5 个 Kenney 候选保留。
- 一键候选对比从 5 种扩展为 6 种，包含 `fluffy_bodhi_grove`。
- 新树团默认参数为 scaleMin 0.75、scaleMax 1.15、heightOffset 0，推荐小树团、中树团、背景林团测试。

### 资产与边界

- raw 输入约 9.87MiB，runtime-v1 约 1.20MiB，压缩率约 87.88%。
- runtime-v1 `extensionsUsed` 为空，validate 无 error / warning。
- 本轮只接入 Tree Candidate Lab 候选池，普通 `/map-3d-guide-c` 不默认加载新树团。
- 默认 199 个树群、vegetation zones、keepout zones、路线、POI、地标配置和底图配置均保持不变。

## 阶段：Tree Candidate Lab 手动摆树流程简化

### 改动摘要

- Tree Candidate Lab 默认改为“选树种 → 选模式 → 点击地图添加”的手动摆树模式。
- 进入 `debugGarden=1` 后默认保持点击地图添加状态，点击地图会直接生成测试树或测试树团。
- 添加后自动选中第一棵测试树，并保留继续点击添加的状态。
- 新增测试树 marker：点击 marker 可选中，选中后可拖动紫色编辑点调整位置。
- 选中测试树可直接在基础面板调整 scale、height、rotationY。
- 删除选中树、删除选中树团、清空全部测试树均增加确认。

### 高级功能边界

- count、radiusMeters、minDistanceMeters、scaleMin / scaleMax、randomSeed 和一键候选对比收进“高级：树团参数 / 候选对比”。
- 原放置区、禁放区、5 步工作台、预览、应用 GLB、导出完整配置保留在“高级：区域生成 / 禁放区 / 5 步工作台”。
- 默认 199 个树群、默认 vegetation zones / keepout zones / assets 数据不变。
- 普通 `/map-3d-guide-c` 不显示 Tree Candidate Lab，默认游客页表现不变。

## 阶段：手动 869 树群接入为默认园林

### 改动摘要

- 将用户在 Tree Candidate Lab 手动摆放并导出的 869 个 tree assets 接入为 `/map-3d-guide-c` 新默认树群。
- 新增 `src/data/lingshanMap3DManualTreeAssets.ts`，保留用户原始经纬度、scale、height、rotationY、modelUrl / assetUrl 和 cluster 信息。
- 旧 deterministic 199 树群不删除，保留为 `DEFAULT_LINGSHAN_GARDEN_ASSETS_LEGACY` / `lingshanMap3DGardenAssetsLegacy`，debugGarden 高级区可临时切换查看。
- 普通游客页默认读取新手动树群，不再叠加旧 199 树群。

### 加载与性能

- 869 个手动树群按顺序分层：tier 1/high 200 个、tier 2/medium 300 个、tier 3/low 369 个。
- `useGardenAssetOverlays` 继续使用 id Map 去重、load generation 和 pending batch cancel，避免重影和旧 batch 残留。
- GLB overlay 创建批次调整为每批 32 个，每批之间继续通过 requestAnimationFrame + setTimeout 让出主线程。
- interaction / 远景 LOD 会优先压低 low/tier 3 透明度，idle 后恢复。
- debugPerf 增加 default asset count、batch index、tier loaded、loaded count 和 live count warning。

### 数据校验

- 输入总数 869。
- id 唯一：869 / 869，无重复。
- lng / lat、modelUrl / assetUrl、scale、height、rotationY 均合法。
- 引用的 6 个树模型路径均存在。
- 未跳过、未重命名、未删除任何 GLB。

## 阶段：默认手动树群按树种 scale 归一化

### 改动摘要

- 发现 869 手动树群混用了两套模型单位：Kenney legacy 树种 scale 约 78–98，Meshy `fluffy_bodhi_grove` 原始 scale 约 0.75–1.15。
- `fluffy_bodhi_grove.runtime-v2.glb` 原始包围盒约 1.9m 量级，scale 1 在地图沙盘中容易只看到锚点而看不到树团。
- 新增按树种的 scale 归一化：仅对 `fluffy_bodhi_grove` 的旧小数 scale 映射到 48–74 的地图显示尺度。
- 已经是 30+ 的 scale 不会重复放大，避免 localStorage 草稿刷新后叠乘。
- 不改经纬度点位、yaw、高度、模型文件、路线或 POI。

### 覆盖范围

- 新默认 869 手动树群导出时自动归一化。
- Tree Candidate Lab 读取旧草稿时自动迁移 `fluffy_bodhi_grove` 测试树 scale。
- 后续手动新增 `fluffy_bodhi_grove` 默认使用 48–74 scale 区间，并按 scale 自动设置贴地 height。

## 阶段：毛茸茸树团替换为 Meshy runtime-v2

### 改动摘要

- 将用户新增的 `Meshy_AI_Create_a_stylized_low_0616093941_texture.glb` 按 safe-compatible 流程优化为 `fluffy-bodhi-grove.runtime-v2.glb`。
- 原始文件约 11.36MiB，runtime-v2 约 1.35MiB，压缩率约 88.08%。
- `extensionsUsed` / `extensionsRequired` 均为空，validate 无 error / warning。
- `fluffy_bodhi_grove` 候选模型路径切换到 runtime-v2。
- 默认 869 树群中 `fluffy_bodhi_grove` 自动引用 runtime-v2，不改任何经纬度点位。

### scale / height 调整

- runtime-v2 的原始包围盒仍约 1.9m 量级，但模型原点在树团中部附近。
- `fluffy_bodhi_grove` 的旧 0.75–1.15 scale 归一化到约 48–74，比上一版放大 1.2 倍。
- height 从上一版 `scale * 0.54` 继续降为 `scale * 0.04`，默认 869 手动树群中该树种约为 1.9–3.0，参考其它树种的贴地高度，避免毛茸茸树离地。
- 其它树种 scale / height 保持不变。

## 阶段：修复本地 127.0.0.1 腾讯底图黑屏

### 现象

- `/map-3d-guide-c?debugGarden=1&debugPerf=1` 在 `127.0.0.1:5173` 下会出现腾讯 WebGL canvas 黑底。
- 腾讯水印、指南针、路线、POI、GLB 地标和树群 overlay 均正常，说明 SDK 与 overlay 层已运行，但底图瓦片 / 3D 底图没有出图。
- 切换到 `localhost:5173` 后底图恢复，判断与本地 Web Key 白名单 / Referer 来源有关。

### 修复

- 本地检测到 `127.0.0.1` 时自动切换到 `localhost`，保留 query 参数。
- 切换前用 `window.name` 临时搬运 debugGarden / Tree Candidate Lab 草稿，避免 127 来源下的手动树群草稿丢失。
- 腾讯 ready 事件未触发时增加本地延迟 fallback，避免底图已显示但页面一直停留在 loading curtain。
- `loadTMap` 不再在 script `onload` 当下立刻判失败，改为轮询等待 `window.TMap` 最多 10 秒，避免腾讯 GL 脚本异步挂载全局对象时误报加载失败。
- 关闭实验性的 `renderOptions.enableBloom`，降低腾讯 GL 后处理兼容风险。
- 不修改 Tencent key，不修改 `mapStyleId: 'style1'`，不改底图样式、不改路线和模型。

## 阶段：普通页正式核心地标 runtime 自动加载

### 问题

- `/map-3d-guide-c` 普通游客页只显示路线、POI 和树群，核心建筑 GLB 没有默认出现。
- 根因是地标 GLB 创建路径仍被旧的 “3D 景点模型 Beta” / debugPerf Inspector 入口控制，普通页没有在地图视觉 ready 后启动正式 runtime 地标加载。
- debugGarden 的核心地标参照层能加载，是因为它显式调用 Landmark Inspector，不代表普通页有默认加载逻辑。

### 修复

- C 版页面复用现有 Landmark Inspector 的 overlay 生命周期管理，普通页不显示 Inspector UI，但使用同一套 id Map、加载状态和 debugPerf 计数。
- 普通页自动加载不读取本地 calibration draft，确保游客页使用正式固化 transform；debugPerf / debugGarden 继续允许本地草稿覆盖。
- 地图 visual ready 后按批次加载正式配置中的核心地标：
  - 第一批：灵山大佛、梵宫、五印坛城。
  - 第二批：佛手广场、佛前广场、祥符禅寺、九龙灌浴。
  - 第三批：三圣殿、百子戏弥勒、曼龙飞塔、胜境广场、灵山大照壁、菩提大道。
- 祥符禅寺 companion 3D 底座跟随主模型加载，仍使用 `/models/lingshan/optimized/xiangfu-temple-base.runtime-v1.glb`。
- GLB Beta 控件不再决定普通页正式地标是否显示，debugPerf / Landmark Inspector 仍保留手动加载、卸载、候选切换和校准能力。
- debugPerf 新增 `landmarkRuntimeLoadStarted` / `landmarkRuntimeLoadBatch` map visual 事件，面板中可看到 runtime 批次和对应地标 id。

### 边界

- 正式游客页只使用 `src/data/lingshanMapModelOverlays.ts` 中的 runtime / safe-v2 路径。
- 菩提大道继续使用 `/models/lingshan/optimized/bodhi-avenue.runtime-v1.glb`，不引用旧 464M raw 文件。
- raw / safe-v1 / draco 仍只作为 debugPerf Inspector 的本地候选，不进入普通页自动加载。
- 未修改任何地标 scale、height、rotationY、offset、POI 语义、路线数据、树群数据或 `fan_gong.footprintMask`。

## 阶段：佛境沙盘氛围与 POI 3D 立牌第一版

### 改动摘要

- 普通 `/map-3d-guide-c` 默认开启第一版佛境沙盘氛围层，用于增强开阔航拍感和仙气佛境感。
- 新增 `BuddhaRealmAtmosphere`，通过 CSS radial / linear gradient、blur 和柔光叠层实现 sky haze、edge mist、route mist、soft vignette。
- 氛围层按状态切换：intro、normal、tour、focus。首屏 / loading 阶段更明显，地图 ready 后变淡，佛境巡游 / 路线预演时路线雾感增强，地标聚焦时柔光增强。
- 新增 `ScenicPoiBillboards`，用 TMap MultiMarker + SVG 生成核心 / 次核心 POI 的沙盘立牌，不新增 GLB。
- POI 显示按层级切换：远景 dot、中景 label、近景 / 聚焦 / 巡游 card。active POI 始终显示为立牌卡片。

### POI 覆盖

- 核心：灵山大佛、梵宫、五印坛城、祥符禅寺、九龙灌浴、灵山大照壁。
- 次核心：佛手广场、佛前广场、菩提大道、胜境广场、三圣殿、百子戏弥勒、曼龙飞塔。
- 立牌文案为“景点名 + 一句极短介绍”，仅复用现有 POI id 和坐标，不改 POI 语义。

### 边界

- 本轮不修改 Tencent key、不修改 `mapStyleId: 'style1'`、不调整腾讯底图样式。
- 不修改 GLB 文件、核心地标 transform、869 树群数据、路线数据或 `fan_gong.footprintMask`。
- debugPerf 增加 atmosphere mode、POI billboard count / level / active id 诊断。

## 阶段：佛境沙盘氛围与 POI 题签第二轮修正

### 改动摘要

- 将第一版横向 POI 立牌改为竖向“水墨题签”样式，远景为小墨点 / 圆章，中景为景点名题签，当前站为更克制的 active 题签。
- 题签色彩收敛到深绿墨、米白、暖金和低饱和暗朱红，减少现代 UI 卡片感和大白块遮挡。
- 佛境巡游 / 路线预演时启用 `tourPoiSuppression`：只强化当前站和下一站，其它 POI 降级为小点并降低透明度，避免抢核心模型和镜头叙事。
- `BuddhaRealmAtmosphere` 增加远山水墨天际、边缘林影、浅青水纹和极轻金粉层，用纯 CSS 改善顶部白色割裂和地图边缘空旷感。
- debugPerf 扩展显示 horizon mask、POI billboard mode、active / muted POI 数量、water hints 和 tour suppression 状态。

### 边界

- 氛围、水纹和林影均为 `pointer-events: none` 的视觉层，不新增 GLB、不增加 garden live overlay count。
- 不修改 Tencent key、`mapStyleId: 'style1'`、GLB 文件、869 树群数据、路线数据、POI 语义或核心地标 transform。
- 水体只是浅青水纹氛围，不新增真实湖泊或改变地理语义。

## 阶段：天空雾化与 POI 题签抬高微调

### 改动摘要

- 本轮暂不采用 `TMap.ImageTileLayer`。该方案需要完整 Web 墨卡托 `z/x/y` 瓦片资源，更适合后续手绘水墨底图覆盖层。
- 在 `TMap.Map` 初始化 `renderOptions` 中接入原生 `skyOptions` / `fogOptions`，并在地图创建后兼容调用 `map.setSkyOptions?.(...)` / `map.setFogOptions?.(...)`。
- 原生天空色使用米白青绿灰 `#EAF0E6`，雾化色使用 `#DDE8DF`，避免纯白天际割裂。
- CSS `BuddhaRealmAtmosphere` 增加 core clear mask：中部核心景点区域透明，雾气主要留在远山天际、边缘林影和路线外侧。
- POI 题签增加 `visualLiftPx`，大型建筑题签抬到建筑头顶上方，广场类和路径节点保持较低抬升。
- active 题签尺寸继续收敛，巡游 / 预演时非当前 POI 仍降级为低透明 dot。

### 边界

- 未新增 tile server、静态瓦片目录、ImageTileLayer 或大面积图片底图覆盖。
- 未修改 Tencent key、`mapStyleId: 'style1'`、GLB、869 树群数据、路线数据、POI 语义或核心地标 transform。

## 阶段：AI 水墨 ImageTileLayer 前置导出工具

### 改动摘要

- 新增 `/map-3d-guide-c?debugInkBounds=1` 四角拾取模式，用于依次点击 northwest、northeast、southeast、southwest 并复制 `LINGSHAN_INK_MAP_BOUNDS` 配置。
- 新增 `/map-3d-guide-c?exportInkBase=1` 腾讯无 POI 底图导出模式：正北、俯视、隐藏项目 GLB、869 树群、路线、POI 题签和佛境氛围层。
- export 模式使用无 label 的 Tencent vector baseMap，尽量只保留道路、水体、绿地、建筑平面轮廓。
- 新增 `showRoadCheck=1` 道路校验占位开关，仅显示轻量网格/说明，不做 OCR、道路提取或图像识别。
- 新增 `src/data/lingshanInkMapBounds.ts` 占位配置，后续由拾取结果替换。

### 边界

- 本轮不生成 AI 水墨图、不切瓦片、不接入 `TMap.ImageTileLayer`。
- 地形 / 等高线图后续只作为 AI 深浅参考，不作为几何坐标依据；最终坐标对齐以腾讯无 POI 底图和四角经纬度为准。
- 普通 `/map-3d-guide-c` 不受影响。

## 阶段：水墨底图正式 V2 边界固化

### 改动摘要

- 将 `src/data/lingshanInkMapBounds.ts` 从 0 值占位替换为用户手动四角范围整理后的 V2 正方形扩展范围：
  - northwest: `31.431918, 120.092302`
  - northeast: `31.431918, 120.106883`
  - southeast: `31.419471, 120.106883`
  - southwest: `31.419471, 120.092302`
- `/map-3d-guide-c?exportInkBase=1` 继续进入干净正北俯视导出模式，并使用 `LINGSHAN_INK_MAP_BOUNDS` 计算导出相机 center / zoom。
- 这组边界作为后续 4096×4096 AI 水墨图、GroundOverlay 验证和 ImageTileLayer 切片的统一坐标基准。
- `/map-3d-guide-c?debugInkBounds=1` 仍保留四角拾取和复制 TS 配置能力，但正式边界以 `lingshanInkMapBounds.ts` 为准。

### 边界

- 本轮只更新水墨边界配置和导出模式定位，不生成水墨图、不切瓦片、不接入 `TMap.ImageTileLayer`。
- 未修改 Tencent key、`mapStyleId: 'style1'`、GLB、869 树群数据、路线数据或核心地标 transform。

## 阶段：AI 水墨底图单图覆盖验证

### 改动摘要

- 预留第一版 AI 水墨底图路径：`public/map/ink/lingshan-ink-map-gpt-v1.png`，前端访问 `/map/ink/lingshan-ink-map-gpt-v1.png`。
- 新增 `/map-3d-guide-c?inkOverlay=1` 验证开关，默认普通页不显示水墨图。
- 覆盖层使用 `LINGSHAN_INK_MAP_BOUNDS` 四角坐标进行单图贴合，用于检查 4096×4096 水墨图和腾讯地图道路、水体、建筑平面与 GLB 景点位置是否对齐。
- 支持 `inkOpacity=0.6` 等透明度调节，默认透明度为 `0.68`。
- 支持 `showInkBounds=1` 叠加正式边界框和四角点，便于校验水墨图覆盖范围。
- debugPerf 增加 ink overlay 状态、图片路径、透明度、边界、ready / error 诊断。
- 修正 DOM overlay 图片 ready/error 状态循环：不再在相机事件 effect 中反复重置 ready，避免页面看起来像自动刷新。
- 明确 DOM ink overlay 只用于正北俯视坐标验证：pitch `0-8°` 使用目标透明度，轻微倾斜自动降到低透明，明显 3D 视角自动隐藏。
- 3D 导览视角下降低 / 隐藏水墨单图，保证 POI 题签、金色路线和 GLB 模型不被验证图压住。
- 新增 `inkSource=ai|base`：`ai` 使用 `/map/ink/lingshan-ink-map-gpt-v1.png`，`base` 使用 `/map/ink/lingshan-ink-base-tencent.png`，用于判断错位来自贴图算法 / bounds 还是 AI 生成漂移。
- 新增 `inkSource=jimeng`，使用 `/map/ink/lingshan-ink-map-jimeng-v1.png`。GPT 版水墨感更强，但在腾讯图层页面观察到道路 / 结构漂移更明显；即梦版结构更稳，作为当前优先候选加入对比。
- 新增 `inkOffsetX` / `inkOffsetY` / `inkScaleX` / `inkScaleY`，只对 DOM 单图验证层做屏幕像素平移和中心缩放，不修改正式 `LINGSHAN_INK_MAP_BOUNDS`。
- 新增 `inkCompare=1` 半透明对照模式，默认 opacity 降为 `0.45`，便于肉眼比较腾讯底图道路和 AI 水墨图道路是否重合。
- 导出面板和 debugPerf 显示当前 source、image URL、target / effective opacity、offset、scale、compare、ready / error 与 camera mode。

### 边界

- 本轮是单图覆盖验证，不切瓦片、不接入正式 `TMap.ImageTileLayer` 多级瓦片方案。
- 不删除 GPT 图和腾讯 base 图；即梦图仅作为新的候选覆盖源。
- 未修改 `LINGSHAN_INK_MAP_BOUNDS`、Tencent key、`mapStyleId: 'style1'`、GLB、869 树群数据、路线数据或核心地标 transform。

## 阶段：多路线 3D 导览扩展

### 改动摘要

- `/map-3d-guide-c` 从单条“历史文化路线”扩展为多路线导览系统，运行时当前路线由统一 `ScenicRouteConfig` 驱动。
- 路线数据优先来自 `src/data/guideData.ts`，3D 层只做 POI 映射、geometry 选择和交互状态派生。
- 保留历史文化路线为默认路线，并新增 / 接入：
  - 历史文化路线：南门入园、灵山大照壁、胜境广场、佛手广场、祥符禅寺、杏坛广场、佛前广场、灵山大佛、梵宫、五印坛城、三圣殿、景区出口。
  - 祈福静心路线：南门入园、灵山大照壁、胜境广场、九龙灌浴、佛手广场、祥符禅寺、杏坛广场、佛前广场、灵山大佛、景区出口。
  - 精华打卡路线：南门入园、灵山大照壁、胜境广场、九龙灌浴、佛手广场、祥符禅寺、佛前广场、灵山大佛、梵宫、五印坛城、景区出口。
  - 自然风光路线：南门入园、佛足坛、九龙灌浴、菩提大道、灵山大佛、曼飞龙塔、灵山精舍、梵宫广场、景区出口。
  - 亲子路线：南门入园、九龙灌浴、佛手广场、百子戏弥勒、梵宫、五印坛城、景区出口。
- geometry 来源：
  - 历史文化 / 自然风光 / 亲子：复用腾讯 walking runtime 导出的 candidate routeGeometry。
  - 祈福静心 / 精华打卡：按 `lingshanRoadNetwork` 候选步道路段拼接，标记为 `candidate`。
  - 若后续站点缺少路网段，接口会局部回退 POI polyline 并在 debugPerf 显示 unmapped / fallback 状态。
- 路线切换会停止当前巡游 / 预演，清理高亮与巡游进度 overlay，并重置当前站点、下一站、距离和路线主线。
- 佛境巡游、路线预演、POI 题签高亮和地标聚焦均改为使用当前路线。
- debugPerf 新增 currentRouteId、currentRouteName、routeStopCount、currentStopId、nextStopId、routeGeometryPointCount、routePreviewStatus、tourStatus、routeSwitchCount、routeGeometryMode、guideDataRouteSource、unmappedGuideStopCount。

### 水墨底图边界

- 本轮不接入、不修改 ImageTileLayer / 水墨切片逻辑。
- 路线 overlay 保持为独立 TMap polyline 层，并在代码中标注 route layers 必须位于可选水墨 tile layers 之上。
- POI 题签和 3D GLB 地标仍由独立 marker / GLB 层承载，不写进水墨图。
- 后续可用腾讯 walking route 批量采样替换祈福静心 / 精华打卡的 candidate geometry。

## 阶段：本地 AI 水墨 ImageTileLayer 验证

### 改动摘要

- 新增 `scripts/slice-lingshan-ink-tiles.mjs` 和 `npm run slice:ink-map`，从 `public/map/ink/lingshan-ink-map-v3.png` 生成本地 Web Mercator XYZ 配准瓦片。
- 当前 v3 源图为用户确认继续使用的 `1254×1254` 方图；脚本不再强制要求 `4096×4096`，但会输出 `non-4096 validation source` warning。
- 源图必须保持正方形；非正方形输入会终止切片，避免错误拉伸。
- 切片输出目录为 `public/map/ink/tiles/v3/{z}/{x}/{y}.png`，其中 `{x}/{y}` 是腾讯 / Web Mercator 真实瓦片坐标，不是局部 0/0 编号。
- 当前切片层级为 `15 / 16 / 17 / 18`，使用 `LINGSHAN_INK_MAP_BOUNDS` 做逐像素地理配准，不依赖腾讯控制台审核或后台自定义栅格图层。
- 范围外请求统一返回透明瓦片 `public/map/ink/tiles/empty.png`，避免 404 或重复显示局部图。
- 新增 `/map-3d-guide-c?inkTiles=1` 本地瓦片验证入口，普通 `/map-3d-guide-c` 仍不默认开启。
- 支持 `inkTileOpacity` 调节水墨瓦片透明度，默认 `0.68`。
- `showInkBounds=1` 可与 `inkTiles=1` 联用，显示正式水墨边界和四角点。
- debugPerf 增加 ink tile 状态：source、opacity、URL template、empty URL、zoom levels、x/y range、source image size、bounds、ready / error、`web-mercator-local` mode 和 map boundary。
- DOM 单图验证工具 `inkOverlay=1`、`inkSource=ai/base/jimeng`、`inkCompare`、`inkOffsetX/Y`、`inkScaleX/Y` 全部保留，仅用于俯视对齐诊断。
- 后续如近景清晰度不足，再生成 v4 高清源图；当前 v3 先用于工程接入和瓦片验证。

### 边界

- 本阶段不修改 `LINGSHAN_INK_MAP_BOUNDS`、Tencent key、`mapStyleId: 'style1'`、GLB、869 树群数据、路线数据或核心地标 transform。
- 本地瓦片验证层应位于路线、POI 题签和 GLB 地标下方；正式默认开启需等人工确认对齐和视觉强度。

## 阶段：水墨瓦片方向校正

### 改动摘要

- 在 Web Mercator XYZ 切片脚本中新增 `--flipX`、`--flipY`、`--rotate=0|90|180|270` 和 `--variant` 参数，用于校正源图像素和正式边界的方向对应关系。
- 经过顺 / 逆时针和正反镜像对比后，用户确认正确方向等效为源图 `flipY`。
- 默认 `public/map/ink/tiles/v3/` 已按 `flipY` 重切；`inkTiles=1&inkTileSource=v3` 会直接使用校正后的方向。
- 仅保留确认用对照目录 `public/map/ink/tiles/v3-rotate-270-flip-x-ccw90/`，其实际采样也等效为 `flipY`。
- 删除其它临时角度目录，避免继续误选错误方向。
- debugPerf 保留 tile variant、tile dir、source transform、flip / rotate 诊断字段，避免人工验证时看错瓦片目录。

### 边界

- 本轮只修复切片方向，不修改 Tencent key、`mapStyleId: 'style1'`、`LINGSHAN_INK_MAP_BOUNDS`、GLB、869 树群数据、路线数据或核心地标 transform。

## 阶段：水墨瓦片正式默认接入

### 改动摘要

- `/map-3d-guide-c` 默认启用本地水墨瓦片，不再需要 `inkTiles=1`。
- 正式水墨资源收口为 `public/map/ink/lingshan-ink-map-v3.png`、`public/map/ink/tiles/v3/` 和 `public/map/ink/tiles/empty.png`。
- v3 瓦片继续使用 `LINGSHAN_INK_MAP_BOUNDS` 做 Web Mercator XYZ 地理配准，tile x/y 为真实腾讯 / Web Mercator 瓦片坐标。
- 正式切片层级扩展为 `z15-z20`；近景超过 `z20` 时按 `Math.floor(x / 2 ** (z - 20))` / `Math.floor(y / 2 ** (z - 20))` 复用 `z20` 瓦片，避免放大后水墨底图消失。
- 默认水墨透明度为 `1`；仅保留 `noInkTiles=1` 用于开发对比腾讯原底图，保留 `inkTileOpacity` 用于临时调试透明度。
- `z21` 有效透明度衰减到 `0.85`，`z22+` 衰减到 `0.7`，减轻 `1254×1254` 工程验证源图在近景下的糊感。
- `showInkBounds`、`inkOverlay`、`inkSource`、`inkCompare`、`inkOffsetX/Y`、`inkScaleX/Y`、`debugInkBounds`、`exportInkBase`、`cleanShot`、`shotGuide`、`captureFrame` 等历史调试入口不再参与正式页面效果。
- 清理 GPT / base / jimeng 单图验证资源、base 瓦片和方向测试瓦片目录；保留切片脚本，后续可用同一流程切 v4 高清底图。

### 边界

- 本轮不修改 Tencent key、`mapStyleId: 'style1'`、`LINGSHAN_INK_MAP_BOUNDS`、GLB、869 树群数据、路线数据或核心地标 transform。
- 水墨瓦片层仍位于腾讯底图之上、GLB 地标 / 金色路线 / 自定义 POI 题签之下。

## 阶段：水墨沙盘正式视野限制

### 改动摘要

- 在水墨瓦片默认启用后，新增正式页视野限制，避免用户拖出或缩远后看到大面积腾讯原底图。
- 限制采用两层范围：`LINGSHAN_INK_MAP_BOUNDS` 内缩为中心点可移动范围，外扩为视觉缓冲范围，边缘允许少量露出但不让水墨图像纸片。
- 普通 `/map-3d-guide-c` 默认启用范围限制；`debugGarden=1` 禁用限制，方便继续编辑树群和点位。
- 只有 `/map-3d-guide-c?debugPerf=1&noMapBounds=1` 可临时关闭范围限制排查；普通 `noMapBounds=1` 不关闭正式限制。
- 最远 zoom 收紧到水墨沙盘总览仍占主体的位置，最近 zoom 保留查看模型和 POI 的能力。
- 收紧 `overviewEstate`、`axisCruise`、`routeOverview` 三个总览 / 巡游类相机预设；`landmarkFocus` 和 `closeInspect` 近景手感不动。
- 边缘雾幕根据缩远或靠近边界动态增强，中心景区保持清晰，路线、POI 题签和 GLB 模型不被雾遮住。
- debugPerf 增加 map bounds、当前 center / zoom、min / max zoom、edgeMistLevel、禁用原因和最后一次边界修正状态。

### 边界

- 本轮不修改 Tencent key、`mapStyleId: 'style1'`、`LINGSHAN_INK_MAP_BOUNDS`、GLB、869 树群数据、路线数据或核心地标 transform。
- 本轮不重新切水墨瓦片，不重新生成水墨图，不提交或推送。

## 阶段：水墨沙盘视野二次收口与路线预演移除

### 改动摘要

- 在正式水墨瓦片默认启用的基础上，继续收紧沙盘视野：中心可移动范围进一步内缩，视觉缓冲范围减少，减少拖动 / 缩远后露出水墨图外腾讯原底图的面积。
- 最远 zoom 再次收紧，保留完整景区总览和少量边缘雾化，不再让水墨底图在总览中像整张纸片。
- `overviewEstate`、`axisCruise`、`routeOverview` 进一步拉近；其中 `routeOverview` 只作为历史相机预设保留，不再对应路线预演入口。
- `BuddhaRealmAtmosphere` 增强四周米白雾、青绿山影和顶部远山雾幕，中心 clear mask 保持核心景点、路线、POI 和 GLB 模型清晰。
- 佛境巡游保留并加入动态相机收紧：开头 / 结尾保留开阔感，中段更贴近路线和当前景点，减少巡游时看到水墨范围外部。
- 路线预演已从正式交互中完全移除：删除按钮、状态、事件、计时器、相机逻辑、临时高亮和 debugPerf 字段。
- debugPerf 当前只保留佛境巡游、路线状态、地图边界、zoom、edgeMist 和 tour camera tighten 状态。
- `debugGarden=1` 继续禁用正式视野限制和动态边缘雾增强，保证树群和点位编辑不受影响。

### 边界

- 本轮不修改 Tencent key、`mapStyleId: 'style1'`、`LINGSHAN_INK_MAP_BOUNDS`、GLB、869 树群数据、路线数据语义或核心地标 transform。
- 本轮不重新切水墨瓦片，不重新生成水墨图，不提交或推送。

## 阶段：水墨沙盘视野三次收口与强雾遮边

### 改动摘要

- 继续收紧正式水墨沙盘视野：中心点限制范围进一步缩小，视觉缓冲从轻微外扩改为略内收，最远 zoom 提高到只保留核心景区和少量周边。
- `overviewEstate`、`axisCruise`、`routeOverview` 再次拉近；`landmarkFocus` 和 `closeInspect` 近景不动。
- 四周边缘雾幕显著增强：米白雾、青绿山影、水墨林影和顶部远山层更重，用于遮住水墨瓦片外部腾讯底图和方形边界感。
- 新增清晰区状态：普通浏览使用镜头中心圆形清晰区，缩远 / 靠近边界时清晰区收紧；佛境巡游使用沿路线方向的椭圆清晰区。
- 佛境巡游镜头继续沉浸化：中段更贴近路线和当前景点，横向偏移减少，开头 / 结尾仍保留少量开阔感。
- debugPerf 增加 edge mist strength、near boundary、distance to boundary、clear mask mode / size / center / shape 和 tour camera tighten strength。
- 本轮不处理路线与水墨路网局部不重合问题，后续可通过腾讯个性化图层或重制水墨底图再处理。

### 边界

- 本轮不修改 Tencent key、`mapStyleId: 'style1'`、`LINGSHAN_INK_MAP_BOUNDS`、GLB、869 树群数据、路线数据语义或核心地标 transform。
- 本轮不重新切水墨瓦片，不重新生成水墨图，不恢复路线预演，不提交或推送。

## 阶段：轻量动态水墨云雾

### 改动摘要

- 正式页继续使用 Tencent `skyOptions.animated: true`，负责天空 / 远处的原生轻微动态。
- 在 `BuddhaRealmAtmosphere` 内新增轻量 canvas 水墨雾纹层，覆盖四周边缘、顶部远处和少量角落山影。
- 动态雾默认 `768` 分辨率绘制，中心 clear mask 仍保持约 70% 核心区域清楚，不遮挡核心模型、金色路线和核心 POI。
- 动态雾只在地图 visual ready 后启动；loading / 入场阶段仍由静态 CSS 雾和远山层表现更明显的佛境氛围，避免阻塞腾讯地图和 GLB / 树群加载。
- 性能降级策略：检测明显慢帧后先降到 `512`，持续慢帧则关闭 canvas 动态雾；静态雾和 sky animation 继续保留。
- 恢复策略：地图空闲且帧间隔恢复稳定后自动恢复到 `768` 动态雾，避免手动开关。
- `debugGarden=1` 默认关闭 canvas 动态雾，保证编辑树群和地图时不受影响；`debugGarden=1&debugPerf=1&enableDynamicMist=1` 可临时开启观察。
- debugPerf 增加 dynamic mist 状态：enabled、canvas active、quality、degraded、reason、fps、frame ms、recovery state、sky animated 和 debug override。

### 边界

- 本轮不修改 Tencent key、`mapStyleId: 'style1'`、GLB、869 树群数据、路线数据语义、核心地标 transform 或 `LINGSHAN_INK_MAP_BOUNDS`。
- 本轮不重新切水墨瓦片，不重新生成水墨图，不恢复路线预演，不提交或推送。

## 阶段：动态水墨云雾可见度微调

### 改动摘要

- 第一版 canvas 动态雾过弱，普通浏览中不容易感知流动。
- 本轮仅调整动态雾参数：`DYNAMIC_MIST_SPEED_SCALE = 1.35`，流动速度约提升 35%；`DYNAMIC_MIST_CONTRAST_SCALE = 1.25`，雾纹对比度约提升 25%。
- 覆盖范围、中心 clear mask、静态雾遮边策略和性能降级 / 恢复逻辑均保持不变。
- debugPerf 显示 speed / contrast scale，便于确认当前动态雾参数。

### 边界

- 本轮不修改 Tencent key、`mapStyleId: 'style1'`、GLB、869 树群数据、路线数据语义、核心地标 transform、水墨瓦片或路线预演状态。

## 阶段：三圣殿 / 祥符禅寺 safe-v3 模型压缩

### 改动摘要

- GitHub 普通 Git push 会拦截超过 100MB 的对象；`sansheng-hall.safe-v2.glb` 约 107.75 MB，`xiangfu-temple.safe-v2.glb` 约 108.73 MB。
- 本轮先确认 safe-v2 已恢复为真实 `glTF` 二进制，不是 Git LFS pointer；随后跳过 `git lfs pull`，直接做 non-Draco safe-v3 压缩。
- 使用 `gltf-transform optimize`，显式关闭 Draco / Meshopt / 纹理扩展压缩：`--compress false --texture-compress false`。
- 输出：
  - `/models/lingshan/optimized/sansheng-hall.safe-v3.glb`，约 90.62 MB。
  - `/models/lingshan/optimized/xiangfu-temple.safe-v3.glb`，约 91.29 MB。
- 两个 safe-v3 均保持 `extensionsUsed: none`，不引入 Draco、Meshopt、KTX2、WebP 或 AVIF。
- 正式地标配置与 Landmark Inspector 候选已从 safe-v2 切换到 safe-v3；scale / height / rotation / offset / POI anchor 均未修改。
- Landmark Inspector 加入 GLB 头部预检：若文件仍是 `version https://git-lfs.github.com/spec/v1` pointer 或 GLB 头无效，会标记 failed，避免把 pointer 构造误报为 loaded。

### 后续

- 本轮不处理 Git 历史；safe-v2 超过 100MB 的历史对象后续仍需单独迁移或清理后再 push。

## 阶段：核心地标 LOD 运行时雏形

### 改动摘要

- 新增地标 LOD 配置和运行时选择函数，正式地标加载时会根据地图中心距离判断 `near / far` tier。
- 已生成首批 13 个 non-Draco 远景 LOD：
  - `lingshan-buddha-v2.lod-far-v1.glb`：约 7.20 MB。
  - `fan-gong.lod-far-v1.glb`：约 18.52 MB。
  - `wuyin-mandala.lod-far-v1.glb`：约 7.85 MB。
  - `sansheng-hall.lod-far-v1.glb`：约 34.79 MB。
  - `xiangfu-temple.lod-far-v1.glb`：约 35.60 MB。
  - `manlong-flying-tower.lod-far-v1.glb`：约 21.82 MB。
  - `jiulong-guanyu.lod-far-v1.glb`：约 22.28 MB。
  - `buddha-hand-plaza.lod-far-v1.glb`：约 11.38 MB。
  - `buddha-front-plaza.lod-far-v1.glb`：约 7.70 MB。
  - `baizi-milefo.lod-far-v1.glb`：约 9.75 MB。
  - `bodhi-avenue.lod-far-v1.glb`：约 22.50 MB，当前 non-Draco 管线收益有限，但保持统一远景入口。
  - `lingshan-dazhaobi.lod-far-v1.glb`：约 17.79 MB。
  - `shengjing-plaza.lod-far-v1.glb`：约 9.46 MB。
- 上述 13 个 `farModelUrl` 已接入运行时，正式沙盘所有核心地标都具备远景低模 / 近景高精切换入口。
- `loadLandmark` 支持 URL 变化时重载，确保远景低模加载后，用户靠近时可以切回高精 GLB。
- 新增 `npm run lod:landmark` 脚本，基于 `gltf-transform optimize` 生成 non-Draco LOD 候选，默认关闭 Draco / Meshopt / KTX2 / WebP / AVIF 等运行时扩展。
- Landmark GLB Debug 中实际 `glbUrl` 会显示运行时选择后的 URL，`lastLoadAllowReason` 会带上 `near / far`，便于判断后续不显示是否和 LOD / active window 有关。
- 13 个自定义核心 / 次核心 POI 均已绑定移动端详情页数据，包含介绍、看点、移动端提示、照片字段和高清 GLB 入口；缺少专属照片的点位先使用灵山官网景区参考图兜底。
- 详情页加入按需加载的 Three.js 高精 GLB 预览区，默认不下载模型，用户点击后再加载 GLTFLoader 和对应 GLB，关闭时释放 renderer / geometry / material / texture。

### 边界

- 本轮不修改地标 transform，不切换现有高精模型，不恢复树群，不重新生成或提交 GLB。

## 阶段：游客页地标 GLB 中低模收口

### 改动摘要

- 地图页正式采用“中低模 GLB 优先，高精 GLB 留给详情页 / 调试”的策略，避免游客端进入景点时仍下载 20-90MB 级别模型。
- 当前地图页低模配置已收口到约 5-15MB 档：
  - 灵山大佛：`lingshan-buddha-v2.lod-far-v1.glb`，约 7.20 MB。
  - 梵宫：`fan-gong.lod-map-v1.glb`，约 12.98 MB。
  - 五印坛城：`wuyin-mandala.lod-far-v1.glb`，约 7.85 MB。
  - 祥符禅寺：`xiangfu-temple.lod-map-q1.glb`，约 13.72 MB。
  - 九龙灌浴：`jiulong-guanyu.lod-map-v1.glb`，约 14.47 MB。
  - 佛手广场：`buddha-hand-plaza.lod-far-v1.glb`，约 11.38 MB。
  - 佛前广场：`buddha-front-plaza.lod-far-v1.glb`，约 7.70 MB。
  - 百子戏弥勒：`baizi-milefo.lod-far-v1.glb`，约 9.75 MB。
  - 菩提大道：`bodhi-avenue.lod-map-v3.glb`，约 9.90 MB。
  - 灵山大照壁：`lingshan-dazhaobi.lod-map-v2.glb`，约 13.66 MB。
  - 胜境广场：`shengjing-plaza.lod-far-v1.glb`，约 9.46 MB。
  - 三圣殿：`sansheng-hall.lod-map-q1.glb`，约 13.12 MB。
  - 曼龙飞塔：`manlong-flying-tower.lod-far-v2.glb`，约 12.68 MB。
- 祥符禅寺与三圣殿为了进入 15MB 内使用 `KHR_mesh_quantization`，不是 Draco；其它新接入低模均无 glTF 扩展。
- 保留 `xiangfu-temple.lod-map-v3.glb` 与 `sansheng-hall.lod-map-v3.glb` 作为无扩展回退候选；其它本轮中间压缩候选已清理。

### 边界

- 本轮不恢复树群 GLB，不修改地标 scale / height / rotation / offset，不改路线和 POI 语义。
- 地图页继续只加载 active window 附近核心地标，高精模型仍保留给详情页、Inspector 或后续明确聚焦场景。
