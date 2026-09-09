#!/usr/bin/env python3
"""Deterministically compile the hosted Devnet DomainSpec source."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SPEC = ROOT / "specs" / "hosted-devnet-exchange"
GENERATED = ROOT / "generated"
REPO = ROOT.parents[6]
ONTOLOGY_ADMISSION_SHA256 = "409015aefa426abd0ceeb7438fa96b434a7e15e7d58c3feeb8209012ca2d6706"
ONTOLOGY_CANDIDATE_SHA256 = "d70444430addaf592efac682273898ce7d8856e0a9599c08a8d95a48b6c2f1a4"
ONTOLOGY_MATERIAL_DIGEST = "561fa9497a13a3b011908d703dbea5ebd4e21919a382ef2b408e6e8cc56a8c1d"


def canonical(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def load(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one JSON object")
    return value


def compile_outputs() -> dict[str, bytes]:
    project = load(ROOT / "project.json")
    binding = load(ROOT / "binding.json")
    feature = load(SPEC / "feature.json")
    nodes = [load(path) for path in sorted((SPEC / "nodes").glob("*.json"))]
    edges = [load(path) for path in sorted((SPEC / "edges").glob("*.json"))]
    node_ids = {node["node_id"] for node in nodes}
    if node_ids != set(feature["nodes"]):
        raise ValueError("feature node registry is not closed")
    if {edge["edge_id"] for edge in edges} != set(feature["edges"]):
        raise ValueError("feature edge registry is not closed")
    for edge in edges:
        if edge["source_node_id"] not in node_ids or edge["target_node_id"] not in node_ids:
            raise ValueError(f"edge endpoint is not closed: {edge['edge_id']}")

    ontology_binding = binding["predecessors"]["business_ontology_admission"]
    admission_path = (ROOT / ontology_binding["path"]).resolve()
    ontology_candidate_path = (ROOT / ontology_binding["ontology_candidate_path"]).resolve()
    if digest(admission_path.read_bytes()) != ONTOLOGY_ADMISSION_SHA256:
        raise ValueError("business ontology admission decision digest drift")
    if digest(ontology_candidate_path.read_bytes()) != ONTOLOGY_CANDIDATE_SHA256:
        raise ValueError("business ontology candidate digest drift")
    admission = load(admission_path)
    candidate = load(ontology_candidate_path)
    if admission.get("admission", {}).get("lifecycle_status") != "admitted":
        raise ValueError("business ontology predecessor is not admitted")
    if admission.get("admission", {}).get("admitted_material_digest") != ONTOLOGY_MATERIAL_DIGEST:
        raise ValueError("business ontology admitted material drift")
    if candidate.get("material_digest") != ONTOLOGY_MATERIAL_DIGEST:
        raise ValueError("business ontology candidate material drift")

    admission_ref = {
        "decision_id": ontology_binding["decision_id"],
        "decision_sha256": ONTOLOGY_ADMISSION_SHA256,
        "ontology_id": binding["ontology_id"],
        "ontology_candidate_sha256": ONTOLOGY_CANDIDATE_SHA256,
        "admitted_material_digest": ONTOLOGY_MATERIAL_DIGEST,
    }

    graph = {
        "schema_version": "domainspec.compiled-graph/v1",
        "project_id": project["project_id"],
        "construction_binding_id": binding["binding_id"],
        "business_ontology_admission": admission_ref,
        "features": [feature],
        "nodes": nodes,
        "edges": edges,
    }
    graph_bytes = canonical(graph)
    system = {
        "schema_version": "domainspec.system-ontology/v1",
        "ontology_id": "CA2-SYSTEM-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE",
        "source_graph_sha256": digest(graph_bytes),
        "source_binding_id": binding["binding_id"],
        "business_ontology_admission": admission_ref,
        "components": [node for node in nodes if node["kind"] in {"Service", "Component"}],
        "operations": [node for node in nodes if node["kind"] == "Operation"],
        "tests": [node for node in nodes if node["kind"] == "Test"],
        "runtime_constraints": [
            "devnet-only",
            "finalized-observation-only",
            "client-held-secret-material",
            "ciphertext-only-persistence",
            "no-hosted-transaction-signer",
            "no-knowledge-consideration"
        ],
        "authority_effect": "none"
    }
    system_bytes = canonical(system)
    bridge = {
        "schema_version": "cav2.business-system-bridge/v1",
        "bridge_id": "CA2-BRIDGE-KEP-HOSTED-DEVNET-EXCHANGE",
        "business_ontology_ref": "CA2-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE",
        "business_ontology_admission": admission_ref,
        "system_ontology_ref": system["ontology_id"],
        "links": [
            {"business_rule":"KEP-HOST-RULE-WALLET-SIGNATURE","system_nodes":["wallet-signature-verifier","hosted-exchange-api"],"test":"third-party-flow"},
            {"business_rule":"KEP-HOST-RULE-CLIENT-SECRETS","system_nodes":["hosted-exchange-api","ciphertext-repository"],"test":"third-party-flow"},
            {"business_rule":"KEP-HOST-RULE-PREPARED-NOT-ACTIVE","system_nodes":["hosted-grant","access-projection"],"test":"third-party-flow"},
            {"business_rule":"KEP-HOST-RULE-FINALIZED-ONLY","system_nodes":["devnet-finality-observer","hosted-grant"],"test":"third-party-flow"},
            {"business_rule":"KEP-HOST-RULE-REISSUE-PRESERVATION","system_nodes":["hosted-reissue","access-projection"],"test":"third-party-flow"}
        ],
        "authority_effect": "none"
    }
    bridge_bytes = canonical(bridge)

    source_paths = [ROOT / "project.json", ROOT / "binding.json", SPEC / "feature.json"]
    source_paths += sorted((SPEC / "nodes").glob("*.json"))
    source_paths += sorted((SPEC / "edges").glob("*.json"))
    dependency_paths = [admission_path, ontology_candidate_path]
    dependency_paths += [ontology_candidate_path.parent / item["path"] for item in candidate["artifacts"]]
    manifest = {
        "schema_version": "domainspec.source-manifest/v1",
        "files": [
            {"path": str(path.relative_to(ROOT)), "sha256": digest(path.read_bytes())}
            for path in source_paths
        ],
        "dependencies": [
            {"path": str(path.relative_to(REPO)), "sha256": digest(path.read_bytes())}
            for path in dependency_paths
        ],
    }
    manifest_bytes = canonical(manifest)
    receipt = {
        "schema_version": "domainspec.compilation-receipt/v1",
        "compiler": "hosted-devnet-exchange/compile.py",
        "source_manifest_sha256": digest(manifest_bytes),
        "compiled_graph_sha256": digest(graph_bytes),
        "system_ontology_sha256": digest(system_bytes),
        "bridge_sha256": digest(bridge_bytes),
        "business_ontology_admission_sha256": ONTOLOGY_ADMISSION_SHA256,
        "business_ontology_candidate_sha256": ONTOLOGY_CANDIDATE_SHA256,
        "business_ontology_material_digest": ONTOLOGY_MATERIAL_DIGEST,
        "result": "PASS",
        "authority_effect": "none"
    }
    return {
        "compiled-graph.json": graph_bytes,
        "system-ontology.json": system_bytes,
        "bridge.json": bridge_bytes,
        "source-manifest.json": manifest_bytes,
        "compilation-receipt.json": canonical(receipt),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = compile_outputs()
    if args.check:
        stale = [name for name, value in outputs.items() if not (GENERATED / name).is_file() or (GENERATED / name).read_bytes() != value]
        print(json.dumps({"result": "PASS" if not stale else "FAIL", "stale": stale, "authority_effect": "none"}, indent=2))
        return 1 if stale else 0
    GENERATED.mkdir(parents=True, exist_ok=True)
    for name, value in outputs.items():
        (GENERATED / name).write_bytes(value)
    print(json.dumps({"result": "PASS", "outputs": sorted(outputs), "authority_effect": "none"}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
