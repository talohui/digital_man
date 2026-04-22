# 工作交接文档

> 当前负责人：german-spalo  
> 仓库：https://github.com/talohui/digital_man  
> 更新时间：2026-04-22（最新进展见下方“地图导览 + Gorse v1 最新状态”）

---

## 项目目录结构

```
/Users/MR/Desktop/软件杯/               ← 主仓库根目录
├── demo/                               前端 React 18 + Vite（端口 5173）
├── analytics-server/                   Spring Boot 行为分析后端（端口 5002）
├── gorse-docker/                       Gorse 路线推荐集群（REST:8087，Dashboard:8088）
├── lingshan-rag/                       Python RAG 知识库 + MCP Server
├── 数字人开源项目/Fay-main/             Fay 数字人引擎（HTTP:5001，WS:10003）
├── dataease-docker/                    DataEase v2 Docker 启动目录（端口 8100）
├── SETUP.md                            环境搭建指南（队友 clone 后先看这个）
├── HANDOFF.md                          本文件
├── README.md                           项目简介
└── 实现文档.md                          完整技术实现文档
```

---

## 各服务启动命令

```bash
# 1. Fay 数字人引擎
cd /Users/MR/Desktop/软件杯/数字人开源项目/Fay-main
python fay_booter.py

# 2. analytics-server（行为分析后端）
cd /Users/MR/Desktop/软件杯/analytics-server
mvn spring-boot:run

# 3. Gorse（路线推荐）
cd /Users/MR/Desktop/软件杯/gorse-docker
/usr/local/bin/docker-compose up -d

# 4. 前端 demo
cd /Users/MR/Desktop/软件杯/demo
npm run dev
# 访问 http://localhost:5173
# 管理大屏 http://localhost:5173/admin

# 5. DataEase（Docker，已配置好）
cd /Users/MR/Desktop/软件杯/dataease-docker
docker compose up -d
# 访问 http://localhost:8100
```

---

## 当前进度

### ✅ 2026-04-22 新增完成：地图导览 + Gorse v1

- `demo` 已接入首页标签推荐、`/map` 地图导览页、`/spot/:spotId` 景点讲解页
- 地图原型中的路线、景点、叙事、腾讯地图加载和步行算路逻辑已迁入 `demo`
- `useChatStore` 已支持 `guideContext`，景点页发给 Fay 的内容会自动附带当前路线/景点上下文
- `analytics-server` 已新增：
  - `POST /api/guide/recommendations`
  - `POST /api/guide/feedback`
  - Gorse seed、用户标签 upsert、推荐兜底 fallback
- `gorse-docker` 已创建并验证跑通：
  - `8087` Gorse REST
  - `8088` Gorse dashboard
- 已确认真 Gorse 链路可用：
  - analytics-server 启动时成功 seed `3 routes / 6 seed users / 12 feedback rows`
  - 推荐接口已出现 `Gorse 根据相似游客偏好...` 的真实返回
  - 反馈接口已成功写入 `select_route`

### 地图导览 + Gorse v1 最新状态

#### 代码位置

- 前端主入口：
  - `demo/src/pages/HomePage.tsx`
  - `demo/src/pages/GuideMapPage.tsx`
  - `demo/src/pages/SpotGuidePage.tsx`
- 前端导览状态与数据：
  - `demo/src/store/useGuideStore.ts`
  - `demo/src/data/guideData.ts`
  - `demo/src/api/guide.ts`
- 聊天上下文：
  - `demo/src/store/useChatStore.ts`
  - `demo/src/components/QuickAsks.tsx`
  - `demo/src/components/Live2DStage.tsx`
- 地图工具：
  - `demo/src/lib/loadTMap.ts`
  - `demo/src/lib/routePlanning.ts`
