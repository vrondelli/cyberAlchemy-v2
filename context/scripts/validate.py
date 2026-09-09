#!/usr/bin/env python3
"""Validate the private CAV2 Context ontology without writing by default."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
MATERIAL_FILES = (
    "README.md", "profile.json", "sources.json", "definitions.json",
    "nodes.json", "relations.json", "residue.json",
    "contexts/define-shared-meaning.context.json",
    "contexts/registry-context-first-vertical.context.json",
    "schemas/context.schema.json", "scripts/validate.py",
    "tests/test_negative_mutations.py",
)
CLAIM_CEILING = (
    "Canonical CAV2-D66 reference plus private candidate business-domain ontology "
    "and Context instances only; no Bounded Context redefinition, accepted Context "
    "View, correct-use proof, resolver implementation or conformance, Product, Project, "
    "or Goal lifecycle effect, publication, release, deployment, or external effect."
)


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def load(path: Path, label: str, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {label}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{label} must contain one JSON object")
        return {}
    return value


def exact_keys(value: Any, expected: set[str], label: str, errors: list[str]) -> None:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing:
        errors.append(f"{label} missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"{label} unknown keys: {', '.join(extra)}")


def validate_instance(
    schema: dict[str, Any], definition: str, instance: dict[str, Any],
    label: str, errors: list[str],
) -> None:
    validation_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$defs": schema["$defs"],
        "$ref": f"#/$defs/{definition}",
    }
    validator = Draft202012Validator(validation_schema)
    for violation in sorted(validator.iter_errors(instance), key=lambda item: list(item.path)):
        locator = ".".join(str(part) for part in violation.path)
        errors.append(f"{label}{'.' + locator if locator else ''}: {violation.message}")


def unique(values: list[str], label: str, errors: list[str]) -> None:
    duplicates = sorted({value for value in values if values.count(value) > 1})
    if duplicates:
        errors.append(f"duplicate {label}: {', '.join(duplicates)}")


def json_pointer(value: Any, pointer: str) -> Any:
    if pointer in {"", "/"}:
        return value
    current = value
    for raw in pointer.lstrip("/").split("/"):
        part = raw.replace("~1", "/").replace("~0", "~")
        current = current[int(part)] if isinstance(current, list) else current[part]
    return current


def selected_bytes(selection: dict[str, Any], raw: bytes, parsed: Any | None) -> bytes:
    kind = selection.get("selector_kind")
    selector = str(selection.get("selector"))
    if kind == "markdown-heading":
        lines = raw.decode("utf-8").splitlines(keepends=True)
        starts = [index for index, line in enumerate(lines) if line.rstrip("\r\n") == selector]
        if len(starts) != 1:
            raise ValueError(f"heading must resolve once; got {len(starts)}")
        start = starts[0]
        end = next((index for index in range(start + 1, len(lines)) if lines[index].startswith("## ")), len(lines))
        return "".join(lines[start:end]).encode("utf-8")
    if parsed is None:
        raise ValueError("JSON selector requires JSON source")
    if kind == "json-pointer":
        return canonical_json(json_pointer(parsed, selector))
    if kind == "json-record":
        collection = json_pointer(parsed, selector)
        field = selection.get("id_field")
        expected = selection.get("id_value")
        matches = [item for item in collection if isinstance(item, dict) and item.get(field) == expected]
        if len(matches) != 1:
            raise ValueError(f"record must resolve once; got {len(matches)}")
        return canonical_json(matches[0])
    raise ValueError(f"unsupported selector kind: {kind!r}")


def material_digest(root: Path, errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = root / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        digest.update(relative.encode("utf-8") + b"\0" + path.read_bytes() + b"\0")
    return digest.hexdigest()


def validate_package(package_root: Path = PACKAGE_ROOT, repository_root: Path = REPOSITORY_ROOT) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    profile = load(package_root / "profile.json", "profile", errors)
    sources_doc = load(package_root / "sources.json", "sources", errors)
    definitions_doc = load(package_root / "definitions.json", "definitions", errors)
    nodes_doc = load(package_root / "nodes.json", "nodes", errors)
    relations_doc = load(package_root / "relations.json", "relations", errors)
    residue_doc = load(package_root / "residue.json", "residue", errors)
    schema = load(package_root / "schemas/context.schema.json", "schema", errors)
    context_paths = sorted((package_root / "contexts").glob("*.context.json"))
    contexts = [load(path, str(path.relative_to(package_root)), errors) for path in context_paths]

    try:
        Draft202012Validator.check_schema(schema)
    except Exception as exc:
        errors.append(f"Context schema is invalid: {exc}")
    schema_instances = (
        ("profile", profile, "profile"),
        ("sources", sources_doc, "sourceRegistry"),
        ("definitions", definitions_doc, "definitionRegistry"),
        ("nodes", nodes_doc, "nodeRegistry"),
        ("relations", relations_doc, "relationRegistry"),
        ("residue", residue_doc, "residueRegistry"),
    )
    if schema:
        for label, instance, definition in schema_instances:
            validate_instance(schema, definition, instance, label, errors)
        for path, context in zip(context_paths, contexts):
            validate_instance(schema, "context", context, str(path.relative_to(package_root)), errors)

    if profile.get("ontology_id") != "cav2.context" or profile.get("ontology_type") != "business-domain":
        errors.append("profile must select cav2.context business-domain")
    if profile.get("package_root") != "cyberAlchemy-v2/context":
        errors.append("profile package root is invalid")
    if profile.get("canonical_definition_ref") != "CAV2-D66":
        errors.append("profile must bind CAV2-D66")
    if profile.get("authority_effect") != "none":
        errors.append("profile exceeds authority ceiling")

    sources = sources_doc.get("sources", [])
    selections = sources_doc.get("selections", [])
    source_by_id: dict[str, dict[str, Any]] = {}
    raw_by_id: dict[str, bytes] = {}
    parsed_by_id: dict[str, Any] = {}
    for index, source in enumerate(sources if isinstance(sources, list) else []):
        label = f"sources[{index}]"
        source_id = source.get("source_id")
        if source_id in source_by_id:
            errors.append(f"duplicate source id: {source_id}")
        source_by_id[source_id] = source
        relative = Path(str(source.get("path", "")))
        if relative.is_absolute() or ".." in relative.parts or not str(relative).startswith("cyberAlchemy-v2/"):
            errors.append(f"{label} path is unbounded")
            continue
        path = repository_root / relative
        if not path.is_file():
            errors.append(f"{label} source missing: {relative}")
            continue
        raw = path.read_bytes()
        raw_by_id[source_id] = raw
        if sha256(raw) != source.get("observed_file_sha256"):
            warnings.append(f"{label} containing-file digest changed: {relative}")
        try:
            parsed_by_id[source_id] = json.loads(raw)
        except (UnicodeDecodeError, json.JSONDecodeError):
            pass

    selection_by_id: dict[str, dict[str, Any]] = {}
    for index, selection in enumerate(selections if isinstance(selections, list) else []):
        label = f"selections[{index}]"
        selection_id = selection.get("selection_id")
        if selection_id in selection_by_id:
            errors.append(f"duplicate selection id: {selection_id}")
        selection_by_id[selection_id] = selection
        source_id = selection.get("source_id")
        if source_id not in raw_by_id:
            errors.append(f"{label} unavailable source: {source_id!r}")
            continue
        try:
            selected = selected_bytes(selection, raw_by_id[source_id], parsed_by_id.get(source_id))
        except (KeyError, IndexError, TypeError, ValueError, UnicodeDecodeError) as exc:
            errors.append(f"{label} selector does not resolve: {exc}")
            continue
        if sha256(selected) != selection.get("selection_sha256"):
            errors.append(f"{label} selected-value digest drift: {selection_id}")
    known_selections = set(selection_by_id)

    definitions = definitions_doc.get("definitions", [])
    if len(definitions) != 1 or definitions[0].get("definition_ref") != "CAV2-D66":
        errors.append("definitions must contain exactly one canonical CAV2-D66 reference")
    if definitions and definitions[0].get("local_posture") != "reference-only":
        errors.append("Context package must not redefine CAV2-D66")

    nodes = nodes_doc.get("nodes", [])
    node_by_id: dict[str, dict[str, Any]] = {}
    for index, node in enumerate(nodes if isinstance(nodes, list) else []):
        node_id = node.get("id")
        if node_id in node_by_id:
            errors.append(f"duplicate node id: {node_id}")
        node_by_id[node_id] = node
        if node.get("authority_effect") != "none":
            errors.append(f"nodes[{index}] exceeds authority ceiling")
        for ref in node.get("source_refs", []):
            if ref not in known_selections:
                errors.append(f"nodes[{index}] unknown source ref: {ref}")
    if node_by_id.get("CA2-CONCEPT-CONTEXT", {}).get("definition_ref") != "CAV2-D66":
        errors.append("Context node must bind CAV2-D66")
    boundary = node_by_id.get("CA2-CONCEPT-CONTEXT", {}).get("forbidden_collapse", "")
    if "Bounded Context" not in boundary:
        errors.append("Context node must preserve Bounded Context distinction")
    forbidden_runtime_nodes = {
        "CA2-CONCEPT-CONTEXT-REQUEST",
        "CA2-CAP-RESOLVE-CONTEXT",
        "CA2-OUTPUT-CONTEXT-VIEW",
    }
    present_runtime_nodes = sorted(forbidden_runtime_nodes & set(node_by_id))
    if present_runtime_nodes:
        errors.append(f"generic Context package contains Registry Context runtime nodes: {', '.join(present_runtime_nodes)}")

    vocabulary = relations_doc.get("relation_vocabulary", [])
    vocab_by_type = {item.get("type"): item for item in vocabulary if isinstance(item, dict)}
    relations = relations_doc.get("relations", [])
    relation_ids: list[str] = []
    for index, relation in enumerate(relations if isinstance(relations, list) else []):
        relation_ids.append(relation.get("id"))
        source = node_by_id.get(relation.get("source"))
        target = node_by_id.get(relation.get("target"))
        if not source or not target:
            errors.append(f"relations[{index}] has dangling endpoint")
            continue
        rule = vocab_by_type.get(relation.get("type"))
        if not rule:
            errors.append(f"relations[{index}] unknown relation type")
        elif source.get("role") not in rule.get("source_roles", []) or target.get("role") not in rule.get("target_roles", []):
            errors.append(f"relations[{index}] violates typed endpoint signature")
        if relation.get("authority_effect") != "none":
            errors.append(f"relations[{index}] exceeds authority ceiling")
        for ref in relation.get("source_refs", []):
            if ref not in known_selections:
                errors.append(f"relations[{index}] unknown source ref: {ref}")
    unique(relation_ids, "relation id", errors)

    project_records = {
        value.get("project_id"): value
        for value in parsed_by_id.values()
        if isinstance(value, dict) and isinstance(value.get("project_id"), str)
    }
    goal_records = {
        value.get("goal_id"): value
        for value in parsed_by_id.values()
        if isinstance(value, dict) and isinstance(value.get("goal_id"), str)
    }
    context_ids: list[str] = []
    for index, context in enumerate(contexts):
        label = f"contexts[{index}]"
        context_id = context.get("context_id")
        context_ids.append(context_id)
        if context_id not in node_by_id or node_by_id.get(context_id, {}).get("role") != "context":
            errors.append(f"{label} lacks matching context node")
        if context.get("definition_ref") != "CAV2-D66":
            errors.append(f"{label} must bind CAV2-D66")
        if context.get("authority_effect") != "none":
            errors.append(f"{label} exceeds authority ceiling")
        kind = context.get("context_kind")
        project_ref = context.get("project_ref")
        goal_ref = context.get("goal_ref")
        if kind == "product" and (project_ref is not None or goal_ref is not None):
            errors.append(f"{label} product Context cannot carry Project or Goal")
        if kind == "project" and (not project_ref or goal_ref is not None):
            errors.append(f"{label} project Context requires Project and forbids Goal")
        if kind == "goal" and (not project_ref or not goal_ref):
            errors.append(f"{label} goal Context requires Project and Goal")
        if context.get("product_ref") not in node_by_id or node_by_id.get(context.get("product_ref"), {}).get("role") != "product":
            errors.append(f"{label} must reference one Product node")
        if project_ref and node_by_id.get(project_ref, {}).get("role") != "project":
            errors.append(f"{label} Project ref is invalid")
        if goal_ref and node_by_id.get(goal_ref, {}).get("role") != "goal":
            errors.append(f"{label} Goal ref is invalid")
        for ref in context.get("consumer_refs", []):
            if node_by_id.get(ref, {}).get("role") != "capability":
                errors.append(f"{label} consumer is not a capability: {ref}")
        for ref in context.get("bounded_context_refs", []):
            if node_by_id.get(ref, {}).get("role") != "bounded_context":
                errors.append(f"{label} Bounded Context ref is invalid: {ref}")
        for ref in context.get("source_policy_refs", []):
            if node_by_id.get(ref, {}).get("role") != "policy":
                errors.append(f"{label} source policy is invalid: {ref}")
        if goal_ref:
            project_record = project_records.get(project_ref)
            goal_record = goal_records.get(goal_ref)
            if (
                project_record is None
                or goal_record is None
                or goal_record.get("project_ref") != project_ref
                or goal_ref not in project_record.get("goal_refs", [])
            ):
                errors.append(f"{label} Goal does not belong to its Project")
    unique(context_ids, "Context id", errors)

    residue = residue_doc.get("residue", [])
    for index, item in enumerate(residue if isinstance(residue, list) else []):
        for ref in item.get("subject_refs", []):
            if ref not in node_by_id:
                errors.append(f"residue[{index}] unknown subject ref: {ref}")
        for ref in item.get("source_refs", []):
            if ref not in known_selections:
                errors.append(f"residue[{index}] unknown source ref: {ref}")

    digest = material_digest(package_root, errors)
    receipt_current = False
    receipts_dir = package_root / "receipts"
    if receipts_dir.is_dir():
        for path in sorted(receipts_dir.glob("validation-*.json")):
            receipt = load(path, str(path.relative_to(package_root)), errors)
            if receipt.get("material_digest") == digest and receipt.get("status") == "PASS":
                receipt_current = True
    if not receipt_current:
        warnings.append("no current PASS receipt matches the live material digest")

    checks = [
        "canonical CAV2-D66 reference without local redefinition",
        "closed Draft 2020-12 schemas for every agent-facing Context artifact",
        "selector-level source currency",
        "business-domain node and typed-relation closure",
        "Context kind and Product-Project-Goal cardinality",
        "Goal belongs to Project for every goal Context",
        "Context and Bounded Context distinction with explicit typed reference",
        "generic business ontology excludes resolver, request, and runtime View nodes",
        "authority_effect none throughout",
        "content-addressed receipt currency",
    ]
    return {
        "schema_ref": "schemas/context.schema.json#/$defs/validationReceipt",
        "schema_version": "cav2-context-validation/v1",
        "validated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "status": "PASS" if not errors else "BLOCK",
        "package_root": "cyberAlchemy-v2/context",
        "ontology_type": "business-domain",
        "branch": "business",
        "authority_effect": "none",
        "counts": {"sources": len(sources), "selections": len(selections), "definitions": len(definitions), "nodes": len(nodes), "relation_types": len(vocabulary), "relations": len(relations), "contexts": len(contexts), "residue": len(residue)},
        "material_digest": digest,
        "checks": checks,
        "warnings": warnings,
        "errors": errors,
        "claim_ceiling": CLAIM_CEILING,
    }


def write_receipt(result: dict[str, Any], package_root: Path = PACKAGE_ROOT) -> Path:
    if result.get("status") != "PASS":
        raise ValueError("cannot write receipt for blocked package")
    path = package_root / "receipts" / f"validation-{result['material_digest'][:16]}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        existing = json.loads(path.read_text(encoding="utf-8"))
        if existing.get("material_digest") != result.get("material_digest"):
            raise ValueError(f"receipt collision: {path}")
        return path
    path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    result = validate_package()
    if args.write_receipt and result["status"] == "PASS":
        result["receipt_path"] = str(write_receipt(result).relative_to(REPOSITORY_ROOT))
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
