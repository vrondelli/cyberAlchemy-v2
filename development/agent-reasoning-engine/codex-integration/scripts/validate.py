#!/usr/bin/env python3
"""Deterministically validate the Codex Request Governance candidate package."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE = Path(__file__).resolve().parents[1]
REPOSITORY = Path(__file__).resolve().parents[5]
RECEIPT = PACKAGE / "receipts" / "2026-09-01-implementation-binding-002-post-acceptance-validation.json"
GENERATED = PACKAGE / "domainspec" / "generated"
FILES = {
    "profile": "profile.json",
    "sources": "sources.json",
    "product": "product-capability.json",
    "contracts": "contracts.json",
    "ontology": "business-ontology.json",
    "bridge": "bridge.json",
    "policies": "policies.json",
    "obligations": "obligations.json",
    "realizations": "realizations.json",
    "residue": "residue.json",
    "observation": "evidence/codex-app-server-protocol-observation.v1.json",
    "interface": "interfaces/codex-app-server-wrapper.contract.json",
    "selection": "decisions/codex-app-server-boundary-selection.v1.json",
    "continuation_selection": "decisions/continuation-source-model-selection.v1.json",
    "implementation": "implementation-binding.v2.json",
    "assessment": "assessments/ARE-CODEX-CONFORMANCE-ASSESSMENT-002.json",
    "acceptance": "decisions/implementation-binding-002-acceptance.v1.json",
}
SCHEMA_DEFS = {
    "profile": "profile",
    "sources": "sourceRegistry",
    "contracts": "contractRegistry",
    "ontology": "businessOntology",
    "bridge": "bridgeOntology",
    "policies": "policyRegistry",
    "obligations": "obligationRegistry",
    "realizations": "realizationRegistry",
    "residue": "residueRegistry",
    "observation": "protocolObservation",
    "interface": "hostInterface",
    "selection": "hostBoundarySelection",
    "continuation_selection": "continuationSourceSelection",
    "implementation": "implementationBindingV2",
    "assessment": "conformanceAssessmentV2",
    "acceptance": "implementationAcceptanceDecisionV1",
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def material_digest() -> str:
    digest = hashlib.sha256()
    paths = sorted(path for path in PACKAGE.rglob("*") if path.is_file() and "receipts" not in path.parts and "__pycache__" not in path.parts and path.suffix != ".pyc")
    for path in paths:
        relative = path.relative_to(PACKAGE).as_posix()
        payload = path.read_bytes()
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(hashlib.sha256(payload).digest())
        digest.update(b"\0")
    return digest.hexdigest()


def verify_materialized_build(errors: list[str]) -> None:
    command = [
        str(REPOSITORY / "toolchains/node-typescript/bin/node-env"),
        "run", "--project", "projects/domainspec-v2/impl", "--", "node", "--import", "tsx",
        "../../../cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/scripts/build.ts", "--emit-json",
    ]
    first = subprocess.run(command, cwd=REPOSITORY, capture_output=True, text=True, check=False)
    second = subprocess.run(command, cwd=REPOSITORY, capture_output=True, text=True, check=False)
    if first.returncode != 0 or second.returncode != 0:
        diagnostics = (first.stderr or second.stderr).strip().splitlines()
        causal = next((line.strip() for line in diagnostics if "Error:" in line or "SOURCE_BINDING_DRIFT:" in line), None)
        errors.append(f"DomainSpec build replay failed: {causal or (diagnostics[-1] if diagnostics else 'unknown error')}")
        return
    if first.stdout != second.stdout:
        errors.append("DomainSpec build replay is non-deterministic")
        return
    try:
        artifacts = json.loads(first.stdout)
    except json.JSONDecodeError as exc:
        errors.append(f"DomainSpec build replay did not return JSON: {exc}")
        return
    for name, content in artifacts.items():
        path = GENERATED / name
        if not path.is_file() or path.read_text(encoding="utf-8") != content:
            errors.append(f"materialized DomainSpec artifact is stale: {name}")


def recursive_source_refs(value: Any) -> set[str]:
    refs: set[str] = set()
    if isinstance(value, dict):
        for key, nested in value.items():
            if key in {"source_refs", "evidence_refs", "status_basis_refs"} and isinstance(nested, list):
                refs.update(item for item in nested if isinstance(item, str) and item.startswith("CAP-SEL-"))
            refs.update(recursive_source_refs(nested))
    elif isinstance(value, list):
        for nested in value:
            refs.update(recursive_source_refs(nested))
    return refs


def recursive_authority_errors(value: Any, path: str = "$") -> list[str]:
    errors: list[str] = []
    if isinstance(value, dict):
        for key, nested in value.items():
            child = f"{path}.{key}"
            if key == "authority_effect" and nested != "none":
                errors.append(f"{child}: authority_effect must be none")
            errors.extend(recursive_authority_errors(nested, child))
    elif isinstance(value, list):
        for index, nested in enumerate(value):
            errors.extend(recursive_authority_errors(nested, f"{path}[{index}]"))
    return errors


def jsonschema_errors(instance: Any, schema: dict[str, Any]) -> list[str]:
    validator = Draft202012Validator(schema, format_checker=Draft202012Validator.FORMAT_CHECKER)
    return [f"schema {'.'.join(map(str, error.absolute_path)) or '$'}: {error.message}" for error in sorted(validator.iter_errors(instance), key=lambda item: list(item.absolute_path))]


def validate_documents(documents: dict[str, Any], check_sources: bool = True) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    checks: list[str] = []
    local_schema = load_json(PACKAGE / "schemas" / "codex-request-governance.schema.json")
    Draft202012Validator.check_schema(local_schema)
    checks.append("local JSON Schema is Draft 2020-12 valid")

    for name, definition in SCHEMA_DEFS.items():
        wrapper = {"$schema": local_schema["$schema"], "$defs": local_schema["$defs"], "$ref": f"#/$defs/{definition}"}
        errors.extend(f"{name}: {message}" for message in jsonschema_errors(documents[name], wrapper))

    shared_schema = load_json(REPOSITORY / "cyberAlchemy-v2" / "capability" / "schemas" / "capability.schema.json")
    shared_wrapper = {"$schema": shared_schema["$schema"], "$defs": shared_schema["$defs"], "$ref": "#/$defs/productCapability"}
    errors.extend(f"product: {message}" for message in jsonschema_errors(documents["product"], shared_wrapper))
    if not errors:
        checks.append("all package records and the shared CAV2-D67 Product Capability instance validate")

    sources = documents["sources"]["sources"]
    source_ids = [item["source_id"] for item in sources]
    selections = documents["sources"]["selections"]
    selection_ids = [item["selection_id"] for item in selections]
    if len(source_ids) != len(set(source_ids)):
        errors.append("source IDs are not unique")
    if len(selection_ids) != len(set(selection_ids)):
        errors.append("selection IDs are not unique")
    if set(item["source_id"] for item in selections) != set(source_ids):
        errors.append("source selections must map one-to-one onto the exact source registry")
    if check_sources:
        for source in sources:
            path = REPOSITORY / source["path"]
            if not path.is_file():
                errors.append(f"source missing: {source['path']}")
                continue
            observed = sha256_bytes(path.read_bytes())
            if observed != source["sha256"]:
                errors.append(f"source digest drift: {source['source_id']} expected {source['sha256']} observed {observed}")
    if not any(message.startswith("source ") for message in errors):
        checks.append("all selected sources exist and match their pinned whole-file SHA-256")

    used_refs: set[str] = set()
    for name, document in documents.items():
        if name != "sources":
            used_refs.update(recursive_source_refs(document))
        if name == "acceptance":
            if document.get("authority_effect") != "accept-exact-implementation-binding":
                errors.append("acceptance decision has an invalid authority effect")
        else:
            errors.extend(f"{name}: {message}" for message in recursive_authority_errors(document))
    unknown_refs = used_refs - set(selection_ids)
    unused_refs = set(selection_ids) - used_refs
    if unknown_refs:
        errors.append(f"unknown source selections: {sorted(unknown_refs)}")
    if unused_refs:
        errors.append(f"unreferenced source selections: {sorted(unused_refs)}")
    if not unknown_refs and not unused_refs:
        checks.append("source selection closure is exact")

    ontology = documents["ontology"]
    nodes = ontology["nodes"]
    node_ids = [item["id"] for item in nodes]
    if len(node_ids) != len(set(node_ids)):
        errors.append("ontology node IDs are not unique")
    node_kinds = {item["id"]: item["kind"] for item in nodes}
    relation_types = {item["type"]: item for item in ontology["relation_vocabulary"]}
    relation_ids = [item["id"] for item in ontology["relations"]]
    if len(relation_ids) != len(set(relation_ids)):
        errors.append("ontology relation IDs are not unique")
    for relation in ontology["relations"]:
        vocabulary = relation_types.get(relation["type"])
        if vocabulary is None:
            errors.append(f"relation {relation['id']} uses an undeclared type")
            continue
        if relation["source"] not in node_kinds:
            errors.append(f"relation {relation['id']} has unknown source {relation['source']}")
        elif node_kinds[relation["source"]] not in vocabulary["source_kinds"]:
            errors.append(f"relation {relation['id']} source kind violates its type")
        if relation["external_target"]:
            if relation["target"] != documents["profile"]["parent_capability_id"]:
                errors.append(f"relation {relation['id']} has an undeclared external target")
        elif relation["target"] not in node_kinds:
            errors.append(f"relation {relation['id']} has unknown target {relation['target']}")
        elif node_kinds[relation["target"]] not in vocabulary["target_kinds"]:
            errors.append(f"relation {relation['id']} target kind violates its type")
    if not any(message.startswith("relation ") or message.startswith("ontology ") for message in errors):
        checks.append("business ontology nodes, relation vocabulary, endpoints, and external parent edge are closed")

    product = documents["product"]
    contract_ids = {item["contract_id"] for item in documents["contracts"]["contracts"]}
    policy_ids = {item["policy_id"] for item in documents["policies"]["policies"]}
    binding_ids = {item["binding_id"] for item in documents["realizations"]["bindings"]}
    residue_ids = {item["id"] for item in documents["residue"]["residue"]}
    expected_contracts = set(product["input_contract_refs"] + product["output_contract_refs"])
    if expected_contracts != contract_ids:
        errors.append("Product Capability contract references do not close over contracts.json")
    if set(product["context_policy_refs"]) != policy_ids:
        errors.append("Product Capability policy references do not close over policies.json")
    if set(product["realization_binding_refs"]) != binding_ids:
        errors.append("Product Capability realization references do not close over realizations.json")
    if set(product["lifecycle_posture"]["residue_refs"]) != residue_ids:
        errors.append("Product Capability residue references do not close over residue.json")
    if product["obligation_registry_ref"] != documents["obligations"]["registry_id"]:
        errors.append("Product Capability obligation reference does not resolve")
    for obligation in documents["obligations"]["obligations"]:
        unknown = set(obligation["contract_refs"]) - contract_ids - policy_ids
        if unknown:
            errors.append(f"obligation {obligation['obligation_id']} has unknown contract or policy refs: {sorted(unknown)}")
    if not any("Product Capability" in message or message.startswith("obligation ") for message in errors):
        checks.append("capability contracts, policies, realizations, obligations, and residue have closed references")

    selection = documents["selection"]
    observation_path = PACKAGE / selection["protocol_observation_ref"]
    interface_path = PACKAGE / selection["candidate_interface_ref"]
    if sha256_bytes(observation_path.read_bytes()) != selection["protocol_observation_sha256"]:
        errors.append("host-boundary selection protocol observation digest drift")
    if sha256_bytes(interface_path.read_bytes()) != selection["candidate_interface_sha256"]:
        errors.append("host-boundary selection candidate interface digest drift")
    if documents["interface"]["boundary_kind"] != selection["selected_boundary_kind"]:
        errors.append("selected boundary kind does not match the candidate interface")
    if documents["profile"]["host_adapter_state"] != "app-server-wrapper-implemented-accepted-not-installed":
        errors.append("profile does not preserve implemented-accepted-not-installed host posture")
    if not any("host-boundary selection" in message or "selected boundary" in message or "host posture" in message for message in errors):
        checks.append("owner-selected app-server boundary closes over exact protocol evidence and candidate interface bytes")

    implementation = documents["implementation"]
    if documents["profile"].get("implementation_binding") != "implementation-binding.v2.json":
        errors.append("profile implementation binding does not resolve")
    if documents["profile"].get("conformance_assessment") != "assessments/ARE-CODEX-CONFORMANCE-ASSESSMENT-002.json":
        errors.append("profile conformance assessment does not resolve")
    if documents["profile"].get("implementation_acceptance_decision") != "decisions/implementation-binding-002-acceptance.v1.json":
        errors.append("profile implementation acceptance decision does not resolve")
    if implementation["interface_sha256"] != sha256_bytes(interface_path.read_bytes()):
        errors.append("implementation binding interface digest drift")
    if implementation["protocol_observation_sha256"] != sha256_bytes(observation_path.read_bytes()):
        errors.append("implementation binding protocol observation digest drift")
    component_ids = [item["component_id"] for item in implementation["components"]]
    if len(component_ids) != len(set(component_ids)):
        errors.append("implementation component IDs are not unique")
    for component in implementation["components"]:
        path = REPOSITORY / component["path"]
        if not path.is_file():
            errors.append(f"implementation component missing: {component['path']}")
        elif sha256_bytes(path.read_bytes()) != component["sha256"]:
            errors.append(f"implementation component digest drift: {component['component_id']}")
    evidence_ids = [item["evidence_id"] for item in implementation["evidence"]]
    if len(evidence_ids) != len(set(evidence_ids)):
        errors.append("implementation evidence IDs are not unique")
    for evidence in implementation["evidence"]:
        path = REPOSITORY / evidence["path"]
        if not path.is_file():
            errors.append(f"implementation evidence missing: {evidence['path']}")
        elif sha256_bytes(path.read_bytes()) != evidence["sha256"]:
            errors.append(f"implementation evidence digest drift: {evidence['evidence_id']}")
    closure_binding = implementation["runtime_closure"]
    closure_path = PACKAGE / closure_binding["ref"]
    if not closure_path.is_file():
        errors.append("implementation runtime closure is missing")
    else:
        closure = load_json(closure_path)
        if sha256_bytes(closure_path.read_bytes()) != closure_binding["sha256"]:
            errors.append("implementation runtime closure file digest drift")
        if closure.get("closure_digest") != closure_binding["closure_digest"]:
            errors.append("implementation runtime closure identity drift")
        entries = closure.get("entries", [])
        if len(entries) != closure_binding["entry_count"]:
            errors.append("implementation runtime closure entry count drift")
        for entry in entries:
            path = REPOSITORY / entry["path"]
            if not path.is_file():
                errors.append(f"runtime closure entry missing: {entry['path']}")
            else:
                payload = path.read_bytes()
                if len(payload) != entry["size"] or sha256_bytes(payload) != entry["sha256"]:
                    errors.append(f"runtime closure entry drift: {entry['path']}")
    assessment = documents["assessment"]
    binding_path = PACKAGE / "implementation-binding.v2.json"
    if assessment["binding_sha256"] != sha256_bytes(binding_path.read_bytes()):
        errors.append("conformance assessment binding digest drift")
    if assessment["interface_sha256"] != sha256_bytes(interface_path.read_bytes()):
        errors.append("conformance assessment interface digest drift")
    interface_checks = assessment["interface_checks"]
    obligation_checks = assessment["capability_obligation_checks"]
    if len({item["check_id"] for item in interface_checks}) != 30 or any(item["status"] != "pass" for item in interface_checks):
        errors.append("conformance assessment interface matrix is not an exact 30-check pass set")
    expected_obligations = {item["obligation_id"] for item in documents["obligations"]["obligations"]}
    if {item["check_id"] for item in obligation_checks} != expected_obligations or any(item["status"] != "pass" for item in obligation_checks):
        errors.append("conformance assessment obligation matrix does not close over the registry")
    expected_counts = {"interface_total": 30, "interface_pass": 30, "capability_total": 12, "capability_pass": 12, "fail": 0, "not_evaluable": 0}
    if assessment["counts"] != expected_counts:
        errors.append("conformance assessment counts do not match the checked matrices")
    acceptance = documents["acceptance"]
    acceptance_refs = {
        "binding": (acceptance["binding_ref"], acceptance["binding_sha256"]),
        "assessment": (acceptance["assessment_ref"], acceptance["assessment_sha256"]),
        "validation receipt": (acceptance["validation_receipt_ref"], acceptance["validation_receipt_sha256"]),
        "admissibility request": (acceptance["admissibility_request_ref"], acceptance["admissibility_request_sha256"]),
        "admissibility receipt": (acceptance["admissibility_receipt_ref"], acceptance["admissibility_receipt_sha256"]),
        "human record": (acceptance["human_record_ref"], acceptance["human_record_sha256"]),
    }
    for label, (relative, expected_sha) in acceptance_refs.items():
        path = PACKAGE / relative
        if not path.is_file():
            errors.append(f"acceptance {label} is missing")
        elif sha256_bytes(path.read_bytes()) != expected_sha:
            errors.append(f"acceptance {label} digest drift")
    admissibility = load_json(PACKAGE / acceptance["admissibility_receipt_ref"])
    if acceptance["selected_option"] not in admissibility.get("presentedOptionIds", []) or admissibility.get("routeOutcome") != "gate":
        errors.append("acceptance selection does not resolve through the admitted option gate")
    if assessment["binding_sha256"] != acceptance["binding_sha256"]:
        errors.append("acceptance decision and conformance assessment bind different implementation bytes")
    host_binding = next((item for item in documents["realizations"]["bindings"] if item["binding_id"] == "CA2-CAP-BIND-ARE-CODEX-HOST-ADAPTER"), None)
    if not host_binding or host_binding["realization_ref"] != "implementation-binding.v2.json" or host_binding["coverage"] != "partial" or host_binding["posture"] != "accepted-bounded-evidence":
        errors.append("host realization does not resolve to the exact partial implementation binding")
    implementation_errors = [message for message in errors if message.startswith("implementation ") or message.startswith("host realization") or message.startswith("profile implementation")]
    if not implementation_errors:
        checks.append("exact implementation, runtime closure, conformance assessment, owner acceptance, interface, protocol, and evidence digests close over binding 002")

    continuation_selection = documents["continuation_selection"]
    lanes = {item["lane_id"]: item for item in continuation_selection["lanes"]}
    if set(lanes) != {"plan_bound", "interaction_bound"}:
        errors.append("continuation source selection must contain exactly plan_bound and interaction_bound lanes")
    interaction_lane = lanes.get("interaction_bound", {})
    if "never direct" not in interaction_lane.get("direct_eligibility", ""):
        errors.append("interaction-bound proposals must never be direct before exact human decision binding")
    if documents["interface"].get("continuation_source_decision_ref") != documents["profile"].get("continuation_source_selection"):
        errors.append("host interface continuation-source decision does not match the profile binding")
    proposal_lanes = documents["interface"].get("continuation", {}).get("proposal_lanes", {})
    if set(proposal_lanes) != {"plan_bound", "interaction_bound"}:
        errors.append("host interface must expose exactly the two selected continuation proposal lanes")
    if not any(message.startswith("continuation source") or message.startswith("interaction-bound") or message.startswith("host interface continuation") or message.startswith("host interface must") for message in errors):
        checks.append("dual-lane continuation semantics preserve plan-bound direct eligibility and interaction-bound human gating")

    graph_path = GENERATED / "graph.json"
    system_path = GENERATED / "system-ontology.json"
    projection_path = GENERATED / "system-ontology-receipt.json"
    if not all(path.is_file() for path in [graph_path, system_path, projection_path]):
        errors.append("DomainSpec generated graph, system ontology, or projection receipt is missing")
    else:
        graph = load_json(graph_path)
        system = load_json(system_path)
        projection = load_json(projection_path)
        system_ids = {item["node_id"] for item in graph.get("nodes", [])}
        business_ids = {item["id"] for item in documents["ontology"]["nodes"]}
        for edge in documents["bridge"]["edges"]:
            if edge["source"] not in business_ids:
                errors.append(f"bridge edge {edge['id']} has unknown business source")
            if edge["target"] not in system_ids:
                errors.append(f"bridge edge {edge['id']} has unknown system target")
        implementation_contract = system.get("implementation_contract", {})
        if implementation_contract.get("app_server_wrapper_status") != "implemented-accepted-not-installed":
            errors.append("system ontology does not preserve accepted-not-installed implementation posture")
        if implementation_contract.get("implementation_binding_status") != "accepted-exact-binding":
            errors.append("system ontology implementation binding is not projected as accepted exact bytes")
        if implementation_contract.get("static_conformance_status") != "assessed-conformant-candidate":
            errors.append("system ontology must expose static_conformance_status=assessed-conformant-candidate")
        if implementation_contract.get("runtime_evidence_status") != "controlled-live-canary-pass":
            errors.append("system ontology does not preserve bounded live evidence posture")
        exact_binding = implementation_contract.get("exact_implementation_binding", {})
        binding_path = PACKAGE / "implementation-binding.v2.json"
        if exact_binding.get("binding_sha256") != sha256_bytes(binding_path.read_bytes()):
            errors.append("system ontology implementation binding digest drift")
        exact_assessment = implementation_contract.get("conformance_assessment", {})
        assessment_path = PACKAGE / "assessments/ARE-CODEX-CONFORMANCE-ASSESSMENT-002.json"
        if exact_assessment.get("assessment_sha256") != sha256_bytes(assessment_path.read_bytes()):
            errors.append("system ontology conformance assessment digest drift")
        exact_acceptance = implementation_contract.get("acceptance_decision", {})
        acceptance_path = PACKAGE / "decisions/implementation-binding-002-acceptance.v1.json"
        if exact_acceptance.get("decision_sha256") != sha256_bytes(acceptance_path.read_bytes()):
            errors.append("system ontology acceptance decision digest drift")
        if implementation_contract.get("accepted_baseline_ref") != "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/decisions/implementation-binding-002-acceptance.v1.json":
            errors.append("system ontology accepted baseline does not resolve to the owner decision")
        if projection.get("deterministic_runs") != 2 or not projection.get("equal_graph_bytes") or not projection.get("equal_system_ontology_bytes"):
            errors.append("system projection receipt lacks two-run determinism evidence")
        if projection.get("source_graph_digest") != sha256_bytes(graph_path.read_bytes()):
            errors.append("system projection graph digest drift")
        if projection.get("system_ontology_digest") != sha256_bytes(system_path.read_bytes()):
            errors.append("system projection ontology digest drift")
        if not any(message.startswith("bridge edge") or message.startswith("system ") or message.startswith("DomainSpec ") for message in errors):
            checks.append("DomainSpec graph, system ontology, bridge endpoints, and candidate-conformance posture are coherent")

    non_acceptance_documents = {name: value for name, value in documents.items() if name != "acceptance"}
    if not recursive_authority_errors(non_acceptance_documents):
        checks.append("the exact owner decision grants binding acceptance while every other modeled authority effect remains none")
    return errors, checks


def self_test(documents: dict[str, Any]) -> list[str]:
    checks: list[str] = []
    dangling = copy.deepcopy(documents)
    dangling["ontology"]["relations"][1]["target"] = "CA2-MISSING-NODE"
    errors, _ = validate_documents(dangling, check_sources=False)
    if not any("unknown target" in item for item in errors):
        raise RuntimeError("self-test failed: dangling ontology target was accepted")
    checks.append("negative fixture rejects a dangling ontology target")

    authority = copy.deepcopy(documents)
    authority["profile"]["authority_effect"] = "grant"
    errors, _ = validate_documents(authority, check_sources=False)
    if not any("authority_effect" in item for item in errors):
        raise RuntimeError("self-test failed: authority collapse was accepted")
    checks.append("negative fixture rejects authority-effect collapse")

    drift = copy.deepcopy(documents)
    drift["sources"]["sources"][0]["sha256"] = "0" * 64
    errors, _ = validate_documents(drift, check_sources=True)
    if not any("source digest drift" in item for item in errors):
        raise RuntimeError("self-test failed: selected source drift was accepted")
    checks.append("negative fixture rejects selected source digest drift")

    implementation_drift = copy.deepcopy(documents)
    implementation_drift["implementation"]["components"][0]["sha256"] = "0" * 64
    errors, _ = validate_documents(implementation_drift, check_sources=False)
    if not any("implementation component digest drift" in item for item in errors):
        raise RuntimeError("self-test failed: implementation component drift was accepted")
    checks.append("negative fixture rejects exact implementation component drift")

    acceptance_drift = copy.deepcopy(documents)
    acceptance_drift["acceptance"]["binding_sha256"] = "0" * 64
    errors, _ = validate_documents(acceptance_drift, check_sources=False)
    if not any("acceptance" in item and "digest" in item for item in errors):
        raise RuntimeError("self-test failed: acceptance digest drift was accepted")
    checks.append("negative fixture rejects acceptance decision digest drift")

    prose_escalation = copy.deepcopy(documents)
    for lane in prose_escalation["continuation_selection"]["lanes"]:
        if lane["lane_id"] == "interaction_bound":
            lane["direct_eligibility"] = "eligible for direct from agent prose"
    errors, _ = validate_documents(prose_escalation, check_sources=False)
    if not any("interaction-bound proposals must never be direct" in item for item in errors):
        raise RuntimeError("self-test failed: interaction prose escalation was accepted")
    checks.append("negative fixture rejects interaction-prose escalation to direct continuation")
    return checks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--verify-build", action="store_true")
    args = parser.parse_args()
    documents = {name: load_json(PACKAGE / relative) for name, relative in FILES.items()}
    errors, checks = validate_documents(documents)
    if args.verify_build:
        verify_materialized_build(errors)
        if not any("build replay" in message or "artifact is stale" in message for message in errors):
            checks.append("two independent DomainSpec build replays match every materialized generated artifact")
    if args.self_test:
        checks.extend(self_test(documents))
    status = "PASS" if not errors else "BLOCK"
    receipt = {
        "schema_ref": "schemas/codex-request-governance.schema.json#/$defs/validationReceipt",
        "schema_version": "are.codex-request-governance-validation/v1",
        "validated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "status": status,
        "package_root": "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration",
        "capability_id": "CA2-CAP-GOVERN-CODEX-REQUESTS",
        "ontology_id": "CA2-ARE-CODEX-BUSINESS-ONTOLOGY",
        "ontology_type": "business-domain",
        "authority_effect": "none",
        "counts": {
            "sources": len(documents["sources"]["sources"]),
            "contracts": len(documents["contracts"]["contracts"]),
            "nodes": len(documents["ontology"]["nodes"]),
            "relations": len(documents["ontology"]["relations"]),
            "bridge_edges": len(documents["bridge"]["edges"]),
            "bridge_gaps": len(documents["bridge"]["gaps"]),
            "policies": len(documents["policies"]["policies"]),
            "obligations": len(documents["obligations"]["obligations"]),
            "realization_bindings": len(documents["realizations"]["bindings"]),
            "residue": len(documents["residue"]["residue"]),
            "implementation_components": len(documents["implementation"]["components"]),
            "implementation_evidence": len(documents["implementation"]["evidence"]),
            "interface_conformance_checks": len(documents["assessment"]["interface_checks"]),
            "capability_conformance_checks": len(documents["assessment"]["capability_obligation_checks"]),
            "acceptance_decisions": 1,
        },
        "material_digest": material_digest(),
        "checks": checks,
        "warnings": ["Binding 002 is accepted for its exact digest; default installation, Product Capability adoption, and DomainSpec admission remain unresolved."],
        "errors": errors,
        "claim_ceiling": "Deterministic validation of accepted exact-byte implementation binding 002, candidate conformance assessment 002, bounded live evidence, DomainSpec source, system projection, and bridge. Acceptance does not install the wrapper, adopt the Product Capability, admit DomainSpec artifacts, publish, release, deploy, or authorize general external effects.",
    }
    local_schema = load_json(PACKAGE / "schemas" / "codex-request-governance.schema.json")
    wrapper = {"$schema": local_schema["$schema"], "$defs": local_schema["$defs"], "$ref": "#/$defs/validationReceipt"}
    receipt_schema_errors = jsonschema_errors(receipt, wrapper)
    if receipt_schema_errors:
        receipt["status"] = "BLOCK"
        receipt["errors"].extend(receipt_schema_errors)
    if args.write_receipt:
        if RECEIPT.exists():
            existing = load_json(RECEIPT)
            if existing.get("material_digest") != receipt["material_digest"]:
                raise SystemExit("refusing to overwrite immutable receipt after material changed; choose a new receipt identity")
        else:
            RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 0 if receipt["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
