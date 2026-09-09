#!/usr/bin/env python3
"""Validate staged or applied SWU-ARE-001 lifecycle synchronization."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import yaml


RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[5]
TARGETS = [
    "planning/WORK-PACK.md",
    "planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md",
    "planning/work-pack/waves/W0-L0.md",
    ".craft/ledger.yml",
    ".craft/index.json",
    "CRAFT.md",
]


def digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--surface", choices=("staging", "target"), required=True)
    args = parser.parse_args()
    base = RUN / "staging" / "outputs" if args.surface == "staging" else ROOT
    data = {path: (base / path).read_bytes() for path in TARGETS}
    work_pack = data["planning/WORK-PACK.md"].decode()
    task = data[
        "planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md"
    ].decode()
    wave = data["planning/work-pack/waves/W0-L0.md"].decode()
    ledger_text = data[".craft/ledger.yml"].decode()
    ledger = yaml.safe_load(ledger_text)
    index = json.loads(data[".craft/index.json"])
    craft = data["CRAFT.md"].decode()

    checks = {
        "work-pack-completed": (
            "status: l0-witness-complete-awaiting-explicit-promotion"
            in work_pack
            and "selected_swu: none" in work_pack
            and "last_completed_swu: SWU-ARE-001" in work_pack
        ),
        "no-downstream-authorization": (
            "implementation_authorized: false" in work_pack
            and "No further SWU is selected" in work_pack
        ),
        "task-completed": (
            "Status: **completed; G-ARE-L0 promotion pending**." in task
        ),
        "wave-stops-at-promotion": (
            "condition is evidenced but not promoted" in wave
        ),
        "semantic-gap-closed": (
            "GAP-ARE-SEMANTIC-WITNESS"
            not in ledger["indexes"]["active_gaps"]
            and next(
                item
                for item in ledger["gaps"]
                if item["gap_id"] == "GAP-ARE-SEMANTIC-WITNESS"
            )["status"]
            == "closed"
        ),
        "witness-artifact-indexed": (
            ledger["indexes"]["by_id"]["ART-ARE-L0-WITNESS-RECEIPT"]
            == "artifacts[10]"
            and index["by_id"] == ledger["indexes"]["by_id"]
        ),
        "index-ledger-digest": (
            index["metadata"]["ledger_sha256"]
            == digest(ledger_text.encode())
        ),
        "index-active-gaps": (
            index["active_gaps"] == ledger["indexes"]["active_gaps"]
        ),
        "craft-claim-ceiling": (
            "It does not establish a general" in craft
            and "No downstream SWU is authorized" in craft
        ),
        "open-questions": (
            "## Open Questions" in task
            and "## Open Questions" in wave
            and "## Open Questions" in craft
        ),
    }
    if args.surface == "target":
        for path in TARGETS:
            staged = (RUN / "staging" / "outputs" / path).read_bytes()
            checks[f"byte-parity:{path}"] = data[path] == staged
    failures = [name for name, passed in checks.items() if not passed]
    print(json.dumps({"surface": args.surface, "checks": checks}, indent=2))
    if failures:
        raise SystemExit(f"validation failures: {', '.join(failures)}")
    print(f"VALIDATION=pass surface={args.surface}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
