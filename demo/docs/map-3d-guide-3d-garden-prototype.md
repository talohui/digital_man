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
