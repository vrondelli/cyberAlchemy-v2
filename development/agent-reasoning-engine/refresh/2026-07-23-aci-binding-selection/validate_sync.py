#!/usr/bin/env python3
"""Validate staged or applied ACI binding option-A synchronization."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

import yaml


RUN = Path(__file__).resolve().parent
ROOT = next(parent for parent in RUN.parents if (parent / ".git").exists())
STAGED = RUN / "staging" / "outputs"
TARGET = Path("cyberAlchemy-v2/development/agent-reasoning-engine")


def root_for(surface: str) -> Path:
    return STAGED if surface == "staged" else ROOT


def check_links(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for raw in re.findall(r"\[[^\]]+\]\(([^)]+)\)", text):
        target = raw.split("#", 1)[0]
        if not target or "://" in target or target.startswith("["):
            continue
        staged_candidate = (path.parent / target).resolve()
        if staged_candidate.exists():
            continue
        if path.is_relative_to(STAGED):
            source_equivalent = ROOT / path.relative_to(STAGED)
            live_candidate = (source_equivalent.parent / target).resolve()
        else:
            live_candidate = staged_candidate
        if not live_candidate.exists():
            raise AssertionError(f"missing link target {path}: {raw}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--surface", choices=["staged", "target"], required=True)
    args = parser.parse_args()
    base = root_for(args.surface)
    target = base / TARGET

    receipt = json.loads(
        (target / "design/aci-reasoning-binding/DESIGN-RECEIPT.json").read_text()
    )
    assert receipt["status"] == "pass"
    assert receipt["claim_ceiling"]["binding_accepted"] is True
    assert receipt["claim_ceiling"]["aci_compatible"] is False
    assert receipt["claim_ceiling"]["implementation_authorized"] is False
    assert receipt["claim_ceiling"]["selected_swu"] is None
    assert receipt["next_route"].startswith("invoke:plan")

    binding = (target / "design/aci-reasoning-binding/ARCHITECTURE.md").read_text()
    assert "accepted-aci-subordinate-with-external-gates" in binding
    assert "ACI-subordinate target" in binding
    assert "do not select" in binding

    work_pack = (target / "planning/WORK-PACK.md").read_text()
    assert "status: aci-binding-selected-awaiting-plan-revision" in work_pack
    assert "BLK-ARE-ACI-BINDING-001 | resolved" in work_pack
    assert "BLK-ARE-ACI-MATURITY-001" in work_pack
    assert "selected_swu: none" in work_pack
    assert "implementation_authorized: false" in work_pack

    ledger_path = target / ".craft/ledger.yml"
    ledger_bytes = ledger_path.read_bytes()
    ledger = yaml.safe_load(ledger_bytes)
    assert ledger["indexes"]["active_blockers"] == ["BLK-ARE-ACI-MATURITY-001"]
    assert ledger["indexes"]["open_decisions"] == []
    assert ledger["indexes"]["blocking_decisions"] == []
    assert ledger["contexts"][0]["stage"] == "aci-binding-selected-plan-revision"
    decisions = {row["decision_id"]: row for row in ledger["decisions"]}
    assert decisions["DEC-ARE-ACI-BINDING"]["selected_option"] == "ACI-subordinate target"
    assert decisions["DEC-ARE-ACI-BINDING"]["status"] == "closed"
    blockers = {row["item_id"]: row for row in ledger["typed_items"]}
    assert blockers["BLK-ARE-ACI-BINDING-001"]["status"] == "resolved"
    assert blockers["BLK-ARE-ACI-MATURITY-001"]["status"] == "active"

    index = json.loads((target / ".craft/index.json").read_text())
    assert index["metadata"]["ledger_sha256"] == hashlib.sha256(ledger_bytes).hexdigest()
    assert index["by_id"] == ledger["indexes"]["by_id"]
    assert index["active_blockers"] == ledger["indexes"]["active_blockers"]
    assert index["next_moves"] == ledger["indexes"]["next_moves"]
    assert index["artifacts_by_path"] == ledger["indexes"]["artifacts_by_path"]

    craft = (target / "CRAFT.md").read_text()
    assert "Closed ACI binding decision" in craft
    assert "Active external maturity blocker" in craft
    assert "No downstream SWU is authorized" in craft

    for path in target.rglob("*"):
        if path.suffix == ".json":
            json.loads(path.read_text(encoding="utf-8"))
    for relative in [
        "spec/SPEC.md",
        "design/ARCHITECTURE.md",
        "design/aci-reasoning-binding/ARCHITECTURE.md",
        "design/aci-reasoning-binding/DESIGN-TRANSPORT.md",
        "planning/WORK-PACK.md",
        "CRAFT.md",
    ]:
        check_links(target / relative)
    print(f"ACI_BINDING_SYNC_VALIDATION=pass surface={args.surface}")


if __name__ == "__main__":
    main()
