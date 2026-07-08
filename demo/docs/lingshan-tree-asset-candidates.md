# 灵山 3D 树木候选资产记录

## 背景

当前 `/map-3d-guide-c` 的默认树群以已接入的 Kenney Nature Kit 树和灌木为主，视觉上更偏单棵树散点。后续希望向“圆冠树群 / 毛茸茸林团 / 灌木块”方向测试，因此本轮先把 5 个低模、低饱和、圆冠感更强的候选 GLB 接入 debugGarden 候选池。

本轮只接入候选，不替换默认树群，不修改 vegetation zones、keepout zones、默认 assets 或游客端默认视觉。

## 已接入候选

| 候选类型 | 资产名称 | 来源网站 | 原始链接 | 许可 | 需署名 | 原始格式 | 转换后路径 | 体积 | 已接入 debugGarden | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| `fluffy_round_tree` | Kenney Nature Kit `tree_fat.glb` | Kenney | https://kenney.nl/assets/nature-kit | CC0 1.0 Universal | 否 | GLB | `public/models/lingshan/tree-candidates/fluffy-round-tree-a.glb` | 5,536 B | 是 | 圆冠矮树，适合测试毛茸茸单株。 |
| `fluffy_tree_mix` | Kenney Nature Kit `tree_blocks.glb` | Kenney | https://kenney.nl/assets/nature-kit | CC0 1.0 Universal | 否 | GLB | `public/models/lingshan/tree-candidates/fluffy-round-tree-b.glb` | 10,084 B | 是 | 块状圆冠树，用于和 `fluffy_round_tree` 混合对照。 |
| `bushy_canopy_tree` | Kenney Nature Kit `tree_oak_dark.glb` | Kenney | https://kenney.nl/assets/nature-kit | CC0 1.0 Universal | 否 | GLB | `public/models/lingshan/tree-candidates/bushy-canopy-tree-a.glb` | 14,608 B | 是 | 深绿橡树冠，冠幅更饱满。 |
| `dense_shrub_cluster` | Kenney Nature Kit `plant_bushLargeTriangle.glb` | Kenney | https://kenney.nl/assets/nature-kit | CC0 1.0 Universal | 否 | GLB | `public/models/lingshan/tree-candidates/dense-shrub-cluster-a.glb` | 4,520 B | 是 | 大灌木候选，用于林缘和低矮密植测试。 |
| `soft_forest_clump` | Kenney Nature Kit `tree_detailed_dark.glb` | Kenney | https://kenney.nl/assets/nature-kit | CC0 1.0 Universal | 否 | GLB | `public/models/lingshan/tree-candidates/soft-forest-clump-a.glb` | 31,376 B | 是 | 细节更多的深绿树，可测试林团层次。 |

## 处理说明

- 资产来自项目内已有的 Kenney Nature Kit 官方源包：`tmp/map-3d-guide-assets/vendor-source/kenney-nature-kit/kenney_nature-kit.zip`。
- 本轮没有覆盖现有 Kenney vendor 资产，也没有替换默认树群。
- 候选文件放入 `public/models/lingshan/tree-candidates/`，命名为英文 kebab-case。
- 候选 GLB 保留原始几何和材质颜色，仅移除 `KHR_materials_unlit` 扩展标记，最终 `extensionsUsed` 为空。
- 未使用 Draco、Meshopt、KTX2、WebP 或 AVIF。

## 已评估但未导入

| 资源 | 来源 | 链接 | 许可 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| Quaternius Stylized Nature MegaKit | Quaternius / itch.io | https://quaternius.com/packs/stylizednaturemegakit.html | CC0 1.0 Universal | 未导入 | 官方页面说明包含 FBX、OBJ、Blend、glTF 和 40 个 tree models，但标准包下载走 itch.io name-your-own-price 流程，没有稳定直接下载链接。本轮不编造来源，也不绕过下载流程。 |

## debugGarden 接入边界

- 新候选只加入 debugGarden 的资产候选下拉。
- `defaultEditorAssetPool` 和 `defaultEditorAssetRatios` 保持原状，默认编辑器生成仍使用原有树 / 灌木 / 石头。
- `lingshanMap3DGardenVegetationZones`、默认 keepout zones 和默认生成 assets 不变。
- 普通 `/map-3d-guide-c` 不会默认加载这些候选 GLB。

