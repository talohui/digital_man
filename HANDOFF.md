# 灵山胜境项目交接文档

> 给继续优化 C 端手机端和 B 端大屏的同学 / Claude / Codex agent。请先读本文件，再改代码。

## 1. 当前主线

当前项目目标已经从“单纯数字人聊天”扩展为：

```text
C 端小程序式游客体验
+ Fay/RAG 数字人讲解
+ 个性化路线推荐
+ 票务 / 消费 / 地图 / 聊天行为采集
+ B 端实时与历史游客行为大屏
```

近期重点：

1. 继续优化 C 端手机端前端体验。
2. 继续优化 B 端 `/admin` 数据大屏展示。
3. 保持 Fay/RAG 的问答准确率和响应速度，不要把推荐、大屏、票务逻辑接进 RAG 主链路。

## 2. 高压保护区：默认不要动

这些文件关系到问答速度、RAG 准确率或已修过的关键 bug。除非任务明确要求，否则不要改：

```text
数字人开源项目/Fay-main/llm/nlp_cognitive_stream.py
数字人开源项目/Fay-main/faymcp/data/mcp_prestart_tools.json
demo/src/store/useChatStore.ts
demo/src/api/fay.ts
lingshan-rag/**
```

如果必须动：

- `useChatStore.ts` 要保留单气泡流式输出和 `<prestart>/<think>` 隐藏逻辑。
- `nlp_cognitive_stream.py` 要保留“预启动 RAG 一次检索 + 一次 LLM 生成”的快路径。
- `mcp_prestart_tools.json` 里 `query_lingshan_rag` 不要改回 RAG 内部二次 LLM。

## 3. 服务与端口

| 服务 | 端口 | 作用 | 必需 |
|---|---:|---|---|
| demo | 5173 | C 端游客前端 + B 端 React 大屏 | 是 |
| analytics-server | 5002 | 埋点、推荐、大屏聚合、游客行为样本 | 是 |
| Fay HTTP | 5000 | 数字人 HTTP / ASR 上传 | 是 |
| Fay WS | 10003 | 数字人回复、音频、流式消息 | 是 |
| lingshan-rag MCP | 5010 | 灵山知识库检索，Fay 自动拉起 | 是 |
| Gorse | 8087/8088 | 可选推荐增强 | 否 |

启动见 `SETUP.md`。

## 4. C 端手机端结构

入口：

```text
demo/src/App.tsx
```

逻辑：

- `useIsMobileViewport()` 判断移动端，默认 `max-width: 768px`。
- 手机端且非 `/admin` 路由时，进入 `MobileShell`。
- 桌面端继续走旧的 `HomePage / GuideMapPage / SpotGuidePage`。

核心文件：

```text
demo/src/mobile/MobileShell.tsx
demo/src/mobile/MobileHomePage.tsx
demo/src/mobile/MobileMapPage.tsx
demo/src/mobile/MobileGuidePage.tsx
demo/src/mobile/MobileProfilePage.tsx
demo/src/mobile/MobileTicketPage.tsx
demo/src/mobile/MobileConsumePage.tsx
demo/src/hooks/useIsMobileViewport.ts
demo/src/styles/global.css
```

### 4.1 手机端 Tab

当前小程序式 Tab：

- `导览`
- `地图`
- `小灵`
- `我的`

另外有独立页面：

- `/ticket`：模拟购票
- `/consume`：模拟消费

### 4.2 场景隔离

聊天记录按 scene 隔离，不同路线 / 景点不能串：

```text
main
map:{routeId}
spot:{routeId}:{spotId}
```

相关文件：

```text
demo/src/store/chatSessions.ts
demo/src/store/useChatStore.ts
demo/src/mobile/MobileGuidePage.tsx
demo/src/mobile/MobileMapPage.tsx
```

约束：

- 底部“小灵”没有明确景点上下文时，用 `map:{routeId}` 或 `main`。
- 只有用户实际进入 / 点过景点时，才用 `spot:{routeId}:{spotId}`。
- 不要因为默认选中的景点，把所有聊天都塞进某个 spot scene。

### 4.3 当前手机端待优化重点

手机端前端还有明显演示问题，后续同学优先处理：

- 地图页抽屉 / 卡片挡住真实路线，应该支持收缩、半展开、全展开，默认不要遮挡主要路线。
- 地图气泡卡片在窄屏显示不全，必须限制宽度并避免溢出。
- 按钮需要清晰点击态 / 加载态 / 禁用态，用户要知道“点到了”。
- 地图页顶部、路线卡、底部 Tab 的安全区适配还需要继续打磨。
- 语音输入、文本输入、发送按钮在小屏不能重叠。
- `/admin` 不走移动 App Shell，管理端后续单独适配。

## 5. C 端业务能力

### 5.1 导览与推荐

相关文件：

```text
demo/src/store/useGuideStore.ts
demo/src/api/guide.ts
demo/src/data/guideData.ts
analytics-server/src/main/java/com/lingshan/analytics/service/GuideRecommendationService.java
analytics-server/src/main/java/com/lingshan/analytics/service/LocalScoreEngine.java
```

