#!/usr/bin/env python3
"""Regenerate the scoped Craft index after bounded L0 promotion."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import yaml


RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[1]
LEDGER = ROOT / ".craft/ledger.yml"
INDEX = ROOT / ".craft/index.json"
PROMOTION_ARTIFACT = "ART-ARE-L0-PROMOTION-RECEIPT"
PROMOTION_DECISION = "DEC-ARE-L0-PROMOTION"


def append_unique(values: list[str], *items: str) -> None:
    for item in items:
        if item not in values:
            values.append(item)


def remove_values(values: list[str], *items: str) -> list[str]:
    blocked = set(items)
    return [item for item in values if item not in blocked]


def main() -> None:
    ledger_bytes = LEDGER.read_bytes()
    ledger = yaml.safe_load(ledger_bytes)
    index = json.loads(INDEX.read_text(encoding="utf-8"))

    index["metadata"].update(
        {
            "ledger_sha256": hashlib.sha256(ledger_bytes).hexdigest(),
            "generated_at": "2026-07-23T16:13:07-03:00",
            "generator_version": "decision-gate-promotion/1",
        }
    )
    index["by_id"] = ledger["indexes"]["by_id"]
    append_unique(index["by_family"]["artifacts"], PROMOTION_ARTIFACT)
    append_unique(index["by_family"]["decisions"], PROMOTION_DECISION)
    index["row_selectors"][PROMOTION_ARTIFACT] = {
        "family": "artifacts",
        "row_id": PROMOTION_ARTIFACT,
        "path": ".craft/ledger.yml",
        "index": 16,
    }
    index["row_selectors"][PROMOTION_DECISION] = {
        "family": "decisions",
        "row_id": PROMOTION_DECISION,
        "path": ".craft/ledger.yml",
        "index": 1,
    }
    index["active_blockers"] = ledger["indexes"]["active_blockers"]
    index["active_gaps"] = ledger["indexes"]["active_gaps"]
    index["next_moves"] = ledger["indexes"]["next_moves"]
    index["artifacts_by_path"] = ledger["indexes"]["artifacts_by_path"]
    index["pending_by_node"][0].update(
        {
            "status": "flag",
            "blockers": ledger["indexes"]["active_blockers"],
            "gaps": ledger["indexes"]["active_gaps"],
            "next_move": ledger["indexes"]["next_moves"][0]["next_move"],
        }
    )

    append_unique(
        index["references"]["CTX-ARE-ROOT"],
        PROMOTION_ARTIFACT,
        PROMOTION_DECISION,
    )
    append_unique(
        index["reverse_links"]["CTX-ARE-ROOT"],
        PROMOTION_ARTIFACT,
        PROMOTION_DECISION,
    )
    index["references"][PROMOTION_DECISION] = [
        PROMOTION_ARTIFACT,
        "ART-ARE-L0-WITNESS-RECEIPT",
    ]
    index["reverse_links"]["ART-ARE-L0-WITNESS-RECEIPT"] = remove_values(
        index["reverse_links"]["ART-ARE-L0-WITNESS-RECEIPT"],
        "DESC-ARE-POST-PLAN",
        "DEF-ARE-SEMANTIC-EVALUATOR",
    )
    append_unique(
        index["reverse_links"]["ART-ARE-L0-WITNESS-RECEIPT"],
        PROMOTION_DECISION,
    )
    index["evidence_refs"]["ART-ARE-L0-WITNESS-RECEIPT"] = remove_values(
        index["evidence_refs"]["ART-ARE-L0-WITNESS-RECEIPT"],
        "DESC-ARE-POST-PLAN",
        "DEF-ARE-SEMANTIC-EVALUATOR",
    )
    index["reverse_links"][PROMOTION_ARTIFACT] = [
        "CTX-ARE-ROOT",
        "DESC-ARE-POST-PLAN",
        "DEF-ARE-SEMANTIC-EVALUATOR",
        PROMOTION_DECISION,
    ]
    index["evidence_refs"][PROMOTION_ARTIFACT] = [
        "DESC-ARE-POST-PLAN",
        "DEF-ARE-SEMANTIC-EVALUATOR",
        PROMOTION_DECISION,
    ]
    index["stale_status"] = "fresh"

    if index["by_id"] != ledger["indexes"]["by_id"]:
        raise ValueError("Craft by_id projection differs from ledger")
    if index["active_blockers"] != ledger["indexes"]["active_blockers"]:
        raise ValueError("Craft active blockers differ from ledger")
    INDEX.write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("CRAFT_PROJECTION=pass")


if __name__ == "__main__":
    main()
