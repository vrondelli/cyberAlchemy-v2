#!/usr/bin/env python3
"""Author exact residue-hardened post-implementation binding 012."""

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
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode()


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
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(raw)
        digest.update(b"\0")
    return digest.hexdigest()


def verify_accepted_predecessor(policy: dict[str, Any]) -> dict[str, Any]:
    predecessor = policy["accepted_predecessor_binding"]
    _, prior = exact_json(predecessor["binding_path"], predecessor["binding_sha256"], "binding 011")
    decision_path, decision = exact_json(
        predecessor["acceptance_decision_path"],
        predecessor["acceptance_decision_sha256"],
        "binding 011 acceptance decision",
    )
    require(prior["binding_id"] == predecessor["binding_id"], "predecessor identity mismatch")
    acceptance = decision["acceptance"]
    require(decision["decision_id"] == predecessor["acceptance_decision_id"], "decision identity mismatch")
    require(acceptance["lifecycle_status"] == "accepted", "predecessor is not accepted")
    require(acceptance["accepted_binding_id"] == predecessor["binding_id"], "accepted identity mismatch")
    require(
        acceptance["accepted_binding_material_digest"] == predecessor["binding_material_digest"],
        "accepted material digest mismatch",
    )
    entries: list[tuple[str, bytes]] = []
    for artifact in decision["subject"]["artifacts"]:
        path = (decision_path.parent / artifact["path"]).resolve()
        require(path.is_file(), f"missing accepted artifact: {artifact['path']}")
        raw = path.read_bytes()
        require(sha256_bytes(raw) == artifact["sha256"], f"accepted artifact drift: {artifact['path']}")
        entries.append((artifact["material_digest_path"], raw))
    require(path_null_digest(entries) == predecessor["binding_material_digest"], "accepted digest does not reproduce")
    for key, count in (("node_mappings", 89), ("relation_mappings", 204), ("proof_mappings", 13), ("boundary_bindings", 9)):
        require(len(prior[key]) == count, f"predecessor {key} drift")
    return prior


def verify_runtime(cycle: dict[str, Any], frozen: dict[str, Any]) -> dict[str, str]:
    material = cycle["runtime_material"]
    require(len(material) == frozen["runtime_material_file_count"], "runtime file count drift")
    require(len({item["path"] for item in material}) == len(material), "duplicate runtime path")
    entries: list[tuple[str, bytes]] = []
    artifacts: dict[str, str] = {}
    for item in material:
        relative = item["path"]
        require(not Path(relative).is_absolute() and ".." not in Path(relative).parts, "runtime path escapes root")
        path = RUNTIME_ROOT / relative
        require(path.is_file(), f"missing runtime artifact: {relative}")
        raw = path.read_bytes()
        require(sha256_bytes(raw) == item["sha256"], f"runtime artifact drift: {relative}")
        entries.append((relative, raw))
        artifacts[relative] = item["sha256"]
    require(path_null_digest(entries) == frozen["runtime_material_digest"], "runtime digest does not reproduce")
    return artifacts


