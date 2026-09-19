#!/usr/bin/env python3
"""Join current local and EVF evidence for one exact Authorization API candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


REPOSITORY = Path(__file__).resolve().parents[6]
ROOT = REPOSITORY / "projects/auth-foundation/development/auth-service-d65-r2-plan/authorization-api-v1"
EVF = ROOT / "evf-v1"
CANDIDATE = ROOT / "AUTHORIZATION-API-CANDIDATE.v1.json"
LOCAL = ROOT / "VALIDATION-RECEIPT.json"
PROFILE = EVF / "enforcement-profile.json"
RUN_DIGEST = "90006cb487bae09dd7f04e12e9abad968007327c012ac6f6a0e40c0666988e7c"
RUN = EVF / "runs/sha256" / RUN_DIGEST / "auth-api-node13-evf-002"
EVIDENCE = RUN / "EVIDENCE.json"
VERIFICATION = RUN / "VERIFICATION.json"
OUTPUT = EVF / "EVIDENCE-JOIN.json"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def exact_ref(path: Path) -> dict:
    data = path.read_bytes()
    return {
        "path": str(path.relative_to(REPOSITORY)),
        "sha256": sha256(data),
        "size_bytes": len(data),
        "location": "repository",
        "current": True,
    }


def joined_receipt() -> dict:
    candidate = load(CANDIDATE)
    local = load(LOCAL)
    profile = load(PROFILE)
    evidence = load(EVIDENCE)
    verification = load(VERIFICATION)
    candidate_digest = candidate["candidate_digest"]
    checks = {
        "candidate_frozen": candidate.get("status") == "frozen-local-authorization-api-product-candidate",
        "local_validation_passed": local.get("status") == "pass" and local.get("candidate_digest") == candidate_digest,
        "evf_profile_binds_candidate": any(ref.get("path") == str(CANDIDATE.relative_to(REPOSITORY)) and ref.get("sha256") == exact_ref(CANDIDATE)["sha256"] for ref in profile.get("binding_refs", [])),
        "evf_aggregate_passed": evidence.get("aggregate_state") == "passed" and evidence.get("all_required_stages_present") is True and evidence.get("denominator") == {"stages": 13, "checks": 1, "mutations": 1},
        "evf_payload_identity_current": evidence.get("evidence_payload_digest") == RUN_DIGEST,
        "independent_verification_passed": verification.get("verdict") == "passed" and verification.get("all_refs_current") is True and verification.get("replay_equal") is True and verification.get("recomputed_aggregate_state") == "passed",
        "authority_remains_absent": evidence.get("authority_effect") == "none" and evidence.get("release_admission") == "not-granted",
    }
    state = "passed" if all(checks.values()) else "blocked"
    payload = {
        "schema_version": "auth.authorization-api-evidence-join/v1",
        "join_id": "AUTHORIZATION-API-NODE-13-EVF-JOIN-001",
        "candidate_id": candidate["candidate_id"],
        "candidate_digest": candidate_digest,
        "state": state,
        "constituent_refs": {
            "candidate": exact_ref(CANDIDATE),
            "local_validation": exact_ref(LOCAL),
            "evf_profile": exact_ref(PROFILE),
            "evf_aggregate": exact_ref(EVIDENCE),
            "evf_independent_verification": exact_ref(VERIFICATION),
        },
        "checks": checks,
        "supported_claim": "The exact node-13 Authorization API candidate passed the declared local validation and the digest-bound EVF executable profile with all 13 stages, two equal positive repetitions, a cause-specific stale-candidate negative control, current references, and independent replay verification.",
        "residue": [
            "product-owner approval not requested or granted",
            "caller authentication and TLS not implemented or tested",
            "production load and capacity budgets not selected or tested",
            "listener activation, publication, release, and deployment not authorized",
        ],
        "authority_effect": "none",
        "claim_ceiling": "Evidence join for one exact local candidate only; not product approval, admission, activation, production readiness, publication, release, deployment, or external-effect authority.",
    }
    return {**payload, "join_payload_digest": sha256(canonical(payload))}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    receipt = joined_receipt()
    encoded = json.dumps(receipt, indent=2, sort_keys=True) + "\n"
    if receipt["state"] != "passed":
        print(encoded, end="")
        return 2
    if args.verify:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != encoded:
            raise SystemExit("EVIDENCE_JOIN_DRIFT")
        print(json.dumps({"status": "pass", "candidate_digest": receipt["candidate_digest"], "join_payload_digest": receipt["join_payload_digest"]}, sort_keys=True))
        return 0
    OUTPUT.write_text(encoded, encoding="utf-8")
    print(json.dumps({"status": "materialized", "candidate_digest": receipt["candidate_digest"], "join_payload_digest": receipt["join_payload_digest"]}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
