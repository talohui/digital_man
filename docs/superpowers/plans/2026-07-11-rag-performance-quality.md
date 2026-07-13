# RAG Performance and Answer Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the 6.6-second embedding cold start out of the first visitor question, make FAQ matching conservative and spot-aware, reduce Fay grounding noise, and produce a truthful regression report.

**Architecture:** Keep the existing BGE-large Chroma collection. Add a small warmup boundary in `rag_utils.py`, score FAQ candidates instead of returning the first substring, centralize compact grounding context formatting, and update the regression script so FAQ and vector paths are assessed by the evidence each path actually returns.

**Tech Stack:** Python 3.14, ChromaDB, SentenceTransformers, FastMCP, `unittest`.

---

### Task 1: Add a testable RAG warmup boundary

**Files:**
- Modify: `lingshan-rag/scripts/rag_utils.py`
- Modify: `lingshan-rag/mcp_server/server.py`
- Create: `lingshan-rag/scripts/test_rag_optimization.py`

- [ ] **Step 1: Write failing warmup tests**

Add tests proving `warmup_rag(searcher=...)` returns `ready=True` with elapsed time for a successful one-result search, and returns `ready=False` with an error string without raising when the searcher fails.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `python scripts/test_rag_optimization.py WarmupTest`

Expected: import failure because `warmup_rag` does not exist.

- [ ] **Step 3: Implement `warmup_rag`**

Use `time.perf_counter()`, call the injected searcher or `search_chroma("灵山胜境", top_k=1)`, and return a dictionary containing `ready`, `elapsed_ms`, `hit_count`, and optional `error`.

- [ ] **Step 4: Prewarm before MCP starts**

In `mcp_server/server.py`, call `warmup_rag()` inside `if __name__ == "__main__"`, log the result to stderr, then always call `mcp.run()` even if warmup reports failure.

- [ ] **Step 5: Run warmup tests and verify GREEN**

Run: `python scripts/test_rag_optimization.py WarmupTest`

Expected: all warmup tests pass.

### Task 2: Make FAQ matching conservative and spot-aware

**Files:**
- Modify: `lingshan-rag/scripts/rag_utils.py`
- Modify: `lingshan-rag/scripts/test_rag_optimization.py`

- [ ] **Step 1: Write failing FAQ tests**

Cover exact punctuation-insensitive matching, polite containment such as `请问灵山大佛有多高呀`, explicit spot conflict such as `梵宫门票多少钱` versus a generic scenic ticket FAQ, multi-question input that must not collapse to one FAQ, and selection of the strongest candidate independent of FAQ file order.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `python scripts/test_rag_optimization.py FaqMatchTest`

Expected: current first-substring implementation selects at least one unsafe candidate.

- [ ] **Step 3: Implement candidate scoring**

Score all candidates. Keep exact normalized match highest; require a minimum four-character core and at least 0.6 length coverage for containment; reject candidates whose explicit spot conflicts with the query; reject generic containment when the query names a spot; and do not return keyword-overlap-only candidates.

- [ ] **Step 4: Run focused and existing scene tests**

Run: `python scripts/test_rag_optimization.py FaqMatchTest && python scripts/test_scene_context.py`

Expected: all tests pass.

### Task 3: Compact the evidence sent to Fay

**Files:**
- Modify: `lingshan-rag/scripts/rag_utils.py`
- Modify: `lingshan-rag/mcp_server/server.py`
- Modify: `lingshan-rag/scripts/test_rag_optimization.py`

- [ ] **Step 1: Write failing context-format tests**

Create synthetic duplicate hits and long chunks. Assert that `format_grounding_context` removes duplicate bodies, preserves section labels, returns at most three blocks, and stays under 2400 characters without cutting in the middle of a sentence when punctuation is available.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `python scripts/test_rag_optimization.py GroundingContextTest`

Expected: import failure because `format_grounding_context` does not exist.

- [ ] **Step 3: Implement compact context formatting**

Add `format_grounding_context(hits, limit=3, max_chars=2400)` to `rag_utils.py`. Deduplicate by normalized text, prefer complete sentences within the remaining budget, and retain `【section_path】` labels.

- [ ] **Step 4: Use the formatter in MCP output**

Remove the local `_format_context` implementation from `mcp_server/server.py`, import the shared formatter, and continue returning `answer`, `context`, and deduplicated `references`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `python scripts/test_rag_optimization.py GroundingContextTest`

Expected: all context tests pass.

### Task 4: Correct the accuracy evaluation contract

**Files:**
- Modify: `lingshan-rag/scripts/07_regression_check.py`
- Modify: `lingshan-rag/scripts/test_rag_optimization.py`

- [ ] **Step 1: Write a failing evaluation test**

Extract a pure `evaluate_case(case, result)` helper. Test that a correct FAQ answer with no vector hits passes answer-keyword checks, while a non-FAQ result still fails when its Top3 sections miss the expected section.

- [ ] **Step 2: Run focused test and verify RED**

Run: `python scripts/test_rag_optimization.py EvaluationContractTest`

Expected: import failure because the helper does not exist.

- [ ] **Step 3: Implement truthful evaluation**

For FAQ results, skip section-path assertions and validate answer/refusal requirements. For vector results, retain section and answer checks. Print separate FAQ, vector, answer, and refusal counters in the final summary.

- [ ] **Step 4: Run the 35-case regression**

Run: `HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 python scripts/07_regression_check.py`

Expected: FAQ cases are no longer reported as section misses; any remaining failures are real retrieval or answer failures and must be investigated individually.

### Task 5: Verify latency and non-regression

**Files:**
- Modify only if a failing test identifies a real defect: `lingshan-rag/scripts/rag_utils.py`

- [ ] **Step 1: Run all focused tests**

Run: `python scripts/test_rag_optimization.py && python scripts/test_scene_context.py`

Expected: all tests pass.

- [ ] **Step 2: Measure FAQ and warm retrieval latency**

In one offline Python process, call one FAQ twice and two vector questions after `warmup_rag()`. Record FAQ latency, warm retrieval samples, and P90.

Expected: FAQ <= 10ms and warm retrieval P90 <= 150ms on the current machine.

- [ ] **Step 3: Verify startup warmup**

Launch `mcp_server/server.py`, confirm its first stderr status reports `ready=True`, then query the tool once and confirm the request does not reload model weights.

- [ ] **Step 4: Run syntax and diff checks**

Run: `PYTHONPYCACHEPREFIX=/tmp/lingshan-pycache python -m py_compile scripts/rag_utils.py scripts/07_regression_check.py scripts/test_rag_optimization.py mcp_server/server.py` and `git diff --check -- lingshan-rag`.

Expected: both commands exit 0.