def verify_inputs(policy: dict[str, Any]) -> dict[str, Any]:
    prior = verify_accepted_predecessor(policy)

    review_policy = policy["independent_review"]
    _, review = exact_json(review_policy["path"], review_policy["sha256"], "independent review 009")
    require(review["review_id"] == review_policy["review_id"], "review identity mismatch")
    require(review["result"] == "PASS_BOUNDED", "review result drift")
    require(review["blocking_findings"] == [], "review acquired a blocker")
    require(review["unresolved_high_or_critical"] is False, "review acquired high or critical residue")
    carried = review["carried_prior_medium_residue"]
    require(len(carried) == review_policy["carried_medium_residue"], "review residue denominator drift")

    residue_policy = policy["residue_evidence"]
    _, residue = exact_json(residue_policy["path"], residue_policy["sha256"], "residue evidence 012")
    require(residue["evidence_id"] == residue_policy["evidence_id"], "residue evidence identity mismatch")
    denominator = residue["residue_denominator"]
    dispositions = residue["dispositions"]
    require(len(denominator) == residue_policy["required_denominator"], "residue denominator drift")
    require({item["finding_id"] for item in dispositions} == set(denominator), "residue disposition join drift")
    require(residue["authority_effect"] == "none" and residue["external_effect"] == "none", "residue evidence overclaim")

    frozen = policy["frozen_local_evidence"]
    _, stable = exact_json(frozen["stable_cycle_path"], frozen["stable_cycle_sha256"], "stable local cycle")
    cycles = stable["cycles"]
    require(stable["result"] == frozen["required_cycle_result"], "stable result drift")
    require(stable["authority_effect"] == "none", "stable cycle manufactured authority")
    require(stable["devnet_state"] == "not_evaluable-not-authorized", "stable Devnet ceiling drift")
    require(len(cycles) == frozen["required_cycle_count"], "stable cycle count drift")
    require(all(cycle["result"] == "PASS_BOUNDED" for cycle in cycles), "non-pass stable cycle")
    require(all(cycle["runtime_material_digest"] == frozen["runtime_material_digest"] for cycle in cycles), "runtime digest cycle drift")
    require(all(cycle["runtime_material"] == cycles[0]["runtime_material"] for cycle in cycles), "runtime manifest cycle drift")
    artifacts = verify_runtime(cycles[-1], frozen)
    sbf = cycles[-1]["sbf"]
    require(sbf["sbf_sha256"] == frozen["sbf_sha256"], "SBF digest drift")
    require(sbf["sbf_size_bytes"] == frozen["sbf_size_bytes"], "SBF size drift")
    require(sbf["exact_fixed_chunk_deployment_submission_bound"] == frozen["exact_deployment_submission_count"], "deployment bound drift")
    require(sbf["build"]["exit_code"] == 0 and sbf["load_test"]["exit_code"] == 0, "SBF validation failed")

    _, formal = exact_json(frozen["formal_provider_receipt_path"], frozen["formal_provider_receipt_sha256"], "formal receipt")
    require(formal["status"] == "PASS_BOUNDED" and formal["two_run_determinism"] is True, "formal posture drift")
    _, relations = exact_json(frozen["relation_evidence_path"], frozen["relation_evidence_sha256"], "relation evidence")
    require(relations["relation_count"] == relations["distinct_record_count"] == 204, "relation evidence drift")

    context = policy["operator_context"]
    exact_json(context["deferred_choices_path"], context["deferred_choices_sha256"], "deferred choices")
    guide_path = V1_ROOT / context["devnet_guide_path"]
    require(sha256_file(guide_path) == context["devnet_guide_sha256"], "Devnet guide drift")

    main = (RUNTIME_ROOT / "trial-cli/src/main.rs").read_text(encoding="utf-8")
    executor = (RUNTIME_ROOT / "trial-cli/src/executor.rs").read_text(encoding="utf-8")
    crypto = (RUNTIME_ROOT / "adapters/src/crypto.rs").read_text(encoding="utf-8")
    contract = policy["trial_contract"]
    require(f"envelope.schema_version != {contract['envelope_schema_version']}" in main, "envelope schema drift")
    require("REQUIRED_EFFECT_SURFACE" in main and "enumerated_effect_surface" in main, "effect surface enforcement missing")
    require('const JOURNAL_SCHEMA: &str = "cav2-kep-attempt-journal/v3";' in executor, "journal schema drift")
    require("previous_record_sha256" in executor and "record_sha256" in executor, "journal hash chain missing")
    require("packet_digest" in executor and "fn analyze_attempt_journal" in executor, "packet-bound journal validation missing")
    require("Zeroizing<Vec<u8>>" in executor, "key byte zeroization missing")
    require(executor.count("plaintext_commitment") == 1, "exported plaintext commitment remains")
    require("Entry::Occupied" in crypto and "ContextMismatch" in crypto, "key replacement rejection missing")
    for test_name in (
        "journal_rejects_record_mutation_and_wrong_packet",
        "journal_rejects_sequence_or_predecessor_substitution",
    ):
        require(test_name in executor, f"journal fault test missing: {test_name}")
    require(contract["enumerated_effect_surface"] == sorted(contract["enumerated_effect_surface"]), "effect surface not canonical")
    require(contract["runner_airdrop"] == "forbidden", "runner airdrop permitted")
    require(contract["reconciliation_resubmissions"] == 0, "reconciliation resubmission permitted")
    require(contract["retry_after_ambiguous_effect"] == "forbidden", "ambiguous retry permitted")

    return {"prior": prior, "review": review, "residue": residue, "stable": stable, "formal": formal, "relations": relations, "artifacts": artifacts}


