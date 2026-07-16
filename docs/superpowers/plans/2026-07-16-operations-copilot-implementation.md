# Operations Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前单轮、纯文本的运营 Copilot 升级为可恢复的连续对话、结构化分析、可编辑安全草案和可追踪执行结果。

**Architecture:** 前端只提交受控的近期对话和页面标识，analytics-server 每轮重新构建最新运营上下文并完成白名单校验，Fay 只负责生成结构化建议或草案。写操作继续使用 Fay 短期管理员会话，并把数据库状态迁移与外部服务调用拆开，避免失败状态被事务回滚。

**Tech Stack:** React 18、TypeScript、Ant Design、Spring Boot、Spring Data JPA、Flask、Python、node:test、JUnit 5、pytest。

---

### Task 1: 前端会话契约与安全恢复

**Files:**
- Modify: `demo/src/api/operationsCopilot.ts`
- Modify: `demo/src/lib/operationsCopilotRequest.ts`
- Modify: `demo/src/api/operationsCopilot.test.ts`
- Create: `demo/src/lib/operationsCopilotSession.ts`
- Create: `demo/src/lib/operationsCopilotSession.test.ts`

- [ ] **Step 1: 写历史裁剪和恢复的失败测试**

```ts
test('keeps only eight safe user and assistant turns', () => {
  const turns = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 ? 'assistant' as const : 'user' as const,
    content: `第${index}条` + '问'.repeat(900),
  }))
  const trimmed = trimOperationsCopilotHistory(turns)
  assert.equal(trimmed.length, 8)
  assert.ok(trimmed.every((turn) => turn.content.length <= 800))
})

test('never persists passwords or Fay session tokens', () => {
  const raw = JSON.stringify(saveOperationsCopilotSession({
    sessionId: 'session-1',
    turns: [{ role: 'user', content: '分析入口客流' }],
  }))
  assert.doesNotMatch(raw, /password|fayAdminSession|temporary-token/i)
})
```

- [ ] **Step 2: 运行测试并确认因函数缺失而失败**

Run:

```bash
cd demo
node --test --experimental-strip-types src/lib/operationsCopilotSession.test.ts src/api/operationsCopilot.test.ts
```

Expected: FAIL，提示会话函数或扩展请求体尚不存在。

- [ ] **Step 3: 实现兼容的查询输入与 sessionStorage 存储**

```ts
export type OperationsCopilotTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type OperationsCopilotPageContext = {
  pathname: string
  pageLabel: string
  objectType?: string
  objectId?: string
  objectLabel?: string
  dataUpdatedAt?: string
}

export type OperationsCopilotQueryInput = {
  question: string
  sessionId: string
  history: OperationsCopilotTurn[]
  pageContext?: OperationsCopilotPageContext
}

export function trimOperationsCopilotHistory(turns: OperationsCopilotTurn[]) {
  return turns
    .filter((turn) => turn.role === 'user' || turn.role === 'assistant')
    .map((turn) => ({ ...turn, content: turn.content.trim().slice(0, 800) }))
    .filter((turn) => turn.content)
    .slice(-8)
}
```

`buildOperationsCopilotQueryRequest` 和 `queryOperationsCopilot` 保留字符串重载，旧组件仍可编译；对象输入序列化 `question/sessionId/history/pageContext`。存储键固定为 `lingshan_operations_copilot_session_v1`，只存 `sessionId` 与安全消息。

- [ ] **Step 4: 运行定向测试并确认通过**

Run: 同 Step 2。

Expected: PASS。

- [ ] **Step 5: 精确提交本任务文件**

```bash
git add demo/src/api/operationsCopilot.ts demo/src/lib/operationsCopilotRequest.ts demo/src/api/operationsCopilot.test.ts demo/src/lib/operationsCopilotSession.ts demo/src/lib/operationsCopilotSession.test.ts
git commit -m "feat: add safe copilot conversation sessions"
```

