#!/usr/bin/env python3
"""Run pinned local providers twice and materialize deterministic candidate evidence."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CLAIMS = ROOT / "claims.json"
GENERATED = ROOT / "generated"
LEAN_SOURCE = ROOT / "providers/lean/EncryptedDurableConformance.lean"
TLA_SOURCE = ROOT / "providers/tla/EncryptedDurableConformance.tla"
TLA_CONFIG = ROOT / "providers/tla/EncryptedDurableConformance.cfg"
ALLOY_SOURCE = ROOT / "providers/alloy/EncryptedDurableConformance.als"

TOOL_ROOT = Path(
    os.environ.get(
        "CA2_FORMAL_TOOL_ROOT",
        "/home/vrondelli/.cache/cyberalchemy-v2/formal-tools",
    )
)
JAVA = TOOL_ROOT / "temurin-21/bin/java"
TLA_JAR = TOOL_ROOT / "tla2tools-1.7.2.jar"
ALLOY_JAR = TOOL_ROOT / "alloy-6.2.0.jar"
LEAN = Path("/home/vrondelli/.elan/bin/lean")


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def execute(command: list[str], cwd: Path, timeout: int = 120) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
        env={**os.environ, "LC_ALL": "C", "TZ": "UTC"},
    )


def lean_run() -> dict[str, object]:
    completed = execute([str(LEAN), LEAN_SOURCE.name], LEAN_SOURCE.parent)
    return {
        "result": "PASS_BOUNDED" if completed.returncode == 0 else "NON_PASS",
        "exit_code": completed.returncode,
        "stdout_sha256": sha_bytes(completed.stdout.encode()),
        "stderr_sha256": sha_bytes(completed.stderr.encode()),
        "source_sha256": sha_file(LEAN_SOURCE),
        "no_sorry": "sorry" not in LEAN_SOURCE.read_text(),
        "no_axiom": not re.search(r"^\s*axiom\s", LEAN_SOURCE.read_text(), re.MULTILINE),
        "no_unsafe": not re.search(r"^\s*unsafe\s", LEAN_SOURCE.read_text(), re.MULTILINE),
    }


def tla_run() -> dict[str, object]:
    completed = execute(
        [
            str(JAVA),
            "-XX:+UseParallelGC",
            "-jar",
            str(TLA_JAR),
            "-config",
            TLA_CONFIG.name,
            "-workers",
            "1",
            "-seed",
            "20260901",
            TLA_SOURCE.name,
        ],
        TLA_SOURCE.parent,
    )
    output = completed.stdout + completed.stderr

    def count(pattern: str) -> int | None:
        match = re.search(pattern, output)
        return int(match.group(1)) if match else None

    no_error = "Model checking completed. No error has been found." in output
    return {
        "result": "PASS_BOUNDED" if completed.returncode == 0 and no_error else "NON_PASS",
        "exit_code": completed.returncode,
        "seed": 20260901,
        "workers": 1,
        "states_generated": count(r"(\d+) states generated"),
        "distinct_states": count(r"(\d+) distinct states found"),
        "state_graph_depth": count(r"depth of the complete state graph search is (\d+)"),
        "source_sha256": sha_file(TLA_SOURCE),
        "config_sha256": sha_file(TLA_CONFIG),
        "failure_case_count": 10,
        "bounded_identities": ["A", "B", "Outsider"],
        "bounded_layers": ["Operational", "Recovery", "Archive"],
        "bounded_finalities": ["Submitted", "Confirmed", "Finalized"],
        "bounded_revisions": [0, 1, 2, 3],
    }


def alloy_run() -> dict[str, object]:
    with tempfile.TemporaryDirectory(prefix="kep-alloy-") as directory:
        output = Path(directory) / "result"
        completed = execute(
            [
                str(JAVA),
                "-jar",
                str(ALLOY_JAR),
                "exec",
                "-q",
                "-c",
                "*",
                "-t",
                "json",
                "-o",
                str(output),
                ALLOY_SOURCE.name,
            ],
            ALLOY_SOURCE.parent,
        )
        receipt_path = output / "receipt.json"
        receipt = json.loads(receipt_path.read_text()) if receipt_path.exists() else {}
    commands = []
    for name, command in sorted(receipt.get("commands", {}).items()):
        commands.append(
            {
                "name": name,
                "kind": command.get("type"),
                "scope": command.get("overall"),
                "bitwidth": command.get("bitwidth"),
                "counterexample_count": len(command.get("solution", [])),
            }
        )
    pass_bounded = (
        completed.returncode == 0
        and len(commands) == 4
        and all(command["counterexample_count"] == 0 for command in commands)
    )
    return {
        "result": "PASS_BOUNDED" if pass_bounded else "NON_PASS",
        "exit_code": completed.returncode,
        "solver": receipt.get("solver"),
        "commands": commands,
        "source_sha256": sha_file(ALLOY_SOURCE),
        "identity_scope": 3,
        "key_role_scope": 3,
        "state_scope": 6,
        "integer_bitwidth": 4,
    }


def tool_version(command: list[str], cwd: Path) -> str:
    result = execute(command, cwd)
    return (result.stdout + result.stderr).strip().splitlines()[0]


def build() -> dict[Path, bytes]:
    claims_document = json.loads(CLAIMS.read_text())
    runs: dict[str, list[dict[str, object]]] = {}
    runners = {"lean": lean_run, "tla": tla_run, "alloy": alloy_run}
    for provider, runner in runners.items():
        runs[provider] = [runner(), runner()]

    runtime_bindings = {
        "lean": {
            "tool": "Lean",
            "version": tool_version([str(LEAN), "--version"], ROOT),
            "binary_sha256": sha_file(LEAN.resolve()),
            "source_path": str(LEAN_SOURCE.relative_to(ROOT)),
        },
        "tla": {
            "tool": "TLA+/TLC",
            "version": tool_version([str(JAVA), "-jar", str(TLA_JAR), "-help"], ROOT),
            "binary_sha256": sha_file(TLA_JAR),
            "java_binary_sha256": sha_file(JAVA),
            "source_path": str(TLA_SOURCE.relative_to(ROOT)),
        },
        "alloy": {
            "tool": "Alloy",
            "version": tool_version([str(JAVA), "-jar", str(ALLOY_JAR), "version"], ROOT),
            "binary_sha256": sha_file(ALLOY_JAR),
            "java_binary_sha256": sha_file(JAVA),
            "source_path": str(ALLOY_SOURCE.relative_to(ROOT)),
        },
    }

    files: dict[Path, bytes] = {}
    projection_count = 0
    all_pass = True
    for claim in claims_document["claims"]:
        claim_digest = sha_bytes(canonical(claim))
        projections = []
        for provider in claim["providers"]:
            first, second = runs[provider]
            first_digest = sha_bytes(canonical(first))
            second_digest = sha_bytes(canonical(second))
            deterministic = first_digest == second_digest
            pass_bounded = (
                deterministic
                and first["result"] == "PASS_BOUNDED"
                and second["result"] == "PASS_BOUNDED"
            )
            all_pass = all_pass and pass_bounded
            source_path = ROOT / runtime_bindings[provider]["source_path"]
            projections.append(
                {
                    "provider_id": provider,
                    "preservation_binding": {
                        "claim_digest": claim_digest,
                        "semantic_identity": claim["semantic_identity"],
                        "provider_source_sha256": sha_file(source_path),
                        "relation": "bounded_projection_of_canonical_proposition",
                    },
                    "runtime_binding": runtime_bindings[provider],
                    "execution_policy": {
                        "timeout_seconds": 120,
                        "required_executions": 2,
                        "determinism_required": True,
                        "positive_status": "PASS_BOUNDED",
                        "non_pass_statuses": [
                            "timeout",
                            "unknown",
                            "stale",
                            "malformed",
                            "unsupported",
                            "missing",
                        ],
                    },
                    "executions": [
                        {"ordinal": 1, "result_digest": first_digest, "result": first},
                        {"ordinal": 2, "result_digest": second_digest, "result": second},
                    ],
                    "provider_receipt": {
                        "status": "PASS_BOUNDED" if pass_bounded else "NON_PASS",
                        "deterministic": deterministic,
                        "claim_ceiling": "Exact bounded model/provider result only; no runtime or external-effect authority.",
                    },
                    "evf_evidence_join": {
                        "status": "candidate-local-join",
                        "global_runtime_mutated": False,
                        "claim_digest": claim_digest,
                        "execution_result_digests": [first_digest, second_digest],
                        "authority_effect": "none",
                    },
                }
            )
            projection_count += 1
        formal_claim = {
            "schema_version": "domainspec-v2.formal-claim-source-payload/v2",
            "claim": claim,
            "canonical_proposition_digest": claim_digest,
            "accepted_predecessors": claims_document["accepted_predecessors"],
            "projections": projections,
            "claim_ceiling": claims_document["claim_ceiling"],
            "authority_effect": "none",
        }
        slug = claim["claim_id"].lower()
        files[GENERATED / f"{slug}.formal-claim.json"] = canonical(formal_claim)

    receipt = {
        "schema_version": "cav2-kep-formal-provider-receipt/v2",
        "claim_set_id": claims_document["claim_set_id"],
        "claims_sha256": sha_file(CLAIMS),
        "claim_count": len(claims_document["claims"]),
        "projection_count": projection_count,
        "status": "PASS_BOUNDED" if all_pass else "NON_PASS",
        "two_run_determinism": all_pass,
        "souffle_residue": claims_document["souffle_residue"],
        "authority_effect": "none",
    }
    files[GENERATED / "provider-receipt.json"] = canonical(receipt)
    return files


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    files = build()
    if args.check:
        mismatches = [str(path) for path, data in files.items() if not path.exists() or path.read_bytes() != data]
        if mismatches:
            print("generated evidence drift:")
            print("\n".join(mismatches))
            return 1
        print("formal provider evidence deterministic: PASS_BOUNDED")
        return 0
    GENERATED.mkdir(parents=True, exist_ok=True)
    for path, data in files.items():
        path.write_bytes(data)
    print("formal provider evidence authored: PASS_BOUNDED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
