"""Structural compatibility for three exact, pinned Auth capability records.

This does not make them conform to the current shared Product Capability schema.
Changing an owner route requires a successor Product Capability (CAV2-D67).
"""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path

import jsonschema


SCHEMA_SHA256 = "56ec475db0150e6863e119d02c5e39e3410eafe38a09f2335bdfaf306daa311e"
LEGACY_RECORDS = {
    "product-capability.json": (
        "CA2-CAP-DECIDE-EXACT-SESSION-ROLE-PERMISSION",
        "3c043180b48389cb032565ddd1009652e3d9348faac7fa07eaaf2f02da2b7e07",
    ),
    "command-boundary-product-capability.json": (
        "CA2-CAP-ADMIT-AUTHORIZATION-COMMAND",
        "3651e737efabe338b409fc4094cb0da25cc6274be619bec8889f6b4b1ae5f222",
    ),
    "trusted-input-product-capability.json": (
        "CA2-CAP-RESOLVE-TRUSTED-AUTHORIZATION-INPUTS",
        "3ca69a9bab18bb9b1cb9663ba252e7669d9f8822d0191169a2da745448dfb40d",
    ),
}
LEGACY_ROLES = {
    "product-meaning", "definition-pack-shape", "runtime-contract",
    "next-use-suitability", "public-realization",
}


def _sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def inspect_legacy_bytes(name: str, record_bytes: bytes, schema_bytes: bytes) -> dict:
    """Return a nonauthorizing, exact-byte compatibility assessment."""
    selected = LEGACY_RECORDS.get(name)
    if selected is None or _sha256(record_bytes) != selected[1] or _sha256(schema_bytes) != SCHEMA_SHA256:
        return {"legacy_structural_compatibility": False, "current_schema_conformance": False}
    try:
        record = json.loads(record_bytes)
        schema = json.loads(schema_bytes)
    except (ValueError, UnicodeDecodeError):
        return {"legacy_structural_compatibility": False, "current_schema_conformance": False}
    if record.get("capability_id") != selected[0]:
        return {"legacy_structural_compatibility": False, "current_schema_conformance": False}
    roles = [row.get("responsibility") for row in record.get("owner_routes", []) if isinstance(row, dict)]
    if len(roles) != 5 or set(roles) != LEGACY_ROLES:
        return {"legacy_structural_compatibility": False, "current_schema_conformance": False}
    schema["$ref"] = "#/$defs/productCapability"
    current_errors = list(jsonschema.Draft202012Validator(schema).iter_errors(record))
    if len(current_errors) != 1 or current_errors[0].validator != "enum" or \
            list(current_errors[0].path)[-1:] != ["responsibility"] or \
            current_errors[0].instance != "public-realization":
        return {"legacy_structural_compatibility": False, "current_schema_conformance": not current_errors}
    legacy_schema = copy.deepcopy(schema)
    legacy_schema["$defs"]["ownerRoute"]["properties"]["responsibility"]["enum"] = sorted(LEGACY_ROLES)
    compatible = not list(jsonschema.Draft202012Validator(legacy_schema).iter_errors(record))
    return {"legacy_structural_compatibility": compatible, "current_schema_conformance": False}


def inspect_legacy_capability(path: Path, schema_path: Path) -> dict:
    if path.parent.resolve() != Path(__file__).resolve().parents[1]:
        return {"legacy_structural_compatibility": False, "current_schema_conformance": False}
    return inspect_legacy_bytes(path.name, path.read_bytes(), schema_path.read_bytes())
