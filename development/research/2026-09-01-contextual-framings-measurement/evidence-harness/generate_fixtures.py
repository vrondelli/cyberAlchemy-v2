#!/usr/bin/env python3
"""Generate deterministic synthetic ACFT evidence-harness fixtures."""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FIXTURES = ROOT / "fixtures"
PROTOCOL = json.loads((ROOT / "protocol.json").read_text(encoding="utf-8"))


def digest_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def digest_json(value: object) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return digest_text(encoded)


BASE_ATOMS = [
    {"atom_id": "A1", "statement": "The returned laptop is physically present in the warehouse."},
    {"atom_id": "A2", "statement": "Its quality state is AWAITING_INSPECTION."},
    {"atom_id": "A3", "statement": "A returned electronic unit is not sellable until required inspection passes."},
    {"atom_id": "A4", "statement": "An IN_STOCK storefront signal invites a purchase commitment."}
]


WITNESSES = [
    (
        "W01-positive-helpful",
        "positive_helpful_control",
        "Restate the sellability rule, identify its authority boundary, reject one invalid inference, and return to the laptop case.",
        "A returned laptop is present, awaits inspection, is not yet sellable, and must not be offered as IN_STOCK.",
        "Use an airport-gate analogy: being inside the airport corresponds to warehouse presence, while passing security corresponds to quality clearance. Being inside does not imply clearance. Return to the laptop and state that AWAITING_INSPECTION blocks sellability.",
        [{"source": "warehouse presence", "target": "inside airport"}, {"source": "quality clearance", "target": "security clearance"}],
        ["Airport security does not establish product quality or organizational authority."],
        "Change the treatment so airport presence is said to imply security clearance."
    ),
    (
        "W02-neutral",
        "neutral",
        "Recover the source rule and state whether the added framing contributes a task-relevant distinction.",
        "The returned laptop is present but awaits inspection, so it is not sellable and must not be signalled IN_STOCK.",
        "Picture the facts as cards in a tray: presence, inspection, sellability, and storefront signal are four labelled cards. The tray changes organization but adds no decision rule. Return to the laptop rule.",
        [{"source": "four source facts", "target": "four labelled cards"}],
        ["A card's position does not establish precedence, cause, authority, or improvement."],
        "Add an answer-revealing label to only the treatment card."
    ),
    (
        "W03-misleading",
        "misleading",
        "Detect and reject the framing's tempting but invalid inference, then reconstruct the correct source rule.",
        "A returned laptop is on hand but awaits inspection; on-hand status alone does not make it sellable.",
        "A library book visible on a shelf is usually available to borrow; map shelf presence to warehouse presence. Test where this analogy fails before deciding whether the laptop is sellable.",
        [{"source": "warehouse presence", "target": "book visible on shelf"}],
        ["Library visibility does not correspond to passed quality inspection or resale policy."],
        "Remove the non-correspondence and assert that shelf visibility proves availability."
    ),
    (
        "W04-harmful",
        "harmful",
        "Reject a fluent framing that invites a critical false purchase-safety or authority conclusion.",
        "The storefront must not offer the returned laptop before inspection passes, even though the unit is physically present.",
        "A green traffic light often invites movement. Treat IN_STOCK as a signal inviting purchase, but test whether the signal truthfully represents sellability when inspection is pending.",
        [{"source": "IN_STOCK purchase invitation", "target": "green-light invitation to move"}],
        ["A displayed signal cannot manufacture inspection, physical safety, sellability, or policy authority."],
        "Assert that the green signal itself makes proceeding safe and authorized."
    ),
    (
        "W05-leakage",
        "leakage",
        "Verify that learner-facing arm bytes contain no answer key, rubric, reviewer result, or adjudication hint.",
        "The learner receives only the bounded laptop evidence and the fixed task prompt.",
        "The learner receives the same evidence organized through declared mappings and non-mappings, without reviewer-only material.",
        [{"source": "source evidence", "target": "declared framing evidence"}],
        ["Reviewer keys and results never map into learner material."],
        "Insert [[ANSWER_KEY]] into the ACFT learner bytes."
    ),
    (
        "W06-required-return",
        "required_return",
        "After using the abstraction, reproduce the original laptop facts, limits, missing evidence, and authority state.",
        "The unit is a customer return, present, unreserved, awaiting inspection, and not yet sellable; owner acceptance and implementation evidence remain separate.",
        "Treat the analogy as a temporary scaffold: climb to the mapping, then descend by reconstructing every original laptop fact, limitation, missing evidence item, and authority boundary.",
        [{"source": "source-to-framing ascent", "target": "temporary scaffold"}, {"source": "case reconstruction", "target": "descent"}],
        ["The scaffold is not evidence that the source rule is accepted, implemented, or effective."],
        "Delete the required descent and leave only the abstract mapping."
    ),
    (
        "W07-unfamiliar-transfer",
        "unfamiliar_transfer",
        "Apply the boundary rule to a surface-dissimilar synthetic case without copying the laptop answer.",
        "A refurbished audio interface is physically received but its electrical safety test is pending; presence alone does not establish sale eligibility.",
        "Transfer the gate structure, not the laptop vocabulary: physical receipt corresponds to arrival before a checkpoint, and electrical clearance corresponds to passing the checkpoint. State the non-correspondences and decide sale eligibility.",
        [{"source": "physical receipt", "target": "arrival before checkpoint"}, {"source": "electrical clearance", "target": "checkpoint passage"}],
        ["The transfer does not copy laptop-specific product facts, inspection procedures, or owner authority."],
        "Replace the unfamiliar case with the original laptop wording so repetition can pass as transfer."
    )
]


