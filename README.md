# 灵山胜境 AI 导览 Demo

> 软件杯 A5 赛道 · 数字人 AI 导览系统

## 🚀 快速开始

**clone 后请先阅读 [SETUP.md](./SETUP.md)**，约 15 分钟完成环境配置。

---

## 项目结构

```
软件杯/
├── demo/                        前端（React 18 + Vite + TypeScript）
├── analytics-server/            行为分析后端（Spring Boot 3.3 + H2）
├── lingshan-rag/                RAG 知识库 + MCP Server（Python）
├── 数字人开源项目/Fay-main/      Fay 数字人框架（Python）
├── SETUP.md                     环境搭建指南（⬅ 先看这个）
├── 实现文档.md                   完整技术实现文档
└── README.md
```

## 技术栈

| 模块 | 技术 | 端口 |
|---|---|---|
| 前端 | React 18 + Vite + Ant Design 5 + Zustand + pixi.js | 5173 |
| 数字人引擎 | Fay（Python + 阿里百炼 Qwen + 阿里云 TTS） | 5001 / WS:10003 |
| 知识库 | ChromaDB + sentence-transformers + MCP | stdio |
| 行为分析 | Spring Boot 3.3 + H2 + 情感分析 Strategy 模式 | 5002 |

## 主要功能

- 🤖 Live2D 数字人（pixi-live2d-display，闲置呼吸 / 说话嘴型同步）
- 🔊 TTS 音频实时播放 + Web Audio 嘴型驱动
- 🎤 浏览器 ASR 语音输入（Chrome/Edge）
- 💬 景区知识问答（RAG + Qwen LLM）
- 📊 /admin 数据大屏（情感趋势、热门问题、响应时延）

## 文档

- **环境搭建**：[SETUP.md](./SETUP.md)
- **技术实现**：[实现文档.md](./实现文档.md)
