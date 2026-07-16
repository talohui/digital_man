# 灵山核心地标 GLB 压缩试验报告

日期：2026-06-12

## 1. 试验范围

本轮只处理两个模型：

- `public/models/lingshan/landmarks/wuyin-mandala.glb`
- `public/models/lingshan/landmarks/fan-gong.glb`

明确未处理：

- `public/models/lingshan/landmarks/bodhi-avenue.glb`
- 其它 9 个 raw 地标 GLB

本轮没有覆盖 raw GLB，没有删除 raw GLB，没有修改 `src/data/lingshanMapModelOverlays.ts` 的正式 `modelUrl`，也没有接入游客端自动加载。

## 2. 工具与策略

临时使用 `npx --yes @gltf-transform/cli`，版本 `4.4.0`。没有写入 `package.json` 或 lockfile。

### safe 候选

safe 版优先作为腾讯 `TMap.model.GLTFModel` 兼容候选，不使用 Draco / Meshopt / KTX2 / WebP / AVIF 等可能需要运行时扩展支持的高级压缩。

处理流程：

1. `prune`
2. `dedup`
3. `resize --width 2048 --height 2048`

说明：本轮原始贴图已是 2048 级别，safe 版主要来自纹理重写和轻量清理，压缩率有限但兼容风险较低。

### draco 候选

draco 版在 safe 版基础上追加：

```bash
gltf-transform draco <safe.glb> <draco.glb>
```

draco 版使用 `KHR_draco_mesh_compression`，压缩率高，但不能假设腾讯 `GLTFModel` 一定支持。后续必须通过 `/map-3d-guide-c?debugPerf=1` 的 `Landmark GLB Inspector` 手动加载测试。

## 3. 输出文件

输出目录：

```text
public/models/lingshan/optimized/
```

| 模型 | 原始路径 | 原始大小 | safe 输出 | safe 大小 | safe 压缩率 | draco 输出 | draco 大小 | draco 压缩率 |
| --- | --- | ---: | --- | ---: | ---: | --- | ---: | ---: |
| 五印坛城 | `public/models/lingshan/landmarks/wuyin-mandala.glb` | 31.00 MB | `public/models/lingshan/optimized/wuyin-mandala.safe.glb` | 23.69 MB | 23.6% | `public/models/lingshan/optimized/wuyin-mandala.draco.glb` | 4.07 MB | 86.9% |
| 梵宫 | `public/models/lingshan/landmarks/fan-gong.glb` | 67.17 MB | `public/models/lingshan/optimized/fan-gong.safe.glb` | 58.92 MB | 12.3% | `public/models/lingshan/optimized/fan-gong.draco.glb` | 7.32 MB | 89.1% |

## 4. Inspect 摘要

### 五印坛城 raw

- glTF version：2.0
- generator：`pygltflib@v1.16.5`
- extensionsUsed：none
- mesh 数：1
- mesh primitive：1
- glPrimitives：763,880
- vertices：426,924
- material 数：1
- texture 数：4
- texture 类型：JPEG
- texture 分辨率：4 张均为 2048x2048
- animation：无
- 大贴图：存在，4 张 2048x2048 贴图，GPU 估算每张约 22.37 MB
- 无用节点 / 无用对象：`prune` 后体积没有明显变化，未发现明显可移除的无用内容

### 梵宫 raw

- glTF version：2.0
- generator：`pygltflib@v1.16.5`
- extensionsUsed：none
- mesh 数：1
- mesh primitive：1
- glPrimitives：1,607,719
- vertices：1,247,868
- material 数：1
- texture 数：4
- texture 类型：JPEG
- texture 分辨率：4 张均为 2048x2048
- animation：无
- 大贴图：存在，4 张 2048x2048 贴图，GPU 估算每张约 22.37 MB
- 无用节点 / 无用对象：`prune` 后体积没有明显变化，未发现明显可移除的无用内容

## 5. Validate 结果

四个候选文件均通过 glTF Transform validate，未发现 error。

共同 warning：

- `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE`
- 含义：材质需要 tangent space，但 mesh primitive 未提供 tangent。运行时可能生成 tangent，不同实现可能不完全一致。

