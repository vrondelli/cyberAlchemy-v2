#!/usr/bin/env python3
"""Validate ACFT protocol, paired-arm manifest, and append-only JSONL rows."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parents[4]
DIGEST = re.compile(r"^[0-9a-f]{64}$")
PROTOCOL_VERSION = "acft-evidence-protocol@1"
PROTOCOL_ID = "acft-round-trip-measurement@1"
MANIFEST_VERSION = "acft-arm-manifest@1"
ROW_VERSION = "acft-run-row@1"
CONDITIONS = {"baseline", "acft"}
WITNESSES = {
    "positive_helpful_control", "neutral", "misleading", "harmful",
    "leakage", "required_return", "unfamiliar_transfer",
}


def digest_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def digest_json(value: object) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return digest_text(encoded)


def exact_ref_errors(ref: Any, label: str) -> list[str]:
    errors: list[str] = []
    if not isinstance(ref, dict) or set(ref) != {"path", "sha256", "size"}:
        return [f"EXACT_REF:{label}:shape"]
    path = ref.get("path")
    if not isinstance(path, str) or not path or path.startswith("/") or ".." in Path(path).parts:
        return [f"EXACT_REF:{label}:path"]
    target = (REPO_ROOT / path).resolve()
    try:
        target.relative_to(REPO_ROOT)
    except ValueError:
        return [f"EXACT_REF:{label}:escape"]
    if not target.is_file():
        return [f"EXACT_REF:{label}:missing"]
    raw = target.read_bytes()
    if ref.get("sha256") != hashlib.sha256(raw).hexdigest():
        errors.append(f"EXACT_REF:{label}:digest")
    if ref.get("size") != len(raw):
        errors.append(f"EXACT_REF:{label}:size")
    return errors


def load_json(path: Path) -> tuple[Any | None, list[str]]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), []
    except (OSError, json.JSONDecodeError) as exc:
        return None, [f"READ:{path}:{exc}"]


def validate_protocol(protocol: Any) -> list[str]:
    errors: list[str] = []
    required = {
        "schema_version", "protocol_id", "status", "authority_effect",
        "intervention", "source_ref", "evidence_kinds",
        "required_witness_classes", "primary_hierarchy", "decision_policy",
        "scoring_order", "claim_language", "dry_run_live_separation",
        "open_questions_ref",
    }
    if not isinstance(protocol, dict):
        return ["TYPE:protocol"]
    if set(protocol) != required:
        errors.append("FIELDS:protocol")
    if protocol.get("schema_version") != PROTOCOL_VERSION:
        errors.append("ENUM:protocol.schema_version")
    if protocol.get("protocol_id") != PROTOCOL_ID:
        errors.append("ENUM:protocol.protocol_id")
    if protocol.get("status") != "candidate_dry_run" or protocol.get("authority_effect") != "none":
        errors.append("BOUNDARY:protocol.status_or_authority")
    errors.extend(exact_ref_errors(protocol.get("source_ref"), "protocol.source_ref"))
    if protocol.get("required_witness_classes") != [
        "positive_helpful_control", "neutral", "misleading", "harmful",
        "leakage", "required_return", "unfamiliar_transfer",
    ]:
        errors.append("WITNESSES:protocol.required_witness_classes")
    policy = protocol.get("decision_policy")
    if not isinstance(policy, dict) or policy.get("live_execution_ready") is not False:
        errors.append("LIVE_READY:protocol.decision_policy")
    else:
        blocked = {
            "boundary_error_noninferiority_margin",
            "analogy_harm_critical_event_threshold",
            "p2_component_order_or_weights",
            "p2_minimum_benefit_threshold",
            "uncertainty_method", "missing_data_rule",
            "sample_sensitivity_rationale", "burden_limit",
        }
        for field in blocked:
            if policy.get(field) is not None:
                errors.append(f"UNAUTHORIZED_LIVE_VALUE:protocol.decision_policy.{field}")
    if protocol.get("scoring_order") != ["safety", "correctness", "process_cost", "self_report"]:
        errors.append("ORDER:protocol.scoring_order")
    separation = protocol.get("dry_run_live_separation", {})
    if separation.get("synthetic_effect_verdict") != "not_evaluable":
        errors.append("CLAIM:protocol.synthetic_effect_verdict")
    return errors


def validate_arm(arm: Any, atom_ids: list[str], markers: list[str], label: str,
                 require_mapping: bool) -> list[str]:
    errors: list[str] = []
    required = {"content", "content_sha256", "evidence_atom_ids"}
    if require_mapping:
        required |= {"mappings", "non_mappings"}
    if not isinstance(arm, dict) or set(arm) != required:
        return [f"FIELDS:{label}"]
    content = arm.get("content")
    if not isinstance(content, str) or not content:
        errors.append(f"TYPE:{label}.content")
    elif arm.get("content_sha256") != digest_text(content):
        errors.append(f"DIGEST:{label}.content_sha256")
    if arm.get("evidence_atom_ids") != atom_ids:
        errors.append(f"EVIDENCE_PARITY:{label}.evidence_atom_ids")
    for marker in markers:
        if isinstance(content, str) and marker in content:
            errors.append(f"LEAKAGE:{label}:{marker}")
    if require_mapping:
        if not isinstance(arm.get("mappings"), list) or not arm["mappings"]:
            errors.append(f"MAPPING:{label}.mappings")
        if not isinstance(arm.get("non_mappings"), list) or not arm["non_mappings"]:
            errors.append(f"MAPPING:{label}.non_mappings")
    return errors


def validate_manifest(manifest: Any, protocol: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    required = {
        "schema_version", "protocol_id", "manifest_id", "evidence_kind",
        "authority_effect", "source_ref", "fixtures",
    }
    if not isinstance(manifest, dict):
        return ["TYPE:manifest"]
    if set(manifest) != required:
        errors.append("FIELDS:manifest")
    if manifest.get("schema_version") != MANIFEST_VERSION:
        errors.append("ENUM:manifest.schema_version")
    if manifest.get("protocol_id") != PROTOCOL_ID:
        errors.append("ENUM:manifest.protocol_id")
    if manifest.get("evidence_kind") not in {"synthetic_fixture", "live_run"}:
        errors.append("ENUM:manifest.evidence_kind")
    if manifest.get("authority_effect") != "none":
        errors.append("AUTHORITY:manifest")
    if manifest.get("source_ref") != protocol.get("source_ref"):
        errors.append("SOURCE_BINDING:manifest")
    errors.extend(exact_ref_errors(manifest.get("source_ref"), "manifest.source_ref"))
    fixtures = manifest.get("fixtures")
    if not isinstance(fixtures, list) or len(fixtures) != 7:
        return errors + ["CARDINALITY:manifest.fixtures"]
    seen_ids: set[str] = set()
    seen_witnesses: set[str] = set()
    fixture_fields = {
        "fixture_id", "witness_class", "task_prompt", "task_digest",
        "evidence_atoms", "evidence_atom_digest", "expected_structural_outcome",
        "baseline", "acft", "prohibited_learner_markers", "mutation_recipe",
    }
    for index, fixture in enumerate(fixtures):
        label = f"manifest.fixtures[{index}]"
        if not isinstance(fixture, dict) or set(fixture) != fixture_fields:
            errors.append(f"FIELDS:{label}")
            continue
        fixture_id = fixture.get("fixture_id")
        witness = fixture.get("witness_class")
        if not isinstance(fixture_id, str) or not fixture_id or fixture_id in seen_ids:
            errors.append(f"UNIQUE:{label}.fixture_id")
        else:
            seen_ids.add(fixture_id)
        if witness not in WITNESSES or witness in seen_witnesses:
            errors.append(f"UNIQUE:{label}.witness_class")
        else:
            seen_witnesses.add(witness)
        task = fixture.get("task_prompt")
        if not isinstance(task, str) or fixture.get("task_digest") != digest_text(task):
            errors.append(f"DIGEST:{label}.task_digest")
        atoms = fixture.get("evidence_atoms")
        if not isinstance(atoms, list) or not atoms:
            errors.append(f"CARDINALITY:{label}.evidence_atoms")
            atoms = []
        atom_ids = [atom.get("atom_id") for atom in atoms if isinstance(atom, dict)]
        if len(atom_ids) != len(atoms) or len(atom_ids) != len(set(atom_ids)):
            errors.append(f"UNIQUE:{label}.evidence_atoms")
        if fixture.get("evidence_atom_digest") != digest_json(atoms):
            errors.append(f"DIGEST:{label}.evidence_atom_digest")
        markers = fixture.get("prohibited_learner_markers")
        if not isinstance(markers, list) or not markers or any(not isinstance(item, str) or not item for item in markers):
            errors.append(f"TYPE:{label}.prohibited_learner_markers")
            markers = []
        errors.extend(validate_arm(fixture.get("baseline"), atom_ids, markers, f"{label}.baseline", False))
        errors.extend(validate_arm(fixture.get("acft"), atom_ids, markers, f"{label}.acft", True))
    if seen_witnesses != WITNESSES:
        errors.append("WITNESSES:manifest.coverage")
    return errors


def number(value: Any, minimum: float = 0) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value >= minimum


def validate_outcomes(outcomes: Any, condition: str, label: str) -> list[str]:
    errors: list[str] = []
    required = {
        "semantic_fidelity", "boundary_errors", "return_fidelity",
        "counterfactual_correct", "transfer_correct", "mapping_fidelity",
        "analogy_harm_events", "confidence", "completion_seconds",
        "action_count", "help_event_count", "stall_count", "recovered_stalls",
    }
    if not isinstance(outcomes, dict) or set(outcomes) != required:
        return [f"FIELDS:{label}"]
    semantic = outcomes["semantic_fidelity"]
    if not isinstance(semantic, dict) or set(semantic) != {"total", "retained", "omitted", "contradicted"}:
        errors.append(f"FIELDS:{label}.semantic_fidelity")
    elif any(not isinstance(semantic[key], int) or semantic[key] < 0 for key in semantic):
        errors.append(f"RANGE:{label}.semantic_fidelity")
    elif semantic["retained"] + semantic["omitted"] + semantic["contradicted"] != semantic["total"]:
        errors.append(f"ARITHMETIC:{label}.semantic_fidelity")
    returned = outcomes["return_fidelity"]
    if not isinstance(returned, dict) or set(returned) != {"total", "restored", "imported"}:
        errors.append(f"FIELDS:{label}.return_fidelity")
    elif any(not isinstance(returned[key], int) or returned[key] < 0 for key in returned):
        errors.append(f"RANGE:{label}.return_fidelity")
    elif returned["restored"] > returned["total"]:
        errors.append(f"ARITHMETIC:{label}.return_fidelity")
    mapping = outcomes["mapping_fidelity"]
    if not isinstance(mapping, dict) or set(mapping) != {"total", "correct", "unsupported", "contradicted"}:
        errors.append(f"FIELDS:{label}.mapping_fidelity")
    elif any(not isinstance(mapping[key], int) or mapping[key] < 0 for key in mapping):
        errors.append(f"RANGE:{label}.mapping_fidelity")
    elif mapping["correct"] + mapping["unsupported"] + mapping["contradicted"] != mapping["total"]:
        errors.append(f"ARITHMETIC:{label}.mapping_fidelity")
    elif condition == "baseline" and mapping["total"] != 0:
        errors.append(f"BASELINE_MAPPING:{label}.mapping_fidelity")
    harm = outcomes["analogy_harm_events"]
    if not isinstance(harm, dict) or set(harm) != {"low", "major", "critical"}:
        errors.append(f"FIELDS:{label}.analogy_harm_events")
    elif any(not isinstance(harm[key], int) or harm[key] < 0 for key in harm):
        errors.append(f"RANGE:{label}.analogy_harm_events")
    elif condition == "baseline" and sum(harm.values()) != 0:
        errors.append(f"BASELINE_ANALOGY_HARM:{label}")
    for key in ("boundary_errors", "completion_seconds", "action_count", "help_event_count", "stall_count", "recovered_stalls"):
        if not number(outcomes[key]):
            errors.append(f"RANGE:{label}.{key}")
    if outcomes.get("recovered_stalls", 0) > outcomes.get("stall_count", 0):
        errors.append(f"ARITHMETIC:{label}.recovered_stalls")
    if not isinstance(outcomes.get("counterfactual_correct"), bool) or not isinstance(outcomes.get("transfer_correct"), bool):
        errors.append(f"TYPE:{label}.boolean_outcomes")
    confidence = outcomes.get("confidence")
    if confidence is not None and (not number(confidence) or confidence > 1):
        errors.append(f"RANGE:{label}.confidence")
    return errors


def validate_row(row: Any, index: int, manifest: dict[str, Any], manifest_digest: str,
                 protocol: dict[str, Any]) -> list[str]:
    label = f"rows[{index}]"
    errors: list[str] = []
    required = {
        "schema_version", "protocol_id", "evidence_kind", "run_id",
        "fixture_id", "witness_class", "condition", "status", "frozen",
        "execution", "controls", "outcomes", "adjudication", "deviations",
        "claim_language_key",
    }
    if not isinstance(row, dict) or set(row) != required:
        return [f"FIELDS:{label}"]
    if row["schema_version"] != ROW_VERSION or row["protocol_id"] != PROTOCOL_ID:
        errors.append(f"ENUM:{label}.identity")
    if row["evidence_kind"] != manifest["evidence_kind"]:
        errors.append(f"EVIDENCE_KIND:{label}")
    if row["condition"] not in CONDITIONS:
        errors.append(f"ENUM:{label}.condition")
        return errors
    fixture_map = {item["fixture_id"]: item for item in manifest["fixtures"]}
    fixture = fixture_map.get(row["fixture_id"])
    if fixture is None:
        return errors + [f"FIXTURE_JOIN:{label}"]
    if row["witness_class"] != fixture["witness_class"]:
        errors.append(f"WITNESS_JOIN:{label}")
    frozen = row["frozen"]
    expected_frozen = {"manifest_digest", "presentation_digest", "evidence_atom_digest", "task_digest", "frozen_at"}
    if not isinstance(frozen, dict) or set(frozen) != expected_frozen:
        errors.append(f"FIELDS:{label}.frozen")
    else:
        if frozen["manifest_digest"] != manifest_digest:
            errors.append(f"DIGEST:{label}.manifest")
        if frozen["presentation_digest"] != fixture[row["condition"]]["content_sha256"]:
            errors.append(f"DIGEST:{label}.presentation")
        if frozen["evidence_atom_digest"] != fixture["evidence_atom_digest"]:
            errors.append(f"DIGEST:{label}.evidence_atoms")
        if frozen["task_digest"] != fixture["task_digest"]:
            errors.append(f"DIGEST:{label}.task")
        if not isinstance(frozen["frozen_at"], str) or not frozen["frozen_at"].endswith("Z"):
            errors.append(f"TIME:{label}.frozen_at")
    execution = row["execution"]
    execution_fields = {"harness_id", "actor_kind", "model_id", "human_participant", "randomization_seed", "first_exposure_primary", "tool_versions"}
    if not isinstance(execution, dict) or set(execution) != execution_fields:
        errors.append(f"FIELDS:{label}.execution")
    elif row["evidence_kind"] == "synthetic_fixture" and (
        execution["human_participant"] is not False or execution["actor_kind"] != "scripted_fixture"
    ):
        errors.append(f"SYNTHETIC_BOUNDARY:{label}.execution")
    elif row["evidence_kind"] == "live_run" and protocol["decision_policy"]["live_execution_ready"] is not True:
        errors.append(f"LIVE_BLOCKED:{label}")
    controls = row["controls"]
    control_fields = {"evidence_equivalent", "learner_material_clean", "blinded_scoring", "hypothesis_concealed"}
    if not isinstance(controls, dict) or set(controls) != control_fields:
        errors.append(f"FIELDS:{label}.controls")
    elif row["status"] == "completed" and any(controls[key] is not True for key in control_fields):
        errors.append(f"CONTROL:{label}")
    errors.extend(validate_outcomes(row["outcomes"], row["condition"], f"{label}.outcomes"))
    harm_total = sum(row["outcomes"].get("analogy_harm_events", {}).values()) if isinstance(row["outcomes"], dict) else 0
    adjudication = row["adjudication"]
    adjudication_fields = {"required", "state", "blinded", "mapping_to_error_trace", "scorer_count"}
    if not isinstance(adjudication, dict) or set(adjudication) != adjudication_fields:
        errors.append(f"FIELDS:{label}.adjudication")
    elif harm_total > 0:
        if adjudication["required"] is not True or adjudication["state"] != "resolved" or adjudication["blinded"] is not True:
            errors.append(f"ADJUDICATION:{label}:state")
        if not isinstance(adjudication["mapping_to_error_trace"], list) or not adjudication["mapping_to_error_trace"]:
            errors.append(f"ADJUDICATION:{label}:trace")
        if not isinstance(adjudication["scorer_count"], int) or adjudication["scorer_count"] < 2:
            errors.append(f"ADJUDICATION:{label}:scorers")
    if row["status"] == "completed" and row["deviations"] != []:
        errors.append(f"DEVIATION:{label}")
    expected_claim = "synthetic_fixture_no_human_or_product_claim" if row["evidence_kind"] == "synthetic_fixture" else "live_run_requires_owner_adjudication"
    if row["claim_language_key"] != expected_claim:
        errors.append(f"CLAIM:{label}")
    return errors


def load_rows(path: Path) -> tuple[list[Any], list[str]]:
    rows: list[Any] = []
    errors: list[str] = []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        return [], [f"READ:{path}:{exc}"]
    for index, line in enumerate(lines, start=1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            errors.append(f"JSONL:{path}:{index}:{exc}")
    if not rows:
        errors.append(f"CARDINALITY:{path}:rows")
    return rows, errors


def validate_bundle(protocol_path: Path, manifest_path: Path, rows_path: Path) -> tuple[dict[str, Any] | None, dict[str, Any] | None, list[Any], list[str]]:
    protocol, errors = load_json(protocol_path)
    manifest, manifest_read_errors = load_json(manifest_path)
    rows, row_read_errors = load_rows(rows_path)
    errors.extend(manifest_read_errors)
    errors.extend(row_read_errors)
    if protocol is None or manifest is None:
        return protocol, manifest, rows, errors
    errors.extend(validate_protocol(protocol))
    errors.extend(validate_manifest(manifest, protocol))
    manifest_digest = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
    run_ids: set[str] = set()
    pairs: dict[str, set[str]] = {}
    evidence_kinds: set[str] = set()
    for index, row in enumerate(rows):
        errors.extend(validate_row(row, index, manifest, manifest_digest, protocol))
        if isinstance(row, dict):
            run_id = row.get("run_id")
            if not isinstance(run_id, str) or not run_id or run_id in run_ids:
                errors.append(f"UNIQUE:rows[{index}].run_id")
            else:
                run_ids.add(run_id)
            pairs.setdefault(row.get("fixture_id", ""), set()).add(row.get("condition", ""))
            evidence_kinds.add(row.get("evidence_kind", ""))
    if len(evidence_kinds) != 1:
        errors.append("EVIDENCE_KIND_MIXED:rows")
    manifest_ids = {fixture["fixture_id"] for fixture in manifest.get("fixtures", []) if isinstance(fixture, dict) and "fixture_id" in fixture}
    if set(pairs) != manifest_ids:
        errors.append("PAIR_COVERAGE:rows")
    for fixture_id, conditions in pairs.items():
        if conditions != CONDITIONS:
            errors.append(f"PAIR_CARDINALITY:{fixture_id}")
    return protocol, manifest, rows, errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--protocol", type=Path, default=ROOT / "protocol.json")
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--rows", type=Path, required=True)
    args = parser.parse_args()
    _, manifest, rows, errors = validate_bundle(args.protocol, args.manifest, args.rows)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(json.dumps({"status": "fail", "errors": len(errors)}, sort_keys=True))
        return 1
    print(json.dumps({
        "status": "pass",
        "evidence_kind": manifest["evidence_kind"],
        "rows": len(rows),
        "pairs": len(manifest["fixtures"]),
        "witness_classes": sorted(fixture["witness_class"] for fixture in manifest["fixtures"]),
        "claim_status": "synthetic_fixture_no_human_or_product_claim" if manifest["evidence_kind"] == "synthetic_fixture" else "live_run_requires_owner_adjudication",
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
