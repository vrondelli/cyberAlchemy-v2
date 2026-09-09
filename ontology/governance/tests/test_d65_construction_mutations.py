#!/usr/bin/env python3
"""Hostile mutation checks for the quarantined legacy D65 evaluator."""

from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
VALIDATOR_PATH = REPOSITORY_ROOT / "cyberAlchemy-v2/ontology/governance/scripts/validate-construction.py"
SPEC = importlib.util.spec_from_file_location("validate_construction", VALIDATOR_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
REGISTRY = json.loads(
    (REPOSITORY_ROOT / "cyberAlchemy-v2/ontology/governance/construction-bindings.json").read_text(encoding="utf-8")
)


def evaluate(document: dict) -> dict:
    return MODULE.evaluate_registry(document, verify_build=False, verify_dependency_checks=False)


def mutated(change) -> dict:
    document = copy.deepcopy(REGISTRY)
    change(document["bindings"][0])
    return evaluate(document)


cases = []

baseline = evaluate(copy.deepcopy(REGISTRY))
assert baseline["status"] == "BLOCK", baseline
assert "D65_REVISION_2_EVALUATOR_NOT_IMPLEMENTED" in baseline["blockers"]
assert "DOMAINSPEC_PROFILE_NOT_ADMITTED" in baseline["blockers"]
assert "IMPLEMENTATION_BASELINE_NOT_OWNER_ACCEPTED" in baseline["blockers"]
assert "SYSTEM_ONTOLOGY_NOT_ADMITTED" in baseline["blockers"]
cases.append("legacy revision-1 evaluator cannot satisfy revision 2")

result = mutated(lambda binding: binding["file_bindings"][0].update(sha256="0" * 64))
assert result["status"] == "BLOCK" and any("file binding drift" in item for item in result["errors"])
cases.append("selected definition drift")

result = mutated(lambda binding: binding["domainspec"].update(compiled_graph_digest="0" * 64))
assert result["status"] == "BLOCK" and any("compiled_graph_ref" in item for item in result["errors"])
cases.append("compiled graph drift")

result = mutated(lambda binding: binding["domainspec"].update(system_ontology_digest="0" * 64))
assert result["status"] == "BLOCK" and any("system_ontology" in item for item in result["errors"])
cases.append("system ontology drift")

result = mutated(lambda binding: binding["domainspec"].update(profile_release_admission="granted"))
assert result["status"] == "BLOCK" and "DomainSpec profile release-admission claim is non-current" in result["errors"]
cases.append("profile admission cannot be invented")

result = mutated(lambda binding: binding["implementation"].update(target_digest="0" * 64))
assert result["status"] == "BLOCK" and "implementation target digest drift" in result["errors"]
cases.append("implementation target drift")

def skip_predecessor(binding: dict) -> None:
    for stage in binding["stages"]:
        if stage["name"] == "system_ontology":
            stage["state"] = "validated"


result = mutated(skip_predecessor)
assert result["status"] == "BLOCK" and any("skips non-validated predecessors" in item for item in result["errors"])
cases.append("skipped predecessor")

empty = copy.deepcopy(REGISTRY)
empty["bindings"] = []
result = evaluate(empty)
assert result["status"] == "BLOCK" and any("non-vacuous" in item for item in result["errors"])
cases.append("empty registry is not vacuous pass")

print(json.dumps({"status": "PASS", "authority_effect": "none", "cases": cases}, indent=2))
