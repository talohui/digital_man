# 工作交接文档

> 当前负责人：german-spalo
> 仓库：https://github.com/talohui/digital_man
> 更新时间：2026-05-09

---

## 项目目录结构

```text
/Users/MR/Desktop/软件杯/
├── demo/                               前端 React 18 + Vite（默认 5173，可自动切到 5174+）
├── analytics-server/                   Spring Boot 行为分析后端（5002）
├── gorse-docker/                       Gorse 路线推荐集群（8087 / 8088）
├── lingshan-rag/                       Python RAG 知识库 + MCP Server
├── 数字人开源项目/Fay-main/             Fay 数字人引擎（HTTP:5000，WS:10003）
├── dataease-docker/                    DataEase v2 本地 Docker 配置（9080 / 8100）
├── SETUP.md                            环境搭建指南
├── HANDOFF.md                          本文件
├── README.md                           项目简介
├── 地图导览_Gorse_v1_操作说明.md        地图导览 + Gorse v1 详细说明
└── 实现文档.md                          完整技术实现文档
```

---

## 当前状态

### 已完成

- 前端数字人主链路可用：Live2D、TTS、嘴型同步、浏览器 ASR 已闭环
- Fay 通信已修复：WS 注册帧与 HTTP 表单发送格式已对齐
- `analytics-server` 已稳定提供行为分析接口与导览推荐接口
- React `/admin` 运营大屏可用
- DataEase 本地大屏已恢复，可通过 APISIX 入口访问
- 地图导览 + Gorse v1 已接入到 `demo` 主前端并完成联调

### 当前没有的主阻塞

- 不再存在 DataEase 登录是主阻塞点的问题
- Gorse 已经不是“仅 fallback”，真 Gorse 链路已跑通

### 仍需注意

- `dataease-docker/data/`、`dataease-docker/.env`、`gorse-docker/.env`、`数字人开源项目/Fay-main/system.conf` 都是本地运行文件，不进 Git
- 如果换新机器，DataEase 的数据源 / 数据集 / 大屏需要按本文档重新在 UI 中建一次
- 地图页依赖腾讯地图 key，队友本地必须自行补齐 `demo/.env.local`

---

## 各服务启动命令

```bash
# 1. Fay
cd /Users/MR/Desktop/软件杯/数字人开源项目/Fay-main
python main.py start

# 2. Gorse
cd /Users/MR/Desktop/软件杯/gorse-docker
/usr/local/bin/docker-compose up -d

# 3. analytics-server
cd /Users/MR/Desktop/软件杯/analytics-server
mvn spring-boot:run

# 4. demo
cd /Users/MR/Desktop/软件杯/demo
npm run dev

# 5. DataEase
cd /Users/MR/Desktop/软件杯/dataease-docker
./start.sh
```

---

## 当前推荐访问地址

| 服务 | 地址 | 说明 |
|---|---|---|
| Fay | `http://127.0.0.1:5000` | 数字人 HTTP 接口 |
| Fay WS | `ws://127.0.0.1:10003` | 数字人消息 / 音频推送 |
| analytics-server | `http://127.0.0.1:5002` | 行为分析 REST API |
| 前端主页 | `http://127.0.0.1:5173` | 默认用户交互页面 |
| React `/admin` | `http://127.0.0.1:5173/admin` | 默认自建运营大屏 |
| Gorse REST | `http://127.0.0.1:8087` | 路线推荐 REST |
| Gorse Dashboard | `http://127.0.0.1:8088` | Dashboard 登录页 |
| DataEase | `http://localhost:9080` | 推荐入口，经 APISIX 转发 |
| DataEase 直连 | `http://localhost:8100` | 容器直连入口 |

---

## 地图导览 + Gorse v1 最新状态

### 当前能力

- `demo` 首页保留 Live2D 与聊天，同时新增标签选路与推荐路线卡
- 新增 `/map` 地图导览页与 `/spot/:spotId` 景点讲解页
- 景点页继续复用现有数字人能力，提问时会自动带上路线 / 景点上下文
- `analytics-server` 提供：
  - `POST /api/guide/recommendations`
  - `POST /api/guide/feedback`
- 推荐接口已支持：
  - 用户标签 upsert
  - Gorse 推荐
  - `impression_route` 写回
  - Gorse 不可用时的本地 fallback
- 反馈接口已支持 `select_route` 写入

### 关键代码位置

- 前端页面：
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
- Gorse 集群：
  - `gorse-docker/docker-compose.yml`
  - `gorse-docker/config/config.toml`
  - `gorse-docker/.env.example`

### 已验证结果

