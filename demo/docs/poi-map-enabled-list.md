# 灵山地图已启用 POI

`scenicPoiCatalog.ts` 是 2D、3D、路线站点和详情跳转共同使用的坐标 catalog。`model` 为可选信息：没有 GLB 的点依然可显示 Marker、作为路线站点和进入详情页。

| poiId | 名称 | 坐标 | 来源 | 状态 | 2D显示 | 3D显示 | 路线引用 |
|---|---|---|---|---|---|---|---|
| south_gate | 南门入园 | existing guideData | existing-poi-config | existing | core | core | 5 |
| lingshan_wall | 灵山大照壁 | existing guideData | existing-poi-config | existing | core | core + GLB | 3 |
| shengjing_square | 胜境广场 | existing guideData | existing-poi-config | existing | core | core + GLB | 3 |
| fozu_tan | 佛足坛 | existing guideData | existing-poi-config | existing | all / route | marker | 1 |
| jiulong_guanyu | 九龙灌浴 | existing guideData | existing-poi-config | existing | core | core + GLB | 4 |
| puti_avenue | 菩提大道 | existing guideData | existing-poi-config | existing | core | core + GLB | 1 |
| foshou_square | 佛手广场 | existing guideData | existing-poi-config | existing | core | core + GLB | 4 |
| xiangfu_temple | 祥符禅寺 | existing guideData | existing-poi-config | existing | all / route | GLB nearby | 3 |
| xingtan_square | 杏坛广场 | existing guideData | existing-poi-config | existing | all / route | marker | 2 |
| foqian_square | 佛前广场 | existing guideData | existing-poi-config | existing | core | core + GLB | 3 |
| giant_buddha | 灵山大佛 | existing guideData | existing-poi-config | existing | core | core + GLB | 4 |
| baizi_mile | 百子戏弥勒 | existing guideData | existing-poi-config | existing | core | core + GLB | 1 |
| fan_gong | 梵宫 / 灵山梵宫 | existing guideData | existing-poi-config | existing | core | core + GLB | 3 |
| fan_gong_square | 梵宫广场 | existing guideData | existing-poi-config | existing | all / route | marker | 1 |
| wuyin_tancheng | 五印坛城 | existing guideData | existing-poi-config | existing | core | core + GLB | 3 |
| manfeilong_tower | 曼飞龙塔 | existing guideData | existing-poi-config | existing | core | core + GLB | 1 |
| lingshan_jingshe | 灵山精舍 | existing guideData | existing-poi-config | existing | all / route | marker | 1 |
| sansheng_hall | 三圣殿 | existing guideData | existing-poi-config | existing | core | core + GLB | 1 |
| exit | 景区出口 | existing guideData | existing-poi-config | existing | all / route | marker | 5 |

“existing guideData”表示本次没有改变既有经纬度；精确数值和待核验点见 `docs/poi-coordinate-provenance.md`。
