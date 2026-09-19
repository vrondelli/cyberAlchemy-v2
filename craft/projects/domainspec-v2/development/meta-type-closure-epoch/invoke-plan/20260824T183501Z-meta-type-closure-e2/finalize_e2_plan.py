#!/usr/bin/env python3
"""Freeze the proved E2 Plan and issue one exact Rondelli-only base acceptance request."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
BASE = Path("projects/domainspec-v2/development/meta-type-closure-epoch")
DEFINE = BASE / "invoke-define/20260824T183501Z-meta-type-closure-e2"
DESIGN = BASE / "invoke-design/20260824T183501Z-meta-type-closure-e2"
PLAN = BASE / "invoke-plan/20260824T183501Z-meta-type-closure-e2"
ABS_PLAN = REPO / PLAN
EXECUTION = BASE / "execution-runs/wp-mtc-001-e2"
CANDIDATE_ID = "WP-MTC-001-E2-PLAN@20260824T183501Z"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exact(path: Path) -> dict[str, object]:
    data = (REPO / path).read_bytes()
    return {"path": path.as_posix(), "sha256": sha256(data), "size_bytes": len(data)}


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def canonical_package_digest(targets: list[dict[str, object]]) -> str:
    minimal = [
        {"path": item["path"], "sha256": item["sha256"], "size_bytes": item["size_bytes"]}
        for item in sorted(targets, key=lambda item: str(item["path"]))
    ]
    payload = json.dumps(minimal, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    return sha256(payload)


def main() -> int:
    wpra = json.loads((ABS_PLAN / "readiness/final-audit-output-r9/work-pack-readiness-report-v2.json").read_text())
    preflight = json.loads((ABS_PLAN / "IMPLEMENTATION-READINESS-PREFLIGHT.json").read_text())
    entry_validation = json.loads((ABS_PLAN / "EXECUTION-ENTRY.validation.json").read_text())
    if wpra["verdict"] != "pass" or wpra["terminal_code"] != "PLAN_SEMANTIC_READY":
        raise SystemExit("WPRA v2 is not a passing plan-semantic proof")
    if preflight["status"] != "pass" or preflight["code"] != "PLAN_IMPLEMENTATION_READY":
        raise SystemExit("Implementation Readiness proof is not passing")
    if preflight["mutation_ready"] or preflight["reusable_for_execution"]:
        raise SystemExit("Implementation Readiness exceeded proof-only authority")
    if entry_validation["status"] != "pass" or entry_validation["route_count"] != 7:
        raise SystemExit("execution-entry validation drift")

    child_contract = json.loads((ABS_PLAN / "SWU-MTC-005-CHILD-COMMANDS.json").read_text())
    validation_contracts = json.loads((ABS_PLAN / "VALIDATION-CONTRACTS.json").read_text())
    matrix_argv = next(
        command["argv"]
        for unit in validation_contracts["units"]
        for command in unit["commands"]
        if command["command_id"] == "mtc005-full-matrix"
    )
    bound_child_digest = matrix_argv[matrix_argv.index("--commands-contract-sha256") + 1]
    if bound_child_digest != child_contract["command_set_digest"]:
        raise SystemExit("SWU-MTC-005 child command-set digest binding drift")

    current_distill = {
        "schema_version": "domainspec.wp-mtc-001.distill-topology-validation-e2/v1",
        "work_pack_id": "WP-MTC-001",
        "mode": "validate-mechanical-topology-refresh",
        "status": "pass",
        "semantic_basis": {
            "source_candidate": "WP-MTC-001-candidate@4",
            "historical_independent_proposer_ref": exact(PLAN / "DISTILL-PROPOSER-R5.json"),
            "historical_independent_balancer_ref": exact(PLAN / "DISTILL-BALANCER-R5.json"),
            "historical_validation_ref": exact(PLAN / "DISTILL-VALIDATION-R5.json"),
            "product_or_swu_semantic_delta": "none",
            "topology_delta": "E1 Plan and execution paths rebound to E2; owner prerequisite route removed; canonical readiness order selected",
        },
        "current_checks": [
            {"check_id": "seven-unit-primary-behavior-preserved", "status": "pass"},
            {"check_id": "seven-task-session-route-totality", "status": "pass", "receipt_ref": exact(PLAN / "EXECUTION-ENTRY.validation.json")},
            {"check_id": "selection-ready-state", "status": "pass"},
            {
                "check_id": "child-command-denominator-binding",
                "status": "pass",
                "command_count": 25,
                "declared_digest": child_contract["command_set_digest"],
                "bound_digest": bound_child_digest,
            },
            {"check_id": "wpra-v2-plan-semantics", "status": "pass", "terminal_code": wpra["terminal_code"]},
            {"check_id": "proof-only-readiness-zero-mutation", "status": "pass", "code": preflight["code"]},
        ],
        "current_artifact_bindings": [
            exact(PLAN / "WORK-PACK.md"),
            exact(PLAN / "IMPLEMENTATION-LAYERING.md"),
            exact(PLAN / "SWU-MANIFEST.json"),
            exact(PLAN / "SWU-CONTRACTS.json"),
            exact(PLAN / "VALIDATION-CONTRACTS.json"),
            exact(PLAN / "RULE-NORMALIZATION-CONTRACT.json"),
            exact(PLAN / "CLOSEOUT-CONTRACTS.json"),
            exact(PLAN / "WRITE-SCOPE-BASELINE.json"),
            exact(PLAN / "EXECUTION-ENTRY.json"),
            exact(PLAN / "EXECUTION-ENTRY.validation.json"),
            exact(PLAN / "readiness/audit-config.json"),
            exact(PLAN / "readiness/final-audit-output-r9/work-pack-readiness-report-v2.json"),
            exact(PLAN / "readiness/final-audit-output-r9/plan-semantic-manifest.json"),
            exact(PLAN / "readiness/final-audit-output-r9/selection-handoff.json"),
            exact(PLAN / "IMPLEMENTATION-READINESS-PREFLIGHT.json"),
        ],
        "independence_model": "The product/SWU decomposition is inherited unchanged from the exact independent @4 R5 proposer/balancer pair. E2-only topology bytes are separately checked by the installed execution-entry validator, WPRA v2, and proof-only Implementation Readiness.",
        "fresh_distill_trigger": "Any delta outside path rebasing, readiness ordering, and removal of the premature acceptance route requires a fresh proposer/balancer run.",
        "claim_ceiling": "Plan decomposition and topology validation only; no owner acceptance, Task Session selection, execution, mutation, candidate apply, admission, promotion, publication, merge, release, or deployment.",
        "authority_effect": "none",
    }
    write_json(ABS_PLAN / "DISTILL-TOPOLOGY-VALIDATION-E2.json", current_distill)

    wpra_ref = exact(PLAN / "readiness/final-audit-output-r9/work-pack-readiness-report-v2.json")
    preflight_ref = exact(PLAN / "IMPLEMENTATION-READINESS-PREFLIGHT.json")
    entry_ref = exact(PLAN / "EXECUTION-ENTRY.json")
    entry_validation_ref = exact(PLAN / "EXECUTION-ENTRY.validation.json")

    ledger = """# Blocker and Gap Ledger — WP-MTC-001 Plan E2