draco 候选额外信息：

- `UNSUPPORTED_EXTENSION: KHR_draco_mesh_compression`
- 含义：validator 无法验证该扩展；这不是文件结构错误，但说明 runtime 必须支持 Draco 才能加载。
- 还出现 `UNUSED_OBJECT / bufferViews/4` 提示，需后续兼容性测试时观察是否影响腾讯 GLTFModel。

## 6. 是否压缩成功

### 五印坛城

- safe：成功，体积从 31.00 MB 降至 23.69 MB。
- draco：成功，体积从 31.00 MB 降至 4.07 MB。
- 建议：先用 safe 版测试腾讯加载；再用 draco 版测试腾讯是否支持 `KHR_draco_mesh_compression`。

### 梵宫

- safe：成功，体积从 67.17 MB 降至 58.92 MB。
- draco：成功，体积从 67.17 MB 降至 7.32 MB。
- 建议：safe 版仍偏大；draco 版压缩率高，但必须单独验证腾讯兼容性。

## 7. 后续腾讯地图加载测试建议

不要直接把正式配置切到 optimized 或 draco 文件。建议后续在 `/map-3d-guide-c?debugPerf=1` 中增加临时候选切换能力，或临时只在 Inspector 中手动替换测试：

1. 测试 `wuyin-mandala.safe.glb` 是否能稳定加载。
2. 测试 `wuyin-mandala.draco.glb` 是否能稳定加载。
3. 测试 `fan-gong.safe.glb` 是否能稳定加载。
4. 测试 `fan-gong.draco.glb` 是否能稳定加载。
5. 记录加载耗时、失败信息、视觉材质是否正常、模型尺寸和朝向是否仍可沿用当前校准参数。

如果 Draco 失败，应优先使用 safe 版或继续探索不依赖运行时扩展的几何简化 / 低模重建方案。

## 8. 当前结论

- `wuyin-mandala.safe.glb` 可作为第一优先兼容候选。
- `wuyin-mandala.draco.glb` 可作为高压缩率测试候选。
- `fan-gong.safe.glb` 体积仍偏大，只能作为短期兼容候选。
- `fan-gong.draco.glb` 压缩率明显，但腾讯 Draco 兼容性未知。
- 梵宫和五印坛城的主要体积问题来自高三角面和 2048 贴图；safe 版无法从根本上解决几何体积。
- 后续正式 runtime 版本仍建议做几何简化、贴图降采样、材质合并，必要时重新制作低模场景版本。

## 9. 人工兼容性测试结论

人工通过腾讯地图 `TMap.model.GLTFModel` 测试后确认：

- `safe.glb` 可以打开。
- `draco.glb` 当前打不开。
- Draco 压缩率高，但当前兼容性不满足腾讯地图运行时使用要求。
- 除非后续明确确认腾讯 `GLTFModel` 支持 `KHR_draco_mesh_compression` 并完成浏览器验证，否则 Draco 暂停作为游客端 / runtime 候选。
- 后续优先走不依赖 Draco decoder 的 safe-compatible 压缩路线。

该结论不表示 Draco 永久不可用，只表示当前测试环境下不可作为 `/map-3d-guide-c` 的运行时候选。

## 10. safe-v2 兼容候选

第二轮只继续处理：

- `public/models/lingshan/landmarks/wuyin-mandala.glb`
- `public/models/lingshan/landmarks/fan-gong.glb`

明确未处理：

- `public/models/lingshan/landmarks/bodhi-avenue.glb`
- 其它 raw 地标 GLB

safe-v2 不使用 Draco，也不使用 Meshopt / KTX2 / WebP / AVIF 等需要额外 runtime decoder 或运行时扩展支持的压缩方式。

处理命令流程：

```bash
gltf-transform prune <raw.glb> <tmp-prune.glb>
gltf-transform dedup <tmp-prune.glb> <tmp-dedup.glb>
gltf-transform weld <tmp-dedup.glb> <tmp-weld.glb>
gltf-transform simplify <tmp-weld.glb> <tmp-simplify.glb> --ratio 0.72 --error 0.0005
gltf-transform resize <tmp-simplify.glb> <safe-v2.glb> --width 1024 --height 1024
```

