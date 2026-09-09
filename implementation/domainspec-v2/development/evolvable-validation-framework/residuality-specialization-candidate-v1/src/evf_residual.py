from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from pathlib import Path
from typing import Literal, TypedDict

Outcome = Literal["supported", "counterexample", "unknown", "not_evaluable"]


class EvidenceObservation(TypedDict):
    observation_id: str
    path_id: str
    obligation_id: str
    evidence_kind: str
    outcome: Outcome
    provider_family: str
    provider_id: str
    exact_refs: list[dict[str, object]]
    claim_ceiling: str
    authority_effect: Literal["none"]


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _valid_digest(value: object) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(char in "0123456789abcdef" for char in value)


def validate_observation(observation: dict[str, object]) -> list[str]:
    issues: list[str] = []
    required_strings = ["observation_id", "path_id", "obligation_id", "evidence_kind", "provider_family", "provider_id", "claim_ceiling"]
    for key in required_strings:
        if not isinstance(observation.get(key), str) or not observation[key]:
            issues.append(f"invalid-observation-field:{key}")
    if observation.get("outcome") not in {"supported", "counterexample", "unknown", "not_evaluable"}:
        issues.append("invalid-observation-outcome")
    if observation.get("authority_effect") != "none":
        issues.append("observation-authority-inflation")
    refs = observation.get("exact_refs")
    if not isinstance(refs, list) or not refs:
        issues.append("observation-without-exact-ref")
    else:
        for ref in refs:
            if not isinstance(ref, dict) or not isinstance(ref.get("path"), str) or not _valid_digest(ref.get("sha256")):
                issues.append("invalid-observation-exact-ref")
    return issues


def non_inflating_join(outcomes: list[Outcome]) -> tuple[str, list[str]]:
    unique = set(outcomes)
    if not outcomes:
        return "not_evaluable", ["missing-evidence"]
    if "supported" in unique and "counterexample" in unique:
        return "conflict", ["provider-disagreement-no-vote"]
    if "counterexample" in unique:
        return "counterexample", []
    if unique == {"supported"}:
        return "supported", []
    return "not_evaluable", ["non-positive-or-incomplete-evidence"]


