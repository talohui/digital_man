# 灵山胜境开屏广告页素材目录

实际静态资源目录：`demo/public/intro/`

当前项目是 Vite 应用，`demo/public/` 下的文件会作为站点根路径静态资源提供。开发环境或部署在站点根路径时，可通过 `/intro/文件名` 访问。

如果后续构建产物部署在非站点根路径，并且继续使用 `base: './'`，组件内建议用 `import.meta.env.BASE_URL + 'intro/文件名'` 拼接相对访问路径。

## 当前资源

| 文件 | 用途 | 推荐尺寸 | 访问路径 |
| --- | --- | --- | --- |
| `splash/splash-01.png` | 开屏广告候选图 1 | 竖屏优先，建议 9:16 | `/intro/splash/splash-01.png` |
| `splash/splash-02.png` | 开屏广告候选图 2 | 竖屏优先，建议 9:16 | `/intro/splash/splash-02.png` |
| `splash/splash-03.png` | 开屏广告候选图 3 | 竖屏优先，建议 9:16 | `/intro/splash/splash-03.png` |
| `splash/splash-04.png` | 开屏广告候选图 4 | 竖屏优先，建议 9:16 | `/intro/splash/splash-04.png` |
| `splash/splash-05.png` | 开屏广告候选图 5 | 竖屏优先，建议 9:16 | `/intro/splash/splash-05.png` |
| `splash-assets.json` | 开屏广告资源清单 | JSON | `/intro/splash-assets.json` |

## 使用说明

- `SplashAdPage` 当前使用组件内的 `SPLASH_IMAGE_URLS` 数组，路径与 `splash-assets.json` 保持一致。
- 图片会使用模糊铺底 + 前景 `object-fit: contain` 显示，优先保证大佛等主体完整；仍建议把重要主体放在画面中部安全区。
- 每次进入会从候选图中随机选 3 张，5 秒内 crossfade 切换。
- 如果图片缺失或加载失败，页面会显示兜底渐变背景，不会白屏或崩溃。
- 替换图片时保持 `splash-01.png` 到 `splash-05.png` 命名，或同步更新 `src/lib/splashImages.ts` 与 `splash-assets.json`。
- 比赛演示时如需重新查看开屏页，在浏览器控制台执行：`localStorage.removeItem('hasSeenLingshanSplash')`。
