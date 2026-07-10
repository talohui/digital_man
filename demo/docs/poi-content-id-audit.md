# 灵山 POI 详情内容与 ID 审计

审计日期：2026-07-10

## 身份来源

本次 UI 内容只使用当前地图最终已读取的 `guideSpots -> lingshanPois` 身份链路，共 19 个 poiId。`poiDetailContent.ts` 仅存放正文内容，不维护坐标、图层、腾讯 POI、路线几何或 GLB 锚点。

地图分支 `codex/map-root-cause-final-fix` 当前停在 `775f455`，已是本分支的直接基线；WIP 提交后执行 `git merge codex/map-root-cause-final-fix` 的结果为 `Already up to date`。因此本轮没有复制、重建或替换地图目录，也没有产生第二套景点身份表。

| poiId | 名称 | 当前详情状态 | overview 字数 | highlights 数量 | tips 数量 | 正文图片数量 | GLB |
|---|---|---|---:|---:|---:|---:|---|
| south_gate | 南门入园 | basic / fallback | 83 | 2 | 2 | 0 | 否 |
| lingshan_wall | 灵山大照壁 | full / 现有详情扩充 | 114 | 3 | 2 | 0 | 是 |
| shengjing_square | 胜境广场 | basic / 现有详情扩充 | 79 | 2 | 2 | 0 | 是 |
| fozu_tan | 佛足坛 | full / fallback | 105 | 3 | 2 | 0 | 否 |
| jiulong_guanyu | 九龙灌浴 | full / 现有详情扩充 | 121 | 4 | 3 | 0 | 是 |
| puti_avenue | 菩提大道 | full / 现有详情扩充 | 111 | 3 | 2 | 0 | 是 |
| foshou_square | 佛手广场 | basic / 现有详情扩充 | 88 | 3 | 2 | 0 | 是 |
| xiangfu_temple | 祥符禅寺 | full / 现有详情扩充 | 119 | 4 | 3 | 0 | 是 |
| xingtan_square | 杏坛广场 | basic / fallback | 73 | 2 | 2 | 0 | 否 |
| foqian_square | 佛前广场 | basic / 现有详情扩充 | 99 | 3 | 2 | 0 | 是 |
| giant_buddha | 灵山大佛 | full / 现有详情扩充 | 119 | 4 | 3 | 0 | 是 |
| baizi_mile | 百子戏弥勒 | full / 现有详情扩充 | 108 | 3 | 2 | 0 | 是 |
| fan_gong | 梵宫 | full / 现有详情扩充 | 121 | 4 | 3 | 0 | 是 |
| fan_gong_square | 梵宫广场 | basic / fallback | 78 | 2 | 2 | 0 | 否 |
| wuyin_tancheng | 五印坛城 | full / 现有详情扩充 | 101 | 4 | 3 | 0 | 是 |
| manfeilong_tower | 曼飞龙塔 | full / 现有详情扩充 | 115 | 3 | 3 | 0 | 是 |
| lingshan_jingshe | 灵山精舍 | basic / fallback | 83 | 2 | 2 | 0 | 否 |
| sansheng_hall | 三圣殿 | basic / 现有详情扩充 | 84 | 2 | 2 | 0 | 是 |
| exit | 景区出口 | basic / fallback | 72 | 2 | 2 | 0 | 否 |

`full` 内容来自用户提供的《灵山胜境 景点结构化数据集》并由《灵山胜境：历史、文化、景点特色与个性化游览指南》补充语境；均已改写为移动端短摘要，不直接复制长文。`basic` 用于路线基础节点，确保无 GLB、无旧详情记录的 POI 仍可正常打开。

## 已匹配的资料集景点

- 灵山大照壁 -> `lingshan_wall`
- 佛足坛 -> `fozu_tan`
- 菩提大道 -> `puti_avenue`
- 九龙灌浴 -> `jiulong_guanyu`
- 百子戏弥勒 -> `baizi_mile`
- 祥符禅寺 -> `xiangfu_temple`
- 灵山大佛 -> `giant_buddha`
- 灵山梵宫 -> `fan_gong`
- 五印坛城 -> `wuyin_tancheng`
- 曼飞龙塔 -> `manfeilong_tower`

## 未匹配列表

以下资料集景点在当前 `guideSpots/lingshanPois` 中没有正式 poiId，因此本 UI 分支没有新增或猜测 ID：

- 五明桥
- 五智门
- 降魔浮雕
- 阿育王柱
- 佛教文化博览馆
- 无尽意斋

地图目录新增并确认这些点位后，应使用其最终 poiId 在 `poiDetailContent.ts` 补内容，不建立第二套别名或身份表。
