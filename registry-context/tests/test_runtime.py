#!/usr/bin/env python3
"""Behavior and hostile-input checks for the Registry Context v2 runtime."""

from __future__ import annotations

import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
CLI_PATH = PACKAGE_ROOT / "scripts/registry_context_cli.py"
REQUEST_PATH = PACKAGE_ROOT / "examples/registry-context-project.request.json"

spec = importlib.util.spec_from_file_location("registry_context_cli", CLI_PATH)
assert spec and spec.loader
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def expect_block(request: dict[str, Any], label: str) -> None:
    try:
        runtime.resolve(request)
    except runtime.ResolutionBlocked:
        return
    raise AssertionError(f"{label} did not block")


def expect_malformed(request: dict[str, Any], label: str) -> None:
    try:
        runtime.resolve(request)
    except ValueError:
        return
    raise AssertionError(f"{label} was not rejected as malformed")


def cli_exit(request: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    with tempfile.TemporaryDirectory(prefix="registry-context-test-") as temporary:
        path = Path(temporary) / "request.json"
        path.write_text(json.dumps(request), encoding="utf-8")
        completed = subprocess.run(
            [sys.executable, str(CLI_PATH), "resolve", "--request", str(path)],
            check=False,
            capture_output=True,
            text=True,
        )
        return completed.returncode, json.loads(completed.stdout)


def main() -> int:
    request = load(REQUEST_PATH)
    first = runtime.resolve(copy.deepcopy(request))
    second = runtime.resolve(copy.deepcopy(request))
    assert first == second, "two identical resolutions must be byte-equivalent objects"
    assert first["resolution_status"] == "resolved"
    assert first["authority_effect"] == "none"

    wrong_digest = copy.deepcopy(request)
    wrong_digest["expected_context_sha256"] = "0" * 64
    expect_block(wrong_digest, "wrong Context digest")

    unknown_context = copy.deepcopy(request)
    unknown_context["context_ref"] = "CA2-CONTEXT-UNKNOWN"
    expect_block(unknown_context, "unknown Context")

    unknown_selection = copy.deepcopy(request)
    unknown_selection["selection_ids"] = ["RC2-SEL-UNKNOWN"]
    expect_block(unknown_selection, "unknown selection")

    unknown_consumer = copy.deepcopy(request)
    unknown_consumer["consumer_ref"] = "CA2-CAP-UNRELATED"
    expect_block(unknown_consumer, "consumer outside Context")

    unknown_use = copy.deepcopy(request)
    unknown_use["intended_use"] = "an undeclared use"
    expect_block(unknown_use, "intended use outside Context")

    path_input = copy.deepcopy(request)
    path_input["path"] = "../../"
    expect_malformed(path_input, "request path input")

    authority = copy.deepcopy(request)
    authority["authority_effect"] = "write"
    expect_malformed(authority, "authority escalation")

    duplicate = copy.deepcopy(request)
    duplicate["selection_ids"].append(duplicate["selection_ids"][0])
    expect_malformed(duplicate, "duplicate selection")

    resolved_exit, resolved_output = cli_exit(request)
    assert resolved_exit == 0 and resolved_output["resolution_status"] == "resolved"
    blocked_exit, blocked_output = cli_exit(wrong_digest)
    assert blocked_exit == 2 and blocked_output["resolution_status"] == "blocked"
    malformed_exit, malformed_output = cli_exit(path_input)
    assert malformed_exit == 1 and malformed_output["resolution_status"] == "blocked"

    print(json.dumps({
        "status": "PASS",
        "checks": 12,
        "deterministic_view_id": first["view_id"],
        "resolved_exit": resolved_exit,
        "blocked_exit": blocked_exit,
        "malformed_exit": malformed_exit,
        "authority_effect": "none",
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
