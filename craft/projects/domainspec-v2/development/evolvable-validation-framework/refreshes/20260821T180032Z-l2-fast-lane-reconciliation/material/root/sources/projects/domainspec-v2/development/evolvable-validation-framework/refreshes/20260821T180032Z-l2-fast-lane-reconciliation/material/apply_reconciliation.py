#!/usr/bin/env python3
"""Fail-closed exact-postimage driver for the six-file EVF reconciliation."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


BASELINES = {
    "projects/domainspec-v2/.craft/ledger.yml":
        ("eb45345811cb4c0c5eee530340266d57fa7907fb29915a43521236aa5b0e298f", 197262),
    "projects/domainspec-v2/CRAFT.md":
        ("7a7075b6e71bcc8e40190f3b8347272f0a5fd70b81dc211fcea90a7899585887", 22307),
    "projects/domainspec-v2/development/evolvable-validation-framework/EXECUTION-PACK.md":
        ("9345adbd143c2bfde6534e7ad7179e769ad15e2a14fce1f63200eaab9a66580a", 1449),
    "projects/domainspec-v2/development/evolvable-validation-framework/IMPLEMENTATION-LAYERING.md":
        ("edc2d4458ef4b296764277823ad0c78f52d9a148c6040d20fc2758a76b269a6b", 3269),
    "projects/domainspec-v2/development/evolvable-validation-framework/PLAN.md":
        ("e9bd903b9f4dbec61f013bbe3a412af282cd54b49a9383cd5496cf80c7ad65fa", 4367),
    "projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md":
        ("d6608b675fb02f29db078415997da273e8472f270479846602669a976ead29a5", 8271),
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(document: Any) -> str:
    payload = json.dumps(
        document, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return sha256(payload)


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def current_exact_state(path: Path) -> tuple[str, int] | None:
    if not path.is_file():
        return None
    content = path.read_bytes()
    return sha256(content), len(content)


def baseline_error(repo: Path, path: str) -> str | None:
    actual = current_exact_state(repo / path)
    if actual is None:
        return f"LIVE_BASELINE_MISSING:{path}"
    if actual != BASELINES[path]:
        return f"LIVE_BASELINE_DRIFT:{path}"
    return None


def baseline_errors(repo: Path, paths: list[str] | None = None) -> list[str]:
    return [
        error
        for path in (paths or sorted(BASELINES))
        if (error := baseline_error(repo, path)) is not None
    ]


def fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def atomic_write_json(
    path: Path,
    document: dict[str, Any],
    *,
    phase: str,
    test_hooks: list[dict[str, Any]],
) -> None:
    if any(
        hook.get("kind") == "fail-receipt-write" and hook.get("phase") == phase
        for hook in test_hooks
    ):
        raise OSError(f"injected receipt write failure at {phase}")
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, raw_temp = tempfile.mkstemp(
        dir=path.parent, prefix=f".{path.name}.", suffix=".tmp"
    )
    temp = Path(raw_temp)
    try:
        payload = (json.dumps(document, indent=2, sort_keys=True) + "\n").encode("utf-8")
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp, path)
        fsync_directory(path.parent)
    finally:
        temp.unlink(missing_ok=True)


def load_test_hooks(repo: Path) -> list[dict[str, Any]]:
    raw = os.environ.get("EVF_L2_APPLY_TEST_HOOKS")
    if raw is None:
        return []
    if not repo.as_posix().startswith("/tmp/evf-l2-apply-test-"):
        raise ValueError("test hooks are restricted to isolated /tmp EVF fixtures")
    hooks = json.loads(raw)
    if not isinstance(hooks, list) or not all(isinstance(item, dict) for item in hooks):
        raise ValueError("test hooks must be a JSON array of objects")
    return hooks


def run_hook(
    hooks: list[dict[str, Any]],
    *,
    event: str,
    index: int,
    path: str,
    repo: Path,
) -> None:
    for hook in hooks:
        if hook.get("event") != event or hook.get("index") != index:
            continue
        kind = hook.get("kind")
        hook_path = hook.get("path", path)
        if hook_path not in BASELINES:
            raise ValueError(f"test hook path outside exact target set: {hook_path}")
        if kind == "mutate-target":
            (repo / hook_path).write_bytes(
                str(hook.get("content", "concurrent-edit")).encode("utf-8")
            )
        elif kind == "raise":
            raise RuntimeError(str(hook.get("message", "injected failure")))
        elif kind == "mutate-target-and-raise":
            (repo / hook_path).write_bytes(
                str(hook.get("content", "concurrent-edit")).encode("utf-8")
            )
            raise RuntimeError(str(hook.get("message", "injected failure")))
        else:
            raise ValueError(f"unsupported test hook kind: {kind}")


def fresh_material_validation(
    *,
    package_path: Path,
    material: Path,
    validator: Path,
    schema_dir: Path,
    output: Path,
    expected_receipt: dict[str, Any],
) -> list[str]:
    completed = subprocess.run(
        [
            sys.executable,
            str(validator),
            str(package_path),
            "--root",
            str(material),
            "--schema-dir",
            str(schema_dir),
            "--output",
            str(output),
        ],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if completed.returncode != 0:
        return [f"APPLY_TIME_MATERIAL_VALIDATION_FAILED:exit-{completed.returncode}"]
    try:
        fresh = load(output)
    except (OSError, json.JSONDecodeError) as exc:
        return [f"APPLY_TIME_MATERIAL_RECEIPT_INVALID:{type(exc).__name__}"]
    if fresh != expected_receipt:
        return ["APPLY_TIME_MATERIAL_RECEIPT_MISMATCH"]
    return []


def result_document(
    *,
    mode: str,
    status: str,
    package_id: Any,
    package_digest: str,
    applied: list[str],
    mutated: bool,
    rolled_back: bool,
    errors: list[str],
    recovery_backups: dict[str, Path],
    attempt_state: str,
    fresh_receipt: Path,
) -> dict[str, Any]:
    return {
        "schema_version": "evf-l2-reconciliation-apply/v2",
        "mode": mode,
        "status": status,
        "attempt_state": attempt_state,
        "package_id": package_id,
        "package_digest": package_digest,
        "target_count": len(BASELINES),
        "apply_time_material_receipt": str(fresh_receipt),
        "baselines_rechecked_per_target": mode == "apply",
        "canonical_targets_mutated": mutated,
        "applied_paths": applied,
        "rolled_back": rolled_back,
        "recovery_backups": {
            path: str(backup)
            for path, backup in sorted(recovery_backups.items())
            if backup.exists()
        },
        "blockers": errors,
        "authority_effect": "none",
        "release_admission": "not-granted",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--material-root", required=True)
    parser.add_argument("--package", required=True)
    parser.add_argument("--material-receipt", required=True)
    parser.add_argument("--handoff", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--material-validator",
        default=".agents/skills/invoke/scripts/material_package_validator.py",
    )
    parser.add_argument("--schema-dir", default=".agents/skills/invoke/schemas")
    parser.add_argument("--preflight-only", action="store_true")
    args = parser.parse_args()

    repo = Path(args.repo_root).resolve()
    material = Path(args.material_root).resolve()
    package_path = Path(args.package).resolve()
    receipt_path = Path(args.material_receipt).resolve()
    handoff_path = Path(args.handoff).resolve()
    output = Path(args.output).resolve()
    validator = Path(args.material_validator).resolve()
    schema_dir = Path(args.schema_dir).resolve()
    test_hooks = load_test_hooks(repo)

    package = load(package_path)
    receipt = load(receipt_path)
    handoff = load(handoff_path)
    errors: list[str] = []
    changes = {item["target_path"]: item for item in package.get("changes", [])}
    inventory = {item["target_path"] for item in package.get("target_inventory", [])}
    approval = set(package.get("approval", {}).get("scope_paths", []))
    exact_targets = set(BASELINES)
    ordered_targets = sorted(exact_targets)
    if set(changes) != exact_targets or inventory != exact_targets or approval != exact_targets:
        errors.append("TARGET_SET_MISMATCH")

    package_digest = canonical_digest(package)
    if receipt.get("packageDigest") != package_digest:
        errors.append("MATERIAL_RECEIPT_PACKAGE_DIGEST_MISMATCH")
    if (
        receipt.get("patchVerdict") != "pass"
        or receipt.get("mutationHandoff") != "ready"
        or receipt.get("reasons") != []
    ):
        errors.append("MATERIAL_RECEIPT_NOT_READY")
    receipt_sha = sha256(receipt_path.read_bytes())
    receipt_binding = handoff.get("materialReceiptBinding", {})
    if (
        handoff.get("phaseStatus") != "pass"
        or handoff.get("handoffStatus") != "ready"
        or handoff.get("mutationReady") is not True
        or handoff.get("blockers") != []
    ):
        errors.append("FILE_BOUND_HANDOFF_NOT_READY")
    if (
        receipt_binding.get("actualSha256") != receipt_sha
        or receipt_binding.get("expectedSha256") != receipt_sha
        or receipt_binding.get("receiptMatchesCurrentValidation") is not True
        or receipt_binding.get("currentPackageRevalidated") is not True
    ):
        errors.append("FILE_BOUND_MATERIAL_RECEIPT_SHA_MISMATCH")
    material_package = handoff.get("materialPackage", {})
    if (
        material_package.get("packageDigest") != package_digest
        or material_package.get("validatedPaths") != ordered_targets
    ):
        errors.append("FILE_BOUND_HANDOFF_PACKAGE_MISMATCH")

    postimages: dict[str, bytes] = {}
    for path, change in changes.items():
        ref = change["output_ref"]
        staged_output = material / ref["path"]
        if not staged_output.is_file():
            errors.append(f"POSTIMAGE_MISSING:{path}")
            continue
        content = staged_output.read_bytes()
        if (sha256(content), len(content)) != (ref["sha256"], ref["size_bytes"]):
            errors.append(f"POSTIMAGE_EXACT_REF_MISMATCH:{path}")
        postimages[path] = content

    errors.extend(baseline_errors(repo))
    fresh_receipt = output.parent / "APPLY-TIME-MATERIAL-RECEIPT.json"
    errors.extend(
        fresh_material_validation(
            package_path=package_path,
            material=material,
            validator=validator,
            schema_dir=schema_dir,
            output=fresh_receipt,
            expected_receipt=receipt,
        )
    )

    mode = "preflight-only" if args.preflight_only else "apply"
    if errors or args.preflight_only:
        result = result_document(
            mode=mode,
            status="block" if errors else "pass",
            package_id=package.get("package_id"),
            package_digest=package_digest,
            applied=[],
            mutated=False,
            rolled_back=False,
            errors=errors,
            recovery_backups={},
            attempt_state="blocked-before-mutation" if errors else "preflight-complete",
            fresh_receipt=fresh_receipt,
        )
        atomic_write_json(output, result, phase="preflight", test_hooks=test_hooks)
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0 if not errors else 1

    staged: dict[str, Path] = {}
    backups: dict[str, Path] = {}
    applied: list[str] = []
    mutated = False
    rolled_back = False
    final_receipt_committed = False
    first_failure: str | None = None
    preserved_backup_paths: set[str] = set()

    try:
        for path in ordered_targets:
            target = repo / path
            descriptor, raw_temp = tempfile.mkstemp(
                dir=target.parent, prefix=".evf-l2-reconcile-", suffix=".tmp"
            )
            temp = Path(raw_temp)
            with os.fdopen(descriptor, "wb") as handle:
                handle.write(postimages[path])
                handle.flush()
                os.fsync(handle.fileno())
            os.chmod(temp, target.stat().st_mode)
            staged[path] = temp

            backup_descriptor, raw_backup = tempfile.mkstemp(
                dir=target.parent, prefix=".evf-l2-baseline-", suffix=".bak"
            )
            backup = Path(raw_backup)
            with os.fdopen(backup_descriptor, "wb") as handle:
                handle.write(target.read_bytes())
                handle.flush()
                os.fsync(handle.fileno())
            os.chmod(backup, target.stat().st_mode)
            backups[path] = backup

        errors.extend(baseline_errors(repo))
        if errors:
            raise RuntimeError("baseline drift before prepared receipt")

        prepared = result_document(
            mode=mode,
            status="applying",
            package_id=package.get("package_id"),
            package_digest=package_digest,
            applied=[],
            mutated=False,
            rolled_back=False,
            errors=[],
            recovery_backups=backups,
            attempt_state="prepared-before-first-replace",
            fresh_receipt=fresh_receipt,
        )
        atomic_write_json(output, prepared, phase="prepared", test_hooks=test_hooks)

        for index, path in enumerate(ordered_targets):
            run_hook(
                test_hooks,
                event="before-target-check",
                index=index,
                path=path,
                repo=repo,
            )
            if (error := baseline_error(repo, path)) is not None:
                errors.append(error)
                raise RuntimeError("per-target baseline drift")
            ref = changes[path]["output_ref"]
            source = material / ref["path"]
            source_bytes = source.read_bytes()
            if (sha256(source_bytes), len(source_bytes)) != (
                ref["sha256"], ref["size_bytes"]
            ):
                errors.append(f"POSTIMAGE_DRIFT_BEFORE_REPLACE:{path}")
                raise RuntimeError("postimage drift before replacement")
            os.replace(staged[path], repo / path)
            applied.append(path)
            mutated = True
            run_hook(
                test_hooks,
                event="after-replace",
                index=index,
                path=path,
                repo=repo,
            )

        for path in ordered_targets:
            if (repo / path).read_bytes() != postimages[path]:
                errors.append(f"POSTAPPLY_PARITY_MISMATCH:{path}")
        if errors:
            raise RuntimeError("postapply parity failure")

        passed = result_document(
            mode=mode,
            status="pass",
            package_id=package.get("package_id"),
            package_digest=package_digest,
            applied=applied,
            mutated=True,
            rolled_back=False,
            errors=[],
            recovery_backups={},
            attempt_state="applied-and-receipted",
            fresh_receipt=fresh_receipt,
        )
        atomic_write_json(output, passed, phase="final-pass", test_hooks=test_hooks)
        final_receipt_committed = True
    except Exception as exc:
        first_failure = errors[0] if errors else f"APPLY_EXCEPTION:{type(exc).__name__}:{exc}"
        if not errors:
            errors.append(first_failure)
        rollback_errors: list[str] = []
        skipped_concurrent: list[str] = []
        for path in reversed(applied):
            backup = backups[path]
            live = repo / path
            if not live.is_file() or live.read_bytes() != postimages[path]:
                skipped_concurrent.append(f"ROLLBACK_SKIPPED_CONCURRENT_EDIT:{path}")
                continue
            if any(
                hook.get("kind") == "fail-rollback" and hook.get("path") == path
                for hook in test_hooks
            ):
                rollback_errors.append(f"ROLLBACK_FAILED:{path}:injected")
                continue
            try:
                os.replace(backup, live)
            except OSError as rollback_exc:
                rollback_errors.append(
                    f"ROLLBACK_FAILED:{path}:{type(rollback_exc).__name__}"
                )
        errors.extend(skipped_concurrent)
        errors.extend(rollback_errors)
        rolled_back = not skipped_concurrent and not rollback_errors and all(
            current_exact_state(repo / path) == BASELINES[path] for path in ordered_targets
        )
        mutated = any(
            current_exact_state(repo / path) != BASELINES[path] for path in ordered_targets
        )
        if rolled_back:
            applied = []

        preserved_backup_paths = {
            path
            for path in ordered_targets
            if current_exact_state(repo / path) != BASELINES[path]
        }
        preserved_backups = {
            path: backup
            for path, backup in backups.items()
            if path in preserved_backup_paths
        }

        blocked = result_document(
            mode=mode,
            status="block",
            package_id=package.get("package_id"),
            package_digest=package_digest,
            applied=applied,
            mutated=mutated,
            rolled_back=rolled_back,
            errors=errors,
            recovery_backups=preserved_backups,
            attempt_state="failed-with-recovery-evidence",
            fresh_receipt=fresh_receipt,
        )
        try:
            atomic_write_json(output, blocked, phase="terminal-block", test_hooks=test_hooks)
        except OSError:
            pass
    finally:
        for temp in staged.values():
            temp.unlink(missing_ok=True)
        if final_receipt_committed or rolled_back:
            for backup in backups.values():
                backup.unlink(missing_ok=True)
        else:
            for path, backup in backups.items():
                if path not in preserved_backup_paths:
                    backup.unlink(missing_ok=True)

    if final_receipt_committed:
        final_result = load(output)
        print(json.dumps(final_result, indent=2, sort_keys=True))
        return 0
    try:
        final_result = load(output)
    except (OSError, json.JSONDecodeError):
        final_result = {"status": "block", "blockers": errors or [first_failure]}
    print(json.dumps(final_result, indent=2, sort_keys=True))
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
