# 灵山胜境数字人项目安装与启动指南

> 面向 Mac / Windows 队友。目标是把 C 端游客小程序式前端、Fay 数字人、灵山 RAG、analytics 行为分析后端、B 端数据大屏完整跑起来。

## 1. 项目结构

```text
digital_man/
├── demo/                         C 端游客前端 + B 端 React 大屏，React 18 + Vite
├── analytics-server/             行为分析与推荐后端，Spring Boot + H2，默认 5002
├── 数字人开源项目/Fay-main/       Fay 数字人引擎，HTTP 5000，WS 10003
├── lingshan-rag/                 灵山知识库 RAG MCP 服务，Fay 启动时自动拉起
├── gorse-docker/                 Gorse 可选推荐服务，目前不是主链路
├── SETUP.md                      本安装文档
└── HANDOFF.md                    前端 / B 端 / agent 交接文档
```

当前主线：

- C 端：手机端优先，小程序式 App Shell，导览 / 地图 / 小灵 / 我的。
- B 端：React 自建数据大屏，展示实时游客数据、灵山历史样本、聊天洞察、推荐效果、服务质量等。
- 推荐：默认使用 analytics-server 内置 `local-score-v1`，Gorse 只保留可选增强，不依赖它启动。
- 问答：Fay + 灵山 RAG 仍是独立主链路，不要让大屏或推荐改动影响问答准确率与速度。

## 2. 前置环境

### 2.1 通用要求

| 工具 | 建议版本 | 用途 |
|---|---:|---|
| Git | 2.40+ | 拉取代码 |
| Node.js | 18+，推荐 20 LTS | `demo` 前端 |
| npm | Node 自带即可 | 安装前端依赖 |
| Java JDK | 17 | `analytics-server` |
| Maven | 3.8+ | 构建 / 启动 Spring Boot |
| Python | 3.10-3.12 优先 | Fay 与 lingshan-rag |
| ffmpeg | 最新稳定版 | 云端音频转文字上传识别 |
| Docker Desktop | 可选 | 只在需要 Gorse / DataEase 时使用 |
| Edge / Chrome | 最新版 | 浏览器调试；Edge + localhost 可用浏览器 ASR |

### 2.2 macOS 安装建议

```bash
# Homebrew 示例
brew install node@20 openjdk@17 maven python@3.11 ffmpeg

# 如果 shell 找不到 java/mvn，按 brew 提示配置 JAVA_HOME
java -version
mvn -version
node -v
python3 --version
ffmpeg -version
```

macOS 常见坑：

- `5000` 端口被占用时，先关 `系统设置 -> 通用 -> 隔空投送与接力 -> AirPlay 接收器`。
- 如果使用 nvm，启动前端前先执行 `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`。

### 2.3 Windows 安装建议

推荐使用 PowerShell。

```powershell
# 可用 winget 安装
winget install OpenJS.NodeJS.LTS
winget install Microsoft.OpenJDK.17
winget install Apache.Maven
winget install Python.Python.3.11
winget install Gyan.FFmpeg

java -version
mvn -version
node -v
python --version
ffmpeg -version
```

Windows 常见坑：

- Windows Defender / 防火墙可能拦截手机访问 `5173/5000/5002/10003`，局域网联调时需要允许 Node、Java、Python 入站。
- JSON 路径建议用正斜杠，例如 `D:/code/digital_man/lingshan-rag`。

## 3. 拉代码

### macOS

```bash
git clone https://github.com/talohui/digital_man.git
cd digital_man
```

### Windows

```powershell
git clone https://github.com/talohui/digital_man.git
cd digital_man
```

本仓库是私密仓库，部分本地演示配置可能包含比赛联调 Key。不要把仓库改成公开仓库；如果新增个人 Key，优先放本地环境变量或 `.env.local`。

## 4. 关键配置

### 4.1 Fay / RAG 路径

Fay 通过 `数字人开源项目/Fay-main/faymcp/data/mcp_servers.json` 启动灵山 RAG MCP。换机器后重点检查 id 为“灵山RAG知识库”的配置。

macOS 示例：

```json
{
  "args": ["/Users/你的用户名/path/to/digital_man/lingshan-rag/mcp_server/server.py"],
  "cwd": "/Users/你的用户名/path/to/digital_man/lingshan-rag"
}
```

Windows 示例：

```json
{
  "args": ["D:/code/digital_man/lingshan-rag/mcp_server/server.py"],
  "cwd": "D:/code/digital_man/lingshan-rag"
}
```

如果这里路径不对，Fay 可能能启动，但灵山知识库不会参与回答，RAG 准确率会明显下降。

### 4.2 Fay 模型配置

配置文件在：

```text
数字人开源项目/Fay-main/system.conf
```

注意：

- 当前速度优化基于 `qwen-plus` 非思考模型。
- 不要随手换成 qwen3.5 思考模型，Fay 流式链路可能出现 60s 超时重试。
- 改 `system.conf` 后如果没生效，删除 Fay 缓存后重启：

macOS：

