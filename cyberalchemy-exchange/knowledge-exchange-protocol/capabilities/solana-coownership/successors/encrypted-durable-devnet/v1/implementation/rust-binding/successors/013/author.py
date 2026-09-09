#!/usr/bin/env python3
"""Author the exact journal-aware deployment-continuation binding candidate 013."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
V1_ROOT = HERE.parents[3]
PRODUCT_ROOT = V1_ROOT.parents[4]
RUNTIME_ROOT = PRODUCT_ROOT / "runtime"
POLICY_PATH = HERE / "policy.json"
BINDING_PATH = HERE / "generated/implementation-binding.json"
PREACCEPTANCE_PATH = HERE / "generated/preacceptance-001.json"


class BindingError(RuntimeError):
    pass


def canonical(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def file_sha(path: Path) -> str:
    return sha256(path.read_bytes())


def require(condition: bool, message: str) -> None:
    if not condition:
        raise BindingError(message)


def load_exact(relative: str, expected: str, label: str) -> dict[str, Any]:
    path = V1_ROOT / relative
    require(path.is_file(), f"missing {label}: {relative}")
    require(file_sha(path) == expected, f"{label} drift: {relative}")
    return json.loads(path.read_text(encoding="utf-8"))


def verify_exact_file(relative: str, expected: str, label: str) -> None:
    path = V1_ROOT / relative
    require(path.is_file(), f"missing {label}: {relative}")
    require(file_sha(path) == expected, f"{label} drift: {relative}")


def path_null_digest(entries: list[tuple[str, bytes]]) -> str:
    digest = hashlib.sha256()
    for relative, raw in sorted(entries):
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(raw)
        digest.update(b"\0")
    return digest.hexdigest()


def verified_inputs(policy: dict[str, Any]) -> dict[str, Any]:
    predecessor_policy = policy["accepted_predecessor"]
    predecessor = load_exact(
        predecessor_policy["binding_path"],
        predecessor_policy["binding_sha256"],
        "accepted predecessor binding",
    )
    acceptance = load_exact(
        predecessor_policy["acceptance_path"],
        predecessor_policy["acceptance_sha256"],
        "accepted predecessor decision",
    )
    accepted = acceptance["acceptance"]
    require(accepted["lifecycle_status"] == "accepted", "predecessor not accepted")
    require(
        accepted["accepted_binding_id"] == predecessor["binding_id"],
        "accepted predecessor identity mismatch",
    )
    require(
        accepted["accepted_binding_material_digest"]
        == predecessor_policy["binding_material_digest"],
        "accepted predecessor material mismatch",
    )
    for dependency in policy["construction_dependencies"]:
        load_exact(dependency["path"], dependency["sha256"], dependency["kind"])

    evidence = policy["local_evidence"]
    stable = load_exact(
        evidence["stable_cycle_path"], evidence["stable_cycle_sha256"], "stable D65 cycle"
    )
    plan = load_exact(evidence["plan_path"], evidence["plan_sha256"], "continuation plan")
    verify_exact_file(evidence["guide_path"], evidence["guide_sha256"], "Devnet guide")
    require(stable["result"] == evidence["required_result"], "stable result drift")
    require(len(stable["cycles"]) == evidence["required_cycles"], "cycle count drift")
    require(
        all(cycle["result"] == "PASS_BOUNDED" for cycle in stable["cycles"]),
        "D65 cycle did not pass bounded",
    )
    final = stable["cycles"][-1]
    require(
        final["runtime_material_digest"] == evidence["runtime_material_digest"],
        "runtime digest drift",
    )
    material = final["runtime_material"]
    require(len(material) == evidence["runtime_material_file_count"], "runtime count drift")
    entries: list[tuple[str, bytes]] = []
    artifact_map: dict[str, str] = {}
    for item in material:
        relative = item["path"]
        path = RUNTIME_ROOT / relative
        require(path.is_file(), f"missing runtime file: {relative}")
        raw = path.read_bytes()
        require(sha256(raw) == item["sha256"], f"runtime file drift: {relative}")
        entries.append((relative, raw))
        artifact_map[relative] = item["sha256"]
    require(
        path_null_digest(entries) == evidence["runtime_material_digest"],
        "runtime material does not reproduce",
    )
    contract = policy["continuation_contract"]
    progress = plan["derived_progress"]
    for key in (
        "first_unwritten_chunk_index",
        "predecessor_deployment_submissions",
        "remaining_write_submissions",
        "final_deploy_submissions",
        "exact_additional_deployment_submissions",
        "replayed_predecessor_submissions",
        "protocol_submissions",
    ):
        require(progress[key] == contract[key], f"continuation contract drift: {key}")
    require(plan["authority_effect"] == "none", "plan manufactured authority")
    require(plan["external_effect"] == "none", "plan recorded an external effect")
    return {
        "predecessor": predecessor,
        "stable": stable,
        "plan": plan,
        "artifact_map": artifact_map,
    }


def updated_mappings(
    source: list[dict[str, Any]], artifact_map: dict[str, str]
) -> list[dict[str, Any]]:
    mappings = copy.deepcopy(source)
    for mapping in mappings:
        for target in mapping.get("implementation_targets", []):
            relative = target["path"].removeprefix("runtime/")
            require(relative in artifact_map, f"target missing from runtime manifest: {relative}")
            target["sha256"] = artifact_map[relative]
        mapping["coverage_state"] = "exact-deployment-continuation-byte-binding-candidate"
        mapping["conformance_status"] = "candidate-not-accepted"
    return mappings


def build_binding(policy_override: dict[str, Any] | None = None) -> dict[str, Any]:
    policy = (
        copy.deepcopy(policy_override)
        if policy_override is not None
        else json.loads(POLICY_PATH.read_text(encoding="utf-8"))
    )
    inputs = verified_inputs(policy)
    predecessor = inputs["predecessor"]
    artifact_map = inputs["artifact_map"]
    boundaries = copy.deepcopy(predecessor["boundary_bindings"])
    for boundary in boundaries:
        boundary["runtime_material_digest"] = policy["local_evidence"][
            "runtime_material_digest"
        ]
        boundary["binding_state"] = "exact-deployment-continuation-candidate"
        boundary["conformance_status"] = "not_evaluable"
    return {
        "schema_version": "cav2-kep-deployment-continuation-binding/v1-candidate",
        "binding_id": policy["binding_id"],
        "policy_id": policy["policy_id"],
        "route_id": policy["route_id"],
        "lifecycle_status": "authored-postimplementation-candidate",
        "source_authorization": policy["source_authorization"],
        "accepted_predecessor": policy["accepted_predecessor"],
        "construction_dependencies": policy["construction_dependencies"],
        "implementation_change": {
            "scope": "off-chain Devnet runner continuation modes, immutable predecessor proof, exact progress planner, on-chain buffer verification, separate journal/evidence, tests and guide",
            "semantic_protocol_change": "none",
            "solana_program_change": "none",
            "postgresql_change": "none",
            "protocol_case_execution": "forbidden-by-continuation-envelope",
        },
        "continuation_contract": policy["continuation_contract"],
        "continuation_plan_evidence": {
            "path": policy["local_evidence"]["plan_path"],
            "sha256": policy["local_evidence"]["plan_sha256"],
            "status": inputs["plan"]["lifecycle_status"],
        },
        "implementation_material": {
            "digest_algorithm": "sha256-path-null-bytes-null/v1",
            "path_root": "cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime",
            "digest": policy["local_evidence"]["runtime_material_digest"],
            "artifact_count": len(inputs["stable"]["cycles"][-1]["runtime_material"]),
            "artifacts": inputs["stable"]["cycles"][-1]["runtime_material"],
        },
        "local_evidence": {
            "stable_cycle_path": policy["local_evidence"]["stable_cycle_path"],
            "stable_cycle_sha256": policy["local_evidence"]["stable_cycle_sha256"],
            "cycle_count": policy["local_evidence"]["required_cycles"],
            "result": policy["local_evidence"]["required_result"],
            "guide_path": policy["local_evidence"]["guide_path"],
            "guide_sha256": policy["local_evidence"]["guide_sha256"],
        },
        "node_mappings": updated_mappings(predecessor["node_mappings"], artifact_map),
        "relation_mappings": updated_mappings(
            predecessor["relation_mappings"], artifact_map
        ),
        "proof_mappings": copy.deepcopy(predecessor["proof_mappings"]),
        "boundary_bindings": boundaries,
        "coverage": {
            "system_nodes_total": len(predecessor["node_mappings"]),
            "system_relations_total": len(predecessor["relation_mappings"]),
            "proof_obligations_total": len(predecessor["proof_mappings"]),
            "boundaries_total": len(predecessor["boundary_bindings"]),
            "runtime_artifacts": len(artifact_map),
            "continuation_tests": len(
                inputs["plan"]["local_evidence"]["continuation_test_ids"]
            ),
        },
        "acceptance_gate": {
            "binding_acceptance": "requires-separate-owner-decision",
            "independent_review": "not_evaluable-not-run-for-candidate-013",
            "deployment_continuation": "not_evaluable-not-authorized-or-executed",
            "protocol_trial": "not_evaluable-deployment-not-complete",
            "aggregate_conformance": "not_evaluable",
        },
        "authority_effect": "none",
        "implementation_effect": "local-source-and-candidate-evidence-only",
        "external_effect": "none",
        "claim_ceiling": "Exact-byte local candidate for journal-aware continuation of one reconciled partial Devnet deployment. It does not accept or admit this binding, authorize credential reuse, RPC, signing, submissions, deployment continuation, protocol execution, publication, release, Mainnet, or production claims.",
    }


def material_digest(policy_raw: bytes, binding_raw: bytes) -> str:
    return path_null_digest(
        [("policy.json", policy_raw), ("generated/implementation-binding.json", binding_raw)]
    )


def build_preacceptance(policy_raw: bytes, binding_raw: bytes) -> dict[str, Any]:
    binding = json.loads(binding_raw)
    return {
        "schema_version": "cav2-kep-deployment-continuation-preacceptance/v1",
        "receipt_id": "CA2-RECEIPT-KEP-SOL2-DEPLOYMENT-CONTINUATION-PREACCEPTANCE-013",
        "route_id": binding["route_id"],
        "candidate": {
            "binding_id": binding["binding_id"],
            "lifecycle_status": binding["lifecycle_status"],
            "binding_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
            "binding_material_digest": material_digest(policy_raw, binding_raw),
            "artifacts": [
                {"path": "policy.json", "sha256": sha256(policy_raw)},
                {
                    "path": "generated/implementation-binding.json",
                    "sha256": sha256(binding_raw),
                },
            ],
        },
        "checks": [
            {"check_id": "accepted-predecessor-011-exact", "status": "PASS"},
            {"check_id": "d65-construction-dependencies-exact", "status": "PASS"},
            {"check_id": "two-stable-local-cycles", "status": "PASS_BOUNDED"},
            {"check_id": "reconciled-contiguous-prefix-plan", "status": "PASS_BOUNDED"},
            {"check_id": "zero-predecessor-replay", "status": "PASS_BOUNDED"},
            {"check_id": "zero-protocol-submissions", "status": "PASS_BOUNDED"},
            {
                "check_id": "binding-acceptance",
                "status": "not_evaluable",
                "causal_blocker": "A separate owner decision over this immutable candidate is required.",
            },
            {
                "check_id": "deployment-continuation",
                "status": "not_evaluable",
                "causal_blocker": "Same-trial credential reuse, RPC, signing and 73 bounded deployment submissions are not authorized or executed by this candidate.",
            },
            {
                "check_id": "protocol-trial",
                "status": "not_evaluable",
                "causal_blocker": "The Solana program deployment is not yet complete and the continuation mode permits zero protocol submissions.",
            },
            {
                "check_id": "aggregate-conformance",
                "status": "not_evaluable",
                "causal_blocker": "Candidate acceptance, independent review, deployment continuation and a separately authorized protocol trial remain absent.",
            },
        ],
        "authority_effect": "none",
        "external_effect": "none",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    policy_raw = POLICY_PATH.read_bytes()
    binding_raw = canonical(build_binding())
    preacceptance_raw = canonical(build_preacceptance(policy_raw, binding_raw))
    if args.check:
        require(BINDING_PATH.read_bytes() == binding_raw, "binding drift")
        require(PREACCEPTANCE_PATH.read_bytes() == preacceptance_raw, "preacceptance drift")
    else:
        BINDING_PATH.parent.mkdir(parents=True, exist_ok=True)
        BINDING_PATH.write_bytes(binding_raw)
        PREACCEPTANCE_PATH.write_bytes(preacceptance_raw)
    digest = json.loads(preacceptance_raw)["candidate"]["binding_material_digest"]
    print(f"PASS candidate={digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
