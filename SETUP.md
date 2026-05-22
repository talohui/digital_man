# 环境搭建指南

> 目标：让队友在一台新机器上，尽量少猜配置就能把 `Fay + Gorse + analytics-server + demo` 跑起来。

## 1. 前置条件

| 工具 | 建议版本 | 用途 |
|---|---|---|
| Python | 3.10+，已实测 3.14 | Fay + lingshan-rag |
| Node.js | 18+ | demo 前端 |
| Java | 17 | analytics-server |
| Maven | 3.8+ | analytics-server 构建 |
| Docker Desktop | 最新版 | Gorse + DataEase |
| Chrome / Edge | 最新版 | 前端联调 |

说明：

- Python 3.13+ 已兼容 `audioop` 缺失问题，`requirements.txt` 已补 `audioop-lts`
- macOS 如果 `5000` 端口被系统占用，先关闭 `AirPlay Receiver`

---

## 1.4 macOS 复现专章（Mac 队友看这里）

本仓库就是在 macOS 上开发的，仓库里存的配置（RAG 绝对路径等）默认就是 Mac 路径，**大多数情况开箱即用**。下面是 Mac 上的关键点。

### A. 拉代码

```bash
git clone <仓库地址> 软件杯
cd 软件杯
```

> 若你的本地路径和原作者不同（原作者是 `/Users/MR/Desktop/软件杯`），见 B 步要改一处 RAG 路径。

### B. RAG 绝对路径（路径不同才需改）

打开 `数字人开源项目/Fay-main/faymcp/data/mcp_servers.json`，找到 **id 7「灵山RAG知识库」**，确认 `args` 和 `cwd` 是你本机的真实路径：

```json
"args": ["/Users/你的用户名/.../软件杯/lingshan-rag/mcp_server/server.py"],
"cwd": "/Users/你的用户名/.../软件杯/lingshan-rag",
```

> 如果你 clone 到的路径恰好就是 `/Users/MR/Desktop/软件杯`，这步可跳过。
> 不改对的话，数字人能聊天但**回答会脱离灵山知识库**（RAG 子进程起不来）。

### C. 安装依赖

```bash
# Python（建议虚拟环境）
python3 -m venv .venv
source .venv/bin/activate
pip install -r 数字人开源项目/Fay-main/requirements.txt
pip install -r lingshan-rag/requirements.txt

# 前端
cd demo && npm install --legacy-peer-deps && cd ..
```

### D. 配置文件

- `system.conf`：仓库已带可用版本（私密仓库，含 Key），无需手填。需重置时 `cp system.conf.bak system.conf`。
- `demo/.env.local`：腾讯地图等前端 Key 仍需各自填写（见 §2.2）。
- Gorse：`cd gorse-docker && cp .env.example .env`。

### E. 启动命令（Mac 原生）

| 用途 | 命令 |
|---|---|
| 启动 Fay | `cd 数字人开源项目/Fay-main && python main.py start` |
| 启动 Gorse | `cd gorse-docker && /usr/local/bin/docker-compose up -d` |
| 启动 analytics | `cd analytics-server && mvn spring-boot:run` |
| 启动 demo | `cd demo && npm run dev -- --host 127.0.0.1` |
| 清 Fay 缓存配置 | `rm -f cache_data/system.conf cache_data/config.json` |

### F. Mac 专属坑

- **`5000` 端口被占用**：多半是系统的 AirPlay 接收器。关闭：`系统设置 → 通用 → 隔空投送与接力 → AirPlay 接收器`，再启动 Fay。
- **改配置不生效**：Fay 首启会把 `system.conf` 复制进 `cache_data/`。改了模型/Key 后先 `rm -f cache_data/system.conf cache_data/config.json` 再重启。
- **改了 `rag_utils.py` 或 `mcp_servers.json`**：要**整体重启 Fay**（结束 python 进程再起），软重启不会重载 RAG 子进程。

---

## 1.5 Windows 复现专章（Windows 队友看这里）

本仓库主要在 macOS 上开发，下面把 **Windows 上必须改的点**集中列出。其余步骤与后文一致，只是命令换成 Windows 写法。

### A. 拉代码

```powershell
git clone <仓库地址> digital_man
cd digital_man
```

记住你的仓库绝对路径，例如 `D:\code\digital_man`，后面要用。

### B. 必改：灵山 RAG 的绝对路径（最容易漏）

打开 `数字人开源项目\Fay-main\faymcp\data\mcp_servers.json`，找到 **id 7「灵山RAG知识库」**，把里面两处 macOS 路径改成你的 Windows 路径：