- 后端 Gorse 适配：
  - `analytics-server/src/main/java/com/lingshan/analytics/controller/GuideController.java`
  - `analytics-server/src/main/java/com/lingshan/analytics/service/GuideRecommendationService.java`
  - `analytics-server/src/main/java/com/lingshan/analytics/service/GorseClient.java`
  - `analytics-server/src/main/java/com/lingshan/analytics/service/GuideRouteCatalog.java`
- Gorse 集群目录：
  - `gorse-docker/docker-compose.yml`
  - `gorse-docker/config/config.toml`
  - `gorse-docker/.env`

#### 启动顺序

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

#### 关键验证

- Gorse REST 健康检查：
  - `curl -s http://127.0.0.1:8087/api/health/live`
  - 应返回 `"Ready": true`
- Gorse dashboard：
  - 打开 `http://127.0.0.1:8088`
  - 默认登录：`admin / admin123`
- 推荐接口：
  - `curl -s -X POST http://127.0.0.1:5002/api/guide/recommendations -H 'Content-Type: application/json' -d '{"userId":"guest-test","selectedTags":["祈福静心","文化探秘"]}'`
- 反馈接口：
  - `curl -s -X POST http://127.0.0.1:5002/api/guide/feedback -H 'Content-Type: application/json' -d '{"userId":"guest-test","routeId":"historical_culture","action":"select_route"}'`

#### 当前已知操作要点

- `demo` 地图页依赖腾讯地图 key，需在 `demo/.env.local` 配置：
  - `VITE_TMAP_WEB_KEY=...`
  - `VITE_TMAP_ROUTE_KEY=...`
- 启动 Gorse 时优先用独立版 compose：
  - `/usr/local/bin/docker-compose up -d`
- 当前 `gorse-master` 不能带 `--cache-path` 启动参数，否则会反复崩溃
- 如果队友重建 Gorse 后发现 `master` 正常、`server` 仍不 ready，执行一次：

```bash
cd /Users/MR/Desktop/软件杯/gorse-docker
/usr/local/bin/docker-compose restart server worker
```

#### 一份更细的操作说明

- 查看：`/Users/MR/Desktop/软件杯/地图导览_Gorse_v1_操作说明.md`

### ✅ 已完成

- **前端数字人闭环**：Live2D 渲染、TTS 音频播放、嘴型同步、浏览器 ASR 语音识别
- **Fay 通信修复**：WS 注册帧 `{"Username":"User"}`、HTTP x-www-form-urlencoded 格式
- **analytics-server**：Spring Boot + H2 数据库，情感分析 Strategy 模式（KeywordSentimentAnalyzer），6 个 REST 端点
- **前端埋点**：双通道（PostHog + analytics-server），9 类事件
- **`/admin` 大屏**：React 自建大屏，5 KPI 卡片 + 情感折线 + 热门问题条形图 + 时延统计
- **PostHog 已接入**：Key 写入 `demo/.env.local`（`phc_kCp4ewMSdUHcHbzJeMhDvCiGzPrNwqHrFR7o8CmpUJP6`）
- **DataEase 容器启动**：MySQL + APISIX + DataEase 四个容器正常运行，`http://localhost:8100` 可访问

### 🚧 未完成（需继续）

**DataEase 登录问题（详细排查记录如下）**

---

## DataEase 排查详情（2026-04-21 最新状态）

### 已确认的事实

1. **per_user 表列名**（与官方文档不同，实际字段为）：
   ```
   id, account, pwd, name, email, phone_prefix, phone,
   enable, origin, creator_id, create_time, language,
   default_oid, pwd_update_time
   ```
   - 密码列是 `pwd`（不是 `password`）
   - 启用列是 `enable`（不是 `enabled`）
   - `id` 是 BIGINT，**无自增**，必须手动传
   - `pwd_update_time` 是 NOT NULL

2. **admin 账号已插入**，当前 per_user 表内容：
   ```
   id=1, account=admin, enable=1
   pwd=$2b$10$x1EIANoSQkzF1nC4VyJl/ucUIQkJMVSYTVk4jwwhMzg77.f.qRcm2
   ```
   （BCrypt 哈希，对应密码 `DataEase@2022!`）

