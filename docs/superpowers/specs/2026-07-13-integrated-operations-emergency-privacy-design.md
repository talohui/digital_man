# 灵山胜境智能运营闭环与应急隐私能力设计

日期：2026-07-13
状态：已获用户批准，待实施

## 1. 目标与范围

本设计在现有 C 端导览、analytics-server、Fay、RAG 与 B 端运营页面之上增加六项互相联动的能力：

1. Next Best Action（NBA）建议执行与效果评估；
2. 客流和事件约束的动态路线调整；
3. 具有生效期、失效期和来源等级的时效感知 RAG；
4. NBA 证据下钻与历史版本比较；
5. 应急事件发布、路线联动、游客提醒、数字人播报和 NBA 待办；
6. 游客画像查看、个性化开关、分析授权撤回、数据导出和完整删除。

目标是实现真实的数据闭环，不以仅保存在浏览器中的演示状态代替后端持久化。当前门票、消费和访问热区仍属于演示业务事件；设计保留未来接入园方票务、POS、闸机和客流接口的适配边界。

## 2. 设计原则

- **单一事实来源**：运营决策、应急事件、游客授权与服务端删除状态由 analytics-server 持久化。
- **安全降级**：模型、RAG 或应急同步失败时，核心导览、默认路线和规则决策仍可使用。
- **证据最小披露**：B 端只展示脱敏问题样例、事件类型、时间和聚合指标，不公开完整游客身份与对话。
- **显式边界**：行为热区不冒充园方真实客流，演示购票不冒充生产支付。
- **可撤回**：关闭个性化与撤回分析授权立即影响后续处理；完整删除同时覆盖服务端与浏览器数据。
- **不重复启动服务**：RAG 只修改并使用 `/Users/MR/Desktop/软件杯/lingshan-rag`；不启动第二份评测、索引或服务。

## 3. 总体架构

```text
C 端游客行为 ──► analytics-server ──► 决策输入聚合 ──► Fay 大模型
     │                    │                    │              │
     │                    │                    └──► 规则兜底 ◄┘
     │                    │
     │                    ├── NBA 快照 / 执行动作 / 效果指标
     │                    ├── 应急事件 / 游客授权 / 删除任务
     │                    └── 活跃事件与景点行为热区
     │
     ├── 拉取活跃应急事件 ──► 提醒 / 主动播报 / 路线约束
     └── 隐私中心 ──► 查看 / 导出 / 撤回 / 删除

B 端应急发布 ──► analytics-server ──► kb_server 临时 FAQ
                                      └── validFrom / validUntil / status
```

## 4. 后端领域模型

### 4.1 NBA 决策快照

`DecisionSnapshot`

- `id`
- `summary`
- `generationSource`：`llm | rules | demo`
- `generatedAt`
- `cacheHit`
- `fallbackReason`
- `inputWindowStart` / `inputWindowEnd`
- `inputSummaryJson`
- `dataSourcesJson`

`DecisionCardRecord`

- `id`
- `snapshotId`
- `stableKey`：由类型、标题和关联对象生成，供历史比较
- `title` / `type` / `priority`
- `evidenceJson` / `reason` / `actionsJson`
- `relatedTopicsJson` / `relatedSpotsJson`

每次真正重新生成时保存快照；命中 5 分钟缓存时不重复创建快照。

### 4.2 建议执行与效果评估

`DecisionAction`

- `id`
- `cardId`
- `actionText`
- `status`：`PROPOSED | ACCEPTED | IN_PROGRESS | COMPLETED | DISMISSED`
- `owner`
- `dueAt`
- `note`
- `acceptedAt` / `completedAt`
- `baselineWindowStart` / `baselineWindowEnd`
- `evaluationWindowStart` / `evaluationWindowEnd`
- `baselineMetricsJson` / `resultMetricsJson`

第一版效果指标只使用系统已有且可稳定计算的数据：问答量、负面比例、路线曝光/点击率、景点访问、购票金额、消费金额、平均评分和 P90 延迟。系统展示变化，不自动声称因果关系。