- Gorse health：`/api/health/live` 返回 `Ready: true`
- Gorse dashboard：`8088` 可跳转登录页
- analytics-server 启动时成功 seed `3 routes / 6 seed users / 12 feedback rows`
- `POST /api/guide/recommendations` 已能返回 3 条路线
- `POST /api/guide/feedback` 已能写入 `select_route`
- Fay 已实测切回百炼：
  - `gpt_base_url=https://dashscope.aliyuncs.com/compatible-mode/v1`
  - `gpt_model_engine=qwen-turbo`
  - 真实 `POST /v1/chat/completions` 可返回正常回答

### 已知操作要点

- 腾讯地图 key 需配置在 `demo/.env.local`
- Fay 必须读本地 `数字人开源项目/Fay-main/system.conf`，不要依赖社区公共配置
- Fay 主 HTTP 端口是 `5000`，不是 `5001`
- 启动 Gorse 时优先用 `/usr/local/bin/docker-compose`
- `gorse-master` 不能带 `--cache-path`
- 如果 `5173` 被占用，Vite 会自动切到 `5174` 或更高端口，以终端 `Local:` 输出为准
- 如果 `master` 正常但 `server` 仍不 ready，执行：

```bash
cd /Users/MR/Desktop/软件杯/gorse-docker
/usr/local/bin/docker-compose restart server worker
```

### 详细说明

- 查看 `地图导览_Gorse_v1_操作说明.md`

---

## DataEase 当前约定

### 仓库内已版本化

- `dataease-docker/docker-compose.yml`
- `dataease-docker/conf/*`
- `dataease-docker/.env.example`
- `dataease-docker/start.sh`

### 本地运行目录

- `dataease-docker/data/`
- `dataease-docker/.env`

### 当前 UI 配置方式

1. 数据源中新建 `API` 数据源
2. 在 API 数据源里创建 5 张 API 表
3. 每张表单独创建单表数据集
4. 在数据大屏里组合 KPI、趋势图和条形图

### 5 张 API 表 / 数据集

| 名称 | URL | 建议刷新频率 |
|---|---|---|
| 今日概览 / `summary` | `http://host.docker.internal:5002/api/summary` | 1 分钟 |
| 情感趋势 / `sentiment_trend` | `http://host.docker.internal:5002/api/sentiment-trend?hours=12` | 5 分钟 |
| 热门问题 / `popular_questions` | `http://host.docker.internal:5002/api/popular-questions?limit=10` | 5 分钟 |
| 时延统计 / `latency_stats` | `http://host.docker.internal:5002/api/latency-stats` | 1 分钟 |
| 实时状态 / `realtime` | `http://host.docker.internal:5002/api/realtime` | 1 分钟 |

> Docker 内访问宿主机服务必须使用 `host.docker.internal`，不要写 `localhost`。

### 当前大屏组件映射

| 组件 | 数据集 | 字段 |
|---|---|---|
| 今日对话量 | 今日概览 | `totalMessages` |
| 正面情感占比 | 今日概览 | `positiveRatio` |
| 快捷问题点击数 | 今日概览 | `quickAskCount` |
| P90 响应时延 | 时延统计 | `p90Ms` |
| 近 5 分钟活跃会话 | 实时状态 | `activeSessions5min` |
| 情感趋势折线图 | 情感趋势 | `hour` / `positive` / `negative` / `neutral` |
| 热门问题条形图 | 热门问题 | `question` / `count` |

---

## API 端点速查

| 服务 | 端点 | 说明 |
|---|---|---|
| analytics | `POST http://127.0.0.1:5002/api/events` | 上报埋点事件 |
| analytics | `GET http://127.0.0.1:5002/api/summary` | 今日 KPI |
| analytics | `GET http://127.0.0.1:5002/api/sentiment-trend?hours=12` | 情感趋势 |
| analytics | `GET http://127.0.0.1:5002/api/popular-questions?limit=10` | 热门问题 |
| analytics | `GET http://127.0.0.1:5002/api/latency-stats` | 响应时延 |
| analytics | `GET http://127.0.0.1:5002/api/realtime` | 实时状态 |
| guide | `POST http://127.0.0.1:5002/api/guide/recommendations` | 路线推荐 |
| guide | `POST http://127.0.0.1:5002/api/guide/feedback` | 路线反馈 |

---

## 后续建议

- 如果继续打磨展示效果，优先统一首页推荐模块、地图页和景点页的交互动效
- 如果换机器复现，优先按 `SETUP.md` 拉起 Fay、Gorse、analytics-server、demo、DataEase
- 如果继续扩展运营分析，可以在 `analytics-server` 增加事件维度，再同步到 React `/admin` 和 DataEase
