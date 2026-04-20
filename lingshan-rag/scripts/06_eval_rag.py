import json
from pathlib import Path

from rag_utils import search_chroma


EVAL_PATH = Path("data/eval_questions.jsonl")


def main() -> None:
    with EVAL_PATH.open("r", encoding="utf-8") as handle:
        questions = [json.loads(line) for line in handle if line.strip()]

    for idx, item in enumerate(questions, start=1):
        question = item["question"]
        expected = item["expected"]

        print(f"\n====== Case {idx} ======")
        print("问题：", question)
        print("期望：", expected)

        hits = search_chroma(question, top_k=3)
        print("检索结果：")
        for hit in hits:
            preview = hit["text"][:120].replace("\n", " ")
            print("-", hit["metadata"].get("section_path", ""), preview)


if __name__ == "__main__":
    main()
