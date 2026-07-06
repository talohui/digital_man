# /map-3d-guide-c 加载性能说明

## 1. 目的

本文记录 `/map-3d-guide-c` 最近几轮加载优化的工程策略、构建结果和后续注意事项。目标是确保 C 版在继续接入核心景点 GLB 之前，先具备清晰的首屏拆包边界和运行时诊断能力。

### 当前状态提示（2026-06-19）

- 当前正式页面默认启用本地水墨瓦片，并通过沙盘视野限制和边缘雾幕控制外部腾讯底图露出。
- 当前沉浸播放入口只保留佛境巡游；早期章节中的路线预演 / `routePreview` 为历史性能记录，已不再作为现行功能、UI 或 debugPerf 字段存在。
- 当前性能关注点为水墨瓦片 z20 fallback、869 树群稳定分批加载、核心地标 runtime 加载和佛境巡游相机收紧。

## 2. 背景问题

优化前，应用入口包约 `2.72 MB`。该入口包过大时，普通 `/map-3d-guide-c` 容易被无关模块拖慢，包括后台、AntD、Live2D、Cubism、ScenicModel、Scenic3DMapPage、debugGarden 编辑器等。

当前正确拆包原则：

- 普通 `/map-3d-guide-c` 只加载真实导览必需资源。
- `debugGarden` 只在 `debugGarden=1` 时加载。
- `debugPerf` 只在 `debugPerf=1` 时显示诊断 UI。
- 后台、Live2D、Cubism、ScenicModel 不进入 C 版首屏。

## 3. 路由级拆包策略

### 改动摘要

`src/App.tsx` 当前将主要页面改为路由级 lazy loading：

- `HomePage`
- `GuideMapPage`
- `SpotGuidePage`
- `Scenic3DPreviewPage`
- `Scenic3DMapPage`
- `Map3DGuidePage`
- `Map3DGuidePrototypeAPage`
- `Map3DGuidePrototypeBPage`
- `Map3DGuidePrototypeCPage`
- `MobileShell`
- `AdminDashboard`
- `AdminAvatarPage`

普通 3D guide 路由使用轻量 `PlainLazyRoute`。需要 AntD Provider、聊天连接等全局能力的页面通过 `AppLazyRoute` 包裹。

### 涉及文件

- `src/App.tsx`

### 验收结果

`/map-3d-guide-c` 不再因为打开路由而直接加载后台页、移动端壳、Scenic3DMapPage 或 ScenicModel。

## 4. Provider 与连接管理隔离

### 改动摘要

AntD Provider、AntD App 容器、中文 locale 和主题配置已从 `main.tsx` 拆到：

- `src/components/AppProviders.tsx`

聊天 / Fay 连接初始化从 `App.tsx` 拆到：

- `src/components/ChatConnectionManager.tsx`

只有使用 `AppLazyRoute` 的页面才加载这些 provider 和连接管理。

### 涉及文件

- `src/main.tsx`
- `src/App.tsx`
- `src/components/AppProviders.tsx`
- `src/components/ChatConnectionManager.tsx`

### 验收结果

普通 `/map-3d-guide-c` 不再默认加载 AntD Provider 和聊天连接管理逻辑。

## 5. PostHog 按需加载

### 改动摘要

`posthog-js` 不再在 `src/lib/analytics.ts` 顶部静态导入，而是通过动态 `import('posthog-js')` 按需加载。

当 `VITE_POSTHOG_KEY` 为空时，PostHog 通道静默跳过。analytics-server 通道仍保持现有行为。

### 涉及文件

- `src/lib/analytics.ts`

### 验收结果

普通 `/map-3d-guide-c` 首屏不再因为 analytics 静态导入而拉入 PostHog 包。

## 6. Cubism / Live2D 按需加载

### 改动摘要

`index.html` 中原先前置加载的 Cubism Core 脚本已移除。当前由：

- `src/lib/loadCubismCore.ts`

按需加载 Cubism Core。Live2D 相关组件在使用前先调用 `loadCubismCore()`，再动态导入 `pixi-live2d-display/cubism4`。

### 涉及文件

- `index.html`
- `src/lib/loadCubismCore.ts`
- `src/components/Live2DStage.tsx`
- `src/components/admin/AdminLive2DPreview.tsx`

### 验收结果

普通 `/map-3d-guide-c` 不再加载 Cubism Core / Cubism chunk。Live2D 仍可在实际需要的页面按需加载。

## 7. debugGarden 拆包

### 改动摘要

`GardenDebugWizard` 已从 `Map3DGuidePage.tsx` 中拆出，使用 `React.lazy` + `Suspense` 条件加载：

- `src/components/map3d/GardenDebugWizard.tsx`

普通 `/map-3d-guide-c` 不加载该工作台。只有打开：

```text
/map-3d-guide-c?debugGarden=1
```

才会加载 `GardenDebugWizard` chunk。

### 涉及文件

- `src/pages/Map3DGuidePage.tsx`
- `src/components/map3d/GardenDebugWizard.tsx`

### 验收结果

最新构建中 `GardenDebugWizard` 独立 chunk 约 `17.93 kB`，gzip 约 `3.98 kB`。普通 C 页不再承担该编辑器首屏成本。

## 8. GLB 园林资产分批创建

### 改动摘要

GLB 树群 overlay 生命周期已拆到：

- `src/hooks/useGardenAssetOverlays.ts`

当前策略：

- 先根据 `routeProgressRatio`、`debugGarden` 和重规划状态筛选可见资产。
- 按 `priority` 和原始顺序排序。
- 分批创建 `TMap.model.GLTFModel`。
- 当前批大小约为 `16`。
- 批次之间通过 `requestAnimationFrame` 和短延迟让 UI 有机会先绘制。
- 单个 GLB 创建失败记录到 report，不阻断其它模型。

### 涉及文件

- `src/hooks/useGardenAssetOverlays.ts`
- `src/pages/Map3DGuidePage.tsx`

### 验收结果

普通页面地图、路线、POI、导览牌、相机卡保持不变。`debugGarden` 页面仍能显示并编辑资产。

## 9. 当前生产构建体积

最近一次 `npm run build` 输出中，与本说明相关的主要 chunk 为：

| chunk | 体积 | gzip | 说明 |
| --- | ---: | ---: | --- |
| `index-*.js` | 约 188.09 kB | 约 61.68 kB | 当前生产入口 |
| `Map3DGuidePage-*.js` | 约 126.28 kB | 约 37.38 kB | 3D guide 页面 chunk |
| `GardenDebugWizard-*.js` | 约 17.93 kB | 约 3.98 kB | debugGarden 工作台 |
| `ScenicModel-*.js` | 约 963.09 kB | 约 260.18 kB | Three / drei / GLTF 预览相关 |
| `AdminDashboard-*.js` | 约 916.33 kB | 约 270.11 kB | 后台页面 |
| `admin-*.js` | 约 601.51 kB | 约 166.48 kB | 后台 vendor |

入口包已从此前约 `2.72 MB` 降至约 `188.09 kB`。剩余 Vite chunk warning 仍存在，但主要来自 `ScenicModel`、`AdminDashboard` 和 `admin` vendor，不是 `/map-3d-guide-c` 普通首屏的直接问题。

## 10. 运行时诊断

当前代码已提供：

```text
/map-3d-guide-c?debugPerf=1
/map-3d-guide-c?debugGarden=1&debugPerf=1
```

诊断面板记录：

- 腾讯地图初始化耗时。
- 主路线 overlay 创建耗时。
- POI marker 创建耗时。
- GLB 总数、成功数、失败数。
- 第一批 GLB 完成耗时。
- 全部 GLB 完成耗时。
- 每批 batch 数量和耗时。
- 最慢 GLB asset。
- 失败 asset。
- 重复 `assetUrl`。

诊断面板支持复制 JSON。如果 Clipboard API 不可用，会显示手动复制文本框。

注意：当前 GLB 统计主要是 `TMap.model.GLTFModel` overlay 创建耗时，不等同于浏览器网络层完整下载耗时。

## 11. 后续优化方向

后续上传核心景点 GLB 前，应先使用 `debugPerf=1` 建立当前基线。建议继续关注：

1. 单个核心景点 GLB 的大小、材质数量和纹理大小。
2. 新 GLB 是否进入普通 C 页首屏。
3. 是否需要按当前站点 / 下一站延迟加载核心模型。
4. 是否需要针对 `ScenicModel` 做独立拆包或更严格的路由隔离。
5. 是否需要对后台 chunk 做更细粒度拆包。
6. 是否需要记录真实网络下载耗时，而不仅是 overlay 创建耗时。

## 12. 核心景点 GLB 接入后的性能边界

### 当前接入方式

11 个核心景点 GLB 已作为 public URL 字符串配置在：

- `src/data/lingshanMapModelOverlays.ts`

这些文件位于：

```text
public/models/lingshan/landmarks/
```

页面代码不会通过 TypeScript import 引入 GLB，因此不会把模型打进 Vite JavaScript chunk。`/map-3d-guide-c` 默认不加载这些地标 GLB。

当前 11 个 raw 地标 GLB 总体积约 1.1 GB，其中单个文件最大约 464 MB。为避免误触发大模型全量加载，C 版已将地标模型检查收敛到 `debugPerf=1` 下的 `Landmark GLB Inspector`：用户需要在诊断面板中逐个点击“加载”，才会创建对应腾讯 `TMap.model.GLTFModel` 覆盖物。

### Landmark GLB Inspector

`Landmark GLB Inspector` 只在以下入口显示：

```text
/map-3d-guide-c?debugPerf=1
/map-3d-guide-c?debugGarden=1&debugPerf=1
```

它用于人工逐个检查 raw 地标 GLB，而不是游客端的正式加载策略：

