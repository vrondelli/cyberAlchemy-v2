#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
RAW_ROOT = ROOT / "construction/cbmc-discovery"
COMMANDS = json.loads((ROOT / "commands.json").read_text(encoding="utf-8"))
CBMC = COMMANDS["commands"]["cbmc"]
ENVIRONMENT = {"LANG": "C", "LC_ALL": "C", "PATH": "/usr/bin"}

BOUNDS = {
    "memcmp.0": (65, "operation IDs compare all 64 node-id bytes; 65 includes the exit check"),
    "crabs_ot_ordered_set_destroy.0": (4, "at most three elements plus the exit check"),
    "crabs_ot_ordered_set_get.0": (4, "at most three elements plus the exit check"),
    "crabs_ot_ordered_set_find.0": (4, "at most three elements plus the exit check"),
    "crabs_ot_ordered_set_apply_move.0": (4, "the moved local state has two elements; four is a conservative three-element bound plus exit"),
    "crabs_ot_ordered_set_merge.0": (4, "a source contains at most three elements plus the exit check"),
    "evf_cbmc_valid.0": (4, "a result contains at most three elements plus the exit check"),
    "evf_cbmc_same_state.0": (4, "both results contain at most three elements plus the exit check"),
    "evf_cbmc_expected_order.0": (4, "the visible result contains three elements plus the exit check"),
    "_get_at_internal.0": (4, "position maps are absent, but the reachable state bound is still at most three elements plus exit"),
    "_placement_index.0": (4, "the placement set contains only A, B, and C plus the exit check"),
    "_placements_valid.0": (4, "an anchor chain has at most three elements plus the exit check"),
    "_placements_valid.1": (4, "there are at most three placement roots to inspect plus the exit check"),
    "_merge_preflight.0": (4, "the destination contains at most three elements plus the exit check"),
    "_merge_preflight.1": (4, "the source contains at most three elements plus the exit check"),
    "_next_child.0": (4, "the materializer scans at most three nodes plus the exit check"),
    "_materialize.0": (4, "the source list contains at most three nodes plus the exit check"),
    "_materialize.1": (7, "a three-node depth-first traversal performs at most three pushes and three pops plus the exit check"),
    "_materialize.2": (4, "at most three roots can be emitted plus the exit check"),
}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def run(argv: list[str]) -> subprocess.CompletedProcess[bytes]:
    try:
        return subprocess.run(
            argv, cwd=ROOT, env=ENVIRONMENT, capture_output=True,
            timeout=CBMC["timeout_seconds"], check=False,
        )
    except subprocess.TimeoutExpired as error:
        stdout = error.stdout if isinstance(error.stdout, bytes) else b""
        stderr = error.stderr if isinstance(error.stderr, bytes) else b""
        return subprocess.CompletedProcess(argv, 124, stdout, stderr + b"\nEVF_TIMEOUT\n")


def store(name: str, result: subprocess.CompletedProcess[bytes]) -> dict[str, Any]:
    RAW_ROOT.mkdir(parents=True, exist_ok=True)
    stdout_path = RAW_ROOT / f"{name}.stdout"
    stderr_path = RAW_ROOT / f"{name}.stderr"
    stdout_path.write_bytes(result.stdout)
    stderr_path.write_bytes(result.stderr)
    return {
        "argv": result.args,
        "exit_code": result.returncode,
        "stdout_path": str(stdout_path.relative_to(ROOT)),
        "stdout_sha256": digest(result.stdout),
        "stderr_path": str(stderr_path.relative_to(ROOT)),
        "stderr_sha256": digest(result.stderr),
    }


def source_argv(harness: str) -> list[str]:
    return [harness, CBMC["dependency"], CBMC["implementation"]]


def discovery_argv(harness: str, mode: str) -> list[str]:
    return [
        CBMC["executable"], "--function", "main", mode,
        CBMC["include"], *source_argv(harness),
    ]


def check_prefix() -> list[str]:
    return [
        CBMC["executable"], "--function", "main", "--bounds-check",
        "--pointer-check", "--signed-overflow-check",
        "--unsigned-overflow-check", "--conversion-check",
        "--unwinding-assertions", "--unwindset", CBMC["unwindset"],
        "--trace", "--compact-trace", "--slice-formula", CBMC["include"],
    ]


def discovered_loops(output: bytes) -> list[str]:
    return sorted({match.decode() for match in re.findall(rb"^Loop ([^:]+):", output, re.MULTILINE)})


def property_present(output: bytes, property_id: str, assertion_text: str) -> bool:
    text = output.decode(errors="replace")
    return f"Property {property_id}:" in text and assertion_text in text


def complete_pass(result: subprocess.CompletedProcess[bytes]) -> bool:
    output = result.stdout.decode(errors="replace")
    return (result.returncode == 0 and "VERIFICATION SUCCESSFUL" in output and
            re.search(r": FAILURE$", output, re.MULTILINE) is None)


