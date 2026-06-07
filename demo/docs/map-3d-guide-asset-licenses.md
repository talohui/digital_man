# /map-3d-guide 水墨装饰素材许可证记录

## 1. 记录目的

本文记录 `/map-3d-guide` 路线唤醒水墨装饰层使用的视觉素材来源、许可证、用途和署名要求，避免后续将许可证不明确的外部素材直接放入正式页面。

## 2. 本阶段素材结论

阶段六十九的最小可运行版本没有引入外部图片、外部 SVG、外部 PNG 或第三方素材包。

当前使用的装饰包括：

- 松树 / 树影。
- 柳树。
- 水体墨痕。
- 院落。
- 小桥。
- 山石。
- 云雾。
- 莲花。
- 佛光 / 光点。
- 石阶。

这些元素全部由 `src/pages/Map3DGuidePage.tsx` 中的内联 SVG 函数生成，属于项目代码自绘图形。

## 3. 视觉参考

本阶段只参考以下页面的视觉方向，不复制、下载或复用其图片、SVG、字体、脚本、纹理或其它素材：

| 来源 | 用途 | 是否使用素材 | 许可证处理 |
| --- | --- | --- | --- |
| https://gamemcu.com/hz/ | 水墨杭州、路线唤醒、东方导览氛围参考 | 否 | 仅作视觉方向参考，不纳入项目素材 |
| https://chartogne-taillet.com/fr | 高级品牌叙事、克制动效和沉浸式滚动气质参考 | 否 | 仅作视觉方向参考，不纳入项目素材 |

## 4. 当前素材清单

| 素材类型 | 实现方式 | 文件 | 许可证 | 是否需要署名 |
| --- | --- | --- | --- | --- |
| 水墨树木、柳树、桥、水体、院落、山石、云雾、莲花、光点、石阶 | 项目内联 SVG 代码生成 | `src/pages/Map3DGuidePage.tsx` | 项目自有代码 | 否 |
| 宣纸纹理、边缘雾化、轻滤镜 | CSS 渐变和半透明层 | `src/pages/Map3DGuidePage.tsx` | 项目自有代码 | 否 |
| 地图底图 | 腾讯地图 JavaScript API GL 和腾讯个性化地图样式 | 外部地图服务 | 以腾讯位置服务协议为准 | 按腾讯服务要求 |
| GLB 景点模型 Beta | 项目已有 GLB 文件 | `public/models/lingshan/landmarks/` | 以模型资产来源记录为准 | 按模型来源要求 |

## 5. 后续素材接入规则

后续如果需要引入真实外部素材，必须先记录：

- 来源 URL。
- 作者 / 机构。
- 许可证名称。
- 是否允许商用。
- 是否允许修改。
- 是否需要署名。
- 素材用途。
- 存放路径。

优先级：

1. 项目原创 SVG / CSS / Blender 资产。
2. CC0 / Public Domain。
3. MIT / Apache-2.0。
4. 明确允许商用和改编的 CC BY，并按要求署名。

不使用：

- 许可证不明的图片或 SVG。
- 从参考网站直接抓取的视觉资源。
- 未确认授权的字体、纹理、图标和插画。
- 不能商用或不能改编的素材。

## 6. 当前结论

阶段六十九的 `/map-3d-guide` 水墨路线唤醒装饰层不依赖第三方素材文件，暂不需要额外署名。后续如引入外部图片、SVG、纹理或字体，必须先更新本文档再进入代码。

## 7. A/B 视觉原型外部素材

阶段 A/B 视觉原型开始引入可商用开源素材。所有素材只作为腾讯地图坐标锚定 marker 使用，不作为固定屏幕大面积覆盖层。

