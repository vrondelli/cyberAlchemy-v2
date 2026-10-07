"""No-model parity checks for the query-bound source-index experiment."""

import importlib.util
from pathlib import Path
import sys
import unittest


HERE = Path(__file__).resolve().parent
OLD = HERE.parent / "source-index-capacity-r3" / "ranked_source_hints_r3.py"


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


class QueryBoundTests(unittest.TestCase):
    def test_full_output_parity_and_digest(self):
        old = load(OLD, "g01_old_hints_for_r4")
        new = load(HERE / "ranked_source_hints_r4.py", "g01_new_hints_for_r4")
        blobs = [
            (b"src/Parser.ts", b"export function parseInput() { return 1; }\n\nparseInput();\n"),
            (b"src/helpers.ts", b"export const unrelated = 'parse input';\n"),
            (b"docs/README.md", b"No relevant tokens here.\n"),
            (b"docs/oversized.md", b"parse " + b"x" * 33000 + b"\n"),
        ]
        def records(module):
            for path, data in sorted(blobs):
                yield module.Blob(path, "100644", len(data), lambda data=data: data)
        for query in ("parse input", "absent match", "Parser unrelated parse",
                      " ".join(f"token{i}" for i in range(129))):
            with self.subTest(query=query):
                baseline = old.SourceHintIndex(records(old), "a" * 40)
                optimized = new.SourceHintIndex(records(new), "a" * 40,
                                                query_terms=query)
                self.assertEqual(baseline.manifest, optimized.manifest)
                self.assertEqual(baseline.index_digest, optimized.index_digest)
                self.assertEqual(baseline.query(query), optimized.query(query))
                with self.assertRaisesRegex(ValueError, "bound-query-mismatch"):
                    optimized.query(query + " different")

    def test_unbound_mode_preserves_multiple_queries(self):
        new = load(HERE / "ranked_source_hints_r4.py", "g01_new_unbound_hints_for_r4")
        data = b"alpha beta\ngamma delta\n"
        index = new.SourceHintIndex(
            [new.Blob(b"f.txt", "100644", len(data), lambda: data)], "b" * 40)
        self.assertEqual(index.query("alpha")["matching_windows"], 1)
        self.assertEqual(index.query("gamma")["matching_windows"], 1)


if __name__ == "__main__":
    unittest.main()
