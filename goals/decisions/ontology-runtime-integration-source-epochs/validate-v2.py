#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
REPOSITORY = HERE.parents[3]
DECISION = HERE / "selection-v2.json"
RECEIPT = HERE / "receipts/selection-v2-validation.json"


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"object required: {path}")
    return value


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def selector_digest(path: Path, heading: str) -> str:
    selected: list[str] = []
    active = False
    for line in path.read_text(encoding="utf-8").splitlines(keepends=True):
        if line.rstrip("\r\n") == heading:
            active = True
        elif active and line.startswith("## "):
            break
        if active:
            selected.append(line)
    return hashlib.sha256("".join(selected).encode("utf-8")).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    decision = load(DECISION)
    checks: list[dict[str, Any]] = []

    def record(check_id: str, passed: bool, detail: Any) -> None:
        checks.append({"check_id": check_id, "result": "PASS" if passed else "BLOCK", "detail": detail})

    prior = decision.get("supersedes", {})
    prior_path = REPOSITORY / str(prior.get("path", ""))
    record(
        "immutable-predecessor",
        prior_path.is_file() and digest(prior_path) == prior.get("sha256"),
        {"path": prior.get("path"), "sha256": digest(prior_path) if prior_path.is_file() else None},
    )

    epoch = decision.get("selected_epoch", {})
    thesis_path = REPOSITORY / str(epoch.get("path", ""))
    record_path = REPOSITORY / str(epoch.get("machine_record_path", ""))
    thesis = thesis_path.read_text(encoding="utf-8") if thesis_path.is_file() else ""
    machine = load(record_path) if record_path.is_file() else {}
    record(
        "selected-product-thesis-epoch",
        thesis_path.is_file()
        and digest(thesis_path) == epoch.get("selected_sha256")
        and selector_digest(thesis_path, str(epoch.get("selector"))) == epoch.get("selector_sha256")
        and "Do not merely reuse context" in thesis
        and "private internal reasoning" in thesis,
        {"sha256": digest(thesis_path) if thesis_path.is_file() else None, "selector_sha256": selector_digest(thesis_path, str(epoch.get("selector"))) if thesis_path.is_file() else None},
    )
    record(
        "machine-record-coherence",
        record_path.is_file()
        and digest(record_path) == epoch.get("machine_record_sha256")
        and machine.get("revision_history", [])[-1].get("revision") == epoch.get("machine_record_revision") == 3
        and "explicit provenance-bound reasoning state" in machine.get("value_mechanism", "")
        and any("hidden model chain-of-thought" in item for item in machine.get("boundaries", [])),
        {"sha256": digest(record_path) if record_path.is_file() else None, "revision": machine.get("revision_history", [{}])[-1].get("revision") if machine.get("revision_history") else None},
    )

    definition = decision.get("selected_definition_dependency", {})
    definition_path = REPOSITORY / str(definition.get("path", ""))
    record(
        "selected-definition-currentness",
        definition_path.is_file()
        and selector_digest(definition_path, str(definition.get("selector"))) == definition.get("selector_sha256")
        and definition.get("whole_file_drift_posture") == "diagnostic-outside-selected-selector",
        {"selector_sha256": selector_digest(definition_path, str(definition.get("selector"))) if definition_path.is_file() else None, "whole_file_sha256": digest(definition_path) if definition_path.is_file() else None},
    )

    sources = load(REPOSITORY / "cyberAlchemy-v2/goals/sources.json")
    source = next((item for item in sources.get("sources", []) if item.get("id") == decision.get("scope", {}).get("source_id")), {})
    record(
        "goals-source-registry-reconciled",
        source.get("path") == epoch.get("path") and source.get("sha256") == epoch.get("selected_sha256"),
        source,
    )

    validation = decision.get("validation", {})
    goals_receipt_path = REPOSITORY / str(validation.get("goals_receipt_path", ""))
    goals_receipt = load(goals_receipt_path) if goals_receipt_path.is_file() else {}
    goals_errors = goals_receipt.get("errors", [])
    record(
        "bounded-validation-posture",
        validation.get("product_thesis_selected_dependency_result") == "PASS"
        and validation.get("broad_product_thesis_result") == "BLOCK"
        and validation.get("broad_product_thesis_blockers") == ["source digest drift: SRC-CAV2-DEFINITIONS"]
        and goals_receipt_path.is_file()
        and digest(goals_receipt_path) == validation.get("goals_receipt_sha256")
        and goals_receipt.get("status") == "BLOCK"
        and goals_receipt.get("material_digest") == validation.get("goals_material_digest")
        and len(goals_errors) == validation.get("unrelated_error_count") == 20
        and not any("SRC-CAV2-PRODUCT-THESIS" in item for item in goals_errors)
        and any("SRC-CAV2-DEFINITIONS" in item for item in goals_errors),
        {"goals_result": goals_receipt.get("status"), "error_count": len(goals_errors), "selected_dependency_errors": [item for item in goals_errors if "SRC-CAV2-PRODUCT-THESIS" in item]},
    )

    record(
        "authority-boundary",
        decision.get("authority_effect") == "select-current-product-thesis-source-epoch-only"
        and decision.get("next_gate") == "G-D65-BINDING"
        and len(decision.get("non_effects", [])) == 4,
        {"authority_effect": decision.get("authority_effect"), "next_gate": decision.get("next_gate")},
    )

    failed = [item["check_id"] for item in checks if item["result"] != "PASS"]
    result = "PASS" if not failed else "BLOCK"
    receipt = {
        "schema_version": "cav2-source-epoch-reconciliation-validation/v2",
        "decision_id": decision.get("decision_id"),
        "result": result,
        "checks": checks,
        "failed_checks": failed,
        "selected_source_epoch_sha256": epoch.get("selected_sha256"),
        "selected_selector_sha256": epoch.get("selector_sha256"),
        "aggregate_goals_result": "BLOCK",
        "next_gate": "G-D65-BINDING" if result == "PASS" else None,
        "implementation_authorized": False,
        "authority_effect": decision.get("authority_effect") if result == "PASS" else "none",
        "claim_ceiling": "PASS proves selector-level Product Thesis epoch reconciliation only. It does not make aggregate Goals PASS or authorize D65-S6 authorship or implementation."
    }
    if args.write_receipt:
        RECEIPT.parent.mkdir(parents=True, exist_ok=True)
        RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"decision_id": receipt["decision_id"], "result": result, "failed_checks": failed, "aggregate_goals_result": "BLOCK", "next_gate": receipt["next_gate"], "implementation_authorized": False}, indent=2, sort_keys=True))
    return 0 if result == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
