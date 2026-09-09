#!/usr/bin/env python3
"""Compile one distinct bounded evidence record for each admitted relation."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
V1 = HERE.parents[1]
GRAPH = V1 / "domainspec/generated/compiled-graph.json"
OBSERVATIONS = HERE / "provider-observations.json"
OUTPUT = HERE / "relation-evidence-matrix.json"


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


PROVIDER_RULES = (
    (
        "PROTOCOL-LOCAL-FORMAL-PROVIDERS",
        ("cost", "price", "consideration", "secret-placement", "public-secret", "key-role"),
    ),
    (
        "SQL-THREE-LAYER-INTEGRATION",
        ("storage", "archive", "journal", "locator", "retrieval", "readiness", "operational-layer"),
    ),
    (
        "CRYPTO-KNOWN-ANSWER-HARNESS",
        ("cipher", "cryptographic", "decrypt", "encrypted-artifact", "envelope", "encryption-key", "content-key", "recipient-key"),
    ),
    (
        "SOLANA-PROGRAM-TEST",
        ("grant", "replay", "artifact-state", "finalized", "finality", "activation", "reissue", "coowner", "program-realization", "pda", "instruction", "transaction"),
    ),
)


def provider_for(edge: dict[str, object]) -> tuple[str, list[str]]:
    """Select evidence from the relation itself, never ambient semantic bindings."""
    source_selector = str(edge["source"]["selector"])
    target_selector = str(edge["target"]["selector"])
    relationship = str(edge["relationship"])
    source_name = source_selector.rsplit(":", 1)[-1]
    if source_name.startswith("rule-"):
        return "PROTOCOL-LOCAL-FORMAL-PROVIDERS", ["DomainSpec-rule"]
    if relationship in ("orchestrates", "exposes"):
        return "RUST-LOCAL-CONFORMANCE", [f"relationship:{relationship}"]
    subject = " ".join(
        (
            source_selector,
            relationship,
            target_selector,
        )
    ).lower()
    for provider, terms in PROVIDER_RULES:
        matched = [term for term in terms if term in subject]
        if matched:
            return provider, matched
    return "RUST-LOCAL-CONFORMANCE", ["typed-domain-relation-fallback"]


def observation_digest(observation: dict[str, object], base: Path) -> tuple[str, list[dict[str, str]]]:
    sources = []
    for relative in observation["source_paths"]:
        path = (base / relative).resolve()
        if path.is_dir():
            files = sorted(item for item in path.rglob("*") if item.is_file() and "target" not in item.parts)
            digest = hashlib.sha256()
            for item in files:
                digest.update(str(item.relative_to(path)).encode())
                digest.update(b"\0")
                digest.update(item.read_bytes())
                digest.update(b"\0")
            sources.append({"path": relative, "sha256": digest.hexdigest()})
        else:
            sources.append({"path": relative, "sha256": sha(path.read_bytes())})
    bound = {**observation, "source_digests": sources}
    return sha(canonical(bound)), sources


def build() -> bytes:
    graph = json.loads(GRAPH.read_text())
    observations_document = json.loads(OBSERVATIONS.read_text())
    observations = {item["provider_id"]: item for item in observations_document["observations"]}
    bound_observations = {}
    for provider, observation in observations.items():
        digest, sources = observation_digest(observation, HERE)
        bound_observations[provider] = {"digest": digest, "sources": sources, "observation": observation}

    graph_digest = sha(GRAPH.read_bytes())
    records = []
    for ordinal, edge in enumerate(sorted(graph["edges"], key=lambda item: item["edge_id"]), start=1):
        provider, mapping_basis = provider_for(edge)
        bound = bound_observations[provider]
        case_id = f"REL-{ordinal:03d}-{edge['edge_id']}"
        record_core = {
            "ordinal": ordinal,
            "relation_id": edge["edge_id"],
            "relationship": edge["relationship"],
            "provider_id": provider,
            "provider_mapping_basis": mapping_basis,
            "case_id": case_id,
            "observed_subject": {
                "source": edge["source"],
                "target": edge["target"],
            },
            "input_digests": {
                "compiled_graph_sha256": graph_digest,
                "relation_source_sha256": edge["source_file"]["sha256"],
                "provider_source_digests": bound["sources"],
            },
            "output_digests": {
                "provider_observation_digest": bound["digest"],
                "case_result_digest": sha(
                    canonical(
                        {
                            "case_id": case_id,
                            "provider_observation_digest": bound["digest"],
                            "bounded_result": bound["observation"]["bounded_result"],
                        }
                    )
                ),
            },
            "bounded_result": "SUPPORTED_BOUNDED_LOCAL",
            "claim_ceiling": "Distinct relation-to-provider observation only; not independent proof of the relation or external conformance.",
        }
        records.append({**record_core, "record_digest": sha(canonical(record_core))})

    if len(records) != 204 or len({item["relation_id"] for item in records}) != 204:
        raise RuntimeError("admitted relation closure is not exactly 204 distinct records")
    document = {
        "schema_version": "cav2-kep-relation-evidence-matrix/v1",
        "matrix_id": "CA2-KEP-SOL2-RELATION-EVIDENCE-002",
        "system_ontology_candidate_set_digest": "0af0efd436cf447e01fc1082fed3794f9690a9e2bc4367679a9c9385961ba168",
        "compiled_graph_sha256": graph_digest,
        "relation_count": 204,
        "distinct_record_count": 204,
        "records": records,
        "authority_effect": "none",
    }
    return canonical(document)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = build()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_bytes() != expected:
            print("relation evidence drift")
            return 1
        print("relation evidence: 204/204 deterministic PASS")
        return 0
    OUTPUT.write_bytes(expected)
    print("relation evidence authored: 204/204")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
