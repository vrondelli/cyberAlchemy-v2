#!/usr/bin/env python3
"""Validate the exact EVF L1 planning material package before canonical apply."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
from typing import Any


MATERIAL = Path(__file__).resolve().parent
RUN = MATERIAL.parent
EXPECTED_PACKAGE_ID = "evf-l1-plan-b61f9935-apply-20260821"
EXPECTED_ACCEPTED_DIGEST = (
    "b61f99354ed4d06b2ef9769d6d067edff34f68b83b0bf59d2c3c92e1945283d4"
)
EXPECTED_TARGET_COUNT = 20
EXPECTED_OVERRIDE_COUNT = 5
BASE_INVENTORY = Path(
    "projects/domainspec-v2/development/evolvable-validation-framework/development/"
    "planning-runs/20260820T173249Z-post-l0-l1-plan/POSTIMAGE-INVENTORY.json"
)


class PreflightFailure(RuntimeError):
    """First acceptance-critical preflight failure."""


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_json(path: Path, label: str) -> tuple[dict[str, Any], bytes]:
    data = regular_bytes(path, path.parent, label)
    try:
        value = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise PreflightFailure(f"{label} is not valid UTF-8 JSON: {error}") from error
    if not isinstance(value, dict):
        raise PreflightFailure(f"{label} must be a JSON object")
    return value, data


def normalized_relative(raw: str, label: str) -> PurePosixPath:
    path = PurePosixPath(raw.replace("\\", "/"))
    if not raw or path.is_absolute() or ".." in path.parts or str(path) in ("", "."):
        raise PreflightFailure(f"{label} has an unsafe path: {raw}")
    if str(path) != raw:
        raise PreflightFailure(f"{label} is not canonical POSIX form: {raw}")
    return path


def bounded_path(base: Path, raw: str, label: str) -> Path:
    relative = normalized_relative(raw, label)
    base = base.resolve()
    candidate = base.joinpath(*relative.parts)
    current = base
    for part in relative.parts:
        current = current / part
        if current.is_symlink():
            raise PreflightFailure(f"{label} traverses a symbolic link: {raw}")
    try:
        candidate.resolve(strict=False).relative_to(base)
    except ValueError as error:
        raise PreflightFailure(f"{label} escapes its root: {raw}") from error
    return candidate


def regular_bytes(path: Path, boundary: Path, label: str) -> bytes:
    boundary = boundary.resolve()
    if path.is_symlink() or not path.is_file():
        raise PreflightFailure(f"{label} is not a regular file: {path}")
    try:
        path.resolve().relative_to(boundary)
    except ValueError as error:
        raise PreflightFailure(f"{label} escapes its boundary: {path}") from error
    return path.read_bytes()


def exact_ref(root: Path, reference: dict[str, Any], label: str) -> bytes:
    path = bounded_path(root, reference["path"], label)
    data = regular_bytes(path, root, label)
    if digest(data) != reference["sha256"] or len(data) != reference["size_bytes"]:
        raise PreflightFailure(f"{label} exact-byte mismatch: {reference['path']}")
    return data


def canonical_accepted_digest(rows: list[dict[str, Any]]) -> str:
    payload = json.dumps(
        sorted(rows, key=lambda item: item["canonical_path"]),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    return digest(payload)


def check_text_hygiene(path: str, data: bytes) -> None:
    if data.startswith(b"\xef\xbb\xbf"):
        raise PreflightFailure(f"UTF-8 BOM in staged output: {path}")
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as error:
        raise PreflightFailure(f"non-UTF-8 staged output: {path}") from error
    if data and not data.endswith(b"\n"):
        raise PreflightFailure(f"missing final newline in staged output: {path}")
    for line_number, line in enumerate(text.splitlines(), start=1):
        if line.rstrip(" \t") != line:
            raise PreflightFailure(
                f"trailing whitespace in staged output: {path}:{line_number}"
            )
    if path.endswith(".json"):
        try:
            json.loads(text)
        except json.JSONDecodeError as error:
            raise PreflightFailure(f"invalid staged JSON: {path}: {error}") from error


def write_result(path: Path, result: dict[str, Any]) -> None:
    if path.exists() and path.is_symlink():
        raise PreflightFailure(f"result path is a symbolic link: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def validate(repo_root: Path) -> dict[str, Any]:
    repo_root = repo_root.resolve()
    package, package_bytes = load_json(MATERIAL / "MATERIAL-PACKAGE.json", "material package")
    overlay, overlay_bytes = load_json(RUN / "OVERLAY-INVENTORY.json", "overlay inventory")
    base, base_bytes = load_json(repo_root / BASE_INVENTORY, "base postimage inventory")
    authorization, authorization_bytes = load_json(
        MATERIAL / "APPLY-AUTHORIZATION.json", "apply authorization"
    )
    acceptance, acceptance_bytes = load_json(RUN / "OWNER-ACCEPTANCE.json", "owner acceptance")
    review, review_bytes = load_json(
        RUN / "reviews/PLAN-INDEPENDENT-REVIEW-004.json", "independent Review 004"
    )

    if package.get("package_id") != EXPECTED_PACKAGE_ID:
        raise PreflightFailure("material package id mismatch")
    if package.get("mutation_mode") != "apply-approved" or package.get(
        "mutation_state"
    ) != "materialized":
        raise PreflightFailure("material package is not apply-approved/materialized")
    if (
        package.get("lifecycle_owner") != "domainspec-v2.evf-planning"
        or package.get("authority_class") != "private"
        or package.get("publication_class") != "internal"
    ):
        raise PreflightFailure("material package owner or boundary mismatch")
    if overlay.get("package_digest") != EXPECTED_ACCEPTED_DIGEST:
        raise PreflightFailure("overlay accepted-package digest mismatch")
    if acceptance.get("decision") != "exact-byte-package-accepted" or acceptance.get(
        "accepted_package", {}
    ).get("resolved_package_digest") != EXPECTED_ACCEPTED_DIGEST:
        raise PreflightFailure("owner acceptance does not bind the exact package")
    if review.get("verdict") not in ("pass", "flag") or review.get(
        "blocking_defects"
    ) != [] or review.get("candidate_binding", {}).get(
        "package_digest"
    ) != EXPECTED_ACCEPTED_DIGEST:
        raise PreflightFailure("independent Review 004 is not usable for this package")
    accepted_flags = set(
        acceptance.get("independent_review", {}).get("accepted_flag_ids", [])
    )
    review_flags = {item.get("flag_id") for item in review.get("flags", [])}
    if review_flags - accepted_flags:
        raise PreflightFailure("Review 004 contains a flag not dispositioned by acceptance")
    if authorization.get("authorization_state") != "conditional-apply-approved":
        raise PreflightFailure("direct apply authorization state mismatch")
    if authorization.get("accepted_package", {}).get(
        "package_digest"
    ) != EXPECTED_ACCEPTED_DIGEST:
        raise PreflightFailure("direct apply authorization package mismatch")

    source_by_suffix = {
        item["path"]: item for item in package.get("source_artifacts", [])
    }
    required_source_names = (
        "material/APPLY-AUTHORIZATION.json",
        "OWNER-ACCEPTANCE.json",
        "OVERLAY-INVENTORY.json",
        "validation/VALIDATION-RESULT.json",
        "validation/validate_design_activation_overlay.py",
        "reviews/PLAN-INDEPENDENT-REVIEW-004-REQUEST.json",
        "reviews/PLAN-INDEPENDENT-REVIEW-004.json",
        "REFRESH-PROPOSAL.md",
        "20260820T173249Z-post-l0-l1-plan/POSTIMAGE-INVENTORY.json",
    )
    if len(source_by_suffix) != len(required_source_names):
        raise PreflightFailure("material source inventory is not exactly nine artifacts")
    for suffix in required_source_names:
        matches = [ref for path, ref in source_by_suffix.items() if path.endswith(suffix)]
        if len(matches) != 1:
            raise PreflightFailure(f"required material source missing or duplicated: {suffix}")
        exact_ref(MATERIAL / "root", matches[0], f"material source {suffix}")

    expected_bound_sources = {
        "APPLY-AUTHORIZATION.json": authorization_bytes,
        "OWNER-ACCEPTANCE.json": acceptance_bytes,
        "OVERLAY-INVENTORY.json": overlay_bytes,
        "PLAN-INDEPENDENT-REVIEW-004.json": review_bytes,
        "POSTIMAGE-INVENTORY.json": base_bytes,
    }
    for name, expected in expected_bound_sources.items():
        match = next(ref for path, ref in source_by_suffix.items() if path.endswith(name))
        if exact_ref(MATERIAL / "root", match, f"bound source {name}") != expected:
            raise PreflightFailure(f"material source is not the current bound bytes: {name}")

    base_targets = {item["canonical_path"]: item for item in base.get("targets", [])}
    overrides = {item["canonical_path"]: item for item in overlay.get("overrides", [])}
    changes = {item["target_path"]: item for item in package.get("changes", [])}
    inventory = {
        item["target_path"]: item for item in package.get("target_inventory", [])
    }
    approved = set(package.get("approval", {}).get("scope_paths", []))
    authorized = set(authorization.get("scope_paths", []))
    target_sets = [set(base_targets), set(changes), set(inventory), approved, authorized]
    if any(len(targets) != EXPECTED_TARGET_COUNT for targets in target_sets):
        raise PreflightFailure("one or more target surfaces is not exactly 20 paths")
    if any(targets != target_sets[0] for targets in target_sets[1:]):
        raise PreflightFailure("approval, authorization, changes, and target inventory differ")
    if len(overrides) != EXPECTED_OVERRIDE_COUNT or not set(overrides).issubset(base_targets):
        raise PreflightFailure("overlay override set is not the exact five-target subset")

    resolved_rows: list[dict[str, Any]] = []
    present_count = 0
    absent_count = 0
    parsed_json_count = 0
    for target in sorted(base_targets):
        base_entry = base_targets[target]
        change = changes[target]
        resolved_ref = (
            overrides[target]["repaired_postimage"]
            if target in overrides
            else base_entry["postimage"]
        )
        output_data = exact_ref(MATERIAL / "root", change["output_ref"], f"output {target}")
        if digest(output_data) != resolved_ref["sha256"] or len(output_data) != resolved_ref[
            "size_bytes"
        ]:
            raise PreflightFailure(f"output does not equal accepted resolved postimage: {target}")
        check_text_hygiene(target, output_data)
        if target.endswith(".json"):
            parsed_json_count += 1
        resolved_rows.append(
            {
                "canonical_path": target,
                "postimage_sha256": digest(output_data),
                "postimage_size_bytes": len(output_data),
            }
        )

        live = bounded_path(repo_root, target, f"live target {target}")
        baseline = base_entry["baseline"]
        if baseline["state"] == "present":
            present_count += 1
            live_data = regular_bytes(live, repo_root, f"live baseline {target}")
            if digest(live_data) != baseline["sha256"] or len(live_data) != baseline[
                "size_bytes"
            ]:
                raise PreflightFailure(f"live present baseline drift: {target}")
            frozen = bounded_path(
                MATERIAL / "root", f"baselines/{target}", f"frozen baseline {target}"
            )
            if regular_bytes(frozen, MATERIAL / "root", f"frozen baseline {target}") != live_data:
                raise PreflightFailure(f"frozen/live baseline mismatch: {target}")
            if change.get("operation") != "update":
                raise PreflightFailure(f"present baseline is not an update operation: {target}")
        else:
            absent_count += 1
            if live.exists() or live.is_symlink():
                raise PreflightFailure(f"live absent baseline now exists: {target}")
            frozen = bounded_path(
                MATERIAL / "root", f"baselines/{target}", f"absent baseline {target}"
            )
            if frozen.exists() or frozen.is_symlink():
                raise PreflightFailure(f"absent baseline has a frozen file: {target}")
            if change.get("operation") != "create":
                raise PreflightFailure(f"absent baseline is not a create operation: {target}")

    recomputed = canonical_accepted_digest(resolved_rows)
    if recomputed != EXPECTED_ACCEPTED_DIGEST:
        raise PreflightFailure("recomputed accepted 20-postimage digest mismatch")
    topology_check = next(
        (
            item
            for item in review.get("checks", [])
            if item.get("check_id")
            == "EVF-L1-REV4-007-topology-and-proof-ceiling-preservation"
        ),
        None,
    )
    if topology_check is None or topology_check.get("status") != "pass":
        raise PreflightFailure("bound independent topology check is not pass")

    return {
        "schema_version": "evf.l1-plan-material-preflight/v1",
        "result": "pass",
        "package_id": EXPECTED_PACKAGE_ID,
        "accepted_package_digest": EXPECTED_ACCEPTED_DIGEST,
        "material_package_file_sha256": digest(package_bytes),
        "target_equality": "20/20",
        "overrides": "5/5",
        "reused_postimages": "15/15",
        "live_baselines": {
            "present_exact": f"{present_count}/{present_count}",
            "absent_exact": f"{absent_count}/{absent_count}",
            "drift": 0,
        },
        "staged_outputs": {
            "exact": "20/20",
            "json_documents_parsed": parsed_json_count,
            "text_hygiene": "pass",
        },
        "topology": {
            "binding": topology_check["check_id"],
            "status": "pass",
            "basis": "Review 004 exact-byte topology check plus current 20/20 output binding",
        },
        "source_bindings": "9/9",
        "first_failure_preserved": True,
        "canonical_targets_mutated": False,
        "next_gate": "generic-material-validator-and-file-bound-refresh-handoff",
        "authority_effect": "none",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    output = Path(args.output)
    if not output.is_absolute():
        output = Path(args.repo_root).resolve() / output
    try:
        result = validate(Path(args.repo_root))
    except (OSError, KeyError, TypeError, ValueError, PreflightFailure) as error:
        result = {
            "schema_version": "evf.l1-plan-material-preflight/v1",
            "result": "block",
            "first_failure": str(error),
            "canonical_targets_mutated": False,
            "authority_effect": "none",
        }
        write_result(output, result)
        return 1
    write_result(output, result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
