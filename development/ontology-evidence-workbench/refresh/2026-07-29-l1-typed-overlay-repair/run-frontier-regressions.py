#!/usr/bin/env python3
"""Regress the refreshed OEW L1 validator over every remaining suffix."""

from __future__ import annotations

import argparse
import copy
import json
import subprocess
import tempfile
from pathlib import Path


SERIES = [
    "SWU-OEW-007T",
    "SWU-OEW-013B",
    "SWU-OEW-014",
    "SWU-OEW-014V",
]


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
    results: list[dict[str, object]] = []
    with tempfile.TemporaryDirectory(prefix="oew-l1-007t-regressions-") as temp:
        temp_root = Path(temp)
        for completed_count in range(0, len(SERIES) + 1):
            manifest = copy.deepcopy(baseline)
            lock = copy.deepcopy(baseline_lock)
            completed = SERIES[:completed_count]
            remainder = SERIES[completed_count:]
            for record in manifest["swus"]:
                if record["swu_id"] in completed:
                    record["status"] = "completed"
                    record["selected"] = False
            if "SWU-OEW-007T" in completed:
                lock.update(
                    {
                        "binding_owner_swu": "SWU-OEW-007T",
                        "consumer_swu": "SWU-OEW-013B",
                        "build_owner_swu": "SWU-OEW-013B",
                        "runtime_owner_swu": "SWU-OEW-013B",
                    }
                )
            manifest["selected_swu"] = None
            manifest["implementation_authorized"] = False
            manifest["mutationRuntimeReady"] = False
            manifest["remaining_l1_frontier"] = remainder
            manifest_path = temp_root / f"suffix-{completed_count}.manifest.json"
            lock_path = temp_root / f"suffix-{completed_count}.lock.json"
            receipt_path = temp_root / f"suffix-{completed_count}.receipt.json"
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
            lock_path.write_text(json.dumps(lock, indent=2) + "\n")
            completed_process = subprocess.run(
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
            passed = (
                completed_process.returncode == 0
                and receipt.get("result") == "pass"
                and receipt.get("frontier") == remainder
            )
            results.append(
                {
                    "case": (
                        "preselection" if not completed else f"post-{completed[-1]}"
                    ),
                    "completed": completed,
                    "expected_frontier": remainder,
                    "observed_frontier": receipt.get("frontier"),
                    "lock_role_fields_required": "SWU-OEW-007T" in completed,
                    "checked_commands": receipt.get("checked_commands", []),
                    "validator_exit_code": completed_process.returncode,
                    "validator_result": receipt.get("result"),
                    "failures": receipt.get("failures", []),
                    "result": "pass" if passed else "block",
                }
            )

    result = "pass" if all(item["result"] == "pass" for item in results) else "block"
    output = {
        "schema_version": "oew.l1-frontier-regression.v1",
        "validator_path": str(args.validator),
        "validator_unchanged_across_cases": True,
        "case_count": len(results),
        "cases": results,
        "result": result,
        "authority_effect": "none",
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    return 0 if result == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
