#!/usr/bin/env python3
"""Aggregate exact-byte audit of the complete Durable Storage CAV2-D65 chain."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[4]

EXACT = {
    "definitions": ("authority/definitions/DEFINITIONS.md", "4edb03caab66af2eedf79ad31a47d09b19aec0d975deccfd217195046258c4df"),
    "definition_acceptance": ("decisions/definition-set-acceptance-001.json", "e8ba35fb8912a426def05f4a449e07ac49578afd0f8633e75350309735209206"),
    "product_capability": ("../../persist-and-verify-encrypted-knowledge-material.product-capability.json", "51de7881e4cb2915a85475e21cad60ff7ce933f207678270eb437b35931e9422"),
    "product_capability_adoption": ("decisions/product-capability-adoption-001.json", "5a8a4a3b7629cf9955af4173ed339451541262ead61d46a1a74ac8adb2063f84"),
    "business_ontology_candidate": ("ontology/candidate.json", "7ea5805cbf73888f118b6e5c05a4cb098f1b84a891e56eb1daedd2c744516304"),
    "business_ontology_admission": ("decisions/ontology-admission-001.json", "b9a8c17a77bc9ea7b957cc81ea2b82f9da15ce435bb63a33f63bcaa1bcd46d35"),
    "domainspec_binding": ("domainspec/binding.json", "ad1a6e05fba36ea26d7734eb5f7a72873d6d63d476b14d606ef984f4f7239477"),
    "domainspec_source_admission": ("decisions/domainspec-source-admission-001.json", "2853c1a4c341a9b5a22fc66fe8a9f6af9df5c6d94e82b03bf782b72038f90bae"),
    "compiled_graph": ("domainspec/generated/compiled-graph.json", "41586130de2fd0c910c303ab9baf9527519cfb87b1e538902ef478186f9c64e2"),
    "system_ontology": ("domainspec/generated/system-ontology.json", "ad110c9c00deabd3b97141b8d28c3204d9610603a4b617fc47a93dfa46df48d5"),
    "system_ontology_admission": ("decisions/system-ontology-admission-001.json", "8a5c3617ad0182523c73a07a3e598f7aaad063074f7301df67b12b2c7c05e647"),
    "implementation_binding": ("runtime/implementation-binding.json", "8c6dbe7f2a5bd57d59d0056503c4c08dc8066956cbdb31abcbdacd32e81a2412"),
    "conformance_receipt": ("runtime/conformance-receipt.json", "5b016f5f621662bc55a1783fc7fa806c6556ba1b9307af7acaf2587cc4d9922f"),
    "conformance_acceptance": ("decisions/local-conformance-acceptance-001.json", "52b860c48b9f47145aee12ff9db23d655087cf4477685522720ba0968480d059"),
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    stages = []
    for stage, (relative, expected) in EXACT.items():
        path = (ROOT / relative).resolve()
        actual = sha(path) if path.is_file() else None
        status = "PASS" if actual == expected else "FAIL"
        stages.append({"stage": stage, "status": status, "path": relative, "sha256": actual})
        if status == "FAIL":
            errors.append(f"exact stage digest drift: {stage}")

    commands = [
        ("definitions", [sys.executable, str(ROOT / "validate.py")]),
        ("product-capability", [sys.executable, str(ROOT / "validate-product-capability.py")]),
        ("business-ontology", [sys.executable, str(ROOT / "ontology/validate.py")]),
        ("domainspec-v2", [sys.executable, str(ROOT / "domainspec/validate.py")]),
        ("deterministic-compilation", [sys.executable, str(ROOT / "domainspec/compile.py"), "--check"]),
        ("rust-conformance", [sys.executable, str(ROOT / "runtime/validate.py")]),
    ]
    gates = []
    env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
    for gate, command in commands:
        completed = subprocess.run(command, cwd=REPO, capture_output=True, text=True, env=env, check=False)
        status = "PASS" if completed.returncode == 0 else "FAIL"
        gates.append({"gate": gate, "status": status})
        if status == "FAIL":
            errors.append(f"gate failed: {gate}: {completed.stdout or completed.stderr}")

    result = {
        "schema_version": "cav2-kep-durable-storage-d65-aggregate/v1",
        "chain": "canonical definitions -> Product Capability -> capability-local business ontology -> DomainSpec v2 source -> deterministic graph and system ontology -> exact Rust implementation binding -> local conformance evidence",
        "result": "PASS" if not errors else "BLOCK",
        "stages": stages,
        "gates": gates,
        "errors": errors,
        "accepted_scope": "Exact local-filesystem reference conformance only.",
        "not_evaluable": ["production provider selection", "production availability and retention", "cryptographic security", "Solana consumer instantiation", "publication", "deployment", "external effects"],
        "authority_effect": "none",
        "external_effect": "none",
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
