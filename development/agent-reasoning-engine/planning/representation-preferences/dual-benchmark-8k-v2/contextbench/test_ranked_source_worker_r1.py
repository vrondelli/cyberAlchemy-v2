"""Real isolated-worker tests. Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from ranked_source_worker_r1 import run_index, ADDRESS_BYTES


class WorkerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        def git(*args):
            return subprocess.check_output(["git", "-c", "core.hooksPath=/dev/null", *args],
                                           cwd=self.root, stderr=subprocess.PIPE).decode().strip()
        self.git = git
        git("init", "-q")
        (self.root / "source.txt").write_text("needle\nsecond\n")
        git("add", ".")
        git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture")
        self.request = {"repository": str(self.root), "base_commit": git("rev-parse", "HEAD"), "query": "needle"}

    def test_real_git_index_is_base_pinned_and_settles_cleanly(self):
        (self.root / "source.txt").write_text("working tree differs")
        result = run_index(self.request)
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["settlement"]["exit_code"], 0)
        self.assertTrue(result["settlement"]["process_group_absent"])
        self.assertFalse(result["settlement"]["forced"])
        value = result["result"]
        self.assertEqual(value["limits"]["address_space_bytes"], ADDRESS_BYTES)
        self.assertLess(value["max_rss_kib"] * 1024, ADDRESS_BYTES)
        self.assertEqual(value["manifest"]["admitted_files"], 1)
        self.assertEqual(value["query_result"]["hints"][0]["path"], "source.txt")
        self.assertEqual(value["model_calls"], 0)

    def test_invalid_source_and_query_fail_with_settled_evidence(self):
        for request in [{**self.request, "base_commit": "0" * 40},
                        {**self.request, "query": "x" * 4097},
                        {**self.request, "extra": True}]:
            with self.subTest(request=request):
                result = run_index(request)
                self.assertFalse(result["ok"])
                self.assertEqual(result["error"], "worker-exit-2")
                self.assertTrue(result["settlement"]["process_group_absent"])
                self.assertGreater(result["stderr_bytes"], 0)

    def test_deadline_kills_and_settles_instead_of_restarting(self):
        result = run_index({}, deadline_seconds=0.1,
                           worker=[sys.executable, "-c", "import time; time.sleep(20)"])
        self.assertFalse(result["ok"])
        self.assertEqual(result["error"], "worker-deadline")
        self.assertTrue(result["settlement"]["forced"])
        self.assertTrue(result["settlement"]["process_group_absent"])
        self.assertLess(result["elapsed_seconds"], 5)

    def test_full_stdin_pipe_cannot_bypass_deadline(self):
        result = run_index({"data": "x" * 60000}, deadline_seconds=0.1,
                           worker=[sys.executable, "-c", "import time; time.sleep(20)"])
        self.assertEqual(result["error"], "worker-deadline")
        self.assertTrue(result["settlement"]["process_group_absent"])

    def test_output_flood_is_bounded_and_settled(self):
        result = run_index({}, maximum_output=100,
                           worker=[sys.executable, "-c", "import sys,time; sys.stdout.write('x'*1000000); sys.stdout.flush(); time.sleep(20)"])
        self.assertFalse(result["ok"])
        self.assertEqual(result["error"], "worker-output-limit")
        self.assertLessEqual(result["stdout_bytes"], 100 + 65536)
        self.assertTrue(result["settlement"]["process_group_absent"])

    def test_malformed_terminal_is_rejected_after_clean_settlement(self):
        result = run_index({}, worker=[sys.executable, "-c", "import sys;sys.stdin.read();print('not json')"])
        self.assertFalse(result["ok"])
        self.assertEqual(result["error"], "worker-json-invalid")
        self.assertTrue(result["settlement"]["process_group_absent"])

    def test_actual_worker_limit_denies_oversized_allocation_and_parent_survives(self):
        script = f"""import sys,resource
sys.path.insert(0,{str(Path(__file__).resolve().parent)!r})
import ranked_source_hints_r3 as core
import ranked_source_worker_r1 as worker
def allocation_fault(*args,**kwargs):
    assert resource.getrlimit(resource.RLIMIT_AS)==(worker.ADDRESS_BYTES,worker.ADDRESS_BYTES)
    try: bytearray(worker.ADDRESS_BYTES*2)
    except MemoryError: sys.exit(42)
    sys.exit(43)
core.SourceHintIndex=allocation_fault
worker._worker()
"""
        result = run_index(self.request, worker=[sys.executable, "-B", "-c", script])
        self.assertFalse(result["ok"])
        self.assertEqual(result["error"], "worker-exit-42")
        self.assertTrue(result["settlement"]["process_group_absent"])
        self.assertFalse(result["settlement"]["forced"])


if __name__ == "__main__":
    unittest.main()
