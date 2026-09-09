#!/usr/bin/env python3
"""Bind exact implementation bytes to the generated hosted system ontology."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
REPOSITORY = ROOT.parents[6]
OUTPUT = ROOT / "implementation-binding.json"
SOURCE_ASSETS = [
    REPOSITORY / "arcanum/docs/assets/cyberalchemy-mark.svg",
    REPOSITORY / "arcanum/docs/assets/cyberalchemy-orb-imagegen-v1.png",
]
SYSTEM_ADMISSION = VERTICAL / "decisions/system-ontology-admission-001.json"
SYSTEM_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
SYSTEM_CANDIDATE_SHA256 = "37b5b8531e13058bc39a61ee7572ea3059376cd54851f9717f19e02de2359aa4"
SYSTEM_CANDIDATE_SET_DIGEST = "8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f"

NODE_BINDINGS = {
    "access-projection": ["src/model.rs", "src/api.rs", "src/store.rs", "tests/third_party_vertical.rs"],
    "bound-solana-program": ["ui-src/protocol.js", "src/finality.rs", "tests/third_party_vertical.rs"],
    "ciphertext-repository": ["src/store.rs", "migrations/001_hosted_exchange.sql", "tests/postgres_persistence.rs"],
    "devnet-finality-observer": ["src/finality.rs", "src/bin/observe.rs", "tests/third_party_vertical.rs"],
    "encrypted-artifact": ["src/model.rs", "src/api.rs", "ui-src/protocol.js", "tests/third_party_vertical.rs"],
    "hosted-exchange-api": ["src/api.rs", "src/bin/server.rs", "tests/third_party_vertical.rs"],
    "hosted-grant": ["src/api.rs", "src/auth.rs", "src/model.rs", "tests/third_party_vertical.rs"],
    "hosted-reissue": ["src/api.rs", "src/auth.rs", "src/model.rs", "tests/third_party_vertical.rs"],
    "knowledge-identity": ["src/model.rs", "src/api.rs", "src/auth.rs", "tests/third_party_vertical.rs"],
    "participant-workbench": ["ui-src/app.js", "ui-src/protocol.js", "ui-src/app.test.js", "static/index.html"],
    "third-party-flow": ["tests/third_party_vertical.rs", "ui-src/app.test.js"],
    "wallet-signature-verifier": ["src/auth.rs", "src/api.rs", "tests/third_party_vertical.rs"],
}

EDGE_BINDINGS = {
    "api-observes-devnet-finality": ["src/api.rs", "src/finality.rs", "tests/third_party_vertical.rs"],
    "api-persists-ciphertext": ["src/api.rs", "src/store.rs", "tests/postgres_persistence.rs"],
    "api-verifies-wallet-signature": ["src/api.rs", "src/auth.rs", "tests/third_party_vertical.rs"],
    "finality-observer-reads-program": ["src/finality.rs", "src/bin/observe.rs"],
    "grant-produces-access": ["src/api.rs", "tests/third_party_vertical.rs"],
    "grant-reads-artifact": ["src/api.rs", "src/model.rs", "tests/third_party_vertical.rs"],
    "grant-reads-identity": ["src/api.rs", "src/model.rs", "tests/third_party_vertical.rs"],
    "reissue-preserves-access": ["src/api.rs", "tests/third_party_vertical.rs"],
    "third-party-tests-grant": ["tests/third_party_vertical.rs"],
    "third-party-tests-reissue": ["tests/third_party_vertical.rs"],
    "workbench-calls-api": ["ui-src/app.js", "ui-src/protocol.js", "ui-src/app.test.js"],
    "workbench-seals-artifact": ["ui-src/protocol.js", "ui-src/app.test.js"],
    "workbench-submits-devnet-instruction": ["ui-src/protocol.js", "ui-src/app.js", "ui-src/app.test.js"],
}

RUNTIME_CONSTRAINT_BINDINGS = {
    "devnet-only": ["src/finality.rs", "ui-src/protocol.js", "tests/third_party_vertical.rs"],
    "finalized-observation-only": ["src/finality.rs", "src/api.rs", "tests/third_party_vertical.rs"],
    "client-held-secret-material": ["ui-src/protocol.js", "ui-src/app.test.js", "tests/third_party_vertical.rs"],
    "ciphertext-only-persistence": ["src/model.rs", "src/store.rs", "migrations/001_hosted_exchange.sql", "tests/postgres_persistence.rs"],
    "no-hosted-transaction-signer": ["src/finality.rs", "src/api.rs", "tests/third_party_vertical.rs"],
    "no-knowledge-consideration": ["src/api.rs", "src/auth.rs", "tests/third_party_vertical.rs"],
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def material_files() -> list[Path]:
    fixed = [ROOT / name for name in ("Cargo.toml", "Cargo.lock", "package.json", "package-lock.json", "README.md", "Dockerfile", "compose.yaml", ".dockerignore", ".gitignore")]
    discovered: list[Path] = []
    for directory in ("src", "migrations", "static", "tests", "ui-src"):
        discovered.extend(path for path in (ROOT / directory).rglob("*") if path.is_file())
    return sorted(fixed + discovered, key=lambda path: str(path.relative_to(ROOT)))


def build() -> dict:
    files = material_files()
    digest = hashlib.sha256()
    records = []
    for path in files:
        relative = str(path.relative_to(ROOT))
        value = path.read_bytes()
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(value)
        digest.update(b"\0")
        records.append({"path": relative, "sha256": hashlib.sha256(value).hexdigest()})
    source_assets = []
    for path in SOURCE_ASSETS:
        relative = str(path.relative_to(REPOSITORY))
        value = path.read_bytes()
        digest.update(b"source-asset\0")
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(value)
        digest.update(b"\0")
        source_assets.append({"path": relative, "sha256": hashlib.sha256(value).hexdigest()})
    system = VERTICAL / "domainspec/generated/system-ontology.json"
    graph = VERTICAL / "domainspec/generated/compiled-graph.json"
    bridge = VERTICAL / "domainspec/generated/bridge.json"
    admission = json.loads(SYSTEM_ADMISSION.read_text())
    if sha(SYSTEM_ADMISSION) != SYSTEM_ADMISSION_SHA256:
        raise ValueError("system ontology admission decision digest drifted")
    if admission.get("admission", {}).get("lifecycle_status") != "admitted":
        raise ValueError("system ontology admission is not admitted")
    if admission.get("admission", {}).get("admitted_candidate_sha256") != SYSTEM_CANDIDATE_SHA256:
        raise ValueError("admitted system ontology candidate digest mismatch")
    if admission.get("admission", {}).get("admitted_candidate_set_digest") != SYSTEM_CANDIDATE_SET_DIGEST:
        raise ValueError("admitted system ontology candidate-set digest mismatch")

    graph_value = json.loads(graph.read_text())
    system_value = json.loads(system.read_text())
    graph_nodes = {item["node_id"] for item in graph_value["nodes"]}
    graph_edges = {item["edge_id"] for item in graph_value["edges"]}
    constraints = set(system_value["runtime_constraints"])
    if graph_nodes != set(NODE_BINDINGS):
        raise ValueError("graph node selector bindings are incomplete or stale")
    if graph_edges != set(EDGE_BINDINGS):
        raise ValueError("graph edge selector bindings are incomplete or stale")
    if constraints != set(RUNTIME_CONSTRAINT_BINDINGS):
        raise ValueError("runtime constraint selector bindings are incomplete or stale")
    material_paths = {item["path"] for item in records}
    referenced_paths = {
        path
        for mapping in (NODE_BINDINGS, EDGE_BINDINGS, RUNTIME_CONSTRAINT_BINDINGS)
        for paths in mapping.values()
        for path in paths
    }
    if not referenced_paths <= material_paths:
        raise ValueError("selector binding references material outside the exact implementation set")
    return {
        "schema_version": "cav2-kep-hosted-implementation-binding/v1",
        "binding_id": "CA2-D65-KEP-HOSTED-DEVNET-RUST-001",
        "capability_id": "CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE",
        "system_ontology_id": "CA2-SYSTEM-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE",
        "compiled_graph_sha256": sha(graph),
        "system_ontology_sha256": sha(system),
        "bridge_sha256": sha(bridge),
        "system_ontology_admission": {
            "decision_id": admission["decision_id"],
            "path": "../decisions/system-ontology-admission-001.json",
            "sha256": SYSTEM_ADMISSION_SHA256,
            "admitted_candidate_sha256": SYSTEM_CANDIDATE_SHA256,
            "admitted_candidate_set_digest": SYSTEM_CANDIDATE_SET_DIGEST,
            "lifecycle_status": "admitted",
        },
        "selector_bindings": {
            "graph_nodes": [
                {"selector": selector, "implementation_paths": NODE_BINDINGS[selector]}
                for selector in sorted(NODE_BINDINGS)
            ],
            "graph_edges": [
                {"selector": selector, "implementation_paths": EDGE_BINDINGS[selector]}
                for selector in sorted(EDGE_BINDINGS)
            ],
            "runtime_constraints": [
                {"selector": selector, "implementation_paths": RUNTIME_CONSTRAINT_BINDINGS[selector]}
                for selector in sorted(RUNTIME_CONSTRAINT_BINDINGS)
            ],
        },
        "implementation_material_sha256": digest.hexdigest(),
        "files": records,
        "source_assets": source_assets,
        "test_command": "cargo test --manifest-path implementation/Cargo.toml --test third_party_vertical -- --nocapture",
        "status": "implemented-candidate-not-accepted",
        "authority_effect": "none",
        "claim_limit": "Exact Rust, browser-client, SQL and container mapping candidate; no admission, deployment, credential use, transaction submission, publication or external effect."
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    value = (json.dumps(build(), indent=2, sort_keys=True) + "\n").encode()
    if args.check:
        current = OUTPUT.read_bytes() if OUTPUT.is_file() else b""
        result = "PASS" if current == value else "FAIL"
        print(json.dumps({"result":result,"binding":"CA2-D65-KEP-HOSTED-DEVNET-RUST-001","authority_effect":"none"}, indent=2))
        return 0 if current == value else 1
    OUTPUT.write_bytes(value)
    print(json.dumps({"result":"PASS","output":str(OUTPUT),"authority_effect":"none"}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
