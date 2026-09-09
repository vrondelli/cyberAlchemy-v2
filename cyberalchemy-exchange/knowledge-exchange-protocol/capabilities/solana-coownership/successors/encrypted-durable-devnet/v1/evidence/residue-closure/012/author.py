#!/usr/bin/env python3
"""Author deterministic candidate evidence for residue-closure successor 012."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path


HERE = Path(__file__).resolve().parent
V1 = HERE.parents[2]
REPO = next(parent for parent in HERE.parents if (parent / "cyberAlchemy-v2").is_dir())
RUNTIME = REPO / "cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime"
OUTPUT = HERE / "generated/residue-closure-evidence.json"
ACCEPTANCE = V1 / "decisions/rust-binding-acceptance-006.json"
REVIEW = V1 / "evidence/independent-review/009/review.json"


class EvidenceError(RuntimeError):
    pass


def canonical(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def file_ref(path: Path) -> dict[str, object]:
    raw = path.read_bytes()
    return {
        "path": path.relative_to(REPO).as_posix(),
        "sha256": sha256(raw),
        "size_bytes": len(raw),
    }


def cargo_packages() -> list[dict[str, object]]:
    process = subprocess.run(
        ["cargo", "metadata", "--locked", "--format-version", "1"],
        cwd=RUNTIME,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if process.returncode:
        raise EvidenceError("cargo metadata --locked failed")
    metadata = json.loads(process.stdout)
    packages = []
    for package in metadata["packages"]:
        packages.append(
            {
                "name": package["name"],
                "version": package["version"],
                "source": package.get("source") or "workspace-path",
                "license": package.get("license"),
                "repository": package.get("repository"),
            }
        )
    return sorted(packages, key=lambda item: (item["name"], item["version"], item["source"]))


def build() -> dict[str, object]:
    acceptance = json.loads(ACCEPTANCE.read_text())
    review = json.loads(REVIEW.read_text())
    if acceptance["acceptance"]["accepted_binding_material_digest"] != (
        "b617a45bc515cbc435f29f091d26ae07815ab3195bea89667414cc2f3855242b"
    ):
        raise EvidenceError("accepted predecessor 011 drift")
    finding_ids = [item["finding_id"] for item in review["carried_prior_medium_residue"]]
    expected_findings = [f"IR7-M{index:02d}" for index in range(1, 11)]
    if [item.split("-", 2)[0] + "-" + item.split("-", 2)[1] for item in finding_ids] != expected_findings:
        raise EvidenceError("review 009 residue denominator drift")

    runtime_refs = [
        file_ref(RUNTIME / "adapters/src/crypto.rs"),
        file_ref(RUNTIME / "adapters/tests/crypto_conformance.rs"),
        file_ref(RUNTIME / "trial-cli/src/main.rs"),
        file_ref(RUNTIME / "trial-cli/src/executor.rs"),
    ]
    ontology_refs = [
        file_ref(V1 / "product-capability.json"),
        file_ref(V1 / "ontology/profile.json"),
        file_ref(V1 / "ontology/nodes.json"),
        file_ref(V1 / "ontology/relations.json"),
        file_ref(V1 / "ontology/proof-requirements.json"),
        file_ref(V1 / "domainspec/project.json"),
        file_ref(V1 / "domainspec/generated/source-manifest.json"),
        file_ref(V1 / "domainspec/generated/system-ontology.json"),
    ]
    packages = cargo_packages()
    missing_licenses = [
        f"{item['name']}@{item['version']}" for item in packages if not item["license"]
    ]
    trace_cases = {
        "storage-three-layer-ready": ["rust-core", "postgresql-adapter"],
        "initialize-positive": ["solana-program", "rust-trial-runner"],
        "grant-wrong-signer": ["solana-program", "rust-trial-runner", "formal-grant"],
        "grant-stale-revision": ["solana-program", "rust-trial-runner", "formal-grant"],
        "grant-positive": ["solana-program", "rust-trial-runner", "formal-grant"],
        "grant-finalized-fetch": ["solana-finalized-read", "rust-trial-runner"],
        "recipient-decryption": ["rustcrypto-adapter", "rust-trial-runner"],
        "reissue-request-outsider": ["solana-program", "rust-trial-runner", "formal-reissue"],
        "reissue-request-positive": ["solana-program", "rust-trial-runner", "formal-reissue"],
        "reissue-request-replay": ["solana-program", "rust-trial-runner", "formal-reissue"],
        "reissue-self-fulfillment": ["solana-program", "rust-trial-runner", "formal-reissue"],
        "reissue-fulfill-positive": ["solana-program", "rust-trial-runner", "formal-reissue"],
        "reissue-state-isolation": ["solana-finalized-read", "rust-structural-equality"],
        "replacement-recipient-decryption": ["rustcrypto-adapter", "rust-trial-runner"],
        "cost-observation": ["rust-trial-runner", "formal-cost-separation"],
    }
    dispositions = [
        {"finding_id": finding_ids[0], "status": "mitigated-candidate", "remaining": "runner-local decrypt-and-compare witness is not public or independent proof"},
        {"finding_id": finding_ids[1], "status": "resolved-for-exported-trial-evidence-candidate", "remaining": "plaintext commitment remains internal authenticated cryptographic context"},
        {"finding_id": finding_ids[2], "status": "resolved-candidate", "remaining": "root still requires external anchoring for production rewrite resistance"},
        {"finding_id": finding_ids[3], "status": "mitigated-candidate", "remaining": "in-process directory rejects replacement; broader identity authority remains outside runtime"},
        {"finding_id": finding_ids[4], "status": "pending-current-devnet-quote", "remaining": "dynamic rent and fee inputs require bounded finalized RPC reads"},
        {"finding_id": finding_ids[5], "status": "mitigated-candidate", "remaining": "secret bytes are snapshotted and zeroized in process; trusted-host dependence remains"},
        {"finding_id": finding_ids[6], "status": "partially-mitigated-candidate", "remaining": "SBOM and licenses are captured; no bound vulnerability-auditor receipt exists"},
        {"finding_id": finding_ids[7], "status": "partially-mitigated-candidate", "remaining": "journal mutation, packet, sequence and predecessor faults added; full I/O fault injection remains open"},
        {"finding_id": finding_ids[8], "status": "r1-trace-consistency-candidate-r2-deferred", "remaining": "trace witnesses do not constitute mathematical refinement"},
        {"finding_id": finding_ids[9], "status": "mitigated-candidate", "remaining": "effect surface and packet-bound journal are runner-generated, not independent universal-negative attestation"},
    ]
    return {
        "schema_version": "cav2-kep-residue-closure-evidence/v1",
        "evidence_id": "CA2-KEP-ENCRYPTED-DURABLE-DEVNET-RESIDUE-CLOSURE-012",
        "predecessor": {
            "binding_id": acceptance["acceptance"]["accepted_binding_id"],
            "binding_material_digest": acceptance["acceptance"]["accepted_binding_material_digest"],
            "acceptance": file_ref(ACCEPTANCE),
            "review": file_ref(REVIEW),
        },
        "selected_ontology_dependencies": ontology_refs,
        "runtime_candidate_files": runtime_refs,
        "residue_denominator": finding_ids,
        "dispositions": dispositions,
        "funding_model": {
            "status": "not_evaluable-until-current-finalized-devnet-quote",
            "formula": "buffer_rent + program_rent + programdata_rent + deployment_fees + protocol_fee_cap + safety_margin",
            "required_quote_fields": [
                "cluster_genesis_hash", "observed_slot", "sbf_sha256", "sbf_size_bytes",
                "buffer_rent_lamports", "program_rent_lamports", "programdata_rent_lamports",
                "deployment_submission_bound", "protocol_submission_bound", "fee_per_signature_lamports",
                "safety_margin_lamports", "calculated_minimum_lamports"
            ],
        },
        "custody_boundary": {
            "implemented": [
                "private-key-files-read-once-before-cryptographic-use",
                "32-byte-secret-length-enforced",
                "secret-snapshots-held-in-zeroizing-memory",
                "key-binding-replacement-rejected"
            ],
            "unproven": ["host-compromise-resistance", "physical-erasure", "hardware-backed-isolation"],
        },
        "dependency_assessment": {
            "cargo_lock": file_ref(RUNTIME / "Cargo.lock"),
            "package_count": len(packages),
            "packages": packages,
            "missing_license_metadata": missing_licenses,
            "vulnerability_assessment": "not_evaluable-no-bound-auditor-receipt",
            "provenance_ceiling": "registry-or-workspace-source-as-reported-by-cargo-metadata",
        },
        "trace_consistency": {
            "claim": "r1-executable-trace-witness-candidate",
            "case_count": len(trace_cases),
            "cases": trace_cases,
            "formal_refinement": "not-proven-r2-deferred",
        },
        "authority_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Candidate local residue evidence for successor 012. It does not accept a binding, close review findings, prove formal refinement, attest universal absence of external effects, authorize Devnet execution, or establish production readiness.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    value = build()
    raw = canonical(value)
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_bytes() != raw:
            raise EvidenceError("generated residue evidence drift")
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_bytes(raw)
    print(f"PASS evidence={sha256(raw)} packages={value['dependency_assessment']['package_count']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