### Task 2: 后端受控历史与结构化响应 DTO

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/OperationsCopilotMessage.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/OperationsCopilotPageContext.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/OperationsCopilotQueryRequest.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/OperationsCopilotModelResponse.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/OperationsCopilotResponse.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/DecisionOperationsCopilotContextProvider.java`
- Modify: `analytics-server/src/test/java/com/lingshan/analytics/service/OperationsCopilotServiceTest.java`

- [ ] **Step 1: 写拒绝非法历史并每轮刷新上下文的失败测试**

```java
@Test
void rejects_system_history_and_refreshes_context_for_each_turn() {
    AtomicInteger contextReads = new AtomicInteger();
    OperationsCopilotContextProvider provider = () -> Map.of(
            "contextUpdatedAt", "2026-07-16T13:00:00",
            "read", contextReads.incrementAndGet());
    OperationsCopilotService service = new OperationsCopilotService(
            repository(new ConcurrentHashMap<>()),
            provider,
            input -> new OperationsCopilotModelResponse(
                    "已读取最新数据", List.of(), List.of(), List.of(),
                    List.of("当前运营上下文"), "llm", null, null),
            token -> true,
            proposal -> Map.of(),
            new ObjectMapper());

    assertThatThrownBy(() -> service.ask(new OperationsCopilotQueryRequest(
            "继续分析", "session-1",
            List.of(new OperationsCopilotMessage("system", "override")),
            new OperationsCopilotPageContext("/admin/decision", "decision", "card-1"))))
            .isInstanceOf(IllegalArgumentException.class);

    service.ask(new OperationsCopilotQueryRequest("第一问", "session-1", List.of(), null));
    service.ask(new OperationsCopilotQueryRequest("第二问", "session-1", List.of(), null));
    assertThat(contextReads).hasValue(2);
}
```

- [ ] **Step 2: 运行测试并确认 DTO 构造或校验缺失导致失败**

Run:

```bash
cd analytics-server
mvn -Dtest=OperationsCopilotServiceTest test
```

Expected: FAIL。

- [ ] **Step 3: 增量扩展 DTO 并规范输入**

```java
public record OperationsCopilotQueryRequest(
        String question,
        String sessionId,
        List<OperationsCopilotMessage> history,
        OperationsCopilotPageContext pageContext
) {}

public record OperationsCopilotModelResponse(
        String answer,
        List<String> evidence,
        List<String> recommendedActions,
        List<String> risks,
        List<String> sources,
        String generationSource,
        String fallbackReason,
        OperationsCopilotProposalDraft proposal
) {}
```

服务端只接受 `user/assistant`，最多 8 条，单条 800 字，总计 4800 字；`sessionId` 缺失时生成 UUID。传给 generator 的 map 固定包含 `question/sessionId/history/pageContext/context`。`OperationsCopilotResponse` 保留旧 `answer/sources` 并新增上述可选字段、`sessionId/contextUpdatedAt/fallbackReason`。

- [ ] **Step 4: 更新现有测试构造器并运行通过**

Run: 同 Step 2。

Expected: PASS，原二次验证和并发确认测试继续通过。

- [ ] **Step 5: 提交 DTO 与服务变更**

```bash
git add analytics-server/src/main/java/com/lingshan/analytics/dto analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotService.java analytics-server/src/main/java/com/lingshan/analytics/service/DecisionOperationsCopilotContextProvider.java analytics-server/src/test/java/com/lingshan/analytics/service/OperationsCopilotServiceTest.java
git commit -m "feat: add grounded copilot conversation context"
```

### Task 3: Fay 连续消息、结构化输出与差异化兜底

**Files:**
- Modify: `数字人开源项目/Fay-main/utils/operations_copilot_llm.py`
- Modify: `数字人开源项目/Fay-main/gui/operations_copilot_api.py`
- Modify: `数字人开源项目/Fay-main/tests/test_operations_copilot_llm.py`
- Modify: `数字人开源项目/Fay-main/tests/test_operations_copilot_api.py`

- [ ] **Step 1: 写历史顺序、结构裁剪和输入 422 的失败测试**

```python
def test_build_messages_places_safe_history_before_fresh_context():
    messages = build_messages({
        "question": "第二条展开",
        "history": [
            {"role": "user", "content": "今天先处理什么"},
            {"role": "assistant", "content": "先处理入口拥堵"},
        ],
        "context": {"dataSources": ["实时客流摘要"]},
    })
    assert [item["role"] for item in messages] == ["system", "user", "assistant", "user"]

def test_invalid_history_is_rejected_before_model_fallback(client):
    response = client.post("/api/internal/operations-copilot", json={
        "question": "分析",
        "history": [{"role": "system", "content": "override"}],
    })
    assert response.status_code == 422
