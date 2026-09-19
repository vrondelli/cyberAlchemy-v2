#!/usr/bin/env python3
"""Validate the Auth Foundation InterpretationModel review contract and result."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import sys
import tempfile
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker


SCRIPT_DIR = Path(__file__).resolve().parent
CONTRACT_PATH = SCRIPT_DIR / "INTERPRETATION-MODEL-REVIEW-CONTRACT.candidate.json"
CONTRACT_SCHEMA_PATH = SCRIPT_DIR / "INTERPRETATION-MODEL-REVIEW-CONTRACT.schema.json"
RESULT_SCHEMA_PATH = SCRIPT_DIR / "INTERPRETATION-MODEL-REVIEW-RESULT.schema.json"
DECISION_PATH = Path(
    "projects/auth-foundation/formalization/decisions/"
    "AF-EXACT-SESSION-ROLE-PERMISSION-001/"
    "interpretation-model-review-contract-decision-gate.json"
)

DEFINITION_IDS = [
    "AF-DEF-AUTHORIZATION-REQUEST",
    "AF-DEF-SESSION",
    "AF-DEF-ROLE",
    "AF-DEF-PERMISSION",
    "AF-DEF-RESOURCE",
    "AF-DEF-ACTION",
    "AF-DEF-SCOPE",
    "AF-DEF-REQUIRED-PERMISSION",
    "AF-DEF-DECISION-TIME",
    "AF-DEF-AUTHORIZATION-REVISION",
    "AF-DEF-RESOLVED-SESSION",
    "AF-DEF-RESOLVED-ACTIVE-ROLE",
    "AF-DEF-TRUSTED-SCOPE-EVIDENCE",
    "AF-DEF-COMPLETE-AUTHORITATIVE-ROLE-RELATION",
    "AF-DEF-SESSION-CURRENT",
    "AF-DEF-AUTHORIZATION-ADMISSIBLE",
    "AF-DEF-EXACT-ACTIVE-ROLE-GRANT",
    "AF-DEF-AUTHORIZATION-DECISION",
    "AF-DEF-ALLOW",
    "AF-DEF-DENY",
]
CHECK_IDS = [f"AF-IMR-{index:03d}" for index in range(1, 18)]
SOURCE_ROLES = [
    "normative-business-meaning",
    "business-meaning-owner-decision",
    "stale-predecessor-comparison-only",
    "interpretation-model-schema",
    "business-meaning-acceptance-review",
    "business-meaning-validation",
    "current-case-package",
    "review-contract-schema",
    "review-result-schema",
]
RESULT_CLAIM_CEILING = (
    "Independent evidence about whether one frozen InterpretationModel candidate "
    "faithfully interprets the exact accepted BusinessMeaning v2. It does not "
    "accept the candidate, admit or identify a FormalClaim, derive obligations, "
    "execute providers, join EVF evidence, or establish runtime conformance, "
    "security, release, or production readiness."
)
NEXT_ROUTE_BY_VERDICT = {
    "PASS": "owner-decision-gate",
    "FLAG": "editorial-repair",
    "BLOCK": "interpretation-model-revision",
    "NOT_EVALUABLE": "restore-exact-source-closure",
}
REQUIRED_REVIEW_FIELDS = [
    "review_id",
    "reviewed_at",
    "reviewer_route",
    "candidate_author_route",
    "review_contract_ref",
    "candidate_exact_ref",
    "source_exact_refs",
    "definition_results",
    "mandatory_check_results",
    "predecessor_delta_results",
    "findings",
    "verdict",
    "next_route",
    "authority_effect",
    "claim_ceiling",
]
ALLOWED_SUCCESSOR_POINTER_PREFIXES = (
    "#/types/",
    "#/predicates/",
    "#/equality_rules/",
    "#/quantifiers/",
    "#/time_model",
    "#/currentness_rules/",
    "#/applicability/",
    "#/assumptions/",
    "#/excluded_cases/",
    "#/witnesses/",
    "#/counterexamples/",
    "#/vacuity_checks/",
)


def repository_root() -> Path:
    for candidate in [SCRIPT_DIR, *SCRIPT_DIR.parents]:
        if (candidate / ".git").exists() and (candidate / "AGENTS.md").exists():
            return candidate
    raise RuntimeError("repository root not found")


REPOSITORY_ROOT = repository_root()


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"JSON object required: {path}")
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exact_ref(path: Path) -> dict[str, Any]:
    return {
        "path": path.relative_to(REPOSITORY_ROOT).as_posix(),
        "sha256": sha256(path),
        "size_bytes": path.stat().st_size,
        "current": True,
    }


def resolve_repo_path(value: str) -> Path:
    resolved = (REPOSITORY_ROOT / value).resolve()
    try:
        resolved.relative_to(REPOSITORY_ROOT)
    except ValueError as error:
        raise ValueError(f"path escapes repository: {value}") from error
    return resolved


def exact_ref_errors(
    label: str, value: Any, *, require_current: bool = False
) -> list[str]:
    if not isinstance(value, dict):
        return [f"{label}: exact reference is not an object"]
    try:
        path = resolve_repo_path(value.get("path", ""))
    except ValueError as error:
        return [f"{label}: {error}"]
    if not path.is_file():
        return [f"{label}: target does not exist: {value.get('path')}"]
    errors: list[str] = []
    if require_current and value.get("current") is not True:
        errors.append(f"{label}: current must be true")
    if value.get("sha256") != sha256(path):
        errors.append(f"{label}: SHA-256 mismatch")
    if value.get("size_bytes") != path.stat().st_size:
        errors.append(f"{label}: size mismatch")
    return errors


def is_unavailable_ref(value: Any) -> bool:
    return isinstance(value, dict) and value.get("current") is False


def unavailable_ref_errors(label: str, value: Any) -> list[str]:
    if not is_unavailable_ref(value):
        return [f"{label}: unavailable reference must set current false"]
    try:
        path = resolve_repo_path(value.get("path", ""))
    except ValueError as error:
        return [f"{label}: {error}"]
    failure_kind = value.get("failure_kind")
    if failure_kind == "missing":
        return [] if not path.exists() else [f"{label}: target is present, not missing"]
    try:
        path.read_bytes()
    except OSError:
        return []
    if failure_kind in ("unreadable", "unhashable"):
        return [f"{label}: target is readable and hashable"]
    return [f"{label}: unknown failure kind"]


def schema_errors(instance: Any, schema: dict[str, Any]) -> list[str]:
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    return [
        f"{'/'.join(str(item) for item in error.absolute_path) or '<root>'}: "
        f"{error.message}"
        for error in sorted(
            validator.iter_errors(instance),
            key=lambda item: [str(part) for part in item.absolute_path],
        )
    ]


def resolve_pointer(document: Any, pointer: str) -> Any:
    if pointer == "#":
        return document
    if not isinstance(pointer, str) or not pointer.startswith("#/"):
        raise ValueError(f"invalid JSON pointer: {pointer}")
    cursor = document
    for raw_token in pointer[2:].split("/"):
        token = raw_token.replace("~1", "/").replace("~0", "~")
        if isinstance(cursor, list):
            cursor = cursor[int(token)]
        elif isinstance(cursor, dict) and token in cursor:
            cursor = cursor[token]
        else:
            raise ValueError(f"unresolved JSON pointer: {pointer}")
    return cursor


def source_binding_errors(contract: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for name, binding in contract.get("source_closure", {}).items():
        errors.extend(exact_ref_errors(f"source_closure.{name}", binding))
    case_binding = contract.get("run_time_bindings", {}).get("current_case_package", {})
    case_path = resolve_repo_path(case_binding.get("path", ""))
    if not case_path.is_file():
        errors.append("run_time_bindings.current_case_package: target missing")
    else:
        if case_binding.get("authoring_baseline_sha256") != sha256(case_path):
            errors.append("run_time_bindings.current_case_package: authoring baseline SHA-256 mismatch")
        if case_binding.get("authoring_baseline_size_bytes") != case_path.stat().st_size:
            errors.append("run_time_bindings.current_case_package: authoring baseline size mismatch")
    return errors


def contract_semantic_errors(
    contract: dict[str, Any], accepted_meaning: dict[str, Any]
) -> list[str]:
    errors: list[str] = []
    coverage = contract.get("definition_coverage", [])
    coverage_ids = [item.get("definition_id") for item in coverage]
    meaning_definitions = accepted_meaning.get("definitions", [])
    meaning_ids = [item.get("definition_id") for item in meaning_definitions]
    if coverage_ids != DEFINITION_IDS:
        errors.append("definition_coverage must use the exact ordered 20-ID denominator")
    if meaning_ids != DEFINITION_IDS:
        errors.append("accepted BusinessMeaning no longer matches the exact 20-ID denominator")
    meaning_terms = {
        item.get("definition_id"): item.get("term") for item in meaning_definitions
    }
    for item in coverage:
        if meaning_terms.get(item.get("definition_id")) != item.get("term"):
            errors.append(f"definition term mismatch: {item.get('definition_id')}")

    check_ids = [item.get("check_id") for item in contract.get("mandatory_checks", [])]
    if check_ids != CHECK_IDS:
        errors.append("mandatory_checks must use the exact ordered 17-check denominator")
    if any(item.get("failure_result") != "BLOCK" for item in contract.get("mandatory_checks", [])):
        errors.append("every mandatory check failure_result must be BLOCK")

    required_output = contract.get("required_review_output", {})
    if required_output.get("definition_result_count") != 20:
        errors.append("required review output must require 20 definition results")
    if required_output.get("mandatory_check_result_count") != 17:
        errors.append("required review output must require 17 mandatory-check results")
    if required_output.get("required_fields") != REQUIRED_REVIEW_FIELDS:
        errors.append("required review output field denominator differs from the exact 15 fields")
    if required_output.get("review_result_claim_ceiling") != RESULT_CLAIM_CEILING:
        errors.append("required review output claim ceiling differs from the exact ceiling")
    if contract.get("authority_effect") != "none":
        errors.append("contract authority_effect must remain none")
    if contract.get("unresolved_questions") != []:
        errors.append("contract has unresolved questions")
    return errors


def result_role_refs(
    contract: dict[str, Any], contract_schema_path: Path, result_schema_path: Path
) -> dict[str, dict[str, Any]]:
    source = contract["source_closure"]
    case_path = resolve_repo_path(contract["run_time_bindings"]["current_case_package"]["path"])
    def current_binding(name: str) -> dict[str, Any]:
        return {
            **{
                key: source[name][key]
                for key in ("path", "sha256", "size_bytes")
            },
            "current": True,
        }
    return {
        "normative-business-meaning": current_binding("accepted_business_meaning"),
        "business-meaning-owner-decision": current_binding("business_meaning_owner_decision"),
        "stale-predecessor-comparison-only": current_binding("stale_predecessor_interpretation"),
        "interpretation-model-schema": current_binding("interpretation_model_schema"),
        "business-meaning-acceptance-review": current_binding("business_meaning_acceptance_review"),
        "business-meaning-validation": current_binding("business_meaning_validation"),
        "current-case-package": exact_ref(case_path),
        "review-contract-schema": exact_ref(contract_schema_path),
        "review-result-schema": exact_ref(result_schema_path),
    }


def pointer_token(value: str) -> str:
    return value.replace("~", "~0").replace("/", "~1")


def json_deltas(before: Any, after: Any, pointer: str = "#") -> list[dict[str, Any]]:
    if type(before) is not type(after):
        return [{
            "change_kind": "changed",
            "predecessor_pointer": pointer,
            "successor_pointer": pointer,
        }]
    if isinstance(before, dict):
        deltas: list[dict[str, Any]] = []
        for key in sorted(set(before) | set(after)):
            child = f"{pointer}/{pointer_token(key)}"
            if key not in before:
                deltas.append({
                    "change_kind": "added",
                    "predecessor_pointer": None,
                    "successor_pointer": child,
                })
            elif key not in after:
                deltas.append({
                    "change_kind": "removed",
                    "predecessor_pointer": child,
                    "successor_pointer": None,
                })
            else:
                deltas.extend(json_deltas(before[key], after[key], child))
        return deltas
    if isinstance(before, list):
        deltas = []
        for index in range(max(len(before), len(after))):
            child = f"{pointer}/{index}"
            if index >= len(before):
                deltas.append({
                    "change_kind": "added",
                    "predecessor_pointer": None,
                    "successor_pointer": child,
                })
            elif index >= len(after):
                deltas.append({
                    "change_kind": "removed",
                    "predecessor_pointer": child,
                    "successor_pointer": None,
                })
            else:
                deltas.extend(json_deltas(before[index], after[index], child))
        return deltas
    if before != after:
        return [{
            "change_kind": "changed",
            "predecessor_pointer": pointer,
            "successor_pointer": pointer,
        }]
    return []


def delta_identity(value: dict[str, Any]) -> tuple[Any, Any, Any]:
    return (
        value.get("change_kind"),
        value.get("predecessor_pointer"),
        value.get("successor_pointer"),
    )


def result_semantic_errors(
    result: dict[str, Any],
    contract: dict[str, Any],
    accepted_meaning: dict[str, Any],
    contract_path: Path,
    contract_schema_path: Path,
    result_schema_path: Path,
    *,
    resolve_targets: bool,
) -> list[str]:
    errors: list[str] = []
    verdict = result.get("verdict")
    if result.get("review_contract_ref") != exact_ref(contract_path):
        errors.append("review_contract_ref does not bind the exact current contract")
    if result.get("reviewer_route") == result.get("candidate_author_route"):
        errors.append("reviewer_route must differ from candidate_author_route")

    role_items = result.get("source_exact_refs", [])
    roles = [item.get("role") for item in role_items]
    if roles != SOURCE_ROLES:
        errors.append("source_exact_refs must use the exact ordered nine-role denominator")
    expected_roles = result_role_refs(contract, contract_schema_path, result_schema_path)
    unavailable_inputs = 0
    for item in role_items:
        role = item.get("role")
        ref = item.get("ref")
        if is_unavailable_ref(ref):
            unavailable_inputs += 1
            if verdict != "NOT_EVALUABLE":
                errors.append(f"source {role} is unavailable outside NOT_EVALUABLE")
            if role in expected_roles and ref.get("path") != expected_roles[role]["path"]:
                errors.append(f"unavailable source path mismatch: {role}")
            errors.extend(unavailable_ref_errors(f"source_exact_refs.{role}", ref))
        else:
            if role in expected_roles and ref != expected_roles[role]:
                errors.append(f"source exact reference mismatch: {role}")
            errors.extend(exact_ref_errors(
                f"source_exact_refs.{role}", ref, require_current=True
            ))

    meaning_definitions = {
        item["definition_id"]: item for item in accepted_meaning["definitions"]
    }
    definition_results = result.get("definition_results", [])
    definition_ids = [item.get("definition_id") for item in definition_results]
    if definition_ids != DEFINITION_IDS:
        errors.append("definition_results must use the exact ordered 20-ID denominator")
    total_pointer_mappings = 0
    pointer_statuses: list[Any] = []
    candidate: dict[str, Any] | None = None
    predecessor: dict[str, Any] | None = None
    if resolve_targets:
        candidate_ref = result.get("candidate_exact_ref")
        if is_unavailable_ref(candidate_ref):
            unavailable_inputs += 1
            if verdict != "NOT_EVALUABLE":
                errors.append("candidate is unavailable outside NOT_EVALUABLE")
            errors.extend(unavailable_ref_errors("candidate_exact_ref", candidate_ref))
            candidate_ref_errors = ["candidate unavailable"]
        else:
            candidate_ref_errors = exact_ref_errors(
                "candidate_exact_ref", candidate_ref, require_current=True
            )
            errors.extend(candidate_ref_errors)
        if not candidate_ref_errors and not is_unavailable_ref(candidate_ref):
            candidate_path = resolve_repo_path(result["candidate_exact_ref"]["path"])
            candidate = load_json(candidate_path)
            predecessor = load_json(resolve_repo_path(
                contract["source_closure"]["stale_predecessor_interpretation"]["path"]
            ))
            interpretation_schema = load_json(
                resolve_repo_path(contract["source_closure"]["interpretation_model_schema"]["path"])
            )
            errors.extend(
                f"candidate schema: {item}"
                for item in schema_errors(candidate, interpretation_schema)
            )
            expected_meaning_ref = {
                key: contract["source_closure"]["accepted_business_meaning"][key]
                for key in ("path", "sha256", "size_bytes")
            }
            if candidate.get("business_meaning_ref") != expected_meaning_ref:
                errors.append("candidate does not exact-bind accepted BusinessMeaning v2")
            if candidate.get("model_id") != contract["review_subject"]["required_model_id"]:
                errors.append("candidate model_id differs from the required stable model identity")
            if candidate.get("version") == "2-accepted":
                errors.append("candidate reuses stale predecessor version 2-accepted")
            if candidate.get("status") not in contract["review_subject"]["required_initial_statuses"]:
                errors.append("candidate status is not draft or reviewed")
            if candidate.get("acceptance", {}).get("status") != "not-requested":
                errors.append("candidate acceptance status must be not-requested")
            if candidate.get("authority_effect") != "none":
                errors.append("candidate authority_effect must be none")

    for item in definition_results:
        definition_id = item.get("definition_id")
        accepted_definition = meaning_definitions.get(definition_id)
        if accepted_definition is None:
            continue
        if item.get("term") != accepted_definition.get("term"):
            errors.append(f"definition result term mismatch: {definition_id}")
        mappings = item.get("accepted_pointer_results", [])
        source_pointers = [mapping.get("source_pointer") for mapping in mappings]
        successor_pointers = [
            mapping.get("successor_pointer")
            for mapping in mappings
            if isinstance(mapping.get("successor_pointer"), str)
        ]
        if verdict != "NOT_EVALUABLE" and source_pointers != accepted_definition.get("interpretation_refs", []):
            errors.append(f"interpretation pointer denominator mismatch: {definition_id}")
        if sorted(set(successor_pointers)) != sorted(item.get("successor_locations", [])):
            errors.append(f"successor location set mismatch: {definition_id}")
        total_pointer_mappings += len(mappings)
        pointer_statuses.extend(mapping.get("status") for mapping in mappings)
        for pointer in successor_pointers:
            if not pointer.startswith(ALLOWED_SUCCESSOR_POINTER_PREFIXES):
                errors.append(f"{definition_id}: successor pointer targets a forbidden section: {pointer}")
        if item.get("status") == "PASS" and any(
            mapping.get("status") != "PASS" for mapping in mappings
        ):
            errors.append(f"definition PASS contains a non-PASS pointer result: {definition_id}")
        if candidate is not None:
            for pointer in successor_pointers:
                try:
                    resolve_pointer(candidate, pointer)
                except (ValueError, IndexError, KeyError) as error:
                    errors.append(f"{definition_id}: {error}")
    if verdict != "NOT_EVALUABLE" and total_pointer_mappings != 66:
        errors.append(f"expected 66 interpretation pointer mappings, got {total_pointer_mappings}")

    delta_results = result.get("predecessor_delta_results", [])
    delta_ids = [item.get("delta_id") for item in delta_results]
    if len(delta_ids) != len(set(delta_ids)):
        errors.append("predecessor delta IDs are not unique")
    if candidate is not None and predecessor is not None:
        expected_identities = [delta_identity(item) for item in json_deltas(predecessor, candidate)]
        actual_identities = [delta_identity(item) for item in delta_results]
        if sorted(expected_identities, key=str) != sorted(actual_identities, key=str):
            errors.append("predecessor_delta_results do not exactly cover structural JSON deltas")
        for item in delta_results:
            try:
                if item.get("predecessor_pointer") is not None:
                    resolve_pointer(predecessor, item["predecessor_pointer"])
                if item.get("successor_pointer") is not None:
                    resolve_pointer(candidate, item["successor_pointer"])
            except (ValueError, IndexError, KeyError) as error:
                errors.append(f"delta {item.get('delta_id')}: {error}")

    check_results = result.get("mandatory_check_results", [])
    if [item.get("check_id") for item in check_results] != CHECK_IDS:
        errors.append("mandatory_check_results must use the exact ordered 17-check denominator")

    statuses = pointer_statuses + [
        item.get("status")
        for item in definition_results + check_results + delta_results
    ]
    findings = result.get("findings", [])
    finding_ids = [item.get("finding_id") for item in findings]
    if len(finding_ids) != len(set(finding_ids)):
        errors.append("finding IDs are not unique")
    known_findings = set(finding_ids)
    referenced_findings: list[Any] = []
    for item in definition_results + check_results + delta_results:
        referenced_findings.extend(item.get("finding_ids", []))
    for item in definition_results:
        for pointer_result in item.get("accepted_pointer_results", []):
            referenced_findings.extend(pointer_result.get("finding_ids", []))
    unknown_findings = sorted(set(referenced_findings) - known_findings)
    if unknown_findings:
        errors.append(f"unknown finding references: {', '.join(unknown_findings)}")
    open_findings = [item for item in findings if item.get("status") == "open"]
    if verdict == "PASS":
        if any(status != "PASS" for status in statuses) or open_findings:
            errors.append("PASS requires every result PASS and no open findings")
    elif verdict == "FLAG":
        if any(status != "PASS" for status in statuses):
            errors.append("FLAG requires every definition, check, pointer, and delta result PASS")
        if not open_findings:
            errors.append("FLAG requires at least one open editorial finding")
        if any(item.get("severity") != "editorial" for item in open_findings):
            errors.append("FLAG permits only open editorial flag findings")
    elif verdict == "BLOCK":
        if not any(status == "BLOCK" for status in statuses) and not any(
            item.get("severity") == "material" for item in open_findings
        ):
            errors.append("BLOCK requires a blocked result or open block finding")
    elif verdict == "NOT_EVALUABLE":
        if not any(status == "NOT_EVALUABLE" for status in statuses):
            errors.append("NOT_EVALUABLE requires an explicitly unevaluated result")
        if any(status != "NOT_EVALUABLE" for status in statuses):
            errors.append("NOT_EVALUABLE requires all dependent semantic results unevaluated")
        if not any(item.get("severity") == "causal-blocker" for item in open_findings):
            errors.append("NOT_EVALUABLE requires an open causal-blocker finding")
        if unavailable_inputs == 0:
            errors.append("NOT_EVALUABLE requires an observed unavailable candidate or source")

    if result.get("next_route") != NEXT_ROUTE_BY_VERDICT.get(verdict):
        errors.append("next_route does not match the verdict")
    if result.get("claim_ceiling") != RESULT_CLAIM_CEILING:
        errors.append("review result claim ceiling differs from the exact contract ceiling")

    if result.get("authority_effect") != "none":
        errors.append("review result authority_effect must remain none")
    return errors


def synthetic_result(
    contract: dict[str, Any],
    accepted_meaning: dict[str, Any],
    contract_path: Path,
    contract_schema_path: Path,
    result_schema_path: Path,
) -> dict[str, Any]:
    definition_results = []
    for definition in accepted_meaning["definitions"]:
        mappings = [
            {
                "source_pointer": pointer,
                "successor_pointer": pointer,
                "status": "PASS",
                "detail": "Synthetic pointer-coverage result.",
                "finding_ids": [],
            }
            for pointer in definition["interpretation_refs"]
        ]
        definition_results.append(
            {
                "definition_id": definition["definition_id"],
                "term": definition["term"],
                "accepted_pointer_results": mappings,
                "successor_locations": sorted(
                    {mapping["successor_pointer"] for mapping in mappings}
                ),
                "status": "PASS",
                "detail": "Synthetic schema-validation result.",
                "finding_ids": [],
                "causal_blockers": [],
            }
        )
    return {
        "schema_version": "auth-foundation.interpretation-model-independent-review/v1",
        "review_id": "AF-IMR-SYNTHETIC-SCHEMA-TEST",
        "reviewed_at": "2026-08-29T00:00:00Z",
        "reviewer_route": "validator-self-test-reviewer",
        "candidate_author_route": "validator-self-test-author",
        "review_contract_ref": exact_ref(contract_path),
        "candidate_exact_ref": exact_ref(contract_path),
        "source_exact_refs": [
            {"role": role, "ref": ref}
            for role, ref in result_role_refs(
                contract, contract_schema_path, result_schema_path
            ).items()
        ],
        "definition_results": definition_results,
        "mandatory_check_results": [
            {
                "check_id": check_id,
                "status": "PASS",
                "detail": "Synthetic schema-validation result.",
                "evidence_locations": ["#/synthetic"],
                "finding_ids": [],
                "causal_blockers": [],
            }
            for check_id in CHECK_IDS
        ],
        "predecessor_delta_results": [
            {
                "delta_id": "synthetic-delta-001",
                "predecessor_pointer": "#/version",
                "successor_pointer": "#/version",
                "change_kind": "changed",
                "classification": "required-lifecycle-change",
                "rationale": "Synthetic schema-validation delta.",
                "status": "PASS",
                "finding_ids": [],
                "causal_blockers": [],
            }
        ],
        "findings": [],
        "verdict": "PASS",
        "next_route": "owner-decision-gate",
        "authority_effect": "none",
        "claim_ceiling": RESULT_CLAIM_CEILING,
    }


def aligned_fixture_candidate(
    contract: dict[str, Any], predecessor: dict[str, Any]
) -> dict[str, Any]:
    candidate = copy.deepcopy(predecessor)
    candidate["version"] = "3-definitions-aligned-candidate"
    candidate["status"] = "draft"
    candidate["business_meaning_ref"] = {
        key: contract["source_closure"]["accepted_business_meaning"][key]
        for key in ("path", "sha256", "size_bytes")
    }
    candidate["acceptance"] = {
        "status": "not-requested",
        "owner_ref": "projects/auth-foundation/formalization",
        "acceptance_ref": None,
        "acceptance_digest": None,
    }
    candidate["claim_ceiling"] = (
        "Disposable validator fixture for one definitions-aligned candidate; "
        "no acceptance, proof, runtime, or production claim."
    )
    candidate["authority_effect"] = "none"
    return candidate


def delta_results_for(before: dict[str, Any], after: dict[str, Any]) -> list[dict[str, Any]]:
    results = []
    for index, delta in enumerate(json_deltas(before, after), start=1):
        pointer = delta.get("successor_pointer") or delta.get("predecessor_pointer") or ""
        classification = (
            "required-lifecycle-change"
            if pointer.startswith(("#/version", "#/status", "#/acceptance"))
            else "v2-definition-alignment"
        )
        results.append({
            "delta_id": f"synthetic-delta-{index:03d}",
            **delta,
            "classification": classification,
            "rationale": "Disposable fixture delta for validator regression coverage.",
            "status": "PASS",
            "finding_ids": [],
            "causal_blockers": [],
        })
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", default=str(CONTRACT_PATH))
    parser.add_argument("--contract-schema", default=str(CONTRACT_SCHEMA_PATH))
    parser.add_argument("--result-schema", default=str(RESULT_SCHEMA_PATH))
    parser.add_argument("--result")
    parser.add_argument("--receipt")
    args = parser.parse_args()

    checks: list[dict[str, str]] = []
    blockers: list[dict[str, str]] = []

    def check(check_id: str, condition: bool, detail: str) -> None:
        status = "pass" if condition else "block"
        checks.append({"check_id": check_id, "status": status, "detail": detail})
        if not condition:
            blockers.append({"check_id": check_id, "detail": detail})

    contract_path = Path(args.contract).resolve()
    contract_schema_path = Path(args.contract_schema).resolve()
    result_schema_path = Path(args.result_schema).resolve()
    try:
        contract = load_json(contract_path)
        contract_schema = load_json(contract_schema_path)
        result_schema = load_json(result_schema_path)
        check("AF-IMRV-001", True, "contract and both schemas parse as JSON objects")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        check("AF-IMRV-001", False, str(error))
        contract = {}
        contract_schema = {}
        result_schema = {}

    schema_definition_errors: list[str] = []
    for label, schema in (
        ("contract", contract_schema),
        ("result", result_schema),
    ):
        try:
            Draft202012Validator.check_schema(schema)
            if schema.get("$schema") != "https://json-schema.org/draft/2020-12/schema":
                schema_definition_errors.append(f"{label}: not Draft 2020-12")
        except Exception as error:  # jsonschema exposes several schema exceptions
            schema_definition_errors.append(f"{label}: {error}")
    check(
        "AF-IMRV-002",
        not schema_definition_errors,
        "both schemas are valid Draft 2020-12" if not schema_definition_errors else "; ".join(schema_definition_errors),
    )

    contract_shape_errors = schema_errors(contract, contract_schema) if contract_schema else ["schema unavailable"]
    check(
        "AF-IMRV-003",
        not contract_shape_errors,
        "review contract conforms to its dedicated schema" if not contract_shape_errors else "; ".join(contract_shape_errors),
    )

    binding_errors = source_binding_errors(contract) if contract else ["contract unavailable"]
    check(
        "AF-IMRV-004",
        not binding_errors,
        "six source bindings and the case authoring baseline match exact bytes" if not binding_errors else "; ".join(binding_errors),
    )

    accepted_meaning: dict[str, Any] = {}
    predecessor: dict[str, Any] = {}
    source_state_errors: list[str] = []
    if contract:
        try:
            source = contract["source_closure"]
            accepted_meaning = load_json(resolve_repo_path(source["accepted_business_meaning"]["path"]))
            meaning_decision = load_json(resolve_repo_path(source["business_meaning_owner_decision"]["path"]))
            predecessor = load_json(resolve_repo_path(source["stale_predecessor_interpretation"]["path"]))
            acceptance_review = load_json(resolve_repo_path(source["business_meaning_acceptance_review"]["path"]))
            acceptance_validation = load_json(resolve_repo_path(source["business_meaning_validation"]["path"]))
            case_package = load_json(resolve_repo_path(contract["run_time_bindings"]["current_case_package"]["path"]))
            if accepted_meaning.get("status") != "accepted" or accepted_meaning.get("version") != "2-definitions-accepted":
                source_state_errors.append("BusinessMeaning is not accepted v2")
            if meaning_decision.get("selected_option_id") != "AF-BM2-ACCEPT":
                source_state_errors.append("BusinessMeaning owner decision is not AF-BM2-ACCEPT")
            if acceptance_review.get("result") != "pass":
                source_state_errors.append("BusinessMeaning independent acceptance review is not pass")
            if acceptance_validation.get("status") != "pass":
                source_state_errors.append("BusinessMeaning validation is not pass")
            semantic_acceptance = case_package.get("semantic_acceptance", {})
            if semantic_acceptance.get("business_status") != "accepted":
                source_state_errors.append("case does not report accepted BusinessMeaning")
            if semantic_acceptance.get("interpretation_status") != "stale":
                source_state_errors.append("case does not report stale predecessor interpretation")
            pointer_count = 0
            for definition in accepted_meaning.get("definitions", []):
                for pointer in definition.get("interpretation_refs", []):
                    pointer_count += 1
                    try:
                        resolve_pointer(predecessor, pointer)
                    except (ValueError, IndexError, KeyError) as error:
                        source_state_errors.append(
                            f"{definition.get('definition_id')}: {error}"
                        )
            if pointer_count != 66:
                source_state_errors.append(
                    f"accepted interpretation pointer denominator is {pointer_count}, expected 66"
                )
        except (KeyError, OSError, ValueError, json.JSONDecodeError) as error:
            source_state_errors.append(str(error))
    check(
        "AF-IMRV-005",
        not source_state_errors,
        "accepted v2 meaning, owner decision, review, validation, and stale predecessor state are coherent" if not source_state_errors else "; ".join(source_state_errors),
    )

    semantic_errors = contract_semantic_errors(contract, accepted_meaning) if accepted_meaning else ["accepted meaning unavailable"]
    check(
        "AF-IMRV-006",
        not semantic_errors,
        "contract closes the exact 20-definition and 17-check denominators with no authority" if not semantic_errors else "; ".join(semantic_errors),
    )

    decision_errors: list[str] = []
    try:
        decision = load_json(REPOSITORY_ROOT / DECISION_PATH)
        if decision.get("status") != "resolved-pass":
            decision_errors.append("revision decision is not resolved-pass")
        if decision.get("selected_option_id") != "AF-IMR-CONTRACT-REVISE":
            decision_errors.append("revision decision did not select AF-IMR-CONTRACT-REVISE")
        source = decision.get("source_of_decision", {})
        if source.get("raw_response") != "A" or source.get("mapped_option_id") != "AF-IMR-CONTRACT-REVISE":
            decision_errors.append("owner response A is not exact-mapped to the revision option")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        decision_errors.append(str(error))
    check(
        "AF-IMRV-007",
        not decision_errors,
        "owner response A exact-authorizes only the bounded enforcement revision" if not decision_errors else "; ".join(decision_errors),
    )

    synthetic = synthetic_result(
        contract, accepted_meaning, contract_path, contract_schema_path, result_schema_path
    ) if accepted_meaning else {}
    synthetic_schema_errors = schema_errors(synthetic, result_schema) if synthetic else ["synthetic result unavailable"]
    check(
        "AF-IMRV-008",
        not synthetic_schema_errors,
        "review-result schema admits a complete 20-definition, 17-check synthetic result" if not synthetic_schema_errors else "; ".join(synthetic_schema_errors),
    )

    self_test_errors: list[str] = []
    if contract and contract_schema and accepted_meaning and synthetic:
        missing_authority = copy.deepcopy(contract)
        missing_authority.pop("authority_effect", None)
        if not schema_errors(missing_authority, contract_schema):
            self_test_errors.append("contract schema accepted missing authority_effect")

        duplicate_definition = copy.deepcopy(contract)
        duplicate_definition["definition_coverage"][-1]["definition_id"] = DEFINITION_IDS[-2]
        if not contract_semantic_errors(duplicate_definition, accepted_meaning):
            self_test_errors.append("semantic validator accepted duplicate definition identity")

        short_result = copy.deepcopy(synthetic)
        short_result["definition_results"].pop()
        if not schema_errors(short_result, result_schema):
            self_test_errors.append("result schema accepted 19 definition results")

        extra_result = copy.deepcopy(synthetic)
        extra_result["definition_results"].append(copy.deepcopy(extra_result["definition_results"][-1]))
        if not schema_errors(extra_result, result_schema):
            self_test_errors.append("result schema accepted 21 definition results")

        duplicate_check = copy.deepcopy(synthetic)
        duplicate_check["mandatory_check_results"][-1]["check_id"] = CHECK_IDS[-2]
        if not result_semantic_errors(
            duplicate_check,
            contract,
            accepted_meaning,
            contract_path,
            contract_schema_path,
            result_schema_path,
            resolve_targets=False,
        ):
            self_test_errors.append("semantic validator accepted duplicate check identity")

        stale_ref = exact_ref(contract_path)
        stale_ref["sha256"] = "0" * 64
        if not exact_ref_errors("self-test-stale", stale_ref, require_current=True):
            self_test_errors.append("exact reference validator accepted a stale digest")

        try:
            resolve_pointer({}, "#/missing")
            self_test_errors.append("pointer resolver accepted an unresolved pointer")
        except ValueError:
            pass

        expected_delta = [delta_identity(item) for item in json_deltas({"a": 1}, {"a": 2})]
        if expected_delta == []:
            self_test_errors.append("delta calculator failed to detect a changed value")

        false_pass = copy.deepcopy(synthetic)
        false_pass["mandatory_check_results"][0]["status"] = "BLOCK"
        if not result_semantic_errors(
            false_pass,
            contract,
            accepted_meaning,
            contract_path,
            contract_schema_path,
            result_schema_path,
            resolve_targets=False,
        ):
            self_test_errors.append("semantic validator accepted PASS with a blocked check")

        false_flag = copy.deepcopy(synthetic)
        false_flag["verdict"] = "FLAG"
        false_flag["next_route"] = "editorial-repair"
        false_flag["findings"] = [{
            "finding_id": "synthetic-material",
            "severity": "material",
            "locator": "#/synthetic",
            "detail": "Synthetic material finding.",
            "status": "open",
        }]
        if not result_semantic_errors(
            false_flag,
            contract,
            accepted_meaning,
            contract_path,
            contract_schema_path,
            result_schema_path,
            resolve_targets=False,
        ):
            self_test_errors.append("semantic validator accepted FLAG with a material finding")

        false_not_evaluable = copy.deepcopy(synthetic)
        false_not_evaluable["verdict"] = "NOT_EVALUABLE"
        false_not_evaluable["next_route"] = "restore-exact-source-closure"
        false_not_evaluable["definition_results"][0]["status"] = "NOT_EVALUABLE"
        false_not_evaluable["definition_results"][0]["causal_blockers"] = ["synthetic-cause"]
        false_not_evaluable["findings"] = [{
            "finding_id": "synthetic-cause",
            "severity": "causal-blocker",
            "locator": "#/synthetic",
            "detail": "Synthetic unavailable source.",
            "status": "open",
        }]
        if not result_semantic_errors(
            false_not_evaluable,
            contract,
            accepted_meaning,
            contract_path,
            contract_schema_path,
            result_schema_path,
            resolve_targets=False,
        ):
            self_test_errors.append("semantic validator accepted NOT_EVALUABLE with dependent PASS results")

        non_none_authority = copy.deepcopy(synthetic)
        non_none_authority["authority_effect"] = "accept"
        if not schema_errors(non_none_authority, result_schema):
            self_test_errors.append("result schema accepted non-none authority effect")

        with tempfile.TemporaryDirectory(
            prefix=".imr-validator-", dir=SCRIPT_DIR
        ) as temporary_directory:
            fixture_path = Path(temporary_directory) / "candidate.json"
            valid_candidate = aligned_fixture_candidate(contract, predecessor)

            def write_candidate(value: dict[str, Any]) -> None:
                fixture_path.write_text(
                    json.dumps(value, indent=2) + "\n", encoding="utf-8"
                )

            def result_for(value: dict[str, Any]) -> dict[str, Any]:
                write_candidate(value)
                fixture_result = copy.deepcopy(synthetic)
                fixture_result["candidate_exact_ref"] = exact_ref(fixture_path)
                fixture_result["predecessor_delta_results"] = delta_results_for(
                    predecessor, value
                )
                return fixture_result

            valid_fixture_result = result_for(valid_candidate)
            valid_fixture_errors = schema_errors(valid_fixture_result, result_schema)
            valid_fixture_errors.extend(result_semantic_errors(
                valid_fixture_result,
                contract,
                accepted_meaning,
                contract_path,
                contract_schema_path,
                result_schema_path,
                resolve_targets=True,
            ))
            if valid_fixture_errors:
                self_test_errors.append(
                    "actual disposable aligned candidate failed positive validation: "
                    + "; ".join(valid_fixture_errors)
                )

            omitted_delta = copy.deepcopy(valid_fixture_result)
            omitted_delta["predecessor_delta_results"].pop()
            if not result_semantic_errors(
                omitted_delta,
                contract,
                accepted_meaning,
                contract_path,
                contract_schema_path,
                result_schema_path,
                resolve_targets=True,
            ):
                self_test_errors.append("semantic validator accepted an omitted delta")

            extra_delta = copy.deepcopy(valid_fixture_result)
            extra_item = copy.deepcopy(extra_delta["predecessor_delta_results"][-1])
            extra_item["delta_id"] = "synthetic-extra-delta"
            extra_delta["predecessor_delta_results"].append(extra_item)
            if not result_semantic_errors(
                extra_delta,
                contract,
                accepted_meaning,
                contract_path,
                contract_schema_path,
                result_schema_path,
                resolve_targets=True,
            ):
                self_test_errors.append("semantic validator accepted an extra delta")

            omitted_pointer = copy.deepcopy(valid_fixture_result)
            omitted_pointer["definition_results"][0]["accepted_pointer_results"].pop()
            if not result_semantic_errors(
                omitted_pointer,
                contract,
                accepted_meaning,
                contract_path,
                contract_schema_path,
                result_schema_path,
                resolve_targets=True,
            ):
                self_test_errors.append("semantic validator accepted an omitted definition pointer")

            current_false = copy.deepcopy(valid_fixture_result)
            current_false["candidate_exact_ref"] = {
                "path": fixture_path.relative_to(REPOSITORY_ROOT).as_posix(),
                "current": False,
                "failure_kind": "missing",
                "detail": "Synthetic false unavailable claim."
            }
            if not result_semantic_errors(
                current_false,
                contract,
                accepted_meaning,
                contract_path,
                contract_schema_path,
                result_schema_path,
                resolve_targets=True,
            ):
                self_test_errors.append("semantic validator accepted current false for a readable candidate")

            candidate_mutations = {
                "wrong model_id": lambda item: item.__setitem__("model_id", "WrongModel"),
                "reused version": lambda item: item.__setitem__("version", "2-accepted"),
                "accepted status": lambda item: (
                    item.__setitem__("status", "accepted"),
                    item.__setitem__("acceptance", copy.deepcopy(predecessor["acceptance"])),
                ),
                "copied acceptance": lambda item: item.__setitem__(
                    "acceptance", copy.deepcopy(predecessor["acceptance"])
                ),
                "unsupported property": lambda item: item.__setitem__("supersedes", "unsupported"),
                "non-none candidate authority": lambda item: item.__setitem__("authority_effect", "accept"),
            }
            for label, mutate in candidate_mutations.items():
                mutated_candidate = copy.deepcopy(valid_candidate)
                mutate(mutated_candidate)
                mutated_result = result_for(mutated_candidate)
                if not result_semantic_errors(
                    mutated_result,
                    contract,
                    accepted_meaning,
                    contract_path,
                    contract_schema_path,
                    result_schema_path,
                    resolve_targets=True,
                ):
                    self_test_errors.append(f"semantic validator accepted {label}")

            missing_candidate_path = Path(temporary_directory) / "missing-candidate.json"
            truthful_not_evaluable = copy.deepcopy(synthetic)
            truthful_not_evaluable["candidate_exact_ref"] = {
                "path": missing_candidate_path.relative_to(REPOSITORY_ROOT).as_posix(),
                "current": False,
                "failure_kind": "missing",
                "detail": "Disposable candidate is intentionally absent."
            }
            for definition_result in truthful_not_evaluable["definition_results"]:
                definition_result["accepted_pointer_results"] = []
                definition_result["successor_locations"] = []
                definition_result["status"] = "NOT_EVALUABLE"
                definition_result["causal_blockers"] = ["missing-candidate"]
            for check_result in truthful_not_evaluable["mandatory_check_results"]:
                check_result["status"] = "NOT_EVALUABLE"
                check_result["causal_blockers"] = ["missing-candidate"]
            truthful_not_evaluable["predecessor_delta_results"] = []
            truthful_not_evaluable["findings"] = [{
                "finding_id": "missing-candidate",
                "severity": "causal-blocker",
                "locator": "#/candidate_exact_ref",
                "detail": "The candidate is unavailable, so semantic checks cannot run.",
                "status": "open",
            }]
            truthful_not_evaluable["verdict"] = "NOT_EVALUABLE"
            truthful_not_evaluable["next_route"] = "restore-exact-source-closure"
            truthful_not_evaluable_errors = schema_errors(
                truthful_not_evaluable, result_schema
            )
            truthful_not_evaluable_errors.extend(result_semantic_errors(
                truthful_not_evaluable,
                contract,
                accepted_meaning,
                contract_path,
                contract_schema_path,
                result_schema_path,
                resolve_targets=True,
            ))
            if truthful_not_evaluable_errors:
                self_test_errors.append(
                    "truthful NOT_EVALUABLE fixture failed: "
                    + "; ".join(truthful_not_evaluable_errors)
                )
    else:
        self_test_errors.append("self-test prerequisites unavailable")
    check(
        "AF-IMRV-009",
        not self_test_errors,
        "disposable positive and NOT_EVALUABLE fixtures plus 22 negative regressions cover denominators, pointers, deltas, lifecycle, schemas, verdicts, currentness, and authority" if not self_test_errors else "; ".join(self_test_errors),
    )

    result_ref: dict[str, Any] | None = None
    if args.result:
        result_path = Path(args.result).resolve()
        result_errors: list[str] = []
        try:
            result = load_json(result_path)
            result_errors.extend(schema_errors(result, result_schema))
            if not result_errors:
                result_errors.extend(
                    result_semantic_errors(
                        result,
                        contract,
                        accepted_meaning,
                        contract_path,
                        contract_schema_path,
                        result_schema_path,
                        resolve_targets=True,
                    )
                )
            result_ref = exact_ref(result_path)
        except (OSError, ValueError, json.JSONDecodeError) as error:
            result_errors.append(str(error))
        check(
            "AF-IMRV-010",
            not result_errors,
            "supplied independent review result conforms and closes exact semantic bindings" if not result_errors else "; ".join(result_errors),
        )
    else:
        check(
            "AF-IMRV-010",
            True,
            "no independent review result supplied; validator evaluated enforcement-package readiness only",
        )

    receipt = {
        "schema_version": "auth-foundation.interpretation-model-review-enforcement-validation/v1",
        "status": "pass" if not blockers else "block",
        "authority_effect": "none",
        "validated_artifacts": {
            "review_contract": exact_ref(contract_path) if contract_path.is_file() else None,
            "review_contract_schema": exact_ref(contract_schema_path) if contract_schema_path.is_file() else None,
            "review_result_schema": exact_ref(result_schema_path) if result_schema_path.is_file() else None,
            "validator": exact_ref(Path(__file__).resolve()),
            "review_result": result_ref,
        },
        "counts": {
            "definitions": len(contract.get("definition_coverage", [])),
            "accepted_interpretation_pointers": sum(
                len(item.get("interpretation_refs", []))
                for item in accepted_meaning.get("definitions", [])
            ),
            "mandatory_checks": len(contract.get("mandatory_checks", [])),
            "validation_checks": len(checks),
            "blockers": len(blockers),
        },
        "checks": checks,
        "blockers": blockers,
        "claim_ceiling": "Validates the candidate review contract, its two schemas, exact source closure, denominator enforcement, and optional review-result shape and coherence. It does not accept the review procedure or an InterpretationModel, admit a FormalClaim, derive obligations, or establish provider, EVF, runtime, security, release, or production evidence.",
    }
    rendered = json.dumps(receipt, indent=2, sort_keys=False) + "\n"
    if args.receipt:
        receipt_path = Path(args.receipt)
        if not receipt_path.is_absolute():
            receipt_path = REPOSITORY_ROOT / receipt_path
        receipt_path.parent.mkdir(parents=True, exist_ok=True)
        receipt_path.write_text(rendered, encoding="utf-8")
    sys.stdout.write(rendered)
    return 0 if not blockers else 1


if __name__ == "__main__":
    raise SystemExit(main())
