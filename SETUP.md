# 环境搭建指南

> 队友 clone 后按此步骤操作，约 15 分钟完成。

## 前置条件

| 工具 | 版本 | 说明 |
|---|---|---|
| Python | 3.10+ | Fay + lingshan-rag 运行环境 |
| Node.js | 18+ | 前端 |
| Java | 17 | analytics-server |
| Maven | 3.8+ | Java 构建 |
| Docker Desktop | 最新版 | Gorse + DataEase |
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

**开 5 个终端窗口，分别执行：**

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

### 终端 3 — Gorse（路线推荐）

```bash
cd gorse-docker

# 首次执行一次
cp .env.example .env

# 建议直接用独立版 compose
/usr/local/bin/docker-compose up -d
```

启动成功标志：

- `curl -s http://127.0.0.1:8087/api/health/live` 返回 `"Ready": true`
- 访问 `http://127.0.0.1:8088` 会跳到登录页

### 终端 4 — 前端 demo

```bash
cd demo
npm install        # 首次或 package.json 变更后执行
npm run dev
```

启动成功标志：`Local: http://localhost:5173/`

### 终端 5（可选）— 验证 lingshan-rag MCP

```bash
cd lingshan-rag
python mcp_server/server.py
# 看到 "Lingshan RAG MCP server ready" 说明 OK
# Ctrl+C 退出，Fay 会自动管理这个进程
```

---

## 第四步：验证

1. **Chrome 打开** `http://localhost:5173`，看到数字人画面加载
2. 点击"灵山大佛有多高？"— 应该收到 AI 回答并播放语音
3. 访问 `http://localhost:5173/admin` — 查看数据大屏
4. 访问 `http://127.0.0.1:5002/api/summary` — 确认后端有数据
5. 访问 `http://127.0.0.1:8087/api/health/live` — 确认 Gorse 已 ready
6. 打开首页后选择标签并点击“进入地图导览”，确认能进入 `/map`
7. 点击地图页景点进入 `/spot/:spotId`，确认景点页还能继续和数字人对话

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

**Q：地图页提示缺少腾讯地图 Key**
- 在 `demo/.env.local` 中补齐：
```bash
VITE_TMAP_WEB_KEY=你的腾讯地图WebKey
VITE_TMAP_ROUTE_KEY=你的腾讯地图路线规划Key
```

**Q：Gorse master 不断重启**
- 先确认当前仓库里的 `gorse-docker/docker-compose.yml` 没有给 `master` 配 `--cache-path`
- 再执行：
```bash
cd gorse-docker
/usr/local/bin/docker-compose down -v
/usr/local/bin/docker-compose up -d
```

**Q：Gorse health 还是 `Ready: false`**
- 如果 `master` 已经正常，但 `server` 还没恢复，执行：
```bash
cd gorse-docker
/usr/local/bin/docker-compose restart server worker
```

---

## 目录说明

```
软件杯/
├── demo/                   前端（React 18 + Live2D）
├── analytics-server/       行为分析后端（Spring Boot）
├── gorse-docker/           Gorse 路线推荐集群
├── lingshan-rag/           RAG 知识库 + MCP Server（Python）
├── 数字人开源项目/Fay-main/ Fay 数字人框架（Python）
├── SETUP.md                本文件
├── 地图导览_Gorse_v1_操作说明.md  地图导览与 Gorse 操作文档
├── README.md               项目简介
└── 实现文档.md              完整技术文档
```
