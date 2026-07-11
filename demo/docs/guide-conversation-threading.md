# 小灵会话线程规则

小灵会话不再按应用全局消息数组保存，而是按页面身份拆分。

| 页面上下文 | conversationKey | 说明 |
| --- | --- | --- |
| 普通浏览 | `browse` | 自由探索共享的一条对话 |
| 路线 | `route:<routeId>` | 同一路线的 preview、joining、active、arrived 共用历史 |
| 景点详情 | `poi:<poiId>` | 每个景点独立对话，不继承路线或其他景点消息 |

`setContext` 每次根据当前 URL 上下文计算线程键；缺少有效路线或景点 ID 时安全回退到 `browse`，不会继续沿用上一页面的线程。

## 旧持久化数据

原 `lingshan-guide-session-v1` 中的平铺 `messages` 会在持久化版本迁移时保存到 `legacyMessages`。这些历史仅用于保留数据，不会显示在新的 browse、route 或 poi 线程中，也不会被物理删除。

## 写入与首句规则

- 新消息由 Store 在写入时附加 `conversationKey`，组件不自行筛选历史。
- `sendGuideMessage` 在发送时捕获线程键、上下文与偏好；异步 mock 回复仍写回原线程，即使期间已经切换页面。
- 每个新线程只在首次打开抽屉时插入一次问候语；重新打开同一线程不会重复插入。
- 从推荐结果进入路线 preview 的补充说明也写入该路线线程。

当前仍使用本地 mock 回答；未接入 Fay、真实语音、导航或服务点。
