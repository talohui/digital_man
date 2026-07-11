# 灵山景区缺失 POI 审计

审计日期：2026-07-12。本文只记录当前工程状态，不新增、修改或推断坐标。

## 结论摘要

- 当前游客端可见 POI 的身份与坐标链路是 `guideData.ts` 的 `guideSpots`（19 个）→ `scenicPoiCatalog.ts` → `lingshanMapData.ts` 的 `lingshanPois`。`lingshanPois` 是派生数据，不是第二套 POI 主数据。
- 这 19 个既有 POI 均有 `poiDetailContent.ts` 的 `full` 或 `basic` 内容，详情页 fallback 也可打开；没有发现“已启用地图 POI 完全无详情”的情况。
- 坐标的工程状态不是 `verified`：19 个均为 `existing`，来源是既有 `guideData.ts`，采集坐标系和实地校验记录均未在代码中保存。
- 五明桥、五智门、降魔浮雕、阿育王柱、佛教文化博览馆、无尽意斋已在 catalog 预留 ID，但没有经纬度。`scenicPoiCatalog.ts` 将其标为开发候选，腾讯检索记录显示没有可复核结果，因此本报告的**有效状态为 unresolved**，不能按 candidate 或 verified 坐标接入游客端。
- 当前本地 `public/assets/lingshan/poi/` 只有 `scenic-cover.svg`。旧详情引用的 JPG 也不在仓库中；19 个正式 POI 和 6 个候选均没有可确认授权的专属正文图片。

### 坐标统计

| 审计分类 | 数量 | 说明 |
|---|---:|---|
| verified | 0 | 未找到腾讯精确匹配加人工确认，或其他可追溯的实地校验记录。 |
| candidate（有候选经纬度） | 0 | 腾讯搜索没有返回可评分候选；不得把资料中的方位描述转换为坐标。 |
| unresolved | 6 | catalog 中的六个预留候选没有坐标，且腾讯 WebService 查询被 Key 权限/额度阻断。 |
| existing（未验证） | 19 | `guideSpots` 的既有工程坐标；可运行但不是 verified。 |

`scenicPoiCatalog.ts` 内部仍将上述 6 个预留项写为 `coordinateStatus: 'candidate'`，这是“等待开发校准”的代码标签；由于其 `coordinate` 为空，且 `docs/poi-tencent-search-results.md` 无候选结果，本审计将它们按有效接入状态归为 `unresolved`。

## 数据源与核对方法

| 领域 | 当前来源 | 审计结果 |
|---|---|---|
| 正式 POI 与既有坐标 | `demo/src/data/guideData.ts` 的 `guideSpots` | 19 个 POI；坐标均为 existing。 |
| 地图 catalog | `demo/src/data/scenicPoiCatalog.ts` | 将 19 个 guide spot 映射入 catalog，并追加 6 个无坐标候选。 |
| 地图渲染 POI | `demo/src/data/lingshanMapData.ts` 的 `lingshanPois` | 仅由 19 个 guide spot 派生；候选尚未进入此集合。 |
| 路线站点 | `demo/src/data/guideData.ts` 的 `guideRoutes`，经 `lingshanScenicRoutes.ts` 解析 | 五条路线全部落到上述 19 个 POI；没有 unresolved 候选。 |
| 详情内容 | `lingshanPoiDetails.ts`、`poiDetailContent.ts`、`Map3DPoiDetailPage.tsx` | 13 个旧详情记录 + 19 个结构化内容记录；详情 fallback 不读取仅 catalog 的候选。 |
| 小灵 metadata | `poiGuideMetadata.ts`、`guideAssistantContent.ts` | 19 个既有点有停留时间/到达摘要或通用问法；6 个候选无专属 metadata。 |
| GLB | `lingshanMapModelOverlays.ts` | 13 个 overlay，均绑定既有 19 个 POI；未以 `activeGlbCount` 推断。 |
| 图片 | `lingshanPoiDetails.ts`、`public/assets/lingshan/poi/`、`docs/poi-image-gaps.md` | 旧 JPG/overview 引用缺失，当前仅可回退到 `scenic-cover.svg`。 |

## 全量 POI 对照

来源缩写：`G` = guideSpots，`C` = scenicPoiCatalog，`L` = lingshanPois，`R` = route stop，`D` = poiDetailContent/旧详情，`M` = poiGuideMetadata，`O` = model overlay，`I` = 图片映射。

“详情”中的 `legacy` 表示 `lingshanPoiDetails.ts` 有旧详情记录；`fallback` 表示由 `poiDetailContent.ts` 和详情页 fallback 提供。所有“无专属合法图”均见 `docs/poi-image-gaps.md`，不是无证据地认定图片不存在于景区。

