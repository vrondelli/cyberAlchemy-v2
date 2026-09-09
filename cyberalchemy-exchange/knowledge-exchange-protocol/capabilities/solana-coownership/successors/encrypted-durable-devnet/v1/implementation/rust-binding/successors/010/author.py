#!/usr/bin/env python3
"""Author exact prefunded-only and fail-closed-reconciliation binding 010."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
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


def verify_runtime(
    cycle: dict[str, Any], frozen: dict[str, Any]
) -> tuple[list[tuple[str, bytes]], dict[str, str]]:
    material = cycle["runtime_material"]
    require(len(material) == frozen["runtime_material_file_count"], "runtime file count drift")
    require(len({item["path"] for item in material}) == len(material), "duplicate runtime material path")
    entries: list[tuple[str, bytes]] = []
    artifacts: dict[str, str] = {}
    for item in material:
        relative = item["path"]
        require(
            not Path(relative).is_absolute() and ".." not in Path(relative).parts,
            f"runtime path escapes root: {relative}",
        )
        path = RUNTIME_ROOT / relative
        require(path.is_file(), f"missing runtime material: {relative}")
        raw = path.read_bytes()
        require(sha256_bytes(raw) == item["sha256"], f"runtime material drift: {relative}")
        entries.append((relative, raw))
        artifacts[relative] = item["sha256"]
    require(
        path_null_digest(entries) == frozen["runtime_material_digest"],
        "runtime material digest does not reproduce",
    )
    return entries, artifacts


def verify_inputs(policy: dict[str, Any]) -> dict[str, Any]:
    expected_mapped_intent = (
        "bind the prefunded-only Devnet runner, typed sanitized RPC failures only for execution "
        "genesis and prefunded-balance observation plus reconciliation genesis, payer-balance, "
        "and signature-status observation, and the fail-closed zero-signature reconciliation repair"
    )
    require(
        policy["source_authorization"]["mapped_intent"] == expected_mapped_intent,
        "RPC repair intent is broader than the exact implemented observation sites",
    )
    predecessor = policy["accepted_predecessor_binding"]
    _, prior = exact_json(
        predecessor["binding_path"], predecessor["binding_sha256"], "accepted predecessor binding 009"
    )
    decision_path, decision = exact_json(
        predecessor["acceptance_decision_path"],
        predecessor["acceptance_decision_sha256"],
        "binding 009 acceptance decision",
    )
    require(prior["binding_id"] == predecessor["binding_id"], "predecessor identity mismatch")
    require(decision["decision_id"] == predecessor["acceptance_decision_id"], "acceptance identity mismatch")
    require(decision["acceptance"]["lifecycle_status"] == "accepted", "predecessor is not accepted")
    require(
        decision["acceptance"]["accepted_binding_id"] == predecessor["binding_id"],
        "accepted binding identity mismatch",
    )
    require(
        decision["acceptance"]["accepted_binding_material_digest"]
        == predecessor["binding_material_digest"],
        "accepted binding material mismatch",
    )
    accepted_entries: list[tuple[str, bytes]] = []
    for item in decision["subject"]["artifacts"]:
        path = (decision_path.parent / item["path"]).resolve()
        require(path.is_file(), f"missing acceptance artifact: {item['path']}")
        raw = path.read_bytes()
        require(sha256_bytes(raw) == item["sha256"], f"acceptance artifact drift: {item['path']}")
        accepted_entries.append((item["material_digest_path"], raw))
    require(
        path_null_digest(accepted_entries) == predecessor["binding_material_digest"],
        "accepted predecessor material digest does not reproduce",
    )
    require(prior["lifecycle_status"] == "authored-postimplementation-candidate", "predecessor posture drift")
    require(prior["authority_effect"] == "none" and prior["external_effect"] == "none", "predecessor overclaim")
    require(len(prior["node_mappings"]) == 89, "predecessor node mapping drift")
    require(len(prior["relation_mappings"]) == 204, "predecessor relation mapping drift")
    require(len(prior["proof_mappings"]) == 13, "predecessor proof mapping drift")
    require(len(prior["boundary_bindings"]) == 9, "predecessor boundary mapping drift")

    frozen = policy["frozen_local_evidence"]
    _, stable = exact_json(frozen["stable_cycle_path"], frozen["stable_cycle_sha256"], "stable local cycle")
    cycles = stable["cycles"]
    require(stable["result"] == frozen["required_cycle_result"], "stable aggregate result drift")
    require(stable["authority_effect"] == "none", "stable evidence manufactured authority")
    require(stable["devnet_state"] == "not_evaluable-not-authorized", "stable Devnet ceiling drift")
    require(len(cycles) == frozen["required_cycle_count"], "stable cycle count drift")
    require(all(cycle["result"] == frozen["required_cycle_result"] for cycle in cycles), "non-pass stable cycle")
    require(
        all(cycle["runtime_material_digest"] == frozen["runtime_material_digest"] for cycle in cycles),
        "runtime digest differs between cycles",
    )
    require(all(cycle["runtime_material"] == cycles[0]["runtime_material"] for cycle in cycles), "runtime manifests differ")
    runtime_entries, artifacts = verify_runtime(cycles[-1], frozen)

    sbf = cycles[-1]["sbf"]
    require(sbf["sbf_sha256"] == frozen["sbf_sha256"], "SBF digest drift")
    require(sbf["sbf_size_bytes"] == frozen["sbf_size_bytes"], "SBF size drift")
    require(
        sbf["exact_fixed_chunk_deployment_submission_bound"]
        == frozen["exact_deployment_submission_count"],
        "deployment submission count drift",
    )
    require(sbf["build"]["exit_code"] == 0 and sbf["load_test"]["exit_code"] == 0, "SBF validation did not pass")

    _, formal = exact_json(
        frozen["formal_provider_receipt_path"],
        frozen["formal_provider_receipt_sha256"],
        "formal provider receipt",
    )
    require(formal["status"] == "PASS_BOUNDED" and formal["two_run_determinism"] is True, "formal posture drift")
    _, relations = exact_json(
        frozen["relation_evidence_path"], frozen["relation_evidence_sha256"], "relation evidence"
    )
    require(relations["relation_count"] == relations["distinct_record_count"] == 204, "relation count drift")
    require(
        all(item["bounded_result"] == "SUPPORTED_BOUNDED_LOCAL" for item in relations["records"]),
        "relation evidence contains a non-supported result",
    )
    require(
        {item["domainspec_edge_id"] for item in prior["relation_mappings"]}
        == {item["relation_id"] for item in relations["records"]},
        "predecessor relation mappings do not join current evidence",
    )

    context = policy["operator_context"]
    _, deferred = exact_json(
        context["deferred_choices_path"], context["deferred_choices_sha256"], "deferred choices"
    )
    choice = next(
        item
        for item in deferred["choices"]
        if item["choice_id"] == "KEP-DEVNET-CHOICE-CRYPTOGRAPHIC-GOVERNANCE-PROVENANCE"
    )
    require(choice["status"] == "deferred", "cryptographic governance provenance is not deferred")
    guide_path = V1_ROOT / context["devnet_guide_path"]
    require(guide_path.is_file(), "Devnet guide missing")
    require(sha256_file(guide_path) == context["devnet_guide_sha256"], "Devnet guide drift")
    guide = guide_path.read_text(encoding="utf-8")
    normalized_guide = " ".join(guide.split())
    require("Fund the disposable payer under a separate authorization" in guide, "separate funding phase missing")
    require("The protocol runner never requests an airdrop" in guide, "no-airdrop guide rule missing")
    require("An unsigned ambiguous journal record remains `PENDING`" in guide, "unsigned reconciliation rule missing")
    require(
        "zero recorded signatures is never sufficient to claim reconciliation" in normalized_guide,
        "zero-signature rule missing",
    )

    main = (RUNTIME_ROOT / "trial-cli/src/main.rs").read_text(encoding="utf-8")
    executor = (RUNTIME_ROOT / "trial-cli/src/executor.rs").read_text(encoding="utf-8")
    contract = policy["funding_and_reconciliation_contract"]
    require(f'const FUNDING_MODE: &str = "{contract["funding_mode"]}";' in main, "prefunded-only mode missing")
    require("minimum_prefunded_lamports" in main and "maximum_prefunded_lamports" in main, "prefunding bounds missing")
    require("request_airdrop(" not in executor, "runner still contains an airdrop call")
    require('"prefunded-balance-verified"' in executor, "prefunded balance gate missing")
    require('"PENDING"' in executor and "unsigned_ambiguous_effects" in executor, "unsigned ambiguity gate missing")
    require("payer_balance_lamports" in executor, "reconciliation payer balance observation missing")
    require('resubmissions: 0' in executor, "zero-resubmission evidence missing")
    require("TrialGateError::SolanaRpc" in executor, "typed sanitized RPC error missing")
    require("detail_sha256" in executor and "failure_class" in executor, "sanitized RPC receipt fields missing")
    expected_rpc_stages = [
        "execution-genesis-hash",
        "execution-prefunded-balance",
        "reconcile-genesis-hash",
        "reconcile-payer-balance",
        "reconcile-signature-status",
    ]
    require(
        contract["typed_sanitized_rpc_observation_stages"] == expected_rpc_stages,
        "typed sanitized RPC observation scope drift",
    )
    production_executor = executor.split("#[cfg(test)]", maxsplit=1)[0]
    observed_rpc_stages = re.findall(
        r'SanitizedRpcFailure::from_error\(\s*"([^"]+)"', production_executor
    )
    require(
        len(observed_rpc_stages) == len(expected_rpc_stages)
        and set(observed_rpc_stages) == set(expected_rpc_stages),
        "typed sanitized RPC implementation exceeds or misses the exact five observation sites",
    )
    require(
        production_executor.count("TrialGateError::Solana") > len(expected_rpc_stages),
        "later deployment and protocol paths no longer retain predecessor generic categorization",
    )
    require(
        contract["later_deployment_and_protocol_rpc_paths"]
        == "retain-predecessor-generic-categorization-not-claimed-by-this-repair",
        "later deployment or protocol RPC paths are overclaimed",
    )
    require(contract["runner_airdrop"] == "forbidden", "policy permits runner airdrop")
    require(contract["unsigned_ambiguous_reconciliation_result"] == "PENDING", "policy weakens ambiguity result")
    require(contract["zero_signature_success_inference"] == "forbidden", "policy permits zero-signature success")
    require(contract["reconciliation_resubmissions"] == 0, "policy permits reconciliation resubmission")

    return {
        "predecessor": prior,
        "stable": stable,
        "formal": formal,
        "relations": relations,
        "deferred": deferred,
        "artifacts": artifacts,
        "runtime_entries": runtime_entries,
    }


def updated_node_mappings(prior: dict[str, Any], artifacts: dict[str, str]) -> list[dict[str, Any]]:
    result = copy.deepcopy(prior["node_mappings"])
    for mapping in result:
        for target in mapping["implementation_targets"]:
            path = target["path"]
            require(path.startswith("runtime/"), f"non-runtime target in predecessor: {path}")
            relative = path.removeprefix("runtime/")
            require(relative in artifacts, f"predecessor target missing from successor runtime: {relative}")
            target["sha256"] = artifacts[relative]
        mapping["coverage_state"] = "exact-prefunded-only-fail-closed-reconciliation-byte-binding-candidate"
        mapping["conformance_status"] = "candidate-not-accepted"
    return result


def updated_relation_mappings(prior: dict[str, Any], relations: dict[str, Any]) -> list[dict[str, Any]]:
    records = {item["relation_id"]: item for item in relations["records"]}
    result = copy.deepcopy(prior["relation_mappings"])
    for mapping in result:
        record = records[mapping["domainspec_edge_id"]]
        mapping["relation_evidence"] = {
            "matrix_id": relations["matrix_id"],
            "case_id": record["case_id"],
            "provider_id": record["provider_id"],
            "record_digest": record["record_digest"],
            "bounded_result": record["bounded_result"],
        }
        mapping["coverage_state"] = "exact-relation-evidence-joined-candidate"
        mapping["conformance_status"] = "bounded-local-candidate-not-accepted"
    return result


def build_binding(policy_override: dict[str, Any] | None = None) -> dict[str, Any]:
    policy = copy.deepcopy(policy_override) if policy_override is not None else load_json(POLICY_PATH)
    inputs = verify_inputs(policy)
    prior = inputs["predecessor"]
    stable = inputs["stable"]
    artifacts = inputs["artifacts"]
    relations = inputs["relations"]
    final_cycle = stable["cycles"][-1]
    boundaries = copy.deepcopy(prior["boundary_bindings"])
    for item in boundaries:
        item["runtime_material_digest"] = policy["frozen_local_evidence"]["runtime_material_digest"]
        item["binding_state"] = "exact-prefunded-only-fail-closed-reconciliation-candidate"
        item["conformance_status"] = "not_evaluable"
    contract = copy.deepcopy(policy["funding_and_reconciliation_contract"])
    contract.update(
        {
            "runner_source_path": "runtime/trial-cli/src/executor.rs",
            "runner_source_sha256": artifacts["trial-cli/src/executor.rs"],
            "envelope_source_path": "runtime/trial-cli/src/main.rs",
            "envelope_source_sha256": artifacts["trial-cli/src/main.rs"],
            "guide_path": policy["operator_context"]["devnet_guide_path"],
            "guide_sha256": policy["operator_context"]["devnet_guide_sha256"],
            "binding_state": "exact-candidate-not-accepted",
        }
    )
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
        "implementation_change": {
            "scope": "off-chain Devnet runner and operator guide only",
            "funding": "separate authorized preparation followed by finalized bounded prefunded-balance verification",
            "rpc_failure_observation_scope": {
                "typed_sanitized_stages": contract["typed_sanitized_rpc_observation_stages"],
                "scope_limit": "only-the-listed-execution-and-reconciliation-observation-sites",
                "later_deployment_and_protocol_paths": contract["later_deployment_and_protocol_rpc_paths"],
            },
            "reconciliation": "unsigned ambiguity remains pending; payer balance is observed; no resubmission",
            "semantic_predecessor_change": "none",
            "solana_program_change": "none",
        },
        "devnet_genesis_identity": {
            "full_base58": policy["devnet_genesis_identity"]["full_base58"],
            "runner_path": "runtime/trial-cli/src/main.rs",
            "runner_sha256": artifacts["trial-cli/src/main.rs"],
        },
        "funding_and_reconciliation_binding": contract,
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
            "formal_provider_receipt": {
                "path": policy["frozen_local_evidence"]["formal_provider_receipt_path"],
                "sha256": policy["frozen_local_evidence"]["formal_provider_receipt_sha256"],
                "status": inputs["formal"]["status"],
            },
            "relation_evidence": {
                "path": policy["frozen_local_evidence"]["relation_evidence_path"],
                "sha256": policy["frozen_local_evidence"]["relation_evidence_sha256"],
                "supported_bounded_local": relations["relation_count"],
            },
        },
        "node_mappings": updated_node_mappings(prior, artifacts),
        "relation_mappings": updated_relation_mappings(prior, relations),
        "proof_mappings": copy.deepcopy(prior["proof_mappings"]),
        "boundary_bindings": boundaries,
        "coverage": {
            "system_nodes_total": 89,
            "exact_node_targets": 89,
            "system_relations_total": 204,
            "relation_evidence_records_joined": 204,
            "proof_obligations_total": 13,
            "proof_selectors_bound": 13,
            "boundaries_total": 9,
            "exact_implementation_artifacts": 26,
        },
        "operator_authorization_boundary": {
            "authorization_model": "operator-mediated-explicit-human-authorization",
            "authorization_attestation": "external-not-attested-by-runner",
            "authority_effect": "none",
            "funding_preparation": "requires-separate-explicit-authorization-before-protocol-trial",
            "cryptographic_governance_provenance": {
                "status": "deferred",
                "path": policy["operator_context"]["deferred_choices_path"],
                "sha256": policy["operator_context"]["deferred_choices_sha256"],
            },
            "devnet_guide": {
                "path": policy["operator_context"]["devnet_guide_path"],
                "sha256": policy["operator_context"]["devnet_guide_sha256"],
            },
            "forbidden_inference": "A prefunded balance, envelope field, status, digest, CLI argument, observed effect, or generated receipt cannot by itself prove human authorization.",
        },
        "acceptance_gate": {
            "binding_acceptance": "requires-separate-owner-decision",
            "independent_review": "requires-separate-joined-review",
            "aggregate_conformance": "not_evaluable",
            "prefunding": "not-authorized-by-binding",
            "devnet_trial": "not_evaluable-and-not-authorized",
        },
        "successor_authorization": {
            "accept_binding": "human-owner-only",
            "credentials_or_wallets": "not-authorized",
            "funding_or_airdrop": "not-authorized",
            "rpc_or_network": "not-authorized",
            "deployment_or_devnet": "not-authorized",
            "publication_or_release": "not-authorized",
        },
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Exact-byte prefunded-only and fail-closed-reconciliation Rust binding candidate for the frozen 26-file local runtime, unchanged SBF, testing guide, and bounded evidence only. It binds separate funding preparation; bounded finalized prefunded-balance verification; typed sanitized failures only for execution genesis and prefunded-balance observation and reconciliation genesis, payer-balance, and signature-status observation; payer-balance reconciliation observation; unsigned ambiguity as PENDING; and zero resubmissions. Later deployment and protocol RPC paths retain predecessor generic categorization and are not claimed by this repair. It changes no admitted semantics and does not establish acceptance, independent review, conformance, funding authority, credentials, RPC, deployment, Devnet or Mainnet effects, publication, or release.",
    }


def binding_material(binding_raw: bytes) -> tuple[str, list[dict[str, str]]]:
    artifacts = [
        {"path": "policy.json", "sha256": sha256_file(POLICY_PATH)},
        {"path": "generated/implementation-binding.json", "sha256": sha256_bytes(binding_raw)},
    ]
    digest = path_null_digest(
        [("policy.json", POLICY_PATH.read_bytes()), ("generated/implementation-binding.json", binding_raw)]
    )
    return digest, artifacts


def build_preacceptance(binding_raw: bytes) -> dict[str, Any]:
    binding = json.loads(binding_raw)
    digest, artifacts = binding_material(binding_raw)
    return {
        "schema_version": "cav2-kep-sol2-rust-postimplementation-binding-preacceptance/v1",
        "receipt_id": "CA2-RECEIPT-KEP-SOL2-RUST-POSTIMPLEMENTATION-BINDING-PREACCEPTANCE-010",
        "route_id": binding["route_id"],
        "candidate": {
            "binding_id": binding["binding_id"],
            "lifecycle_status": binding["lifecycle_status"],
            "binding_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
            "binding_material_digest": digest,
            "artifacts": artifacts,
        },
        "selected_dependencies": {
            "accepted_predecessor_binding": binding["accepted_predecessor_binding"]["binding_material_digest"],
            "acceptance_decision": binding["accepted_predecessor_binding"]["acceptance_decision_sha256"],
            "runtime_material": binding["implementation_material"]["digest"],
            "stable_cycle": binding["local_evidence_binding"]["stable_cycle_sha256"],
            "formal_provider_receipt": binding["local_evidence_binding"]["formal_provider_receipt"]["sha256"],
            "relation_evidence": binding["local_evidence_binding"]["relation_evidence"]["sha256"],
            "sbf": binding["sbf_identity"]["sha256"],
            "guide": binding["operator_authorization_boundary"]["devnet_guide"]["sha256"],
            "deferred_choices": binding["operator_authorization_boundary"]["cryptographic_governance_provenance"]["sha256"],
        },
        "closure": {
            "runtime_artifacts": "26/26 exact",
            "system_nodes": "89/89 mapped",
            "system_relations": "204/204 evidence joined",
            "proof_obligations": "13/13 carried without acceptance",
            "boundaries": "9/9 bound",
            "stable_cycles": "2/2 PASS_BOUNDED",
        },
        "checks": [
            {"check_id": "accepted-predecessor-009-exact-and-unmodified", "status": "PASS"},
            {"check_id": "runtime-material-exact", "status": "PASS"},
            {"check_id": "prefunded-only-mode-exact", "status": "PASS"},
            {"check_id": "runner-airdrop-forbidden", "status": "PASS"},
            {"check_id": "prefunded-bounds-verified-before-signed-effects", "status": "PASS_BOUNDED"},
            {
                "check_id": "rpc-failure-sanitized-and-typed-at-five-observation-sites-only",
                "status": "PASS_BOUNDED",
            },
            {
                "check_id": "later-deployment-and-protocol-rpc-paths-retain-predecessor-generic-categorization",
                "status": "PASS_BOUNDED",
            },
            {"check_id": "unsigned-ambiguity-remains-pending", "status": "PASS_BOUNDED"},
            {"check_id": "zero-signature-success-inference-forbidden", "status": "PASS"},
            {"check_id": "reconciliation-observes-payer-balance", "status": "PASS_BOUNDED"},
            {"check_id": "reconciliation-resubmissions-zero", "status": "PASS"},
            {"check_id": "unchanged-sbf-exact", "status": "PASS_BOUNDED"},
            {"check_id": "formal-and-relation-evidence-exact", "status": "PASS_BOUNDED"},
            {"check_id": "authority-effect-none", "status": "PASS"},
            {
                "check_id": "binding-acceptance",
                "status": "not_evaluable",
                "causal_blocker": "A separate owner decision is required.",
            },
            {
                "check_id": "independent-review",
                "status": "not_evaluable",
                "causal_blocker": "A separate bounded independent review of frozen candidate 010 is required.",
            },
            {
                "check_id": "devnet-trial",
                "status": "not_evaluable",
                "causal_blocker": "Separate funding preparation and exact trial authorization remain absent.",
            },
            {
                "check_id": "aggregate-conformance",
                "status": "not_evaluable",
                "causal_blocker": "Acceptance, independent review, real finalized Devnet evidence, and final owner decision remain absent.",
            },
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
        digest, _ = binding_material(binding_raw)
        print(f"PASS binding={digest} runtime={json.loads(binding_raw)['implementation_material']['digest']}")
        return 0
    except (BindingError, KeyError, StopIteration, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"BLOCK: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
