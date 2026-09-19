#!/usr/bin/env python3
"""Restore the exact EVF pre-apply state after post-apply lifecycle failure."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import apply_exact_postimages as apply_driver


MATERIAL = Path(__file__).resolve().parent
ROOT = apply_driver.ROOT
MATERIAL_ROOT = MATERIAL / "root"
APPLY_RECEIPT = MATERIAL / "APPLY-EXECUTION-RECEIPT.json"
BASE_INVENTORY = MATERIAL_ROOT / (
    "sources/projects/domainspec-v2/development/evolvable-validation-framework/"
    "development/planning-runs/20260820T173249Z-post-l0-l1-plan/"
    "POSTIMAGE-INVENTORY.json"
)
EXPECTED_DRIVER_SHA256 = (
    "3003afa05b947d1337ebaff8fdda823f0aa713da3095e0b8009c97b2ff5426a0"
)
EXPECTED_APPLY_RECEIPT_SHA256 = (
    "a7a04fb8da7e78b58a784449ddc55f1cb3377f0ae732907337f3336988757dcf"
)
EXPECTED_BASE_SHA256 = (
    "0c25e4777f84186bfe2383313d24cca033e42163da0bea39cc8ed3a2ce9fb045"
)
TEMP_TOKEN = ".evf-l1-plan-b61f9935-postapply-rollback"


class RollbackFailure(RuntimeError):
    """A fail-closed rollback error."""


def load_exact_json(path: Path, expected_sha: str, label: str) -> tuple[dict[str, Any], bytes]:
    data = apply_driver.regular_bytes(path, ROOT, label)
    if apply_driver.sha(data) != expected_sha:
        raise RollbackFailure(f"{label} digest drift")
    try:
        value = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise RollbackFailure(f"{label} is not valid UTF-8 JSON: {error}") from error
    if not isinstance(value, dict):
        raise RollbackFailure(f"{label} is not a JSON object")
    return value, data


def prepare() -> list[dict[str, Any]]:
    driver_bytes = apply_driver.regular_bytes(
        Path(apply_driver.__file__).resolve(), ROOT, "bound apply driver"
    )
    if apply_driver.sha(driver_bytes) != EXPECTED_DRIVER_SHA256:
        raise RollbackFailure("bound apply driver digest drift")
    receipt, _ = load_exact_json(
        APPLY_RECEIPT, EXPECTED_APPLY_RECEIPT_SHA256, "apply execution receipt"
    )
    base, _ = load_exact_json(BASE_INVENTORY, EXPECTED_BASE_SHA256, "base inventory")
    if (
        receipt.get("result") != "pass"
        or receipt.get("canonical_targets_mutated") is not True
        or len(receipt.get("postimages", [])) != 20
    ):
        raise RollbackFailure("apply execution receipt is not the exact successful apply")

    postimages = {item["target_path"]: item for item in receipt["postimages"]}
    base_targets = {item["canonical_path"]: item for item in base["targets"]}
    if set(postimages) != set(base_targets) or len(postimages) != 20:
        raise RollbackFailure("apply receipt and base inventory target sets differ")

    prepared: list[dict[str, Any]] = []
    for index, target_text in enumerate(sorted(postimages)):
        post = postimages[target_text]
        base_entry = base_targets[target_text]
        target = apply_driver.bounded_path(ROOT, target_text, "canonical target")
        live = apply_driver.regular_bytes(target, ROOT, "installed postimage")
        if apply_driver.sha(live) != post["sha256"] or len(live) != post["size_bytes"]:
            raise RollbackFailure(f"installed postimage drift before rollback: {target_text}")
        output = apply_driver.regular_bytes(
            apply_driver.bounded_path(
                MATERIAL_ROOT, f"outputs/{target_text}", "frozen postimage"
            ),
            MATERIAL_ROOT,
            "frozen postimage",
        )
        if output != live:
            raise RollbackFailure(f"live/frozen postimage mismatch: {target_text}")

        baseline = base_entry["baseline"]
        if baseline["state"] == "present":
            operation = "update"
            preimage = apply_driver.regular_bytes(
                apply_driver.bounded_path(
                    MATERIAL_ROOT, f"baselines/{target_text}", "frozen baseline"
                ),
                MATERIAL_ROOT,
                "frozen baseline",
            )
            if (
                apply_driver.sha(preimage) != baseline["sha256"]
                or len(preimage) != baseline["size_bytes"]
            ):
                raise RollbackFailure(f"frozen baseline drift: {target_text}")
            mode = target.stat().st_mode & 0o777
        else:
            operation = "create"
            preimage = None
            mode = 0o644
            baseline_slot = apply_driver.bounded_path(
                MATERIAL_ROOT, f"baselines/{target_text}", "absent baseline slot"
            )
            if baseline_slot.exists() or baseline_slot.is_symlink():
                raise RollbackFailure(f"absent baseline slot is occupied: {target_text}")

        rollback_tmp = target.with_name(target.name + f"{TEMP_TOKEN}-{index:02d}.tmp")
        reapply_tmp = target.with_name(target.name + f"{TEMP_TOKEN}-{index:02d}.reapply")
        for temporary in (rollback_tmp, reapply_tmp):
            if temporary.exists() or temporary.is_symlink():
                raise RollbackFailure(
                    f"rollback temporary collision: {temporary.relative_to(ROOT)}"
                )
        prepared.append(
            {
                "target_text": target_text,
                "target": target,
                "operation": operation,
                "preimage": preimage,
                "postimage": output,
                "mode": mode,
                "rollback_tmp": rollback_tmp,
                "reapply_tmp": reapply_tmp,
            }
        )
    return prepared


def clean_temporaries(items: list[dict[str, Any]]) -> None:
    for item in items:
        for key in ("rollback_tmp", "reapply_tmp"):
            path = item[key]
            if path.exists() and not path.is_symlink():
                path.unlink()
                apply_driver.fsync_directory(path.parent)


def restore_applied_state(reverted: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    for item in reversed(reverted):
        try:
            apply_driver.stage_file(
                item["target"], item["postimage"], item["reapply_tmp"], item["mode"]
            )
            os.replace(item["reapply_tmp"], item["target"])
            apply_driver.fsync_directory(item["target"].parent)
            if apply_driver.regular_bytes(
                item["target"], ROOT, "restored applied postimage"
            ) != item["postimage"]:
                raise RollbackFailure("restored applied postimage verification failed")
        except BaseException as error:
            errors.append(f"{item['target_text']}: {error}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    output = Path(args.output)
    if not output.is_absolute():
        output = ROOT / output
    output = output.resolve(strict=False)

    try:
        prepared = prepare()
    except BaseException as error:
        apply_driver.write_receipt(
            output,
            {
                "schema_version": "evf.l1-plan-postapply-rollback/v1",
                "result": "block",
                "phase": "rollback-preflight",
                "first_failure": str(error),
                "canonical_state": "applied-postimages-preserved",
                "authority_effect": "none",
            },
        )
        return 1

    staged_updates: list[dict[str, Any]] = []
    try:
        for item in prepared:
            if item["operation"] == "update":
                apply_driver.stage_file(
                    item["target"],
                    item["preimage"],
                    item["rollback_tmp"],
                    item["mode"],
                )
                staged_updates.append(item)
        for item in prepared:
            live = apply_driver.regular_bytes(
                item["target"], ROOT, "pre-rollback installed postimage"
            )
            if live != item["postimage"]:
                raise RollbackFailure(
                    f"postimage drift immediately before rollback: {item['target_text']}"
                )
        if len(staged_updates) != 11:
            raise RollbackFailure("rollback update staging count is not 11")
    except BaseException as error:
        clean_temporaries(prepared)
        apply_driver.write_receipt(
            output,
            {
                "schema_version": "evf.l1-plan-postapply-rollback/v1",
                "result": "fail",
                "phase": "stage-and-recheck",
                "first_failure": str(error),
                "canonical_state": "applied-postimages-preserved",
                "canonical_targets_mutated_by_rollback": False,
                "authority_effect": "none",
            },
        )
        return 1

    reverted: list[dict[str, Any]] = []
    try:
        for item in reversed(prepared):
            if item["operation"] == "update":
                os.replace(item["rollback_tmp"], item["target"])
            else:
                item["target"].unlink()
            apply_driver.fsync_directory(item["target"].parent)
            reverted.append(item)

        present = 0
        absent = 0
        for item in prepared:
            if item["operation"] == "update":
                present += 1
                if apply_driver.regular_bytes(
                    item["target"], ROOT, "restored baseline"
                ) != item["preimage"]:
                    raise RollbackFailure(
                        f"restored baseline mismatch: {item['target_text']}"
                    )
            else:
                absent += 1
                if item["target"].exists() or item["target"].is_symlink():
                    raise RollbackFailure(
                        f"created target remains after rollback: {item['target_text']}"
                    )
        if present != 11 or absent != 9:
            raise RollbackFailure("restored baseline partition is not 11 present/9 absent")
        clean_temporaries(prepared)
        apply_driver.write_receipt(
            output,
            {
                "schema_version": "evf.l1-plan-postapply-rollback/v1",
                "result": "pass",
                "reason": "post-apply lifecycle-state validation failed",
                "bound_apply_receipt_sha256": EXPECTED_APPLY_RECEIPT_SHA256,
                "restored": {
                    "targets": 20,
                    "present_exact": 11,
                    "absent_exact": 9,
                    "updates_restored": 11,
                    "creates_removed": 9
                },
                "canonical_state": "exact-pre-apply-state-restored",
                "temporary_residue": 0,
                "readiness_activated": False,
                "task_session_started": False,
                "authority_effect": "none"
            },
        )
        return 0
    except BaseException as error:
        restoration_errors = restore_applied_state(reverted)
        clean_temporaries(prepared)
        apply_driver.write_receipt(
            output,
            {
                "schema_version": "evf.l1-plan-postapply-rollback/v1",
                "result": "fail",
                "phase": "rollback-install",
                "first_failure": str(error),
                "reverted_before_failure": len(reverted),
                "restored_applied_state": not restoration_errors,
                "restoration_errors": restoration_errors,
                "canonical_state": (
                    "applied-postimages-restored"
                    if not restoration_errors
                    else "indeterminate"
                ),
                "authority_effect": (
                    "none" if not restoration_errors else "indeterminate-local-bytes"
                )
            },
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
