#!/usr/bin/env python3
"""Validate the Financial Settlement Task Session closeout projection."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORK_PACK = ROOT / "WORK-PACK.md"
EVIDENCE = ROOT / "INVOKE-EVIDENCE.json"
ORDER = [
    "SWU-FSTG-001",
    "SWU-FSTG-002",
    "SWU-FSTG-003",
    "SWU-FSTG-004",
    "SWU-FSTG-VERIFY",
]


def main() -> int:
    text = WORK_PACK.read_text(encoding="utf-8")
    evidence = json.loads(EVIDENCE.read_text(encoding="utf-8"))
    closeout = evidence["task_session_closeout"]
    errors: list[str] = []

    if "| closeoutSyncStatus | pass |" not in text:
        errors.append("work-pack closeoutSyncStatus is not pass")
    selected_match = re.search(r"^\| selectedSWU \| ([^|]+) \|$", text, re.MULTILINE)
    selected = selected_match.group(1).strip() if selected_match else None
    if selected != closeout.get("selected_swu"):
        errors.append("work-pack and Invoke evidence selected SWU disagree")

    completed = [item["swu_id"] for item in closeout.get("completed_swus", [])]
    if completed != ORDER[: len(completed)]:
        errors.append("completed SWUs are not an ordered prefix")
    expected_selected = ORDER[len(completed)] if len(completed) < len(ORDER) else None
    if selected != expected_selected:
        errors.append("selected SWU is not the next unit after the completed prefix")

    for index, swu_id in enumerate(ORDER):
        if f"| {swu_id} |" not in text:
            errors.append(f"missing closeout contract row for {swu_id}")
        section_match = re.search(
            rf"^### {re.escape(swu_id)} .*?(?=^### |^## |\Z)",
            text,
            re.MULTILINE | re.DOTALL,
        )
        if not section_match:
            errors.append(f"missing manifest section for {swu_id}")
            continue
        section = section_match.group(0)
        if index < len(completed) and "- Status: completed" not in section:
            errors.append(f"{swu_id} is not marked completed")
        elif swu_id == selected and "- Status: selected and dependency-ready." not in section:
            errors.append(f"{swu_id} is not marked selected")
        elif index > len(completed) and "- Status: blocked-by-dependency." not in section:
            errors.append(f"{swu_id} is not marked blocked-by-dependency")

    if closeout.get("owner_route") != "invoke:refresh:apply-approved":
        errors.append("closeout owner route drift")
    if closeout.get("status") != "pass":
        errors.append("closeout evidence status is not pass")

    if errors:
        for error in errors:
            print(f"FAIL {error}")
        print(f"RESULT passed=0 failed={len(errors)}")
        return 1
    print(f"RESULT passed={len(ORDER) + 5} failed=0")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
