#!/usr/bin/env python3
"""Materialize the deterministic Durable Storage business-ontology candidate."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MATERIAL_FILES = (
    "README.md",
    "definition-bindings.json",
    "nodes.json",
    "premises.json",
    "profile.json",
    "proof-requirements.json",
    "relations.json",
    "residue.json",
    "rules.json",
    "schema.json",
    "sources.json",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(relative: str) -> dict[str, object]:
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def material_digest() -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update((ROOT / relative).read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def main() -> int:
    sources = load("sources.json")
    bindings = load("definition-bindings.json")
    nodes = load("nodes.json")
    relations = load("relations.json")
    rules = load("rules.json")
    premises = load("premises.json")
    proofs = load("proof-requirements.json")
    residue = load("residue.json")
    candidate = {
        "schema_version": "cav2-kep-durable-storage-business-ontology-candidate/v1",
        "candidate_id": "CA2-CANDIDATE-KEP-DURABLE-STORAGE-BUSINESS-ONTOLOGY-001",
        "ontology_id": "CA2-ONTOLOGY-KEP-DURABLE-STORAGE",
        "ontology_type": "business-domain",
        "branch": "business",
        "material_digest_algorithm": "sha256-path-null-bytes-null/v1",
        "material_digest": material_digest(),
        "artifacts": [
            {"path": relative, "sha256": sha256(ROOT / relative)}
            for relative in sorted(MATERIAL_FILES)
        ],
        "predecessor": {
            "decision_id": "CA2-DECISION-KEP-DURABLE-STORAGE-PRODUCT-CAPABILITY-ADOPTION-001",
            "path": "../decisions/product-capability-adoption-001.json",
            "sha256": "5a8a4a3b7629cf9955af4173ed339451541262ead61d46a1a74ac8adb2063f84",
        },
        "counts": {
            "sources": len(sources["sources"]),
            "definition_bindings": len(bindings["bindings"]),
            "nodes": len(nodes["nodes"]),
            "relations": len(relations["relations"]),
            "rules": len(rules["rules"]),
            "premises": len(premises["premises"]),
            "proof_requirements": len(proofs["proof_requirements"]),
            "residue": len(residue["residue"]),
        },
        "lifecycle_status": "authored-candidate",
        "admission_status": "not-requested",
        "successor_authorization": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "authority_effect": "none",
        "claim_limit": "Exact business-ontology admission candidate only; no admission, DomainSpec, system ontology, provider selection, implementation, publication, deployment, or external effect.",
    }
    (ROOT / "candidate.json").write_text(
        json.dumps(candidate, indent=2, sort_keys=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"candidate": "candidate.json", "material_digest": candidate["material_digest"]}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
