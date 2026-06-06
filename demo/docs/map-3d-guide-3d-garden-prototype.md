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

## 4. 本阶段资产选择

本阶段没有直接下载第三方 GLB。原因：

- 需要避免把许可证、署名、体积和风格不稳定的素材直接放入 demo。
- 第一版目标是先打通腾讯地图 GLTFModel 多实例、地图坐标锚定、debugGarden 和配置导出。
- 项目自制低模 fallback 资产更可控、体积小、风格统一。

当前使用的 9 个项目自制低模 GLB：

- `garden_pine_cluster.glb`
- `garden_rock_cluster.glb`
- `garden_stone_steps.glb`
- `garden_courtyard_wall.glb`
- `garden_arch_bridge.glb`
- `garden_temple_roof.glb`
- `garden_lotus_pedestal.glb`
- `garden_dharma_wheel.glb`
- `garden_incense_burner.glb`

文件放在：

`public/assets/map-3d-guide/glb-garden/`

它们是项目自制低模 fallback，不是第三方素材。后续如果替换为外部资产，必须先更新许可证记录。

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

资产沿历史文化路线布置：

- 南门：院墙、石阶。
- 照壁 / 胜境广场：松群、山石。
- 水边路段：小桥。
- 九龙灌浴：树群。
- 灵山大佛：石阶、莲台、山石。
- 祥符禅寺：香炉、寺庙屋顶。
- 梵宫：庭墙、庭树。
- 五印坛城：法轮、莲台。
- 出口：低调山石。

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

`localStorage.lingshan-map-3d-guide-garden-assets-v1`

面板支持：

- 复制 TS 配置片段。
- 复制调试摘要。
- 恢复默认配置。

## 8. 当前限制

- 当前 GLB 是项目自制低模 fallback，重点是验证空间组织，不是最终美术品质。
- 透明度 / 墨迹淡入尚未做材质级控制。
- 资产数量为克制版，后续可按性能逐步增加。
- 外部 GLB 资产接入前必须完成许可证、署名、体积和风格审核。
- `/map-3d-guide-c` 不改变普通 `/map-3d-guide`、A/B 原型、`/map` 或 `/scenic-3d-map`。

## 9. 后续建议

1. 从 Quaternius / Kenney / Poly Haven / Sketchfab CC BY 候选中选择 2-3 个真实外部 GLB 做替换验证。
2. 建立每个外部资产的证据截图和 license 存档。
3. 将 GLB 压缩到移动端可接受体积。
4. 为腾讯 `GLTFModel` 增加距离级别或按需加载。
5. 如果腾讯 GLTFModel 对多实例性能不足，再考虑将重复资产合并为少量组合 GLB。
