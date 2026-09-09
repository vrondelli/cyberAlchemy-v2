#!/usr/bin/env python3
"""Generate the bound owner template and invalid preregistration fixtures."""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FIXTURES = ROOT / "fixtures"
CANDIDATE = ROOT / "candidate.json"


def exact_ref(path: Path) -> dict[str, object]:
    raw = path.read_bytes()
    return {
        "path": "cyberAlchemy-v2/development/research/2026-09-01-contextual-framings-measurement/evidence-harness/preregistration/candidate.json",
        "sha256": hashlib.sha256(raw).hexdigest(),
        "size": len(raw),
    }


def unresolved(prompt: str, constraint: str) -> dict[str, object]:
    return {
        "state": "unresolved",
        "prompt": prompt,
        "constraint": constraint,
        "value": None,
        "rationale": None,
        "decided_by": None,
        "decided_at": None,
    }


PROMPTS = {
    "decision_owner_identity": ("Who owns the frozen experimental decisions?", "Name one accountable owner identity or role."),
    "human_research_review_requirement": ("Which consent, ethics, privacy, or institutional review is required?", "Record an applicable review route or an evidence-backed not-applicable determination."),
    "target_population": ("Which bounded population may the result describe?", "No general-user or general-human default."),
    "eligibility_rule": ("What inclusion and exclusion rule applies?", "Must be executable before assignment."),
    "recruitment_route": ("How may participants be recruited and contacted?", "Requires separate effect authorization."),
    "experimental_design": ("Which first-exposure design is selected?", "Must forbid both forms of the same case for one participant."),
    "sample_size": ("What sample size is frozen?", "Positive integer justified by the sensitivity rationale."),
    "sample_sensitivity_rationale": ("What effect or precision can the sample detect or bound?", "Must name assumptions and computation, not convention alone."),
    "counterbalance_randomization_method": ("How are arm order and alternate cases assigned?", "Must be reproducible and frozen before recruitment."),
    "primary_estimand": ("What first-exposure comparison is primary?", "Later periods may diagnose carryover only."),
    "boundary_error_noninferiority_margin": ("What literal P1a safety margin applies?", "Numeric value, scale, direction, and denominator required."),
    "analogy_harm_severity_policy": ("How are low, major, and critical analogy-attributed events distinguished?", "Requires blinded mapping-to-error adjudication."),
    "analogy_harm_denominator": ("What P1b denominator applies?", "Must specify trial, participant, or other frozen unit."),
    "analogy_harm_critical_event_threshold": ("What literal P1b stop or failure threshold applies?", "Numeric trigger and comparison operator required."),
    "p2_component_order_or_weights": ("How are the four P2 components ordered or weighted?", "No implicit equal weighting."),
    "p2_component_denominators": ("What denominator applies to each P2 component?", "Must cover semantic, return, counterfactual, and transfer components."),
    "p2_minimum_benefit_threshold": ("What literal P2 benefit threshold applies?", "Numeric threshold and direction required."),
    "uncertainty_method": ("How is uncertainty estimated and reported?", "Must match the design and estimand."),
    "missing_data_rule": ("How are missing, stopped, invalid, and unresolved observations handled?", "Cannot silently drop or impute primary observations."),
    "scorer_disagreement_and_escalation_rule": ("How are scorer disagreement and unresolved adjudication handled?", "Freeze scorer count, escalation, and unresolved-result rule."),
    "burden_limit": ("What participant burden limit applies?", "Literal observable limit and unit required."),
    "participant_stop_rule": ("When must a participant block stop?", "Participant request must always stop the block; add any observable burden or stall trigger."),
}


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")


def build_template() -> dict[str, object]:
    candidate = json.loads(CANDIDATE.read_text(encoding="utf-8"))
    return {
        "schema_version": "acft-owner-decision-record@1",
        "decision_record_id": "acft-preregistration-owner-decision-pending@1",
        "candidate_ref": exact_ref(CANDIDATE),
        "posture": "pending_owner_decisions",
        "decisions": {
            decision_id: unresolved(*PROMPTS[decision_id])
            for decision_id in candidate["owner_decision_ids"]
        },
        "owner_acceptance": {
            "state": "not_recorded",
            "owner_id": None,
            "accepted_at": None,
            "signature": None,
        },
        "claim_status_update_allowed": False,
        "live_execution_authorization": {
            "authorized": False,
            "authorization_ref": None,
        },
    }


def main() -> int:
    template = build_template()
    write_json(ROOT / "owner-decision-template.json", template)

    premature = copy.deepcopy(template)
    premature["decisions"]["sample_size"]["value"] = 40
    write_json(FIXTURES / "fail-silent-default.json", premature)

    upgraded = copy.deepcopy(template)
    upgraded["claim_status_update_allowed"] = True
    write_json(FIXTURES / "fail-premature-claim-upgrade.json", upgraded)

    stale = copy.deepcopy(template)
    stale["candidate_ref"]["sha256"] = "0" * 64
    write_json(FIXTURES / "fail-stale-binding.json", stale)

    print(json.dumps({
        "status": "pass",
        "decision_fields": len(template["decisions"]),
        "resolved": 0,
        "live_ready": False,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
