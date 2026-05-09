# 灵山胜境 AI 导览 Demo

> 软件杯 A5 赛道 · 数字人 AI 导览系统

## 快速开始

先看 [SETUP.md](./SETUP.md)。
如果你只是接手当前这版的联调和值班，直接看 [地图导览_Gorse_v1_操作说明.md](./地图导览_Gorse_v1_操作说明.md) 会更快。

## 当前这一版包含什么

- 首页保留 Live2D + 聊天
- 新增标签选路、路线推荐卡、`/map` 地图导览、`/spot/:spotId` 景点讲解
- `analytics-server` 作为 Gorse 适配层
- Gorse v1 已接到真实路线推荐链路
- 景点页提问会自动带上路线 / 景点上下文再发给 Fay

## 当前服务端口

| 模块 | 技术 | 默认端口 |
|---|---|---|
| 前端 | React 18 + Vite + Ant Design 5 + Zustand + pixi.js | 5173 |
| 数字人引擎 | Fay（Python + 阿里百炼 Qwen + 阿里云 TTS） | 5000 / WS:10003 |
| 行为分析 | Spring Boot 3.3 + H2 | 5002 |
| 路线推荐 | Gorse + MySQL（Docker） | 8087 / 8088 |
| B 端大屏 | DataEase v2 + APISIX + MySQL（Docker） | 9080 / 8100 |

说明：

- `demo` 如果发现 `5173` 被占用，会自动切到下一个空闲端口，比如 `5174`
- 实际前端地址以 `npm run dev` 终端打印的 `Local:` 为准

## 项目结构

```text
软件杯/
├── demo/                        前端（React 18 + Vite + TypeScript）
├── analytics-server/            行为分析后端（Spring Boot 3.3 + H2）
├── gorse-docker/                Gorse 路线推荐集群（Docker）
├── lingshan-rag/                RAG 知识库 + MCP Server（Python）
├── 数字人开源项目/Fay-main/      Fay 数字人框架（Python）
├── dataease-docker/             DataEase v2 本地 Docker 配置
├── SETUP.md                     环境搭建指南
├── HANDOFF.md                   当前交接状态
├── 地图导览_Gorse_v1_操作说明.md  地图导览 + Gorse v1 操作文档
├── 实现文档.md                   完整技术实现文档
└── README.md
```

## 推荐阅读顺序

1. [SETUP.md](./SETUP.md)
2. [地图导览_Gorse_v1_操作说明.md](./地图导览_Gorse_v1_操作说明.md)
3. [HANDOFF.md](./HANDOFF.md)
4. [实现文档.md](./实现文档.md)
