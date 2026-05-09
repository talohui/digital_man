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

## 2. 必要配置

### 2.1 Fay 配置

在 `数字人开源项目/Fay-main/` 下准备本地 `system.conf`：

```bash
cd 数字人开源项目/Fay-main
cp system.conf.bak system.conf
```

至少要填写：

```ini
gpt_api_key=你的百炼Key
gpt_base_url=https://dashscope.aliyuncs.com/compatible-mode/v1
gpt_model_engine=qwen-turbo

ali_tss_key_id=你的阿里云TTS KeyId
ali_tss_key_secret=你的阿里云TTS KeySecret
ali_tss_app_key=你的阿里云TTS AppKey

ASR_mode=funasr
embedding_api_model=text-embedding-v3
```

注意：

- `system.conf` 不进 Git
- 不要依赖“社区公共配置”，否则可能退回到别人的 SiliconFlow 账号
- 正常启动后，Fay 日志里应该看到：
  - `model=qwen-turbo`
  - `base_url=https://dashscope.aliyuncs.com/compatible-mode/v1`

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
  - `model=qwen-turbo`
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

### 终端 5：可选启动 lingshan-rag

```bash
cd lingshan-rag
python mcp_server/server.py
```

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

## 6. 常见问题

**Q：Fay 启动了，但前端仍提示 WebSocket 连接失败**

- 确认 Fay HTTP 是 `5000`，不是 `5001`
- 确认 `ws://127.0.0.1:10003` 已监听
- 先看 Fay 终端有没有 `服务启动完成!`

**Q：Fay 回复“抱歉，我的大脑暂时开了小差，请稍后再试一下。”**

- 先看 `system.conf` 是否真的生效
- 正常情况下日志会显示百炼地址，而不是 SiliconFlow
- 如果日志里不是百炼，说明 Fay 没读到本地 `system.conf`

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