### 4.3 应急事件

`EmergencyEvent`

- `id`
- `type`：`SCENIC_CLOSURE | SHOW_CANCELLED | EXTREME_WEATHER | CROWDING | ROAD_CLOSURE | MISSING_PERSON | MEDICAL_HELP`
- `title` / `message`
- `severity`：`INFO | WARNING | CRITICAL`
- `status`：`DRAFT | ACTIVE | RESOLVED | EXPIRED`
- `affectedSpotIdsJson` / `affectedRouteIdsJson`
- `validFrom` / `validUntil`
- `routePolicy`：`NONE | PENALIZE | EXCLUDE`
- `knowledgeQuestion` / `knowledgeAnswer`
- `kbFaqId`
- `createdBy` / `createdAt` / `resolvedAt`

医疗和走失事件只允许管理员填写经过确认的联系入口与处置说明；模型不得生成诊断、治疗、个人身份或未经确认的走失信息。

### 4.4 游客授权

`VisitorConsent`

- `userId`
- `personalizationEnabled`
- `analyticsEnabled`
- `updatedAt`

匿名游客仍使用随机 `guest-*` 标识。关闭个性化后使用默认路线且不更新 PersonaEngine；撤回分析授权后，前端停止发送非必要埋点，服务端也拒绝保存新的分析事件。

## 5. API 设计

### 5.1 NBA

- `GET /dashboard/marketing-decision`：现有当前决策接口，增加 `snapshotId`。
- `GET /dashboard/marketing-decision/history`：分页读取历史快照。
- `GET /dashboard/marketing-decision/{snapshotId}`：读取快照、卡片和脱敏证据。
- `GET /dashboard/marketing-decision/{snapshotId}/compare/{olderId}`：比较新增、消失和优先级变化。
- `POST /dashboard/decision-actions`：从建议创建执行动作。
- `PATCH /dashboard/decision-actions/{id}`：更新状态、负责人、期限和备注。
- `POST /dashboard/decision-actions/{id}/evaluate`：按时间窗口计算效果指标。

### 5.2 应急事件

- `GET /api/public/emergencies/active`：C 端读取当前有效事件，不返回内部字段。
- `GET /api/admin/emergencies`：B 端列表。
- `POST /api/admin/emergencies`：创建草稿。
- `PUT /api/admin/emergencies/{id}`：编辑草稿或活动事件。
- `POST /api/admin/emergencies/{id}/publish`：发布并同步临时知识。
- `POST /api/admin/emergencies/{id}/resolve`：解除事件并停用临时知识。

### 5.3 游客隐私

- `GET /api/visitor/{userId}/privacy-summary`：返回已保存的数据类别、画像摘要、足迹数量、消费和事件数量。
- `PUT /api/visitor/{userId}/consent`：修改个性化与分析授权。
- `GET /api/visitor/{userId}/export`：导出 JSON 数据包。
- `DELETE /api/visitor/{userId}/data`：删除事件、画像、行为记录和服务端可关联数据。

用户标识必须满足 `guest-` UUID 格式；接口不得接受任意 SQL 标识或跨用户批量删除。完整删除成功后，前端才清空本地数据并生成新匿名身份。

## 6. 动态路线策略

路线调整以现有推荐结果为基础，不重写整个推荐引擎。

```text
动态得分 = 原推荐得分
         - 行为热区惩罚
         - 应急拥堵惩罚
         - 封闭点位不可用惩罚
```

- 近 5 分钟 `spot_enter` 形成行为热度；数据来源在 UI 中明确标为“游客端访问热度”。
- `PENALIZE` 事件降低关联路线和景点排序。
- `EXCLUDE` 事件移除受影响站点；若路线因此为空，则回退到安全默认路线并提示原因。
- 演出取消只移除演出相关卖点与时间安排，不自动推断景区关闭。
- 医疗、走失事件不参与普通营销路线；仅在影响通行时应用明确的道路/区域限制。
- 所有调整结果返回 `adjustmentReasons`，游客能看到为何改线。

