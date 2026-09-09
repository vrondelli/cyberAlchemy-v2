#!/usr/bin/env python3
"""Hostile mutation checks for the People and Teams validator."""

from __future__ import annotations

import copy
import importlib.util
import json
import sys
from pathlib import Path


sys.dont_write_bytecode = True
TEST_PATH = Path(__file__).resolve()
PACKAGE_ROOT = TEST_PATH.parents[1]
VALIDATOR_PATH = PACKAGE_ROOT / "scripts/validate.py"
SPEC = importlib.util.spec_from_file_location("people_and_teams_validator", VALIDATOR_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("VALIDATOR_IMPORT_FAILED")
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


def load(name: str) -> dict:
    return json.loads((PACKAGE_ROOT / name).read_text(encoding="utf-8"))


def assert_block(name: str, filename: str, document: dict, expected_fragment: str) -> None:
    result = VALIDATOR.validate({filename: document})
    joined = "\n".join(result["errors"])
    if result["status"] != "BLOCK" or expected_fragment not in joined:
        raise AssertionError(f"{name}: expected BLOCK containing {expected_fragment!r}; got {result}")
    print(f"PASS {name}")


def main() -> int:
    profile = load("profile.json")
    profile["authority_effect"] = "write"
    assert_block("authority inflation", "profile.json", profile, "AUTHORITY_EFFECT_FORBIDDEN")

    nodes = load("nodes.json")
    nodes["nodes"].append(copy.deepcopy(nodes["nodes"][0]))
    assert_block("duplicate node", "nodes.json", nodes, "NODE_ID_DUPLICATE")

    relations = load("relations.json")
    relations["relations"][0]["target"] = "PT-MISSING-NODE"
    assert_block("dangling relation", "relations.json", relations, "RELATION_TARGET_UNRESOLVED")

    sources = load("sources.json")
    sources["sources"][0]["expected_digest"] = "0" * 64
    assert_block("source digest drift", "sources.json", sources, "SOURCE_DIGEST_DRIFT")

    definitions = load("definitions.json")
    definitions["canonical_bindings"] = [
        item for item in definitions["canonical_bindings"] if item["definition_ref"] != "CAV2-D69"
    ]
    assert_block("missing Team definition", "definitions.json", definitions, "CANONICAL_DEFINITION_SET_INVALID")

    capability = load("product-capability.json")
    capability["lifecycle_posture"]["commitment"] = "adopted"
    assert_block("capability adoption inflation", "product-capability.json", capability, "CAPABILITY_LIFECYCLE_INFLATION")

    obligations = load("obligations.json")
    obligations["obligations"][0]["current_status"] = "satisfied"
    assert_block("obligation evidence inflation", "obligations.json", obligations, "OBLIGATION_EVIDENCE_INFLATION")

    nodes = load("nodes.json")
    nodes["nodes"] = [item for item in nodes["nodes"] if item["id"] != "PT-RULE-PRIVACY-BOUNDARY"]
    assert_block("missing privacy rule", "nodes.json", nodes, "NODE_SET_INVALID")

    print("PASS 8/8 hostile mutations blocked")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