说明：

- `simplify` 为有损几何简化，不引入 glTF runtime extension。
- 贴图降采样到 `1024x1024`，使用 2 的幂尺寸，避免 `1536x1536` 触发 NPOT 信息。
- safe-v2 优先目标是兼容和稳定打开，不追求最大压缩率。

| 模型 | raw 大小 | safe-v1 大小 | safe-v2 大小 | safe-v2 压缩率 | 使用的优化命令 | 是否引入 glTF extension | validate 是否有 error | 人工测试状态 | 建议 |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| 五印坛城 | 31.00 MB | 23.69 MB | 16.53 MB | 46.7% | `prune` / `dedup` / `weld` / `simplify --ratio 0.72 --error 0.0005` / `resize 1024` | 否，`extensionsUsed: none` | 无 error；保留 tangent space warning | 待在 `/map-3d-guide-c?debugPerf=1` 人工测试 | 推荐优先测试 safe-v2 |
| 梵宫 | 67.17 MB | 58.92 MB | 43.86 MB | 34.7% | `prune` / `dedup` / `weld` / `simplify --ratio 0.72 --error 0.0005` / `resize 1024` | 否，`extensionsUsed: none` | 无 error；保留 tangent space warning | 待在 `/map-3d-guide-c?debugPerf=1` 人工测试 | 可作为 safe 版后续测试候选，但仍偏大 |

safe-v2 inspect 摘要：

- 五印坛城：`extensionsUsed: none`，1 mesh / 1 material / 4 JPEG textures，贴图 `1024x1024`，mesh 约 `549,992` triangles、`318,476` vertices。
- 梵宫：`extensionsUsed: none`，1 mesh / 1 material / 4 JPEG textures，贴图 `1024x1024`，mesh 约 `1,157,557` triangles、`983,916` vertices。

validate 结果：

- 两个 safe-v2 候选均无 error。
- 共同 warning 仍为 `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE`。
- 没有 `KHR_draco_mesh_compression`、Meshopt、KTX2、WebP、AVIF 等运行时扩展。

safe-v2 仍未接入正式配置。后续需要通过 `/map-3d-guide-c?debugPerf=1` 的 `Landmark GLB Inspector` 手动测试加载、耗时和材质表现，确认后再决定是否切换正式 `modelUrl`。

## 11. Landmark Inspector 候选版本测试

`/map-3d-guide-c?debugPerf=1` 的 `Landmark GLB Inspector` 已增加 safe-compatible 候选版本测试能力，仅覆盖两个已经完成压缩试验的地标：

- `wuyin_tancheng`
- `fan_gong`

可选版本：

| 地标 | variant | modelUrl | sizeLabel |
| --- | --- | --- | ---: |
| 五印坛城 | raw | `/models/lingshan/landmarks/wuyin-mandala.glb` | 31.00 MB |
| 五印坛城 | safe-v1 | `/models/lingshan/optimized/wuyin-mandala.safe.glb` | 23.69 MB |
| 五印坛城 | safe-v2 | `/models/lingshan/optimized/wuyin-mandala.safe-v2.glb` | 16.53 MB |
| 梵宫 | raw | `/models/lingshan/landmarks/fan-gong.glb` | 67.17 MB |
| 梵宫 | safe-v1 | `/models/lingshan/optimized/fan-gong.safe.glb` | 58.92 MB |
| 梵宫 | safe-v2 | `/models/lingshan/optimized/fan-gong.safe-v2.glb` | 43.86 MB |

Draco 候选文件虽然仍保留在本地 optimized 目录中，但当前人工测试打不开，因此不进入 Inspector 的版本选择按钮，也不作为腾讯地图运行时候选。

正式 `src/data/lingshanMapModelOverlays.ts` 的默认 `modelUrl` 尚未切换。后续需要在 `/map-3d-guide-c?debugPerf=1` 手动测试：

