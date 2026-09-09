#!/usr/bin/env python3
"""Hostile mutation checks for Registry Context fail-closed behavior."""

from __future__ import annotations

import copy
import importlib.util
import json
import shutil
import tempfile
from pathlib import Path
from typing import Any, Callable


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
VALIDATOR_PATH = PACKAGE_ROOT / "scripts/validate.py"

spec = importlib.util.spec_from_file_location("registry_context_validate", VALIDATOR_PATH)
assert spec and spec.loader
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value: dict[str, Any]) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def mutate_source_digest(root: Path) -> None:
    path = root / "sources.json"
    value = load(path)
    value["selections"][0]["selection_sha256"] = "0" * 64
    write(path, value)


def mutate_unbounded_request(root: Path) -> None:
    path = root / "examples/define-context-request.json"
    value = load(path)
    value["registry_queries"][0]["path"] = "../../"
    write(path, value)


def mutate_missing_required_selection(root: Path) -> None:
    path = root / "examples/define-context-request.json"
    value = load(path)
    value["registry_queries"][0]["required_selection_refs"].remove("RC-SEL-PRODUCT-NODE")
    write(path, value)


def mutate_authority_effect(root: Path) -> None:
    path = root / "examples/define-context-view.json"
    value = load(path)
    value["records"][0]["authority_effect"] = "write"
    write(path, value)


def mutate_implicit_binding(root: Path) -> None:
    path = root / "examples/define-context-view.json"
    value = load(path)
    value["bindings"][0]["binding_state"] = "inferred-by-label"
    write(path, value)


def mutate_binding_evidence(root: Path) -> None:
    path = root / "examples/define-context-view.json"
    value = load(path)
    value["bindings"][0]["source_selection_refs"] = []
    write(path, value)


def mutate_dropped_selected_projection(root: Path) -> None:
    path = root / "examples/define-context-view.json"
    value = load(path)
    del value["records"][0]["selected_projection"]
    write(path, value)


def mutate_dropped_binding_endpoint(root: Path) -> None:
    path = root / "examples/define-context-view.json"
    value = load(path)
    value["records"] = [
        record for record in value["records"]
        if record["record_ref"] != "CA2-THESIS-GOVERNED-HMI"
    ]
    write(path, value)


def mutate_open_realization(root: Path) -> None:
    path = root / "examples/define-context-view.json"
    value = load(path)
    value["residue"][0]["blocking"] = False
    value["resolution_status"] = "resolved_with_residue"
    write(path, value)


def mutate_ledger_collapse(root: Path) -> None:
    path = root / "nodes.json"
    value = load(path)
    for node in value["nodes"]:
        if node["id"] == "CA2-SYS-REGISTRY-RESOLUTION-LEDGER":
            node["forbidden_collapse"] = "Not an implementation detail."
    write(path, value)


def mutate_view_digest(root: Path) -> None:
    path = root / "examples/define-context-view.json"
    value = load(path)
    value["view_digest"] = "f" * 64
    write(path, value)


CASES: list[tuple[str, Callable[[Path], None], str]] = [
    ("selected source drift", mutate_source_digest, "selected-value digest drift"),
    ("unbounded path injection", mutate_unbounded_request, "unknown keys: path"),
    ("request selection closure", mutate_missing_required_selection, "source epoch must equal"),
    ("authority escalation", mutate_authority_effect, "exceeds authority ceiling"),
    ("implicit binding", mutate_implicit_binding, "must be explicit-source-backed"),
    ("binding without evidence", mutate_binding_evidence, "must preserve source selections"),
    ("dropped selected projection", mutate_dropped_selected_projection, "must carry selected projection"),
    ("dropped binding endpoint", mutate_dropped_binding_endpoint, "binding endpoint must be present"),
    ("silent open realization", mutate_open_realization, "must remain blocking residue"),
    ("ledger becomes truth", mutate_ledger_collapse, "resolution ledger must not collapse"),
    ("view digest drift", mutate_view_digest, "context view digest mismatch"),
]


def main() -> int:
    baseline = validator.validate_package(PACKAGE_ROOT, REPOSITORY_ROOT)
    if baseline["status"] != "PASS":
        print(json.dumps({"status": "BLOCK", "baseline_errors": baseline["errors"]}, indent=2))
        return 1

    results: list[dict[str, Any]] = []
    for label, mutation, expected in CASES:
        with tempfile.TemporaryDirectory(prefix="registry-context-negative-") as temp_dir:
            root = Path(temp_dir) / "registry-context"
            shutil.copytree(PACKAGE_ROOT, root, ignore=shutil.ignore_patterns("receipts", "__pycache__"))
            mutation(root)
            result = validator.validate_package(root, REPOSITORY_ROOT)
            joined = "\n".join(result["errors"])
            passed = result["status"] == "BLOCK" and expected in joined
            results.append({
                "case": label,
                "expected_fragment": expected,
                "status": "PASS" if passed else "FAIL",
                "observed_status": result["status"],
                "errors": result["errors"],
            })

    status = "PASS" if all(item["status"] == "PASS" for item in results) else "BLOCK"
    print(json.dumps({
        "status": status,
        "authority_effect": "none",
        "cases": len(results),
        "results": results,
    }, indent=2, ensure_ascii=False))
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
