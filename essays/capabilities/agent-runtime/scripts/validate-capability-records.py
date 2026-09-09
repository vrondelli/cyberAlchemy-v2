#!/usr/bin/env python3
"""Check-only validator for the eight Essays agent-runtime capability records."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parents[3]
SCHEMA_PATH = ROOT / "schemas/agent-runtime-capability-records.schema.json"
CAPABILITY_PATH = ROOT.parent / "essays-agent-runtime.product-capability.json"
DECISION_PATH = REPO / "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-product-capability/selection.json"
RECORD_DECISION_PATH = REPO / "cyberAlchemy-v2/goals/projects/essays/decisions/agent-runtime-capability-records/selection.json"
ONTOLOGY_NODES_PATH = ROOT / "ontology/NODES.json"

RECORDS = {
    "contracts/agent-runtime.input-contract.json": ("capabilityContract", "CA2-CAP-CONTRACT-ESSAYS-AGENT-RUNTIME-INPUT"),
    "contracts/workspace-snapshot.output-contract.json": ("capabilityContract", "CA2-CAP-CONTRACT-ESSAYS-WORKSPACE-SNAPSHOT"),
    "contracts/agent-proposal.output-contract.json": ("capabilityContract", "CA2-CAP-CONTRACT-ESSAYS-AGENT-PROPOSAL"),
    "contracts/browser-evidence.output-contract.json": ("capabilityContract", "CA2-CAP-CONTRACT-ESSAYS-BROWSER-EVIDENCE"),
    "contracts/command-receipt.output-contract.json": ("capabilityContract", "CA2-CAP-CONTRACT-ESSAYS-COMMAND-RECEIPT"),
    "policies/agent-runtime.context-policy.json": ("contextPolicy", "CA2-CAP-POLICY-ESSAYS-AGENT-RUNTIME-CONTEXT"),
    "obligations/agent-runtime.obligations.json": ("obligationRegistry", "CA2-CAP-OBLIGATIONS-ESSAYS-AGENT-RUNTIME"),
    "realizations/agent-runtime.realization-preconditions.json": ("realizationPrecondition", "CA2-CAP-BIND-ESSAYS-AGENT-RUNTIME-UNSELECTED"),
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def authority_none(value: object) -> bool:
    if isinstance(value, dict):
        return all((key != "authority_effect" or item == "none") and authority_none(item) for key, item in value.items())
    if isinstance(value, list):
        return all(authority_none(item) for item in value)
    return True


schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
capability = json.loads(CAPABILITY_PATH.read_text(encoding="utf-8"))
decision = json.loads(DECISION_PATH.read_text(encoding="utf-8"))
record_decision = json.loads(RECORD_DECISION_PATH.read_text(encoding="utf-8"))
business_ids = {row["id"] for row in json.loads(ONTOLOGY_NODES_PATH.read_text(encoding="utf-8"))["nodes"]}

errors: list[str] = []
records: dict[str, dict] = {}
for relative, (definition, expected_id) in RECORDS.items():
    path = ROOT / relative
    if not path.is_file():
        errors.append(f"missing record: {relative}")
        continue
    record = json.loads(path.read_text(encoding="utf-8"))
    records[relative] = record
    record_schema = dict(schema)
    record_schema["$ref"] = f"#/$defs/{definition}"
    for error in Draft202012Validator(record_schema).iter_errors(record):
        errors.append(f"{relative}: {error.json_path}: {error.message}")
    record_id = record.get("contract_id") or record.get("policy_id") or record.get("registry_id") or record.get("binding_id")
    if record_id != expected_id:
        errors.append(f"{relative}: expected id {expected_id}, got {record_id}")
    if not authority_none(record):
        errors.append(f"{relative}: authority_effect must remain none")

expected_refs = set(capability["input_contract_refs"] + capability["output_contract_refs"] + capability["context_policy_refs"] + capability["realization_binding_refs"] + [capability["obligation_registry_ref"]])
actual_refs = {
    record.get("contract_id") or record.get("policy_id") or record.get("registry_id") or record.get("binding_id")
    for record in records.values()
}
if expected_refs != actual_refs:
    errors.append(f"capability reference closure differs: missing={sorted(expected_refs - actual_refs)} extra={sorted(actual_refs - expected_refs)}")

capability_digest = digest(CAPABILITY_PATH)
subject = decision.get("subject", {})
if subject.get("sha256") != capability_digest or decision.get("selected_option_id") != "OPT-CAPABILITY-ADOPT-EXACT-CURRENT":
    errors.append("owner decision does not bind the current Product Capability digest")

obligations = records.get("obligations/agent-runtime.obligations.json", {}).get("obligations", [])
obligation_ids = [row.get("obligation_id") for row in obligations]
if len(obligation_ids) != len(set(obligation_ids)):
    errors.append("duplicate obligation ids")
for row in obligations:
    unknown = set(row.get("business_meaning_refs", [])) - business_ids
    if unknown:
        errors.append(f"{row.get('obligation_id')}: unknown business meaning refs {sorted(unknown)}")

material = hashlib.sha256()
for relative in sorted(RECORDS):
    material.update(relative.encode("utf-8"))
    material.update(b"\0")
    if (ROOT / relative).is_file():
        material.update((ROOT / relative).read_bytes())
    material.update(b"\0")

material_digest = material.hexdigest()
record_subject = record_decision.get("subject", {})
if (
    record_decision.get("selected_option_id") != "OPT-CAPABILITY-RECORDS-ADOPT-EXACT-CURRENT"
    or record_subject.get("material_digest") != material_digest
    or record_subject.get("record_count") != len(records)
    or record_subject.get("obligation_count") != len(obligations)
):
    errors.append("capability-record owner decision does not bind the current exact record bundle")

result = {
    "schema_version": "cav2.essays.agent-runtime.capability-records.validation/v1",
    "overall": "BLOCK" if errors else "PASS",
    "record_count": len(records),
    "obligation_count": len(obligations),
    "product_capability_sha256": capability_digest,
    "owner_decision_sha256": digest(DECISION_PATH),
    "material_digest": material_digest,
    "errors": errors,
    "record_adoption_state": "adopted-exact-current",
    "record_owner_decision_sha256": digest(RECORD_DECISION_PATH),
    "remaining_owner_gate": None,
    "claim_ceiling": "Candidate dependent records only; validation is not record adoption, ontology closure, DomainSpec admission, implementation authorization, conformance, release, deployment, or external-effect authority.",
    "authority_effect": "none",
}
print(json.dumps(result, indent=2, sort_keys=True))
raise SystemExit(1 if errors else 0)
