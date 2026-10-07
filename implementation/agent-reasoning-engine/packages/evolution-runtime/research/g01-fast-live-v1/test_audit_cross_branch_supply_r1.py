import json
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import pyarrow as pa
import pyarrow.parquet as pq

spec = importlib.util.spec_from_file_location("audit_cross_branch_supply_r1", Path(__file__).with_name("audit-cross-branch-supply-r1.py"))
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
FIELDS, audit_supply, ids_from_manifest = module.FIELDS, module.audit_supply, module.ids_from_manifest


class CrossBranchSupplyTests(unittest.TestCase):
    def test_source_only_projection_and_conservative_union(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            evolution, runs = root / "evolution", root / "runs"
            evolution.mkdir(); runs.mkdir()
            def write(path, value):
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(value))
            write(evolution / "g01-a/CONFIG.json", {"tasks": [{"instance_id": "A"}]})
            write(evolution / "g01-b/tasks/B.json", {"instance_id": "B"})
            write(evolution / "hen-a/CONFIG.json", {"tasks": [{"instance_id": "C"}]})
            write(evolution / "g02-product-replication-cohort-r1.json", {"ordered_tasks": [{"instance_id": "D"}]})
            write(evolution / "g02-a/COHORT.json", {"ordered_tasks": [{"instance_id": "E"}]})
            write(runs / "g02-a/tasks/F.json", {"instance_id": "F"})
            write(runs / "g02-a/tasks/binding.json", {"schema_version": "source-binding"})
            parquet = root / "full.parquet"
            rows = []
            for identifier in "ABCDEFG":
                rows.append({"instance_id": identifier, "original_inst_id": identifier, "repo": "example/repo",
                             "repo_url": "https://example.invalid/repo", "language": "go", "base_commit": "a" * 40,
                             "problem_statement": "source-only", "source": "Pro", "gold_context": "must-not-load"})
            pq.write_table(pa.Table.from_pylist(rows), parquet)
            actual = pq.read_table
            calls = []
            def guarded(path, *, columns):
                calls.append(columns)
                return actual(path, columns=columns)
            with patch("audit_cross_branch_supply_r1.pq.read_table", side_effect=guarded):
                result = audit_supply(parquet, evolution, runs)
            self.assertEqual(calls, [list(FIELDS)])
            self.assertEqual(result["exposure_counts"]["union"], 6)
            self.assertEqual(result["remaining_rows"], 1)
            self.assertEqual(result["repositories"][0]["remaining_by_source"], {"Pro": 1})
            self.assertNotIn("gold_context", result["source_only_fields"])
            self.assertEqual(len(result["manifest_files"]), 6)

    def test_unknown_manifest_shape_fails_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "task.json"
            path.write_text(json.dumps({"tasks": {"ambiguous": "A"}}))
            with self.assertRaisesRegex(ValueError, "missing instance_id"):
                ids_from_manifest(path, "g02")


if __name__ == "__main__":
    unittest.main()
