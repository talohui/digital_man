#!/usr/bin/env python3
"""STDIO MCP server for the Lingshan RAG knowledge base."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

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


if __name__ == "__main__":
    mcp.run()
