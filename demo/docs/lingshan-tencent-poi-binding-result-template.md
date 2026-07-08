# 灵山胜境腾讯 POI 人工绑定结果填写模板

## 填写说明

本文档用于人工记录腾讯地图 POI 查询结果，不代表已经写入代码。

- 不要把未核实的 POI ID 写入 `lingshanMapData.ts`。
- `displayLocation` 用于展示，`navLocation` 用于真实导航终点。
- 对核心景点和大体量建筑，`navLocation` 应优先放在入口、广场、可步行到达点，而不是建筑中心。
- 如果腾讯地图没有独立 POI，可标记为 `manual_verified`，保留人工坐标。

## 字段解释

- `id`：项目内部 POI ID。
- 名称：项目展示名称。
- 当前分类：当前 `lingshanPois` category。
- 绑定优先级：`high` / `medium` / `low`。
- 推荐搜索关键词：来自绑定候选清单。
- 腾讯 `poiId`：人工确认后的腾讯 POI ID。
- 腾讯 `title`：腾讯地图返回的名称。
- 腾讯 `address`：腾讯地图返回的地址。
- 腾讯 `category`：腾讯地图返回的类别。
- 腾讯 `adcode`：腾讯地图返回的行政区划代码。
- 腾讯坐标：腾讯返回的 `lat,lng`。
- 建议 `bindStatus`：`tencent_bound` / `manual_verified` / `candidate`。
- `navLocation` 是否需要修正：是 / 否。
- 修正后的 `navLocation`：`lat,lng`。
- 绑定依据与备注：说明为什么选择这个 POI 或为什么人工保留坐标。

## 高优先级 POI 结果填写表

| 序号 | id | 名称 | 当前分类 | 绑定优先级 | 推荐搜索关键词 | 腾讯 poiId | 腾讯 title | 腾讯 address | 腾讯 category | 腾讯 adcode | 腾讯坐标 lat,lng | 建议 bindStatus | navLocation 是否需要修正 | 修正后的 navLocation lat,lng | 绑定依据与备注 |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `south_gate` | 南门入园 | gate | high | 灵山胜境 南门；灵山胜境 入园口；无锡 灵山胜境 入口 |  |  |  |  |  |  | candidate | 是 |  |  |
| 2 | `jiulong_guanyu` | 九龙灌浴 | spot | high | 灵山胜境 九龙灌浴；无锡 九龙灌浴；灵山胜境 九龙灌浴广场 |  |  |  |  |  |  | candidate | 是 |  |  |
| 3 | `xiangfu_temple` | 祥符禅寺 | spot | high | 灵山胜境 祥符禅寺；无锡 祥符禅寺；灵山 祥符寺 |  |  |  |  |  |  | candidate | 是 |  |  |
| 4 | `giant_buddha` | 灵山大佛 | spot | high | 灵山胜境 灵山大佛；无锡 灵山大佛；灵山大佛 景区 |  |  |  |  |  |  | candidate | 是 |  |  |
| 5 | `fan_gong` | 梵宫 | spot | high | 灵山胜境 梵宫；无锡 灵山梵宫；灵山梵宫 |  |  |  |  |  |  | candidate | 是 |  |  |
| 6 | `wuyin_tancheng` | 五印坛城 | spot | high | 灵山胜境 五印坛城；无锡 五印坛城；灵山 五印坛城 |  |  |  |  |  |  | candidate | 是 |  |  |
| 7 | `exit` | 景区出口 | exit | high | 灵山胜境 出口；灵山胜境 离园口；无锡 灵山胜境 出口 |  |  |  |  |  |  | candidate | 是 |  |  |

## 中优先级 POI 结果填写表

| 序号 | id | 名称 | 当前分类 | 绑定优先级 | 推荐搜索关键词 | 腾讯 poiId | 腾讯 title | 腾讯 address | 腾讯 category | 腾讯 adcode | 腾讯坐标 lat,lng | 建议 bindStatus | navLocation 是否需要修正 | 修正后的 navLocation lat,lng | 绑定依据与备注 |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `lingshan_wall` | 灵山大照壁 | viewpoint | medium | 灵山胜境 灵山大照壁；无锡 灵山大照壁；灵山胜境 照壁 |  |  |  |  |  |  | candidate | 否 |  |  |
| 2 | `shengjing_square` | 胜境广场 | viewpoint | medium | 灵山胜境 胜境广场；无锡 灵山胜境广场；灵山 胜境广场 |  |  |  |  |  |  | candidate | 否 |  |  |
| 3 | `fozu_tan` | 佛足坛 | spot | medium | 灵山胜境 佛足坛；无锡 佛足坛；灵山 佛足坛 |  |  |  |  |  |  | candidate | 否 |  |  |
| 4 | `puti_avenue` | 菩提大道 | spot | medium | 灵山胜境 菩提大道；无锡 菩提大道；灵山 菩提大道 |  |  |  |  |  |  | candidate | 否 |  |  |
| 5 | `foshou_square` | 佛手广场 | viewpoint | medium | 灵山胜境 佛手广场；无锡 佛手广场；天下第一掌 灵山 |  |  |  |  |  |  | candidate | 否 |  |  |
| 6 | `xingtan_square` | 杏坛广场 | viewpoint | medium | 灵山胜境 杏坛广场；无锡 杏坛广场；灵山 杏坛广场 |  |  |  |  |  |  | candidate | 否 |  |  |
| 7 | `foqian_square` | 佛前广场 | viewpoint | medium | 灵山胜境 佛前广场；无锡 佛前广场；灵山大佛 佛前广场 |  |  |  |  |  |  | candidate | 否 |  |  |
| 8 | `baizi_mile` | 百子戏弥勒 | spot | medium | 灵山胜境 百子戏弥勒；无锡 百子戏弥勒；灵山 百子戏弥勒 |  |  |  |  |  |  | candidate | 否 |  |  |
| 9 | `fan_gong_square` | 梵宫广场 | viewpoint | medium | 灵山胜境 梵宫广场；无锡 梵宫广场；灵山梵宫广场 |  |  |  |  |  |  | candidate | 是 |  |  |
| 10 | `manfeilong_tower` | 曼飞龙塔 | spot | medium | 灵山胜境 曼飞龙塔；无锡 曼飞龙塔；灵山 曼飞龙塔 |  |  |  |  |  |  | candidate | 否 |  |  |
| 11 | `lingshan_jingshe` | 灵山精舍 | spot | medium | 灵山胜境 灵山精舍；无锡 灵山精舍；灵山 精舍 |  |  |  |  |  |  | candidate | 否 |  |  |
| 12 | `sansheng_hall` | 三圣殿 | spot | medium | 灵山胜境 三圣殿；无锡 三圣殿；灵山 三圣殿 |  |  |  |  |  |  | candidate | 否 |  |  |

## 低优先级 POI 结果填写表

当前无低优先级 POI。

## 后续写入代码前检查清单

- POI 是否位于灵山胜境范围内。
- 名称是否匹配，是否存在同名误选。
- 坐标是否落在道路、广场、入口等可到达位置。
- 如果是大景点，是否需要单独 `navLocation`。
- 是否有截图或人工备注作为绑定依据。
- 是否避免泄露 API Key 或敏感信息。