1. 五印坛城 raw / safe-v1 / safe-v2 是否都能显示。
2. 梵宫 raw / safe-v1 / safe-v2 是否都能显示。
3. 材质、法线、透明度、尺寸和朝向是否异常。
4. 加载耗时是否明显改善。
5. 切换版本后旧 overlay 是否卸载干净。

## 12. safe-v2 正式 runtime 切换

人工测试已确认：

- 五印坛城 raw / safe-v1 / safe-v2 均可显示。
- 梵宫 raw / safe-v1 / safe-v2 均可显示。
- safe-v2 的材质、尺寸、朝向和卸载流程未发现明显问题。
- Draco 候选当前仍打不开，继续暂停作为腾讯地图运行时候选。

正式 runtime 配置已切换：

| 地标 | 正式 runtime modelUrl | 说明 |
| --- | --- | --- |
| 五印坛城 | `/models/lingshan/optimized/wuyin-mandala.safe-v2.glb` | raw 路径仍保留在本地，用于 debugPerf 对比和回退。 |
| 梵宫 | `/models/lingshan/optimized/fan-gong.safe-v2.glb` | raw 路径仍保留在本地，用于 debugPerf 对比和回退。 |

提交策略：

- 本轮只提交两个 safe-v2 runtime GLB。
- raw GLB 继续精确忽略，不进入 Git。
- safe-v1 / draco 仍作为本地试验产物，不提交。
- `bodhi-avenue.glb` 不参与本轮处理，后续需要单独策略。

`Landmark GLB Inspector` 仍保留 raw / safe-v1 / safe-v2 对比能力，用于后续回归测试加载耗时、材质表现和卸载清理。

## 13. 剩余地标 safe-v2 批处理

### 本轮目标

本轮继续沿用已经在五印坛城和梵宫上验证可用的 safe-compatible 压缩路线，只生成剩余核心地标的 safe-v2 runtime 候选，不修改正式 `modelUrl`，不处理 `bodhi-avenue.glb`。

处理范围：

- `lingshan-buddha-v2.glb`
- `baizi-milefo.glb`
- `buddha-hand-plaza.glb`
- `shengjing-plaza.glb`
- `sansheng-hall.glb`
- `xiangfu-temple.glb`
- `manlong-flying-tower.glb`
- `buddha-front-plaza.glb`

未处理：

- `bodhi-avenue.glb`：体积约 464 MB，更像线性场景，后续单独拆解或低模化。
- `wuyin-mandala.glb`、`fan-gong.glb`：已完成 safe-v2 并正式切换。

### 优化命令

每个模型使用同一套 safe-v2 命令：

```bash
gltf-transform prune <raw.glb> <tmp-prune.glb>
gltf-transform dedup <tmp-prune.glb> <tmp-dedup.glb>
gltf-transform weld <tmp-dedup.glb> <tmp-weld.glb>
gltf-transform simplify <tmp-weld.glb> <tmp-simplify.glb> --ratio 0.72 --error 0.0005
gltf-transform resize <tmp-simplify.glb> <safe-v2.glb> --width 1024 --height 1024
```

未使用 Draco、Meshopt、KTX2、WebP、AVIF。所有输出目标为 `extensionsUsed: none`。

### 批处理结果

