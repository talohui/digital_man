# 腾讯地图真实 ViewMode 诊断与修复

## 审计基线

- SDK 由 `src/lib/loadTMap.ts` 加载：`https://map.qq.com/api/gljs?v=1.exp`，附加 `model` 库。
- 官方 JavaScript API GL 示例目录包含“2D/3D 模式切换”“设置/获取地图视角”及自定义栅格图层；本项目只对运行时实际存在的方法做 feature detection，不假定 WebView 一定实现某个可选 API。
- 本轮前，`new TMap.Map()` 仅传入 `pitch`、`rotation`，没有显式传入 `viewMode`。
- 本轮前，`setViewMode?.()` 被可选调用与 `try/catch` 包裹；异常不会阻止 React 状态继续标记为切换完成。
- 本轮前，调试对象的 `currentViewMode`、pitch、rotation 来自 presentation 和本地 `CameraState` ref，不是腾讯实例 getter。
- 腾讯托管 `ImageTileLayer.createCustomLayer()` 只在地图 ready 时创建，presentation 切换后没有同层刷新步骤。

## 修复策略

1. 地图构造参数显式设置 `viewMode: '2D' | '3D'`，并让初始 pitch/rotation 与该模式一致。
2. 单地图实例切换使用 `applyPresentationToExistingMap()`：
   - 调用 `setViewMode()`；
   - 仅在 SDK 实际提供时调用 `setPitchable()` / `setRotatable()`；
   - 恢复 center、zoom、pitch、rotation；
   - 等待 `rendercomplete`、`idle` 或 `tilesloaded`，再读取真实 getter。
3. 成功必须同时满足：`getViewMode()` 为目标模式，`getPitch()` 和 `getRotation()` 与请求相符。未通过时 transition 不会进入 `ready`，而是恢复上一个已验证 presentation。
4. `window.__LINGSHAN_MAP_DEBUG__` 与 `window.LINGSHAN_MAP_DEBUG` 现在同时显示 requested/applied presentation 以及真实 getter 快照；`window.__GET_LINGSHAN_MAP_SNAPSHOT__()` 会再次直接读取当前地图实例。
5. 仅在 3D -> 2D 已验证后，复用同一个腾讯托管自定义影像层：优先 `setVisible(false/true)` 跨两帧刷新；当 SDK 不支持该方法时才 `setMap(null/map)`。不重新调用 `createCustomLayer()`，不销毁地图。

## 真机验收

在 OPPO QQ 内置浏览器打开地图后，在远程调试控制台执行：

```js
window.__GET_LINGSHAN_MAP_SNAPSHOT__()
```

重点检查：

1. 首次 `ink2d`：`actualViewMode === '2D'`、`actualPitch === 0`、`actualRotation === 0`。
2. 切换 `scenic3d`：真实 mode 为 `3D`，再确认 GLB 正常显示。
3. 切回 `ink2d`：真实 mode/pitch/rotation 回到 `2D/0/0`，`mapCreateCount` 仍为 1、`mapDestroyCount` 仍为 0。
4. 检查 `customTileLayer.refreshCount` 与 `lastRefreshReason`；若真实相机正确但画面仍倾斜，应记录截图和这两个字段，不要创建第二个图层。
5. 云朵转场消失后拖动地图，确认没有透明事件层残留。
