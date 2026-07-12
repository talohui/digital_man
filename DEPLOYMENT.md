# 灵山胜境数字人项目服务器部署指南

> 面向负责上线部署的队员。本文只写生产/演示服务器部署要点；本地开发环境继续看 `SETUP.md`。

## 1. 部署架构

推荐把前端静态站点和后端服务分开部署：

| 模块 | 目录 | 端口 | 说明 |
|---|---|---:|---|
| C 端/B 端前端 | `demo/` | Nginx 80/443，或 Vite preview 5176 | React + Vite 构建产物 |
| Fay 数字人 | `数字人开源项目/Fay-main/` | 5000 / 10003 | HTTP + WebSocket，负责数字人对话和 TTS |
| 灵山 RAG MCP | `lingshan-rag/` | Fay 子进程 | 由 Fay 的 MCP 配置拉起，不单独暴露公网 |
| 行为分析服务 | `analytics-server/` | 5002 | Spring Boot，B 端数据和 C 端埋点 |
| Gorse / DataEase | `gorse-docker/`、`dataease-docker/` | 按各自 README | 可选增强服务 |

生产建议：

- 前端走 Nginx 静态托管。
- 后端只开放必要端口，公网优先只暴露 80/443。
- Fay、analytics-server、RAG 建议用 `systemd`、`pm2`、Docker Compose 或服务器进程管理工具守护。
- 不要把真实 API Key、`.env.local`、Fay 缓存、记忆数据和 Chroma 数据库提交到 Git。

## 2. 服务器前置环境

建议版本：

- Node.js 20 LTS
- npm 10+
- Java JDK 17
- Maven 3.8+
- Python 3.10-3.12
- ffmpeg
- Nginx
- Docker / Docker Compose（仅 Gorse、DataEase 需要）

Ubuntu 示例：

```bash
sudo apt update
sudo apt install -y git nginx openjdk-17-jdk maven python3 python3-venv python3-pip ffmpeg

# Node 建议用 nvm 安装 20 LTS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

## 3. 拉取代码

```bash
git clone https://github.com/talohui/digital_man.git
cd digital_man

# 如需部署某个功能分支，先切分支
git fetch origin
git checkout <branch-name>
```

## 4. 配置密钥与环境变量

### 4.1 前端 `demo/.env.production`

在服务器上新建 `demo/.env.production`，不要提交到 Git。

```bash
VITE_TMAP_WEB_KEY=你的腾讯地图WebKey
VITE_TMAP_ROUTE_KEY=你的腾讯地图路线规划Key

# 如果前端和后端同域名，可用反向代理路径；如果分端口部署，填完整地址。
VITE_FAY_HTTP=https://你的域名/api/fay
VITE_FAY_WS=wss://你的域名/ws/fay
VITE_ANALYTICS_HTTP=https://你的域名/api/analytics

# 可选
VITE_VOICE_ASR_MODE=auto
VITE_POSTHOG_KEY=你的PostHogKey
```

说明：

- 生产推荐用 HTTPS，否则手机浏览器的麦克风、WebSocket、部分音频策略可能受限。
- 若暂时用 IP + 端口演示，可填 `http://服务器IP:5000`、`ws://服务器IP:10003`、`http://服务器IP:5002`。

### 4.2 Fay / RAG 配置

重点文件：

```text
数字人开源项目/Fay-main/system.conf
数字人开源项目/Fay-main/config.json
数字人开源项目/Fay-main/faymcp/data/mcp_servers.json
```

部署时建议：

- `system.conf` / `config.json` 用服务器本地配置，不要在 Git 里放真实密钥。
- `mcp_servers.json` 里的 `lingshan-rag` 路径要改成服务器绝对路径。
- RAG 推荐使用环境变量提供百炼兼容 OpenAI 接口配置：

```bash
export LINGSHAN_LLM_API_KEY="你的百炼API Key"
export LINGSHAN_LLM_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export LINGSHAN_LLM_MODEL="qwen-turbo"
```

### 4.3 阿里云 TTS

如果服务器使用阿里云 TTS，建议通过环境变量或服务器本地 Fay 配置注入：

```bash
export ALI_TTS_ACCESS_KEY_ID="你的AccessKey ID"
export ALI_TTS_ACCESS_KEY_SECRET="你的AccessKey Secret"
```

不要把 AccessKey 写入可提交文件。若必须改 Fay 配置文件，请确认该文件没有被加入本次提交。

## 5. 构建与启动

### 5.1 前端构建

```bash
cd demo
npm ci --legacy-peer-deps
npm run build
```

构建产物在：

```text
demo/dist/
```

临时演示可用：

```bash
npx vite preview --host 0.0.0.0 --port 5176
```

生产建议交给 Nginx：

