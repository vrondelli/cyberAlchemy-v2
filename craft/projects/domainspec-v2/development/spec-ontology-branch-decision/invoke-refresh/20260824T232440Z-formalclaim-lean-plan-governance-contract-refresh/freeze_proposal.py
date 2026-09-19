#!/usr/bin/env python3
"""Freeze deterministic inventories for the proposal-only Refresh package."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


RUN = Path(__file__).resolve().parent
EXCLUDED = {
    "PROPOSAL-MANIFEST.json",
    "CHANGED-BYTE-INVENTORY.json",
    "HELPER-RECEIPT.json",
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, separators=(",", ":"), sort_keys=True).encode()


def write(name: str, value: object) -> None:
    (RUN / name).write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")


def main() -> int:
    target_inventory = json.loads((RUN / "TARGET-INVENTORY.json").read_text())
    staged_targets = [
        {
            "path": item["path"],
            "sha256": item["after_sha256"],
            "size_bytes": item["after_size_bytes"],
        }
        for item in target_inventory["targets"]
    ]
    staged_package_digest = sha(canonical(staged_targets))

    entries = []
    for path in sorted(RUN.rglob("*")):
        if not path.is_file() or path.name in EXCLUDED or "__pycache__" in path.parts or path.suffix == ".pyc":
            continue
        data = path.read_bytes()
        entries.append(
            {
                "path": path.relative_to(RUN).as_posix(),
                "sha256": sha(data),
                "size_bytes": len(data),
            }
        )
    manifest = {
        "schema_version": "invoke.refresh-proposal-manifest/v1",
        "proposal_id": "DS-FORMALCLAIM-LEAN-EVF-PLAN-GOVERNANCE-REFRESH@20260824T232440Z",
        "accepted_plan_candidate_id": "DS-FORMALCLAIM-LEAN-EVF-PLAN@20260824T165704Z",
        "accepted_plan_package_digest": "e5e4b0727440b5e4d29f3be94a37388a0a4b9f85d9a627cc0d853b4aac24cd4e",
        "proposal_status": "flag",
        "proposal_only": True,
        "staged_target_count": len(staged_targets),
        "staged_targets": staged_targets,
        "staged_package_digest": staged_package_digest,
        "files": entries,
        "content_digest": sha(canonical(entries)),
        "authority_effect": "none",
        "mutation_ready": False,
    }
    write("PROPOSAL-MANIFEST.json", manifest)
    write(
        "CHANGED-BYTE-INVENTORY.json",
        {
            "schema_version": "invoke.refresh-changed-byte-inventory/v1",
            "write_scope": RUN.as_posix(),
            "preexisting_bytes_modified": [],
            "new_run_files": entries,
            "excluded_self_describing_files": sorted(EXCLUDED),
            "writes_outside_run_root": [],
            "accepted_plan_targets_modified": [],
            "authority_effect": "none",
        },
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
