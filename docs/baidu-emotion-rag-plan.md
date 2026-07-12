# 百度情绪上下文接入灵山 RAG 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将百度情感倾向结果以结构化 `emotion_context` 传给灵山 RAG，并只改变回答语气策略。

**Architecture:** 在 Fay 的 MCP 预启动层对 `query_lingshan_rag` 单独补充情绪上下文。纯函数模块负责数值映射与失败回退，`mcp_service.py` 仅调用该模块并将结果加入已有工具参数。RAG 侧现有接口直接消费该参数，无需更改检索代码。

**Tech Stack:** Python 3.14、Fay MCP、pytest、现有百度 `sentiment_classify` 封装、灵山 RAG MCP。

---

### Task 1: 情绪上下文纯函数

**Files:**
- Create: `数字人开源项目/Fay-main/faymcp/emotion_context.py`
- Test: `数字人开源项目/Fay-main/tests/test_lingshan_emotion_context.py`

- [ ] **Step 1: 写失败测试**

```python
from faymcp.emotion_context import build_emotion_context

def test_build_emotion_context_maps_baidu_negative_to_comforting():
    assert build_emotion_context(0) == {
        "emotion": "anxious", "polarity": "negative", "confidence": 1.0,
        "action": {"affect": "comforting"},
    }

```

- [ ] **Step 2: 验证测试确实失败**

Run: `/Users/MR/.pyenv/versions/3.14.3/bin/python -m pytest tests/test_lingshan_emotion_context.py -q -p no:cacheprovider`

Expected: 因 `faymcp.emotion_context` 不存在而失败。

- [ ] **Step 3: 最小实现**

实现 `build_emotion_context(sentiment)`，仅接受 `0/1/2`；分别返回负面安抚、中性自然、正面热情上下文。未知值返回 `None`。

- [ ] **Step 4: 验证转绿**

Run: `/Users/MR/.pyenv/versions/3.14.3/bin/python -m pytest tests/test_lingshan_emotion_context.py -q -p no:cacheprovider`

Expected: PASS。

### Task 2: Fay MCP 预启动注入

**Files:**
- Modify: `数字人开源项目/Fay-main/faymcp/mcp_service.py`
- Modify: `数字人开源项目/Fay-main/tests/test_lingshan_emotion_context.py`

- [ ] **Step 1: 扩充失败测试**

```python
def test_build_lingshan_rag_params_injects_positive_context():
    from faymcp.emotion_context import build_lingshan_rag_params
    params = build_lingshan_rag_params(
        "query_lingshan_rag", {"query": "灵山大佛在哪"}, "灵山大佛在哪", lambda _: 2
    )
    assert params["emotion_context"]["polarity"] == "positive"
    assert params["emotion_context"]["action"]["affect"] == "warm"
```

- [ ] **Step 2: 验证新增断言先失败**

Run: `/Users/MR/.pyenv/versions/3.14.3/bin/python -m pytest tests/test_lingshan_emotion_context.py::test_build_lingshan_rag_params_injects_positive_context -q -p no:cacheprovider`

Expected: 因 `build_lingshan_rag_params` 尚不存在而失败。

- [ ] **Step 3: 接入预启动调用点**

在纯函数模块实现 `build_lingshan_rag_params(tool_name, params, question, analyzer)`：非灵山工具原样返回；分析成功则复制参数并加入 `emotion_context`；异常、空结果或未知值时原样返回。随后在 `call_all_prestart_tools()` 中，紧接 `_apply_question_placeholder()` 后调用它。分析器为 `ai_module.baidu_emotion.get_sentiment`；只有 `query_lingshan_rag` 获得上下文。不得打印 Key 或中断工具调用。

- [ ] **Step 4: 验证 Fay 测试集**

Run: `/Users/MR/.pyenv/versions/3.14.3/bin/python -m pytest tests/test_lingshan_emotion_context.py tests/test_service_config.py tests/test_service_config_api.py -q -p no:cacheprovider`

Expected: 全部 PASS。

### Task 3: 静态与运行联调

**Files:**
- Verify: `lingshan-rag/mcp_server/server.py`
- Verify: `lingshan-rag/scripts/rag_utils.py`

- [ ] **Step 1: 静态检查**

Run: `git diff --check -- faymcp/mcp_service.py faymcp/emotion_context.py tests/test_lingshan_emotion_context.py`

Expected: 无输出。

- [ ] **Step 2: RAG 参数通路检查**

Run: `rg -n "emotion_context" /Users/MR/Desktop/软件杯/lingshan-rag/mcp_server/server.py /Users/MR/Desktop/软件杯/lingshan-rag/scripts/rag_utils.py`

Expected: `query_lingshan_rag` 接收参数，`build_answer_prompt` 写入情绪化回答策略。

- [ ] **Step 3: 手工端到端验证**

在 C 端发送“我有点担心迷路，怎么去梵宫？”。确认 RAG 回答仍引用资料、包含可执行路线建议，并先给出简短安抚；普通事实问答的引用与召回结果不改变。