| 模型 | raw 路径 | raw 大小 | safe-v2 输出路径 | safe-v2 大小 | 压缩率 | 使用命令 | glTF extension | validate error | validate warning | 是否建议进入 Inspector 人工测试 | 备注 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |
| 灵山大佛 v2 | `public/models/lingshan/landmarks/lingshan-buddha-v2.glb` | 28.73 MB | `public/models/lingshan/optimized/lingshan-buddha-v2.safe-v2.glb` | 14.57 MB | 49.3% | `prune` / `dedup` / `weld` / `simplify` / `resize 1024` | none | 无 | `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` | 是 | 后续需人工确认与已校准参数匹配。 |
| 百子戏弥勒 | `public/models/lingshan/landmarks/baizi-milefo.glb` | 38.86 MB | `public/models/lingshan/optimized/baizi-milefo.safe-v2.glb` | 21.90 MB | 43.6% | `prune` / `dedup` / `weld` / `simplify` / `resize 1024` | none | 无 | `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` | 是 | 作为点状地标候选，适合优先测试。 |
| 佛手广场 | `public/models/lingshan/landmarks/buddha-hand-plaza.glb` | 50.66 MB | `public/models/lingshan/optimized/buddha-hand-plaza.safe-v2.glb` | 30.04 MB | 40.7% | `prune` / `dedup` / `weld` / `simplify` / `resize 1024` | none | 无 | `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` | 是 | 后续检查广场细节和材质是否受贴图降采样影响。 |
| 胜境广场 | `public/models/lingshan/landmarks/shengjing-plaza.glb` | 37.95 MB | `public/models/lingshan/optimized/shengjing-plaza.safe-v2.glb` | 20.90 MB | 44.9% | `prune` / `dedup` / `weld` / `simplify` / `resize 1024` | none | 无 | `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` | 是 | 适合与路线节点标识一起回归。 |
| 三圣殿 | `public/models/lingshan/landmarks/sansheng-hall.glb` | 148.85 MB | `public/models/lingshan/optimized/sansheng-hall.safe-v2.glb` | 107.75 MB | 27.6% | `prune` / `dedup` / `weld` / `simplify` / `resize 1024` | none | 无 | `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` | 是 | 输出仍偏大，后续可能需要模型级拆解或更细 LOD。 |
| 祥符禅寺 | `public/models/lingshan/landmarks/xiangfu-temple.glb` | 150.72 MB | `public/models/lingshan/optimized/xiangfu-temple.safe-v2.glb` | 108.73 MB | 27.9% | `prune` / `dedup` / `weld` / `simplify` / `resize 1024` | none | 无 | `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` | 是 | 输出仍偏大，并仍需后续 3D 底座 / 低模场景处理白模冲突。 |
| 曼龙飞塔 | `public/models/lingshan/landmarks/manlong-flying-tower.glb` | 89.12 MB | `public/models/lingshan/optimized/manlong-flying-tower.safe-v2.glb` | 58.97 MB | 33.8% | `prune` / `dedup` / `weld` / `simplify` / `resize 1024` | none | 无 | `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` | 是 | 后续检查塔身细节和远景可读性。 |
| 佛前广场 | `public/models/lingshan/landmarks/buddha-front-plaza.glb` | 31.13 MB | `public/models/lingshan/optimized/buddha-front-plaza.safe-v2.glb` | 16.80 MB | 46.0% | `prune` / `dedup` / `weld` / `simplify` / `resize 1024` | none | 无 | `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` | 是 | 压缩率较好，适合优先进入 Inspector 回归。 |

### 当前结论

- 8 个目标模型均成功生成 safe-v2。
- 所有 safe-v2 输出均为 `extensionsUsed: none`，未引入 Draco、Meshopt、KTX2、WebP、AVIF。
- validate 均无 error，统一保留 `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE` warning。
- 本轮没有修改 `src/data/lingshanMapModelOverlays.ts` 或 `src/data/lingshanOptimizedModelCandidates.ts`。
- 正式游客页不会自动使用这些新 safe-v2，后续需要先通过 `/map-3d-guide-c?debugPerf=1` 的 Inspector 人工测试。

## 14. Inspector 扩展剩余 safe-v2 候选测试

### 本轮目标

`Landmark GLB Inspector` 已扩展剩余 8 个 safe-v2 候选测试能力，用于在 `/map-3d-guide-c?debugPerf=1` 中逐个验证新增压缩模型。该能力只属于 debugPerf 调试态，不改变普通游客页，也不修改正式 `modelUrl`。

### 新增候选

