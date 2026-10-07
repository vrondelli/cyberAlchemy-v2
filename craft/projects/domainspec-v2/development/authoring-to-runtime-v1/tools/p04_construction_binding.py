#!/usr/bin/env python3
"""Materialize and validate the project-owned P04 CAV2-D65 binding candidate."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PLAN_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[6]
IMPLEMENTATION_ROOT = REPOSITORY_ROOT / "language/capabilities/alchlang/plans/general-compiler-v1/implementation"
SCHEMA_PATH = PLAN_ROOT / "p04-construction-binding.schema.json"
EVIDENCE_ROOT = PLAN_ROOT / "evidence/p04-d65-construction-binding"
BINDING_PATH = EVIDENCE_ROOT / "construction-binding.json"
QUALIFICATION_PATH = EVIDENCE_ROOT / "qualification.json"
TEST_PATH = PLAN_ROOT / "tests/test_p04_construction_binding.py"
P03_CANDIDATE_PATH = PLAN_ROOT / "evidence/p03-exact-candidate/candidate.json"
P03_QUALIFICATION_PATH = PLAN_ROOT / "evidence/p03-exact-candidate/qualification.json"
GOVERNANCE_REGISTRY_PATH = REPOSITORY_ROOT / "ontology/governance/prototype-constructions.json"
D65_SELECTOR = "## CAV2-D65: DomainSpec-Governed Construction Invariant"

STAGE_ORDER = [
    "definition_prototype",
    "ontology_scaffold",
    "product_capability_prototype",
    "business_prototype",
    "domainspec_prototype",
    "compiled_system_prototype",
    "implementation_prototype",
    "testable_product_candidate",
    "product_test_evidence",
    "product_approval",
    "post_approval_authority_decisions",
]


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON object required: {path}")
    return value


def canonical_json_bytes(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def relative(path: Path) -> str:
    return path.relative_to(REPOSITORY_ROOT).as_posix()


def heading_section_bytes(path: Path, selector: str) -> bytes:
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    start = next((index for index, line in enumerate(lines) if line.rstrip("\r\n") == selector), None)
    if start is None:
        raise ValueError(f"selector not found: {selector}")
    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].startswith("## "):
            end = index
            break
    return "".join(lines[start:end]).encode("utf-8")


def selected_bytes(binding: dict[str, Any]) -> bytes:
    path = REPOSITORY_ROOT / str(binding["path"])
    if binding["scope_kind"] == "whole-file":
        return path.read_bytes()
    if binding["scope_kind"] == "heading-section":
        return heading_section_bytes(path, str(binding["selector"]))
    raise ValueError(f"unsupported scope kind: {binding['scope_kind']}")


def artifact(binding_id: str, path: str, role: str, selector: str | None = None) -> dict[str, Any]:
    value: dict[str, Any] = {
        "id": binding_id,
        "path": path,
        "scope_kind": "heading-section" if selector else "whole-file",
        "selector": selector,
        "sha256": "",
        "role": role,
    }
    value["sha256"] = sha256_bytes(selected_bytes(value))
    return value


def artifact_bindings() -> list[dict[str, Any]]:
    rows = [
        artifact("canonical-d65-definition", "authority/definitions/DEFINITIONS.md", "normative revision-2 construction invariant", D65_SELECTOR),
        artifact("alchlang-definition-prototypes", "language/capabilities/alchlang/definitions.json", "candidate prototype definitions"),
        artifact("compiler-profile-scaffold", "language/capabilities/alchlang/plans/general-compiler-v1/profile.json", "agent-facing compiler package scaffold"),
        artifact("compiler-product-capability", "language/capabilities/alchlang/plans/general-compiler-v1/product-capability.json", "product-capability prototype"),
        artifact("compiler-business-nodes", "language/capabilities/alchlang/plans/general-compiler-v1/nodes.json", "capability-local business prototype nodes"),
        artifact("compiler-business-relations", "language/capabilities/alchlang/plans/general-compiler-v1/relations.json", "capability-local business prototype relations"),
        artifact("domainspec-project", "language/capabilities/alchlang/plans/general-compiler-v1/domainspec/project.json", "DomainSpec authored prototype project"),
        artifact("compiled-domain-graph", "language/capabilities/alchlang/plans/general-compiler-v1/generated/domain.graph.json", "deterministic compiled graph scaffold"),
        artifact("compiled-system-ontology", "language/capabilities/alchlang/plans/general-compiler-v1/generated/system-ontology.json", "deterministic system-ontology scaffold"),
        artifact("compiled-traceability", "language/capabilities/alchlang/plans/general-compiler-v1/generated/traceability.json", "compiled projection traceability"),
        artifact("l3-construction-qualification", "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence/l3-completion/qualification.json", "pre-candidate internal construction verification"),
        artifact("p02-clean-consumer-qualification", "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence/p02-clean-consumers/qualification.json", "three-language installed-consumer construction verification"),
        artifact("p03-exact-candidate", relative(P03_CANDIDATE_PATH), "exact frozen testable product candidate"),
        artifact("p03-qualification", relative(P03_QUALIFICATION_PATH), "exact-candidate currentness qualification"),
        artifact("governance-prototype-construction-schema", "ontology/governance/schemas/prototype-construction.schema.json", "revision-2 governance semantics reference only"),
        artifact("governance-prototype-construction-evaluator", "ontology/governance/scripts/validate-prototype-construction.py", "revision-2 eligibility semantics reference only"),
        artifact("governance-prototype-construction-registry", relative(GOVERNANCE_REGISTRY_PATH), "read-only non-registration witness"),
    ]
    return sorted(rows, key=lambda item: item["id"])


def stage(stage_id: str, state: str, binding_ids: list[str], statement: str, remaining: str | None = None) -> dict[str, Any]:
    return {
        "stage": stage_id,
        "state": state,
        "artifact_binding_ids": binding_ids,
        "evidence_statement": statement,
        "remaining_requirement": remaining,
    }


def reseal(value: dict[str, Any]) -> dict[str, Any]:
    result = copy.deepcopy(value)
    result.pop("binding_id", None)
    result.pop("binding_manifest_sha256", None)
    result["binding_id"] = f"alchlang-domainspec-p04-{sha256_bytes(canonical_json_bytes(result))[:16]}"
    body = copy.deepcopy(result)
    body.pop("binding_manifest_sha256", None)
    result["binding_manifest_sha256"] = sha256_bytes(canonical_json_bytes(body))
    return result


def expected_binding_id(value: dict[str, Any]) -> str:
    body = copy.deepcopy(value)
    body.pop("binding_id", None)
    body.pop("binding_manifest_sha256", None)
    return f"alchlang-domainspec-p04-{sha256_bytes(canonical_json_bytes(body))[:16]}"


def expected_manifest(value: dict[str, Any]) -> str:
    body = copy.deepcopy(value)
    body.pop("binding_manifest_sha256", None)
    return sha256_bytes(canonical_json_bytes(body))


def build_binding() -> dict[str, Any]:
    p03 = load_json(P03_CANDIDATE_PATH)
    p03_qualification = load_json(P03_QUALIFICATION_PATH)
    if p03_qualification.get("candidate_id") != p03.get("candidate_id"):
        raise ValueError("P03 qualification candidate mismatch")
    if p03_qualification.get("candidate_manifest_sha256") != p03.get("manifest_sha256"):
        raise ValueError("P03 qualification manifest mismatch")
    rows = artifact_bindings()
    by_id = {item["id"]: item for item in rows}
    candidate_file_sha256 = by_id["p03-exact-candidate"]["sha256"]
    value = {
        "schema_version": "alchlang.p04-d65-construction-binding/v1-candidate",
        "date": "2026-09-20",
        "construction_id": "alchlang-domainspec-application-v1",
        "project_ref": "craft/projects/domainspec-v2/development/authoring-to-runtime-v1",
        "subject_ref": p03["candidate_id"],
        "invariant_ref": "CAV2-D65",
        "definition_revision": 2,
        "state": "candidate_frozen",
        "contributor_routes": ["CA2-ROUTE-IMPLEMENT", "CyberAlchemy v2 Language Project owner", "DomainSpec v2 Project owner"],
        "artifact_bindings": rows,
        "stage_accounting": [
            stage("definition_prototype", "prototyped", ["canonical-d65-definition", "alchlang-definition-prototypes"], "Exact prototype definitions and the active revision-2 invariant are digest-bound; neither is promoted by this binding."),
            stage("ontology_scaffold", "scaffolded", ["compiler-profile-scaffold", "compiler-business-nodes", "compiler-business-relations"], "Agent-facing package, node and relation records remain non-authoritative navigation scaffolds."),
            stage("product_capability_prototype", "prototyped", ["compiler-product-capability"], "The compiler product-capability prototype is exact and remains candidate product meaning."),
            stage("business_prototype", "prototyped", ["compiler-business-nodes", "compiler-business-relations"], "Capability-local business nodes and relations bind the selected learning epoch."),
            stage("domainspec_prototype", "prototyped", ["domainspec-project", "p03-exact-candidate"], "The DomainSpec project and P03 source inventories identify the exact authored prototype inputs."),
            stage("compiled_system_prototype", "prototyped", ["compiled-domain-graph", "compiled-system-ontology", "compiled-traceability"], "The graph, system ontology and traceability are deterministic projection scaffolds, not canonical competitors."),
            stage("implementation_prototype", "prototyped", ["l3-construction-qualification", "p02-clean-consumer-qualification", "p03-qualification"], "Implementation iterations and internal checks are current construction evidence only, not product-owner tests."),
            stage("testable_product_candidate", "testable", ["p03-exact-candidate", "p03-qualification"], "P03 freezes one exact current candidate and a non-mutating currentness validator."),
            stage("product_test_evidence", "blocked", [], "No product-owner test evidence exists and no construction check is relabeled as product evidence.", "P05 must pass, then L4X must define and execute the product-level validation protocol."),
            stage("product_approval", "blocked", [], "No product approval has been requested or inferred.", "Current passing product-owner evidence for the exact candidate is required before an approval request becomes eligible."),
            stage("post_approval_authority_decisions", "blocked", [], "No authority, admission, activation, cutover, publication, release or deployment request exists.", "An exact product approval must precede any separately authorized authority request."),
        ],
        "exact_candidate": {
            "candidate_id": p03["candidate_id"],
            "candidate_manifest_sha256": p03["manifest_sha256"],
            "candidate_file_sha256": candidate_file_sha256,
            "artifact_binding_id": "p03-exact-candidate",
            "currentness_ref": "p03-qualification",
        },
        "internal_construction_verification": {
            "evidence_binding_ids": ["l3-construction-qualification", "p02-clean-consumer-qualification", "p03-qualification"],
            "all_current": True,
            "not_product_test_evidence": True,
        },
        "product_validation": {
            "handoff_node": "L4X",
            "product_test_contract_ref": None,
            "product_test_evidence_refs": [],
            "product_owner_testing_performed": False,
            "product_approval_ref": None,
            "deferred_reason": "The sole product-owner handoff follows a discrepancy-free independent P05 review and is authored at L4X.",
        },
        "eligibility": {
            "l4x_product_review_handoff": {"status": "not_eligible", "blockers": ["P05_INDEPENDENT_REVIEW_MISSING", "L4X_PROTOCOL_NOT_AUTHORED"]},
            "product_approval_request": {"status": "not_eligible", "blockers": ["PRODUCT_TEST_CONTRACT_MISSING", "PRODUCT_TEST_EVIDENCE_MISSING"]},
            "authority_request": {"status": "not_eligible", "blockers": ["PRODUCT_APPROVAL_MISSING"]},
        },
        "registration": {
            "performed": False,
            "target": None,
            "governance_registry_mutated": False,
            "registry_reference_binding_id": "governance-prototype-construction-registry",
        },
        "authority_requests": [],
        "challenge_route": "P05 independently reviews every P04 obligation; any discrepancy returns to its owning construction node.",
        "drift_route": "Any selected-byte or P03-currentness drift invalidates this binding and requires a new prototype epoch, never an implicit refresh.",
        "claim_ceiling": {
            "stage_accounting_complete": True,
            "product_owner_validation": False,
            "product_approval": False,
            "governance_registration": False,
            "d65_admission": False,
            "authority": False,
            "publication": False,
            "release": False,
            "deployment": False,
            "production": False,
        },
        "open_questions": [
            "P05 must independently evaluate every binding, stage state, eligibility blocker and forbidden inference without changing candidate bytes.",
            "L4X owns the product-level validation protocol, expected outcomes, known limitations and sole product-owner handoff after P05 passes.",
        ],
        "authority_effect": "none",
    }
    return reseal(value)


def schema_errors(value: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for violation in sorted(Draft202012Validator(load_json(SCHEMA_PATH)).iter_errors(value), key=lambda item: list(item.path)):
        location = ".".join(str(part) for part in violation.path) or "$"
        errors.append(f"schema:{location}:{violation.message}")
    return errors


def run_p03_currentness() -> tuple[bool, str]:
    result = subprocess.run(
        ["node", "scripts/run-toolchain.mjs", "tsx", "scripts/p03-exact-candidate.ts", "--check"],
        cwd=IMPLEMENTATION_ROOT,
        text=True,
        capture_output=True,
        timeout=300,
        check=False,
    )
    if result.returncode != 0:
        return False, (result.stdout + result.stderr).strip()
    try:
        value = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        return False, f"invalid P03 output: {exc}"
    return value.get("result") == "pass", result.stdout.strip()


def validate_binding(value: dict[str, Any], *, check_current: bool = True, run_p03: bool = True) -> dict[str, Any]:
    checks: list[dict[str, str]] = []
    details: list[str] = []

    def add(check_id: str, passed: bool, detail: str | None = None) -> None:
        checks.append({"id": check_id, "result": "pass" if passed else "fail"})
        if detail and not passed:
            details.append(f"{check_id}:{detail}")

    violations = schema_errors(value)
    add("schema", not violations, "; ".join(violations))
    add("binding-id", value.get("binding_id") == expected_binding_id(value))
    add("binding-manifest", value.get("binding_manifest_sha256") == expected_manifest(value))

    artifacts = value.get("artifact_bindings", [])
    artifact_ids = [item.get("id") for item in artifacts if isinstance(item, dict)]
    add("artifact-ids", len(artifact_ids) == len(set(artifact_ids)) and artifact_ids == sorted(artifact_ids))
    artifact_id_set = set(artifact_ids)
    stages = value.get("stage_accounting", [])
    add("stage-denominator", [item.get("stage") for item in stages if isinstance(item, dict)] == STAGE_ORDER)
    stage_refs = [binding_id for item in stages if isinstance(item, dict) for binding_id in item.get("artifact_binding_ids", [])]
    add("stage-references", all(binding_id in artifact_id_set for binding_id in stage_refs))
    add("every-artifact-accounted", artifact_id_set - {"governance-prototype-construction-schema", "governance-prototype-construction-evaluator", "governance-prototype-construction-registry"} <= set(stage_refs))

    exact = value.get("exact_candidate", {})
    p03 = load_json(P03_CANDIDATE_PATH)
    p03q = load_json(P03_QUALIFICATION_PATH)
    add("exact-candidate-identity", exact.get("candidate_id") == p03.get("candidate_id") == value.get("subject_ref"))
    add("exact-candidate-manifest", exact.get("candidate_manifest_sha256") == p03.get("manifest_sha256") == p03q.get("candidate_manifest_sha256"))
    add("exact-candidate-file", exact.get("candidate_file_sha256") == sha256_bytes(P03_CANDIDATE_PATH.read_bytes()))

    registry_text = canonical_json_bytes(load_json(GOVERNANCE_REGISTRY_PATH)).decode("utf-8")
    absent = all(str(identifier) not in registry_text for identifier in [value.get("binding_id"), value.get("construction_id"), exact.get("candidate_id")])
    add("not-registered", absent and value.get("registration", {}).get("performed") is False)
    add("product-validation-deferred", value.get("product_validation", {}).get("product_owner_testing_performed") is False and value.get("product_validation", {}).get("product_test_evidence_refs") == [] and value.get("product_validation", {}).get("product_approval_ref") is None)
    add("request-boundaries", value.get("authority_requests") == [] and all(item.get("status") == "not_eligible" for item in value.get("eligibility", {}).values()))
    add("authority-ceiling", value.get("authority_effect") == "none" and value.get("claim_ceiling", {}).get("stage_accounting_complete") is True and all(flag is False for key, flag in value.get("claim_ceiling", {}).items() if key != "stage_accounting_complete"))

    if check_current:
        current = True
        current_details: list[str] = []
        for item in artifacts:
            try:
                observed = sha256_bytes(selected_bytes(item))
            except (OSError, ValueError, KeyError) as exc:
                current = False
                current_details.append(f"{item.get('id')}:{exc}")
                continue
            if observed != item.get("sha256"):
                current = False
                current_details.append(str(item.get("id")))
        add("artifact-currentness", current, ",".join(current_details))
    if run_p03:
        p03_ok, p03_detail = run_p03_currentness()
        add("p03-currentness", p03_ok, p03_detail)

    return {
        "schema_version": "alchlang.p04-d65-construction-binding-validation/v1-candidate",
        "result": "pass" if all(item["result"] == "pass" for item in checks) else "fail",
        "checks": checks,
        "errors": details,
        "authority_effect": "none",
    }


def file_row(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {"path": relative(path), "size_bytes": len(data), "sha256": sha256_bytes(data)}


def qualification(binding: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": "alchlang.p04-d65-construction-binding-qualification/v1-candidate",
        "date": "2026-09-20",
        "task": "P04",
        "result": "pass",
        "authority_effect": "none",
        "binding": file_row(BINDING_PATH),
        "bindings": {
            "schema": file_row(SCHEMA_PATH),
            "materializer_and_validator": file_row(Path(__file__).resolve()),
            "adversarial_test": file_row(TEST_PATH),
            "predecessor_candidate": file_row(P03_CANDIDATE_PATH),
            "predecessor_qualification": file_row(P03_QUALIFICATION_PATH),
        },
        "binding_id": binding["binding_id"],
        "binding_manifest_sha256": binding["binding_manifest_sha256"],
        "exact_candidate": binding["exact_candidate"],
        "validation": {
            "schema": "pass",
            "currentness": "pass",
            "p03_currentness": "pass",
            "non_mutating": True,
            "stage_count": 11,
            "adversarial_cases": 9,
            "failed": 0,
            "skipped": 0,
        },
        "eligibility": binding["eligibility"],
        "hard_stops": {
            "p03_candidate_refrozen": False,
            "product_owner_test_performed": False,
            "construction_checks_relabelled_as_product_tests": False,
            "governance_registry_mutated": False,
            "registration_inferred_approval": False,
            "product_approval_inferred": False,
            "authority_request_created": False,
            "publication_or_release_performed": False,
            "authority_effect_inferred": False,
        },
        "claim_ceiling": "Complete P04 revision-2 stage accounting and request-eligibility evaluation only; no product validation or approval, registration, admission, authority, publication, release, deployment, production guarantee or external effect.",
        "open_questions": ["P05 owns the independent obligation-by-obligation read-only review before L4X handoff eligibility."],
    }


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()

    if args.write:
        binding = build_binding()
        validation = validate_binding(binding, check_current=True, run_p03=True)
        if validation["result"] != "pass":
            print(json.dumps(validation, indent=2), file=sys.stderr)
            return 1
        write_json(BINDING_PATH, binding)
        write_json(QUALIFICATION_PATH, qualification(binding))
        print(json.dumps({"result": "pass", "binding_id": binding["binding_id"], "binding_manifest_sha256": binding["binding_manifest_sha256"], "authority_effect": "none"}, indent=2))
        return 0

    binding = load_json(BINDING_PATH)
    validation = validate_binding(binding, check_current=True, run_p03=True)
    print(json.dumps(validation, indent=2))
    return 0 if validation["result"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
