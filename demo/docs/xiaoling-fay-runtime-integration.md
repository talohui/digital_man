# 小灵地图对话与 Fay 运行时对接方案

## 1. 文档状态

- 适用页面：`/map-3d-guide-c`、地图路线页、地图景点页和小灵全屏会话页。
- 适用前端组件：`GlobalXiaolingAssistant`、`XiaolingConversationSurface`、`XiaolingRuntimeProvider`。
- 当前状态：**方案文档，尚未完成真实 Fay 对接与边界验收**。
- 本文不修改腾讯地图、路线 geometry、GLB、相机或定位能力。

本文用于约定前端、Fay 服务和联调测试之间的责任。页面中已经完成的状态签、对话气泡、推荐荐笺和输入栏只能视为视觉预览；在本方案完成前，不得将“倾听中、思考中、讲解中”标记为已接入真实后端。

## 2. 当前实现与主要断点

当前项目存在两条尚未统一的会话链路。

| 链路 | 当前职责 | 真实情况 |
| --- | --- | --- |
| `useGuideSessionStore` | 地图 browse / route / poi 线程、消息、结构化卡片和白名单动作 | `sendGuideMessage` 使用 `GuideMockResponder`，回复和 `thinking` 状态均为本地模拟 |
| `useChatStore` | Fay HTTP、WebSocket、流式文本、音频队列、数字人表情和重连 | 已具备真实 Fay 基础能力，但地图对话抽屉没有使用该会话消息作为展示源 |
| `XiaolingRuntimeProvider` | 数字人状态、口型和连接状态 | `connectionState` 读取真实 WebSocket；`robotState` 主要由地图 mock 会话状态推导 |

因此目前只能确认：

- WebSocket 的 `idle / connecting / connected / disconnected / error` 是真实连接状态。
- 地图抽屉显示的 `thinking` 不是 Fay 推理生命周期。
- 地图抽屉输入仍不会进入 Fay 的 `guide-runtime` 会话。
- 语音按钮仍为禁用状态，尚未接入真实录音或语音识别。
- 结构化路线和景点卡来自前端确定性规则，不是 Fay 返回的可信业务载荷。

相关代码：

- `src/guide/useGuideSessionStore.ts`
- `src/store/useChatStore.ts`
- `src/api/fay.ts`
- `src/guide/runtime/XiaolingRuntimeProvider.tsx`
- `src/components/guide/GlobalXiaolingAssistant.tsx`
- `src/components/guide/XiaolingConversationSurface.tsx`

## 3. 对接目标与非目标

### 3.1 必须实现

1. 地图对话文本真实发送到 Fay。
2. Fay 流式回复写入当前 browse / route / poi 对话线程。
3. 状态签由真实连接、发送、流式回复和音频播放状态驱动。
4. 数字人倾听、思考、讲解和口型与同一 Fay 会话保持一致。
5. 页面切换后回复仍写回发起请求时的线程，不串到新页面。
6. 断网、重连、重复推送和超时均有明确、可恢复的状态。
7. 结构化推荐只能执行前端白名单动作，不允许模型自由生成 URL 或直接导航。

### 3.2 本阶段不承诺

- 真实定位、步行导航和到达判断。
- Fay 自由生成商品价格、库存、票务状态或服务可用性。
- 从自然语言猜测并执行任意跳转。
- 在荐笺内部再次挂载 Live2D。
- 在没有真实录音 / STT 接口时伪装“倾听中”。

## 4. 目标链路

```text
用户输入 / 快捷提问
        ↓
GuideFayBridge 捕获 conversationKey、GuideContext、requestId
        ↓
写入用户消息，并将当前线程置为 thinking
        ↓
POST /api/send + Fay username / sceneId
        ↓
Fay WebSocket 按 username、requestId 推送流式文本和音频
        ↓
FayReplyAdapter 过滤后端标记、去重、合并文本块
        ↓
写回原 conversationKey，驱动 thinking → speaking → idle
        ↓
可选结构化业务载荷经目录校验和 GuideActionRegistry 白名单校验
        ↓
渲染通用荐笺；用户点击后才执行页面动作
```

建议新增独立的 `GuideFayBridge` / `FayReplyAdapter` 边界，不在 React 组件中直接解析 WebSocket 消息，也不要在 `XiaolingConversationSurface` 中保存第二份业务状态。

## 5. 会话与身份映射

地图会话已有以下线程规则：

| 页面 | `conversationKey` |
| --- | --- |
| 普通浏览 | `browse` |
| 路线 | `route:<routeId>` |
| 景点 | `poi:<poiId>` |

