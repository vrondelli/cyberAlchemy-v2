#!/usr/bin/env python3
"""Hostile mutation checks for the CAV2 Context package."""

from __future__ import annotations

import importlib.util
import json
import shutil
import tempfile
from pathlib import Path
from typing import Callable


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("context_validate", PACKAGE_ROOT / "scripts/validate.py")
assert spec and spec.loader
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def source_drift(root: Path) -> None:
    path = root / "sources.json"; value = load(path); value["selections"][0]["selection_sha256"] = "0" * 64; write(path, value)


def missing_product(root: Path) -> None:
    path = root / "contexts/define-shared-meaning.context.json"; value = load(path); value["product_ref"] = "CA2-PRODUCT-MISSING"; write(path, value)


def goal_without_project(root: Path) -> None:
    path = root / "contexts/define-shared-meaning.context.json"; value = load(path); value["project_ref"] = None; write(path, value)


def goal_project_mismatch(root: Path) -> None:
    path = root / "contexts/define-shared-meaning.context.json"; value = load(path); value["project_ref"] = "CA2-PROJECT-MISMATCH"; write(path, value)


def authority_escalation(root: Path) -> None:
    path = root / "contexts/define-shared-meaning.context.json"; value = load(path); value["authority_effect"] = "write"; write(path, value)


def bounded_context_collapse(root: Path) -> None:
    path = root / "nodes.json"; value = load(path)
    for node in value["nodes"]:
        if node["id"] == "CA2-CONCEPT-CONTEXT": node["forbidden_collapse"] = "Not a request."
    write(path, value)


def dangling_relation(root: Path) -> None:
    path = root / "relations.json"; value = load(path); value["relations"][0]["target"] = "CA2-MISSING"; write(path, value)


def invalid_consumer(root: Path) -> None:
    path = root / "contexts/define-shared-meaning.context.json"; value = load(path); value["consumer_refs"] = ["CA2-PROJECT-DEFINE"]; write(path, value)


def invalid_bounded_context(root: Path) -> None:
    path = root / "contexts/define-shared-meaning.context.json"; value = load(path); value["bounded_context_refs"] = ["CA2-PROJECT-DEFINE"]; write(path, value)


def runtime_node_leak(root: Path) -> None:
    path = root / "nodes.json"; value = load(path); leaked = dict(value["nodes"][4]); leaked["id"] = "CA2-CAP-RESOLVE-CONTEXT"; value["nodes"].append(leaked); write(path, value)


def registry_goal_project_mismatch(root: Path) -> None:
    path = root / "contexts/registry-context-first-vertical.context.json"; value = load(path); value["goal_ref"] = "CA2-GOAL-DEFINE-FIRST-CLASS-OWNERSHIP"; write(path, value)


def unknown_context_field(root: Path) -> None:
    path = root / "contexts/registry-context-first-vertical.context.json"; value = load(path); value["unknown_field"] = "must fail closed"; write(path, value)


CASES: list[tuple[str, Callable[[Path], None], str]] = [
    ("selected source drift", source_drift, "selected-value digest drift"),
    ("missing Product", missing_product, "must reference one Product"),
    ("goal without Project", goal_without_project, "goal Context requires Project and Goal"),
    ("Goal Project mismatch", goal_project_mismatch, "Goal does not belong to its Project"),
    ("authority escalation", authority_escalation, "exceeds authority ceiling"),
    ("Bounded Context collapse", bounded_context_collapse, "preserve Bounded Context distinction"),
    ("dangling relation", dangling_relation, "dangling endpoint"),
    ("invalid consumer", invalid_consumer, "consumer is not a capability"),
    ("invalid Bounded Context", invalid_bounded_context, "Bounded Context ref is invalid"),
    ("Registry Context runtime node leak", runtime_node_leak, "contains Registry Context runtime nodes"),
    ("Registry Context Goal Project mismatch", registry_goal_project_mismatch, "Goal does not belong to its Project"),
    ("unknown Context field", unknown_context_field, "Additional properties are not allowed"),
]


def main() -> int:
    baseline = validator.validate_package(PACKAGE_ROOT, REPOSITORY_ROOT)
    if baseline["status"] != "PASS":
        print(json.dumps({"status":"BLOCK","baseline_errors":baseline["errors"]}, indent=2))
        return 1
    results = []
    for label, mutation, expected in CASES:
        with tempfile.TemporaryDirectory(prefix="context-negative-") as temp_dir:
            root = Path(temp_dir) / "context"
            shutil.copytree(PACKAGE_ROOT, root, ignore=shutil.ignore_patterns("receipts", "__pycache__"))
            mutation(root)
            result = validator.validate_package(root, REPOSITORY_ROOT)
            joined = "\n".join(result["errors"])
            passed = result["status"] == "BLOCK" and expected in joined
            results.append({"case":label,"status":"PASS" if passed else "FAIL","expected":expected,"errors":result["errors"]})
    status = "PASS" if all(item["status"] == "PASS" for item in results) else "BLOCK"
    print(json.dumps({"status":status,"authority_effect":"none","cases":len(results),"results":results}, indent=2, ensure_ascii=False))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
