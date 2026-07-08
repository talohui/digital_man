# 灵山胜境 POI 绑定审计表

## 审计说明

本文档用于整理当前 demo 中的灵山景区点位。

后续需要逐个确认腾讯 POI、展示坐标 `displayLocation`、导航坐标 `navLocation`。

当前数据来自 `guideData.ts` 自动迁移，不代表最终准确导航点。表格中的绑定优先级、导航点策略和 3D 资产优先级是后续人工绑定和导航点修正的依据，不代表已经完成腾讯 POI 绑定。

## POI 审计表

| 序号 | id | 名称 | 当前分类 | 展示坐标 | 导航坐标 | 绑定状态 | 绑定优先级 | 需要腾讯 POI | 需要独立导航点 | 导航点策略 | 3D资产优先级 | 建议处理 | 备注 |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `south_gate` | 南门入园 | gate | 31.4206,120.102977 | 31.4206,120.102977 | candidate | high | 是 | 是 | nearest_walkable_point_required | marker_only | 优先确认真实入园口和最近可步行落点，绑定腾讯 POI 或人工入口点。 | 待人工校验 |
| 2 | `lingshan_wall` | 灵山大照壁 | viewpoint | 31.421406,120.102497 | 31.421406,120.102497 | candidate | medium | 否 | 否 | same_as_display | simple_3d | 确认最佳展示视角和可到达观景点，优先作为简单 3D/标志景观点处理。 | 待人工校验 |
| 3 | `shengjing_square` | 胜境广场 | viewpoint | 31.423651,120.100913 | 31.423651,120.100913 | candidate | medium | 否 | 否 | same_as_display | simple_3d | 确认广场范围与展示点，后续可作为路线节点和简单 3D 场景节点。 | 待人工校验 |
| 4 | `fozu_tan` | 佛足坛 | spot | 31.422754,120.101616 | 31.422754,120.101616 | candidate | medium | 否 | 否 | entrance_required | simple_3d | 确认可到达入口或停留点；如无腾讯 POI，保留人工导航点。 | 待人工校验 |
| 5 | `jiulong_guanyu` | 九龙灌浴 | spot | 31.424819,120.100158 | 31.424819,120.100158 | candidate | high | 是 | 是 | manual_review_required | core_3d | 核心景点，优先核验腾讯 POI、观赏区入口和 3D 核心资产绑定。 | 待人工校验 |
| 6 | `puti_avenue` | 菩提大道 | spot | 31.423152,120.101141 | 31.423152,120.101141 | candidate | medium | 否 | 否 | entrance_required | simple_3d | 确认大道起止范围和适合停留的导航点，必要时拆分多个路径节点。 | 待人工校验 |
| 7 | `foshou_square` | 佛手广场 | viewpoint | 31.426961,120.09836 | 31.426961,120.09836 | candidate | medium | 否 | 否 | same_as_display | simple_3d | 确认广场中心、打卡点和可到达落点，后续作为简单 3D 节点。 | 待人工校验 |
| 8 | `xiangfu_temple` | 祥符禅寺 | spot | 31.427981,120.097983 | 31.427981,120.097983 | candidate | high | 是 | 是 | manual_review_required | simple_3d | 核心景点，优先核验腾讯 POI、寺院入口和简单 3D 资产绑定。 | 待人工校验 |
| 9 | `xingtan_square` | 杏坛广场 | viewpoint | 31.428958,120.097377 | 31.428958,120.097377 | candidate | medium | 否 | 否 | same_as_display | simple_3d | 确认广场可到达点，作为路线过渡和简单 3D 节点。 | 待人工校验 |
| 10 | `foqian_square` | 佛前广场 | viewpoint | 31.429869,120.096713 | 31.429869,120.096713 | candidate | medium | 否 | 否 | same_as_display | simple_3d | 确认大佛前广场范围和最佳讲解点，作为路线过渡和简单 3D 节点。 | 待人工校验 |
| 11 | `giant_buddha` | 灵山大佛 | spot | 31.430272,120.096436 | 31.430272,120.096436 | candidate | high | 是 | 是 | manual_review_required | core_3d | 核心景点，优先核验腾讯 POI、可到达平台/入口和核心 3D 资产绑定。 | 待人工校验 |
| 12 | `baizi_mile` | 百子戏弥勒 | spot | 31.427195,120.098842 | 31.427195,120.098842 | candidate | medium | 否 | 否 | entrance_required | simple_3d | 确认可到达入口或打卡点；如无腾讯 POI，保留人工导航点。 | 待人工校验 |
| 13 | `fan_gong` | 梵宫 | spot | 31.427822,120.102423 | 31.427822,120.102423 | candidate | high | 是 | 是 | manual_review_required | core_3d | 核心景点，优先核验腾讯 POI、梵宫入口和核心 3D 资产绑定。 | 待人工校验 |
| 14 | `fan_gong_square` | 梵宫广场 | viewpoint | 31.426932,120.102597 | 31.426932,120.102597 | candidate | medium | 否 | 是 | same_as_display | simple_3d | 确认广场与梵宫入口关系，必要时与梵宫导航点分离。 | 待人工校验 |
| 15 | `wuyin_tancheng` | 五印坛城 | spot | 31.424808,120.103015 | 31.424808,120.103015 | candidate | high | 是 | 是 | manual_review_required | core_3d | 核心景点，优先核验腾讯 POI、入口落点和核心 3D 资产绑定。 | 待人工校验 |
| 16 | `manfeilong_tower` | 曼飞龙塔 | spot | 31.426147,120.104684 | 31.426147,120.104684 | candidate | medium | 否 | 否 | entrance_required | simple_3d | 确认可到达入口或观赏点；如无腾讯 POI，保留人工导航点。 | 待人工校验 |
| 17 | `lingshan_jingshe` | 灵山精舍 | spot | 31.429077,120.105668 | 31.429077,120.105668 | candidate | medium | 否 | 否 | entrance_required | simple_3d | 确认入口和静修区域边界；如无腾讯 POI，保留人工导航点。 | 待人工校验 |
| 18 | `sansheng_hall` | 三圣殿 | spot | 31.424393,120.096276 | 31.424393,120.096276 | candidate | medium | 否 | 否 | entrance_required | simple_3d | 确认可到达入口或停留点；如无腾讯 POI，保留人工导航点。 | 待人工校验 |
| 19 | `exit` | 景区出口 | exit | 31.422989,120.102372 | 31.422989,120.102372 | candidate | high | 是 | 是 | nearest_walkable_point_required | marker_only | 优先确认真实出口和最近可步行落点，绑定腾讯 POI 或人工出口点。 | 待人工校验 |

## 后续人工绑定流程建议

1. 先核对官方导览图，确认每个点位在园区内的实际位置和名称。
2. 再用腾讯地图搜索确认 POI，记录可用的腾讯 POI ID、名称、地址、分类和坐标。
3. 对没有腾讯 POI 的内部景点，保留人工坐标，并将绑定状态推进到 `manual_verified` 或 `field_verified`。
4. `displayLocation` 用于视觉展示，可放在景点视觉中心或标注更清晰的位置。
5. `navLocation` 用于真实导航终点，应放在游客可到达的位置。
6. 对灵山大佛、梵宫、九龙灌浴等核心景点，`navLocation` 不一定等于建筑中心，应尽量放在可到达广场或入口处。

## 当前未解决问题

- 缺少真实园区边界。
- 缺少真实园区步道折线。
- 缺少腾讯 POI ID。
- 缺少厕所、观光车站、服务点等精细设施数据。
- 现有 `navLocation` 暂时等于 `displayLocation`。
