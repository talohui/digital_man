# 百度情绪上下文接入灵山 RAG 设计

## 目标

在不改变灵山知识库召回、事实匹配和排序的前提下，把游客提问的百度情感倾向结果传入 `query_lingshan_rag` 的 `emotion_context` 参数，使回答语气随游客情绪变化。

## 边界

- 情绪仅影响回答策略，不影响 Chroma 检索、FAQ 命中、引用来源或拒答判断。
- 仅对灵山预启动工具 `query_lingshan_rag` 注入上下文；其他 MCP 工具保持原样。
- 百度接口不可用、凭据缺失或解析异常时，不中断问答，也不伪造情绪结论。
- 不修改 `llm/nlp_cognitive_stream.py`、RAG 索引、知识库内容或已有预启动配置文件。

## 数据流

```text
游客原始问题
  -> Fay MCP 预启动桥接
  -> 百度 sentiment_classify
  -> emotion_context
  -> query_lingshan_rag(query, emotion_context)
  -> RAG 既有回答提示词中的情绪策略
  -> 基于事实资料的回答
```

`emotion_context` 使用已有 RAG 接口：

```json
{
  "emotion": "anxious | neutral | happy",
  "polarity": "negative | neutral | positive",
  "confidence": 1.0,
  "action": { "affect": "comforting | neutral | warm" }
}
```

百度当前接口仅返回 `0 / 1 / 2`，因此 `confidence` 设为 `1.0` 表示分类结果可用，不把它描述为百度概率置信度。映射为：`0 -> anxious/negative/comforting`、`1 -> neutral/neutral/neutral`、`2 -> happy/positive/warm`。

## 实现单元

1. 新建 Fay 的纯函数模块，负责把百度数值映射为 `emotion_context`；它不做网络请求，便于单测。
2. 在 `faymcp/mcp_service.py` 的预启动参数填充后，仅为 `query_lingshan_rag` 调用百度分析并附加映射结果。
3. 分析失败时省略 `emotion_context`，RAG 保持当前自然、准确的默认回答策略。
4. RAG 无需改动：`mcp_server/server.py` 和 `scripts/rag_utils.py` 已接收并消费该参数。

## 验证

- 单测数值映射：负面、 中性、正面及无结果。
- 单测预启动注入：灵山 RAG 获得结构化参数，其他工具参数不变。
- 单测失败回退：分析函数抛错时仍发起原有 RAG 查询，且不含 `emotion_context`。
- 手工联调：提出“我有点担心迷路，怎么去梵宫？”；回答应先安抚并给清晰步骤，且引用来源保持正常。
