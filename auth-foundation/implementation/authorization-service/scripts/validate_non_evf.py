#!/usr/bin/env python3
"""Run the deterministic non-EVF Auth Service validation surface."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path


REPOSITORY = Path(__file__).resolve().parents[5]
AUTH_ROOT = REPOSITORY / "projects/auth-foundation"
IMPLEMENTATION = AUTH_ROOT / "implementation"
SERVICE = IMPLEMENTATION / "authorization-service"
FREEZER = SERVICE / "scripts/freeze_non_evf_candidate.py"
CANDIDATE = AUTH_ROOT / "development/auth-service-d65-r2-plan/non-evf-candidate-v1/AUTH-SERVICE-NON-EVF-CANDIDATE.v1.json"
RECEIPT = AUTH_ROOT / "development/auth-service-d65-r2-plan/non-evf-candidate-v1/VALIDATION-RECEIPT.json"
CLI = REPOSITORY / "projects/domainspec-v2/impl/cli/src/cli/main.ts"
TSX_LOADER = REPOSITORY / "projects/domainspec-v2/impl/cli/node_modules/tsx/dist/loader.mjs"

RUNTIMES = [
    ("operation", IMPLEMENTATION / "operation-source", "auth-exact-permission:authorize", IMPLEMENTATION / "standard-runtime", []),
    ("command-boundary", IMPLEMENTATION / "command-boundary-source", "auth-command-boundary:admit-authorization-command", IMPLEMENTATION / "command-boundary-runtime", []),
    ("trusted-input", IMPLEMENTATION / "trusted-input-source", "trusted-input-resolution:resolve-trusted-inputs", IMPLEMENTATION / "trusted-input-runtime", ["--integration-profile", "provider-neutral-v1", "--integration-binding-set", "trusted-input-sqlite"]),
]

CRATES = [
    "runtime-adapter",
    "sqlite-provider",
    "trusted-boundary",
    "trusted-input-provider",
    "authorization-service",
]

CONTRACTS = [
    AUTH_ROOT / "development/auth-service-d65-r2-plan/AUTH-SERVICE-BUSINESS-ONTOLOGY.v1-candidate.json",
    AUTH_ROOT / "development/auth-service-d65-r2-plan/AUTH-SERVICE-DEFINITION-PACK.v1-candidate.json",
    AUTH_ROOT / "development/auth-service-d65-r2-plan/AUTH-SERVICE-DOMAINSPEC-SOURCE-SET.v1-candidate.json",
    AUTH_ROOT / "development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CAPABILITY.v1-candidate.json",
    AUTH_ROOT / "development/auth-service-d65-r2-plan/AUTH-SERVICE-PRODUCT-CONTRACTS.v1-candidate.json",
]


def run(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, cwd=cwd, env=env, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"COMMAND_FAILED:{' '.join(command)}\n{result.stdout}\n{result.stderr}")
    return result


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tree(root: Path) -> dict[str, str]:
    return {
        str(path.relative_to(root)): digest(path)
        for path in sorted(root.rglob("*"))
        if path.is_file() and "target" not in path.parts and path.name != "Cargo.lock"
    }


def node_binary() -> str:
    configured = os.environ.get("DOMAINSPEC_NODE")
    if configured:
        return configured
    preferred = Path("/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node")
    if preferred.exists():
        return str(preferred)
    discovered = shutil.which("node")
    if not discovered:
        raise RuntimeError("NODE_NOT_FOUND")
    return discovered


def domainspec_replay(scratch: Path, node: str) -> list[dict]:
    results = []
    for name, source, selector, checked_in, extra in RUNTIMES:
        runs = []
        for index in (1, 2):
            target = scratch / f"{name}-{index}"
            command = [node, "--import", str(TSX_LOADER), str(CLI), "instantiate", str(source), "--node", selector, "--language", "rust", "--target-root", str(target), *extra]
            value = json.loads(run(command, REPOSITORY).stdout)
            if value.get("result") != "pass" or value.get("observation", {}).get("result") != "pass":
                raise RuntimeError(f"DOMAINSPEC_REPLAY_FAILED:{name}:{index}")
            runs.append(tree(target))
        if runs[0] != runs[1]:
            raise RuntimeError(f"DOMAINSPEC_NONDETERMINISTIC:{name}")
        if runs[0] != tree(checked_in):
            raise RuntimeError(f"GENERATED_RUNTIME_DRIFT:{name}")
        results.append({"runtime": name, "runs": 2, "files": len(runs[0]), "status": "pass"})
    return results


def rust_validation(scratch: Path) -> list[dict]:
    env = {**os.environ, "CARGO_TARGET_DIR": str(scratch / "cargo-target"), "PYTHONDONTWRITEBYTECODE": "1"}
    results = []
    for name in CRATES:
        crate = IMPLEMENTATION / name
        run(["cargo", "fmt", "--check"], crate, env)
        run(["cargo", "check", "--all-targets"], crate, env)
        strict = {**env, "RUSTFLAGS": "-Dwarnings"}
        run(["cargo", "clippy", "--all-targets", "--", "-D", "warnings"], crate, strict)
        run(["cargo", "test", "--all-targets"], crate, strict)
        listing = run(["cargo", "test", "--all-targets", "--", "--list"], crate, strict)
        names = sorted(line.rsplit(": test", 1)[0] for line in listing.stdout.splitlines() if line.endswith(": test"))
        results.append({"crate": name, "test_count": len(names), "test_names": names, "status": "pass"})
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    for contract in CONTRACTS:
        json.loads(contract.read_text(encoding="utf-8"))
    node = node_binary()
    with tempfile.TemporaryDirectory(prefix="auth-service-non-evf-") as directory:
        scratch = Path(directory)
        replay = domainspec_replay(scratch, node)
        rust = rust_validation(scratch)
    freeze_result = json.loads(run(["python3", str(FREEZER), "--verify"], REPOSITORY).stdout)
    candidate = json.loads(CANDIDATE.read_text(encoding="utf-8"))
    receipt = {
        "schema_version": "auth-service.non-evf-validation-receipt/v1",
        "receipt_id": "AUTH-SERVICE-NON-EVF-VALIDATION-001",
        "candidate_digest": candidate["candidate_digest"],
        "status": "pass",
        "checks": {
            "contract_json_parse": {"count": len(CONTRACTS), "status": "pass"},
            "domainspec_replay": replay,
            "rust": rust,
            "candidate_freeze": freeze_result,
        },
        "summary": {
            "domainspec_runtime_count": len(replay),
            "domainspec_runs": sum(value["runs"] for value in replay),
            "rust_crate_count": len(rust),
            "rust_test_count": sum(value["test_count"] for value in rust),
            "service_test_count": next(value["test_count"] for value in rust if value["crate"] == "authorization-service"),
        },
        "authority_effect": "none",
        "claim_limit": "Current local non-EVF technical validation of the exact frozen candidate only; EVF and the complete D65 product-evidence join remain separate and no approval or operational authority is granted.",
    }
    encoded = json.dumps(receipt, indent=2, sort_keys=True) + "\n"
    if args.write_receipt:
        RECEIPT.write_text(encoded, encoding="utf-8")
    print(encoded, end="")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError, json.JSONDecodeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2))
        raise SystemExit(1)
