# 手机端局域网路线与 3D 导览人工验证指南

## 1. 验证目的

电脑端与手机端在腾讯地图、3D WebGL、触摸交互、视口尺寸和性能表现上可能不同。手机端更接近真实游客使用场景，因此需要通过局域网访问 Mac 上的 Vite dev server，人工验证路线、POI 聚焦、3D 导览和调试叠加层的实际表现。

本指南用于确认：

- `/scenic-3d-map` 在手机端是否可正常加载和交互。
- `/map` 腾讯地图是否能正常显示、聚焦 POI、展示 InfoWindow。
- `debugSceneRoute` 模式下能否判断蓝绿色路线是腾讯 walking 成功结果，还是 fallback 直线兜底。
- 手机端路线表现是否与电脑端存在明显差异。

## 2. 启动本地服务

在 Mac 上进入 demo 目录：

```bash
cd "/Users/nunu/Downloads/软件杯/code/digital_man/demo"
```

推荐使用：

```bash
npm run dev -- --host 0.0.0.0
```

如果项目脚本或 Vite 配置不支持该参数，请检查 `package.json` 的 `scripts` 和 Vite 配置中的 `host` 设置。

## 3. 获取 Mac 局域网 IP

Wi-Fi 网络通常使用：

```bash
ipconfig getifaddr en0
```

如果是有线网络，可尝试：

```bash
ipconfig getifaddr en1
```

手机访问地址格式：

```text
http://<Mac局域网IP>:5173/
```

示例：

```text
http://192.168.1.23:5173/
```

## 4. 手机访问前提

- 手机和 Mac 必须在同一个 Wi-Fi 或同一个局域网内。
- Mac 防火墙需要允许本地网络访问 Vite dev server。
- Vite 服务需要使用 `--host 0.0.0.0`，否则可能只监听 Mac 本机。
- 不要在手机端输入 `localhost`，因为手机上的 `localhost` 指手机本机，不是 Mac。

## 5. 手机端验证页面

- 首页：`/`
- 沉浸式 3D 导览地图：`/scenic-3d-map`
- 真实腾讯地图：`/map`
- 历史文化路线调试：`/map?sceneRoute=historical_3d_scene&debugSceneRoute=1`
- 自然风光路线调试：`/map?sceneRoute=natural_3d_scene&debugSceneRoute=1`
- 亲子路线调试：`/map?sceneRoute=family_3d_scene&debugSceneRoute=1`
- POI 聚焦：`/map?poi=jiulong_guanyu`
- POI 聚焦：`/map?poi=giant_buddha`
- POI 聚焦：`/map?poi=fan_gong`
- POI 聚焦：`/map?poi=wuyin_tancheng`

## 6. 手机端验证清单

| 验证项 | 通过标准 | 结果 | 备注 |
|---|---|---|---|
| 首页能否打开 | 手机浏览器能正常打开首页并显示主要入口 |  |  |
| `/scenic-3d-map` 是否能加载 | 3D 页面加载完成，无明显白屏或崩溃 |  |  |
| 3D 是否可拖拽/缩放 | 触摸拖拽、双指缩放可用，画面不失控 |  |  |
| 路线切换是否可用 | 三条 3D 路线可切换，站点列表同步更新 |  |  |
| 查看景点真实地图是否跳转 `/map?poi=xxx` | 点击后进入真实地图并携带对应 `poi` 参数 |  |  |
| `/map` 腾讯地图是否显示 | 腾讯地图底图、Marker 和路线区域正常显示 |  |  |
| Marker 是否可点击 | 点击 Marker 后页面有响应，当前景点状态更新 |  |  |
| InfoWindow 是否显示 | 选中景点后地图上出现对应 InfoWindow |  |  |
| sceneRoute debug 线是否显示 | 带 `debugSceneRoute=1` 时显示金色骨架线和调试提示 |  |  |
| plannedRoute 是否 fallback | 调试提示中能看到 `usedFallback` 和 `fallbackReason` |  |  |
| 手机端路线是否比电脑端更合理 | 对比同一路线，观察蓝绿色线是否更贴近园区道路 |  |  |
| 控制台/远程调试是否有明显错误 | 无明显 WebGL、地图 SDK 或脚本加载错误 |  |  |

## 7. iPhone Safari 调试建议

如果使用 iPhone，可通过 Mac Safari 的开发者工具连接 iPhone 进行远程调试。开启方式通常需要在 iPhone Safari 设置中启用 Web 检查器，并在 Mac Safari 的开发菜单中选择对应设备页面。

如果暂时不方便远程调试，先通过页面上的可视化调试信息判断 `plannedRoute.usedFallback`、`fallbackReason`、路径点数、距离和耗时。

## 8. 注意事项

- `.env.local` 不要提交。
- 手机访问依赖本地网络，离开该 Wi-Fi 后无法访问 Mac 上的本地服务。
- 腾讯地图 Key 可能限制域名或来源，需要确保 `localhost` / 局域网 IP 调试场景可用。
- 手机端性能、发热、WebGL context lost 需要单独观察。
- `debugSceneRoute` 的金色线不是真实道路，只是 3D route 的 POI 骨架连线。
- 蓝绿色线是否 fallback 需要看页面调试信息中的 `plannedRoute.usedFallback`。
