#!/usr/bin/env python3
"""Validate staged or applied orchestrator-alignment refresh surfaces."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import yaml


RUN = Path(__file__).resolve().parent
REPO = RUN.parents[5]
STAGED = RUN / "staging" / "outputs"

TARGETS = [
    "cyberAlchemy-v2/development/agent-reasoning-engine/spec/SPEC.md",
    "cyberAlchemy-v2/development/agent-reasoning-engine/design/ARCHITECTURE.md",
    "cyberAlchemy-v2/development/agent-reasoning-engine/planning/WORK-PACK.md",
    "cyberAlchemy-v2/development/agent-reasoning-engine/planning/work-pack/tasks/TASK-ARE-PROTOCOL-001.md",
    "cyberAlchemy-v2/development/agent-reasoning-engine/planning/work-pack/tasks/TASK-ARE-GOVERNANCE-001.md",
    "cyberAlchemy-v2/development/agent-reasoning-engine/planning/work-pack/waves/W1-L1.md",
    "cyberAlchemy-v2/development/agent-reasoning-engine/.craft/ledger.yml",
    "cyberAlchemy-v2/development/agent-reasoning-engine/.craft/index.json",
    "cyberAlchemy-v2/development/agent-reasoning-engine/CRAFT.md",
    ".arcanum/inventory/entries/agent-reasoning-engine-contract-strategy-result-synthesis.md",
    ".arcanum/inventory/entries/cyberalchemy-orchestrator-reasoning-engine-purpose-strategy-result-synthesis.md",
    ".arcanum/inventory/index.md",
    ".arcanum/inventory/index.json",
    ".arcanum/inventory/log.md",
]

EXTERNAL_DIGESTS = {
    "projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/adrs/ADR-001-persistence-replay-and-canonical-contracts.md":
        "2add074d6895e571230ba80e530cf37698870bd219f1e0202d417a65c6392fed",
    "projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/WORK-PACK.md":
        "873a601e029676fecde92896f15d4b6e78c4d48162b658448debb29dd24e7631",
    "projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/discovery/bus-contracts/README.md":
        "70d587a0f5252d44dabe42cfc030e0e41730bf3c9d6e920908be2b2625c517d6",
    "projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/discovery/spec-integration-assessment/avaliacao-independente-publication-bridge.md":
        "a98d51f4b4990cc82a962b836d96dbcabf4183926e889c518d668db99508622f",
    "projects/cyberalchemy-orchestrator/docs/features/agents-communication-infra/discovery/agents-communication-protocols/README.md":
        "e365aa804f82b280c13b12a48e69931c103ab736db632a5c5070f621e6d3f02a",
    "projects/cyberalchemy-orchestrator/docs/features/agent-provenance-telemetry/WORK-PACK.md":
        "f8808a276ab3413f9b12d4f90f90a101c6826ec4d55852e363498786df56abc4",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(f"missing frontmatter: {path}")
    _, raw, _ = text.split("---", 2)
    return yaml.safe_load(raw)


def validate(surface: str) -> None:
    base = STAGED if surface == "staging" else REPO
    engine = base / "cyberAlchemy-v2/development/agent-reasoning-engine"
    inventory = base / ".arcanum/inventory"

    spec = (engine / "spec/SPEC.md").read_text(encoding="utf-8")
    architecture = (engine / "design/ARCHITECTURE.md").read_text(encoding="utf-8")
    work_pack = (engine / "planning/WORK-PACK.md").read_text(encoding="utf-8")
    protocol = (
        engine / "planning/work-pack/tasks/TASK-ARE-PROTOCOL-001.md"
    ).read_text(encoding="utf-8")
    governance = (
        engine / "planning/work-pack/tasks/TASK-ARE-GOVERNANCE-001.md"
    ).read_text(encoding="utf-8")
    wave = (engine / "planning/work-pack/waves/W1-L1.md").read_text(encoding="utf-8")

    assert "status: candidate-with-bounded-l0-witness" in spec
    assert "WITNESSED LOCAL CANDIDATE; G-ARE-L0 promotion pending" in spec
    assert "whole-engine implementation, promotion, effect" in spec
    assert "status: candidate-design-with-bounded-l0-witness" in architecture
    assert "ARE-DES-008" in architecture
    assert "These are comparison evidence, not imported authority" in architecture
    assert "status: l0-witness-complete-awaiting-explicit-promotion" in work_pack
    assert "selected_swu: none" in work_pack
    assert "implementation_authorized: false" in work_pack
    assert "BLK-ARE-ACI-BINDING-001" in work_pack
    assert "BLK-ARE-ACI-MATURITY-001" in work_pack
    assert "invoke:design ACI-REASONING-BINDING" in work_pack
    assert "Neither SWU is ready or selected" in protocol
    assert "AtomicFileRecordStore" in governance
    assert "cannot satisfy packaging or ACI" in wave

    ledger_path = engine / ".craft/ledger.yml"
    ledger = yaml.safe_load(ledger_path.read_text(encoding="utf-8"))
    craft_index = json.loads((engine / ".craft/index.json").read_text(encoding="utf-8"))
    craft_view = (engine / "CRAFT.md").read_text(encoding="utf-8")
    assert ledger["indexes"]["active_blockers"] == ["BLK-ARE-ACI-BINDING-001"]
    assert craft_index["active_blockers"] == ledger["indexes"]["active_blockers"]
    assert craft_index["by_id"] == ledger["indexes"]["by_id"]
    assert craft_index["metadata"]["ledger_sha256"] == sha256(ledger_path)
    assert craft_index["stale_status"] == "fresh"
    assert "Active ACI binding blocker" in craft_view
    assert "does not establish a general" in craft_view

    inventory_index = json.loads((inventory / "index.json").read_text(encoding="utf-8"))
    records = {entry["id"]: entry for entry in inventory_index["entries"]}
    contract_id = "agent-reasoning-engine-contract-strategy-result-synthesis"
    purpose_id = (
        "cyberalchemy-orchestrator-reasoning-engine-purpose-strategy-result-synthesis"
    )
    for entry_id in (contract_id, purpose_id):
        assert records[entry_id]["updated"] == "2026-07-23"
        assert str(
            frontmatter(inventory / records[entry_id]["path"])["updated"]
        ) == "2026-07-23"
    assert "bounded local L0 evaluator witness" in records[contract_id]["summary"]
    assert "no integrated reasoning runtime" in records[purpose_id]["summary"]
    index_md = (inventory / "index.md").read_text(encoding="utf-8")
    assert records[contract_id]["summary"] in index_md
    assert records[purpose_id]["summary"] in index_md
    assert "reasoning-engine and orchestrator alignment" in (
        inventory / "log.md"
    ).read_text(encoding="utf-8")

    receipt = (
        REPO
        / "cyberAlchemy-v2/implementation/agent-reasoning-engine/generated/runs/"
        "evaluator-v1-20260723T-session-001/TERMINAL-RECEIPT.json"
    )
    assert sha256(receipt) == (
        "5f622b2a70ef549f9ae545c0152371032cad1a6a5021a3a74ceae96c0d0da6a9"
    )
    assert json.loads(receipt.read_text(encoding="utf-8"))["result"] == "pass"
    for relative, expected in EXTERNAL_DIGESTS.items():
        assert sha256(REPO / relative) == expected, f"source drift: {relative}"
    remote = subprocess.check_output(
        [
            "git",
            "-C",
            str(REPO / "projects/cyberalchemy-orchestrator"),
            "rev-parse",
            "origin/master",
        ],
        text=True,
    ).strip()
    assert remote == "6e5936b6d02f4d10c10d215d51a588b5520aa57f"

    if surface == "target":
        for relative in TARGETS:
            assert (REPO / relative).read_bytes() == (STAGED / relative).read_bytes(), (
                f"applied target differs from staged output: {relative}"
            )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--surface", choices=("staging", "target"), required=True)
    args = parser.parse_args()
    validate(args.surface)
    print(f"SYNC_VALIDATION=pass surface={args.surface}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
