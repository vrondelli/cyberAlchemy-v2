#!/usr/bin/env python3
"""Materialize and verify Auth Service D65 W4 (F0 + PT0).

W4 freezes product bytes and closes the product-test denominator. It does not
execute W5 product evidence, approve the product, or grant operational authority.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import subprocess
import sys
from pathlib import Path
from typing import Any


W4_DIR = Path(__file__).resolve().parent
REPO_ROOT = W4_DIR.parents[4]
AUTH_PROJECT_ROOT = REPO_ROOT / "projects/auth-foundation"
CANDIDATE_PATH = W4_DIR / "AUTH-SERVICE-PRODUCT-CANDIDATE.v1.json"
DENOMINATOR_PATH = W4_DIR / "AUTH-SERVICE-PRODUCT-TEST-DENOMINATOR.v1.json"
RECEIPT_PATH = W4_DIR / "W4-FREEZE-RECEIPT.json"

CANDIDATE_ID = "AUTH-SERVICE-PRODUCT-CANDIDATE-002"
DENOMINATOR_ID = "AUTH-SERVICE-PRODUCT-TEST-DENOMINATOR-002"
RECEIPT_ID = "AUTH-D65-W4-FREEZE-002"
PROTOTYPE_EPOCH_ID = "AUTH-SERVICE-PROTOTYPE-EPOCH-002"
EVF_INPUT_EPOCH_ID = "AUTH-EVF-EPOCH-002"

EXCLUDED_DIRECTORIES = {"target", "__pycache__", ".pytest_cache"}

COLLECTION_ROOTS = [
    "projects/auth-foundation/implementation/operation-source",
    "projects/auth-foundation/implementation/command-boundary-source",
    "projects/auth-foundation/implementation/trusted-input-source",
    "projects/auth-foundation/implementation/authorization-service",
    "projects/auth-foundation/implementation/trusted-boundary",
    "projects/auth-foundation/implementation/trusted-input-provider",
    "projects/auth-foundation/implementation/trusted-input-runtime",
    "projects/auth-foundation/implementation/runtime-adapter",
    "projects/auth-foundation/implementation/sqlite-provider",
    "projects/auth-foundation/implementation/command-boundary-runtime",
    "projects/auth-foundation/implementation/standard-runtime",
]

EXACT_FILES = [
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-DEFINITION-PACK.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CAPABILITY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-BUSINESS-ONTOLOGY.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CONTRACTS.v1-candidate.json",
    "projects/auth-foundation/development/auth-service-d65-r2-plan/AUTH-SERVICE-DOMAINSPEC-SOURCE-SET.v1-candidate.json",
    "projects/auth-foundation/implementation/business-ontology.json",
    "projects/auth-foundation/implementation/product-capability.json",
    "projects/auth-foundation/implementation/property-denominator.json",
    "projects/auth-foundation/implementation/construction-binding.json",
    "projects/auth-foundation/implementation/d65-chain.json",
    "projects/auth-foundation/implementation/provider-construction-binding.json",
    "projects/auth-foundation/implementation/provider-contract.json",
    "projects/auth-foundation/implementation/runtime-construction-binding.json",
    "projects/auth-foundation/implementation/runtime-contract.json",
    "projects/auth-foundation/implementation/command-boundary-business-ontology.json",
    "projects/auth-foundation/implementation/command-boundary-construction-binding.json",
    "projects/auth-foundation/implementation/command-boundary-definitions.json",
    "projects/auth-foundation/implementation/command-boundary-product-capability.json",
    "projects/auth-foundation/implementation/command-boundary-property-denominator.json",
    "projects/auth-foundation/implementation/decisions/command-boundary-product-ontology-admission-001.json",
    "projects/auth-foundation/implementation/trusted-input-business-ontology.json",
    "projects/auth-foundation/implementation/trusted-input-construction-binding.json",
    "projects/auth-foundation/implementation/trusted-input-definitions.json",
    "projects/auth-foundation/implementation/trusted-input-implementation-layering.md",
    "projects/auth-foundation/implementation/trusted-input-product-capability.json",
    "projects/auth-foundation/implementation/trusted-input-sqlite-infrastructure.json",
    "projects/auth-foundation/implementation/standard-conformance/authorization-service-binding.json",
    "projects/auth-foundation/implementation/standard-conformance/command-boundary-compiled-operation-graph.json",
    "projects/auth-foundation/implementation/standard-conformance/command-boundary-kernel-binding.json",
    "projects/auth-foundation/implementation/standard-conformance/command-boundary-system-ontology.json",
    "projects/auth-foundation/implementation/standard-conformance/compiled-operation-graph.json",
    "projects/auth-foundation/implementation/standard-conformance/implementation-binding.json",
    "projects/auth-foundation/implementation/standard-conformance/provider-binding.json",
    "projects/auth-foundation/implementation/standard-conformance/provider-system-ontology.json",
    "projects/auth-foundation/implementation/standard-conformance/runtime-adapter-binding.json",
    "projects/auth-foundation/implementation/standard-conformance/runtime-system-ontology.json",
    "projects/auth-foundation/implementation/standard-conformance/system-ontology.json",
    "projects/auth-foundation/implementation/standard-conformance/trusted-boundary-binding.json",
    "projects/auth-foundation/implementation/standard-conformance/trusted-input-compiled-graph.json",
    "projects/auth-foundation/implementation/standard-conformance/trusted-input-provider-binding.json",
    "projects/auth-foundation/implementation/standard-conformance/trusted-input-source-manifest.json",
    "projects/auth-foundation/implementation/standard-conformance/trusted-input-system-ontology.json",
]

TEST_BRANCHES = [
    {
        "branch_id": "E0",
        "title": "functional-and-fail-closed-service",
        "owner": "Auth Service product-test owner",
        "checks": [
            ("AUTH-E0-ALLOW-COMPLETE", "one complete current request returns ALLOW"),
            ("AUTH-E0-DENY-MISSING-EVIDENCE", "missing authentication evidence returns DENY"),
            ("AUTH-E0-DENY-DUPLICATE-EVIDENCE", "duplicate authentication evidence returns DENY"),
            ("AUTH-E0-DENY-INVALID-EVIDENCE", "untrusted, revoked, empty-subject, or expired evidence returns DENY"),
            ("AUTH-E0-DENY-MISSING-ROUTE", "missing route binding returns DENY"),
            ("AUTH-E0-DENY-DUPLICATE-ROUTE", "duplicate route binding returns DENY"),
            ("AUTH-E0-DENY-INACTIVE-ROUTE", "disabled or incomplete route binding returns DENY"),
            ("AUTH-E0-DENY-SUBJECT-MISMATCH", "evidence subject and session subject mismatch returns DENY"),
            ("AUTH-E0-DENY-SESSION-REVISION", "session and current authorization revision mismatch returns DENY"),
            ("AUTH-E0-DENY-ROLE-REVISION", "active-role relation revision mismatch returns DENY"),
            ("AUTH-E0-DENY-GRANT-REVISION", "permission-grant revision mismatch returns DENY"),
            ("AUTH-E0-DENY-PERMISSION-MISMATCH", "resource, action, or scope mismatch returns DENY"),
            ("AUTH-E0-DENY-SCOPE-EVIDENCE", "missing, mismatched, or untrusted scope evidence returns DENY"),
            ("AUTH-E0-DENY-PROVIDER-FAILURE", "storage, query, clock, or conversion failure returns DENY"),
            ("AUTH-E0-DENY-TRANSACTION-FAILURE", "transaction begin or commit uncertainty returns DENY"),
        ],
    },
    {
        "branch_id": "E1",
        "title": "determinism-and-exact-byte-correspondence",
        "owner": "Auth Service exactness owner",
        "checks": [
            ("AUTH-E1-DOMAINSPEC-REPLAY", "two isolated DomainSpec compiles produce byte-identical graphs and system ontologies"),
            ("AUTH-E1-GENERATED-RUST-REPLAY", "two isolated generated Rust runs produce byte-identical sources"),
            ("AUTH-E1-IMPLEMENTATION-MAP", "every implementation binding rehashes to the candidate bytes"),
            ("AUTH-E1-CANDIDATE-REPLAY", "two candidate freezes produce the same sorted inventory and payload digest"),
            ("AUTH-E1-TOOLCHAIN-CURRENT", "Rust and freeze tool identities equal the W4 manifest"),
            ("AUTH-E1-STALE-INPUT-REJECTION", "changed compiler, runtime, tool, source, graph, or binding bytes fail closed"),
        ],
    },
    {
        "branch_id": "E2",
        "title": "evf-seven-seam-campaign",
        "owner": "Auth EVF product-test owner",
        "checks": [
            ("AUTH-E2-SEAM-BINDING", "binding seam detects its scoped fault exactly once"),
            ("AUTH-E2-SEAM-DERIVATION", "derivation seam detects its scoped fault exactly once"),
            ("AUTH-E2-SEAM-LINEAGE", "lineage seam detects its scoped fault exactly once"),
            ("AUTH-E2-SEAM-OBSERVATION", "observation seam detects its scoped fault exactly once"),
            ("AUTH-E2-SEAM-PROVIDER", "provider seam detects its scoped fault exactly once"),
            ("AUTH-E2-SEAM-SCOPE", "scope seam detects its scoped fault exactly once"),
            ("AUTH-E2-SEAM-SEMANTIC", "semantic seam detects its scoped fault exactly once"),
            ("AUTH-E2-NONEMPTY-DENOMINATOR", "EVF obligation and mutation denominators are non-empty and exact"),
            ("AUTH-E2-OBSERVATION-CARDINALITY", "observation cardinality equals the declared denominator"),
            ("AUTH-E2-SURVIVOR-REJECTION", "a surviving required mutant blocks PASS"),
            ("AUTH-E2-ZERO-ROW-REJECTION", "zero-row evidence cannot become PASS"),
            ("AUTH-E2-CALLER-PASS-REJECTION", "caller-supplied PASS cannot become evidence"),
            ("AUTH-E2-STALE-BYTE-REJECTION", "stale candidate, provider, route, or observation bytes fail closed"),
        ],
    },
    {
        "branch_id": "E3",
        "title": "formal-claim-and-regression",
        "owner": "Auth formal-regression owner",
        "checks": [
            ("AUTH-E3-AUTHORIZATION-CHARACTERIZATION", "Auth-specific theorem characterizes exact ALLOW eligibility"),
            ("AUTH-E3-EXACT-MISMATCH-DENY", "Auth-specific theorem preserves DENY for each exact mismatch class"),
            ("AUTH-E3-KERNEL-REGRESSION", "generated exact-permission kernel regression suite passes"),
            ("AUTH-E3-ADAPTER-REGRESSION", "runtime adapter regression suite passes"),
            ("AUTH-E3-AUTHORIZATION-PROVIDER-REGRESSION", "SQLite authorization-state provider regression suite passes"),
            ("AUTH-E3-TRUSTED-BOUNDARY-REGRESSION", "trusted command-boundary regression suite passes"),
            ("AUTH-E3-TRUSTED-INPUT-REGRESSION", "trusted-input query and SQLite provider regression suites pass"),
            ("AUTH-E3-SERVICE-REGRESSION", "complete in-process Auth Service integration suite passes"),
            ("AUTH-E3-STALE-PROJECTION-REJECTION", "wrong-domain or stale Rust projection cannot satisfy the Auth theorem binding"),
        ],
    },
]


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")


def pretty_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")


def digest_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def payload_digest(value: dict[str, Any], field: str) -> str:
    payload = dict(value)
    payload.pop(field, None)
    return digest_bytes(canonical_bytes(payload))


def exact_ref(path: Path, *, logical_path: str | None = None, location: str = "repository") -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": logical_path or path.relative_to(REPO_ROOT).as_posix(),
        "sha256": digest_bytes(data),
        "size_bytes": len(data),
        "location": location,
        "current": True,
    }


def selected_paths() -> list[str]:
    selected = set(EXACT_FILES)
    for root_text in COLLECTION_ROOTS:
        root = REPO_ROOT / root_text
        if not root.is_dir():
            raise ValueError(f"missing candidate collection root: {root_text}")
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            relative = path.relative_to(REPO_ROOT)
            if any(part in EXCLUDED_DIRECTORIES for part in relative.parts):
                continue
            selected.add(relative.as_posix())
    for path_text in selected:
        path = REPO_ROOT / path_text
        if not path.is_file():
            raise ValueError(f"missing candidate artifact: {path_text}")
    return sorted(selected)


def artifact_group(path_text: str) -> str:
    if "/tests/" in path_text:
        return "exploratory_test_source"
    if any(token in path_text for token in ("/operation-source/", "/command-boundary-source/", "/trusted-input-source/")):
        return "domainspec_source"
    if "/standard-conformance/" in path_text:
        return "compiled_scaffold_and_binding"
    if "/development/auth-service-d65-r2-plan/AUTH-SERVICE-" in path_text:
        return "service_meaning_and_contract"
    if path_text.startswith("projects/auth-foundation/implementation/") and path_text.count("/") == 3:
        return "component_meaning_and_contract"
    if path_text.endswith(("Cargo.toml", "Cargo.lock")):
        return "build_manifest"
    return "implementation"


def run_text(args: list[str]) -> str:
    return subprocess.run(args, check=True, text=True, capture_output=True).stdout.strip()


def tool_ref(role: str, command: str, version_args: list[str]) -> dict[str, Any]:
    resolved = Path(run_text(["rustup", "which", command])).resolve()
    return {
        "role": role,
        "logical_path": f"rustup:{resolved.parent.parent.name}/bin/{command}",
        "version": run_text(version_args),
        "sha256": digest_bytes(resolved.read_bytes()),
        "size_bytes": resolved.stat().st_size,
        "location": "host",
        "current": True,
    }


def python_tool_ref() -> dict[str, Any]:
    resolved = Path(sys.executable).resolve()
    return {
        "role": "w4-freeze-verifier",
        "logical_path": f"python:{platform.python_implementation().lower()}-{platform.python_version()}",
        "version": platform.python_version(),
        "sha256": digest_bytes(resolved.read_bytes()),
        "size_bytes": resolved.stat().st_size,
        "location": "host",
        "current": True,
    }


def build_candidate() -> dict[str, Any]:
    validate_selected_bindings()
    groups: dict[str, list[dict[str, Any]]] = {}
    all_paths = selected_paths()
    for path_text in all_paths:
        groups.setdefault(artifact_group(path_text), []).append(exact_ref(REPO_ROOT / path_text))
    groups = {key: groups[key] for key in sorted(groups)}
    tools = sorted(
        [
            tool_ref("rust-compiler", "rustc", ["rustc", "-vV"]),
            tool_ref("rust-build-and-test", "cargo", ["cargo", "-V"]),
            python_tool_ref(),
        ],
        key=lambda item: item["role"],
    )
    candidate: dict[str, Any] = {
        "schema_version": "auth-service-product-candidate/v1",
        "candidate_id": CANDIDATE_ID,
        "prototype_epoch_id": PROTOTYPE_EPOCH_ID,
        "evf_input_epoch_id": EVF_INPUT_EPOCH_ID,
        "d65_wave": "W4",
        "frozen_nodes": ["D0", "O0", "P0", "B0", "S0", "G0", "K0", "A0", "P1", "Q0", "P2", "T0", "V0"],
        "artifact_groups": groups,
        "artifact_count": len(all_paths),
        "tool_inventory": tools,
        "tool_count": len(tools),
        "inventory_order": "artifact group keys and artifact paths sorted by UTF-8 code point; tool refs sorted by role",
        "excluded_paths": ["**/target/**", "**/__pycache__/**", "**/.pytest_cache/**", "w4 outputs", "W5 evidence", "W6 product decision"],
        "status": "frozen-untested-product-candidate",
        "claim_ceiling": "W4 F0 freezes exact D0-V0 product and tool bytes only. It does not establish W5 product-test PASS, product approval, admission, activation, publication, release, deployment, production security, or external-effect authority.",
        "authority_effect": "none",
    }
    candidate["candidate_payload_digest"] = payload_digest(candidate, "candidate_payload_digest")
    return candidate


def build_denominator(candidate: dict[str, Any]) -> dict[str, Any]:
    branches = []
    for branch in TEST_BRANCHES:
        checks = [
            {
                "test_id": test_id,
                "purpose": purpose,
                "required": True,
                "execution_state": "pending-w5",
                "evidence_ref": None,
            }
            for test_id, purpose in branch["checks"]
        ]
        branches.append(
            {
                "branch_id": branch["branch_id"],
                "title": branch["title"],
                "owner": branch["owner"],
                "required_test_count": len(checks),
                "checks": checks,
            }
        )
    test_ids = [check["test_id"] for branch in branches for check in branch["checks"]]
    denominator: dict[str, Any] = {
        "schema_version": "auth-service-product-test-denominator/v1",
        "denominator_id": DENOMINATOR_ID,
        "candidate_id": candidate["candidate_id"],
        "candidate_payload_digest": candidate["candidate_payload_digest"],
        "d65_node": "PT0",
        "branches": branches,
        "branch_count": len(branches),
        "required_test_count": len(test_ids),
        "unique_test_id_count": len(set(test_ids)),
        "join_policy": "collect-all; every required test must be current, evaluable, and PASS for this candidate digest",
        "dependent_check_policy": "record not_evaluable with causal blockers; never omit a dependent check or convert it to PASS",
        "candidate_drift_policy": "any changed candidate-bound artifact or tool byte invalidates all dependent W5 evidence and requires a new prototype epoch",
        "execution_state": "closed-denominator-pending-w5",
        "product_approval_state": "not-requested",
        "claim_ceiling": "W4 PT0 closes the required test denominator only. No E0-E3 check is claimed executed or passing, J0 remains unresolved, and no product approval or operational authority follows.",
        "authority_effect": "none",
    }
    denominator["denominator_payload_digest"] = payload_digest(denominator, "denominator_payload_digest")
    return denominator


def run_cargo_suite(crate_path: str, required_tests: list[str], target_directory: str) -> dict[str, Any]:
    crate = REPO_ROOT / crate_path
    env = dict(os.environ)
    env["CARGO_TARGET_DIR"] = target_directory
    result = subprocess.run(
        ["cargo", "test", "--locked", "--offline"],
        cwd=crate,
        env=env,
        text=True,
        capture_output=True,
    )
    combined = result.stdout + "\n" + result.stderr
    if result.returncode != 0 or any(f"test {name} ... ok" not in combined for name in required_tests):
        raise ValueError(f"W3 prerequisite failed: {crate_path} tests did not all pass")
    return {
        "state": "passed",
        "command": f"CARGO_TARGET_DIR={target_directory} cargo test --locked --offline",
        "crate": crate_path,
        "required_test_count": len(required_tests),
        "required_tests": required_tests,
        "failed": 0,
        "authority_effect": "none",
    }


def run_w3_precondition() -> dict[str, Any]:
    suites = [
        run_cargo_suite(
            "projects/auth-foundation/implementation/runtime-adapter",
            [
                "every_trusted_port_failure_denies",
                "exact_permission_mismatch_denies_without_exposing_reason",
                "exact_trusted_evidence_allows",
                "expiry_and_stale_revision_deny",
                "inactive_or_revoked_session_denies",
                "incomplete_duplicate_or_mismatched_roles_deny",
                "missing_or_ambiguous_session_denies",
                "untrusted_or_empty_scope_evidence_denies",
            ],
            "/tmp/auth-service-w4-runtime-adapter-target",
        ),
        run_cargo_suite(
            "projects/auth-foundation/implementation/sqlite-provider",
            [
                "newer_schema_version_is_rejected",
                "missing_authoritative_revision_denies",
                "migration_is_idempotent_and_records_version_one",
                "in_memory_exact_evidence_allows",
                "transaction_start_failure_still_uses_fail_closed_adapter_path",
                "permission_mismatch_and_incomplete_role_relation_deny",
                "missing_or_duplicate_session_denies",
                "missing_or_untrusted_scope_evidence_denies",
                "inactive_expired_or_stale_session_denies",
                "file_backed_state_reopens_and_allows",
            ],
            "/tmp/auth-service-w4-sqlite-provider-target",
        ),
        run_cargo_suite(
            "projects/auth-foundation/implementation/authorization-service",
            [
                "tests::epoch_sequence_never_reuses_the_terminal_identifier",
                "tests::invalid_input_has_an_internal_category_but_public_deny",
                "tests::one_sqlite_snapshot_survives_a_concurrent_writer_and_retry_gets_a_new_view",
                "normal_open_does_not_create_or_migrate_a_database",
                "explicit_migration_is_idempotent_upgrades_v1_and_rejects_unknown_newer_schema",
                "file_backed_database_reopens_and_each_call_gets_a_fresh_epoch",
                "invalid_or_oversized_inbound_identifiers_deny",
                "one_complete_epoch_allows",
                "clock_and_live_provider_failures_deny",
                "duplicate_trusted_input_rows_deny",
                "subject_and_revision_join_failures_deny",
                "inactive_revoked_expired_missing_or_ambiguous_session_denies",
                "missing_untrusted_revoked_or_disabled_trusted_input_denies",
                "permission_and_scope_evidence_mismatches_deny",
            ],
            "/tmp/auth-service-w4-cargo-target",
        ),
    ]
    return {
        "state": "passed",
        "suite_count": len(suites),
        "required_test_count": sum(suite["required_test_count"] for suite in suites),
        "suites": suites,
        "failed": 0,
        "authority_effect": "none",
    }


def validate_ref(binding_id: str, ref_name: str, ref: dict[str, Any]) -> None:
    path_text = ref.get("path")
    expected_sha256 = ref.get("sha256")
    if not isinstance(path_text, str) or not isinstance(expected_sha256, str):
        raise ValueError(f"{binding_id} has an incomplete {ref_name} reference")
    path = AUTH_PROJECT_ROOT / path_text
    if not path.is_file():
        raise ValueError(f"{binding_id} references missing {ref_name}: {path_text}")
    actual_sha256 = digest_bytes(path.read_bytes())
    if actual_sha256 != expected_sha256:
        raise ValueError(
            f"{binding_id} {ref_name} drift: expected {expected_sha256}, got {actual_sha256}"
        )


def validate_implementation_refs(
    binding_id: str,
    implementation: dict[str, Any],
    ref_names: list[str],
) -> None:
    for ref_name in ref_names:
        validate_ref(
            binding_id,
            f"implementation.{ref_name}",
            {
                "path": implementation.get(f"{ref_name}_path"),
                "sha256": implementation.get(f"{ref_name}_sha256"),
            },
        )


def validate_selected_bindings() -> None:
    specifications = [
        (
            "implementation/standard-conformance/runtime-adapter-binding.json",
            [
                "runtime_construction_binding",
                "runtime_system_ontology",
                "kernel_implementation",
                "runtime_contract",
            ],
            ["manifest", "lockfile", "source", "tests"],
        ),
        (
            "implementation/standard-conformance/provider-binding.json",
            [
                "provider_construction_binding",
                "provider_system_ontology",
                "runtime_adapter_implementation",
                "provider_contract",
            ],
            ["manifest", "lockfile", "source", "migration", "tests"],
        ),
        (
            "implementation/standard-conformance/authorization-service-binding.json",
            [
                "service_business_ontology",
                "service_domainspec_source_set",
                "trusted_input_provider",
                "authorization_state_provider",
                "trusted_boundary",
            ],
            ["manifest", "lockfile", "source", "migration", "tests"],
        ),
    ]
    for binding_path, direct_refs, implementation_refs in specifications:
        binding = json.loads((AUTH_PROJECT_ROOT / binding_path).read_text(encoding="utf-8"))
        binding_id = binding.get("binding_id", binding_path)
        for ref_name in direct_refs:
            validate_ref(binding_id, ref_name, binding.get(ref_name, {}))
        validate_implementation_refs(
            binding_id,
            binding.get("implementation", {}),
            implementation_refs,
        )


def validate_candidate(candidate: dict[str, Any]) -> None:
    if candidate.get("schema_version") != "auth-service-product-candidate/v1":
        raise ValueError("candidate schema_version mismatch")
    if candidate.get("candidate_payload_digest") != payload_digest(candidate, "candidate_payload_digest"):
        raise ValueError("candidate payload digest mismatch")
    refs = [ref for group in candidate["artifact_groups"].values() for ref in group]
    paths = [ref["path"] for ref in refs]
    group_keys = list(candidate["artifact_groups"])
    if group_keys != sorted(group_keys):
        raise ValueError("candidate artifact group keys are not sorted")
    for group_key, group_refs in candidate["artifact_groups"].items():
        group_paths = [ref["path"] for ref in group_refs]
        if group_paths != sorted(group_paths):
            raise ValueError(f"candidate artifact paths are not sorted: {group_key}")
    if len(paths) != len(set(paths)) or candidate.get("artifact_count") != len(paths):
        raise ValueError("candidate artifact count or uniqueness mismatch")
    for ref in refs:
        path = REPO_ROOT / ref["path"]
        if exact_ref(path) != ref:
            raise ValueError(f"candidate artifact drift: {ref['path']}")
    tools = candidate.get("tool_inventory", [])
    if len(tools) != candidate.get("tool_count") or [tool["role"] for tool in tools] != sorted(tool["role"] for tool in tools):
        raise ValueError("candidate tool inventory mismatch")


def validate_denominator(denominator: dict[str, Any], candidate: dict[str, Any]) -> None:
    if denominator.get("schema_version") != "auth-service-product-test-denominator/v1":
        raise ValueError("denominator schema_version mismatch")
    if denominator.get("candidate_payload_digest") != candidate.get("candidate_payload_digest"):
        raise ValueError("denominator candidate binding mismatch")
    if denominator.get("denominator_payload_digest") != payload_digest(denominator, "denominator_payload_digest"):
        raise ValueError("denominator payload digest mismatch")
    branches = denominator.get("branches", [])
    if [branch.get("branch_id") for branch in branches] != ["E0", "E1", "E2", "E3"]:
        raise ValueError("denominator branch set mismatch")
    checks = [check for branch in branches for check in branch.get("checks", [])]
    ids = [check.get("test_id") for check in checks]
    if len(ids) != len(set(ids)) or len(ids) != denominator.get("required_test_count"):
        raise ValueError("denominator test ID count or uniqueness mismatch")
    if denominator.get("unique_test_id_count") != len(set(ids)) or denominator.get("branch_count") != len(branches):
        raise ValueError("denominator totals mismatch")
    for branch in branches:
        if branch.get("required_test_count") != len(branch.get("checks", [])):
            raise ValueError(f"branch count mismatch: {branch.get('branch_id')}")
    if any(check.get("execution_state") != "pending-w5" or check.get("evidence_ref") is not None for check in checks):
        raise ValueError("W4 denominator must not contain W5 result claims")


def build_receipt(candidate: dict[str, Any], denominator: dict[str, Any], w3: dict[str, Any]) -> dict[str, Any]:
    receipt: dict[str, Any] = {
        "schema_version": "auth-service-w4-freeze-receipt/v1",
        "receipt_id": RECEIPT_ID,
        "wave_id": "W4",
        "nodes": ["F0", "PT0"],
        "state": "passed",
        "candidate_ref": {
            **exact_ref(CANDIDATE_PATH),
            "candidate_id": candidate["candidate_id"],
            "candidate_payload_digest": candidate["candidate_payload_digest"],
        },
        "denominator_ref": {
            **exact_ref(DENOMINATOR_PATH),
            "denominator_id": denominator["denominator_id"],
            "denominator_payload_digest": denominator["denominator_payload_digest"],
        },
        "validator_ref": exact_ref(Path(__file__).resolve()),
        "w3_precondition": w3,
        "verification": {
            "freeze_replay_count": 2,
            "candidate_replay_byte_equal": True,
            "denominator_replay_byte_equal": True,
            "artifact_count": candidate["artifact_count"],
            "tool_count": candidate["tool_count"],
            "branch_count": denominator["branch_count"],
            "required_test_count": denominator["required_test_count"],
            "unique_test_id_count": denominator["unique_test_id_count"],
            "all_candidate_refs_current": True,
            "all_w5_checks_pending": True,
        },
        "next_stage": "W5-not-executed",
        "residue": [
            "E0-E3 product-test evidence has not been executed for this frozen candidate",
            "J0 collect-all evidence join is unresolved",
            "product approval remains not requested",
            "admission, activation, publication, release, deployment, and external effects remain separate",
        ],
        "claim_ceiling": "PASS closes W4 F0 and PT0 only: one exact untested product candidate and one complete pending product-test denominator. It does not claim W5 evidence, product approval, conformance, admission, activation, publication, release, deployment, production security, or external-effect authority.",
        "authority_effect": "none",
    }
    receipt["receipt_payload_digest"] = payload_digest(receipt, "receipt_payload_digest")
    return receipt


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(pretty_bytes(value))


def archive_current_w4() -> None:
    if CANDIDATE_PATH.is_file():
        candidate = json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))
        digest = candidate.get("candidate_payload_digest")
        if isinstance(digest, str) and len(digest) == 64:
            write_json(W4_DIR / "candidates" / "sha256" / digest / CANDIDATE_PATH.name, candidate)
    if DENOMINATOR_PATH.is_file():
        denominator = json.loads(DENOMINATOR_PATH.read_text(encoding="utf-8"))
        digest = denominator.get("denominator_payload_digest")
        if isinstance(digest, str) and len(digest) == 64:
            write_json(W4_DIR / "denominators" / "sha256" / digest / DENOMINATOR_PATH.name, denominator)
    if RECEIPT_PATH.is_file():
        receipt = json.loads(RECEIPT_PATH.read_text(encoding="utf-8"))
        digest = receipt.get("receipt_payload_digest")
        if isinstance(digest, str) and len(digest) == 64:
            write_json(W4_DIR / "receipts" / "sha256" / digest / RECEIPT_PATH.name, receipt)


def materialize() -> None:
    w3 = run_w3_precondition()
    candidate_a = build_candidate()
    candidate_b = build_candidate()
    if pretty_bytes(candidate_a) != pretty_bytes(candidate_b):
        raise ValueError("candidate freeze replay mismatch")
    validate_candidate(candidate_a)
    denominator_a = build_denominator(candidate_a)
    denominator_b = build_denominator(candidate_b)
    if pretty_bytes(denominator_a) != pretty_bytes(denominator_b):
        raise ValueError("denominator freeze replay mismatch")
    validate_denominator(denominator_a, candidate_a)
    archive_current_w4()
    write_json(CANDIDATE_PATH, candidate_a)
    write_json(DENOMINATOR_PATH, denominator_a)
    candidate_history = W4_DIR / "candidates" / "sha256" / candidate_a["candidate_payload_digest"] / CANDIDATE_PATH.name
    denominator_history = W4_DIR / "denominators" / "sha256" / denominator_a["denominator_payload_digest"] / DENOMINATOR_PATH.name
    write_json(candidate_history, candidate_a)
    write_json(denominator_history, denominator_a)
    receipt = build_receipt(candidate_a, denominator_a, w3)
    write_json(RECEIPT_PATH, receipt)
    history = W4_DIR / "receipts" / "sha256" / receipt["receipt_payload_digest"] / "W4-FREEZE-RECEIPT.json"
    write_json(history, receipt)
    verify(run_precondition=False)
    print(json.dumps({
        "state": "PASS",
        "candidate_payload_digest": candidate_a["candidate_payload_digest"],
        "denominator_payload_digest": denominator_a["denominator_payload_digest"],
        "receipt_payload_digest": receipt["receipt_payload_digest"],
        "artifact_count": candidate_a["artifact_count"],
        "required_test_count": denominator_a["required_test_count"],
        "w5_state": "not-executed",
    }, sort_keys=True))


def verify(*, run_precondition: bool) -> None:
    candidate = json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))
    denominator = json.loads(DENOMINATOR_PATH.read_text(encoding="utf-8"))
    receipt = json.loads(RECEIPT_PATH.read_text(encoding="utf-8"))
    expected_candidate = build_candidate()
    if candidate != expected_candidate:
        raise ValueError("materialized candidate differs from current deterministic freeze")
    validate_candidate(candidate)
    expected_denominator = build_denominator(candidate)
    if denominator != expected_denominator:
        raise ValueError("materialized denominator differs from current deterministic freeze")
    validate_denominator(denominator, candidate)
    if receipt.get("receipt_payload_digest") != payload_digest(receipt, "receipt_payload_digest"):
        raise ValueError("receipt payload digest mismatch")
    if receipt.get("candidate_ref") != {**exact_ref(CANDIDATE_PATH), "candidate_id": candidate["candidate_id"], "candidate_payload_digest": candidate["candidate_payload_digest"]}:
        raise ValueError("receipt candidate ref mismatch")
    if receipt.get("denominator_ref") != {**exact_ref(DENOMINATOR_PATH), "denominator_id": denominator["denominator_id"], "denominator_payload_digest": denominator["denominator_payload_digest"]}:
        raise ValueError("receipt denominator ref mismatch")
    if receipt.get("validator_ref") != exact_ref(Path(__file__).resolve()):
        raise ValueError("receipt validator ref mismatch")
    candidate_history = W4_DIR / "candidates" / "sha256" / candidate["candidate_payload_digest"] / CANDIDATE_PATH.name
    if candidate_history.read_bytes() != CANDIDATE_PATH.read_bytes():
        raise ValueError("content-addressed candidate copy mismatch")
    denominator_history = W4_DIR / "denominators" / "sha256" / denominator["denominator_payload_digest"] / DENOMINATOR_PATH.name
    if denominator_history.read_bytes() != DENOMINATOR_PATH.read_bytes():
        raise ValueError("content-addressed denominator copy mismatch")
    history = W4_DIR / "receipts" / "sha256" / receipt["receipt_payload_digest"] / "W4-FREEZE-RECEIPT.json"
    if history.read_bytes() != RECEIPT_PATH.read_bytes():
        raise ValueError("content-addressed receipt copy mismatch")
    if run_precondition and receipt.get("w3_precondition") != run_w3_precondition():
        raise ValueError("W3 prerequisite replay mismatch")
    print(json.dumps({
        "state": "PASS",
        "candidate_payload_digest": candidate["candidate_payload_digest"],
        "denominator_payload_digest": denominator["denominator_payload_digest"],
        "receipt_payload_digest": receipt["receipt_payload_digest"],
        "artifact_count": candidate["artifact_count"],
        "required_test_count": denominator["required_test_count"],
        "w5_state": "not-executed",
    }, sort_keys=True))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--materialize", action="store_true", help="run W3 prerequisite and write the exact W4 candidate, denominator, and receipt")
    parser.add_argument("--run-precondition", action="store_true", help="rerun the W3 tests while verifying")
    args = parser.parse_args()
    try:
        if args.materialize:
            materialize()
        else:
            verify(run_precondition=args.run_precondition)
    except (OSError, ValueError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(json.dumps({"state": "BLOCK", "reason": str(error)}, sort_keys=True), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