3. **APISIX Key 修复**：`dataease-docker/conf/apisix.yaml` 中将 `key: DE_APISIX_KEY`（字面量字符串）改为了 `key: lingshan2024apisixkey`（真实值），修复后 DataEase 成功向 APISIX 注册了 4 条路由（routes 1001~1004）

4. **APISIX 路由已注册**（验证命令）：
   ```bash
   docker exec dataease curl -s 'http://apisix:9180/apisix/admin/routes' \
     -H 'X-API-KEY: lingshan2024apisixkey' | python3 -m json.tool
   ```
   有 `auth_check / global_static / default_index / default_api` 四条路由

5. **当前阻塞**：通过 APISIX（port 9080）调用登录接口，DataEase 返回：
   ```json
   {"code":10001,"msg":"密码不能为空"}
   ```
   JSON body 正确发出（68字节），但服务端解析到密码为空

### 可能的根因

DataEase v2.10 的登录端点 `/de2api/login/localLogin` 使用了 `xpack` 企业包（`io.dataease.xpack.permissions.login.server.LoginServer`），该版本可能：
- 字段名改变（试 `loginName`/`loginPassword` 和 `account`/`password` 均报空）
- 或请求需经过 APISIX 的 `forward-auth` 插件处理后，body 才能被正确解析
- 或需要特定的请求头（如 `DE-GATEWAY-FLAG`）

### 下一步建议（Codex 继续）

**方法A：用浏览器打开 http://localhost:9080 直接登录**（最快验证）
- APISIX 在 9080，DataEase 在 8100，实际前端入口可能在 9080
- 浏览器自动处理 cookie/重定向，绕开 curl 的问题

**方法B：从 DataEase 日志查看登录请求体**
```bash
# 开启 DataEase DEBUG 日志
docker exec dataease sh -c "
curl -s -X POST 'http://localhost:8100/actuator/loggers/io.dataease' \
  -H 'Content-Type: application/json' \
  -d '{\"configuredLevel\":\"DEBUG\"}'
" 2>/dev/null

# 然后发登录请求，看日志
curl -s -X POST 'http://localhost:9080/de2api/login/localLogin' \
  -H 'Content-Type: application/json' \
  --data-raw '{"loginName":"admin","loginPassword":"DataEase@2022!","loginType":0}'

docker logs dataease 2>&1 | tail -20
```

**方法C：直接调用 DataEase API 获取 token（绕过 UI 登录）**

DataEase v2.10 xpack 包的登录可能走 `/de2api/login/localLogin` 但参数通过 APISIX 的 `hmac-auth` 或其他机制签名。可以查看 DataEase 数据库里的 `per_api_key` 表是否有 token。

**方法D：重置整个 DataEase 数据（核武器）**
```bash
cd /Users/MR/Desktop/软件杯/dataease-docker
docker compose down
rm -rf data/mysql data/de data/etcd data/apisix
docker compose up -d
# 等待约 3 分钟首次初始化
# DataEase 会自动创建 admin 账号
```
> ⚠️ 这会清空所有 DataEase 配置，但 MySQL 数据会重新初始化（admin 账号由 DataEase 自动创建）

**方法E：检查 APISIX forward-auth 对 login 的处理**
```bash
# 查看 forward-auth 插件是否对登录端点有特殊规则
docker exec dataease curl -s 'http://apisix:9180/apisix/admin/routes/1004' \
  -H 'X-API-KEY: lingshan2024apisixkey' | python3 -m json.tool

# 也查 global upstream
docker exec dataease curl -s 'http://apisix:9180/apisix/admin/upstreams/1' \
  -H 'X-API-KEY: lingshan2024apisixkey' | python3 -m json.tool
```

