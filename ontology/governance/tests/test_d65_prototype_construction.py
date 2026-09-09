#!/usr/bin/env python3
"""Hostile and positive checks for the D65 revision-2 prototype contract."""

from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
PACKAGE_ROOT = REPOSITORY_ROOT / "cyberAlchemy-v2/ontology/governance"
VALIDATOR_PATH = PACKAGE_ROOT / "scripts/validate-prototype-construction.py"
SPEC = importlib.util.spec_from_file_location("validate_prototype_construction", VALIDATOR_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
CONSTRUCTIONS = json.loads((PACKAGE_ROOT / "prototype-constructions.json").read_text(encoding="utf-8"))
SCAFFOLDS = json.loads((PACKAGE_ROOT / "ontology-scaffolds.json").read_text(encoding="utf-8"))


def evaluate(constructions: dict, scaffolds: dict | None = None) -> dict:
    return MODULE.evaluate_registry(
        constructions,
        copy.deepcopy(SCAFFOLDS if scaffolds is None else scaffolds),
        repository_root=REPOSITORY_ROOT,
        check_files=True,
    )


cases: list[str] = []

baseline = evaluate(copy.deepcopy(CONSTRUCTIONS))
assert baseline["status"] == "PASS", baseline
entry = baseline["eligibility"]["GOV-D65-R2-PROTOTYPE-CONSTRUCTION-001"]
assert entry["product_approval_request"] == "eligible", baseline
assert entry["authority_request"] == "not_eligible", baseline
cases.append("passing-evidence-enables-product-approval-request")

construction = CONSTRUCTIONS["constructions"][0]
first = MODULE.freeze_candidate(construction)
second = MODULE.freeze_candidate(copy.deepcopy(construction))
assert first == second == construction["testable_product_candidate"]
cases.append("freeze-deterministic")

stale = copy.deepcopy(CONSTRUCTIONS)
stale["constructions"][0]["artifact_bindings"][0]["sha256"] = "0" * 64
assert evaluate(stale)["status"] == "BLOCK"
cases.append("stale-artifact-detected")

preapproval = copy.deepcopy(CONSTRUCTIONS)
preapproval["constructions"][0]["authority_requests"] = [{
    "request_id": "FORBIDDEN-PREAPPROVAL-REQUEST",
    "kind": "activation",
    "product_approval_id": "MISSING",
    "status": "candidate",
    "authority_effect": "none",
}]
result = evaluate(preapproval)
assert result["status"] == "BLOCK" and any("before exact tested-product approval" in item for item in result["errors"])
cases.append("preapproval-authority-request-rejected")

contradictory_evidence = copy.deepcopy(CONSTRUCTIONS)
contradictory_evidence["constructions"][0]["product_test_evidence"][0]["result"] = "FAIL"
result = evaluate(contradictory_evidence)
assert result["status"] == "BLOCK" and any("receipt result mismatch" in item for item in result["errors"])
cases.append("evidence-receipt-content-checked")

approved = copy.deepcopy(CONSTRUCTIONS)
row = approved["constructions"][0]
row["state"] = "product_approved"
row["product_approval"] = {
    "approval_id": "TEST-ONLY-PRODUCT-APPROVAL",
    "candidate_manifest_sha256": row["testable_product_candidate"]["manifest_sha256"],
    "test_evidence_ids": [item["evidence_id"] for item in row["product_test_evidence"]],
    "status": "approved",
    "decision_ref": "test-fixture-only",
    "authority_effect": "none",
}
result = evaluate(approved)
assert result["status"] == "PASS", result
assert result["eligibility"][row["construction_id"]]["authority_request"] == "eligible"
cases.append("approved-product-enables-authority-request-candidate")

bad_scaffold = copy.deepcopy(SCAFFOLDS)
bad_scaffold["scaffolds"][0]["canonicality"] = "authoritative"
assert evaluate(copy.deepcopy(CONSTRUCTIONS), bad_scaffold)["status"] == "BLOCK"
cases.append("scaffold-non-authority")

empty = copy.deepcopy(CONSTRUCTIONS)
empty["constructions"] = []
assert evaluate(empty)["status"] == "BLOCK"
cases.append("empty-is-not-pass")

print(json.dumps({"status": "PASS", "authority_effect": "none", "cases": sorted(cases)}, indent=2))
