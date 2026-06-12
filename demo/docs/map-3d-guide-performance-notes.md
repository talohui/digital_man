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
