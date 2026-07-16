# Decision Evidence Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将智能决策页改造成“判断、证据、行动、结果”工作区，并修复已接受动作仍显示“转为待办”的状态错误。

**Architecture:** 后端构建可信证据目录，大模型只能引用证据 ID；旧 evidence 文本继续保留以兼容历史快照。前端使用统一展示模型完成中文单位、来源、时间窗口、优先级筛选和真实 DecisionAction 状态恢复。

**Tech Stack:** Spring Boot、JPA、Fay Python、React、TypeScript、Ant Design、node:test、JUnit 5、pytest。

---

### Task 1: 修复 DecisionAction 状态恢复

**Files:**
- Modify: `demo/src/api/decisionOps.ts`
- Modify: `demo/src/components/admin/DecisionActionPanel.tsx`
- Modify: `demo/src/pages/AdminMarketingDecisionPage.tsx`
- Modify: `demo/src/pages/AdminMarketingDecisionPage.test.ts`
- Create: `demo/src/lib/decisionActionState.ts`
- Create: `demo/src/lib/decisionActionState.test.ts`

- [ ] **Step 1: 写已有动作按 cardId 与 actionText 恢复的失败测试**

```ts
test('uses card id and action text as a stable action key', () => {
  const actions = indexDecisionActions([{ id: 'todo-1', cardId: 'card-1', actionText: '发布提醒', status: 'ACCEPTED' }])
  assert.equal(actions['card-1::发布提醒'].id, 'todo-1')
})
```

- [ ] **Step 2: 运行测试并确认失败**

```bash
cd demo
node --test --experimental-strip-types src/lib/decisionActionState.test.ts src/pages/AdminMarketingDecisionPage.test.ts
```

- [ ] **Step 3: 保存完整 DecisionAction 并传入面板**

`DecisionActionPanel` 新增 `initialAction?: DecisionAction`。打开已接受动作时直接加载现有 ID 与状态，不重复创建；状态更新后页面立即替换按钮。无 cardId 的旧响应使用 `cardTitle + actionText` 兼容键。

- [ ] **Step 4: 运行测试、构建并提交**

```bash
node --test --experimental-strip-types src/lib/decisionActionState.test.ts src/pages/AdminMarketingDecisionPage.test.ts
npm run build
git add demo/src/api/decisionOps.ts demo/src/components/admin/DecisionActionPanel.tsx demo/src/pages/AdminMarketingDecisionPage.tsx demo/src/pages/AdminMarketingDecisionPage.test.ts demo/src/lib/decisionActionState.ts demo/src/lib/decisionActionState.test.ts
git commit -m "fix: restore accepted decision action state"
```

### Task 2: 后端可信证据目录与 ID 引用

**Files:**
- Create: `analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionEvidenceFact.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionCard.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/DecisionInput.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/MarketingDecisionService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/MarketingDecisionEngine.java`
- Modify: `analytics-server/src/test/java/com/lingshan/analytics/service/MarketingDecisionServiceTest.java`

- [ ] **Step 1: 写未知证据 ID 强制规则兜底测试**

```java
@Test
void rejects_model_cards_that_reference_unknown_evidence_ids() {
    DecisionResponse response = service.getDecisionCards(true);
    assertThat(response.generationSource()).isEqualTo("rules");
    assertThat(response.fallbackReason()).contains("证据引用无效");
}
```

- [ ] **Step 2: 运行测试并确认失败**

```bash
cd analytics-server
mvn -Dtest=MarketingDecisionServiceTest test
```

- [ ] **Step 3: 构建 evidenceCatalog 并保持旧字段兼容**

```java
public record DecisionEvidenceFact(
        String id,
        String metricKey,
        String label,
        String displayValue,
        String sourceLabel,
        String observedAt,
        String windowStart,
        String windowEnd,
        String freshness,
        boolean historicalBaseline
) {}
```

