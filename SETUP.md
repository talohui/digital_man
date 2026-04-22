# 环境搭建指南

> 队友 clone 后按此步骤操作，约 15 分钟完成。

## 前置条件

| 工具 | 版本 | 说明 |
|---|---|---|
| Python | 3.10+ | Fay + lingshan-rag 运行环境 |
| Node.js | 18+ | 前端 |
| Java | 17 | analytics-server |
| Maven | 3.8+ | Java 构建 |
| Docker Desktop | 最新版 | Gorse + DataEase / APISIX / MySQL |
| Chrome/Edge | 最新版 | 运行 demo（Live2D + 语音识别） |

---

## 第一步：安装 Python 依赖

Fay 和 lingshan-rag 共用同一个 Python 环境：

```bash
pip install -r 数字人开源项目/Fay-main/requirements.txt
pip install -r lingshan-rag/requirements.txt
```

> 如果 `sentence-transformers` 安装慢，可以先跳过再看 lingshan-rag 是否正常启动。

---

## 第二步：配置 Fay API Key

```bash
cd 数字人开源项目/Fay-main
cp system.conf.bak system.conf
```

在 `system.conf` 中填写：

```ini
gpt_api_key=sk-xxxxxxxxxxxxxxxxxxxxxxxx
gpt_base_url=https://dashscope.aliyuncs.com/compatible-mode/v1
gpt_model_engine=qwen-max

ali_tss_key_id=LTAI5tXxxxxxxxxxxxxxxxxx
ali_tss_key_secret=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ali_tss_app_key=xxxxxxxxxxxxxxxxx

ASR_mode=funasr
```

> `system.conf` 不进 Git。

---

## 第三步：启动所有服务

建议按下面顺序启动。

### 终端 1 — Fay

```bash
cd 数字人开源项目/Fay-main
python fay_booter.py
```

### 终端 2 — Gorse

```bash
cd gorse-docker
cp .env.example .env
/usr/local/bin/docker-compose up -d
```

启动成功标志：

- `curl -s http://127.0.0.1:8087/api/health/live` 返回 `"Ready": true`
- 访问 `http://127.0.0.1:8088` 会跳到登录页

### 终端 3 — analytics-server

```bash
cd analytics-server
mvn spring-boot:run
```

### 终端 4 — 前端 demo

```bash
cd demo
npm install
npm run dev
```

### 终端 5（可选）— 验证 lingshan-rag MCP

```bash
cd lingshan-rag
python mcp_server/server.py
```

### 可选：启用 PostHog Cloud 埋点

在 `demo/.env.local` 写入：

```bash
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 可选：配置腾讯地图 Key

在 `demo/.env.local` 补齐：

```bash
VITE_TMAP_WEB_KEY=你的腾讯地图WebKey
VITE_TMAP_ROUTE_KEY=你的腾讯地图路线规划Key
```

### 可选：启动 DataEase 本地 B 端大屏

```bash
cd dataease-docker
./start.sh
```

推荐入口：`http://localhost:9080`

---

## 第四步：验证

1. 打开 `http://localhost:5173`，确认首页数字人正常加载。
2. 点击“灵山大佛有多高？”，确认能收到回答并播放语音。
3. 打开 `http://localhost:5173/admin`，确认 React 运营大屏正常。
4. 访问 `http://127.0.0.1:5002/api/summary`，确认 analytics-server 正常。
5. 访问 `http://127.0.0.1:8087/api/health/live`，确认 Gorse 已 ready。
6. 首页选择标签并点击“进入地图导览”，确认能进入 `/map`。
7. 点击地图页景点进入 `/spot/:spotId`，确认景点页还能继续和数字人对话。
8. 如果启用了 DataEase，访问 `http://localhost:9080`，确认登录页可打开。

---

## 常见问题

**Q：Fay 启动后问问题没有回答**
- 检查 `system.conf` 的 `gpt_api_key` 是否填写正确
- 访问 `http://127.0.0.1:5000` Fay 控制台查看日志

**Q：没有语音播放**
- 检查 `ali_tss_key_id / key_secret / app_key` 是否正确
- 可以临时用 `tts_module=ms_tts`

**Q：lingshan-rag 相关报错**
- 进入 Fay 控制台检查 MCP 服务
- 如果报 `ModuleNotFoundError`，重新执行 `pip install -r lingshan-rag/requirements.txt`

**Q：前端报 CORS 错误**
- 确认 analytics-server（5002）和 Fay（5001）都已启动

**Q：地图页提示缺少腾讯地图 Key**
- 在 `demo/.env.local` 中补齐 `VITE_TMAP_WEB_KEY` 和 `VITE_TMAP_ROUTE_KEY`

**Q：Gorse master 不断重启**
- 确认 `gorse-docker/docker-compose.yml` 没有给 `master` 配 `--cache-path`
- 再执行：

```bash
cd gorse-docker
/usr/local/bin/docker-compose down -v
/usr/local/bin/docker-compose up -d
```

**Q：Gorse health 还是 `Ready: false`**
- 如果 `master` 已正常但 `server` 没恢复，执行：

```bash
cd gorse-docker
/usr/local/bin/docker-compose restart server worker
```

**Q：DataEase 打不开**
- 确认 Docker Desktop 已启动
- 在 `dataease-docker/` 下执行 `docker compose ps`
- 推荐通过 `http://localhost:9080` 访问，而不是直接用 `8100`

**Q：PostHog 没有上报**
- 检查 `demo/.env.local` 是否写成 `VITE_POSTHOG_KEY=...`
- 修改后需要重启 `npm run dev`

---

## 目录说明

```text
软件杯/
├── demo/                   前端（React 18 + Live2D）
├── analytics-server/       行为分析后端（Spring Boot）
├── gorse-docker/           Gorse 路线推荐集群
├── lingshan-rag/           RAG 知识库 + MCP Server（Python）
├── 数字人开源项目/Fay-main/ Fay 数字人框架（Python）
├── dataease-docker/        DataEase 本地 Docker 配置
├── SETUP.md                本文件
├── HANDOFF.md              当前交接状态
├── 地图导览_Gorse_v1_操作说明.md  地图导览与 Gorse 操作文档
├── README.md               项目简介
└── 实现文档.md              完整技术文档
```
