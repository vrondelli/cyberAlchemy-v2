#!/usr/bin/env python3
"""Validate the exact, non-effectful ORODI CAV2-D48 exercise candidate."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
ROOT = Path(__file__).resolve().parents[1]
EXERCISE_PATH = ROOT / "exercises/ORODI-D48-DEFINE-SESSION-RUNTIME-001.json"
DECISION_PATH = ROOT / "exercises/decision-gates/ORODI-D48-CONTEXT-CURRENTNESS-001.decision.json"
EXPECTED_DECISION_SHA256 = "05a2ba167ada672a34fd620e4a7505edd321536edc85abf8fec9e490bffc2080"
EXPECTED_OUTCOMES = {
    "CAV2-CAND-ORODI-001": "survived-cross-context-challenge",
    "CAV2-CAND-ORODI-002": "survived-cross-context-challenge",
    "CAV2-CAND-ORODI-003": "revision-required",
    "CAV2-CAND-ORODI-004": "revision-required",
    "CAV2-CAND-ORODI-005": "revision-required",
    "CAV2-CAND-ORODI-006": "survived-cross-context-challenge",
    "CAV2-CAND-ORODI-007": "insufficient-positive-evidence",
    "CAV2-CAND-ORODI-008": "survived-cross-context-challenge",
    "CAV2-CAND-ORODI-009": "insufficient-positive-evidence",
    "CAV2-CAND-ORODI-010": "insufficient-positive-evidence",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_digest(value: dict) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def selector_sha256(path: Path, selector: str) -> str | None:
    data = path.read_bytes()
    marker = (selector + "\n").encode("utf-8")
    start = data.find(marker)
    if start < 0:
        return None
    next_heading = data.find(b"\n## ", start + len(marker))
    end = len(data) if next_heading < 0 else next_heading + 1
    return hashlib.sha256(data[start:end]).hexdigest()


def validate_exact_ref(binding: dict, label: str, failures: list[str]) -> None:
    require(set(binding) == {"ref", "sha256"}, f"{label}: invalid exact-ref shape", failures)
    path = REPO / str(binding.get("ref", ""))
    require(path.is_file(), f"{label}: missing source", failures)
    if path.is_file():
        require(sha256(path) == binding.get("sha256"), f"{label}: digest drift", failures)


def main() -> int:
    failures: list[str] = []
    exercise = load(EXERCISE_PATH)
    decision = load(DECISION_PATH)
    require(exercise.get("schema_version") == "domainspec.orodi.d48-cross-context-exercise/v1-candidate", "schema version mismatch", failures)
    require(exercise.get("status") == "completed-candidate-blocked-by-context-currentness", "exercise status mismatch", failures)
    require(exercise.get("authority_effect") == "none", "authority effect must remain none", failures)
    require(exercise.get("promotion_effect") == "none", "promotion effect must remain none", failures)
    require(exercise.get("implementation_effect") == "none", "implementation effect must remain none", failures)

    require(sha256(DECISION_PATH) == EXPECTED_DECISION_SHA256, "D48 owner-decision digest drift", failures)
    require(decision.get("decision_id") == "ORODI-D48-CONTEXT-CURRENTNESS-001", "D48 decision ID mismatch", failures)
    require(decision.get("decision_state") == "accepted", "D48 decision is not accepted", failures)
    require(decision.get("chosen_option") == "D48-ACCEPT-HISTORICAL-SNAPSHOT", "D48 selected option mismatch", failures)
    require(
        set(decision.get("owner_refs", []))
        == {"CyberAlchemy v2 Define runtime owner", "CyberAlchemy v2 definitions-governance owner"},
        "D48 decision owner set mismatch",
        failures,
    )
    decision_subject = decision.get("subject", {})
    require(decision_subject.get("ref") == str(EXERCISE_PATH.relative_to(REPO)), "D48 decision subject path mismatch", failures)
    require(decision_subject.get("sha256") == sha256(EXERCISE_PATH), "D48 decision subject digest mismatch", failures)
    require(decision.get("authority_effect") == "historical-d48-exercise-input-acceptance-only", "D48 decision authority effect mismatch", failures)
    require(decision.get("promotion_effect") == "none", "D48 decision must not promote definitions", failures)

    lifecycle = exercise.get("lifecycle_binding", {})
    definitions_path = REPO / str(lifecycle.get("source_path", ""))
    require(lifecycle.get("definition_id") == "CAV2-D48", "wrong lifecycle definition", failures)
    require(definitions_path.is_file(), "canonical definitions source missing", failures)
    if definitions_path.is_file():
        actual_selector = selector_sha256(definitions_path, str(lifecycle.get("selector", "")))
        require(actual_selector == lifecycle.get("selector_sha256"), "CAV2-D48 selector digest drift", failures)

    origin = exercise.get("originating_candidate", {})
    validate_exact_ref(origin.get("pack_ref", {}), "definition pack", failures)
    validate_exact_ref(origin.get("disposition_ref", {}), "definition disposition", failures)
    pack = load(REPO / str(origin.get("pack_ref", {}).get("ref", "")))
    disposition = load(REPO / str(origin.get("disposition_ref", {}).get("ref", "")))
    pack_records = {
        item.get("record_id"): item
        for item in pack.get("handled_definitions", [])
        if isinstance(item, dict)
    }
    shared_rows = {
        item.get("candidate_id"): item
        for item in disposition.get("disposition", {}).get("shared_track", [])
        if isinstance(item, dict)
    }
    require(set(shared_rows) == set(EXPECTED_OUTCOMES), "shared-track candidate set mismatch", failures)

    evidence_ids: set[str] = set()
    for binding in exercise.get("exact_context_evidence", []):
        evidence_id = binding.get("evidence_id")
        require(bool(evidence_id) and evidence_id not in evidence_ids, f"duplicate or empty evidence ID: {evidence_id}", failures)
        evidence_ids.add(evidence_id)
        validate_exact_ref({"ref": binding.get("ref"), "sha256": binding.get("sha256")}, f"context evidence {evidence_id}", failures)
    require(len(evidence_ids) == 8, "expected exactly eight context evidence inputs", failures)

    admissibility = decision.get("admissibility", {})
    validate_exact_ref(admissibility.get("request_ref", {}), "D48 decision request", failures)
    validate_exact_ref(admissibility.get("receipt_ref", {}), "D48 admissibility receipt", failures)
    request = load(REPO / str(admissibility.get("request_ref", {}).get("ref", "")))
    receipt = load(REPO / str(admissibility.get("receipt_ref", {}).get("ref", "")))
    require(canonical_digest(request) == admissibility.get("canonical_request_digest"), "D48 canonical request digest mismatch", failures)
    require(receipt.get("requestDigest") == admissibility.get("canonical_request_digest"), "D48 receipt request digest mismatch", failures)
    require(decision.get("chosen_option") in receipt.get("admissibleOptionIds", []), "D48 selected option was not admissible", failures)
    accepted_snapshot = decision.get("accepted_snapshot", {})
    validate_exact_ref(accepted_snapshot.get("validation_receipt_ref", {}), "accepted Define evidence snapshot", failures)

    live_context = exercise.get("live_context_validation", {})
    live_validator = REPO / str(live_context.get("validator_ref", ""))
    require(live_validator.is_file(), "live context validator missing", failures)
    live_result: dict = {}
    if live_validator.is_file():
        completed = subprocess.run(
            ["python3", str(live_validator)],
            cwd=REPO,
            text=True,
            capture_output=True,
            check=False,
        )
        try:
            live_result = json.loads(completed.stdout)
        except json.JSONDecodeError as error:
            failures.append(f"live context validator emitted invalid JSON: {error}")
        require(live_result.get("overall") == live_context.get("observed_overall"), "live context overall drift", failures)
        require(live_result.get("material_digest") == live_context.get("observed_material_digest"), "live context material digest drift", failures)
        live_checks = {
            item.get("check_id"): item.get("outcome")
            for item in live_result.get("checks", [])
            if isinstance(item, dict)
        }
        for selected in live_context.get("selected_outcomes", []):
            require(live_checks.get(selected.get("check_id")) == selected.get("outcome"), f"live context check drift: {selected.get('check_id')}", failures)

    results = exercise.get("results", [])
    result_ids = [item.get("candidate_id") for item in results]
    require(len(results) == 10 and set(result_ids) == set(EXPECTED_OUTCOMES), "result candidate coverage mismatch", failures)
    require(len(result_ids) == len(set(result_ids)), "duplicate result candidate", failures)
    for result in results:
        candidate_id = result.get("candidate_id")
        source_row = shared_rows.get(candidate_id, {})
        source_record = pack_records.get(result.get("source_record_id"), {})
        require(result.get("outcome") == EXPECTED_OUTCOMES.get(candidate_id), f"{candidate_id}: outcome mismatch", failures)
        require(source_row.get("source_record_id") == result.get("source_record_id"), f"{candidate_id}: disposition source mismatch", failures)
        require(source_record.get("term") == result.get("term"), f"{candidate_id}: source term mismatch", failures)
        require(bool(result.get("exercise_observation")), f"{candidate_id}: observation missing", failures)
        require(bool(result.get("counterevidence")), f"{candidate_id}: counterevidence missing", failures)
        require(bool(result.get("semantic_residue")), f"{candidate_id}: semantic residue missing", failures)
        require(bool(result.get("recommendation")), f"{candidate_id}: recommendation missing", failures)
        require(bool(result.get("evidence_refs")), f"{candidate_id}: evidence refs missing", failures)
        require(set(result.get("evidence_refs", [])) <= evidence_ids, f"{candidate_id}: unknown evidence ref", failures)

    outcome_counts = {
        outcome: sum(item.get("outcome") == outcome for item in results)
        for outcome in set(EXPECTED_OUTCOMES.values())
    }
    summary = exercise.get("summary", {})
    require(summary.get("survived_cross_context_challenge") == outcome_counts["survived-cross-context-challenge"], "survived count mismatch", failures)
    require(summary.get("revision_required") == outcome_counts["revision-required"], "revision count mismatch", failures)
    require(summary.get("insufficient_positive_evidence") == outcome_counts["insufficient-positive-evidence"], "insufficient count mismatch", failures)
    require(summary.get("promotion_ready") == 0, "exercise must not claim promotion readiness", failures)
    accepted_result = decision.get("accepted_exercise_result", {})
    for field in (
        "survived_cross_context_challenge",
        "revision_required",
        "insufficient_positive_evidence",
        "promotion_ready",
    ):
        require(accepted_result.get(field) == summary.get(field), f"accepted exercise result mismatch: {field}", failures)
    require(exercise.get("challenge_review", {}).get("state") == "blocked-by-context-currentness", "owner review currentness block missing", failures)
    require(len(exercise.get("remaining_blockers", [])) >= 7, "remaining blockers are incomplete", failures)

    receipt = {
        "schema_version": "domainspec.orodi.d48-cross-context-validation/v1",
        "exercise_id": exercise.get("exercise_id"),
        "exercise_sha256": sha256(EXERCISE_PATH),
        "status": "pass" if not failures else "fail",
        "counts": {
            "candidates": len(results),
            "survived_cross_context_challenge": outcome_counts.get("survived-cross-context-challenge", 0),
            "revision_required": outcome_counts.get("revision-required", 0),
            "insufficient_positive_evidence": outcome_counts.get("insufficient-positive-evidence", 0),
            "exact_context_evidence": len(evidence_ids),
        },
        "context_currentness": accepted_snapshot.get("snapshot_currentness"),
        "decision_state": decision.get("decision_state"),
        "owner_review_state": "snapshot-input-accepted-results-review-pending",
        "failures": failures,
        "authority_effect": "historical-d48-exercise-input-acceptance-only",
        "promotion_effect": "none",
        "claim_ceiling": "The exact historical snapshot is accepted as semantic challenge input and its live drift remains explicit. No current-runtime acceptance, candidate rewrite, canonical promotion, ontology admission, implementation, publication, release, deployment, or external effect is established.",
    }
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
