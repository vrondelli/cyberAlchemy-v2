#!/usr/bin/env python3
"""Author exact postimplementation successor binding candidate 004."""

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
RUNTIME_ROOT = PRODUCT_ROOT / "runtime"
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


def material_entries(stable_cycle: dict[str, Any], policy: dict[str, Any]) -> list[tuple[str, bytes]]:
    entries: list[tuple[str, bytes]] = []
    material = stable_cycle["runtime_material"]
    require(len(material) == policy["frozen_local_evidence"]["runtime_material_file_count"], "runtime file count drift")
    require(len({item["path"] for item in material}) == len(material), "duplicate runtime material path")
    for item in material:
        relative = item["path"]
        require(not Path(relative).is_absolute() and ".." not in Path(relative).parts, f"runtime path escapes root: {relative}")
        path = RUNTIME_ROOT / relative
        require(path.is_file(), f"missing runtime material: {relative}")
        raw = path.read_bytes()
        require(sha256_bytes(raw) == item["sha256"], f"runtime material drift: {relative}")
        entries.append((relative, raw))
    return entries


def verify_inputs(policy: dict[str, Any]) -> dict[str, Any]:
    predecessor = policy["accepted_predecessor_binding"]
    _, predecessor_binding = exact_json(predecessor["binding_path"], predecessor["binding_sha256"], "accepted predecessor binding")
    decision_path, predecessor_decision = exact_json(
        predecessor["acceptance_decision_path"], predecessor["acceptance_decision_sha256"], "accepted predecessor decision"
    )
    require(predecessor_binding["binding_id"] == predecessor["binding_id"], "predecessor binding identity mismatch")
    require(predecessor_decision["decision_id"] == predecessor["acceptance_decision_id"], "predecessor decision identity mismatch")
    require(predecessor_decision["acceptance"]["lifecycle_status"] == "accepted", "predecessor binding is not accepted")
    require(predecessor_decision["acceptance"]["accepted_binding_material_digest"] == predecessor["binding_material_digest"], "accepted predecessor digest mismatch")
    require(decision_material_digest(decision_path, predecessor_decision["subject"]["artifacts"]) == predecessor["binding_material_digest"], "predecessor material digest does not reproduce")

    provenance = policy["superseded_candidate_provenance"]
    _, policy_003 = exact_json(provenance["policy_path"], provenance["policy_sha256"], "successor 003 policy provenance")
    _, binding_003 = exact_json(provenance["binding_path"], provenance["binding_sha256"], "successor 003 binding provenance")
    require(policy_003["binding_id"] == provenance["binding_id"] == binding_003["binding_id"], "successor 003 provenance identity mismatch")
    require(binding_003["lifecycle_status"] == "authored-preimplementation-candidate", "successor 003 provenance posture drift")

    ontology = policy["admitted_system_ontology"]
    _, system_ontology = exact_json(ontology["system_ontology_path"], ontology["system_ontology_sha256"], "admitted system ontology")
    _, ontology_decision = exact_json(ontology["decision_path"], ontology["decision_sha256"], "system ontology admission")
    require(system_ontology["ontology_id"] == ontology["ontology_id"], "system ontology identity mismatch")
    require(ontology_decision["decision_id"] == ontology["decision_id"], "ontology decision identity mismatch")
    require(ontology_decision["admission"]["lifecycle_status"] == "admitted", "system ontology is not admitted")
    require(ontology_decision["admission"]["admitted_candidate_set_digest"] == ontology["candidate_set_digest"], "admitted ontology digest mismatch")
    selectors = ontology["selectors"]
    require(len(system_ontology["nodes"]) == selectors["system_nodes"] == 89, "system node selector drift")
    require(len(system_ontology["relations"]) == selectors["system_relations"] == 204, "system relation selector drift")
    require(len(system_ontology["proof_obligations"]) == selectors["proof_obligations"] == 13, "proof selector drift")
    require(len(system_ontology["boundaries"]) == selectors["boundaries"] == 9, "boundary selector drift")

    frozen = policy["frozen_local_evidence"]
    _, stable = exact_json(frozen["stable_cycle_path"], frozen["stable_cycle_sha256"], "stable local cycle")
    cycles = stable["cycles"]
    require(stable["result"] == frozen["required_cycle_result"], "stable aggregate result drift")
    require(len(cycles) == frozen["required_cycle_count"], "stable cycle count drift")
    require(all(cycle["result"] == frozen["required_cycle_result"] for cycle in cycles), "non-pass stable cycle")
    require(all(cycle["runtime_material_digest"] == frozen["runtime_material_digest"] for cycle in cycles), "runtime digest differs between cycles")
    require(all(cycle["runtime_material_file_count"] == frozen["runtime_material_file_count"] for cycle in cycles), "runtime file count differs between cycles")
    require(all(cycle["runtime_material"] == cycles[0]["runtime_material"] for cycle in cycles), "runtime manifest differs between cycles")
    entries = material_entries(cycles[-1], policy)
    require(path_null_digest(entries) == frozen["runtime_material_digest"], "runtime material digest does not reproduce")
    sbf = cycles[-1]["sbf"]
    require(sbf["sbf_sha256"] == frozen["sbf_sha256"], "SBF digest drift")
    require(sbf["sbf_size_bytes"] == frozen["sbf_size_bytes"], "SBF size drift")
    require(sbf["build"]["exit_code"] == 0 and sbf["load_test"]["exit_code"] == 0, "SBF build or load test did not pass")
    require(sbf["original_total_submission_cap_state"] == "BLOCK", "original submission-cap residue lost")
    split = sbf["candidate_split_budget"]
    require(split["deployment_signed_submissions"] == 192 and split["protocol_signed_submissions"] == 24, "split-budget bound drift")
    require(split["state"] == "fits-local-bound-pending-owner-authorization", "split-budget authorization posture drift")

    _, relations = exact_json(frozen["relation_evidence_path"], frozen["relation_evidence_sha256"], "relation evidence")
    require(relations["system_ontology_candidate_set_digest"] == ontology["candidate_set_digest"], "relation evidence ontology drift")
    require(relations["relation_count"] == relations["distinct_record_count"] == selectors["system_relations"], "relation evidence count drift")
    records = relations["records"]
    require(len(records) == 204 and len({item["relation_id"] for item in records}) == 204, "relation record identity closure failed")
    require(all(item["bounded_result"] == "SUPPORTED_BOUNDED_LOCAL" for item in records), "relation evidence contains a non-supported bounded result")
    relation_ids = {item["domainspec_edge_id"] for item in system_ontology["relations"]}
    require(relation_ids == {item["relation_id"] for item in records}, "relation evidence does not join all ontology relations")

    accepted_node_ids = {item["system_id"] for item in predecessor_binding["node_mappings"]}
    accepted_relation_ids = {item["system_relation_id"] for item in predecessor_binding["relation_mappings"]}
    require(accepted_node_ids == {item["system_id"] for item in system_ontology["nodes"]}, "accepted node mapping template drift")
    require(accepted_relation_ids == {item["system_relation_id"] for item in system_ontology["relations"]}, "accepted relation mapping template drift")

    return {
        "predecessor_binding": predecessor_binding,
        "system_ontology": system_ontology,
        "stable": stable,
        "relations": relations,
        "runtime_entries": entries,
    }


