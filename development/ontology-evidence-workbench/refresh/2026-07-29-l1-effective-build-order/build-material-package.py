#!/usr/bin/env python3
"""Build the deterministic material package for the 013B order repair."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def artifact(path: Path, root: Path) -> dict[str, object]:
    return {
        "path": str(path.resolve().relative_to(root.resolve())),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "size_bytes": path.stat().st_size,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--refresh", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--receipt", type=Path)
    parser.add_argument("--handoff-output", type=Path)
    args = parser.parse_args()

    if bool(args.receipt) != bool(args.handoff_output):
        parser.error("--receipt and --handoff-output must be supplied together")
    if args.receipt:
        receipt = json.loads(args.receipt.read_text())
        request = {
            "activationSource": "continuation",
            "mutationMode": "apply-approved",
            "authoredPhaseStatus": "pass",
            "requestedHandoff": "ready",
            "expectedPackageId": receipt["packageId"],
            "expectedPackageDigest": receipt["packageDigest"],
            "materialReceipt": receipt,
        }
        args.handoff_output.write_text(json.dumps(request, indent=2) + "\n")
        return 0

    root = args.root.resolve()
    refresh = args.refresh.resolve()
    stage = refresh / "staged"
    targets = sorted(path for path in stage.rglob("*") if path.is_file())
    target_paths = [str(path.relative_to(stage)) for path in targets]

    source_paths = [
        refresh / "context-pack.json",
        refresh / "DISTILL-VALIDATION.md",
        refresh / "DISPATCH.json",
        refresh / "DISPATCH-TECHNIQUE-TRACE.md",
        refresh / "lock-validation.json",
        refresh / "negative-probes.json",
        refresh / "frontier-regressions.json",
        refresh / "protected-before-apply.json",
        refresh / "protected-before-compare.json",
    ]
    sources = [
        {**artifact(path, root), "authority_class": "private"}
        for path in source_paths
    ]

    dependency_paths = {
        "SWU-OEW-013B-ATTEMPT-002": root
        / "cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/session-evidence/SWU-OEW-013B/attempt-002/receipt.json",
        "SWU-OEW-013B-BUILD-ATTEMPT-002": root
        / "cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/session-evidence/SWU-OEW-013B/attempt-002/build-attempt.json",
        "SWU-OEW-013B-ATTEMPT-002-CLOSEOUT": root
        / "cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/session-evidence/SWU-OEW-013B/attempt-002/closeout-refresh/refresh-receipt.json",
        "G-OEW-L1-FIRST-WORKING-VERSION-SELECTION": root
        / "cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/decisions/G-OEW-L1-FIRST-WORKING-VERSION-SELECTION/decision-receipt.json",
        "CURRENT-L1-BUILD-LOCK": root
        / "cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/L1-BUILD.lock.json",
        "PINNED-UPSTREAM-LOCK": root
        / "cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/UPSTREAM.lock.json",
        "PINNED-SOURCE-ARCHIVE": root
        / "cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/upstream/2cda14e89535049e49120198886bc0b82e9e630f/source.tar.gz",
        "REPAIRED-PRESELECTION-MANIFEST": refresh / "preselection/swu-manifest.json",
    }
    dependencies = [
        {
            "dependency_id": dependency_id,
            "artifact_ref": artifact(path, root),
        }
        for dependency_id, path in dependency_paths.items()
    ]

    changes = []
    inventory = []
    for target, target_path in zip(targets, target_paths, strict=True):
        changes.append(
            {
                "target_path": target_path,
                "operation": "update" if (root / target_path).exists() else "create",
                "output_ref": artifact(target, root),
            }
        )
        dependency_ids = [
            "SWU-OEW-013B-ATTEMPT-002",
            "SWU-OEW-013B-ATTEMPT-002-CLOSEOUT",
            "G-OEW-L1-FIRST-WORKING-VERSION-SELECTION",
            "CURRENT-L1-BUILD-LOCK",
        ]
        if target_path.endswith("/upstream/L1-BUILD.lock.json"):
            dependency_ids.extend(
                [
                    "SWU-OEW-013B-BUILD-ATTEMPT-002",
                    "PINNED-UPSTREAM-LOCK",
                    "PINNED-SOURCE-ARCHIVE",
                ]
            )
        if target_path.endswith(
            "/planning/work-pack/validation/L1-FIRST-WORKING-VERSION.frontier-readiness.json"
        ):
            dependency_ids.append("REPAIRED-PRESELECTION-MANIFEST")
        inventory.append(
            {
                "target_path": target_path,
                "lifecycle_owner": "ontology-evidence-workbench-plan-owner",
                "authority_class": "private",
                "publication_class": "private",
                "dependency_ids": dependency_ids,
            }
        )

    package = {
        "schema_version": "1.0.0",
        "package_id": "oew-l1-effective-build-order-refresh-20260729",
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": "ontology-evidence-workbench-plan-owner",
        "authority_class": "private",
        "publication_class": "private",
        "source_artifacts": sources,
        "changes": changes,
        "target_inventory": inventory,
        "dependencies": dependencies,
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": "ontology-evidence-workbench-plan-owner",
            "scope_paths": target_paths,
            "authority_classes": ["private"],
            "publication_classes": ["private"],
        },
        "validation_commands": [
            "validate strict context pack current digests, pinned archive members, and 8-of-8 obligation coverage",
            "validate serial private Dispatch Spec with no governed subagent execution",
            "record Distill skip for one exact indivisible repair",
            "validate L1-BUILD lock exact old/new binding, root/core/dashboard metadata, ignore-scripts preservation, command order, output evidence, negatives, ownership, and ceiling",
            "prove missing, drifted, skipped, failed, out-of-order, and missing-evidence core-build mutations all block",
            "regress unchanged frontier validator over preselection, post-013B, post-014, and post-014V ordered suffixes",
            "validate material package schema, staged digests, dependencies, owner, and publication boundaries",
            "verify eight live targets equal admitted staged bytes",
            "verify package.json SHA-256 remains a1719f598dd49f6a74413491ebc058e779de65691bc98d82854c1a5095f6d004",
            "verify protected set remains 12991 entries with digest 100134c4cb2f8ef71bcb0b4f9463c2bfc683a3ad4d844dd811979fb681ac97fa",
            "verify selected/current selector is SWU-OEW-013B and retry budget changes 5 to 6 with consumed sessions fixed at 3 and no selector expansion",
        ],
    }
    args.output.write_text(json.dumps(package, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
