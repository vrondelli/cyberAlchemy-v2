#!/usr/bin/env python3
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
REPOSITORY_ROOT = Path(__file__).resolve().parents[6]
TOOL_PATH = PLAN_ROOT / "tools/p04_construction_binding.py"
EVIDENCE_ROOT = PLAN_ROOT / "evidence/p04-d65-construction-binding"
BINDING_PATH = EVIDENCE_ROOT / "construction-binding.json"
QUALIFICATION_PATH = EVIDENCE_ROOT / "qualification.json"

spec = importlib.util.spec_from_file_location("p04_construction_binding", TOOL_PATH)
assert spec and spec.loader
p04 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p04)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot() -> dict[str, str]:
    return {path.relative_to(EVIDENCE_ROOT).as_posix(): sha256(path) for path in sorted(EVIDENCE_ROOT.rglob("*")) if path.is_file()}


class P04ConstructionBindingTests(unittest.TestCase):
    def test_binding_is_current_and_accounts_for_all_revision_2_stages(self):
        binding = load(BINDING_PATH)
        validation = p04.validate_binding(binding, check_current=True, run_p03=True)
        self.assertEqual(validation["result"], "pass", json.dumps(validation, indent=2))
        self.assertEqual([item["stage"] for item in binding["stage_accounting"]], p04.STAGE_ORDER)
        self.assertEqual(binding["exact_candidate"]["candidate_id"], "alchlang-domainspec-p03-3ab76c2d9ee8bee4")
        self.assertFalse(binding["product_validation"]["product_owner_testing_performed"])
        self.assertEqual(binding["authority_requests"], [])
        self.assertTrue(all(item["status"] == "not_eligible" for item in binding["eligibility"].values()))

    def test_check_command_is_non_mutating(self):
        before = snapshot()
        result = subprocess.run([sys.executable, str(TOOL_PATH), "--check"], cwd=REPOSITORY_ROOT, text=True, capture_output=True, timeout=300, check=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout)["result"], "pass")
        self.assertEqual(snapshot(), before)

    def test_hostile_stage_candidate_registration_and_claim_changes_are_rejected(self):
        original = load(BINDING_PATH)
        mutations = [
            (lambda value: value["stage_accounting"].pop(), False),
            (lambda value: value["stage_accounting"].reverse(), False),
            (lambda value: value["exact_candidate"].__setitem__("candidate_manifest_sha256", "0" * 64), False),
            (lambda value: value["artifact_bindings"][0].__setitem__("sha256", "0" * 64), True),
            (lambda value: value["registration"].__setitem__("performed", True), False),
            (lambda value: value["product_validation"].__setitem__("product_owner_testing_performed", True), False),
            (lambda value: value["authority_requests"].append({"kind": "publication"}), False),
            (lambda value: value["claim_ceiling"].__setitem__("publication", True), False),
            (lambda value: value["eligibility"]["l4x_product_review_handoff"].__setitem__("status", "eligible"), False),
        ]
        for index, (mutate, check_current) in enumerate(mutations, start=1):
            changed = copy.deepcopy(original)
            mutate(changed)
            changed = p04.reseal(changed)
            validation = p04.validate_binding(changed, check_current=check_current, run_p03=False)
            self.assertEqual(validation["result"], "fail", f"mutation {index} was accepted: {json.dumps(validation, indent=2)}")

    def test_qualification_binds_schema_tool_test_and_exact_predecessor(self):
        qualification = load(QUALIFICATION_PATH)
        binding = load(BINDING_PATH)
        self.assertEqual(qualification["schema_version"], "alchlang.p04-d65-construction-binding-qualification/v1-candidate")
        self.assertEqual(qualification["task"], "P04")
        self.assertEqual(qualification["result"], "pass")
        self.assertEqual(qualification["authority_effect"], "none")
        self.assertEqual(sha256(REPOSITORY_ROOT / qualification["binding"]["path"]), qualification["binding"]["sha256"])
        for row in qualification["bindings"].values():
            self.assertEqual(sha256(REPOSITORY_ROOT / row["path"]), row["sha256"], row["path"])
        self.assertEqual(qualification["binding_id"], binding["binding_id"])
        self.assertEqual(qualification["binding_manifest_sha256"], binding["binding_manifest_sha256"])
        self.assertEqual(qualification["validation"], {"schema": "pass", "currentness": "pass", "p03_currentness": "pass", "non_mutating": True, "stage_count": 11, "adversarial_cases": 9, "failed": 0, "skipped": 0})
        self.assertTrue(all(value is False for value in qualification["hard_stops"].values()))


if __name__ == "__main__":
    unittest.main()
