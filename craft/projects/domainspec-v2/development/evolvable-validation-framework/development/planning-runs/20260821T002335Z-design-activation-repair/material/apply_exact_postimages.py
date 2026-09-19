#!/usr/bin/env python3
"""Preflight or atomically install the accepted 20-file EVF Plan package."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Any


MATERIAL = Path(__file__).resolve().parent
RUN = MATERIAL.parent
PACKAGE_PATH = MATERIAL / "MATERIAL-PACKAGE.json"
RECEIPT_PATH = MATERIAL / "MATERIAL-PACKAGE-RECEIPT.json"
HANDOFF_REQUEST_PATH = MATERIAL / "REFRESH-MATERIAL-HANDOFF-REQUEST.json"
HANDOFF_RECEIPT_PATH = MATERIAL / "REFRESH-MATERIAL-HANDOFF-RECEIPT.json"
ACCEPTANCE_PATH = RUN / "OWNER-ACCEPTANCE.json"
AUTHORIZATION_PATH = MATERIAL / "APPLY-AUTHORIZATION.json"

EXPECTED_PACKAGE_ID = "evf-l1-plan-b61f9935-apply-20260821"
EXPECTED_ACCEPTED_DIGEST = (
    "b61f99354ed4d06b2ef9769d6d067edff34f68b83b0bf59d2c3c92e1945283d4"
)
EXPECTED_MATERIAL_DIGEST = (
    "a6abce2bc99341ba8486e2c9de3535a8ed822dff96ebeef8ff41f2aa0f6f7cb5"
)
EXPECTED_FILE_HASHES = {
    PACKAGE_PATH: "04906e19eb10e463539c51548ae5e98392d8012ed7660b6ef52aa60c7fe16182",
    RECEIPT_PATH: "cf33b2d3b418cf2fb6e9ff4b100ea2aad5a75b148ce4bbe755783e6120170621",
    HANDOFF_REQUEST_PATH: "a2eb3880dc02839da957c1b0e43871822b2c7e7a05584e74f44a558eb7c69472",
    HANDOFF_RECEIPT_PATH: "fae8f370b2e41625b6a67e1b486f476c04ff077ac8d0969a5a0bfc24dfc9c3bb",
    ACCEPTANCE_PATH: "08f4b37b731cacd1a996856242db8a952c547eec3848ce3de74c7e45bdf0221d",
    AUTHORIZATION_PATH: "d55bcdf92ab45cb8c19d79e1b42c74a2a5ea27d43fb95ced1676222d912c9b73",
}
EXPECTED_TARGET_COUNT = 20
EXPECTED_PRESENT_COUNT = 11
EXPECTED_ABSENT_COUNT = 9
TEMP_TOKEN = ".evf-l1-plan-b61f9935"


class ApplyFailure(RuntimeError):
    """A fail-closed apply or preflight error."""


def discover_root() -> Path:
    for candidate in (RUN, *RUN.parents):
        if (candidate / ".agents/skills/invoke").is_dir() and (
            candidate / "projects/domainspec-v2"
        ).is_dir():
            return candidate.resolve()
    raise ApplyFailure("repository root not found")


ROOT = discover_root()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(document: Any) -> str:
    return sha(
        json.dumps(
            document, sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode("utf-8")
    )


def normalized_relative(raw: str, label: str) -> PurePosixPath:
    normalized = raw.replace("\\", "/")
    path = PurePosixPath(normalized)
    if (
        not raw
        or path.is_absolute()
        or PureWindowsPath(raw).is_absolute()
        or ".." in path.parts
        or str(path) in ("", ".")
    ):
        raise ApplyFailure(f"{label} path escape: {raw}")
    if normalized != raw or str(path) != raw:
        raise ApplyFailure(f"{label} path is not canonical POSIX form: {raw}")
    return path


def bounded_path(base: Path, raw: str, label: str) -> Path:
    relative = normalized_relative(raw, label)
    base = base.resolve()
    candidate = base.joinpath(*relative.parts)
    current = base
    for part in relative.parts:
        current = current / part
        if current.is_symlink():
            raise ApplyFailure(f"{label} traverses a symbolic link: {raw}")
    try:
        candidate.resolve(strict=False).relative_to(base)
    except ValueError as error:
        raise ApplyFailure(f"{label} escapes root: {raw}") from error
    return candidate


def regular_bytes(path: Path, boundary: Path, label: str) -> bytes:
    if path.is_symlink() or not path.is_file():
        raise ApplyFailure(f"{label} is not a regular file: {path}")
    try:
        path.resolve().relative_to(boundary.resolve())
    except ValueError as error:
        raise ApplyFailure(f"{label} escapes boundary: {path}") from error
    return path.read_bytes()


def exact_bound_json(path: Path, expected_sha: str, label: str) -> tuple[dict[str, Any], bytes]:
    data = regular_bytes(path, ROOT, label)
    if sha(data) != expected_sha:
        raise ApplyFailure(f"{label} digest drift")
    try:
        value = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ApplyFailure(f"{label} is not valid UTF-8 JSON: {error}") from error
    if not isinstance(value, dict):
        raise ApplyFailure(f"{label} is not a JSON object")
    return value, data


def require_ref(root: Path, reference: dict[str, Any], label: str) -> bytes:
    path = bounded_path(root, reference["path"], label)
    data = regular_bytes(path, root, label)
    if sha(data) != reference["sha256"] or len(data) != reference["size_bytes"]:
        raise ApplyFailure(f"{label} exact-byte mismatch: {reference['path']}")
    return data


def fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def write_receipt(path: Path, value: dict[str, Any]) -> None:
    if path.parent != MATERIAL or path.name in {
        PACKAGE_PATH.name,
        RECEIPT_PATH.name,
        HANDOFF_REQUEST_PATH.name,
        HANDOFF_RECEIPT_PATH.name,
        ACCEPTANCE_PATH.name,
        AUTHORIZATION_PATH.name,
    }:
        raise ApplyFailure("execution receipt must be a distinct direct child of material/")
    if path.exists() and path.is_symlink():
        raise ApplyFailure("execution receipt path is a symbolic link")
    data = (json.dumps(value, indent=2, sort_keys=True) + "\n").encode("utf-8")
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    try:
        with os.fdopen(descriptor, "wb", closefd=True) as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
    finally:
        fsync_directory(MATERIAL)


def stage_file(target: Path, data: bytes, temporary: Path, mode: int) -> None:
    if temporary.exists() or temporary.is_symlink():
        raise ApplyFailure(f"temporary apply collision: {temporary.relative_to(ROOT)}")
    descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode)
    try:
        with os.fdopen(descriptor, "wb", closefd=True) as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary, mode)
    except BaseException:
        if temporary.exists() and not temporary.is_symlink():
            temporary.unlink()
        raise
    if regular_bytes(temporary, ROOT, "temporary postimage") != data:
        temporary.unlink()
        raise ApplyFailure(f"temporary postimage verification failed: {target}")


def verify_control_bindings() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    bound: dict[Path, tuple[dict[str, Any], bytes]] = {}
    for path, expected_sha in EXPECTED_FILE_HASHES.items():
        bound[path] = exact_bound_json(path, expected_sha, path.name)
    package = bound[PACKAGE_PATH][0]
    receipt = bound[RECEIPT_PATH][0]
    handoff_request = bound[HANDOFF_REQUEST_PATH][0]
    handoff = bound[HANDOFF_RECEIPT_PATH][0]
    acceptance = bound[ACCEPTANCE_PATH][0]
    authorization = bound[AUTHORIZATION_PATH][0]

    if package.get("package_id") != EXPECTED_PACKAGE_ID:
        raise ApplyFailure("material package id mismatch")
    if canonical_digest(package) != EXPECTED_MATERIAL_DIGEST:
        raise ApplyFailure("material package canonical digest mismatch")
    if (
        package.get("mutation_mode") != "apply-approved"
        or package.get("mutation_state") != "materialized"
    ):
        raise ApplyFailure("material package is not mutation-capable")
    if (
        receipt.get("packageId") != EXPECTED_PACKAGE_ID
        or receipt.get("packageDigest") != EXPECTED_MATERIAL_DIGEST
        or receipt.get("patchVerdict") != "pass"
        or receipt.get("mutationHandoff") != "ready"
        or receipt.get("reasons") != []
    ):
        raise ApplyFailure("material producer receipt is not exact and ready")
    if handoff_request.get("expectedMaterialReceiptSha256") != EXPECTED_FILE_HASHES[
        RECEIPT_PATH
    ]:
        raise ApplyFailure("handoff request receipt binding mismatch")
    if (
        handoff.get("phaseStatus") != "pass"
        or handoff.get("handoffStatus") != "ready"
        or handoff.get("mutationReady") is not True
        or handoff.get("blockers") != []
        or handoff.get("materialReceiptBinding", {}).get("actualSha256")
        != EXPECTED_FILE_HASHES[RECEIPT_PATH]
    ):
        raise ApplyFailure("file-bound Refresh handoff is not exact and ready")
    if acceptance.get("accepted_package", {}).get(
        "resolved_package_digest"
    ) != EXPECTED_ACCEPTED_DIGEST:
        raise ApplyFailure("owner acceptance package binding mismatch")
    if authorization.get("authorization_state") != "conditional-apply-approved" or authorization.get(
        "accepted_package", {}
    ).get("package_digest") != EXPECTED_ACCEPTED_DIGEST:
        raise ApplyFailure("direct apply authorization binding mismatch")
    return package, receipt, authorization


def prepare() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    package, receipt, authorization = verify_control_bindings()
    material_root = MATERIAL / "root"
    if material_root.is_symlink() or not material_root.is_dir():
        raise ApplyFailure("material root is not a regular directory")
    links = [path for path in material_root.rglob("*") if path.is_symlink()]
    if links:
        raise ApplyFailure(f"material root contains symbolic link: {links[0]}")

    base_ref = next(
        (
            item
            for item in package["source_artifacts"]
            if item["path"].endswith(
                "20260820T173249Z-post-l0-l1-plan/POSTIMAGE-INVENTORY.json"
            )
        ),
        None,
    )
    if base_ref is None:
        raise ApplyFailure("frozen base inventory source is missing")
    base_data = require_ref(material_root, base_ref, "frozen base inventory")
    base = json.loads(base_data.decode("utf-8"))
    base_targets = {item["canonical_path"]: item for item in base["targets"]}
    changes = {item["target_path"]: item for item in package["changes"]}
    inventory_targets = {item["target_path"] for item in package["target_inventory"]}
    approved_targets = set(package["approval"]["scope_paths"])
    authorized_targets = set(authorization["scope_paths"])
    validated_targets = set(receipt["validatedPaths"])
    target_sets = (
        set(base_targets),
        set(changes),
        inventory_targets,
        approved_targets,
        authorized_targets,
        validated_targets,
    )
    if any(len(targets) != EXPECTED_TARGET_COUNT for targets in target_sets):
        raise ApplyFailure("one or more apply scopes is not exactly 20 targets")
    if any(targets != target_sets[0] for targets in target_sets[1:]):
        raise ApplyFailure("apply scope surfaces are not exactly equal")

    prepared: list[dict[str, Any]] = []
    accepted_rows: list[dict[str, Any]] = []
    present_count = 0
    absent_count = 0
    for index, target_text in enumerate(sorted(base_targets)):
        base_entry = base_targets[target_text]
        change = changes[target_text]
        target = bounded_path(ROOT, target_text, "canonical target")
        if not target.parent.is_dir() or target.parent.is_symlink():
            raise ApplyFailure(f"canonical target parent is unsafe: {target_text}")
        output_data = require_ref(material_root, change["output_ref"], "staged output")
        baseline = base_entry["baseline"]
        operation = change["operation"]
        if baseline["state"] == "present":
            present_count += 1
            if operation != "update":
                raise ApplyFailure(f"present target does not use update: {target_text}")
            preimage = regular_bytes(target, ROOT, "live update baseline")
            if sha(preimage) != baseline["sha256"] or len(preimage) != baseline[
                "size_bytes"
            ]:
                raise ApplyFailure(f"live update baseline drift: {target_text}")
            frozen_path = bounded_path(
                material_root, f"baselines/{target_text}", "frozen update baseline"
            )
            if regular_bytes(frozen_path, material_root, "frozen update baseline") != preimage:
                raise ApplyFailure(f"live/frozen update baseline mismatch: {target_text}")
            mode = stat.S_IMODE(target.stat().st_mode)
        else:
            absent_count += 1
            if operation != "create":
                raise ApplyFailure(f"absent target does not use create: {target_text}")
            if target.exists() or target.is_symlink():
                raise ApplyFailure(f"live create baseline is no longer absent: {target_text}")
            frozen_path = bounded_path(
                material_root, f"baselines/{target_text}", "absent baseline slot"
            )
            if frozen_path.exists() or frozen_path.is_symlink():
                raise ApplyFailure(f"absent target has a frozen baseline file: {target_text}")
            preimage = None
            mode = 0o644

        temporary = target.with_name(
            target.name + f"{TEMP_TOKEN}-{index:02d}.apply-tmp"
        )
        rollback_temporary = target.with_name(target.name + f"{TEMP_TOKEN}.rollback-tmp")
        for candidate in (temporary, rollback_temporary):
            if candidate.exists() or candidate.is_symlink():
                raise ApplyFailure(
                    f"temporary path collision: {candidate.relative_to(ROOT)}"
                )
        accepted_rows.append(
            {
                "canonical_path": target_text,
                "postimage_sha256": sha(output_data),
                "postimage_size_bytes": len(output_data),
            }
        )
        prepared.append(
            {
                "index": index,
                "target_text": target_text,
                "target": target,
                "operation": operation,
                "preimage": preimage,
                "postimage": output_data,
                "mode": mode,
                "temporary": temporary,
                "rollback_temporary": rollback_temporary,
            }
        )

    if present_count != EXPECTED_PRESENT_COUNT or absent_count != EXPECTED_ABSENT_COUNT:
        raise ApplyFailure("present/absent baseline partition drift")
    if canonical_digest(accepted_rows) != EXPECTED_ACCEPTED_DIGEST:
        raise ApplyFailure("accepted 20-postimage digest recomputation failed")
    return prepared, {
        "target_count": EXPECTED_TARGET_COUNT,
        "present_exact": present_count,
        "absent_exact": absent_count,
        "temporary_collisions": 0,
    }


def recheck_after_staging(prepared: list[dict[str, Any]]) -> dict[str, int]:
    """Close the staging race before the first canonical replacement."""
    present_count = 0
    absent_count = 0
    for item in prepared:
        target = bounded_path(ROOT, item["target_text"], "post-stage live target")
        if target != item["target"]:
            raise ApplyFailure(f"post-stage target resolution drift: {item['target_text']}")
        if item["operation"] == "update":
            present_count += 1
            live = regular_bytes(target, ROOT, "post-stage live update baseline")
            if live != item["preimage"]:
                raise ApplyFailure(f"post-stage live update baseline drift: {item['target_text']}")
        else:
            absent_count += 1
            if target.exists() or target.is_symlink():
                raise ApplyFailure(
                    f"post-stage live create baseline is no longer absent: {item['target_text']}"
                )
        temporary = item["temporary"]
        if regular_bytes(temporary, ROOT, "post-stage temporary postimage") != item[
            "postimage"
        ]:
            raise ApplyFailure(f"post-stage temporary drift: {item['target_text']}")
    if present_count != EXPECTED_PRESENT_COUNT or absent_count != EXPECTED_ABSENT_COUNT:
        raise ApplyFailure("post-stage baseline partition drift")
    return {"present_exact": present_count, "absent_exact": absent_count, "drift": 0}


def clean_temporaries(items: list[dict[str, Any]]) -> int:
    removed = 0
    for item in items:
        for key in ("temporary", "rollback_temporary"):
            path = item[key]
            if path.exists() and not path.is_symlink():
                path.unlink()
                fsync_directory(path.parent)
                removed += 1
    return removed


def rollback(applied: list[dict[str, Any]], prepared: list[dict[str, Any]]) -> tuple[bool, list[str]]:
    errors: list[str] = []
    for item in reversed(applied):
        try:
            if item["operation"] == "update":
                stage_file(
                    item["target"],
                    item["preimage"],
                    item["rollback_temporary"],
                    item["mode"],
                )
                os.replace(item["rollback_temporary"], item["target"])
                fsync_directory(item["target"].parent)
                if regular_bytes(item["target"], ROOT, "rolled-back update") != item[
                    "preimage"
                ]:
                    raise ApplyFailure("rolled-back update verification failed")
            else:
                if item["target"].is_symlink() or not item["target"].is_file():
                    raise ApplyFailure("created target is unsafe during rollback")
                if regular_bytes(item["target"], ROOT, "created rollback target") != item[
                    "postimage"
                ]:
                    raise ApplyFailure("created target drifted before rollback")
                item["target"].unlink()
                fsync_directory(item["target"].parent)
                if item["target"].exists() or item["target"].is_symlink():
                    raise ApplyFailure("created target removal verification failed")
        except BaseException as error:
            errors.append(f"{item['target_text']}: {error}")
    clean_temporaries(prepared)
    return not errors, errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--preflight-only", action="store_true")
    args = parser.parse_args()
    output = Path(args.output)
    if not output.is_absolute():
        output = ROOT / output
    output = output.resolve(strict=False)

    try:
        prepared, baseline_result = prepare()
    except BaseException as error:
        try:
            write_receipt(
                output,
                {
                    "schema_version": "evf.l1-plan-exact-apply-preflight/v1",
                    "result": "block",
                    "phase": "preflight",
                    "first_failure": str(error),
                    "canonical_targets_mutated": False,
                    "authority_effect": "none",
                },
            )
        except BaseException:
            pass
        return 1

    bindings = {
        "accepted_package_digest": EXPECTED_ACCEPTED_DIGEST,
        "material_package_id": EXPECTED_PACKAGE_ID,
        "material_package_digest": EXPECTED_MATERIAL_DIGEST,
        "material_package_file_sha256": EXPECTED_FILE_HASHES[PACKAGE_PATH],
        "material_receipt_sha256": EXPECTED_FILE_HASHES[RECEIPT_PATH],
        "handoff_request_sha256": EXPECTED_FILE_HASHES[HANDOFF_REQUEST_PATH],
        "handoff_receipt_sha256": EXPECTED_FILE_HASHES[HANDOFF_RECEIPT_PATH],
        "owner_acceptance_sha256": EXPECTED_FILE_HASHES[ACCEPTANCE_PATH],
        "apply_authorization_sha256": EXPECTED_FILE_HASHES[AUTHORIZATION_PATH],
        "driver_sha256": sha(regular_bytes(Path(__file__).resolve(), ROOT, "apply driver")),
        "driver_size_bytes": Path(__file__).stat().st_size,
    }
    if args.preflight_only:
        write_receipt(
            output,
            {
                "schema_version": "evf.l1-plan-exact-apply-preflight/v1",
                "result": "pass",
                "mode": "preflight-only",
                "bindings": bindings,
                "preapply": baseline_result,
                "staged_outputs": "20/20 exact",
                "transaction_contract": {
                    "stage_all_before_first_replace": True,
                    "recheck_all_live_baselines_after_staging_before_first_replace": True,
                    "update_and_create_supported": True,
                    "fsync_and_verify_each_install": True,
                    "rollback_updates_and_creates_on_install_failure": True,
                },
                "temporary_files_created": 0,
                "canonical_targets_mutated": False,
                "next_gate": "parent-review-before-exact-apply",
                "authority_effect": "none",
            },
        )
        return 0

    staged: list[dict[str, Any]] = []
    try:
        for item in prepared:
            stage_file(
                item["target"], item["postimage"], item["temporary"], item["mode"]
            )
            staged.append(item)
    except BaseException as error:
        removed = clean_temporaries(prepared)
        write_receipt(
            output,
            {
                "schema_version": "evf.l1-plan-exact-apply-execution/v1",
                "result": "fail",
                "phase": "stage-all-temporary-postimages",
                "first_failure": str(error),
                "staged_before_failure": len(staged),
                "temporary_files_removed": removed,
                "canonical_targets_mutated": False,
                "authority_effect": "none",
            },
        )
        return 1

    try:
        post_stage_recheck = recheck_after_staging(prepared)
    except BaseException as error:
        removed = clean_temporaries(prepared)
        write_receipt(
            output,
            {
                "schema_version": "evf.l1-plan-exact-apply-execution/v1",
                "result": "fail",
                "phase": "post-stage-live-baseline-recheck",
                "first_failure": str(error),
                "staged_before_recheck": len(staged),
                "temporary_files_removed": removed,
                "canonical_targets_mutated": False,
                "authority_effect": "none",
            },
        )
        return 1

    applied: list[dict[str, Any]] = []
    try:
        if len(staged) != EXPECTED_TARGET_COUNT:
            raise ApplyFailure("all 20 temporary postimages were not staged")
        for item in prepared:
            os.replace(item["temporary"], item["target"])
            applied.append(item)
            fsync_directory(item["target"].parent)
            installed = regular_bytes(item["target"], ROOT, "installed postimage")
            if installed != item["postimage"]:
                raise ApplyFailure(f"installed postimage mismatch: {item['target_text']}")

        postimages = []
        for item in prepared:
            live = regular_bytes(item["target"], ROOT, "final installed postimage")
            if live != item["postimage"]:
                raise ApplyFailure(f"final postimage drift: {item['target_text']}")
            postimages.append(
                {
                    "target_path": item["target_text"],
                    "operation": item["operation"],
                    "sha256": sha(live),
                    "size_bytes": len(live),
                }
            )
        write_receipt(
            output,
            {
                "schema_version": "evf.l1-plan-exact-apply-execution/v1",
                "result": "pass",
                "mode": "exact-apply",
                "bindings": bindings,
                "preapply": baseline_result,
                "transaction": {
                    "staged_before_first_replace": "20/20",
                    "post_stage_pre_replace_baselines": post_stage_recheck,
                    "installed_and_verified": "20/20",
                    "updates": EXPECTED_PRESENT_COUNT,
                    "creates": EXPECTED_ABSENT_COUNT,
                    "rollback_on_install_failure": "enabled",
                    "rollback_used": False,
                },
                "postimages": postimages,
                "canonical_targets_mutated": True,
                "next_gate": "post-apply-exact-byte-validation",
                "readiness_activated": False,
                "task_session_started": False,
                "git_mutation": False,
                "publication": False,
                "authority_effect": "local-exact-plan-byte-install-only",
            },
        )
    except BaseException as error:
        rollback_ok, rollback_errors = rollback(applied, prepared)
        write_receipt(
            output,
            {
                "schema_version": "evf.l1-plan-exact-apply-execution/v1",
                "result": "fail",
                "phase": "install-postimages",
                "first_failure": str(error),
                "applied_before_failure": len(applied),
                "rollback_result": "pass" if rollback_ok else "fail",
                "rollback_errors": rollback_errors,
                "canonical_targets_mutated": not rollback_ok,
                "authority_effect": "none" if rollback_ok else "indeterminate-local-bytes",
            },
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
