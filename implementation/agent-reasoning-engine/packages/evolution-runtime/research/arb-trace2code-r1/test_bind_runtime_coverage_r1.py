"""Open Questions: evidence/G01-RUNTIME-COVERAGE-FEASIBILITY-R1.json."""
import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location("binder", Path(__file__).with_name("bind-runtime-coverage-r1.py"))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class Tests(unittest.TestCase):
    def fixture(self, line="1", hits="2", filename="p/A.java", name="p.A"):
        return f'<coverage><sources><source>src/java</source></sources><packages><package><classes><class name="{name}" filename="{filename}"><lines><line number="{line}" hits="{hits}"/></lines></class></classes></package></packages></coverage>'.encode()

    def bind(self, xml):
        data = b"package p; class A {}\n"
        return m.bind_coverage(xml, {"src/java/p/A.java": {"bytes": data, "sha256": m.sha(data)}}, {"source_root": "src/java", "classes": ["p.A"]})

    def test_exact_and_zero_hits(self):
        self.assertEqual(self.bind(self.fixture())["unique_executed_source_lines"], 1)
        self.assertEqual(self.bind(self.fixture(hits="0"))["unique_executed_source_lines"], 0)

    def test_inner_class_and_no_unknown_class(self):
        self.assertEqual(self.bind(self.fixture(name="p.A$1"))["reported_classes"], 1)
        with self.assertRaises(ValueError):
            self.bind(self.fixture(name="p.Other"))

    def test_range_counter_and_unsafe_path_fail(self):
        for xml in [self.fixture(line="2"), self.fixture(hits="-1"), self.fixture(filename="../A.java")]:
            with self.assertRaises(ValueError):
                self.bind(xml)

    def test_entity_declaration_fails(self):
        with self.assertRaises(ValueError):
            self.bind(b'<!DOCTYPE coverage [<!ENTITY x "p/A.java">]>' + self.fixture())


if __name__ == "__main__":
    unittest.main()
