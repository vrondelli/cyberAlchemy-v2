#!/usr/bin/env python3
"""Materialize the accepted @3 Plan semantics with E2-local runtime bindings."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[6]
RUN = Path(
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-plan/20260824T183501Z-meta-type-closure-e2"
)
ABS_RUN = REPO / RUN
SOURCE = Path(
    "projects/domainspec-v2/development/meta-type-closure-epoch/execution-runs/"
    "wp-mtc-001/planning-correction-r4/staged/projects/domainspec-v2/development/"
    "meta-type-closure-epoch/invoke-plan/20260824T153259Z-meta-type-closure-e1"
)
ABS_SOURCE = REPO / SOURCE
SOURCE_MANIFEST_SHA256 = (
    "668afc0953020cf1d1b0cdc238d6f6428b4ee9f1f57392992cb8381487a7bdff"
)
OLD_EXECUTION_RUN = (
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "execution-runs/wp-mtc-001"
)
NEW_EXECUTION_RUN = f"{OLD_EXECUTION_RUN}-e2"
OLD_DEFINE_RUN = (
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-define/20260824T153259Z-meta-type-closure-e1"
)
NEW_DEFINE_RUN = (
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-define/20260824T183501Z-meta-type-closure-e2"
)
OLD_DESIGN_RUN = (
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-design/20260824T153259Z-meta-type-closure-e1"
)
NEW_DESIGN_RUN = (
    "projects/domainspec-v2/development/meta-type-closure-epoch/"
    "invoke-design/20260824T183501Z-meta-type-closure-e2"
)

# These are the active Plan/runtime contracts. Distill receipts remain exact historical
# adoption evidence and therefore retain their original E1 locators and digests.
ACTIVE_ARTIFACTS = {
    "BLOCKER-GAP-LEDGER.md",
    "CLOSEOUT-CONTRACTS.json",
    "DISPATCH-TECHNIQUE-TRACE.json",
    "EXECUTION-ENTRY.json",
    "EXECUTION-PACK.md",
    "IMPLEMENTATION-LAYERING.md",
    "READINESS-STATUS.json",
    "RULE-NORMALIZATION-CONTRACT.json",
    "SWU-CONTRACTS.json",
    "SWU-MANIFEST.json",
    "SWU-MTC-005-CHILD-COMMANDS.json",
    "TEMPLATE-SELECTION-RECORD.json",
    "VALIDATION-CONTRACTS.json",
    "VALIDATION-STRATEGY.md",
    "WORK-PACK.md",
    "WRITE-SCOPE-BASELINE.json",
    "tasks/TASK-MTC-001-BASELINE.md",
    "tasks/TASK-MTC-002-OPERATION-REBIND.md",
    "tasks/TASK-MTC-003-WORKFLOW-D04.md",
    "tasks/TASK-MTC-004-VALIDATE-AND-FREEZE.md",
    "waves/W0-BASELINE.md",
    "waves/W1-OPERATION-REBIND.md",
    "waves/W2-WORKFLOW-D04.md",
    "waves/W3-VALIDATE.md",
    "waves/W4-CANDIDATE.md",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def rebase(data: bytes) -> bytes:
    replacements = (
        (SOURCE.as_posix(), RUN.as_posix()),
        (OLD_DEFINE_RUN, NEW_DEFINE_RUN),
        (OLD_DESIGN_RUN, NEW_DESIGN_RUN),
        (OLD_EXECUTION_RUN, NEW_EXECUTION_RUN),
    )
    for old, new in replacements:
        data = data.replace(old.encode(), new.encode())
    return data


def main() -> int:
    manifest_path = ABS_SOURCE / "CANDIDATE-MANIFEST.json"
    manifest_bytes = manifest_path.read_bytes()
    if sha256(manifest_bytes) != SOURCE_MANIFEST_SHA256:
        raise SystemExit("source candidate manifest digest drift")
    manifest = json.loads(manifest_bytes)
    artifacts = manifest["artifacts"]
    if len(artifacts) != 42:
        raise SystemExit("source candidate artifact count drift")

    for artifact in artifacts:
        relative = artifact["path"]
        source = ABS_SOURCE / relative
        data = source.read_bytes()
        if sha256(data) != artifact["sha256"] or len(data) != artifact["size_bytes"]:
            raise SystemExit(f"source artifact drift: {relative}")
        if relative in ACTIVE_ARTIFACTS:
            data = rebase(data)
        target = ABS_RUN / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)

    baseline_path = ABS_RUN / "WRITE-SCOPE-BASELINE.json"
    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    for target in baseline["planned_create_targets"]:
        target["baseline_state"] = "absent"
        target.pop("sha256", None)
        target.pop("size_bytes", None)
    baseline["baseline_epoch"] = "WP-MTC-001-E2-fresh-standard-route"
    baseline["captured_at"] = "2026-08-24T23:22:49Z"
    baseline["resume_from"] = "SWU-MTC-000"
    baseline["partial_execution_note"] = (
        "No candidate-local completion is adopted into the E2 standard route. "
        "All 96 declared execution outputs were rechecked absent; execution begins "
        "with SWU-MTC-000 after exact Plan acceptance and current Task Session admission."
    )
    write_json(baseline_path, baseline)

    entry_path = ABS_RUN / "EXECUTION-ENTRY.json"
    entry = json.loads(entry_path.read_text(encoding="utf-8"))
    routes = [
        route
        for route in entry["execution_policy"]["allowed_routes"]
        if route["capability"] == "task-session"
    ]
    if len(routes) != 7 or {route["frontier_swu"] for route in routes} != set(entry["frontier"]):
        raise SystemExit("refreshed entry must expose exactly one Task Session route per unit")
    entry["execution_policy"]["allowed_routes"] = routes
    canonical = json.dumps(
        routes, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).encode()
    entry["execution_policy"]["allowed_routes_digest"] = sha256(canonical)
    entry["execution_entry"] = {
        "state": "selection-ready",
        "selected_unit": None,
        "route_id": None,
        "next_owner": "implementation-readiness:execute",
    }
    entry["pre_execution_owner_prerequisite"] = None
    entry["continuation_rule"] = (
        "The final E2 Plan first runs Work Pack Readiness Audit v2, then proof-only "
        "Implementation Readiness with zero mutation. Fresh distinct Rondelli and Victor "
        "responses must bind the identical final inventory before any later execution "
        "intent, unit selection, Task Session admission, or mutation. After acceptance, "
        "execute at most one SWU per fresh Task Session with mandatory Invoke Refresh "
        "closeout. Stop at the first failed validation, drift, undeclared delta, missing "
        "receipt, semantic choice, authority effect, or scope expansion. SWU-MTC-006 "
        "terminates with successor null and does not apply or admit the candidate."
    )
    write_json(entry_path, entry)

    swu_manifest_path = ABS_RUN / "SWU-MANIFEST.json"
    swu_manifest = json.loads(swu_manifest_path.read_text(encoding="utf-8"))
    swu_manifest["status"] = "selection-ready-plan-topology-refresh-e2"
    write_json(swu_manifest_path, swu_manifest)

    text_replacements = {
        "WORK-PACK.md": (
            ("Meta-Type Closure Epoch E1", "Meta-Type Closure Epoch E2"),
            ("block-pending-exact-plan-acceptance-and-readiness-preflight", "block-pending-fresh-matching-plan-acceptance"),
            ("pass-independent-proposer-r3-and-parent-balancer", "pass-adopted-r4-and-e2-topology-validation"),
            ("block-not-yet-run-on-final-accepted-bytes", "pass-proof-only-zero-mutation"),
            ("| implementationReadinessReceiptRef | n/a |", "| implementationReadinessReceiptRef | `IMPLEMENTATION-READINESS-PREFLIGHT.json` |"),
            ("accepted-finite-stream-after-exact-plan-acceptance", "pending-fresh-matching-rondelli-acceptance"),
            ("authorized-by-MTC-EXECUTION-PLAN-CLOSURE-001; approvals deferred", "inactive; standard E2 owner-gated route selected"),
            ("| executionEntryState | owner-prerequisite |", "| executionEntryState | selection-ready |"),
            ("| [TASK-MTC-001](tasks/TASK-MTC-001-BASELINE.md) | freeze all-13 baseline | L0 | W0 | inherited-candidate-local-evidence | complete-through-SWU-MTC-001 |", "| [TASK-MTC-001](tasks/TASK-MTC-001-BASELINE.md) | freeze all-13 baseline | L0 | W0 | ready-after-plan-acceptance | not-started-in-standard-E2-route |"),
            ("| [TASK-MTC-002](tasks/TASK-MTC-002-OPERATION-REBIND.md) | stage both Operation rebinds | L1 | W1 | resume-SWU-MTC-003 | partial-SWU-MTC-002-complete |", "| [TASK-MTC-002](tasks/TASK-MTC-002-OPERATION-REBIND.md) | stage both Operation rebinds | L1 | W1 | dependency-bound | not-started-in-standard-E2-route |"),
            ("| MTC-B01 | final Plan bytes lack exact digest-bound acceptance | Rondelli, then Victor | Decision Gate over final candidate manifest |", "| MTC-B01 | final Plan bytes lack fresh matching exact responses | Rondelli | one exact response over the candidate manifest, inventory, target count, and package digest |"),
            ("| MTC-B02 | Implementation Readiness proof-only preflight has not run on final accepted Plan bytes | implementation-readiness | run only after MTC-B01 without changing Plan semantics |", "| MTC-B02 | canonical readiness proof | work-pack-readiness-audit, implementation-readiness | resolved after final typed-closeout proof; see `READINESS-STATUS.json` |"),
            ("## @3 Candidate-Local Correction", "## E2 Standard Route"),
        ),
        "EXECUTION-PACK.md": (
            ("Execution entry: owner-prerequisite", "Execution entry: selection-ready, owner acceptance still pending"),
            ("Frontier: six ordered SWUs", "Frontier: seven ordered SWUs"),
            ("## @3 Route Note", "## @4 Route Note"),
        ),
    }
    for relative, replacements in text_replacements.items():
        path = ABS_RUN / relative
        text = path.read_text(encoding="utf-8")
        for old, new in replacements:
            text = text.replace(old, new)
        path.write_text(text, encoding="utf-8")

    dispatch_path = ABS_RUN / "DISPATCH-TECHNIQUE-TRACE.json"
    dispatch = json.loads(dispatch_path.read_text(encoding="utf-8"))
    for technique in dispatch["techniques"]:
        technique["applied_to"] = technique["applied_to"].replace("six-unit", "seven-unit").replace("six units", "seven units")
        if technique["status"] == "pass-distill-r3":
            technique["status"] = "pass-distill-r4-plus-e2-topology"
    write_json(dispatch_path, dispatch)

    child_path = ABS_RUN / "SWU-MTC-005-CHILD-COMMANDS.json"
    child_contract = json.loads(child_path.read_text(encoding="utf-8"))
    child_digest = child_contract["command_set_digest"]
    if not isinstance(child_digest, str) or len(child_digest) != 64:
        raise SystemExit("child command-set digest is invalid")
    validation_path = ABS_RUN / "VALIDATION-CONTRACTS.json"
    validation = json.loads(validation_path.read_text(encoding="utf-8"))
    replacements = 0
    for unit in validation["units"]:
        for command in unit["commands"]:
            argv = command["argv"]
            for index, value in enumerate(argv[:-1]):
                if value == "--commands-contract-sha256":
                    argv[index + 1] = child_digest
                    replacements += 1
    if replacements != 1:
        raise SystemExit("child command digest binding count drift")
    write_json(validation_path, validation)

    rule_contract_path = ABS_RUN / "RULE-NORMALIZATION-CONTRACT.json"
    rule_contract = json.loads(rule_contract_path.read_text(encoding="utf-8"))
    rule_contract["decision_ref"]["path"] = (
        f"{OLD_EXECUTION_RUN}/decision-gate/"
        "MTC-EXECUTION-PLAN-CLOSURE-001.decision.json"
    )
    write_json(rule_contract_path, rule_contract)

    authorization = {
        "schema_version": "domainspec.invoke-plan-canonical-order-authorization/v1",
        "invocation_id": "20260824T183501Z-meta-type-closure-e2",
        "work_pack_id": "WP-MTC-001",
        "status": "selected",
        "selected_order": [
            "work-pack-readiness-audit/v2",
            "implementation-readiness/proof-only",
            "fresh-matching-rondelli-victor-acceptance",
        ],
        "source": "direct-user-authorization",
        "execution_authority": False,
        "mutation_authority": False,
        "authority_effect": "none",
    }
    write_json(ABS_RUN / "CANONICAL-ORDER-AUTHORIZATION.json", authorization)

    adoption = {
        "schema_version": "domainspec.invoke-plan-adoption/v2",
        "invocation_id": "20260824T183501Z-meta-type-closure-e2",
        "work_pack_id": "WP-MTC-001",
        "adopted_candidate": {
            "package_id": manifest["package_id"],
            "root": SOURCE.as_posix(),
            "manifest_path": (SOURCE / "CANDIDATE-MANIFEST.json").as_posix(),
            "manifest_sha256": SOURCE_MANIFEST_SHA256,
            "content_digest": manifest["content_digest"],
            "artifact_count": len(artifacts),
            "serial_unit_count": 7,
        },
        "topology_refresh": {
            "status": "applied",
            "change_class": "mechanical-runtime-binding-and-lifecycle-order-only",
            "plan_root": RUN.as_posix(),
            "execution_run_root": NEW_EXECUTION_RUN,
            "define_run_root": NEW_DEFINE_RUN,
            "design_run_root": NEW_DESIGN_RUN,
            "execution_entry_state": "selection-ready",
            "semantic_delta": "no product or SWU semantic change; execution-plan topology and readiness semantic projection refreshed",
        },
        "authorization_ref": "CANONICAL-ORDER-AUTHORIZATION.json",
        "historical_receipts_reused": False,
        "authority_effect": "none",
    }
    write_json(ABS_RUN / "ADOPTION-MANIFEST.json", adoption)

    readiness = {
        "schema_version": "meta-type-closure-readiness-status/v2",
        "work_pack_id": "WP-MTC-001",
        "status": "proof-pending",
        "canonical_order": authorization["selected_order"],
        "work_pack_gate_status": "pending-wpra-v2",
        "work_pack_readiness_audit": {"status": "pending", "required_version": "v2", "receipt_ref": None},
        "implementation_readiness": {"status": "pending", "mode": "proof-only", "receipt_ref": None},
        "owner_acceptance": {"status": "not-requested", "required_owners": ["Rondelli", "Victor"], "matching_inventory_required": True},
        "task_session_authorized": False,
        "mutation_authorized": False,
        "authority_effect": "none",
    }
    write_json(ABS_RUN / "READINESS-STATUS.json", readiness)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