def updated_targets(items: list[dict[str, Any]], artifacts: dict[str, str], mapping_kind: str) -> list[dict[str, Any]]:
    result = copy.deepcopy(items)
    for mapping in result:
        for target in mapping.get("implementation_targets", []):
            relative = target["path"].removeprefix("runtime/")
            require(relative in artifacts, f"{mapping_kind} target missing: {relative}")
            target["sha256"] = artifacts[relative]
        mapping["coverage_state"] = "exact-residue-hardened-byte-binding-candidate"
        mapping["conformance_status"] = "candidate-not-accepted"
    return result


def build_binding(policy_override: dict[str, Any] | None = None) -> dict[str, Any]:
    policy = copy.deepcopy(policy_override) if policy_override is not None else load_json(POLICY_PATH)
    inputs = verify_inputs(policy)
    prior, stable, artifacts = inputs["prior"], inputs["stable"], inputs["artifacts"]
    final_cycle = stable["cycles"][-1]
    boundaries = copy.deepcopy(prior["boundary_bindings"])
    for item in boundaries:
        item["runtime_material_digest"] = policy["frozen_local_evidence"]["runtime_material_digest"]
        item["binding_state"] = "exact-residue-hardened-candidate"
        item["conformance_status"] = "not_evaluable"
    relations = updated_targets(prior["relation_mappings"], artifacts, "relation")
    evidence_records = {item["relation_id"]: item for item in inputs["relations"]["records"]}
    for mapping in relations:
        record = evidence_records[mapping["domainspec_edge_id"]]
        mapping["relation_evidence"] = {
            "matrix_id": inputs["relations"]["matrix_id"],
            "case_id": record["case_id"],
            "provider_id": record["provider_id"],
            "record_digest": record["record_digest"],
            "bounded_result": record["bounded_result"],
        }
    contract = copy.deepcopy(policy["trial_contract"])
    contract.update({
        "runner_source_path": "runtime/trial-cli/src/executor.rs",
        "runner_source_sha256": artifacts["trial-cli/src/executor.rs"],
        "envelope_source_path": "runtime/trial-cli/src/main.rs",
        "envelope_source_sha256": artifacts["trial-cli/src/main.rs"],
        "binding_state": "exact-candidate-not-accepted",
    })
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
        "independent_review": policy["independent_review"],
        "implementation_change": {
            "scope": "off-chain runner, cryptographic adapter, evidence generator, and deterministic D65 loop only",
            "journal": "packet-bound, sequence-checked, predecessor-linked and record-hashed attempt journal",
            "custody": "HPKE private bytes are snapshotted once and zeroized in process",
            "evidence_privacy": "exported decryption evidence excludes the deterministic plaintext commitment",
            "key_directory": "duplicate recipient binding replacement fails closed",
            "effect_surface": "envelope schema v3 requires the exact five-item effect set",
            "semantic_predecessor_change": "none",
            "solana_program_change": "none",
        },
        "residue_evidence_binding": {
            **policy["residue_evidence"],
            "dispositions": inputs["residue"]["dispositions"],
            "claim_ceiling": inputs["residue"]["claim_ceiling"],
        },
        "devnet_genesis_identity": policy["devnet_genesis_identity"],
        "trial_contract": contract,
        "implementation_material": {
            "digest_algorithm": policy["frozen_local_evidence"]["runtime_material_digest_algorithm"],
            "path_root": policy["frozen_local_evidence"]["runtime_path_root"],
            "digest": policy["frozen_local_evidence"]["runtime_material_digest"],
            "artifact_count": len(final_cycle["runtime_material"]),
            "artifacts": final_cycle["runtime_material"],
        },
        "sbf_identity": {
            "sha256": policy["frozen_local_evidence"]["sbf_sha256"],
            "size_bytes": policy["frozen_local_evidence"]["sbf_size_bytes"],
            "exact_deployment_submission_count": final_cycle["sbf"]["exact_fixed_chunk_deployment_submission_bound"],
            "change_from_predecessor": "none",
            "build_result": "PASS_BOUNDED",
            "local_load_result": "PASS_BOUNDED",
        },
        "local_evidence_binding": {
            "stable_cycle_path": policy["frozen_local_evidence"]["stable_cycle_path"],
            "stable_cycle_sha256": policy["frozen_local_evidence"]["stable_cycle_sha256"],
            "cycle_count": len(stable["cycles"]),
            "cycle_result": stable["result"],
            "formal_provider_receipt": {"path": policy["frozen_local_evidence"]["formal_provider_receipt_path"], "sha256": policy["frozen_local_evidence"]["formal_provider_receipt_sha256"], "status": inputs["formal"]["status"]},
            "relation_evidence": {"path": policy["frozen_local_evidence"]["relation_evidence_path"], "sha256": policy["frozen_local_evidence"]["relation_evidence_sha256"], "supported_bounded_local": inputs["relations"]["relation_count"]},
        },
        "node_mappings": updated_targets(prior["node_mappings"], artifacts, "node"),
        "relation_mappings": relations,
        "proof_mappings": copy.deepcopy(prior["proof_mappings"]),
        "boundary_bindings": boundaries,
        "coverage": {"system_nodes_total": 89, "exact_node_targets": 89, "system_relations_total": 204, "relation_evidence_records_joined": 204, "proof_obligations_total": 13, "proof_selectors_bound": 13, "boundaries_total": 9, "exact_implementation_artifacts": 26, "review_residue_denominator": 10, "residue_dispositions_joined": 10},
        "acceptance_gate": {"binding_acceptance": "requires-separate-owner-decision", "independent_review": "requires-separate-independent-review", "aggregate_conformance": "not_evaluable", "devnet_trial": "requires-new-exact-effect-envelope"},
        "successor_authorization": {"accept_binding": "human-owner-only", "credentials_or_wallets": "not-authorized", "funding_or_airdrop": "not-authorized", "rpc_or_network": "not-authorized", "deployment_or_devnet": "not-authorized", "publication_or_release": "not-authorized"},
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Exact-byte residue-hardened Rust binding candidate for the frozen 26-file runtime, unchanged SBF, ten explicit residue dispositions, and bounded local evidence. It does not close all medium residues, prove formal refinement or production security, attest universal absence of effects, accept or admit this binding, authorize credentials, funding, PostgreSQL, RPC, signing, deployment, a Devnet trial, publication, release, or Mainnet use.",
    }