`DecisionCard` 保留 `List<String> evidence`，新增 `List<String> evidenceRefs` 和解析后的 `List<DecisionEvidenceFact> evidenceFacts`。规则引擎和大模型都只能引用目录内 ID；未知引用让整个模型结果进入规则兜底。

- [ ] **Step 4: 运行测试并提交**

```bash
mvn -Dtest=MarketingDecisionServiceTest,MarketingDecisionEngineTest test
git add analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionEvidenceFact.java analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionCard.java analytics-server/src/main/java/com/lingshan/analytics/service/DecisionInput.java analytics-server/src/main/java/com/lingshan/analytics/service/MarketingDecisionService.java analytics-server/src/main/java/com/lingshan/analytics/service/MarketingDecisionEngine.java analytics-server/src/test/java/com/lingshan/analytics/service/MarketingDecisionServiceTest.java
git commit -m "feat: ground decision cards in trusted evidence"
```

### Task 3: Fay 只返回证据 ID

**Files:**
- Modify: `数字人开源项目/Fay-main/utils/marketing_decision_llm.py`
- Modify: `数字人开源项目/Fay-main/tests/test_marketing_decision_llm.py`

- [ ] **Step 1: 写模型不能编造 evidence 文本的失败测试**

```python
def test_decision_cards_only_reference_known_evidence_ids():
    result = validate_decision_payload(payload, {"evidenceCatalog": [{"id": "metric-1"}]})
    assert result["cards"][0]["evidenceRefs"] == ["metric-1"]
```

- [ ] **Step 2: 运行 pytest 并确认失败**

```bash
cd '数字人开源项目/Fay-main'
python -m pytest -q tests/test_marketing_decision_llm.py
```

- [ ] **Step 3: 更新提示 schema 与校验器**

模型输出使用 `evidenceRefs`，值只能来自输入的 evidenceCatalog；旧 `evidence` 由 analytics 根据可信事实生成，不接受模型提供的指标值。

- [ ] **Step 4: 运行测试并提交**

```bash
python -m pytest -q tests/test_marketing_decision_llm.py
git add utils/marketing_decision_llm.py tests/test_marketing_decision_llm.py
git commit -m "feat: constrain marketing decisions to evidence ids"
```

### Task 4: 历史快照保存结构化证据

**Files:**
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/service/DecisionHistoryService.java`
- Modify: `analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionSnapshotDetail.java`
- Modify: `analytics-server/src/test/java/com/lingshan/analytics/service/DecisionHistoryServiceTest.java`

- [ ] **Step 1: 写结构化证据往返保存测试**

```java
@Test
void restores_evidence_source_window_and_historical_flag() {
    DecisionSnapshotDetail detail = service.detail(savedId);
    DecisionEvidenceFact fact = detail.cards().get(0).evidenceFacts().get(0);
    assertThat(fact.sourceLabel()).isEqualTo("官方历史样本");
    assertThat(fact.historicalBaseline()).isTrue();
}
```

- [ ] **Step 2: 运行测试并确认失败，实现 JSON 兼容读取**

```bash
cd analytics-server
mvn -Dtest=DecisionHistoryServiceTest test
```

旧快照没有 evidenceFacts 时返回空列表，不报错；新快照完整保存来源、时间窗口和历史标识。

- [ ] **Step 3: 运行测试并提交**

```bash
mvn -Dtest=DecisionHistoryServiceTest test
git add analytics-server/src/main/java/com/lingshan/analytics/service/DecisionHistoryService.java analytics-server/src/main/java/com/lingshan/analytics/dto/DecisionSnapshotDetail.java analytics-server/src/test/java/com/lingshan/analytics/service/DecisionHistoryServiceTest.java
git commit -m "feat: preserve structured decision evidence history"
```

### Task 5: 决策展示模型、筛选和中文证据

**Files:**
- Create: `demo/src/lib/adminDecisionPresentation.ts`
- Create: `demo/src/lib/adminDecisionPresentation.test.ts`
- Modify: `demo/src/lib/decisionEvidenceLabels.ts`
- Modify: `demo/src/lib/decisionEvidenceLabels.test.ts`
- Modify: `demo/src/components/admin/DecisionEvidenceDrawer.tsx`
- Modify: `demo/src/components/admin/DecisionHistoryDrawer.tsx`
- Modify: `demo/src/pages/AdminMarketingDecisionPage.tsx`
- Modify: `demo/src/pages/AdminMarketingDecisionPage.test.ts`
- Modify: `demo/src/styles/admin-ops.css`

- [ ] **Step 1: 写筛选、主决策、中文布尔和单位测试**

```ts
test('selects the highest priority visible card as primary', () => {
  const view = buildDecisionWorkspace(cards, { type: '全部', priority: '全部', status: '全部' }, actions)
  assert.equal(view.primary.priority, '高')
})