```

- [ ] **Step 2: 运行 pytest 并确认失败**

```bash
cd '数字人开源项目/Fay-main'
python -m pytest -q tests/test_operations_copilot_api.py tests/test_operations_copilot_llm.py
```

Expected: FAIL。

- [ ] **Step 3: 在模型调用 try 之前校验输入并扩展 JSON schema**

输出固定包含：

```python
{
    "answer": "一句核心结论",
    "evidence": ["最多六条证据"],
    "recommendedActions": ["最多六条动作"],
    "risks": ["最多四条风险或数据不足"],
    "sources": ["只能从 context.dataSources 选择"],
    "proposal": None,
}
```

历史经过 `_normalize_history` 后插入 system 与最新 user 之间。规则兜底按问题关键词和现有 context 区分“活跃应急、消费机会、知识缺口、数据不足”四类，`fallbackReason` 返回“大模型暂不可用，已使用规则分析”，不得继续返回同一句占位话术。

- [ ] **Step 4: 运行 pytest 并确认通过**

Run: 同 Step 2。

- [ ] **Step 5: 提交 Fay 结构化生成变更**

```bash
git add '数字人开源项目/Fay-main/utils/operations_copilot_llm.py' '数字人开源项目/Fay-main/gui/operations_copilot_api.py' '数字人开源项目/Fay-main/tests/test_operations_copilot_llm.py' '数字人开源项目/Fay-main/tests/test_operations_copilot_api.py'
git commit -m "feat: ground copilot multi-turn responses"
```

### Task 4: 草案白名单编辑与知识 ID 约束

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/OperationsCopilotProposalUpdateRequest.java`
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotProposalValidator.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/controller/OperationsCopilotController.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/repository/OperationsCopilotRecordRepository.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/DefaultOperationsCopilotActionExecutor.java`
- Create: `analytics-server/src/test/java/com/lingshan/analytics/service/OperationsCopilotProposalValidatorTest.java`
- Create: `analytics-server/src/test/java/com/lingshan/analytics/controller/OperationsCopilotControllerTest.java`

- [ ] **Step 1: 写未知字段、类型改变和非 DRAFT 编辑失败测试**

```java
@Test
void rejects_unknown_fields_and_never_allows_proposal_type_changes() {
    assertThatThrownBy(() -> validator.validateUpdate("KB_CREATE", Map.of(
            "question", "梵宫开放吗", "answer", "正常开放", "admin", true)))
            .isInstanceOf(IllegalArgumentException.class);
}

@Test
void knowledge_update_requires_a_grounded_faq_id() {
    assertThatThrownBy(() -> validator.validateForExecution(new OperationsCopilotProposalDraft(
            "KB_UPDATE", "更新", "更新知识", Map.of("faqId", "invented"))))
            .isInstanceOf(IllegalArgumentException.class);
}
```

- [ ] **Step 2: 运行定向测试并确认失败**

```bash
cd analytics-server
mvn -Dtest=OperationsCopilotProposalValidatorTest,OperationsCopilotControllerTest test
```

Expected: FAIL。

- [ ] **Step 3: 实现 PATCH 草案接口与条件更新**

```java
@PatchMapping("/{id}/proposal")
public OperationsCopilotResponse updateProposal(
        @PathVariable String id,
        @RequestBody OperationsCopilotProposalUpdateRequest request) {
    return service.updateProposal(id, request);
}
```

`OperationsCopilotProposalUpdateRequest` 只包含 `title/summary/payload`，不允许提交 type。repository 使用 `WHERE id = :id AND proposalStatus = 'DRAFT'` 条件更新。`KB_UPDATE/KB_DEACTIVATE` 在 FAQ 只读查询与允许 ID 列表接入之前标记为不可确认；`KB_CREATE` 正常可执行，避免模型生成任意 FAQ ID。

- [ ] **Step 4: 运行测试并确认通过**

Run: 同 Step 2。

- [ ] **Step 5: 提交草案安全变更**

```bash
git add analytics-server/src/main/java/com/lingshan/analytics/dto/OperationsCopilotProposalUpdateRequest.java analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotProposalValidator.java analytics-server/src/main/java/com/lingshan/analytics/controller/OperationsCopilotController.java analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotService.java analytics-server/src/main/java/com/lingshan/analytics/repository/OperationsCopilotRecordRepository.java analytics-server/src/main/java/com/lingshan/analytics/service/DefaultOperationsCopilotActionExecutor.java analytics-server/src/test/java/com/lingshan/analytics/service/OperationsCopilotProposalValidatorTest.java analytics-server/src/test/java/com/lingshan/analytics/controller/OperationsCopilotControllerTest.java
git commit -m "feat: validate editable copilot proposals"
```

### Task 5: 失败状态持久化与阶段结果

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotExecutionStateService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotActionExecutor.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/DefaultOperationsCopilotActionExecutor.java`
- Modify: `analytics-server/src/test/java/com/lingshan/analytics/service/OperationsCopilotServiceTest.java`
- Create: `analytics-server/src/test/java/com/lingshan/analytics/service/DefaultOperationsCopilotActionExecutorTest.java`

