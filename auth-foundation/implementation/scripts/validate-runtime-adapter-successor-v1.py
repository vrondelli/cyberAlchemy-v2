#!/usr/bin/env python3
"""Verify the current default-off legacy Auth adapter without reissuing v1 evidence."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import tomllib
from pathlib import Path


AUTH = Path(__file__).resolve().parents[2]
REPO = AUTH.parent
IMPL = AUTH / "implementation"
ADAPTER = IMPL / "runtime-adapter"
TOOLCHAIN = REPO / "tools/toolchain/run"
BINDING = IMPL / "runtime-adapter-successor-v1/binding.json"
HISTORICAL = IMPL / "standard-conformance/runtime-evidence.json"
ARCHIVED_RECEIPT_SHA256 = "0691d75d3433769007c69b43bbc35d3891560ff3d3657eae282a9ade50703a54"
HISTORICAL_BINDING = IMPL / "standard-conformance/runtime-adapter-binding.json"
EXPECTED_TESTS = (
    "every_trusted_port_failure_denies",
    "exact_permission_mismatch_denies_without_exposing_reason",
    "exact_trusted_evidence_allows",
    "expiry_and_stale_revision_deny",
    "inactive_or_revoked_session_denies",
    "incomplete_duplicate_or_mismatched_roles_deny",
    "missing_or_ambiguous_session_denies",
    "untrusted_or_empty_scope_evidence_denies",
)
SOURCE_PATHS = (
    "implementation/runtime-adapter/Cargo.toml",
    "implementation/runtime-adapter/Cargo.lock",
    "implementation/runtime-adapter/src/lib.rs",
    "implementation/runtime-adapter/tests/adapter.rs",
    "implementation/runtime-adapter/tests/legacy-capability.test.mjs",
    "implementation/scripts/validate-runtime-adapter-successor-v1.py",
    "implementation/scripts/test-runtime-adapter-successor-v1.py",
    "implementation/runtime-adapter-successor-v1/README.md",
)


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def sha(path: Path) -> str:
    require(path.is_file() and not path.is_symlink(), f"missing or symlinked input: {path}")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str], *, cwd: Path = REPO, timeout: int = 600,
        strict: bool = False) -> str:
    env = dict(os.environ)
    env["TMPDIR"] = "/dev/shm" if Path("/dev/shm").is_dir() else env.get("TMPDIR", "/tmp")
    if strict:
        env["RUSTFLAGS"] = "-Dwarnings"
    result = subprocess.run(command, cwd=cwd, env=env, text=True, capture_output=True,
                            timeout=timeout, check=False)
    require(result.returncode == 0,
            f"{' '.join(command)}: {(result.stderr or result.stdout)[-2400:]}")
    return result.stdout


def historical_preimages() -> dict[str, str]:
    script = IMPL / "scripts/validate-current-evidence-successor-v4.py"
    spec = importlib.util.spec_from_file_location("auth_historical_archive", script)
    require(spec is not None and spec.loader is not None, "historical archive verifier unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    archive = module.archive_preimages()
    require(archive["implementation/standard-conformance/runtime-evidence.json"] == ARCHIVED_RECEIPT_SHA256,
            "historical archive runtime receipt changed")
    return archive


def legacy_predecessor() -> dict:
    receipt = json.loads(HISTORICAL.read_text())
    binding = json.loads(HISTORICAL_BINDING.read_text())
    require(receipt.get("schema_version") == "auth-foundation.binary-runtime-evidence/v1-candidate"
            and binding.get("schema_version") == "auth-foundation.binary-runtime-implementation-binding/v1-candidate",
            "legacy predecessor identity changed")
    recorded = receipt.get("adapter", {}).get("source_sha256")
    require(recorded != sha(ADAPTER / "src/lib.rs"),
            "legacy receipt is no longer source-stale; assess a new successor")
    require(receipt.get("runtime_implementation_binding", {}).get("sha256") == sha(HISTORICAL_BINDING),
            "legacy receipt/binding link changed")
    return {"working_legacy_receipt_sha256": sha(HISTORICAL),
            "working_legacy_binding_sha256": sha(HISTORICAL_BINDING),
            "archived_v3_receipt_sha256": ARCHIVED_RECEIPT_SHA256,
            "working_legacy_source_status": "stale"}


def feature_boundary() -> dict:
    manifest = tomllib.loads((ADAPTER / "Cargo.toml").read_text())
    features = manifest.get("features", {})
    kernel = manifest.get("dependencies", {}).get("auth-kernel", {})
    require(features.get("default") == []
            and features.get("legacy-raw-decision") == ["dep:auth-kernel"]
            and kernel.get("optional") is True,
            "legacy raw feature or optional policy dependency changed")
    source = (ADAPTER / "src/lib.rs").read_text()
    require(source.count('#[cfg(feature = "legacy-raw-decision")]') == 2
            and "mod legacy {" in source
            and "pub use legacy::*;" in source,
            "raw export gating changed")
    require("pub use auth_foundation_authorization_state_model::{" in source,
            "default type-only facade changed")
    require((ADAPTER / "tests/adapter.rs").read_text().startswith(
        '#![cfg(feature = "legacy-raw-decision")]'),
        "legacy adapter test gating changed")
    return {"default_raw_decision_exports": "absent", "explicit_opt_in_feature": "legacy-raw-decision",
            "policy_dependency": "optional", "selected_public_auth_path": "excluded"}


def test_inventory(feature: bool) -> list[str]:
    args = [str(TOOLCHAIN), "cargo", "test", "--locked", "--offline", "--all-targets"]
    if feature:
        args.extend(["--features", "legacy-raw-decision"])
    names = sorted(line.rsplit(": test", 1)[0] for line in run(args + ["--", "--list"], cwd=ADAPTER).splitlines()
                   if line.endswith(": test"))
    require(names == (list(EXPECTED_TESTS) if feature else []),
            f"unexpected {'opt-in' if feature else 'default'} adapter test inventory: {names}")
    return names


def verification() -> dict:
    run([str(TOOLCHAIN), "cargo", "fmt", "--check"], cwd=ADAPTER)
    result = {}
    for feature, name in ((False, "default"), (True, "legacy-raw-decision")):
        args = ["--locked", "--offline", "--all-targets"]
        if feature:
            args.extend(["--features", "legacy-raw-decision"])
        run([str(TOOLCHAIN), "cargo", "check", *args], cwd=ADAPTER)
        run([str(TOOLCHAIN), "cargo", "check", *args], cwd=ADAPTER, strict=True)
        run([str(TOOLCHAIN), "cargo", "clippy", *args, "--", "-D", "warnings"], cwd=ADAPTER)
        for _ in range(2):
            run([str(TOOLCHAIN), "cargo", "test", *args], cwd=ADAPTER)
        names = test_inventory(feature)
        result[name] = {"fmt": "PASS", "check": "PASS", "strict_check": "PASS",
                        "clippy": "PASS", "test_runs": 2, "test_names": names}
    raw = run(["node", "--test", "--test-reporter=tap",
               str(ADAPTER / "tests/legacy-capability.test.mjs")])
    require("# pass 2" in raw and "# fail 0" in raw,
            "compiler-backed raw export and selected closure controls incomplete")
    return {"cargo": result, "compiler_capability_controls": "pass-2"}


def expected_binding() -> dict:
    archive = historical_preimages()
    predecessor = legacy_predecessor()
    boundary = feature_boundary()
    sources = {relative: sha(AUTH / relative) for relative in SOURCE_PATHS}
    results = verification()
    require(archive == historical_preimages(), "historical archive changed during verification")
    require(predecessor == legacy_predecessor(), "legacy predecessor changed during verification")
    require(boundary == feature_boundary(), "feature boundary changed during verification")
    require(sources == {relative: sha(AUTH / relative) for relative in SOURCE_PATHS},
            "current adapter inputs changed during verification")
    return {
        "schema_version": "auth-foundation.current-runtime-adapter-successor/v1-candidate",
        "binding_id": "AUTH-CURRENT-COMPATIBILITY-ADAPTER-001",
        "legacy_predecessor": predecessor,
        "historical_preimages": archive,
        "current_sources": sources,
        "feature_boundary": boundary,
        "verification": results,
        "result": "local-current-compatibility-adapter-candidate-pass",
        "authority_effect": "none",
        "runtime_guarantees_observed": False,
        "claim_limit": "Current default-off/explicit-opt-in compatibility adapter source, compile, tests, and selected-root exclusion only. Historical runtime evidence remains stale relative to the adapter source and is not reissued. Opt-in raw calls remain possible outside selected roots; no all-path or observed-runtime guarantee, semantic admission, deployment, or publication.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-expected", action="store_true", help="print candidate JSON; never write")
    args = parser.parse_args()
    expected = expected_binding()
    if args.print_expected:
        print(json.dumps(expected, indent=2))
    else:
        require(json.loads(BINDING.read_text()) == expected,
                "current compatibility adapter binding differs from verified inputs")
        print(json.dumps({"status": "pass", "binding": str(BINDING.relative_to(AUTH)),
                          "runtime_guarantees_observed": False}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