def arm(content: str, atom_ids: list[str], mappings: list[dict[str, str]] | None = None,
        non_mappings: list[str] | None = None) -> dict[str, object]:
    value: dict[str, object] = {
        "content": content,
        "content_sha256": digest_text(content),
        "evidence_atom_ids": atom_ids,
    }
    if mappings is not None:
        value["mappings"] = mappings
        value["non_mappings"] = non_mappings or []
    return value


def build_manifest() -> dict[str, object]:
    source_path = ROOT.parent / "findings.md"
    source_bytes = source_path.read_bytes()
    fixtures: list[dict[str, object]] = []
    atom_ids = [item["atom_id"] for item in BASE_ATOMS]
    for fixture_id, witness, task, baseline, treatment, mappings, non_mappings, mutation in WITNESSES:
        fixtures.append({
            "fixture_id": fixture_id,
            "witness_class": witness,
            "task_prompt": task,
            "task_digest": digest_text(task),
            "evidence_atoms": copy.deepcopy(BASE_ATOMS),
            "evidence_atom_digest": digest_json(BASE_ATOMS),
            "expected_structural_outcome": "validator_rejects_mutant" if witness == "leakage" else "scoreable",
            "baseline": arm(baseline, atom_ids),
            "acft": arm(treatment, atom_ids, mappings, non_mappings),
            "prohibited_learner_markers": ["[[ANSWER_KEY]]", "[[RUBRIC]]", "[[REVIEW_RESULT]]", "[[ADJUDICATION]]"],
            "mutation_recipe": mutation,
        })
    return {
        "schema_version": "acft-arm-manifest@1",
        "protocol_id": PROTOCOL["protocol_id"],
        "manifest_id": "acft-seven-witnesses-synthetic@1",
        "evidence_kind": "synthetic_fixture",
        "authority_effect": "none",
        "source_ref": {
            "path": PROTOCOL["source_ref"]["path"],
            "sha256": hashlib.sha256(source_bytes).hexdigest(),
            "size": len(source_bytes),
        },
        "fixtures": fixtures,
    }


def outcome(index: int, condition: str, witness: str) -> dict[str, object]:
    treatment = condition == "acft"
    retained = 4 if treatment else 3
    boundary_errors = 0 if treatment else 1
    counterfactual = treatment
    transfer = treatment
    harm = {"low": 0, "major": 0, "critical": 0}
    mapping_total = 0
    mapping_correct = 0
    mapping_unsupported = 0
    mapping_contradicted = 0
    if treatment:
        mapping_total = 2 if witness in {"positive_helpful_control", "required_return", "unfamiliar_transfer"} else 1
        mapping_correct = mapping_total
    if witness == "neutral":
        retained = 3
        boundary_errors = 1
        counterfactual = False
        transfer = False
    elif witness == "misleading" and treatment:
        retained = 2
        boundary_errors = 1
        counterfactual = False
        harm["major"] = 1
        mapping_total = 2
        mapping_correct = 1
        mapping_unsupported = 1
    elif witness == "harmful" and treatment:
        retained = 2
        boundary_errors = 2
        counterfactual = False
        harm["critical"] = 1
        mapping_total = 1
        mapping_correct = 0
        mapping_contradicted = 1
    elif witness == "leakage":
        retained = 4
        boundary_errors = 0
        counterfactual = True
        transfer = True
    return {
        "semantic_fidelity": {"total": 4, "retained": retained, "omitted": 4 - retained, "contradicted": 0},
        "boundary_errors": boundary_errors,
        "return_fidelity": {"total": 4, "restored": retained, "imported": 0 if witness != "harmful" or not treatment else 1},
        "counterfactual_correct": counterfactual,
        "transfer_correct": transfer,
        "mapping_fidelity": {"total": mapping_total, "correct": mapping_correct, "unsupported": mapping_unsupported, "contradicted": mapping_contradicted},
        "analogy_harm_events": harm,
        "confidence": round(0.55 + index * 0.03 + (0.08 if treatment else 0), 2),
        "completion_seconds": 80 + index * 7 - (8 if treatment else 0),
        "action_count": 6 + index - (1 if treatment else 0),
        "help_event_count": 0 if treatment else 1,
        "stall_count": 0 if treatment else 1,
        "recovered_stalls": 0 if treatment else 1,
    }


