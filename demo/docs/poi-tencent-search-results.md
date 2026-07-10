# 腾讯地点搜索坐标核验

本次实现了受灵山正式边界约束的 Tencent `TMap.service.Search.searchRectangle` 开发工具；它不会在游客端或生产地图启动时请求地点搜索。

本轮已只读使用主工作区既有环境配置并真实调用腾讯官方接口；Key 没有写入源码、日志或文档。两次请求均在 `LINGSHAN_INK_MAP_BOUNDS` 矩形范围内执行，没有查询全无锡：

- `VITE_TMAP_WEB_KEY` 对以下六个景点逐一返回腾讯状态 **199**：此 Key 未开通 WebService API 功能。
- `VITE_TMAP_ROUTE_KEY` 的一次可用性检查返回腾讯状态 **121**：此 Key 当日 WebService 调用量已达上限；为避免无意义消耗额度，没有再对六个关键词重复发起请求。

因此腾讯没有返回任何可供复核的候选坐标。下表记录真实阻断结果，不能将其当作“无此景点”的结论。

| 景点 | 查询词 | 腾讯POI ID | 返回名称 | 类别 | 地址 | lat | lng | 匹配分 | 处理结果 |
|---|---|---|---|---|---|---:|---:|---:|---|
| 五明桥 | 五明桥 / 五明桥景区 | — | — | — | — | — | — | — | unresolved：实际查询 Web Key 199 |
| 五智门 | 五智门 / 五智门牌坊 | — | — | — | — | — | — | — | unresolved：实际查询 Web Key 199 |
| 降魔浮雕 | 降魔浮雕 / 降魔浮雕墙 | — | — | — | — | — | — | — | unresolved：实际查询 Web Key 199 |
| 阿育王柱 | 阿育王柱 / 阿育王石柱 | — | — | — | — | — | — | — | unresolved：实际查询 Web Key 199 |
| 佛教文化博览馆 | 佛教文化博览馆 / 灵山佛教文化博览馆 | — | — | — | — | — | — | — | unresolved：实际查询 Web Key 199 |
| 无尽意斋 | 无尽意斋 / 无尽意斋院 | — | — | — | — | — | — | — | unresolved：实际查询 Web Key 199 |

## 执行方式

1. 游客端不运行查询。待 WebService Key 开通/额度恢复后，仅在已加载腾讯地图 SDK 的开发地图中调用 `resolveLingshanPoiCoordinates(poiId)`，或以环境变量运行 `scripts/resolve-lingshan-poi-coordinates.mjs`。
2. 搜索严格使用 `LINGSHAN_INK_MAP_BOUNDS` 的矩形范围，不扩大到整个无锡。
3. 只有名称精确/可靠别名匹配、景区范围内、类别/地址合理，且相对第二候选有明显优势的候选才可以标记为 `verified`。
4. `needs-review` 必须在开发态地图里显示候选并人工确认或拖动校准；`unresolved` 不会上正式 Marker。

腾讯官方 JavaScript API GL 服务库说明 `TMap.service.Search` 可使用 `searchRectangle({ keyword, bounds })`，并返回 POI id、title、address、category、location 与行政区信息。开启签名校验时才需要 servicesk；本项目不会将 Key/SK 写进代码或文档。[腾讯地点搜索官方文档](https://lbs.qq.com/webApi/javascriptGL/glDoc/glDocService)
