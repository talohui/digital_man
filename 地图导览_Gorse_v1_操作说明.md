# 地图导览 + Gorse v1 操作说明

> 这份文档给接手队友用。目标不是解释原理，而是让大家能尽快把这一版跑起来、验证一遍、定位常见问题。

## 1. 这版已经接通什么

当前分支已经完成下面这条链路：

`首页 Live2D + 聊天 -> 标签选择 -> Gorse 返回 3 条路线 -> 进入 /map -> 点击景点 -> 进入 /spot/:spotId -> 围绕当前景点继续和数字人对话`

已经实测通过的点：

- `demo` 首页新增路线推荐模块
- 新增 `/map` 和 `/spot/:spotId`
- `analytics-server` 已接入 Gorse 适配层
- `gorse-docker` 已能正常提供 `8087 / 8088`
- Fay 已切回本地百炼配置，聊天链路已验证可用

## 2. 启动前先确认

### 2.1 Fay 本地配置

`数字人开源项目/Fay-main/system.conf` 必须存在，而且必须是你们自己的本地配置。

不要依赖社区公共配置。
如果 Fay 没读到本地 `system.conf`，它可能退回到别人的公共账号，导致：

- 用到错误的模型供应商
- 聊天额度不足
- `embeddings` 报 `403`

正常日志应该出现：

```text
model=qwen-turbo
base_url=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### 2.2 demo 环境变量

`demo/.env.local` 至少要有：

```bash
VITE_POSTHOG_KEY=你的 PostHog Key
VITE_TMAP_WEB_KEY=你的腾讯地图 Web Key
VITE_TMAP_ROUTE_KEY=你的腾讯地图路线规划 Key
```

### 2.3 Gorse 本地环境文件

```bash
cd gorse-docker
cp .env.example .env
```

## 3. 最短启动顺序

建议开 4 个终端。

### 终端 1：Fay

```bash
cd 数字人开源项目/Fay-main
python main.py start
```

不要用：

```bash
python fay_booter.py
```

当前主流程统一用 `python main.py start`。

正常标志：

- 终端出现 `请通过浏览器访问 http://127.0.0.1:5000/ 管理您的Fay`
- 后面出现 `服务启动完成!`
- `ws://127.0.0.1:10003` 正常监听

### 终端 2：Gorse

```bash
cd gorse-docker
/usr/local/bin/docker-compose up -d
```

验证：

```bash
curl -s http://127.0.0.1:8087/api/health/live
```

应返回：

```json
{
  "Ready": true,
  "DataStoreConnected": true,
  "CacheStoreConnected": true
}
```

Dashboard：

- 地址：`http://127.0.0.1:8088`
- 用户名：`admin`
- 密码：`admin123`

### 终端 3：analytics-server

```bash
cd analytics-server
mvn spring-boot:run
```

验证：

```bash
curl -s http://127.0.0.1:5002/api/summary
```

### 终端 4：demo

```bash
cd demo
npm run dev -- --host 127.0.0.1
```

说明：

- 默认会尝试 `5173`
- 如果 `5173` 被占用，会自动切到 `5174` 或更高
- 以终端里 `Local:` 打印的地址为准

## 4. 建议验证路线

把这套流程完整走一遍：

1. 打开前端首页
2. 首页点击一个快捷问题，确认 Fay 能回答
3. 选择 1 到 2 个标签，确认路线卡刷新
4. 点击“进入地图导览”，进入 `/map`
5. 切换路线，确认标题、marker、polyline、底部抽屉同步更新
6. 点击一个景点进入 `/spot/:spotId`
7. 在景点页提问，确认 UI 显示原问题，但回答围绕当前景点

## 5. 核心接口

### 推荐接口

```bash
curl -s -X POST http://127.0.0.1:5002/api/guide/recommendations \
  -H 'Content-Type: application/json' \
  -d '{"userId":"guest-test","selectedTags":["祈福静心","文化探秘"]}'
```

正常预期：

- 总能返回 3 条路线
- Gorse 正常时，`reason` 里会出现类似 `Gorse 根据相似游客偏好...`
- Gorse 异常时，会自动回退到本地 tag overlap

### 反馈接口

```bash
curl -s -X POST http://127.0.0.1:5002/api/guide/feedback \
  -H 'Content-Type: application/json' \
  -d '{"userId":"guest-test","routeId":"historical_culture","action":"select_route"}'
```

正常预期：

- 返回 `{"ok":true}`
- Gorse dashboard / API 里能看到对应反馈

## 6. 当前关键代码位置

### 前端

- `demo/src/pages/HomePage.tsx`
- `demo/src/pages/GuideMapPage.tsx`
- `demo/src/pages/SpotGuidePage.tsx`
- `demo/src/store/useGuideStore.ts`
- `demo/src/data/guideData.ts`
- `demo/src/api/guide.ts`
- `demo/src/api/fay.ts`
- `demo/src/store/useChatStore.ts`

### 后端

- `analytics-server/src/main/java/com/lingshan/analytics/controller/GuideController.java`
- `analytics-server/src/main/java/com/lingshan/analytics/service/GuideRecommendationService.java`
- `analytics-server/src/main/java/com/lingshan/analytics/service/GorseClient.java`
- `analytics-server/src/main/java/com/lingshan/analytics/service/GuideRouteCatalog.java`

### Gorse

- `gorse-docker/docker-compose.yml`
- `gorse-docker/config/config.toml`
- `gorse-docker/.env.example`

### Fay

- `数字人开源项目/Fay-main/core/recorder.py`
- `数字人开源项目/Fay-main/core/wsa_server.py`
- `数字人开源项目/Fay-main/gui/flask_server.py`
- `数字人开源项目/Fay-main/fay_booter.py`
- `数字人开源项目/Fay-main/requirements.txt`

## 7. 这次已经补过的坑

### Fay

- 前端默认 HTTP 地址已改成 `5000`
- Python 3.13+ 的 `audioop` 缺失已兼容
- Fay 启动时几个关键端口加了重试，降低“端口刚释放就启动失败”的概率

### Gorse

- `master` 的 `--cache-path` 已移除
- `server` 不 ready 时可直接 `restart server worker`

## 8. 常见问题

**Q：前端提示 Fay WebSocket 连接失败**

- 先看 Fay 终端是否已经打印 `服务启动完成!`
- 确认 Fay HTTP 是 `5000`
- 确认 `10003` 已监听

**Q：Fay 回复“抱歉，我的大脑暂时开了小差，请稍后再试一下。”**

- 大概率是主聊天模型调用失败
- 第一件事先看日志是不是还在用公共 SiliconFlow 配置
- 如果不是百炼地址，说明本地 `system.conf` 没生效

**Q：Gorse 健康检查不通**

- 先看：

```bash
cd gorse-docker
/usr/local/bin/docker-compose ps
```

- 如果 `master` 是 `Up`，但 `Ready` 仍是 `false`，再执行：

```bash
/usr/local/bin/docker-compose restart server worker
```

**Q：前端不是 5173**

- 这是正常现象
- 以 `npm run dev` 终端里的 `Local:` 地址为准

**Q：macOS 占了 5000**

- 关闭 `AirPlay Receiver`
- 然后重新执行 `python main.py start`

## 9. 一句话给队友

如果队友只记住一句：

先让 Fay 读到本地百炼 `system.conf`，再按 `Fay -> Gorse -> analytics-server -> demo` 的顺序启动，最后以前端终端打印的 `Local:` 地址为准。
