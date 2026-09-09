#!/usr/bin/env python3
"""Materialize the exact Rust binding candidate for the admitted SOL2 system ontology."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
V1_ROOT = HERE.parents[1]
PRODUCT_ROOT = V1_ROOT.parents[4]
POLICY_PATH = HERE / "policy.json"
OUTPUT_PATH = HERE / "generated" / "implementation-binding.json"


class BindingError(RuntimeError):
    pass


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def sha256_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise BindingError(message)


def snake(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def upper_camel(value: str) -> str:
    return "".join(part.capitalize() for part in re.split(r"[^A-Za-z0-9]+", value) if part)


def candidate_set_digest(decision_path: Path, artifacts: list[dict[str, str]]) -> str:
    digest = hashlib.sha256()
    for item in sorted(artifacts, key=lambda entry: Path(entry["path"]).name):
        path = (decision_path.parent / item["path"]).resolve()
        raw = path.read_bytes()
        require(sha256_bytes(raw) == item["sha256"], f"admitted artifact drift: {path}")
        digest.update(path.name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(raw)
        digest.update(b"\0")
    return digest.hexdigest()


def planned_symbol(node_id: str, kind: str) -> str:
    if kind == "Rule":
        return f"enforce_{snake(node_id.removeprefix('rule-'))}"
    if kind in {"Operation", "Workflow"}:
        return snake(node_id)
    if kind == "Interface":
        return f"{upper_camel(node_id)}Port"
    return upper_camel(node_id)


def select_layer(node_id: str, policy: dict[str, Any]) -> str:
    for rule in policy["classification_rules"]:
        if any(token in node_id for token in rule["tokens"]):
            return rule["layer_id"]
    fallback = [rule for rule in policy["classification_rules"] if rule.get("fallback")]
    require(len(fallback) == 1, "classification policy must declare one fallback")
    return fallback[0]["layer_id"]


def verify_inputs(policy: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], str]:
    predecessor = policy["admitted_predecessor"]
    decision_path = V1_ROOT / predecessor["decision_path"]
    require(decision_path.is_file(), f"missing admission decision: {decision_path}")
    require(sha256_file(decision_path) == predecessor["decision_sha256"], "system-ontology admission decision drift")
    decision = load_json(decision_path)
    require(decision["decision_id"] == predecessor["decision_id"], "admission decision identity mismatch")
    require(decision["admission"]["lifecycle_status"] == "admitted", "system ontology is not admitted")
    require(
        decision["admission"]["admitted_candidate_set_digest"] == predecessor["candidate_set_digest"],
        "admitted candidate-set digest mismatch",
    )
    require(
        candidate_set_digest(decision_path, decision["subject"]["artifacts"]) == predecessor["candidate_set_digest"],
        "admitted candidate-set bytes drift",
    )

    system_path = V1_ROOT / predecessor["system_ontology_path"]
    graph_path = V1_ROOT / predecessor["compiled_graph_path"]
    require(sha256_file(system_path) == predecessor["system_ontology_sha256"], "system ontology drift")
    require(sha256_file(graph_path) == predecessor["compiled_graph_sha256"], "compiled graph drift")
    system = load_json(system_path)
    graph = load_json(graph_path)
    require(system["ontology_id"] == predecessor["system_ontology_id"], "system ontology identity mismatch")
    require(graph["graph_id"] == predecessor["compiled_graph_id"], "compiled graph identity mismatch")

    for item in policy["rust_substrate"]["files"]:
        path = PRODUCT_ROOT / item["path"]
        require(path.is_file(), f"missing Rust substrate file: {path}")
        require(sha256_file(path) == item["sha256"], f"Rust substrate drift: {item['path']}")
    old_binding_path = PRODUCT_ROOT / policy["rust_substrate"]["existing_binding_path"]
    require(sha256_file(old_binding_path) == policy["rust_substrate"]["existing_binding_sha256"], "existing binding drift")

    planned_paths = [policy["planned_module_root"], policy["planned_test_path"]]
    planned_paths.extend(layer["target_path"] for layer in policy["layers"] if layer["target_state"].startswith("planned-"))
    for relative in sorted(set(planned_paths)):
        require(not (PRODUCT_ROOT / relative).exists(), f"planned target now exists and requires a successor binding: {relative}")

    source_text = (PRODUCT_ROOT / "runtime/src/lib.rs").read_text(encoding="utf-8")
    for node_id, symbols in policy["existing_symbol_candidates"].items():
        for symbol in symbols:
            terminal = symbol.split("::")[-1]
            require(terminal in source_text, f"existing symbol candidate missing for {node_id}: {symbol}")
    return decision, system, graph, source_text


def build_binding(policy_override: dict[str, Any] | None = None) -> dict[str, Any]:
    policy = copy.deepcopy(policy_override) if policy_override is not None else load_json(POLICY_PATH)
    decision, system, graph, _source_text = verify_inputs(policy)
    layers = {layer["layer_id"]: layer for layer in policy["layers"]}
    require(len(layers) == len(policy["layers"]), "duplicate layer_id")

    node_mappings: list[dict[str, Any]] = []
    by_system_id: dict[str, dict[str, Any]] = {}
    for node in sorted(system["nodes"], key=lambda item: item["system_id"]):
        selector = node["domainspec_selector"]
        node_id = selector.split(":", 1)[1]
        existing_symbols = policy["existing_symbol_candidates"].get(node_id)
        if existing_symbols:
            layer_id = "protocol-kernel-existing"
            coverage = "existing-symbol-candidate"
            targets = [
                {
                    "path": "runtime/src/lib.rs",
                    "sha256": next(item["sha256"] for item in policy["rust_substrate"]["files"] if item["path"] == "runtime/src/lib.rs"),
                    "symbol": symbol,
                    "target_state": "existing-exact-bytes"
                }
                for symbol in existing_symbols
            ]
        else:
            layer_id = select_layer(node_id, policy)
            coverage = "planned-extension"
            targets = [
                {
                    "path": layers[layer_id]["target_path"],
                    "sha256": None,
                    "symbol": planned_symbol(node_id, node["domainspec_kind"]),
                    "target_state": "planned-absent-at-binding"
                }
            ]
        mapping = {
            "system_id": node["system_id"],
            "domainspec_selector": selector,
            "domainspec_kind": node["domainspec_kind"],
            "semantic_bindings": node["semantic_bindings"],
            "layer_id": layer_id,
            "coverage_state": coverage,
            "implementation_targets": targets,
            "conformance_status": "not_evaluable"
        }
        node_mappings.append(mapping)
        by_system_id[node["system_id"]] = mapping

    relation_mappings: list[dict[str, Any]] = []
    for relation in sorted(system["relations"], key=lambda item: item["system_relation_id"]):
        source = by_system_id[relation["source_system_id"]]
        target = by_system_id[relation["target_system_id"]]
        existing_pair = source["coverage_state"] == target["coverage_state"] == "existing-symbol-candidate"
        relation_mappings.append({
            "system_relation_id": relation["system_relation_id"],
            "domainspec_edge_id": relation["domainspec_edge_id"],
            "relationship": relation["relationship"],
            "source_system_id": relation["source_system_id"],
            "target_system_id": relation["target_system_id"],
            "semantic_bindings": relation["semantic_bindings"],
            "coverage_state": "existing-composition-candidate" if existing_pair else "planned-integration",
            "source_layer_id": source["layer_id"],
            "target_layer_id": target["layer_id"],
            "required_test_target": {
                "path": policy["planned_test_path"],
                "sha256": None,
                "test": f"relation_{snake(relation['domainspec_edge_id'])}",
                "target_state": "planned-absent-at-binding"
            },
            "conformance_status": "not_evaluable"
        })

    proof_mappings = []
    for proof in sorted(system["proof_obligations"], key=lambda item: item["proof_requirement_id"]):
        selectors = [f"{system['nodes'][0]['domainspec_selector'].split(':', 1)[0]}:{node_id}" for node_id in proof["domainspec_nodes"]]
        require(all(any(item["domainspec_selector"] == selector for item in node_mappings) for selector in selectors), f"proof selector missing: {proof['proof_requirement_id']}")
        proof_mappings.append({
            "proof_requirement_id": proof["proof_requirement_id"],
            "bound_selectors": selectors,
            "evidence_state": "not_evaluable",
            "causal_blocker": "The system ontology is admitted, but no accepted Rust binding, successor implementation bytes, environment-bounded observation, or conformance decision exists.",
            "required_test_target": {
                "path": policy["planned_test_path"],
                "sha256": None,
                "test": f"proof_{snake(proof['proof_requirement_id'])}",
                "target_state": "planned-absent-at-binding"
            }
        })

    boundary_bindings = []
    system_boundaries = sorted(system["boundaries"])
    require(set(system_boundaries) == set(policy["boundary_layers"]), "boundary policy does not close over system ontology")
    for boundary in system_boundaries:
        layer_ids = policy["boundary_layers"][boundary]
        require(all(layer_id in layers for layer_id in layer_ids), f"unknown boundary layer: {boundary}")
        boundary_bindings.append({"boundary_id": boundary, "layer_ids": layer_ids, "conformance_status": "not_evaluable"})

    existing_count = sum(item["coverage_state"] == "existing-symbol-candidate" for item in node_mappings)
    relation_existing_count = sum(item["coverage_state"] == "existing-composition-candidate" for item in relation_mappings)
    return {
        "schema_version": "cav2-kep-sol2-rust-implementation-binding/v1-candidate",
        "binding_id": policy["binding_id"],
        "route_id": policy["route_id"],
        "lifecycle_status": "authored-candidate",
        "source_authorization": policy["source_authorization"],
        "policy": {
            "policy_id": policy["policy_id"],
            "path": "../policy.json",
            "sha256": sha256_file(POLICY_PATH)
        },
        "admitted_predecessor": {
            "decision_id": decision["decision_id"],
            "decision_path": "../../../decisions/system-ontology-admission-001.json",
            "decision_sha256": policy["admitted_predecessor"]["decision_sha256"],
            "system_ontology_id": system["ontology_id"],
            "system_ontology_path": "../../../domainspec/generated/system-ontology.json",
            "system_ontology_sha256": policy["admitted_predecessor"]["system_ontology_sha256"],
            "compiled_graph_id": graph["graph_id"],
            "compiled_graph_path": "../../../domainspec/generated/compiled-graph.json",
            "compiled_graph_sha256": policy["admitted_predecessor"]["compiled_graph_sha256"],
            "admitted_candidate_set_digest": policy["admitted_predecessor"]["candidate_set_digest"]
        },
        "implementation_substrate": {
            "language": policy["rust_substrate"]["language"],
            "edition": policy["rust_substrate"]["edition"],
            "crate": policy["rust_substrate"]["crate"],
            "files": policy["rust_substrate"]["files"],
            "existing_binding": {
                "path": policy["rust_substrate"]["existing_binding_path"],
                "sha256": policy["rust_substrate"]["existing_binding_sha256"],
                "posture": policy["rust_substrate"]["existing_binding_posture"]
            },
            "mutation_effect": "none"
        },
        "implementation_layers": policy["layers"],
        "planned_module_root": {
            "path": policy["planned_module_root"],
            "sha256": None,
            "target_state": "planned-absent-at-binding"
        },
        "planned_test_surface": {
            "path": policy["planned_test_path"],
            "sha256": None,
            "target_state": "planned-absent-at-binding"
        },
        "boundary_bindings": boundary_bindings,
        "node_mappings": node_mappings,
        "relation_mappings": relation_mappings,
        "proof_mappings": proof_mappings,
        "coverage": {
            "system_nodes_total": len(node_mappings),
            "existing_symbol_candidates": existing_count,
            "planned_extension_nodes": len(node_mappings) - existing_count,
            "system_relations_total": len(relation_mappings),
            "existing_composition_candidates": relation_existing_count,
            "planned_integration_relations": len(relation_mappings) - relation_existing_count,
            "proof_obligations_total": len(proof_mappings),
            "proof_obligations_not_evaluable": len(proof_mappings),
            "boundaries_total": len(boundary_bindings)
        },
        "acceptance_gate": {
            "binding_acceptance": "not_evaluable",
            "causal_blocker": "This candidate requires owner review of its exact digest before it can authorize successor implementation work.",
            "implementation": "not-authorized",
            "conformance": "not_evaluable",
            "runtime_evidence": "not_evaluable"
        },
        "successor_authorization": {
            "binding_acceptance": "not-authorized-by-this-candidate",
            "implementation": "not-authorized",
            "credentials_or_wallets": "not-authorized",
            "devnet_transaction": "not-authorized",
            "publication": "not-authorized",
            "deployment": "not-authorized"
        },
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Exact Rust implementation-binding candidate only. Existing symbols are reuse candidates, planned targets are absent, and every conformance claim remains not_evaluable; no implementation, acceptance, cryptographic security, storage realization, Solana execution, publication, release, deployment, or external effect."
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        raw = canonical_bytes(build_binding())
        if args.check:
            require(OUTPUT_PATH.is_file(), f"missing generated binding: {OUTPUT_PATH}")
            require(OUTPUT_PATH.read_bytes() == raw, "generated binding drift")
            mode = "check"
        else:
            OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
            OUTPUT_PATH.write_bytes(raw)
            mode = "write"
        print(json.dumps({
            "schema_version": "cav2-kep-sol2-rust-binding-author-command/v1",
            "result": "pass",
            "mode": mode,
            "binding_id": json.loads(raw)["binding_id"],
            "sha256": sha256_bytes(raw),
            "authority_effect": "none",
            "implementation_effect": "none",
            "external_effect": "none"
        }, indent=2))
        return 0
    except (BindingError, KeyError, ValueError, OSError) as exc:
        print(json.dumps({"result": "fail", "error": str(exc), "authority_effect": "none"}, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