- 每个模型单独提供“加载 / 卸载 / 聚焦 / 复制诊断”。
- 加载前不创建 `TMap.model.GLTFModel`。
- 卸载时会尝试 `setMap(null)`、`remove()` 和 `destroy()` 清理覆盖物。
- 聚焦只移动腾讯地图相机到当前模型锚点，不修改 POI 坐标。
- 单个模型失败只记录到诊断，不影响其它模型和页面主体。

普通 `/map-3d-guide-c` 的 GLB Beta 不再批量创建 11 个 raw 地标模型。面板会提示：raw 地标 GLB 约 1.1 GB，应使用 `debugPerf=1` 逐个检查。

### debugPerf 扩展

`debugPerf=1` 现在同时记录：

- Garden GLB：园林树群资产。
- Landmark GLB：核心景点模型。

地标 GLB Inspector 和 `debugPerf` 诊断字段包括：

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

注意：与园林资产一样，当前统计仍是 `TMap.model.GLTFModel` overlay 创建耗时，不等同于浏览器网络层完整下载耗时。

### 当前风险

部分新模型体积较大，尤其：

- `bodhi-avenue.glb` 约 464 MB。
- `xiangfu-temple.glb` 约 144 MB。
- `sansheng-hall.glb` 约 142 MB。
- `manlong-flying-tower.glb` 约 85 MB。
- `fan-gong.glb` 约 67 MB。

这些模型不进入 JS chunk，但一旦在 Inspector 中点击加载，仍会产生真实网络和 GPU 加载成本。后续应优先做压缩、贴图降采样、材质合并，并为游客端准备 optimized / runtime GLB 或 proxy 占位模型。

### 命名兼容

模型文件使用 `manlong-flying-tower.glb`，用户口径为“曼龙飞塔”；现有 POI 锚点仍是 `manfeilong_tower`。Inspector 通过单独的 `inspectorId` 兼容显示与调试命名，不改 POI 数据语义。

### 校准草稿与诊断

`Landmark GLB Inspector` 现在支持 debug-only 校准草稿。草稿只在 `debugPerf=1` 下读取和应用，普通 `/map-3d-guide-c` 不会使用本地调试参数。

localStorage key：

```text
lingshan_landmark_calibration_draft_v1
```

可调字段：

- `scale`
- `height`
- `rotationY`
- `lngOffset`
- `latOffset`

调参实时预览优先调用 `GLTFModel.setScale / setRotation / setPosition`。如果当前腾讯覆盖物运行环境不支持这些方法，才回退为重建当前单个地标 overlay。该策略避免因某个地标校准而重载所有 raw GLB。

`debugPerf` 诊断快照增加：

- `calibrationDraftCount`
- `activeCalibrationId`
- `lastCalibrationUpdatedAt`
- `activeCalibration`

“复制诊断 JSON”会同时包含当前 `landmarkInspector` 状态，便于记录每个地标的加载状态、失败信息和校准参数。

### 已固化的核心地标校准

当前已将三批人工确认 patch 固化为默认配置：

| 地标 | scale | height | rotationY | lngOffset | latOffset |
| --- | ---: | ---: | ---: | ---: | ---: |
| 灵山大佛 | 380 | 73 | 15 | 0 | 0.00005 |
| 五印坛城 | 420 | 32 | 9 | -0.00001 | 0 |
| 梵宫 | 1012 | 50 | 10 | -0.00004 | 0.0006 |
| 佛手广场 | 194 | 9 | 30 | -0.00017 | -0.00017 |
| 祥符禅寺 | 618 | 12 | 31 | -0.00006 | 0.00009 |
| 佛前广场 | 103 | 3 | 28 | -0.00004 | 0.00005 |
| 曼龙飞塔 | 207.5 | 35 | 15 | -0.00005 | -0.00006 |
| 三圣殿 | 763 | 46 | 53 | 0.00011 | -0.00021 |
| 百子戏弥勒 | 145 | 9 | 20 | 0.00009 | 0 |
| 胜境广场 | 150 | 8 | 30 | 0.00001 | 0 |

这些值只是当前确认的默认调试基线。`debugPerf=1` 下的 localStorage 草稿仍可覆盖它们，后续确认后再继续固化。

曼龙飞塔当前仍使用现有 POI anchor `manfeilong_tower`，同时通过 `inspectorId: 'manlong_flying_tower'` 兼容 Inspector、诊断和用户导出的 patch id，不改变 POI 数据语义。

### 腾讯白模建筑重叠风险

梵宫、祥符禅寺等建筑类 GLB 可能与腾讯地图自带 3D 白模建筑重叠。自定义 GLB 是覆盖物叠加，不会替换底图白模。不要通过异常增大 `scale` 或 `height` 去遮挡白模，这会破坏地标比例和后续导航视觉。

后续不建议全局关闭腾讯 3D 建筑白模。非核心建筑仍应保留为弱背景，以维持园区空间密度；可在 `style1` 中降低白模颜色、阴影和对比度。核心地标由自定义 GLB 表现，冲突明显的建筑类地标应制作真正 3D 低矮场地底座 / 低模场景，或把底座整合进 GLB。

当前已经验证梵宫局部 polygon footprint mask 不适合作为最终方案。该能力只作为 `/map-3d-guide-c?debugPerf=1` 的 `Landmark GLB Inspector` 高级实验保留，默认不影响普通游客页，也不会删除腾讯底图白模。祥符禅寺不新增 polygon mask，后续与梵宫一起进入“弱化腾讯白模 + 真正 3D 低矮场地底座 / 低模场景”的统一任务。

祥符禅寺当前位置、scale 和高度已初步校准，但仍需要真正 3D 场地底座 / 低模底座；不要用 polygon mask、异常放大或异常抬高来硬遮挡腾讯白模。

### 梵宫 polygon footprint mask 实验结论

已尝试两类 `TMap.MultiPolygon` footprint：

1. `solid` polygon mask。
2. `ring` polygon mask。

实测问题：

- `solid` mask 会像大贴片一样压在梵宫下面。
- `ring` mask 虽然避开主体，但周边铺装仍然突兀。
- `TMap.MultiPolygon` 更适合地图区域标记，不适合作为核心建筑的自然 3D 底座。

当前结论：

- polygon footprint mask 不作为梵宫最终方案。
- 默认关闭，配置使用 `enabled: false`、`mode: 'none'`。
- Inspector 中保留为高级实验功能，供后续广场类资产或区域提示复用。

后续推荐方向：

1. 在腾讯 `style1` 中弱化 3D 白模建筑的颜色、阴影、对比度，但不全局关闭。
2. 为梵宫制作真正的 3D 低矮场地底座或低模场景，使其与 GLB 统一材质和深度关系。
3. 或在梵宫 GLB 模型本身中整合场地 / 底座。

### 构建结果

本轮 `npm run build` 通过。当前输出中 `Map3DGuidePage` chunk 约 `156.55 kB`，gzip 约 `45.59 kB`。Vite chunk warning 主要来自既有 `ScenicModel`、`AdminDashboard` 和 `admin` vendor，不是核心景点 GLB public URL 配置导致。

## 13. GLB safe-compatible 压缩路线更新

### 人工测试结论

通过 `/map-3d-guide-c?debugPerf=1` 的地标模型调试流程人工测试后，当前结论为：

- 第一轮 `safe.glb` 可以打开。
- 第一轮 `draco.glb` 当前打不开。
- Draco 压缩率很高，但当前腾讯地图 `TMap.model.GLTFModel` 兼容性不满足运行时使用要求。
- 除非后续明确确认腾讯 `GLTFModel` 支持 `KHR_draco_mesh_compression` 并通过浏览器验证，否则 Draco 暂停作为游客端候选。

因此后续优先走 safe-compatible 路线：不依赖 Draco decoder，不引入 Meshopt / KTX2 / WebP / AVIF 等额外 runtime decoder 或高级扩展。

### 第二轮 safe-v2 候选

本轮只处理：

- `public/models/lingshan/landmarks/wuyin-mandala.glb`
- `public/models/lingshan/landmarks/fan-gong.glb`

未处理 `bodhi-avenue.glb`。

safe-v2 输出：

| 模型 | raw | safe-v1 | safe-v2 | safe-v2 压缩率 | extension | validate |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 五印坛城 | 31.00 MB | 23.69 MB | 16.53 MB | 46.7% | none | 无 error；保留 tangent warning |
| 梵宫 | 67.17 MB | 58.92 MB | 43.86 MB | 34.7% | none | 无 error；保留 tangent warning |

safe-v2 使用 `prune`、`dedup`、`weld`、`simplify --ratio 0.72 --error 0.0005` 和 `resize 1024`。该版本仍未接入正式 `modelUrl`，后续需要继续在 `Landmark GLB Inspector` 中手动测试加载稳定性、耗时和视觉细节。

## 14. Landmark Inspector 压缩候选切换

`Landmark GLB Inspector` 已支持对两个地标进行 raw / safe-v1 / safe-v2 候选版本测试：

- `wuyin_tancheng`
- `fan_gong`

该能力只在 `debugPerf=1` 诊断态中使用。普通 `/map-3d-guide-c` 不显示候选版本切换，也不会默认加载 optimized 地标模型。

实现边界：

- 默认仍读取 `src/data/lingshanMapModelOverlays.ts` 中的正式 raw `modelUrl`。
- 只有在 Inspector 中手动选择 `safe-v1` 或 `safe-v2` 后，当前单个地标加载才会使用候选 URL。
- 切换版本会先卸载当前地标 overlay，避免 raw / safe 多版本叠加。
- `debugPerf` 记录会包含 `variant`、`selectedModelUrl`、`selectedSizeLabel`。
- 单体诊断 JSON 也包含当前 variant 信息。

Draco 当前人工测试打不开，暂不加入 Inspector 候选，也不作为游客端运行时方案。后续测试重点是 raw / safe-v1 / safe-v2 的加载成功率、耗时、材质表现、尺寸/朝向保持情况和卸载清理情况。

## 15. 五印坛城与梵宫 runtime GLB 切换

