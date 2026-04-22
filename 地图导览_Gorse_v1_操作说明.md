# 地图导览 + Gorse v1 操作说明

这份文档给队友快速说明当前“地图导览 + 真 Gorse v1”集成的实际状态、启动方式和排错点。

---

## 1. 当前状态

目前已经完成并验证：

- `demo` 首页保留 Live2D + 聊天，并新增路线推荐模块
- 已新增页面：
  - `/map`
  - `/spot/:spotId`
- `analytics-server` 已作为推荐适配层，对前端屏蔽 Gorse API key 和 seed 细节
- `gorse-docker` 已成功跑通：
  - REST: `http://127.0.0.1:8087`
  - Dashboard: `http://127.0.0.1:8088`
- Gorse 真链路已验证：
  - 后端启动时 seed `3 条路线 + 6 个种子用户 + 12 条反馈`
  - 推荐接口已返回带 `Gorse 根据相似游客偏好...` 的结果
  - 反馈接口已能写入 `select_route`

---

## 2. 主要代码位置

### 前端

- 首页推荐页：
  - `demo/src/pages/HomePage.tsx`
- 地图导览页：
  - `demo/src/pages/GuideMapPage.tsx`
- 景点讲解页：
  - `demo/src/pages/SpotGuidePage.tsx`
- 导览状态：
  - `demo/src/store/useGuideStore.ts`
- 路线与景点数据：
  - `demo/src/data/guideData.ts`
- 推荐接口调用：
  - `demo/src/api/guide.ts`
- 聊天上下文包装：
  - `demo/src/store/useChatStore.ts`

### 后端

- 推荐接口：
  - `analytics-server/src/main/java/com/lingshan/analytics/controller/GuideController.java`
- 推荐服务：
  - `analytics-server/src/main/java/com/lingshan/analytics/service/GuideRecommendationService.java`
- Gorse client：
  - `analytics-server/src/main/java/com/lingshan/analytics/service/GorseClient.java`
- 路线目录常量：
  - `analytics-server/src/main/java/com/lingshan/analytics/service/GuideRouteCatalog.java`

### Gorse

- `gorse-docker/docker-compose.yml`
- `gorse-docker/config/config.toml`
- `gorse-docker/.env`

---

## 3. 启动顺序

推荐按这个顺序启动：

```bash
# 1. Fay
cd /Users/MR/Desktop/软件杯/数字人开源项目/Fay-main
python fay_booter.py

# 2. Gorse
cd /Users/MR/Desktop/软件杯/gorse-docker
/usr/local/bin/docker-compose up -d

# 3. analytics-server
cd /Users/MR/Desktop/软件杯/analytics-server
mvn spring-boot:run

# 4. demo
cd /Users/MR/Desktop/软件杯/demo
npm run dev
```

---

## 4. 前端本地环境变量

地图导览需要腾讯地图 key。

在 `demo/.env.local` 里至少配置：

```bash
VITE_TMAP_WEB_KEY=你的腾讯地图WebKey
VITE_TMAP_ROUTE_KEY=你的腾讯地图路线规划Key
```

如果没配，地图页会提示缺少腾讯地图 key，但首页推荐和聊天仍然能跑。

---

## 5. 后端与推荐接口

### 推荐接口

```bash
curl -s -X POST http://127.0.0.1:5002/api/guide/recommendations \
  -H 'Content-Type: application/json' \
  -d '{"userId":"guest-test","selectedTags":["祈福静心","文化探秘"]}'
```

### 反馈接口

```bash
curl -s -X POST http://127.0.0.1:5002/api/guide/feedback \
  -H 'Content-Type: application/json' \
  -d '{"userId":"guest-test","routeId":"historical_culture","action":"select_route"}'
```

### 正常预期

- Gorse 正常时：
  - 返回中会出现 `Gorse 根据相似游客偏好...`
- Gorse 异常时：
  - 后端自动回退到本地 tag overlap
  - 接口仍然返回 3 条路线
  - `feedback` 不会再因为 Gorse 不可用而报 500

---

## 6. Gorse 自检

### 健康检查

```bash
curl -s http://127.0.0.1:8087/api/health/live
```

正常应看到：

```json
{
  "Ready": true,
  "DataStoreConnected": true,
  "CacheStoreConnected": true
}
```

### Dashboard

- 地址：`http://127.0.0.1:8088`
- 默认账号：`admin`
- 默认密码：`admin123`

---

## 7. 已知坑位

### 1. 优先用 `/usr/local/bin/docker-compose`

这台机器上 `docker compose` 和凭证助手环境不稳定，建议直接用：

```bash
/usr/local/bin/docker-compose up -d
```

### 2. `gorse-master` 不能带 `--cache-path`

这个坑已经修进当前 `docker-compose.yml` 了。

如果有人后续改 compose，把 `master` 的 `--cache-path` 又加回去，`master` 会反复重启。

### 3. `master` 好了但 `server` 不 ready

如果出现：

- `master` 已经 `Up`
- `8087/api/health/live` 仍是 `Ready: false`
- `server` 日志一直刷 `error reading server preface: EOF`

执行：

```bash
cd /Users/MR/Desktop/软件杯/gorse-docker
/usr/local/bin/docker-compose restart server worker
```

### 4. 想重建整套 Gorse

```bash
cd /Users/MR/Desktop/软件杯/gorse-docker
/usr/local/bin/docker-compose down -v
/usr/local/bin/docker-compose up -d
```

说明：

- `down -v` 会删除这套 Gorse 的 Docker volumes
- 不会影响 `demo`、`analytics-server`、`Fay`

---

## 8. 队友最短验证路线

如果只想快速验证这一版是否可演示：

1. 启动 `gorse-docker`
2. 启动 `analytics-server`
3. 启动 `demo`
4. 打开 `http://localhost:5173`
5. 首页点标签，看路线卡变化
6. 点击路线进入 `/map`
7. 从地图页进入 `/spot/:spotId`
8. 在景点页继续问问题，确认 UI 显示原问题，但回答围绕当前景点展开

---

## 9. 这版的边界

今晚这版只做“路线推荐”：

- Gorse item 只建模路线，不建模景点
- 景点讲解继续复用 `demo` 的 Live2D + ChatPanel + Fay 通信链路
- Fay/RAG 没有改协议，只是前端在景点页包装了上下文 prompt

所以后续如果要继续做：

- 景点级推荐
- 更复杂的协同过滤
- 推荐原因解释增强
- dashboard 上展示路线反馈数据

都可以在这版基础上继续叠加。
