import ast
import unittest
from pathlib import Path


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


class LingshanPrestartFastPathTest(unittest.TestCase):
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
