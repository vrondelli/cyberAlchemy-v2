#!/usr/bin/env python3
"""Project method-to-kind relations into a strict internal Cedar syntax subset."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import authority_package


COMPILER_VERSION = "mint.runtime.authority-cedar.v0.1"
LANGUAGE_PROFILE = "cedar-internal-subset.v0.1"
PROOF_CEILING = (
    "candidate-local internal Cedar-subset structural parity only; no official Cedar "
    "evaluation, authorization decision, enforcement, ratification, release, deployment, "
    "or production proof"
)
POLICY_RE = re.compile(
    r'^permit\(principal == MintAuthorityKind::"(?P<principal_id>[A-Z][A-Z0-9._:-]*)", '
    r'action == MintMethod::"(?P<action_id>[A-Z][A-Z0-9._:-]*)", '
    r'resource == MintDomain::"(?P<resource_id>[A-Z][A-Z0-9._:-]*)"\) '
    r'when \{ context\.packageMaturity == "(?P<context_value>candidate)" \};$'
)


def expected_ast(method_id: str, authority_kind_id: str, domain_ref: str) -> dict[str, str]:
    return {
        "principal_type": "MintAuthorityKind",
        "principal_id": authority_kind_id,
        "action_type": "MintMethod",
        "action_id": method_id,
        "resource_type": "MintDomain",
        "resource_id": domain_ref,
        "context_field": "packageMaturity",
        "context_value": "candidate",
    }


def render_policy(ast: dict[str, str]) -> str:
    return (
        f'permit(principal == {ast["principal_type"]}::"{ast["principal_id"]}", '
        f'action == {ast["action_type"]}::"{ast["action_id"]}", '
        f'resource == {ast["resource_type"]}::"{ast["resource_id"]}") '
        f'when {{ context.{ast["context_field"]} == "{ast["context_value"]}" }};'
    )


def parse_policy(policy: str) -> dict[str, str] | None:
    match = POLICY_RE.fullmatch(policy)
    if match is None:
        return None
    return expected_ast(
        match.group("action_id"), match.group("principal_id"), match.group("resource_id")
    )


def policy_has_parity(policy: str, expected: dict[str, str]) -> bool:
    return parse_policy(policy) == expected and render_policy(expected) == policy


def _translation_residue(method_id: str) -> dict[str, str]:
    return {
        "residue_id": f"RESIDUE.CEDAR.MULTI-KIND.{method_id}",
        "residue_type": "translation",
        "source_operation_ref": method_id,
        "expected_condition": "one method maps to exactly one authority kind in cedar-internal-subset.v0.1",
        "observed_failure_locus": f"methods/{method_id}/authority_kind_refs",
        "reason_or_impossibility": "the internal Cedar subset does not choose among multiple authority kinds",
        "evidence_ref": method_id,
        "owner_route": "mint-projection-owner",
        "treatment": "type",
        "action_effect": "defer",
        "promotion_effect": "block",
    }


def compile_cedar(package: Any) -> dict[str, Any]:
    package_receipt = authority_package.validate_authority_package(package)
    compiler_sha256 = authority_package.sha256_file(Path(__file__).resolve())
    blockers = (
        []
        if package_receipt["status"] == "valid"
        else [f"CEDAR_PACKAGE_{error_id}" for error_id in package_receipt["error_ids"]]
    )
    policies: list[dict[str, Any]] = []
    parity: list[dict[str, Any]] = []
    residues: list[dict[str, str]] = []
    if not blockers:
        for method in sorted(package["methods"], key=lambda item: item["method_id"]):
            method_id = method["method_id"]
            if len(method["authority_kind_refs"]) != 1:
                residue = _translation_residue(method_id)
                residues.append(residue)
                parity.append(
                    {
                        "semantic_unit_ref": method_id,
                        "parity_state": "blocked",
                        "policy_sha256": None,
                        "residue_refs": [residue["residue_id"]],
                    }
                )
                continue
            authority_kind_id = method["authority_kind_refs"][0]
            ast = expected_ast(method_id, authority_kind_id, package["domain_ref"])
            policy = render_policy(ast)
            digest = authority_package.sha256_bytes(policy.encode("utf-8"))
            if not policy_has_parity(policy, ast):
                blockers.append("CEDAR_INTERNAL_ROUND_TRIP_FAILED")
                continue
            policies.append(
                {
                    "policy_id": f"POLICY.CEDAR.{method_id}",
                    "semantic_unit_ref": method_id,
                    "method_id": method_id,
                    "authority_kind_id": authority_kind_id,
                    "policy": policy,
                    "policy_sha256": digest,
                    "parsed_ast": ast,
                }
            )
            parity.append(
                {
                    "semantic_unit_ref": method_id,
                    "parity_state": "pass",
                    "policy_sha256": digest,
                    "residue_refs": [],
                }
            )
    if blockers:
        status = "blocked"
        policies = []
        parity = []
        residues = []
    else:
        status = "partial" if residues else "ready"
    projection = {
        "schema_version": "mint.authority-cedar-projection.v0.1",
        "status": status,
        "package_id": package_receipt["package_id"],
        "package_sha256": package_receipt["package_sha256"],
        "semantic_sha256": package_receipt["semantic_sha256"],
        "language_profile": LANGUAGE_PROFILE,
        "policies": policies,
        "per_unit_parity": parity,
        "residues": residues,
        "proof_ceiling": PROOF_CEILING,
    }
    inventory = [
        {
            "policy_id": item["policy_id"],
            "semantic_unit_ref": item["semantic_unit_ref"],
            "sha256": item["policy_sha256"],
            "size_bytes": len(item["policy"].encode("utf-8")),
        }
        for item in policies
    ]
    identity = {
        "compiler_version": COMPILER_VERSION,
        "compiler_sha256": compiler_sha256,
        "package_sha256": package_receipt["package_sha256"],
        "semantic_sha256": package_receipt["semantic_sha256"],
        "status": status,
        "language_profile": LANGUAGE_PROFILE,
        "policy_inventory": inventory,
        "per_unit_parity": parity,
        "residues": residues,
        "blockers": sorted(set(blockers)),
        "authority_effect": "none",
    }
    receipt = {
        "schema_version": "mint.authority-cedar-receipt.v0.1",
        "receipt_id": authority_package.sha256_bytes(authority_package.canonical_bytes(identity)),
        "compiler_version": COMPILER_VERSION,
        "compiler_sha256": compiler_sha256,
        "package_id": package_receipt["package_id"],
        "package_sha256": package_receipt["package_sha256"],
        "semantic_sha256": package_receipt["semantic_sha256"],
        "status": status,
        "language_profile": LANGUAGE_PROFILE,
        "policy_inventory": inventory,
        "per_unit_parity": parity,
        "residues": residues,
        "blockers": sorted(set(blockers)),
        "writes_performed": 0,
        "authority_effect": "none",
        "proof_ceiling": PROOF_CEILING,
    }
    return {"projection": projection, "receipt": receipt}


def load_and_compile(path: Path) -> dict[str, Any]:
    try:
        package = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        package = {"load_error": f"{type(exc).__name__}: {exc}"}
    return compile_cedar(package)
