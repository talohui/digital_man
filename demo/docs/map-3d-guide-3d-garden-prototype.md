# /map-3d-guide-c 3D 园林资产导览原型方案

## 1. 目标

`/map-3d-guide-c` 用于验证“沉稳 3D 园林资产版”导览地图。它不再继续堆叠 PNG / SVG 贴片，而是让腾讯地图继续作为真实坐标、3D 相机、路线规划和 GLB 锚定底座，再沿历史文化路线布置低模 3D 园林资产。

第一版只覆盖历史文化路线沿线核心区域，不覆盖全园区。

## 2. 为什么 A/B 不再继续加素材

A/B 原型已经证明坐标锚定 marker 可行，但 PNG / SVG 贴片容易出现：

- 贴纸感强，缺少 3D 空间体积。
- 素材越多越幼态、卡通化。
- 大量透明贴片会和腾讯底图、路线、POI 抢视觉层级。
- 风格统一需要严格素材筛选，否则容易变成拼贴。

C 版改用 GLB / 低模 3D 园林资产，目标是更接近沉稳园林沙盘，而不是插画贴纸。

## 3. 子 agent 搜索与审核结论

### 自然园林资产

子 agent A 推荐优先关注 Quaternius / Poly Pizza 的自然低模包、Kenney Nature Kit、flo-bit low poly nature pack、Poly Haven 少量 CC0 灌木和山石，以及明确 CC BY 且轻量的 Sketchfab 竹子 / 石阶资产。

被拒绝的主要原因包括：高面数扫描过重、CC BY-NC / NC-SA 禁止商用、许可证不清、风格过亮过游戏化。

### 东方建筑与佛教符号资产

子 agent B 推荐桥、寺庙屋顶、院墙、香炉、法轮、莲台等低模候选。其中 Top Bit Studios 的 CC0 低模桥、OpenGameArt CC0 石桥、Sketchfab CC BY 法轮 / 寺庙屋顶 / 亭台等可作为后续替换候选。

被拒绝的主要原因包括：非商业授权、AI 生成权利链不稳、文化语境不匹配、三角面过高。

### 许可证审核

子 agent C 建议只允许：

- CC0 / Public Domain。
- MIT。
- Apache-2.0。
- 可商用且可改编的 CC BY。

默认拒绝：

- 许可证不明。
- Personal use only。
- CC BY-NC / NC-SA / NC-ND。
- CC BY-SA。
- Editorial / Royalty-Free 自定义 EULA。
- GPL / LGPL / AGPL 艺术资产。

### 性能与风格审核

子 agent D 建议 C 版保持克制：

- 首屏默认 0-1 个大型 GLB，桌面最多 2 个大模型。
- 单个园林装饰模型目标小于 1.5MB，硬上限 3MB。
- 运行期 GLB 总量控制在 8-10MB 内。
- 重复树群、山石、石阶等优先实例化或复用轻量模型。
- 25MB 级 AI 直出模型不应默认首屏加载。

## 4. 资产选择更新：树群 / 山林版

第一版 C 原型曾使用项目自制的桥、院墙、香炉、法轮、莲台、石阶等低模 fallback。人工观察后确认这些非树类资产一旦摆放不准确，会比树群更容易显假，且黑色 / 粗糙占位感会破坏“沉稳 3D 园林沙盘”的目标。

因此当前 C 版先收敛为“树群 / 山林氛围”版本：

- 暂停显示桥、院墙、香炉、法轮、莲台、石阶等非树资产。
- 不再把非树符号作为主视觉。
- 少量山林 / 灌木 / 竹影 / 松群负责建立空间边界。
- 后续只有在拿到更准确位置、尺寸和风格统一的正式模型后，再恢复桥、院墙、香炉等复杂资产。

本阶段仍没有直接下载第三方 GLB。原因：