| ID | Class | State | Route |
| --- | --- | --- | --- |
| MTC-B01 | protected owner-request gate | open | complete preacceptance closure, emit the canonical v2 owner request, then obtain one exact matching Rondelli response |
| MTC-B02 | readiness proof | resolved | WPRA v2 `PLAN_SEMANTIC_READY`; proof-only Implementation Readiness `PLAN_IMPLEMENTATION_READY` |
| MTC-G01 | Operation semantic binding | planned | SWU-MTC-002 |
| MTC-G02 | Operation provider binding | planned | SWU-MTC-003 |
| MTC-G03 | Workflow D04 closure evidence | planned | SWU-MTC-004 |
| MTC-G04 | current full factory regression red | blocks candidate until green | SWU-MTC-005 |
| MTC-R01 | Poker APE subject finding | deferred | separate APE subject route |
| MTC-R02 | Workflow compensation/profile admission | deferred | separate APE/profile route |

## Resolved planning defects

| ID | Class | State | Route |
| --- | --- | --- | --- |
| MTC-G05 | 23 Rule newline-only predecessor drifts | resolved-by-staged-plan | SWU-MTC-000 exact overlay |
| MTC-G06 | historical Operation candidate validator incompatible with changed closure inputs | resolved-by-staged-plan | SWU-MTC-005 closure composite |
| MTC-G07 | blanket double-LF rejection conflicts with six frozen Rule hashes | resolved-by-staged-plan | exact staged-product hygiene |
| MTC-G08 | stale E1 execution paths in adopted @4 Plan | resolved-by-mechanical-E2-topology-refresh | all seven routes bind `wp-mtc-001-e2` |

