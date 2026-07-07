# 腾讯地图托管自定义图层接入记录

## 当前方案

- 图层来源：腾讯地图平台托管自定义图层
- 图层名称：我的自定义图层1
- 图层 ID：`6a4b665a9818`
- Web 接入：`TMap.ImageTileLayer.createCustomLayer`
- 默认状态：启用

## 历史方案

项目之前曾经用自建瓦片 / 本地 tiles / `getTileUrl` 方式接入水墨底图，相关示范逻辑仍保留在 `src/pages/Map3DGuidePage.tsx`：

- `TMap.ImageTileLayer`
- `getTileUrl`
- `/map/ink/tiles/...`
- `tileSize`
- `zIndex`
- `opacity`
- `minZoom` / `maxZoom`
- 图层销毁和地图重建清理

这套逻辑已经验证了图层应该挂载在真实腾讯地图导览页，以及应该在地图进入 overlay ready 后初始化。当前最终方案复用这套生命周期和清理结构，但默认图层来源改为腾讯地图平台托管自定义图层。

## 运行约束

- 地图实例创建完成并进入 overlay ready 后，只初始化一次腾讯官方自定义图层。
- 页面卸载或地图重建时，按现有图层清理流程调用 `setMap(null)` / `removeLayer` / `destroy` 并清空引用。
- 本地 `/map/ink/tiles/...` 切片和 `getTileUrl` 逻辑仅保留为调试备用，默认不启用。
- 官方图层和本地瓦片 fallback 不会同时叠加。
- 当前地图默认 `zoom = 16`，地图和官方图层的 zoom 范围保持为 `15 - 20`。
- 当前复用 `LINGSHAN_INK_MAP_BOUNDS` 和 `clampScenicCameraBounds` 做景区范围限制，拖出覆盖范围后会自动拉回。

## 配置位置

配置集中在 `src/pages/Map3DGuidePage.tsx`：

- `ENABLE_TENCENT_CUSTOM_LAYER = true`
- `TENCENT_CUSTOM_LAYER_ID = '6a4b665a9818'`
- `TENCENT_CUSTOM_LAYER_CONFIG.opacity`
- `TENCENT_CUSTOM_LAYER_CONFIG.zIndex`
- `TENCENT_CUSTOM_LAYER_CONFIG.minZoom`
- `TENCENT_CUSTOM_LAYER_CONFIG.maxZoom`
- `TENCENT_CUSTOM_LAYER_INITIAL_ZOOM`
- `LINGSHAN_INK_MAP_BOUNDS`

## 后续更新

如果未来重新上传更大范围图层，需要同步检查并修改：

- `TENCENT_CUSTOM_LAYER_ID`
- `TENCENT_CUSTOM_LAYER_CONFIG.minZoom`
- `TENCENT_CUSTOM_LAYER_CONFIG.maxZoom`
- 地图初始化 zoom / `TENCENT_CUSTOM_LAYER_INITIAL_ZOOM`
- 地图 minZoom / maxZoom
- `LINGSHAN_INK_MAP_BOUNDS` 或新的景区边界限制配置

## 结论

当前地图页面不再依赖本地切片或自建瓦片服务。正式渲染路径为腾讯地图底座加腾讯地图平台托管的自定义图层。