人工测试确认五印坛城与梵宫的 raw / safe-v1 / safe-v2 都能在腾讯地图 `GLTFModel` 中显示，safe-v2 材质、尺寸、朝向和卸载流程未发现明显问题。Draco 仍然打不开，因此继续不纳入 Inspector 候选和游客端 runtime 方案。

正式配置已切换：

- `wuyin_tancheng` → `/models/lingshan/optimized/wuyin-mandala.safe-v2.glb`
- `fan_gong` → `/models/lingshan/optimized/fan-gong.safe-v2.glb`

`Landmark GLB Inspector` 默认会匹配正式 `modelUrl`，因此这两个地标默认指向 safe-v2；仍可手动切换 raw / safe-v1 / safe-v2 做加载耗时和视觉回归对比。普通 `/map-3d-guide-c` 不显示候选版本切换。

提交边界：只提交两个 safe-v2 runtime GLB。raw GLB 继续精确忽略，safe-v1 / draco 试验产物也精确忽略，不进入 Git。`bodhi-avenue.glb` 仍需单独处理。

## 16. 剩余核心地标 safe-v2 生成

### 背景

五印坛城与梵宫已经完成 raw / safe-v1 / safe-v2 人工测试，并已正式切换到 safe-v2 runtime GLB。Draco 候选当前在腾讯地图 `TMap.model.GLTFModel` 中打不开，因此继续暂停作为运行时候选。

本轮继续沿用 safe-compatible 路线生成剩余核心地标候选，只生成文件和报告，不修改正式 `modelUrl`。

### 处理范围

已生成 safe-v2：

- `lingshan-buddha-v2.safe-v2.glb`
- `baizi-milefo.safe-v2.glb`
- `buddha-hand-plaza.safe-v2.glb`
- `shengjing-plaza.safe-v2.glb`
- `sansheng-hall.safe-v2.glb`
- `xiangfu-temple.safe-v2.glb`
- `manlong-flying-tower.safe-v2.glb`
- `buddha-front-plaza.safe-v2.glb`

未处理：

- `bodhi-avenue.glb`：体积约 464 MB，属于线性场景类模型，后续需要单独拆解、低模化或专门 runtime 策略。
- `wuyin-mandala.glb`、`fan-gong.glb`：此前已经完成 safe-v2 并正式切换。

### 输出体积

| 模型 | raw 大小 | safe-v2 大小 | 压缩率 | extension | validate |
| --- | ---: | ---: | ---: | --- | --- |
| 灵山大佛 v2 | 28.73 MB | 14.57 MB | 49.3% | none | 无 error；保留 tangent warning |
| 百子戏弥勒 | 38.86 MB | 21.90 MB | 43.6% | none | 无 error；保留 tangent warning |
| 佛手广场 | 50.66 MB | 30.04 MB | 40.7% | none | 无 error；保留 tangent warning |
| 胜境广场 | 37.95 MB | 20.90 MB | 44.9% | none | 无 error；保留 tangent warning |
| 三圣殿 | 148.85 MB | 107.75 MB | 27.6% | none | 无 error；保留 tangent warning |
| 祥符禅寺 | 150.72 MB | 108.73 MB | 27.9% | none | 无 error；保留 tangent warning |
| 曼龙飞塔 | 89.12 MB | 58.97 MB | 33.8% | none | 无 error；保留 tangent warning |
| 佛前广场 | 31.13 MB | 16.80 MB | 46.0% | none | 无 error；保留 tangent warning |

### 性能结论

- 本轮输出均未引入 Draco、Meshopt、KTX2、WebP、AVIF 等额外运行时扩展，`extensionsUsed: none`。
- validate 均无 error；warning 仍为 `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE`，与前两份 safe-v2 候选一致。
- 三圣殿和祥符禅寺 safe-v2 仍超过 100 MB，后续即使 Inspector 测试通过，也建议继续评估拆分、LOD 或更轻低模版本。
- 正式配置尚未切换这些新 safe-v2，游客端不会默认加载。

### 后续测试

下一步应在 `/map-3d-guide-c?debugPerf=1` 中扩展或临时使用 `Landmark GLB Inspector` 测试这些 safe-v2：

1. 能否在腾讯地图中显示。
2. 材质和透明度是否异常。
3. 尺寸、朝向和已固化校准参数是否保持合理。
4. 加载耗时是否较 raw 明显改善。
5. 卸载是否干净。

只有人工测试通过后，再分批把正式 `modelUrl` 切换到对应 safe-v2。

## 17. Inspector 扩展剩余 safe-v2 候选

`Landmark GLB Inspector` 已支持本轮新生成的 8 个 safe-v2 候选测试。该能力只在 `/map-3d-guide-c?debugPerf=1` 中显示，普通 `/map-3d-guide-c` 不显示候选版本切换，也不会默认加载这些 optimized 模型。

新增支持 raw / safe-v2 切换的地标：

- `giant_buddha`
- `baizi_mile`
- `foshou_square`
- `shengjing_square`
- `sansheng_hall`
- `xiangfu_temple`
- `manlong_flying_tower`
- `foqian_square`

保持已有 raw / safe-v1 / safe-v2 候选的地标：

- `wuyin_tancheng`
- `fan_gong`

实现边界：

- 正式 `src/data/lingshanMapModelOverlays.ts` 未切换这 8 个地标的 `modelUrl`。
- Draco 继续不作为 Inspector 候选。
- `debugPerf` 会记录当前选择的 `variant`、`selectedModelUrl` 和 `selectedSizeLabel`。
- 切换版本前会卸载当前地标 overlay，避免 raw 和 safe-v2 叠加。

下一步需要逐个手动验证新增 safe-v2：能否显示、材质是否异常、尺寸/朝向是否保持、卸载是否干净、加载耗时是否有改善。三圣殿和祥符禅寺 safe-v2 仍超过 100 MB，后续应继续评估二次优化、低模替代或分层加载。菩提大道继续单独规划，不纳入本轮测试。

## 18. 10 个核心地标 safe-v2 runtime 覆盖

### 本轮切换

人工验证通过后，剩余 8 个核心地标已正式切换到 safe-v2 runtime GLB：

- `giant_buddha` → `/models/lingshan/optimized/lingshan-buddha-v2.safe-v2.glb`
- `baizi_mile` → `/models/lingshan/optimized/baizi-milefo.safe-v2.glb`
- `foshou_square` → `/models/lingshan/optimized/buddha-hand-plaza.safe-v2.glb`
- `shengjing_square` → `/models/lingshan/optimized/shengjing-plaza.safe-v2.glb`
- `sansheng_hall` → `/models/lingshan/optimized/sansheng-hall.safe-v2.glb`
- `xiangfu_temple` → `/models/lingshan/optimized/xiangfu-temple.safe-v2.glb`
- `manlong_flying_tower` → `/models/lingshan/optimized/manlong-flying-tower.safe-v2.glb`
- `foqian_square` → `/models/lingshan/optimized/buddha-front-plaza.safe-v2.glb`

此前已切换的 `wuyin_tancheng` 和 `fan_gong` 保持 safe-v2。当前 safe-v2 runtime 覆盖 10 个核心地标。

### Inspector 与游客页边界

`Landmark GLB Inspector` 保留 raw / safe-v2 对比能力；五印坛城和梵宫继续保留 raw / safe-v1 / safe-v2 对比。普通 `/map-3d-guide-c` 不显示候选切换，但正式地标配置会使用已验证的 safe-v2 runtime URL。

### 后续风险

- 三圣殿 safe-v2 约 107.75 MB，祥符禅寺 safe-v2 约 108.73 MB，仍偏大。
- 两者后续需要继续评估二次优化、拆分、低模化或建筑底座策略。
- 菩提大道仍使用 raw，并继续单独规划。
- Draco 当前打不开，继续不采用。

## 19. 相机事件诊断与镜头节奏

### 相机体验目标

C 版导览相机从普通地图视角调整为更接近酒庄航拍和水墨杭州式导览的镜头语言：斜俯、慢推、主轴漫游、路线总览、地标停顿和调试近看。

### 新增预设

- `overviewEstate`：默认总览，斜俯展示核心园区、路线和地标关系。
- `axisCruise`：沿主轴线慢推，强化游览方向和空间层次。
- `routeOverview`：完整路线总览。
- `landmarkFocus`：游客侧地标聚焦，两段式慢推。
- `closeInspect`：debugPerf 下近距离检查 GLB 地标。
- `guideFollow`：模拟前进、回到路线、偏航位置的内部跟随镜头。

### debugPerf 记录

`Map3DPerfSnapshot` 新增：

- `cameraEvents`
- `latestCameraEvent`

每个事件记录：

- `cameraPreset`
- `targetPoiId`
- `targetLandmarkId`
- `durationMs`
- `startedAt`
- `finishedAt`

`Map3DPerfPanel` 展示最近相机事件，复制诊断 JSON 时也包含这些字段。

### 边界

该诊断只在 `debugPerf=1` 时记录。普通游客页不显示诊断面板，也不会因相机事件记录产生额外 UI。

## 20. 佛境巡游、路线预演与 active highlight 诊断

### 交互目标

本轮在 `/map-3d-guide-c` 上新增第一轮“佛境沙盘导览”特色交互：佛境巡游、路线预演和地标呼吸光。实现重点是镜头叙事和轻量状态反馈，不改底图、不改模型、不重算路线。

### 佛境巡游

游客端新增“佛境巡游”按钮。点击后按 5 个核心节点播放：

1. 南门 / 胜境广场
2. 佛手广场
3. 梵宫
4. 五印坛城
5. 灵山大佛

巡游复用 `map3dCamera.ts` 中的 preset 系统，单步飞行采用轻微回拉、转向、慢推和短暂停顿，避免普通地图瞬移感。

### 路线预演

