import argparse
import json
import statistics
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

from rag_utils import LOCAL_FALLBACK_ANSWER, answer_question  # noqa: E402


DEFAULT_DATASET = ROOT / "datasets" / "eval_qa.jsonl"
DEFAULT_REPORT = ROOT / "backend" / "scripts" / "eval_report.md"
DEFAULT_RESULTS = ROOT / "backend" / "scripts" / "eval_results.jsonl"

REJECT_PATTERNS = [
    "超出了当前灵山胜境知识库范围",
    "还不能确定回答",
    "不能确定回答",
    "知识库范围",
]


def load_jsonl(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def normalize_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    if isinstance(value, str):
        return [value] if value.strip() else []
    return [str(value)]


def build_eval_query(item: dict) -> str:
    history = item.get("history") or []
    if not history:
        return item["q"]

    lines = ["对话历史："]
    for turn in history:
        role = turn.get("role", "user")
        label = "用户" if role == "user" else "助手"
        lines.append(f"{label}：{turn.get('content', '')}")
    lines.append(f"当前问题：{item['q']}")
    return "\n".join(lines)


def answer_has_reject(answer: str) -> bool:
    return any(pattern in answer for pattern in REJECT_PATTERNS)


def collect_topk_haystack(hits: list[dict], top_k: int) -> str:
    parts = []
    for hit in hits[:top_k]:
        metadata = hit.get("metadata") or {}
        parts.append(metadata.get("section_path", ""))
        parts.append(hit.get("text", ""))
    return "\n".join(parts)


def keyword_matches(answer: str, keywords: list[str]) -> list[str]:
    return [keyword for keyword in keywords if keyword and keyword in answer]


def required_keyword_hits(item: dict, keywords: list[str]) -> int:
    if "min_keyword_hits" in item:
        return int(item["min_keyword_hits"])
    if not keywords:
        return 0
    case_type = item["type"]
    if case_type in {"factual", "multi_turn"}:
        return 2 if len(keywords) >= 3 else 1
    if case_type == "sentiment":
        return 2 if len(keywords) >= 4 else 1
    return 1


def safe_ratio(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator


def evaluate_case(item: dict, result: dict, latency_ms: float, top_k: int) -> dict:
    answer = (result.get("answer") or "").strip()
    hits = result.get("hits") or []
    case_type = item["type"]
    keywords = normalize_list(item.get("keywords"))
    sources = normalize_list(item.get("source"))
    matched_keywords = keyword_matches(answer, keywords)
    min_hits = required_keyword_hits(item, keywords)
    topk_haystack = collect_topk_haystack(hits, top_k)
    topk_hit = any(source in topk_haystack for source in sources) if sources else False
    rejected = answer_has_reject(answer) or LOCAL_FALLBACK_ANSWER in answer

    answer_pass = False
    reject_pass = None
    support_pass = None

    if case_type == "oos":
        reject_pass = rejected
        answer_pass = reject_pass
    elif case_type == "sentiment":
        support_pass = len(matched_keywords) >= min_hits and not rejected
        answer_pass = support_pass
    else:
        answer_pass = len(matched_keywords) >= min_hits and not rejected

    return {
        "id": item["id"],
        "type": case_type,
        "query": item["q"],
        "eval_query": build_eval_query(item),
        "expected_answer": item["a"],
        "source": sources,
        "keywords": keywords,
        "matched_keywords": matched_keywords,
        "keyword_recall": safe_ratio(len(matched_keywords), len(keywords)),
        "required_keyword_hits": min_hits,
        "answer": answer,
        "topk_hit": topk_hit,
        "latency_ms": latency_ms,
        "rejected": rejected,
        "answer_pass": answer_pass,
        "reject_pass": reject_pass,
        "support_pass": support_pass,
        "used_llm": result.get("used_llm", False),
        "llm_error": result.get("llm_error"),
        "references": result.get("references") or [],
        "hit_sections": [
            (hit.get("metadata") or {}).get("section_path", "")
            for hit in hits[:top_k]
        ],
        "history": item.get("history") or [],
    }


def summarise_results(results: list[dict]) -> dict:
    factual_cases = [row for row in results if row["type"] in {"factual", "multi_turn"}]
    oos_cases = [row for row in results if row["type"] == "oos"]
    sentiment_cases = [row for row in results if row["type"] == "sentiment"]
    source_backed_cases = [row for row in results if row["type"] != "oos"]
    latencies = [row["latency_ms"] for row in results]

    type_counts = Counter(row["type"] for row in results)
    type_pass = Counter(row["type"] for row in results if row["answer_pass"])

    return {
        "total_cases": len(results),
        "type_counts": dict(type_counts),
        "type_pass": dict(type_pass),
        "factual_accuracy": safe_ratio(
            sum(1 for row in factual_cases if row["answer_pass"]),
            len(factual_cases),
        ),
        "oos_reject_rate": safe_ratio(
            sum(1 for row in oos_cases if row["reject_pass"]),
            len(oos_cases),
        ),
        "sentiment_support_rate": safe_ratio(
            sum(1 for row in sentiment_cases if row["support_pass"]),
            len(sentiment_cases),
        ),
        "topk_hit_rate": safe_ratio(
            sum(1 for row in source_backed_cases if row["topk_hit"]),
            len(source_backed_cases),
        ),
        "latency_avg_ms": statistics.mean(latencies) if latencies else 0.0,
        "latency_p50_ms": statistics.median(latencies) if latencies else 0.0,
        "latency_p95_ms": statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else (max(latencies) if latencies else 0.0),
        "used_llm_count": sum(1 for row in results if row["used_llm"]),
    }


def format_failures(results: list[dict], limit: int = 20) -> list[dict]:
    failures = []
    for row in results:
        if row["type"] == "oos":
            if not row["reject_pass"]:
                failures.append(row)
        elif row["type"] == "sentiment":
            if not row["support_pass"]:
                failures.append(row)
        elif not row["answer_pass"] or not row["topk_hit"]:
            failures.append(row)
    failures.sort(key=lambda item: (item["type"], item["latency_ms"]), reverse=False)
    return failures[:limit]


def write_results_jsonl(results: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in results:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def write_report(summary: dict, failures: list[dict], dataset_path: Path, report_path: Path, results_path: Path, top_k: int, use_llm: bool) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = [
        "# Eval Report",
        "",
        f"- 生成时间：{generated_at}",
        f"- 数据集：`{dataset_path}`",
        f"- 结果文件：`{results_path}`",
        f"- Top-K：`{top_k}`",
        f"- 使用 LLM：`{use_llm}`",
        "",
        "## Summary",
        "",
        f"- 总样本数：{summary['total_cases']}",
        f"- factual accuracy：{summary['factual_accuracy']:.2%}",
        f"- out-of-scope reject rate：{summary['oos_reject_rate']:.2%}",
        f"- sentiment support rate：{summary['sentiment_support_rate']:.2%}",
        f"- top-k hit：{summary['topk_hit_rate']:.2%}",
        f"- 平均耗时：{summary['latency_avg_ms']:.1f} ms",
        f"- P50 耗时：{summary['latency_p50_ms']:.1f} ms",
        f"- P95 耗时：{summary['latency_p95_ms']:.1f} ms",
        "",
        "## Type Breakdown",
        "",
        "| 类型 | 样本数 | 通过数 |",
        "| --- | ---: | ---: |",
    ]

    for case_type in ["factual", "multi_turn", "oos", "sentiment"]:
        lines.append(
            f"| {case_type} | {summary['type_counts'].get(case_type, 0)} | {summary['type_pass'].get(case_type, 0)} |"
        )

    lines.extend(
        [
            "",
            "## Error Samples",
            "",
        ]
    )

    if not failures:
        lines.append("本次评测没有记录到失败样本。")
    else:
        for item in failures:
            lines.extend(
                [
                    f"### {item['id']} · {item['type']}",
                    "",
                    f"- Q：{item['query']}",
                    f"- 期望答案：{item['expected_answer']}",
                    f"- 参考来源：{'；'.join(item['source']) if item['source'] else '无'}",
                    f"- 关键词命中：{', '.join(item['matched_keywords']) if item['matched_keywords'] else '无'}",
                    f"- top-k 命中：{item['topk_hit']}",
                    f"- 耗时：{item['latency_ms']:.1f} ms",
                    f"- 回答：{item['answer']}",
                    f"- Top sections：{' | '.join(item['hit_sections']) if item['hit_sections'] else '无'}",
                    "",
                ]
            )

    report_path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run batch evaluation for Lingshan RAG.")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET, help="Path to eval_qa.jsonl")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT, help="Path to markdown report output")
    parser.add_argument("--results", type=Path, default=DEFAULT_RESULTS, help="Path to jsonl results output")
    parser.add_argument("--top-k", type=int, default=5, help="Top-K hits to inspect")
    parser.add_argument("--use-llm", action="store_true", help="Enable configured LLM during evaluation")
    parser.add_argument("--limit", type=int, default=0, help="Optional max cases to run for quick iteration")
    args = parser.parse_args()

    dataset = load_jsonl(args.dataset)
    if args.limit > 0:
        dataset = dataset[: args.limit]

    results = []
    failures_by_type = defaultdict(int)

    for item in dataset:
        eval_query = build_eval_query(item)
        start = time.perf_counter()
        rag_result = answer_question(eval_query, top_k=args.top_k, use_llm=args.use_llm)
        latency_ms = (time.perf_counter() - start) * 1000
        case_result = evaluate_case(item, rag_result, latency_ms, args.top_k)
        results.append(case_result)

        if item["type"] == "oos":
            passed = case_result["reject_pass"]
        elif item["type"] == "sentiment":
            passed = case_result["support_pass"]
        else:
            passed = case_result["answer_pass"] and case_result["topk_hit"]

        if not passed:
            failures_by_type[item["type"]] += 1

    summary = summarise_results(results)
    failures = format_failures(results)

    write_results_jsonl(results, args.results)
    write_report(summary, failures, args.dataset, args.report, args.results, args.top_k, args.use_llm)

    print(f"评测完成：{len(results)} 条")
    print(f"factual accuracy: {summary['factual_accuracy']:.2%}")
    print(f"out-of-scope reject rate: {summary['oos_reject_rate']:.2%}")
    print(f"sentiment support rate: {summary['sentiment_support_rate']:.2%}")
    print(f"top-k hit: {summary['topk_hit_rate']:.2%}")
    print(f"avg latency: {summary['latency_avg_ms']:.1f} ms")
    print(f"report: {args.report}")
    print(f"results: {args.results}")

    return 0 if not failures_by_type else 1


if __name__ == "__main__":
    raise SystemExit(main())