Fay 侧不能继续把所有地图会话固定为单一 `guide-runtime`。建议由前端派生稳定 sceneId：

```ts
type GuideFaySceneId =
  | 'guide-runtime:browse'
  | `guide-runtime:route:${ScenicRouteId}`
  | `guide-runtime:poi:${string}`
```

`getFayUsername(sceneId)` 已将匿名游客 ID、清空会话轮换序号和 sceneId 编码进 username。后端每条 WebSocket 推送必须原样携带 username，前端才能通过 `getSceneIdFromFayUsername` 将回复路由回正确线程。

每次发送还应增加 `requestId`。仅靠 username 无法可靠区分同一线程中快速连续发送的两轮请求，也无法完成幂等去重。

## 6. 环境与接口约定

### 6.1 地址

前端当前读取：

| 能力 | 环境变量 | 默认值 |
| --- | --- | --- |
| Fay HTTP | `VITE_FAY_HTTP` | 当前页面主机的 `5000` 端口 |
| Fay WebSocket | `VITE_FAY_WS` | 当前页面主机的 `10003` 端口 |

手机局域网联调时，Fay 必须监听局域网地址，并允许页面来源的 CORS / WebSocket 连接。不得在手机构建中写死 `127.0.0.1`。

### 6.2 当前 HTTP 请求

现有前端调用：

```http
POST /api/send
Content-Type: application/x-www-form-urlencoded

data={"username":"...","msg":"..."}
```

建议后端兼容增加以下字段：

```json
{
  "username": "guest-...__scene__guide-runtime%3Abrowse",
  "msg": "拼接地图上下文后的提示词",
  "requestId": "guide-request-uuid",
  "conversationKey": "browse",
  "contextVersion": 1
}
```

### 6.3 WebSocket 最小字段

后端每个流式事件至少应提供：

```ts
type FayGuideStreamEvent = {
  username: string
  requestId: string
  type: 'text' | 'audio' | 'state' | 'guide_ui' | 'error'
  isFirst?: boolean
  isEnd?: boolean
  text?: string
  audioUrl?: string
  robot?: 'normal' | 'listening' | 'thinking' | 'speaking'
  errorCode?: string
  errorMessage?: string
  payload?: unknown
}
```

现有前端仍兼容 `_<isfirst>`、`_<isend>` 和 `IsEnd / isEnd`，但正式联调应优先使用显式布尔字段。`requestId`、`username` 和完成标记必须稳定存在。

## 7. 真实状态机

状态不能由固定计时器模拟。建议按以下优先级计算可见状态：

```text
连接错误 / 断线
    > listening
    > thinking
    > speaking
    > connected idle
```

| UI 状态 | 真实来源 | 进入条件 | 退出条件 |
| --- | --- | --- | --- |
| `connecting` | `wsStatus` | 开始建立 WebSocket | `connected / error / disconnected` |
| `reconnecting` | `wsStatus` + 重连计数 | 非主动关闭且进入退避重连 | 重新连接或达到终止条件 |
| `listening` | 真实录音 / STT 生命周期 | 录音设备已授权并开始采集 | 停止、取消、错误 |
| `thinking` | 当前 request 的发送状态 | HTTP 接受请求后，尚未收到首个可见文本块 | 首个文本块、错误或取消 |
| `speaking` | 流式文本或音频队列 | 正在接收回复；有音频时以音频播放为准 | `isEnd` 且音频队列清空 |
| `idle` | 连接和请求状态 | 已连接且当前线程无活动请求 | 新请求或连接变化 |
| `error` | HTTP / WS / 解析错误 | 当前请求不可继续 | 用户重试或自动恢复成功 |

状态签文案建议：

- `Fay 服务已连接`
- `正在连接 Fay 服务`
- `Fay 服务正在重连`
- `小灵正在倾听`
- `小灵正在整理导览信息`
- `小灵正在讲解`
- `消息已排队，连接恢复后发送`
- `Fay 服务暂不可用`

不得在断网时显示“文字导览正常”，除非确实存在一个已验证、明确告知用户的本地离线回答能力。

## 8. 流式消息生命周期

