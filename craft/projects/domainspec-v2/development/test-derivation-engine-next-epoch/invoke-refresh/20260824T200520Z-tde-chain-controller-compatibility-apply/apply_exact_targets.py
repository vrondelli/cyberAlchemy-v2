#!/usr/bin/env python3
"""Apply the validated 84-file material package with exclusive create semantics."""

from __future__ import annotations

import hashlib
import json
import os
import stat
from pathlib import Path


ROOT = Path.cwd().resolve()
RUN_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-refresh/20260824T200520Z-tde-chain-controller-compatibility-apply"
)
TARGET_ROOT_REL = Path(
    "projects/domainspec-v2/development/test-derivation-engine-next-epoch/"
    "invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3"
)
RUN = ROOT / RUN_REL
TARGET_ROOT = ROOT / TARGET_ROOT_REL


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, document: object) -> None:
    path.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def rollback(created_files: list[Path], created_dirs: list[Path]) -> None:
    for path in reversed(created_files):
        try:
            path.unlink()
        except FileNotFoundError:
            pass
    for path in sorted(set(created_dirs), key=lambda item: len(item.parts), reverse=True):
        try:
            path.rmdir()
        except (FileNotFoundError, OSError):
            pass


def main() -> None:
    package_path = RUN / "material/material-package.json"
    receipt_path = RUN / "material/material-package-receipt.json"
    handoff_path = RUN / "material/refresh-material-handoff-result.json"
    package = load_json(package_path)
    receipt_bytes = receipt_path.read_bytes()
    receipt = json.loads(receipt_bytes.decode("utf-8"))
    handoff = load_json(handoff_path)

    canonical_package_digest = sha256_bytes(
        json.dumps(package, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    )
    if canonical_package_digest != "e01a2ba7da92fd08bb533826241b438c0fee6d5b5d608399bec17299632b4904":
        raise SystemExit("APPLY_BLOCK: material package digest drift")
    if sha256_bytes(receipt_bytes) != "781975af3103ddfcce92f464376bc52fd729c7577426c604d8b43e2454c7e96a":
        raise SystemExit("APPLY_BLOCK: material receipt bytes drift")
    if (
        receipt.get("patchVerdict") != "pass"
        or receipt.get("mutationHandoff") != "ready"
        or receipt.get("reasons") != []
        or handoff.get("mutationReady") is not True
        or handoff.get("phaseStatus") != "pass"
        or handoff.get("handoffStatus") != "ready"
        or handoff.get("blockers") != []
    ):
        raise SystemExit("APPLY_BLOCK: material handoff is not exact PASS/ready")

    target_paths = [item["target_path"] for item in package["changes"]]
    approved = package["approval"]["scope_paths"]
    inventoried = [item["target_path"] for item in package["target_inventory"]]
    validated = receipt["validatedPaths"]
    if not (
        len(target_paths) == len(set(target_paths)) == 84
        and set(target_paths) == set(approved) == set(inventoried) == set(validated)
    ):
        raise SystemExit("APPLY_BLOCK: target, approval, inventory, and receipt scopes differ")
    if TARGET_ROOT.exists() or TARGET_ROOT.is_symlink():
        raise SystemExit("APPLY_BLOCK: canonical target root is no longer absent")

    for source in package["source_artifacts"]:
        path = ROOT / source["path"]
        payload = path.read_bytes()
        if path.is_symlink() or sha256_bytes(payload) != source["sha256"] or len(payload) != source["size_bytes"]:
            raise SystemExit(f"APPLY_BLOCK: source artifact drift: {source['path']}")
    for dependency in package["dependencies"]:
        reference = dependency["artifact_ref"]
        path = ROOT / reference["path"]
        payload = path.read_bytes()
        if path.is_symlink() or sha256_bytes(payload) != reference["sha256"] or len(payload) != reference["size_bytes"]:
            raise SystemExit(f"APPLY_BLOCK: dependency drift: {reference['path']}")
    for change in package["changes"]:
        target = ROOT / change["target_path"]
        output = ROOT / change["output_ref"]["path"]
        payload = output.read_bytes()
        if target.exists() or target.is_symlink():
            raise SystemExit(f"APPLY_BLOCK: create-only target appeared: {change['target_path']}")
        if output.is_symlink() or sha256_bytes(payload) != change["output_ref"]["sha256"] or len(payload) != change["output_ref"]["size_bytes"]:
            raise SystemExit(f"APPLY_BLOCK: staged output drift: {change['output_ref']['path']}")

    created_files: list[Path] = []
    created_dirs: list[Path] = []
    try:
        for change in package["changes"]:
            target = ROOT / change["target_path"]
            output = ROOT / change["output_ref"]["path"]
            missing_dirs: list[Path] = []
            cursor = target.parent
            while not cursor.exists():
                missing_dirs.append(cursor)
                cursor = cursor.parent
            for directory in reversed(missing_dirs):
                directory.mkdir()
                created_dirs.append(directory)
            payload = output.read_bytes()
            descriptor = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, stat.S_IMODE(output.stat().st_mode))
            try:
                view = memoryview(payload)
                while view:
                    written = os.write(descriptor, view)
                    view = view[written:]
            finally:
                os.close(descriptor)
            created_files.append(target)

        live_files = sorted(
            str(path.relative_to(ROOT))
            for path in TARGET_ROOT.rglob("*")
            if path.is_file() and not path.is_symlink()
        )
        live_symlinks = sorted(
            str(path.relative_to(ROOT)) for path in TARGET_ROOT.rglob("*") if path.is_symlink()
        )
        if set(live_files) != set(target_paths) or live_symlinks:
            raise RuntimeError("live target set or symlink inventory differs")
        applied = []
        for change in package["changes"]:
            target = ROOT / change["target_path"]
            payload = target.read_bytes()
            if sha256_bytes(payload) != change["output_ref"]["sha256"] or len(payload) != change["output_ref"]["size_bytes"]:
                raise RuntimeError(f"live output mismatch: {change['target_path']}")
            applied.append(
                {
                    "target_path": change["target_path"],
                    "operation": "create",
                    "sha256": change["output_ref"]["sha256"],
                    "size_bytes": change["output_ref"]["size_bytes"],
                    "staged_path": change["output_ref"]["path"],
                    "status": "pass",
                }
            )
    except BaseException:
        rollback(created_files, created_dirs)
        raise

    apply_receipt = {
        "schema_version": "domainspec-v2.invoke-refresh-material-apply-receipt/v1",
        "package_id": package["package_id"],
        "package_digest": canonical_package_digest,
        "material_receipt_sha256": sha256_bytes(receipt_bytes),
        "handoff_result_sha256": sha256_bytes(handoff_path.read_bytes()),
        "mutation_mode": "apply-approved",
        "apply_effect": "create-only",
        "status": "pass",
        "target_root": str(TARGET_ROOT_REL),
        "target_count": len(applied),
        "applied_changes": applied,
        "live_set_equals_validated_set": True,
        "live_bytes_equal_staged_bytes": True,
        "symlink_count": 0,
        "authority_effect": "none",
        "claim_ceiling": "Exact canonical Plan candidate bytes created and validated only; no owner acceptance, selection, Task Session, product mutation, merge, promotion, publication, release, or deployment.",
    }
    write_json(RUN / "material/material-apply-receipt.json", apply_receipt)
    print(json.dumps({"status": "pass", "applied": len(applied), "target_root": str(TARGET_ROOT_REL)}, sort_keys=True))


if __name__ == "__main__":
    main()