- 需要避免把许可证、署名、体积和风格不稳定的素材直接放入 demo。
- 公开调研确认 Quaternius / Poly Pizza、Kenney / Eclair GLB 包等 CC0 资源可作为后续候选，但真实接入前仍需要挑选具体模型、确认大小、压缩和视觉统一。
- 当前目标是先修复 C 版视觉方向，让页面不再出现黑色 debug 感桥、墙、香炉和法轮。
- 项目自制树群 fallback 资产更可控、体积小、风格统一，可作为正式外部资产接入前的安全版本。

当前使用 5 个项目自制树群 / 山林低模 GLB：

- `ink_pine_cluster_v2.glb`
- `ink_mixed_grove_v2.glb`
- `ink_bamboo_grove_v2.glb`
- `ink_shrub_mass_v2.glb`
- `ink_forest_edge_v2.glb`

文件放在：

`public/assets/map-3d-guide/glb-garden/trees/`

它们是项目自制低模 fallback，不是第三方素材。后续如果替换为 Kenney、Quaternius、Poly Haven 等外部资产，必须先更新许可证记录。

## 5. 路线铺陈方式

新增 `src/data/lingshanMap3DGardenAssets.ts`，每个资产记录：

- `id`
- `kind`
- `assetUrl`
- `location`
- `scale`
- `height`
- `yaw`
- `opacity`
- `visible`
- `priority`
- `routeFraction`
- `licenseId`
- `note`

资产不再简单沿路线均匀撒点，而是参考灵山胜境俯拍结构布置：

- 南门到大佛形成中轴线，两侧以林缘和松群包裹。
- 胜境广场、九龙灌浴、佛前广场等开阔节点保留留白，不把树堆到广场中心。
- 灵山大佛周边和背后布置高密度山林背景，但不覆盖大佛 marker 和 GLB 模型。
- 祥符禅寺、梵宫、五印坛城周边只在建筑边缘放适量树群，不压建筑主体。
- 道路中心、路线主线、当前站点、下一站和重规划线保持无遮挡。

所有资产都使用真实经纬度，运行时通过 `TMap.model.GLTFModel` 绑定到腾讯地图。

## 6. 路线唤醒机制

C 版通过 `routeFraction` 控制显现顺序：

- 普通模式下，只显示当前模拟路线进度附近和已到达的 3D 园林资产。
- `debugGarden=1` 时显示全部资产，方便调参。
- 模拟偏航或重规划时，低优先级资产会暂时隐藏，避免抢重规划路线。

由于腾讯 `GLTFModel` 不一定暴露统一透明度控制，第一版以“创建 / 不创建模型”的方式实现渐显，不做材质级淡入。

## 7. debugGarden 调试

访问：

`/map-3d-guide-c?debugGarden=1`

可调：

- 资产选择。
- 纬度 / 经度。
- `scale`。
- `height`。
- `yaw`。
- `routeFraction`。
- `visible`。
- `priority`。

调试结果会保存到：

`localStorage.lingshan-map-3d-guide-garden-assets-v2`

面板支持：

- 复制 TS 配置片段。
- 复制调试摘要。
- 恢复默认配置。

## 8. 当前限制

- 当前 GLB 是项目自制树群低模 fallback，重点是验证空间组织，不是最终美术品质。
- 透明度 / 墨迹淡入尚未做材质级控制。
- 资产数量为树群版，后续可按性能逐步增加或替换为正式开源树木资产。
- 外部 GLB 资产接入前必须完成许可证、署名、体积和风格审核。
- 桥、院墙、香炉、法轮、莲台、石阶等复杂非树资产暂不显示。
- `/map-3d-guide-c` 不改变普通 `/map-3d-guide`、A/B 原型、`/map` 或 `/scenic-3d-map`。

## 9. 后续建议

1. 从 Quaternius / Kenney / Poly Haven / Sketchfab CC BY 候选中选择 2-3 个真实外部 GLB 做替换验证。
2. 建立每个外部资产的证据截图和 license 存档。
3. 将 GLB 压缩到移动端可接受体积。
4. 为腾讯 `GLTFModel` 增加距离级别或按需加载。
5. 如果腾讯 GLTFModel 对多实例性能不足，再考虑将重复资产合并为少量组合 GLB。

## 10. 阶段七十四更新：Kenney CC0 自然资产接入

