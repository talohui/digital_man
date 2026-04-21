# 工作交接文档

> 当前负责人：german-spalo  
> 仓库：https://github.com/talohui/digital_man  
> 更新时间：2026-04-22

---

## 项目目录结构

```text
/Users/MR/Desktop/软件杯/
├── demo/                               前端 React 18 + Vite（5173）
├── analytics-server/                   Spring Boot 行为分析后端（5002）
├── lingshan-rag/                       Python RAG 知识库 + MCP Server
├── 数字人开源项目/Fay-main/             Fay 数字人引擎（HTTP:5001，WS:10003）
├── dataease-docker/                    DataEase v2 本地 Docker 配置（APISIX:9080，DataEase:8100）
├── SETUP.md                            环境搭建指南
├── HANDOFF.md                          本文件
├── README.md                           项目简介
└── 实现文档.md                          完整技术实现文档
```

---

## 当前状态

### 已完成

- **前端数字人闭环**：Live2D 渲染、TTS 音频播放、嘴型同步、浏览器 ASR 语音识别
- **Fay 通信修复**：WS 注册帧 `{"Username":"User"}`、HTTP `x-www-form-urlencoded` 发送格式
- **analytics-server**：Spring Boot + H2，6 个 REST 端点可用
- **前端埋点**：双通道上报已打通
  - `analytics-server` 本地链路可用
  - `PostHog Cloud` 已启用（前提：`demo/.env.local` 使用 `VITE_POSTHOG_KEY=...` 正确格式）
- **React `/admin` 大屏**：5 张 KPI 卡片 + 情感趋势折线图 + 热门问题条形图
- **DataEase Docker 配置**：已整理进仓库，可通过 `dataease-docker/start.sh` 本地启动
- **DataEase 登录与大屏**：浏览器登录已恢复，API 数据源 / 数据集 / 数据大屏已在当前本地实例中完成配置

### 当前没有的阻塞

- 不再存在“DataEase 登录是主阻塞点”的问题
- 不需要继续重建 DataEase 数据目录
- APISIX key 配置问题已经修复

### 仍需注意

- `dataease-docker/data/` 是本地运行数据，**不进 Git**
- 当前 DataEase 里的 API 数据源、数据集和大屏配置保存在本地运行目录里
- 如果换新机器重新拉起 `dataease-docker`，需要按本文档里的流程重新在 UI 中创建一次数据源、数据集和大屏

---

## 各服务启动命令

```bash
# 1. Fay 数字人引擎
cd /Users/MR/Desktop/软件杯/数字人开源项目/Fay-main
python fay_booter.py

# 2. analytics-server（行为分析后端）
cd /Users/MR/Desktop/软件杯/analytics-server
mvn spring-boot:run

# 3. 前端 demo
cd /Users/MR/Desktop/软件杯/demo
npm run dev
# 前端：http://localhost:5173
# React 管理大屏：http://localhost:5173/admin

# 4. DataEase（Docker，本地 B 端大屏）
cd /Users/MR/Desktop/软件杯/dataease-docker
./start.sh
# 推荐入口：http://localhost:9080
```

---

## 当前推荐访问地址

| 服务 | 地址 | 说明 |
|---|---|---|
| Fay | `http://127.0.0.1:5001` | 数字人 HTTP 接口 |
| Fay WS | `ws://127.0.0.1:10003` | 数字人消息 / 音频推送 |
| analytics-server | `http://127.0.0.1:5002` | 行为分析 REST API |
| 前端主页 | `http://localhost:5173` | 用户交互页面 |
| React `/admin` | `http://localhost:5173/admin` | 自建运营大屏 |
| DataEase | `http://localhost:9080` | 推荐入口，经 APISIX 转发 |
| DataEase 直连 | `http://localhost:8100` | DataEase 容器直连入口 |

---

## DataEase 当前约定

### 仓库内已版本化

- `dataease-docker/docker-compose.yml`
- `dataease-docker/conf/*`
- `dataease-docker/.env.example`
- `dataease-docker/start.sh`

### 本地运行目录（不进 Git）

- `dataease-docker/data/`
- `dataease-docker/.env`

### 当前 UI 配置方式

DataEase v2 当前这套配置不是“直接新建 API 数据集”，而是：

1. **数据源** → 新建 `API` 数据源
2. 在 API 数据源里创建 5 张 API 表
3. **数据集** → 每张表单独建一个单表数据集
4. **数据大屏** → 用这 5 个数据集拼装组件

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

## 前端埋点与 PostHog

### 当前行为

- 前端事件通过 `demo/src/lib/analytics.ts` 双写：
  - `posthog.capture(...)`
  - `POST http://127.0.0.1:5002/api/events`

### 本地启用方式

在 `demo/.env.local` 中写：

```bash
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

注意：

- 必须是 `VITE_POSTHOG_KEY=...` 这种键值对格式
- 只写裸 key 文本，Vite 不会识别
- `demo/.env.local` 不进 Git

### 验收方式

1. 前端页面发 2~3 条消息
2. 点 1~2 次快捷问题
3. 浏览器 DevTools `Network` 能看到 PostHog 上报
4. DataEase / React 大屏中的 `今日对话量`、`快捷问题点击数`、`近 5 分钟活跃会话` 随后发生变化

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

---

## 后续建议

- 如果继续打磨展示效果，优先统一 DataEase 大屏标题、字段文案和配色
- 如果换机器复现，优先按 `SETUP.md` 拉起四个服务，再根据本文件重建 DataEase 数据源和大屏
- 如果要继续扩展运营分析，可以在 `analytics-server` 新增事件维度，再同步到 React `/admin` 和 DataEase