def evaluate(
    model: dict[str, object],
    observations: list[dict[str, object]],
    source_bindings: dict[str, object],
) -> dict[str, object]:
    issues: list[str] = []
    paths = sorted(model.get("paths", []), key=lambda item: item.get("path_id", ""))
    expected_count = model.get("finite_universe", {}).get("path_count")
    ids = [path.get("path_id") for path in paths]
    if len(paths) != expected_count or len(ids) != len(set(ids)):
        issues.append("path-inventory-cardinality-or-identity-drift")

    paths_by_id = {path.get("path_id"): path for path in paths}
    observations_by_path: dict[str, list[dict[str, object]]] = defaultdict(list)
    observation_ids: set[str] = set()
    for observation in observations:
        local = validate_observation(observation)
        if observation.get("observation_id") in observation_ids:
            local.append("duplicate-observation-id")
        observation_ids.add(str(observation.get("observation_id")))
        if observation.get("path_id") not in paths_by_id:
            local.append("observation-for-unknown-path")
        if local:
            issues.extend(f"{observation.get('observation_id')}:{item}" for item in local)
        else:
            observations_by_path[str(observation["path_id"])].append(observation)

    results: list[dict[str, object]] = []
    specification_closed = 0
    reachable_safety = 0
    evidence_supported = 0
    provider_ids: set[str] = set()
    for path in paths:
        path_id = str(path["path_id"])
        applicability = path.get("applicability")
        safety = path.get("safety_relevant") is True
        path_issues: list[str] = []
        if applicability == "excluded":
            if not path.get("exclusion_rationale"):
                path_issues.append("excluded-path-without-rationale")
            status = "EXCLUDED_WITH_RATIONALE" if not path_issues else "BLOCK"
            if not path_issues:
                specification_closed += 1
            results.append({"path_id": path_id, "status": status, "join_status": "not_applicable", "issues": path_issues})
            issues.extend(f"{path_id}:{item}" for item in path_issues)
            continue

        obligations = set(path.get("obligations", []))
        evidence_kinds = set(path.get("evidence_kinds", []))
        if safety:
            reachable_safety += 1
            if not path.get("residue_owner") or not path.get("desired_residue"):
                path_issues.append("reachable-safety-path-without-owned-residue")
            if not obligations:
                path_issues.append("reachable-safety-path-without-obligation")
            if not evidence_kinds:
                path_issues.append("reachable-safety-path-without-evidence-kind")
        if not path_issues:
            specification_closed += 1

        path_observations = observations_by_path.get(path_id, [])
        observed_obligations = {item["obligation_id"] for item in path_observations if item["outcome"] == "supported"}
        observed_kinds = {item["evidence_kind"] for item in path_observations if item["outcome"] == "supported"}
        invalid_obligations = sorted({item["obligation_id"] for item in path_observations} - obligations)
        invalid_kinds = sorted({item["evidence_kind"] for item in path_observations} - evidence_kinds)
        if invalid_obligations:
            path_issues.append("undeclared-observation-obligations:" + ",".join(invalid_obligations))
        if invalid_kinds:
            path_issues.append("undeclared-observation-evidence-kinds:" + ",".join(invalid_kinds))
        missing_obligations = sorted(obligations - observed_obligations)
        missing_kinds = sorted(evidence_kinds - observed_kinds)
        join_status, join_issues = non_inflating_join([item["outcome"] for item in path_observations])
        provider_ids.update(str(item["provider_id"]) for item in path_observations)
        supported = not path_issues and not missing_obligations and not missing_kinds and join_status == "supported"
        if supported:
            evidence_supported += 1
        result_status = (
            "SUPPORTED_BOUNDED" if supported else
            "COUNTEREXAMPLE" if join_status == "counterexample" else
            "CONFLICT" if join_status == "conflict" else
            "NOT_EVALUABLE"
        )
        results.append({
            "path_id": path_id,
            "status": result_status,
            "join_status": join_status,
            "residue_owner": path.get("residue_owner"),
            "desired_residue": path.get("desired_residue"),
            "missing_obligations": missing_obligations,
            "missing_evidence_kinds": missing_kinds,
            "observation_ids": sorted(item["observation_id"] for item in path_observations),
            "issues": path_issues + join_issues,
        })
        issues.extend(f"{path_id}:{item}" for item in path_issues)

    readiness = "READY_CANDIDATE_ONLY" if not issues and evidence_supported == reachable_safety else "BLOCK"
    residues = []
    if evidence_supported != reachable_safety:
        residues.append({
            "residue_id": "reachable-path-evidence-incomplete",
            "status": "not_evaluable",
            "causal_blocker": f"{reachable_safety - evidence_supported} reachable safety paths lack complete positive obligation and evidence-kind coverage."
        })
    return {
        "schema_version": "dsv2.evf-residual-path-evaluation-receipt/v1",
        "receipt_id": source_bindings["receipt_id"],
        "source_bindings": source_bindings,
        "path_results": results,
        "coverage": {
            "declared_paths": len(paths),
            "specification_closed_paths": specification_closed,
            "reachable_safety_paths": reachable_safety,
            "evidence_supported_paths": evidence_supported,
        },
        "provider_adequacy": {
            "selection_basis": "declared evidence kinds, never provider brand",
            "observed_provider_ids": sorted(provider_ids),
            "named_provider_mandates_added": [],
        },
        "aggregate_readiness": readiness,
        "residues": residues,
        "structural_issues": issues,
        "authority_effect": "none",
        "claim_ceiling": "Exact finite-path candidate evidence only. READY_CANDIDATE_ONLY would still grant no product approval, admission, release, deployment, or external-effect authority.",
        "open_questions_ref": source_bindings["open_questions_ref"],
    }
