#!/usr/bin/env python3
"""Regression checks for parity and causal-attribution failures."""

from __future__ import annotations

import copy
import json
from pathlib import Path

from validate_condition_manifest import validate_manifest


FIXTURE = Path(__file__).resolve().parent / "fixtures/condition-manifest-pass.json"


def main() -> int:
    base = json.loads(FIXTURE.read_text(encoding="utf-8"))
    cases: list[tuple[str, dict, str]] = []

    parity = copy.deepcopy(base)
    parity["parity_reviews"][1]["notes_to_pack"] = False
    cases.append(("parity", parity, "PARITY_RECEIPT:"))

    binding = copy.deepcopy(base)
    binding["conditions"]["definition_pack_evidence_gate"]["definition_pack_digest"] = "f" * 64
    cases.append(("binding", binding, "BINDING:definition_pack_evidence_gate:pack_digest"))

    fact_set = copy.deepcopy(base)
    fact_set["conditions"]["equivalent_notes"]["selected_fact_ids"] = ["F-001"]
    cases.append(("fact_set", fact_set, "PARITY:equivalent_notes:fact_ids"))

    failures: list[str] = []
    if validate_manifest(base):
        failures.append("pass fixture was rejected")
    for name, payload, marker in cases:
        errors = validate_manifest(payload)
        if not any(marker in error for error in errors):
            failures.append(f"{name} mutation did not produce {marker}")
    if failures:
        for failure in failures:
            print(failure)
        return 1
    print(json.dumps({
        "status": "pass",
        "positive_cases": 1,
        "negative_cases": len(cases),
        "invariants": ["bilateral_parity", "pack_gate_binding", "fact_set_identity"],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