1. 发送前生成 `requestId`，捕获 `conversationKey` 和页面上下文快照。
2. 用户消息立即写入对应线程，状态设为 `thinking`。
3. 收到首个有效文本块时创建一条 `status: streaming` 的 assistant 消息。
4. 后续文本块只追加到相同 `requestId` 的 assistant 消息。
5. `isEnd` 到达后将消息标为 `complete`。
6. 若存在音频，文本完成不等于讲解完成；必须等音频队列清空后进入 `idle`。
7. 页面已切换时，消息仍写回发送时捕获的原线程；当前页面不能错误播放另一线程的口型或状态。
8. 同一 `requestId + chunkIndex` 重复到达时只处理一次。

前端继续过滤以下后端标记，禁止显示给游客：

- `<prestart>...</prestart>`
- `<think>...</think>`
- `_<isfirst>` / `_<isend>`
- 音频文件路径和内部调试字段

## 9. 结构化推荐卡对接

### 9.1 安全边界

Fay 可以返回“推荐什么”和“为什么推荐”，但不能直接返回可执行 URL，也不能自由生成价格、库存、开放状态和路线 ID。

推荐流程：

```text
Fay 返回 kind + entityId + reason
              ↓
前端按可信目录查询实体
              ↓
校验实体存在、可展示、可执行
              ↓
生成 GuideUiPayload / 通用荐笺展示模型
              ↓
GuideActionRegistry 执行白名单动作
```

### 9.2 建议的通用载荷

```ts
type FayRecommendationSelection = {
  kind: 'route' | 'poi' | 'service' | 'event' | 'product'
  entityId: string
  reason: string
  primary?: boolean
  requestId: string
}
```

后端不得直接提供最终标题、价格、图片 URL 或跳转 URL。前端目录适配层补齐可信字段后，再形成通用荐笺数据：

```ts
type GuideRecommendationCardData = {
  kind: FayRecommendationSelection['kind']
  entityId: string
  typeLabel: string
  title: string
  description?: string
  image?: { src: string; alt: string }
  facts: Array<{ label: string; value: string }>
  reason: string
  actionLabel: string
  action: GuideAction
}
```

图片缺失或加载失败时必须折叠画心区域，回退为纯文字荐笺；不能保留空白框，也不能使用任意外部图片 URL。

## 10. 断网、超时与重连

现有实现包含指数退避重连，最大基础间隔约 `30s`，HTTP 发送超时为 `15s`。正式对接还需要补齐：

- 明确主动关闭与异常断线，主动离开页面不应触发无限重连。
- 离线队列每项保存 `requestId`、sceneId、username、创建时间和重试次数。
- 重连后按原顺序发送，并使用 `requestId` 防止后端重复生成回复。
- 已收到完整 WebSocket 回复的请求，即使 HTTP 随后超时，也不得再次入队。
- 队列需要上限和过期时间；超过限制时给出可理解的失败提示。
- 音频下载失败不能丢失已经收到的文字回复。
- 后端重启后，前端应恢复为 `connected idle`，而不是永久停留在 `thinking`。

建议增加开发环境开关：

```text
VITE_GUIDE_RUNTIME=fay | mock
```

`mock` 只用于离线开发和视觉回归，页面必须明确标识开发模式；正式构建不得静默从 Fay 降级为 mock 回答。

## 11. 异常与边界验证矩阵

以下项目在真实 Fay 桥接、测试服务和设备条件具备前，状态一律记录为“未验证”。

### 11.1 长对话

| 场景 | 测试数据 | 验收标准 |
| --- | --- | --- |
| 连续对话 | 同一线程 50 轮 | 输入栏固定；消息区独立滚动；无横向溢出；关闭重开后历史仍在 |
| 长回复 | 单条 2,000 个中文字符 | 流式追加稳定；用户手动上滑后不强制抢回底部；回到底部后恢复跟随 |
| 快速连续发送 | 3 次发送间隔小于 500ms | request 不串线、不合并到错误气泡；后端不重复回答 |
| 页面中途切换 | route 请求未完成时进入 poi | 回复写回原 route 线程；当前 poi 不显示 route 的思考状态 |

### 11.2 推荐卡

| 场景 | 测试数据 | 验收标准 |
| --- | --- | --- |
| 单卡 | 1 张路线或景点卡 | 完整可读，操作不被输入栏遮挡 |
| 多卡 | 2、3、5 张混合类型 | 横向滚动或列表策略一致；焦点顺序正确；没有卡片被裁切到无法操作 |
| 无图卡 | `image` 缺失 | 自动使用纯文字版，不预留图片空位 |
| 图片失败 | 404、超时、损坏图片 | `onError` 折叠画心；标题和操作位置回稳；无无限重试 |
| 超长标题 | 30 个中文字符 | 合理换行或截断；方印、类型签和按钮不重叠 |
| 非法实体 | 不存在的 route / poi / product ID | 不渲染可执行卡；显示安全回退文本并记录诊断 |

