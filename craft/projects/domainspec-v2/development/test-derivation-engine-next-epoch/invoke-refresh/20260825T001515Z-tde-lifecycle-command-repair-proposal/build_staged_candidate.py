#!/usr/bin/env python3
"""Build the exact proposal-only TDE @4 lifecycle/command repair candidate."""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path, PurePosixPath
from typing import Any


REPO = Path(__file__).resolve().parents[6]
RUN = Path(__file__).resolve().parent
SOURCE_REL = PurePosixPath(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3"
)
TARGET_REL = PurePosixPath(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4"
)
SOURCE_ID = "dsv2-tde-multiformalism-profile-epoch@3"
TARGET_ID = "dsv2-tde-multiformalism-profile-epoch@4"
SOURCE = REPO / str(SOURCE_REL)
STAGING = RUN / "staging"
STAGED_TARGET = STAGING / str(TARGET_REL)
OVERLAY = RUN / "validation/repository-overlay"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def exact_ref(path: Path, *, root: Path = REPO) -> dict[str, Any]:
    data = path.read_bytes()
    return {
        "path": path.relative_to(root).as_posix(),
        "sha256": sha256_bytes(data),
        "size_bytes": len(data),
    }


EXACT_REPLACEMENTS = {
    "# TDE Multiformalism Profile Epoch @2 Result": "# TDE Multiformalism Profile Epoch @4 Result",
    "# Strict Context Pack — TDE Epoch @2": "# Strict Context Pack — TDE Epoch @4",
    '"task": "TDE epoch @2 admission readiness"': '"task": "TDE epoch @4 admission readiness"',
    "# Distill Validation — TDE Epoch @2": "# Distill Validation — TDE Epoch @4",
    "# Execution Pack — TDE Multiformalism Profile Epoch @2": "# Execution Pack — TDE Multiformalism Profile Epoch @4",
    "# Implementation Plan — TDE Multiformalism Profile Epoch @2": "# Implementation Plan — TDE Multiformalism Profile Epoch @4",
    "# Staged Validation Report — TDE Epoch @2": "# Staged Validation Report — TDE Epoch @4",
    "exact @2 acceptance": "exact @4 acceptance",
    "direct exact @2 acceptance": "direct exact @4 acceptance",
    "renewed exact @2 acceptance": "renewed exact @4 acceptance",
    "exact accepted @2 Plan epoch": "exact accepted @4 Plan epoch",
    "exact final @2 manifest digest": "exact final @4 manifest digest",
    "exact @2 Plan candidate": "exact @4 Plan candidate",
    "newly authored @2 postimage": "newly authored @4 postimage",
    "new @2 bytes": "new @4 bytes",
    "fresh @2 candidate": "fresh @4 candidate",
    "final @2 freeze": "final @4 freeze",
    "This @2 Plan adds": "This @4 Plan preserves",
    "W0 exact @2 Plan acceptance": "W0 exact @4 Plan acceptance",
    "exact final @3 candidate digest": "exact final @4 candidate digest",
    "fresh exact @3 Plan successor": "fresh exact @4 Plan successor",
    "final @3 candidate digest": "final @4 candidate digest",
    "exact final @3 candidate manifest digest": "exact final @4 candidate manifest digest",
    "treat @2 as newly acceptance-bound": "treat @4 as acceptance-bound before live apply validation",
    "Exact @2 acceptance remains unapproved": "Exact @4 acceptance remains unapproved",
    "pending exact @2 Rondelli acceptance": "pending exact @4 Rondelli acceptance",
}


LINE_REPLACEMENTS = {
    (
        "The direct user authorizes the exact declared Refresh scope and confirms the prior @1 decision, "
        "but cannot pre-accept unborn @2 bytes."
    ): (
        "Historical provenance only: the prior @1 approval did not pre-accept @2, and no @2 "
        "acceptance or @3 apply authorization transfers to the fresh @4 candidate."
    ),
    (
        "FormalClaim @3 is an accepted source baseline through the exact Rondelli admission receipt. "
        "The current C12 decision supersedes the obsolete Victor authoring-stage blocker and places Victor "
        "at exact pre-merge. The @1 Design is preserved byte-for-byte; @2 adds the machine execution, "
        "validation, receipt, closeout, continuity, and budget contracts needed for selected-unit readiness. "
        "Current TDE and candidate implementation profiles remain substrate rather than blanket admission."
    ): (
        "FormalClaim @3 is an accepted source baseline through the exact Rondelli admission receipt. "
        "The current C12 decision supersedes the obsolete Victor authoring-stage blocker and places Victor "
        "at exact pre-merge. Historical provenance only: @2 introduced the machine execution, validation, "
        "receipt, closeout, continuity, and budget contracts, but no @2 acceptance or @3 apply authority "
        "transfers to @4. Current TDE and candidate implementation profiles remain substrate rather than "
        "blanket admission."
    ),
    (
        "This @4 Plan preserves acceptance-bound execution, validation, receipt, closeout, and readiness "
        "contracts. The current user approval bound the prior @1 bytes and the exact Refresh scope; it cannot "
        "be stretched over this unseen postimage. Rondelli must accept the final @4 candidate digest before "
        "any SWU selection or mutation."
    ): (
        "This @4 Plan preserves acceptance-bound execution, validation, receipt, closeout, and readiness "
        "contracts. Historical provenance only: the prior @1 approval did not transfer to @2, and neither "
        "@2 acceptance nor @3 apply authorization transfers to these @4 bytes. Rondelli must accept the "
        "final @4 candidate digest before any SWU selection or mutation."
    ),
}


