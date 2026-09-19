#!/usr/bin/env python3
"""Run one temp-only preacceptance closure probe with timeout headroom."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


REPOSITORY_ROOT = Path(__file__).resolve().parents[6]
TEST_MODULE = (
    REPOSITORY_ROOT
    / "arcanum/spells/invoke/development/preacceptance-closure/"
    "test_preacceptance_closure.py"
)


def load_test_module() -> Any:
    specification = importlib.util.spec_from_file_location(
        "timeout_probe_preacceptance_tests", TEST_MODULE
    )
    if specification is None or specification.loader is None:
        raise RuntimeError(f"cannot load {TEST_MODULE}")
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


def canonical_digest(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(
            value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode("utf-8")
    ).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", required=True, choices=("canonical", "generated"))
    parser.add_argument("--timeout-seconds", required=True, type=int)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    module = load_test_module()
    fixture = module.Fixture()
    started = time.monotonic()
    try:
        manifest = fixture.base_manifest()
        governance = manifest["consumer_rehearsal"]["stages"][6]
        original_timeout = governance["timeout_seconds"]
        governance["timeout_seconds"] = args.timeout_seconds
        generated_runner = (
            ".agents/skills/task-session/scripts/"
            "task-session-governance-runner.py"
        )
        canonical_runner = governance["exercised_runner_ref"]["path"]
        if args.mode == "generated":
            shutil.copytree(
                fixture.path("arcanum/arcana/task-session"),
                fixture.path(".agents/skills/task-session"),
                dirs_exist_ok=True,
            )
            shutil.copytree(
                fixture.path("arcanum/spells/implementation-readiness"),
                fixture.path(".agents/skills/implementation-readiness"),
                dirs_exist_ok=True,
            )
            governance["exercised_runner_ref"] = fixture.exact_ref(generated_runner)
            governance["argv"] = [
                generated_runner if value == canonical_runner else value
                for value in governance["argv"]
            ]
            projection_runner = manifest["normalized_execution_projection"]["runner"]
            projection_runner["ref"] = fixture.exact_ref(generated_runner)
            projection_runner["argv"] = [
                generated_runner if value == canonical_runner else value
                for value in projection_runner["argv"]
            ]
        receipt_relative = f"fixture/{args.mode}-headroom-receipt.json"
        completed = fixture.run_rehearsal(manifest, receipt_relative)
        receipt_path = fixture.path(receipt_relative)
        receipt = (
            json.loads(receipt_path.read_text(encoding="utf-8"))
            if receipt_path.is_file()
            else None
        )
        elapsed = time.monotonic() - started
        result = {
            "schema_version": "invoke.preacceptance-timeout-probe.v1",
            "mode": args.mode,
            "original_timeout_seconds": original_timeout,
            "probe_timeout_seconds": args.timeout_seconds,
            "runner_exit": completed.returncode,
            "runner_stdout": completed.stdout,
            "runner_stderr": completed.stderr,
            "elapsed_seconds": round(elapsed, 3),
            "receipt": receipt,
            "authority_effect": "none",
            "claim_ceiling": (
                "Temp-only no-effect timeout probe; no acceptance, source mutation, "
                "candidate mutation, selection, Task Session, or implementation."
            ),
        }
        result["probe_digest"] = canonical_digest(result)
        output = Path(args.output)
        output.write_text(
            json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        print(json.dumps({
            "mode": args.mode,
            "runner_exit": completed.returncode,
            "elapsed_seconds": round(elapsed, 3),
            "receipt_result": receipt.get("result") if receipt else None,
            "receipt_blockers": receipt.get("blockers") if receipt else None,
            "repository_unchanged": (
                receipt.get("repository_state", {}).get("unchanged")
                if receipt else None
            ),
            "protected_unchanged": (
                receipt.get("protected_inputs", {}).get("unchanged")
                if receipt else None
            ),
            "byte_stable": (
                receipt.get("determinism", {}).get("byte_stable")
                if receipt else None
            ),
        }, sort_keys=True))
        return completed.returncode
    finally:
        fixture.cleanup()


if __name__ == "__main__":
    raise SystemExit(main())
