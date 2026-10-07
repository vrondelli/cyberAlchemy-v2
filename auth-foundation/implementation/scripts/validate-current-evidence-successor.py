#!/usr/bin/env python3
"""Verify a versioned current Auth technical-evidence candidate, not admission."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path


AUTH_ROOT = Path(__file__).resolve().parents[2]
IMPLEMENTATION = AUTH_ROOT / "implementation"
BINDING = IMPLEMENTATION / "current-evidence-successor-v1/binding.json"
RUNTIME_VERIFIER = IMPLEMENTATION / "scripts/validate-current-runtime-successor.py"

HISTORICAL = (
    "implementation/standard-conformance/runtime-evidence.json",
    "implementation/provider-construction-binding.json",
    "implementation/standard-conformance/provider-evidence.json",
    "implementation/standard-conformance/trusted-input-provider-binding.json",
    "implementation/standard-conformance/authorization-service-binding.json",
    "implementation/standard-conformance/trusted-input-evidence.json",
    "implementation/d65-chain.json",
)
CURRENT_SOURCES = (
    "implementation/current-runtime-successor-v1/binding.json",
    "implementation/current-runtime-successor-v1/standard/.domainspec/instantiations/auth-exact-permission.authorize.json",
    "implementation/current-runtime-successor-v1/command-boundary/.domainspec/instantiations/auth-command-boundary.admit-authorization-command.json",
    "implementation/current-runtime-successor-v1/trusted-input/.domainspec/instantiations/trusted-input-resolution.resolve-trusted-inputs.json",
    "implementation/current-runtime-successor-v1/trusted-input/src/domainspec/rust/trusted-input-resolution/resolve-trusted-inputs.rs",
    "implementation/current-runtime-successor-v1/trusted-input/src/domainspec/system-integration/rust/trusted-input-sqlite.rs",
    "implementation/runtime-adapter/Cargo.toml",
    "implementation/runtime-adapter/Cargo.lock",
    "implementation/runtime-adapter/src/lib.rs",
    "implementation/runtime-adapter/tests/adapter.rs",
    "implementation/sqlite-provider/Cargo.toml",
    "implementation/sqlite-provider/Cargo.lock",
    "implementation/sqlite-provider/src/lib.rs",
    "implementation/sqlite-provider/migrations/0001_auth_state.sql",
    "implementation/sqlite-provider/tests/provider.rs",
    "implementation/trusted-input-provider/Cargo.toml",
    "implementation/trusted-input-provider/Cargo.lock",
    "implementation/trusted-input-provider/src/lib.rs",
    "implementation/trusted-input-provider/migrations/0001_trusted_inputs.sql",
    "implementation/trusted-input-provider/tests/provider.rs",
    "implementation/standard-conformance/trusted-input-system-ontology.json",
    "implementation/standard-conformance/provider-binding.json",
    "implementation/standard-conformance/trusted-boundary-binding.json",
    "development/auth-service-d65-r2-plan/AUTH-SERVICE-BUSINESS-ONTOLOGY.v1-candidate.json",
    "development/auth-service-d65-r2-plan/AUTH-SERVICE-DOMAINSPEC-SOURCE-SET.v1-candidate.json",
    "implementation/authorization-service/Cargo.toml",
    "implementation/authorization-service/Cargo.lock",
    "implementation/authorization-service/src/lib.rs",
    "implementation/authorization-service/migrations/0002_auth_service_epoch.sql",
    "implementation/authorization-service/tests/integration.rs",
)
CRATES = (
    ("runtime-adapter", 8),
    ("sqlite-provider", 10),
    ("trusted-input-provider", 10),
    ("authorization-service", 21),
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def resolve_auth_path(relative: str) -> Path:
    path = (AUTH_ROOT / relative).resolve()
    if not path.is_relative_to(AUTH_ROOT) or not path.is_file():
        raise ValueError(f"missing or escaping Auth source: {relative}")
    return path


def hashes(paths: tuple[str, ...]) -> dict[str, str]:
    return {relative: sha256(resolve_auth_path(relative).read_bytes()) for relative in paths}


def run(command: list[str], cwd: Path) -> str:
    environment = dict(os.environ)
    for candidate in (environment.get("TMPDIR"), "/var/tmp", "/tmp"):
        if candidate and Path(candidate).is_dir() and shutil.disk_usage(candidate).free > 256 * 1024 * 1024:
            environment["TMPDIR"] = candidate
            break
    result = subprocess.run(command, cwd=cwd, env=environment, text=True, capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError(f"{cwd.name}: {' '.join(command)} failed: {result.stderr[-2000:]}")
    return result.stdout


def test_inventory(listing: str, expected_count: int) -> dict:
    names = sorted(line.rsplit(": test", 1)[0] for line in listing.splitlines() if line.endswith(": test"))
    if len(names) != expected_count or len(set(names)) != len(names):
        raise ValueError(f"test inventory changed: expected {expected_count}, got {len(names)}")
    return {"test_count": len(names), "test_names_sha256": sha256(("\n".join(names) + "\n").encode()), "test_runs": 2}


def expected_binding() -> dict:
    before = hashes(CURRENT_SOURCES)
    historical = hashes(HISTORICAL)
    service_binding = json.loads(resolve_auth_path("implementation/standard-conformance/authorization-service-binding.json").read_text())
    provider_binding = json.loads(resolve_auth_path("implementation/standard-conformance/trusted-input-provider-binding.json").read_text())
    service_impl = service_binding["implementation"]
    required_service_refs = {
        "service_business_ontology": "development/auth-service-d65-r2-plan/AUTH-SERVICE-BUSINESS-ONTOLOGY.v1-candidate.json",
        "service_domainspec_source_set": "development/auth-service-d65-r2-plan/AUTH-SERVICE-DOMAINSPEC-SOURCE-SET.v1-candidate.json",
        "authorization_state_provider": "implementation/standard-conformance/provider-binding.json",
        "trusted_boundary": "implementation/standard-conformance/trusted-boundary-binding.json",
    }
    for key, path in required_service_refs.items():
        if service_binding[key]["path"] != path or before[path] != service_binding[key]["sha256"]:
            raise ValueError(f"service architecture dependency changed: {key}")
    if service_impl["migration_path"] != "implementation/authorization-service/migrations/0002_auth_service_epoch.sql":
        raise ValueError("service epoch migration path changed")
    if before[service_impl["migration_path"]] != service_impl["migration_sha256"]:
        raise ValueError("service epoch migration bytes changed")
    if (service_impl["trusted_input_query_entrypoint"], service_impl["authorization_state_entrypoint"]) != ("resolve_in_transaction", "authorize_in_transaction"):
        raise ValueError("service transaction entrypoints changed")
    if "resolve_in_transaction" not in provider_binding["implementation"]["entrypoints"]:
        raise ValueError("trusted-input transaction entrypoint missing")
    for name, source in (("resolve_in_transaction", IMPLEMENTATION / "trusted-input-provider/src/lib.rs"),
                         ("authorize_in_transaction", IMPLEMENTATION / "sqlite-provider/src/lib.rs")):
        if name not in source.read_text(encoding="utf-8"):
            raise ValueError(f"transaction entrypoint absent in source: {name}")
    runtime = run(["python3", str(RUNTIME_VERIFIER)], AUTH_ROOT)
    if json.loads(runtime).get("status") != "pass":
        raise ValueError("current runtime successor did not pass")
    crates = {}
    for name, count in CRATES:
        crate = IMPLEMENTATION / name
        run(["cargo", "fmt", "--check"], crate)
        run(["cargo", "check", "--all-targets"], crate)
        run(["env", "RUSTFLAGS=-Dwarnings", "cargo", "check", "--all-targets"], crate)
        for _ in range(2):
            run(["cargo", "test", "--all-targets"], crate)
        inventory = test_inventory(run(["cargo", "test", "--all-targets", "--", "--list"], crate), count)
        run(["cargo", "clippy", "--all-targets", "--", "-D", "warnings"], crate)
        crates[name] = {**inventory, "fmt": "PASS", "check": "PASS", "strict_check": "PASS", "clippy": "PASS"}
    if before != hashes(CURRENT_SOURCES) or historical != hashes(HISTORICAL):
        raise ValueError("Auth evidence inputs changed during verification")
    return {
        "schema_version": "auth-foundation.current-technical-evidence-successor/v1-candidate",
        "binding_id": "AUTH-CURRENT-TECHNICAL-EVIDENCE-001",
        "historical_snapshots": historical,
        "current_sources": before,
        "architecture": {
            "dependency_order": ["current-runtime", "sqlite-provider", "trusted-input-provider", "authorization-service"],
            "service_refs": required_service_refs,
            "service_epoch_migration": service_impl["migration_path"],
            "trusted_input_transaction_entrypoint": service_impl["trusted_input_query_entrypoint"],
            "authorization_state_transaction_entrypoint": service_impl["authorization_state_entrypoint"],
            "evaluation_epoch": service_impl["evaluation_epoch"],
        },
        "verification": {"current_cli_replay": "PASS", "crates": crates},
        "result": "local-current-technical-candidate-pass",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Exact current local CLI and four-crate technical checks only; historical D65 evidence remains archived and may contain stale internal links. No semantic admission, deployment, production security, or runtime-guarantee claim.",
    }


def verify(record: dict, expected: dict) -> None:
    if record != expected:
        raise ValueError("current technical evidence binding differs from verified bytes or results")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true", help="print candidate JSON; never write files")
    args = parser.parse_args()
    expected = expected_binding()
    if args.print_expected:
        print(json.dumps(expected, indent=2))
    else:
        verify(json.loads(BINDING.read_text(encoding="utf-8")), expected)
        print(json.dumps({"status": "pass", "binding": str(BINDING.relative_to(AUTH_ROOT)), "crates": list(expected["verification"]["crates"]), "authority_effect": "none"}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, RuntimeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2))
        raise SystemExit(1)
