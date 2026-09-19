#!/usr/bin/env python3
"""Validate ORODI D48 evidence and its optional exact promotion successor."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
ROOT = Path(__file__).resolve().parents[1]
REVISION_PATH = ROOT / "revisions/ORODI-D48-DEFINITION-REVISIONS-001.json"
CONTRACT_PATH = ROOT / "exercises/ORODI-D48-ARTIFACT-RELEASE-001.contract.json"
OBSERVATION_PATH = ROOT / "exercises/ORODI-D48-ARTIFACT-RELEASE-001.observation.json"
REVIEW_PATH = ROOT / "reviews/ORODI-D48-TEN-TERM-REVIEW-001.json"
PROMOTION_PATH = REPO / "cyberAlchemy-v2/authority/definitions/decisions/orodi-operational-evidence-promotion/selection.json"

IMMUTABLE_HASHES = {
    ROOT / "ORODI-DEFINITION-PACK.v1-candidate.json": "66aedc5756733a1064e401bb1688bdb65850ae154fa1bb4ebf6cc6a264cf0c7d",
    ROOT / "ORODI-UBIQUITOUS-LANGUAGE.v1-candidate.json": "8404165b17d1ff445337027cab92f9dbc19451c24d49570d4ceca290c95d6b14",
    ROOT / "UBIQUITOUS-LANGUAGE.md": "b96499466255a7d4c6460fd9988035f56527c3eb9490ee4042649dd8a3c189e9",
}

EXPECTED_REVISIONS = {
    "CAV2-CAND-ORODI-003-R1": "CAV2-CAND-ORODI-003",
    "CAV2-CAND-ORODI-004-R1": "CAV2-CAND-ORODI-004",
    "CAV2-CAND-ORODI-005-R1": "CAV2-CAND-ORODI-005",
}

EXPECTED_SELECTION = {
    "CAV2-CAND-ORODI-001",
    "CAV2-CAND-ORODI-002",
    "CAV2-CAND-ORODI-003-R1",
    "CAV2-CAND-ORODI-004-R1",
    "CAV2-CAND-ORODI-005-R1",
    "CAV2-CAND-ORODI-006",
    "CAV2-CAND-ORODI-007",
    "CAV2-CAND-ORODI-008",
    "CAV2-CAND-ORODI-009",
    "CAV2-CAND-ORODI-010",
}

POSITIVE_EVIDENCE_IDS = {
    "CAV2-CAND-ORODI-007",
    "CAV2-CAND-ORODI-009",
    "CAV2-CAND-ORODI-010",
}

EXPECTED_PROMOTIONS = {
    "CAV2-CAND-ORODI-001": "CAV2-D83",
    "CAV2-CAND-ORODI-002": "CAV2-D84",
    "CAV2-CAND-ORODI-003-R1": "CAV2-D85",
    "CAV2-CAND-ORODI-004-R1": "CAV2-D86",
    "CAV2-CAND-ORODI-005-R1": "CAV2-D87",
    "CAV2-CAND-ORODI-006": "CAV2-D88",
    "CAV2-CAND-ORODI-007": "CAV2-D89",
    "CAV2-CAND-ORODI-008": "CAV2-D90",
    "CAV2-CAND-ORODI-009": "CAV2-D91",
    "CAV2-CAND-ORODI-010": "CAV2-D92",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def exact_ref(binding: dict, label: str, failures: list[str]) -> Path:
    require(set(binding) == {"ref", "sha256"}, f"{label}: invalid exact-ref shape", failures)
    path = REPO / str(binding.get("ref", ""))
    require(path.is_file(), f"{label}: source missing", failures)
    if path.is_file():
        require(sha256(path) == binding.get("sha256"), f"{label}: digest drift", failures)
    return path


def main() -> int:
    failures: list[str] = []

    for path, expected in IMMUTABLE_HASHES.items():
        require(path.is_file(), f"protected predecessor missing: {path}", failures)
        if path.is_file():
            require(sha256(path) == expected, f"protected predecessor drift: {path}", failures)

    revision = load(REVISION_PATH)
    require(revision.get("schema_version") == "domainspec.orodi.definition-revision-set/v1-candidate", "revision schema mismatch", failures)
    require(revision.get("status") == "candidate-review-pending", "revision status mismatch", failures)
    exact_ref(revision.get("predecessor_pack", {}), "revision predecessor", failures)
    for name, binding in revision.get("challenge_basis", {}).items():
        exact_ref(binding, f"revision challenge {name}", failures)
    revisions = revision.get("revisions", [])
    revision_by_id = {item.get("candidate_id"): item for item in revisions}
    require(set(revision_by_id) == set(EXPECTED_REVISIONS), "revision candidate set mismatch", failures)
    require(len(revisions) == len(revision_by_id), "duplicate revision candidate", failures)
    for candidate_id, predecessor_id in EXPECTED_REVISIONS.items():
        item = revision_by_id.get(candidate_id, {})
        require(item.get("source_candidate_id") == predecessor_id, f"{candidate_id}: predecessor mismatch", failures)
        for voice in ("normative_voice", "formal_voice", "plain_language_voice", "domain_context_voice", "boundary"):
            require(bool(item.get(voice)), f"{candidate_id}: missing {voice}", failures)
        require(item.get("status") == "candidate", f"{candidate_id}: must remain candidate", failures)
        require(item.get("authority_effect") == "none", f"{candidate_id}: authority effect must remain none", failures)
    require(revision.get("promotion_effect") == "none", "revision promotion effect must remain none", failures)

    contract = load(CONTRACT_PATH)
    observation = load(OBSERVATION_PATH)
    require(contract.get("schema_version") == "domainspec.orodi.d48-artifact-release-contract/v1-candidate", "contract schema mismatch", failures)
    require(observation.get("schema_version") == "domainspec.orodi.d48-artifact-release-observation/v1-candidate", "observation schema mismatch", failures)
    require(contract.get("exercise_id") == observation.get("exercise_id"), "exercise identity mismatch", failures)
    exact_ref(observation.get("contract_ref", {}), "observation contract", failures)
    require(observation.get("status") == "pass", "observation is not pass", failures)

    for label, artifact in contract.get("artifacts", {}).items():
        source = Path(str(artifact.get("source_path", "")))
        require(source.is_file(), f"{label} artifact missing", failures)
        if source.is_file():
            require(sha256(source) == artifact.get("sha256"), f"{label} artifact digest drift", failures)
            require(source.stat().st_size == artifact.get("size_bytes"), f"{label} artifact size drift", failures)
    denominator = contract.get("telemetry_denominator", [])
    denominator_ids = {item.get("event_id") for item in denominator}
    require(len(denominator) == 6 and len(denominator_ids) == 6, "telemetry denominator must contain six unique events", failures)
    for item in denominator:
        source = Path(str(item.get("source_path", "")))
        require(source.is_file(), f"telemetry source missing: {source}", failures)
        if source.is_file():
            require(sha256(source) == item.get("source_sha256"), f"telemetry source digest drift: {source}", failures)

    observations = observation.get("independent_observations", {})
    pre = observations.get("pre_state", {})
    deployed = observations.get("post_deployment_state", {})
    telemetry = observations.get("telemetry_state", {})
    restored = observations.get("post_rollback_state", {})
    stable_digest = contract.get("artifacts", {}).get("stable", {}).get("sha256")
    candidate_digest = contract.get("artifacts", {}).get("candidate", {}).get("sha256")
    require(pre.get("observed_sha256") == stable_digest and pre.get("critical_outcome_exit") == 0, "stable pre-state observation failed", failures)
    require(deployed.get("observed_sha256") == candidate_digest, "candidate post-state digest mismatch", failures)
    require(deployed.get("critical_outcome_exit") == 1, "candidate behavior observation mismatch", failures)
    observer_pids = {pre.get("observer_pid"), deployed.get("observer_pid"), telemetry.get("observer_pid"), restored.get("observer_pid")}
    require(None not in observer_pids and len(observer_pids) == 4, "observers are not four distinct processes", failures)

    fates = telemetry.get("fates", {})
    fate_ids = [event_id for values in fates.values() for event_id in values]
    require(len(fate_ids) == len(set(fate_ids)), "telemetry event has multiple fates", failures)
    require(set(fate_ids) == denominator_ids, "telemetry fate set does not close denominator", failures)
    require(telemetry.get("offered") == telemetry.get("queued") + telemetry.get("rejected"), "offered conservation failed", failures)
    require(telemetry.get("queued") == telemetry.get("exported") + telemetry.get("dropped") + telemetry.get("pending"), "queued conservation failed", failures)
    require(telemetry.get("unaccounted_event_count") == 0, "telemetry contains unaccounted events", failures)
    require(telemetry.get("dropped", 0) > 0 and telemetry.get("pending", 0) > 0, "loss and pending behavior were not positively exercised", failures)

    require(restored.get("observed_sha256") == stable_digest, "restored stable digest mismatch", failures)
    require(restored.get("critical_outcome_exit") == 0, "critical outcome was not restored", failures)
    require(restored.get("candidate_references") == 0, "candidate reference remains after rollback", failures)
    require(restored.get("rollback_inventory_observed") == "1/1", "rollback inventory is incomplete", failures)
    environment = observation.get("historical_environment", {})
    started = datetime.fromisoformat(str(environment.get("started_at", "")).replace("Z", "+00:00"))
    completed = datetime.fromisoformat(str(environment.get("completed_at", "")).replace("Z", "+00:00"))
    require((completed - started).total_seconds() <= contract.get("deadline_seconds", -1), "rollback deadline exceeded", failures)
    require(environment.get("teardown") == "pass" and environment.get("current_environment_exists") is False, "temporary environment teardown not proven", failures)
    term_evidence = observation.get("term_evidence", [])
    require({item.get("candidate_id") for item in term_evidence} == POSITIVE_EVIDENCE_IDS, "positive-evidence term set mismatch", failures)
    require(all(item.get("outcome") == "positive-second-context-evidence" for item in term_evidence), "positive-evidence outcome mismatch", failures)
    require(observation.get("promotion_effect") == "none", "observation promotion effect must remain none", failures)

    review = load(REVIEW_PATH)
    require(review.get("schema_version") == "domainspec.orodi.d48-ten-term-review/v1-candidate", "review schema mismatch", failures)
    for name, binding in review.get("review_basis", {}).items():
        exact_ref(binding, f"review basis {name}", failures)
    results = review.get("review_results", [])
    require(len(results) == 10, "review must contain ten results", failures)
    require([item.get("ordinal") for item in results] == list(range(1, 11)), "review ordinals mismatch", failures)
    selected = [item.get("selected_candidate_id") for item in results]
    require(len(selected) == len(set(selected)) and set(selected) == EXPECTED_SELECTION, "promotion candidate selection mismatch", failures)
    require(set(review.get("promotion_candidate_selection", [])) == EXPECTED_SELECTION, "review selection summary mismatch", failures)
    positive_results = {item.get("source_candidate_id") for item in results if item.get("review_outcome") == "positive-evidence-satisfied"}
    require(positive_results == POSITIVE_EVIDENCE_IDS, "review positive-evidence set mismatch", failures)
    successor_results = {item.get("selected_candidate_id") for item in results if item.get("review_outcome") == "select-successor-revision"}
    require(successor_results == set(EXPECTED_REVISIONS), "review successor selection mismatch", failures)
    summary = review.get("summary", {})
    require(summary == {
        "reviewed": 10,
        "retained_predecessor_candidates": 4,
        "selected_successor_revisions": 3,
        "positive_evidence_satisfied": 3,
        "promotion_consideration_eligible": 10,
        "canonical_promotions": 0,
    }, "review summary mismatch", failures)
    require(review.get("canonical_promotion_decision") == "not-taken", "review improperly records a promotion decision", failures)
    require(review.get("promotion_effect") == "none", "review promotion effect must remain none", failures)
    require(review.get("implementation_effect") == "none", "review implementation effect must remain none", failures)

    promotion_state = "not-taken"
    promoted_count = 0
    if PROMOTION_PATH.is_file():
        promotion = load(PROMOTION_PATH)
        promotion_state = str(promotion.get("decision_state"))
        require(promotion.get("schema_version") == "cav2.definition-promotion-decision/v1", "promotion schema mismatch", failures)
        require(promotion_state == "promoted", "promotion decision is not promoted", failures)
        immutable_inputs = promotion.get("immutable_inputs", {})
        for name, binding in immutable_inputs.items():
            exact_ref(binding, f"promotion input {name}", failures)
        require(
            immutable_inputs.get("definition_pack", {}).get("sha256") == IMMUTABLE_HASHES[ROOT / "ORODI-DEFINITION-PACK.v1-candidate.json"],
            "promotion definition-pack digest mismatch",
            failures,
        )
        require(immutable_inputs.get("revision_set", {}).get("sha256") == sha256(REVISION_PATH), "promotion revision digest mismatch", failures)
        require(immutable_inputs.get("positive_second_context_observation", {}).get("sha256") == sha256(OBSERVATION_PATH), "promotion observation digest mismatch", failures)
        require(immutable_inputs.get("ten_term_review", {}).get("sha256") == sha256(REVIEW_PATH), "promotion review digest mismatch", failures)
        promoted = promotion.get("selected_definitions", [])
        promoted_map = {item.get("candidate_ref"): item.get("definition_id") for item in promoted}
        require(len(promoted) == len(promoted_map), "duplicate promoted candidate", failures)
        require(promoted_map == EXPECTED_PROMOTIONS, "promotion selection or ID allocation mismatch", failures)
        promoted_count = len(promoted_map)
        postimages = promotion.get("canonical_postimages", [])
        require(len(postimages) == 5, "canonical postimage set must contain five files", failures)
        for index, binding in enumerate(postimages):
            exact_ref(binding, f"canonical postimage {index}", failures)
        require(promotion.get("reserved_ids", {}).get("state") == "withdrawn-and-not-reused", "withdrawn ID protection missing", failures)
        require(promotion.get("authority_effect") == "canonical-definition-promotion-only", "promotion authority effect mismatch", failures)
        require(promotion.get("ontology_admission_effect") == "none", "promotion must not admit ontology", failures)
        require(promotion.get("implementation_effect") == "none", "promotion must not authorize implementation", failures)

    receipt = {
        "schema_version": "domainspec.orodi.d48-completion-validation/v1",
        "status": "pass" if not failures else "fail",
        "revision_set_sha256": sha256(REVISION_PATH),
        "positive_evidence_contract_sha256": sha256(CONTRACT_PATH),
        "positive_evidence_observation_sha256": sha256(OBSERVATION_PATH),
        "ten_term_review_sha256": sha256(REVIEW_PATH),
        "counts": {
            "revised_definitions": len(revisions),
            "positive_second_context_terms": len(term_evidence),
            "reviewed_results": len(results),
            "canonical_promotions_in_candidate_review": summary.get("canonical_promotions"),
            "canonical_promotions_in_successor_decision": promoted_count,
        },
        "promotion_decision_state": promotion_state,
        "next_gate": "version-exact ORODI successor language and definition binding" if promotion_state == "promoted" else "definitions-governance owner canonical promotion decision",
        "failures": failures,
        "authority_effect": "validated-exact-definition-promotion" if promotion_state == "promoted" else "candidate-validation-only",
        "promotion_effect": "verified" if promotion_state == "promoted" else "none",
        "claim_ceiling": "PASS verifies the candidate evidence and, when present, the exact definitions-owner promotion postimages. It does not admit ontology or profile, authorize implementation, establish conformance or runtime truth, or authorize effects.",
    }
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