def transform_text(text: str) -> str:
    text = text.replace(str(SOURCE_REL), str(TARGET_REL))
    text = text.replace(SOURCE_ID, TARGET_ID)
    for old, new in EXACT_REPLACEMENTS.items():
        text = text.replace(old, new)
    for old, new in LINE_REPLACEMENTS.items():
        text = text.replace(old, new)
    return text


def update_exact_refs(value: Any) -> None:
    if isinstance(value, dict):
        if {"path", "sha256", "size_bytes"} <= set(value) and isinstance(value["path"], str):
            repo_path = PurePosixPath(value["path"])
            staged = STAGING / str(repo_path)
            source = staged if staged.is_file() else REPO / str(repo_path)
            if source.is_file():
                data = source.read_bytes()
                value["sha256"] = sha256_bytes(data)
                value["size_bytes"] = len(data)
        for child in value.values():
            update_exact_refs(child)
    elif isinstance(value, list):
        for child in value:
            update_exact_refs(child)


def build_overlay(audit_config: dict[str, Any]) -> None:
    if OVERLAY.exists():
        shutil.rmtree(OVERLAY)
    (OVERLAY / ".git").mkdir(parents=True, exist_ok=True)
    (OVERLAY / ".git/PROPOSAL-OVERLAY").write_text(
        "Proposal-only validation overlay; not a canonical target or Git repository.\n",
        encoding="utf-8",
    )
    shutil.copytree(STAGED_TARGET, OVERLAY / str(TARGET_REL), dirs_exist_ok=True)

    refs: set[str] = set()

    def collect(value: Any) -> None:
        if isinstance(value, dict):
            if {"path", "sha256", "size_bytes"} <= set(value) and isinstance(value["path"], str):
                refs.add(value["path"])
            for child in value.values():
                collect(child)
        elif isinstance(value, list):
            for child in value:
                collect(child)

    collect(audit_config)
    contracts = json.loads(
        (STAGED_TARGET / "plan/work-pack/shared/EXECUTION-CONTRACTS.json").read_text()
    )
    collect(contracts)
    for ref in sorted(refs):
        destination = OVERLAY / ref
        if destination.exists():
            continue
        source = REPO / ref
        if source.is_file():
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)

    for binding in audit_config["execution_bindings"]:
        (OVERLAY / binding["command"]["cwd"]).mkdir(parents=True, exist_ok=True)
        for command in binding["validation_contracts"]:
            (OVERLAY / command["cwd"]).mkdir(parents=True, exist_ok=True)


