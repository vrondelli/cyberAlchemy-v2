"""Synthetic only. Open Questions: G02-TYPED-NAVIGATION-R1.json."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("structure", Path(__file__).with_name("typed-source-structure-r1.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class StructureTests(unittest.TestCase):
    def test_python_class_and_nested_function(self):
        source = "class Service:\n    def run(self, value):\n        def inner():\n            return value\n        return inner()\n"
        result = module.build_structure(source, "python")
        self.assertEqual(result["status"], "parsed")
        self.assertEqual([d["qualified_name"] for d in result["definitions"]], ["Service", "Service::run", "Service::run::inner"])
        self.assertEqual(result["definitions"][1]["start_line"], 2)
        self.assertEqual(result["definitions"][1]["end_line"], 5)
        self.assertNotIn("return", result["definitions"][1]["signature"])

    def test_cpp_overloads_distinct_ids(self):
        result = module.build_structure("namespace N { class C { public: int f(int x) { return x; } int f() { return 0; } }; }", "cpp")
        self.assertEqual(result["status"], "parsed")
        functions = [d for d in result["definitions"] if d["kind"] == "function"]
        self.assertEqual([d["qualified_name"] for d in functions], ["N::C::f", "N::C::f"])
        self.assertNotEqual(functions[0]["id"], functions[1]["id"])

    def test_unicode_byte_binding(self):
        source = "# café\nasync def tâche():\n    return '好'\n"
        result = module.build_structure(source, "python")
        definition = result["definitions"][0]
        self.assertTrue(source.encode()[definition["start_byte"]:definition["end_byte"]].decode().startswith("async def tâche"))
        self.assertEqual(definition["end_line"], 3)

    def test_cpp_out_of_class_qualified_definition(self):
        result = module.build_structure("namespace N { int C::run() { return 1; } }", "cpp")
        self.assertEqual(result["definitions"][0]["qualified_name"], "N::C::run")
        self.assertEqual(result["definitions"][0]["owner"], "N::C")

    def test_parse_error_fail_closed(self):
        result = module.build_structure("def broken(:\n", "python")
        self.assertEqual(result["status"], "parse-error")
        self.assertEqual(result["definitions"], [])

    def test_no_regex_comments_or_calls(self):
        result = module.build_structure("# def imaginary():\nrun()\ntext = 'class Imaginary:'\n", "python")
        self.assertEqual(result["definitions"], [])

    def test_unsupported_language(self):
        with self.assertRaises(ValueError):
            module.build_structure("void f() {}", "java")

    def test_grammar_pin(self):
        original = module.GRAMMAR_SHA["python"]
        try:
            module.GRAMMAR_SHA["python"] = "0" * 64
            with self.assertRaises(ValueError):
                module.build_structure("pass", "python")
        finally:
            module.GRAMMAR_SHA["python"] = original


if __name__ == "__main__":
    unittest.main()