```json
"args": ["D:/code/digital_man/lingshan-rag/mcp_server/server.py"],
"cwd": "D:/code/digital_man/lingshan-rag",
```

> JSON 里用正斜杠 `/` 最稳（`D:/code/...`）。用反斜杠要写成双反斜杠 `D:\\code\\...`。
> 不改这里，数字人能聊天但**回答会脱离灵山知识库**（RAG 子进程起不来）。

### C. 安装依赖

```powershell
# Python（建议用虚拟环境）
python -m venv .venv
.venv\Scripts\activate
pip install -r 数字人开源项目\Fay-main\requirements.txt
pip install -r lingshan-rag\requirements.txt

# 前端
cd demo
npm install --legacy-peer-deps
cd ..
```

### D. 配置文件

- `system.conf`：仓库已带可用版本（私密仓库，含 Key），无需手填。若需重置，`copy system.conf.bak system.conf`。
- `demo\.env.local`：腾讯地图等前端 Key 仍需各自填写（见 §2.2）。
- Gorse：`cd gorse-docker && copy .env.example .env`。

### E. 命令对照（mac → Windows）

| 用途 | macOS（后文） | Windows |
|---|---|---|
| 启动 Fay | `python main.py start` | `python main.py start` |
| 启动 Gorse | `/usr/local/bin/docker-compose up -d` | `docker compose up -d`（Docker Desktop 自带 compose v2） |
| 启动 analytics | `mvn spring-boot:run` | `mvn spring-boot:run` |
| 启动 demo | `npm run dev -- --host 127.0.0.1` | `npm run dev -- --host 127.0.0.1` |
| 清 Fay 缓存配置 | `rm -f cache_data/system.conf` | `del cache_data\system.conf cache_data\config.json` |

### F. 端口提示

- Windows 上 `5000` 一般不会被系统占用（没有 AirPlay），无需特殊处理。
- 若被别的程序占用，用 `netstat -ano | findstr :5000` 查 PID，再 `taskkill /PID <pid> /F`。

### G. 改配置后让 Fay 真正生效

Fay 首启会把 `system.conf` 复制进 `cache_data\`。**改了模型/Key 不生效**时：

```powershell
del cache_data\system.conf cache_data\config.json
python main.py start
```

改了 `lingshan-rag\scripts\rag_utils.py` 或 `mcp_servers.json` 后，要**整体重启 Fay**（结束 python 进程再起），软重启不会重载 RAG 子进程。

## 2. 必要配置

### 2.1 Fay 配置

在 `数字人开源项目/Fay-main/` 下准备本地 `system.conf`：

```bash
cd 数字人开源项目/Fay-main
cp system.conf.bak system.conf
```

本仓库已直接提交一份可用的 `system.conf`（私密仓库，含真实 Key），结构如下：

```ini
[key]
# === LLM 主干：阿里百炼 Qwen ===
chat_module = openai_api
gpt_model_engine = qwen-plus
gpt_base_url = https://dashscope.aliyuncs.com/compatible-mode/v1
gpt_api_key = sk-xxxx

# === 大模型（深度任务，同款）===
big_model_engine = qwen-plus
big_model_base_url = https://dashscope.aliyuncs.com/compatible-mode/v1
big_model_api_key = sk-xxxx

# === Embeddings：百炼向量服务 ===
embedding_api_model = text-embedding-v3
embedding_api_base_url = https://dashscope.aliyuncs.com/compatible-mode/v1
embedding_api_key = sk-xxxx

# === TTS（Edge TTS，免 Key）===
tts_module = edge-tts
```

注意（**踩坑点，务必看**）：

- 模型固定用 **`qwen-plus`**（非思考模型，流式正常，约 10–25s/轮）。
- ⚠️ **不要换 qwen3.5 系列（122b / flash / 27b）**：它们都是思考模型，在 Fay 的流式链路里会**每轮挂起约 60s 触发超时重试**，整条链路不可用。
- `gpt_model_engine` 与 `big_model_engine` 两处都要是 `qwen-plus`。
- 改完 `system.conf` 后，Fay 会在首次启动时把它复制进 `cache_data/`。**改了配置但没生效时**，删掉 `cache_data/system.conf` 和 `cache_data/config.json` 再重启。
- 正常启动后日志里应看到 `model=qwen-plus` 和百炼 base_url，而不是 SiliconFlow。

### 2.2 demo 环境变量

在 `demo/.env.local` 写入：

```bash
VITE_POSTHOG_KEY=你的 PostHog Key
VITE_TMAP_WEB_KEY=你的腾讯地图 Web Key
VITE_TMAP_ROUTE_KEY=你的腾讯地图路线规划 Key
```

说明：

- 地图页依赖腾讯地图 key
- 没配地图 key 时，首页推荐和后端接口仍可联调，但 `/map` 无法正常出图

### 2.3 Gorse 环境变量

```bash
cd gorse-docker
cp .env.example .env
```

默认本地开发直接用 `.env.example` 的值即可。

## 3. 一次性安装依赖

### 3.1 Python

```bash
pip install -r 数字人开源项目/Fay-main/requirements.txt
pip install -r lingshan-rag/requirements.txt
```

### 3.2 Node

```bash
cd demo
npm install --legacy-peer-deps
```

说明：

- 这版 `demo` 本地安装用 `--legacy-peer-deps` 更稳

## 4. 启动顺序

严格按下面顺序启动。

### 终端 1：启动 Fay

```bash
cd 数字人开源项目/Fay-main
python main.py start
```

正常标志：

- 控制台出现 `请通过浏览器访问 http://127.0.0.1:5000/ 管理您的Fay`
- 后续出现 `服务启动完成!`
- 终端能看到：
  - `model=qwen-plus`
  - `base_url=https://dashscope.aliyuncs.com/compatible-mode/v1`

