#!/usr/bin/env python3
"""Hostile checks for the Goals D65 prototype-construction binding."""

from __future__ import annotations

import copy
import importlib.util
import unittest
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = PACKAGE_ROOT / "scripts/validate_prototype_construction_binding.py"
SPEC = importlib.util.spec_from_file_location("goals_d65_binding", SCRIPT_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PrototypeConstructionBindingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.registry = MODULE.load(MODULE.REGISTRY_PATH)
        cls.projects = {
            doc["project_id"]: doc
            for path in sorted((PACKAGE_ROOT / "projects").glob("*/project.json"))
            for doc in [MODULE.load(path)]
        }
        cls.goals = {
            doc["goal_id"]: doc
            for path in sorted((PACKAGE_ROOT / "projects").glob("*/goals/*.goal.json"))
            for doc in [MODULE.load(path)]
        }
        cls.upstream = MODULE.load(MODULE.UPSTREAM_CONSTRUCTIONS_PATH)
        cls.scaffolds = MODULE.load(MODULE.UPSTREAM_SCAFFOLDS_PATH)

    def validate(self, registry=None, projects=None, upstream=None, scaffolds=None):
        return MODULE.validate_documents(
            registry or copy.deepcopy(self.registry),
            projects or copy.deepcopy(self.projects),
            copy.deepcopy(self.goals),
            upstream or copy.deepcopy(self.upstream),
            scaffolds or copy.deepcopy(self.scaffolds),
        )

    def test_current_binding_passes(self):
        self.assertEqual(self.validate(), [])

    def test_empty_registry_is_not_pass(self):
        registry = copy.deepcopy(self.registry)
        registry["bindings"] = []
        self.assertTrue(any("non-vacuous" in error for error in self.validate(registry=registry)))

    def test_stale_candidate_manifest_is_rejected(self):
        registry = copy.deepcopy(self.registry)
        registry["bindings"][0]["prototype_contract"]["candidate_manifest_sha256"] = "0" * 64
        self.assertTrue(any("manifest" in error for error in self.validate(registry=registry)))

    def test_preapproval_authority_request_is_rejected(self):
        registry = copy.deepcopy(self.registry)
        registry["bindings"][0]["authority_request_refs"] = ["CA2-AUTHORITY-PREMATURE"]
        self.assertTrue(any("preapproval authority" in error for error in self.validate(registry=registry)))

    def test_scaffold_must_remain_non_authoritative(self):
        scaffolds = copy.deepcopy(self.scaffolds)
        scaffolds["scaffolds"][0]["canonicality"] = "authoritative"
        self.assertTrue(any("non-authoritative" in error for error in self.validate(scaffolds=scaffolds)))

    def test_project_reference_must_close(self):
        projects = copy.deepcopy(self.projects)
        projects["CA2-PROJECT-CYBERALCHEMY-LAB-ONTOLOGY-LIFECYCLE"]["construction_binding_refs"] = []
        self.assertTrue(any("bidirectionally" in error for error in self.validate(projects=projects)))

    def test_unapproved_product_stage_cannot_be_inflated(self):
        registry = copy.deepcopy(self.registry)
        registry["bindings"][0]["project_stage_evidence"] = [
            row for row in registry["bindings"][0]["project_stage_evidence"]
            if row["stage"] != "product_approval"
        ]
        self.assertTrue(any("exceeds current evidence" in error for error in self.validate(registry=registry)))

    def test_product_approval_cannot_authorize_cutover(self):
        registry = copy.deepcopy(self.registry)
        approval = next(
            row for row in registry["bindings"][0]["project_stage_evidence"]
            if row["stage"] == "product_approval"
        )
        approval["authority_effect"] = "cutover"
        self.assertTrue(any("authority effect" in error for error in self.validate(registry=registry)))

    def test_unrelated_operational_task_does_not_stop_product_frontier(self):
        registry = copy.deepcopy(self.registry)
        registry["bindings"][0]["work_plan"]["operational_tasks"] = [{
            "task_id": "OPS-UNRELATED-001",
            "lane": "operational-support",
            "state": "pending",
            "applies_to_stage": None,
            "blocking_basis": "none",
            "detail": "Repository bookkeeping owned outside product construction.",
            "owner_route": "repository operations owner",
            "authority_effect": "none",
        }]
        registry["bindings"][0]["work_plan"]["continuation_status"] = "complete"
        self.assertEqual(self.validate(registry=registry), [])

    def test_exact_operational_prerequisite_blocks_only_current_frontier(self):
        registry = copy.deepcopy(self.registry)
        binding = registry["bindings"][0]
        binding["stage_states"]["product_approval"] = "absent"
        binding["project_stage_evidence"] = [
            row for row in binding["project_stage_evidence"]
            if row["stage"] != "product_approval"
        ]
        binding["product_approval_ref"] = None
        plan = binding["work_plan"]
        plan["current_product_frontier"] = "product_approval"
        current_frontier = plan["current_product_frontier"]
        plan["operational_tasks"] = [{
            "task_id": "OPS-CURRENT-FRONTIER-INPUT-001",
            "lane": "operational-support",
            "state": "pending",
            "applies_to_stage": current_frontier,
            "blocking_basis": "exact-prerequisite",
            "detail": "An exact current-frontier input is unavailable.",
            "owner_route": "product operations owner",
            "authority_effect": "none",
        }]
        plan["continuation_status"] = "blocked"
        self.assertEqual(self.validate(registry=registry), [])
        plan["continuation_status"] = "runnable"
        self.assertTrue(any("continuation_status" in error for error in self.validate(registry=registry)))

    def test_project_stage_evidence_digest_must_be_current(self):
        registry = copy.deepcopy(self.registry)
        registry["bindings"][0]["project_stage_evidence"][0]["candidate_sha256"] = "0" * 64
        self.assertTrue(any("candidate bytes are missing or stale" in error for error in self.validate(registry=registry)))

    def test_future_operational_prerequisite_remains_deferred(self):
        registry = copy.deepcopy(self.registry)
        registry["bindings"][0]["work_plan"]["operational_tasks"] = [{
            "task_id": "OPS-FUTURE-IMPLEMENTATION-001",
            "lane": "operational-support",
            "state": "blocked",
            "applies_to_stage": "implementation",
            "blocking_basis": "credential-boundary",
            "detail": "A credential boundary applies only to the future implementation stage.",
            "owner_route": "credential owner",
            "authority_effect": "none",
        }]
        registry["bindings"][0]["work_plan"]["continuation_status"] = "complete"
        self.assertEqual(self.validate(registry=registry), [])

    def test_operational_boundary_requires_exact_stage(self):
        registry = copy.deepcopy(self.registry)
        registry["bindings"][0]["work_plan"]["operational_tasks"] = [{
            "task_id": "OPS-AMBIGUOUS-001",
            "lane": "operational-support",
            "state": "blocked",
            "applies_to_stage": None,
            "blocking_basis": "authority-boundary",
            "detail": "Ambiguous authority boundary.",
            "owner_route": "authority owner",
            "authority_effect": "none",
        }]
        self.assertTrue(any("exact D65 stage" in error for error in self.validate(registry=registry)))


if __name__ == "__main__":
    unittest.main()
