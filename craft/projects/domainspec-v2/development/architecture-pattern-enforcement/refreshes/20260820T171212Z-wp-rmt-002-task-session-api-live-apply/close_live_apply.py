#!/usr/bin/env python3
"""Close the validated Refresh apply with an immutable terminal receipt."""

from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any


RUN = Path(__file__).resolve().parent


def discover_root() -> Path:
    for candidate in (RUN, *RUN.parents):
        if (candidate / ".agents/skills/invoke").is_dir() and (
            candidate / "projects/domainspec-v2"
        ).is_dir():
            return candidate.resolve()
    raise SystemExit("repository root not found")


ROOT = discover_root()
PROPOSAL_DIR = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260816T160301Z-wp-rmt-002-task-session-transient-output-api-proposal"
)
ACCEPTANCE = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260820T163827Z-wp-rmt-002-task-session-api-owner-acceptance/"
    "DECISION-RECORD.json"
)
SIDECAR = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260820T165441Z-wp-rmt-002-mtime-governance-sidecar-disposition"
)
TERMINAL = RUN / "LIVE-APPLY-RECEIPT.json"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def exact(path: Path) -> dict[str, Any]:
    if path.is_symlink() or not path.is_file():
        raise SystemExit(f"not a regular file: {rel(path)}")
    data = path.read_bytes()
    return {"path": rel(path), "sha256": sha(data), "size_bytes": len(data)}


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def require_exact_ref(reference: dict[str, Any]) -> None:
    current = exact(ROOT / reference["path"])
    if current != reference:
        raise SystemExit(f"stale exact reference: {reference['path']}")