```bash
cd "数字人开源项目/Fay-main"
rm -f cache_data/system.conf cache_data/config.json
python main.py start
```

Windows：

```powershell
cd "数字人开源项目\Fay-main"
del cache_data\system.conf cache_data\config.json
python main.py start
```

### 4.3 前端环境变量

在 `demo/.env.local` 创建：

```bash
VITE_TMAP_WEB_KEY=你的腾讯地图WebKey
VITE_TMAP_ROUTE_KEY=你的腾讯地图路线规划Key

# 可选。留空时前端会按当前访问 hostname 自动推导。
# 例:你在手机上访问 http://10.0.0.5:5173/,前端自动按 10.0.0.5 找
# Fay 5000 / Analytics 5002 / WS 10003,无需手填,只要后端监听 0.0.0.0 即可。
# 仅当你想把后端跑在和前端不同的机器/端口上时,才需要显式设置下面三项。
VITE_FAY_HTTP=http://127.0.0.1:5000
VITE_FAY_WS=ws://127.0.0.1:10003
VITE_ANALYTICS_HTTP=http://127.0.0.1:5002

# 可选：auto | browser | cloud
VITE_VOICE_ASR_MODE=auto
```

局域网手机访问时，如果电脑 IP 是 `192.168.1.8`，可以这样启动前端：

macOS：

```bash
cd demo
VITE_FAY_HTTP=http://192.168.1.8:5000 \
VITE_FAY_WS=ws://192.168.1.8:10003 \
VITE_ANALYTICS_HTTP=http://192.168.1.8:5002 \
npm run dev:lan
```

Windows PowerShell：

```powershell
cd demo
$env:VITE_FAY_HTTP="http://192.168.1.8:5000"
$env:VITE_FAY_WS="ws://192.168.1.8:10003"
$env:VITE_ANALYTICS_HTTP="http://192.168.1.8:5002"
npm run dev:lan
```

## 5. 安装依赖

### 5.1 Python

macOS：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r "数字人开源项目/Fay-main/requirements.txt"
pip install -r lingshan-rag/requirements.txt
```

Windows：

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r "数字人开源项目\Fay-main\requirements.txt"
pip install -r lingshan-rag\requirements.txt
```

### 5.2 前端

```bash
cd demo
npm install --legacy-peer-deps
```

### 5.3 analytics-server

首次运行 Maven 会自动下载依赖：

```bash
cd analytics-server
mvn test
```

## 6. 启动服务

建议开 3 个终端。Gorse 现在不是必需服务，可以先不启动。

### 终端 1：启动 Fay

macOS：

```bash
cd "数字人开源项目/Fay-main"
python main.py start
```

Windows：

```powershell
cd "数字人开源项目\Fay-main"
python main.py start
```

正常端口：

- Fay HTTP: `http://127.0.0.1:5000`
- Fay WS: `ws://127.0.0.1:10003`
- 灵山 RAG MCP: Fay 自动拉起，通常在 `5010`

### 终端 2：启动 analytics-server

```bash
cd analytics-server
mvn spring-boot:run
```

正常端口：

- REST API: `http://127.0.0.1:5002`
- H2 Console: `http://127.0.0.1:5002/h2-console`

H2 配置：

```text
JDBC URL: jdbc:h2:file:./lingshan-analytics
User: sa
Password: 空
```

### 终端 3：启动前端

本机调试：

```bash
cd demo
npm run dev
```

手机局域网调试：

```bash
cd demo
npm run dev:lan
```

访问地址：

- C 端游客首页：`http://127.0.0.1:5173/`
- B 端数据大屏：`http://127.0.0.1:5173/admin`
- 数字人配置页：`http://127.0.0.1:5173/admin/avatar`
- 手机访问：`http://电脑局域网IP:5173/`

## 7. 可选：Gorse

当前推荐主链路是 `local-score-v1`，不依赖 Gorse。只有需要调研推荐增强时再启动：

```bash
cd gorse-docker
cp .env.example .env
docker compose up -d
```

地址：

- Gorse REST: `http://127.0.0.1:8087`
- Gorse Dashboard: `http://127.0.0.1:8088`

## 8. 启动后验证

### 8.1 analytics

```bash
curl http://127.0.0.1:5002/api/summary
curl "http://127.0.0.1:5002/api/dashboard/visitor-behavior?mode=history"
curl "http://127.0.0.1:5002/api/dashboard/visitor-behavior?mode=realtime"
```

历史样本接口应返回：

- `sourceLabel` 类似“灵山历史样本”
- `sampleCount` 为 `522`

### 8.2 推荐接口

```bash
curl -X POST http://127.0.0.1:5002/api/guide/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userId":"dev-user","selectedTags":["亲子游","拍照打卡"]}'
```

期望：

- 返回 3 条路线
- 每条路线有 `score/reason/reasons/debug`
- `engine` 为 `local-score-v1`

### 8.3 Fay / RAG

打开 C 端问：

```text
灵山大佛有多高？
```

期望：

