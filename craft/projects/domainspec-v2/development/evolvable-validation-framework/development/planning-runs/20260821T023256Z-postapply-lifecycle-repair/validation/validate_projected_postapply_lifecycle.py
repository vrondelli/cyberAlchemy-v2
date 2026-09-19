#!/usr/bin/env python3
"""Validate EVF postimages against their projected post-apply lifecycle state."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path, PurePosixPath
from typing import Any


RUN = (
    "projects/domainspec-v2/development/evolvable-validation-framework/"
    "development/planning-runs/20260821T023256Z-postapply-lifecycle-repair"
)
INVENTORY = f"{RUN}/CANDIDATE-INVENTORY.json"
PROJECTED_STATE = f"{RUN}/PROPOSED-POSTAPPLY-LIFECYCLE-STATE.json"
GENERATOR = f"{RUN}/build_candidate_inventory.py"
REGRESSION_FIXTURE = f"{RUN}/validation/fixtures/proposal-time-state-leak.json"
MATERIAL_DIGEST_REGRESSION = (
    f"{RUN}/validation/MATERIAL-DIGEST-REGRESSION-RESULT.json"
)

EXPECTED_STATIC_INPUTS: dict[str, tuple[str, int]] = {
    PROJECTED_STATE: (
        "bcc14c77232e854ad48a5102d67e359013b9ac6da950f5b500d2caba79ab4aec",
        5230,
    ),
    GENERATOR: (
        "165226270520ecfec47272a4408407cb185fd0f6cd78d464166b1a6395ce52e3",
        11176,
    ),
    REGRESSION_FIXTURE: (
        "a8eb0cb993f4932a71749c6d57ea098eec48bccc9979d126771ec8a501f92f40",
        1650,
    ),
    MATERIAL_DIGEST_REGRESSION: (
        "3bf3d06ff8b26500d0ef2debb27f23d19dd1b8841615afbb87d0c61edf133298",
        4514,
    ),
}

EXPECTED_OVERRIDES = {
    "projects/domainspec-v2/development/evolvable-validation-framework/PLAN.md",
    "projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md",
    (
        "projects/domainspec-v2/development/evolvable-validation-framework/"
        "work-pack/shared/GAPS.md"
    ),
    (
        "projects/domainspec-v2/development/evolvable-validation-framework/"
        "work-pack/shared/CROSS-TASK-GAPS.md"
    ),
}

FROZEN_SEMANTIC_LITERALS = {
    "projects/domainspec-v2/development/evolvable-validation-framework/PLAN.md": [
        "`SWU-GCP-002-P4` proves the strict one-way eligible-payout effect contract.",
        "`SWU-GCP-003-R4` proves the isolated two-sided duplicate-makeup Boolean",
        "This is a pure Boolean decision proof.",
        "No L2 request, Datalog runtime, Alloy run, TLC model, Cedar policy",
    ],
    "projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md": [
        "allowedRoutesDigest: 59136610ef6397f8420dc81cfde4b86362d11f9ae1778250a705b018a1ee1cf8",
        "`SWU-GCP-002-P4` | freeze the only graph/source postimage",
        "`SWU-GCP-003-R4` | prove the option A pure duplicate boundary",
        "It does not prove full Financial Settlement semantics",
    ],
    (
        "projects/domainspec-v2/development/evolvable-validation-framework/"
        "work-pack/shared/GAPS.md"
    ): [
        "P4, R4, their composite L1 receipt, and all L2/provider work remain unproved",
        "TLC and Cedar are outside this tranche",
    ],
    (
        "projects/domainspec-v2/development/evolvable-validation-framework/"
        "work-pack/shared/CROSS-TASK-GAPS.md"
    ): [
        "`GCP-L1-G-001` fresh P4 proof absent",
        "`GCP-L1-G-002` fresh R4 proof absent",
        "`GCP-L2-B-002` Datalog runtime/provider admission absent",
    ],
}


class ValidationError(RuntimeError):
    """Fail-closed validator error."""


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_digest(value: object) -> str:
    payload = json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return sha256(payload)


def is_sha256_hex(value: object) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value)
    )


def material_digest_binding(
    material_package: dict[str, Any], material_receipt: dict[str, Any]
) -> tuple[str, str | None, bool]:
    """Bind the parsed material package to the producer receipt's exact digest."""
    computed = canonical_digest(material_package)
    declared = material_receipt.get("packageDigest")
    return computed, declared if isinstance(declared, str) else None, (
        is_sha256_hex(declared) and declared == computed
    )


