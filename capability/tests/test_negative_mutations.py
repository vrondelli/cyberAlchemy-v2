#!/usr/bin/env python3
"""Hostile mutation checks for the CAV2 Capability Ontology package."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
from pathlib import Path
from typing import Callable


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("capability_validate", PACKAGE_ROOT / "scripts/validate.py")
assert spec and spec.loader
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def source_drift(root: Path) -> None:
    path = root / "sources.json"; value = load(path); value["selections"][0]["selection_sha256"] = "0" * 64; write(path, value)


def kind_definition_collapse(root: Path) -> None:
    path = root / "capability-references.json"; value = load(path); value["references"][0]["definition_ref"] = "DEF-ARC-CAPABILITY"; write(path, value)


def generic_definition(root: Path) -> None:
    path = root / "nodes.json"; value = load(path)
    for node in value["nodes"]:
        if node["id"] == "CA2-CONCEPT-CAPABILITY-REFERENCE": node["definition_ref"] = "CAV2-D67"
    write(path, value)


def ownership_transfer(root: Path) -> None:
    path = root / "capability-references.json"; value = load(path); value["references"][1]["projection_posture"] = "owned-copy"; write(path, value)


def lifecycle_axis_without_vocabulary(root: Path) -> None:
    path = root / "capability-references.json"; value = load(path); value["references"][0]["lifecycle_posture"]["status"]["vocabulary_ref"] = ""; write(path, value)


def implementation_implies_conformance(root: Path) -> None:
    path = root / "capability-references.json"; value = load(path); value["references"][3]["conformance_posture"]["state"] = "conformant"; write(path, value)


def remove_non_implication(root: Path) -> None:
    path = root / "state-model.json"; value = load(path); value["non_implications"].pop(); write(path, value)


def dangling_relation(root: Path) -> None:
    path = root / "relations.json"; value = load(path); value["relations"][0]["target"] = "CA2-MISSING"; write(path, value)


def relation_signature_violation(root: Path) -> None:
    path = root / "relations.json"; value = load(path); value["relations"][0]["source"] = "CA2-CAP-DEFINE-SHARED-MEANING"; write(path, value)


def one_sided_bridge_evidence(root: Path) -> None:
    path = root / "relations.json"; value = load(path); value["relations"][5]["source_refs"] = ["CAP-SEL-DEFINE"]; write(path, value)


def schema_postimage_drift(root: Path) -> None:
    path = root / "schema-amendment-product-capability-v1.json"; value = load(path); value["postimage_schema_sha256"] = "0" * 64; write(path, value)


def capability_identity_transfer(root: Path) -> None:
    path = root / "migration.json"; value = load(path); value["target_instance_ref"] = "CA2-CAP-DEFINE-REPLACEMENT"; write(path, value)


def source_projection_rewrite(root: Path) -> None:
    path = root / "migration.json"; value = load(path); value["source_projection_unchanged"] = False; write(path, value)


def external_record_digest_drift(root: Path) -> None:
    path = root / "migration.json"; value = load(path); value["external_records"][0]["sha256"] = "0" * 64; write(path, value)


def authority_escalation(root: Path) -> None:
    path = root / "capability-references.json"; value = load(path); value["references"][0]["authority_effect"] = "adopt"; write(path, value)


def view_polarity_violation(root: Path) -> None:
    path = root / "views.json"; value = load(path); value["views"][0]["node_refs"].append("CA2-CONCEPT-AGENT-CAPABILITY"); write(path, value)


def unknown_field(root: Path) -> None:
    path = root / "profile.json"; value = load(path); value["generic_capability"] = True; write(path, value)


CASES: list[tuple[str, Callable[[Path], None], str]] = [
    ("selected source drift", source_drift, "selected-value digest drift"),
    ("kind and definition collapse", kind_definition_collapse, "capability kind and definition mismatch"),
    ("generic Capability definition", generic_definition, "must not become a generic Capability definition"),
    ("instance ownership transfer", ownership_transfer, "attempts capability instance ownership"),
    ("lifecycle vocabulary missing", lifecycle_axis_without_vocabulary, "lifecycle axis lacks vocabulary"),
    ("implementation implies conformance", implementation_implies_conformance, "conformant claim lacks evidence"),
    ("missing non-implication", remove_non_implication, "preserve every mandatory non-implication"),
    ("dangling relation", dangling_relation, "dangling endpoint"),
    ("relation signature violation", relation_signature_violation, "violates typed endpoint signature"),
    ("one-sided bridge evidence", one_sided_bridge_evidence, "public-private bridge lacks separate business and system source evidence"),
    ("schema amendment postimage drift", schema_postimage_drift, "schema amendment postimage digest does not match live schema"),
    ("Product Capability identity transfer", capability_identity_transfer, "migration changes the stable Product Capability identity"),
    ("source projection rewrite", source_projection_rewrite, "migration attempts to rewrite the source product projection"),
    ("external record digest drift", external_record_digest_drift, "raw digest mismatch"),
    ("authority escalation", authority_escalation, "exceeds authority ceiling"),
    ("view polarity violation", view_polarity_violation, "violates business node polarity"),
    ("unknown field", unknown_field, "Additional properties are not allowed"),
]


def main() -> int:
    baseline = validator.validate_package(PACKAGE_ROOT, REPOSITORY_ROOT)
    if baseline["status"] != "PASS":
        print(json.dumps({"status":"BLOCK","baseline_errors":baseline["errors"]}, indent=2))
        return 1
    results = []
    for label, mutation, expected in CASES:
        with tempfile.TemporaryDirectory(prefix="capability-negative-") as temp_dir:
            root = Path(temp_dir) / "capability"
            shutil.copytree(PACKAGE_ROOT, root, ignore=shutil.ignore_patterns("receipts", "__pycache__"))
            try:
                mutation(root)
            except Exception as exc:
                results.append({"case":label,"status":"FAIL","expected":expected,"errors":[f"mutation failed: {exc}"]})
                continue
            result = validator.validate_package(root, REPOSITORY_ROOT)
            joined = "\n".join(result["errors"])
            passed = result["status"] == "BLOCK" and expected in joined
            results.append({"case":label,"status":"PASS" if passed else "FAIL","expected":expected,"errors":result["errors"]})
    status = "PASS" if all(item["status"] == "PASS" for item in results) else "BLOCK"
    print(json.dumps({"status":status,"authority_effect":"none","cases":len(results),"results":results}, indent=2, ensure_ascii=False))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
