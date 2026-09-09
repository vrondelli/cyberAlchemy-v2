#!/usr/bin/env python3
"""Apply one validated SWU-ARE-001 owner package byte-for-byte."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath


RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[5]


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def resolve(path_text: str) -> Path:
    path = PurePosixPath(path_text)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"unsafe path: {path_text}")
    resolved = (ROOT / path).resolve()
    resolved.relative_to(ROOT.resolve())
    return resolved


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner", choices=("invoke", "craft"), required=True)
    parser.add_argument("--prefix", default="")
    args = parser.parse_args()
    package = json.loads(
        (RUN / f"{args.prefix}{args.owner}-material-package.json").read_text()
    )
    handoff = json.loads(
        (RUN / f"{args.prefix}{args.owner}-handoff.json").read_text()
    )
    if package["lifecycle_owner"] != args.owner:
        raise ValueError("owner mismatch")
    if not handoff["mutationReady"] or handoff["handoffStatus"] != "ready":
        raise ValueError("handoff is not ready")
    dependencies = {
        item["dependency_id"]: item["artifact_ref"]
        for item in package["dependencies"]
    }
    inventory = {
        item["target_path"]: item for item in package["target_inventory"]
    }
    applied = []
    for change in package["changes"]:
        path = change["target_path"]
        dependency_id = inventory[path]["dependency_ids"][0]
        baseline = dependencies[dependency_id]
        target = resolve(path)
        current = target.read_bytes()
        if (
            digest(current) != baseline["sha256"]
            or len(current) != baseline["size_bytes"]
        ):
            raise ValueError(f"baseline drift: {path}")
        output_ref = change["output_ref"]
        output = resolve(output_ref["path"]).read_bytes()
        if (
            digest(output) != output_ref["sha256"]
            or len(output) != output_ref["size_bytes"]
        ):
            raise ValueError(f"output drift: {path}")
        target.write_bytes(output)
        applied.append(
            {
                "path": path,
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
        "openQuestionsRef": "../../../../../../../spec/"
        "SPEC.md#open-blockers--owner-decisions",
    }
    (RUN / f"{args.prefix}{args.owner}-apply-receipt.json").write_text(
        json.dumps(receipt, indent=2) + "\n"
    )
    print(f"APPLY=pass owner={args.owner} targets={len(applied)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