def bounded_under(base: Path, relative: str, label: str) -> Path:
    pure = PurePosixPath(relative)
    if pure.is_absolute() or ".." in pure.parts or str(pure) != relative:
        raise ValidationError(f"unsafe {label} relative POSIX path: {relative}")
    candidate = (base / relative).resolve(strict=False)
    try:
        candidate.relative_to(base)
    except ValueError as error:
        raise ValidationError(f"path escapes {label}: {relative}") from error
    return candidate


def bounded(root: Path, relative: str) -> Path:
    return bounded_under(root, relative, "repository root")


def regular_bytes(root: Path, relative: str) -> bytes:
    path = bounded(root, relative)
    if path.is_symlink() or not path.is_file():
        raise ValidationError(f"regular file required: {relative}")
    return path.read_bytes()


def regular_bytes_under(base: Path, relative: str, label: str) -> bytes:
    path = bounded_under(base, relative, label)
    if path.is_symlink() or not path.is_file():
        raise ValidationError(f"regular file required under {label}: {relative}")
    return path.read_bytes()


def relative_argument(root: Path, supplied: str) -> str:
    path = Path(supplied)
    if path.is_absolute():
        try:
            return str(path.resolve(strict=False).relative_to(root))
        except ValueError as error:
            raise ValidationError(f"argument path escapes repository root: {supplied}") from error
    return supplied


def exact_bytes(root: Path, relative: str, expected: tuple[str, int]) -> bytes:
    data = regular_bytes(root, relative)
    if (sha256(data), len(data)) != expected:
        raise ValidationError(f"exact static input drift: {relative}")
    return data


def json_object(data: bytes, label: str) -> dict[str, Any]:
    try:
        value = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValidationError(f"valid UTF-8 JSON required: {label}: {error}") from error
    if not isinstance(value, dict):
        raise ValidationError(f"JSON object required: {label}")
    return value


def exact_ref(relative: str, data: bytes) -> dict[str, Any]:
    return {"path": relative, "sha256": sha256(data), "size_bytes": len(data)}


def scan_forbidden(text: str, forbidden: list[str]) -> list[str]:
    folded = text.casefold()
    return [literal for literal in forbidden if literal.casefold() in folded]


def frontmatter_value(text: str, key: str) -> str | None:
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        return None
    for line in lines[1:]:
        if line == "---":
            return None
        prefix = f"{key}:"
        if line.startswith(prefix):
            return line[len(prefix) :].strip()
    return None


def receipt_package_digest(value: dict[str, Any]) -> str | None:
    candidates: list[Any] = [
        value.get("accepted_package_digest"),
        value.get("package_digest"),
        value.get("packageDigest"),
    ]
    for container_name in ("candidate_binding", "candidate", "bindings", "package"):
        container = value.get(container_name)
        if isinstance(container, dict):
            candidates.extend(
                [
                    container.get("accepted_package_digest"),
                    container.get("package_digest"),
                    container.get("packageDigest"),
                    container.get("acceptedPostimagePackageDigest"),
                ]
            )
    return next((item for item in candidates if isinstance(item, str)), None)