def main() -> int:
    if TERMINAL.exists() or TERMINAL.is_symlink():
        raise SystemExit("terminal live-apply receipt already exists")

    proposal_path = PROPOSAL_DIR / "APPLY-PROPOSAL.json"
    proposal_receipt_path = PROPOSAL_DIR / "PROPOSAL-RECEIPT.json"
    proposal = load(proposal_path)
    if (
        exact(proposal_path)["sha256"]
        != "5b6eb57fe1f8cebffb54c39fabd5ab1c5488e167a74f1584d5e4e83ed40c2ee1"
        or exact(proposal_receipt_path)["sha256"]
        != "067b1b497673bca23e5e8ac26bab5f4aad234da62efad8f04cca8f077d3455d4"
    ):
        raise SystemExit("accepted proposal binding drift")

    apply_failure = load(RUN / "APPLY-FAILURE.json")
    rollback_preflight = load(RUN / "POST-ROLLBACK-PREFLIGHT.json")
    apply_execution = load(RUN / "APPLY-EXECUTION.json")
    reconciliation = load(RUN / "APPLY-EXECUTION-RECONCILIATION.json")
    live_bytes = load(RUN / "LIVE-BYTE-VALIDATION.json")
    generator = load(RUN / "GENERATED-PROJECTION-PROOF-V2.json")
    post_validation = load(RUN / "POST-APPLY-VALIDATION.json")
    if not (
        apply_failure.get("result") == "fail"
        and apply_failure.get("rollback_result") == "pass"
        and rollback_preflight.get("result") == "pass"
        and rollback_preflight.get("exact_live_preimages") == "33/33"
        and apply_execution.get("result") == "pass"
        and apply_execution.get("transaction", {}).get("installed_postimages") == "33/33"
        and reconciliation.get("result") == "pass"
        and generator.get("result") == "pass"
        and generator.get("accepted_generated_targets") == "16/16"
        and generator.get("proof", {}).get("extra_generated_targets") == 0
        and live_bytes.get("result") == "pass"
        and live_bytes.get("exact_installed_postimages") == "33/33"
        and post_validation.get("result") == "pass"
        and post_validation.get("command_count") == 7
        and post_validation.get("pass_count") == 7
        and post_validation.get("failure_count") == 0
    ):
        raise SystemExit("live apply evidence is not closed-pass")

    for reference in (
        generator["proof"]["stdout"],
        generator["proof"]["stderr"],
        reconciliation["historical_apply_execution"],
        reconciliation["authoritative_current_generator_proof"],
    ):
        narrowed = {
            key: reference[key] for key in ("path", "sha256", "size_bytes")
        }
        require_exact_ref(narrowed)

    targets: list[dict[str, Any]] = []
    for change in proposal["changes"]:
        target = ROOT / change["target"]
        current = exact(target)
        expected = change["staged_postimage"]
        if current["sha256"] != expected["sha256"] or current["size_bytes"] != expected[
            "size_bytes"
        ]:
            raise SystemExit(f"live target is not the accepted postimage: {change['target']}")
        temporary_pattern = re.compile(
            re.escape(target.name) + r"\.wp-rmt-002-171212-.*\.(?:apply|rollback)-tmp$"
        )
        residue = [path.name for path in target.parent.iterdir() if temporary_pattern.fullmatch(path.name)]
        if residue:
            raise SystemExit(f"transaction temporary residue: {change['target']} {residue}")
        targets.append(
            {
                "path": change["target"],
                "sha256": current["sha256"],
                "size_bytes": current["size_bytes"],
                "target_class": change["target_class"],
            }
        )

    packages = []
    for partition, count in (("public", 27), ("private", 6)):
        material = RUN / "material" / partition
        package = load(material / "MATERIAL-PACKAGE.json")
        receipt = load(material / "MATERIAL-RECEIPT.json")
        handoff = load(material / "REFRESH-HANDOFF-RESULT.json")
        if (
            len(receipt.get("validatedPaths", [])) != count
            or receipt.get("patchVerdict") != "pass"
            or handoff.get("mutationReady") is not True
            or handoff.get("blockers") != []
        ):
            raise SystemExit(f"{partition} material handoff drift")
        packages.append(
            {
                "partition": partition,
                "target_count": count,
                "package_id": package["package_id"],
                "package_digest": receipt["packageDigest"],
                "package": exact(material / "MATERIAL-PACKAGE.json"),
                "receipt": exact(material / "MATERIAL-RECEIPT.json"),
                "handoff_request": exact(material / "REFRESH-HANDOFF-REQUEST.json"),
                "handoff_result": exact(material / "REFRESH-HANDOFF-RESULT.json"),
                "mutation_ready": True,
            }
        )

    source_evidence = [
        exact(PROPOSAL_DIR / "APPLY-PROPOSAL.json"),
        exact(PROPOSAL_DIR / "PROPOSAL-RECEIPT.json"),
        exact(ACCEPTANCE),
        exact(SIDECAR / "DECISION-RECORD.json"),
        exact(SIDECAR / "GOVERNANCE-DEFECT-RECEIPT.json"),
        exact(RUN / "APPLY-AUTHORIZATION.json"),
    ]
    refresh_report = {
        "mode": "refresh",
        "phaseStatus": "pass",
        "phaseStatusBasis": {
            "artifactComplete": True,
            "refreshAuthoringBlockerCount": 0,
        },
        "activationSource": "direct-user",
        "mutationMode": "apply-approved",
        "mutationModeSource": "default-direct-user",
        "handoffStatus": "ready",
        "sourceSignals": [
            {
                "id": "owner-exact-byte-acceptance",
                "signal_type": "evidence_added",
                "claim": "The frozen 33-target proposal is accepted.",
                "confidence": "high",
                "mutation_safety": "safe",
            },
            {
                "id": "mtime-sidecar-disposition",
                "signal_type": "blocker_resolved",
                "claim": "Mtime-only ordering drift is nonblocking; content and semantic drift remain stopping conditions.",
                "confidence": "high",
                "mutation_safety": "safe",
            },
            {
                "id": "direct-user-live-apply",
                "signal_type": "status_changed",
                "claim": "The user directly authorized applying the accepted Refresh and continuing the Goal.",
                "confidence": "high",
                "mutation_safety": "safe",
            },
        ],
        "targetArtifacts": [row["path"] for row in targets],
        "deltaSummary": [
            {"class": "status_changed", "count": 33, "result": "accepted postimage installed"}
        ],
        "proposedChanges": [
            {"target": row["path"], "operation": "replace"} for row in targets
        ],
        "appliedChanges": [
            {"target": row["path"], "result": "exact accepted postimage"}
            for row in targets
        ],
        "skippedChanges": [],
        "materialPackage": {
            "required": True,
            "authority_partitioned": True,
            "packages": packages,
            "validated_path_union": "33/33",
        },
        "mutationReady": True,
        "blockers": [],
        "nextRoute": "implementation-readiness:RMT-OP-001",
        "validation": [
            {
                "command_id": row["command_id"],
                "result": row["result"],
                "exit_code": row["exit_code"],
            }
            for row in post_validation["commands"]
        ],
        "execution_path": "invoke:refresh/apply-approved",
        "dispatch_trace": {
            "kind": "one-bounded-native-helper",
            "helper": "rmt_33_apply_preflight",
            "result": "PASS-TO-APPLY",
            "joined_before_mutation": True,
        },
        "source_evidence": source_evidence,
        "target_inventory": targets,
        "activation_source": "direct-user",
        "mutation_mode": "apply-approved",
        "mutation_mode_source": "default-direct-user",
        "phase_status": "pass",
        "handoff_status": "ready",
        "blocker_scopes": [],
        "material_package": {"partitions": "27-public/6-private", "result": "pass"},
        "mutation_ready": True,
        "result": "pass",
        "next_route": "implementation-readiness:RMT-OP-001",
        "authority_effect": "local-accepted-byte-install-only",
        "claim_ceiling": "No implementation SWU selected or executed; no commit, publication, promotion, release, deployment, or production claim.",
    }
    write_json(RUN / "refresh-report.json", refresh_report)

    markdown = """## Outcome Brief

The accepted WP-RMT-002 Task Session Refresh is now applied to all 33 declared targets. The installed bytes—not the staged copies—passed Task Session admission and governance suites, the full hostile harness, generated-package parity, live plan validation, and scoped whitespace checks. The earlier mtime-only issue remains a nonblocking governance sidecar.

- Objective: install the accepted transient-output API and dependent WP-RMT-002 proof refresh.
- Result: 33/33 exact postimages installed and 7/7 live validation commands passed.
- Why it matters: WP-RMT-002 can now proceed to fresh implementation readiness and selection of RMT-OP-001.

## Boundary and Next Decision

- Changed: 11 canonical public Task Session files, 16 generated host projections, and 6 private WP-RMT-002 plan/proof files.
- Unchanged: implementation outputs, registry/ontology authority, promotion, publication, release, deployment, production state, Git history, and unrelated dirty work.
- Open questions: none inside this Refresh apply.
- User decision: none; the direct-user instruction already requests continuation of the Goal.
- Next action: rerun readiness against live bytes, then select and admit RMT-OP-001 through Task Session.

## Technical Details

## Invoke Validation Fixture Result

- Mode: refresh
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: pass
- Phase status basis: current Refresh apply complete; zero Refresh-authoring blockers
- Handoff readiness: ready
- Mode contract: arcanum/spells/invoke/refresh.md
- Outputs: REFRESH-REPORT.md and refresh-report.json
- Mutation mode: apply-approved
- Source signals: 3; owner acceptance, mtime sidecar disposition, direct-user live apply
- Target artifacts: 33 exact paths
- Proposed changes: 33 replacements
- Applied changes: 33 exact accepted postimages
- Skipped changes: none
- Material package: 27-public and 6-private authority partitions; both receipts pass and both handoffs are ready
- Mutation ready: true
- Capability ceilings: implementation selection and execution remain separate gates
- Validation: 7/7 live commands passed; admission 13/13, governance 32/32, harness 20/20 positive and 26/26 negative, host parity 8/8 each
- Decisions: mtime-only drift remains nonblocking; content or semantic drift remains fail-closed
- Blockers by scope: refresh-authoring 0, apply-authorization 0, target-lifecycle 0, audit 0
- Unresolved gaps: none inside Refresh; RMT-OP-001 still requires fresh readiness, selection, and mutation admission
- Next route: implementation-readiness:RMT-OP-001
"""
    (RUN / "REFRESH-REPORT.md").write_text(markdown, encoding="utf-8")

    for artifact in (RUN / "refresh-report.json", RUN / "REFRESH-REPORT.md"):
        data = artifact.read_bytes()
        if not data.endswith(b"\n") or b"\r" in data:
            raise SystemExit(f"Refresh report hygiene failure: {artifact.name}")
        if artifact.suffix == ".json":
            json.loads(data.decode("utf-8"))

    materials = []
    total_size = 0
    rows = []
    for path in sorted(
        (candidate for candidate in RUN.rglob("*") if candidate.is_file()),
        key=lambda item: item.relative_to(RUN).as_posix().encode("utf-8"),
    ):
        if path == TERMINAL:
            continue
        if path.is_symlink():
            raise SystemExit(f"run material symbolic link: {path.relative_to(RUN)}")
        data = path.read_bytes()
        item = {
            "path": path.relative_to(RUN).as_posix(),
            "sha256": sha(data),
            "size_bytes": len(data),
        }
        materials.append(item)
        total_size += len(data)
        rows.append(f"{item['sha256']}\t{item['size_bytes']}\t{item['path']}\n")
    inventory = {
        "algorithm": "sha256(sorted raw-byte path rows: sha256<TAB>size<TAB>path<LF>)",
        "file_count": len(materials),
        "total_size_bytes": total_size,
        "sha256": sha("".join(rows).encode("utf-8")),
        "materials": materials,
    }
    terminal = {
        "schema_version": "domainspec.wp-rmt-002-live-apply-receipt/v1",
        "status": "pass",
        "result": "pass",
        "proposal_id": proposal["proposal_id"],
        "work_pack_id": "WP-RMT-002",
        "authorization": exact(RUN / "APPLY-AUTHORIZATION.json"),
        "owner_acceptance": exact(ACCEPTANCE),
        "accepted_proposal": exact(proposal_path),
        "accepted_proposal_receipt": exact(proposal_receipt_path),
        "frozen_proposal_inventory_sha256": "f2b318255e35cdc5ffe5d37586e1d90ebd4d6a38224f42580f9a6345b84c3ec3",
        "mtime_governance_sidecar": {
            "classification": "nonblocking-governance-only",
            "decision": exact(SIDECAR / "DECISION-RECORD.json"),
            "receipt": exact(SIDECAR / "GOVERNANCE-DEFECT-RECEIPT.json"),
        },
        "material_packages": packages,
        "apply_attempts": {
            "first": {
                "result": "stopped-and-rolled-back",
                "canonical_files_applied_before_stop": 11,
                "rollback": "33/33 exact preimages restored",
                "failure": exact(RUN / "APPLY-FAILURE.json"),
                "post_rollback_preflight": exact(RUN / "POST-ROLLBACK-PREFLIGHT.json"),
            },
            "second": {
                "result": "pass",
                "preflight": exact(RUN / "PREAPPLY-VALIDATION.json"),
                "execution": exact(RUN / "APPLY-EXECUTION.json"),
                "execution_reconciliation": exact(RUN / "APPLY-EXECUTION-RECONCILIATION.json"),
            },
        },
        "post_apply": {
            "target_count": 33,
            "exact_postimages": "33/33",
            "postimage_inventory_sha256": live_bytes["inventory_sha256"],
            "targets": targets,
            "live_byte_validation": exact(RUN / "LIVE-BYTE-VALIDATION.json"),
            "generated_projection": exact(RUN / "GENERATED-PROJECTION-PROOF-V2.json"),
            "validation": exact(RUN / "POST-APPLY-VALIDATION.json"),
            "validation_commands": "7/7",
            "admission_tests": "13/13",
            "governance_tests": "32/32",
            "governance_harness": "20/20 positive; 26/26 negative",
            "codex_parity": "8/8",
            "claude_parity": "8/8",
            "live_plan_validator": "pass; stdout exact-equals live VALIDATION-RESULT.json",
            "temporary_residue": 0,
        },
        "pre_receipt_inventory": inventory,
        "next_route": "implementation-readiness:RMT-OP-001",
        "implementation_swu_selected": False,
        "implementation_swu_executed": False,
        "commit": False,
        "push": False,
        "publication": False,
        "promotion": False,
        "release": False,
        "deployment": False,
        "production_readiness": False,
        "authority_effect": "local-accepted-byte-install-only",
        "claim_ceiling": "Refresh apply and live validation only; downstream readiness, selection, admission, implementation, and lifecycle claims remain separate.",
    }
    rendered = (json.dumps(terminal, indent=2, sort_keys=True) + "\n").encode("utf-8")
    descriptor = os.open(TERMINAL, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
    with os.fdopen(descriptor, "wb", closefd=True) as handle:
        handle.write(rendered)
        handle.flush()
        os.fsync(handle.fileno())
    print(json.dumps({"receipt": rel(TERMINAL), "sha256": sha(rendered), "size_bytes": len(rendered)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
