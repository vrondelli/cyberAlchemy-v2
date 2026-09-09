#!/usr/bin/env python3
"""Author the exact pre-implementation Rust construction binding 003."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
V1_ROOT = HERE.parents[3]
PRODUCT_ROOT = V1_ROOT.parents[4]
POLICY_PATH = HERE / "policy.json"
BINDING_PATH = HERE / "generated" / "implementation-binding.json"
PREACCEPTANCE_PATH = HERE / "generated" / "preacceptance-001.json"
TEST_PATH = HERE / "tests" / "test_author.py"


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


def exact_json(relative: str, expected_sha: str, label: str) -> tuple[Path, dict[str, Any]]:
    path = V1_ROOT / relative
    require(path.is_file(), f"missing {label}: {relative}")
    require(sha256_file(path) == expected_sha, f"{label} drift: {relative}")
    return path, load_json(path)


def path_null_digest(entries: list[tuple[str, bytes]]) -> str:
    digest = hashlib.sha256()
    for relative, raw in sorted(entries):
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(raw)
        digest.update(b"\0")
    return digest.hexdigest()


def decision_material_digest(decision_path: Path, artifacts: list[dict[str, str]]) -> str:
    entries: list[tuple[str, bytes]] = []
    for item in artifacts:
        path = (decision_path.parent / item["path"]).resolve()
        require(path.is_file(), f"missing decision-bound artifact: {item['path']}")
        raw = path.read_bytes()
        require(sha256_bytes(raw) == item["sha256"], f"decision-bound artifact drift: {item['path']}")
        entries.append((item["material_digest_path"], raw))
    return path_null_digest(entries)


def verify_inputs(policy: dict[str, Any]) -> dict[str, Any]:
    predecessor = policy["accepted_predecessor_binding"]
    _, predecessor_binding = exact_json(predecessor["binding_path"], predecessor["binding_sha256"], "predecessor binding")
    predecessor_decision_path, predecessor_decision = exact_json(
        predecessor["acceptance_decision_path"], predecessor["acceptance_decision_sha256"], "predecessor acceptance"
    )
    require(predecessor_binding["binding_id"] == predecessor["binding_id"], "predecessor identity mismatch")
    require(predecessor_decision["decision_id"] == predecessor["acceptance_decision_id"], "predecessor decision identity mismatch")
    require(predecessor_decision["acceptance"]["lifecycle_status"] == "accepted", "predecessor is not accepted")
    require(predecessor_decision["acceptance"]["accepted_binding_material_digest"] == predecessor["binding_material_digest"], "predecessor accepted digest mismatch")
    require(decision_material_digest(predecessor_decision_path, predecessor_decision["subject"]["artifacts"]) == predecessor["binding_material_digest"], "predecessor material digest does not reproduce")

    accepted_impl = policy["accepted_implementation"]
    _, implementation_decision = exact_json(
        accepted_impl["acceptance_decision_path"], accepted_impl["acceptance_decision_sha256"], "implementation acceptance"
    )
    require(implementation_decision["decision_id"] == accepted_impl["acceptance_decision_id"], "implementation decision identity mismatch")
    require(implementation_decision["acceptance"]["lifecycle_status"] == "accepted-local-candidate", "implementation is not accepted at local-candidate ceiling")
    require(implementation_decision["acceptance"]["accepted_candidate_set_digest"] == accepted_impl["accepted_candidate_set_digest"], "accepted implementation candidate-set drift")
    require(implementation_decision["subject"]["implementation_material_digest"] == accepted_impl["implementation_material_digest"], "accepted implementation material drift")
    require(predecessor_binding["implementation_material"]["digest"] == accepted_impl["implementation_material_digest"], "predecessor and accepted implementation do not join")
    material_entries = []
    for item in predecessor_binding["implementation_material"]["artifacts"]:
        path = PRODUCT_ROOT / item["path"]
        require(path.is_file(), f"missing accepted implementation artifact: {item['path']}")
        raw = path.read_bytes()
        require(sha256_bytes(raw) == item["sha256"], f"accepted implementation artifact drift: {item['path']}")
        material_entries.append((item["path"], raw))
    require(path_null_digest(material_entries) == accepted_impl["implementation_material_digest"], "accepted implementation material digest does not reproduce")

    assessment = policy["accepted_local_assessment"]
    assessment_decision_path, assessment_decision = exact_json(
        assessment["acceptance_decision_path"], assessment["acceptance_decision_sha256"], "assessment acceptance"
    )
    _, assessment_policy = exact_json(assessment["assessment_policy_path"], assessment["assessment_policy_sha256"], "assessment policy")
    _, assessment_result = exact_json(assessment["assessment_path"], assessment["assessment_sha256"], "assessment result")
    require(assessment_decision["decision_id"] == assessment["acceptance_decision_id"], "assessment decision identity mismatch")
    require(assessment_decision["acceptance"]["lifecycle_status"] == "accepted-assessment", "assessment is not accepted")
    require(assessment_decision["acceptance"]["accepted_assessment_material_digest"] == assessment["assessment_material_digest"], "accepted assessment digest mismatch")
    require(decision_material_digest(assessment_decision_path, assessment_decision["subject"]["artifacts"]) == assessment["assessment_material_digest"], "assessment material digest does not reproduce")
    require(assessment_result["assessment_id"] == assessment["assessment_id"], "assessment identity mismatch")
    require(assessment_policy["assessment_id"] == assessment["assessment_id"], "assessment policy identity mismatch")

    ontology = policy["admitted_system_ontology"]
    _, system_ontology = exact_json(ontology["system_ontology_path"], ontology["system_ontology_sha256"], "system ontology")
    _, ontology_decision = exact_json(ontology["decision_path"], ontology["decision_sha256"], "system ontology admission")
    require(ontology_decision["decision_id"] == ontology["decision_id"], "ontology decision identity mismatch")
    require(ontology_decision["admission"]["lifecycle_status"] == "admitted", "system ontology is not admitted")
    require(ontology_decision["admission"]["admitted_candidate_set_digest"] == ontology["candidate_set_digest"], "admitted ontology digest mismatch")
    require(system_ontology["ontology_id"] == ontology["ontology_id"], "system ontology identity mismatch")
    selectors = ontology["selectors"]
    require(len(system_ontology["nodes"]) == selectors["system_nodes"] == 89, "system node selector drift")
    require(len(system_ontology["relations"]) == selectors["system_relations"] == 204, "system relation selector drift")
    require(len(system_ontology["proof_obligations"]) == selectors["proof_obligations"] == 13, "proof selector drift")
    require(len(system_ontology["boundaries"]) == selectors["boundaries"] == 9, "boundary selector drift")

    profiles = {item["path"]: item["sha256"] for item in policy["semantic_profiles"]}
    _, crypto_profile = exact_json("cryptographic-profile.json", profiles["cryptographic-profile.json"], "cryptographic profile")
    _, storage_profile = exact_json("durable-storage-instantiation.json", profiles["durable-storage-instantiation.json"], "storage instantiation")
    require(crypto_profile["profile_id"] == "KEP-SOL-CRYPTO-DEVNET-V1", "cryptographic profile identity mismatch")
    require(crypto_profile["status"] == "candidate-test-only", "cryptographic profile ceiling drift")
    require(storage_profile["provider_realization"]["status"] == "unbound-until-implementation-binding", "storage provider posture drift")

    plan_policy = policy["formal_evidence_plan"]
    _, plan = exact_json(plan_policy["path"], plan_policy["sha256"], "formal evidence plan")
    require(plan["plan_id"] == plan_policy["plan_id"], "formal evidence plan identity mismatch")
    workstreams = {item["workstream_id"] for item in plan["workstreams"]}
    require(set(plan_policy["selected_workstreams"]).issubset(workstreams), "selected formal-evidence workstream missing")

    verify_construction_policy(policy)
    return {
        "predecessor_binding": predecessor_binding,
        "implementation_decision": implementation_decision,
        "assessment_decision": assessment_decision,
        "assessment_result": assessment_result,
        "system_ontology": system_ontology,
        "crypto_profile": crypto_profile,
        "storage_profile": storage_profile,
    }


def verify_construction_policy(policy: dict[str, Any]) -> None:
    dependencies = policy["rust_substrate"]["dependencies"]
    require(len(dependencies) == 16, "provider dependency count drift")
    require(len({item["name"] for item in dependencies}) == len(dependencies), "duplicate provider dependency")
    require(all(item["version"].startswith("=") for item in dependencies), "provider dependency is not exact-patch pinned")
    require(all(item["default_features"] is False for item in dependencies), "provider dependency enables default features")
    expected_versions = {
        "chacha20poly1305": "=0.11.0", "getrandom": "=0.4.3", "hpke": "=0.14.0",
        "sha2": "=0.11.0", "sqlx": "=0.9.0", "tokio": "=1.53.1", "zeroize": "=1.9.0",
        "solana-account-info": "=3.1.1", "solana-instruction": "=3.4.0",
        "solana-program-entrypoint": "=3.1.1", "solana-program-error": "=3.0.1",
        "solana-pubkey": "=4.2.0", "solana-program-test": "=4.1.2",
        "solana-keypair": "=3.1.2", "solana-signer": "=3.0.0", "solana-transaction": "=4.1.1",
    }
    require({item["name"]: item["version"] for item in dependencies} == expected_versions, "provider name/version selection drift")
    features = {item["name"]: item["features"] for item in dependencies}
    require(features["hpke"] == ["alloc", "chacha", "getrandom", "x25519"], "HPKE suite feature drift")
    require(features["sqlx"] == ["any", "migrate", "postgres", "runtime-tokio", "sqlite-bundled", "tls-rustls-ring"], "SQLx provider feature drift")

    targets = policy["planned_targets"]
    require(len(targets) == 14, "planned target closure count drift")
    require(len({item["path"] for item in targets}) == len(targets), "duplicate planned target")
    require(all(item["path"].startswith("runtime/") and ".." not in Path(item["path"]).parts for item in targets), "planned target escapes runtime root")
    required_targets = {
        "runtime/Cargo.toml", "runtime/Cargo.lock",
        "runtime/src/encrypted_durable_devnet/providers/rustcrypto.rs",
        "runtime/src/encrypted_durable_devnet/providers/sqlx_storage.rs",
        "runtime/src/encrypted_durable_devnet/program/processor.rs",
        "runtime/migrations/0001_encrypted_durable_storage.sql",
        "runtime/tests/production_profile_crypto.rs", "runtime/tests/sql_storage.rs",
        "runtime/tests/solana_program_test.rs", "runtime/tests/provider_failure_injection.rs",
    }
    require(required_targets.issubset({item["path"] for item in targets}), "required planned target closure missing")
    preserved = set(policy["preserved_surfaces"])
    require(preserved.isdisjoint({item["path"] for item in targets}), "accepted port or semantic surface is planned for mutation")

    required_forbidden = {
        "credential-read-or-write", "persisted-wallet-or-keypair", "rpc-client-or-request", "airdrop",
        "transaction-submission-to-network", "program-deployment", "devnet-or-mainnet-access",
        "plaintext-or-secret-persistence", "publication-or-release",
    }
    require(set(policy["forbidden_capabilities"]) == required_forbidden, "forbidden external-capability closure drift")
    require(policy["local_conformance"]["sql_url"] == "sqlite::memory:", "local SQL conformance is not in-memory SQLite")
    require(policy["local_conformance"]["network_access"] == "forbidden", "local construction permits network access")
    require(policy["security_posture"]["production_security_approval"] == "absent", "production security approval was manufactured")


def build_binding(policy_override: dict[str, Any] | None = None) -> dict[str, Any]:
    policy = copy.deepcopy(policy_override) if policy_override is not None else load_json(POLICY_PATH)
    inputs = verify_inputs(policy)
    assessment_subject = inputs["assessment_decision"]["subject"]
    return {
        "schema_version": "cav2-kep-sol2-rust-construction-binding/v1-candidate",
        "binding_id": policy["binding_id"],
        "policy_id": policy["policy_id"],
        "route_id": policy["route_id"],
        "delegation_route_id": policy["delegation_route_id"],
        "lifecycle_status": "authored-preimplementation-candidate",
        "source_authorization": policy["source_authorization"],
        "dependency_path_root": policy["dependency_path_root"],
        "selected_dependencies": {
            "accepted_predecessor_binding": policy["accepted_predecessor_binding"],
            "accepted_implementation": policy["accepted_implementation"],
            "accepted_local_assessment": policy["accepted_local_assessment"],
            "admitted_system_ontology": policy["admitted_system_ontology"],
            "semantic_profiles": policy["semantic_profiles"],
            "formal_evidence_plan": policy["formal_evidence_plan"],
        },
        "selector_closure": policy["admitted_system_ontology"]["selectors"],
        "carried_assessment_ceiling": {
            "local_conformance_supported": assessment_subject["proof_summary"]["local_conformance_supported"],
            "partial_local_conformance": assessment_subject["proof_summary"]["partial_local_conformance"],
            "not_evaluable": assessment_subject["proof_summary"]["not_evaluable"],
            "accepted_conformance": assessment_subject["proof_summary"]["accepted_conformance"],
            "aggregate_result": assessment_subject["aggregate_result"],
        },
        "workstreams": [
            {
                "workstream_id": "FE-W3-PRODUCTION-CRYPTO-AND-SQL",
                "construction_state": "exact-provider-and-target-plan-candidate",
                "provider_bindings": ["rustcrypto-xchacha20poly1305-hpke-sha256-osrng", "sqlx-any-postgres-sqlite-three-layer"],
                "planned_proof_targets": ["KEP-SOL2-PROOF-CRYPTO-KNOWN-ANSWER", "KEP-SOL2-PROOF-RECIPIENT-DECRYPTION", "KEP-SOL2-PROOF-STORAGE-FAILURE-BLOCKS", "KEP-SOL2-PROOF-THREE-LAYER-READINESS"],
                "conformance_status": "not_evaluable"
            },
            {
                "workstream_id": "FE-W4-SOLANA-PROGRAM-TEST",
                "construction_state": "exact-local-simulation-target-plan-candidate",
                "provider_bindings": ["solana-program-test-4.1.2-in-process"],
                "planned_proof_targets": ["KEP-SOL2-PROOF-GRANT-POSITIVE", "KEP-SOL2-PROOF-GRANT-NEGATIVES", "KEP-SOL2-PROOF-REISSUE-POSITIVE", "KEP-SOL2-PROOF-REISSUE-NEGATIVES", "KEP-SOL2-PROOF-FINALIZED-ACTIVATION"],
                "conformance_status": "not_evaluable"
            }
        ],
        "rust_substrate": policy["rust_substrate"],
        "planned_targets": policy["planned_targets"],
        "preserved_surfaces": policy["preserved_surfaces"],
        "local_conformance": policy["local_conformance"],
        "forbidden_capabilities": policy["forbidden_capabilities"],
        "security_posture": policy["security_posture"],
        "construction_gate": {
            "binding_acceptance": "not_evaluable",
            "implementation": "not-authorized-by-this-candidate",
            "candidate_bytes": "not-yet-authored",
            "local_tests": "not-yet-run",
            "production_security_review": "absent",
            "devnet_evidence": "not_evaluable"
        },
        "successor_authorization": {
            "accept_binding": "human-owner-only",
            "implement_after_acceptance": "requires-parent-route-continuation",
            "credentials_or_wallets": "not-authorized",
            "rpc_or_network": "not-authorized",
            "deployment_or_devnet": "not-authorized",
            "publication_or_release": "not-authorized"
        },
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Exact pre-implementation Rust construction-binding candidate only. It selects closed provider versions and planned local targets for FE-W3 and FE-W4, preserves accepted ports and meanings, carries the accepted indeterminate assessment, and grants no implementation, conformance, security, credential, wallet, RPC, deployment, Devnet, publication, or external-effect authority."
    }


def binding_material(binding_raw: bytes) -> tuple[str, list[dict[str, str]]]:
    artifacts = [
        {"path": "policy.json", "sha256": sha256_file(POLICY_PATH)},
        {"path": "generated/implementation-binding.json", "sha256": sha256_bytes(binding_raw)},
    ]
    entries = [("policy.json", POLICY_PATH.read_bytes()), ("generated/implementation-binding.json", binding_raw)]
    return path_null_digest(entries), artifacts


def build_preacceptance(binding_raw: bytes) -> dict[str, Any]:
    binding = json.loads(binding_raw)
    material_digest, artifacts = binding_material(binding_raw)
    return {
        "schema_version": "cav2-kep-sol2-rust-construction-binding-preacceptance/v1",
        "receipt_id": "CA2-RECEIPT-KEP-SOL2-RUST-CONSTRUCTION-BINDING-PREACCEPTANCE-003",
        "route_id": binding["route_id"],
        "delegation_route_id": binding["delegation_route_id"],
        "candidate": {
            "binding_id": binding["binding_id"],
            "lifecycle_status": binding["lifecycle_status"],
            "binding_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
            "binding_material_digest": material_digest,
            "artifacts": artifacts
        },
        "selected_dependency_digests": {
            "accepted_predecessor_binding_material": binding["selected_dependencies"]["accepted_predecessor_binding"]["binding_material_digest"],
            "accepted_implementation_material": binding["selected_dependencies"]["accepted_implementation"]["implementation_material_digest"],
            "accepted_assessment_material": binding["selected_dependencies"]["accepted_local_assessment"]["assessment_material_digest"],
            "admitted_system_ontology_candidate_set": binding["selected_dependencies"]["admitted_system_ontology"]["candidate_set_digest"]
        },
        "closure": {
            "system_nodes": "89/89 selected",
            "system_relations": "204/204 selected",
            "proof_obligations": "13/13 selected",
            "boundaries": "9/9 selected",
            "exact_dependencies": "16/16 PASS",
            "planned_targets": "14/14 PASS",
            "forbidden_external_capabilities": "9/9 PASS"
        },
        "checks": [
            {"check_id": "accepted-predecessor-exact", "status": "PASS"},
            {"check_id": "accepted-implementation-exact", "status": "PASS"},
            {"check_id": "accepted-assessment-exact", "status": "PASS"},
            {"check_id": "admitted-system-ontology-exact", "status": "PASS"},
            {"check_id": "semantic-profiles-exact", "status": "PASS"},
            {"check_id": "provider-name-version-feature-closure", "status": "PASS"},
            {"check_id": "planned-target-closure", "status": "PASS"},
            {"check_id": "forbidden-external-capability-closure", "status": "PASS"},
            {"check_id": "implementation-conformance", "status": "not_evaluable", "causal_blocker": "No implementation bytes or provider tests exist under this construction candidate."},
            {"check_id": "production-security-approval", "status": "not_evaluable", "causal_blocker": "Independent cryptographic security review remains absent."},
            {"check_id": "devnet-evidence", "status": "not_evaluable", "causal_blocker": "Only local program-test is planned; credentials, RPC, deployment, and Devnet effects are forbidden."}
        ],
        "author": {"path": "../author.py", "sha256": sha256_file(Path(__file__))},
        "tests": {"path": "../tests/test_author.py", "sha256": sha256_file(TEST_PATH)},
        "decision_gate": {
            "status": "ready-for-exact-construction-binding-decision",
            "required_digest": material_digest,
            "admissible_option_ids": ["ACCEPT-EXACT-RUST-CONSTRUCTION-BINDING", "REJECT-EXACT-RUST-CONSTRUCTION-BINDING", "DEFER-EXACT-RUST-CONSTRUCTION-BINDING"],
            "decision_limit": "Acceptance may bind only this exact provider and planned-target construction candidate; it cannot accept future implementation bytes, conformance, production security, or any external effect."
        },
        "preacceptance": {"status": "PASS", "authority_effect": "none"},
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": binding["claim_ceiling"]
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        binding_raw = canonical_bytes(build_binding())
        preacceptance_raw = canonical_bytes(build_preacceptance(binding_raw))
        if args.check:
            require(BINDING_PATH.is_file(), "missing generated binding")
            require(PREACCEPTANCE_PATH.is_file(), "missing generated preacceptance")
            require(BINDING_PATH.read_bytes() == binding_raw, "generated binding drift")
            require(PREACCEPTANCE_PATH.read_bytes() == preacceptance_raw, "generated preacceptance drift")
            mode = "check"
        else:
            BINDING_PATH.parent.mkdir(parents=True, exist_ok=True)
            BINDING_PATH.write_bytes(binding_raw)
            PREACCEPTANCE_PATH.write_bytes(preacceptance_raw)
            mode = "write"
        material_digest, _ = binding_material(binding_raw)
        print(json.dumps({
            "result": "pass", "mode": mode, "binding_id": json.loads(binding_raw)["binding_id"],
            "binding_sha256": sha256_bytes(binding_raw), "binding_material_digest": material_digest,
            "preacceptance_sha256": sha256_bytes(preacceptance_raw), "authority_effect": "none",
            "implementation_effect": "none", "external_effect": "none"
        }, indent=2))
        return 0
    except (BindingError, KeyError, TypeError, ValueError, OSError) as exc:
        print(json.dumps({"result": "fail", "error": str(exc), "authority_effect": "none"}, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