游客端新增“路线预演”按钮。当前实现不重算路线，也不改变路线数据结构；它复用历史文化路线站点顺序和当前 `demoRoutePath`，通过临时 route preview polyline 展示从起点到当前预演点的淡金高亮，并让镜头沿站点序列滑行。结束后回到路线总览。

### 地标呼吸光

active highlight 使用 TMap marker 和内联 SVG 绘制淡金小环，颜色限制在淡金 `#D6B46A`、米白 `#E6DDC7`、青绿 `#8FAF9B`。普通状态不显示；巡游、路线预演经过地标时显示；停止、切换或结束后清除。该方案不修改 GLB 材质，也不影响 Landmark Inspector 的加载和卸载。

### debugPerf 记录

`Map3DPerfSnapshot` 新增：

- `tourEvents`
- `latestTourEvent`

事件类型包括：

- `tourStarted`
- `tourStep`
- `tourStopped`
- `routePreviewStarted`
- `routePreviewStep`
- `routePreviewStopped`

每个事件可记录当前 `activeLandmarkId`、相机 preset、target id、step index、step count、duration 和 stopped reason。`Map3DPerfPanel` 新增“巡游 / 预演事件”列表，仍保持轻量文本展示，不引入图表。

### 构建与风险

`npm run build` 通过。Vite 仍提示既有大 chunk warning。本轮没有新增 GLB import，没有修改 raw / safe-v1 / safe-v2 / draco 资源，没有改 `style1`，没有触碰 Tencent key。

## 21. Route-following 佛境巡游诊断

### 问题修正

第一版佛境巡游按地标直接跳转，debugPerf 中主要体现为 `tourStep` 和地标 target。该方式能验证地标停顿，但镜头不是沿导航路线前进，容易出现从一个景点直接飞到下一个景点的机械感。

### 新实现

佛境巡游现在优先使用当前页面实际显示的 route geometry：`demoRouteGeometry.path`，并回退到 `demoRoutePath`。不重算路线，不修改路线数据。

巡游 waypoint 生成逻辑：

- 按 route path 累计距离采样普通巡游点。
- 转弯处补充 waypoint。
- 根据相邻 route point 计算 bearing。
- 对 bearing 做平滑，避免 rotation 硬切。
- 根据核心地标 anchor 找 route 最近点，在前后插入 slow / pause waypoint。

### 事件记录

新增或扩展的 tour 事件：

- `tourStarted`
- `tourWaypoint`
- `tourLandmarkPause`
- `tourStopped`
- `tourCompleted`

每条 waypoint / pause 事件可记录：

- `progress`
- `targetLat`
- `targetLng`
- `bearing`
- `nearbyLandmarkId`
- `activeLandmarkId`
- `cameraPreset`
- `durationMs`
- `reason`

`Map3DPerfPanel` 在“巡游 / 预演事件”中显示 progress 百分比和 bearing，便于人工判断路线滑行是否顺畅。

### 视觉与性能边界

路线推进高亮复用现有 route preview polyline 样式，不新增复杂图层。地标呼吸光仍是轻量 TMap marker，不改 GLB 材质。普通 waypoint 不使用 two-stage fly，减少回拉-推近带来的机械感；只有地标附近通过 slow / pause 节奏产生纪录片式停顿。

## 22. requestAnimationFrame 连续巡游诊断

### 问题修正

route-following 第一版虽然沿路线 geometry 前进，但仍是 waypoint 串行 `flyTo` / `easeTo`。每个 waypoint 有独立 duration 和 timeout，视觉上会出现“一顿顿前进”。

### 连续时间轴

佛境巡游现在使用 `requestAnimationFrame` 播放器：

- 用单一 progress 表示整条路线 0 → 1。
- 每帧按 elapsed time 和速度曲线更新 progress。
- 按 route path 累计距离插值当前经纬度。
- 每帧轻量更新相机 center / zoom / pitch / rotation。
- 普通路段不再触发逐段 flyTo。
- 地标 pause 只暂停 progress，不打断相机连续状态。

### 平滑策略

- bearing 使用路线前后距离窗口计算，避免只看单个短 segment。
- rotation 使用 `lerpAngle` 做最短角平滑，避免 359° / 1° 断点。
- 普通路段保持较高斜俯和轻微 zoom / pitch 起伏。
- 地标附近通过速度 multiplier 降速，并以 smoothstep 推近 zoom / pitch。

### debugPerf 节流

为避免每帧记录导致面板卡顿：

- `tourProgress` 只按 10% progress 桶记录。
- `tourLandmarkPause` 只在地标 pause 触发时记录。
- `tourCompleted` / `tourStopped` 保留结束和中止原因。

诊断事件仍包含 progress、targetLat、targetLng、bearing、nearbyLandmarkId 和 durationMs。

## 23. 佛境巡游遨游感诊断

### 问题修正

rAF 连续时间轴消除了 waypoint 分段 `flyTo` 的明显顿挫，但如果每帧直接把 route 当前点写入相机，镜头仍容易贴线、转向过于即时，地标 pause 也会像动画暂停。

### 新增平滑层

佛境巡游现在在目标帧之外增加相机惯性：

- center、rotation、zoom、pitch 由播放器内部 camera state ref 插值到目标值。
- rotation 使用最短角插值，避免跨 0 度时突然回转。
- 目标 bearing 来自 current point 到 lookAhead point，而不是当前短 segment。
- bearing 窗口按路线长度自适应，过滤小折线带来的抖动。

### 航拍感参数

巡游目标帧加入：

- lookAhead 前视点：普通段约 0.026 progress，地标附近约 0.012 progress。
- 侧向偏移：普通段约 22m，地标附近收敛到 6-11m。
- 开头 / 结尾 / 地标附近 smoothstep 速度曲线。
- 地标 pause 慢漂移：progress 暂停，但 center、rotation、zoom、pitch 保持极轻微悬停变化。

### debugPerf 字段

`tourProgress` 仍按 10% progress 节流记录。新增诊断字段包括：

- `smoothingEnabled`
- `lookAheadProgress`
- `lateralOffsetMeters`
- `averageFrameMs`
- `estimatedFps`

这些字段用于确认平滑层启用、前视距离和侧偏距离是否符合预期，同时避免每帧记录造成面板卡顿。

## 24. 佛境巡游 route progress overlay 诊断

### 问题修正

佛境巡游相机已是 continuous timeline，但路线灰线之前仍可能通过离散 route index 或 nearest point 间接更新。这样会造成两类问题：

- 灰线推进不是同一份 `tourProgress`，与镜头速度不完全一致。
- 前往 / 返回路线空间重叠时，空间最近点有歧义，已走线和原路线可能横跳或抢显示。

### 新渲染策略

巡游路线进度改为按 route sequence 和累计距离切分：

- `progress` 来自佛境巡游同一帧的 continuous `frame.progress`。
- `splitRouteByProgress` 使用 route cumulative distance 找到当前段。
- 在当前段内插入插值点，保证 traveledPath 末尾和 remainingPath 开头是同一个 currentPoint。
- 不做空间去重，不用最近点判断已走段。
- 重叠路线仍保留 path 数组顺序，已走线只来自 `path[0..progress]`，未走线只来自 `path[progress..end]`。

### Overlay 与性能

佛境巡游期间使用临时 route progress overlay：

- remaining route 保留金色 / 米白方向感。
- traveled route 使用低饱和灰米色。
- overlay 由 refs 管理，约 30fps 更新。
- React state 只更新按钮、地标和诊断 UI，不参与每帧路线绘制。
- 停止、完成或切换路线预演时清理 overlay，并恢复普通路线 layer。

### debugPerf 字段

新增节流事件：

- `routeProgressStarted`
- `routeProgressUpdate`
- `routeProgressStopped`
- `routeProgressCompleted`
- `routeProgressOverlayReset`

事件记录 `source: tourProgress`、progress、traveledPointCount、remainingPointCount、currentLat/currentLng 和 `routeHasOverlaps`，用于判断路线进度是否来自同一个连续时间轴。

## 25. 首屏地图视觉 Ready 诊断

### 问题修正

`mapStatus=ready` 原本表示腾讯地图实例已创建，但不代表底图 canvas 已经完成首帧可视渲染。路线、POI、树群和 UI 可能早于底图瓦片 / 3D 底图显示，导致用户短暂看到黑底地图区域。

### 新 ready gating

新增独立的 visual ready 判断：

- `mapCreated`：`new TMap.Map(...)` 完成。
- `mapFirstIdle`：监听到 `idle` / `tilesloaded` / `rendercomplete` 之一。
- `mapVisualReady`：底图被认为可视稳定，或 900ms fallback 兜底触发。
- `mapReadyTimedOut`：4.8s 仍未 ready 时记录慢加载状态。

该逻辑不阻塞 GLB 树群加载；树群仍按原策略分批创建。

### Loading curtain

地图主体上方新增浅色 loading curtain：

- 米白 / 浅青绿雾感背景，避免黑底 canvas 暴露。
- visual ready 后延迟约 420ms 淡出。
- timeout 时显示“地图加载较慢”轻提示。
- 地图容器自身也改为浅米绿兜底背景。
- visual loading 期间降低 skin / paperedge 压暗，避免首屏被 overlay 压黑。

### debugPerf 字段

`Map3DPerfPanel` 现在展示：

- map visual ready time
- map first idle time
- loading curtain duration
- timed out 状态
- 最近 map visual events

这些事件只在状态变化时记录，不做逐帧采样。

## 26. 启动阶段分层 gating 诊断

### 问题修正

单独的 loading curtain 只能遮住一部分首屏问题；如果 `mapStatus=ready` 后 overlay 立即创建，而腾讯底图视觉 ready 仍滞后，路线、POI、树群就可能早于底图显示，形成“黑底半成品”。

### 新启动时序

启动流程拆分为 startup stage：