LAYER_TARGETS = {
    "protocol-kernel-existing": ["src/lib.rs", "tests/protocol.rs"],
    "protocol-model-extension": ["src/encrypted_durable_devnet/model.rs", "tests/encrypted_durable_devnet.rs"],
    "protocol-workflow-extension": ["src/encrypted_durable_devnet/protocol.rs", "tests/encrypted_durable_devnet.rs"],
    "cryptography-port": [
        "src/encrypted_durable_devnet/ports/cryptography.rs", "adapters/Cargo.toml", "adapters/src/lib.rs",
        "adapters/src/crypto.rs", "adapters/tests/crypto_conformance.rs",
    ],
    "durable-storage-port": [
        "src/encrypted_durable_devnet/ports/durable_storage.rs", "adapters/Cargo.toml", "adapters/src/lib.rs",
        "adapters/src/sql.rs", "adapters/tests/postgres_conformance.rs",
    ],
    "solana-port": [
        "src/encrypted_durable_devnet/ports/solana.rs", "solana-program/Cargo.toml", "solana-program/src/lib.rs",
        "solana-program/tests/program_test.rs", "solana-program/tests/sbf_program_test.rs", "trial-cli/Cargo.toml",
        "trial-cli/src/executor.rs", "trial-cli/src/main.rs",
    ],
    "evidence-extension": [
        "src/encrypted_durable_devnet/evidence.rs", "trial-cli/Cargo.toml", "trial-cli/src/executor.rs", "trial-cli/src/main.rs",
    ],
}


