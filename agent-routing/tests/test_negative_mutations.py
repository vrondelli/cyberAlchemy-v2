#!/usr/bin/env python3
"""Hostile mutations for the CyberAlchemy-v2-only route boundary."""

from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
PACKAGE_ROOT = REPOSITORY_ROOT / "cyberAlchemy-v2/agent-routing"
VALIDATOR_PATH = PACKAGE_ROOT / "scripts/validate.py"
SPEC = importlib.util.spec_from_file_location("validate_agent_router", VALIDATOR_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
REGISTRY = json.loads((PACKAGE_ROOT / "routes.json").read_text(encoding="utf-8"))
AGENTS_TEXT = MODULE.AGENTS_PATH.read_text(encoding="utf-8")


def evaluate(registry: dict, agents_text: str = AGENTS_TEXT) -> dict:
    return MODULE.evaluate(
        registry,
        agents_text=agents_text,
        verify_generated_artifacts=False,
        verify_build=False,
    )


def mutate_route(route_id: str, change) -> dict:
    registry = copy.deepcopy(REGISTRY)
    route = next(item for item in registry["routes"] if item["route_id"] == route_id)
    change(route)
    return evaluate(registry)


cases: list[str] = []

baseline = evaluate(copy.deepcopy(REGISTRY))
assert baseline["status"] == "PASS", baseline
cases.append("live route registry closes without generated evidence")

result = mutate_route("CA2-ROUTE-IMPLEMENT", lambda route: route.update(fallback_route="somewhere-else"))
assert result["status"] == "BLOCK" and any("fallback" in item for item in result["errors"]), result
cases.append("non-null fallback is rejected")

missing = copy.deepcopy(REGISTRY)
missing["routes"] = [item for item in missing["routes"] if item["route_id"] != "CA2-ROUTE-IMPLEMENT"]
result = evaluate(missing)
assert result["status"] == "BLOCK" and any("exact non-duplicated" in item for item in result["errors"]), result
cases.append("missing implementation route is rejected")

result = mutate_route("CA2-ROUTE-IMPLEMENT", lambda route: route.update(authority_root="arcanum"))
assert result["status"] == "BLOCK" and any("outside CyberAlchemy-v2" in item for item in result["errors"]), result
cases.append("public subsystem cannot own a route")

result = mutate_route("CA2-ROUTE-PLAN", lambda route: route.update(read_first=[".agents/skills/task/SKILL.md"]))
assert result["status"] == "BLOCK" and any("forbidden routing surface" in item for item in result["errors"]), result
cases.append("generated command surface cannot become route input")

duplicate = copy.deepcopy(REGISTRY)
duplicate["routes"][2]["objective"] = duplicate["routes"][1]["objective"]
result = evaluate(duplicate)
assert result["status"] == "BLOCK" and any("duplicate route objective" in item for item in result["errors"]), result
cases.append("duplicate objective is rejected")

result = evaluate(copy.deepcopy(REGISTRY), AGENTS_TEXT + "\nUse task-session for this work.\n")
assert result["status"] == "BLOCK" and any("legacy bounded execution route" in item for item in result["errors"]), result
cases.append("root legacy execution route is rejected")

result = evaluate(copy.deepcopy(REGISTRY), AGENTS_TEXT + "\nUse invoke for this work.\n")
assert result["status"] == "BLOCK" and any("legacy intent lifecycle route" in item for item in result["errors"]), result
cases.append("root legacy intent route is rejected")

result = mutate_route("CA2-ROUTE-SESSION", lambda route: route.update(lifecycle_state="available"))
assert result["status"] == "BLOCK" and any("blocked execution mode" in item for item in result["errors"]), result
cases.append("unimplemented session runtime cannot be marked available")

missing_ontology_route = copy.deepcopy(REGISTRY)
missing_ontology_route["routes"] = [
    item for item in missing_ontology_route["routes"] if item["route_id"] != "CA2-ROUTE-ONTOLOGY"
]
result = evaluate(missing_ontology_route)
assert result["status"] == "BLOCK" and any("exact non-duplicated" in item for item in result["errors"]), result
cases.append("missing direct ontology runtime route is rejected")

result = evaluate(
    copy.deepcopy(REGISTRY),
    AGENTS_TEXT.replace("Ontology-runtime enforcement suspension", "Ontology runtime", 1),
)
assert result["status"] == "BLOCK" and any("router marker" in item for item in result["errors"]), result
cases.append("root instructions must preserve the explicit enforcement suspension")

result = mutate_route("CA2-ROUTE-VALIDATE", lambda route: route.pop("excludes"))
assert result["status"] == "BLOCK" and any("does not exclude" in item for item in result["errors"]), result
cases.append("generic validation cannot compete with registered ontology validation")

empty = copy.deepcopy(REGISTRY)
empty["routes"] = []
result = evaluate(empty)
assert result["status"] == "BLOCK", result
cases.append("empty registry cannot pass vacuously")

result = mutate_route("CA2-ROUTE-RECENT", lambda route: route.update(write_ceiling="cache and hooks"))
assert result["status"] == "BLOCK" and any("read-only query" in item for item in result["errors"]), result
cases.append("recent lookup cannot acquire cache or hook writes")

result = mutate_route("CA2-ROUTE-RECENT", lambda route: route.update(read_first=[]))
assert result["status"] == "BLOCK" and any("recent-context route read_first" in item for item in result["errors"]), result
cases.append("recent lookup must retain its exact context inputs")

print(json.dumps({"status": "PASS", "authority_effect": "none", "cases": cases}, indent=2))