## debugGarden 空白试验场

- `/map-3d-guide-c?debugGarden=1&debugPerf=1` 默认进入“空白园林试验场”，隐藏现有默认 199 个树群 overlay，但不删除、不修改默认资产数据。
- 面板提供“显示 / 隐藏默认树群”开关，便于在空白试验和默认布局参照之间切换。
- 地图 visual ready 后自动加载核心地标参照层，使用现有 safe-v2 runtime modelUrl；不加载 raw GLB，不加载菩提大道。
- Tree Candidate Lab 使用独立草稿键 `lingshan_tree_candidate_lab_draft_v1`，测试树不会写入默认 garden assets 草稿。
- 支持单株、小林团、中林团、背景林团四种测试模式，并可一键按横向间距生成 6 种候选对比。
- 测试树生成采用 seed 固定的圆形采样和最小间距拒绝策略，保证位置可复现；仅用于调试页人工比选。
- `debugPerf` 记录默认树群隐藏状态、地标参照状态、测试树数量、默认 / 测试树 live overlay 数和候选生成事件。

## 用户生成毛茸茸树团压缩试验：fluffy-bodhi-grove

### 资产结果

| 项目 | 路径 | 大小 |
| --- | --- | ---: |
| raw 输入 | `public/models/lingshan/tree-candidates/fluffy-bodhi-grove.raw.glb` | 10,348,688 B / 9.87 MiB |
| runtime-v1 输出 | `public/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb` | 1,254,360 B / 1.20 MiB |

压缩后体积约为 raw 的 12.12%，约减少 87.88%，约 8.25x smaller。

### 优化命令

```bash
npx --yes @gltf-transform/cli prune public/models/lingshan/tree-candidates/fluffy-bodhi-grove.raw.glb /private/tmp/fluffy-bodhi-grove.prune.glb
npx --yes @gltf-transform/cli dedup /private/tmp/fluffy-bodhi-grove.prune.glb /private/tmp/fluffy-bodhi-grove.dedup.glb
npx --yes @gltf-transform/cli weld /private/tmp/fluffy-bodhi-grove.dedup.glb /private/tmp/fluffy-bodhi-grove.weld.glb
npx --yes @gltf-transform/cli simplify /private/tmp/fluffy-bodhi-grove.weld.glb /private/tmp/fluffy-bodhi-grove.simplify.glb --ratio 0.65 --error 0.002
npx --yes @gltf-transform/cli resize /private/tmp/fluffy-bodhi-grove.simplify.glb /private/tmp/fluffy-bodhi-grove.resize.glb --width 1024 --height 1024
npx --yes @gltf-transform/cli jpeg /private/tmp/fluffy-bodhi-grove.resize.glb public/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb --quality 76 --formats jpeg
npx --yes @gltf-transform/cli tangents public/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb /private/tmp/fluffy-bodhi-grove.runtime-v1.tangents.glb
cp /private/tmp/fluffy-bodhi-grove.runtime-v1.tangents.glb public/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v1.glb
```

### 验证

- `extensionsUsed`: none
- `extensionsRequired`: none
- 未使用 Draco、Meshopt、KTX2、WebP 或 AVIF。
- `validate`: no errors found, no warnings found。
- runtime-v1 贴图为 4 张 1024x1024 JPEG；raw 贴图为 4 张 2048x2048 JPEG。
- raw 几何体积约 773.6 KB，runtime-v1 含 tangent 后网格约 896.92 KB；主要收益来自贴图 resize / JPEG 重编码。

### 建议

这个树团视觉方向较好，raw 约 10MB 偏大；runtime-v1 已降到约 1.2MB，适合作为主树团候选进入 Tree Candidate Lab 人工测试。本轮只生成 safe-compatible runtime GLB 和压缩报告，未接入默认树群，也未让普通 `/map-3d-guide-c` 默认加载该树团。

## Tree Candidate Lab 推荐候选接入