- 回答包含 88 米或 79+9 米
- 前端是单气泡流式输出
- 没有 `<prestart>` / `<think>` 残留

### 8.4 C 端小程序链路

手机视口或真机访问：

1. 首页选择游览期待。
2. 进入购票页 `/ticket`，提交年龄段、性别、同行人数、游览日期。
3. 进入消费页 `/consume`，模拟餐饮、文创、交通、演艺消费。
4. 进入地图页 `/map`，切换路线 / 景点，进入“小灵”提问。
5. 回到 `/admin`，查看实时游客数据是否变化。

## 9. 常见问题

### 9.1 前端能打开，但手机上 Fay / analytics 请求失败

原因通常是前端仍请求手机自己的 `127.0.0.1`。使用电脑局域网 IP 启动：

```bash
VITE_FAY_HTTP=http://电脑IP:5000 \
VITE_FAY_WS=ws://电脑IP:10003 \
VITE_ANALYTICS_HTTP=http://电脑IP:5002 \
npm run dev:lan
```

同时确认防火墙允许 `5000/10003/5002/5173`。

### 9.2 B 端大屏没有新模块

确认 analytics-server 是新代码启动，并且 `5002` 没被旧进程占用：

macOS：

```bash
lsof -nP -iTCP:5002 -sTCP:LISTEN
```

Windows：

```powershell
netstat -ano | findstr :5002
```

如有旧进程，结束后重新 `mvn spring-boot:run`。

### 9.3 历史样本不是 522

历史样本来自：

```text
analytics-server/src/main/resources/visitor-behavior/lingshan-visitor-behavior-seed-v1.json
```

启动时如果数据库中没有 `history_lingshan_sample`，会自动导入一次。若需要重建本地 H2：

```bash
cd analytics-server
rm -f lingshan-analytics.mv.db lingshan-analytics.trace.db
mvn spring-boot:run
```

Windows 删除同名文件即可。

### 9.4 Fay 改代码后不生效

Fay、RAG MCP、缓存配置都可能常驻。完整重启：

```bash
pkill -f "python main.py start" || true
pkill -f "lingshan-rag/mcp_server" || true
cd "数字人开源项目/Fay-main"
rm -f cache_data/system.conf cache_data/config.json
python main.py start
```

Windows 用任务管理器结束 Python 进程，或：

```powershell
taskkill /F /IM python.exe
```

### 9.5 前端依赖安装报 peer dependency

使用：

```bash
npm install --legacy-peer-deps
```

### 9.6 改了前端代码后,浏览器还是旧版本

前端在生产构建时会注册 Service Worker(`demo/public/sw.js`),它会缓存所有 `vendor-*` chunk,
**第二次访问几乎不走网络**——这意味着你拉了新代码、`npm run build` 重新部署,但浏览器还在用上次的 SW。

刷新策略:

- 开发模式(`npm run dev` / `npm run dev:lan`)**不注册 SW**,改完 HMR 直接生效,无需处理。
- 生产模式遇到"看不到新版本":
  1. DevTools → Application → Service Workers → 点 **Unregister**
  2. Application → Storage → 点 **Clear site data**
  3. 强制刷新(Cmd+Shift+R / Ctrl+F5)

SW 的预期行为:HTML 走 network-first(永远拿最新壳),静态资源走 cache-first(content-hash 不变就一直命中,变了自动拉新)。所以正常情况下用户**不需要手动清缓存**,只是开发联调时要懂这个套路。

### 9.7 Live2D 数字人不显示 / 一直转圈

主要原因是 `index.html` 顶部从官方 CDN 加载 Cubism Core:

```html
<script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
```

国内某些网络环境(校园网、特定运营商)访问可能慢或失败。两个方案:

- **方案 A(推荐):自托管 Cubism Core**

  ```bash
  # 一次性把 Cubism Core 拉到本地
  curl -o demo/public/live2dcubismcore.min.js \
    https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js
  ```

  然后改 `demo/index.html` 中的 script src 为 `/live2dcubismcore.min.js`(相对路径)。

- **方案 B:开代理或换网络**。

Live2D 模型文件(`demo/public/live2d/haru/*`)已经在仓库里,**不需要单独下载**,只有 Cubism Core 引擎需要走 CDN。

## 10. 提交注意事项

不要把运行时缓存提交上去：

- `数字人开源项目/Fay-main/memory/**`
- `数字人开源项目/Fay-main/memory/chroma_db/**`
- `数字人开源项目/Fay-main/logs/**`
- `数字人开源项目/Fay-main/cache_data/**`
- `.claude/settings.local.json`
- `analytics-server/lingshan-analytics*.db`
- `demo/node_modules/**`

优先提交：

- `demo/src/**`
- `demo/public/**`
- `analytics-server/src/**`
- `analytics-server/scripts/**`
- `数字人开源项目/Fay-main/asr/**`
- `数字人开源项目/Fay-main/gui/flask_server.py`
- `数字人开源项目/Fay-main/llm/nlp_cognitive_stream.py`
- `SETUP.md`
- `HANDOFF.md`

