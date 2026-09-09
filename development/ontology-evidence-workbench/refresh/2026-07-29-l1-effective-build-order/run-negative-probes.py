#!/usr/bin/env python3
"""Prove the staged lock validator rejects bounded core-build contract drift."""

from __future__ import annotations

import argparse
import copy
import json
import subprocess
import tempfile
from pathlib import Path


def core_command(document: dict[str, object]) -> dict[str, object]:
    commands = document["execution_contract"]["commands"]
    return next(command for command in commands if command["id"] == "core-build")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--validator", type=Path, required=True)
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--implementation-root", type=Path, required=True)
    parser.add_argument("--lock", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    baseline = json.loads(args.lock.read_text())

    def missing_core_metadata(document: dict[str, object]) -> None:
        del document["upstream"]["effective_workspace"]["core_package"]

    def drifted_core_metadata(document: dict[str, object]) -> None:
        document["upstream"]["effective_workspace"]["core_package"]["sha256"] = (
            "0" * 64
        )

    def missing_core_command(document: dict[str, object]) -> None:
        document["execution_contract"]["commands"] = [
            command
            for command in document["execution_contract"]["commands"]
            if command["id"] != "core-build"
        ]

    def drifted_core_command(document: dict[str, object]) -> None:
        core_command(document)["command"] = (
            "pnpm --filter @understand-anything/core test"
        )

    def failed_core_expectation(document: dict[str, object]) -> None:
        core_command(document)["expected_exit_code"] = 1

    def out_of_order_core_command(document: dict[str, object]) -> None:
        commands = document["execution_contract"]["commands"]
        commands[1], commands[2] = commands[2], commands[1]

    def missing_core_evidence(document: dict[str, object]) -> None:
        del core_command(document)["producer_evidence"]

    probes = [
        ("missing-core-metadata", missing_core_metadata),
        ("drifted-core-metadata", drifted_core_metadata),
        ("missing-or-skipped-core-command", missing_core_command),
        ("drifted-core-command", drifted_core_command),
        ("failed-core-exit-expectation", failed_core_expectation),
        ("out-of-order-core-command", out_of_order_core_command),
        ("missing-core-output-evidence", missing_core_evidence),
    ]
    results: list[dict[str, object]] = []
    with tempfile.TemporaryDirectory(prefix="oew-013b-order-probes-") as temp:
        temp_root = Path(temp)
        for probe_id, mutate in probes:
            candidate = copy.deepcopy(baseline)
            mutate(candidate)
            candidate_path = temp_root / f"{probe_id}.json"
            receipt_path = temp_root / f"{probe_id}.receipt.json"
            candidate_path.write_text(json.dumps(candidate, indent=2) + "\n")
            completed = subprocess.run(
                [
                    "python3",
                    str(args.validator),
                    "--repo-root",
                    str(args.repo_root),
                    "--implementation-root",
                    str(args.implementation_root),
                    "--lock",
                    str(candidate_path),
                    "--manifest",
                    str(args.manifest),
                    "--output",
                    str(receipt_path),
                ],
                check=False,
                text=True,
                capture_output=True,
            )
            receipt = (
                json.loads(receipt_path.read_text())
                if receipt_path.is_file()
                else {}
            )
            passed = completed.returncode != 0 and receipt.get("result") == "block"
            results.append(
                {
                    "probe_id": probe_id,
                    "validator_exit_code": completed.returncode,
                    "validator_result": receipt.get("result"),
                    "failure_check_ids": [
                        failure.get("check_id")
                        for failure in receipt.get("failures", [])
                    ],
                    "result": "pass" if passed else "block",
                }
            )

    result = "pass" if all(item["result"] == "pass" for item in results) else "block"
    output = {
        "schema_version": "oew.l1-build-order-negative-probes.v1",
        "staged_lock": str(args.lock),
        "probe_count": len(results),
        "probes": results,
        "result": result,
        "authority_effect": "none",
        "evidence_ceiling": "Validator negative obligations only; no core build, dashboard test, final build, or verifier executed."
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    return 0 if result == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
