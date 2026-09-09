#!/usr/bin/env python3
"""Deterministic admitted-source compiler for Durable Storage DomainSpec v2."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import tempfile
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
ADMISSION = ROOT.parent / "decisions/domainspec-source-admission-001.json"
GENERATED = ROOT / "generated"
ROLE = {"Entity": "stateful-record", "Value Object": "immutable-value", "Policy": "decision-policy", "Operation": "bounded-operation", "Rule": "enforced-invariant", "Event": "observed-outcome", "State Machine": "lifecycle-model", "Interface": "capability-boundary", "Mapping": "semantic-projection"}


class CompileError(Exception):
    pass


def canonical(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text())
    if not isinstance(value, dict):
        raise CompileError(f"object required: {path}")
    return value


def preflight(source_root: Path) -> dict[str, Any]:
    spec = importlib.util.spec_from_file_location("dst_domainspec_validate_for_compile", ROOT / "validate.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    result = module.validate(source_root, native=False)
    if result.get("result") != "pass" or result.get("authority_effect") != "none":
        raise CompileError(f"source preflight failed: {json.dumps(result, sort_keys=True)}")
    return result


def source_paths(source_root: Path) -> list[str]:
    binding = load(source_root / "binding.json")
    feature_id = binding["feature_id"]
    feature = load(source_root / f"specs/{feature_id}/feature.json")
    return ["binding.json", "project.json", f"specs/{feature_id}/feature.json", *[f"specs/{feature_id}/nodes/{x}.json" for x in feature["nodes"]], *[f"specs/{feature_id}/edges/{x}.json" for x in feature["edges"]]]


def build(source_root: Path = ROOT, admission_path: Path = ADMISSION) -> dict[str, bytes]:
    source_root = source_root.resolve()
    admission = load(admission_path)
    result = preflight(source_root)
    binding = load(source_root / "binding.json")
    subject = admission.get("subject", {})
    admitted = admission.get("admission", {})
    if admission.get("route_id") != "CA2-ROUTE-IMPLEMENT" or admitted.get("lifecycle_status") != "admitted":
        raise CompileError("DomainSpec source is not admitted")
    if subject.get("binding_sha256") != sha_file(source_root / "binding.json"):
        raise CompileError("admitted binding digest drift")
    if admitted.get("admitted_candidate_material_digest") != result.get("candidate_material_digest"):
        raise CompileError("admitted source material digest drift")
    paths = source_paths(source_root)
    entries = [{"path": p, "sha256": sha_file(source_root / p), "size_bytes": (source_root / p).stat().st_size} for p in sorted(paths)]
    feature_id = binding["feature_id"]
    feature = load(source_root / f"specs/{feature_id}/feature.json")
    nodes = [load(source_root / f"specs/{feature_id}/nodes/{node}.json") for node in feature["nodes"]]
    edges = [load(source_root / f"specs/{feature_id}/edges/{edge}.json") for edge in feature["edges"]]
    reverse = {node["node_id"]: {"definition_ids": [], "ontology_node_ids": [], "ontology_rule_ids": [], "proof_requirement_ids": []} for node in nodes}
    for registry, target in [("definition_mappings", "definition_ids"), ("ontology_node_mappings", "ontology_node_ids"), ("ontology_rule_mappings", "ontology_rule_ids"), ("proof_requirement_mappings", "proof_requirement_ids")]:
        for semantic_id, raw in binding[registry].items():
            for node_id in raw if isinstance(raw, list) else [raw]:
                reverse[node_id][target].append(semantic_id)
    for value in reverse.values():
        for ids in value.values():
            ids.sort()
    compiled_nodes = [{"selector": f"{feature_id}:{n['node_id']}", "node_id": n["node_id"], "kind": n["kind"], "body": n["body"], "semantic_bindings": reverse[n["node_id"]], "source_sha256": sha_file(source_root / f"specs/{feature_id}/nodes/{n['node_id']}.json")} for n in nodes]
    compiled_edges = [{"edge_id": e["edge_id"], "relationship": e["relationship"], "source_selector": f"{feature_id}:{e['source_node_id']}", "target_selector": f"{feature_id}:{e['target_node_id']}", "source_sha256": sha_file(source_root / f"specs/{feature_id}/edges/{e['edge_id']}.json")} for e in edges]
    manifest = {"schema_version": "cav2-domainspec-source-manifest/v1", "source_admission_sha256": sha_file(admission_path), "candidate_material_digest": result["candidate_material_digest"], "entries": entries}
    graph = {"schema_version": "cav2-compiled-graph/v1", "graph_id": "CA2-GRAPH-KEP-DURABLE-STORAGE-001", "source_manifest_sha256": sha_bytes(canonical(manifest)), "nodes": compiled_nodes, "edges": compiled_edges}
    system_nodes = [{"system_id": f"CA2-SYS-KEP-DST-{n['node_id'].upper()}", "selector": n["selector"], "role": ROLE[n["kind"]], "semantic_bindings": n["semantic_bindings"], "body": n["body"]} for n in compiled_nodes]
    ontology = {"schema_version": "cav2-system-ontology/v1", "ontology_id": "CA2-SYSTEM-ONTOLOGY-KEP-DURABLE-STORAGE", "provider_selection": "none", "compiled_graph_sha256": sha_bytes(canonical(graph)), "systems": system_nodes, "relations": compiled_edges, "claim_ceiling": "Deterministic system meaning only; no provider, runtime, deployment, availability claim, or external effect."}
    outputs = {"source-manifest.json": canonical(manifest), "compiled-graph.json": canonical(graph), "system-ontology.json": canonical(ontology)}
    receipt = {"schema_version": "cav2-deterministic-compilation-receipt/v1", "compiler_sha256": sha_file(ROOT / "compile.py"), "source_admission_sha256": sha_file(admission_path), "outputs": [{"path": p, "sha256": sha_bytes(v)} for p, v in sorted(outputs.items())], "counts": {"nodes": len(nodes), "edges": len(edges)}, "result": "PASS", "authority_effect": "none", "external_effect": "none"}
    outputs["compilation-receipt.json"] = canonical(receipt)
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        outputs = build()
        if args.check:
            drift = [name for name, value in outputs.items() if not (GENERATED / name).is_file() or (GENERATED / name).read_bytes() != value]
            if drift:
                raise CompileError(f"generated output drift: {drift}")
        else:
            GENERATED.mkdir(parents=True, exist_ok=True)
            for name, value in outputs.items():
                fd, temporary = tempfile.mkstemp(dir=GENERATED, prefix=f".{name}.")
                try:
                    with os.fdopen(fd, "wb") as handle:
                        handle.write(value)
                    os.replace(temporary, GENERATED / name)
                finally:
                    if os.path.exists(temporary):
                        os.unlink(temporary)
        print(json.dumps({"result": "PASS", "mode": "check" if args.check else "write", "outputs": {name: sha_bytes(value) for name, value in sorted(outputs.items())}, "authority_effect": "none", "external_effect": "none"}, indent=2, sort_keys=True))
        return 0
    except Exception as exc:
        print(json.dumps({"result": "BLOCK", "error": str(exc), "authority_effect": "none", "external_effect": "none"}, indent=2, sort_keys=True))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
