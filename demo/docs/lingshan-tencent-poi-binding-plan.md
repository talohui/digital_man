# 灵山胜境腾讯 POI 绑定候选清单

## 绑定目标说明

本文档用于后续人工核对腾讯地图 POI，不代表已经完成绑定。

- `displayLocation` 用于地图展示。
- `navLocation` 用于真实导航终点。
- `tencent.poiId` 后续需要人工确认后再写入数据。
- 大景点的导航点不一定等于景点中心，应优先选择游客可步行到达的广场、入口或观赏区。

## 绑定优先级说明

- `high`：优先绑定，影响导航可靠性或核心景点展示。
- `medium`：第二批绑定，影响体验但不一定阻塞主流程。
- `low`：可后置处理，可先保留人工坐标或只做 Marker。

## 高优先级 POI 绑定表

| 序号 | id | 名称 | 当前分类 | 绑定优先级 | 推荐搜索关键词 | 建议绑定对象 | 是否需要独立导航点 | 导航点策略 | 备注 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `south_gate` | 南门入园 | gate | high | 灵山胜境 南门；灵山胜境 入园口；无锡 灵山胜境 入口 | 优先绑定入口、检票口、游客中心附近可到达点。 | 是 | nearest_walkable_point_required | 可能需要人工入口导航点，避免落在道路或建筑中心。 |
| 2 | `jiulong_guanyu` | 九龙灌浴 | spot | high | 灵山胜境 九龙灌浴；无锡 九龙灌浴；灵山胜境 九龙灌浴广场 | 优先查独立腾讯 POI；若无，绑定观赏区附近可到达广场或入口。 | 是 | manual_review_required | 核心景点，可能需要人工导航点。 |
| 3 | `xiangfu_temple` | 祥符禅寺 | spot | high | 灵山胜境 祥符禅寺；无锡 祥符禅寺；灵山 祥符寺 | 优先查独立腾讯 POI；若无，绑定寺院入口或可到达广场。 | 是 | manual_review_required | 寺院范围可能较大，导航点应放在入口。 |
| 4 | `giant_buddha` | 灵山大佛 | spot | high | 灵山胜境 灵山大佛；无锡 灵山大佛；灵山大佛 景区 | 优先查独立腾讯 POI；若无，绑定大佛平台、台阶入口或佛前广场可到达点。 | 是 | manual_review_required | 大景点中心不可直接作为导航终点，必须人工复核。 |
| 5 | `fan_gong` | 梵宫 | spot | high | 灵山胜境 梵宫；无锡 灵山梵宫；灵山梵宫 | 优先查独立腾讯 POI；若无，绑定梵宫入口或梵宫广场可到达点。 | 是 | manual_review_required | 建筑体量大，navLocation 应偏入口。 |
| 6 | `wuyin_tancheng` | 五印坛城 | spot | high | 灵山胜境 五印坛城；无锡 五印坛城；灵山 五印坛城 | 优先查独立腾讯 POI；若无，绑定坛城入口或附近可到达点。 | 是 | manual_review_required | 核心景点，建议同时记录展示点和入口点。 |
| 7 | `exit` | 景区出口 | exit | high | 灵山胜境 出口；灵山胜境 离园口；无锡 灵山胜境 出口 | 优先绑定出口、离园口、可到达出口通道。 | 是 | nearest_walkable_point_required | 可能需要人工出口导航点，避免与入口混淆。 |

## 中优先级 POI 绑定表