| 地标 id | raw | safe-v2 | size |
| --- | --- | --- | --- |
| `giant_buddha` | `/models/lingshan/landmarks/lingshan-buddha-v2.glb` | `/models/lingshan/optimized/lingshan-buddha-v2.safe-v2.glb` | 28.73 MB -> 14.57 MB |
| `baizi_mile` | `/models/lingshan/landmarks/baizi-milefo.glb` | `/models/lingshan/optimized/baizi-milefo.safe-v2.glb` | 38.86 MB -> 21.90 MB |
| `foshou_square` | `/models/lingshan/landmarks/buddha-hand-plaza.glb` | `/models/lingshan/optimized/buddha-hand-plaza.safe-v2.glb` | 50.66 MB -> 30.04 MB |
| `shengjing_square` | `/models/lingshan/landmarks/shengjing-plaza.glb` | `/models/lingshan/optimized/shengjing-plaza.safe-v2.glb` | 37.95 MB -> 20.90 MB |
| `sansheng_hall` | `/models/lingshan/landmarks/sansheng-hall.glb` | `/models/lingshan/optimized/sansheng-hall.safe-v2.glb` | 148.85 MB -> 107.75 MB |
| `xiangfu_temple` | `/models/lingshan/landmarks/xiangfu-temple.glb` | `/models/lingshan/optimized/xiangfu-temple.safe-v2.glb` | 150.72 MB -> 108.73 MB |
| `manlong_flying_tower` | `/models/lingshan/landmarks/manlong-flying-tower.glb` | `/models/lingshan/optimized/manlong-flying-tower.safe-v2.glb` | 89.12 MB -> 58.97 MB |
| `foqian_square` | `/models/lingshan/landmarks/buddha-front-plaza.glb` | `/models/lingshan/optimized/buddha-front-plaza.safe-v2.glb` | 31.13 MB -> 16.80 MB |

五印坛城和梵宫保持已有 raw / safe-v1 / safe-v2 候选。Draco 继续不进入 Inspector 候选。

### 测试要求

这些新增 safe-v2 尚未切正式配置，需要在 `/map-3d-guide-c?debugPerf=1` 中逐个检查：

1. 是否能在腾讯地图 `GLTFModel` 中显示。
2. 材质、透明度、法线是否异常。
3. 尺寸、朝向和已固化校准参数是否保持。
4. 切换 raw / safe-v2 后旧 overlay 是否卸载干净。
5. debugPerf 中 `variant`、`selectedModelUrl`、`selectedSizeLabel` 是否正确记录。

三圣殿和祥符禅寺 safe-v2 仍超过 100 MB，即使人工测试可显示，后续仍建议继续拆解、低模化或制作更轻 runtime 版本。菩提大道仍未处理，继续单独规划。

## 15. 剩余 8 个核心地标 safe-v2 正式 runtime 切换

### 人工验证结论

人工已在 `/map-3d-guide-c?debugPerf=1` 中验证以下 8 个 safe-v2 候选均可正常加载、显示和卸载：

- 灵山大佛 safe-v2
- 佛手广场 safe-v2
- 佛前广场 safe-v2
- 曼龙飞塔 safe-v2
- 三圣殿 safe-v2
- 祥符禅寺 safe-v2
- 百子戏弥勒 safe-v2
- 胜境广场 safe-v2

### 正式切换结果

正式 `src/data/lingshanMapModelOverlays.ts` 已切换以下 runtime `modelUrl`：

| 地标 | runtime modelUrl | raw 回退路径 |
| --- | --- | --- |
| 灵山大佛 | `/models/lingshan/optimized/lingshan-buddha-v2.safe-v2.glb` | `/models/lingshan/landmarks/lingshan-buddha-v2.glb` |
| 百子戏弥勒 | `/models/lingshan/optimized/baizi-milefo.safe-v2.glb` | `/models/lingshan/landmarks/baizi-milefo.glb` |
| 佛手广场 | `/models/lingshan/optimized/buddha-hand-plaza.safe-v2.glb` | `/models/lingshan/landmarks/buddha-hand-plaza.glb` |
| 胜境广场 | `/models/lingshan/optimized/shengjing-plaza.safe-v2.glb` | `/models/lingshan/landmarks/shengjing-plaza.glb` |
| 三圣殿 | `/models/lingshan/optimized/sansheng-hall.safe-v2.glb` | `/models/lingshan/landmarks/sansheng-hall.glb` |
| 祥符禅寺 | `/models/lingshan/optimized/xiangfu-temple.safe-v2.glb` | `/models/lingshan/landmarks/xiangfu-temple.glb` |
| 曼龙飞塔 | `/models/lingshan/optimized/manlong-flying-tower.safe-v2.glb` | `/models/lingshan/landmarks/manlong-flying-tower.glb` |
| 佛前广场 | `/models/lingshan/optimized/buddha-front-plaza.safe-v2.glb` | `/models/lingshan/landmarks/buddha-front-plaza.glb` |