def target_class(result: subprocess.CompletedProcess[bytes], property_id: str) -> str:
    output = result.stdout.decode(errors="replace")
    match = re.search(rf"^\[{re.escape(property_id)}\].*:\s+(SUCCESS|FAILURE)$", output, re.MULTILINE)
    if match and match.group(1) == "FAILURE" and result.returncode != 0:
        return "counterexample"
    if match and match.group(1) == "SUCCESS" and result.returncode == 0 and "VERIFICATION SUCCESSFUL" in output:
        return "no-counterexample-at-bound"
    return "not-evaluable"


def main() -> int:
    representatives: list[dict[str, Any]] = []
    receipt_rows: list[dict[str, Any]] = []
    blockers: list[str] = []
    for representative_id in ("b-newer", "c-newer"):
        binding = CBMC["representatives"][representative_id]
        harness = binding["harness"]
        loop_result = run(discovery_argv(harness, "--show-loops"))
        property_result = run(discovery_argv(harness, "--show-properties"))
        loop_receipt = store(f"{representative_id}-loops", loop_result)
        property_receipt = store(f"{representative_id}-properties", property_result)
        loops = discovered_loops(loop_result.stdout)
        if loop_result.returncode != 0 or set(loops) != set(BOUNDS):
            blockers.append(f"{representative_id}:loop-discovery-mismatch")
        if property_result.returncode != 0 or not property_present(
            property_result.stdout, binding["property_id"], binding["assertion_text"]
        ):
            blockers.append(f"{representative_id}:property-discovery-mismatch")

        complete_argv = check_prefix() + source_argv(harness)
        target_argv = check_prefix()[:-4] + [
            "--property", binding["property_id"], "--trace", "--compact-trace",
            "--slice-formula", CBMC["include"], *source_argv(harness),
        ]
        complete_result = run(complete_argv)
        target_result = run(target_argv)
        complete_receipt = store(f"{representative_id}-bound-sufficiency", complete_result)
        target_receipt = store(f"{representative_id}-target", target_result)
        if not complete_pass(complete_result):
            blockers.append(f"{representative_id}:bound-sufficiency-not-proved")
        target_status = target_class(target_result, binding["property_id"])
        if target_status == "not-evaluable":
            blockers.append(f"{representative_id}:target-not-evaluable")

        harness_hash = digest((ROOT / harness).read_bytes())
        representatives.append(
            {
                "id": representative_id,
                "harness_sha256": harness_hash,
                "loops": [
                    {"loop_id": loop_id, "unwind": BOUNDS[loop_id][0], "justification": BOUNDS[loop_id][1]}
                    for loop_id in sorted(BOUNDS)
                ],
                "property_id": binding["property_id"],
                "assertion_text": binding["assertion_text"],
                "discovery": {
                    "loops_stdout_sha256": loop_receipt["stdout_sha256"],
                    "loops_stderr_sha256": loop_receipt["stderr_sha256"],
                    "properties_stdout_sha256": property_receipt["stdout_sha256"],
                    "properties_stderr_sha256": property_receipt["stderr_sha256"],
                },
                "complete_check_argv": complete_argv,
                "target_check_argv": target_argv,
            }
        )
        receipt_rows.append(
            {
                "representative_id": representative_id,
                "loop_discovery": loop_receipt,
                "property_discovery": property_receipt,
                "bound_sufficiency": complete_receipt,
                "bound_sufficiency_status": "pass" if complete_pass(complete_result) else "block",
                "target": target_receipt,
                "target_status": target_status,
            }
        )

    manifest = {
        "schema_version": "evf.crabs-partial-knowledge-cbmc-bound-manifest/v1",
        "status": "frozen" if not blockers else "not-evaluable",
        "cbmc": {
            "version": "6.11.0",
            "executable": CBMC["executable"],
            "sha256": "a62af25d27425610608221d79c202f993efe1d5a85cece186119bec196382995",
        },
        "subject_commit": "477799721668652988bf98a4a9067d08f5bdaebf",
        "representatives": representatives,
        "blockers": blockers,
        "authority_effect": "none",
    }
    schema = json.loads((ROOT / "schemas/cbmc-bound-manifest.schema.json").read_text(encoding="utf-8"))
    schema_findings = [error.message for error in Draft202012Validator(schema).iter_errors(manifest)]
    if schema_findings:
        manifest["status"] = "not-evaluable"
        manifest["blockers"].append("bound-manifest-schema-invalid")

    (ROOT / "cbmc-bound-manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    receipt = {
        "schema_version": "evf.crabs-partial-knowledge-cbmc-construction-receipt/v1",
        "status": "pass" if manifest["status"] == "frozen" else "block",
        "representatives": receipt_rows,
        "blockers": manifest["blockers"],
        "authority_effect": "none",
        "claim_ceiling": "Construction-time command and bound rehearsal only; not a live EVF promotion run.",
    }
    (RAW_ROOT / "receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps({"status": manifest["status"], "blockers": manifest["blockers"],
                      "targets": {row["representative_id"]: row["target_status"] for row in receipt_rows}}, sort_keys=True))
    return 0 if manifest["status"] == "frozen" else 1


if __name__ == "__main__":
    raise SystemExit(main())
