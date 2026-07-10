# 灵山 POI 坐标来源审计

审计日期：2026-07-10。此表仅记录工程现状；未将资料中的方位描述转换为坐标。

| poiId | 景点名 | lat | lng | 来源文件 | 来源类型 | 路线引用 | GLB引用 | 坐标状态 | 可信度 |
|---|---|---:|---:|---|---|---|---|---|---|
| south_gate | 南门入园 | 31.420600 | 120.102977 | `src/data/guideData.ts` | existing-poi-config | 5 | 无 | existing | 既有工程坐标 |
| lingshan_wall | 灵山大照壁 | 31.421406 | 120.102497 | `src/data/guideData.ts` | existing-poi-config | 3 | 有 | existing | 既有工程坐标 |
| shengjing_square | 胜境广场 | 31.423651 | 120.100913 | `src/data/guideData.ts` | existing-poi-config | 3 | 有 | existing | 既有工程坐标 |
| fozu_tan | 佛足坛 | 31.422754 | 120.101616 | `src/data/guideData.ts` | existing-poi-config | 1 | 无 | existing | 既有工程坐标 |
| jiulong_guanyu | 九龙灌浴 | 31.424819 | 120.100158 | `src/data/guideData.ts` | existing-poi-config | 4 | 有 | existing | 既有工程坐标 |
| puti_avenue | 菩提大道 | 31.423152 | 120.101141 | `src/data/guideData.ts` | existing-poi-config | 1 | 有 | existing | 既有工程坐标 |
| foshou_square | 佛手广场 | 31.426961 | 120.098360 | `src/data/guideData.ts` | existing-poi-config | 4 | 有 | existing | 既有工程坐标 |
| xiangfu_temple | 祥符禅寺 | 31.427981 | 120.097983 | `src/data/guideData.ts` | existing-poi-config | 3 | 有 | existing | 既有工程坐标 |
| xingtan_square | 杏坛广场 | 31.428958 | 120.097377 | `src/data/guideData.ts` | existing-poi-config | 2 | 无 | existing | 既有工程坐标 |
| foqian_square | 佛前广场 | 31.429869 | 120.096713 | `src/data/guideData.ts` | existing-poi-config | 3 | 有 | existing | 既有工程坐标 |
| giant_buddha | 灵山大佛 | 31.430272 | 120.096436 | `src/data/guideData.ts` | existing-poi-config | 4 | 有 | existing | 既有工程坐标 |
| baizi_mile | 百子戏弥勒 | 31.427195 | 120.098842 | `src/data/guideData.ts` | existing-poi-config | 1 | 有 | existing | 既有工程坐标 |
| fan_gong | 梵宫 / 灵山梵宫 | 31.427822 | 120.102423 | `src/data/guideData.ts` | existing-poi-config | 3 | 有 | existing | 既有工程坐标 |
| fan_gong_square | 梵宫广场 | 31.426932 | 120.102597 | `src/data/guideData.ts` | existing-poi-config | 1 | 无 | existing | 既有工程坐标 |
| wuyin_tancheng | 五印坛城 | 31.424808 | 120.103015 | `src/data/guideData.ts` | existing-poi-config | 3 | 有 | existing | 既有工程坐标 |
| manfeilong_tower | 曼飞龙塔 | 31.426147 | 120.104684 | `src/data/guideData.ts` | existing-poi-config | 1 | 有 | existing | 既有工程坐标 |
| lingshan_jingshe | 灵山精舍 | 31.429077 | 120.105668 | `src/data/guideData.ts` | existing-poi-config | 1 | 无 | existing | 既有工程坐标 |
| sansheng_hall | 三圣殿 | 31.424393 | 120.096276 | `src/data/guideData.ts` | existing-poi-config | 1 | 有 | existing | 既有工程坐标 |
| exit | 景区出口 | 31.422989 | 120.102372 | `src/data/guideData.ts` | existing-poi-config | 5 | 无 | existing | 既有工程坐标 |
| wuming_bridge | 五明桥 | — | — | 公开资料待解析 | unknown | 0 | 无 | unresolved | 待腾讯限定范围搜索 |
| wuzhi_gate | 五智门 | — | — | 公开资料待解析 | unknown | 0 | 无 | unresolved | 待腾讯限定范围搜索 |
| jiangmo_relief | 降魔浮雕 | — | — | 公开资料待解析 | unknown | 0 | 无 | unresolved | 待腾讯限定范围搜索 |
| ashoka_pillar | 阿育王柱 | — | — | 公开资料待解析 | unknown | 0 | 无 | unresolved | 待腾讯限定范围搜索 |
| buddhist_culture_museum | 佛教文化博览馆 | — | — | 公开资料待解析 | unknown | 0 | 无 | unresolved | 待腾讯限定范围搜索 |
| wujinyi_zhai | 无尽意斋 | — | — | 公开资料待解析 | unknown | 0 | 无 | unresolved | 待腾讯限定范围搜索 |

## 结论

- 原有自定义 POI 坐标唯一工程来源是 `guideData.ts` 的 `guideSpots`；`lingshanMapData.ts` 将其映射为 `displayLocation` 与 `navLocation`。
- 五条路线的 `GuideRouteStop` 只有 `spotId`，`lingshanScenicRoutes.ts` 再从同一 POI 集合解析 `location`；没有第二套 stop 经纬度。
- 目前路线 stop 与 POI 坐标一致。`historical_culture` 的 417 点腾讯步行候选 geometry 是另一类“路线折线”数据，不是 POI 坐标来源。
- GLB 没有独立的经纬度锚点：`lingshanMapModelOverlays.ts` 选择 `navLocation` 或 `displayLocation`，随后增加每个模型自己的 `lngOffset`、`latOffset`、height、scale 和 rotation。该偏移属于模型校准，不应回写 POI 坐标。
- 2D 和 3D 旧实现都最终读 `lingshanPois`；本轮新增 `scenicPoiCatalog.ts` 后，路线、2D、3D 将以 catalog coordinate 作为共同来源。
- 发现命名别名而非重复 POI：`fan_gong` 对应“梵宫/灵山梵宫”，`manfeilong_tower` 兼容“曼飞龙塔/曼龙飞塔”，`lingshan_wall` 兼容“大照壁”。未发现同一既有 `poiId` 的多套经纬度。
- 当前代码未发现坐标系转换。腾讯服务文档将服务坐标说明为 GCJ02；既有工程坐标的采集坐标系未记录，因此标记为 `existing`，而非 `verified`。