当前推荐引擎：

```text
local-score-v1
finalScore = 45% 标签匹配 + 25% 行为兴趣 + 15% 热度 + 15% 满意度 - 负反馈惩罚
```

Gorse 状态：

- Gorse 不是主链路。
- 不启动 Gorse，推荐接口也应该正常返回。
- 不要在手机端文案里出现“Gorse fallback / 本地兜底”等工程词。

### 5.2 偏好标签与画像

事件：

```text
tag_toggle          点击日志
preference_update   当前 selectedTags 快照，真正驱动标签画像
```

原则：

- 首页标签是“当前偏好快照”，不是“点击次数”。
- 反复选 / 取消标签不应该刷高画像。
- 聊天、路线点击、景点进入、评分等真实行为继续作为增量信号。

相关文件：

```text
demo/src/lib/analytics.ts
analytics-server/src/main/java/com/lingshan/analytics/service/PersonaEngine.java
```

### 5.3 票务与消费

前端：

```text
demo/src/mobile/MobileTicketPage.tsx
demo/src/mobile/MobileConsumePage.tsx
demo/src/mobile/MobileProfilePage.tsx
demo/src/store/useTicketStore.ts
```

事件：

```text
ticket_purchase
purchase
```

字段：

```text
ticket_purchase:
  ticket_id, age_band, gender, group_size, visit_date, ticket_type, ticket_cost

purchase:
  category(food/shopping/transport/entertainment), amount, spot_id?, route_id?, ticket_id?
```

注意：

- A 版是模拟购票 / 模拟支付，不接真实身份证、手机号、微信支付、支付宝。
- 不上传身份证号、姓名、手机号。
- 数据只进入 analytics，不进入 Fay/RAG。

### 5.4 语音输入

相关文件：

```text
demo/src/components/VoiceRecorderBar.tsx
demo/src/lib/browserAsr.ts
demo/src/lib/cloudAsr.ts
demo/src/lib/voiceAsr.ts
数字人开源项目/Fay-main/asr/ali_nls.py
数字人开源项目/Fay-main/asr/ali_nls_file.py
数字人开源项目/Fay-main/gui/flask_server.py
```

模式：

- `auto`：默认。
- `browser`：仅安全上下文且浏览器支持 Web Speech 时。
- `cloud`：上传到 Fay `/api/asr-transcribe`。

局域网真机调试时，常见问题是手机访问自己的 `127.0.0.1`。用 `VITE_FAY_HTTP / VITE_FAY_WS / VITE_ANALYTICS_HTTP` 指到电脑局域网 IP。

## 6. B 端大屏结构

入口：

```text
http://127.0.0.1:5173/admin
demo/src/pages/AdminDashboard.tsx
```

后端：

```text
analytics-server/src/main/java/com/lingshan/analytics/controller/DashboardController.java
analytics-server/src/main/java/com/lingshan/analytics/service/DashboardService.java
analytics-server/src/main/java/com/lingshan/analytics/service/VisitorBehaviorService.java
```

### 6.1 当前大屏模块

`/admin` 当前应包含：

- 实时总览 / 行为概览。
- 聊天洞察：聊天量、热门问题、情绪趋势、慢回复监控。
- 推荐效果：曝光、点击、CTR、推荐路线 Top、引擎类型。
- 服务质量：P50/P90/MAX、语音完成率、AI 回复率。
- 游客行为分析：`实时游客数据 / 灵山历史样本` 切换。
- 画像 / 偏好相关统计。

### 6.2 游客行为“实时 / 历史”切换

接口：

```text
GET /api/dashboard/visitor-behavior?mode=realtime
GET /api/dashboard/visitor-behavior?mode=history
```

历史样本：

- 来源：`灵山胜境相关景点筛选结果.xlsx`
- ETL 脚本：`analytics-server/scripts/build_lingshan_visitor_seed.py`
- Seed JSON：`analytics-server/src/main/resources/visitor-behavior/lingshan-visitor-behavior-seed-v1.json`
- 样本数：`522`
- 入库表：`VisitorBehaviorRecord`
- source：`history_lingshan_sample`

实时样本：

- 来源：C 端 `ticket_purchase` + `purchase` + 现有地图/评分/停留事件。
- source：`realtime_mini_program`
- 近 24 小时口径。

不要把历史样本和实时数据混在同一张图里不加说明；UI 上必须明确当前 mode。

### 6.3 官方历史样本旧接口

旧的官方行业样本接口仍可能保留：

```text
/api/official-behavior/*
```

当前主展示已经切到“游客行为分析”的实时 / 灵山历史切换。后续可以保留旧接口作为备用，不要再让 `/admin` 同屏混杂多套历史口径。

## 7. 数字人与形象配置

管理页：

```text
http://127.0.0.1:5173/admin/avatar
```

相关文件：

```text
demo/src/pages/AdminAvatarPage.tsx
demo/src/components/admin/AdminLive2DPreview.tsx
demo/src/api/admin.ts
demo/src/lib/live2dCostume.ts
demo/src/lib/voicePreview.ts
analytics-server/src/main/java/com/lingshan/analytics/controller/AdminConfigController.java
analytics-server/src/main/java/com/lingshan/analytics/controller/PublicConfigController.java
analytics-server/src/main/java/com/lingshan/analytics/service/AvatarConfigService.java
```