- `loadingSdk`：腾讯地图 SDK 加载中。
- `creatingMap`：SDK 已返回，创建 TMap 实例。
- `waitingBaseMap`：地图实例和初始 camera 已应用，等待底图首帧稳定。
- `baseMapReady`：收到可信底图事件后，经过最小延迟和 2 帧 RAF。
- `overlaysReady`：开始显示路线 / POI 等地图 overlay。
- `gardenLoading`：底图 ready 后开始树群 GLB 分批加载。
- `ready`：启动阶段完成。
- `slow` / `failed`：保持浅色兜底，不暴露黑底。

### Overlay gating

路线、POI、用户 marker、重规划线、地标高亮、debugGarden 编辑 overlay 都改为依赖 `mapVisualReadyForOverlays`。树群 GLB 通过 `shouldLoadGardenAssets` 显式等待底图 visual ready 后再创建，继续沿用原来的 batch 和 overlay 去重逻辑。

### debugPerf 字段

`Map3DPerfPanel` 显示：

- 当前 startup stage
- `overlaysStart`
- `routePoiShown`
- `gardenLoadStartedAfterMapReady`
- `mapSlow` / `mapFailed`
- loading curtain duration

这些事件只在阶段变化时记录，不参与逐帧采样，不会放大运行时开销。

## 27. debugGarden 树木候选池性能边界

### 本轮接入

为 debugGarden 新增 5 个毛茸茸 / 圆冠 / 灌木感更强的树木候选 GLB：

- `fluffy_round_tree`
- `bushy_canopy_tree`
- `dense_shrub_cluster`
- `soft_forest_clump`
- `fluffy_tree_mix`

候选文件位于 `public/models/lingshan/tree-candidates/`，单体体积约 4.5 KB 到 31 KB，均未使用 Draco、Meshopt、KTX2、WebP 或 AVIF。

### 加载边界

- 候选只加入 debugGarden 的资产候选池。
- `defaultEditorAssetPool`、默认 vegetation zones、默认 assets 和游客端默认树群不使用这些候选。
- 普通 `/map-3d-guide-c` 不会因为候选池存在而自动加载新 GLB。
- 只有在 debugGarden 中手动选择并添加候选资产，或将候选加入草稿资产池后，才会触发对应 GLB 加载。

### 后续观察

后续如果把候选升级为默认树群，应重新评估：

- 首屏 GLB 总请求数。
- `useGardenAssetOverlays` live overlay count。
- 树群 batch 加载耗时。
- debugGarden 草稿保存后对普通 prototype-c 页面加载的影响。

## 28. 手动交互轻量模式与树群 LOD

### 问题修正

`/map-3d-guide-c` 当前约有 199 个 GLB 树群 overlay。手动缩放 / 拖动时，如果所有树群保持完整不变，同时路线、POI、地标和编辑 overlay 继续渲染，会增加交互期压力。缩得过远时，单棵树在视觉上也不再有意义，反而形成噪声。

### 沙盘边界

新增集中配置 `SCENIC_CAMERA_BOUNDS`：

- 限制最远 / 最近 zoom，避免退回普通城市大地图或无限近看。
- 限制地图中心离路线中心的最大距离，避免景区主体被拖到画面角落。
- 对超出边界的情况在 `zoomend` / `moveend` / `idle` 后温和回弹，避免缩放过程中持续拉扯用户。

### 交互轻量模式

用户 wheel / pointer / touch 交互开始时进入 interaction lite mode：

- 停止佛境巡游 / 路线预演。
- 清理巡游 route progress 和地标 active highlight。
- 只用 ref 记录高频运行态，React state 只做低频快照。
- 交互结束后约 460ms 恢复普通视觉。

### Garden LOD

`useGardenAssetOverlays` 新增 `gardenLodState`：

- overlay 生命周期仍只依赖 map ready、资产列表、enabled 等稳定输入。
- zoom / interaction 不触发 remove / recreate。
- LOD 只对已存在的 GLTFModel 调用 `setOpacity`。
- normal scenic zoom：opacity 1。
- interacting：opacity 约 0.36，debugGarden 约 0.58。
- far zoom：opacity 约 0.08，debugGarden 约 0.22。

### debugPerf

面板新增：

- current zoom
- interaction kind / active
- garden LOD tier
- garden opacity
- live garden overlay count

相关事件只在交互状态或 LOD tier 变化时记录，不逐帧记录，不应造成诊断面板卡顿。

## 29. 三处新增 runtime-v1 地标 GLB 接入边界

### 本轮接入

新增或切换 3 个核心景点 GLB runtime 配置：

- 菩提大道 `puti_avenue`：`/models/lingshan/optimized/bodhi-avenue.runtime-v1.glb`，约 23 MB。
- 九龙灌浴 `jiulong_guanyu`：`/models/lingshan/optimized/jiulong-guanyu.runtime-v1.glb`，约 44 MB。
- 灵山大照壁 `lingshan_dazhaobi` / POI `lingshan_wall`：`/models/lingshan/optimized/lingshan-dazhaobi.runtime-v1.glb`，约 28 MB。

### 加载策略

- GLB 仍通过 public URL 字符串配置，不进入 TypeScript / Vite JS chunk。
- 普通 `/map-3d-guide-c` 不默认加载 raw GLB。
- `/map-3d-guide-c?debugPerf=1` 的 Landmark Inspector 可单体加载、卸载、聚焦和校准这 3 个模型，并记录耗时和错误。
- `/map-3d-guide-c?debugGarden=1&debugPerf=1` 的核心地标参照层可加载这 3 个 runtime-v1 地标。
- 旧 464M `bodhi-avenue.glb` 不再被正式 `modelUrl` 引用，本轮不处理、不压缩、不提交。

### 后续观察

三处模型仍是初始 transform，后续应在 Landmark Inspector 中逐个校准 scale / height / rotation / offset。菩提大道为线性场景资产，加载时尤其需要关注遮挡、模型跨度和与路线 / POI / 树群的视觉关系。

## 30. 三处新增地标校准固化

### 固化结果

三处新增 runtime-v1 模型已完成人工校准并写入默认 overlay 配置：

- 灵山大照壁：scale 150、height 6、rotationY 28、lngOffset -0.00005、latOffset 0。
- 菩提大道 runtime-v1：scale 180、height 11、rotationY 30、lngOffset 0.00009、latOffset 0.00005。
- 九龙灌浴：scale 240、height 51、rotationY 0、lngOffset 0.00003、latOffset 0。

### 加载与诊断边界

- 三个模型仍通过 public URL 加载，不进入 JS chunk。
- 三个模型已进入 Landmark Inspector，可继续单独加载、卸载、聚焦和校准。
- debugGarden 核心地标参照层包含这三处地标。
- debugPerf 本地 calibration draft 仍可覆盖默认 transform，便于后续微调。
- 旧 464M 菩提大道 raw 文件仍不处理、不提交、不作为运行时引用。

## 31. 祥符禅寺 3D 底座实验机制

### 目标

祥符禅寺主模型已完成第一轮校准，但建筑类 GLB 与腾讯白模仍可能出现穿插。后续不再使用 polygon footprint mask 作为祥符禅寺底座，改为真正 3D 低矮场地底座 / 低模场景。

### 加载策略

- 约定底座 runtime 路径：`/models/lingshan/optimized/xiangfu-temple-base.runtime-v1.glb`。
- `xiangfu_temple_base` 作为 `xiangfu_temple` 的 companion/base model 存在，不是独立 POI。
- 默认 `enabled: false`，普通 `/map-3d-guide-c` 不加载底座。
- `/map-3d-guide-c?debugPerf=1` 的 Landmark Inspector 可手动加载、卸载、聚焦和校准底座。
- 如果 GLB 文件缺失，只记录失败并显示“待放入”提示，不影响祥符禅寺主模型加载。

### 诊断

debugPerf 新增 companion model 事件：

- `companionModelLoadStarted`
- `companionModelLoaded`
- `companionModelFailed`
- `companionModelUnloaded`
- `companionModelCalibrationSaved`

事件记录 parent landmark、companion id、modelUrl、duration、错误和校准参数；不逐帧记录。

## 32. 祥符禅寺轻量底座 GLB

### 资产结果

- 输出路径：`/models/lingshan/optimized/xiangfu-temple-base.runtime-v1.glb`。
- 文件大小约 35KB。
- 生成方式：`scripts/create-xiangfu-temple-base.mjs` 使用 Three.js 盒体几何和 GLTFExporter 输出二进制 GLB。
- 几何内容：低矮石台、顶面铺装分隔线、四周边框、前侧三阶浅台阶。
- 材质内容：浅米灰 / 米石色 / 暗石缝纯色材质，无贴图、无压缩扩展。

### 使用边界

该 GLB 是验证用低模底座，不是精细 Meshy / Blender 资产。它用于在 Landmark Inspector 中快速测试祥符禅寺落地感与白模穿插缓解效果，后续仍需在页面内通过 scale、height、rotationY 和 offset 做人工校准。

## 33. 祥符禅寺与底座校准固化

### 固化值

祥符禅寺主模型：

- scale 670
- height 23
- rotationY 31
- lngOffset 0.00001
- latOffset -0.00001

祥符禅寺 companion 底座：

- enabled true
- scale 120
- height -2
- rotationY 31
- lngOffset -0.00005
- latOffset 0.00007

### 加载边界

- 主模型继续使用 `/models/lingshan/optimized/xiangfu-temple.safe-v2.glb`。
- 底座继续使用 `/models/lingshan/optimized/xiangfu-temple-base.runtime-v1.glb`。
- 底座为约 35KB 的 Three.js 纯几何 GLB，用于增强建筑落地感、弱化白模穿插。
- 仍不采用 polygon mask，不启用 TMap polygon mask。
- debugPerf 本地 calibration draft 仍可覆盖默认值，便于后续微调。

## 34. 手动 869 树群默认加载策略

### 数据来源