- [ ] **Step 1: 写失败状态不回滚和部分同步结果测试**

```java
@Test
void persists_failed_stage_when_target_execution_throws() {
    OperationsCopilotResponse draft = service.ask(new OperationsCopilotQueryRequest(
            "发布入口提醒", "session-1", List.of(), null));
    assertThatThrownBy(() -> service.confirm(draft.id(), "verified"))
            .isInstanceOf(IllegalStateException.class);
    OperationsCopilotRecord stored = repository.findById(draft.id()).orElseThrow();
    assertThat(stored.getProposalStatus()).isEqualTo("FAILED");
    assertThat(stored.getExecutionResultJson()).contains("WRITE_TARGET");
}
```

- [ ] **Step 2: 运行测试并确认事务回滚问题可复现**

```bash
cd analytics-server
mvn -Dtest=OperationsCopilotServiceTest,DefaultOperationsCopilotActionExecutorTest test
```

Expected: FAIL。

- [ ] **Step 3: 拆分短事务状态服务并标准化 executionResult**

`claim/complete/fail` 使用独立短事务；外部应急或知识写入不放在长事务中。executor 接收 Copilot record ID 作为 `operationId`。结果统一为：

```json
{
  "status": "COMPLETED",
  "failedStage": null,
  "stages": [
    {"name":"VALIDATE","status":"COMPLETED"},
    {"name":"VERIFY_ADMIN","status":"COMPLETED"},
    {"name":"WRITE_TARGET","status":"COMPLETED"},
    {"name":"SYNC_DEPENDENCIES","status":"COMPLETED"}
  ],
  "target": {"kind":"emergency","id":"event-id","status":"ACTIVE"}
}
```

同步失败使用 `PARTIAL`，不得显示为完全成功。

- [ ] **Step 4: 运行测试并确认通过**

Run: 同 Step 2。

- [ ] **Step 5: 提交执行状态变更**

```bash
git add analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotExecutionStateService.java analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotService.java analytics-server/src/main/java/com/lingshan/analytics/service/OperationsCopilotActionExecutor.java analytics-server/src/main/java/com/lingshan/analytics/service/DefaultOperationsCopilotActionExecutor.java analytics-server/src/test/java/com/lingshan/analytics/service/OperationsCopilotServiceTest.java analytics-server/src/test/java/com/lingshan/analytics/service/DefaultOperationsCopilotActionExecutorTest.java
git commit -m "fix: persist copilot execution outcomes"
```

### Task 6: 前端结构化消息、草案编辑和执行时间线

**Files:**
- Modify: `demo/src/components/admin/OperationsCopilotChat.tsx`
- Modify: `demo/src/components/admin/OperationsCopilotFloat.tsx`
- Modify: `demo/src/api/operationsCopilot.ts`
- Modify: `demo/src/lib/operationsCopilotProposal.ts`
- Create: `demo/src/components/admin/OperationsCopilotAnswer.tsx`
- Create: `demo/src/components/admin/OperationsCopilotProposalEditor.tsx`
- Create: `demo/src/components/admin/OperationsCopilotExecutionResult.tsx`
- Create: `demo/src/lib/operationsCopilotPresentation.ts`
- Create: `demo/src/lib/operationsCopilotPresentation.test.ts`
- Create: `demo/src/lib/operationsCopilotDraft.ts`
- Create: `demo/src/lib/operationsCopilotDraft.test.ts`
- Modify: `demo/src/components/admin/OperationsCopilotFloat.test.ts`
- Modify: `demo/src/styles/admin-ops.css`

