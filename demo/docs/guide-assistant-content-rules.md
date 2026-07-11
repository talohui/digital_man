# 小灵内容与景点引导规则

## 范围

本规则只约束 C 端小灵抽屉、路线卡和景点详情中的游客文案。它不管理地图坐标、路线几何、GLB 加载生命周期、Fay 通信或导航算路。

## 单一解析入口

`src/guide/guideAssistantContent.ts` 是小灵标题、副标题、首次问候和快捷问题的统一 resolver。它只读取当前 `GuideContext` 与已有路由/POI 数据，不持有会话状态，也不会清空历史消息。

- 普通浏览：标题为“小灵导览”，提供自由探索、服务和路线相关快捷问题。
- 路线预览：使用当前 URL 的 `routeId` 解析真实路线名称、时长、站点数和主题，不固定推荐历史文化路线。
- 加入路线：使用当前路线与已选起始站点生成“准备游览”提示。
- 路线进行：使用下一站名称和其建议停留时间生成“正在游览”提示。
- 到达景点：使用当前站点名称和其建议停留时间生成“已到达”提示。
- 景点详情：使用当前 `poiId` 的名称、现有副标题和景点专属或通用快捷问题。

路线主题与快捷问题按五条正式路线的 ID 集中维护：

| routeId | 路线 | 小灵引导重点 |
| --- | --- | --- |
| `historical_culture` | 历史文化路线 | 佛教历史、古刹建筑与艺术空间 |
| `prayer_meditation` | 祈福静心路线 | 祈福礼佛与静心漫步 |
| `highlights_checkin` | 精华打卡路线 | 代表性地标与拍照打卡 |
| `natural_scenery` | 自然风光路线 | 山水林景与步行风光 |
| `family` | 亲子路线 | 轻松步行、亲子互动与趣味体验 |

快捷问题只会调用现有 `sendGuideMessage`，因此保留当前会话、输入框和消息历史；本轮不接 Fay。

## 建议停留时间

`src/data/guideData.ts` 中 `guideSpots[].stayMinutes` 是当前正式地图 POI 的唯一建议停留时间来源。`src/data/poiGuideMetadata.ts` 只提供只读查找与格式化函数：

- `getRecommendedStayMinutes(poiId)`
- `getRecommendedStayLabel(poiId)`

当前正式 POI 的明确建议停留时间如下：

| poiId | 景点 | 建议停留 |
| --- | --- | ---: |
| `south_gate` | 灵山胜境南门 | 3 分钟 |
| `lingshan_wall` | 灵山大照壁 | 8 分钟 |
| `shengjing_square` | 胜境广场 | 8 分钟 |
| `fozu_tan` | 佛足坛 | 8 分钟 |
| `jiulong_guanyu` | 九龙灌浴 | 15 分钟 |
| `puti_avenue` | 菩提大道 | 12 分钟 |
| `foshou_square` | 佛手广场 | 10 分钟 |
| `xiangfu_temple` | 祥符禅寺 | 18 分钟 |
| `xingtan_square` | 杏坛广场 | 8 分钟 |
| `foqian_square` | 佛前广场 | 8 分钟 |
| `giant_buddha` | 灵山大佛 | 25 分钟 |
| `baizi_mile` | 百子戏弥勒 | 12 分钟 |
| `fan_gong` | 梵宫 | 30 分钟 |
| `fan_gong_square` | 梵宫广场 | 8 分钟 |
| `wuyin_tancheng` | 五印坛城 | 20 分钟 |
| `manfeilong_tower` | 曼飞龙塔 | 10 分钟 |
| `lingshan_jingshe` | 灵山精舍 | 15 分钟 |
| `sansheng_hall` | 三圣殿 | 12 分钟 |
| `exit` | 景区出口 | 2 分钟 |

未知或候选 POI 不再使用“建议停留 15 分钟”作为视觉兜底，而显示“建议停留时间以现场安排为准”。

## 3D 能力文案

`hasAvailablePoiGlbModel(poiId)` 只读取 `lingshanMapModelOverlays` 中已经存在的模型注册：模型必须 `visible`、具备 `modelUrl`，且状态不是 `missing_model`。

- 条件成立：到达卡可写“查看图文介绍与 3D 模型”。
- 条件不成立：到达卡只写“查看图文介绍”。

此判断不推断模型是否刚好加载成功，也不维护第二份 `hasGlb` 列表。

## 资料提炼原则

景点和路线提示参考《灵山胜境：历史、文化、景点特色与个性化游览指南》及既有结构化 POI 内容，只提炼历史、建筑、礼佛、演绎、拍摄和步行体验等游客所需信息。

开放时间、表演场次、价格等易变信息不作为小灵固定事实；如未来展示此类信息，应带“具体以景区当日公告为准”。

## 回退规则

1. 路线名称、站点名称优先使用 `lingshanScenicRoutes` 的当前真实数据。
2. POI 名称优先使用已有详情数据，其次使用 `guideSpots` / `scenicPoiCatalog`。
3. 景点详情没有专属快捷问题时，使用带景点名称的通用问题。
4. 停留时间缺失时显示现场安排提示，不伪造分钟数。
5. GLB 注册缺失时不提及 3D 模型，正文和详情入口仍正常工作。