| 文件 | 来源 URL | 作者 / 项目 | 许可证 | 允许商用 | 需要署名 | 用途 | 使用范围 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public/assets/map-3d-guide/shared/foliagePack_004.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否；OpenGameArt 页面说明署名 Kenney.nl 非强制 | 树木 / 松影 marker | A / B 共用 |
| `public/assets/map-3d-guide/shared/foliagePack_007.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否 | 树木 marker | A / B 共用 |
| `public/assets/map-3d-guide/shared/foliagePack_011.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否 | B 版树群 marker | B |
| `public/assets/map-3d-guide/shared/foliagePack_027.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否 | 树木 marker | A / B 共用 |
| `public/assets/map-3d-guide/shared/foliagePack_041.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否 | B 版树群 marker | B |
| `public/assets/map-3d-guide/shared/foliagePack_049.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否 | 山石 marker | A / B 共用 |
| `public/assets/map-3d-guide/shared/foliagePack_058.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否 | B 版小型自然物 marker | B |
| `public/assets/map-3d-guide/shared/foliagePack_leaves_001.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否 | B 版叶片 / 林影 marker | B |
| `public/assets/map-3d-guide/shared/lotus_0282.png` | https://opengameart.org/content/lotus-flowers | gostay / Lotus Flowers | CC0 | 是 | 否；页面说明不需要署名 | 莲花节点 marker | A / B 共用 |
| `public/assets/map-3d-guide/shared/lotus_3996.png` | https://opengameart.org/content/lotus-flowers | gostay / Lotus Flowers | CC0 | 是 | 否 | 莲花节点 marker | A / B 共用 |
| `public/assets/map-3d-guide/shared/lotus_7692.png` | https://opengameart.org/content/lotus-flowers | gostay / Lotus Flowers | CC0 | 是 | 否 | B 版密集莲花 marker | B |

## 8. C 版 3D 园林资产

阶段 C 没有直接下载第三方 GLB 资产。当前使用的是项目自制低模 fallback GLB，目标是先验证腾讯地图 `TMap.model.GLTFModel` 多实例、经纬度锚定和 debugGarden 调参流程。

### 8.1 第一版非树 fallback 资产

这些资产不来自外部素材站，不需要第三方署名。后续如果替换为 Kenney / Quaternius / Poly Haven / Sketchfab / OpenGameArt 等外部资产，必须先新增逐项许可证记录。

注意：这些第一版非树资产在当前 `/map-3d-guide-c` 中已经暂停显示。原因是桥、院墙、香炉、法轮、莲台、石阶等符号如果位置不准确，会比树群更像 debug 占位。文件可以暂留仓库，但不再进入 C 版默认资产配置。

| 文件 | 来源 URL | 作者 / 项目 | 许可证 | 允许商用 | 需要署名 | 用途 | 使用范围 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public/assets/map-3d-guide/glb-garden/garden_pine_cluster.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 树群 / 松阵 | C |
| `public/assets/map-3d-guide/glb-garden/garden_rock_cluster.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 山石 / 出口收束 | C |
| `public/assets/map-3d-guide/glb-garden/garden_stone_steps.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 南门和登佛石阶 | C |
| `public/assets/map-3d-guide/glb-garden/garden_courtyard_wall.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 南门院墙 / 梵宫庭墙 | C |
| `public/assets/map-3d-guide/glb-garden/garden_arch_bridge.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 游线小桥 | C |
| `public/assets/map-3d-guide/glb-garden/garden_temple_roof.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 祥符禅寺屋顶符号 | C |
| `public/assets/map-3d-guide/glb-garden/garden_lotus_pedestal.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 佛前莲台 / 坛城石台 | C |
| `public/assets/map-3d-guide/glb-garden/garden_dharma_wheel.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 五印坛城法轮符号 | C |
| `public/assets/map-3d-guide/glb-garden/garden_incense_burner.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 祥符禅寺香炉 | C |

### 8.2 当前树群 / 山林 fallback 资产

当前 `/map-3d-guide-c` 使用以下树群、竹林、灌木和林缘资产。它们仍为项目自制低模 fallback，不来自外部素材站，不需要署名。

| 文件 | 来源 URL | 作者 / 项目 | 许可证 | 允许商用 | 需要署名 | 用途 | 使用范围 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public/assets/map-3d-guide/glb-garden/trees/ink_pine_cluster_v2.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 松群 / 中轴两侧林带 | C |
| `public/assets/map-3d-guide/glb-garden/trees/ink_mixed_grove_v2.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 混合树群 / 大佛背后山林 | C |
| `public/assets/map-3d-guide/glb-garden/trees/ink_bamboo_grove_v2.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 竹林 / 寺院和中轴边缘 | C |
| `public/assets/map-3d-guide/glb-garden/trees/ink_shrub_mass_v2.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 低矮灌木 / 广场边缘留白 | C |
| `public/assets/map-3d-guide/glb-garden/trees/ink_forest_edge_v2.glb` | 项目自制 | 灵山 demo 项目 | 项目自有低模 fallback | 是 | 否 | 林缘 / 山体包围感 | C |

