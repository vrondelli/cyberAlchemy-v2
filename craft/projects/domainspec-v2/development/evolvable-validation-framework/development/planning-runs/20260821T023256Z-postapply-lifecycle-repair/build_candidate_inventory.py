#!/usr/bin/env python3
"""Build the exact four-override plus sixteen-reuse EVF candidate inventory."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any


RUN = (
    "projects/domainspec-v2/development/evolvable-validation-framework/"
    "development/planning-runs/20260821T023256Z-postapply-lifecycle-repair"
)
OLD_RUN = (
    "projects/domainspec-v2/development/evolvable-validation-framework/"
    "development/planning-runs/20260821T002335Z-design-activation-repair"
)
BASE_INVENTORY = (
    "projects/domainspec-v2/development/evolvable-validation-framework/"
    "development/planning-runs/20260820T173249Z-post-l0-l1-plan/"
    "POSTIMAGE-INVENTORY.json"
)
OLD_OUTPUT_ROOT = f"{OLD_RUN}/material/root/outputs"
PROJECTED_STATE = f"{RUN}/PROPOSED-POSTAPPLY-LIFECYCLE-STATE.json"

EXPECTED_INPUTS: dict[str, tuple[str, int]] = {
    BASE_INVENTORY: (
        "0c25e4777f84186bfe2383313d24cca033e42163da0bea39cc8ed3a2ce9fb045",
        13086,
    ),
    f"{OLD_RUN}/OVERLAY-INVENTORY.json": (
        "63c4ccf3a11141fda955d86f568181f5152e00a0aa29e39dfa015868d0e8b9ce",
        6546,
    ),
    f"{OLD_RUN}/OWNER-ACCEPTANCE.json": (
        "08f4b37b731cacd1a996856242db8a952c547eec3848ce3de74c7e45bdf0221d",
        5538,
    ),
    f"{OLD_RUN}/reviews/PLAN-INDEPENDENT-REVIEW-004.json": (
        "15b23b9c9883883bf5a121b77e18858f9f2251af01fb5a7d742d083a22053037",
        15131,
    ),
    f"{OLD_RUN}/material/APPLY-EXECUTION-RECEIPT.json": (
        "a7a04fb8da7e78b58a784449ddc55f1cb3377f0ae732907337f3336988757dcf",
        7280,
    ),
    f"{OLD_RUN}/material/POST-APPLY-LIFECYCLE-FAILURE.json": (
        "914709fb6c1562badbb9aa291e8d6dd56f19f30a6edfa975555fc5779d79412b",
        2163,
    ),
    f"{OLD_RUN}/material/ROLLBACK-RECEIPT.json": (
        "ab0acae5904753c27e8dccdc119b7458fdfe0d4abfa3b106720fae98fa4a850f",
        557,
    ),
    f"{OLD_RUN}/material/POST-ROLLBACK-PREFLIGHT-RECEIPT.json": (
        "73cf4a5596e4f6023734fa040bcb9f3aca0150417b527465f0d07908575f08e7",
        1721,
    ),
    f"{OLD_RUN}/material/GOVERNANCE-DEFECT-SIDECAR-RECEIPT.json": (
        "c0c5881ea91dd88b93bbf56fb87e383b2069be83c56a410aab2d6ae2a6bc972b",
        20202,
    ),
    PROJECTED_STATE: (
        "bcc14c77232e854ad48a5102d67e359013b9ac6da950f5b500d2caba79ab4aec",
        5230,
    ),
}

OVERRIDES = {
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


class CandidateError(RuntimeError):
    """Fail-closed candidate construction error."""


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def bounded(root: Path, relative: str) -> Path:
    candidate = (root / relative).resolve(strict=False)
    try:
        candidate.relative_to(root)
    except ValueError as error:
        raise CandidateError(f"path escapes repository root: {relative}") from error
    return candidate


def exact_bytes(root: Path, relative: str, expected: tuple[str, int] | None = None) -> bytes:
    path = bounded(root, relative)
    if path.is_symlink() or not path.is_file():
        raise CandidateError(f"regular file required: {relative}")
    data = path.read_bytes()
    if expected and (sha256(data), len(data)) != expected:
        raise CandidateError(f"exact input drift: {relative}")
    return data


def load_json(root: Path, relative: str, expected: tuple[str, int] | None = None) -> dict[str, Any]:
    data = exact_bytes(root, relative, expected)
    try:
        value = json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise CandidateError(f"valid UTF-8 JSON required: {relative}: {error}") from error
    if not isinstance(value, dict):
        raise CandidateError(f"JSON object required: {relative}")
    return value


def canonical_digest(value: object) -> str:
    payload = json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return sha256(payload)


def exact_ref(relative: str, data: bytes) -> dict[str, Any]:
    return {"path": relative, "sha256": sha256(data), "size_bytes": len(data)}


def build(root: Path) -> dict[str, Any]:
    bound_data = {
        relative: exact_bytes(root, relative, expected)
        for relative, expected in EXPECTED_INPUTS.items()
    }
    base = json.loads(bound_data[BASE_INVENTORY].decode("utf-8"))
    old_overlay_path = f"{OLD_RUN}/OVERLAY-INVENTORY.json"
    old_overlay = json.loads(bound_data[old_overlay_path].decode("utf-8"))
    apply_path = f"{OLD_RUN}/material/APPLY-EXECUTION-RECEIPT.json"
    apply_receipt = json.loads(bound_data[apply_path].decode("utf-8"))
    rollback_path = f"{OLD_RUN}/material/ROLLBACK-RECEIPT.json"
    rollback = json.loads(bound_data[rollback_path].decode("utf-8"))

    if (
        old_overlay.get("package_digest")
        != "b61f99354ed4d06b2ef9769d6d067edff34f68b83b0bf59d2c3c92e1945283d4"
        or old_overlay.get("target_count") != 20
    ):
        raise CandidateError("accepted predecessor package identity drift")
    if (
        apply_receipt.get("result") != "pass"
        or apply_receipt.get("canonical_targets_mutated") is not True
        or len(apply_receipt.get("postimages", [])) != 20
    ):
        raise CandidateError("exact predecessor apply receipt is not the recorded pass")
    if (
        rollback.get("result") != "pass"
        or rollback.get("canonical_state") != "exact-pre-apply-state-restored"
    ):
        raise CandidateError("exact rollback evidence is not pass")

    apply_rows = {row["target_path"]: row for row in apply_receipt["postimages"]}
    base_rows = base.get("targets", [])
    if len(base_rows) != 20 or len(apply_rows) != 20:
        raise CandidateError("20-target denominator required")
    paths = [row["canonical_path"] for row in base_rows]
    if paths != sorted(paths) or set(paths) != set(apply_rows):
        raise CandidateError("target order or set drift")
    if not OVERRIDES.issubset(paths) or len(OVERRIDES) != 4:
        raise CandidateError("exact four-target override set missing")

    targets: list[dict[str, Any]] = []
    digest_rows: list[dict[str, Any]] = []
    for row in base_rows:
        canonical_path = row["canonical_path"]
        predecessor_path = f"{OLD_OUTPUT_ROOT}/{canonical_path}"
        predecessor = exact_bytes(root, predecessor_path)
        applied = apply_rows[canonical_path]
        if (
            sha256(predecessor) != applied.get("sha256")
            or len(predecessor) != applied.get("size_bytes")
        ):
            raise CandidateError(f"accepted predecessor postimage drift: {canonical_path}")
        if canonical_path in OVERRIDES:
            selected_path = f"{RUN}/staging/{canonical_path}"
            source_kind = "lifecycle-override"
        else:
            selected_path = predecessor_path
            source_kind = "byte-identical-reuse"
        selected = exact_bytes(root, selected_path)
        selected_ref = exact_ref(selected_path, selected)
        target = {
            "canonical_path": canonical_path,
            "operation": row["operation"],
            "baseline": row["baseline"],
            "source_kind": source_kind,
            "predecessor_postimage": exact_ref(predecessor_path, predecessor),
            "postimage": selected_ref,
        }
        targets.append(target)
        digest_rows.append(
            {
                "canonical_path": canonical_path,
                "postimage_sha256": selected_ref["sha256"],
                "postimage_size_bytes": selected_ref["size_bytes"],
            }
        )

    source_refs = {
        key.replace("/", "_").replace(".", "_"): exact_ref(key, data)
        for key, data in bound_data.items()
    }
    return {
        "schema_version": "invoke.plan-postimage-lifecycle-repair-inventory/v1",
        "inventory_id": "EVF-L1-POSTAPPLY-LIFECYCLE-REPAIR-20260821",
        "run_id": "20260821T023256Z-postapply-lifecycle-repair",
        "mode": "proposal-only",
        "candidate_state": {
            "postimage_semantics": "projected-postapply-canonical-state",
            "independent_review": "pending-fresh-review",
            "owner_acceptance": "pending-after-review",
            "canonical_apply": "not-authorized",
            "mutation_ready": False,
        },
        "accepted_predecessor": {
            "package_digest": "b61f99354ed4d06b2ef9769d6d067edff34f68b83b0bf59d2c3c92e1945283d4",
            "target_count": 20,
            "reuse_rule": "postimage-source-only",
            "review_and_acceptance_reusable": False,
            "apply_state": "mechanically-exact-then-rolled-back",
        },
        "defect": {
            "classification": "governance-only-acceptance-critical",
            "affected_invariant": "EVF-POSTIMAGE-PROJECTED-LIFECYCLE-TRUTH",
            "affected_target_count": 4,
        },
        "package_digest_algorithm": (
            "sha256 of canonical JSON array rows containing canonical_path, "
            "postimage_sha256, and postimage_size_bytes with sorted object keys "
            "and compact separators"
        ),
        "package_digest": canonical_digest(digest_rows),
        "target_count": len(targets),
        "override_target_count": len(OVERRIDES),
        "reused_target_count": len(targets) - len(OVERRIDES),
        "override_paths": sorted(OVERRIDES),
        "baseline_partition": {"present": 11, "absent": 9},
        "targets": targets,
        "source_refs": source_refs,
        "validation_state": "external-validation-receipt-required",
        "distill": {
            "status": "skipped",
            "rationale": "Four lifecycle-only assertions change; topology, semantics, SWU boundaries, and claim ceilings are frozen.",
        },
        "authority_effect": "none",
        "release_admission": "not-granted",
    }


def write_atomic(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    temporary = path.with_name(path.name + ".tmp")
    if temporary.exists() or temporary.is_symlink():
        raise CandidateError(f"temporary output collision: {temporary}")
    temporary.write_text(payload, encoding="utf-8")
    os.replace(temporary, path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    root = Path(args.repo_root).resolve()
    output = Path(args.output)
    if not output.is_absolute():
        output = (root / output).resolve(strict=False)
    write_atomic(output, build(root))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
