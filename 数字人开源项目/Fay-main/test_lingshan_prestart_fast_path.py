import ast
import re
import unittest
from pathlib import Path
from typing import Any


MODULE_PATH = Path(__file__).resolve().parent / "llm" / "nlp_cognitive_stream.py"


def load_helper(name: str):
    tree = ast.parse(MODULE_PATH.read_text(encoding="utf-8-sig"))
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == name:
            module = ast.Module(body=[node], type_ignores=[])
            ast.fix_missing_locations(module)
            namespace = {}
            exec(compile(module, str(MODULE_PATH), "exec"), namespace)
            return namespace[name]
    raise AssertionError(f"helper {name} not found")


def load_helpers(names):
    tree = ast.parse(MODULE_PATH.read_text(encoding="utf-8-sig"))
    nodes = [
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name in names
    ]
    if {node.name for node in nodes} != set(names):
        raise AssertionError(f"helpers not found: {set(names) - {node.name for node in nodes}}")
    module = ast.Module(body=nodes, type_ignores=[])
    ast.fix_missing_locations(module)
    namespace = {"Any": Any, "re": re}
    exec(compile(module, str(MODULE_PATH), "exec"), namespace)
    return namespace


class LingshanPrestartFastPathTest(unittest.TestCase):
    def test_lingshan_identity_policy_overrides_generic_fay_persona(self):
        build_identity_prompt = load_helper("_build_lingshan_identity_prompt")

        prompt = build_identity_prompt()

        self.assertIn("灵山小灵", prompt)
        self.assertIn("女性", prompt)
        self.assertIn("灵山胜境数字人导游", prompt)
        self.assertIn("不得自称 Fay", prompt)
        self.assertIn("不得自称通用助手", prompt)

    def test_skips_prestart_tools_for_greetings_without_fixing_the_reply_text(self):
        helpers = load_helpers([
            "_normalize_short_greeting_text",
            "_extract_current_user_text",
            "_is_emotional_support_turn",
            "_is_current_only_turn",
            "_should_use_current_turn_only",
            "_should_run_prestart_tools",
        ])

        self.assertFalse(helpers["_should_run_prestart_tools"]("你好"))
        self.assertFalse(helpers["_should_run_prestart_tools"]("Hello!"))
        self.assertFalse(helpers["_should_run_prestart_tools"]("你是谁"))
        self.assertFalse(helpers["_should_run_prestart_tools"]("你叫什么名字"))
        self.assertTrue(helpers["_should_run_prestart_tools"]("灵山大佛有多高"))

    def test_skips_prestart_tools_for_pure_emotional_support(self):
        helpers = load_helpers([
            "_normalize_short_greeting_text",
            "_extract_current_user_text",
            "_is_emotional_support_turn",
            "_is_current_only_turn",
            "_should_use_current_turn_only",
            "_history_for_current_turn",
            "_should_verify_long_finish",
            "_should_run_prestart_tools",
        ])
        enriched = "情绪提示：请先安抚。\n游客问题：我好痛苦"
        frontend_prompt = "情绪提示：游客当前可能有些焦虑或不安。请先用一句话安抚。\n我好痛苦"

        self.assertFalse(helpers["_should_run_prestart_tools"](enriched))
        self.assertFalse(helpers["_should_run_prestart_tools"](frontend_prompt))
        self.assertTrue(helpers["_should_use_current_turn_only"](enriched))
        self.assertTrue(helpers["_should_use_current_turn_only"](frontend_prompt))
        self.assertEqual(
            helpers["_history_for_current_turn"]([("fay", "旧的大照壁回答")], True),
            [],
        )
        self.assertFalse(
            helpers["_should_verify_long_finish"](True, "安抚" * 50, enriched, True)
        )
        self.assertTrue(helpers["_should_run_prestart_tools"]("游客问题：我很焦虑，灵山大佛怎么走"))
        self.assertTrue(
            helpers["_should_verify_long_finish"](
                True,
                "讲解" * 50,
                "游客问题：请介绍灵山大佛",
                False,
            )
        )

    def test_detects_valid_lingshan_rag_prestart_context(self):
        has_lingshan_rag_prestart = load_helper("_has_lingshan_rag_prestart")

        context = (
            "【query_lingshan_rag】(query=梵宫主要看什么?, top_k=5, use_llm=False)\n"
            "answer: 梵宫的主要特色是内部可重点看穹顶天象图、《华藏世界》。\n"
            "context: 【核心景点特色详解】顶天象图：28 米高星空穹顶。\n"
            "used_llm: False\n"
            "retrieval_count: 5"
        )

        self.assertTrue(has_lingshan_rag_prestart(context))

    def test_rejects_unrelated_or_empty_prestart_context(self):
        has_lingshan_rag_prestart = load_helper("_has_lingshan_rag_prestart")

        self.assertFalse(has_lingshan_rag_prestart(""))
        self.assertFalse(has_lingshan_rag_prestart("【query_yueshen】answer: 其他知识库"))
        self.assertFalse(has_lingshan_rag_prestart("【query_lingshan_rag】error: timeout"))


if __name__ == "__main__":
    unittest.main()
