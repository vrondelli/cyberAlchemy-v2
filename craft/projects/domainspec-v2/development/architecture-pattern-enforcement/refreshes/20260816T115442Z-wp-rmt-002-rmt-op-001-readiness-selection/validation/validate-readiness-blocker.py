#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


def fail(message: str) -> None:
    raise SystemExit(message)


def load(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        fail(f"not an object: {path}")
    return value


root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
run = root / "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260816T115442Z-wp-rmt-002-rmt-op-001-readiness-selection"
blocker = load(run / "BLOCKER.json")
proposal = load(run / "REFRESH-PROPOSAL.json")

for ref in blocker["source_refs"]:
    path = root / ref["path"]
    data = path.read_bytes()
    if len(data) != ref["size_bytes"]:
        fail(f"size drift: {ref['path']}")
    if hashlib.sha256(data).hexdigest() != ref["sha256"]:
        fail(f"digest drift: {ref['path']}")

plan = root / "projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan"
manifest = load(plan / "SWU-MANIFEST.json")
contracts = load(plan / "SWU-CONTRACTS.json")
entry = load(plan / "EXECUTION-ENTRY.json")
baseline = load(plan / "WRITE-SCOPE-BASELINE.json")
hostiles = load(plan / "HOSTILE-CATALOGUE.json")
relations = load(plan / "RELATION-CONTRACTS.json")
live = load(root / "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260816T110235Z-wp-rmt-001-ontology-v2-validator-repair-live-apply/LIVE-APPLY-RECEIPT.json")
refresh = load(root / "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260816T112417Z-wp-rmt-002-execution-entry-refresh/EXECUTION-ENTRY-REFRESH-RECEIPT.json")

if manifest["status"] != "planned-selection-ready" or manifest["frontier"] != ["RMT-OP-001"]:
    fail("manifest is not at the captured selection-ready frontier")
if len(manifest["swus"]) != 70 or contracts["contract_count"] != 70 or len(contracts["contracts"]) != 70:
    fail("70-unit accounting drift")
if sum(len(item["depends_on"]) for item in manifest["swus"]) != 74:
    fail("dependency edge accounting drift")
if baseline["path_count"] != 189 or len(baseline["entries"]) != 189 or not baseline["all_paths_absent"]:
    fail("write-scope baseline drift")
if hostiles["control_count"] != 98:
    fail("hostile accounting drift")
if sum(len(item["contracts"]) for item in relations["type_contracts"]) != 18:
    fail("relation accounting drift")
if entry["execution_entry"] != {"state": "selection-ready", "selected_unit": None, "route_id": None, "next_owner": "implementation-readiness:execute"}:
    fail("execution-entry drift")
if entry["execution_policy"]["allowed_routes_digest"] != "e30a5a581eceb99ae8c846365dacaee26aec40dfdfe39353398705eba625b10f":
    fail("allowed-routes digest drift")
if live["result"] != "pass" or refresh["result"] != "pass":
    fail("prerequisite receipt drift")

command_count = sum(len(item["verification"]["commands"]) for item in contracts["contracts"])
if command_count != 112:
    fail("validation command accounting drift")
if not all(isinstance(command, str) for item in contracts["contracts"] for command in item["verification"]["commands"]):
    fail("validation command source shape changed")

for swu in manifest["swus"]:
    forbidden_present = {"task_id", "canonical_successors", "lifecycle_owner", "authority_class", "publication_class", "material_package", "attempt_contract"} & set(swu)
    if forbidden_present:
        fail(f"previously missing manifest contracts now present for {swu['id']}: {sorted(forbidden_present)}")
for contract in contracts["contracts"]:
    forbidden_present = {"attempt_contract", "material_package", "lifecycle_owner", "authority_class", "publication_class", "terminal_schema_ref", "semantic_validator_ref"} & set(contract)
    if forbidden_present:
        fail(f"previously missing SWU contracts now present for {contract['swu_id']}: {sorted(forbidden_present)}")

expected_missing = {
    "RMT-READINESS-STRUCTURED-VALIDATION-COMMANDS-MISSING",
    "RMT-READINESS-PRIMARY-COMMAND-CONTRACT-MISSING",
    "RMT-READINESS-ATTEMPT-LIFECYCLE-MISSING",
    "RMT-READINESS-UNIT-OWNERSHIP-CLASSIFICATION-MISSING",
    "RMT-READINESS-CANONICAL-SUCCESSOR-MISSING",
    "RMT-READINESS-RECEIPT-SEMANTICS-MISSING",
    "RMT-READINESS-TASK-IDENTITY-MAPPING-INCOMPLETE",
}
if {item["id"] for item in blocker["missing_contracts"]} != expected_missing:
    fail("blocker catalogue drift")
if blocker["result"] != "block" or blocker["next_owner"] != "invoke:refresh":
    fail("blocker routing drift")
if blocker["official_boundary"]["audit_runner_invoked"] or blocker["official_boundary"]["selection_receipt_emitted"]:
    fail("official producer boundary overstated")
if proposal["mode"] != "proposal-only" or proposal["authority_effect"] != "none" or proposal["next_owner"] != "invoke:refresh":
    fail("refresh proposal authority drift")
if not proposal["renewed_owner_acceptance_required"]:
    fail("renewed acceptance gate missing")

result = {
    "schema_version": "domainspec.wp-rmt-002-readiness-blocker-validation/v1",
    "result": "pass",
    "meaning": "blocker evidence is internally exact; WP-RMT-002 readiness remains blocked",
    "work_pack_id": "WP-RMT-002",
    "frontier": ["RMT-OP-001"],
    "source_ref_count": len(blocker["source_refs"]),
    "swu_count": len(manifest["swus"]),
    "dependency_edge_count": 74,
    "declared_command_count": command_count,
    "missing_contract_class_count": len(expected_missing),
    "audit_config_emitted": False,
    "selection_receipt_emitted": False,
    "mutation_ready": False,
    "authority_effect": "none",
    "next_owner": "invoke:refresh",
}
print(json.dumps(result, indent=2, sort_keys=True))
