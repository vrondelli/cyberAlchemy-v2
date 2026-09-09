#!/usr/bin/env python3
"""Validate the hosted Product Capability and its immutable candidate envelope."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parent
REPOSITORY = ROOT.parents[5]
SCHEMA_PATH = REPOSITORY / "cyberAlchemy-v2/capability/schemas/capability.schema.json"
ADOPTION_PATH = ROOT / "decisions/product-capability-adoption-001.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    errors: list[str] = []
    schema = json.loads(SCHEMA_PATH.read_text())
    instance = json.loads((ROOT / "product-capability.json").read_text())
    validation_schema = {
        "$schema": schema["$schema"],
        "$ref": "#/$defs/productCapability",
        "$defs": schema["$defs"],
    }
    for error in sorted(
        Draft202012Validator(validation_schema).iter_errors(instance),
        key=lambda item: list(item.path),
    ):
        location = "/".join(str(part) for part in error.path) or "$"
        errors.append(f"product-capability.json:{location}: {error.message}")

    candidate = json.loads((ROOT / "product-capability-candidate.json").read_text())
    expected_capability = candidate["capability"]["sha256"]
    actual_capability = sha256(ROOT / candidate["capability"]["path"])
    if actual_capability != expected_capability:
        errors.append(
            "candidate capability digest mismatch: "
            f"expected {expected_capability}, got {actual_capability}"
        )
    definitions = candidate["predecessors"]["canonical_definitions"]
    expected_definitions = definitions["sha256"]
    actual_definitions = sha256(ROOT / definitions["path"])
    if actual_definitions != expected_definitions:
        errors.append(
            "candidate definition digest mismatch: "
            f"expected {expected_definitions}, got {actual_definitions}"
        )
    acceptance = definitions.get("acceptance_decision", {})
    acceptance_path = ROOT / acceptance.get("path", "")
    if not acceptance_path.is_file():
        errors.append("candidate lacks the definition acceptance decision")
    else:
        actual_acceptance = sha256(acceptance_path)
        if actual_acceptance != acceptance.get("sha256"):
            errors.append("definition acceptance decision digest mismatch")
        decision = json.loads(acceptance_path.read_text())
        subject = decision.get("subject", {})
        if subject.get("definition_set_id") != definitions.get("definition_set_id"):
            errors.append("definition acceptance decision targets another set")
        if subject.get("definition_source_sha256") != expected_definitions:
            errors.append("definition acceptance decision targets other source bytes")
        if decision.get("acceptance", {}).get("lifecycle_status") != "accepted":
            errors.append("definition predecessor is not accepted")
    if definitions.get("lifecycle_status") != "accepted":
        errors.append("candidate does not recognize accepted definition predecessor")
    base = candidate["predecessors"]["base_encrypted_durable_devnet_capability"]
    expected_base = base["sha256"]
    actual_base = sha256(ROOT / base["path"])
    if actual_base != expected_base:
        errors.append(
            "candidate base capability digest mismatch: "
            f"expected {expected_base}, got {actual_base}"
        )

    adoption_status = "not-requested"
    adoption_sha256 = None
    if ADOPTION_PATH.is_file():
        adoption_sha256 = sha256(ADOPTION_PATH)
        adoption = json.loads(ADOPTION_PATH.read_text())
        subject = adoption.get("subject", {})
        envelope = adoption.get("predecessors", {}).get("candidate_envelope", {})
        definition_decision = adoption.get("predecessors", {}).get("definition_acceptance", {})
        if subject.get("capability_id") != instance.get("capability_id"):
            errors.append("adoption decision targets another capability")
        if subject.get("sha256") != actual_capability:
            errors.append("adoption decision targets other capability bytes")
        if envelope.get("candidate_id") != candidate.get("candidate_id"):
            errors.append("adoption decision targets another candidate")
        if envelope.get("sha256") != sha256(ROOT / "product-capability-candidate.json"):
            errors.append("adoption decision targets other candidate bytes")
        if definition_decision.get("sha256") != acceptance.get("sha256"):
            errors.append("adoption decision targets another definition acceptance")
        adoption_status = adoption.get("adoption", {}).get("lifecycle_status", "invalid")
        if adoption_status != "adopted":
            errors.append("capability adoption decision is not adopted")

    result = {
        "result": "PASS" if not errors else "BLOCK",
        "capability_id": instance["capability_id"],
        "capability_sha256": actual_capability,
        "candidate_id": candidate["candidate_id"],
        "candidate_adoption_status": candidate["adoption_status"],
        "adoption_status": adoption_status,
        "adoption_decision_sha256": adoption_sha256,
        "definition_acceptance_status": definitions["lifecycle_status"],
        "definition_acceptance_sha256": acceptance.get("sha256"),
        "base_capability_sha256": actual_base,
        "authority_effect": "none",
        "errors": errors,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