| 名称 | 内部 ID | 来源 | 当前状态 | 坐标 | 详情 | 图片 | GLB | 是否需要接入 |
|---|---|---|---|---|---|---|---|---|
| 南门入园 | `south_gate` | G/C/L/R/D/M | 已启用，all/路线 | 31.420600, 120.102977；existing-poi-config | basic/fallback | 无专属合法图 | 无 | 否；优先补图 |
| 灵山大照壁 | `lingshan_wall` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.421406, 120.102497；existing-poi-config | full/legacy | 旧 overview 缺失，回退封面 | 有 | 否；优先补图 |
| 胜境广场 | `shengjing_square` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.423651, 120.100913；existing-poi-config | basic/legacy | 旧 overview 缺失，回退封面 | 有 | 否；优先补图 |
| 佛足坛 | `fozu_tan` | G/C/L/R/D/M | 已启用，all/路线 | 31.422754, 120.101616；existing-poi-config | full/fallback | 无专属合法图 | 无 | 否；优先补图 |
| 九龙灌浴 | `jiulong_guanyu` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.424819, 120.100158；existing-poi-config | full/legacy | 旧 JPG 缺失，回退封面 | 有 | 否；优先补图 |
| 菩提大道 | `puti_avenue` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.423152, 120.101141；existing-poi-config | full/legacy | 旧 overview 缺失，回退封面 | 有 | 否；名称关联待核对 |
| 佛手广场 | `foshou_square` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.426961, 120.098360；existing-poi-config | basic/legacy | 旧 overview 缺失，回退封面 | 有 | 否；优先补图 |
| 祥符禅寺 | `xiangfu_temple` | G/C/L/R/D/M/O | 已启用，all/路线 | 31.427981, 120.097983；existing-poi-config | full/legacy | 旧 JPG 缺失，回退封面 | 有 | 否；优先补图 |
| 杏坛广场 | `xingtan_square` | G/C/L/R/D/M | 已启用，all/路线 | 31.428958, 120.097377；existing-poi-config | basic/fallback | 无专属合法图 | 无 | 否；优先补图 |
| 佛前广场 | `foqian_square` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.429869, 120.096713；existing-poi-config | basic/legacy | 旧 overview 缺失，回退封面 | 有 | 否；优先补图 |
| 灵山大佛 | `giant_buddha` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.430272, 120.096436；existing-poi-config | full/legacy | 旧 JPG 缺失，回退封面 | 有 | 否；优先补图 |
| 百子戏弥勒 | `baizi_mile` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.427195, 120.098842；existing-poi-config | full/legacy | 旧 overview 缺失，回退封面 | 有 | 否；优先补图 |
| 梵宫（别名：灵山梵宫） | `fan_gong` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.427822, 120.102423；existing-poi-config | full/legacy | 旧 JPG 缺失，回退封面 | 有 | 否；统一展示名待定 |
| 梵宫广场 | `fan_gong_square` | G/C/L/R/D/M | 已启用，all/路线 | 31.426932, 120.102597；existing-poi-config | basic/fallback | 无专属合法图 | 无 | 否；优先补图 |
| 五印坛城 | `wuyin_tancheng` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.424808, 120.103015；existing-poi-config | full/legacy | 旧 JPG 缺失，回退封面 | 有 | 否；优先补图 |
| 曼飞龙塔（overlay：曼龙飞塔） | `manfeilong_tower` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.426147, 120.104684；existing-poi-config | full/legacy | 旧 overview 缺失，回退封面 | 有 | 否；统一展示名待定 |
| 灵山精舍 | `lingshan_jingshe` | G/C/L/R/D/M | 已启用，all/路线 | 31.429077, 120.105668；existing-poi-config | basic/fallback | 无专属合法图 | 无 | 否；优先补图 |
| 三圣殿 | `sansheng_hall` | G/C/L/R/D/M/O | 已启用，core/路线 | 31.424393, 120.096276；existing-poi-config | basic/legacy | 旧 JPG 缺失，回退封面 | 有 | 否；优先补图 |
| 景区出口 | `exit` | G/C/L/R/D/M | 已启用，all/路线 | 31.422989, 120.102372；existing-poi-config | basic/fallback | 无专属合法图 | 无 | 否；运营节点可后补图 |
| 五明桥 | `wuming_bridge` | C | catalog 预留；游客不可见 | —；catalog candidate，审计 unresolved | 无 | 无 | 无 | 是：先核验坐标，再决定 all/路线/详情 |
| 五智门 | `wuzhi_gate` | C；旧详情文案引用 | catalog 预留；游客不可见 | —；catalog candidate，审计 unresolved | 无 | 无 | 无 | 是：优先核验，避免菩提大道文案悬空 |
| 降魔浮雕 | `jiangmo_relief` | C | catalog 预留；游客不可见 | —；catalog candidate，审计 unresolved | 无 | 无 | 无 | 是：先核验坐标，再补详情 |
| 阿育王柱 | `ashoka_pillar` | C | catalog 预留；游客不可见 | —；catalog candidate，审计 unresolved | 无 | 无 | 无 | 是：先核验坐标，再补详情 |
| 佛教文化博览馆 | `buddhist_culture_museum` | C | catalog 预留；游客不可见 | —；catalog candidate，审计 unresolved | 无 | 无 | 无 | 是：先核验坐标与开放属性 |
| 无尽意斋（别名：无尽意斋院） | `wujinyi_zhai` | C | catalog 预留；游客不可见 | —；catalog candidate，审计 unresolved | 无 | 无 | 无 | 是：先核验坐标与官方名称 |

