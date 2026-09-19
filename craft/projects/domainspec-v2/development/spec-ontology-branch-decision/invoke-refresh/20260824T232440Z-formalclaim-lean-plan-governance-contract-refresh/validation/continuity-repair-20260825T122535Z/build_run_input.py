#!/usr/bin/env python3
"""Derive one run-local WPRA input with exact historical continuity evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


RUN = Path(__file__).resolve().parent
REPO = next(parent for parent in RUN.parents if (parent / ".git").exists())
SOURCE_CONFIG = RUN.parent / "input/audit-config.rebased.json"
TERMINAL_RECEIPT = Path(
    "projects/domainspec-v2/development/spec-ontology-branch-decision/evidence/"
    "formalclaim-lean-evf/SWU-FCL-001/RECEIPT.json"
)


def load(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def exact(relative: Path) -> dict[str, object]:
    content = (REPO / relative).read_bytes()
    return {
        "path": relative.as_posix(),
        "sha256": hashlib.sha256(content).hexdigest(),
        "size_bytes": len(content),
    }


def main() -> int:
    config = load(SOURCE_CONFIG)
    terminal = load(REPO / TERMINAL_RECEIPT)
    join = terminal["closeout_join"]
    joined = join["joined_owner_receipts"]
    if len(joined) != 1:
        raise RuntimeError("historical terminal receipt must contain one owner join")

    owner = joined[0]
    owner_receipt = Path(owner["receipt_ref"]["path"])
    owner_schema = owner_receipt.with_suffix(".schema.json")
    cursor_receipt = Path(join["continuation"]["cursor_ref"]["path"])
    if exact(owner_receipt) != owner["receipt_ref"]:
        raise RuntimeError("historical joined owner receipt tuple has drifted")
    if exact(cursor_receipt) != join["continuation"]["cursor_ref"]:
        raise RuntimeError("historical continuation cursor tuple has drifted")

    terminal_ref = exact(TERMINAL_RECEIPT)
    config["audit_id"] = (
        f"{config['audit_id']}-CONTINUITY-COMPAT-20260825T122535Z"
    )
    config["continuity_projection"]["completed_unit_receipt_refs"] = [
        {
            "binding_id": "completed-SWU-FCL-001",
            "owner_ref": "task-session",
            "artifact_ref": terminal_ref,
            "selector": "/result",
        }
    ]
    config["continuity_projection"]["joined_closeout_receipt_refs"] = [
        {
            "evidence_profile": "task-session-joined-owner-closeout-v1",
            "binding_id": "joined-closeout-SWU-FCL-001",
            "owner_ref": "task-session",
            "terminal_receipt_ref": terminal_ref,
            "joined_owner_receipt_ref": exact(owner_receipt),
            "owner_receipt_schema_ref": {
                "binding_id": "historical-owner-schema-SWU-FCL-001",
                "owner_ref": owner["owner_capability"],
                "artifact_ref": exact(owner_schema),
                "selector": "",
            },
            "continuation_cursor_ref": exact(cursor_receipt),
        }
    ]

    output = RUN / "audit-config.json"
    output.write_text(
        json.dumps(config, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
