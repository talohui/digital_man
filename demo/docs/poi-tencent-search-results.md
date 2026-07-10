# 腾讯地点搜索坐标核验

本次实现了受灵山正式边界约束的 Tencent `TMap.service.Search.searchRectangle` 开发工具；它不会在游客端或生产地图启动时请求地点搜索。

截至本次代码变更，当前工作树未提供可供脚本使用的 `TMAP_WEB_SERVICE_KEY` shell 环境变量，且不会读取或记录 `.env.local`，因此下表没有伪造搜索结果。待在已配置腾讯 Web Key 的开发地图中运行开发态解析工具，或由维护者以环境变量运行脚本后补全。

| 景点 | 查询词 | 腾讯POI ID | 返回名称 | 类别 | 地址 | lat | lng | 匹配分 | 处理结果 |
|---|---|---|---|---|---|---:|---:|---:|---|
| 五明桥 | 五明桥 / 五明桥景区 | 待查询 | — | — | — | — | — | — | unresolved |
| 五智门 | 五智门 / 五智门牌坊 | 待查询 | — | — | — | — | — | — | unresolved |
| 降魔浮雕 | 降魔浮雕 / 降魔浮雕墙 | 待查询 | — | — | — | — | — | — | unresolved |
| 阿育王柱 | 阿育王柱 / 阿育王石柱 | 待查询 | — | — | — | — | — | — | unresolved |
| 佛教文化博览馆 | 佛教文化博览馆 / 灵山佛教文化博览馆 | 待查询 | — | — | — | — | — | — | unresolved |
| 无尽意斋 | 无尽意斋 / 无尽意斋院 | 待查询 | — | — | — | — | — | — | unresolved |

## 执行方式

1. 游客端不运行查询。仅在已加载腾讯地图 SDK 的开发地图中调用 `resolveLingshanPoiCoordinates(poiId)`，或以环境变量运行 `scripts/resolve-lingshan-poi-coordinates.mjs`。
2. 搜索严格使用 `LINGSHAN_INK_MAP_BOUNDS` 的矩形范围，不扩大到整个无锡。
3. 只有名称精确/可靠别名匹配、景区范围内、类别/地址合理，且相对第二候选有明显优势的候选才可以标记为 `verified`。
4. `needs-review` 必须在开发态地图里显示候选并人工确认或拖动校准；`unresolved` 不会上正式 Marker。

腾讯官方 JavaScript API GL 服务库说明 `TMap.service.Search` 可使用 `searchRectangle({ keyword, bounds })`，并返回 POI id、title、address、category、location 与行政区信息。开启签名校验时才需要 servicesk；本项目不会将 Key/SK 写进代码或文档。[腾讯地点搜索官方文档](https://lbs.qq.com/webApi/javascriptGL/glDoc/glDocService)
