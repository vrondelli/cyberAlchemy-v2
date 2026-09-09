#!/usr/bin/env python3
"""Validate the staged OEW L1 final-build lock against live predecessor bytes."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import tarfile
from pathlib import Path


def digest_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def digest(path: Path) -> str:
    return digest_bytes(path.read_bytes())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--implementation-root", type=Path, required=True)
    parser.add_argument("--lock", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    repo = args.repo_root.resolve()
    implementation = args.implementation_root.resolve()
    lock = json.loads(args.lock.read_text())
    manifest = json.loads(args.manifest.read_text())
    checks: list[dict[str, str]] = []
    failures: list[dict[str, str]] = []

    def check(check_id: str, passed: bool, detail: str) -> None:
        checks.append(
            {
                "check_id": check_id,
                "result": "pass" if passed else "fail",
                "detail": detail,
            }
        )
        if not passed:
            failures.append({"check_id": check_id, "detail": detail})

    def exact_ref(
        check_id: str,
        reference: dict[str, object],
        root: Path,
    ) -> bytes | None:
        path = root / str(reference["path"])
        if not path.is_file():
            check(check_id, False, f"missing {path}")
            return None
        content = path.read_bytes()
        passed = (
            digest_bytes(content) == reference.get("sha256")
            and len(content) == reference.get("size_bytes", len(content))
        )
        check(check_id, passed, f"{path} sha256={digest_bytes(content)} size={len(content)}")
        return content if passed else None

    check(
        "OEW-L1-BUILD-LOCK-IDENTITY",
        lock.get("schema_version") == "oew.l1-build-lock.v1"
        and lock.get("owner_swu") == "SWU-OEW-013B"
        and lock.get("authority_effect") == "none",
        "schema, owner, and authority effect",
    )

    upstream = lock["upstream"]
    exact_ref("OEW-L1-BUILD-UPSTREAM-LOCK", upstream["lock"], implementation)
    exact_ref(
        "OEW-L1-BUILD-UPSTREAM-RECEIPT",
        upstream["retained_build_receipt"],
        implementation,
    )
    archive_bytes = exact_ref(
        "OEW-L1-BUILD-SOURCE-ARCHIVE", upstream["source_archive"], implementation
    )

    toolchain = lock["verified_toolchain"]
    exact_ref("OEW-L1-BUILD-TOOLCHAIN-LOCK", toolchain["lock"], implementation)
    exact_ref(
        "OEW-L1-BUILD-TOOLCHAIN-HANDLE",
        toolchain["producer_handle"],
        implementation,
    )
    exact_ref(
        "OEW-L1-BUILD-TOOLCHAIN-VERIFICATION",
        toolchain["independent_verification"],
        implementation,
    )

    archive_documents: dict[str, dict[str, object]] = {}
    if archive_bytes is not None:
        root = upstream["source_archive"]["content_root"]
        with tarfile.open(fileobj=io.BytesIO(archive_bytes), mode="r:gz") as archive:
            for name, reference in upstream["effective_workspace"].items():
                member_path = f"{root}/{reference['path']}"
                extracted = archive.extractfile(member_path)
                content = extracted.read() if extracted is not None else None
                expected_size = reference.get("size_bytes")
                passed = content is not None and digest_bytes(content) == reference["sha256"]
                if expected_size is not None:
                    passed = passed and len(content) == expected_size
                check(
                    f"OEW-L1-BUILD-EFFECTIVE-{name.upper()}",
                    passed,
                    f"{member_path} sha256={digest_bytes(content) if content else None}",
                )
                if passed and content is not None and reference["path"].endswith(
                    ".json"
                ):
                    archive_documents[name] = json.loads(content)

    root_package = archive_documents.get("package", {})
    core_package = archive_documents.get("core_package", {})
    dashboard_package = archive_documents.get("dashboard_package", {})
    effective = upstream["effective_workspace"]
    check(
        "OEW-L1-BUILD-ROOT-PREPARE-EXACT",
        effective["package"].get("name") == root_package.get("name")
        == "understand-anything"
        and effective["package"].get("prepare_script")
        == root_package.get("scripts", {}).get("prepare")
        == "pnpm --filter @understand-anything/core build",
        "pinned root package name and prepare script",
    )
    expected_exports = {
        ".": {
            "types": "./dist/index.d.ts",
            "default": "./dist/index.js",
        },
        "./search": {
            "types": "./dist/search.d.ts",
            "default": "./dist/search.js",
        },
        "./types": {
            "types": "./dist/types.d.ts",
            "default": "./dist/types.js",
        },
        "./schema": {
            "types": "./dist/schema.d.ts",
            "default": "./dist/schema.js",
        },
        "./languages": {
            "types": "./dist/languages/index.d.ts",
            "default": "./dist/languages/index.js",
        },
        "./figma": {
            "types": "./dist/figma/index.d.ts",
            "default": "./dist/figma/index.js",
        },
    }
    core_ref = effective.get("core_package", {})
    check(
        "OEW-L1-BUILD-CORE-PACKAGE-CONTRACT",
        core_ref.get("name") == core_package.get("name")
        == "@understand-anything/core"
        and core_ref.get("build_script")
        == core_package.get("scripts", {}).get("build")
        == "tsc"
        and core_ref.get("output_contract", {}).get("main")
        == core_package.get("main")
        == "dist/index.js"
        and core_ref.get("output_contract", {}).get("types")
        == core_package.get("types")
        == "dist/index.d.ts"
        and core_ref.get("output_contract", {}).get("exports")
        == core_package.get("exports")
        == expected_exports,
        "pinned core name, build script, main/types, and full export map",
    )
    check(
        "OEW-L1-BUILD-DASHBOARD-CORE-DEPENDENCY",
        dashboard_package.get("name") == "@understand-anything/dashboard"
        and dashboard_package.get("dependencies", {}).get(
            "@understand-anything/core"
        )
        == "workspace:*",
        "dashboard depends on the pinned workspace core package",
    )

    features = lock["feature_inputs"]
    for swu_id in ("swu_007", "swu_008f"):
        exact_ref(
            f"OEW-L1-BUILD-{swu_id.upper()}-RECEIPT",
            features[swu_id]["receipt"],
            repo,
        )
        exact_ref(
            f"OEW-L1-BUILD-{swu_id.upper()}-CLOSEOUT",
            features[swu_id]["owner_closeout"],
            repo,
        )

    exact_ref(
        "OEW-L1-BUILD-007-OVERLAY-MANIFEST",
        features["swu_007"]["overlay_manifest"],
        implementation,
    )
    destinations: set[str] = set()
    for index, reference in enumerate(features["swu_007"]["files"], start=1):
        exact_ref(
            f"OEW-L1-BUILD-007-FILE-{index}",
            reference,
            implementation,
        )
        destination = str(reference["destination"])
        check(
            f"OEW-L1-BUILD-007-DESTINATION-{index}",
            destination not in destinations
            and destination.startswith(
                "understand-anything-plugin/packages/dashboard/src/oew/"
            ),
            destination,
        )
        destinations.add(destination)

    manifest_ref = features["swu_008f"]["first_working_version_manifest"]
    manifest_bytes = exact_ref(
        "OEW-L1-BUILD-008F-MANIFEST", manifest_ref, implementation
    )
    if manifest_bytes is not None:
        source_manifest = json.loads(manifest_bytes)
        files = source_manifest.get("files", [])
        check(
            "OEW-L1-BUILD-008F-MANIFEST-COUNTS",
            len(files) == manifest_ref["bound_file_count"]
            and source_manifest.get("target_count") == manifest_ref["target_count"],
            f"files={len(files)} target_count={source_manifest.get('target_count')}",
        )
        for index, reference in enumerate(files, start=1):
            exact_ref(
                f"OEW-L1-BUILD-008F-FILE-{index}",
                reference,
                implementation,
            )

    patch = features["entrypoint_patch"]
    exact_ref("OEW-L1-BUILD-ENTRYPOINT-PATCH", patch, implementation)
    overlay = json.loads(
        (implementation / features["swu_007"]["overlay_manifest"]["path"]).read_text()
    )
    overlay_patch = overlay["patches"][0]
    check(
        "OEW-L1-BUILD-PATCH-CONTRACT",
        all(
            patch[key] == overlay_patch[key]
            for key in (
                "path",
                "sha256",
                "target",
                "preimage_sha256",
                "postimage_sha256",
                "apply_exactly_once",
            )
        )
        and patch["reapply_must_fail"] is True,
        "patch path, images, apply-once, and reapply-negative are exact",
    )

    registry = lock["oe_workbench_registry"]
    exact_ref("OEW-L1-BUILD-PACKAGE-REGISTRY", registry, implementation)
    package = json.loads((implementation / registry["path"]).read_text())
    check(
        "OEW-L1-BUILD-REGISTERED-COMMANDS",
        package["scripts"]["build:l1"] == registry["build_command"]
        and package["scripts"]["verify:l1-build"] == registry["verify_command"]
        and registry["mutation_forbidden"] is True,
        "build and verifier commands are exact and package mutation is forbidden",
    )

    execution = lock["execution_contract"]
    commands = execution["commands"]
    command_ids = [command.get("id") for command in commands]
    check(
        "OEW-L1-BUILD-IGNORE-SCRIPTS-PRESERVED",
        execution["mode"].get("ignore_scripts") is True
        and "--ignore-scripts" in commands[0].get("command", ""),
        "frozen install remains explicit --ignore-scripts",
    )
    check(
        "OEW-L1-BUILD-COMMAND-ORDER",
        command_ids
        == ["install", "core-build", "dashboard-vitest", "dashboard-build"],
        f"command ids: {command_ids}",
    )
    core_command = commands[1] if len(commands) > 1 else {}
    evidence = core_command.get("producer_evidence", {})
    expected_outputs = {
        f"understand-anything-plugin/packages/core/dist/{relative}"
        for relative in (
            "index.js",
            "index.d.ts",
            "search.js",
            "search.d.ts",
            "types.js",
            "types.d.ts",
            "schema.js",
            "schema.d.ts",
            "languages/index.js",
            "languages/index.d.ts",
            "figma/index.js",
            "figma/index.d.ts",
        )
    }
    check(
        "OEW-L1-BUILD-CORE-COMMAND-EXACT",
        core_command.get("command")
        == "pnpm --filter @understand-anything/core build"
        and core_command.get("expanded_script") == "tsc"
        and core_command.get("after") == "install"
        and core_command.get("before") == "dashboard-vitest"
        and core_command.get("expected_exit_code") == 0,
        "exact core command, expanded script, order, and exit expectation",
    )
    check(
        "OEW-L1-BUILD-CORE-EVIDENCE-CONTRACT",
        evidence.get("record_command") is True
        and evidence.get("record_exit_code") is True
        and evidence.get("record_output_tree_digest") is True
        and set(evidence.get("required_output_paths", [])) == expected_outputs,
        "command, exit, output-tree digest, and 12 required dist paths",
    )
    required_negative_witnesses = {
        "missing or drifted pinned core package metadata blocks before install",
        "missing or drifted core build command or expanded script blocks",
        "skipped, failed, or out-of-order core build blocks dashboard Vitest",
        "missing core command, exit-code, output-tree digest, or required dist output evidence blocks the producer handle and independent verifier",
    }
    check(
        "OEW-L1-BUILD-CORE-NEGATIVE-WITNESSES",
        required_negative_witnesses.issubset(
            set(execution.get("negative_witnesses", []))
        ),
        "missing/drifted/skipped/failed/out-of-order/evidence negatives are bound",
    )

    protected = lock["protected_set"]
    exact_ref("OEW-L1-BUILD-PROTECTED-CONTRACT", protected["contract"], repo)
    exact_ref("OEW-L1-BUILD-PROTECTED-COMPILER", protected["compiler"], repo)
    baseline_bytes = exact_ref(
        "OEW-L1-BUILD-PROTECTED-BASELINE",
        protected["current_baseline"],
        repo,
    )
    if baseline_bytes is not None:
        baseline = json.loads(baseline_bytes)
        check(
            "OEW-L1-BUILD-PROTECTED-BASELINE-IDENTITY",
            baseline.get("set_digest")
            == protected["current_baseline"]["set_digest"]
            and len(baseline.get("entries", []))
            == protected["current_baseline"]["entry_count"],
            "baseline set digest and entry count",
        )

    record = next(
        (item for item in manifest.get("swus", []) if item["swu_id"] == "SWU-OEW-013B"),
        {},
    )
    logical_lock = (
        "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
        "upstream/L1-BUILD.lock.json"
    )
    check(
        "OEW-L1-BUILD-LOCK-TARGET-OWNERSHIP",
        logical_lock in record.get("target_inventory", []),
        logical_lock,
    )
    check(
        "OEW-L1-BUILD-CLAIM-CEILING",
        not any(lock["claims"].values()),
        "all final-build/browser/manual/release/production claims remain false",
    )

    receipt = {
        "schema_version": "oew.l1-build-lock-validation.v1",
        "lock_path": str(args.lock),
        "lock_sha256": digest(args.lock),
        "lock_size_bytes": args.lock.stat().st_size,
        "manifest_path": str(args.manifest),
        "manifest_sha256": digest(args.manifest),
        "checks": checks,
        "failures": failures,
        "result": "pass" if not failures else "block",
        "authority_effect": "none",
        "evidence_ceiling": "Input and ownership closure only; no final build or verifier execution.",
    }
    args.output.write_text(json.dumps(receipt, indent=2) + "\n")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