```nginx
server {
  listen 80;
  server_name 你的域名或服务器IP;

  root /opt/digital_man/demo/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/fay/ {
    proxy_pass http://127.0.0.1:5000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /ws/fay {
    proxy_pass http://127.0.0.1:10003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }

  location /api/analytics/ {
    proxy_pass http://127.0.0.1:5002/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### 5.2 启动 analytics-server

```bash
cd analytics-server
mvn clean package -DskipTests
java -jar target/analytics-server-0.0.1-SNAPSHOT.jar
```

健康检查：

```bash
curl http://127.0.0.1:5002/api/summary
```

### 5.3 启动 RAG 索引

首次部署或知识库资料变更后，重建索引：

```bash
cd lingshan-rag
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python scripts/03_chunk_text.py
python scripts/04_build_chroma.py
```

RAG MCP 通常由 Fay 自动拉起；如需单独烟测：

```bash
python mcp_server/server.py
```

### 5.4 启动 Fay 数字人

```bash
cd "数字人开源项目/Fay-main"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python main.py start
```

健康检查：

```bash
curl http://127.0.0.1:5000/v1/models
```

端口：

- HTTP：`5000`
- WebSocket：`10003`

## 6. systemd 守护示例

### 6.1 analytics-server

`/etc/systemd/system/lingshan-analytics.service`

```ini
[Unit]
Description=Lingshan Analytics Server
After=network.target

[Service]
WorkingDirectory=/opt/digital_man/analytics-server
ExecStart=/usr/bin/java -jar /opt/digital_man/analytics-server/target/analytics-server-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 6.2 Fay

`/etc/systemd/system/lingshan-fay.service`

```ini
[Unit]
Description=Lingshan Fay Digital Human
After=network.target

[Service]
WorkingDirectory=/opt/digital_man/数字人开源项目/Fay-main
Environment=LINGSHAN_LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
Environment=LINGSHAN_LLM_MODEL=qwen-turbo
EnvironmentFile=-/opt/digital_man/.env.server
ExecStart=/opt/digital_man/数字人开源项目/Fay-main/.venv/bin/python main.py start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lingshan-analytics
sudo systemctl enable --now lingshan-fay
sudo systemctl status lingshan-analytics
sudo systemctl status lingshan-fay
```

## 7. 上线检查清单

前端：

- `npm run build` 成功。
- `/` 能进入首页和开屏页。
- `/map` 手机尺寸能进入 3D 地图，移动端园林资产不会加载到一半白屏。
- `/admin`、`/admin/kb`、`/admin/heatmap` 能打开。

数字人：

- `curl http://127.0.0.1:5000/v1/models` 有返回。
- 浏览器控制台没有 WebSocket 连接失败。
- 第一次聊天不再长时间卡住；TTS 有声音。

RAG：

- Fay 启动日志中能看到灵山 RAG MCP autostart。
- 问“灵山大佛有多高”“梵宫有什么特色”等问题能命中灵山知识库。

B 端：

- `http://服务器/admin` 可访问。
- 实时数据卡片、知识库管理、热力图页面可打开。
- 如果腾讯地图 heatmap 提示 key 或 visualization 错误，优先检查 `VITE_TMAP_WEB_KEY` 和域名白名单。

安全：

- `git status` 不应包含 `.env.local`、`system.conf` 真实密钥改动、Fay `memory/`、Chroma DB、日志、缓存。
- GitHub 仓库不要公开暴露真实比赛/云服务密钥。

## 8. 常见问题

### 手机能打开前端但没有声音

- 确认使用 HTTPS 或同一局域网可信访问。
- 确认 `VITE_FAY_WS` 指向可访问的 WebSocket 地址。
- iOS/安卓浏览器可能需要用户点击后才允许自动播放音频。

### 问答显示“我现在太忙了”

- 先检查 Fay 是否在线：`curl http://127.0.0.1:5000/v1/models`。
- 检查 Fay 日志里 RAG MCP 是否启动失败。
- 检查百炼 API Key、base url、模型名是否正确。

### `/map` 真机白屏或崩溃

- 当前移动端已做园林 GLTF 资产抽稀，目标约 168 个实例。
- 如果仍崩，先用 Chrome DevTools 手机尺寸看开发诊断里的 `成功创建 GLTFModel` 数量。
- 不要在手机端打开 `debugGarden=1` 后再开启高密度林地 patch。

### 腾讯地图热力图不可用

- 检查 `VITE_TMAP_WEB_KEY` 是否配置。
- 检查腾讯地图控制台域名/IP 白名单。
- 检查 JS API 是否加载 `visualization` 库。

## 9. 推荐发布流程

```bash
git pull --ff-only
cd demo
npm ci --legacy-peer-deps
npm run build

cd ../analytics-server
mvn clean package -DskipTests

# 重启服务
sudo systemctl restart lingshan-analytics
sudo systemctl restart lingshan-fay
sudo nginx -t && sudo systemctl reload nginx
```

发布完成后，用电脑和真机各测一遍：

- `https://你的域名/`
- `https://你的域名/map`
- `https://你的域名/admin`
- `https://你的域名/admin/kb`
- `https://你的域名/admin/heatmap`