- 用户在 Tree Candidate Lab 中手动摆放并导出的 869 个 tree assets 已成为 `/map-3d-guide-c` 默认树群。
- 旧 deterministic 199 树群保留为 legacy，不删除数据文件、不删除 GLB。
- 普通游客页不读取 Tree Candidate Lab 草稿，只读取固化后的手动树群数据。

### 加载策略

- 新默认树群按 priority 分层加载：
  - high / tier 1：前 200 个核心树群。
  - medium / tier 2：中间 300 个普通树群。
  - low / tier 3：剩余 369 个背景补景。
- `useGardenAssetOverlays` 每批创建 32 个 GLB overlay。
- 每批之间使用 requestAnimationFrame + setTimeout，避免一次性同步创建 869 个 overlay。
- 继续依赖 asset id Map 去重、load generation 和 batch cancel，防止 StrictMode、刷新、巡游、缩放或路线预演导致重复创建。

### LOD 与交互

- interactionLiteMode / 远景 LOD 不删除树群、不重建树群，只通过 opacity 降低渲染压力。
- reduced tier 时优先压低 low/tier 3，medium 次之，high 保留更高可见度。
- debugPerf 显示 defaultGardenAssetCount、gardenLoadedCount、gardenLoadBatchIndex、gardenTierLoaded、gardenDuplicatePrevented、gardenLoadGeneration、gardenLodState 和 live count warning。

### 后续风险

869 个独立 GLB overlay 仍然比旧 199 树群重。若真机或比赛机型压力较高，后续优先考虑将部分背景树团合并为 cluster GLB，而不是继续增加单树 overlay 数量。

## 35. 手动树群 scale 归一化

### 问题

- debugGarden 中部分树点只显示锚点，树模型不明显。
- 根因不是 asset 未导入：live overlay count 已接近 / 等于资产数。
- 主要原因是新 869 数据混用了不同模型单位，`fluffy_bodhi_grove` 使用 0.75–1.15，而其它候选树多为 78–98。

### 策略

- 新增 per-kind scale normalization，只处理 `fluffy_bodhi_grove` 的旧小数尺度。
- 旧 0.75–1.15 映射到 48–74，比上一版放大 1.2 倍；height 改为 `scale * 0.04`，参考其它树种的低位贴地高度，避免 Meshy 毛茸茸树团离地。
- 归一化是幂等的：超过 rawScaleMax 的 scale 不再重复放大。
- 点位、height、yaw、模型文件和加载批次不变。

### 影响

- 普通 `/map-3d-guide-c` 使用归一化后的 869 默认树群。
- `/map-3d-guide-c?debugGarden=1` 会在读取旧本地测试树草稿时自动迁移 scale。
- 后续新建 `fluffy_bodhi_grove` 测试树团默认使用归一化后的 scale 区间。

## 36. Meshy 毛茸茸树团 runtime-v2

### 压缩结果

- 输入：`Meshy_AI_Create_a_stylized_low_0616093941_texture.glb`，约 11.36MiB。
- 输出：`fluffy-bodhi-grove.runtime-v2.glb`，约 1.35MiB。
- 压缩率约 88.08%。
- 流程：prune、dedup、weld、simplify、resize、jpeg、tangents。
- 未引入 Draco、Meshopt、KTX2、WebP 或 AVIF，`extensionsUsed` 为空。
- validate 无 error / warning。

### 显示策略

- `fluffy_bodhi_grove` 当前引用 runtime-v2。
- 旧 runtime-v1 保留文件但不再作为当前候选路径。
- 新默认 869 树群的 `fluffy_bodhi_grove` 不改点位，scale 归一化后约 48–72，height 约 1.9–3.0。
- 由于 runtime-v2 在 26–39 高度下出现离地漂浮，height 改为参考其它树种的低位贴地值，只做轻微抬高。

## 37. 本地腾讯底图黑屏修复

### 诊断

- 黑屏时 Tencent 控件、水印、路线和 GLB overlay 均正常，说明不是 React 页面或 TMap SDK 主脚本失败。
- 黑色来自腾讯 WebGL canvas；页面自身的浅色兜底背景在 canvas 下方。
- `127.0.0.1:5173` 复现黑底，`localhost:5173` 可正常显示底图，符合本地 Key 白名单 / Referer 来源差异。

### 处理

- `/map-3d-guide-c` 在本地 `127.0.0.1` 下自动 canonicalize 到 `localhost`，避免腾讯底图服务黑屏。
- 切换前通过 `window.name` 转移 debugGarden 的 garden assets、editor state 和 Tree Candidate Lab 草稿，降低来源切换导致的本地草稿丢失风险。
- 地图创建后增加 3.2s fallback visual ready，防止腾讯 ready 事件缺失导致底图已可见但 overlay 一直不加载。
- `loadTMap` 增加 `window.TMap` 轮询等待，避免 script load 先于 TMap 全局对象挂载时直接进入 failed。
- `renderOptions.enableBloom` 改为关闭，避免实验性后处理参与首屏黑屏排查。

## 38. 普通页核心地标 runtime 加载

### 诊断

- 普通 `/map-3d-guide-c` 没有自动创建核心建筑 GLB overlay，地标加载实际只挂在 GLB Beta / debugPerf Inspector 入口下。
- debugGarden 里的核心地标参照层正常，是因为 Tree Candidate Lab 显式调用 Inspector 加载，不是普通游客页的默认路径。

### 策略

- 复用 `useLandmarkModelInspector` 的 overlay Map 管理、generation / status 和 debugPerf 计数，避免普通页和 Inspector 各自创建一套 GLB。
- 普通页 runtime 自动加载禁用 localStorage calibration draft，避免游客页被调试草稿污染；debugPerf / debugGarden 仍按原逻辑读取草稿用于校准。
- C 版地图 visual ready 后自动分三批加载正式 runtime / safe-v2 地标，每批间隔约 520ms。
- `xiangfu_temple_base` companion 只在配置 `enabled=true` 时跟随祥符禅寺加载。
- debugGarden 继续使用核心地标参照层；普通 runtime 自动加载在 debugGarden 下不重复执行。
- debugPerf 的 map visual event 记录 `landmarkRuntimeLoadStarted` 和 `landmarkRuntimeLoadBatch`，包含 batch index 和本批地标 id。

### 性能与安全

- 地标加载不阻塞地图 visual ready，也不要求等待全部地标加载完成后才显示树群。
- debugPerf 的 Landmark GLB 计数继续显示 live / total 状态，companion 事件仍记录在 Companion 诊断中。
- 普通页正式加载只读 `lingshanMapModelOverlays.ts` 的 `modelUrl`，不使用 raw、safe-v1、draco 或旧 464M 菩提大道路径。

## 39. 佛境氛围层与 POI 立牌

### 氛围层

- 第一版氛围层采用纯 CSS overlay，不引入 canvas 粒子、视频或新依赖。
- 叠层包括 sky haze、edge mist、route mist、soft glow 和轻 vignette，用于压住远处白色天际、增强沙盘舞台感和路线巡游雾感。
- 氛围 mode 为 intro / normal / tour / focus：
  - intro：首屏与 loading 阶段更明显。
  - normal：地图 ready 后常驻但降低强度。
  - tour：佛境巡游 / 路线预演时 route mist 增强。
  - focus：地标聚焦时 soft glow 增强。
- overlay 使用 `pointer-events: none`，不参与地图交互，不影响拖动、缩放、巡游或 Tree Candidate Lab 面板。

### POI 立牌

- 新增 13 个核心 / 次核心 POI 的分层立牌，使用 TMap MultiMarker + SVG，不增加 GLB overlay 数量。
- 远景显示 dot，中景显示短标签，近景 / 聚焦 / 巡游显示“景点名 + 极短介绍”卡片。
- active POI 始终升到 card 级别，并在佛境巡游 / 路线预演经过时跟随高亮。
- debugPerf 显示 atmosphereMode、atmosphereVisible、poiBillboardCount、poiBillboardLevel 和 activePoiBillboardId。

### 性能边界

- 立牌数量固定为 13 个，不随 869 树群分批加载重建。
- 本轮不修改腾讯 `style1`、路线数据、树群数据、GLB 文件或核心地标 transform。

## 40. 佛境氛围与 POI 题签第二轮视觉修正

### POI 策略

- POI marker 仍使用 TMap MultiMarker + SVG，但从横向卡片改为竖向水墨题签。
- `poiBillboardMode` 调整为 `dot` / `titleTag` / `activeTag`：
  - `dot`：远景小墨点 / 小圆章。
  - `titleTag`：竖向景点名题签。
  - `activeTag`：当前站题签，包含景点名和极短副标题。
- 巡游 / 预演时启用 `tourPoiSuppressionEnabled`，非当前 / 下一站 POI 降级为低透明小点，避免 POI 抢模型和路线镜头。

### 氛围策略

- CSS atmosphere 层增加 `ink-horizon`、`forest`、`water` 和 `gold-dust` 子层。
- `ink-horizon` 使用模糊渐变和 clip-path 模拟远山水墨天际，用于缓解顶部白色割裂。
- `forest` 是边缘青绿林影，不创建真实树 GLB。
- `water` 是浅青水纹提示，只作为佛境通透感的视觉氛围，不改变地理语义。
- debugPerf 记录 horizon mask 强度、active / muted POI 数量、water hint 数量和 tour POI suppression 状态。

### 性能边界

- 未引入 canvas 粒子、视频、大图片或新 GLB。
- POI 数量仍固定为 13 个，氛围层为单个 DOM overlay，不参与 869 树群的生命周期。

## 41. 原生 sky/fog 与 POI lift

### Tencent 原生渲染配置

- 本轮不使用 `TMap.ImageTileLayer`，因为它需要提前准备完整 `z/x/y` 栅格瓦片资源。
- `renderOptions` 增加：
  - `enableBloom: true`
  - `skyOptions.color: #EAF0E6`
  - `skyOptions.brightness: 0.82`
  - `skyOptions.animated: true`
  - `fogOptions.color: #DDE8DF`
