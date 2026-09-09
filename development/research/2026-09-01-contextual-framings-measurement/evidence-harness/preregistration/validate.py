#!/usr/bin/env python3
"""Validate ACFT preregistration bindings and explicit owner decisions."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parents[5]
DIGEST = re.compile(r"^[0-9a-f]{64}$")
CANDIDATE_VERSION = "acft-preregistration-candidate@1"
DECISION_VERSION = "acft-owner-decision-record@1"


def load_json(path: Path) -> tuple[Any | None, list[str]]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), []
    except (OSError, json.JSONDecodeError) as exc:
        return None, [f"READ:{path}:{exc}"]


def exact_ref_errors(ref: Any, label: str, expected_path: str | None = None) -> list[str]:
    if not isinstance(ref, dict) or set(ref) != {"path", "sha256", "size"}:
        return [f"EXACT_REF:{label}:shape"]
    path = ref.get("path")
    if not isinstance(path, str) or not path or path.startswith("/") or ".." in Path(path).parts:
        return [f"EXACT_REF:{label}:path"]
    errors: list[str] = []
    if expected_path is not None and path != expected_path:
        errors.append(f"EXACT_REF:{label}:unexpected_path")
    if not DIGEST.fullmatch(str(ref.get("sha256", ""))):
        errors.append(f"EXACT_REF:{label}:digest_shape")
    target = (REPO_ROOT / path).resolve()
    try:
        target.relative_to(REPO_ROOT)
    except ValueError:
        return errors + [f"EXACT_REF:{label}:escape"]
    if not target.is_file():
        return errors + [f"EXACT_REF:{label}:missing"]
    raw = target.read_bytes()
    if ref.get("sha256") != hashlib.sha256(raw).hexdigest():
        errors.append(f"EXACT_REF:{label}:digest")
    if ref.get("size") != len(raw):
        errors.append(f"EXACT_REF:{label}:size")
    return errors


def validate_candidate(candidate: Any) -> list[str]:
    required = {
        "schema_version", "preregistration_id", "status", "authority_effect",
        "bindings", "research_question", "scope", "fixed_design_constraints",
        "analysis_hierarchy", "invalidation_rules", "instrument_stop_rules",
        "owner_decision_ids", "claim_governance", "live_execution",
    }
    if not isinstance(candidate, dict):
        return ["TYPE:candidate"]
    errors: list[str] = []
    if set(candidate) != required:
        errors.append("FIELDS:candidate")
    if candidate.get("schema_version") != CANDIDATE_VERSION:
        errors.append("ENUM:candidate.schema_version")
    if candidate.get("preregistration_id") != "acft-owner-controlled-preregistration@1":
        errors.append("ENUM:candidate.preregistration_id")
    if candidate.get("status") != "pending_owner_decisions" or candidate.get("authority_effect") != "none":
        errors.append("BOUNDARY:candidate.status_or_authority")
    bindings = candidate.get("bindings")
    expected_bindings = {
        "findings": "cyberAlchemy-v2/development/research/2026-09-01-contextual-framings-measurement/findings.md",
        "protocol": "cyberAlchemy-v2/development/research/2026-09-01-contextual-framings-measurement/evidence-harness/protocol.json",
        "paired_arm_manifest": "cyberAlchemy-v2/development/research/2026-09-01-contextual-framings-measurement/evidence-harness/fixtures/arm-manifest-pass.json",
    }
    if not isinstance(bindings, dict) or set(bindings) != set(expected_bindings):
        errors.append("FIELDS:candidate.bindings")
    else:
        for name, path in expected_bindings.items():
            errors.extend(exact_ref_errors(bindings[name], f"candidate.bindings.{name}", path))
    hierarchy = candidate.get("analysis_hierarchy")
    if hierarchy != [
        "P1a_comparative_boundary_error_safety",
        "P1b_treatment_only_adjudicated_analogy_harm",
        "P2_semantic_return_counterfactual_and_transfer_family",
        "secondary_process_cost_and_confidence_descriptive_only",
    ]:
        errors.append("ORDER:candidate.analysis_hierarchy")
    decision_ids = candidate.get("owner_decision_ids")
    if not isinstance(decision_ids, list) or len(decision_ids) != 22 or len(set(decision_ids)) != 22:
        errors.append("DECISIONS:candidate.owner_decision_ids")
    constraints = set(candidate.get("fixed_design_constraints", []))
    for required_constraint in {
        "evidence_atom_equivalence",
        "same_case_dual_exposure_forbidden",
        "first_exposure_primary",
        "safety_lexically_precedes_correctness",
        "interim_favorable_results_cannot_change_stopping_or_weights",
    }:
        if required_constraint not in constraints:
            errors.append(f"CONSTRAINT:candidate:{required_constraint}")
    claims = candidate.get("claim_governance")
    if not isinstance(claims, dict) or claims.get("claim_status_update_allowed") is not False:
        errors.append("CLAIM:candidate.claim_status_update_allowed")
    live = candidate.get("live_execution")
    expected_live = {
        "ready": False,
        "authorized": False,
        "authorization_ref": None,
        "recruitment_allowed": False,
        "participant_contact_allowed": False,
        "data_collection_allowed": False,
    }
    if live != expected_live:
        errors.append("LIVE_BOUNDARY:candidate.live_execution")
    return errors


def validate_decision(decision: Any, candidate: dict[str, Any], candidate_path: Path) -> tuple[list[str], int]:
    required = {
        "schema_version", "decision_record_id", "candidate_ref", "posture",
        "decisions", "owner_acceptance", "claim_status_update_allowed",
        "live_execution_authorization",
    }
    if not isinstance(decision, dict):
        return ["TYPE:decision"], 0
    errors: list[str] = []
    if set(decision) != required:
        errors.append("FIELDS:decision")
    if decision.get("schema_version") != DECISION_VERSION:
        errors.append("ENUM:decision.schema_version")
    candidate_relative = str(candidate_path.resolve().relative_to(REPO_ROOT))
    errors.extend(exact_ref_errors(decision.get("candidate_ref"), "decision.candidate_ref", candidate_relative))
    records = decision.get("decisions")
    decision_ids = candidate.get("owner_decision_ids", [])
    if not isinstance(records, dict) or list(records) != sorted(decision_ids):
        errors.append("DECISIONS:decision.keyset_or_order")
        return errors, 0
    resolved = 0
    record_fields = {"state", "prompt", "constraint", "value", "rationale", "decided_by", "decided_at"}
    for decision_id, record in records.items():
        label = f"decision.decisions.{decision_id}"
        if not isinstance(record, dict) or set(record) != record_fields:
            errors.append(f"FIELDS:{label}")
            continue
        if not isinstance(record.get("prompt"), str) or not record["prompt"]:
            errors.append(f"PROMPT:{label}")
        if not isinstance(record.get("constraint"), str) or not record["constraint"]:
            errors.append(f"CONSTRAINT:{label}")
        state = record.get("state")
        controlled = ("value", "rationale", "decided_by", "decided_at")
        if state == "unresolved":
            if any(record.get(field) is not None for field in controlled):
                errors.append(f"SILENT_DEFAULT:{label}")
        elif state == "decided":
            if any(record.get(field) is None for field in controlled):
                errors.append(f"INCOMPLETE_OWNER_DECISION:{label}")
            else:
                if not all(isinstance(record[field], str) and record[field] for field in ("rationale", "decided_by", "decided_at")):
                    errors.append(f"OWNER_EVIDENCE:{label}")
                resolved += 1
        else:
            errors.append(f"ENUM:{label}.state")
    total = len(decision_ids)
    acceptance = decision.get("owner_acceptance")
    acceptance_fields = {"state", "owner_id", "accepted_at", "signature"}
    accepted = False
    if not isinstance(acceptance, dict) or set(acceptance) != acceptance_fields:
        errors.append("FIELDS:decision.owner_acceptance")
    elif acceptance.get("state") == "not_recorded":
        if any(acceptance.get(field) is not None for field in ("owner_id", "accepted_at", "signature")):
            errors.append("PREMATURE_ACCEPTANCE_METADATA:decision.owner_acceptance")
    elif acceptance.get("state") == "accepted":
        if resolved != total or any(not isinstance(acceptance.get(field), str) or not acceptance[field] for field in ("owner_id", "accepted_at", "signature")):
            errors.append("INVALID_ACCEPTANCE:decision.owner_acceptance")
        else:
            accepted = True
    else:
        errors.append("ENUM:decision.owner_acceptance.state")
    expected_posture = (
        "preregistered_pending_live_authorization" if accepted
        else "ready_for_owner_acceptance" if resolved == total
        else "partial_owner_draft" if resolved > 0
        else "pending_owner_decisions"
    )
    if decision.get("posture") != expected_posture:
        errors.append(f"POSTURE:decision:expected_{expected_posture}")
    if decision.get("claim_status_update_allowed") is not False:
        errors.append("CLAIM:decision.claim_status_update_allowed")
    authorization = decision.get("live_execution_authorization")
    if authorization != {"authorized": False, "authorization_ref": None}:
        errors.append("LIVE_AUTHORITY:decision:separate_route_required")
    return errors, resolved


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--decision", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--require-live-ready", action="store_true")
    args = parser.parse_args()
    candidate, errors = load_json(args.candidate)
    decision, decision_read_errors = load_json(args.decision)
    errors.extend(decision_read_errors)
    if candidate is not None:
        errors.extend(validate_candidate(candidate))
    resolved = 0
    if candidate is not None and decision is not None:
        decision_errors, resolved = validate_decision(decision, candidate, args.candidate)
        errors.extend(decision_errors)
    total = len(candidate.get("owner_decision_ids", [])) if isinstance(candidate, dict) else 0
    live_ready = False
    receipt = {
        "schema_version": "acft-preregistration-readiness@1",
        "status": "fail" if errors else "pass_candidate",
        "preregistration_id": candidate.get("preregistration_id") if isinstance(candidate, dict) else None,
        "decision_posture": decision.get("posture") if isinstance(decision, dict) else None,
        "decision_fields_total": total,
        "decision_fields_resolved": resolved,
        "decision_fields_unresolved": total - resolved,
        "candidate_valid": not errors,
        "claim_status_update_allowed": False,
        "live_ready": live_ready,
        "live_execution_authorized": False,
        "remaining_gate": "owner_decisions_then_acceptance_then_separate_live_authorization",
    }
    if args.output and not errors:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(json.dumps({"status": "fail", "errors": len(errors), "live_ready": False}, sort_keys=True))
        return 1
    if args.require_live_ready:
        print("LIVE_BLOCKED:owner decisions, acceptance, and separate authorization required", file=sys.stderr)
        print(json.dumps({"status": "blocked", "live_ready": False}, sort_keys=True))
        return 1
    print(json.dumps(receipt, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
