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


def run_mutation(name: str, mutate) -> None:
    with tempfile.TemporaryDirectory(prefix="alchlang-negative-") as temporary:
        target = Path(temporary) / "alchlang"
        shutil.copytree(PACKAGE_ROOT, target)
        mutate(target)
        result = MODULE.validate(package_root=target, repository_root=MODULE.REPOSITORY_ROOT)
        if result["status"] != "BLOCK":
            raise AssertionError(f"{name} unexpectedly passed")


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


for case_name, mutation in (
    ("missing ontology term", remove_ontology_edge),
    ("missing required ontology edge", remove_required_edge_relation),
    ("authority inflation", inflate_authority),
    ("missing accepted reference example", remove_reference_example),
    ("accepted binding drift", drift_accepted_binding),
    ("reference authority inflation", inflate_reference_authority),
):
    run_mutation(case_name, mutation)

print(json.dumps({"status": "PASS", "negative_mutations": 6}, indent=2))
