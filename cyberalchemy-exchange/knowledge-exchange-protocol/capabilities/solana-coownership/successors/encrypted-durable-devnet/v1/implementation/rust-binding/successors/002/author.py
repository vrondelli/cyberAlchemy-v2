#!/usr/bin/env python3
"""Author the exact-byte successor Rust binding for the SOL2 local candidate."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
RUST_BINDING_ROOT = HERE.parents[1]
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


def digest_material(root: Path, artifacts: list[dict[str, str]], path_key: str = "path") -> str:
    digest = hashlib.sha256()
    for item in sorted(artifacts, key=lambda entry: entry[path_key]):
        relative = item[path_key]
        path = root / relative
        require(path.is_file(), f"missing material artifact: {relative}")
        raw = path.read_bytes()
        if "sha256" in item:
            require(sha256_bytes(raw) == item["sha256"], f"material artifact drift: {relative}")
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(raw)
        digest.update(b"\0")
    return digest.hexdigest()


def v1_file(relative: str) -> Path:
    return V1_ROOT / relative


def verify_exact_json(relative: str, expected_sha: str, label: str) -> dict[str, Any]:
    path = v1_file(relative)
    require(path.is_file(), f"missing {label}: {relative}")
    require(sha256_file(path) == expected_sha, f"{label} drift: {relative}")
    return load_json(path)


def verify_inputs(policy: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    predecessor = policy["accepted_predecessor_binding"]
    old_binding = verify_exact_json(
        predecessor["binding_path"], predecessor["binding_sha256"], "accepted predecessor binding"
    )
    require(old_binding["binding_id"] == predecessor["binding_id"], "predecessor binding identity mismatch")

    acceptance = verify_exact_json(
        predecessor["acceptance_decision_path"],
        predecessor["acceptance_decision_sha256"],
        "predecessor acceptance decision",
    )
    require(
        acceptance["decision_id"] == predecessor["acceptance_decision_id"],
        "predecessor acceptance decision identity mismatch",
    )
    require(acceptance["acceptance"]["lifecycle_status"] == "accepted", "predecessor binding is not accepted")
    require(
        acceptance["acceptance"]["accepted_binding_material_digest"] == predecessor["binding_material_digest"],
        "accepted predecessor material digest mismatch",
    )
    accepted_material = [
        {
            "path": item["material_digest_path"],
            "sha256": item["sha256"],
        }
        for item in acceptance["subject"]["artifacts"]
    ]
    require(
        digest_material(RUST_BINDING_ROOT, accepted_material) == predecessor["binding_material_digest"],
        "accepted predecessor material bytes drift",
    )

    ontology_policy = policy["admitted_system_ontology"]
    ontology_decision = verify_exact_json(
        ontology_policy["decision_path"], ontology_policy["decision_sha256"], "system ontology admission decision"
    )
    require(ontology_decision["decision_id"] == ontology_policy["decision_id"], "ontology decision identity mismatch")
    require(ontology_decision["admission"]["lifecycle_status"] == "admitted", "system ontology is not admitted")
    require(
        ontology_decision["admission"]["admitted_system_ontology_id"] == ontology_policy["ontology_id"],
        "admitted system ontology identity mismatch",
    )
    require(
        ontology_decision["admission"]["admitted_candidate_set_digest"] == ontology_policy["candidate_set_digest"],
        "admitted system ontology digest mismatch",
    )
    require(
        old_binding["admitted_predecessor"]["admitted_candidate_set_digest"] == ontology_policy["candidate_set_digest"],
        "accepted binding and admitted system ontology do not join",
    )

    implementation_policy = policy["implementation_candidate"]
    implementation = verify_exact_json(
        implementation_policy["candidate_path"], implementation_policy["candidate_sha256"], "implementation candidate"
    )
    local_preacceptance = verify_exact_json(
        implementation_policy["local_preacceptance_path"],
        implementation_policy["local_preacceptance_sha256"],
        "local conformance preacceptance",
    )
    require(
        implementation["implementation_id"] == implementation_policy["implementation_id"],
        "implementation candidate identity mismatch",
    )
    require(
        implementation["implementation_material"]["digest"] == implementation_policy["implementation_material_digest"],
        "implementation candidate material digest mismatch",
    )
    require(
        local_preacceptance["candidate"]["implementation_material_digest"]
        == implementation_policy["implementation_material_digest"],
        "local preacceptance material digest mismatch",
    )
    require(
        local_preacceptance["candidate"]["implementation_candidate_sha256"]
        == implementation_policy["candidate_sha256"],
        "local preacceptance implementation candidate hash mismatch",
    )
    require(
        local_preacceptance["candidate"]["implementation_id"] == implementation_policy["implementation_id"],
        "local preacceptance implementation identity mismatch",
    )
    require(local_preacceptance["preacceptance"]["status"] == "PASS", "local implementation preacceptance is not PASS")

    declared_material = policy["implementation_material"]
    require(
        declared_material["digest"] == implementation_policy["implementation_material_digest"],
        "policy implementation digests disagree",
    )
    require(
        declared_material["artifacts"] == implementation["implementation_material"]["artifacts"],
        "policy and implementation candidate artifact sets disagree",
    )
    require(
        digest_material(PRODUCT_ROOT, declared_material["artifacts"]) == declared_material["digest"],
        "implementation material bytes do not reproduce authorized digest",
    )

    formal = policy["formal_evidence_workstream"]
    plan = verify_exact_json(formal["plan_path"], formal["plan_sha256"], "formal evidence plan")
    require(plan["plan_id"] == formal["plan_id"], "formal evidence plan identity mismatch")
    workstreams = {item["workstream_id"]: item for item in plan["workstreams"]}
    require(formal["workstream_id"] in workstreams, "successor binding workstream missing")
    require(
        declared_material["digest"] in workstreams[formal["workstream_id"]]["objective"],
        "successor binding workstream names a different implementation digest",
    )

    require(len(old_binding["node_mappings"]) == 89, "accepted predecessor node mapping count drift")
    require(len(old_binding["relation_mappings"]) == 204, "accepted predecessor relation mapping count drift")
    require(len(old_binding["proof_mappings"]) == 13, "accepted predecessor proof mapping count drift")
    require(len(old_binding["boundary_bindings"]) == 9, "accepted predecessor boundary count drift")
    return old_binding, implementation, local_preacceptance


def build_binding(policy_override: dict[str, Any] | None = None) -> dict[str, Any]:
    policy = copy.deepcopy(policy_override) if policy_override is not None else load_json(POLICY_PATH)
    old_binding, implementation, local_preacceptance = verify_inputs(policy)
    artifact_hashes = {item["path"]: item["sha256"] for item in policy["implementation_material"]["artifacts"]}
    proof_assessments = {item["proof_requirement_id"]: item for item in implementation["proof_assessments"]}

    node_mappings: list[dict[str, Any]] = []
    for prior in old_binding["node_mappings"]:
        mapping = copy.deepcopy(prior)
        prior_state = mapping["coverage_state"]
        mapping["coverage_state"] = (
            "realized-existing-symbol-candidate"
            if prior_state == "existing-symbol-candidate"
            else "realized-successor-target-candidate"
        )
        for target in mapping["implementation_targets"]:
            require(target["path"] in artifact_hashes, f"node target is outside exact implementation material: {target['path']}")
            target["sha256"] = artifact_hashes[target["path"]]
            target["target_state"] = "exact-successor-bytes-candidate"
            source_text = (PRODUCT_ROOT / target["path"]).read_text(encoding="utf-8")
            terminal_symbol = target["symbol"].split("::")[-1]
            require(terminal_symbol in source_text, f"node target symbol missing: {target['symbol']}")
        mapping["conformance_status"] = "candidate-not-accepted"
        node_mappings.append(mapping)

    test_path = "runtime/tests/encrypted_durable_devnet.rs"
    require(test_path in artifact_hashes, "successor relation/proof test surface is outside implementation material")
    relation_mappings: list[dict[str, Any]] = []
    for prior in old_binding["relation_mappings"]:
        mapping = copy.deepcopy(prior)
        mapping["coverage_state"] = "compile-time-bound-candidate"
        mapping["required_test_target"]["sha256"] = artifact_hashes[test_path]
        mapping["required_test_target"]["target_state"] = "exact-test-surface-candidate"
        mapping["conformance_status"] = "not_evaluable"
        mapping["causal_blocker"] = (
            "The exact test surface compile-time binds this relation record, but no independent relation-specific "
            "behavior observation or owner conformance decision exists."
        )
        relation_mappings.append(mapping)

    proof_mappings: list[dict[str, Any]] = []
    for prior in old_binding["proof_mappings"]:
        mapping = copy.deepcopy(prior)
        proof_id = mapping["proof_requirement_id"]
        require(proof_id in proof_assessments, f"implementation proof assessment missing: {proof_id}")
        assessment = proof_assessments[proof_id]
        mapping["evidence_state"] = assessment["status"]
        mapping.pop("causal_blocker", None)
        if "evidence" in assessment:
            mapping["candidate_evidence"] = assessment["evidence"]
        if "causal_blocker" in assessment:
            mapping["causal_blocker"] = assessment["causal_blocker"]
        mapping["required_test_target"]["sha256"] = artifact_hashes[test_path]
        mapping["required_test_target"]["target_state"] = "exact-test-surface-candidate"
        mapping["conformance_status"] = "not_evaluable"
        mapping["conformance_blocker"] = "Candidate evidence has not been independently accepted as obligation discharge."
        proof_mappings.append(mapping)

    boundary_bindings = copy.deepcopy(old_binding["boundary_bindings"])
    for boundary in boundary_bindings:
        boundary["representation_state"] = "exact-implementation-material-candidate"
        boundary["conformance_status"] = "not_evaluable"

    implementation_layers = copy.deepcopy(old_binding["implementation_layers"])
    for layer in implementation_layers:
        path = layer["target_path"]
        require(path in artifact_hashes, f"layer target is outside exact implementation material: {path}")
        layer["target_sha256"] = artifact_hashes[path]
        layer["target_state"] = "exact-successor-bytes-candidate"
        layer["conformance_status"] = "not_evaluable"

    proof_summary = implementation["proof_summary"]
    return {
        "schema_version": "cav2-kep-sol2-rust-successor-implementation-binding/v1-candidate",
        "binding_id": policy["binding_id"],
        "route_id": policy["route_id"],
        "lifecycle_status": "authored-successor-candidate",
        "source_authorization": policy["source_authorization"],
        "dependency_path_root": policy["dependency_path_root"],
        "policy": {
            "policy_id": policy["policy_id"],
            "path": "../policy.json",
            "sha256": sha256_file(POLICY_PATH),
        },
        "accepted_predecessor_binding": policy["accepted_predecessor_binding"],
        "admitted_system_ontology": policy["admitted_system_ontology"],
        "implementation_candidate": {
            **policy["implementation_candidate"],
            "lifecycle_status": implementation["lifecycle_status"],
            "local_preacceptance_status": local_preacceptance["preacceptance"]["status"],
        },
        "formal_evidence_workstream": policy["formal_evidence_workstream"],
        "implementation_material": policy["implementation_material"],
        "implementation_substrate": {
            "language": "rust",
            "edition": "2021",
            "crate": "cyberalchemy-knowledge-exchange-protocol",
            "dependency_count": implementation["validation"]["dependency_count"],
            "unsafe_code": implementation["validation"]["unsafe_code"],
            "mutation_effect": "none",
        },
        "implementation_layers": implementation_layers,
        "module_root": {
            "path": "runtime/src/encrypted_durable_devnet/mod.rs",
            "sha256": artifact_hashes["runtime/src/encrypted_durable_devnet/mod.rs"],
            "target_state": "exact-successor-bytes-candidate",
        },
        "test_surface": {
            "path": test_path,
            "sha256": artifact_hashes[test_path],
            "target_state": "exact-successor-bytes-candidate",
            "observed_tests": implementation["validation"]["cargo_test"],
        },
        "boundary_bindings": boundary_bindings,
        "node_mappings": node_mappings,
        "relation_mappings": relation_mappings,
        "proof_mappings": proof_mappings,
        "coverage": {
            "system_nodes_total": len(node_mappings),
            "exact_node_targets": len(node_mappings),
            "realized_existing_symbol_candidates": sum(
                item["coverage_state"] == "realized-existing-symbol-candidate" for item in node_mappings
            ),
            "realized_successor_target_candidates": sum(
                item["coverage_state"] == "realized-successor-target-candidate" for item in node_mappings
            ),
            "system_relations_total": len(relation_mappings),
            "compile_time_bound_relation_records": len(relation_mappings),
            "relation_specific_behavioral_conformance": 0,
            "proof_obligations_total": len(proof_mappings),
            "proof_local_candidate_pass": proof_summary["local_candidate_pass"],
            "proof_partial_local_candidate": proof_summary["partial_local_candidate"],
            "proof_not_evaluable": proof_summary["not_evaluable"],
            "proof_accepted_conformance": proof_summary["accepted_conformance"],
            "boundaries_total": len(boundary_bindings),
            "exact_implementation_artifacts": len(policy["implementation_material"]["artifacts"]),
        },
        "acceptance_gate": {
            "binding_acceptance": "not_evaluable",
            "causal_blocker": "This successor candidate requires a separate owner decision bound to its exact binding material digest.",
            "implementation_candidate": "exact-byte-bound-by-candidate",
            "implementation_conformance": "not_evaluable",
            "conformance_blockers": [
                "four proof obligations remain partial local candidates",
                "two proof obligations remain not_evaluable",
                "204 relation records lack independent relation-specific behavioral observations",
                "no independent owner conformance decision exists",
            ],
            "runtime_evidence": "not_evaluable",
        },
        "successor_authorization": {
            "binding_acceptance": "not-authorized-by-this-candidate",
            "additional_implementation": "not-authorized",
            "aggregate_conformance": "not-authorized",
            "credentials_or_wallets": "not-authorized",
            "devnet_transaction": "not-authorized",
            "publication": "not-authorized",
            "deployment": "not-authorized",
        },
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": (
            "Exact-byte successor Rust binding candidate for implementation material digest "
            f"{policy['implementation_material']['digest']} only. It binds 89 node targets, compile-time binds 204 "
            "relation records, carries seven local proof passes, four partials, and two not_evaluable assessments, "
            "but accepts none as aggregate conformance and authorizes no additional implementation or external effect."
        ),
    }


def binding_material(binding_raw: bytes) -> tuple[str, list[dict[str, str]]]:
    artifacts = [
        {"path": "policy.json", "sha256": sha256_file(POLICY_PATH)},
        {"path": "generated/implementation-binding.json", "sha256": sha256_bytes(binding_raw)},
    ]
    digest = hashlib.sha256()
    for item in sorted(artifacts, key=lambda entry: entry["path"]):
        raw = POLICY_PATH.read_bytes() if item["path"] == "policy.json" else binding_raw
        digest.update(item["path"].encode("utf-8"))
        digest.update(b"\0")
        digest.update(raw)
        digest.update(b"\0")
    return digest.hexdigest(), artifacts


def build_preacceptance(binding_raw: bytes) -> dict[str, Any]:
    binding = json.loads(binding_raw)
    material_digest, artifacts = binding_material(binding_raw)
    return {
        "schema_version": "cav2-kep-sol2-rust-successor-binding-preacceptance/v1",
        "receipt_id": "CA2-RECEIPT-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-RUST-BINDING-PREACCEPTANCE-002",
        "route_id": "CA2-ROUTE-PLAN",
        "source_authorization": binding["source_authorization"],
        "candidate": {
            "binding_id": binding["binding_id"],
            "lifecycle_status": binding["lifecycle_status"],
            "binding_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
            "binding_material_digest": material_digest,
            "artifacts": artifacts,
            "implementation_material_digest": binding["implementation_material"]["digest"],
        },
        "selected_dependencies": {
            "dependency_path_root": binding["dependency_path_root"],
            "accepted_predecessor_binding_id": binding["accepted_predecessor_binding"]["binding_id"],
            "accepted_predecessor_binding_material_digest": binding["accepted_predecessor_binding"]["binding_material_digest"],
            "admitted_system_ontology_id": binding["admitted_system_ontology"]["ontology_id"],
            "admitted_system_ontology_candidate_set_digest": binding["admitted_system_ontology"]["candidate_set_digest"],
            "implementation_id": binding["implementation_candidate"]["implementation_id"],
            "implementation_candidate_sha256": binding["implementation_candidate"]["candidate_sha256"],
            "local_preacceptance_sha256": binding["implementation_candidate"]["local_preacceptance_sha256"],
            "formal_evidence_workstream_id": binding["formal_evidence_workstream"]["workstream_id"],
        },
        "mapping_closure": {
            "exact_node_targets": "89/89 PASS",
            "compile_time_bound_relation_records": "204/204 PASS",
            "relation_specific_behavioral_conformance": "not_evaluable",
            "proof_records": "13/13 represented",
            "system_boundaries": "9/9 represented",
            "implementation_artifacts": "12/12 exact",
        },
        "proof_summary": {
            "local_candidate_pass": binding["coverage"]["proof_local_candidate_pass"],
            "partial_local_candidate": binding["coverage"]["proof_partial_local_candidate"],
            "not_evaluable": binding["coverage"]["proof_not_evaluable"],
            "accepted_conformance": binding["coverage"]["proof_accepted_conformance"],
        },
        "checks": [
            {"check_id": "accepted-predecessor-exact", "status": "PASS"},
            {"check_id": "admitted-system-ontology-exact", "status": "PASS"},
            {"check_id": "implementation-material-exact", "status": "PASS"},
            {"check_id": "node-target-closure", "status": "PASS"},
            {"check_id": "relation-record-closure", "status": "PASS"},
            {
                "check_id": "relation-specific-behavioral-conformance",
                "status": "not_evaluable",
                "causal_blocker": "Compile-time record closure is not 204 independent behavioral observations.",
            },
            {"check_id": "proof-assessment-closure", "status": "PASS"},
            {
                "check_id": "aggregate-implementation-conformance",
                "status": "not_evaluable",
                "causal_blocker": "Four proof obligations are partial, two are not_evaluable, relation-specific evidence is incomplete, and no owner conformance decision exists.",
            },
        ],
        "author": {"path": "../author.py", "sha256": sha256_file(Path(__file__))},
        "tests": {"path": "../tests/test_author.py", "sha256": sha256_file(TEST_PATH)},
        "decision_gate": {
            "status": "ready-for-exact-successor-binding-decision",
            "required_digest": material_digest,
            "admissible_option_ids": [
                "ACCEPT-EXACT-SUCCESSOR-RUST-BINDING",
                "REJECT-EXACT-SUCCESSOR-RUST-BINDING",
                "DEFER-EXACT-SUCCESSOR-RUST-BINDING",
            ],
            "decision_limit": "Acceptance may bind only this exact successor mapping candidate; it cannot accept aggregate implementation conformance or authorize external effects.",
        },
        "preacceptance": {
            "status": "PASS",
            "meaning": "The successor Rust binding candidate is exact-byte identified, predecessor-bound, mapping-closed at the declared level, and ready for a separate owner decision.",
            "authority_effect": "none",
        },
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Preaccepted exact successor binding candidate only; no binding acceptance, aggregate conformance, production security, SQL durability, Devnet evidence, publication, release, deployment, or external effect.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        binding_raw = canonical_bytes(build_binding())
        preacceptance_raw = canonical_bytes(build_preacceptance(binding_raw))
        if args.check:
            require(BINDING_PATH.is_file(), f"missing generated binding: {BINDING_PATH}")
            require(PREACCEPTANCE_PATH.is_file(), f"missing preacceptance: {PREACCEPTANCE_PATH}")
            require(BINDING_PATH.read_bytes() == binding_raw, "generated successor binding drift")
            require(PREACCEPTANCE_PATH.read_bytes() == preacceptance_raw, "generated preacceptance drift")
            mode = "check"
        else:
            BINDING_PATH.parent.mkdir(parents=True, exist_ok=True)
            BINDING_PATH.write_bytes(binding_raw)
            PREACCEPTANCE_PATH.write_bytes(preacceptance_raw)
            mode = "write"
        material_digest, _ = binding_material(binding_raw)
        print(json.dumps({
            "schema_version": "cav2-kep-sol2-rust-successor-binding-author-command/v1",
            "result": "pass",
            "mode": mode,
            "binding_id": json.loads(binding_raw)["binding_id"],
            "binding_sha256": sha256_bytes(binding_raw),
            "binding_material_digest": material_digest,
            "preacceptance_sha256": sha256_bytes(preacceptance_raw),
            "authority_effect": "none",
            "implementation_effect": "none",
            "external_effect": "none",
        }, indent=2))
        return 0
    except (BindingError, KeyError, ValueError, OSError) as exc:
        print(json.dumps({"result": "fail", "error": str(exc), "authority_effect": "none"}, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
