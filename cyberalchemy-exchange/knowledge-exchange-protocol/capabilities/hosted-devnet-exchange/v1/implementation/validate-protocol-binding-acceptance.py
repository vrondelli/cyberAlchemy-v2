#!/usr/bin/env python3
"""Validate currentness of the accepted protocol-only binding target."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
DECISION = VERTICAL / "decisions/protocol-implementation-binding-acceptance-001.json"
CANDIDATE = ROOT / "protocol-implementation-binding-candidate-001.json"
RECORD = ROOT / "protocol-implementation-binding-record-001.json"
PREACCEPTANCE = ROOT / "evidence/protocol-implementation-binding-preacceptance-001.json"
HISTORICAL_ACCEPTANCE = VERTICAL / "decisions/implementation-binding-acceptance-001.json"
CANDIDATE_VALIDATOR = ROOT / "validate-protocol-binding-candidate-001.py"

DECISION_SHA256 = "36c801bcbcaec8bab5eb5482d30f9d6179f4a3dc9d0f9de6465387ac4da66003"
CANDIDATE_SHA256 = "9f7085ce7147a92c67b8028f9f327fbe0852a76497e178290b8c073f0ce292c5"
RECORD_SHA256 = "6d1b19414e8a76ef9e1e1d95cea39abb80d84a232a5437c37fa13cc56c2e8dc0"
MATERIAL_SHA256 = "8bb300efd40fbaa4b839fa0a173ff4e8c6a109553bf13b475795993e16814375"
PREACCEPTANCE_SHA256 = "15ae3653ee9aca04cf3c0af8094f170426278511dba6beb96f47a17a8b9eb08a"
HISTORICAL_ACCEPTANCE_SHA256 = "993d8bb23435a0fe568b602f71f3988a2cf642ed5b529097499ca83f01991748"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    expected = {
        DECISION: DECISION_SHA256,
        CANDIDATE: CANDIDATE_SHA256,
        RECORD: RECORD_SHA256,
        PREACCEPTANCE: PREACCEPTANCE_SHA256,
        HISTORICAL_ACCEPTANCE: HISTORICAL_ACCEPTANCE_SHA256,
    }
    for path, digest in expected.items():
        if not path.is_file() or sha(path) != digest:
            errors.append(f"digest drift: {path.relative_to(VERTICAL)}")

    decision = json.loads(DECISION.read_text())
    acceptance = decision.get("acceptance", {})
    expected_acceptance = {
        "lifecycle_status": "accepted",
        "accepted_candidate_id": "CA2-CANDIDATE-KEP-HOSTED-DEVNET-PROTOCOL-BINDING-001",
        "accepted_candidate_sha256": CANDIDATE_SHA256,
        "accepted_binding_id": "CA2-D65-KEP-HOSTED-DEVNET-PROTOCOL-001",
        "accepted_binding_scope": "protocol-kernel-without-participant-ui",
        "accepted_binding_record_sha256": RECORD_SHA256,
        "accepted_implementation_material_sha256": MATERIAL_SHA256,
    }
    for key, value in expected_acceptance.items():
        if acceptance.get(key) != value:
            errors.append(f"acceptance field mismatch: {key}")

    subject = decision.get("subject", {})
    if subject.get("excluded_selectors", {}).get("graph_nodes") != ["participant-workbench"]:
        errors.append("accepted UI-node exclusion mismatch")
    if set(subject.get("excluded_selectors", {}).get("graph_edges", [])) != {
        "workbench-calls-api",
        "workbench-seals-artifact",
        "workbench-submits-devnet-instruction",
    }:
        errors.append("accepted UI-edge exclusion mismatch")
    if subject.get("excluded_selectors", {}).get("runtime_constraints") != []:
        errors.append("accepted runtime-constraint exclusion must be empty")
    if decision.get("external_effect") != "none" or decision.get("enforcement_effect") != "none":
        errors.append("acceptance improperly claims external or enforcement effect")
    if decision.get("successor_authorization", {}).get("protocol_conformance_assessment") != "not-authorized-by-this-decision":
        errors.append("acceptance improperly authorizes successor conformance")

    env = dict(os.environ)
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    candidate_check = subprocess.run(
        ["python3", str(CANDIDATE_VALIDATOR)],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if candidate_check.returncode != 0:
        errors.append("fresh protocol candidate validation failed")

    result = {
        "decision_id": decision.get("decision_id"),
        "decision_sha256": sha(DECISION),
        "binding_scope": acceptance.get("accepted_binding_scope"),
        "candidate_sha256": acceptance.get("accepted_candidate_sha256"),
        "binding_record_sha256": acceptance.get("accepted_binding_record_sha256"),
        "implementation_material_sha256": acceptance.get("accepted_implementation_material_sha256"),
        "acceptance_status": acceptance.get("lifecycle_status"),
        "accepted_target_current": not errors,
        "result": "PASS" if not errors else "BLOCK",
        "errors": errors,
        "protocol_conformance": "not_evaluable",
        "full_hosted_capability_conformance": "not_evaluable-outside-scope",
        "authority_effect": "acceptance-only",
        "external_effect": "none",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
