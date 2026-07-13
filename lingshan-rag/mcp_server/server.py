#!/usr/bin/env python3
"""STDIO MCP server for the Lingshan RAG knowledge base."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

# HuggingFace 离线模式:本地 SentenceTransformer 嵌入模型已缓存，
# 跳过启动时去 HF Hub 的联网更新检查（实测可消除首次查询 ~24s 的冷启动尖峰）。
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

# 阿里云百炼 LLM 配置（与 Fay system.conf 保持一致）。
# 服务器部署时从环境变量或 Fay 的 mcp_servers.json env 块注入 Key；
# 不要把真实 Key 写进仓库。
os.environ.setdefault("LINGSHAN_LLM_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
os.environ.setdefault("LINGSHAN_LLM_MODEL", "qwen-plus")

from mcp.server.fastmcp import FastMCP


PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from rag_utils import answer_question, get_runtime_status  # noqa: E402


mcp = FastMCP(
    "lingshan_rag",
    instructions=(
        "Tools for querying the local Lingshan scenic-area RAG knowledge base. "
        "Use lingshan_rag_status first to confirm data paths and model config, "
        "then call query_lingshan_rag for knowledge-base answers."
    ),
)


@mcp.tool()
def lingshan_rag_status() -> dict[str, Any]:
    """Return runtime status for the local Lingshan RAG MCP service."""
    return get_runtime_status()


@mcp.tool()
def query_lingshan_rag(query: str, top_k: int = 5, use_llm: bool = True) -> dict[str, Any]:
    """Query the local Lingshan RAG knowledge base.

    Args:
        query: User question in Chinese.
        top_k: Number of retrieval candidates to keep, clamped to 1-10.
        use_llm: Whether to use online LLM polishing when env vars are configured.
    """
    top_k = min(max(top_k, 1), 10)
    result = answer_question(query=query, top_k=top_k, use_llm=use_llm)
    faq = result["faq"]

    return {
        "query": result["query"],
        "answer": result["answer"],
        # 回传 top-3 命中原文,让 Fay 的 Qwen 基于真实知识库片段 grounding,
        # 而不是只拿到一句弱本地答案后凭参数记忆补全(幻觉根因)。
        "context": _format_context(result.get("hits") or []),
        "references": result["references"],
        "used_llm": result["used_llm"],
        "llm_error": result["llm_error"],
        "faq": {
            "question": faq["question"],
            "answer": faq["answer"],
        }
        if faq
        else None,
        "retrieval_count": len(result["hits"]),
    }


def _format_context(hits: list, limit: int = 3) -> str:
    """把 top-N 命中 chunk 拼成可读知识库原文,供数字人 grounding。"""
    blocks = []
    for hit in hits[:limit]:
        meta = hit.get("metadata") or {}
        path = meta.get("section_path", "")
        text = (hit.get("text") or "").strip()
        if not text:
            continue
        head = f"【{path}】\n" if path else ""
        blocks.append(head + text)
    return "\n\n".join(blocks)


if __name__ == "__main__":
    mcp.run()