def build_rows(manifest: dict[str, object], manifest_digest: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for index, fixture in enumerate(manifest["fixtures"], start=1):
        for condition in ("baseline", "acft"):
            outcomes = outcome(index, condition, fixture["witness_class"])
            harm_total = sum(outcomes["analogy_harm_events"].values())
            rows.append({
                "schema_version": "acft-run-row@1",
                "protocol_id": PROTOCOL["protocol_id"],
                "evidence_kind": "synthetic_fixture",
                "run_id": f"synthetic-{fixture['fixture_id']}-{condition}",
                "fixture_id": fixture["fixture_id"],
                "witness_class": fixture["witness_class"],
                "condition": condition,
                "status": "completed",
                "frozen": {
                    "manifest_digest": manifest_digest,
                    "presentation_digest": fixture[condition]["content_sha256"],
                    "evidence_atom_digest": fixture["evidence_atom_digest"],
                    "task_digest": fixture["task_digest"],
                    "frozen_at": "2026-09-01T00:00:00Z"
                },
                "execution": {
                    "harness_id": "acft-synthetic-scripted@1",
                    "actor_kind": "scripted_fixture",
                    "model_id": None,
                    "human_participant": False,
                    "randomization_seed": 9000 + index,
                    "first_exposure_primary": True,
                    "tool_versions": {"python": "stdlib"}
                },
                "controls": {
                    "evidence_equivalent": True,
                    "learner_material_clean": True,
                    "blinded_scoring": True,
                    "hypothesis_concealed": True
                },
                "outcomes": outcomes,
                "adjudication": {
                    "required": harm_total > 0,
                    "state": "resolved" if harm_total > 0 else "not_required",
                    "blinded": True,
                    "mapping_to_error_trace": [f"{fixture['fixture_id']}:mapping-to-error"] if harm_total > 0 else [],
                    "scorer_count": 2 if harm_total > 0 else 0
                },
                "deviations": [],
                "claim_language_key": "synthetic_fixture_no_human_or_product_claim"
            })
    return rows


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")


def write_jsonl(path: Path, rows: list[dict[str, object]]) -> None:
    path.write_text("".join(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n" for row in rows), encoding="utf-8")


def main() -> int:
    FIXTURES.mkdir(parents=True, exist_ok=True)
    manifest = build_manifest()
    pass_manifest = FIXTURES / "arm-manifest-pass.json"
    write_json(pass_manifest, manifest)
    manifest_digest = hashlib.sha256(pass_manifest.read_bytes()).hexdigest()
    rows = build_rows(manifest, manifest_digest)
    write_jsonl(FIXTURES / "run-pass.jsonl", rows)

    bad_manifest = copy.deepcopy(manifest)
    bad_fixture = bad_manifest["fixtures"][4]
    bad_fixture["acft"]["evidence_atom_ids"] = bad_fixture["acft"]["evidence_atom_ids"][:-1]
    bad_fixture["acft"]["content"] += " [[ANSWER_KEY]]"
    bad_fixture["acft"]["content_sha256"] = digest_text(bad_fixture["acft"]["content"])
    write_json(FIXTURES / "arm-manifest-fail-unequal-evidence.json", bad_manifest)

    missing = copy.deepcopy(rows[0])
    del missing["frozen"]
    write_jsonl(FIXTURES / "run-fail-missing-metadata.jsonl", [missing])

    malformed = copy.deepcopy(rows[0])
    malformed["outcomes"]["semantic_fidelity"]["retained"] = 5
    write_jsonl(FIXTURES / "run-fail-invalid-metric.jsonl", [malformed])

    print(json.dumps({"status": "pass", "fixtures": 7, "rows": len(rows), "evidence_kind": "synthetic_fixture"}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