能力：

- 音色选择与本地 wav 试听。
- 保存后同步 analytics 配置，并写 Fay `config.json/cache_data/config.json` 的 `attribute.voice`。
- Live2D 换装：当前是同模型纹理替换，不是任意新模型骨骼导入。

注意：

- Fay TTS 音色通常需要重启 Fay 才完全生效。
- 新增服装最稳方式是同 Live2D 模型同尺寸纹理替换；如果换不同骨骼模型，需要重新适配动作、缩放、嘴型同步。

## 8. 数据与事件速查

主要事件：

| 事件 | 作用 |
|---|---|
| `chat_message` | 用户聊天内容统计 |
| `ai_reply` | AI 回复统计与时延 |
| `preference_update` | 标签偏好快照 |
| `tag_toggle` | 标签点击日志 |
| `route_click` | 路线点击 |
| `spot_enter` / `spot_leave` | 景点进入 / 停留 |
| `rate_route` | 路线评分 |
| `rate_spot` | 景点赞踩 |
| `recommend_exposure` | 推荐曝光 |
| `recommend_click` | 推荐点击 |
| `ticket_purchase` | 模拟购票 |
| `purchase` | 模拟消费 |

核心接口：

```text
POST /api/events
GET  /api/summary
GET  /api/dashboard/overview
GET  /api/dashboard/chat-insights
GET  /api/dashboard/behavior
GET  /api/dashboard/ticketing
GET  /api/dashboard/consumption
GET  /api/dashboard/visitor-behavior?mode=realtime|history
GET  /api/dashboard/recommendation
POST /api/guide/recommendations
POST /api/guide/feedback
GET  /api/public/avatar-config
GET  /api/admin/avatar-config
PUT  /api/admin/avatar-config
```

## 9. 验证命令

前端类型检查：

```bash
cd demo
./node_modules/.bin/tsc --noEmit --incremental false
```

前端构建：

```bash
cd demo
npm run build
```

analytics 测试：

```bash
cd analytics-server
mvn test
```

Fay Python 语法检查：

```bash
cd "数字人开源项目/Fay-main"
PYTHONPYCACHEPREFIX=/tmp/codex-pycache python -m py_compile \
  asr/ali_nls.py \
  asr/ali_nls_file.py \
  gui/flask_server.py
```

接口验证：

```bash
curl http://127.0.0.1:5002/api/summary
curl "http://127.0.0.1:5002/api/dashboard/visitor-behavior?mode=history"
curl -X POST http://127.0.0.1:5002/api/guide/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userId":"dev-user","selectedTags":["亲子游","拍照打卡"]}'
```

## 10. Git 提交边界

优先提交：

```text
demo/src/**
demo/public/**
demo/package.json
demo/package-lock.json
analytics-server/src/**
analytics-server/scripts/**
analytics-server/pom.xml
数字人开源项目/Fay-main/asr/**
数字人开源项目/Fay-main/gui/flask_server.py
数字人开源项目/Fay-main/llm/nlp_cognitive_stream.py
SETUP.md
HANDOFF.md
```

默认不要提交：

```text
.claude/settings.local.json
.tmp_codex_write_test
数字人开源项目/Fay-main/memory/**
数字人开源项目/Fay-main/memory/chroma_db/**
数字人开源项目/Fay-main/logs/**
数字人开源项目/Fay-main/cache_data/**
analytics-server/lingshan-analytics*.db
demo/node_modules/**
```

当前仓库是私密仓库，历史上允许提交比赛演示 Key。但如果新增自己的个人 Key，仍建议放 `.env.local` 或本地配置，不要扩大泄露面。

## 11. 推荐给下一个 agent 的工作顺序

### C 端手机端

1. 先跑 `npm run dev:lan`，用 375/390/430 宽度检查首页、地图、小灵、我的。
2. 优先修地图页遮挡：地图路线必须可见，底部抽屉要能收缩。
3. 补按钮点击态、加载态、禁用态。
4. 确认 scene 隔离：`main / map:* / spot:*` 不串聊天。
5. 确认语音输入在局域网真机不提示去 `127.0.0.1`。

### B 端大屏

1. 确认 `visitor-behavior?mode=history` 返回 522。
2. 确认购票和消费事件后 `mode=realtime` 有变化。
3. 优化图表层级与排版，避免数字溢出。
4. 聊天内容统计、推荐效果、票务消费、满意度四块要有清晰数据口径。
5. 不要为了展示改 analytics 事件语义；优先在 DashboardService 聚合。

### 问答回归

每次大改后都问：

```text
灵山大佛有多高？
九龙灌浴几点开始？
梵宫主要看什么？
```

期望：

- 数字和景点事实准确。
- 简单事实接近 0.7-2s，复杂景点接近 6-8s；外部 LLM 抖动时记录实际值。
- 前端单气泡流式，无 `<prestart>` / `<think>` 残留。

