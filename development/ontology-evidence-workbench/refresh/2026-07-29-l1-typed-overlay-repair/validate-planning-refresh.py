#!/usr/bin/env python3
"""Validate the staged or applied 007T planning Refresh state."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


BASE = (
    "cyberAlchemy-v2/development/ontology-evidence-workbench/"
    "planning"
)
IMPLEMENTATION_PREFIX = (
    "cyberAlchemy-v2/implementation/ontology-evidence-workbench"
)
LOCK = f"{IMPLEMENTATION_PREFIX}/upstream/L1-BUILD.lock.json"
REPAIR_TARGETS = [
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
    LOCK,
]
LOCK_ROLES = {
    "path": LOCK,
    "mutation_owner_swu": "SWU-OEW-007T",
    "binding_owner_swu": "SWU-OEW-007T",
    "owner_swu": "SWU-OEW-013B",
    "consumer_swu": "SWU-OEW-013B",
    "build_owner_swu": "SWU-OEW-013B",
    "runtime_owner_swu": "SWU-OEW-013B",
    "required_after_repair": True,
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--projection-root", type=Path, required=True)
    parser.add_argument("--repository-root", type=Path, required=True)
    parser.add_argument("--preselection", type=Path, required=True)
    parser.add_argument("--material-package", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--state", choices=("staged", "live"), required=True)
    args = parser.parse_args()

    projection = args.projection_root
    repository = args.repository_root
    manifest_path = projection / f"{BASE}/work-pack/swu-manifest.json"
    chain_path = projection / f"{BASE}/work-pack/chain-state.json"
    readiness_path = (
        projection
        / f"{BASE}/work-pack/validation/L1-FIRST-WORKING-VERSION.frontier-readiness.json"
    )
    validator_path = projection / f"{BASE}/work-pack/shared/validate-l1-frontier.py"
    continuity_path = (
        projection
        / ".arcanum/task-session/continuity/oew-work-pack-20260727.json"
    )
    package_path = (
        repository / "cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json"
    )
    lock_path = (
        repository
        / "cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/L1-BUILD.lock.json"
    )

    manifest = json.loads(manifest_path.read_text())
    chain = json.loads(chain_path.read_text())
    readiness = json.loads(readiness_path.read_text())
    continuity = json.loads(continuity_path.read_text())
    package = json.loads(package_path.read_text())
    lock = json.loads(lock_path.read_text())
    material = json.loads(args.material_package.read_text())
    records = {record["swu_id"]: record for record in manifest["swus"]}
    checks = []

    def check(check_id: str, passed: bool, detail: str) -> None:
        checks.append(
            {
                "check_id": check_id,
                "result": "pass" if passed else "fail",
                "detail": detail,
            }
        )

    check(
        "OEW-007T-MATERIAL-TARGET-COUNT",
        len(material["changes"]) == 9,
        f"material target count={len(material['changes'])}",
    )
    check(
        "OEW-007T-SELECTION",
        manifest.get("selected_swu") == "SWU-OEW-007T"
        and manifest.get("implementation_authorized") is True
        and manifest.get("mutationRuntimeReady") is False
        and [
            record["swu_id"]
            for record in manifest["swus"]
            if record.get("selected")
        ]
        == ["SWU-OEW-007T"],
        "only 007T selected/authorized and runtime remains false",
    )
    check(
        "OEW-007T-FRONTIER",
        manifest.get("remaining_l1_frontier")
        == ["SWU-OEW-007T", "SWU-OEW-013B", "SWU-OEW-014", "SWU-OEW-014V"],
        f"frontier={manifest.get('remaining_l1_frontier')}",
    )
    repair = records["SWU-OEW-007T"]
    final_build = records["SWU-OEW-013B"]
    check(
        "OEW-007T-EXACT-WRITE-CONTRACT",
        repair.get("target_inventory") == REPAIR_TARGETS
        and not any(
            target.endswith(("package.json", "tsconfig.json", ".test.mjs"))
            for target in repair.get("target_inventory", [])
        ),
        "exact six future writes; no package, tsconfig, or test target",
    )
    check(
        "OEW-007T-DEPENDENCIES",
        repair.get("dependencies") == ["SWU-OEW-007", "SWU-OEW-008F"]
        and final_build.get("dependencies") == ["SWU-OEW-007T"],
        "007T depends on completed 007/008F; 013B depends on 007T",
    )
    check(
        "OEW-007T-LOCK-ROLES",
        repair.get("lock_role_contract") == LOCK_ROLES
        and final_build.get("lock_role_contract") == LOCK_ROLES
        and LOCK not in final_build.get("target_inventory", [])
        and final_build.get("required_inputs") == [LOCK]
        and lock.get("owner_swu") == "SWU-OEW-013B",
        "007T owns binding repair; 013B retains lock/build/runtime ownership",
    )
    check(
        "OEW-007T-HISTORICAL-COMPLETION",
        records["SWU-OEW-007"].get("status") == "completed"
        and records["SWU-OEW-007"].get("terminal_receipt_sha256")
        == "f4ac5d2a1c4ca001b49fcd428e371ce56622fe79758dad4f2a1f8adbb480f569"
        and records["SWU-OEW-008F"].get("status") == "completed"
        and records["SWU-OEW-008F"].get("terminal_receipt_sha256")
        == "9984ff1f9a827183c6b2c3e019bc63086b5205ff73fcfa060e7e30f8143cf2fc",
        "completed 007 and 008F history remains exact",
    )
    check(
        "OEW-007T-BUDGET",
        chain.get("session_budget") == 8
        and chain.get("consumed_sessions") == 4
        and chain.get("current_expected_selector") == "SWU-OEW-007T",
        (
            f"budget={chain.get('session_budget')} "
            f"consumed={chain.get('consumed_sessions')} "
            f"current={chain.get('current_expected_selector')}"
        ),
    )
    check(
        "OEW-007T-CHAIN-HASHES",
        chain.get("manifest_sha256") == digest(manifest_path)
        and chain.get("frontier_readiness", {}).get("sha256")
        == digest(readiness_path),
        "chain binds final manifest and readiness bytes",
    )
    check(
        "OEW-007T-READINESS",
        readiness.get("result") == "pass"
        and readiness.get("frontier")
        == ["SWU-OEW-007T", "SWU-OEW-013B", "SWU-OEW-014", "SWU-OEW-014V"]
        and readiness.get("manifest_sha256") == digest(args.preselection)
        and readiness.get("validator_sha256") == digest(validator_path),
        "preselection readiness binds exact preselection manifest and validator",
    )
    check(
        "OEW-007T-CONTINUITY",
        continuity.get("next_swu") == "SWU-OEW-007T"
        and continuity.get("next_route", {}).get("capability") == "task-session"
        and continuity.get("next_route", {}).get("runtime_ready") is False
        and continuity.get("session_budget") == 8
        and continuity.get("consumed_sessions") == 4,
        "continuity routes only 007T Task Session with runtime false",
    )
    package_roots = sorted(
        str(path.relative_to(package_path.parent))
        for path in package_path.parent.rglob("package.json")
    )
    check(
        "OEW-007T-PACKAGE-IMMUTABLE",
        package_roots == ["package.json"]
        and digest(package_path)
        == "a1719f598dd49f6a74413491ebc058e779de65691bc98d82854c1a5095f6d004",
        f"package roots={package_roots}; package digest={digest(package_path)}",
    )
    check(
        "OEW-007T-NO-LATER-SELECTION",
        not records["SWU-OEW-013B"].get("selected")
        and not records["SWU-OEW-014"].get("selected")
        and not records["SWU-OEW-014V"].get("selected"),
        "013B, 014, and 014V remain unselected",
    )
    failures = [item for item in checks if item["result"] == "fail"]
    output = {
        "schema_version": "oew.007t-planning-refresh-validation.v1",
        "state": args.state,
        "check_count": len(checks),
        "checks": checks,
        "failures": failures,
        "result": "pass" if not failures else "block",
        "authority_effect": "none",
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