test('formats evidence without raw json or english booleans', () => {
  assert.equal(formatDecisionEvidenceValue('heatmapHot', true), '存在实时热区')
  assert.equal(formatDecisionEvidenceValue('p90LatencyMs', 860), '860 毫秒')
})
```

- [ ] **Step 2: 运行测试并确认失败**

```bash
cd demo
node --test --experimental-strip-types src/lib/adminDecisionPresentation.test.ts src/lib/decisionEvidenceLabels.test.ts src/pages/AdminMarketingDecisionPage.test.ts
```

- [ ] **Step 3: 实现判断、证据、行动、结果布局**

顶部保留摘要、时间、来源、缓存和历史。主体突出一条最高优先级决策，其余使用紧凑列表，并提供类型、优先级和状态筛选。证据抽屉按指标、数值、来源、窗口、新鲜度展示；历史样本明确标注“不代表当前实时成交”。决策为空时不显示默认来源数组。

- [ ] **Step 4: 运行测试、构建并提交**

```bash
node --test --experimental-strip-types src/lib/adminDecisionPresentation.test.ts src/lib/decisionEvidenceLabels.test.ts src/lib/decisionActionState.test.ts src/pages/AdminMarketingDecisionPage.test.ts
npm run build
git add demo/src/lib/adminDecisionPresentation.ts demo/src/lib/adminDecisionPresentation.test.ts demo/src/lib/decisionEvidenceLabels.ts demo/src/lib/decisionEvidenceLabels.test.ts demo/src/components/admin/DecisionEvidenceDrawer.tsx demo/src/components/admin/DecisionHistoryDrawer.tsx demo/src/pages/AdminMarketingDecisionPage.tsx demo/src/pages/AdminMarketingDecisionPage.test.ts demo/src/styles/admin-ops.css
git commit -m "feat: make decision evidence readable and actionable"
```

### Task 6: 决策工作区验收

**Files:**
- Verify only unless a failing test identifies a scoped defect.

- [ ] **Step 1: 运行后端、Fay 和前端矩阵**

```bash
cd analytics-server
mvn -Dtest=MarketingDecisionServiceTest,MarketingDecisionEngineTest,DecisionHistoryServiceTest,DecisionActionServiceTest test
```

```bash
cd '../数字人开源项目/Fay-main'
python -m pytest -q tests/test_marketing_decision_llm.py
```

```bash
cd ../../demo
node --test --experimental-strip-types src/lib/adminDecisionPresentation.test.ts src/lib/decisionEvidenceLabels.test.ts src/lib/decisionActionState.test.ts src/pages/AdminMarketingDecisionPage.test.ts
npm run build
```

- [ ] **Step 2: 浏览器验收**

确认最高优先级突出、筛选正确、证据无 camelCase/true/false/原始 JSON、历史样本有醒目标识、接受动作后立即显示“已接受”，重新打开面板不会重复创建。

- [ ] **Step 3: 检查变更范围**

```bash
git diff --check
git status --short
```
