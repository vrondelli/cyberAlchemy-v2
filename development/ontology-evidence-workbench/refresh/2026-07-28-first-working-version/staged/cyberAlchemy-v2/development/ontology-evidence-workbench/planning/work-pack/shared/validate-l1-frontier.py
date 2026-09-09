#!/usr/bin/env python3
"""Validate that the OEW L1 frontier can start without package-script drift."""

from __future__ import annotations

import argparse
import hashlib
import json
import shlex
from pathlib import Path


EXPECTED_FRONTIER = [
    "SWU-OEW-008F",
    "SWU-OEW-013B",
    "SWU-OEW-014",
    "SWU-OEW-014V",
]
EXPECTED_DEPENDENCIES = {
    "SWU-OEW-008F": ["SWU-OEW-006P", "SWU-OEW-007"],
    "SWU-OEW-013B": ["SWU-OEW-008F"],
    "SWU-OEW-014": ["SWU-OEW-013B"],
    "SWU-OEW-014V": ["SWU-OEW-014"],
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = json.loads(args.manifest.read_text())
    package = json.loads(args.package.read_text())
    implementation_root = args.package.parent
    failures: list[dict[str, str]] = []
    checks: list[dict[str, object]] = []

    def check(check_id: str, passed: bool, detail: str) -> None:
        checks.append({"check_id": check_id, "result": "pass" if passed else "fail", "detail": detail})
        if not passed:
            failures.append({"check_id": check_id, "detail": detail})

    package_roots = sorted(
        str(path.relative_to(implementation_root))
        for path in implementation_root.rglob("package.json")
    )
    check(
        "OEW-FRONTIER-ONE-PACKAGE-ROOT",
        package_roots == ["package.json"],
        f"package roots: {package_roots}",
    )

    frontier = manifest.get("remaining_l1_frontier")
    check(
        "OEW-FRONTIER-EXACT-ORDER",
        frontier == EXPECTED_FRONTIER,
        f"frontier: {frontier}",
    )
    check(
        "OEW-FRONTIER-UNSELECTED",
        manifest.get("selected_swu") is None
        and manifest.get("implementation_authorized") is False,
        "selected_swu must be null and implementation_authorized must be false",
    )

    records = {record["swu_id"]: record for record in manifest.get("swus", [])}
    for swu_id, expected in EXPECTED_DEPENDENCIES.items():
        actual = records.get(swu_id, {}).get("dependencies")
        check(
            f"OEW-FRONTIER-DEPENDENCIES-{swu_id}",
            actual == expected,
            f"expected {expected}; got {actual}",
        )

    active_targets: dict[str, str] = {}
    target_collisions: list[str] = []
    for swu_id in EXPECTED_FRONTIER:
        for target in records.get(swu_id, {}).get("target_inventory", []):
            if target in active_targets:
                target_collisions.append(
                    f"{target}: {active_targets[target]} and {swu_id}"
                )
            active_targets[target] = swu_id
    check(
        "OEW-FRONTIER-EXCLUSIVE-TARGETS",
        not target_collisions,
        "no target collisions" if not target_collisions else "; ".join(target_collisions),
    )
    check(
        "OEW-FRONTIER-PACKAGE-IMMUTABLE",
        not any(target.endswith("/package.json") for target in active_targets),
        "no active SWU owns package.json",
    )

    scripts = package.get("scripts", {})
    command_issues: list[str] = []
    checked_commands: list[str] = []
    for swu_id in EXPECTED_FRONTIER:
        record = records.get(swu_id, {})
        command_names = list(record.get("validation_scripts", []))
        if not command_names:
            validation = record.get("validation", "")
            parts = validation.replace("&&", " ").split()
            command_names = [
                parts[index + 2]
                for index, token in enumerate(parts[:-2])
                if token == "npm" and parts[index + 1] == "run"
            ]
        for command_name in command_names:
            checked_commands.append(f"{swu_id}:{command_name}")
            command = scripts.get(command_name)
            if command is None:
                command_issues.append(f"{swu_id}: missing package script {command_name}")
                continue
            tokens = shlex.split(command)
            referenced_entrypoints = [
                token
                for token in tokens
                if token.endswith((".mjs", ".cjs", ".js"))
                and not token.startswith("-")
            ]
            for relative in referenced_entrypoints:
                live = implementation_root / relative
                owned = str(implementation_root / relative)
                if not live.exists() and owned not in record.get("target_inventory", []):
                    command_issues.append(
                        f"{swu_id}:{command_name}: {relative} is neither live nor same-SWU-owned"
                    )
    check(
        "OEW-FRONTIER-COMMAND-ENTRYPOINT-CLOSURE",
        not command_issues,
        (
            f"checked {len(checked_commands)} commands: {checked_commands}"
            if not command_issues
            else "; ".join(command_issues)
        ),
    )

    completed = {
        swu_id
        for swu_id, record in records.items()
        if record.get("status") == "completed"
    }
    check(
        "OEW-FRONTIER-START-DEPENDENCIES-COMPLETE",
        {"SWU-OEW-006P", "SWU-OEW-007"}.issubset(completed),
        f"completed predecessors: {sorted(completed & {'SWU-OEW-006P', 'SWU-OEW-007'})}",
    )

    receipt = {
        "schema_version": "oew.l1-frontier-readiness.v1",
        "frontier": EXPECTED_FRONTIER,
        "manifest_path": str(args.manifest),
        "manifest_sha256": digest(args.manifest),
        "package_path": str(args.package),
        "package_sha256": digest(args.package),
        "package_roots": package_roots,
        "checked_commands": checked_commands,
        "checks": checks,
        "failures": failures,
        "result": "pass" if not failures else "block",
        "authority_effect": "none",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, indent=2) + "\n")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
