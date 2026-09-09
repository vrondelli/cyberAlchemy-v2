#!/usr/bin/env python3
"""Validate that the OEW L1 frontier can start without package-script drift."""

from __future__ import annotations

import argparse
import hashlib
import json
import shlex
from pathlib import Path


SERIES_ORDER = [
    "SWU-OEW-008F",
    "SWU-OEW-007T",
    "SWU-OEW-013B",
    "SWU-OEW-014",
    "SWU-OEW-014V",
]
EXPECTED_DEPENDENCIES = {
    "SWU-OEW-008F": ["SWU-OEW-006P", "SWU-OEW-007"],
    "SWU-OEW-007T": ["SWU-OEW-007", "SWU-OEW-008F"],
    "SWU-OEW-013B": ["SWU-OEW-007T"],
    "SWU-OEW-014": ["SWU-OEW-013B"],
    "SWU-OEW-014V": ["SWU-OEW-014"],
}
REQUIRED_COMMAND_INPUTS = {
    "SWU-OEW-013B": ["upstream/L1-BUILD.lock.json"],
}
IMPLEMENTATION_PREFIX = (
    "cyberAlchemy-v2/implementation/ontology-evidence-workbench"
)
LOCK_TARGET = f"{IMPLEMENTATION_PREFIX}/upstream/L1-BUILD.lock.json"
TYPED_REPAIR_TARGETS = [
    f"{IMPLEMENTATION_PREFIX}/upstream/overlay/overlay-manifest.json",
    (
        f"{IMPLEMENTATION_PREFIX}/upstream/overlay/"
        "first-working-version-manifest.json"
    ),
    (
        f"{IMPLEMENTATION_PREFIX}/upstream/overlay/packages/dashboard/"
        "src/oew/types.ts"
    ),
    (
        f"{IMPLEMENTATION_PREFIX}/upstream/overlay/packages/dashboard/"
        "src/oew/loadOewBundle.ts"
    ),
    (
        f"{IMPLEMENTATION_PREFIX}/upstream/overlay/packages/dashboard/"
        "src/oew/store.ts"
    ),
    LOCK_TARGET,
]
EXPECTED_TYPED_BUILD = {
    "workroot": "fresh-digest-named-L1-workroot",
    "cwd": (
        "<workroot>/"
        "Understand-Anything-2cda14e89535049e49120198886bc0b82e9e630f"
    ),
    "command": "pnpm --filter @understand-anything/dashboard build",
    "expanded_script": "tsc -b && vite build",
    "expected_exit_code": 0,
}
EXPECTED_LOCK_ROLES = {
    "path": LOCK_TARGET,
    "mutation_owner_swu": "SWU-OEW-007T",
    "binding_owner_swu": "SWU-OEW-007T",
    "owner_swu": "SWU-OEW-013B",
    "consumer_swu": "SWU-OEW-013B",
    "build_owner_swu": "SWU-OEW-013B",
    "runtime_owner_swu": "SWU-OEW-013B",
    "required_after_repair": True,
}
COMPLETED_BINDINGS = {
    "SWU-OEW-007": (
        "f4ac5d2a1c4ca001b49fcd428e371ce56622fe79758dad4f2a1f8adbb480f569"
    ),
    "SWU-OEW-008F": (
        "9984ff1f9a827183c6b2c3e019bc63086b5205ff73fcfa060e7e30f8143cf2fc"
    ),
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--lock", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = json.loads(args.manifest.read_text())
    package = json.loads(args.package.read_text())
    implementation_root = args.package.parent
    lock_path = args.lock or implementation_root / "upstream/L1-BUILD.lock.json"
    lock = json.loads(lock_path.read_text())
    failures: list[dict[str, str]] = []
    checks: list[dict[str, object]] = []
    records = {record["swu_id"]: record for record in manifest.get("swus", [])}
    completed = {
        swu_id
        for swu_id, record in records.items()
        if record.get("status") == "completed"
    }
    expected_frontier = [
        swu_id for swu_id in SERIES_ORDER if swu_id not in completed
    ]

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
        frontier == expected_frontier,
        f"expected remaining ordered series {expected_frontier}; got {frontier}",
    )
    check(
        "OEW-FRONTIER-UNSELECTED",
        manifest.get("selected_swu") is None
        and manifest.get("implementation_authorized") is False
        and not any(record.get("selected") for record in records.values()),
        (
            "selected_swu must be null, implementation_authorized false, "
            "and every record selected=false"
        ),
    )

    for swu_id, expected in EXPECTED_DEPENDENCIES.items():
        actual = records.get(swu_id, {}).get("dependencies")
        check(
            f"OEW-FRONTIER-DEPENDENCIES-{swu_id}",
            actual == expected,
            f"expected {expected}; got {actual}",
        )

    for swu_id, expected_receipt_sha256 in COMPLETED_BINDINGS.items():
        record = records.get(swu_id, {})
        check(
            f"OEW-FRONTIER-HISTORICAL-BINDING-{swu_id}",
            record.get("status") == "completed"
            and record.get("terminal_receipt_sha256") == expected_receipt_sha256,
            (
                "completed history and receipt digest preserved; "
                f"got status={record.get('status')} "
                f"receipt={record.get('terminal_receipt_sha256')}"
            ),
        )

    repair = records.get("SWU-OEW-007T", {})
    final_build = records.get("SWU-OEW-013B", {})
    check(
        "OEW-FRONTIER-007T-EXACT-TARGETS",
        repair.get("target_inventory") == TYPED_REPAIR_TARGETS,
        (
            f"expected exact six repair targets {TYPED_REPAIR_TARGETS}; "
            f"got {repair.get('target_inventory')}"
        ),
    )
    check(
        "OEW-FRONTIER-007T-FOCUSED-VALIDATION",
        repair.get("validation_scripts") == ["test:ui-store"]
        and repair.get("typed_build_validation") == EXPECTED_TYPED_BUILD,
        (
            "007T must reuse only test:ui-store and require the exact fresh "
            "dashboard `tsc -b && vite build` contract"
        ),
    )
    check(
        "OEW-FRONTIER-LOCK-ROLE-SEPARATION",
        repair.get("lock_role_contract") == EXPECTED_LOCK_ROLES
        and final_build.get("lock_role_contract") == EXPECTED_LOCK_ROLES
        and LOCK_TARGET not in final_build.get("target_inventory", [])
        and final_build.get("required_inputs") == [LOCK_TARGET],
        (
            "007T must own lock mutation/binding only; 013B must consume the "
            "lock and retain owner/build/runtime roles without target collision"
        ),
    )
    check(
        "OEW-FRONTIER-LIVE-LOCK-BUILD-OWNER",
        lock.get("owner_swu") == "SWU-OEW-013B",
        f"live lock owner_swu must remain SWU-OEW-013B; got {lock.get('owner_swu')}",
    )
    repair_completed = repair.get("status") == "completed"
    repaired_lock_roles = {
        "binding_owner_swu": lock.get("binding_owner_swu"),
        "consumer_swu": lock.get("consumer_swu"),
        "build_owner_swu": lock.get("build_owner_swu"),
        "runtime_owner_swu": lock.get("runtime_owner_swu"),
    }
    expected_repaired_lock_roles = {
        "binding_owner_swu": "SWU-OEW-007T",
        "consumer_swu": "SWU-OEW-013B",
        "build_owner_swu": "SWU-OEW-013B",
        "runtime_owner_swu": "SWU-OEW-013B",
    }
    check(
        "OEW-FRONTIER-COMPLETED-007T-LOCK-BINDINGS",
        not repair_completed or repaired_lock_roles == expected_repaired_lock_roles,
        (
            "planned 007T may precede new lock role fields; completed 007T "
            f"requires {expected_repaired_lock_roles}; got {repaired_lock_roles}"
        ),
    )

    active_targets: dict[str, str] = {}
    target_collisions: list[str] = []
    for swu_id in expected_frontier:
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
    for swu_id in expected_frontier:
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
        required_inputs = REQUIRED_COMMAND_INPUTS.get(swu_id, [])
        for relative in required_inputs:
            live = implementation_root / relative
            owned = str(implementation_root / relative)
            if not live.exists() and owned not in record.get("target_inventory", []):
                command_issues.append(
                    f"{swu_id}: required command input {relative} is neither "
                    "live nor same-SWU-owned"
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

    external_dependencies = {
        dependency
        for swu_id in expected_frontier
        for dependency in records.get(swu_id, {}).get("dependencies", [])
        if dependency not in expected_frontier
    }
    check(
        "OEW-FRONTIER-START-DEPENDENCIES-COMPLETE",
        external_dependencies.issubset(completed),
        (
            f"required completed predecessors: {sorted(external_dependencies)}; "
            f"observed: {sorted(completed & external_dependencies)}"
        ),
    )

    receipt = {
        "schema_version": "oew.l1-frontier-readiness.v1",
        "validation_profile": "ordered-series-live-remainder",
        "validator_path": (
            "cyberAlchemy-v2/development/ontology-evidence-workbench/"
            "planning/work-pack/shared/validate-l1-frontier.py"
        ),
        "validator_sha256": digest(Path(__file__)),
        "series_order": SERIES_ORDER,
        "frontier": expected_frontier,
        "manifest_path": str(args.manifest),
        "manifest_sha256": digest(args.manifest),
        "package_path": str(args.package),
        "package_sha256": digest(args.package),
        "lock_path": str(lock_path),
        "lock_sha256": digest(lock_path),
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