The readiness proof executed no declared implementation command and changed no product bytes. MTC-B01 remains a real request-emission and owner gate; no acceptance is inferred from topology authorization or from the unwrapped base request.
"""
    (ABS_PLAN / "BLOCKER-GAP-LEDGER.md").write_text(ledger, encoding="utf-8")

    readiness = {
        "schema_version": "meta-type-closure-readiness-status/v2",
        "work_pack_id": "WP-MTC-001",
        "status": "proof-pass-owner-request-closure-pending",
        "canonical_order": [
            "work-pack-readiness-audit/v2",
            "implementation-readiness/proof-only",
            "invoke/preacceptance-closure-v1",
            "fresh-matching-rondelli-acceptance",
        ],
        "work_pack_gate_status": "block-pending-preacceptance-closure-and-fresh-matching-owner-acceptance",
        "work_pack_readiness_audit": {
            "status": "pass",
            "required_version": "v2",
            "terminal_code": wpra["terminal_code"],
            "finding_count": len(wpra.get("blockers", [])) + len(wpra.get("flags", [])),
            "configured_commands_executed": wpra["configured_commands_executed"],
            "receipt_ref": wpra_ref,
        },
        "implementation_readiness": {
            "status": "pass",
            "mode": "proof-only",
            "code": preflight["code"],
            "initial_unit": preflight["initial_unit"],
            "mutation_count": preflight["fast_entry_proof"]["mutation_count"],
            "mutation_ready": preflight["mutation_ready"],
            "reusable_for_execution": preflight["reusable_for_execution"],
            "receipt_ref": preflight_ref,
        },
        "owner_acceptance": {
            "status": "pending",
            "required_owners": ["Rondelli"],
            "distinct_responses_required": False,
            "matching_inventory_required": True,
            "responses": [],
        },
        "next_route": "invoke:preacceptance-closure",
        "task_session_authorized": False,
        "mutation_authorized": False,
        "authority_effect": "none",
    }
    write_json(ABS_PLAN / "READINESS-STATUS.json", readiness)

    validation = {
        "schema_version": "invoke.plan-validation/v2",
        "run_id": "20260824T183501Z-meta-type-closure-e2",
        "phase_status": "pass",
        "checks": {
            "upstream_define": "pass",
            "upstream_design": "pass",
            "adopted_candidate_manifest": "pass-42-of-42-exact-rehash",
            "adopted_candidate_content_digest": "pass-3c0e499b590e769914fe3125e344b033773b0123787a7fe609522e70efd7be92",
            "topology_refresh": "pass-E2-local-paths-seven-task-session-routes",
            "serial_unit_denominator": "pass-7-of-7",
            "execution_entry": "pass-selection-ready-seven-routes-seven-frontier",
            "work_pack_readiness_audit_v2": "pass-PLAN_SEMANTIC_READY-zero-findings",
            "implementation_readiness": "pass-PLAN_IMPLEMENTATION_READY-proof-only-zero-mutation",
            "acceptance_request": "base-request-generated-v2-emission-closure-pending",
        },
        "blockers": [
            {
                "code": "PLAN_OWNER_REQUEST_CLOSURE_PENDING",
                "claim": "The exact proved E2 Plan still requires a canonical v2 request emitted from passing preacceptance closure evidence before one matching Rondelli response can be requested.",
                "route": "invoke:preacceptance-closure",
            }
        ],
        "execution_entry_ref": entry_ref,
        "execution_entry_validation_ref": entry_validation_ref,
        "wpra_ref": wpra_ref,
        "implementation_readiness_ref": preflight_ref,
        "configured_implementation_commands_executed": False,
        "execution_authorized": False,
        "mutation_authorized": False,
        "authority_effect": "none",
    }
    write_json(ABS_PLAN / "VALIDATION.json", validation)

    result = {
        "schema_version": "meta-type-closure-plan-result/v3",
        "run_id": "20260824T183501Z-meta-type-closure-e2",
        "mode": "plan",
        "work_pack_id": "WP-MTC-001",
        "receipt_epoch": "E2",
        "phase_status": "pass",
        "result": "plan-topology-refreshed-and-proof-ready-owner-request-closure-pending",
        "implementation_status": "not-executed",
        "unit_count": 7,
        "validation_child_count": 25,
        "planned_create_target_count": 96,
        "execution_entry_state": "selection-ready",
        "work_pack_readiness_status": "pass-PLAN_SEMANTIC_READY",
        "implementation_readiness_status": "pass-PLAN_IMPLEMENTATION_READY-proof-only",
        "owner_acceptance_status": "pending-fresh-matching-rondelli",
        "task_session_authorized": False,
        "live_mutation_authorized": False,
        "admission_authorized": False,
        "current_next_route": "invoke:preacceptance-closure",
        "claim_ceiling": "Define, Design, Plan topology, WPRA v2, and proof-only Implementation Readiness pass over E2 bytes. No owner acceptance, Task Session selection or execution, product mutation, candidate apply, admission, promotion, publication, merge, release, or deployment is claimed.",
        "authority_effect": "none",
    }
    write_json(ABS_PLAN / "PLAN-RESULT.json", result)

    adoption_ref = exact(PLAN / "ADOPTION-MANIFEST.json")
    transport = {
        "schema_version": "invoke.plan-transport/v2",
        "run_id": "20260824T183501Z-meta-type-closure-e2",
        "mode": "plan",
        "status": "proof-pass-owner-request-closure-pending",
        "package_id": CANDIDATE_ID,
        "manifest_ref": adoption_ref,
        "acceptance_request_ref": "acceptance/PLAN-ACCEPTANCE-REQUEST.json",
        "transport": "repository-local-only",
        "external_delivery": False,
        "next_owner": "invoke:preacceptance-closure",
        "task_session_route_exposed": False,
        "authority_effect": "none",
    }
    write_json(ABS_PLAN / "PLAN-TRANSPORT.json", transport)

    # Freeze every current Define, Design, and Plan byte except the self-referential
    # acceptance support directory. The inventory itself and requests are excluded.
    targets: list[dict[str, object]] = []
    for root, artifact_class, owner in (
        (DEFINE, "define-e2", "invoke"),
        (DESIGN, "design-e2", "invoke"),
        (PLAN, "plan-e2", "invoke"),
    ):
        for path in sorted((REPO / root).rglob("*")):
            if not path.is_file() or path.is_symlink():
                continue
            relative_to_root = path.relative_to(REPO / root)
            if root == PLAN and relative_to_root.parts[0] == "acceptance":
                continue
            if root == PLAN and relative_to_root.parts[:2] == ("readiness", "final-audit-output"):
                continue
            if root == PLAN and relative_to_root.parts[:2] == ("readiness", "final-audit-output-r2"):
                continue
            if root == PLAN and relative_to_root.parts[:2] == ("readiness", "final-audit-output-r3"):
                continue
            if root == PLAN and relative_to_root.parts[:2] == ("readiness", "final-audit-output-r4"):
                continue
            if root == PLAN and relative_to_root.parts[:2] == ("readiness", "final-audit-output-r5"):
                continue
            if root == PLAN and relative_to_root.parts[:2] == ("readiness", "final-audit-output-r6"):
                continue
            if root == PLAN and relative_to_root.parts[:2] == ("readiness", "final-audit-output-r7"):
                continue
            if root == PLAN and relative_to_root.parts[:2] == ("readiness", "final-audit-output-r8"):
                continue
            repo_path = path.relative_to(REPO)
            data = path.read_bytes()
            item_owner = owner
            item_class = artifact_class
            if root == PLAN and (
                relative_to_root == Path("IMPLEMENTATION-READINESS-PREFLIGHT.json")
                or relative_to_root.parts[0] == "readiness"
            ):
                item_class = "readiness-evidence"
                item_owner = "work-pack-readiness-audit-and-implementation-readiness"
            targets.append(
                {
                    "class": item_class,
                    "owner": item_owner,
                    "path": repo_path.as_posix(),
                    "sha256": sha256(data),
                    "size_bytes": len(data),
                }
            )
    package_digest = canonical_package_digest(targets)
    inventory = {
        "schema_version": "invoke.acceptance-target-inventory/v1",
        "candidate_id": CANDIDATE_ID,
        "binding_kind": "raw-sha256-exact-bytes",
        "package_root": ".",
        "package_digest_algorithm": "sha256(canonical-json(sorted array of path, sha256, size_bytes))",
        "package_digest": package_digest,
        "target_count": len(targets),
        "targets": sorted(targets, key=lambda item: item["path"]),
        "excluded_support_artifacts": [
            "invoke-plan/20260824T183501Z-meta-type-closure-e2/acceptance/* self-referential acceptance support",
            "invoke-plan/20260824T183501Z-meta-type-closure-e2/readiness/final-audit-output/* superseded pre-correction proof",
            "invoke-plan/20260824T183501Z-meta-type-closure-e2/readiness/final-audit-output-r2/* discovery proof before semantic-digest pinning",
            "invoke-plan/20260824T183501Z-meta-type-closure-e2/readiness/final-audit-output-r3/* superseded stale-generated-validator proof",
            "invoke-plan/20260824T183501Z-meta-type-closure-e2/readiness/final-audit-output-r4/* canonical typed-closeout discovery proof",
            "invoke-plan/20260824T183501Z-meta-type-closure-e2/readiness/final-audit-output-r5/* superseded pre-@4 final proof",
            "invoke-plan/20260824T183501Z-meta-type-closure-e2/readiness/final-audit-output-r6/* @4 semantic-digest discovery proof",
            "execution-runs/wp-mtc-001-e2/* run aggregation receipts outside the Plan candidate",
        ],
        "authority_effect": "none",
    }
    inventory_path = ABS_PLAN / "acceptance/TARGET-INVENTORY.json"
    write_json(inventory_path, inventory)
    inventory_ref = exact(PLAN / "acceptance/TARGET-INVENTORY.json")

    candidate = {
        "schema_version": "invoke.acceptance-candidate-manifest/v2",
        "candidate_id": CANDIDATE_ID,
        "candidate_status": "plan-proof-pass-pending-v2-request-closure-and-fresh-matching-rondelli-acceptance",
        "acceptance_subject": "Exact selected @4 E2 seven-unit WP-MTC-001 Plan after mechanical runtime-path rebasing and the canonical WPRA-v2 then proof-only Implementation Readiness sequence.",
        "package_root": ".",
        "target_inventory": inventory_ref,
        "target_count": len(targets),
        "package_digest_algorithm": inventory["package_digest_algorithm"],
        "package_digest": package_digest,
        "readiness": {
            "wpra_verdict": wpra["verdict"],
            "wpra_terminal_code": wpra["terminal_code"],
            "wpra_receipt": wpra_ref,
            "implementation_readiness_status": preflight["status"],
            "implementation_readiness_code": preflight["code"],
            "implementation_readiness_receipt": preflight_ref,
            "mutation_ready": preflight["mutation_ready"],
            "reusable_for_execution": preflight["reusable_for_execution"],
        },
        "required_plan_acceptance_owners": ["Rondelli"],
        "required_responses": ["acceptance/RONDELLI-RESPONSE.json"],
        "matching_rule": "The Rondelli response must repeat this candidate_id, target inventory SHA-256, target_count, and package_digest exactly.",
        "responses": [],
        "plan_acceptance_status": "unapproved",
        "claim_ceiling": "The frozen bytes are a validated, readiness-proved Plan candidate only. They do not select or execute a SWU, admit mutation, apply product bytes, admit the integration candidate, promote authority, publish, merge, release, deploy, or establish production readiness.",
        "authority_effect": "none",
    }
    candidate_path = ABS_PLAN / "acceptance/CANDIDATE-MANIFEST.json"
    write_json(candidate_path, candidate)
    candidate_ref = exact(PLAN / "acceptance/CANDIDATE-MANIFEST.json")

    request = {
        "schema_version": "meta-type-closure-plan-acceptance-request/v2",
        "request_id": "MTC-PLAN-ACCEPTANCE-E2-BASE-001",
        "work_pack_id": "WP-MTC-001",
        "semantic_epoch": "WP-MTC-001/E2/2026-08-24",
        "status": "base-request-preacceptance-closure-pending",
        "decision_scope": "Base request only: bind the exact readiness-proved E2 Plan candidate for canonical v2 preacceptance closure and later owner-request emission. This artifact must not be presented or answered as the owner request.",
        "candidate_manifest_ref": candidate_ref,
        "target_inventory_ref": inventory_ref,
        "target_count": len(targets),
        "package_digest": package_digest,
        "primary_owner": "Rondelli",
        "second_approver": None,
        "required_responses": [
            {"owner": "Rondelli", "path": "acceptance/RONDELLI-RESPONSE.json"}
        ],
        "response_requirements": {
            "decision_values": ["accept", "revise", "reject"],
            "distinct_owners": False,
            "matching_candidate_id": CANDIDATE_ID,
            "matching_candidate_manifest_sha256": candidate_ref["sha256"],
            "matching_target_inventory_sha256": inventory_ref["sha256"],
            "matching_target_count": len(targets),
            "matching_package_digest": package_digest,
            "invalidation_rule": "Any changed acceptance-bound byte invalidates the response and requires a new inventory, manifest, and request.",
        },
        "acceptance_effect": "permits a later fresh direct-intent selection and current Task Session admission proof; does not itself select a SWU or authorize mutation",
        "authority_effect": "none",
    }
    request_path = ABS_PLAN / "acceptance/PLAN-ACCEPTANCE-REQUEST.json"
    write_json(request_path, request)
    markdown = f"""# WP-MTC-001 E2 Plan acceptance base request

Status: base request only. Do not present or answer until the canonical v2 preacceptance-closure wrapper has been emitted and validated.

- Candidate manifest SHA-256: `{candidate_ref['sha256']}`
- Target inventory SHA-256: `{inventory_ref['sha256']}`
- Target count: `{len(targets)}`
- Package digest: `{package_digest}`
- WPRA v2: `pass / PLAN_SEMANTIC_READY`
- Implementation Readiness: `pass / PLAN_IMPLEMENTATION_READY / proof-only / zero mutation`

After passing closure and v2 emission, one repository-local `RONDELLI-RESPONSE.json` will be required and must repeat every binding above exactly. Any byte change invalidates that response. Victor approval is deferred to the exact pre-merge structural candidate.

Acceptance does not select or execute a SWU and does not authorize mutation, candidate apply, admission, promotion, publication, merge, release, or deployment.
"""
    (ABS_PLAN / "acceptance/PLAN-ACCEPTANCE-REQUEST.md").write_text(markdown, encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