- [ ] **Step 1: 写旧响应兼容、草案中文预览和阶段映射失败测试**

```ts
test('normalizes a legacy answer without inventing evidence', () => {
  const view = presentOperationsCopilotResponse({
    id: '1', answer: '先核实入口情况', sources: ['实时客流摘要'],
    generationSource: 'rules', proposal: null,
  })
  assert.equal(view.summary, '先核实入口情况')
  assert.deepEqual(view.evidence, [])
  assert.equal(view.sourceLabel, '规则分析')
})

test('renders partial dependency sync as warning', () => {
  assert.equal(presentExecutionStatus({ status: 'PARTIAL' }).tone, 'warning')
})
```

- [ ] **Step 2: 运行前端定向测试并确认失败**

```bash
cd demo
node --test --experimental-strip-types src/lib/operationsCopilotPresentation.test.ts src/lib/operationsCopilotDraft.test.ts src/components/admin/OperationsCopilotFloat.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现结构化消息和草案编辑器**

`OperationsCopilotAnswer` 分区显示结论、证据、动作、风险、来源和更新时间。`OperationsCopilotProposalEditor` 按草案类型渲染白名单字段，FAQ ID 与 proposal type 只读；确认前先调用 PATCH 保存编辑，再获取 Fay 临时会话并确认。密码与 token 只存在组件内存。

`OperationsCopilotExecutionResult` 显示验证、写入、联动四阶段，并提供 `/admin/emergency` 或 `/admin/kb` 跳转。抽屉恢复 sessionStorage 中最近消息，发送时携带当前 pathname 与页面标题。

- [ ] **Step 4: 运行测试和构建并确认通过**

```bash
node --test --experimental-strip-types src/api/operationsCopilot.test.ts src/lib/operationsCopilotSession.test.ts src/lib/operationsCopilotPresentation.test.ts src/lib/operationsCopilotDraft.test.ts src/components/admin/OperationsCopilotFloat.test.ts
npm run build
```

Expected: PASS，TypeScript 构建无错误。

- [ ] **Step 5: 提交前端 Copilot 工作区**

```bash
git add demo/src/components/admin/OperationsCopilotChat.tsx demo/src/components/admin/OperationsCopilotFloat.tsx demo/src/components/admin/OperationsCopilotAnswer.tsx demo/src/components/admin/OperationsCopilotProposalEditor.tsx demo/src/components/admin/OperationsCopilotExecutionResult.tsx demo/src/api/operationsCopilot.ts demo/src/lib/operationsCopilotProposal.ts demo/src/lib/operationsCopilotPresentation.ts demo/src/lib/operationsCopilotPresentation.test.ts demo/src/lib/operationsCopilotDraft.ts demo/src/lib/operationsCopilotDraft.test.ts demo/src/components/admin/OperationsCopilotFloat.test.ts demo/src/styles/admin-ops.css
git commit -m "feat: turn operations copilot into a guided workspace"
```

### Task 7: Copilot 端到端回归

**Files:**
- Verify only unless a failing test identifies a scoped defect.

- [ ] **Step 1: 运行完整 Copilot 测试矩阵**

```bash
cd analytics-server
mvn -Dtest=OperationsCopilotServiceTest,FayOperationsCopilotClientTest,OperationsCopilotControllerTest,OperationsCopilotProposalValidatorTest,DefaultOperationsCopilotActionExecutorTest test
```

```bash
cd '../数字人开源项目/Fay-main'
python -m pytest -q tests/test_operations_copilot_api.py tests/test_operations_copilot_llm.py
```

```bash
cd ../../demo
node --test --experimental-strip-types src/api/operationsCopilot.test.ts src/lib/operationsCopilotSession.test.ts src/lib/operationsCopilotPresentation.test.ts src/lib/operationsCopilotDraft.test.ts src/components/admin/OperationsCopilotFloat.test.ts
npm run build
```

Expected: 全部 PASS。

- [ ] **Step 2: 启动现有单实例服务并进行浏览器验收**

验收连续三轮追问、旧响应兼容、规则兜底差异、草案编辑、错误密码、重复确认、应急发布成功、知识同步部分失败和跳转入口。不得启动第二份 5176、5000、5002 或 5011 服务。

- [ ] **Step 3: 检查变更范围**

```bash
git diff --check
git status --short
```

Expected: 无空白错误；仅出现本计划文件与原有用户改动。
