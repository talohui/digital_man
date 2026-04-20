import argparse

from rag_utils import answer_question


def main() -> None:
    parser = argparse.ArgumentParser(description="Query the Lingshan RAG knowledge base.")
    parser.add_argument("--debug", action="store_true", help="Show retrieval details and the LLM prompt.")
    parser.add_argument("--no-llm", action="store_true", help="Force local answer generation even if LLM config exists.")
    args = parser.parse_args()

    while True:
        query = input("\n请输入问题，输入 q 退出：").strip()
        if query.lower() == "q":
            break

        result = answer_question(
            query,
            top_k=5,
            use_llm=not args.no_llm,
        )

        print("\n" + result["answer"])

        if not args.debug:
            continue

        if result["faq"]:
            print("\n【FAQ 命中】")
            print("question:", result["faq"]["question"])
            continue

        print("\n【检索结果】")
        for idx, hit in enumerate(result["hits"], start=1):
            print(f"\n--- Top {idx} ---")
            print("id:", hit["id"])
            print("distance:", hit["distance"])
            print("score:", hit["score"])
            print("match_reasons:", hit["match_reasons"])
            print("metadata:", hit["metadata"])
            print("text:", hit["text"][:300].replace("\n", " "))

        print("\n【回答方式】")
        print("used_llm:", result["used_llm"])
        if result["llm_error"]:
            print("llm_error:", result["llm_error"])

        print("\n【给大模型的 Prompt】")
        print(result["prompt"])


if __name__ == "__main__":
    main()