## 7. 时效感知 RAG

### 7.1 FAQ 元数据

扩展 FAQ：

- `sourceType`：`official | admin | emergency | third_party`
- `validFrom`
- `validUntil`
- `status`：`active | inactive`
- `updatedAt`
- `emergencyId`

### 7.2 检索规则

- 只返回当前时间处于有效期内且状态为 active 的 FAQ。
- 紧急知识优先于普通 FAQ，但只在有效期内生效。
- 官方与管理员确认来源优先于第三方来源。
- 事件解除时将对应 FAQ 置为 inactive；失败时记录 `kbSyncStatus` 并允许重试。
- 第一版不对所有文档切片强制增加时间字段，避免全量重建；时效过滤先覆盖 FAQ 与应急临时知识。

## 8. 前端体验

### 8.1 B 端

- 决策页增加历史、对比、证据抽屉和动作状态。
- 新增应急管理页，支持草稿、发布、解除和同步状态。
- 决策卡可一键转待办，展示执行人与评估结果。

### 8.2 C 端应急提醒

- 全局拉取活跃事件；严重事件使用阻断弹窗，普通事件使用顶部横幅。
- 每个事件版本只主动播报一次，播报状态保存在本地。
- 数字人播报使用管理员确认文本，不把医疗或走失事件交给模型自由改写。
- 路线变化显示“因道路封闭/景点拥挤已调整”的具体原因。

### 8.3 隐私中心

“我的”页面新增：

- 数据概览；
- 个性化推荐开关；
- 行为分析授权开关；
- 导出个人数据；
- 清空对话；
- 删除全部数据。

删除全部数据需要二次确认。成功后清理 `lingshan-guide-store`、聊天会话、票务/消费状态、事件播报状态和可选分析标识，再创建新匿名用户。

## 9. 故障与降级

- NBA 大模型失败：继续使用规则兜底并保存失败原因。
- KB 临时知识同步失败：应急提醒和路线限制仍立即生效，B 端显示“知识同步失败，可重试”。
- 应急接口不可用：保留最近一次未过期事件缓存，并标记“信息可能延迟”。
- 路线计算失败：保留原路线并展示警告，不返回空白页。
- 隐私删除部分失败：不清理本地身份，返回失败子项供重试，避免形成“前端看似删除、后端仍保留”。
- 导出失败：不影响授权设置和正常导览。

## 10. 测试与验收

### 10.1 analytics-server

- 快照只在真实重新生成时创建，缓存命中不重复创建。
- 动作状态机拒绝非法跳转。
- 效果评估时间窗口和指标计算正确。
- 应急发布/解除的状态与有效期正确。
- 删除接口只删除指定匿名用户数据。
- 撤回授权后不再写入分析事件或更新画像。

### 10.2 RAG

- 未生效、过期和停用 FAQ 不可检索。
- 有效应急 FAQ 优先返回。
- 事件解除后临时知识不可命中。
- 旧 FAQ 未提供新字段时保持兼容。

### 10.3 前端

- 应急事件只主动播报一次。
- 封闭点位从路线中移除，拥挤点位降权。
- 无可用替代路线时显示安全回退说明。
- 关闭个性化后返回默认路线。
- 撤回分析授权后不再发埋点。
- 删除成功后清空所有列出的本地存储并生成新匿名 ID。
- NBA 历史、对比、证据和执行状态在窄屏下不溢出。

## 11. 分阶段交付

1. **数据基础**：决策快照、动作、应急事件、授权实体与 API。
2. **智能联动**：时效 FAQ、应急同步、动态路线和 NBA 应急输入。
3. **产品界面**：B 端历史/证据/应急，C 端提醒/播报/隐私中心。
4. **验证联调**：单元测试、跨服务测试、真实页面和移动端验证。

每阶段结束都必须保留现有功能可运行；不得通过重置工作区或覆盖用户未提交修改来实现。
