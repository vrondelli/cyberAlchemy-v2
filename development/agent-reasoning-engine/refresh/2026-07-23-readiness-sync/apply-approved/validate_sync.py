#!/usr/bin/env python3
"""Validate staged or applied readiness synchronization surfaces."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import yaml


RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[2]


def sha256_path(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--surface", choices=("staging", "target"), required=True)
    args = parser.parse_args()
    base = (
        RUN / "staging" / "outputs"
        if args.surface == "staging"
        else ROOT
    )

    work_pack = (base / "planning/WORK-PACK.md").read_text(encoding="utf-8")
    task = (
        base / "planning/work-pack/tasks/TASK-ARE-READINESS-001.md"
    ).read_text(encoding="utf-8")
    ledger_text = (base / ".craft/ledger.yml").read_text(encoding="utf-8")
    ledger = yaml.safe_load(ledger_text)
    index = json.loads((base / ".craft/index.json").read_text(encoding="utf-8"))
    craft_view = (base / "CRAFT.md").read_text(encoding="utf-8")

    assert (
        "status: planned-policy-ready-awaiting-explicit-implementation-authorization"
        in work_pack
    )
    assert "implementation_authorized: false" in work_pack
    assert "selected, ready-awaiting-explicit-authorization" in work_pack
    assert "| TASK-ARE-READINESS-001 | pre-L0 | completed |" in work_pack
    assert "Status: **completed**." in task
    assert "No evaluator code or implementation evidence was created" in task

    context = ledger["contexts"][0]
    assert context["stage"] == "plan"
    assert context["gate"] == "pass"
    assert ledger["indexes"]["active_blockers"] == []
    assert len(ledger["indexes"]["active_gaps"]) == 6
    assert (
        ledger["indexes"]["artifacts_by_path"][
            "decisions/implementation-readiness/session-evidence/"
            "TASK-ARE-READINESS-001-RECEIPT.json"
        ]
        == "ART-ARE-READINESS-RECEIPT"
    )
    for item in ledger["typed_items"]:
        assert item["status"] == "resolved"
        assert item["refinement_status"] == "resolved"
        assert item["requires_human"] is False
        assert item["evidence"] == "ART-ARE-READINESS-RECEIPT"

    assert index["metadata"]["ledger_sha256"] == sha256_path(
        base / ".craft/ledger.yml"
    )
    assert index["stale_status"] == "fresh"
    assert index["active_blockers"] == []
    assert index["active_gaps"] == ledger["indexes"]["active_gaps"]
    assert index["by_id"] == ledger["indexes"]["by_id"]
    assert index["pending_by_node"][0]["status"] == "flag"
    assert index["pending_by_node"][0]["blockers"] == []

    assert "**Stage / gate:** `plan` / `pass`" in craft_view
    assert "- Active blockers: none" in craft_view
    assert "`SWU-ARE-001` is ready but remains unauthorized" in craft_view
    assert "GAP-ARE-SEMANTIC-WITNESS" in craft_view

    if args.surface == "target":
        for relative_path in (
            "planning/WORK-PACK.md",
            "planning/work-pack/tasks/TASK-ARE-READINESS-001.md",
            ".craft/ledger.yml",
            ".craft/index.json",
            "CRAFT.md",
        ):
            assert (ROOT / relative_path).read_bytes() == (
                RUN / "staging" / "outputs" / relative_path
            ).read_bytes(), f"applied target differs from staged output: {relative_path}"

    print(f"SYNC_VALIDATION=pass surface={args.surface}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