### 终端 2：启动 Gorse

```bash
cd gorse-docker
/usr/local/bin/docker-compose up -d
```

正常标志：

```bash
curl -s http://127.0.0.1:8087/api/health/live
```

返回里应包含：

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

### 终端 3：启动 analytics-server

```bash
cd analytics-server
mvn spring-boot:run
```

正常标志：

```bash
curl -s http://127.0.0.1:5002/api/summary
```

能返回 JSON 即可。

### 终端 4：启动 demo

```bash
cd demo
npm run dev -- --host 127.0.0.1
```

说明：

- 默认端口是 `5173`
- 如果 `5173` 被占用，Vite 会自动切到 `5174` 或更高端口
- 最终以前端终端打印的 `Local:` 地址为准

### 终端 5：灵山 RAG 知识库（数字人问答的事实来源）

灵山 RAG 以 **MCP 子进程**方式由 Fay 自动拉起，不需要手动开终端。配置在
`数字人开源项目/Fay-main/faymcp/data/mcp_servers.json` 的 **id 7「灵山RAG知识库」**：

```json
{
  "id": 7,
  "name": "灵山RAG知识库",
  "command": "python",
  "args": ["<仓库绝对路径>/lingshan-rag/mcp_server/server.py"],
  "cwd": "<仓库绝对路径>/lingshan-rag",
  "env": {
    "LINGSHAN_LLM_API_KEY": "sk-xxxx",
    "LINGSHAN_LLM_BASE_URL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "LINGSHAN_LLM_MODEL": "qwen-plus"
  },
  "autostart": true
}
```

⚠️ **换机器/换系统必改**：`args` 和 `cwd` 里是**绝对路径**，仓库里存的是原作者的 macOS 路径
`/Users/MR/Desktop/软件杯/lingshan-rag`。**Windows 队友必须改成自己的路径**，例如
`D:/code/digital_man/lingshan-rag`（详见下方 Windows 专章）。

- 知识库向量库（ChromaDB）已**预构建并提交**（`lingshan-rag/chroma_db/`，集合 `lingshan_guide_v2`），clone 后开箱即用，无需重新跑 embedding。
- 想独立调试 RAG，可单独运行：

```bash
cd lingshan-rag
python mcp_server/server.py
```

- 改了 `lingshan-rag/scripts/rag_utils.py` 后，**必须整体重启 Fay**（软重启不会重载 MCP 子进程）。
- RAG MCP 默认监听在 `5010`（Fay 启动后自动起）。

## 5. 联调验证流程

按这个顺序验证最省时间：

1. 打开前端 `Local:` 地址
2. 首页点击一个快捷问题，确认 Fay 能正常回复
3. 访问 `http://127.0.0.1:5002/api/summary`，确认 analytics-server 正常
4. 访问 `http://127.0.0.1:8087/api/health/live`，确认 Gorse ready
5. 首页选择标签，确认推荐卡能刷新
6. 点击“进入地图导览”，确认能进入 `/map`
7. 在地图页点击景点，确认能进入 `/spot/:spotId`
8. 在景点页继续提问，确认回答围绕当前景点展开

## 5.5 响应速度与性能说明

已对"提问→数字人开口"的链路做过优化，实测每轮总耗时从约 20–26s 降到：

- 简单事实问题（如"灵山大佛多高"）：约 **0.7–2s**
- 复杂多段问题（如"梵宫主要看什么"）：约 **6–8s**（RAG 内部还要调一次 LLM 合成）

做了三处优化（已在代码里）：

