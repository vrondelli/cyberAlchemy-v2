#!/usr/bin/env python3
"""Bind the hosted protocol kernel without participant UI material."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
VERTICAL = ROOT.parent
OUTPUT = ROOT / "protocol-implementation-binding-record-001.json"
SYSTEM_ADMISSION = VERTICAL / "decisions/system-ontology-admission-001.json"
SYSTEM_ADMISSION_SHA256 = "7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677"
SYSTEM_CANDIDATE_SHA256 = "37b5b8531e13058bc39a61ee7572ea3059376cd54851f9717f19e02de2359aa4"
SYSTEM_CANDIDATE_SET_DIGEST = "8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f"

PROTOCOL_FILES = (
    "Cargo.lock",
    "Cargo.toml",
    "migrations/001_hosted_exchange.sql",
    "src/api.rs",
    "src/auth.rs",
    "src/bin/observe.rs",
    "src/bin/server.rs",
    "src/finality.rs",
    "src/lib.rs",
    "src/model.rs",
    "src/store.rs",
    "tests/postgres_persistence.rs",
    "tests/third_party_vertical.rs",
)

NODE_BINDINGS = {
    "access-projection": ["src/model.rs", "src/api.rs", "src/store.rs", "tests/third_party_vertical.rs"],
    "bound-solana-program": ["src/lib.rs", "src/finality.rs", "tests/third_party_vertical.rs"],
    "ciphertext-repository": ["src/store.rs", "migrations/001_hosted_exchange.sql", "tests/postgres_persistence.rs"],
    "devnet-finality-observer": ["src/finality.rs", "src/bin/observe.rs", "tests/third_party_vertical.rs"],
    "encrypted-artifact": ["src/model.rs", "src/api.rs", "tests/third_party_vertical.rs"],
    "hosted-exchange-api": ["src/api.rs", "src/bin/server.rs", "tests/third_party_vertical.rs"],
    "hosted-grant": ["src/api.rs", "src/auth.rs", "src/model.rs", "tests/third_party_vertical.rs"],
    "hosted-reissue": ["src/api.rs", "src/auth.rs", "src/model.rs", "tests/third_party_vertical.rs"],
    "knowledge-identity": ["src/model.rs", "src/api.rs", "src/auth.rs", "tests/third_party_vertical.rs"],
    "third-party-flow": ["tests/third_party_vertical.rs"],
    "wallet-signature-verifier": ["src/auth.rs", "src/api.rs", "tests/third_party_vertical.rs"],
}

EDGE_BINDINGS = {
    "api-observes-devnet-finality": ["src/api.rs", "src/finality.rs", "tests/third_party_vertical.rs"],
    "api-persists-ciphertext": ["src/api.rs", "src/store.rs", "tests/postgres_persistence.rs"],
    "api-verifies-wallet-signature": ["src/api.rs", "src/auth.rs", "tests/third_party_vertical.rs"],
    "finality-observer-reads-program": ["src/finality.rs", "src/bin/observe.rs", "src/lib.rs"],
    "grant-produces-access": ["src/api.rs", "tests/third_party_vertical.rs"],
    "grant-reads-artifact": ["src/api.rs", "src/model.rs", "tests/third_party_vertical.rs"],
    "grant-reads-identity": ["src/api.rs", "src/model.rs", "tests/third_party_vertical.rs"],
    "reissue-preserves-access": ["src/api.rs", "tests/third_party_vertical.rs"],
    "third-party-tests-grant": ["tests/third_party_vertical.rs"],
    "third-party-tests-reissue": ["tests/third_party_vertical.rs"],
}

RUNTIME_CONSTRAINT_BINDINGS = {
    "devnet-only": ["src/lib.rs", "src/finality.rs", "tests/third_party_vertical.rs"],
    "finalized-observation-only": ["src/finality.rs", "src/api.rs", "tests/third_party_vertical.rs"],
    "client-held-secret-material": ["src/lib.rs", "src/api.rs", "src/model.rs", "tests/third_party_vertical.rs"],
    "ciphertext-only-persistence": ["src/model.rs", "src/store.rs", "migrations/001_hosted_exchange.sql", "tests/postgres_persistence.rs"],
    "no-hosted-transaction-signer": ["src/finality.rs", "src/api.rs", "tests/third_party_vertical.rs"],
    "no-knowledge-consideration": ["src/api.rs", "src/auth.rs", "tests/third_party_vertical.rs"],
}

EXCLUDED_SELECTORS = {
    "graph_nodes": {
        "participant-workbench": "Optional UI delivery is outside the protocol-kernel implementation and default Cargo build."
    },
    "graph_edges": {
        "workbench-calls-api": "Participant UI behavior is outside this protocol-kernel binding.",
        "workbench-seals-artifact": "Client-side sealing behavior is outside this protocol-kernel binding.",
        "workbench-submits-devnet-instruction": "Participant transaction construction is outside this protocol-kernel binding.",
    },
    "runtime_constraints": {},
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build() -> dict:
    paths = [ROOT / relative for relative in PROTOCOL_FILES]
    missing = [str(path) for path in paths if not path.is_file()]
    if missing:
        raise ValueError(f"missing protocol implementation files: {missing}")

    digest = hashlib.sha256()
    records = []
    for relative, path in zip(PROTOCOL_FILES, paths, strict=True):
        value = path.read_bytes()
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(value)
        digest.update(b"\0")
        records.append({"path": relative, "sha256": hashlib.sha256(value).hexdigest()})

    admission = json.loads(SYSTEM_ADMISSION.read_text())
    if sha(SYSTEM_ADMISSION) != SYSTEM_ADMISSION_SHA256:
        raise ValueError("system ontology admission decision digest drifted")
    if admission.get("admission", {}).get("lifecycle_status") != "admitted":
        raise ValueError("system ontology admission is not admitted")
    if admission.get("admission", {}).get("admitted_candidate_sha256") != SYSTEM_CANDIDATE_SHA256:
        raise ValueError("admitted system ontology candidate digest mismatch")
    if admission.get("admission", {}).get("admitted_candidate_set_digest") != SYSTEM_CANDIDATE_SET_DIGEST:
        raise ValueError("admitted system ontology candidate-set digest mismatch")

    graph_path = VERTICAL / "domainspec/generated/compiled-graph.json"
    system_path = VERTICAL / "domainspec/generated/system-ontology.json"
    bridge_path = VERTICAL / "domainspec/generated/bridge.json"
    graph = json.loads(graph_path.read_text())
    system = json.loads(system_path.read_text())
    actual = {
        "graph_nodes": {item["node_id"] for item in graph["nodes"]},
        "graph_edges": {item["edge_id"] for item in graph["edges"]},
        "runtime_constraints": set(system["runtime_constraints"]),
    }
    bound = {
        "graph_nodes": set(NODE_BINDINGS),
        "graph_edges": set(EDGE_BINDINGS),
        "runtime_constraints": set(RUNTIME_CONSTRAINT_BINDINGS),
    }
    for kind in actual:
        excluded = set(EXCLUDED_SELECTORS[kind])
        if bound[kind] & excluded:
            raise ValueError(f"{kind} cannot be both bound and excluded")
        if actual[kind] != bound[kind] | excluded:
            raise ValueError(f"{kind} binding/exclusion partition is incomplete or stale")

    material_paths = set(PROTOCOL_FILES)
    referenced = {
        path
        for mapping in (NODE_BINDINGS, EDGE_BINDINGS, RUNTIME_CONSTRAINT_BINDINGS)
        for paths in mapping.values()
        for path in paths
    }
    if not referenced <= material_paths:
        raise ValueError("selector binding references material outside the protocol set")
    forbidden_prefixes = ("static/", "ui-src/")
    if any(path.startswith(forbidden_prefixes) or path == "src/ui.rs" for path in material_paths):
        raise ValueError("UI material entered the protocol binding")

    return {
        "schema_version": "cav2-kep-hosted-protocol-implementation-binding/v1",
        "binding_id": "CA2-D65-KEP-HOSTED-DEVNET-PROTOCOL-001",
        "route_id": "CA2-ROUTE-IMPLEMENT",
        "capability_id": "CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE",
        "binding_scope": "protocol-kernel-without-participant-ui",
        "system_ontology_id": "CA2-SYSTEM-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE",
        "compiled_graph_sha256": sha(graph_path),
        "system_ontology_sha256": sha(system_path),
        "bridge_sha256": sha(bridge_path),
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
        "excluded_selectors": {
            kind: [
                {"selector": selector, "reason": reason}
                for selector, reason in sorted(EXCLUDED_SELECTORS[kind].items())
            ]
            for kind in EXCLUDED_SELECTORS
        },
        "implementation_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
        "implementation_material_sha256": digest.hexdigest(),
        "files": records,
        "source_assets": [],
        "default_build_features": [],
        "excluded_material": ["src/ui.rs", "static/**", "ui-src/**", "tests/interface_assets.rs", "package.json", "package-lock.json"],
        "test_commands": [
            "cargo test --manifest-path implementation/Cargo.toml --no-default-features --test third_party_vertical -- --nocapture",
            "cargo test --manifest-path implementation/Cargo.toml --no-default-features --test postgres_persistence -- --nocapture",
        ],
        "status": "implemented-protocol-candidate-not-accepted",
        "authority_effect": "none",
        "claim_limit": "Exact default-feature Rust and SQL protocol-kernel mapping candidate. Participant UI, UI selectors, acceptance, full hosted-capability conformance, deployment, credentials, transaction submission, publication, and external effects are excluded.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    value = (json.dumps(build(), indent=2, sort_keys=True) + "\n").encode()
    if args.check:
        current = OUTPUT.read_bytes() if OUTPUT.is_file() else b""
        result = "PASS" if current == value else "FAIL"
        print(json.dumps({"result": result, "binding": "CA2-D65-KEP-HOSTED-DEVNET-PROTOCOL-001", "authority_effect": "none"}, indent=2))
        return 0 if current == value else 1
    OUTPUT.write_bytes(value)
    print(json.dumps({"result": "PASS", "output": str(OUTPUT), "authority_effect": "none"}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
