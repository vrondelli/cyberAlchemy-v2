#!/usr/bin/env python3
"""Validate the immutable ORODI definitions-owner disposition."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
DEFINITIONS_ROOT = Path(__file__).resolve().parents[1]
PACK_PATH = DEFINITIONS_ROOT / "ORODI-DEFINITION-PACK.v1-candidate.json"
DECISION_PATH = DEFINITIONS_ROOT / "owner-decisions" / "ORODI-DEFINITIONS-DISPOSITION-002.json"
CLUSTER_PATH = REPO / "cyberAlchemy-v2/authority/definitions/source-clusters/orodi-operational-evidence.md"
CANONICAL_PATH = REPO / "cyberAlchemy-v2/authority/definitions/DEFINITIONS.md"

EXPECTED_PACK_DIGEST = "66aedc5756733a1064e401bb1688bdb65850ae154fa1bb4ebf6cc6a264cf0c7d"
EXPECTED_SHARED = {
    "DEFINE-HANDLED-DEFINITION-ORODI-002",
    "DEFINE-HANDLED-DEFINITION-ORODI-003",
    "DEFINE-HANDLED-DEFINITION-ORODI-004",
    "DEFINE-HANDLED-DEFINITION-ORODI-005",
    "DEFINE-HANDLED-DEFINITION-ORODI-006",
    "DEFINE-HANDLED-DEFINITION-ORODI-007",
    "DEFINE-HANDLED-DEFINITION-ORODI-008",
    "DEFINE-HANDLED-DEFINITION-ORODI-012",
    "DEFINE-HANDLED-DEFINITION-ORODI-013",
    "DEFINE-HANDLED-DEFINITION-ORODI-014",
}
EXPECTED_LOCAL = {
    "DEFINE-HANDLED-DEFINITION-ORODI-001",
    "DEFINE-HANDLED-DEFINITION-ORODI-009",
    "DEFINE-HANDLED-DEFINITION-ORODI-010",
    "DEFINE-HANDLED-DEFINITION-ORODI-011",
    "DEFINE-HANDLED-DEFINITION-ORODI-015",
    "DEFINE-HANDLED-DEFINITION-ORODI-016",
    "DEFINE-HANDLED-DEFINITION-ORODI-017",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def main() -> int:
    failures: list[str] = []

    require(PACK_PATH.is_file(), "definition pack missing", failures)
    require(DECISION_PATH.is_file(), "owner decision missing", failures)
    require(CLUSTER_PATH.is_file(), "promotion candidate cluster missing", failures)
    if failures:
        print(json.dumps({"status": "fail", "failures": failures}, indent=2, sort_keys=True))
        return 1

    pack = json.loads(PACK_PATH.read_text(encoding="utf-8"))
    decision = json.loads(DECISION_PATH.read_text(encoding="utf-8"))

    require(sha256(PACK_PATH) == EXPECTED_PACK_DIGEST, "definition pack digest drift", failures)
    require(decision.get("schema_version") == "domainspec.orodi.definition-owner-decision/v1", "schema_version mismatch", failures)
    require(decision.get("decision_id") == "ORODI-DECISION-DEFINITIONS-002", "decision_id mismatch", failures)
    require(decision.get("decision_state") == "approved", "decision must be approved", failures)
    require(decision.get("owner_ref") == "CyberAlchemy v2 definitions-governance owner", "owner mismatch", failures)
    require(decision.get("subject", {}).get("sha256") == EXPECTED_PACK_DIGEST, "decision subject digest mismatch", failures)
    require(decision.get("authority_effect") == "definition-disposition-only", "authority effect mismatch", failures)
    require(decision.get("implementation_effect") == "none", "implementation effect must be none", failures)

    shared = {item.get("source_record_id") for item in decision.get("disposition", {}).get("shared_track", [])}
    local = {item.get("source_record_id") for item in decision.get("disposition", {}).get("bounded_context_track", [])}
    require(shared == EXPECTED_SHARED, "shared-track record set mismatch", failures)
    require(local == EXPECTED_LOCAL, "bounded-context record set mismatch", failures)
    require(not (shared & local), "disposition tracks overlap", failures)

    pack_ids = {item.get("record_id") for item in pack.get("handled_definitions", [])}
    require(shared | local == pack_ids, "decision does not cover all pack definitions", failures)

    candidate_ids = [item.get("candidate_id") for item in decision.get("disposition", {}).get("shared_track", [])]
    require(len(candidate_ids) == 10 and len(set(candidate_ids)) == 10, "candidate IDs must be ten unique values", failures)
    require(all(re.fullmatch(r"CAV2-CAND-ORODI-\d{3}", value or "") for value in candidate_ids), "invalid candidate ID", failures)

    canonical_text = CANONICAL_PATH.read_text(encoding="utf-8")
    require(not any(candidate_id in canonical_text for candidate_id in candidate_ids), "candidate ID leaked into canonical definitions", failures)
    require(decision.get("canonical_promotion", {}).get("state") == "blocked", "canonical promotion must remain blocked", failures)
    require(decision.get("canonical_promotion", {}).get("blocker") == "CAV2-D48-cross-context-exercise-missing", "canonical blocker mismatch", failures)
    require(decision.get("candidate_cluster", {}).get("sha256") == sha256(CLUSTER_PATH), "candidate cluster digest drift", failures)

    result = {
        "schema_version": "domainspec.orodi.definition-owner-decision-validation/v1",
        "decision_id": decision.get("decision_id"),
        "decision_sha256": sha256(DECISION_PATH),
        "pack_sha256": sha256(PACK_PATH),
        "candidate_cluster_sha256": sha256(CLUSTER_PATH),
        "shared_track_count": len(shared),
        "bounded_context_track_count": len(local),
        "canonical_promotion": "blocked",
        "next_owner_gate": decision.get("next_owner_gate"),
        "status": "pass" if not failures else "fail",
        "failures": failures,
        "authority_effect": "none-beyond-recorded-definition-disposition",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