def exact_targets(layer_id: str, artifacts: dict[str, str]) -> list[dict[str, str]]:
    require(layer_id in LAYER_TARGETS, f"unknown implementation layer: {layer_id}")
    targets = []
    for path in LAYER_TARGETS[layer_id]:
        require(path in artifacts, f"layer target missing from frozen runtime: {path}")
        targets.append({"path": f"runtime/{path}", "sha256": artifacts[path]})
    return targets


def proof_provider_binding(proof_id: str) -> dict[str, Any]:
    if proof_id == "KEP-SOL2-PROOF-END-TO-END-DEVNET":
        return {"evidence_state": "not_evaluable", "causal_blocker": "No authorized real finalized Devnet trial exists."}
    if proof_id == "KEP-SOL2-PROOF-SECURITY-REVIEW":
        return {"evidence_state": "not_evaluable", "causal_blocker": "The independent review helper has not yet been joined or accepted."}
    providers = ["two-cycle-local-runtime-validation", "protocol-local-formal-provider-receipt"]
    if "CRYPTO" in proof_id or "RECIPIENT" in proof_id or "REISSUE" in proof_id:
        providers.append("crypto-known-answer-harness")
    if "STORAGE" in proof_id or "THREE-LAYER" in proof_id:
        providers.append("postgres-three-layer-integration")
    if "GRANT" in proof_id or "REISSUE" in proof_id or "FINALIZED" in proof_id:
        providers.append("solana-program-test-and-sbf-load")
    return {"evidence_state": "bound-local-candidate-evidence", "providers": providers}


