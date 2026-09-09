#!/usr/bin/env python3
"""Validate the bounded G-ARE-L0 promotion and its synchronized read models."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import yaml


RUN = Path(__file__).resolve().parent
ENGINE = RUN.parents[1]
REPO = ENGINE.parents[2]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    _, raw, _ = text.split("---", 2)
    return yaml.safe_load(raw)


def main() -> int:
    promotion = json.loads((RUN / "PROMOTION-RECEIPT.json").read_text())
    admissibility = json.loads(
        (RUN / "option-admissibility-receipt.json").read_text()
    )
    request = RUN / "option-admissibility-request.json"
    terminal = (
        REPO
        / "cyberAlchemy-v2/implementation/agent-reasoning-engine/generated/runs/"
        "evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json"
    )
    owner_receipt = (
        ENGINE
        / "refresh/2026-07-23-orchestrator-alignment/apply-approved/"
        "OWNER-RECEIPT.json"
    )

    assert promotion["result"] == "pass"
    assert promotion["selectedOptionId"] == "GAREL0-A-PROMOTE-BOUNDED"
    assert promotion["admissibility"]["routeOutcome"] == "gate"
    assert admissibility["routeOutcome"] == "gate"
    assert "GAREL0-A-PROMOTE-BOUNDED" in admissibility["admissibleOptionIds"]
    assert sha256(request) == promotion["admissibility"]["requestSha256"]
    assert sha256(RUN / "option-admissibility-receipt.json") == (
        promotion["admissibility"]["receiptSha256"]
    )
    assert sha256(terminal) == promotion["evidence"]["terminalReceiptSha256"]
    assert json.loads(terminal.read_text())["result"] == "pass"
    assert sha256(owner_receipt) == promotion["evidence"]["ownerRefreshReceiptSha256"]
    assert promotion["evidence"]["tests"] == {"passed": 16, "failed": 0}
    assert promotion["promotion"]["wholeEnginePromoted"] is False
    assert promotion["promotion"]["implementationAuthorized"] is False
    assert promotion["promotion"]["selectedSwu"] is None

    spec = frontmatter(ENGINE / "spec/SPEC.md")
    architecture = frontmatter(ENGINE / "design/ARCHITECTURE.md")
    work_pack = frontmatter(ENGINE / "planning/WORK-PACK.md")
    assert spec["status"] == "candidate-with-promoted-bounded-l0-witness"
    assert architecture["status"] == (
        "candidate-design-with-promoted-bounded-l0-witness"
    )
    assert work_pack["status"] == "l0-promoted-awaiting-aci-binding-design"
    assert work_pack["selected_swu"] == "none"
    assert work_pack["implementation_authorized"] is False

    checked_text = "\n".join(
        path.read_text(encoding="utf-8")
        for path in (
            ENGINE / "spec/SPEC.md",
            ENGINE / "design/ARCHITECTURE.md",
            ENGINE / "planning/WORK-PACK.md",
            ENGINE / "planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md",
            ENGINE / "planning/work-pack/waves/W0-L0.md",
            ENGINE / "CRAFT.md",
        )
    )
    assert "invoke:design ACI-REASONING-BINDING" in checked_text
    assert "promotion remains pending" not in checked_text
    assert "implementation_authorized: true" not in checked_text

    ledger_path = ENGINE / ".craft/ledger.yml"
    ledger = yaml.safe_load(ledger_path.read_text(encoding="utf-8"))
    index = json.loads((ENGINE / ".craft/index.json").read_text(encoding="utf-8"))
    assert ledger["contexts"][0]["stage"] == "post-l0-binding-design"
    assert ledger["indexes"]["active_blockers"] == ["BLK-ARE-ACI-BINDING-001"]
    assert ledger["indexes"]["open_decisions"] == []
    assert index["by_id"] == ledger["indexes"]["by_id"]
    assert index["metadata"]["ledger_sha256"] == sha256(ledger_path)
    assert index["active_blockers"] == ledger["indexes"]["active_blockers"]
    assert index["next_moves"] == ledger["indexes"]["next_moves"]

    inventory = json.loads(
        (REPO / ".arcanum/inventory/index.json").read_text(encoding="utf-8")
    )
    record = next(
        entry
        for entry in inventory["entries"]
        if entry["id"] == "agent-reasoning-engine-contract-strategy-result-synthesis"
    )
    assert "promoted bounded local L0 evaluator witness" in record["summary"]
    assert "whole-engine promotion" in record["summary"]

    print("G_ARE_L0_PROMOTION_VALIDATION=pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