1. **记忆检索 embedding 改持久连接**（`utils/api_embedding_service.py`）：用 `requests.Session` + keep-alive，超时降到 (connect 5s, read 15s)。消除了访问百炼时偶发的 SSL EOF 重试（之前每次新建 TLS 连接，单次重试要白等 ~15s）。
2. **注入提示词的记忆条数 10→4**（`llm/nlp_cognitive_stream.py`）：缩小 planner 提示词，加快首字与生成。
3. **灵山 RAG 开启 HuggingFace 离线模式**（`lingshan-rag/mcp_server/server.py` 顶部 `HF_HUB_OFFLINE=1`）：本地 bge 嵌入模型已缓存，跳过启动后首次查询时去 HF Hub 的联网检查——消除了**首条查询约 24–28s 的冷启动尖峰**。

> 调试用：设环境变量 `LINGSHAN_LAT_DEBUG=1` 再启动 Fay，每轮各段耗时会写入 `/tmp/lat_timing.log`（记忆检索 / RAG检索 / 首字延迟 / 总耗时）。默认关闭，不影响生产。

## 6. 常见问题

**Q：Fay 启动了，但前端仍提示 WebSocket 连接失败**

- 确认 Fay HTTP 是 `5000`，不是 `5001`
- 确认 `ws://127.0.0.1:10003` 已监听
- 先看 Fay 终端有没有 `服务启动完成!`

**Q：Fay 回复“抱歉，我的大脑暂时开了小差，请稍后再试一下。”**

- 先看 `system.conf` 是否真的生效
- 正常情况下日志会显示百炼地址，而不是 SiliconFlow
- 如果日志里不是百炼，说明 Fay 没读到本地 `system.conf`

**Q：数字人能聊天，但回答跟灵山知识库对不上 / 在编**

- 多半是灵山 RAG MCP 子进程没起来：检查 `mcp_servers.json` id 7 的绝对路径是否改成了你本机的路径（Windows 必改，见 §1.5-B）
- 确认 `5010` 端口有监听
- 改过 `rag_utils.py` 或 `mcp_servers.json` 后要**整体重启 Fay**
- 如果数字人“复读”了一条旧的错误回答，可能是记忆系统回放：`POST http://127.0.0.1:5000/api/clear-memory` 后重启 Fay

**Q：换了 qwen3.5 模型后，数字人每次回答都卡很久然后报错**

- qwen3.5 系列（122b/flash/27b）是思考模型，在 Fay 流式链路里每轮会挂起约 60s 超时重试
- 改回 `qwen-plus`（`system.conf` 的 `gpt_model_engine` 和 `big_model_engine` 两处），删 `cache_data` 重启

**Q：macOS 上 `5000` 端口被占用**

- 关闭 `系统设置 -> 通用 -> 隔空投送与接力 -> AirPlay 接收器`
- 然后重新执行 `python main.py start`

**Q：前端打不开 `5173`**

- 看 `npm run dev` 终端里打印的 `Local:` 地址
- 如果 `5173` 被占用，通常会自动切到 `5174`

**Q：Gorse health 不是 `Ready: true`**

- 先执行：

```bash
cd gorse-docker
/usr/local/bin/docker-compose ps
```

- 如果 `master` 正常但 `server` 不 ready，再执行：

```bash
/usr/local/bin/docker-compose restart server worker
```

**Q：analytics-server 启动失败**

- 先确认是不是已经有一个旧实例在跑
- 如果是 H2 文件库冲突，通常是重复启动了第二个实例

## 7. 关键地址速查

| 服务 | 地址 | 说明 |
|---|---|---|
| Fay 控制台 | `http://127.0.0.1:5000` | 主 HTTP 服务 |
| Fay WS | `ws://127.0.0.1:10003` | 数字人推流 |
| 灵山 RAG MCP | `http://127.0.0.1:5010` | 由 Fay 自动拉起的知识库子进程 |
| analytics-server | `http://127.0.0.1:5002` | 行为分析与导览推荐 |
| Gorse REST | `http://127.0.0.1:8087` | 推荐引擎 REST |
| Gorse Dashboard | `http://127.0.0.1:8088` | Dashboard |
| demo | `http://127.0.0.1:5173` | 默认前端地址 |
| demo 备选 | `http://127.0.0.1:5174` | `5173` 被占用时常见端口 |

## 8. 最短结论

队友只要记住这四件事，基本就能跑起来：

1. Fay 用 `python main.py start`，不是 `python fay_booter.py`
2. Fay 主 HTTP 端口是 `5000`
3. Gorse 用 `/usr/local/bin/docker-compose up -d`
4. demo 最终地址以 Vite 终端输出为准，不一定永远是 `5173`