至此，safe-v2 runtime 已覆盖 10 个核心地标：灵山大佛、梵宫、五印坛城、佛手广场、佛前广场、祥符禅寺、三圣殿、百子戏弥勒、曼龙飞塔、胜境广场。

### 边界说明

- raw GLB 继续本地保留，用于 debugPerf 对比和回退，不进入 Git。
- safe-v1 / draco 继续作为本地试验产物，不进入 Git。
- Draco 当前仍打不开，继续不作为腾讯地图运行时候选。
- 菩提大道仍未处理，后续需要单独拆解、低模化或专门 runtime 策略。
- 三圣殿和祥符禅寺 safe-v2 仍超过 100 MB，后续仍建议二次优化或低模 / 底座策略。

## 16. 菩提大道 / 九龙灌浴 / 灵山大照壁 runtime-v1 接入

### 本轮新增 runtime 文件

| 地标 | POI / Inspector id | runtime modelUrl | 大小 | 说明 |
| --- | --- | --- | ---: | --- |
| 菩提大道 | `puti_avenue` | `/models/lingshan/optimized/bodhi-avenue.runtime-v1.glb` | 23 MB | 新版线性场景 runtime，用于替代旧 464M raw 方向。 |
| 九龙灌浴 | `jiulong_guanyu` | `/models/lingshan/optimized/jiulong-guanyu.runtime-v1.glb` | 44 MB | 新增核心参照地标，需后续人工校准。 |
| 灵山大照壁 | POI `lingshan_wall` / Inspector `lingshan_dazhaobi` | `/models/lingshan/optimized/lingshan-dazhaobi.runtime-v1.glb` | 28 MB | 新增核心参照地标，沿用现有灵山大照壁 POI anchor。 |

### 配置结论

- 菩提大道正式 `modelUrl` 不再引用 `/models/lingshan/landmarks/bodhi-avenue.glb`。
- 旧 464M `bodhi-avenue.glb` 本轮不处理、不压缩、不提交、不作为运行时引用。
- 九龙灌浴从 `missing_model` 切换为 `model_ready`。
- 灵山大照壁新增 overlay 配置，便于 Landmark Inspector 单体加载、卸载、聚焦和校准。

### 后续测试

三处模型均为保守初始 transform，只用于进入 Inspector。后续需要人工检查：

1. 是否能在腾讯地图 `GLTFModel` 中稳定显示和卸载。
2. 尺寸、朝向、高度和偏移是否需要校准。
4. debugPerf 是否记录加载耗时和错误。

树候选方向暂时暂停，后续树木可考虑用 Meshy AI 统一生成更明亮、更毛茸茸的树团资产。

## 17. 三处新增 runtime-v1 地标人工校准固化

### 固化参数

| 地标 | id | scale | height | rotationY | lngOffset | latOffset |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 灵山大照壁 | `lingshan_dazhaobi` | 150 | 6 | 28 | -0.00005 | 0 |
| 菩提大道 runtime-v1 | `puti_avenue` | 180 | 11 | 30 | 0.00009 | 0.00005 |
| 九龙灌浴 | `jiulong_guanyu` | 240 | 51 | 0 | 0.00003 | 0 |

### 提交边界

- 本次提交包含 3 个 runtime-v1 GLB：菩提大道约 23M、九龙灌浴约 44M、灵山大照壁约 28M。
- 旧 464M 菩提大道 raw 文件不处理、不提交、不作为运行时引用。
- 不提交 raw / safe-v1 / draco。
- 后续仍可通过 `/map-3d-guide-c?debugPerf=1` 的本地 calibration draft 覆盖默认值继续微调。
