"""Current P04 construction binding and hostile-currentness controls."""

from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path


PLAN_ROOT = Path(__file__).resolve().parents[1]
ROOT = Path(__file__).resolve().parents[6]
TOOL_PATH = PLAN_ROOT / "tools/p04_construction_binding_v2.py"
spec = importlib.util.spec_from_file_location("p04_successor", TOOL_PATH)
assert spec and spec.loader
p04 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p04)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot() -> dict[str, str]:
    return {path.name: sha(path) for path in (p04.BINDING_PATH, p04.QUALIFICATION_PATH)}


class P04SuccessorTest(unittest.TestCase):
    def test_current_binding_and_exact_successors(self) -> None:
        binding = load(p04.BINDING_PATH)
        outcome = p04.validate_binding(binding)
        self.assertEqual(outcome["result"], "pass", json.dumps(outcome, indent=2))
        self.assertEqual(binding["schema_version"], "alchlang.p04-d65-construction-binding/v2-candidate")
        self.assertEqual(binding["date"], "2026-10-02")
        self.assertEqual(binding["exact_candidate"]["candidate_id"], "alchlang-domainspec-p03-0575aac7f804030b")
        self.assertFalse(binding["product_validation"]["product_owner_testing_performed"])
        self.assertEqual(binding["authority_requests"], [])

    def test_check_is_non_mutating(self) -> None:
        before = snapshot()
        result = subprocess.run([sys.executable, str(TOOL_PATH), "--check"], cwd=ROOT, text=True, capture_output=True, timeout=300, check=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(load(p04.BINDING_PATH)["binding_id"], load(p04.QUALIFICATION_PATH)["binding_id"])
        self.assertEqual(snapshot(), before)

    def test_rejects_nine_hostile_changes(self) -> None:
        original = load(p04.BINDING_PATH)
        mutations = [
            lambda value: value["stage_accounting"].pop(),
            lambda value: value["stage_accounting"].reverse(),
            lambda value: value["exact_candidate"].update(candidate_manifest_sha256="0" * 64),
            lambda value: value["artifact_bindings"][0].update(sha256="0" * 64),
            lambda value: value["registration"].update(performed=True),
            lambda value: value["product_validation"].update(product_owner_testing_performed=True),
            lambda value: value["authority_requests"].append({"kind": "publication"}),
            lambda value: value["claim_ceiling"].update(publication=True),
            lambda value: next(row for row in value["artifact_bindings"] if row["id"] == "l3-construction-qualification").update(path=p04.legacy.relative(p04.PLAN_ROOT / "evidence/l3-completion/qualification.json")),
        ]
        for index, mutate in enumerate(mutations, 1):
            changed = copy.deepcopy(original)
            mutate(changed)
            changed = p04.legacy.reseal(changed)
            outcome = p04.validate_binding(changed, check_current=True, run_p03=False)
            self.assertEqual(outcome["result"], "fail", f"mutation {index}: {json.dumps(outcome, indent=2)}")

    def test_qualification_binds_current_inputs_without_approval(self) -> None:
        qualification = load(p04.QUALIFICATION_PATH)
        binding = load(p04.BINDING_PATH)
        self.assertEqual(qualification["schema_version"], "alchlang.p04-d65-construction-binding-qualification/v3-candidate")
        self.assertEqual(qualification["result"], "scoped-pass")
        self.assertEqual(qualification["authority_effect"], "none")
        self.assertEqual(qualification["binding_id"], binding["binding_id"])
        self.assertEqual(qualification["binding_manifest_sha256"], binding["binding_manifest_sha256"])
        for row in [qualification["binding"], *qualification["bindings"].values()]:
            self.assertEqual(sha(ROOT / row["path"]), row["sha256"], row["path"])
        self.assertEqual(qualification["validation"]["adversarial_cases"], 9)
        self.assertTrue(all(item["status"] == "not_eligible" for item in qualification["eligibility"].values()))


if __name__ == "__main__":
    unittest.main()
