import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("propose-cross-branch-cohort-r1.py")
SPEC = importlib.util.spec_from_file_location("cohort_candidate", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def fixture():
    rows = []
    for (language, repo, source), count in MODULE.QUOTAS.items():
        for index in range(count + 1):
            rows.append({"instance_id": f"{repo}-{index}", "repo": repo, "language": language,
                         "source": source, "native_gold_files_present": True, "loader_error": False})
    for index in range(931 - len(rows)):
        rows.append({"instance_id": f"other-{index}", "repo": "other", "language": "python",
                     "source": "Pro", "native_gold_files_present": index >= 2, "loader_error": False})
    return {"schema_version": "are.g01-g02-cross-branch-gold-eligibility/v1", "status": "passed",
            "gold_paths_or_values_exported": False, "model_calls": 0, "source_only_rows": 931,
            "totals": {"eligible": 929, "ineligible": 2}, "source_supply_sha256": "a" * 64,
            "source_parquet_sha256": "b" * 64, "rows": rows}


class CohortCandidateTests(unittest.TestCase):
    def test_deterministic_balanced_candidate_without_gold(self):
        first = MODULE.propose(fixture(), "c" * 64)
        second = MODULE.propose(fixture(), "c" * 64)
        self.assertEqual(first, second)
        self.assertEqual(len(first["ordered_tasks"]), 24)
        self.assertEqual(first["status"], "preflight-only-not-frozen")
        self.assertNotIn("native_gold_files_present", str(first["ordered_tasks"]))

    def test_fail_closed_on_extra_fields(self):
        receipt = fixture()
        receipt["rows"][0]["gold_path"] = "private"
        with self.assertRaises(ValueError):
            MODULE.propose(receipt, "c" * 64)

    def test_fail_closed_on_supply_loss(self):
        receipt = fixture()
        receipt["rows"] = [row for row in receipt["rows"] if row["repo"] != "sharkdp/fd" or
                           not row["instance_id"].endswith(("-2", "-3"))]
        for index in range(2):
            receipt["rows"].append({"instance_id": f"replacement-{index}", "repo": "other", "language": "python",
                                    "source": "Pro", "native_gold_files_present": True, "loader_error": False})
        with self.assertRaises(ValueError):
            MODULE.propose(receipt, "c" * 64)

    def test_manifest_drift_blocks_candidate(self):
        with tempfile.TemporaryDirectory() as temp:
            evolution = Path(temp) / "evolution"
            runs = Path(temp) / "runs"
            (evolution / "g01-test" / "tasks").mkdir(parents=True)
            runs.mkdir()
            (evolution / "g02-product-replication-cohort-r1.json").write_text("{}")
            manifest = evolution / "g01-test" / "tasks" / "a.json"
            manifest.write_text("{}")
            paths = (manifest, evolution / "g02-product-replication-cohort-r1.json")
            supply = {"schema_version": "are.g01-g02-cross-branch-source-supply/v1",
                      "manifest_files": [{"path": str(path), "sha256": MODULE.sha256(path.read_bytes())} for path in paths]}
            MODULE.verify_exposure_snapshot(supply, evolution, runs)
            manifest.write_text("changed")
            with self.assertRaises(ValueError):
                MODULE.verify_exposure_snapshot(supply, evolution, runs)

    def test_source_join_rejects_mismatch_and_extra_field(self):
        candidate = MODULE.propose(fixture(), "c" * 64)
        rows = [{**task, "original_inst_id": "upstream-id", "problem_statement": "Find source",
                 "repo_url": "https://github.com/example/repo.git", "base_commit": "a" * 40}
                for task in candidate["ordered_tasks"]]
        joined = MODULE.attach_source_rows(candidate, rows)
        self.assertTrue(joined["source_commit_join_verified"])
        self.assertEqual(len(joined["ordered_tasks"]), 24)
        rows[0]["repo"] = "wrong/repo"
        with self.assertRaises(ValueError):
            MODULE.attach_source_rows(candidate, rows)
        rows[0]["repo"] = candidate["ordered_tasks"][0]["repo"]
        rows[0]["gold_context"] = "private"
        with self.assertRaises(ValueError):
            MODULE.attach_source_rows(candidate, rows)


if __name__ == "__main__":
    unittest.main()