| 序号 | id | 名称 | 当前分类 | 绑定优先级 | 推荐搜索关键词 | 建议绑定对象 | 是否需要独立导航点 | 导航点策略 | 备注 |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `lingshan_wall` | 灵山大照壁 | viewpoint | medium | 灵山胜境 灵山大照壁；无锡 灵山大照壁；灵山胜境 照壁 | 广场、照壁、普通景观点可能不一定有独立腾讯 POI；可先保留人工展示点。 | 否 | same_as_display | 重点核对展示视角，不一定需要独立 POI。 |
| 2 | `shengjing_square` | 胜境广场 | viewpoint | medium | 灵山胜境 胜境广场；无锡 灵山胜境广场；灵山 胜境广场 | 广场、照壁、普通景观点可能不一定有独立腾讯 POI；可先保留人工展示点。 | 否 | same_as_display | 可作为路线转折与聚合点。 |
| 3 | `fozu_tan` | 佛足坛 | spot | medium | 灵山胜境 佛足坛；无锡 佛足坛；灵山 佛足坛 | 查是否有独立腾讯 POI；若无，保留人工导航点或入口点。 | 否 | entrance_required | 建议确认可到达停留点。 |
| 4 | `puti_avenue` | 菩提大道 | spot | medium | 灵山胜境 菩提大道；无锡 菩提大道；灵山 菩提大道 | 查是否有独立腾讯 POI；若无，保留人工路径节点。 | 否 | entrance_required | 线性空间可能需要拆成多个道路节点。 |
| 5 | `foshou_square` | 佛手广场 | viewpoint | medium | 灵山胜境 佛手广场；无锡 佛手广场；天下第一掌 灵山 | 广场、照壁、普通景观点可能不一定有独立腾讯 POI；可先保留人工展示点。 | 否 | same_as_display | 适合作为打卡点，需核对可到达位置。 |
| 6 | `xingtan_square` | 杏坛广场 | viewpoint | medium | 灵山胜境 杏坛广场；无锡 杏坛广场；灵山 杏坛广场 | 广场、照壁、普通景观点可能不一定有独立腾讯 POI；可先保留人工展示点。 | 否 | same_as_display | 可作为寺院区与大佛轴线过渡点。 |
| 7 | `foqian_square` | 佛前广场 | viewpoint | medium | 灵山胜境 佛前广场；无锡 佛前广场；灵山大佛 佛前广场 | 广场、照壁、普通景观点可能不一定有独立腾讯 POI；可先保留人工展示点。 | 否 | same_as_display | 可辅助大佛导航点校验。 |
| 8 | `baizi_mile` | 百子戏弥勒 | spot | medium | 灵山胜境 百子戏弥勒；无锡 百子戏弥勒；灵山 百子戏弥勒 | 查是否有独立腾讯 POI；若无，保留人工导航点或打卡点。 | 否 | entrance_required | 亲子路线重点，建议核对打卡位置。 |
| 9 | `fan_gong_square` | 梵宫广场 | viewpoint | medium | 灵山胜境 梵宫广场；无锡 梵宫广场；灵山梵宫广场 | 广场、照壁、普通景观点可能不一定有独立腾讯 POI；可先保留人工展示点。 | 是 | same_as_display | 与梵宫入口关系需要人工复核。 |
| 10 | `manfeilong_tower` | 曼飞龙塔 | spot | medium | 灵山胜境 曼飞龙塔；无锡 曼飞龙塔；灵山 曼飞龙塔 | 查是否有独立腾讯 POI；若无，保留人工导航点或观赏点。 | 否 | entrance_required | 建议核对是否可直接到达塔前。 |
| 11 | `lingshan_jingshe` | 灵山精舍 | spot | medium | 灵山胜境 灵山精舍；无锡 灵山精舍；灵山 精舍 | 查是否有独立腾讯 POI；若无，保留人工导航点或入口点。 | 否 | entrance_required | 需确认开放范围和入口。 |
| 12 | `sansheng_hall` | 三圣殿 | spot | medium | 灵山胜境 三圣殿；无锡 三圣殿；灵山 三圣殿 | 查是否有独立腾讯 POI；若无，保留人工导航点或入口点。 | 否 | entrance_required | 需确认是否存在独立 POI。 |

## 低优先级 POI 绑定表

| 序号 | id | 名称 | 当前分类 | 绑定优先级 | 推荐搜索关键词 | 建议绑定对象 | 是否需要独立导航点 | 导航点策略 | 备注 |
|---:|---|---|---|---|---|---|---|---|---|
| - | - | 当前无低优先级 POI | - | low | - | 这些点可后续处理，当前可先保留 displayLocation/navLocation。 | - | - | 当前 19 个点位中没有 low。 |

## 人工绑定操作流程建议

1. 打开腾讯地图或腾讯位置服务控制台。
2. 使用推荐关键词搜索。
3. 比对名称、地址、类别、位置是否位于灵山胜境范围内。
4. 如果搜索结果是大区域 POI，要检查是否适合作为导航终点。
5. 如果景点中心不可达，需要单独设置 `navLocation`。
6. 将确认后的 `poiId`、`title`、`address`、`category`、`adcode`、`location` 记录到后续数据更新任务中。
7. 不要把未经确认的搜索结果直接写入代码。

## 后续数据写入规则建议

- `bindStatus` 可从 `candidate` 改为 `tencent_bound` 或 `manual_verified`。
- `tencent.poiId` 只填写人工确认过的 ID。
- `navLocation` 应优先使用可步行到达点。
- 对核心景点建议保留 `note` 说明绑定依据。
