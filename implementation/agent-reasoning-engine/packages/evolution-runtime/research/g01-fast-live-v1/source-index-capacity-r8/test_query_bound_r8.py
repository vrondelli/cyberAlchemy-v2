"""No-model parity checks for the query-bound source-index experiment."""

import importlib.util
import inspect
from pathlib import Path
import subprocess
import sys
import tempfile
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
    def test_real_git_batch_worker_matches_one_process_per_blob(self):
        with tempfile.TemporaryDirectory() as scratch:
            repo = Path(scratch) / "repo"
            subprocess.run(["git", "init", "-q", str(repo)], check=True)
            (repo / "src").mkdir()
            (repo / "README.md").write_bytes(b"ParseInput and more\n")
            (repo / "src" / "Parser.py").write_bytes(b"def parse_input():\n    return 1\n")
            (repo / "empty.txt").write_bytes(b"")
            (repo / "binary.bin").write_bytes(b"parse\x00input")
            subprocess.run(["git", "-C", str(repo), "add", "."], check=True)
            subprocess.run(["git", "-C", str(repo), "-c", "user.name=ARE Test",
                            "-c", "user.email=are@example.invalid", "commit", "-qm",
                            "fixture"], check=True)
            base = subprocess.check_output(["git", "-C", str(repo), "rev-parse",
                                            "HEAD"], text=True).strip()
            request = {"repository": str(repo.resolve()), "base_commit": base,
                       "query": "parse input"}
            old_worker = load(HERE.parent / "source-index-capacity-r3" /
                              "ranked_source_worker_r2.py", "g01_old_worker_for_r8")
            batch_worker = load(HERE / "ranked_source_worker_r7.py",
                                "g01_batch_worker_for_r8")
            old = old_worker.run_index(request, deadline_seconds=30)
            new = batch_worker.run_index(request, deadline_seconds=30)
            self.assertTrue(old["ok"], old)
            self.assertTrue(new["ok"], new)
            self.assertEqual(old["result"]["manifest"], new["result"]["manifest"])
            self.assertEqual(old["result"]["query_result"], new["result"]["query_result"])
            self.assertEqual(old["result"]["index_digest"], new["result"]["index_digest"])
            self.assertEqual(new["result"]["git_blob_requests"], 4)
            self.assertTrue(new["settlement"]["process_group_absent"])
            self.assertFalse(new["settlement"]["forced"])

    def test_supervisor_policy_is_bounded_at_120_seconds(self):
        worker = load(HERE / "ranked_source_worker_r7.py", "g01_worker_for_r8")
        self.assertEqual(inspect.signature(worker.run_index).parameters["deadline_seconds"].default, 120)
        with self.assertRaisesRegex(ValueError, "supervision-limits"):
            worker._run_index({}, deadline_seconds=121)

    def test_full_output_parity_and_digest(self):
        old = load(OLD, "g01_old_hints_for_r4")
        new = load(HERE / "ranked_source_hints_r8.py", "g01_new_hints_for_r8")
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
        new = load(HERE / "ranked_source_hints_r8.py", "g01_new_unbound_hints_for_r8")
        data = b"alpha beta\ngamma delta\n"
        index = new.SourceHintIndex(
            [new.Blob(b"f.txt", "100644", len(data), lambda: data)], "b" * 40)
        self.assertEqual(index.query("alpha")["matching_windows"], 1)
        self.assertEqual(index.query("gamma")["matching_windows"], 1)


if __name__ == "__main__":
    unittest.main()
