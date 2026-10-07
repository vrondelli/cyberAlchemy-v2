#!/usr/bin/env python3
"""Replay and bind current Auth v2 technical evidence without rewriting v1."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import tomllib
from pathlib import Path


AUTH_ROOT = Path(__file__).resolve().parents[2]
IMPLEMENTATION = AUTH_ROOT / "implementation"
TOOLCHAIN = AUTH_ROOT.parent / "tools/toolchain/run"
BINDING = IMPLEMENTATION / "current-evidence-successor-v2/binding.json"

HISTORICAL = (
    "implementation/current-evidence-successor-v1/binding.json",
    "implementation/standard-conformance/runtime-evidence.json",
    "implementation/provider-construction-binding.json",
    "implementation/standard-conformance/provider-evidence.json",
    "implementation/standard-conformance/trusted-input-provider-binding.json",
    "implementation/standard-conformance/authorization-service-binding.json",
    "implementation/standard-conformance/trusted-input-evidence.json",
    "implementation/d65-chain.json",
)

CURRENT = (
    "implementation/scripts/validate-current-evidence-successor-v2.py",
    "implementation/scripts/test-current-evidence-successor-v2.py",
    "implementation/current-runtime-successor-v1/binding.json",
    "implementation/current-runtime-successor-v1/standard/.domainspec/instantiations/auth-exact-permission.authorize.json",
    "implementation/current-runtime-successor-v1/command-boundary/.domainspec/instantiations/auth-command-boundary.admit-authorization-command.json",
    "implementation/current-runtime-successor-v1/trusted-input/.domainspec/instantiations/trusted-input-resolution.resolve-trusted-inputs.json",
    "implementation/current-runtime-successor-v1/trusted-input/src/domainspec/rust/trusted-input-resolution/resolve-trusted-inputs.rs",
    "implementation/current-runtime-successor-v1/trusted-input/src/domainspec/system-integration/rust/trusted-input-sqlite.rs",
    "implementation/standard-conformance/trusted-input-system-ontology.json",
    "implementation/standard-conformance/provider-binding.json",
    "development/auth-service-d65-r2-plan/AUTH-SERVICE-BUSINESS-ONTOLOGY.v1-candidate.json",
    "development/auth-service-d65-r2-plan/AUTH-SERVICE-DOMAINSPEC-SOURCE-SET.v1-candidate.json",
    "implementation/command-boundary-runtime-v2/.domainspec/instantiations/auth-command-boundary.admit-authorization-command.json",
    "implementation/command-boundary-runtime-v2/Cargo.toml",
    "implementation/command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs",
    "implementation/trusted-boundary-v2/Cargo.toml",
    "implementation/trusted-boundary-v2/Cargo.lock",
    "implementation/trusted-boundary-v2/src/lib.rs",
    "implementation/trusted-boundary-v2/tests/trusted_boundary.rs",
    "implementation/trusted-boundary-v2/tests/historical_counterexample.rs",
    "implementation/trusted-boundary-v2/tests/no_call_contract_gap.rs",
    "implementation/trusted-boundary-v2/tests/source_qualifier_equivalence.test.mjs",
    "implementation/trusted-boundary-pre-resolved-v2-candidate/Cargo.toml",
    "implementation/trusted-boundary-pre-resolved-v2-candidate/Cargo.lock",
    "implementation/trusted-boundary-pre-resolved-v2-candidate/src/lib.rs",
    "implementation/trusted-boundary-pre-resolved-v2-candidate/tests/pre_resolved.rs",
    "implementation/authorization-service/migrations/0002_auth_service_epoch.sql",
    "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-accepted.json",
    "formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/business-meaning-v1-clarified-acceptance.json",
)

CRATES = (
    "runtime-adapter",
    "sqlite-provider",
    "trusted-input-provider",
    "command-boundary-runtime-v2",
    "trusted-boundary-v2",
    "trusted-boundary-pre-resolved-v2-candidate",
    "authorization-service",
)

DEPENDENCIES = {
    "authorization-service": {
        "auth-foundation-trusted-boundary-v2": "../trusted-boundary-v2",
        "auth-foundation-trusted-boundary-pre-resolved-v2-candidate": "../trusted-boundary-pre-resolved-v2-candidate",
        "auth-foundation-trusted-input-provider": "../trusted-input-provider",
        "auth-foundation-sqlite-provider": "../sqlite-provider",
    },
    "trusted-boundary-pre-resolved-v2-candidate": {
        "auth-foundation-trusted-boundary-v2": "../trusted-boundary-v2",
    },
    "trusted-boundary-v2": {
        "auth-command-boundary-kernel": "../command-boundary-runtime-v2",
    },
}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def source_path(relative: str) -> Path:
    path = (AUTH_ROOT / relative).resolve()
    if not path.is_relative_to(AUTH_ROOT) or not path.is_file():
        raise ValueError(f"missing or escaping Auth evidence input: {relative}")
    return path


def source_manifest() -> tuple[str, ...]:
    paths = set(CURRENT)
    for name in CRATES:
        paths.add(f"implementation/{name}/Cargo.toml")
        paths.add(f"implementation/{name}/Cargo.lock")
        for directory in ("src", "tests", "migrations"):
            root = IMPLEMENTATION / name / directory
            if root.is_dir():
                for path in root.rglob("*"):
                    if path.is_file():
                        paths.add(str(path.relative_to(AUTH_ROOT)))
    for path in (IMPLEMENTATION / "command-boundary-source-v2").rglob("*.json"):
        paths.add(str(path.relative_to(AUTH_ROOT)))
    return tuple(sorted(paths))


def hashes(paths: tuple[str, ...]) -> dict[str, str]:
    return {relative: digest(source_path(relative).read_bytes()) for relative in paths}


def verify_wiring() -> dict:
    for crate, dependencies in DEPENDENCIES.items():
        manifest = tomllib.loads((IMPLEMENTATION / crate / "Cargo.toml").read_text())
        for name, relative in dependencies.items():
            dependency = manifest["dependencies"].get(name)
            if not isinstance(dependency, dict) or dependency.get("path") != relative:
                raise ValueError(f"v2 Cargo dependency missing or changed: {crate}/{name}")
            resolved = (IMPLEMENTATION / crate / relative).resolve()
            if resolved != IMPLEMENTATION / relative.removeprefix("../"):
                raise ValueError(f"v2 Cargo dependency escapes expected crate: {crate}/{name}")
        if crate == "trusted-boundary-v2":
            kernel = manifest["dependencies"]["auth-command-boundary-kernel"]
            if kernel.get("package") != "auth-foundation-command-boundary-v2-auth-command-boundary-admit-authorization-command":
                raise ValueError("v2 boundary kernel package changed")
    service = (IMPLEMENTATION / "authorization-service/src/lib.rs").read_text()
    pre_resolved = (IMPLEMENTATION / "trusted-boundary-pre-resolved-v2-candidate/src/lib.rs").read_text()
    boundary = (IMPLEMENTATION / "trusted-boundary-v2/src/lib.rs").read_text()
    provider = (IMPLEMENTATION / "trusted-input-provider/src/lib.rs").read_text()
    state = (IMPLEMENTATION / "sqlite-provider/src/lib.rs").read_text()
    if not re.search(r"use auth_foundation_trusted_boundary_pre_resolved_v2_candidate::authorize_pre_resolved\s*;", service):
        raise ValueError("service does not import the v2 pre-resolved decision")
    if len(re.findall(r"\bauthorize_pre_resolved\s*\(", service)) != 1:
        raise ValueError("service v2 decision call changed")
    if "use auth_foundation_trusted_boundary_v2::" not in service or "use auth_foundation_trusted_boundary_v2::" not in pre_resolved:
        raise ValueError("service/pre-resolved v2 boundary import missing")
    if "use auth_command_boundary_kernel as boundary_kernel;" not in boundary:
        raise ValueError("v2 generated kernel import missing")
    if "resolve_in_transaction" not in provider or "authorize_in_transaction" not in state:
        raise ValueError("transactional provider entrypoint missing")
    return {
        "active_decision_path": ["authorization-service", "trusted-boundary-pre-resolved-v2-candidate", "trusted-boundary-v2", "command-boundary-runtime-v2"],
        "request_type_compatibility_only": "trusted-boundary",
        "provider_entrypoints": ["resolve_in_transaction", "authorize_in_transaction"],
        "cargo_dependency_paths": DEPENDENCIES,
    }


def run(command: list[str], cwd: Path) -> str:
    environment = dict(os.environ)
    environment["TMPDIR"] = "/dev/shm" if Path("/dev/shm").is_dir() else environment.get("TMPDIR", "/tmp")
    result = subprocess.run(command, cwd=cwd, env=environment, text=True, capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError(f"{cwd.name}: {' '.join(command)} failed: {(result.stderr or result.stdout)[-2400:]}")
    return result.stdout


def replay_v2_projection() -> str:
    node = shutil.which("node")
    tsx = AUTH_ROOT.parent / "craft/projects/domainspec-v2/impl/cli/node_modules/tsx/dist/cli.mjs"
    cli = AUTH_ROOT.parent / "craft/projects/domainspec-v2/impl/cli/src/cli/main.ts"
    if node is None or not tsx.is_file() or not cli.is_file():
        raise ValueError("DomainSpec CLI unavailable for v2 clean generation")
    relative_artifacts = (
        "Cargo.toml",
        "src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs",
        ".domainspec/instantiations/auth-command-boundary.admit-authorization-command.json",
    )
    checked = IMPLEMENTATION / "command-boundary-runtime-v2"
    for _ in range(2):
        with tempfile.TemporaryDirectory(prefix="auth-v2-projection-", dir="/var/tmp") as scratch:
            target = Path(scratch) / "runtime"
            run([
                node, str(tsx), str(cli), "instantiate",
                str(IMPLEMENTATION / "command-boundary-source-v2"),
                "--node", "auth-command-boundary:admit-authorization-command",
                "--language", "rust", "--target-root", str(target),
            ], AUTH_ROOT.parent)
            for relative in relative_artifacts:
                if (target / relative).read_bytes() != (checked / relative).read_bytes():
                    raise ValueError(f"v2 clean generation differs: {relative}")
    return "TWO_CLEAN_BYTE_IDENTICAL"


def inventory(listing: str, *, allow_empty: bool = False) -> dict:
    names = sorted(line.rsplit(": test", 1)[0] for line in listing.splitlines() if line.endswith(": test"))
    if (not names and not allow_empty) or len(names) != len(set(names)):
        raise ValueError("empty or duplicate Rust test inventory")
    return {"test_count": len(names), "test_names_sha256": digest(("\n".join(names) + "\n").encode()), "test_runs": 2}


def expected_binding() -> dict:
    manifest = source_manifest()
    current = hashes(manifest)
    historical = hashes(HISTORICAL)
    architecture = verify_wiring()
    runtime = json.loads(run(["python3", str(IMPLEMENTATION / "scripts/validate-current-runtime-successor.py")], AUTH_ROOT))
    if runtime.get("status") != "pass":
        raise ValueError("current CLI runtime successor did not pass")
    projection = replay_v2_projection()
    crates = {}
    for name in CRATES:
        crate = IMPLEMENTATION / name
        run([str(TOOLCHAIN), "cargo", "fmt", "--check"], crate)
        run([str(TOOLCHAIN), "cargo", "check", "--all-targets"], crate)
        run([str(TOOLCHAIN), "env", "RUSTFLAGS=-Dwarnings", "cargo", "check", "--all-targets"], crate)
        for _ in range(2):
            run([str(TOOLCHAIN), "cargo", "test", "--all-targets"], crate)
        names = inventory(run([str(TOOLCHAIN), "cargo", "test", "--all-targets", "--", "--list"], crate), allow_empty=name == "command-boundary-runtime-v2")
        clippy = "SKIPPED_GENERATED_KERNEL" if name == "command-boundary-runtime-v2" else "PASS"
        if clippy == "PASS":
            run([str(TOOLCHAIN), "cargo", "clippy", "--all-targets", "--", "-D", "warnings"], crate)
        crates[name] = {**names, "fmt": "PASS", "check": "PASS", "strict_check": "PASS", "clippy": clippy}
    if current != hashes(manifest) or manifest != source_manifest() or historical != hashes(HISTORICAL):
        raise ValueError("Auth evidence inputs changed during verification")
    return {
        "schema_version": "auth-foundation.current-technical-evidence-successor/v2-candidate",
        "binding_id": "AUTH-CURRENT-TECHNICAL-EVIDENCE-002",
        "historical_snapshots": historical,
        "current_sources": current,
        "architecture": architecture,
        "verification": {"current_cli_replay": "PASS", "v2_clean_projection": projection, "crates": crates},
        "result": "local-current-technical-v2-candidate-pass",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Exact current local CLI, two clean v2 generations, Cargo, and source-wiring checks only. Owner acceptance of the pinned BusinessMeaning is separate; no FormalClaim admission, all-path no-call proof, TDE/F5/EVF satisfaction, deployment, production security, or runtime guarantee is established.",
    }


def verify(record: dict, expected: dict) -> None:
    if record != expected:
        raise ValueError("current v2 technical binding differs from verified inputs or results")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true", help="print candidate JSON; never write files")
    args = parser.parse_args()
    expected = expected_binding()
    if args.print_expected:
        print(json.dumps(expected, indent=2))
    else:
        verify(json.loads(BINDING.read_text()), expected)
        print(json.dumps({"status": "pass", "binding": str(BINDING.relative_to(AUTH_ROOT)), "authority_effect": "none"}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, KeyError, ValueError, RuntimeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2))
        raise SystemExit(1)