- 地图创建后兼容调用 `setSkyOptions` / `setFogOptions`，并在 debugPerf 记录 `nativeSkyConfigured`。

### CSS 氛围职责调整

- CSS 氛围层不再硬盖整个天空，改为辅助远山、边缘雾、林影和水纹。
- 中央核心建筑区域增加 core clear mask，减少大佛、梵宫、五印坛城、祥符禅寺等模型被雾蒙住的概率。
- debugPerf 显示 native sky/fog、core clear mask、water hints 与 horizon intensity。

### POI 题签

- `ScenicPoiBillboards` 为题签 marker 增加底部透明 spacer，通过 marker anchor 抬高 screen y 位置。
- dot 保持低位；titleTag / activeTag 抬到建筑头顶上方。
- 每个 POI 使用 `visualLiftPx` 控制抬升，建筑类高于广场类。
- 巡游 / 预演保持非当前 POI 降级策略，避免题签抢景点主体。

## 42. AI 水墨单图 overlay 验证

### 覆盖策略

- `inkOverlay=1` 才启用第一版 AI 水墨底图覆盖，普通 `/map-3d-guide-c` 默认不加载该图片。
- 覆盖图路径为 `/map/ink/lingshan-ink-map-gpt-v1.png`，使用 `LINGSHAN_INK_MAP_BOUNDS` 进行四角贴合。
- 当前实现是单图验证层，用于确认道路、水体、建筑平面和 GLB 景点坐标是否对齐；不是正式 `ImageTileLayer` 瓦片方案。
- `inkOpacity` 默认 `0.68`，可通过 URL 参数快速调整，避免遮住 GLB、路线和 POI 题签。
- `showInkBounds=1` 可叠加正式边界框和四角点，仅用于检查贴图范围。
- DOM overlay 仅作为正北俯视验证工具：pitch `0-8°` 使用目标透明度，`8-32°` 自动降到不高于 `0.28`，超过 `32°` 自动隐藏。
- 图片 load/error 状态使用 ref 稳定保存，不随地图 move / zoom / pitch 事件反复清空，避免造成疑似自动刷新。
- debugPerf 同时显示 target opacity、effective opacity、camera mode 和 suppression reason，便于确认 3D 视角是否已降级。
- `inkSource=ai|base|jimeng` 复用同一个 DOM overlay 生命周期，只切换图片 URL；`base` 用于贴回腾讯原始底图判断投影 / bounds 是否正确，`jimeng` 用于验证结构更稳的即梦候选。
- `inkOffsetX/Y` 与 `inkScaleX/Y` 在 DOM 层中心缩放 / 平移，不修改正式边界，也不影响 exportInkBase / debugInkBounds。
- `inkCompare=1` 默认 opacity `0.45`，用于保留腾讯底图可见度进行人工叠图校验。
- GPT 版水墨感更强但可能局部道路漂移；即梦版作为当前优先候选加入同一对齐诊断流程。若即梦版对齐更好，再进入 GroundOverlay / ImageTileLayer 切片验证。

### 性能边界

- 水墨图是单个 DOM overlay，不参与 869 树群、核心地标 GLB 或路线 overlay 生命周期。
- debugPerf 只记录 overlay ready / error、opacity、bounds 和实现模式，不做高频日志。
- 后续若要正式上线水墨底图，应切片为少量 zoom 层级并改用 `ImageTileLayer`，本阶段不做。

## 43. 多路线导览状态与性能边界

### 状态扩展

- debugPerf 新增多路线快照字段：
  - `currentRouteId`
  - `currentRouteName`
  - `routeStopCount`
  - `currentStopId`
  - `nextStopId`
  - `routeGeometryPointCount`
  - `routePreviewStatus`
  - `tourStatus`
  - `routeSwitchCount`
  - `routeGeometryMode`
  - `guideDataRouteSource`
  - `unmappedGuideStopCount`
- `routeGeometryMode` 当前取值：
  - `candidate`：腾讯 walking candidate 或 `lingshanRoadNetwork` candidate 拼接。
  - `poi-polyline`：仅在缺少候选路网段时作为兜底。
  - `real`：预留给后续人工验证或正式 walking route 几何。
- 路线切换只更新当前路线相关 overlay 和状态，不重建 869 树群，不修改核心 GLB transform。

### 路线来源

- 路线、站点、标签和文案以 `src/data/guideData.ts` 为主数据源。
- 已接入路线：
  - 历史文化路线：腾讯 walking candidate。
  - 祈福静心路线：路网 candidate 拼接。
  - 精华打卡路线：路网 candidate 拼接。
  - 自然风光路线：腾讯 walking candidate。
  - 亲子路线：腾讯 walking candidate。
- POI 题签从固定核心 POI 扩展为固定核心 + 当前路线站点补齐，巡游 / 预演时非当前 POI 继续降级。

### 水墨底图边界

- 本轮不改变 ImageTileLayer、inkOverlay、inkTiles、exportInkBase、debugInkBounds 的实现入口。
- 路线 polyline、POI 题签和 GLB 地标仍是底图之上的独立层；水墨底图默认开启后不应把路线写入水墨图片。
- 后续性能优化重点是批量替换 candidate geometry 为腾讯 walking route 采样结果，而不是增加路线渲染层数量。

## 44. 本地水墨 ImageTileLayer 验证

### 切片与加载

- 新增 `npm run slice:ink-map`，基于 `public/map/ink/lingshan-ink-map-v3.png` 与 `LINGSHAN_INK_MAP_BOUNDS` 生成本地 Web Mercator XYZ 配准瓦片。
- 当前 v3 源图为 `1254×1254` 方图，用户确认继续用于工程验证；脚本允许非 `4096×4096` 正方形源图继续切片，只打印清晰度 warning。
- 输出目录为 `public/map/ink/tiles/v3/{z}/{x}/{y}.png`，其中 `{x}/{y}` 是真实地图 tile 坐标，不是局部 0/0 网格。
- 范围外请求返回公共透明兜底 `public/map/ink/tiles/empty.png`。
- 当前验证层级：
  - z15：4 tiles
  - z16：9 tiles
  - z17：36 tiles
  - z18：132 tiles
- 如果后续近景清晰度不足，再生成 v4 高清源后重新切片；当前不再因为 v3 不是 4096 而阻塞。

### 页面策略

- `inkTiles=1` 才启用 `TMap.ImageTileLayer`，普通 `/map-3d-guide-c` 默认不启用。
- `inkTileOpacity` 默认 `0.68`，可用 URL 参数调整。
- `showInkBounds=1` 可显示正式水墨边界，辅助检查瓦片范围。
- 瓦片 URL 通过 `getTileUrl` 直接使用腾讯 SDK 请求的真实 x/y/z；仅当 z 不在支持层级或 x/y 超出正式边界覆盖范围时，返回透明 `empty.png`。
- 启用 `inkTiles=1` 后增加基于中心点的软边界 clamp，减少用户拖出大量水墨图范围后看到原腾讯底图断层。
- DOM 单图 overlay 仍保留为俯视诊断工具；它不参与正式瓦片层生命周期。

### 性能边界

- 本地水墨瓦片由腾讯 `ImageTileLayer` 管理，不重建 GLB、869 树群、路线或 POI 题签。
- debugPerf 只记录瓦片层启用、透明度、URL 模板、zoom levels、ready / error 和 boundary 状态，不做高频事件记录。
- 路线、POI 题签和 GLB 地标继续在瓦片层之上显示，避免水墨底图压住导览主体。

## 45. 水墨瓦片方向变体

### 切片参数

- `scripts/slice-lingshan-ink-tiles.mjs` 支持 `--flipX`、`--flipY`、`--rotate=0|90|180|270` 和 `--variant`。
- 方向变换发生在单个 tile 像素映射到源图采样坐标之前，不改变 `LINGSHAN_INK_MAP_BOUNDS` 或真实 Web Mercator tile x/y。
- 最终确认正确方向等效为 `flipY`，默认 `v3` 目录已按 `flipY` 重切。
- 仅保留 `v3-rotate-270-flip-x-ccw90` 作为确认用对照目录；其它临时角度目录已删除。

### 页面诊断

- 默认 `inkTileSource=v3` 会请求已校正的 `/map/ink/tiles/v3/{z}/{x}/{y}.png`。
- `inkTileVariant=v3-rotate-270-flip-x-ccw90` 会请求保留的确认对照目录。
- debugPerf 展示当前 `inkTileVariant`、`tileDir`、`sourceTransform`、`flipX`、`flipY`、`rotate`，方便确认当前加载的是哪个方向变体。
- 方向变体不触发 869 树群、核心 GLB、路线或 POI 题签重建。

## 46. 水墨瓦片正式性能方案

### 正式资源

- `/map-3d-guide-c` 默认启用 `public/map/ink/tiles/v3/{z}/{x}/{y}.png`。
- 正式源图为 `public/map/ink/lingshan-ink-map-v3.png`，当前为 `1254×1254` 工程验证源；后续如需高清近景，可用同一脚本替换为 v4。
- 仅保留 `public/map/ink/tiles/empty.png` 作为范围外透明瓦片，避免 404 和错误重复贴图。

### 层级与 fallback

- 正式切片层级：`z15 / z16 / z17 / z18 / z19 / z20`。
- 当前切片数量：
  - z15：4 tiles
  - z16：9 tiles
  - z17：36 tiles
  - z18：132 tiles
  - z19：484 tiles
  - z20：1892 tiles
- 当腾讯请求 `z21+` 时，前端将请求坐标折算到 `z20`：`fallbackX = floor(x / 2 ** (z - 20))`，`fallbackY = floor(y / 2 ** (z - 20))`。
- `z21` 透明度系数为 `0.85`，`z22+` 为 `0.7`；默认基础透明度为 `1`，可用 `inkTileOpacity` 临时调试。

### 运行边界

