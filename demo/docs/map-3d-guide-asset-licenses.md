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
| `public/assets/map-3d-guide/shared/foliagePack_027.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否 | 树木 marker | A / B 共用 |
| `public/assets/map-3d-guide/shared/foliagePack_049.png` | https://opengameart.org/content/foliage-pack-100x | Kenney / Foliage Pack (100x) | CC0 | 是 | 否 | 山石 marker | A / B 共用 |
| `public/assets/map-3d-guide/shared/lotus_0282.png` | https://opengameart.org/content/lotus-flowers | gostay / Lotus Flowers | CC0 | 是 | 否；页面说明不需要署名 | 莲花节点 marker | A / B 共用 |
| `public/assets/map-3d-guide/shared/lotus_3996.png` | https://opengameart.org/content/lotus-flowers | gostay / Lotus Flowers | CC0 | 是 | 否 | 莲花节点 marker | A / B 共用 |
