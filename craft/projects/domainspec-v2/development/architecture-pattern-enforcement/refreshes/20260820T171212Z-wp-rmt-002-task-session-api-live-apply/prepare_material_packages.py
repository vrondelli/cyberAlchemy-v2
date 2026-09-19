#!/usr/bin/env python3
"""Build the two authority-partitioned Invoke material packages for one apply."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


RUN = Path(__file__).resolve().parent


def discover_root() -> Path:
    for candidate in (RUN, *RUN.parents):
        if (candidate / ".agents/skills/invoke").is_dir() and (
            candidate / "projects/domainspec-v2"
        ).is_dir():
            return candidate
    raise SystemExit("repository root not found")


ROOT = discover_root()
PROPOSAL = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260816T160301Z-wp-rmt-002-task-session-transient-output-api-proposal"
)
ACCEPTANCE = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260820T163827Z-wp-rmt-002-task-session-api-owner-acceptance/"
    "DECISION-RECORD.json"
)
SIDECAR = ROOT / (
    "projects/domainspec-v2/development/architecture-pattern-enforcement/"
    "refreshes/20260820T165441Z-wp-rmt-002-mtime-governance-sidecar-disposition"
)

EXPECTED = {
    PROPOSAL / "APPLY-PROPOSAL.json":
        "5b6eb57fe1f8cebffb54c39fabd5ab1c5488e167a74f1584d5e4e83ed40c2ee1",
    PROPOSAL / "PROPOSAL-RECEIPT.json":
        "067b1b497673bca23e5e8ac26bab5f4aad234da62efad8f04cca8f077d3455d4",
    ACCEPTANCE:
        "86a6e7c987593507576e30c95b62b6b0f75e7f3accf255942118c130a4c187a6",
    SIDECAR / "DECISION-RECORD.json":
        "f04eb1811868ea3859d5ff19a9ef82f571dc1a852e4b195caf7bf9f71735e609",
    SIDECAR / "GOVERNANCE-DEFECT-RECEIPT.json":
        "5a23002fb864cb2c51ea0b0817d7621171d551b9930451354450ef9c0206d8b6",
}


def digest_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def exact(path: Path) -> dict[str, Any]:
    if path.is_symlink() or not path.is_file():
        raise SystemExit(f"not a regular file: {rel(path)}")
    data = path.read_bytes()
    return {"path": rel(path), "sha256": digest_bytes(data), "size_bytes": len(data)}


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def canonical_digest(value: Any) -> str:
    payload = json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    return digest_bytes(payload)


def source(path: Path) -> dict[str, Any]:
    return {**exact(path), "authority_class": "private"}


def build_package(
    partition: str,
    changes: list[dict[str, Any]],
    owner: str,
    authority: str,
    validation_commands: list[str],
) -> dict[str, Any]:
    authorization = RUN / "APPLY-AUTHORIZATION.json"
    evidence = [
        authorization,
        PROPOSAL / "APPLY-PROPOSAL.json",
        PROPOSAL / "PROPOSAL-RECEIPT.json",
        ACCEPTANCE,
        SIDECAR / "DECISION-RECORD.json",
        SIDECAR / "GOVERNANCE-DEFECT-RECEIPT.json",
    ]
    dependency_ids = [
        "live-apply-authorization",
        "accepted-apply-proposal",
        "terminal-proposal-receipt",
        "owner-exact-byte-acceptance",
        "mtime-governance-disposition",
        "mtime-governance-sidecar-receipt",
    ]
    dependencies = [
        {"dependency_id": dependency_id, "artifact_ref": exact(path)}
        for dependency_id, path in zip(dependency_ids, evidence, strict=True)
    ]
    material_changes = [
        {
            "target_path": item["target"],
            "operation": "update",
            "output_ref": item["staged_postimage"],
        }
        for item in changes
    ]
    targets = [item["target"] for item in changes]
    inventory = [
        {
            "target_path": target,
            "lifecycle_owner": owner,
            "authority_class": authority,
            "publication_class": "internal",
            "dependency_ids": dependency_ids,
        }
        for target in targets
    ]
    mirror_groups: list[dict[str, Any]] = []
    if partition == "public":
        shared = (
            "schemas/execution-ticket.schema.json",
            "schemas/executor-receipt.schema.json",
            "schemas/governance-run-request.schema.json",
            "schemas/mutation-admission-receipt.schema.json",
            "schemas/mutation-admission-request.schema.json",
            "scripts/task-session-governance-runner.py",
            "scripts/verify-mutation-readiness.py",
        )
        for relative in shared:
            mirror_groups.append(
                {
                    "group_id": "task-session-" + relative.replace("/", "-").replace(".", "-"),
                    "parity": "exact",
                    "canonical_target": f"arcanum/arcana/task-session/{relative}",
                    "generated_targets": [
                        f".agents/skills/task-session/{relative}",
                        f".claude/skills/task-session/{relative}",
                    ],
                }
            )
    return {
        "schema_version": "1.0.0",
        "package_id": f"wp-rmt-002-{partition}-live-apply-20260820T171212Z",
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": owner,
        "authority_class": authority,
        "publication_class": "internal",
        "source_artifacts": [source(path) for path in evidence],
        "changes": material_changes,
        "target_inventory": inventory,
        "dependencies": dependencies,
        "mirror_groups": mirror_groups,
        "approval": {
            "class": "explicit-apply",
            "owner": owner,
            "scope_paths": targets,
            "authority_classes": [authority],
            "publication_classes": ["internal"],
        },
        "validation_commands": validation_commands,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--finalize-handoffs", action="store_true")
    args = parser.parse_args()

    for path, expected in EXPECTED.items():
        actual = exact(path)["sha256"]
        if actual != expected:
            raise SystemExit(f"accepted evidence drift: {rel(path)} {actual}")

    proposal = json.loads((PROPOSAL / "APPLY-PROPOSAL.json").read_text(encoding="utf-8"))
    if proposal.get("proposal_id") != (
        "wp-rmt-002-task-session-transient-output-api-proposal-20260816T160301Z"
    ) or proposal.get("target_count") != 33 or len(proposal.get("changes", [])) != 33:
        raise SystemExit("accepted proposal identity or target count drift")

    public = [
        item for item in proposal["changes"]
        if item["target_class"] != "dependent-wp-rmt-002-proof"
    ]
    private = [
        item for item in proposal["changes"]
        if item["target_class"] == "dependent-wp-rmt-002-proof"
    ]
    if len(public) != 27 or len(private) != 6:
        raise SystemExit("authority partition must be exactly 27 public plus 6 private")

    run_rel = rel(RUN)
    plan = (
        "projects/domainspec-v2/development/refinement-runs/"
        "20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan"
    )
    public_commands = [
        "PYTHONDONTWRITEBYTECODE=1 python3 arcanum/arcana/task-session/development/test_plan_once_admission.py",
        "PYTHONDONTWRITEBYTECODE=1 python3 arcanum/arcana/task-session/development/test_plan_once_governance.py",
        "PYTHONDONTWRITEBYTECODE=1 python3 arcanum/arcana/task-session/development/validate-governance-runner.py --family commit-resume --task-session-dir arcanum/arcana/task-session",
        f"PYTHONDONTWRITEBYTECODE=1 python3 {run_rel}/validate_live_apply.py --partition public",
        "git -C arcanum diff --check -- arcana/task-session",
        "git diff --check -- .agents/skills/task-session .claude/skills/task-session",
    ]
    private_commands = [
        f"node {plan}/validate-work-pack.mjs .",
        f"PYTHONDONTWRITEBYTECODE=1 python3 {run_rel}/validate_live_apply.py --partition private",
        f"git diff --check -- {plan}/SWU-MANIFEST.json {plan}/SWU-CONTRACTS.json {plan}/EXECUTION-ENTRY.json {plan}/validate-work-pack.mjs {plan}/VALIDATION-RESULT.json {plan}/EXECUTION-ENTRY-VALIDATION.json",
    ]

    packages = {
        "public": build_package(
            "public", public, "arcanum/arcana/task-session", "public", public_commands
        ),
        "private": build_package(
            "private", private, "projects/domainspec-v2", "private", private_commands
        ),
    }

    for partition, package in packages.items():
        material_dir = RUN / "material" / partition
        package_path = material_dir / "MATERIAL-PACKAGE.json"
        if not args.finalize_handoffs:
            write_json(package_path, package)
            continue
        if json.loads(package_path.read_text(encoding="utf-8")) != package:
            raise SystemExit(f"current {partition} material package is stale")
        receipt_path = material_dir / "MATERIAL-RECEIPT.json"
        receipt_bytes = receipt_path.read_bytes()
        receipt = json.loads(receipt_bytes.decode("utf-8"))
        request = {
            "activationSource": "direct-user",
            "mutationMode": "apply-approved",
            "authoredPhaseStatus": "pass",
            "requestedHandoff": "ready",
            "expectedPackageId": package["package_id"],
            "expectedPackageDigest": canonical_digest(package),
            "expectedMaterialReceiptSha256": digest_bytes(receipt_bytes),
            "materialReceipt": receipt,
        }
        write_json(material_dir / "REFRESH-HANDOFF-REQUEST.json", request)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
