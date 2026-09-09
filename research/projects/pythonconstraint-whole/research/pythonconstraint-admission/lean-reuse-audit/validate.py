#!/usr/bin/env python3
"""Validate the bounded PythonConstraint Lean reuse audit without writing receipts."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import urllib.request
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

PACKAGE = Path(__file__).resolve().parent
REPO = PACKAGE.parents[6]
SCHEMA_PATH = PACKAGE / "schemas/lean-reuse-audit.schema.json"
JSON_ARTIFACTS = (
    "profile.json",
    "sources.json",
    "evidence-procedure-ontology.json",
    "lean-construct-inventory.json",
    "spec-reuse-matrix.json",
    "import-closure-report.json",
    "proof-attack-order.json",
)
EXPECTED_SPECS = {
    "spec_alldiff_iff",
    "spec_exactsum_iff",
    "spec_holds_ref",
    "spec_solutions_sound",
    "spec_solutions_complete",
    "spec_solutions_eq_modelset",
    "spec_solutions_perm_model",
    "spec_no_dup_solutions",
    "spec_getSolution_iff",
    "spec_getSolution_mem",
    "spec_count_eq_length",
    "spec_no_variables_empty",
    "spec_count_no_constraints_product",
    "spec_cons_constraint_filter",
    "spec_constraint_order_perm",
    "spec_unary_inset_forward_check",
    "spec_solutions_canonical_keys",
    "spec_count_zero_iff_no_model",
    "spec_alldiff_capacity_zero",
    "spec_sum_bounds_contradiction_zero",
}


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one JSON object")
    return value


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git_blob(repository: Path, commit: str, path: str) -> bytes:
    completed = subprocess.run(
        ["git", "show", f"{commit}:{path}"],
        cwd=repository,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if completed.returncode != 0:
        raise ValueError(
            f"cannot read git blob {repository}:{commit}:{path}: "
            f"{completed.stderr.decode('utf-8', errors='replace').strip()}"
        )
    return completed.stdout


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-remote", action="store_true")
    args = parser.parse_args()
    errors: list[str] = []

    try:
        schema = load_json(SCHEMA_PATH)
        Draft202012Validator.check_schema(schema)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "BLOCK", "errors": [str(exc)]}, indent=2))
        return 1

    artifacts: dict[str, dict[str, Any]] = {}
    validator = Draft202012Validator(schema)
    for name in JSON_ARTIFACTS:
        path = PACKAGE / name
        try:
            value = load_json(path)
            artifacts[name] = value
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            errors.append(str(exc))
            continue
        validation_errors = sorted(
            validator.iter_errors(value), key=lambda item: list(item.absolute_path)
        )
        if validation_errors:
            first = validation_errors[0]
            location = "/".join(map(str, first.absolute_path)) or "<root>"
            errors.append(f"{name} invalid at {location}: {first.message}")

    if len(artifacts) != len(JSON_ARTIFACTS):
        errors.append("not all declared JSON artifacts loaded")

    profile = artifacts.get("profile.json", {})
    declared_artifacts = set(profile.get("artifacts", []))
    expected_declared = set(JSON_ARTIFACTS) - {"profile.json"}
    if declared_artifacts != expected_declared:
        errors.append(
            f"profile artifact closure mismatch: expected={sorted(expected_declared)} "
            f"observed={sorted(declared_artifacts)}"
        )

    sources = artifacts.get("sources.json", {}).get("sources", [])
    source_ids = [item.get("id") for item in sources if isinstance(item, dict)]
    if len(source_ids) != len(set(source_ids)):
        errors.append("duplicate source IDs")
    source_id_set = set(source_ids)
    for source in sources:
        if not isinstance(source, dict):
            errors.append("source row is not an object")
            continue
        try:
            if source["kind"] == "local_file":
                data = (REPO / source["path"]).read_bytes()
            elif source["kind"] == "git_blob":
                data = git_blob(REPO / source["repository"], source["commit"], source["path"])
            elif source["kind"] == "https_pinned_blob":
                if source["commit"] not in source["url"]:
                    raise ValueError(f"unpinned URL for {source['id']}")
                if not args.verify_remote:
                    continue
                with urllib.request.urlopen(source["url"], timeout=30) as response:
                    data = response.read()
            else:
                raise ValueError(f"unknown source kind {source.get('kind')}")
            observed = digest(data)
            if observed != source["sha256"]:
                errors.append(
                    f"source digest drift {source['id']}: "
                    f"expected={source['sha256']} observed={observed}"
                )
        except (OSError, KeyError, ValueError, subprocess.SubprocessError) as exc:
            errors.append(f"cannot verify source {source.get('id')}: {exc}")

    ontology = artifacts.get("evidence-procedure-ontology.json", {})
    for source_ref in ontology.get("source_refs", []):
        if source_ref not in source_id_set:
            errors.append(f"ontology uses unknown source {source_ref}")
    node_ids = [item.get("id") for item in ontology.get("nodes", [])]
    if len(node_ids) != len(set(node_ids)):
        errors.append("duplicate ontology node IDs")
    node_id_set = set(node_ids)
    relation_ids: set[str] = set()
    for relation in ontology.get("relations", []):
        if relation.get("id") in relation_ids:
            errors.append(f"duplicate ontology relation {relation.get('id')}")
        relation_ids.add(relation.get("id"))
        if relation.get("source") not in node_id_set or relation.get("target") not in node_id_set:
            errors.append(f"unknown ontology endpoint in {relation.get('id')}")

    inventory = artifacts.get("lean-construct-inventory.json", {})
    constructs = inventory.get("constructs", [])
    construct_ids = [item.get("id") for item in constructs]
    if len(construct_ids) != len(set(construct_ids)):
        errors.append("duplicate construct IDs")
    construct_id_set = set(construct_ids)
    for construct in constructs:
        if construct.get("source_ref") not in source_id_set:
            errors.append(f"construct uses unknown source {construct.get('source_ref')}")
        unknown_specs = set(construct.get("relevant_specs", [])) - EXPECTED_SPECS
        if unknown_specs:
            errors.append(f"construct {construct.get('id')} uses unknown specs {sorted(unknown_specs)}")

    matrix = artifacts.get("spec-reuse-matrix.json", {})
    rows = matrix.get("rows", [])
    matrix_specs = [item.get("spec_id") for item in rows]
    if len(matrix_specs) != len(set(matrix_specs)):
        errors.append("duplicate matrix spec IDs")
    if set(matrix_specs) != EXPECTED_SPECS:
        errors.append(
            f"20-spec denominator mismatch: missing={sorted(EXPECTED_SPECS-set(matrix_specs))} "
            f"extra={sorted(set(matrix_specs)-EXPECTED_SPECS)}"
        )
    for row in rows:
        unknown_constructs = set(row.get("candidate_constructs", [])) - construct_id_set
        if unknown_constructs:
            errors.append(f"matrix row {row.get('spec_id')} uses unknown constructs {sorted(unknown_constructs)}")

    import_report = artifacts.get("import-closure-report.json", {})
    classified = [item.get("construct_id") for item in import_report.get("classifications", [])]
    if len(classified) != len(set(classified)):
        errors.append("duplicate import-closure construct IDs")
    if set(classified) != construct_id_set:
        errors.append(
            f"import-closure mismatch: missing={sorted(construct_id_set-set(classified))} "
            f"extra={sorted(set(classified)-construct_id_set)}"
        )

    order = artifacts.get("proof-attack-order.json", {})
    waves = order.get("waves", [])
    wave_ids = [item.get("id") for item in waves]
    if len(wave_ids) != len(set(wave_ids)):
        errors.append("duplicate proof-wave IDs")
    wave_id_set = set(wave_ids)
    ordered_specs: list[str] = []
    for wave in waves:
        unknown_dependencies = set(wave.get("depends_on", [])) - wave_id_set
        if unknown_dependencies:
            errors.append(f"wave {wave.get('id')} has unknown dependencies {sorted(unknown_dependencies)}")
        ordered_specs.extend(wave.get("spec_ids", []))
    if len(ordered_specs) != len(set(ordered_specs)):
        errors.append("proof attack order repeats specifications")
    if set(ordered_specs) != EXPECTED_SPECS:
        errors.append(
            f"proof attack coverage mismatch: missing={sorted(EXPECTED_SPECS-set(ordered_specs))} "
            f"extra={sorted(set(ordered_specs)-EXPECTED_SPECS)}"
        )
    for row in rows:
        if row.get("attack_wave") not in wave_id_set:
            errors.append(f"matrix row {row.get('spec_id')} uses unknown wave {row.get('attack_wave')}")
        elif row.get("spec_id") not in next(
            wave.get("spec_ids", []) for wave in waves if wave.get("id") == row.get("attack_wave")
        ):
            errors.append(f"matrix/wave mismatch for {row.get('spec_id')}")

    material = hashlib.sha256()
    for relative in sorted((*JSON_ARTIFACTS, "README.md", "schemas/lean-reuse-audit.schema.json", "validate.py")):
        path = PACKAGE / relative
        if not path.is_file():
            errors.append(f"missing package file {relative}")
            continue
        material.update(relative.encode("utf-8") + b"\0" + path.read_bytes() + b"\0")

    result = {
        "schema_version": "cav2-pythonconstraint-lean-reuse-validation/v1",
        "status": "PASS" if not errors else "BLOCK",
        "remote_verification": "performed" if args.verify_remote else "skipped",
        "counts": {
            "sources": len(source_ids),
            "ontology_nodes": len(node_ids),
            "ontology_relations": len(relation_ids),
            "constructs": len(construct_ids),
            "specifications": len(matrix_specs),
            "attack_waves": len(wave_ids),
        },
        "material_digest": material.hexdigest(),
        "authority_effect": "none",
        "admission": "not-requested",
        "errors": errors,
    }
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