- `TMap.ImageTileLayer` 管理瓦片生命周期，不重建 GLB、869 树群、路线或 POI 题签。
- `noInkTiles=1` 可关闭水墨瓦片用于开发对比；普通用户入口不暴露该开关。
- debugPerf 仅显示正式瓦片状态：默认启用、基础 / 实际透明度、zoom fade、层级、z20 fallback、URL 模板、empty tile、ready / error 和 boundary 状态。
- 历史 DOM 单图 overlay、source / variant 切换、offset / scale 微调不再作为正式运行路径展示。

## 47. 水墨沙盘视野限制

### 交互策略

- 正式 `/map-3d-guide-c` 在水墨瓦片默认开启后启用视野限制，避免拖动 / 缩远时露出大面积腾讯原底图。
- 限制分两层：
  - 中心点范围使用正式水墨 bounds 的内缩区域，防止用户把边缘拖到屏幕中央。
  - 视觉缓冲使用正式 bounds 的轻微外扩区域，允许边缘有少量过渡但不形成明显断层。
- 回正只在 `dragend`、`moveend`、`zoomend`、`idle` 后触发，并使用 Tencent `easeTo` 优先，避免拖动中高频 `setCenter` 造成卡顿。
- `debugGarden=1` 不启用正式范围限制，保证树群和候选点位编辑自由。
- `debugPerf=1&noMapBounds=1` 可临时关闭范围限制排查；普通 `noMapBounds=1` 不关闭限制。

### 相机与雾幕

- `overviewEstate`、`axisCruise`、`routeOverview` 已拉近，减少总览和巡游时把水墨范围看成纸片的概率。
- 近景相机不收紧，继续支持大佛、梵宫、祥符禅寺等模型和 POI 细看。
- 边缘雾幕随缩远和接近 bounds 边缘增强，中心 clear mask 保持核心景区、路线、POI、GLB 清楚。
- debugPerf 显示 map bounds、zoom range、edgeMistLevel、禁用原因和 lastBoundsCorrection，便于确认 live 状态而不刷高频日志。

## 48. 水墨沙盘视野二次收口与播放入口精简

### 视野限制

- 正式页中心点限制比例继续收紧到 `0.72`，视觉缓冲比例收紧到 `1.03`，减少画面边缘露出腾讯原底图。
- 最远 zoom 提高到更接近景区总览的位置，避免缩远后看到完整水墨方图；最近 zoom 仅轻微约束，继续允许查看核心模型和 POI。
- 边界回正仍只在 `dragend`、`moveend`、`zoomend`、`idle` 后触发，不做逐帧强制回拉，避免交互卡顿。
- `debugGarden=1` 不启用正式范围限制；`debugPerf=1&noMapBounds=1` 仍可临时关闭限制排查，普通 `noMapBounds=1` 不生效。

### 氛围与相机

- 边缘雾幕和青绿山影强度提高，中心 clear mask 保持核心景区清晰；缩远或靠近边界时 edgeMist 进入 strong 状态。
- `overviewEstate`、`axisCruise`、`routeOverview` 进一步拉近，降低总览视角看到水墨范围外部底图的概率。
- 佛境巡游增加 `tourCameraTightenMode`：中段自动收紧镜头，开头 / 结尾保留少量开阔感。

### 路线预演移除

- 路线预演不再作为当前功能存在，相关 UI、状态、事件、计时器、相机逻辑、临时高亮和 debugPerf 字段已移除。
- 保留佛境巡游作为唯一沉浸播放入口；路线切换、当前 / 下一站、金色路线、POI 高亮和多路线系统不受影响。
- debugPerf 不再显示 routePreview 字段，只显示 tour、route、bounds、zoom、edgeMist 和 camera tighten 状态。

## 49. 强雾遮边与清晰区诊断

### 视野参数

- 正式中心点限制比例进一步收紧到 `0.66`，视觉缓冲比例收紧到 `0.98`，减少水墨瓦片外腾讯原底图进入主视野。
- 正式最远 zoom 提高到 `17.72`，最大 zoom 略收紧到 `19.58`；debugGarden 和 debug override 仍使用宽松范围。
- 边缘强雾触发更敏感：远景阈值提高到 `18.08`，靠近中心限制边界约 `26%` 内进入 strong 状态。

### 雾层与清晰区

- `BuddhaRealmAtmosphere` 增加 `clearMaskShape` 和 `clearMaskSize` class，普通浏览使用圆形清晰区，佛境巡游使用路线椭圆清晰区。
- 强雾状态下边缘米白雾、青绿山影和顶部远山雾幕更重，中心 clear mask 保持核心景区、路线、核心 POI 和 GLB 清楚。
- debugPerf 显示 `edgeMistStrength`、`nearInkBoundary`、`distanceToInkBoundary`、`clearMaskMode`、`clearMaskSize`、`clearMaskCenter` 和 `clearMaskShape`。

### 巡游相机

- 佛境巡游中段继续拉近，减少横向偏移，并记录 `tourCameraTightenStrength`。
- 本轮只处理视野和雾气问题；路线与水墨底图道路局部不重合暂不处理。

## 50. 动态水墨云雾性能策略

### 启动策略

- Tencent `skyOptions.animated` 作为正式天空 / 远处动效，保持米白、青绿灰方向。
- canvas 动态雾等地图 visual ready 后启动，不阻塞 SDK、底图、GLB、树群或路线加载。
- loading / 入场阶段使用静态雾层营造更强氛围，ready 后 canvas 动态雾轻微常驻。

### 绘制策略

- 动态雾位于 `BuddhaRealmAtmosphere` 内，使用固定分辨率 canvas，默认 `768`。
- 每帧不写 React state；canvas 内部用 ref 管理，约 1 秒向 debugPerf 汇报一次状态。
- 视觉覆盖四周边缘、顶部远处和角落山影，中心区域通过 clear mask 保持清楚。

### 降级策略

- 如果检测到连续慢帧，先降级到 `512`。
- 如果降级后仍明显卡顿，则关闭 canvas 动态雾。
- 降级后静态边缘雾、青绿山影和 Tencent sky animation 继续保留，页面不会突然失去佛境氛围。
- 帧间隔恢复稳定后，canvas 自动恢复到 `768`。
- `debugGarden=1` 默认关闭 canvas 动态雾；`debugPerf=1&enableDynamicMist=1` 可在 debugGarden 中临时开启观察。

### 诊断字段

- debugPerf 显示 `dynamicMistEnabled`、`dynamicMistCanvasActive`、`dynamicMistQuality`、`dynamicMistDegraded`、`dynamicMistDegradeReason`、`dynamicMistFpsEstimate`、`dynamicMistFrameMs`、`dynamicMistRecoveryState`、`skyOptionsAnimated` 和 debugGarden override 状态。

### 可见度微调

- 当前动态雾速度参数为 `1.35x`，比第一版提高约 35%。
- 当前雾纹对比参数为 `1.25x`，比第一版提高约 25%。
- 覆盖范围、中心 clear mask、默认质量、慢帧降级和自动恢复策略保持不变。
- debugPerf 会显示 speed / contrast scale，确认没有误用旧参数。

## 51. 大体积地标 GLB safe-v3 策略

### 背景

- `sansheng-hall.safe-v2.glb` 约 107.75 MB，`xiangfu-temple.safe-v2.glb` 约 108.73 MB，超过 GitHub 普通 Git 单文件 100MB 限制。
- 两个 safe-v2 已恢复为真实 `glTF` 二进制；如果文件内容是 Git LFS pointer，腾讯 `GLTFModel` 会解析失败并出现 `version https://git-lfs.github.com/spec/v1` 相关错误。

### safe-v3 输出

- `sansheng-hall.safe-v3.glb`：约 90.62 MB。
- `xiangfu-temple.safe-v3.glb`：约 91.29 MB。
- 压缩策略为 non-Draco：`gltf-transform optimize --compress false --texture-compress false --texture-size 1024 --simplify true --simplify-ratio 0.80 --simplify-error 0.0002 --simplify-lock-border true`。
- `gltf-transform inspect` 显示 `extensionsUsed: none`，未引入 Draco / Meshopt / KTX2 / WebP / AVIF。

### 加载诊断

- 正式配置和 Landmark Inspector 当前指向 safe-v3，transform 不变。
- debugPerf / Inspector 加载前会读取 GLB 头部，遇到 LFS pointer 或非法 GLB 头会记录 failed，避免把构造成功误认为模型已可解析。
- Git 历史中超过 100MB 的 safe-v2 对象仍需后续单独处理；本阶段不做历史清理。

## 52. 核心地标 LOD 运行时雏形

- 新增 `npm run lod:landmark`，用于单个地标生成远景低面数 GLB 候选。脚本默认参数为 `--ratio=0.45`、`--error=0.001`、`--texture-size=768`，并显式关闭 Draco / Meshopt / 纹理运行时扩展。
- 正式地标加载链路增加 LOD URL 覆盖入口，按地图中心距离选择 `near / far` tier；当前没有配置 `farModelUrl` 的地标继续使用正式高精 runtime URL，避免 404 造成地标缺失。
- 13 个核心地标均已接入 `farModelUrl`，远景优先使用 non-Draco 低模，近景进入阈值后切回高精 `modelUrl`。除菩提大道当前仅减少约 0.4% 外，其余远景 LOD 大多减少约 37%–61%，用于降低移动端远景解析和常驻内存压力。
- `loadLandmark` 会比较当前已加载 URL 与目标 URL。URL 不变时不重建；远景低模进入近景阈值后会重载为高精模型，避免低模一直常驻。
- LOD 不改变 scale / height / rotation / offset；低模产物通过配置接入后，远景降低内存和解析压力，近景仍保留高精模型。
- debugPerf 的 Landmark GLB Debug 显示实际加载 URL，并在 load reason 中标记 `near / far`，用于定位后续某些 GLB 不显示是否由预算、距离或 LOD 配置导致。
