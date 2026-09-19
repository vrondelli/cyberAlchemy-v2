#!/usr/bin/env python3
"""Validate the dependency-closed Authorization API node-13 candidate."""

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
API = IMPLEMENTATION / "authorization-api"
SERVICE = IMPLEMENTATION / "authorization-service"
PLAN = AUTH_ROOT / "development/auth-service-d65-r2-plan/authorization-api-v1"
CANDIDATE = PLAN / "AUTHORIZATION-API-CANDIDATE.v1.json"
FREEZER = API / "scripts/freeze_candidate.py"
OUTPUT = PLAN / "VALIDATION-RECEIPT.json"
CLI = REPOSITORY / "projects/domainspec-v2/impl/cli/src/cli/main.ts"
TSX_LOADER = REPOSITORY / "projects/domainspec-v2/impl/cli/node_modules/tsx/dist/loader.mjs"
RUNTIMES = [
    ("operation", IMPLEMENTATION / "operation-source", "auth-exact-permission:authorize", IMPLEMENTATION / "standard-runtime", []),
    ("command-boundary", IMPLEMENTATION / "command-boundary-source", "auth-command-boundary:admit-authorization-command", IMPLEMENTATION / "command-boundary-runtime", []),
    ("trusted-input", IMPLEMENTATION / "trusted-input-source", "trusted-input-resolution:resolve-trusted-inputs", IMPLEMENTATION / "trusted-input-runtime", ["--integration-profile", "provider-neutral-v1", "--integration-binding-set", "trusted-input-sqlite"]),
]
PROTOTYPES = [
    PLAN / "AUTHORIZATION-API-DEFINITIONS.v1-candidate.json",
    PLAN / "AUTHORIZATION-API-ONTOLOGY.v1-candidate.json",
    PLAN / "AUTHORIZATION-API-PRODUCT-CONTRACT.v1-candidate.json",
]
EXPECTED_API_TESTS = sorted([
    "database_pool_uses_existing_schema_system_clock_and_binary_decisions",
    "distinct_pool_engines_execute_authorizations_in_parallel",
    "evaluation_timeout_returns_504_deny_and_worker_finishes_safely",
    "exact_request_is_projected_once_and_binary_decision_is_preserved",
    "malformed_non_exact_and_unsupported_requests_fail_closed",
    "pool_saturation_returns_503_deny_with_bounded_wait",
    "runtime_configuration_rejects_zero_capacity_and_zero_timeouts",
    "sql_injection_payloads_are_bound_values_and_leave_schema_intact",
])


def run(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, cwd=cwd, env=env, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"COMMAND_FAILED:{' '.join(command)}\n{result.stdout}\n{result.stderr}")
    return result


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tree(root: Path) -> dict[str, str]:
    return {str(path.relative_to(root)): digest(path) for path in sorted(root.rglob("*")) if path.is_file() and "target" not in path.parts and path.name != "Cargo.lock"}


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


def replay_domainspec(scratch: Path) -> list[dict]:
    results = []
    node = node_binary()
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


def rust(crate: Path, scratch: Path) -> dict:
    env = {**os.environ, "CARGO_TARGET_DIR": str(scratch / "cargo-target"), "PYTHONDONTWRITEBYTECODE": "1", "RUSTFLAGS": "-Dwarnings"}
    run(["cargo", "fmt", "--check"], crate, env)
    run(["cargo", "check", "--all-targets", "--offline"], crate, env)
    run(["cargo", "clippy", "--all-targets", "--offline", "--", "-D", "warnings"], crate, env)
    run(["cargo", "test", "--all-targets", "--offline"], crate, env)
    listing = run(["cargo", "test", "--all-targets", "--offline", "--", "--list"], crate, env)
    names = sorted(line.rsplit(": test", 1)[0] for line in listing.stdout.splitlines() if line.endswith(": test"))
    return {"crate": crate.name, "status": "pass", "test_count": len(names), "test_names": names}


def validate_sql_surface() -> dict:
    roots = [IMPLEMENTATION / name / "src" for name in ("sqlite-provider", "trusted-input-provider", "authorization-service", "authorization-api")]
    forbidden = ("prepare(&format!", "query_row(&format!", "execute(&format!", "execute_batch(&format!")
    scanned = 0
    for root in roots:
        for path in root.rglob("*.rs"):
            scanned += 1
            source = path.read_text(encoding="utf-8")
            for pattern in forbidden:
                if pattern in source:
                    raise RuntimeError(f"DYNAMIC_RUNTIME_SQL:{path.relative_to(REPOSITORY)}:{pattern}")
    api_test = (API / "tests/http_api.rs").read_text(encoding="utf-8")
    for payload in ("' OR 1=1 --", "DROP TABLE auth_sessions", "UNION SELECT", "PRAGMA writable_schema"):
        if payload not in api_test:
            raise RuntimeError(f"MISSING_INJECTION_CASE:{payload}")
    return {"status": "pass", "rust_source_files": scanned, "request_sql_interpolation": "absent", "adversarial_payload_classes": 4}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args()
    for path in PROTOTYPES:
        json.loads(path.read_text(encoding="utf-8"))
    source = (API / "src/lib.rs").read_text(encoding="utf-8")
    for forbidden in ("TcpListener", "axum::serve", "hyper::Server", "0.0.0.0"):
        if forbidden in source:
            raise RuntimeError(f"UNAUTHORIZED_LISTENER_SURFACE:{forbidden}")
    sql = validate_sql_surface()
    with tempfile.TemporaryDirectory(prefix="authorization-api-node13-") as directory:
        scratch = Path(directory)
        replay = replay_domainspec(scratch)
        service = rust(SERVICE, scratch)
        api = rust(API, scratch)
    if service["test_count"] != 15:
        raise RuntimeError(f"SERVICE_TEST_INVENTORY_DRIFT:{service['test_count']}")
    if api["test_names"] != EXPECTED_API_TESTS:
        raise RuntimeError(f"API_TEST_INVENTORY_DRIFT:{api['test_names']}")
    freeze = json.loads(run(["python3", str(FREEZER), "--verify"], REPOSITORY).stdout)
    candidate = json.loads(CANDIDATE.read_text(encoding="utf-8"))
    receipt = {
        "schema_version": "auth-service.authorization-api-validation/v2",
        "receipt_id": "AUTHORIZATION-API-V1-NODE-13-VALIDATION-001",
        "status": "pass",
        "candidate_digest": candidate["candidate_digest"],
        "checks": {
            "prototype_json_documents": {"status": "pass", "count": len(PROTOTYPES)},
            "domainspec_replay": replay,
            "rust": [service, api],
            "sql_binding_surface": sql,
            "network_listener_absent": "pass",
            "candidate_freeze": freeze,
        },
        "summary": {"domainspec_runs": 6, "service_tests": service["test_count"], "api_tests": api["test_count"], "rust_tests": service["test_count"] + api["test_count"]},
        "authority_effect": "none",
        "claim_limit": "Current local validation of the exact node-13 candidate only; EVF evidence join, product approval, admission, activation, publication, release, deployment, production readiness, and external effects remain unavailable.",
    }
    encoded = json.dumps(receipt, indent=2, sort_keys=True) + "\n"
    if args.write_receipt:
        OUTPUT.write_text(encoded, encoding="utf-8")
    print(encoded, end="")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError, json.JSONDecodeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2))
        raise SystemExit(1)
