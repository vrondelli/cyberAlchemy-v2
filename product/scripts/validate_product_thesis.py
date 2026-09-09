#!/usr/bin/env python3
"""Validate the private CyberAlchemy Product Thesis package without effects by default."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
MATERIAL_FILES = (
    "PRODUCT-THESIS.md",
    "PRODUCT-THESIS-DOCUMENT-TYPE.md",
    "product-thesis.record.json",
    "product-thesis.sources.json",
    "schemas/product-thesis-record.schema.json",
    "scripts/validate_product_thesis.py",
)


def load(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"cannot load {path}: {exc}")
        return {}
    if not isinstance(value, dict):
        errors.append(f"{path} must contain one JSON object")
        return {}
    return value


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def material_digest(errors: list[str]) -> str:
    digest = hashlib.sha256()
    for relative in sorted(MATERIAL_FILES):
        path = PACKAGE_ROOT / relative
        if not path.is_file():
            errors.append(f"missing material file: {relative}")
            continue
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    errors: list[str] = []
    record = load(PACKAGE_ROOT / "product-thesis.record.json", errors)
    sources_doc = load(PACKAGE_ROOT / "product-thesis.sources.json", errors)
    schema = load(PACKAGE_ROOT / "schemas/product-thesis-record.schema.json", errors)
    nodes_doc = load(REPOSITORY_ROOT / "cyberAlchemy-v2/ontology/product/nodes.json", errors)
    relations_doc = load(REPOSITORY_ROOT / "cyberAlchemy-v2/ontology/product/relations.json", errors)

    required = set(schema.get("required", []))
    missing = sorted(required - set(record))
    extra = sorted(set(record) - set(schema.get("properties", {})))
    if missing:
        errors.append(f"record missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"record unknown keys: {', '.join(extra)}")

    expected = {
        "schema_version": "cav2-product-thesis-record/v1",
        "canonical_kind": "product-thesis",
        "thesis_id": "CA2-PRODUCT-THESIS-CYBERALCHEMY",
        "definition_ref": "CAV2-D63",
        "carrier_ref": "PRODUCT-THESIS.md",
        "commitment_state": "committed",
        "artifact_authority_state": "candidate",
        "authority_effect": "none",
    }
    for field, value in expected.items():
        if record.get(field) != value:
            errors.append(f"record {field} must be {value!r}")

    expected_principles = {
        "human-agency", "bounded-and-visible-authority", "governance-serves-the-work",
        "dynamic-human-machine-work-fit", "shared-meaning", "evidence-continuity",
        "owner-continuity", "honest-incompleteness", "progressive-context-sufficiency",
    }
    if set(record.get("first_order_principles", [])) != expected_principles:
        errors.append("record must preserve the nine first-order product principles")

    carrier_path = PACKAGE_ROOT / str(record.get("carrier_ref", ""))
    carrier = carrier_path.read_text(encoding="utf-8") if carrier_path.is_file() else ""
    for marker in (
        "Canonical kind: product-thesis",
        "Thesis ID: CA2-PRODUCT-THESIS-CYBERALCHEMY",
        "Canonical definition: CAV2-D63",
        "Commitment state: committed",
        "## Thesis",
        "## First-Order Product Principles",
        "## Language-Guided Agent Work",
        "## Evidence That Would Require Revision",
    ):
        if marker not in carrier:
            errors.append(f"carrier is missing marker: {marker}")

    language_boundary = (
        "language consultation does not grant meaning ownership, accept a definition, "
        "choose an unresolved realization, or create authority"
    )
    if language_boundary not in record.get("boundaries", []):
        errors.append("record must preserve the no-authority Language consultation boundary")
    if "digest-bound Language Context Views reduce semantic drift in agent-produced Definition Packs" not in record.get("hypotheses", []):
        errors.append("record must preserve the Language Context View product hypothesis")
    revisions = record.get("revision_history", [])
    if not any(item.get("revision") == 2 for item in revisions if isinstance(item, dict)):
        errors.append("record must contain the Language consultation revision")

    source_ids: set[str] = set()
    for index, source in enumerate(sources_doc.get("sources", [])):
        if not isinstance(source, dict) or set(source) != {"id", "path", "sha256", "posture", "owner_route"}:
            errors.append(f"sources[{index}] has an invalid shape")
            continue
        source_ids.add(str(source["id"]))
        path = REPOSITORY_ROOT / str(source["path"])
        if not path.is_file():
            errors.append(f"missing source: {source['path']}")
        elif sha256(path) != source["sha256"]:
            errors.append(f"source digest drift: {source['id']}")
    if "SRC-CAV2-DEFINITIONS" not in source_ids:
        errors.append("sources must bind the canonical definition authority")

    nodes = nodes_doc.get("nodes", [])
    thesis_nodes = [node for node in nodes if node.get("id") == "CA2-THESIS-GOVERNED-HMI"]
    if len(thesis_nodes) != 1:
        errors.append("product ontology must contain exactly one thesis node")
    else:
        refs = {(ref.get("source_id"), ref.get("selector")) for ref in thesis_nodes[0].get("source_refs", [])}
        if ("SRC-CAV2-DEFINITIONS", "## CAV2-D63: Product Thesis") not in refs:
            errors.append("thesis node does not bind CAV2-D63")
        if ("SRC-CAV2-PRODUCT-THESIS-RECORD", "CA2-PRODUCT-THESIS-CYBERALCHEMY") not in refs:
            errors.append("thesis node does not bind the Product Thesis record")
    if not any(
        relation.get("source") == "CA2-PROJECT-PYTHONCONSTRAINT-WHOLE"
        and relation.get("target") == "CA2-THESIS-GOVERNED-HMI"
        for relation in relations_doc.get("relations", [])
    ):
        errors.append("no Project realization-test relation reaches the thesis")

    digest = material_digest(errors)
    status = "PASS" if not errors else "BLOCK"
    receipt = {
        "schema_version": "cav2-product-thesis-validation/v1",
        "validated_at": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "thesis_id": record.get("thesis_id"),
        "material_digest": digest,
        "counts": {"sources": len(source_ids), "principles": len(record.get("first_order_principles", [])), "ontology_bindings": 2},
        "claim_ceiling": record.get("claim_ceiling"),
        "authority_effect": "none",
        "errors": errors,
    }
    if args.write_receipt and status == "PASS":
        receipts = PACKAGE_ROOT / "receipts"
        receipts.mkdir(exist_ok=True)
        receipt_path = receipts / f"validation-{digest[:16]}.json"
        if not receipt_path.exists():
            receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
