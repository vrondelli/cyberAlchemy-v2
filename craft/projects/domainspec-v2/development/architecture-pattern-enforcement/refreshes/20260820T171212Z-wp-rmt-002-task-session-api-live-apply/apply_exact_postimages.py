#!/usr/bin/env python3
"""Install one accepted 33-file proposal with exact rollback protection."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
import subprocess
import tempfile
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
PROPOSAL = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260816T160301Z-wp-rmt-002-task-session-transient-output-api-proposal"
)
EXPECTED_PROPOSAL_SHA256 = (
    "5b6eb57fe1f8cebffb54c39fabd5ab1c5488e167a74f1584d5e4e83ed40c2ee1"
)
EXPECTED_RECEIPT_SHA256 = (
    "067b1b497673bca23e5e8ac26bab5f4aad234da62efad8f04cca8f077d3455d4"
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def regular_bytes(path: Path, label: str) -> bytes:
    if path.is_symlink() or not path.is_file():
        raise RuntimeError(f"{label} is not a regular file: {path}")
    resolved = path.resolve()
    try:
        resolved.relative_to(ROOT)
    except ValueError as error:
        raise RuntimeError(f"{label} escapes repository root: {path}") from error
    return path.read_bytes()


def require_ref(path: Path, reference: dict[str, Any], label: str) -> bytes:
    data = regular_bytes(path, label)
    if sha(data) != reference["sha256"] or len(data) != reference["size_bytes"]:
        raise RuntimeError(f"{label} exact-byte mismatch: {path.relative_to(ROOT)}")
    return data


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def stage_replacement(target: Path, data: bytes, suffix: str, mode: int) -> Path:
    temporary = target.with_name(target.name + suffix)
    if temporary.exists() or temporary.is_symlink():
        raise RuntimeError(f"temporary apply path already exists: {temporary}")
    descriptor = os.open(
        temporary,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL,
        mode,
    )
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
    if regular_bytes(temporary, "temporary postimage") != data:
        temporary.unlink()
        raise RuntimeError(f"temporary postimage verification failed: {temporary}")
    return temporary


def generated_files(root: Path) -> dict[str, bytes]:
    if not root.is_dir() or root.is_symlink():
        raise RuntimeError(f"generated package root is invalid: {root}")
    links = [path for path in root.rglob("*") if path.is_symlink()]
    if links:
        raise RuntimeError(f"generated package contains symbolic links: {links[0]}")
    return {
        path.relative_to(root).as_posix(): path.read_bytes()
        for path in root.rglob("*")
        if path.is_file()
    }


def prove_generated_projection(
    prepared: list[dict[str, Any]], log_label: str = "apply-attempt"
) -> dict[str, Any]:
    expected_postimages = {
        item["change"]["target"]: item["postimage_data"]
        for item in prepared
        if item["change"]["target_class"] in (
            "generated-codex-parity",
            "generated-claude-parity",
        )
    }
    bootstrap = ROOT / "arcanum/tools/bootstrap_arcanum.sh"
    bootstrap_bytes = regular_bytes(bootstrap, "Arcanum bootstrap generator")
    with tempfile.TemporaryDirectory(prefix="wp-rmt-002-projection-") as temporary:
        generation_root = Path(temporary)
        process = subprocess.run(
            [
                str(bootstrap),
                "--target",
                str(generation_root),
                "--sigils",
                "task-session",
                "--spells",
                "none",
                "--profiles",
                "repo-codex,claude",
                "--force",
                "--no-necronomicon",
            ],
            cwd=ROOT,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
            check=False,
            capture_output=True,
            timeout=180,
        )
        (RUN / "validation").mkdir(parents=True, exist_ok=True)
        if not log_label.replace("-", "").isalnum():
            raise RuntimeError(f"invalid generator log label: {log_label}")
        stdout_path = RUN / "validation" / f"generator-{log_label}.stdout"
        stderr_path = RUN / "validation" / f"generator-{log_label}.stderr"
        stdout_path.write_bytes(process.stdout)
        stderr_path.write_bytes(process.stderr)
        if process.returncode != 0:
            raise RuntimeError(
                f"canonical projection generator failed with exit {process.returncode}"
            )

        profile_results: dict[str, Any] = {}
        for profile, relative_root in (
            ("codex", ".agents/skills/task-session"),
            ("claude", ".claude/skills/task-session"),
        ):
            generated = generated_files(generation_root / relative_root)
            destination = {
                path: data
                for path, data in generated_files(ROOT / relative_root).items()
                if not (
                    ".wp-rmt-002-171212-" in path
                    and path.endswith(".apply-tmp")
                )
            }
            generated_only = sorted(set(generated) - set(destination))
            if generated_only:
                raise RuntimeError(
                    f"{profile} generator produced out-of-scope paths: "
                    + ",".join(generated_only)
                )
            destination_only = sorted(set(destination) - set(generated))
            changed = 0
            for relative, generated_bytes in generated.items():
                target = f"{relative_root}/{relative}"
                expected = expected_postimages.get(target, destination[relative])
                if generated_bytes != expected:
                    raise RuntimeError(f"{profile} generator byte drift: {target}")
                if target in expected_postimages:
                    changed += 1
            if changed != 8:
                raise RuntimeError(f"{profile} accepted generated target count is {changed}/8")
            profile_results[profile] = {
                "package_files": len(generated),
                "accepted_changed_files": "8/8",
                "unchanged_files_exact": len(generated) - changed,
                "preserved_destination_only_files": destination_only,
                "preserved_destination_only_count": len(destination_only),
            }

    return {
        "result": "pass",
        "generator": {
            "path": bootstrap.relative_to(ROOT).as_posix(),
            "sha256": sha(bootstrap_bytes),
            "size_bytes": len(bootstrap_bytes),
        },
        "profiles": profile_results,
        "stdout": {
            "path": stdout_path.relative_to(ROOT).as_posix(),
            "sha256": sha(stdout_path.read_bytes()),
            "size_bytes": stdout_path.stat().st_size,
        },
        "stderr": {
            "path": stderr_path.relative_to(ROOT).as_posix(),
            "sha256": sha(stderr_path.read_bytes()),
            "size_bytes": stderr_path.stat().st_size,
        },
        "extra_generated_targets": 0,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--preflight-only", action="store_true")
    args = parser.parse_args()
    output = Path(args.output)
    if not output.is_absolute():
        output = ROOT / output
    if output.parent != RUN:
        raise SystemExit("apply execution receipt must remain in the bounded run directory")

    proposal_path = PROPOSAL / "APPLY-PROPOSAL.json"
    receipt_path = PROPOSAL / "PROPOSAL-RECEIPT.json"
    proposal_bytes = regular_bytes(proposal_path, "apply proposal")
    receipt_bytes = regular_bytes(receipt_path, "proposal receipt")
    if sha(proposal_bytes) != EXPECTED_PROPOSAL_SHA256:
        raise SystemExit("accepted APPLY-PROPOSAL.json digest drift")
    if sha(receipt_bytes) != EXPECTED_RECEIPT_SHA256:
        raise SystemExit("accepted PROPOSAL-RECEIPT.json digest drift")
    proposal = json.loads(proposal_bytes.decode("utf-8"))
    changes = proposal.get("changes", [])
    if proposal.get("target_count") != 33 or len(changes) != 33:
        raise SystemExit("accepted target inventory is not exactly 33")

    partition_results: dict[str, dict[str, Any]] = {}
    validated_union: set[str] = set()
    for partition, expected_count in (("public", 27), ("private", 6)):
        material_dir = RUN / "material" / partition
        handoff = json.loads(
            regular_bytes(
                material_dir / "REFRESH-HANDOFF-RESULT.json",
                f"{partition} Refresh handoff",
            ).decode("utf-8")
        )
        material_receipt = json.loads(
            regular_bytes(
                material_dir / "MATERIAL-RECEIPT.json",
                f"{partition} material receipt",
            ).decode("utf-8")
        )
        if (
            handoff.get("phaseStatus") != "pass"
            or handoff.get("handoffStatus") != "ready"
            or handoff.get("mutationReady") is not True
            or handoff.get("blockers") != []
            or material_receipt.get("patchVerdict") != "pass"
            or material_receipt.get("mutationHandoff") != "ready"
        ):
            raise SystemExit(f"{partition} material handoff is not mutation-ready")
        paths = set(material_receipt.get("validatedPaths", []))
        if len(paths) != expected_count:
            raise SystemExit(f"{partition} material target count drift")
        if validated_union.intersection(paths):
            raise SystemExit("authority-partitioned material scopes overlap")
        validated_union.update(paths)
        partition_results[partition] = {
            "package_id": material_receipt["packageId"],
            "package_digest": material_receipt["packageDigest"],
            "material_receipt_sha256": sha(
                regular_bytes(material_dir / "MATERIAL-RECEIPT.json", "material receipt")
            ),
            "target_count": len(paths),
            "mutation_ready": True,
        }

    declared_targets = {item["target"] for item in changes}
    if validated_union != declared_targets:
        raise SystemExit("material subpackage union does not equal accepted 33-target scope")

    prepared: list[dict[str, Any]] = []
    for index, change in enumerate(changes):
        if change.get("operation") != "replace":
            raise SystemExit(f"unsupported accepted operation: {change.get('operation')}")
        target = ROOT / change["target"]
        preimage = ROOT / change["preimage"]["path"]
        postimage = ROOT / change["staged_postimage"]["path"]
        live_data = require_ref(target, change["preimage"], "live preimage")
        preimage_data = require_ref(preimage, change["preimage"], "frozen preimage")
        postimage_data = require_ref(
            postimage, change["staged_postimage"], "frozen staged postimage"
        )
        if live_data != preimage_data:
            raise SystemExit(f"live/preimage byte mismatch: {change['target']}")
        if postimage_data == preimage_data:
            raise SystemExit(f"accepted postimage is unchanged: {change['target']}")
        mode = stat.S_IMODE(target.stat().st_mode)
        prepared.append(
            {
                "index": index,
                "change": change,
                "target": target,
                "preimage_data": preimage_data,
                "postimage_data": postimage_data,
                "mode": mode,
            }
        )

    if args.preflight_only:
        write_json(
            output,
            {
                "schema_version": "domainspec.wp-rmt-002-live-apply-preflight/v1",
                "result": "pass",
                "proposal_id": proposal["proposal_id"],
                "apply_proposal_sha256": sha(proposal_bytes),
                "proposal_receipt_sha256": sha(receipt_bytes),
                "target_count": 33,
                "exact_live_preimages": "33/33",
                "exact_staged_postimages": "33/33",
                "authority_partitions": partition_results,
                "material_scope_union": "33/33",
                "content_or_semantic_drift": 0,
                "live_targets_mutated": False,
                "next_required_gate": "execute-exact-apply",
                "authority_effect": "none",
            },
        )
        return 0

    staged_items: list[dict[str, Any]] = []
    try:
        for item in prepared:
            item["temporary"] = stage_replacement(
                item["target"],
                item["postimage_data"],
                f".wp-rmt-002-171212-{item['index']:02d}.apply-tmp",
                item["mode"],
            )
            staged_items.append(item)
    except BaseException as error:
        for item in staged_items:
            temporary = item["temporary"]
            if temporary.exists() and not temporary.is_symlink():
                temporary.unlink()
        write_json(
            RUN / "APPLY-FAILURE.json",
            {
                "schema_version": "domainspec.wp-rmt-002-live-apply-execution/v1",
                "result": "fail",
                "phase": "prepare-temporary-postimages",
                "error": str(error),
                "live_targets_mutated": False,
                "temporary_files_removed": len(staged_items),
            },
        )
        raise SystemExit(1) from error

    applied: list[dict[str, Any]] = []
    generator_evidence: dict[str, Any] | None = None
    try:
        phases = (
            (
                "canonical-public",
                [
                    item for item in prepared
                    if item["change"]["target_class"] == "canonical-public-task-session"
                ],
            ),
            (
                "generated-projections",
                [
                    item for item in prepared
                    if item["change"]["target_class"] in (
                        "generated-codex-parity",
                        "generated-claude-parity",
                    )
                ],
            ),
            (
                "private-plan-proof",
                [
                    item for item in prepared
                    if item["change"]["target_class"] == "dependent-wp-rmt-002-proof"
                ],
            ),
        )
        for phase, items in phases:
            if phase == "generated-projections":
                generator_evidence = prove_generated_projection(prepared)
            for item in items:
                os.replace(item["temporary"], item["target"])
                fsync_directory(item["target"].parent)
                if regular_bytes(item["target"], "installed postimage") != item["postimage_data"]:
                    raise RuntimeError(
                        f"installed postimage verification failed: {item['change']['target']}"
                    )
                applied.append(item)
    except BaseException as error:
        rollback_errors: list[str] = []
        for item in reversed(applied):
            try:
                rollback_tmp = stage_replacement(
                    item["target"],
                    item["preimage_data"],
                    ".wp-rmt-002-171212.rollback-tmp",
                    item["mode"],
                )
                os.replace(rollback_tmp, item["target"])
                fsync_directory(item["target"].parent)
            except BaseException as rollback_error:
                rollback_errors.append(
                    f"{item['change']['target']}: {rollback_error}"
                )
        for item in prepared:
            temporary = item["temporary"]
            if temporary.exists() and not temporary.is_symlink():
                temporary.unlink()
        rollback_ok = not rollback_errors and all(
            regular_bytes(item["target"], "rollback target") == item["preimage_data"]
            for item in prepared
        )
        failure = {
            "schema_version": "domainspec.wp-rmt-002-live-apply-execution/v1",
            "result": "fail",
            "error": str(error),
            "applied_before_failure": len(applied),
            "rollback_result": "pass" if rollback_ok else "fail",
            "rollback_errors": rollback_errors,
        }
        write_json(RUN / "APPLY-FAILURE.json", failure)
        raise SystemExit(1) from error

    postimages = []
    for item in prepared:
        live = regular_bytes(item["target"], "final installed postimage")
        change = item["change"]
        if sha(live) != change["staged_postimage"]["sha256"] or len(live) != change[
            "staged_postimage"
        ]["size_bytes"]:
            raise SystemExit(f"final postimage drift: {change['target']}")
        postimages.append(
            {
                "target": change["target"],
                "sha256": sha(live),
                "size_bytes": len(live),
                "target_class": change["target_class"],
            }
        )

    result = {
        "schema_version": "domainspec.wp-rmt-002-live-apply-execution/v1",
        "result": "pass",
        "proposal_id": proposal["proposal_id"],
        "apply_proposal_sha256": sha(proposal_bytes),
        "proposal_receipt_sha256": sha(receipt_bytes),
        "preapply": {
            "target_count": 33,
            "exact_preimages": "33/33",
            "drift": 0,
        },
        "authority_partitions": partition_results,
        "transaction": {
            "prepared_before_replace": "33/33",
            "phase_order": [
                "11-canonical-public",
                "regenerate-and-prove-16-host-projections",
                "16-generated-projections",
                "6-private-plan-proof",
            ],
            "installed_postimages": "33/33",
            "rollback_on_failure": "enabled",
            "rollback_used": False,
        },
        "generated_projection": generator_evidence,
        "postimages": postimages,
        "next_required_gate": "post-apply-validation",
        "commit": False,
        "push": False,
        "publication": False,
        "deployment": False,
        "authority_effect": "local-accepted-byte-install-only",
    }
    write_json(output, result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
