# 灵山 POI 正文图片缺口

审计日期：2026-07-10

本次检查了两份用户提供的 Word：文档压缩包中没有 `word/media`，不能提取合法正文图片。当前仓库 `public/assets/lingshan/poi/` 仅存在 `scenic-cover.svg`；旧详情数据中引用的多个 JPG 文件在本 worktree 中不存在。因此本轮没有在正文插入不存在或来源不明的图片，已在 `poiDetailContent.ts` 和详情页保留 `inlineImages` 数据与渲染接口。

| poiId | 景点 | 顶部现有图 | overview 后图片 | highlights 后图片 | 缺图 |
|---|---|---|---|---|---|
| south_gate | 南门入园 | 无专属图 / 兜底封面 | 无 | 无 | 是 |
| lingshan_wall | 灵山大照壁 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| shengjing_square | 胜境广场 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| fozu_tan | 佛足坛 | 无专属图 / 兜底封面 | 无 | 无 | 是 |
| jiulong_guanyu | 九龙灌浴 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| puti_avenue | 菩提大道 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| foshou_square | 佛手广场 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| xiangfu_temple | 祥符禅寺 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| xingtan_square | 杏坛广场 | 无专属图 / 兜底封面 | 无 | 无 | 是 |
| foqian_square | 佛前广场 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| giant_buddha | 灵山大佛 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| baizi_mile | 百子戏弥勒 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| fan_gong | 梵宫 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| fan_gong_square | 梵宫广场 | 无专属图 / 兜底封面 | 无 | 无 | 是 |
| wuyin_tancheng | 五印坛城 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| manfeilong_tower | 曼飞龙塔 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| lingshan_jingshe | 灵山精舍 | 无专属图 / 兜底封面 | 无 | 无 | 是 |
| sansheng_hall | 三圣殿 | 旧图引用缺失，回退封面 | 无 | 无 | 是 |
| exit | 景区出口 | 无专属图 / 兜底封面 | 无 | 无 | 是 |

后续补图规则：只使用景区提供、用户提供或仓库内可确认授权的景点照片；每个重点景点正文优先补 1 张 overview 后图片，素材充足时再补 1 张 highlights 后图片，禁止同一图片在同一详情页重复使用。

## 待验证候选

`wuming_bridge`、`wuzhi_gate`、`jiangmo_relief`、`ashoka_pillar`、`buddhist_culture_museum` 与 `wujinyi_zhai` 目前均未通过腾讯坐标验证，也没有正式启用的详情 URL。本轮未为这些未启用候选添加图片引用；待坐标验证、详情入口启用并取得合法图片素材后，再补充对应行。