## 9. 外部 3D 资产候选与拒绝规则

子 agent 调研后建议优先考虑：

- Kenney / Nature Kit：CC0，适合轻量自然占位。
- Quaternius / Poly Pizza 低模自然包：CC0 / Public Domain，适合树、灌木、山石。
- Poly Haven：CC0，质量高，但很多模型体积和面数偏大，需要压缩或降面。
- OpenGameArt：逐项判断；CC0 可用，CC BY 需署名。
- Sketchfab：只使用明确 CC0 或纯 CC BY 且权利链可信的单模型；CC BY 需要记录作者、来源和修改情况。

本阶段拒绝或暂不使用：

- CC BY-NC / NC-SA / Personal use only。
- CC BY-SA / CC BY-ND。
- Editorial / Royalty-Free 自定义 EULA。
- 许可证不明或权利链不清的 AI 生成资产。
- 过大的扫描模型，例如数百 MB 或百万级三角面的树木、山石、莲花。
- 过卡通、过现代、过西式、过幼态的园林模型。
- 需要大量透明贴图或复杂 shader 的资产。

后续接入外部资产前，必须补充：

- 原始 URL。
- 作者 / 机构。
- 许可证 URL。
- 下载日期。
- 是否改材质 / 压缩 / 降面。
- 是否需要公开署名。

本阶段具体核验到的可用候选：

- Kenney Nature Kit：`https://kenney.nl/assets/nature-kit`，页面标注 Creative Commons CC0，330 个 3D nature/tree/rock/foliage 文件。适合后续挑选低模树、灌木和石块。
- Eclair Assets 的 Kenney Nature Kit GLB convenience pack：`https://eclair-assets.itch.io/nature-kit-glb-pack-329-free-cc0-3d-models`，页面说明基于 Kenney CC0 Nature Kit，包含 329 个 GLB，并保留原始 Kenney license text。适合后续快速试接，但仍需下载后逐个筛选。
- Quaternius / Poly Pizza Stylized Nature MegaKit：`https://poly.pizza/bundle/Stylized-Nature-MegaKit-T34GZFA0fm`，页面标注 Public Domain (CC0)，含树、松、草、灌木、石块等。适合后续替换树群 fallback。
- Quaternius Stylized Nature MegaKit 官方页：`https://quaternius.com/packs/stylizednaturemegakit.html`，页面标注 CC0，并说明可用于个人、教育和商业项目。

## 10. 阶段七十四 Kenney Nature Kit 正式接入资产

阶段七十四开始将 `/map-3d-guide-c` 的项目自制树群 fallback 替换为 Kenney 官方 CC0 自然资产。原始包下载到本地 `tmp/map-3d-guide-assets/vendor-source/kenney-nature-kit/` 供核验，不提交原始 ZIP。

来源：