### 11.3 软键盘与视口

必须在 `375 × 812`、`390 × 844`、`430 × 932` 和至少一台真实 Android / iOS 设备验证：

- 输入框聚焦后使用 `visualViewport.height` 和 `offsetTop` 更新抽屉。
- 输入栏始终位于键盘上方，最后一条消息可滚动到完整可见。
- 中文输入法组合阶段按 Enter 不提前发送。
- 多行输入增长到上限后只滚动 textarea，不把状态签或顶部栏推出屏幕。
- 旋转屏幕、切后台再返回、QQ / 微信内置浏览器地址栏变化后布局恢复。
- 安全区底部不会与系统手势条重叠。

### 11.4 网络与服务异常

| 操作 | 预期结果 |
| --- | --- |
| 打开页面时 Fay 未启动 | 状态签显示不可用 / 重连；页面不假装已连接 |
| 已连接后停止 Fay | 进入重连；当前未完成请求可恢复或明确失败 |
| 点击发送后立即断网 | 消息进入有上限的离线队列；状态显示“已排队” |
| 收到首块文本后断网 | 保留已收文本并标记未完成；重连后按 requestId 续传或安全终止 |
| 重复发送相同 WS 块 | UI 只追加一次 |
| 缺少 `isEnd` | 超时后终止 streaming，不能永久显示思考 / 讲解中 |
| 音频 URL 失败 | 文字回复完成，数字人口型复位，并显示非阻断性提示 |
| WebSocket 重连成功 | 状态回到已连接；旧错误文案清除；队列按顺序处理 |

### 11.5 可访问性与动效

- 状态变化通过 `aria-live="polite"` 宣布，但流式每个字块不能重复朗读。
- 思考动画、状态点呼吸和数字人反馈遵守 `prefers-reduced-motion`。
- 推荐卡、快捷提问、发送和重试按钮支持键盘焦点。
- 颜色不是唯一状态信号，必须同时提供文字。

## 12. 可观测性

建议每轮请求记录：

- `requestId`、匿名 session 标签、sceneId、conversationKey。
- HTTP 接受耗时、首块文本耗时、完成耗时、首段音频耗时。
- 重连次数、离线队列长度、重复块丢弃数量。
- reply 完成原因：`isEnd / timeout / error / cancelled`。
- 结构化推荐曝光、目录校验失败和白名单动作结果。

日志不得记录完整用户身份、精确位置或原始音频。生产环境不得输出完整 Fay username 和提示词到浏览器控制台。

## 13. 分阶段实施

### 阶段 A：协议与桥接

- 确认 Fay 是否支持 `requestId`、username 回传和显式完成标记。
- 抽取共用 `FayReplyAdapter`，避免地图桥接重复实现文本清洗和完成判断。
- 建立 conversationKey ↔ sceneId 映射。
- 地图发送改走 Fay，停止在 Fay 模式调用 `GuideMockResponder`。

### 阶段 B：真实状态

- `XiaolingRuntimeProvider` 读取当前 scene 的 `isRecording / isSending / robotState / audioQueue`。
- 状态签按第 7 节优先级显示。
- 首块文本、回复完成和音频结束正确切换状态。

### 阶段 C：结构化业务载荷

- Fay 返回稳定实体 ID 和推荐理由。
- 前端目录校验并生成通用荐笺。
- 所有操作继续通过 `GuideActionRegistry`。

### 阶段 D：边界验收

- 执行第 11 节完整矩阵。
- 真实手机、局域网、服务重启和弱网测试留下记录。
- 通过后再删除 V2 状态模拟和旧地图 mock 入口。

## 14. 完成定义

只有同时满足以下条件，才能在文档和答辩中声明“地图小灵已接入 Fay”：

- 地图输入真实到达 Fay，流式回复真实回到同一线程。
- 倾听、思考、讲解和重连均由真实运行时事件驱动。
- browse / route / poi 切换不串消息、不串状态、不串音频。
- 断网与服务重启测试通过，且不存在永久 loading。
- 推荐卡所有实体经过可信目录校验，跳转经过动作白名单。
- 长对话、多卡、无图、坏图、软键盘和减少动态效果均完成真实验收。
- 文档中的“未验证”项目已附测试结果和设备 / 服务版本。

在这些条件满足前，当前实现应描述为：**Fay 连接基础能力与地图会话视觉已具备，真实地图会话桥接和完整边界验收待完成。**
