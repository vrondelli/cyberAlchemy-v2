#!/usr/bin/env python3
"""Build the deterministic Invoke material package from the staged target tree."""

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
            "activationSource": "direct-user",
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
    ]
    sources = [
        {**artifact(path, root), "authority_class": "private"}
        for path in source_paths
    ]
    changes = []
    inventory = []
    for target, target_path in zip(targets, target_paths, strict=True):
        output_ref = artifact(target, root)
        changes.append(
            {
                "target_path": target_path,
                "operation": "update" if (root / target_path).exists() else "create",
                "output_ref": output_ref,
            }
        )
        inventory.append(
            {
                "target_path": target_path,
                "lifecycle_owner": "ontology-evidence-workbench-plan-owner",
                "authority_class": "private",
                "publication_class": "private",
                "dependency_ids": [],
            }
        )

    package = {
        "schema_version": "1.0.0",
        "package_id": "oew-first-working-version-refresh-20260728",
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": "ontology-evidence-workbench-plan-owner",
        "authority_class": "private",
        "publication_class": "private",
        "source_artifacts": sources,
        "changes": changes,
        "target_inventory": inventory,
        "dependencies": [],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": "ontology-evidence-workbench-plan-owner",
            "scope_paths": target_paths,
            "authority_classes": ["private"],
            "publication_classes": ["private"],
        },
        "validation_commands": [
            "validate strict context pack current digests and 7-of-7 obligation coverage",
            "validate Dispatch Spec and Standard Distill two-round reconciliation",
            "validate material package schema, staged digests, owner, and publication boundaries",
            "verify four-unit L1 frontier, dependency order, zero selection, and exact target ownership",
            "verify one package root and ten command-to-entrypoint bindings",
            "verify completed 006P and 007 predecessors and preserved blocked 008 history",
            "verify open Decision Gate has two structurally admissible options",
            "verify applied live targets equal all 24 staged artifacts byte-for-byte",
            "verify implementation package.json preimage remains unchanged",
        ],
    }
    args.output.write_text(json.dumps(package, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
