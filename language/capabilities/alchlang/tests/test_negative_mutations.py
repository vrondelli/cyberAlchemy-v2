#!/usr/bin/env python3
"""Fail-closed mutation checks for the AlchLang semantic package."""

from __future__ import annotations

import copy
import importlib.util
import json
import shutil
import tempfile
from pathlib import Path


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
VALIDATOR_PATH = PACKAGE_ROOT / "scripts/validate.py"
SPEC = importlib.util.spec_from_file_location("alchlang_validate", VALIDATOR_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def copy_validator_inputs(target: Path) -> None:
    """Snapshot the validator's local inputs, not the unrelated compiler tree."""
    selected = (*MODULE.MATERIAL_FILES,
                "define/initial-language-terms/ALCHLANG-INITIAL-LANGUAGE-DEFINITION-PACK.v1-candidate.json")
    for relative in selected:
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(PACKAGE_ROOT / relative, destination)
    # The validator resolves the accepted reference artifacts, implementation
    # outputs, campaign, and authorization beneath this small closed campaign.
    campaign = Path("plans/three-vertical-compilation-campaign")
    shutil.copytree(PACKAGE_ROOT / campaign, target / campaign)


def run_mutation(name: str, mutate, expected_error: str) -> None:
    with tempfile.TemporaryDirectory(prefix="alchlang-negative-") as temporary:
        target = Path(temporary) / "alchlang"
        copy_validator_inputs(target)
        baseline = MODULE.validate(package_root=target, repository_root=MODULE.REPOSITORY_ROOT)
        if baseline["status"] != "PASS":
            raise AssertionError(f"{name} baseline is not valid: {baseline['errors']}")
        mutate(target)
        result = MODULE.validate(package_root=target, repository_root=MODULE.REPOSITORY_ROOT)
        if result["status"] != "BLOCK":
            raise AssertionError(f"{name} unexpectedly passed")
        if not any(expected_error in error for error in result["errors"]):
            raise AssertionError(f"{name} blocked for the wrong reason: {result['errors']}")


def remove_ontology_edge(target: Path) -> None:
    path = target / "nodes.json"
    value = json.loads(path.read_text(encoding="utf-8"))
    value["nodes"] = [node for node in value["nodes"] if node["id"] != "B-ALCHLANG-CONCEPT-ONTOLOGY-EDGE"]
    write_json(path, value)


def remove_required_edge_relation(target: Path) -> None:
    path = target / "relations.json"
    value = json.loads(path.read_text(encoding="utf-8"))
    value["relations"] = [relation for relation in value["relations"] if relation["id"] != "E-ALCHLANG-DESCRIPTION-CONTAINS-EDGE"]
    write_json(path, value)


def inflate_authority(target: Path) -> None:
    path = target / "product-capability.json"
    value = json.loads(path.read_text(encoding="utf-8"))
    value["authority_effect"] = "grants-execution"
    write_json(path, value)


def remove_reference_example(target: Path) -> None:
    path = target / "reference-examples.json"
    value = json.loads(path.read_text(encoding="utf-8"))
    value["examples"] = value["examples"][:-1]
    write_json(path, value)


def drift_accepted_binding(target: Path) -> None:
    path = target / "plans/three-vertical-compilation-campaign/execution/evidence/accepted/customer-credit-release.construction-binding.candidate.json"
    value = json.loads(path.read_text(encoding="utf-8"))
    value["compiled_graph"]["digest"] = "0" * 64
    write_json(path, value)


def inflate_reference_authority(target: Path) -> None:
    path = target / "reference-examples.json"
    value = json.loads(path.read_text(encoding="utf-8"))
    value["examples"][0]["authority_effect"] = "grants-execution"
    write_json(path, value)


for case_name, mutation, expected_error in (
    ("missing ontology term", remove_ontology_edge, "dangling endpoint"),
    ("missing required ontology edge", remove_required_edge_relation, "required AlchLang relations are missing"),
    ("authority inflation", inflate_authority, "Product Capability exceeds authority ceiling"),
    ("missing accepted reference example", remove_reference_example, "reference registry must contain exactly"),
    ("accepted binding drift", drift_accepted_binding, "accepted binding digest drift"),
    ("reference authority inflation", inflate_reference_authority, "reference example customer-credit-release exceeds authority ceiling"),
):
    run_mutation(case_name, mutation, expected_error)

print(json.dumps({"status": "PASS", "negative_mutations": 6}, indent=2))