- 官方页面：`https://kenney.nl/assets/nature-kit`
- 作者 / 项目：Kenney / Nature Kit
- 包内许可证文件：`License.txt`
- 许可证：Creative Commons Zero (CC0)
- 是否允许商用：是
- 是否需要署名：否；包内说明署名 Kenney 或 `www.kenney.nl` 可支持作者，但不是强制要求
- 接入范围：仅 `/map-3d-guide-c`

正式提交的 vendor GLB：

| 文件 | 来源 URL | 作者 / 项目 | 原许可证 | 允许商用 | 需要署名 | 是否做过格式转换 / 材质调整 / 压缩 | 用途 | 使用范围 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `public/assets/map-3d-guide/glb-garden/vendor/KENNEY_NATURE_KIT_LICENSE.txt` | https://kenney.nl/assets/nature-kit | Kenney / Nature Kit | CC0 | 是 | 否 | 原样复制包内 `License.txt` | 许可证存档 | C |
| `public/assets/map-3d-guide/glb-garden/vendor/kenney_tree_pine_tall_a.glb` | https://kenney.nl/assets/nature-kit | Kenney / Nature Kit | CC0 | 是 | 否 | 从包内 `Models/GLTF format/tree_pineTallA.glb` 原样抽取，未转格式，未调材质 | 松树 / 中轴林带 / 佛前松阵 | C |
| `public/assets/map-3d-guide/glb-garden/vendor/kenney_tree_pine_round_c.glb` | https://kenney.nl/assets/nature-kit | Kenney / Nature Kit | CC0 | 是 | 否 | 从包内 `Models/GLTF format/tree_pineRoundC.glb` 原样抽取，未转格式，未调材质 | 林缘 / 针叶树群 | C |
| `public/assets/map-3d-guide/glb-garden/vendor/kenney_tree_default_dark.glb` | https://kenney.nl/assets/nature-kit | Kenney / Nature Kit | CC0 | 是 | 否 | 从包内 `Models/GLTF format/tree_default_dark.glb` 原样抽取，未转格式，未调材质 | 深色阔叶树 / 大佛背后山林 | C |
| `public/assets/map-3d-guide/glb-garden/vendor/kenney_bush_detailed.glb` | https://kenney.nl/assets/nature-kit | Kenney / Nature Kit | CC0 | 是 | 否 | 从包内 `Models/GLTF format/plant_bushDetailed.glb` 原样抽取，未转格式，未调材质 | 灌木 / 广场边缘低矮绿量 | C |
| `public/assets/map-3d-guide/glb-garden/vendor/kenney_bush_large.glb` | https://kenney.nl/assets/nature-kit | Kenney / Nature Kit | CC0 | 是 | 否 | 从包内 `Models/GLTF format/plant_bushLarge.glb` 原样抽取，未转格式，未调材质 | 大灌木候选，当前配置中暂未重点使用 | C |
| `public/assets/map-3d-guide/glb-garden/vendor/kenney_rock_large_c.glb` | https://kenney.nl/assets/nature-kit | Kenney / Nature Kit | CC0 | 是 | 否 | 从包内 `Models/GLTF format/rock_largeC.glb` 原样抽取，未转格式，未调材质 | 照壁侧山石 | C |
| `public/assets/map-3d-guide/glb-garden/vendor/kenney_rock_tall_h.glb` | https://kenney.nl/assets/nature-kit | Kenney / Nature Kit | CC0 | 是 | 否 | 从包内 `Models/GLTF format/rock_tallH.glb` 原样抽取，未转格式，未调材质 | 九龙灌浴侧山石 | C |

说明：

- 本阶段没有提交 Quaternius 资产。Quaternius Stylized Nature MegaKit 仍是后续优先候选，但本阶段没有取得可稳定自动下载并逐项检查的正式 GLB 包，因此不强行接入。
- 本阶段没有接入桥、院墙、香炉、法轮、莲台、亭子、寺庙屋顶等复杂非树资产。
- 如果后续对 Kenney GLB 做材质重调、压缩或组合成树群 GLB，需要在本文件中追加派生文件记录。