阶段七十四已将 C 版从项目自制树群 fallback 切换为 Kenney 官方 `Nature Kit` 中的少量 CC0 GLB：

- 2-3 种树：松树、针叶树、深色阔叶树。
- 1-2 种灌木：细节灌木和大灌木候选。
- 1-2 种山石：低矮山石和竖向山石。

正式文件位于：

`public/assets/map-3d-guide/glb-garden/vendor/`

原始 ZIP 仅保留在：

`tmp/map-3d-guide-assets/vendor-source/kenney-nature-kit/`

不提交原始大包。

### 配置变化

`src/data/lingshanMap3DGardenAssets.ts` 仍保留原有 19 个沿线实例和布局思想，但 `assetUrl` 已从：

`/assets/map-3d-guide/glb-garden/trees/ink_*.glb`

切换为：

`/assets/map-3d-guide/glb-garden/vendor/kenney_*.glb`

`licenseId` 统一更新为 `kenney-nature-kit-cc0`。

### 布局保持

仍然保留：

- 中轴两侧林带。
- 大佛周边和背后树群。
- 祥符禅寺、梵宫、五印坛城边缘树群。
- 广场和主路线留白。

少量原灌木点改为山石点，用来增加边界层次，但不恢复桥、院墙、香炉、法轮、莲台、亭台、寺庙屋顶等复杂非树模型。

### debugGarden

`debugGarden` 继续可用。localStorage key 已升级为：

`lingshan-map-3d-guide-garden-assets-v3-vendor-nature`

如果浏览器仍显示旧 fallback 配置，应在 `/map-3d-guide-c?debugGarden=1` 中点击“恢复默认”，重新加载 vendor 树群配置。

### 当前限制

- Kenney Nature Kit 风格仍偏通用低模自然资产，不是专门中式园林模型。
- 本阶段没有进行材质重调、模型合并、降面或自定义压缩。
- Quaternius Stylized Nature MegaKit 仍是后续候选，但本阶段未接入，原因是没有取得可稳定下载并逐项验证的正式 GLB 包。
- 非树复杂资产仍禁用，避免再次出现占位模型破坏页面气质。

## 11. 阶段七十五更新：高密度山林园林布局

阶段七十五解决了 C 版“树太少、树种不明显、未到区域隐藏过强”的问题。

### 数量变化

默认 3D 园林实例从 19 个增加到 67 个，仍全部使用 Kenney Nature Kit CC0 小型 GLB。新的默认配置覆盖：

- 松树：中轴入口、佛前广场、大佛北侧、出口边缘。
- 针叶树 / 林缘：中轴两侧、登佛路线、大佛背后、出口收束。
- 深色阔叶树：九龙西侧、大佛背后、祥符禅寺、梵宫边缘。
- 灌木 / 低树：南门、胜境广场、九龙灌浴、佛前广场、梵宫和五印坛城边缘。
- 低矮山石 / 竖向山石：照壁、九龙灌浴、大佛两侧、梵宫水岸、五印坛城边缘。

### 布局原则

布局参考用户提供的灵山胜境俯拍结构：

- 南门到大佛中轴线两侧形成连续林带。
- 灵山大佛背后、两侧和佛前广场边缘形成最高密度山林背景。
- 祥符禅寺、梵宫、五印坛城边缘布置中密度树群。
- 水体边缘和广场边缘使用灌木、低树和少量山石。
- 胜境广场、佛手广场、九龙灌浴水景、主路线和建筑主体保持留白。

### 显现逻辑

旧逻辑会按 `routeFraction <= progress` 过滤资产，导致未到区域几乎不可见。阶段七十五改为：

- 所有 `visible=true` 的树群默认常显。
- 未到区域保持低透明度和略小 scale，形成远处山林氛围。
- 当前进度附近提升透明度和 scale，形成“路线唤醒”效果。
- 已经过区域保持中等透明度，不会突然消失。
- 偏航 / 重规划时只降低低优先级树群的表现，不隐藏主林带。

### debugGarden

