# 环境搭建指南

> 队友 clone 后按此步骤操作，约 15 分钟完成。

## 前置条件

| 工具 | 版本 | 说明 |
|---|---|---|
| Python | 3.10+ | Fay + lingshan-rag 运行环境 |
| Node.js | 18+ | 前端 |
| Java | 17 | analytics-server |
| Maven | 3.8+ | Java 构建 |
| Docker Desktop | 最新版 | DataEase / APISIX / MySQL |
| Chrome/Edge | 最新版 | 运行 demo（Live2D + 语音识别） |

---

## 第一步：安装 Python 依赖

Fay 和 lingshan-rag 共用同一个 Python 环境（最简单，不用切 venv）：

```bash
# 在仓库根目录执行
pip install -r 数字人开源项目/Fay-main/requirements.txt
pip install -r lingshan-rag/requirements.txt
```

> ⚠️ 如果 `sentence-transformers` 安装慢，可以先跳过再看 lingshan-rag 是否正常启动。

---

## 第二步：配置 Fay API Key

Fay 需要两类 API Key，每位成员使用自己的账号：

```bash
cd 数字人开源项目/Fay-main

# 从模板创建配置文件（只需做一次）
cp system.conf.bak system.conf
```

用文本编辑器打开 `system.conf`，填写以下字段：

```ini
# ① 阿里百炼大模型（LLM）
#    登录 https://bailian.console.aliyun.com → API Key 管理
gpt_api_key=sk-xxxxxxxxxxxxxxxxxxxxxxxx
gpt_base_url=https://dashscope.aliyuncs.com/compatible-mode/v1
gpt_model_engine=qwen-max

# ② 阿里云 TTS（文字转语音）
#    登录 https://nls-portal.console.aliyun.com → 项目管理 → 获取 AccessKey
ali_tss_key_id=LTAI5tXxxxxxxxxxxxxxxxxx
ali_tss_key_secret=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ali_tss_app_key=xxxxxxxxxxxxxxxxx

# ③ ASR 二选一（语音识别，可以先用 funasr 本地方案，不需要 Key）
ASR_mode=funasr
```

> `system.conf` 已在 `.gitignore` 中，**不会被 git 追踪**，可以放心填真实 Key。

---

## 第三步：启动所有服务

**开 4 个终端窗口，分别执行：**

### 终端 1 — Fay（数字人引擎）

```bash
cd 数字人开源项目/Fay-main
python fay_booter.py
```

启动成功标志：终端出现 `* Running on http://127.0.0.1:5000`，访问该地址可以看到 Fay 控制台。

### 终端 2 — analytics-server（行为分析）

```bash
cd analytics-server
mvn spring-boot:run
```

启动成功标志：`Started AnalyticsApplication on port 5002`

### 终端 3 — 前端 demo

```bash
cd demo
npm install        # 首次或 package.json 变更后执行
npm run dev
```

启动成功标志：`Local: http://localhost:5173/`

### 终端 4（可选）— 验证 lingshan-rag MCP

```bash
cd lingshan-rag
python mcp_server/server.py
# 看到 "Lingshan RAG MCP server ready" 说明 OK
# Ctrl+C 退出，Fay 会自动管理这个进程
```

### 可选：启用 PostHog Cloud 埋点

在 `demo/.env.local` 中写入：

```bash
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

注意：

- 必须是 `VITE_POSTHOG_KEY=...` 的键值对格式
- `.env.local` 不进 Git
- 不配置时，前端仍会继续把事件发给 `analytics-server`

### 可选：启动 DataEase 本地 B 端大屏

```bash
cd dataease-docker
./start.sh
```

推荐入口：`http://localhost:9080`

说明：

- `dataease-docker/.env` 为本地配置文件，不进 Git
- 首次启动时若本地没有 `.env`，`start.sh` 会从 `.env.example` 自动生成
- `dataease-docker/data/` 是本地运行目录，不进 Git

---

## 第四步：验证

1. **Chrome 打开** `http://localhost:5173`，看到数字人画面加载
2. 点击“灵山大佛有多高？”— 应该收到 AI 回答并播放语音
3. 访问 `http://localhost:5173/admin` — 查看 React 运营大屏
4. 访问 `http://127.0.0.1:5002/api/summary` — 确认行为分析后端有数据
5. 如果启用了 PostHog，浏览器 DevTools `Network` 中应能看到 PostHog 上报请求
6. 如果启用了 DataEase，访问 `http://localhost:9080` — 确认 DataEase 登录页可打开

---

## 常见问题

**Q：Fay 启动后问问题没有回答**
- 检查 `system.conf` 的 `gpt_api_key` 是否填写正确
- 访问 `http://127.0.0.1:5000` Fay 控制台，看日志报错

**Q：没有语音播放**
- 检查 `ali_tss_key_id / key_secret / app_key` 是否正确
- 可以临时用 `tts_module=ms_tts`（微软 TTS 免费试用）替代

**Q：lingshan-rag 相关报错**
- 进入 Fay 控制台 → MCP 配置，确认"灵山RAG知识库"服务器已自动启动（绿色）
- 如果报 `ModuleNotFoundError`，重新执行 `pip install -r lingshan-rag/requirements.txt`

**Q：前端报 CORS 错误**
- 确认 analytics-server（5002）和 Fay（5001）都已正常启动

**Q：DataEase 打不开**
- 确认 Docker Desktop 已启动
- 在 `dataease-docker/` 下执行 `docker compose ps`
- 推荐通过 `http://localhost:9080` 访问，而不是直接用 `8100`

**Q：PostHog 没有上报**
- 检查 `demo/.env.local` 是否写成 `VITE_POSTHOG_KEY=...`
- 修改 `.env.local` 后需要重启 `npm run dev`

---

## 目录说明

```
软件杯/
├── demo/                   前端（React 18 + Live2D）
├── analytics-server/       行为分析后端（Spring Boot）
├── lingshan-rag/           RAG 知识库 + MCP Server（Python）
├── 数字人开源项目/Fay-main/ Fay 数字人框架（Python）
├── dataease-docker/        DataEase 本地 Docker 配置
├── SETUP.md                本文件
├── HANDOFF.md              当前交接状态
├── README.md               项目简介
└── 实现文档.md              完整技术文档
```
