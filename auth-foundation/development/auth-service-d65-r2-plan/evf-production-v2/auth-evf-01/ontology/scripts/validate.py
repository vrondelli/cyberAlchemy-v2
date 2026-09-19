#!/usr/bin/env python3
"""Deterministic, read-only validator for the AUTH-EVF-01 prototype package."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import jsonschema


SCRIPT = Path(__file__).resolve()
ONTOLOGY = SCRIPT.parents[1]
NODE_ROOT = ONTOLOGY.parent


def find_repo_root(path: Path) -> Path:
    for candidate in [path, *path.parents]:
        if (candidate / ".git").exists():
            return candidate
    raise RuntimeError("repository root not found")


REPO = find_repo_root(SCRIPT)


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def file_record(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(REPO).as_posix(),
        "sha256": sha256_bytes(data),
        "size_bytes": len(data),
    }


def resolve_ref(ref: dict[str, Any]) -> Path:
    raw = Path(ref["path"])
    return raw if ref.get("location") == "host" else REPO / raw


def ref_error(ref: dict[str, Any]) -> str | None:
    path = resolve_ref(ref)
    if not ref.get("current", False):
        return "current flag is not true"
    if not path.is_file():
        return f"missing {path}"
    data = path.read_bytes()
    if len(data) != ref.get("size_bytes"):
        return f"size mismatch for {path}"
    if sha256_bytes(data) != ref.get("sha256"):
        return f"sha256 mismatch for {path}"
    return None


def refs_in(value: Any) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    if isinstance(value, dict):
        if {"path", "sha256", "size_bytes", "location", "current"}.issubset(value):
            found.append(value)
        for child in value.values():
            found.extend(refs_in(child))
    elif isinstance(value, list):
        for child in value:
            found.extend(refs_in(child))
    return found


def authority_errors(value: Any, pointer: str = "$") -> list[str]:
    errors: list[str] = []
    if isinstance(value, dict):
        if "authority_effect" in value and value["authority_effect"] != "none":
            errors.append(f"{pointer}.authority_effect is not none")
        for key, child in value.items():
            errors.extend(authority_errors(child, f"{pointer}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            errors.extend(authority_errors(child, f"{pointer}[{index}]"))
    return errors


def validate_denominator(value: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    obligations = value.get("obligations", [])
    ids = [item.get("id") for item in obligations]
    executable = [item for item in obligations if item.get("partition") == "executable"]
    theorem = [item for item in obligations if item.get("partition") == "theorem"]
    if len(obligations) != 25 or len(ids) != len(set(ids)):
        errors.append("DENOMINATOR_CARDINALITY_INVALID")
    if value.get("campaign_denominator") != len(obligations):
        errors.append("DENOMINATOR_PARTITION_MISMATCH")
    if value.get("partitions") != {"executable": len(executable), "theorem": len(theorem)}:
        errors.append("DENOMINATOR_PARTITION_MISMATCH")
    if len(executable) != 24 or len(theorem) != 1:
        errors.append("DENOMINATOR_PARTITION_MISMATCH")
    expected = [f"AUTH-EVF-OBL-{index:02d}" for index in range(1, 26)]
    if ids != expected:
        errors.append("DENOMINATOR_ID_SEQUENCE_INVALID")
    return sorted(set(errors))


def validate_derivation(value: dict[str, Any], obligation_ids: set[str], node_ids: set[str]) -> list[str]:
    errors: list[str] = []
    forbidden = set(value.get("forbidden_proof_shortcuts", []))
    derivations = value.get("derivations", [])
    ids = [item.get("obligation_id") for item in derivations]
    if len(ids) != len(set(ids)) or set(ids) != obligation_ids:
        errors.append("DERIVATION_DENOMINATOR_COVERAGE_INVALID")
    for item in derivations:
        if item.get("derivation_kind") in forbidden:
            errors.append("FORBIDDEN_DERIVATION_SHORTCUT")
        if any(step in forbidden for step in item.get("ordered_steps", [])):
            errors.append("FORBIDDEN_DERIVATION_SHORTCUT")
        if len(item.get("ordered_steps", [])) < 3:
            errors.append("DERIVATION_ORDER_INCOMPLETE")
        if not set(item.get("source_node_ids", [])).issubset(node_ids):
            errors.append("DERIVATION_SOURCE_NODE_UNKNOWN")
        if not item.get("target_selector"):
            errors.append("DERIVATION_TARGET_MISSING")
    return sorted(set(errors))


def validate_lineage(value: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if value.get("proof_model") != "ordered-typed-path":
        errors.append("LINEAGE_NOT_ORDERED")
    vertices = value.get("vertices", [])
    edges = value.get("edges", [])
    if [item.get("ordinal") for item in vertices] != list(range(len(vertices))):
        errors.append("LINEAGE_VERTEX_ORDER_INVALID")
    if len(edges) != max(0, len(vertices) - 1):
        errors.append("LINEAGE_EDGE_COUNT_INVALID")
    for index, edge in enumerate(edges):
        if index + 1 >= len(vertices) or edge.get("from") != vertices[index].get("id") or edge.get("to") != vertices[index + 1].get("id"):
            errors.append("LINEAGE_EDGE_ORDER_INVALID")
    if [item.get("state") for item in vertices[-2:]] != ["not_evaluable", "not_evaluable"]:
        errors.append("SUCCESSOR_LINEAGE_STATE_INVALID")
    return sorted(set(errors))


def validate_profile_structure(value: dict[str, Any], executable_ids: list[str]) -> list[str]:
    errors: list[str] = []
    if [item.get("stage_id") for item in value.get("stages", [])] != [f"S{index}" for index in range(13)]:
        errors.append("PROFILE_STAGE_SEQUENCE_INVALID")
    if value.get("obligation_ids") != executable_ids or value.get("obligation_denominator") != len(executable_ids):
        errors.append("PROFILE_DENOMINATOR_INVALID")
    checks = value.get("checks", [])
    if len(checks) != 1 or checks[0].get("provider_id") != "cargo-raw-auth-service-provisional":
        errors.append("PROFILE_PROVIDER_SELECTION_INVALID")
    if len(value.get("mutations", [])) != 6:
        errors.append("PROFILE_MUTATION_DENOMINATOR_INVALID")
    if "Structural Auth executable profile only" not in value.get("claim_ceiling", ""):
        errors.append("PROFILE_CLAIM_CEILING_INVALID")
    return sorted(set(errors))


def validate_routes(value: dict[str, Any], executable_ids: list[str], theorem_ids: list[str], check_refs: bool = True) -> list[str]:
    errors: list[str] = []
    routes = {item.get("route"): item for item in value.get("routes", [])}
    executable = routes.get("executable", {})
    theorem = routes.get("theorem", {})
    if executable.get("obligation_ids") != executable_ids or executable.get("state") != "selected-structural-nonpass" or executable.get("blocker_code") != "CARGO_STDOUT_NOT_EVF_PROVIDER_JSON":
        errors.append("EXECUTABLE_ROUTE_BOUNDARY_INVALID")
    if theorem.get("obligation_ids") != theorem_ids or theorem.get("state") != "not_evaluable" or theorem.get("blocker_code") != "AUTH_SPECIFIC_THEOREM_INPUT_ABSENT":
        errors.append("THEOREM_ROUTE_BOUNDARY_INVALID")
    forbidden = set(theorem.get("forbidden_evidence_paths", []))
    required_forbidden = {
        "projects/domainspec-v2/formalization/lean/DomainSpec/EVFProductionMetaTypeReference.lean",
        "projects/domainspec-v2/development/evolvable-validation-framework/production/fixtures/meta-type-foundation",
    }
    if not required_forbidden.issubset(forbidden):
        errors.append("NON_AUTH_THEOREM_REUSE_FORBIDDEN")
    if theorem.get("input_ref") in forbidden:
        errors.append("NON_AUTH_THEOREM_REUSE_FORBIDDEN")
    if check_refs:
        for ref in refs_in(value):
            if ref_error(ref):
                errors.append("EXACT_REF_MISMATCH")
    return sorted(set(errors))


def run_negative_fixtures(
    fixtures: list[dict[str, Any]],
    denominator: dict[str, Any],
    derivation: dict[str, Any],
    lineage: dict[str, Any],
    routes: dict[str, Any],
    profile: dict[str, Any],
    obligation_ids: set[str],
    node_ids: set[str],
    executable_ids: list[str],
    theorem_ids: list[str],
) -> tuple[list[dict[str, str]], list[str]]:
    results: list[dict[str, str]] = []
    errors: list[str] = []
    for fixture in fixtures:
        mutation = fixture["mutation"]
        observed: list[str]
        if mutation == "remove-stage":
            candidate = copy.deepcopy(profile)
            candidate["stages"] = [item for item in candidate["stages"] if item["stage_id"] != fixture["target"]]
            observed = validate_profile_structure(candidate, executable_ids)
        elif mutation == "increment-denominator":
            candidate = copy.deepcopy(denominator)
            candidate["campaign_denominator"] += 1
            observed = validate_denominator(candidate)
        elif mutation == "replace-derivation-kind":
            candidate = copy.deepcopy(derivation)
            next(item for item in candidate["derivations"] if item["obligation_id"] == fixture["target"])["derivation_kind"] = fixture["value"]
            observed = validate_derivation(candidate, obligation_ids, node_ids)
        elif mutation == "replace-proof-model":
            candidate = copy.deepcopy(lineage)
            candidate["proof_model"] = fixture["value"]
            observed = validate_lineage(candidate)
        elif mutation == "set-theorem-input":
            candidate = copy.deepcopy(routes)
            next(item for item in candidate["routes"] if item["route"] == "theorem")["input_ref"] = fixture["value"]
            observed = validate_routes(candidate, executable_ids, theorem_ids, check_refs=False)
        elif mutation == "replace-route-sha256":
            candidate = copy.deepcopy(routes)
            candidate["selected_runtime_refs"][fixture["target"]]["sha256"] = fixture["value"]
            observed = validate_routes(candidate, executable_ids, theorem_ids, check_refs=True)
        else:
            observed = ["UNKNOWN_NEGATIVE_FIXTURE"]
        expected = fixture["expected_rejection_code"]
        status = "PASS" if expected in observed else "FAIL"
        results.append({"fixture_id": fixture["fixture_id"], "expected_rejection_code": expected, "status": status})
        if status != "PASS":
            errors.append(f"NEGATIVE_FIXTURE_FAILED:{fixture['fixture_id']}:{observed}")
    return results, errors


def material_files() -> list[Path]:
    files: list[Path] = []
    for path in NODE_ROOT.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(NODE_ROOT)
        if "receipts" in relative.parts:
            continue
        if "__pycache__" in relative.parts or path.suffix == ".pyc":
            continue
        files.append(path)
    return sorted(files, key=lambda item: item.relative_to(REPO).as_posix())


def validate() -> tuple[dict[str, Any], list[str]]:
    errors: list[str] = []
    profile = load(NODE_ROOT / "AUTH-EVF-EXECUTABLE-PROFILE.v1-candidate.json")
    denominator = load(NODE_ROOT / "AUTH-EVF-OBLIGATION-DENOMINATOR.v1-candidate.json")
    derivation = load(NODE_ROOT / "AUTH-EVF-DERIVATION-CONTRACT.v1-candidate.json")
    lineage = load(NODE_ROOT / "AUTH-EVF-LINEAGE-CONTRACT.v1-candidate.json")
    routes = load(NODE_ROOT / "AUTH-EVF-ROUTE-SELECTIONS.v1-candidate.json")
    package_profile = load(ONTOLOGY / "profile.json")
    sources_doc = load(ONTOLOGY / "sources.json")
    residue = load(ONTOLOGY / "residue.json")
    business_nodes_doc = load(ONTOLOGY / "nodes/business.json")
    system_nodes_doc = load(ONTOLOGY / "nodes/system.json")
    relation_docs = {
        branch: load(ONTOLOGY / f"relations/{branch}.json")
        for branch in ("business", "system", "bridge")
    }
    view_docs = {
        branch: load(ONTOLOGY / f"views/{branch}.json")
        for branch in ("business", "system", "bridge")
    }
    branch_schema = load(ONTOLOGY / "schemas/auth-evf-ontology.schema.json")
    generic_schema = load(REPO / "projects/domainspec-v2/development/evolvable-validation-framework/contracts/evf-enforcement-profile.v1.schema.json")

    if package_profile.get("ontology_type") != "business-system-bridge" or package_profile.get("visibility") != "private" or package_profile.get("branches") != ["business", "system", "bridge"]:
        errors.append("ONTOLOGY_PROFILE_INVALID")
    if package_profile.get("public_export") != "forbidden":
        errors.append("PRIVATE_PUBLIC_BOUNDARY_INVALID")

    try:
        jsonschema.Draft202012Validator(generic_schema).validate(profile)
    except jsonschema.ValidationError as exc:
        errors.append(f"GENERIC_PROFILE_SCHEMA_INVALID:{exc.json_path}:{exc.message}")
    for document in [business_nodes_doc, system_nodes_doc, *relation_docs.values()]:
        try:
            jsonschema.Draft202012Validator(branch_schema).validate(document)
        except jsonschema.ValidationError as exc:
            errors.append(f"ONTOLOGY_BRANCH_SCHEMA_INVALID:{exc.json_path}:{exc.message}")

    sources = sources_doc.get("sources", [])
    source_ids = [item.get("source_id") for item in sources]
    source_by_id = {item.get("source_id"): item for item in sources}
    if len(source_ids) != len(set(source_ids)):
        errors.append("SOURCE_ID_DUPLICATE")
    for source in sources:
        if ref_error(source):
            errors.append(f"SOURCE_EXACT_REF_MISMATCH:{source.get('source_id')}")

    nodes = business_nodes_doc.get("nodes", []) + system_nodes_doc.get("nodes", [])
    node_ids = [item.get("id") for item in nodes]
    node_set = set(node_ids)
    if len(node_ids) != len(node_set):
        errors.append("NODE_ID_DUPLICATE")
    for node in nodes:
        if not set(node.get("source_ids", [])).issubset(source_by_id):
            errors.append(f"NODE_SOURCE_UNKNOWN:{node.get('id')}")

    relation_ids: set[str] = set()
    relations_by_branch: dict[str, list[dict[str, Any]]] = {}
    for branch, document in relation_docs.items():
        relations = document.get("relations", [])
        relations_by_branch[branch] = relations
        for relation in relations:
            relation_id = relation.get("id")
            if relation_id in relation_ids:
                errors.append(f"RELATION_ID_DUPLICATE:{relation_id}")
            relation_ids.add(relation_id)
            if relation.get("from") not in node_set or relation.get("to") not in node_set:
                errors.append(f"RELATION_ENDPOINT_UNKNOWN:{relation_id}")
            if not set(relation.get("source_ids", [])).issubset(source_by_id):
                errors.append(f"RELATION_SOURCE_UNKNOWN:{relation_id}")
            if branch == "business" and not (relation.get("from", "").startswith("B.") and relation.get("to", "").startswith("B.")):
                errors.append(f"BUSINESS_RELATION_POLARITY_INVALID:{relation_id}")
            if branch == "system" and not (relation.get("from", "").startswith("S.") and relation.get("to", "").startswith("S.")):
                errors.append(f"SYSTEM_RELATION_POLARITY_INVALID:{relation_id}")
            if branch == "bridge":
                endpoints = {relation.get("from", "")[:2], relation.get("to", "")[:2]}
                kinds = {source_by_id[source_id].get("source_kind") for source_id in relation.get("source_ids", [])}
                if endpoints != {"B.", "S."} or "business" not in kinds or not ({"system", "contract"} & kinds):
                    errors.append(f"BRIDGE_DUAL_EVIDENCE_INVALID:{relation_id}")

    for branch, view in view_docs.items():
        if len(view.get("node_ids", [])) != len(set(view.get("node_ids", []))) or not set(view.get("node_ids", [])).issubset(node_set):
            errors.append(f"VIEW_NODE_CLOSURE_INVALID:{branch}")
        branch_relation_ids = {item["id"] for item in relations_by_branch[branch]}
        if set(view.get("relation_ids", [])) != branch_relation_ids:
            errors.append(f"VIEW_RELATION_CLOSURE_INVALID:{branch}")
    expected_business = {item["id"] for item in business_nodes_doc["nodes"]}
    expected_system = {item["id"] for item in system_nodes_doc["nodes"]}
    if set(view_docs["business"]["node_ids"]) != expected_business:
        errors.append("BUSINESS_VIEW_NOT_TOTAL")
    if set(view_docs["system"]["node_ids"]) != expected_system:
        errors.append("SYSTEM_VIEW_NOT_TOTAL")

    for item in residue.get("residue", []):
        if not set(item.get("affected_node_ids", [])).issubset(node_set):
            errors.append(f"RESIDUE_NODE_UNKNOWN:{item.get('residue_id')}")
        if item.get("state") != "open" or item.get("owner_node") not in {"AUTH-EVF-02", "AUTH-EVF-03", "AUTH-EVF-04"}:
            errors.append(f"RESIDUE_OWNER_INVALID:{item.get('residue_id')}")

    errors.extend(validate_denominator(denominator))
    obligation_ids = {item["id"] for item in denominator["obligations"]}
    executable_ids = [item["id"] for item in denominator["obligations"] if item["partition"] == "executable"]
    theorem_ids = [item["id"] for item in denominator["obligations"] if item["partition"] == "theorem"]
    errors.extend(validate_derivation(derivation, obligation_ids, node_set))
    errors.extend(validate_lineage(lineage))
    errors.extend(validate_routes(routes, executable_ids, theorem_ids, check_refs=True))
    errors.extend(validate_profile_structure(profile, executable_ids))
    for ref in refs_in(profile):
        if ref_error(ref):
            errors.append("PROFILE_EXACT_REF_MISMATCH")

    documents = [profile, denominator, derivation, lineage, routes, package_profile, sources_doc, residue, business_nodes_doc, system_nodes_doc, *relation_docs.values(), *view_docs.values()]
    for document in documents:
        errors.extend(f"AUTHORITY_EFFECT_INVALID:{item}" for item in authority_errors(document))

    fixture_paths = sorted((NODE_ROOT / "validation-fixtures").glob("*.json"))
    fixtures = [load(path) for path in fixture_paths]
    fixture_results, fixture_errors = run_negative_fixtures(fixtures, denominator, derivation, lineage, routes, profile, obligation_ids, node_set, executable_ids, theorem_ids)
    errors.extend(fixture_errors)

    manifest = [file_record(path) for path in material_files()]
    manifest_digest = sha256_bytes(canonical(manifest))
    result = {
        "schema_version": "auth-evf.validation-result/v1-candidate",
        "node_id": "AUTH-EVF-01",
        "epoch_id": "AUTH-EVF-EPOCH-002",
        "result": "PASS" if not errors else "FAIL",
        "material_file_count": len(manifest),
        "material_manifest_sha256": manifest_digest,
        "material_files": manifest,
        "obligation_denominator": 25,
        "executable_obligation_denominator": 24,
        "theorem_obligation_denominator": 1,
        "stage_count": len(profile.get("stages", [])),
        "negative_fixture_results": fixture_results,
        "route_states": {
            "executable": "selected-structural-nonpass",
            "theorem": "not_evaluable"
        },
        "claim_ceiling": "AUTH-EVF-01 structural contracts and ontology package validate. No executable Auth EVF observation, theorem evidence, conformance, product approval, enforcement, or operational authority is proved.",
        "implementation_effect": "none",
        "authority_effect": "none"
    }
    return result, sorted(set(errors))


def receipt_for(result: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "schema_version": "auth-evf.validation-receipt/v1-candidate",
        "receipt_id": "AUTH-EVF-01-VALIDATION-RECEIPT-002",
        **result,
    }
    digest = sha256_bytes(canonical(payload))
    return {**payload, "receipt_payload_digest": digest}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", action="store_true", help="print deterministic content-bound receipt JSON")
    parser.add_argument("--verify-receipt", action="store_true", help="verify the content-addressed committed receipt")
    args = parser.parse_args()

    result, errors = validate()
    if errors:
        print(json.dumps({**result, "errors": errors}, indent=2, sort_keys=True))
        return 1
    receipt = receipt_for(result)
    if args.verify_receipt:
        digest = receipt["receipt_payload_digest"]
        path = ONTOLOGY / "receipts" / "sha256" / digest / "VALIDATION-RECEIPT.json"
        if not path.is_file():
            print(json.dumps({"result": "FAIL", "error": "RECEIPT_MISSING", "expected_path": path.relative_to(REPO).as_posix()}, indent=2, sort_keys=True))
            return 1
        committed = load(path)
        committed_digest = committed.get("receipt_payload_digest")
        committed_payload = {key: value for key, value in committed.items() if key != "receipt_payload_digest"}
        if committed_digest != sha256_bytes(canonical(committed_payload)) or committed != receipt or path.parent.name != committed_digest:
            print(json.dumps({"result": "FAIL", "error": "RECEIPT_CONTENT_OR_PATH_MISMATCH"}, indent=2, sort_keys=True))
            return 1
        print(json.dumps({"result": "PASS", "node_id": "AUTH-EVF-01", "receipt_payload_digest": digest, "receipt_path": path.relative_to(REPO).as_posix()}, indent=2, sort_keys=True))
        return 0
    if args.receipt:
        print(json.dumps(receipt, indent=2, sort_keys=True))
    else:
        print(json.dumps({key: value for key, value in result.items() if key != "material_files"}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
