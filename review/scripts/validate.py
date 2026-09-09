#!/usr/bin/env python3
"""Validate the two candidate CyberAlchemy review capability verticals."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
MATERIAL_FILES = (
    "README.md", "profile.json", "sources.json", "business-ontology.json",
    "capabilities/decision-gate.product-capability.json",
    "capabilities/complexity-example-ladder.product-capability.json",
    "capabilities/support.json", "schemas/review-capabilities.schema.json",
    "domainspec/development-profile.json", "domainspec/project.json",
    "domainspec/feature.json", "domainspec/nodes/consequential-decision.json",
    "domainspec/nodes/option-admissibility-rule.json",
    "domainspec/nodes/complexity-example-ladder.json",
    "domainspec/nodes/invariant-preservation-rule.json",
    "domainspec/nodes/review-capability-workflow.json",
    "domainspec/generated/graph.json", "domainspec/generated/source-manifest.json",
    "domainspec/generated/SPEC.md", "domainspec/generated/markdown-view.json",
    "domainspec/generated/build-receipt.json",
    "domainspec/generated/system-ontology.json",
    "domainspec/generated/system-ontology-receipt.json",
    "scripts/build.ts", "scripts/validate.py", "construction-binding.json",
    "conformance.json", "tests/test_negative_mutations.py",
)


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON object required: {path}")
    return value


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def heading_section(path: Path, selector: str) -> bytes:
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    starts = [index for index, line in enumerate(lines) if line.rstrip("\r\n") == selector]
    if len(starts) != 1:
        raise ValueError(f"heading must resolve once: {selector}: {len(starts)}")
    start = starts[0]
    end = next(
        (index for index in range(start + 1, len(lines)) if lines[index].startswith("## ")),
        len(lines),
    )
    return "".join(lines[start:end]).encode()


def schema_errors(instance: Any, schema: dict[str, Any], definition: str, label: str) -> list[str]:
    wrapper = {"$schema":"https://json-schema.org/draft/2020-12/schema","$defs":schema["$defs"],"$ref":f"#/$defs/{definition}"}
    return [
        f"{label}.{'.'.join(map(str, error.path)) or '$'}: {error.message}"
        for error in sorted(Draft202012Validator(wrapper).iter_errors(instance), key=lambda item: list(item.path))
    ]


def material_digest(root: Path, errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = root / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate_package(
    package_root: Path = PACKAGE_ROOT,
    *,
    repository_root: Path = REPOSITORY_ROOT,
    skip_build: bool = False,
) -> dict[str, Any]:
    errors: list[str] = []
    try:
        schema = load(package_root / "schemas/review-capabilities.schema.json")
        profile = load(package_root / "profile.json")
        sources = load(package_root / "sources.json")
        ontology = load(package_root / "business-ontology.json")
        support = load(package_root / "capabilities/support.json")
        decision = load(package_root / "capabilities/decision-gate.product-capability.json")
        ladder = load(package_root / "capabilities/complexity-example-ladder.product-capability.json")
        construction = load(package_root / "construction-binding.json")
        conformance = load(package_root / "conformance.json")
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return {"status":"BLOCK","errors":[str(exc)],"authority_effect":"none"}

    for value, definition, label in (
        (profile, "profile", "profile"),
        (sources, "sourceRegistry", "sources"),
        (ontology, "businessOntology", "business ontology"),
        (support, "supportRegistry", "support"),
        (construction, "constructionBinding", "construction binding"),
        (conformance, "conformance", "conformance"),
    ):
        errors.extend(schema_errors(value, schema, definition, label))

    shared = load(repository_root / "cyberAlchemy-v2/capability/schemas/capability.schema.json")
    errors.extend(schema_errors(decision, shared, "productCapability", "decision Product Capability"))
    errors.extend(schema_errors(ladder, shared, "productCapability", "ladder Product Capability"))

    source_by_id = {item.get("source_id"): item for item in sources.get("sources", []) if isinstance(item, dict)}
    selection_ids: list[str] = []
    for item in sources.get("selections", []):
        if not isinstance(item, dict):
            continue
        selection_id = str(item.get("selection_id"))
        selection_ids.append(selection_id)
        source = source_by_id.get(item.get("source_id"))
        if not source:
            errors.append(f"selection source missing: {selection_id}")
            continue
        path = repository_root / str(source.get("path"))
        try:
            selected = path.read_bytes() if item.get("scope_kind") == "whole-file" else heading_section(path, str(item.get("selector")))
            actual = sha256_bytes(selected)
            if actual != item.get("sha256"):
                errors.append(f"source selection digest drift: {selection_id}: {actual}")
        except (OSError, ValueError) as exc:
            errors.append(f"source selection not evaluable: {selection_id}: {exc}")
    if len(selection_ids) != len(set(selection_ids)):
        errors.append("source selection IDs are not unique")

    nodes = ontology.get("nodes", [])
    node_ids = [item.get("id") for item in nodes if isinstance(item, dict)]
    if len(node_ids) != len(set(node_ids)):
        errors.append("business ontology node IDs are not unique")
    known_nodes = set(node_ids)
    for relation in ontology.get("relations", []):
        if relation.get("source") not in known_nodes or relation.get("target") not in known_nodes:
            errors.append(f"business ontology relation endpoint missing: {relation.get('id')}")

    records = support.get("records", [])
    record_ids = [item.get("id") for item in records if isinstance(item, dict)]
    if len(record_ids) != len(set(record_ids)):
        errors.append("support record IDs are not unique")
    support_ids = set(record_ids)
    residue_ids = {item.get("id") for item in support.get("residue", []) if isinstance(item, dict)}
    for product in (decision, ladder):
        refs = set(product.get("input_contract_refs", [])) | set(product.get("output_contract_refs", []))
        refs |= set(product.get("context_policy_refs", [])) | set(product.get("realization_binding_refs", []))
        refs.add(product.get("obligation_registry_ref"))
        missing = sorted(ref for ref in refs if ref not in support_ids)
        if missing:
            errors.append(f"Product Capability support refs missing: {product.get('capability_id')}: {missing}")
        missing_residue = sorted(ref for ref in product.get("lifecycle_posture", {}).get("residue_refs", []) if ref not in residue_ids)
        if missing_residue:
            errors.append(f"Product Capability residue refs missing: {product.get('capability_id')}: {missing_residue}")
        business_refs = {product.get("product_ref"), product.get("business_ontology_ref"), *product.get("outcome_refs", []), *product.get("participant_refs", []), *product.get("consumer_refs", [])}
        missing_business = sorted(ref for ref in business_refs if ref not in known_nodes)
        if missing_business:
            errors.append(f"Product Capability business refs missing: {product.get('capability_id')}: {missing_business}")
        if product.get("authority_effect") != "none":
            errors.append(f"Product Capability authority exceeds none: {product.get('capability_id')}")

    if not skip_build:
        command = [
            str(repository_root / "toolchains/node-typescript/bin/node-env"), "run",
            "--project", "projects/domainspec-v2/impl", "--", "node", "--import", "tsx",
            "../../../cyberAlchemy-v2/review/scripts/build.ts", "--emit-json",
        ]
        runs: list[dict[str, str]] = []
        for _ in range(2):
            completed = subprocess.run(command, cwd=repository_root, capture_output=True, text=True, check=False)
            if completed.returncode != 0:
                errors.append(f"DomainSpec build failed: {completed.stderr.strip()}")
                break
            try:
                runs.append(json.loads(completed.stdout))
            except json.JSONDecodeError as exc:
                errors.append(f"DomainSpec build output invalid: {exc}")
                break
        if len(runs) == 2 and runs[0] != runs[1]:
            errors.append("DomainSpec two-run build is not deterministic")
        if runs:
            for name, expected in runs[0].items():
                path = package_root / "domainspec/generated" / name
                if not path.is_file() or path.read_text(encoding="utf-8") != expected:
                    errors.append(f"generated artifact drift: {name}")

    system_path = package_root / "domainspec/generated/system-ontology.json"
    system_digest = sha256_file(system_path) if system_path.is_file() else None
    graph_path = package_root / "domainspec/generated/graph.json"
    expected_stage_states = {
        "definitions":"validated", "product_capabilities":"validated", "business_ontology":"validated",
        "domainspec_source":"validated", "compiled_graph":"validated", "system_ontology":"candidate",
        "realization_bindings":"candidate", "conformance":"not_evaluable",
    }
    stages = construction.get("stages", [])
    if {item.get("name"):item.get("state") for item in stages if isinstance(item, dict)} != expected_stage_states:
        errors.append("construction stage states are not exact")
    for key, path in (
        ("domainspec_project", package_root / "domainspec/project.json"),
        ("compiled_graph", graph_path),
        ("system_ontology", system_path),
    ):
        if path.is_file() and construction.get(key, {}).get("sha256") != sha256_file(path):
            errors.append(f"construction digest drift: {key}")
    for binding in construction.get("realization_bindings", []):
        path = repository_root / str(binding.get("ref"))
        if not path.is_file() or binding.get("sha256") != sha256_file(path):
            errors.append(f"realization binding drift: {binding.get('ref')}")
    if conformance.get("status") != "NOT_EVALUABLE":
        errors.append("conformance must remain NOT_EVALUABLE")
    if system_digest and conformance.get("system_ontology_digest") != system_digest:
        errors.append("conformance system ontology digest drift")
    test_path = package_root / "tests/test_negative_mutations.py"
    if test_path.is_file() and conformance.get("test_digest") != sha256_file(test_path):
        errors.append("conformance test digest drift")
    for binding in conformance.get("subject_refs", []):
        path = repository_root / str(binding.get("ref"))
        if not path.is_file() or binding.get("sha256") != sha256_file(path):
            errors.append(f"conformance subject digest drift: {binding.get('ref')}")
    required_blockers = {
        "DOMAINSPEC_PROFILE_NOT_ADMITTED", "SYSTEM_ONTOLOGY_NOT_ADMITTED",
        "PRODUCT_CAPABILITIES_NOT_ADOPTED", "REALIZATION_BASELINE_NOT_OWNER_ACCEPTED",
        "REALIZATION_CONFORMANCE_NOT_INDEPENDENTLY_ASSESSED",
    }
    if set(conformance.get("blockers", [])) != required_blockers:
        errors.append("conformance blockers are not exact")

    digest = material_digest(package_root, errors)
    return {
        "schema_version":"cav2-review-capabilities-validation/v1",
        "status":"PASS" if not errors else "BLOCK",
        "package_root":"cyberAlchemy-v2/review",
        "counts":{"product_capabilities":2,"business_nodes":len(nodes),"business_relations":len(ontology.get("relations", [])),"support_records":len(records),"domainspec_nodes":5},
        "material_digest":digest,
        "construction_status":"candidate",
        "conformance_status":"NOT_EVALUABLE",
        "authority_effect":"none",
        "errors":errors,
        "claim_ceiling":"Candidate D65 structure and deterministic observations only; no Product Capability adoption, profile or system-ontology admission, accepted realization baseline, behavioral conformance, human decision effect, publication, deployment, or external effect.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-build", action="store_true")
    args = parser.parse_args()
    result = validate_package(skip_build=args.skip_build)
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
