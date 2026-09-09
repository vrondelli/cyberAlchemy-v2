#!/usr/bin/env python3
"""Apply one ready owner-scoped material package byte-for-byte."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath


RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[2]


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def resolve(relative_path: str) -> Path:
    path = PurePosixPath(relative_path)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"unsafe path: {relative_path}")
    target = (ROOT / path).resolve()
    target.relative_to(ROOT.resolve())
    return target


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner", choices=("invoke", "craft"), required=True)
    args = parser.parse_args()

    package = json.loads(
        (RUN / f"{args.owner}-material-package.json").read_text(encoding="utf-8")
    )
    handoff = json.loads(
        (RUN / f"{args.owner}-handoff.json").read_text(encoding="utf-8")
    )
    if package["lifecycle_owner"] != args.owner:
        raise ValueError("package owner mismatch")
    if not handoff["mutationReady"] or handoff["handoffStatus"] != "ready":
        raise ValueError("material handoff is not ready")
    if handoff["materialPackage"]["packageId"] != package["package_id"]:
        raise ValueError("package identity mismatch")

    dependencies = {
        item["dependency_id"]: item["artifact_ref"]
        for item in package["dependencies"]
    }
    inventory = {
        item["target_path"]: item for item in package["target_inventory"]
    }
    applied = []
    for change in package["changes"]:
        target_path = change["target_path"]
        target = resolve(target_path)
        target_inventory = inventory[target_path]
        if target_inventory["lifecycle_owner"] != args.owner:
            raise ValueError(f"target owner mismatch: {target_path}")
        dependency_id = target_inventory["dependency_ids"][0]
        baseline = dependencies[dependency_id]
        current = target.read_bytes()
        if digest(current) != baseline["sha256"] or len(current) != baseline["size_bytes"]:
            raise ValueError(f"target baseline drift: {target_path}")

        output_ref = change["output_ref"]
        staged = resolve(output_ref["path"])
        output = staged.read_bytes()
        if digest(output) != output_ref["sha256"] or len(output) != output_ref["size_bytes"]:
            raise ValueError(f"staged output drift: {target_path}")
        target.write_bytes(output)
        applied.append(
            {
                "path": target_path,
                "owner": args.owner,
                "sha256": digest(output),
                "size_bytes": len(output),
            }
        )

    receipt = {
        "schemaVersion": "1.0.0",
        "owner": args.owner,
        "packageId": package["package_id"],
        "packageDigest": handoff["materialPackage"]["packageDigest"],
        "status": "pass",
        "applied": applied,
    }
    (RUN / f"{args.owner}-apply-receipt.json").write_text(
        json.dumps(receipt, indent=2) + "\n", encoding="utf-8"
    )
    print(f"APPLY=pass owner={args.owner} targets={len(applied)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
