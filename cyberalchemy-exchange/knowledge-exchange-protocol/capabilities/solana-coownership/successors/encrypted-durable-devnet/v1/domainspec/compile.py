#!/usr/bin/env python3
"""Admission-bound deterministic compiler for the encrypted durable Devnet model."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parent
V1_ROOT = PACKAGE_ROOT.parent
REPO_ROOT = next(parent for parent in PACKAGE_ROOT.parents if (parent / "projects/domainspec-v2").is_dir())
ADMISSION_PATH = V1_ROOT / "decisions/domainspec-source-admission-001.json"
GENERATED_ROOT = PACKAGE_ROOT / "generated"
FEATURE_ID = "encrypted-durable-devnet-coownership"
SOURCE_ROOT_REF = "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/domainspec"
ADMISSION_REF = "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/decisions/domainspec-source-admission-001.json"
COMPILER_REF = f"{SOURCE_ROOT_REF}/compile.py"

KIND_SYSTEM_ROLES = {
    "Entity": "stateful-system-record",
    "Value Object": "immutable-system-value",
    "Policy": "decision-policy",
    "Operation": "bounded-state-transition",
    "Rule": "enforced-invariant-candidate",
    "Event": "transition-observation",
    "State Machine": "lifecycle-model",
    "Interface": "protocol-boundary",
    "Workflow": "orchestrated-protocol-workflow",
}

SYSTEM_BOUNDARIES = {
    "program_controlled_state": {
        "aggregate": f"{FEATURE_ID}:artifact-state",
        "lifecycles": [
            f"{FEATURE_ID}:coownership-state",
            f"{FEATURE_ID}:delivery-state",
            f"{FEATURE_ID}:reissue-state",
        ],
        "contained_values": [
            f"{FEATURE_ID}:knowledge-artifact-version",
            f"{FEATURE_ID}:coowner-membership",
            f"{FEATURE_ID}:recipient-envelope-commitment",
            f"{FEATURE_ID}:grant-replay-domain",
            f"{FEATURE_ID}:grant-consumption-record",
        ],
        "claim_limit": "System meaning only; no Solana account layout, address derivation, allocation, instruction encoding, or runtime persistence is implemented.",
    },
    "identity_and_key_roles": {
        "identity": f"{FEATURE_ID}:knowledge-identity",
        "signing_binding": f"{FEATURE_ID}:signing-key-binding",
        "encryption_binding": f"{FEATURE_ID}:encryption-key-binding",
        "noncollapse_rule": f"{FEATURE_ID}:rule-key-roles-noncollapse",
    },
    "cryptographic_material": {
        "profile": f"{FEATURE_ID}:cryptographic-profile",
        "content_suite": f"{FEATURE_ID}:content-encryption-suite",
        "envelope_suite": f"{FEATURE_ID}:recipient-envelope-suite",
        "encrypted_artifact": f"{FEATURE_ID}:encrypted-artifact",
        "recipient_envelope": f"{FEATURE_ID}:recipient-envelope",
        "qualified_identity": f"{FEATURE_ID}:qualified-byte-identity",
        "public_state_may_hold": ["qualified-byte-commitment", "recipient-envelope-commitment", "opaque-locator-commitment"],
        "public_state_must_not_hold": ["plaintext", "content-key", "recipient-private-key", "encrypted-artifact-bytes", "recipient-envelope-bytes"],
        "security_state": "not_evaluable",
    },
    "durable_storage": {
        "realization": f"{FEATURE_ID}:storage-realization",
        "policy": f"{FEATURE_ID}:durable-storage-policy",
        "operational_layer": f"{FEATURE_ID}:operational-storage-registry",
        "journal_layer": f"{FEATURE_ID}:recovery-journal",
        "archive_layer": f"{FEATURE_ID}:immutable-archive",
        "readiness": f"{FEATURE_ID}:storage-readiness",
        "verified_retrieval": f"{FEATURE_ID}:verified-retrieval",
        "write_operation": f"{FEATURE_ID}:persist-and-verify-material",
        "read_operation": f"{FEATURE_ID}:retrieve-active-material",
        "realization_state": "not_evaluable",
        "claim_limit": "The system ontology requires three logical layers and verified retrieval but selects no provider, endpoint, credentials, production topology, or exact SQL adapter.",
    },
    "activation_and_reconciliation": {
        "prepared_material": f"{FEATURE_ID}:prepared-material",
        "active_material": f"{FEATURE_ID}:active-material",
        "activation": f"{FEATURE_ID}:activate-finalized-delivery",
        "reconciliation": f"{FEATURE_ID}:reconcile-delivery",
        "reconciliation_event": f"{FEATURE_ID}:reconciliation-required",
        "cross_system_atomicity": "forbidden-claim",
    },
    "grant_and_reissue": {
        "grant": f"{FEATURE_ID}:grant-coownership",
        "grant_input": f"{FEATURE_ID}:grant-input-contract",
        "request": f"{FEATURE_ID}:request-key-reissue",
        "request_input": f"{FEATURE_ID}:reissue-input-contract",
        "fulfillment": f"{FEATURE_ID}:fulfill-key-reissue",
        "propagation_policy": f"{FEATURE_ID}:propagation-policy",
        "owner_transfer": "forbidden",
    },
    "protocol": {
        "interface": f"{FEATURE_ID}:knowledge-exchange-protocol",
        "workflow": f"{FEATURE_ID}:encrypted-durable-devnet-workflow",
        "environment_policy": f"{FEATURE_ID}:devnet-execution-policy",
        "runtime_state": "not_evaluable",
    },
    "evidence": {
        "record": f"{FEATURE_ID}:protocol-evidence",
        "contract": f"{FEATURE_ID}:end-to-end-evidence-contract",
        "decryption": f"{FEATURE_ID}:recipient-decryption-observation",
        "program_realization": f"{FEATURE_ID}:program-realization",
        "storage_realization": f"{FEATURE_ID}:storage-realization",
        "runtime_evidence_state": "not_evaluable",
    },
    "economic": {
        "boundary": f"{FEATURE_ID}:no-price-policy",
        "network_cost": f"{FEATURE_ID}:network-cost",
        "storage_cost": f"{FEATURE_ID}:storage-cost",
        "cost_observation": f"{FEATURE_ID}:observe-infrastructure-costs",
        "knowledge_consideration": "forbidden-in-this-capability",
    },
}


class CompileError(Exception):
    pass


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise CompileError(f"cannot read JSON {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise CompileError(f"JSON root must be an object: {path}")
    return value


def run_source_preflight(source_root: Path) -> dict[str, Any]:
    completed = subprocess.run(
        [sys.executable, str(PACKAGE_ROOT / "validate.py"), "--source-root", str(source_root)],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
        env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
    )
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise CompileError(f"source preflight returned invalid JSON: {completed.stdout or completed.stderr}") from exc
    if completed.returncode != 0 or result.get("result") != "pass":
        raise CompileError(f"source preflight failed: {json.dumps(result, sort_keys=True)}")
    return result


def verify_admission_contract(admission: dict[str, Any], binding_sha256: str, preflight: dict[str, Any]) -> None:
    admitted = admission.get("admission", {})
    subject = admission.get("subject", {})
    admitted_source = admission.get("admitted_source", {})
    if admission.get("route_id") != "CA2-ROUTE-GOVERNANCE":
        raise CompileError("source admission route is not governance")
    if admitted.get("lifecycle_status") != "admitted":
        raise CompileError("DomainSpec source is not admitted")
    if subject.get("binding_sha256") != binding_sha256:
        raise CompileError("admitted binding digest does not match current binding bytes")
    if admitted.get("admitted_binding_id") != preflight.get("binding_id"):
        raise CompileError("admitted binding identity does not match source preflight")
    if admitted.get("admitted_candidate_material_digest") != preflight.get("candidate_material_digest"):
        raise CompileError("admitted candidate material digest does not match source preflight")
    if admitted_source.get("native_source_manifest_sha256") != preflight.get("native_source_manifest_sha256"):
        raise CompileError("admitted native source manifest does not match source preflight")
    if preflight.get("authority_effect") != "none" or preflight.get("external_effect") != "none":
        raise CompileError("source preflight exceeded its effect ceiling")


def reverse_node_bindings(binding: dict[str, Any], node_ids: set[str]) -> dict[str, dict[str, list[str]]]:
    result = {
        node_id: {"definition_ids": [], "ontology_node_ids": [], "ontology_rule_ids": [], "proof_requirement_ids": []}
        for node_id in node_ids
    }
    registries = [
        ("definition_mappings", "definition_ids"),
        ("ontology_node_mappings", "ontology_node_ids"),
        ("ontology_rule_mappings", "ontology_rule_ids"),
        ("proof_requirement_mappings", "proof_requirement_ids"),
    ]
    for registry_name, target_name in registries:
        registry = binding.get(registry_name)
        if not isinstance(registry, dict):
            raise CompileError(f"binding registry missing: {registry_name}")
        for semantic_id, raw_targets in registry.items():
            targets = raw_targets if isinstance(raw_targets, list) else [raw_targets]
            for node_id in targets:
                if node_id not in result:
                    raise CompileError(f"binding target is not a declared node: {registry_name}:{node_id}")
                result[node_id][target_name].append(semantic_id)
    for groups in result.values():
        for values in groups.values():
            values.sort()
    return result


def reverse_relation_bindings(binding: dict[str, Any], edge_ids: set[str]) -> dict[str, list[str]]:
    result = {edge_id: [] for edge_id in edge_ids}
    registry = binding.get("ontology_relation_mappings")
    if not isinstance(registry, dict):
        raise CompileError("binding registry missing: ontology_relation_mappings")
    for relation_id, mapping in registry.items():
        if not isinstance(mapping, dict):
            raise CompileError(f"invalid ontology relation mapping: {relation_id}")
        projected = mapping.get("system_projection_edges")
        if not isinstance(projected, list) or not projected:
            raise CompileError(f"ontology relation has no system projection: {relation_id}")
        for edge_id in projected:
            if edge_id not in result:
                raise CompileError(f"ontology relation maps to unknown edge: {relation_id}:{edge_id}")
            result[edge_id].append(relation_id)
    for values in result.values():
        values.sort()
    observed = {relation_id for values in result.values() for relation_id in values}
    if observed != set(registry):
        raise CompileError("ontology relation reverse-binding closure failed")
    return result


def read_source_model(source_root: Path) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    binding_path = source_root / "binding.json"
    project_path = source_root / "project.json"
    project = load_json(project_path)
    entries: list[dict[str, Any]] = [
        {"source_type": "binding", "source_id": "binding", "relative_path": "binding.json", "sha256": sha256_file(binding_path), "size_bytes": binding_path.stat().st_size},
        {"source_type": "project", "source_id": "project", "relative_path": "project.json", "sha256": sha256_file(project_path), "size_bytes": project_path.stat().st_size},
    ]
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    features = project.get("features")
    if features != [FEATURE_ID] or project.get("cross_feature_edges") != []:
        raise CompileError("compiler admits only the exact encrypted durable Devnet singleton feature")
    feature_path = source_root / f"specs/{FEATURE_ID}/feature.json"
    feature = load_json(feature_path)
    entries.append({"source_type": "feature", "source_id": FEATURE_ID, "relative_path": f"specs/{FEATURE_ID}/feature.json", "sha256": sha256_file(feature_path), "size_bytes": feature_path.stat().st_size})
    for node_id in feature.get("nodes", []):
        relative = f"specs/{FEATURE_ID}/nodes/{node_id}.json"
        path = source_root / relative
        value = load_json(path)
        if value.get("node_id") != node_id or value.get("feature_id") != FEATURE_ID:
            raise CompileError(f"node identity drift: {relative}")
        nodes.append({**value, "relative_path": relative, "source_sha256": sha256_file(path)})
        entries.append({"source_type": "node", "source_id": f"{FEATURE_ID}:{node_id}", "relative_path": relative, "sha256": sha256_file(path), "size_bytes": path.stat().st_size})
    for edge_id in feature.get("edges", []):
        relative = f"specs/{FEATURE_ID}/edges/{edge_id}.json"
        path = source_root / relative
        value = load_json(path)
        if value.get("edge_id") != edge_id or value.get("feature_id") != FEATURE_ID:
            raise CompileError(f"edge identity drift: {relative}")
        edges.append({**value, "relative_path": relative, "source_sha256": sha256_file(path)})
        entries.append({"source_type": "edge", "source_id": f"{FEATURE_ID}:{edge_id}", "relative_path": relative, "sha256": sha256_file(path), "size_bytes": path.stat().st_size})
    return project, sorted(nodes, key=lambda item: item["node_id"]), sorted(edges, key=lambda item: item["edge_id"]), sorted(entries, key=lambda item: item["relative_path"])


def system_id(node_id: str) -> str:
    return f"CA2-SYS-KEP-SOL2-{node_id.upper().replace('_', '-')}"


def build_outputs(source_root: Path = PACKAGE_ROOT, admission_path: Path = ADMISSION_PATH) -> dict[str, bytes]:
    source_root = source_root.resolve()
    admission = load_json(admission_path)
    binding = load_json(source_root / "binding.json")
    preflight = run_source_preflight(source_root)
    binding_sha = sha256_file(source_root / "binding.json")
    verify_admission_contract(admission, binding_sha, preflight)
    project, source_nodes, source_edges, source_entries = read_source_model(source_root)
    node_ids = {node["node_id"] for node in source_nodes}
    edge_ids = {edge["edge_id"] for edge in source_edges}
    selectors = {f"{node['feature_id']}:{node['node_id']}" for node in source_nodes}
    node_reverse = reverse_node_bindings(binding, node_ids)
    relation_reverse = reverse_relation_bindings(binding, edge_ids)

    compiled_nodes: list[dict[str, Any]] = []
    kinds: dict[str, int] = {}
    for source_node in source_nodes:
        kind = source_node["kind"]
        if kind not in KIND_SYSTEM_ROLES:
            raise CompileError(f"unsupported system projection kind: {kind}")
        kinds[kind] = kinds.get(kind, 0) + 1
        compiled_nodes.append({
            "selector": f"{source_node['feature_id']}:{source_node['node_id']}",
            "feature_id": source_node["feature_id"],
            "node_id": source_node["node_id"],
            "kind": kind,
            "body": source_node["body"],
            "semantic_bindings": node_reverse[source_node["node_id"]],
            "source": {"relative_path": source_node["relative_path"], "sha256": source_node["source_sha256"]},
        })

    kind_by_node = {node["node_id"]: node["kind"] for node in source_nodes}
    compiled_edges: list[dict[str, Any]] = []
    for source_edge in source_edges:
        source_id = source_edge["source_node_id"]
        target_id = source_edge["target_node_id"]
        if source_id not in kind_by_node or target_id not in kind_by_node:
            raise CompileError(f"edge endpoint closure failed: {source_edge['edge_id']}")
        compiled_edges.append({
            "edge_id": source_edge["edge_id"],
            "relationship": source_edge["relationship"],
            "scope": source_edge["scope"],
            "source": {"selector": f"{FEATURE_ID}:{source_id}", "kind": kind_by_node[source_id]},
            "target": {"selector": f"{FEATURE_ID}:{target_id}", "kind": kind_by_node[target_id]},
            "semantic_bindings": {"ontology_relation_ids": relation_reverse[source_edge["edge_id"]]},
            "source_file": {"relative_path": source_edge["relative_path"], "sha256": source_edge["source_sha256"]},
        })

    source_manifest = {
        "schema_version": "cav2-kep-sol2-domainspec-source-manifest/v1",
        "project_id": project["project_id"],
        "source_admission_ref": ADMISSION_REF,
        "source_admission_sha256": sha256_file(admission_path),
        "admitted_candidate_material_digest": preflight["candidate_material_digest"],
        "native_source_manifest_sha256": preflight["native_source_manifest_sha256"],
        "source_count": len(source_entries),
        "sources": source_entries,
        "authority_effect": "none",
    }
    source_manifest_bytes = canonical_bytes(source_manifest)

    predecessor = {
        "domainspec_source_admission_ref": ADMISSION_REF,
        "domainspec_source_admission_sha256": sha256_file(admission_path),
        "admitted_binding_id": admission["admission"]["admitted_binding_id"],
        "admitted_candidate_material_digest": preflight["candidate_material_digest"],
        "native_source_manifest_sha256": preflight["native_source_manifest_sha256"],
    }
    compiled_graph = {
        "schema_version": "cav2-kep-sol2-compiled-graph/v1-candidate",
        "graph_id": "CA2-GRAPH-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-001",
        "authority": "generated-read-model",
        "lifecycle_status": "candidate",
        "project_id": project["project_id"],
        "feature_id": binding["feature_id"],
        "predecessor": predecessor,
        "source_manifest_ref": "source-manifest.json",
        "source_manifest_sha256": sha256_bytes(source_manifest_bytes),
        "counts": {"nodes": len(compiled_nodes), "edges": len(compiled_edges), "kinds": dict(sorted(kinds.items()))},
        "nodes": compiled_nodes,
        "edges": compiled_edges,
        "authority_effect": "none",
        "enforcement_effect": "none",
        "claim_ceiling": "Deterministic compiled read-model candidate only; no system-ontology admission, implementation binding, runtime behavior, conformance, publication, deployment, or external effect.",
    }
    graph_bytes = canonical_bytes(compiled_graph)

    boundary_selectors: set[str] = set()

    def collect_selectors(value: Any) -> None:
        if isinstance(value, str) and value.startswith(f"{FEATURE_ID}:"):
            boundary_selectors.add(value)
        elif isinstance(value, list):
            for child in value:
                collect_selectors(child)
        elif isinstance(value, dict):
            for child in value.values():
                collect_selectors(child)

    collect_selectors(SYSTEM_BOUNDARIES)
    missing_boundaries = sorted(boundary_selectors - selectors)
    if missing_boundaries:
        raise CompileError(f"system boundary selectors are missing: {missing_boundaries}")

    system_nodes = [{
        "system_id": system_id(node["node_id"]),
        "domainspec_selector": node["selector"],
        "domainspec_kind": node["kind"],
        "system_role": KIND_SYSTEM_ROLES[node["kind"]],
        "description": node["body"]["description"],
        "contract": {key: value for key, value in node["body"].items() if key != "description"},
        "semantic_bindings": node["semantic_bindings"],
        "authority_effect": "none",
    } for node in compiled_nodes]
    selector_to_system = {node["domainspec_selector"]: node["system_id"] for node in system_nodes}
    system_relations = [{
        "system_relation_id": f"CA2-SYS-REL-KEP-SOL2-{edge['edge_id'].upper()}",
        "domainspec_edge_id": edge["edge_id"],
        "relationship": edge["relationship"],
        "source_system_id": selector_to_system[edge["source"]["selector"]],
        "target_system_id": selector_to_system[edge["target"]["selector"]],
        "semantic_bindings": edge["semantic_bindings"],
        "authority_effect": "none",
    } for edge in compiled_edges]
    projection_profile = {"kind_system_roles": KIND_SYSTEM_ROLES, "system_boundaries": SYSTEM_BOUNDARIES}
    proof_obligations = [{
        "proof_requirement_id": proof_id,
        "domainspec_nodes": targets,
        "evidence_state": "not_evaluable",
        "causal_blocker": "No admitted system ontology, implementation binding, or environment-bounded runtime evidence exists.",
    } for proof_id, targets in sorted(binding["proof_requirement_mappings"].items())]
    graph_sha = sha256_bytes(graph_bytes)
    system_ontology = {
        "schema_version": "cav2-kep-sol2-system-ontology/v1-candidate",
        "ontology_id": "CA2-SYSTEM-ONTOLOGY-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET",
        "ontology_type": "system-runtime",
        "branch": "system",
        "lifecycle_status": "candidate",
        "visibility": "private",
        "product_id": binding["product_id"],
        "capability_id": binding["capability_id"],
        "business_ontology_id": binding["ontology_id"],
        "predecessor": predecessor,
        "compiler": {
            "compiler_ref": COMPILER_REF,
            "compiler_sha256": sha256_file(Path(__file__).resolve()),
            "projection_version": "cav2-kep-sol2-structural-system-projection/v1",
            "projection_profile_sha256": sha256_bytes(canonical_bytes(projection_profile)),
        },
        "compiled_graph_ref": "compiled-graph.json",
        "compiled_graph_sha256": graph_sha,
        "counts": {"system_nodes": len(system_nodes), "system_relations": len(system_relations), "proof_obligations": len(proof_obligations)},
        "nodes": system_nodes,
        "relations": system_relations,
        "boundaries": SYSTEM_BOUNDARIES,
        "proof_obligations": proof_obligations,
        "construction_state": {
            "canonical_definitions": "accepted",
            "product_capability": "adopted",
            "business_ontology": "admitted",
            "domainspec_v2_source": "admitted",
            "compiled_graph": "generated-candidate",
            "system_ontology": "generated-candidate-awaiting-owner-admission",
            "implementation_binding": "not_evaluable",
            "conformance_evidence": "not_evaluable",
            "devnet_trial": "not_evaluable",
        },
        "successor_authorization": {
            "system_ontology_admission": "not-authorized-by-this-candidate",
            "implementation": "not-authorized",
            "credentials_or_wallets": "not-authorized",
            "devnet_transaction": "not-authorized",
            "publication": "not-authorized",
            "deployment": "not-authorized",
        },
        "authority_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Generated system-runtime ontology candidate only; no account layout, storage provider, cryptographic implementation, Rust binding, conformance, network execution, publication, deployment, or external effect.",
    }
    system_bytes = canonical_bytes(system_ontology)
    compilation_receipt = {
        "schema_version": "cav2-kep-sol2-compilation-receipt/v1",
        "status": "PASS",
        "mode": "deterministic-compilation",
        "compiler_ref": COMPILER_REF,
        "compiler_sha256": sha256_file(Path(__file__).resolve()),
        "source_admission_ref": ADMISSION_REF,
        "source_admission_sha256": sha256_file(admission_path),
        "admitted_candidate_material_digest": preflight["candidate_material_digest"],
        "native_source_manifest_sha256": preflight["native_source_manifest_sha256"],
        "artifacts": {
            "source_manifest_sha256": sha256_bytes(source_manifest_bytes),
            "compiled_graph_sha256": graph_sha,
            "system_ontology_sha256": sha256_bytes(system_bytes),
        },
        "counts": {"nodes": len(compiled_nodes), "edges": len(compiled_edges), "proof_obligations": len(proof_obligations), "ontology_relation_bindings": len(binding["ontology_relation_mappings"])},
        "checks": [
            {"check_id": "domainspec-source-admitted", "status": "PASS"},
            {"check_id": "source-preflight", "status": "PASS"},
            {"check_id": "graph-endpoint-closure", "status": "PASS"},
            {"check_id": "semantic-node-binding-closure", "status": "PASS"},
            {"check_id": "semantic-relation-binding-closure", "status": "PASS"},
            {"check_id": "system-boundary-selector-closure", "status": "PASS"},
            {"check_id": "system-ontology-admission", "status": "not_evaluable", "causal_blocker": "Generated candidate requires a separate immutable owner decision."},
            {"check_id": "implementation-binding", "status": "not_evaluable", "causal_blocker": "CAV2-D65 requires an admitted system ontology before implementation binding."},
            {"check_id": "runtime-conformance", "status": "not_evaluable", "causal_blocker": "No implementation binding or observed runtime exists."},
        ],
        "authority_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
    }
    return {
        "source-manifest.json": source_manifest_bytes,
        "compiled-graph.json": graph_bytes,
        "system-ontology.json": system_bytes,
        "compilation-receipt.json": canonical_bytes(compilation_receipt),
    }


def publish(outputs: dict[str, bytes], output_root: Path) -> None:
    output_root.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".compile-kep-sol2-", dir=output_root.parent) as temporary_raw:
        temporary = Path(temporary_raw)
        for name, content in outputs.items():
            (temporary / name).write_bytes(content)
        output_root.mkdir(parents=True, exist_ok=True)
        for name in sorted(outputs):
            os.replace(temporary / name, output_root / name)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--output-root", type=Path, default=GENERATED_ROOT)
    args = parser.parse_args()
    try:
        outputs = build_outputs()
        mismatches: list[str] = []
        if args.check:
            for name, content in outputs.items():
                path = args.output_root / name
                if not path.is_file() or path.read_bytes() != content:
                    mismatches.append(name)
        else:
            publish(outputs, args.output_root)
        result = {
            "schema_version": "cav2-kep-sol2-compile-command/v1",
            "result": "pass" if not mismatches else "fail",
            "mode": "check" if args.check else "write",
            "outputs": sorted(outputs),
            "mismatches": sorted(mismatches),
            "output_digests": {name: sha256_bytes(content) for name, content in sorted(outputs.items())},
            "authority_effect": "none",
            "external_effect": "none",
        }
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0 if not mismatches else 1
    except CompileError as exc:
        print(json.dumps({
            "schema_version": "cav2-kep-sol2-compile-command/v1",
            "result": "fail",
            "error": str(exc),
            "authority_effect": "none",
            "external_effect": "none",
        }, indent=2, sort_keys=True))
        return 1


if __name__ == "__main__":
    sys.exit(main())