## 六个缺失/未确认 POI 的证据与接入建议

| POI | 当前是否存在 | 名称与别名 | 坐标与可信度 | 游客可见性/缺口 | 推荐动作 |
|---|---|---|---|---|---|
| 五明桥 | 仅 catalog 预留 | 主名“五明桥”；别名“五明桥景区” | 无；腾讯查询受 Key 权限/额度阻断；unresolved | 不在 `guideSpots`、`lingshanPois`、路线、详情、metadata、GLB、图片映射 | 先用限定景区范围的腾讯搜索获得候选，再人工确认。确认后先加 all POI 和 basic 详情；是否进入路线需按实际动线审核；不建议优先做 GLB。 |
| 五智门 | 仅 catalog 预留，另被菩提大道旧详情文本提及 | 主名“五智门”；别名“五智门牌坊” | 无；unresolved | 不能点选或进入详情；“菩提大道连接五智门与九龙灌浴”目前没有可跳转节点 | 坐标核验优先级最高。确认后建议先加 all POI 与 basic 详情；仅在物理动线、叙事和路线几何同时确认后纳入路线/core；暂不做 GLB。 |
| 降魔浮雕 | 仅 catalog 预留 | 主名“降魔浮雕”；别名“降魔浮雕墙” | 无；unresolved | 无地图、路线、详情、小灵专属问题、GLB、图片 | 确认坐标和官方展示名后加入 all POI、补详情；其是否成为历史文化路线节点需策展确认；GLB 仅在模型资源存在后评估。 |
| 阿育王柱 | 仅 catalog 预留 | 主名“阿育王柱”；别名“阿育王石柱” | 无；unresolved | 无地图、路线、详情、metadata、GLB、图片 | 确认坐标和游客可达性后加入 all POI、补详情；路线/core 与 GLB 均应以实际位置和产品优先级决定。 |
| 佛教文化博览馆 | 仅 catalog 预留 | 主名“佛教文化博览馆”；别名“灵山佛教文化博览馆” | 无；unresolved | 无地图、路线、详情、metadata、GLB、图片；还需确认是否对游客开放及其入口点 | 先核验官方名称、开放属性和入口坐标；确认后加 all POI 与 full/basic 详情。未确认前不进 core、不加路线、不做 GLB。 |
| 无尽意斋 | 仅 catalog 预留 | 主名“无尽意斋”；别名“无尽意斋院” | 无；unresolved | 无地图、路线、详情、metadata、GLB、图片 | 先向景区/腾讯搜索确认正式名称与位置；确认后加 all POI 和详情，路线归属需按实际服务/参观属性决定；无 GLB 优先级。 |

## 名称冲突和变体

| 内部 ID | 当前代码主名 | 已有别名/其他显示名 | 审计结论 |
|---|---|---|---|
| `fan_gong` | 梵宫 | 灵山梵宫、梵宫圣坛 | 是同一 POI 的显示变体；应在游客端选定一个主展示名，保持 alias 用于解析。 |
| `manfeilong_tower` | 曼飞龙塔 | 曼飞龙佛塔、曼龙飞塔；GLB overlay 名为“曼龙飞塔” | 同 ID，但 catalog/详情和 overlay 的显示名不一致；需在内容与模型 UI 层统一，不应新建第二个 POI。 |
| `lingshan_wall` | 灵山大照壁 | 大照壁、华夏第一壁 | 别名关系明确，无第二 POI。 |
| `wuming_bridge` | 五明桥 | 五明桥景区 | 仅 catalog 预留；官方名称尚未由腾讯/人工确认。 |
| `wuzhi_gate` | 五智门 | 五智门牌坊 | 仅 catalog 预留；官方名称尚未由腾讯/人工确认。 |
| `wujinyi_zhai` | 无尽意斋 | 无尽意斋院 | 仅 catalog 预留；官方名称尚未由腾讯/人工确认。 |

