"""
灵山 RAG 回归检查：针对 MD 里所有主要内容枚举可能被问到的问题，
检查 (1) 是否返回有效答案（非 fallback 话术）、(2) top3 里是否出现期望的 section_path 片段。

用法：
    python scripts/07_regression_check.py
    python scripts/07_regression_check.py --verbose   # 打印每题的 top3 和答案片段
退出码：任一检查失败 → 非零，方便 CI。
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from rag_utils import LOCAL_FALLBACK_ANSWER, answer_question


# 每个用例：query + 至少要求 top3 中任一 hit 的 section_path 包含这些关键词之一
CASES = [
    # --- 景点特色（核心景点补全后应该都能命中具体小节） ---
    {"q": "灵山大佛有多高", "expect_section": ["灵山大佛"], "expect_in_answer": ["88", "米", "青铜"]},
    {"q": "灵山大佛是怎么建造的", "expect_section": ["灵山大佛", "建造工艺"], "expect_in_answer": []},
    {"q": "灵山大佛有什么文化意义？", "expect_section": ["佛教文化", "佛教意义", "灵山大佛"], "forbid_in_answer": ["自然风光爱好者路线"]},
    {"q": "灵山大佛的寓意是什么？", "expect_section": ["佛教意义", "佛教文化", "灵山大佛"], "forbid_in_answer": ["自然风光爱好者路线"]},
    {"q": "登灵山大佛的台阶有什么讲究？", "expect_section": ["灵山大佛", "最佳体验", "讲解重点"], "expect_in_answer": []},

    {"q": "梵宫有什么特色？", "expect_section": ["梵宫", "核心艺术", "传统艺术"], "expect_in_answer": []},
    {"q": "梵宫里能看到什么艺术作品", "expect_section": ["梵宫", "核心艺术"], "expect_in_answer": []},
    {"q": "九龙灌浴是什么？", "expect_section": ["九龙灌浴"], "expect_in_answer": []},
    {"q": "九龙灌浴的表演是什么", "expect_section": ["九龙灌浴", "表演内容"], "expect_in_answer": []},
    {"q": "九龙灌浴的佛教意义", "expect_section": ["九龙灌浴", "佛教意义"], "expect_in_answer": []},

    {"q": "五印坛城有什么看点？", "expect_section": ["五印坛城"], "expect_in_answer": []},
    {"q": "五印坛城是什么建筑风格", "expect_section": ["五印坛城", "建筑风格"], "expect_in_answer": []},
    {"q": "五印坛城内部有什么", "expect_section": ["五印坛城", "内部艺术"], "expect_in_answer": []},

    {"q": "祥符禅寺有什么历史遗存？", "expect_section": ["祥符禅寺", "历史遗存"], "expect_in_answer": []},
    {"q": "祥符禅寺有什么佛教活动", "expect_section": ["祥符禅寺", "佛教活动"], "expect_in_answer": []},

    {"q": "佛手广场", "expect_section": ["其他特色景点", "佛手"], "expect_in_answer": ["天下第一掌"]},
    {"q": "天下第一掌", "expect_section": ["其他特色景点"], "expect_in_answer": ["11.7", "右手"]},
    {"q": "百子戏弥勒是什么", "expect_section": ["其他特色景点"], "expect_in_answer": ["百子"]},

    # --- 路线推荐 ---
    {"q": "亲子游怎么安排路线？", "expect_section": ["亲子家庭路线"], "expect_in_answer": ["九龙灌浴"]},
    {"q": "历史文化路线怎么走", "expect_section": ["历史文化爱好者路线"], "expect_in_answer": []},
    {"q": "自然风光路线推荐", "expect_section": ["自然风光爱好者路线"], "expect_in_answer": []},

    # --- 讲解知识 / 文化 ---
    {"q": "灵山胜境的历史渊源", "expect_section": ["历史", "缘起", "千年"], "expect_in_answer": []},
    {"q": "五方五佛是什么意思", "expect_section": ["佛教文化", "现代灵山胜境"], "expect_in_answer": ["五方五佛"]},

    # --- 服务信息 / 门票 / 餐饮 / 住宿 ---
    {"q": "门票多少钱？", "expect_section": ["门票"], "expect_in_answer": ["210", "元"]},
    {"q": "哪些人可以买半价票？", "expect_section": ["门票"], "expect_in_answer": ["半价", "105"]},
    {"q": "观光车多少钱？", "expect_section": ["门票"], "expect_in_answer": ["40"]},
    {"q": "免票人群", "expect_section": ["门票"], "expect_in_answer": ["免票", "70", "军人"]},
    {"q": "网购联票", "expect_section": ["门票"], "expect_in_answer": ["225"]},
    {"q": "餐饮", "expect_section": ["餐饮"], "expect_in_answer": ["素斋"]},
    {"q": "餐饮多少钱", "expect_section": ["餐饮"], "expect_in_answer": ["50", "35"]},
    {"q": "梵宫素斋自助", "expect_section": ["餐饮", "梵宫"], "expect_in_answer": ["50"]},
    {"q": "住宿推荐", "expect_section": ["住宿"], "expect_in_answer": ["灵山精舍"]},
    {"q": "最佳游览时间是什么时候", "expect_section": ["最佳游览时间"], "expect_in_answer": ["春", "秋", "9"]},
    {"q": "景区几点开门", "expect_section": ["最佳游览时间", "其他实用建议", "门票"], "expect_in_answer": []},
    {"q": "穿什么衣服合适", "expect_section": ["其他实用建议"], "expect_in_answer": ["运动鞋", "穿着"]},
]


def run_case(case: dict, verbose: bool) -> tuple[bool, str]:
    query = case["q"]
    result = answer_question(query, top_k=5, use_llm=False)
    answer = result["answer"] or ""
    hits = result["hits"] or []

    # 1. 答案不应是 fallback
    if LOCAL_FALLBACK_ANSWER.strip() in answer and not case.get("allow_fallback"):
        return False, f"[REFUSED] {query} → {answer[:80]}"

    # 2. top3 任一 section_path 至少命中一个期望关键词
    expect_section = case.get("expect_section") or []
    if expect_section:
        top3_sections = [
            (h["metadata"] or {}).get("section_path", "") for h in hits[:3]
        ]
        joined = " | ".join(top3_sections)
        if not any(any(kw in sec for sec in top3_sections) for kw in expect_section):
            return False, (
                f"[SECTION-MISS] {query} expected any of {expect_section} in top3; got {joined}"
            )

    # 3. 答案里必须包含期望的任一关键词（如果指定了）
    expect_in_answer = case.get("expect_in_answer") or []
    if expect_in_answer:
        if not any(kw in answer for kw in expect_in_answer):
            return False, (
                f"[ANSWER-MISS] {query} expected any of {expect_in_answer} in answer; got {answer[:120]}"
            )

    # 4. 禁止词检查
    forbid = case.get("forbid_in_answer") or []
    for bad in forbid:
        if bad in answer:
            return False, f"[FORBIDDEN] {query} answer contains {bad!r}: {answer[:120]}"

    if verbose:
        top3 = " | ".join(h["id"] for h in hits[:3])
        return True, f"[OK] {query} → {top3} | {answer[:80]}"
    return True, f"[OK] {query}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    passed = 0
    failed = 0
    failures = []
    for case in CASES:
        ok, msg = run_case(case, args.verbose)
        if ok:
            passed += 1
            if args.verbose:
                print(msg)
        else:
            failed += 1
            failures.append(msg)
            print(msg)

    print(f"\n===== {passed} passed, {failed} failed, {len(CASES)} total =====")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