def binding_material(binding_raw: bytes) -> tuple[str, list[dict[str, str]]]:
    artifacts = [
        {"path": "policy.json", "sha256": sha256_file(POLICY_PATH)},
        {"path": "generated/implementation-binding.json", "sha256": sha256_bytes(binding_raw)},
    ]
    return path_null_digest([("policy.json", POLICY_PATH.read_bytes()), ("generated/implementation-binding.json", binding_raw)]), artifacts


def build_preacceptance(binding_raw: bytes) -> dict[str, Any]:
    binding = json.loads(binding_raw)
    digest, artifacts = binding_material(binding_raw)
    return {
        "schema_version": "cav2-kep-sol2-rust-postimplementation-binding-preacceptance/v1",
        "receipt_id": "CA2-RECEIPT-KEP-SOL2-RUST-POSTIMPLEMENTATION-BINDING-PREACCEPTANCE-012",
        "route_id": binding["route_id"],
        "candidate": {"binding_id": binding["binding_id"], "lifecycle_status": binding["lifecycle_status"], "binding_material_digest_algorithm": "sha256-path-null-bytes-null/v1", "binding_material_digest": digest, "artifacts": artifacts},
        "selected_dependencies": {"accepted_predecessor_binding": binding["accepted_predecessor_binding"]["binding_material_digest"], "acceptance_decision": binding["accepted_predecessor_binding"]["acceptance_decision_sha256"], "independent_review": binding["independent_review"]["sha256"], "residue_evidence": binding["residue_evidence_binding"]["sha256"], "runtime_material": binding["implementation_material"]["digest"], "stable_cycle": binding["local_evidence_binding"]["stable_cycle_sha256"], "formal_provider_receipt": binding["local_evidence_binding"]["formal_provider_receipt"]["sha256"], "relation_evidence": binding["local_evidence_binding"]["relation_evidence"]["sha256"], "sbf": binding["sbf_identity"]["sha256"]},
        "closure": {"runtime_artifacts": "26/26 exact", "system_nodes": "89/89 mapped", "system_relations": "204/204 evidence joined", "proof_obligations": "13/13 carried without acceptance", "boundaries": "9/9 bound", "review_residue_dispositions": "10/10 joined with remaining limits", "stable_cycles": "2/2 PASS_BOUNDED"},
        "checks": [
            {"check_id": "accepted-predecessor-011-exact", "status": "PASS"},
            {"check_id": "review-009-exact", "status": "PASS_BOUNDED"},
            {"check_id": "ten-residue-denominator-exact", "status": "PASS"},
            {"check_id": "packet-bound-hash-chained-journal", "status": "PASS_BOUNDED"},
            {"check_id": "duplicate-key-binding-rejected", "status": "PASS_BOUNDED"},
            {"check_id": "key-bytes-snapshotted-and-zeroized", "status": "PASS_BOUNDED"},
            {"check_id": "exported-plaintext-commitment-removed", "status": "PASS_BOUNDED"},
            {"check_id": "effect-surface-exact", "status": "PASS_BOUNDED"},
            {"check_id": "runtime-material-exact", "status": "PASS"},
            {"check_id": "unchanged-sbf-exact", "status": "PASS_BOUNDED"},
            {"check_id": "binding-acceptance", "status": "not_evaluable", "causal_blocker": "A separate owner decision is required after the bounded Devnet trial is shown."},
            {"check_id": "independent-review", "status": "not_evaluable", "causal_blocker": "A separate independent review of immutable candidate 012 is required."},
            {"check_id": "devnet-trial", "status": "not_evaluable", "causal_blocker": "A new exact credential, database, RPC, signing, submission, and evidence envelope has not been authorized or executed."},
            {"check_id": "aggregate-conformance", "status": "not_evaluable", "causal_blocker": "Candidate acceptance, independent review, real finalized Devnet evidence, and final owner decision remain absent."}
        ],
        "author": {"path": "../author.py", "sha256": sha256_file(Path(__file__))},
        "tests": {"path": "../tests/test_author.py", "sha256": sha256_file(TEST_PATH)},
        "preacceptance": {"status": "PASS_BOUNDED", "authority_effect": "none"},
        "authority_effect": "none",
        "implementation_effect": "none",
        "external_effect": "none",
        "claim_ceiling": binding["claim_ceiling"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        binding_raw = canonical_bytes(build_binding())
        receipt_raw = canonical_bytes(build_preacceptance(binding_raw))
        if args.check:
            require(BINDING_PATH.read_bytes() == binding_raw, "generated binding drift")
            require(PREACCEPTANCE_PATH.read_bytes() == receipt_raw, "generated preacceptance drift")
        else:
            BINDING_PATH.parent.mkdir(parents=True, exist_ok=True)
            BINDING_PATH.write_bytes(binding_raw)
            PREACCEPTANCE_PATH.write_bytes(receipt_raw)
        digest, _ = binding_material(binding_raw)
        print(f"PASS binding={digest} runtime={json.loads(binding_raw)['implementation_material']['digest']}")
        return 0
    except (BindingError, KeyError, OSError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"BLOCK: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