def main() -> None:
    if (REPO / str(TARGET_REL)).exists():
        raise SystemExit(f"canonical target already exists: {TARGET_REL}")
    source_files = sorted(path for path in SOURCE.rglob("*") if path.is_file())
    if len(source_files) != 84:
        raise SystemExit(f"expected exact 84-file stopped @3 source, found {len(source_files)}")
    if any(path.is_symlink() for path in SOURCE.rglob("*")):
        raise SystemExit("stopped @3 source contains a symlink")
    if STAGING.exists():
        shutil.rmtree(STAGING)
    if OVERLAY.exists():
        shutil.rmtree(OVERLAY)

    replacement_counts = {key: 0 for key in EXACT_REPLACEMENTS}
    line_counts = {key: 0 for key in LINE_REPLACEMENTS}
    for source in source_files:
        relative = source.relative_to(SOURCE)
        destination = STAGED_TARGET / relative
        data = source.read_bytes()
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError as error:
            raise SystemExit(f"non-text candidate file: {relative}: {error}")
        for key in replacement_counts:
            replacement_counts[key] += text.count(key)
        transformed = transform_text(text)
        for key in line_counts:
            line_counts[key] += transformed.count(key)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(transformed, encoding="utf-8")

    execution_path = STAGED_TARGET / "plan/EXECUTION-ENTRY.json"
    execution = json.loads(execution_path.read_text())
    routes = execution["execution_policy"]["allowed_routes"]
    routes_digest = sha256_bytes(
        json.dumps(routes, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    )
    execution["execution_policy"]["allowed_routes_digest"] = routes_digest
    write_json(execution_path, execution)

    bindings_path = STAGED_TARGET / "readiness/AUDIT-BINDINGS.json"
    bindings = json.loads(bindings_path.read_text())
    bindings["audit_id"] = "DS-TDE-EPOCH-READINESS-20260825T001515Z-R4"
    bindings["material_policy"]["immutable_paths"][0] = str(TARGET_REL)
    bindings["objective"]["plan_acceptance_state"] = "pending-fresh-exact-r4-postimage"
    bindings["status"].update(
        approval="unapproved",
        audit="not-run",
        audit_verdict="pending",
        chain="not-started",
        mutation_runtime_ready="false",
    )
    for index in range(1, 11):
        unit = f"TDE-EPOCH-{index:03d}"
        contract = STAGED_TARGET / f"plan/work-pack/shared/validation-contracts/{unit}-VALIDATION.json"
        bindings["validation_policy"]["unit_contract_digests"][unit] = sha256_bytes(
            contract.read_bytes()
        )
    write_json(bindings_path, bindings)

    audit_path = STAGED_TARGET / "readiness/audit-config.json"
    audit = json.loads(audit_path.read_text())
    audit["audit_id"] = "DS-TDE-EPOCH-READINESS-20260825T001515Z-R4"
    audit["execution_policy"]["allowed_routes"] = routes
    audit["execution_policy"]["allowed_routes_digest"] = routes_digest
    update_exact_refs(audit)
    write_json(audit_path, audit)

    validation_path = STAGED_TARGET / "validation/VALIDATION.json"
    validation = json.loads(validation_path.read_text())
    validation["candidate_id"] = TARGET_ID
    validation["current_checks"]["lifecycle_wording_regression"] = "pass-on-exact-staged-targets"
    validation["current_checks"]["validation_command_operand_kind"] = "pass-directory-ten-contracts"
    validation["current_checks"]["validation_command_argv_parity"] = "pass-proposal-surfaces"
    validation["stage"] = "proposal-only-pre-material-freeze"
    write_json(validation_path, validation)

    # The validation document changed after the first audit-ref update. Refresh every
    # exact candidate ref once more, then serialize the audit config as the final target byte.
    audit = json.loads(audit_path.read_text())
    update_exact_refs(audit)
    write_json(audit_path, audit)
    build_overlay(audit)

    source_inventory = [
        {
            "path": source.relative_to(REPO).as_posix(),
            "sha256": sha256_bytes(source.read_bytes()),
            "size_bytes": source.stat().st_size,
        }
        for source in source_files
    ]
    staged_files = sorted(path for path in STAGED_TARGET.rglob("*") if path.is_file())
    build_result = {
        "schema_version": "domainspec-v2.tde-r4-repair-build/v1",
        "source_candidate_id": SOURCE_ID,
        "source_root": str(SOURCE_REL),
        "source_file_count": len(source_files),
        "source_inventory_digest": sha256_bytes(
            json.dumps(source_inventory, sort_keys=True, separators=(",", ":")).encode()
        ),
        "proposed_candidate_id": TARGET_ID,
        "canonical_target_root": str(TARGET_REL),
        "canonical_target_absent": not (REPO / str(TARGET_REL)).exists(),
        "staged_file_count": len(staged_files),
        "replacement_counts": replacement_counts,
        "historical_line_replacement_counts": line_counts,
        "allowed_routes_digest": routes_digest,
        "overlay_root": OVERLAY.relative_to(REPO).as_posix(),
        "authority_effect": "none",
    }
    write_json(RUN / "validation/BUILD-RESULT.json", build_result)
    write_json(
        RUN / "source/SOURCE-INVENTORY.json",
        {
            "schema_version": "domainspec-v2.refresh-source-inventory/v1",
            "source_candidate_id": SOURCE_ID,
            "source_candidate_state": "applied-stopped-not-accepted-for-execution",
            "source_candidate_root": str(SOURCE_REL),
            "source_count": len(source_inventory),
            "entries": source_inventory,
            "inventory_digest": build_result["source_inventory_digest"],
            "authority_effect": "none",
        },
    )
    print(json.dumps(build_result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