def build_binding(policy_override: dict[str, Any] | None = None) -> dict[str, Any]:
    policy = copy.deepcopy(policy_override) if policy_override is not None else load_json(POLICY_PATH)
    inputs = verify_inputs(policy)
    predecessor = inputs["predecessor_binding"]
    ontology = inputs["system_ontology"]
    stable = inputs["stable"]
    relations = inputs["relations"]
    final_cycle = stable["cycles"][-1]
    artifacts = {item["path"]: item["sha256"] for item in final_cycle["runtime_material"]}
    records = {item["relation_id"]: item for item in relations["records"]}

    node_mappings = []
    for prior in predecessor["node_mappings"]:
        node_mappings.append({
            "system_id": prior["system_id"],
            "domainspec_selector": prior["domainspec_selector"],
            "domainspec_kind": prior["domainspec_kind"],
            "semantic_bindings": prior["semantic_bindings"],
            "layer_id": prior["layer_id"],
            "implementation_targets": exact_targets(prior["layer_id"], artifacts),
            "coverage_state": "exact-postimplementation-byte-binding-candidate",
            "conformance_status": "candidate-not-accepted",
        })

    relation_mappings = []
    for prior in predecessor["relation_mappings"]:
        record = records[prior["domainspec_edge_id"]]
        relation_mappings.append({
            "system_relation_id": prior["system_relation_id"],
            "domainspec_edge_id": prior["domainspec_edge_id"],
            "relationship": prior["relationship"],
            "source_system_id": prior["source_system_id"],
            "target_system_id": prior["target_system_id"],
            "semantic_bindings": prior["semantic_bindings"],
            "source_layer_id": prior["source_layer_id"],
            "target_layer_id": prior["target_layer_id"],
            "relation_evidence": {
                "matrix_id": relations["matrix_id"],
                "case_id": record["case_id"],
                "provider_id": record["provider_id"],
                "record_digest": record["record_digest"],
                "bounded_result": record["bounded_result"],
            },
            "coverage_state": "exact-relation-evidence-joined-candidate",
            "conformance_status": "bounded-local-candidate-not-accepted",
        })

    proof_mappings = []
    for proof in ontology["proof_obligations"]:
        proof_mappings.append({
            "proof_requirement_id": proof["proof_requirement_id"],
            "bound_selectors": proof["domainspec_nodes"],
            "provider_binding": proof_provider_binding(proof["proof_requirement_id"]),
            "conformance_status": "not_evaluable",
            "causal_blocker": "This candidate binds evidence but cannot accept proof discharge or aggregate conformance.",
        })

    boundary_bindings = [
        {
            "boundary_id": boundary_id,
            "selector_count": len(selectors),
            "runtime_material_digest": policy["frozen_local_evidence"]["runtime_material_digest"],
            "binding_state": "exact-postimplementation-candidate",
            "conformance_status": "not_evaluable",
        }
        for boundary_id, selectors in sorted(ontology["boundaries"].items())
    ]

    return {
        "schema_version": "cav2-kep-sol2-rust-postimplementation-binding/v1-candidate",
        "binding_id": policy["binding_id"],
        "policy_id": policy["policy_id"],
        "route_id": policy["route_id"],
        "objective_route_id": policy["objective_route_id"],
        "lifecycle_status": "authored-postimplementation-candidate",
        "source_authorization": policy["source_authorization"],
        "dependency_path_root": policy["dependency_path_root"],
        "accepted_predecessor_binding": policy["accepted_predecessor_binding"],
        "superseded_candidate_provenance": policy["superseded_candidate_provenance"],
        "admitted_system_ontology": policy["admitted_system_ontology"],
        "implementation_material": {
            "digest_algorithm": policy["frozen_local_evidence"]["runtime_material_digest_algorithm"],
            "path_root": policy["frozen_local_evidence"]["runtime_path_root"],
            "digest": policy["frozen_local_evidence"]["runtime_material_digest"],
            "artifact_count": len(final_cycle["runtime_material"]),
            "artifacts": final_cycle["runtime_material"],
        },
        "implementation_substrate": {
            "language": "rust",
            "edition": "2021",
            "workspace_crates": [
                "cyberalchemy-knowledge-exchange-protocol", "cyberalchemy-kep-adapters",
                "cyberalchemy-kep-solana-program", "cyberalchemy-kep-trial-cli",
            ],
            "workspace_manifest": {"path": "runtime/Cargo.toml", "sha256": artifacts["Cargo.toml"]},
            "workspace_lock": {"path": "runtime/Cargo.lock", "sha256": artifacts["Cargo.lock"]},
            "unsafe_code": "denied-by-protocol-kernel",
        },
        "sbf_identity": {
            "sha256": policy["frozen_local_evidence"]["sbf_sha256"],
            "size_bytes": policy["frozen_local_evidence"]["sbf_size_bytes"],
            "agave_version": final_cycle["sbf"]["agave_version"],
            "agave_archive_sha256": final_cycle["sbf"]["agave_archive_sha256"],
            "build_result": "PASS_BOUNDED",
            "local_load_result": "PASS_BOUNDED",
        },
        "local_evidence_binding": {
            "stable_cycle_path": policy["frozen_local_evidence"]["stable_cycle_path"],
            "stable_cycle_sha256": policy["frozen_local_evidence"]["stable_cycle_sha256"],
            "cycle_count": len(stable["cycles"]),
            "cycle_result": stable["result"],
            "formal_provider_receipt_sha256": policy["frozen_local_evidence"]["formal_provider_receipt_sha256"],
            "relation_evidence": {
                "path": policy["frozen_local_evidence"]["relation_evidence_path"],
                "sha256": policy["frozen_local_evidence"]["relation_evidence_sha256"],
                "supported_bounded_local": relations["relation_count"],
            },
            "secret_surface_scan": final_cycle["secret_surface_scan"],
        },
        "node_mappings": node_mappings,
        "relation_mappings": relation_mappings,
        "proof_mappings": proof_mappings,
        "boundary_bindings": boundary_bindings,
        "coverage": {
            "system_nodes_total": 89,
            "exact_node_targets": len(node_mappings),
            "system_relations_total": 204,
            "relation_evidence_records_joined": len(relation_mappings),
            "proof_obligations_total": 13,
            "proof_selectors_bound": len(proof_mappings),
            "boundaries_total": 9,
            "exact_implementation_artifacts": len(final_cycle["runtime_material"]),
        },
        "deployment_budget_residue": {
            "original_total_submission_cap": final_cycle["sbf"]["original_total_submission_cap"],
            "original_total_submission_cap_state": final_cycle["sbf"]["original_total_submission_cap_state"],
            "conservative_deployment_submission_bound": final_cycle["sbf"]["conservative_deployment_submission_bound"],
            "candidate_split_budget": final_cycle["sbf"]["candidate_split_budget"],
            "authorization_state": "not-authorized-by-this-candidate",
        },
        "acceptance_gate": {
            "binding_acceptance": "requires-separate-owner-decision",
            "independent_review": "requires-parent-joined-review-receipt",
            "aggregate_conformance": "not_evaluable",
            "devnet_trial": "not_evaluable-and-not-authorized",
        },
        "successor_authorization": {
            "accept_binding": "human-owner-only",
            "credentials_or_wallets": "not-authorized",
            "rpc_or_network": "not-authorized",
            "deployment_or_devnet": "not-authorized",
            "publication_or_release": "not-authorized",
        },
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Exact-byte postimplementation Rust binding candidate for the frozen 25-file runtime, exact SBF identity, two-cycle bounded local evidence, and 204 relation-evidence joins. It does not accept the binding, discharge aggregate conformance, approve production security, authorize credentials or wallets, authorize any RPC, deployment, Devnet or Mainnet effect, or authorize publication or release.",
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
        "schema_version": "cav2-kep-sol2-rust-postimplementation-binding-preacceptance/v1",
        "receipt_id": "CA2-RECEIPT-KEP-SOL2-RUST-POSTIMPLEMENTATION-BINDING-PREACCEPTANCE-004",
        "route_id": binding["route_id"],
        "candidate": {
            "binding_id": binding["binding_id"],
            "lifecycle_status": binding["lifecycle_status"],
            "binding_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
            "binding_material_digest": material_digest,
            "artifacts": artifacts,
        },
        "selected_dependencies": {
            "accepted_predecessor_binding_material": binding["accepted_predecessor_binding"]["binding_material_digest"],
            "admitted_system_ontology_candidate_set": binding["admitted_system_ontology"]["candidate_set_digest"],
            "runtime_material": binding["implementation_material"]["digest"],
            "stable_cycle": binding["local_evidence_binding"]["stable_cycle_sha256"],
            "relation_evidence": binding["local_evidence_binding"]["relation_evidence"]["sha256"],
            "sbf": binding["sbf_identity"]["sha256"],
        },
        "closure": {
            "runtime_artifacts": "25/25 exact",
            "system_nodes": "89/89 exact-byte mapped",
            "system_relations": "204/204 relation-evidence joined",
            "proof_obligations": "13/13 selectors bound without acceptance",
            "boundaries": "9/9 bound",
            "stable_cycles": "2/2 PASS_BOUNDED",
        },
        "checks": [
            {"check_id": "accepted-predecessor-exact", "status": "PASS"},
            {"check_id": "successor-003-provenance-preserved", "status": "PASS"},
            {"check_id": "admitted-system-ontology-exact", "status": "PASS"},
            {"check_id": "runtime-material-exact", "status": "PASS"},
            {"check_id": "sbf-identity-and-local-load-exact", "status": "PASS_BOUNDED"},
            {"check_id": "two-cycle-local-validation", "status": "PASS_BOUNDED"},
            {"check_id": "relation-evidence-closure", "status": "PASS_BOUNDED"},
            {"check_id": "selector-mapping-closure", "status": "PASS"},
            {"check_id": "binding-acceptance", "status": "not_evaluable", "causal_blocker": "A separate owner decision is required."},
            {"check_id": "independent-review", "status": "not_evaluable", "causal_blocker": "The parent has not yet joined the independent review helper."},
            {"check_id": "aggregate-conformance", "status": "not_evaluable", "causal_blocker": "Binding acceptance, independent review, real finalized Devnet evidence, and a final owner decision remain absent."},
            {"check_id": "devnet-trial", "status": "not_evaluable", "causal_blocker": "Credentials, wallets, RPC, deployment, and signed submissions are not authorized by this candidate."},
        ],
        "author": {"path": "../author.py", "sha256": sha256_file(Path(__file__))},
        "tests": {"path": "../tests/test_author.py", "sha256": sha256_file(TEST_PATH)},
        "decision_gate": {
            "status": "ready-for-separate-owner-binding-decision",
            "required_candidate_material_digest": material_digest,
            "decision_limit": "Any acceptance may bind only this exact policy and generated binding candidate; it cannot approve aggregate conformance, production security, external effects, or publication.",
        },
        "preacceptance": {"status": "PASS_BOUNDED", "authority_effect": "none"},
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": binding["claim_ceiling"],
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
        else:
            BINDING_PATH.parent.mkdir(parents=True, exist_ok=True)
            BINDING_PATH.write_bytes(binding_raw)
            PREACCEPTANCE_PATH.write_bytes(preacceptance_raw)
        material_digest, _ = binding_material(binding_raw)
        print(f"PASS binding={material_digest} runtime={json.loads(binding_raw)['implementation_material']['digest']}")
        return 0
    except (BindingError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"BLOCK: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