> 💡 **推荐优先尝试方法D**（清空重建），因为 DataEase v2 首次启动时会自动创建 admin 账号，目前 admin 是手动插入的，可能与 DataEase 内部初始化逻辑（如关联 per_org 等权限表）不兼容。

---

**DataEase 登录成功后，配置 5 个 API 数据集**：

进入 DataEase → 数据集管理 → 新建 → API 数据集，依次创建：

| 数据集名 | URL | 轮询间隔 |
|---|---|---|
| 今日概览 | `http://host.docker.internal:5002/api/summary` | 30s |
| 情感趋势 | `http://host.docker.internal:5002/api/sentiment-trend?hours=12` | 5min |
| 热门问题 | `http://host.docker.internal:5002/api/popular-questions?limit=10` | 5min |
| 时延统计 | `http://host.docker.internal:5002/api/latency-stats` | 30s |
| 实时状态 | `http://host.docker.internal:5002/api/realtime` | 10s |

> ⚠️ DataEase 在 Docker 容器内，必须用 `host.docker.internal` 而不是 `localhost` 访问宿主机服务

---

**DataEase 大屏搭建**（1920×1080）：

| 组件类型 | 数据来源字段 | 说明 |
|---|---|---|
| 数字卡片 | `summary.totalMessages` | 今日对话量 |
| 数字卡片 | `summary.positiveRatio` | 正面情感占比 |
| 数字卡片 | `summary.quickAskCount` | 快捷问题点击数 |
| 数字卡片 | `latencyStats.p90Ms` | P90 响应时延 |
| 数字卡片 | `realtime.activeSessions5min` | 近5分钟活跃会话 |
| 折线图 | 情感趋势数据集 | positive/negative/neutral 三条线 |
| 横向条形图 | 热门问题数据集 | Top10 问题按点击量排序 |
| 数字指标 | `latencyStats.p50Ms/p90Ms/maxMs` | 响应时延分位数 |

---

## 重要配置说明

### Fay API Key（每人自己配，不在 git 里）

```bash
cd /Users/MR/Desktop/软件杯/数字人开源项目/Fay-main
cp system.conf.bak system.conf
# 编辑 system.conf，填写：
# gpt_api_key=      ← 阿里百炼 API Key
# gpt_base_url=https://dashscope.aliyuncs.com/compatible-mode/v1
# gpt_model_engine=qwen-max
# ali_tss_key_id=   ← 阿里云 TTS AccessKey ID
# ali_tss_key_secret=
# ali_tss_app_key=
```

### PostHog Key（已配置，不在 git 里）

```
demo/.env.local 内容：
VITE_POSTHOG_KEY=phc_kCp4ewMSdUHcHbzJeMhDvCiGzPrNwqHrFR7o8CmpUJP6
```

### DataEase Docker 配置

```
目录：/Users/MR/Desktop/软件杯/dataease-docker/
版本：v2.10.21
MySQL 密码：DataEase@2024
DataEase 端口：8100
```

---

## API 端点速查

| 服务 | 端点 | 说明 |
|---|---|---|
| Fay | `POST http://127.0.0.1:5001/api/send` | 发送消息 |
| Fay | `ws://127.0.0.1:10003` | 接收回复 |
| analytics | `POST http://127.0.0.1:5002/api/events` | 上报埋点事件 |
| analytics | `GET http://127.0.0.1:5002/api/summary` | 今日 KPI |
| analytics | `GET http://127.0.0.1:5002/api/sentiment-trend?hours=12` | 情感趋势 |
| analytics | `GET http://127.0.0.1:5002/api/popular-questions?limit=10` | 热门问题 |
| analytics | `GET http://127.0.0.1:5002/api/latency-stats` | 响应时延 |
| analytics | `GET http://127.0.0.1:5002/api/realtime` | 实时状态 |
| DataEase | `http://localhost:8100` | B端大屏 |
| 前端 | `http://localhost:5173` | 主页面 |
| 前端 | `http://localhost:5173/admin` | 自建大屏 |
