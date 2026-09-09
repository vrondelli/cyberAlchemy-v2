#!/usr/bin/env python3
"""Prove the refreshed frontier validator rejects typed-repair authority drift."""

from __future__ import annotations

import argparse
import copy
import json
import subprocess
import tempfile
from pathlib import Path


def record(manifest: dict, swu_id: str) -> dict:
    return next(item for item in manifest["swus"] if item["swu_id"] == swu_id)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--validator", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--lock", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    baseline = json.loads(args.manifest.read_text())
    baseline_lock = json.loads(args.lock.read_text())
    probes = []

    def collapse_build_owner(manifest: dict, lock: dict) -> None:
        record(manifest, "SWU-OEW-007T")["lock_role_contract"][
            "build_owner_swu"
        ] = "SWU-OEW-007T"

    def collide_lock_target(manifest: dict, lock: dict) -> None:
        record(manifest, "SWU-OEW-013B")["target_inventory"].append(
            (
                "cyberAlchemy-v2/implementation/ontology-evidence-workbench/"
                "upstream/L1-BUILD.lock.json"
            )
        )

    def drift_completed_007(manifest: dict, lock: dict) -> None:
        record(manifest, "SWU-OEW-007")["terminal_receipt_sha256"] = "0" * 64

    def weaken_typed_build(manifest: dict, lock: dict) -> None:
        record(manifest, "SWU-OEW-007T")["typed_build_validation"][
            "expanded_script"
        ] = "vite build"

    def complete_without_roles(manifest: dict, lock: dict) -> None:
        repair = record(manifest, "SWU-OEW-007T")
        repair["status"] = "completed"
        repair["selected"] = False
        manifest["remaining_l1_frontier"] = [
            "SWU-OEW-013B",
            "SWU-OEW-014",
            "SWU-OEW-014V",
        ]

    cases = [
        (
            "collapse-build-owner-into-007T",
            collapse_build_owner,
            "OEW-FRONTIER-LOCK-ROLE-SEPARATION",
        ),
        (
            "restore-lock-target-collision",
            collide_lock_target,
            "OEW-FRONTIER-LOCK-ROLE-SEPARATION",
        ),
        (
            "drift-completed-007-receipt",
            drift_completed_007,
            "OEW-FRONTIER-HISTORICAL-BINDING-SWU-OEW-007",
        ),
        (
            "weaken-exact-typed-build",
            weaken_typed_build,
            "OEW-FRONTIER-007T-FOCUSED-VALIDATION",
        ),
        (
            "complete-007T-without-lock-role-fields",
            complete_without_roles,
            "OEW-FRONTIER-COMPLETED-007T-LOCK-BINDINGS",
        ),
    ]

    with tempfile.TemporaryDirectory(prefix="oew-l1-007t-negatives-") as temp:
        temp_root = Path(temp)
        for index, (probe_id, mutate, expected_check) in enumerate(cases):
            manifest = copy.deepcopy(baseline)
            lock = copy.deepcopy(baseline_lock)
            mutate(manifest, lock)
            manifest_path = temp_root / f"{index}.manifest.json"
            lock_path = temp_root / f"{index}.lock.json"
            receipt_path = temp_root / f"{index}.receipt.json"
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
            lock_path.write_text(json.dumps(lock, indent=2) + "\n")
            completed = subprocess.run(
                [
                    "python3",
                    str(args.validator),
                    "--manifest",
                    str(manifest_path),
                    "--package",
                    str(args.package),
                    "--lock",
                    str(lock_path),
                    "--output",
                    str(receipt_path),
                ],
                check=False,
                text=True,
                capture_output=True,
            )
            receipt = json.loads(receipt_path.read_text())
            failure_ids = [
                failure["check_id"] for failure in receipt.get("failures", [])
            ]
            passed = (
                completed.returncode != 0
                and receipt.get("result") == "block"
                and expected_check in failure_ids
            )
            probes.append(
                {
                    "probe_id": probe_id,
                    "expected_failed_check": expected_check,
                    "observed_failed_checks": failure_ids,
                    "validator_exit_code": completed.returncode,
                    "validator_result": receipt.get("result"),
                    "result": "pass" if passed else "block",
                }
            )

    result = "pass" if all(probe["result"] == "pass" for probe in probes) else "block"
    args.output.write_text(
        json.dumps(
            {
                "schema_version": "oew.l1-007t-negative-probes.v1",
                "probe_count": len(probes),
                "probes": probes,
                "result": result,
                "authority_effect": "none",
            },
            indent=2,
        )
        + "\n"
    )
    return 0 if result == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