`debugGarden` 继续可用，localStorage key 升级为：

`lingshan-map-3d-guide-garden-assets-v4-dense-grove`

如果浏览器仍显示旧 19 点配置，应在 `/map-3d-guide-c?debugGarden=1` 中点击“恢复默认”，切回高密度树群配置。调试面板新增 `opacity` 字段，复制 TS 配置和调试摘要仍可用。

## 12. 航拍参考 vegetation zones 重构

本轮进一步将 C 版从“沿路线撒点”重构为“区域化林带布局”。

### 区域生成

`src/data/lingshanMap3DGardenAssets.ts` 新增 deterministic vegetation zones。每个 zone 使用椭圆区域描述：

- 中心经纬度。
- 长短轴半径。
- 旋转角。
- 目标实例数量。
- 资产池。
- scale / height / opacity 范围。
- routeFraction 范围。

生成逻辑使用固定 hash 和黄金角采样，不使用 `Math.random()`，因此刷新页面不会改变树群位置。

### 区域清单

当前定义 15 个 vegetation zones：

- 大佛背后北侧山体。
- 大佛西侧山坡。
- 大佛东侧山坡。
- 佛前广场边缘低树。
- 中轴西侧连续林带。
- 中轴东侧连续林带。
- 九龙灌浴西侧林地。
- 九龙灌浴东侧边缘绿化。
- 胜境广场西侧林带。
- 胜境广场东侧林带。
- 祥符禅寺边缘林带。
- 梵宫边缘庭林。
- 五印坛城水岸林缘。
- 南门外侧低密缓冲。
- 出口边缘收束林带。

默认实例数量为 187 个，仍在移动端需要继续观察性能。

### 留白规则

新增 keepout 规则：

- 主路线近距离 corridor。
- 南门中轴入口。
- 胜境广场中心。
- 九龙灌浴水景核心。
- 佛前广场和大佛 marker 周边。
- 祥符禅寺建筑主体。
- 梵宫主体。
- 五印坛城主体。
- 南侧停车场主区域。

这些 keepout 不追求厘米级精度，目标是避免树群压住路线、POI、广场、建筑和停车场主体。

### 色调处理

本轮新增 Kenney Nature Kit 的 `_sage.glb` 派生文件，仅修改 GLB 材质 `baseColorFactor`：

- 叶子 / 草：深青绿、灰绿、墨绿。
- 树干：低饱和灰褐色。
- 山石 / 土色：灰米色、青灰色。

C 版默认 assetUrl 已切换到 `_sage.glb` 文件，降低黑色占位感和过亮卡通感。

### 显现逻辑

显现逻辑继续使用“整体常显 + 当前唤醒”：

- 所有树群默认常显。
- 未到区域低透明和略小 scale。
- 当前区域提高透明度并放大。
- 已经过区域保持可见。
- 偏航 / 重规划时低优先级树群略降透明，但主林带不消失。

如果腾讯 `GLTFModel` 支持 `opacity` 或 `setOpacity`，会应用透明度；如果运行时不支持，则至少保留位置、scale 和高密度区域布局。

### debugGarden

localStorage key 升级为：

`lingshan-map-3d-guide-garden-assets-v5-aerial-zones`

如果仍显示旧点状树群，应点击“恢复默认”回到航拍参考树群布局。复制 TS 配置仍可用。

## 13. 人工校准与配置固化

阶段七十六继续把 C 版作为主线推进，A / B 贴片原型暂不继续。目标不是增加新功能，而是让默认树群配置更接近航拍结构，并让调试工具能支持人工批量校准。

### 默认配置校准

默认配置仍使用 deterministic vegetation zones，但参数已进一步校准：

- 大佛背后北侧山体从 25 个实例增加到 31 个实例，并提高 scale / height，使北侧山林形成稳定背景面。
- 大佛东西两侧山坡各增加到 16 个实例，补足大佛两翼林面。
- 中轴西侧林带增加到 20 个实例，中轴东侧林带增加到 17 个实例，让大佛到九龙灌浴之间更连续。
- 祥符禅寺、梵宫、五印坛城边缘分别小幅加密，建筑主体仍通过 keepout 留白。
- 南门和出口缓冲区减少到 4 + 4 个实例，避免入口、停车和道路区域过密。

