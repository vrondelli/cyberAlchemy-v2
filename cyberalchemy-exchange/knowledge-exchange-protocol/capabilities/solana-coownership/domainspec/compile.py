#!/usr/bin/env python3
"""Admission-bound deterministic compiler for the no-price Solana model."""

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
REPO_ROOT = PACKAGE_ROOT.parents[5]
ADMISSION_PATH = PACKAGE_ROOT.parent / "decisions/domainspec-source-admission-001.json"
GENERATED_ROOT = PACKAGE_ROOT / "generated"
SOURCE_ROOT_REF = "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/domainspec"
ADMISSION_REF = "cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/solana-coownership/decisions/domainspec-source-admission-001.json"
COMPILER_REF = f"{SOURCE_ROOT_REF}/compile.py"

KIND_SYSTEM_ROLES = {
    "Entity": "stateful-system-record",
    "Value Object": "immutable-system-value",
    "Policy": "decision-policy",
    "Operation": "atomic-state-transition",
    "Rule": "enforced-invariant-candidate",
    "Event": "transition-observation",
    "State Machine": "lifecycle-model",
    "Interface": "protocol-boundary",
    "Mapping": "semantic-system-projection",
}

SYSTEM_BOUNDARIES = {
    "program_controlled_state": {
        "aggregate": "no-price-solana-coownership:solana-artifact-state",
        "contained_values": [
            "no-price-solana-coownership:knowledge-artifact-version",
            "no-price-solana-coownership:coowner-membership",
            "no-price-solana-coownership:recipient-envelope-commitment",
            "no-price-solana-coownership:grant-replay-domain",
            "no-price-solana-coownership:grant-consumption-record",
        ],
        "claim_limit": "System meaning only; no Solana account layout, address derivation, allocation, or runtime persistence is implemented.",
    },
    "external_durable_storage": {
        "public_commitment": "no-price-solana-coownership:recipient-envelope-commitment",
        "artifact_identity": "no-price-solana-coownership:knowledge-artifact-version",
        "required_external_objects": ["encrypted-recipient-envelope-bytes", "knowledge-artifact-or-ciphertext-bytes"],
        "required_properties": ["content-addressed-byte-identity", "recipient-and-epoch-binding", "recoverable-lookup", "no-public-secret-material"],
        "realization_state": "not_evaluable",
        "claim_limit": "The ontology names durable-storage obligations but selects no provider, locator scheme, retention policy, availability target, or reissue implementation.",
    },
    "secret_material": {
        "public_state_may_hold": ["envelope-digest", "optional-locator", "encryption-public-key-binding"],
        "public_state_must_not_hold": ["plaintext", "content-key", "envelope-plaintext", "recipient-private-key"],
    },
    "authorization": {
        "identity": "no-price-solana-coownership:knowledge-identity",
        "signing_binding": "no-price-solana-coownership:solana-signing-key-binding",
        "encryption_binding": "no-price-solana-coownership:encryption-key-binding",
        "transition": "no-price-solana-coownership:grant-no-price-coownership",
    },
    "evidence": {
        "program_realization": "no-price-solana-coownership:program-realization",
        "environment": "no-price-solana-coownership:execution-environment",
        "evidence_record": "no-price-solana-coownership:coownership-evidence",
        "evidence_contract": "no-price-solana-coownership:grant-evidence-contract",
        "runtime_evidence_state": "not_evaluable",
    },
    "economic": {
        "boundary": "no-price-solana-coownership:no-price-boundary",
        "reported_infrastructure_cost": "no-price-solana-coownership:network-cost",
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
    if admission.get("route_id") != "CA2-ROUTE-GOVERNANCE":
        raise CompileError("source admission route is not governance")
    if admitted.get("lifecycle_status") != "admitted":
        raise CompileError("DomainSpec source is not admitted")
    if subject.get("binding_sha256") != binding_sha256:
        raise CompileError("admitted binding digest does not match current binding bytes")
    if admitted.get("admitted_candidate_material_digest") != preflight.get("candidate_material_digest"):
        raise CompileError("admitted candidate material digest does not match source preflight")
    if admitted.get("admitted_native_source_manifest_sha256") != preflight.get("native_source_manifest_sha256"):
        raise CompileError("admitted native source manifest does not match source preflight")
    if preflight.get("authority_effect") != "none" or preflight.get("external_effect") != "none":
        raise CompileError("source preflight exceeded its effect ceiling")


def reverse_bindings(binding: dict[str, Any], node_ids: set[str]) -> dict[str, dict[str, list[str]]]:
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


def read_source_model(source_root: Path) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    project_path = source_root / "project.json"
    project = load_json(project_path)
    entries: list[dict[str, Any]] = [{
        "source_type": "project",
        "source_id": "project",
        "relative_path": "project.json",
        "sha256": sha256_file(project_path),
        "size_bytes": project_path.stat().st_size,
    }]
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    features = project.get("features")
    if features != ["no-price-solana-coownership"] or project.get("cross_feature_edges") != []:
        raise CompileError("compiler admits only the exact single-feature no-price source")
    for feature_id in features:
        feature_path = source_root / f"specs/{feature_id}/feature.json"
        feature = load_json(feature_path)
        entries.append({
            "source_type": "feature",
            "source_id": feature_id,
            "relative_path": f"specs/{feature_id}/feature.json",
            "sha256": sha256_file(feature_path),
            "size_bytes": feature_path.stat().st_size,
        })
        for node_id in feature.get("nodes", []):
            relative = f"specs/{feature_id}/nodes/{node_id}.json"
            path = source_root / relative
            value = load_json(path)
            if value.get("node_id") != node_id or value.get("feature_id") != feature_id:
                raise CompileError(f"node identity drift: {relative}")
            nodes.append({**value, "relative_path": relative, "source_sha256": sha256_file(path)})
            entries.append({"source_type": "node", "source_id": f"{feature_id}:{node_id}", "relative_path": relative, "sha256": sha256_file(path), "size_bytes": path.stat().st_size})
        for edge_id in feature.get("edges", []):
            relative = f"specs/{feature_id}/edges/{edge_id}.json"
            path = source_root / relative
            value = load_json(path)
            if value.get("edge_id") != edge_id or value.get("feature_id") != feature_id:
                raise CompileError(f"edge identity drift: {relative}")
            edges.append({**value, "relative_path": relative, "source_sha256": sha256_file(path)})
            entries.append({"source_type": "edge", "source_id": f"{feature_id}:{edge_id}", "relative_path": relative, "sha256": sha256_file(path), "size_bytes": path.stat().st_size})
    return project, sorted(nodes, key=lambda item: item["node_id"]), sorted(edges, key=lambda item: item["edge_id"]), sorted(entries, key=lambda item: item["relative_path"])


def system_id(node_id: str) -> str:
    return f"CA2-SYS-KEP-SOLANA-{node_id.upper().replace('_', '-')}"


def build_outputs(source_root: Path = PACKAGE_ROOT, admission_path: Path = ADMISSION_PATH) -> dict[str, bytes]:
    source_root = source_root.resolve()
    admission = load_json(admission_path)
    binding = load_json(source_root / "binding.json")
    preflight = run_source_preflight(source_root)
    binding_sha = sha256_file(source_root / "binding.json")
    verify_admission_contract(admission, binding_sha, preflight)
    project, source_nodes, source_edges, source_entries = read_source_model(source_root)
    node_ids = {node["node_id"] for node in source_nodes}
    selectors = {f"{node['feature_id']}:{node['node_id']}" for node in source_nodes}
    reverse = reverse_bindings(binding, node_ids)

    compiled_nodes: list[dict[str, Any]] = []
    kinds: dict[str, int] = {}
    for node in source_nodes:
        kind = node["kind"]
        if kind not in KIND_SYSTEM_ROLES:
            raise CompileError(f"unsupported system projection kind: {kind}")
        kinds[kind] = kinds.get(kind, 0) + 1
        compiled_nodes.append({
            "selector": f"{node['feature_id']}:{node['node_id']}",
            "feature_id": node["feature_id"],
            "node_id": node["node_id"],
            "kind": kind,
            "body": node["body"],
            "semantic_bindings": reverse[node["node_id"]],
            "source": {"relative_path": node["relative_path"], "sha256": node["source_sha256"]},
        })

    kind_by_node = {node["node_id"]: node["kind"] for node in source_nodes}
    compiled_edges: list[dict[str, Any]] = []
    for edge in source_edges:
        source_id = edge["source_node_id"]
        target_id = edge["target_node_id"]
        if source_id not in kind_by_node or target_id not in kind_by_node:
            raise CompileError(f"edge endpoint closure failed: {edge['edge_id']}")
        compiled_edges.append({
            "edge_id": edge["edge_id"],
            "relationship": edge["relationship"],
            "scope": edge["scope"],
            "source": {"selector": f"{edge['feature_id']}:{source_id}", "kind": kind_by_node[source_id]},
            "target": {"selector": f"{edge['feature_id']}:{target_id}", "kind": kind_by_node[target_id]},
            "source_file": {"relative_path": edge["relative_path"], "sha256": edge["source_sha256"]},
        })

    source_manifest = {
        "schema_version": "cav2-kep-solana-domainspec-source-manifest/v1",
        "project_id": project["project_id"],
        "admitted_candidate_material_digest": preflight["candidate_material_digest"],
        "native_source_manifest_sha256": preflight["native_source_manifest_sha256"],
        "source_count": len(source_entries),
        "sources": source_entries,
        "authority_effect": "none",
    }
    source_manifest_bytes = canonical_bytes(source_manifest)

    compiled_graph = {
        "schema_version": "cav2-kep-solana-compiled-graph/v1-candidate",
        "graph_id": "CA2-GRAPH-KEP-SOLANA-NO-PRICE-COOWNERSHIP-001",
        "authority": "generated-read-model",
        "lifecycle_status": "candidate",
        "project_id": project["project_id"],
        "feature_id": binding["feature_id"],
        "predecessor": {
            "domainspec_source_admission_ref": ADMISSION_REF,
            "domainspec_source_admission_sha256": sha256_file(admission_path),
            "admitted_source_id": admission["admission"]["admitted_source_id"],
            "admitted_candidate_material_digest": preflight["candidate_material_digest"],
            "native_source_manifest_sha256": preflight["native_source_manifest_sha256"],
        },
        "source_manifest_ref": "source-manifest.json",
        "source_manifest_sha256": sha256_bytes(source_manifest_bytes),
        "counts": {"nodes": len(compiled_nodes), "edges": len(compiled_edges), "kinds": dict(sorted(kinds.items()))},
        "nodes": compiled_nodes,
        "edges": compiled_edges,
        "authority_effect": "none",
        "enforcement_effect": "none",
        "claim_ceiling": "Deterministic compiled read-model only; no system-ontology admission, implementation binding, conformance, runtime behavior, publication, deployment, or external effect.",
    }
    graph_bytes = canonical_bytes(compiled_graph)
    graph_sha = sha256_bytes(graph_bytes)

    boundary_selectors: set[str] = set()
    def collect_selectors(value: Any) -> None:
        if isinstance(value, str) and ":" in value and value.startswith("no-price-solana-coownership:"):
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
        "system_relation_id": f"CA2-SYS-REL-{edge['edge_id'].upper()}",
        "domainspec_edge_id": edge["edge_id"],
        "relationship": edge["relationship"],
        "source_system_id": selector_to_system[edge["source"]["selector"]],
        "target_system_id": selector_to_system[edge["target"]["selector"]],
        "authority_effect": "none",
    } for edge in compiled_edges]
    projection_profile = {"kind_system_roles": KIND_SYSTEM_ROLES, "system_boundaries": SYSTEM_BOUNDARIES}
    proof_obligations = [{
        "proof_requirement_id": proof_id,
        "domainspec_nodes": targets,
        "evidence_state": "not_evaluable",
        "causal_blocker": "No admitted system ontology, implementation binding, or environment-bounded runtime evidence exists.",
    } for proof_id, targets in sorted(binding["proof_requirement_mappings"].items())]

    system_ontology = {
        "schema_version": "cav2-kep-solana-system-ontology/v1-candidate",
        "ontology_id": "CA2-SYSTEM-ONTOLOGY-KEP-SOLANA-NO-PRICE-COOWNERSHIP",
        "ontology_type": "system-runtime",
        "branch": "system",
        "lifecycle_status": "candidate",
        "visibility": "private",
        "product_id": binding["product_id"],
        "capability_id": binding["capability_id"],
        "business_ontology_id": binding["ontology_id"],
        "predecessor": {
            "domainspec_source_admission_ref": ADMISSION_REF,
            "domainspec_source_admission_sha256": sha256_file(admission_path),
            "admitted_source_id": admission["admission"]["admitted_source_id"],
            "admitted_candidate_material_digest": preflight["candidate_material_digest"],
            "native_source_manifest_sha256": preflight["native_source_manifest_sha256"],
        },
        "compiler": {
            "compiler_ref": COMPILER_REF,
            "compiler_sha256": sha256_file(Path(__file__).resolve()),
            "projection_version": "cav2-kep-solana-structural-system-projection/v1",
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
            "runtime_evidence": "not_evaluable",
        },
        "authority_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Generated system-runtime ontology candidate only; no account layout, durable-storage provider, cryptographic implementation, Rust binding, conformance, network execution, publication, release, deployment, or external effect.",
    }
    system_bytes = canonical_bytes(system_ontology)

    compilation_receipt = {
        "schema_version": "cav2-kep-solana-compilation-receipt/v1",
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
        "counts": {"nodes": len(compiled_nodes), "edges": len(compiled_edges), "proof_obligations": len(proof_obligations)},
        "checks": [
            {"check_id": "domainspec-source-admitted", "status": "PASS"},
            {"check_id": "source-preflight", "status": "PASS"},
            {"check_id": "graph-endpoint-closure", "status": "PASS"},
            {"check_id": "semantic-binding-closure", "status": "PASS"},
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
    output_root.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix=".compile-", dir=output_root.parent))
    try:
        for name, content in outputs.items():
            (temporary / name).write_bytes(content)
        for name in sorted(outputs):
            os.replace(temporary / name, output_root / name)
    finally:
        temporary.rmdir()


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
            "schema_version": "cav2-kep-solana-compile-command/v1",
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
            "schema_version": "cav2-kep-solana-compile-command/v1",
            "result": "fail",
            "error": str(exc),
            "authority_effect": "none",
            "external_effect": "none",
        }, indent=2, sort_keys=True))
        return 1


if __name__ == "__main__":
    sys.exit(main())
