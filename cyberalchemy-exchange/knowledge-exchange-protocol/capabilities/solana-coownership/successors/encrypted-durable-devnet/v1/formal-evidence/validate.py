#!/usr/bin/env python3
"""Validate the project-local formal-evidence planning candidate."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
PLAN_PATH = ROOT / "plan.json"


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def resolve(relative: str) -> Path:
    return (ROOT / relative).resolve()


def validate() -> dict[str, Any]:
    plan = load(PLAN_PATH)
    predecessors = plan["predecessors"]
    refs = [
        (predecessors["proof_registry"]["path"], predecessors["proof_registry"]["sha256"]),
        (predecessors["accepted_rust_binding"]["binding_path"], predecessors["accepted_rust_binding"]["binding_sha256"]),
        (predecessors["accepted_rust_binding"]["acceptance_decision_path"], predecessors["accepted_rust_binding"]["acceptance_decision_sha256"]),
        (predecessors["local_implementation_candidate"]["path"], predecessors["local_implementation_candidate"]["sha256"]),
        (predecessors["existing_formal_claim"]["claim_path"], predecessors["existing_formal_claim"]["claim_sha256"]),
        (predecessors["existing_formal_claim"]["lean_binding_path"], predecessors["existing_formal_claim"]["lean_binding_sha256"]),
        (predecessors["existing_formal_claim"]["theorem_receipt_path"], predecessors["existing_formal_claim"]["theorem_receipt_sha256"]),
    ]
    for relative, expected in refs:
        path = resolve(relative)
        require(path.is_file(), f"missing predecessor: {relative}")
        require(digest(path) == expected, f"predecessor drift: {relative}")

    proof_registry = load(resolve(predecessors["proof_registry"]["path"]))
    proof_ids = {item["proof_id"] for item in proof_registry["proof_requirements"]}
    require(len(proof_ids) == predecessors["proof_registry"]["proof_count"] == 13, "proof registry count mismatch")

    acceptance = load(resolve(predecessors["accepted_rust_binding"]["acceptance_decision_path"]))
    require(acceptance["acceptance"]["accepted_binding_material_digest"] == predecessors["accepted_rust_binding"]["accepted_material_digest"], "accepted binding digest mismatch")
    implementation = load(resolve(predecessors["local_implementation_candidate"]["path"]))
    require(implementation["implementation_material"]["digest"] == predecessors["local_implementation_candidate"]["implementation_material_digest"], "implementation material digest mismatch")
    require(implementation["proof_summary"] == predecessors["local_implementation_candidate"]["proof_summary"], "implementation proof summary drift")
    require(implementation["proof_summary"]["accepted_conformance"] == 0, "candidate evidence cannot be accepted conformance")

    existing_claim = load(resolve(predecessors["existing_formal_claim"]["claim_path"]))
    require(existing_claim["claim"]["claim_id"] == predecessors["existing_formal_claim"]["claim_id"], "existing claim identity mismatch")
    require(predecessors["existing_formal_claim"]["successor_binding"] == "none", "older claim cannot be treated as exact successor evidence")

    providers = {item["provider_id"] for item in plan["evidence_providers"]}
    require(len(providers) == len(plan["evidence_providers"]), "duplicate evidence provider")
    claims = {item["formal_claim_id"]: item for item in plan["planned_formal_claims"]}
    require(len(claims) == plan["current_summary"]["planned_formal_claims"] == 6, "planned FormalClaim count mismatch")
    require(all(item["status"] == "planned-not-authored" for item in claims.values()), "planned claim status inflation")
    require(all(not resolve(item["target_path"]).exists() for item in claims.values()), "planned FormalClaim target already exists and requires plan refresh")

    mappings = plan["obligation_evidence_plan"]
    mapped_ids = {item["proof_requirement_id"] for item in mappings}
    require(len(mappings) == len(mapped_ids) == 13, "obligation mapping must be unique and total")
    require(mapped_ids == proof_ids, "obligation mapping does not close over proof registry")
    formal_required = 0
    nonformal_primary = 0
    for mapping in mappings:
        require(set(mapping["required_provider_ids"]).issubset(providers), f"unknown provider for {mapping['proof_requirement_id']}")
        claim_id = mapping["planned_formal_claim_id"]
        if claim_id is not None:
            require(claim_id in claims, f"unknown planned FormalClaim: {claim_id}")
            require(mapping["proof_requirement_id"] in claims[claim_id]["proof_requirement_ids"], f"FormalClaim reverse coverage missing: {mapping['proof_requirement_id']}")
            require("EVF-LEAN-FORMALCLAIM" in mapping["required_provider_ids"], f"formal provider missing: {mapping['proof_requirement_id']}")
            formal_required += 1
        else:
            nonformal_primary += 1
        require(mapping["current_state"] not in {"accepted", "discharged", "conformant"}, f"evidence state inflated: {mapping['proof_requirement_id']}")
    require(formal_required == plan["current_summary"]["obligations_requiring_formal_claims"] == 9, "formal obligation count mismatch")
    require(nonformal_primary == plan["current_summary"]["obligations_using_nonformal_primary_evidence"] == 4, "nonformal obligation count mismatch")

    workstreams = {item["workstream_id"]: item for item in plan["workstreams"]}
    require(len(workstreams) == len(plan["workstreams"]), "duplicate workstream")
    for item in workstreams.values():
        require(set(item["depends_on"]).issubset(workstreams), f"unknown workstream dependency: {item['workstream_id']}")
    visiting: set[str] = set()
    visited: set[str] = set()
    def visit(identifier: str) -> None:
        require(identifier not in visiting, f"workstream cycle: {identifier}")
        if identifier in visited:
            return
        visiting.add(identifier)
        for dependency in workstreams[identifier]["depends_on"]:
            visit(dependency)
        visiting.remove(identifier)
        visited.add(identifier)
    for identifier in workstreams:
        visit(identifier)

    e2e = next(item for item in mappings if item["proof_requirement_id"] == "KEP-SOL2-PROOF-END-TO-END-DEVNET")
    require(len(e2e["depends_on_proof_requirement_ids"]) == 11, "end-to-end dependency closure mismatch")
    require(set(e2e["depends_on_proof_requirement_ids"]).issubset(proof_ids), "unknown end-to-end proof dependency")
    require(plan["current_summary"]["exact_successor_formal_claims"] == 0, "FormalClaim existence inflated")
    require(plan["current_summary"]["accepted_conformance_results"] == 0, "conformance inflated")
    require(plan["current_summary"]["external_trials"] == 0, "external trial inflated")
    for key in ("authority_effect", "implementation_effect", "enforcement_effect", "external_effect"):
        require(plan[key] == "none", f"effect ceiling violated: {key}")

    return {
        "schema_version": "cav2-kep-sol2-formal-evidence-plan-validation/v1",
        "result": "PASS",
        "plan_id": plan["plan_id"],
        "plan_sha256": digest(PLAN_PATH),
        "proof_requirements": 13,
        "providers": len(providers),
        "planned_formal_claims": len(claims),
        "formal_claim_required_obligations": formal_required,
        "nonformal_primary_obligations": nonformal_primary,
        "workstreams": len(workstreams),
        "authority_effect": "none",
        "external_effect": "none"
    }


def main() -> int:
    try:
        print(json.dumps(validate(), indent=2))
        return 0
    except (ValueError, KeyError, OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"result": "BLOCK", "error": str(exc), "authority_effect": "none"}, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
