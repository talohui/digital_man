# 灵山景点与路线媒体审计

审计范围：`MobileHomePage`、`HomePage`、景点实时客流、路线推荐卡、`GuideImmersivePage`、旧 Spot 页面、地图 POI 详情、地图路线预览，以及 `public/assets`、`public/images`、`public/intro`、`guideData`、POI detail 数据。审计日期：2026-07-13。

统一数据源为 `src/data/scenicMediaCatalog.ts`。本轮遵守“不下载互联网图片、不修改页面 JSX”的边界，因此页面接入留待后续单独变更。

## POI 媒体

`gallery` 当前均只包含 cover；`drawerBackground` 当前与 cover 相同。所有列出的 catalog 路径均已确认存在，且不是 Git LFS 指针。

| PoiId | POI | cover / gallery / drawerBackground | 来源 | fallback |
| --- | --- | --- | --- | --- |
| `south_gate` | 南门入园 | `/scenic/spots/south-gate.jpg` | C 端已有专属图 | 否 |
| `lingshan_wall` | 灵山大照壁 | `/scenic/spots/lingshan-wall.jpg` | C 端已有专属图 | 否 |
| `shengjing_square` | 胜境广场 | `/intro/splash/splash-05.webp` | C 端现有通用图 | 是 |
| `fozu_tan` | 佛足坛 | `/scenic/spots/fozu-tan.jpg` | C 端已有专属图 | 否 |
| `jiulong_guanyu` | 九龙灌浴 | `/intro/splash/splash-04.webp` | C 端现有通用图 | 是 |
| `puti_avenue` | 菩提大道 | `/scenic/spots/puti-avenue.jpg` | C 端已有专属图 | 否 |
| `foshou_square` | 佛手广场 | `/scenic/spots/foshou-square.jpg` | C 端已有专属图 | 否 |
| `xiangfu_temple` | 祥符禅寺 | `/scenic/spots/xiangfu-temple.jpg` | C 端已有专属图 | 否 |
| `xingtan_square` | 杏坛广场 | `/scenic/spots/xingtan-square.jpg` | C 端已有专属图 | 否 |
| `foqian_square` | 佛前广场 | `/scenic/spots/foqian-square.jpg` | C 端已有专属图 | 否 |
| `giant_buddha` | 灵山大佛 | `/intro/splash/splash-03.webp` | C 端现有通用图 | 是 |
| `baizi_mile` | 百子戏弥勒 | `/scenic/spots/baizi-mile.jpg` | C 端已有专属图 | 否 |
| `fan_gong` | 梵宫 | `/intro/splash/splash-01.webp` | C 端现有通用图 | 是 |
| `fan_gong_square` | 梵宫广场 | `/intro/splash/splash-01.webp` | C 端现有通用图 | 是 |
| `wuyin_tancheng` | 五印坛城 | `/scenic/spots/wuyin-tancheng.jpg` | C 端已有专属图 | 否 |
| `manfeilong_tower` | 曼飞龙塔 | `/scenic/spots/manfeilong-tower.jpg` | C 端已有专属图 | 否 |
| `lingshan_jingshe` | 灵山精舍 | `/scenic/spots/lingshan-jingshe.jpg` | C 端已有专属图 | 否 |
| `sansheng_hall` | 三圣殿 | `/scenic/spots/sansheng-hall.jpg` | C 端已有专属图 | 否 |
| `exit` | 景区出口 | `/scenic/spots/exit.jpg` | C 端已有专属图 | 否 |

## 路线媒体

| routeId | 路线 | cover | 选择依据 |
| --- | --- | --- | --- |
| `historical_culture` | 历史文化路线 | `/intro/splash/splash-01.webp` | `guideData` 现有路线 cover |
| `prayer_meditation` | 祈福静心路线 | `/intro/splash/splash-03.webp` | `guideData` 现有路线 cover |
| `highlights_checkin` | 精华打卡路线 | `/intro/splash/splash-02.webp` | `guideData` 现有路线 cover |
| `natural_scenery` | 自然风光路线 | `/intro/splash/splash-05.webp` | `guideData` 现有路线 cover |
| `family` | 亲子路线 | `/intro/splash/splash-04.webp` | `guideData` 现有路线 cover |

## 旧缺失路径

`src/data/lingshanPoiDetails.ts` 仍维护以下不存在的路径。它们没有进入 catalog：

- `/assets/lingshan/poi/giant-buddha.jpg`
- `/assets/lingshan/poi/xiangfu-temple.jpg`
- `/assets/lingshan/poi/sansheng-hall.jpg`
- `/assets/lingshan/poi/fan-gong.jpg`
- `/assets/lingshan/poi/wuyin-tancheng.jpg`
- `/assets/lingshan/poi/jiulong-guanyu.jpg`
- `/assets/lingshan/poi/scenic-overview.jpg`

旧详情逻辑会尝试回退到实际存在的 `/assets/lingshan/poi/scenic-cover.svg`。本轮未改旧页面或旧详情数据。

## 重复维护与可复用资源

- `MobileHomePage.tsx` 的 19 项实时客流配置直接维护图片映射；其中 14 张 `/scenic/spots/*.jpg` 是当前最完整且可合法复用的 C 端专属资源。
- `guideData.ts` 单独维护 5 条路线 cover；这些 `/intro/splash/*.webp` 也被首页 POI 临时复用。
- `lingshanPoiDetails.ts` 又维护一套 POI 图片映射，但 7 个 JPG 路径已经失效；其 SVG fallback 可合法复用。
- `src/lib/splashImages.ts` 与 `public/intro/splash-assets.json` 重复列出 splash 资源，属于启动页素材清单，不应再作为 POI 映射源。
- `splash-01.webp` 同时用于历史文化路线、梵宫和梵宫广场；其余 splash 也同时用于路线和 POI，均按“通用 fallback”标记。
- 本仓库中的上述 C 端静态资源和本地 SVG fallback 可复用；外部官网 URL 仅为内容来源链接，不作为媒体资源引用。

## 缺图及需用户提供的图片

以下 5 个 POI 没有可确认的本地专属图，当前使用 C 端既有通用图：

- `shengjing_square`（胜境广场）
- `jiulong_guanyu`（九龙灌浴）
- `giant_buddha`（灵山大佛）
- `fan_gong`（梵宫）
- `fan_gong_square`（梵宫广场）

建议用户后续提供这 5 个 POI 的横版 cover；如需详情图集，再分别提供已授权的 gallery 图片。五条正式路线已有可用 cover，当前无路线资源硬缺口。

## 别名归一

- `jiulong_bath`、`jiulong_square`、九龙灌浴名称变体统一到 `jiulong_guanyu`。
- 梵宫、灵山梵宫、`lingshan_fan_gong` 统一到 `fan_gong`。
- 曼飞龙塔、曼飞龙佛塔、曼龙飞塔、`manlong_flying_tower` 统一到 `manfeilong_tower`。
- 历史遗留 route ID `history-culture`、`pray-calm`、`photo` 分别统一到正式 route ID。