默认实例数量从 187 个固化为 199 个，仍保持在第一版性能可控范围内。

### 留白进一步收紧

本阶段扩大了部分 keepout：

- 胜境广场中心。
- 九龙灌浴水景核心。
- 佛前广场和大佛 marker 周边。
- 祥符禅寺建筑主体。
- 梵宫主体。
- 五印坛城主体。

主路线 corridor 从 23m 加宽到 29m。这样树群仍形成林带，但不压住主金线、当前位置、下一站、核心广场和建筑主体。

### debugGarden 批量校准

`/map-3d-guide-c?debugGarden=1` 增强为可用于人工校准的面板：

- 按 zone 筛选。
- 按 kind 筛选。
- 按 priority 筛选。
- 按 visible 筛选。
- 可选中当前筛选结果首项。
- 可批量显示 / 隐藏当前筛选资产。
- 可批量缩放当前筛选资产。
- 可批量调整 height。
- 可批量调整 opacity。
- 可批量微调 lat / lng 偏移。
- 保留单点 lat / lng、scale、height、yaw、opacity、visible、priority、routeFraction 调整。
- 保留复制 TS 配置和复制调试摘要。

localStorage key 升级为：

`lingshan-map-3d-guide-garden-assets-v6-calibrated-aerial-zones`

如果浏览器保存过旧配置，默认不会继续覆盖本阶段固化后的 199 点校准布局。调试面板仍提供“恢复默认”，可回到当前航拍参考树群布局。

### 固化策略

本阶段没有依赖用户浏览器 localStorage 才能看到正确效果。默认树群配置已经固化在 `src/data/lingshanMap3DGardenAssets.ts` 的 zone 参数中，刷新页面后仍会得到稳定、可复现的 199 个实例。

## 14. 林带连续性与林地 patch

阶段七十七解决 C 版“树像独立棋子”的问题。树群数量保持在性能可控范围内，不继续无限增加模型数量，而是在主要 vegetation zones 下方增加地图坐标锚定的林地底色 patch。

### 林地 patch

`src/data/lingshanMap3DGardenAssets.ts` 新增 `lingshanMap3DForestPatches`，当前包含 9 个 patch：

- 大佛背后山林底色。
- 大佛西侧山坡底色。
- 大佛东侧山坡底色。
- 中轴西侧林带底色。
- 中轴东侧林带底色。
- 九龙西侧林地底色。
- 祥符禅寺边缘底色。
- 梵宫边缘庭林底色。
- 五印坛城水岸底色。

这些 patch 不是固定屏幕贴图。运行时优先使用腾讯地图 `TMap.MultiPolygon` 生成经纬度椭圆面，随地图平移、缩放和旋转。若运行时不支持 `MultiPolygon` / `PolygonStyle`，则降级为经纬度锚定的半透明 `MultiMarker` SVG patch，仍随地图移动。

### 视觉层级

- 林地 patch：低透明青绿 / 墨绿，作为连续林面底色。
- 3D 树群 GLB：保持 199 个实例，用高度、scale、opacity 差异建立层次。
- 主路线 / 当前站 / 下一站 / 重规划路线：继续作为最高可读层，不被 patch 遮挡。

patch 透明度克制：大佛背后最明显，中轴两侧中等，建筑和水体边缘更淡。偏航 / 重规划时，非核心 patch 会略微降透明，避免抢重规划路线。

### debugGarden

`/map-3d-guide-c?debugGarden=1` 会显示：

- 林地 patch 数量。
- 当前是 polygon 还是 marker fallback。
- 可一键显示 / 隐藏林地 patch。
- 复制 TS 配置时同时输出树群资产和 forest patch 配置。

localStorage key 升级为：

`lingshan-map-3d-guide-garden-assets-v7-forest-patches`

旧的树群 localStorage 不会覆盖本阶段的 patch 诊断与默认树群布局。
