#!/usr/bin/env python3
"""Regenerate staged Craft and Inventory projections for the approved refresh."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import yaml


RUN = Path(__file__).resolve().parent
OUTPUTS = RUN / "staging" / "outputs"
CRAFT_ROOT = (
    OUTPUTS
    / "cyberAlchemy-v2/development/agent-reasoning-engine"
)
INVENTORY_ROOT = OUTPUTS / ".arcanum/inventory"
GENERATED_AT_CRAFT = "2026-07-23T04:18:23-03:00"
GENERATED_AT_INVENTORY = "2026-07-23T07:18:23Z"

NEW_ARTIFACTS = [
    ("ART-ARE-ORCHESTRATOR-REMOTE", 11),
    ("ART-ARE-ACI-ADR-001", 12),
    ("ART-ARE-ACI-WORK-PACK", 13),
    ("ART-ARE-BUS-ASSESSMENT", 14),
    ("ART-ARE-APT-WORK-PACK", 15),
]
NEW_BLOCKER = "BLK-ARE-ACI-BINDING-001"


def append_unique(values: list[str], *items: str) -> None:
    for item in items:
        if item not in values:
            values.append(item)


def regenerate_craft_index() -> None:
    ledger_path = CRAFT_ROOT / ".craft/ledger.yml"
    index_path = CRAFT_ROOT / ".craft/index.json"
    ledger_bytes = ledger_path.read_bytes()
    ledger = yaml.safe_load(ledger_bytes)
    index = json.loads(index_path.read_text(encoding="utf-8"))

    index["metadata"].update(
        {
            "ledger_sha256": hashlib.sha256(ledger_bytes).hexdigest(),
            "generated_at": GENERATED_AT_CRAFT,
            "generator_version": "invoke-refresh-apply/1",
        }
    )
    index["by_id"] = ledger["indexes"]["by_id"]
    for artifact_id, row_index in NEW_ARTIFACTS:
        append_unique(index["by_family"]["artifacts"], artifact_id)
        index["row_selectors"][artifact_id] = {
            "family": "artifacts",
            "row_id": artifact_id,
            "path": ".craft/ledger.yml",
            "index": row_index,
        }
    append_unique(index["by_family"]["typed_items"], NEW_BLOCKER)
    index["row_selectors"][NEW_BLOCKER] = {
        "family": "typed_items",
        "row_id": NEW_BLOCKER,
        "path": ".craft/ledger.yml",
        "index": 3,
    }

    index["active_blockers"] = ledger["indexes"]["active_blockers"]
    index["active_gaps"] = ledger["indexes"]["active_gaps"]
    index["next_moves"] = ledger["indexes"]["next_moves"]
    index["pending_by_node"][0].update(
        {
            "status": "flag",
            "blockers": ledger["indexes"]["active_blockers"],
            "gaps": ledger["indexes"]["active_gaps"],
            "next_move": ledger["indexes"]["next_moves"][0]["next_move"],
        }
    )
    index["artifacts_by_path"] = ledger["indexes"]["artifacts_by_path"]

    context_refs = index["references"]["CTX-ARE-ROOT"]
    context_reverse = index["reverse_links"]["CTX-ARE-ROOT"]
    for artifact_id, _ in NEW_ARTIFACTS:
        append_unique(context_refs, artifact_id)
        append_unique(context_reverse, artifact_id)
    append_unique(context_refs, NEW_BLOCKER)
    append_unique(context_reverse, NEW_BLOCKER)

    blocker_refs = [
        "ART-ARE-ACI-ADR-001",
        "ART-ARE-ACI-WORK-PACK",
        "ART-ARE-BUS-ASSESSMENT",
        "ART-ARE-APT-WORK-PACK",
    ]
    index["references"][NEW_BLOCKER] = blocker_refs
    index["reverse_links"][NEW_BLOCKER] = ["CTX-ARE-ROOT"]
    for artifact_id in blocker_refs:
        reverse = index["reverse_links"].setdefault(artifact_id, [])
        append_unique(reverse, "CTX-ARE-ROOT", NEW_BLOCKER)
    index["evidence_refs"].setdefault("ART-ARE-ACI-ADR-001", [])
    append_unique(index["evidence_refs"]["ART-ARE-ACI-ADR-001"], NEW_BLOCKER)
    index["stale_status"] = "fresh"

    if index["by_id"] != ledger["indexes"]["by_id"]:
        raise ValueError("Craft by_id projection differs from ledger")
    if index["active_blockers"] != [NEW_BLOCKER]:
        raise ValueError("Craft active blocker projection differs from ledger")
    index_path.write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def regenerate_inventory_index() -> None:
    index_path = INVENTORY_ROOT / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    updates = {
        "agent-reasoning-engine-contract-strategy-result-synthesis": {
            "summary": (
                "Accepted research contract now has a bounded local L0 evaluator "
                "witness; whole-engine promotion, higher runtime, real effects, "
                "ACI binding, and anti-bias efficacy remain absent."
            ),
            "updated": "2026-07-23",
            "residue": [
                "whole-engine-promotion-absent",
                "higher-layer-actor-runtime-and-real-effect-absent",
                "aci-reasoning-binding-unresolved",
                "anti-bias-vector-dimensions-and-efficacy-unwitnessed",
                "installed-register-dispatch-appender-projection-stale",
            ],
        },
        "cyberalchemy-orchestrator-reasoning-engine-purpose-strategy-result-synthesis": {
            "summary": (
                "Frozen ca560b8 classification remains historically valid; "
                "origin/master@6e5936b adds accepted ACI W0 decisions and "
                "candidate Bus/ACP/APT seams, but no integrated reasoning runtime."
            ),
            "updated": "2026-07-23",
            "residue": [
                "init-tension-gate-double-pass-chat-only-no-durable-gate-artifact",
                "api-ui-and-agent-pool-checks-skipped-for-missing-dependencies",
                "aci-runtime-blocked",
                "bus-no-post-remediation-pass",
                "acp-discovery-only",
                "apt-mutation-blocked",
                "object-level-whole-engine-integration-unbuilt",
            ],
        },
    }
    found: set[str] = set()
    for entry in index["entries"]:
        entry_id = entry["id"]
        if entry_id in updates:
            entry.update(updates[entry_id])
            found.add(entry_id)
    if found != set(updates):
        raise ValueError(f"Inventory projection targets missing: {set(updates) - found}")
    index["generated_at"] = GENERATED_AT_INVENTORY
    index_path.write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    regenerate_craft_index()
    regenerate_inventory_index()
    print("PROJECTION_MATERIALIZATION=pass")


if __name__ == "__main__":
    main()