## 详情、小灵和图片缺口

### 详情与小灵

- 19 个既有 POI 均有标题、简介、建议停留时间和详情 fallback。`hasLingshanPoiDetail()` 会检查旧详情或结构化内容，故对这 19 个 ID 为真。
- `poiGuideMetadata.ts` 为 19 个既有 POI 提供到达摘要，建议停留时间仍来自 `guideSpots`；`guideAssistantContent.ts` 对九龙灌浴、祥符禅寺、灵山大佛、梵宫、五印坛城有专属问题，其余点使用动态通用问题。
- 六个 unresolved 候选不在 `lingshanPois`。`GuideActionRegistry` 的 `isKnownPoi()` 只检查 `lingshanPois`；`Map3DPoiDetailPage` 的 fallback 也只查结构化内容、`lingshanPois` 和 `guideSpots`。因此即使手工访问候选 URL，当前也不能得到正式详情页。

### 图片

- 正式 19 个 POI 的 `inlineImages` 均为 0。
- 旧详情中 6 个 JPG 专属图引用和 7 个 `scenic-overview.jpg` 引用都不在 `public/assets/lingshan/poi/`；页面会使用 `scenic-cover.svg` 等现有 fallback。
- 两份内容资料的 Word 包中没有可提取的 `word/media` 图片，不能作为项目图片来源。
- 候选六点没有任何图片映射。补图必须使用仓库内、景区提供或用户确认授权的素材；不得从互联网随机下载。

## GLB 审计

`lingshanMapModelOverlays.ts` 中有 13 个显式 overlay：灵山大佛、梵宫、九龙灌浴、五印坛城、佛手广场、祥符禅寺、佛前广场、百子戏弥勒、菩提大道、灵山大照壁、胜境广场、三圣殿、曼飞龙塔。每个 `poiId` 都能回溯到既有 `guideSpots`/catalog POI；未发现“有 GLB 但无 POI”的孤儿 overlay。

`scenic3d/lingshanAssetMap.ts` 中的四条旧资产/占位绑定只涉及灵山大佛、九龙灌浴、梵宫、五印坛城，不引入新的游客 POI。GLB 位置来自 overlay 的 `positionSource` 加模型偏移，不能反向视为 POI 经纬度证据。

## 路线归属审计

五条路线只引用 19 个 existing POI。六个 unresolved 候选均为 0 条路线引用。现有正式路线上有无详情、无坐标或无 catalog 的 stop 数均为 0。

| 路线 | POI 数 | 关联缺口 |
|---|---:|---|
| 历史文化路线 | 12 | 无缺失 stop；若五智门/降魔浮雕后续核验，应另行评审是否值得增站。 |
| 祈福静心路线 | 10 | 无缺失 stop。 |
| 精华打卡路线 | 11 | 无缺失 stop。 |
| 自然风光路线 | 9 | 无缺失 stop。 |
| 亲子路线 | 7 | 无缺失 stop。 |

## 推荐优先级与人工确认事项

1. **先恢复腾讯 WebService 权限/额度，逐一验证六个 unresolved 候选。** 仅在名称精确/可靠别名、景区范围、地址/类别和人工地图位置均符合后才写 `verified` 坐标。
2. **优先五智门。** 它已被菩提大道旧详情文案引用，却没有可见 POI 或详情入口；在位置未证实前，不能把这句文案解释为可导航节点。
3. **第二批为五明桥、降魔浮雕、阿育王柱。** 先补 all POI 与详情，再决定是否进入历史文化路线或 core 集合。
4. **佛教文化博览馆、无尽意斋须先确认开放属性和正式游客入口。** 坐标正确也不必然意味着应作为路线 stop 或 core POI。
5. **为正式 19 点补合法图片。** 这是当前游客端最广泛的内容缺口；优先灵山大佛、九龙灌浴、梵宫、祥符禅寺、灵山大照壁、五印坛城。
6. **统一展示名。** 先处理“梵宫/灵山梵宫”和“曼飞龙塔/曼龙飞塔”；保持同一个内部 ID 和 alias，禁止因名称差异复制 POI 或坐标。

本报告没有改动地图运行时、坐标、POI Controller、路线 geometry、GLB 配置、Fay 或小灵会话逻辑。
