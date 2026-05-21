import argparse
import json
from pathlib import Path

from rag_utils import answer_question


EVAL_PATH = Path("data/eval_questions.jsonl")


def hit_keywords(answer: str, expected: list[str]) -> list[str]:
    return [kw for kw in expected if kw and kw in answer]


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate Lingshan RAG answer accuracy.")
    parser.add_argument("--llm", action="store_true", help="Use online LLM to compose answers (default: deterministic local answer).")
    parser.add_argument("--show-pass", action="store_true", help="Also print PASS cases.")
    args = parser.parse_args()

    with EVAL_PATH.open("r", encoding="utf-8") as handle:
        questions = [json.loads(line) for line in handle if line.strip()]

    passed = 0
    failures = []
    for idx, item in enumerate(questions, start=1):
        question = item["question"]
        expected = item.get("expected_any") or []
        result = answer_question(question, top_k=5, use_llm=args.llm)
        answer = result["answer"]
        src = "FAQ" if result.get("faq") else ("LLM" if result.get("used_llm") else "RAG")

        if not expected:
            continue

        hits = hit_keywords(answer, expected)
        ok = len(hits) > 0
        if ok:
            passed += 1
            if args.show_pass:
                print(f"✓ [PASS][{src}] {question}")
        else:
            failures.append((idx, question, expected, src, answer))
            print(f"✗ [FAIL][{src}] {question}")
            print(f"    期望命中任一: {expected}")
            print(f"    实际答案: {answer[:160]}")

    scored = sum(1 for q in questions if q.get("expected_any"))
    rate = (passed / scored * 100) if scored else 0.0
    print("\n" + "=" * 50)
    print(f"准确率: {passed}/{scored} = {rate:.1f}%")
    if failures:
        print("失败项: " + "，".join(f[1] for f in failures))


if __name__ == "__main__":
    main()