def write_atomic(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    if temporary.exists() or temporary.is_symlink():
        raise ValidationError(f"temporary output collision: {temporary}")
    payload = json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    temporary.write_text(payload, encoding="utf-8")
    os.replace(temporary, path)


def validate(args: argparse.Namespace) -> dict[str, Any]:
    root = Path(args.repo_root).resolve()
    failures: list[str] = []
    checks: list[dict[str, Any]] = []

    static = {
        relative: exact_bytes(root, relative, expected)
        for relative, expected in EXPECTED_STATIC_INPUTS.items()
    }
    checks.append(
        {
            "check": "static-regression-input-bindings",
            "status": "pass",
            "count": len(static),
        }
    )
    manifest = json_object(static[PROJECTED_STATE], PROJECTED_STATE)
    fixture = json_object(static[REGRESSION_FIXTURE], REGRESSION_FIXTURE)
    material_digest_regression = json_object(
        static[MATERIAL_DIGEST_REGRESSION], MATERIAL_DIGEST_REGRESSION
    )
    regression_valid = (
        material_digest_regression.get("verdict") == "pass"
        and material_digest_regression.get("valid_case", {}).get("exit_code") == 0
        and material_digest_regression.get("valid_case", {}).get("verdict") == "pass"
        and material_digest_regression.get("forged_case", {}).get("exit_code") == 1
        and material_digest_regression.get("forged_case", {}).get("verdict") == "fail"
        and material_digest_regression.get("forged_case", {}).get("expected_failure")
        == "PREAPPLY_MATERIAL_PACKAGE_DIGEST_MISMATCH"
        and "PREAPPLY_MATERIAL_PACKAGE_DIGEST_MISMATCH"
        in material_digest_regression.get("forged_case", {}).get("failures", [])
    )
    if not regression_valid:
        failures.append("MATERIAL_DIGEST_BRIDGE_REGRESSION_FAILED")
    checks.append(
        {
            "check": "material-digest-bridge-adversarial-regression",
            "status": "pass" if regression_valid else "fail",
            "result": exact_ref(
                MATERIAL_DIGEST_REGRESSION,
                static[MATERIAL_DIGEST_REGRESSION],
            ),
        }
    )
    inventory_data = regular_bytes(root, INVENTORY)
    inventory = json_object(inventory_data, INVENTORY)

    with tempfile.TemporaryDirectory(prefix="evf-postapply-inventory-replay-") as tmp:
        replay_path = Path(tmp) / "CANDIDATE-INVENTORY.json"
        environment = dict(os.environ)
        environment["PYTHONDONTWRITEBYTECODE"] = "1"
        completed = subprocess.run(
            [
                sys.executable,
                str(bounded(root, GENERATOR)),
                "--repo-root",
                str(root),
                "--output",
                str(replay_path),
            ],
            cwd=root,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )
        replay_data = replay_path.read_bytes() if replay_path.is_file() else b""
        replay_ok = completed.returncode == 0 and replay_data == inventory_data
        if not replay_ok:
            failures.append("CANDIDATE_INVENTORY_REPLAY_MISMATCH")
        checks.append(
            {
                "check": "candidate-inventory-byte-replay",
                "status": "pass" if replay_ok else "fail",
                "exit_code": completed.returncode,
                "stdout": completed.stdout,
                "stderr": completed.stderr,
                "inventory_sha256": sha256(inventory_data),
            }
        )

    core_ok = (
        inventory.get("schema_version")
        == "invoke.plan-postimage-lifecycle-repair-inventory/v1"
        and inventory.get("run_id") == "20260821T023256Z-postapply-lifecycle-repair"
        and inventory.get("mode") == "proposal-only"
        and inventory.get("target_count") == 20
        and inventory.get("override_target_count") == 4
        and inventory.get("reused_target_count") == 16
        and set(inventory.get("override_paths", [])) == EXPECTED_OVERRIDES
        and inventory.get("candidate_state", {}).get("postimage_semantics")
        == "projected-postapply-canonical-state"
        and inventory.get("candidate_state", {}).get("independent_review")
        == "pending-fresh-review"
        and inventory.get("candidate_state", {}).get("owner_acceptance")
        == "pending-after-review"
        and inventory.get("candidate_state", {}).get("canonical_apply")
        == "not-authorized"
        and inventory.get("candidate_state", {}).get("mutation_ready") is False
    )
    if not core_ok:
        failures.append("CANDIDATE_INVENTORY_STATE_INVALID")
    checks.append(
        {"check": "candidate-inventory-state", "status": "pass" if core_ok else "fail"}
    )

    target_rows = inventory.get("targets", [])
    target_paths = [row.get("canonical_path") for row in target_rows]
    target_set_ok = (
        len(target_rows) == 20
        and len(set(target_paths)) == 20
        and target_paths == sorted(target_paths)
    )
    if not target_set_ok:
        failures.append("TARGET_DENOMINATOR_INVALID")

    present = 0
    absent = 0
    baseline_failures: list[str] = []
    resolved: dict[str, tuple[dict[str, Any], bytes]] = {}
    digest_rows: list[dict[str, Any]] = []
    reuse_count = 0
    override_count = 0
    for row in target_rows:
        canonical_path = row.get("canonical_path")
        if not isinstance(canonical_path, str):
            failures.append("TARGET_PATH_INVALID")
            continue
        baseline = row.get("baseline", {})
        canonical = bounded(root, canonical_path)
        if args.phase in {"pre-review", "pre-apply"}:
            if baseline.get("state") == "present":
                present += 1
                if canonical.is_symlink() or not canonical.is_file():
                    baseline_failures.append(f"LIVE_BASELINE_MISSING:{canonical_path}")
                else:
                    live = canonical.read_bytes()
                    if (
                        sha256(live) != baseline.get("sha256")
                        or len(live) != baseline.get("size_bytes")
                    ):
                        baseline_failures.append(f"LIVE_BASELINE_DRIFT:{canonical_path}")
            elif baseline.get("state") == "absent":
                absent += 1
                if canonical.exists() or canonical.is_symlink():
                    baseline_failures.append(f"EXPECTED_ABSENT_BASELINE:{canonical_path}")
            else:
                baseline_failures.append(f"BASELINE_STATE_INVALID:{canonical_path}")

        post_ref = row.get("postimage", {})
        if not isinstance(post_ref.get("path"), str):
            failures.append(f"POSTIMAGE_REF_INVALID:{canonical_path}")
            continue
        post_data = regular_bytes(root, post_ref["path"])
        if (
            sha256(post_data) != post_ref.get("sha256")
            or len(post_data) != post_ref.get("size_bytes")
        ):
            failures.append(f"POSTIMAGE_DIGEST_MISMATCH:{canonical_path}")
        predecessor_ref = row.get("predecessor_postimage", {})
        predecessor = regular_bytes(root, predecessor_ref.get("path", ""))
        if (
            sha256(predecessor) != predecessor_ref.get("sha256")
            or len(predecessor) != predecessor_ref.get("size_bytes")
        ):
            failures.append(f"PREDECESSOR_DIGEST_MISMATCH:{canonical_path}")
        if row.get("source_kind") == "byte-identical-reuse":
            reuse_count += 1
            if post_data != predecessor:
                failures.append(f"REUSED_POSTIMAGE_CHANGED:{canonical_path}")
        elif row.get("source_kind") == "lifecycle-override":
            override_count += 1
            if canonical_path not in EXPECTED_OVERRIDES or post_data == predecessor:
                failures.append(f"LIFECYCLE_OVERRIDE_INVALID:{canonical_path}")
        else:
            failures.append(f"SOURCE_KIND_INVALID:{canonical_path}")
        resolved[canonical_path] = (row, post_data)
        digest_rows.append(
            {
                "canonical_path": canonical_path,
                "postimage_sha256": sha256(post_data),
                "postimage_size_bytes": len(post_data),
            }
        )

    if args.phase in {"pre-review", "pre-apply"} and (present, absent) != (11, 9):
        baseline_failures.append("BASELINE_PARTITION_INVALID")
    if baseline_failures:
        failures.extend(baseline_failures)
    package_digest = canonical_digest(digest_rows)
    package_ok = (
        target_set_ok
        and reuse_count == 16
        and override_count == 4
        and package_digest == inventory.get("package_digest")
    )
    if not package_ok:
        failures.append("RECOMPOSED_PACKAGE_INVALID")
    checks.append(
        {
            "check": "full-20-target-recomposition",
            "status": "pass" if package_ok else "fail",
            "package_digest": package_digest,
            "target_count": len(resolved),
            "override_count": override_count,
            "reused_count": reuse_count,
        }
    )
    if args.phase in {"pre-review", "pre-apply"}:
        checks.append(
            {
                "check": "live-baseline-denominator",
                "status": "pass" if not baseline_failures else "fail",
                "present_exact": present,
                "absent_exact": absent,
                "failures": baseline_failures,
            }
        )

    hygiene_failures: list[str] = []
    json_count = 0
    for canonical_path, (_, data) in resolved.items():
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            hygiene_failures.append(f"UTF8:{canonical_path}")
            continue
        if data.startswith(b"\xef\xbb\xbf"):
            hygiene_failures.append(f"BOM:{canonical_path}")
        if not data.endswith(b"\n"):
            hygiene_failures.append(f"FINAL_NEWLINE:{canonical_path}")
        if any(line.endswith((" ", "\t")) for line in text.splitlines()):
            hygiene_failures.append(f"TRAILING_WHITESPACE:{canonical_path}")
        if canonical_path.endswith(".json"):
            json_count += 1
            try:
                json.loads(text)
            except json.JSONDecodeError:
                hygiene_failures.append(f"JSON_PARSE:{canonical_path}")
    if hygiene_failures:
        failures.extend(hygiene_failures)
    checks.append(
        {
            "check": "complete-tree-content-and-json-hygiene",
            "status": "pass" if not hygiene_failures else "fail",
            "target_count": len(resolved),
            "json_count": json_count,
            "failures": hygiene_failures,
        }
    )

    forbidden = manifest.get("forbidden_literals_in_recomposed_tree", [])
    if not isinstance(forbidden, list) or not all(isinstance(item, str) for item in forbidden):
        raise ValidationError("projected lifecycle forbidden literal set invalid")
    candidate_hits: list[dict[str, Any]] = []
    predecessor_hit_paths: set[str] = set()
    predecessor_hits: list[dict[str, Any]] = []
    for canonical_path, (row, data) in resolved.items():
        text = data.decode("utf-8")
        hits = scan_forbidden(text, forbidden)
        if hits:
            candidate_hits.append({"canonical_path": canonical_path, "literals": hits})
        predecessor_data = regular_bytes(root, row["predecessor_postimage"]["path"])
        old_hits = scan_forbidden(predecessor_data.decode("utf-8"), forbidden)
        if old_hits:
            predecessor_hit_paths.add(canonical_path)
            predecessor_hits.append(
                {"canonical_path": canonical_path, "literals": old_hits}
            )
    projected_scan_ok = not candidate_hits
    predecessor_killed = predecessor_hit_paths == EXPECTED_OVERRIDES
    if not projected_scan_ok:
        failures.append("STALE_PROJECTED_LIFECYCLE_ASSERTION")
    if not predecessor_killed:
        failures.append("PREDECESSOR_REGRESSION_DENOMINATOR_MISMATCH")
    checks.append(
        {
            "check": "PROPOSED_POSTAPPLY_LIFECYCLE_STATE",
            "status": "pass" if projected_scan_ok and predecessor_killed else "fail",
            "candidate_stale_hits": candidate_hits,
            "predecessor_killed": predecessor_killed,
            "predecessor_affected_paths": sorted(predecessor_hit_paths),
            "predecessor_hits": predecessor_hits,
        }
    )

    assertion_failures: list[str] = []
    for surface in manifest.get("assertion_surfaces", []):
        canonical_path = surface.get("canonical_path")
        if canonical_path not in resolved:
            assertion_failures.append(f"SURFACE_MISSING:{canonical_path}")
            continue
        text = resolved[canonical_path][1].decode("utf-8")
        for literal in surface.get("required_literals", []):
            if literal not in text:
                assertion_failures.append(f"REQUIRED_LITERAL_MISSING:{canonical_path}:{literal}")
    for canonical_path, literals in FROZEN_SEMANTIC_LITERALS.items():
        if canonical_path not in resolved:
            assertion_failures.append(f"SEMANTIC_SURFACE_MISSING:{canonical_path}")
            continue
        current = resolved[canonical_path][1].decode("utf-8")
        predecessor = regular_bytes(
            root, resolved[canonical_path][0]["predecessor_postimage"]["path"]
        ).decode("utf-8")
        for literal in literals:
            if literal not in current or literal not in predecessor:
                assertion_failures.append(
                    f"FROZEN_SEMANTIC_LITERAL_DRIFT:{canonical_path}:{literal}"
                )
    if assertion_failures:
        failures.extend(assertion_failures)
    checks.append(
        {
            "check": "projected-state-and-semantic-ceiling-assertions",
            "status": "pass" if not assertion_failures else "fail",
            "failures": assertion_failures,
        }
    )

    plan_text = resolved[
        "projects/domainspec-v2/development/evolvable-validation-framework/PLAN.md"
    ][1].decode("utf-8")
    work_text = resolved[
        "projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md"
    ][1].decode("utf-8")
    entry_path = (
        "projects/domainspec-v2/development/evolvable-validation-framework/"
        "work-pack/EXECUTION-ENTRY.json"
    )
    entry = json_object(resolved[entry_path][1], entry_path)
    entry_state = entry.get("execution_entry", {})
    cross_state_ok = (
        frontmatter_value(plan_text, "status")
        == "canonical-planning-applied-awaiting-readiness-activation"
        and frontmatter_value(plan_text, "nextRoute") == "implementation-readiness"
        and frontmatter_value(work_text, "status")
        == "canonical-planning-applied-awaiting-readiness-activation"
        and frontmatter_value(work_text, "workPackGateStatus") == "block"
        and frontmatter_value(work_text, "executionEntryState") == "blocked"
        and entry_state.get("state") == "blocked"
        and entry_state.get("selected_unit") is None
        and entry_state.get("route_id") is None
        and entry_state.get("next_owner") is None
        and entry.get("pre_execution_owner_prerequisite") is None
        and entry.get("authority_effect") == "none"
    )
    if not cross_state_ok:
        failures.append("CROSS_FILE_PROJECTED_STATE_MISMATCH")
    checks.append(
        {
            "check": "cross-file-projected-state",
            "status": "pass" if cross_state_ok else "fail",
            "execution_entry_state": entry_state,
        }
    )

    fixture_cases = fixture.get("cases", [])
    killed = 0
    fixture_failures: list[str] = []
    for case in fixture_cases:
        hits = scan_forbidden(case.get("text", ""), forbidden)
        if hits:
            killed += 1
        else:
            fixture_failures.append(case.get("case_id", "missing-case-id"))
    clean_hits = scan_forbidden(fixture.get("clean_control", ""), forbidden)
    fixture_ok = (
        killed == fixture.get("expected_killed")
        and killed == len(fixture_cases)
        and not clean_hits
        and not fixture_failures
    )
    if not fixture_ok:
        failures.append("PROJECTED_LIFECYCLE_REGRESSION_FIXTURE_FAILED")
    checks.append(
        {
            "check": "projected-lifecycle-regression-fixture",
            "status": "pass" if fixture_ok else "fail",
            "killed": killed,
            "denominator": len(fixture_cases),
            "clean_control_hits": clean_hits,
            "failures": fixture_failures,
        }
    )

    external_bindings: list[dict[str, Any]] = []
    if args.phase == "pre-apply":
        required = {
            "independent_review": args.independent_review,
            "owner_acceptance": args.owner_acceptance,
            "material_package": args.material_package,
            "material_root": args.material_root,
            "material_receipt": args.material_receipt,
            "handoff_receipt": args.handoff_receipt,
        }
        for label, supplied in required.items():
            if not supplied:
                failures.append(f"PREAPPLY_{label.upper()}_MISSING")
        if not any(item.startswith("PREAPPLY_") for item in failures):
            review_relative = relative_argument(root, args.independent_review)
            acceptance_relative = relative_argument(root, args.owner_acceptance)
            material_package_relative = relative_argument(root, args.material_package)
            material_receipt_relative = relative_argument(root, args.material_receipt)
            handoff_relative = relative_argument(root, args.handoff_receipt)
            material_root_relative = relative_argument(root, args.material_root)
            material_root = bounded(root, material_root_relative)
            if material_root.is_symlink() or not material_root.is_dir():
                failures.append("PREAPPLY_MATERIAL_ROOT_INVALID")

            review_data = regular_bytes(root, review_relative)
            acceptance_data = regular_bytes(root, acceptance_relative)
            material_package_data = regular_bytes(root, material_package_relative)
            material_receipt_data = regular_bytes(root, material_receipt_relative)
            handoff_data = regular_bytes(root, handoff_relative)
            review = json_object(review_data, review_relative)
            acceptance = json_object(acceptance_data, acceptance_relative)
            material_package = json_object(
                material_package_data, material_package_relative
            )
            material_receipt = json_object(
                material_receipt_data, material_receipt_relative
            )
            handoff = json_object(handoff_data, handoff_relative)
            external_bindings.extend(
                [
                    exact_ref(review_relative, review_data),
                    exact_ref(acceptance_relative, acceptance_data),
                    exact_ref(material_package_relative, material_package_data),
                    exact_ref(material_receipt_relative, material_receipt_data),
                    exact_ref(handoff_relative, handoff_data),
                ]
            )

            if (
                review.get("verdict") != "pass"
                or review.get("blocking_defects") not in ([], None)
                or receipt_package_digest(review) != package_digest
            ):
                failures.append("PREAPPLY_INDEPENDENT_REVIEW_NOT_PASS")
            review_ref = acceptance.get("review_receipt", {})
            if (
                acceptance.get("decision")
                not in {"accepted", "exact-byte-package-accepted"}
                or receipt_package_digest(acceptance) != package_digest
                or not isinstance(review_ref, dict)
                or review_ref.get("sha256") != sha256(review_data)
                or review_ref.get("size_bytes") != len(review_data)
            ):
                failures.append("PREAPPLY_OWNER_ACCEPTANCE_INVALID")

            source_rows = material_package.get("source_artifacts", [])
            if not isinstance(source_rows, list):
                source_rows = []

            def material_source_contains(expected_data: bytes) -> bool:
                for source in source_rows:
                    if not isinstance(source, dict) or not isinstance(
                        source.get("path"), str
                    ):
                        continue
                    if (
                        source.get("sha256") != sha256(expected_data)
                        or source.get("size_bytes") != len(expected_data)
                    ):
                        continue
                    actual = regular_bytes_under(
                        material_root, source["path"], "material root"
                    )
                    if actual == expected_data:
                        return True
                return False

            if not all(
                material_source_contains(data)
                for data in (inventory_data, review_data, acceptance_data)
            ):
                failures.append("PREAPPLY_MATERIAL_SOURCE_BINDING_MISSING")

            changes = material_package.get("changes", [])
            change_rows = {
                row.get("target_path"): row
                for row in changes
                if isinstance(row, dict) and isinstance(row.get("target_path"), str)
            }
            material_change_failures: list[str] = []
            if set(change_rows) != set(target_paths) or len(changes) != 20:
                material_change_failures.append("MATERIAL_CHANGE_SET_MISMATCH")
            for canonical_path, (_, post_data) in resolved.items():
                change = change_rows.get(canonical_path, {})
                output_ref = change.get("output_ref", {})
                if not isinstance(output_ref, dict) or not isinstance(
                    output_ref.get("path"), str
                ):
                    material_change_failures.append(
                        f"MATERIAL_OUTPUT_REF_MISSING:{canonical_path}"
                    )
                    continue
                output = regular_bytes_under(
                    material_root, output_ref["path"], "material root"
                )
                if (
                    output != post_data
                    or output_ref.get("sha256") != sha256(post_data)
                    or output_ref.get("size_bytes") != len(post_data)
                ):
                    material_change_failures.append(
                        f"MATERIAL_OUTPUT_MISMATCH:{canonical_path}"
                    )
            approval_scope = material_package.get("approval", {}).get(
                "scope_paths", []
            )
            if set(approval_scope) != set(target_paths):
                material_change_failures.append("MATERIAL_APPROVAL_SCOPE_MISMATCH")
            if material_change_failures:
                failures.extend(
                    f"PREAPPLY_{item}" for item in material_change_failures
                )

            (
                computed_material_digest,
                material_digest,
                material_digest_matches,
            ) = material_digest_binding(material_package, material_receipt)
            if not material_digest_matches:
                failures.append("PREAPPLY_MATERIAL_PACKAGE_DIGEST_MISMATCH")
            material_id = material_receipt.get("packageId")
            receipt_ok = (
                material_digest_matches
                and material_id == material_package.get("package_id")
                and material_receipt.get("patchVerdict") == "pass"
                and material_receipt.get("mutationHandoff") == "ready"
                and material_receipt.get("validatedPaths") == target_paths
                and material_receipt.get("dependencyResult") == "pass"
                and material_receipt.get("ownerBoundaryResult") == "pass"
                and material_receipt.get("publicationBoundaryResult") == "pass"
                and material_receipt.get("reasons") == []
            )
            if not receipt_ok:
                failures.append("PREAPPLY_MATERIAL_RECEIPT_INVALID")

            handoff_package = handoff.get("materialPackage", {})
            receipt_binding = handoff.get("materialReceiptBinding", {})
            handoff_ok = (
                handoff.get("phaseStatus") == "pass"
                and handoff.get("handoffStatus") == "ready"
                and handoff.get("mutationReady") is True
                and handoff.get("blockers") == []
                and handoff_package.get("packageId") == material_id
                and handoff_package.get("packageDigest") == material_digest
                and handoff_package.get("expectedPackageDigest") == material_digest
                and handoff_package.get("validatedPaths") == target_paths
                and receipt_binding.get("actualSha256")
                == sha256(material_receipt_data)
                and receipt_binding.get("expectedSha256")
                == sha256(material_receipt_data)
                and receipt_binding.get("currentPackageRevalidated") is True
                and receipt_binding.get("receiptMatchesCurrentValidation") is True
            )
            if not handoff_ok:
                failures.append("PREAPPLY_HANDOFF_NOT_READY")
        checks.append(
            {
                "check": "preapply-dual-digest-lifecycle-and-material-bindings",
                "status": "pass" if not any(item.startswith("PREAPPLY_") for item in failures) else "fail",
                "candidate_package_digest": package_digest,
                "computed_material_package_digest": (
                    computed_material_digest
                    if "computed_material_digest" in locals()
                    else None
                ),
                "bindings": external_bindings,
            }
        )

    if args.phase == "post-apply":
        if not args.apply_receipt:
            failures.append("POSTAPPLY_RECEIPT_MISSING")
        else:
            relative = str(Path(args.apply_receipt).relative_to(root)) if Path(args.apply_receipt).is_absolute() else args.apply_receipt
            apply_data = regular_bytes(root, relative)
            apply_receipt = json_object(apply_data, relative)
            applied_rows = {
                row.get("target_path"): row
                for row in apply_receipt.get("postimages", [])
                if isinstance(row, dict)
            }
            postapply_failures: list[str] = []
            if (
                apply_receipt.get("result") != "pass"
                or apply_receipt.get("canonical_targets_mutated") is not True
                or set(applied_rows) != set(target_paths)
                or apply_receipt.get("bindings", {}).get(
                    "accepted_package_digest"
                )
                != package_digest
            ):
                postapply_failures.append("POSTAPPLY_RECEIPT_INVALID")
            for canonical_path, (_, post_data) in resolved.items():
                canonical = bounded(root, canonical_path)
                if canonical.is_symlink() or not canonical.is_file():
                    postapply_failures.append(f"POSTAPPLY_TARGET_MISSING:{canonical_path}")
                    continue
                live = canonical.read_bytes()
                if live != post_data:
                    postapply_failures.append(f"POSTAPPLY_TARGET_MISMATCH:{canonical_path}")
                if scan_forbidden(live.decode("utf-8"), forbidden):
                    postapply_failures.append(f"POSTAPPLY_LIFECYCLE_DRIFT:{canonical_path}")
            if postapply_failures:
                failures.extend(postapply_failures)
            checks.append(
                {
                    "check": "postapply-live-canonical-state",
                    "status": "pass" if not postapply_failures else "fail",
                    "apply_receipt": exact_ref(relative, apply_data),
                    "failures": postapply_failures,
                }
            )

    phase_next = {
        "pre-review": "independent-plan-review",
        "pre-apply": "invoke-refresh-apply-approved",
        "post-apply": "implementation-readiness",
    }[args.phase]
    verdict = "pass" if not failures else "fail"
    return {
        "schema_version": "evf.projected-postapply-lifecycle-validation/v1",
        "run_id": "20260821T023256Z-postapply-lifecycle-repair",
        "phase": args.phase,
        "verdict": verdict,
        "candidate": {
            "inventory": exact_ref(INVENTORY, inventory_data),
            "package_digest": package_digest,
            "target_count": len(resolved),
            "override_count": override_count,
            "reused_count": reuse_count,
        },
        "projected_lifecycle_manifest": exact_ref(
            PROJECTED_STATE, static[PROJECTED_STATE]
        ),
        "checks": checks,
        "failures": failures,
        "phase_status": "pass" if verdict == "pass" else "block",
        "handoff_status": (
            "gated" if verdict == "pass" and args.phase == "pre-review" else
            "ready" if verdict == "pass" else "blocked"
        ),
        "mutation_ready": verdict == "pass" and args.phase == "pre-apply",
        "next_route": phase_next if verdict == "pass" else "repair-current-candidate",
        "claim_ceiling": (
            "Projected planning lifecycle consistency over one exact 20-target candidate only. "
            "No canonical apply, readiness, Task Session, proof, provider, release, or production claim."
        ),
        "authority_effect": "none",
        "release_admission": "not-granted",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--phase", choices=("pre-review", "pre-apply", "post-apply"), required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--independent-review")
    parser.add_argument("--owner-acceptance")
    parser.add_argument("--material-package")
    parser.add_argument("--material-root")
    parser.add_argument("--material-receipt")
    parser.add_argument("--handoff-receipt")
    parser.add_argument("--apply-receipt")
    args = parser.parse_args()
    root = Path(args.repo_root).resolve()
    output = Path(args.output)
    if not output.is_absolute():
        output = (root / output).resolve(strict=False)
    try:
        result = validate(args)
    except BaseException as error:
        result = {
            "schema_version": "evf.projected-postapply-lifecycle-validation/v1",
            "run_id": "20260821T023256Z-postapply-lifecycle-repair",
            "phase": args.phase,
            "verdict": "fail",
            "checks": [],
            "failures": [f"VALIDATOR_EXCEPTION:{type(error).__name__}:{error}"],
            "phase_status": "block",
            "handoff_status": "blocked",
            "mutation_ready": False,
            "next_route": "repair-current-candidate",
            "authority_effect": "none",
        }
    write_atomic(output, result)
    print(json.dumps(result, indent=2, sort_keys=True, ensure_ascii=False))
    return 0 if result.get("verdict") == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
