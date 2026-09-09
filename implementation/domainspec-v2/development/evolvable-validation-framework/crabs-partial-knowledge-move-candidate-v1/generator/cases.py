#!/usr/bin/env python3
"""Generate the canonical partial-knowledge move matrix.

This module only enumerates cases.  It never imports, builds, or runs CRABS.
"""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import os
import tempfile
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "evf.crabs-partial-knowledge-cases/v1"
DELIVERIES = ("bc", "cb")
VERSIONS = ("b-newer", "c-newer")
ROLES = ("rab", "rac", "rfull")
ASSOCIATIONS = ("left", "right")
EXPECTED_ORDER = {"b-newer": "BAC", "c-newer": "CAB"}
DENOMINATOR = 48


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def case_set_digest(cases: list[dict[str, Any]]) -> str:
    return hashlib.sha256(canonical_bytes(cases)).hexdigest()


def enumerate_cases() -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = []
    for delivery, version, permutation, association in itertools.product(
        DELIVERIES, VERSIONS, itertools.permutations(ROLES), ASSOCIATIONS
    ):
        permutation_id = "-".join(permutation)
        case_id = (
            f"delivery-{delivery}__version-{version}__"
            f"perm-{permutation_id}__assoc-{association}"
        )
        cases.append(
            {
                "association": association,
                "case_id": case_id,
                "delivery_order": delivery,
                "expected_visible_order": EXPECTED_ORDER[version],
                "move_version": version,
                "role_permutation": list(permutation),
            }
        )
    cases.sort(key=lambda item: item["case_id"].encode("ascii"))
    ids = [item["case_id"] for item in cases]
    if len(cases) != DENOMINATOR or len(set(ids)) != DENOMINATOR:
        raise RuntimeError("matrix is not exactly 48 unique cases")
    return cases


def document(cases: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "denominator": DENOMINATOR,
        "case_set_sha256": case_set_digest(cases),
        "cases": cases,
    }


def render_header(cases: list[dict[str, Any]]) -> bytes:
    role = {"rab": "EVF_ROLE_RAB", "rac": "EVF_ROLE_RAC", "rfull": "EVF_ROLE_RFULL"}
    lines = [
        "#ifndef EVF_GENERATED_CASES_H",
        "#define EVF_GENERATED_CASES_H",
        "",
        "#include <stddef.h>",
        "",
        "typedef enum { EVF_DELIVERY_BC = 0, EVF_DELIVERY_CB = 1 } evf_delivery_t;",
        "typedef enum { EVF_VERSION_B_NEWER = 0, EVF_VERSION_C_NEWER = 1 } evf_version_t;",
        "typedef enum { EVF_ROLE_RAB = 0, EVF_ROLE_RAC = 1, EVF_ROLE_RFULL = 2 } evf_role_t;",
        "typedef enum { EVF_ASSOC_LEFT = 0, EVF_ASSOC_RIGHT = 1 } evf_assoc_t;",
        "",
        "typedef struct {",
        "  const char *case_id;",
        "  evf_delivery_t delivery;",
        "  evf_version_t version;",
        "  evf_role_t roles[3];",
        "  evf_assoc_t association;",
        "  const char *expected_order;",
        "} evf_case_definition_t;",
        "",
        f'#define EVF_CASE_SET_SHA256 "{case_set_digest(cases)}"',
        f"#define EVF_CASE_COUNT {len(cases)}u",
        "",
        "static const evf_case_definition_t EVF_CASES[EVF_CASE_COUNT] = {",
    ]
    for item in cases:
        delivery = "EVF_DELIVERY_BC" if item["delivery_order"] == "bc" else "EVF_DELIVERY_CB"
        version = "EVF_VERSION_B_NEWER" if item["move_version"] == "b-newer" else "EVF_VERSION_C_NEWER"
        association = "EVF_ASSOC_LEFT" if item["association"] == "left" else "EVF_ASSOC_RIGHT"
        roles = ", ".join(role[value] for value in item["role_permutation"])
        lines.append(
            f'  {{"{item["case_id"]}", {delivery}, {version}, '
            f'{{{roles}}}, {association}, "{item["expected_visible_order"]}"}},'
        )
    lines.extend(["};", "", "#endif", ""])
    return "\n".join(lines).encode("ascii")


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def validate_manifest(path: Path, cases: list[dict[str, Any]]) -> None:
    value = json.loads(path.read_text(encoding="utf-8"))
    expected = {
        "delivery_orders": list(DELIVERIES),
        "move_versions": list(VERSIONS),
        "roles": list(ROLES),
        "associations": list(ASSOCIATIONS),
        "denominator": DENOMINATOR,
        "case_set_sha256": case_set_digest(cases),
    }
    for key, expected_value in expected.items():
        if value.get(key) != expected_value:
            raise ValueError(f"case manifest mismatch for {key}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", type=Path)
    parser.add_argument("--header", type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--print-digest", action="store_true")
    args = parser.parse_args()
    cases = enumerate_cases()
    if args.manifest:
        validate_manifest(args.manifest, cases)
    if args.json:
        atomic_write(args.json, json.dumps(document(cases), indent=2, sort_keys=True).encode() + b"\n")
    if args.header:
        atomic_write(args.header, render_header(cases))
    if args.print_digest or (not args.json and not args.header):
        print(case_set_digest(cases))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
