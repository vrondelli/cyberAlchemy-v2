#!/usr/bin/env python3
"""Validate information parity and attribution bindings for one task block."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "define-condition-manifest@1"
PROTOCOL_ID = "define-downstream-utility@1"
CONDITIONS = {
    "ticket_only",
    "equivalent_notes",
    "definition_pack",
    "definition_pack_evidence_gate",
}
FACT_KINDS = {
    "goal", "intent", "context", "concept", "definition", "evidence",
    "relationship", "owner", "open_question", "allowed_use", "blocked_action",
}
DIGEST_RE = re.compile(r"^[0-9a-f]{64}$")


def require(obj: Any, keys: set[str], prefix: str, errors: list[str]) -> bool:
    if not isinstance(obj, dict):
        errors.append(f"TYPE:{prefix}:expected-object")
        return False
    for key in sorted(keys):
        if key not in obj:
            errors.append(f"REQUIRED:{prefix}.{key}")
    return True


def is_digest(value: Any, nullable: bool = False) -> bool:
    return (nullable and value is None) or (
        isinstance(value, str) and DIGEST_RE.fullmatch(value) is not None
    )


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0


def fact_digest(facts: list[dict[str, Any]]) -> str:
    encoded = json.dumps(
        facts, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def validate_manifest(payload: Any) -> list[str]:
    errors: list[str] = []
    required = {
        "schema_version", "protocol_id", "evidence_kind", "task_id",
        "task_class", "repository_commit", "source_packet_digest",
        "fact_set_digest", "authority_effect", "facts", "conditions",
        "parity_reviews", "costs",
    }
    if not require(payload, required, "manifest", errors):
        return errors
    if errors:
        return errors

    if payload["schema_version"] != SCHEMA_VERSION:
        errors.append("ENUM:manifest.schema_version")
    if payload["protocol_id"] != PROTOCOL_ID:
        errors.append("ENUM:manifest.protocol_id")
    if payload["evidence_kind"] not in {"synthetic_fixture", "live_run"}:
        errors.append("ENUM:manifest.evidence_kind")
    if payload["task_class"] not in {"low_ambiguity_control", "high_ambiguity"}:
        errors.append("ENUM:manifest.task_class")
    if payload["authority_effect"] != "none":
        errors.append("AUTHORITY:manifest.authority_effect")
    if not is_digest(payload["source_packet_digest"]):
        errors.append("DIGEST:manifest.source_packet_digest")

    facts = payload["facts"]
    fact_ids: list[str] = []
    if not isinstance(facts, list) or not facts:
        errors.append("CARDINALITY:manifest.facts")
        facts = []
    for index, fact in enumerate(facts):
        prefix = f"manifest.facts[{index}]"
        keys = {"fact_id", "kind", "statement", "source_ref", "source_selector", "applies_in_context"}
        if not require(fact, keys, prefix, errors):
            continue
        fact_id = fact.get("fact_id")
        if not isinstance(fact_id, str) or not fact_id:
            errors.append(f"TYPE:{prefix}.fact_id")
        else:
            fact_ids.append(fact_id)
        if fact.get("kind") not in FACT_KINDS:
            errors.append(f"ENUM:{prefix}.kind")
        for key in ("statement", "source_ref", "source_selector", "applies_in_context"):
            if not isinstance(fact.get(key), str) or not fact[key].strip():
                errors.append(f"TYPE:{prefix}.{key}")
    if len(fact_ids) != len(set(fact_ids)):
        errors.append("UNIQUE:manifest.facts.fact_id")
    if facts and payload["fact_set_digest"] != fact_digest(facts):
        errors.append("FACT_SET_DIGEST:manifest.fact_set_digest")

    conditions = payload["conditions"]
    condition_keys = {
        "condition_packet_digest", "artifact_digest", "selected_fact_ids",
        "definition_pack_digest", "gate_policy_digest",
        "contains_prohibited_content", "authority_effect",
    }
    if not isinstance(conditions, dict) or set(conditions) != CONDITIONS:
        errors.append("CONDITION_KEYS:manifest.conditions")
        conditions = {}
    for name in CONDITIONS:
        condition = conditions.get(name)
        prefix = f"manifest.conditions.{name}"
        if not require(condition, condition_keys, prefix, errors):
            continue
        if not is_digest(condition["condition_packet_digest"]):
            errors.append(f"DIGEST:{prefix}.condition_packet_digest")
        if not is_digest(condition["artifact_digest"], nullable=True):
            errors.append(f"DIGEST:{prefix}.artifact_digest")
        if not is_digest(condition["definition_pack_digest"], nullable=True):
            errors.append(f"DIGEST:{prefix}.definition_pack_digest")
        if not is_digest(condition["gate_policy_digest"], nullable=True):
            errors.append(f"DIGEST:{prefix}.gate_policy_digest")
        if condition["authority_effect"] != "none":
            errors.append(f"AUTHORITY:{prefix}.authority_effect")
        if condition["contains_prohibited_content"] is not False:
            errors.append(f"PROHIBITED_CONTENT:{prefix}")
        selected = condition["selected_fact_ids"]
        if not isinstance(selected, list) or any(not isinstance(value, str) for value in selected):
            errors.append(f"TYPE:{prefix}.selected_fact_ids")
        elif len(selected) != len(set(selected)):
            errors.append(f"UNIQUE:{prefix}.selected_fact_ids")

    if conditions:
        expected_facts = set(fact_ids)
        ticket = conditions["ticket_only"]
        notes = conditions["equivalent_notes"]
        pack = conditions["definition_pack"]
        gated = conditions["definition_pack_evidence_gate"]
        if ticket.get("selected_fact_ids") != [] or ticket.get("artifact_digest") is not None:
            errors.append("BINDING:ticket_only:selected_material")
        if ticket.get("definition_pack_digest") is not None or ticket.get("gate_policy_digest") is not None:
            errors.append("BINDING:ticket_only:pack_or_gate")
        for name, condition in (("equivalent_notes", notes), ("definition_pack", pack), ("definition_pack_evidence_gate", gated)):
            if set(condition.get("selected_fact_ids", [])) != expected_facts:
                errors.append(f"PARITY:{name}:fact_ids")
        if notes.get("artifact_digest") is None or notes.get("definition_pack_digest") is not None or notes.get("gate_policy_digest") is not None:
            errors.append("BINDING:equivalent_notes")
        if pack.get("artifact_digest") != pack.get("definition_pack_digest") or pack.get("gate_policy_digest") is not None:
            errors.append("BINDING:definition_pack")
        if gated.get("artifact_digest") != pack.get("artifact_digest"):
            errors.append("BINDING:definition_pack_evidence_gate:pack_artifact")
        if gated.get("definition_pack_digest") != pack.get("definition_pack_digest"):
            errors.append("BINDING:definition_pack_evidence_gate:pack_digest")
        if gated.get("gate_policy_digest") is None:
            errors.append("BINDING:definition_pack_evidence_gate:gate")
        packet_digests = [condition.get("condition_packet_digest") for condition in conditions.values()]
        if len(packet_digests) != len(set(packet_digests)):
            errors.append("UNIQUE:manifest.conditions.condition_packet_digest")

    reviews = payload["parity_reviews"]
    if not isinstance(reviews, list) or len(reviews) != 2:
        errors.append("CARDINALITY:manifest.parity_reviews")
    else:
        reviewer_ids: list[str] = []
        for index, review in enumerate(reviews):
            prefix = f"manifest.parity_reviews[{index}]"
            if not require(review, {"reviewer_id", "pack_to_notes", "notes_to_pack", "parity_receipt_digest"}, prefix, errors):
                continue
            reviewer_ids.append(review.get("reviewer_id"))
            if not isinstance(review.get("reviewer_id"), str) or not review["reviewer_id"]:
                errors.append(f"TYPE:{prefix}.reviewer_id")
            if review.get("pack_to_notes") is not True or review.get("notes_to_pack") is not True:
                errors.append(f"PARITY_RECEIPT:{prefix}")
            if not is_digest(review.get("parity_receipt_digest")):
                errors.append(f"DIGEST:{prefix}.parity_receipt_digest")
        if len(reviewer_ids) != len(set(reviewer_ids)):
            errors.append("UNIQUE:manifest.parity_reviews.reviewer_id")

    costs = payload["costs"]
    cost_keys = {
        "fact_set_preparation_minutes", "fact_set_preparation_tokens",
        "parity_review_minutes", "parity_review_tokens", "conditions",
    }
    if require(costs, cost_keys, "manifest.costs", errors):
        for key in cost_keys - {"conditions"}:
            if not is_number(costs.get(key)):
                errors.append(f"RANGE:manifest.costs.{key}")
        condition_costs = costs.get("conditions")
        if not isinstance(condition_costs, dict) or set(condition_costs) != CONDITIONS:
            errors.append("CONDITION_KEYS:manifest.costs.conditions")
        else:
            for name, item in condition_costs.items():
                prefix = f"manifest.costs.conditions.{name}"
                item_keys = {
                    "direct_material_minutes", "direct_material_tokens",
                    "allocated_fact_set_minutes", "allocated_fact_set_tokens",
                    "artifact_characters",
                }
                if require(item, item_keys, prefix, errors):
                    for key in item_keys:
                        if not is_number(item.get(key)):
                            errors.append(f"RANGE:{prefix}.{key}")
                    if name == "ticket_only" and (
                        item.get("allocated_fact_set_minutes") != 0
                        or item.get("allocated_fact_set_tokens") != 0
                    ):
                        errors.append(f"COST_ALLOCATION:{prefix}:ticket_only")
                    if name != "ticket_only" and (
                        item.get("allocated_fact_set_minutes") != costs.get("fact_set_preparation_minutes")
                        or item.get("allocated_fact_set_tokens") != costs.get("fact_set_preparation_tokens")
                    ):
                        errors.append(f"COST_ALLOCATION:{prefix}:fact_set")
    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_condition_manifest.py <manifest.json>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"READ:{path}:{exc}", file=sys.stderr)
        return 1
    errors = validate_manifest(payload)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(json.dumps({"status": "fail", "errors": len(errors)}))
        return 1
    print(json.dumps({
        "status": "pass",
        "facts": len(payload["facts"]),
        "conditions": len(payload["conditions"]),
        "parity_reviews": len(payload["parity_reviews"]),
        "authority_effect": "none",
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
