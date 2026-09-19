"""Offline ranking/corpus tests. Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R3.md."""
import hashlib
import unittest
import json
from pathlib import Path
import subprocess
import tempfile
from ranked_source_hints_r2 import Blob, Limits, SourceHintIndex, IndexLimitError, terms, encoded, digest

BASE = "a" * 40


def blob(path, text, mode="100644"):
    data = text.encode() if isinstance(text, str) else text
    return Blob(path.encode() if isinstance(path, str) else path, mode, len(data), lambda: data)


class SourceHintTests(unittest.TestCase):
    def test_ranges_match_actual_native_reader_with_and_without_final_lf(self):
        variants = {"a.txt": "needle\n", "b.txt": "needle original\r\nlast\n",
                    "c.txt": "needle\n\n", "d.txt": "needle"}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.check_output(["git", "-c", "core.hooksPath=/dev/null", *args], cwd=root, stderr=subprocess.PIPE).decode().strip()
            git("init", "-q")
            for name, value in variants.items():
                (root / name).write_bytes(value.encode())
            git("add", ".")
            git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture")
            commit = git("rev-parse", "HEAD")
            index = SourceHintIndex([blob(name, value) for name, value in variants.items()], commit)
            hints = index.query("needle")["hints"]
            module = Path(__file__).resolve().parents[6] / "implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs"
            script = """const {createRepositoryTools}=await import(process.argv[3]);
const run=createRepositoryTools({root:process.argv[1],base_commit:process.argv[2]});
const hints=JSON.parse(process.argv[4]);const out=[];
for(const h of hints)out.push(await run('read_file',{path:h.path,revision:'base',start_line:h.start_line,line_count:h.end_line-h.start_line+1}));
console.log(JSON.stringify(out));"""
            actual = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", script,
                                                         str(root), commit, module.as_uri(), json.dumps(hints)], text=True))
            for hint, result in zip(hints, actual):
                self.assertTrue(result["ok"], result)
                observation = result["output"]
                self.assertEqual(hint["start_line"], observation["start_line"])
                self.assertEqual(hint["end_line"], observation["end_line"])
                self.assertEqual(hint["content_sha256"], observation["source_sha256"])

    def test_never_read_file_is_found_without_returning_source_or_evidence_ids(self):
        raw = "unrelated\nneedle appears here\n"
        index = SourceHintIndex([blob("a.txt", "noise"), blob("unread.py", raw)], BASE)
        result = index.query("needle")
        self.assertEqual(result["matching_windows"], 1)
        hint = result["hints"][0]
        self.assertEqual(hint["path"], "unread.py")
        self.assertEqual(hint["content_sha256"], hashlib.sha256(raw.encode()).hexdigest())
        self.assertEqual(set(hint), {"path", "base_commit", "content_sha256", "start_line", "end_line", "score_units"})
        self.assertNotIn(raw.encode(), encoded(result))
        self.assertEqual(result["query_digest"], digest({"query": "needle"}))

    def test_normalization_camel_case_acronyms_unicode_and_underscores(self):
        self.assertEqual(terms("HTTPServer user_ID foo2Bar ＡＢＣ café 变量 x 7"),
                         ["http", "server", "user", "id", "foo2", "bar", "abc", "café", "变量"])

    def test_path_only_match_has_one_hint_and_empty_file_has_none(self):
        index = SourceHintIndex([blob("needle-empty", ""), blob("needle-file", "noise\n" * 90)], BASE)
        result = index.query("needle")
        self.assertEqual(result["matching_windows"], 1)
        self.assertEqual((result["hints"][0]["start_line"], result["hints"][0]["end_line"]), (1, 40))

    def test_windows_are_disjoint_and_text_hits_suppress_path_fallback(self):
        lines = ["noise"] * 100
        for line in [10, 39, 44, 45, 83, 99]:
            lines[line - 1] = "needle"
        index = SourceHintIndex([blob("needle.txt", "\n".join(lines))], BASE)
        hints = sorted(index.query("needle")["hints"], key=lambda x: x["start_line"])
        self.assertEqual([(h["start_line"], h["end_line"]) for h in hints], [(5, 44), (45, 84), (94, 100)])
        for line in [10, 39, 44, 45, 83, 99]:
            self.assertEqual(sum(h["start_line"] <= line <= h["end_line"] for h in hints), 1)

    def test_df_counts_file_once_and_path_has_explicit_posting(self):
        index = SourceHintIndex([blob("needle", "needle\nneedle"), blob("other", "noise")], BASE)
        self.assertEqual(index.df["needle"], 1)
        self.assertEqual(index.manifest["entries"][0]["postings"], 3)

    def test_ties_use_path_bytes_and_top_five_has_honest_omissions(self):
        index = SourceHintIndex([blob(f"file-{i}", "needle") for i in range(8)], BASE)
        result = index.query("needle")
        self.assertEqual([h["path"] for h in result["hints"]], [f"file-{i}" for i in range(5)])
        self.assertEqual(result["omitted_hints"], 3)
        self.assertEqual(result, index.query("needle"))
        self.assertTrue(all(isinstance(h["score_units"], int) for h in result["hints"]))

    def test_atomic_posting_exclusion_stops_later_admission(self):
        loads = []
        def late():
            loads.append(True)
            return b"needle"
        index = SourceHintIndex([blob("a", "one two three"), Blob(b"b", "100644", 6, late), blob("c", "link", "120000")],
                                BASE, Limits(postings=2))
        self.assertFalse(loads)
        self.assertEqual(index.manifest["admitted_files"], 0)
        self.assertEqual(index.manifest["postings"], 0)
        self.assertEqual([r["reason"] for r in index.manifest["entries"]], ["posting-limit", "admission-stopped", "mode"])
        self.assertEqual(index.manifest["remaining_after_budget_stop"], 2)
        self.assertTrue(index.query("needle")["partial_index"])

    def test_total_byte_limit_excludes_whole_file(self):
        index = SourceHintIndex([blob("a", "one"), blob("b", "second")], BASE, Limits(admitted_bytes=4))
        self.assertEqual(index.manifest["admitted_bytes"], 3)
        self.assertEqual(index.manifest["entries"][1]["reason"], "admitted-byte-limit")
        self.assertFalse(index.query("second")["hints"])

    def test_mode_path_size_encoding_exclusions_are_visible(self):
        records = [blob("../escape", "x"), blob("a", b"\xff"), blob("b", "has\x00nul"),
                   blob("c", "abc", "120000"), blob("d", "longtext"), blob(b"\xff", "x")]
        index = SourceHintIndex(records, BASE, Limits(file_bytes=7))
        self.assertEqual([r["reason"] for r in index.manifest["entries"]],
                         ["path", "encoding", "encoding", "mode", "file-size", "path"])

    def test_entry_manifest_and_input_contract_fail_closed(self):
        with self.assertRaisesRegex(IndexLimitError, "entry-limit"):
            SourceHintIndex([blob("a", ""), blob("b", "")], BASE, Limits(entries=1))
        with self.assertRaisesRegex(IndexLimitError, "manifest-limit"):
            SourceHintIndex([blob("a", "needle")], BASE, Limits(manifest_bytes=10))
        with self.assertRaisesRegex(ValueError, "inventory-order"):
            SourceHintIndex([blob("b", ""), blob("a", "")], BASE)
        with self.assertRaisesRegex(ValueError, "inventory-order"):
            SourceHintIndex([blob("a", ""), blob("a", "")], BASE)
        with self.assertRaisesRegex(ValueError, "blob-byte-identity"):
            SourceHintIndex([Blob(b"a", "100644", 1, lambda: b"too long")], BASE)
        with self.assertRaisesRegex(ValueError, "limits"):
            SourceHintIndex([], BASE, Limits(entries=10001))

    def test_query_caps_no_hit_and_whole_hint_reduction(self):
        index = SourceHintIndex([blob(f"file-{i}", "needle") for i in range(8)], BASE)
        self.assertFalse(index.query("no-match")["hints"])
        self.assertFalse(index.query("_ x 7")["hints"])
        with self.assertRaisesRegex(ValueError, "query-byte"):
            index.query("é" * 2049)
        self.assertEqual(index.query(" ".join(f"term{i}" for i in range(140)))["omitted_query_terms"], 12)
        reduced = index.query("needle", maximum_bytes=550)
        self.assertLessEqual(len(encoded(reduced)), 550)
        self.assertLess(len(reduced["hints"]), 5)
        self.assertEqual(reduced["omitted_hints"], 8 - len(reduced["hints"]))
        with self.assertRaisesRegex(IndexLimitError, "response-metadata"):
            index.query("needle", maximum_bytes=1)

    def test_base_snapshot_and_index_identity_do_not_follow_later_mutation(self):
        current = [b"needle original\r\nlast\n"]
        record = Blob(b"source.py", "100644", len(current[0]), lambda: current[0])
        index = SourceHintIndex([record], BASE)
        before, identity = index.query("needle"), index.index_digest
        current[0] = b"replacement"
        self.assertEqual(index.query("needle"), before)
        self.assertEqual(index.index_digest, identity)
        self.assertEqual(before["hints"][0]["end_line"], 2)
        self.assertNotEqual(SourceHintIndex([blob("source.py", "replacement")], BASE).index_digest, identity)


if __name__ == "__main__":
    unittest.main()
