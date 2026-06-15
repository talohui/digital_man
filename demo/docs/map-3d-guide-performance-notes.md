# /map-3d-guide-c 加载性能说明

## 1. 目的

本文记录 `/map-3d-guide-c` 最近几轮加载优化的工程策略、构建结果和后续注意事项。目标是确保 C 版在继续接入核心景点 GLB 之前，先具备清晰的首屏拆包边界和运行时诊断能力。

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

## 27. 手动交互轻量模式与树群 LOD

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