- 新增候选 id：`fluffy_bodhi_grove`。
- 显示名称：毛茸茸菩提树团。
- 模型路径：`/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v2.glb`。
- runtime-v1 原始测试参数曾使用 scaleMin 0.75、scaleMax 1.15；runtime-v2 接入后按地图显示尺度归一化为 scaleMin 48、scaleMax 74.4，并按 scale 自动设置贴地 height。
- 推荐模式：小树团、中树团、背景林团；同时保留单棵测试能力。
- Tree Candidate Lab 中分组为“推荐候选”，原 5 个 Kenney 候选保留在“旧候选 / legacy”分组。
- 一键候选对比已包含 `fluffy_bodhi_grove`，当前共 6 种候选。
- 普通 `/map-3d-guide-c` 不默认加载该树团，默认 199 个树群和默认 vegetation zones 不变。

## Tree Candidate Lab 手动摆树模式

- `/map-3d-guide-c?debugGarden=1&debugPerf=1` 默认进入手动摆树流程：选树种、选添加模式、点击地图直接添加测试树。
- 用户不再需要先画放置区或禁放区，也不需要生成预览再应用。
- 单个、小树团、中树团、背景林团四种模式继续复用同一套候选参数。
- 添加后的测试树只进入 `lingshan_tree_candidate_lab_draft_v1`，不会写入默认 199 个树群。
- 测试树 marker 可点击选中，选中后可拖动位置并调整 scale / height / rotationY。
- 放置区、禁放区、5 步工作台、批量生成、一键候选对比等能力保留在高级折叠区。

## 手动树群默认化

- 用户手动摆放并导出的 869 个 Tree Candidate Lab assets 已固化为新默认树群。
- 新数据文件：`src/data/lingshanMap3DManualTreeAssets.ts`。
- 普通 `/map-3d-guide-c` 使用新手动树群，不再默认显示旧 199 deterministic 树群。
- 旧 199 树群保留为 legacy，不删除源数据和 GLB，可在 debugGarden 高级区临时切换查看。
- 新默认树群仍引用 Tree Candidate Lab 的 6 个候选模型，其中 `fluffy_bodhi_grove` 作为主要毛茸茸树团候选之一。
- 数据校验结果：869 个 id 全部唯一，未发现缺失经纬度、缺失模型路径、非法 scale / height / rotationY 或缺失模型文件。
- 当前 869 个独立 GLB overlay 适合视觉验证；后续若性能压力偏高，可把部分背景树团合并为 grove cluster GLB。

## 手动树群 scale 归一化

- `fluffy_bodhi_grove.runtime-v2.glb` 原始包围盒约 1.9m 量级，scale 1 在地图沙盘上过小，容易出现“锚点存在但树团不明显”的现象。
- 新增按树种归一化：`fluffy_bodhi_grove` 的旧 0.75–1.15 scale 映射到 48–74，比上一版放大 1.2 倍。
- runtime-v2 的 height 改为参考其它树种的低位贴地值，按 `scale * 0.04` 自动设置，默认手动树群约为 1.9–3.0，避免毛茸茸树离地漂浮。
- 归一化只影响显示尺寸，不改 lng / lat 点位、height、yaw 或模型文件。
- 已经归一化后的 30+ scale 不会再次放大，避免刷新本地草稿时重复叠乘。

## Meshy stylized low 0616093941 runtime-v2 替换

| 项目 | 路径 | 大小 |
| --- | --- | ---: |
| raw 输入 | `public/models/lingshan/tree-candidates/Meshy_AI_Create_a_stylized_low_0616093941_texture.glb` | 11,906,384 B / 11.36 MiB |
| runtime-v2 输出 | `public/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v2.glb` | 1,419,520 B / 1.35 MiB |

- 压缩率约 88.08%。
- 使用 safe-compatible 流程：prune、dedup、weld、simplify、resize、jpeg、tangents。
- 未使用 Draco、Meshopt、KTX2、WebP 或 AVIF。
- `extensionsUsed`: none；`extensionsRequired`: none。
- `validate`: no errors found, no warnings found。
- `fluffy_bodhi_grove` 已切换到 runtime-v2，runtime-v1 保留为历史候选文件，当前默认树群不再引用 runtime-v1。

## 后续计划

1. 在 `/map-3d-guide-c?debugGarden=1` 中手动测试 5 个候选的比例、颜色和林团观感。
2. 选出 3-4 个主树种，形成更圆润的青绿园林资产池。
3. 再设计 grove cluster / 林团式生成策略。
4. 最后才考虑替换默认树群资产池和调整默认布局。
