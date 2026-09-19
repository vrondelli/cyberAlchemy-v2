#!/usr/bin/env python3
"""Collect current local evidence and propose exact successor inputs, without approval."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile


HERE = Path(__file__).resolve().parent
REPOSITORY = HERE.parents[4]
AUTH = REPOSITORY / "projects/auth-foundation"
IMPL = AUTH / "implementation"
CLI = HERE / "compiler-snapshot"
CRATES = (
    "standard-runtime", "command-boundary-runtime", "trusted-input-runtime",
    "runtime-adapter", "sqlite-provider", "trusted-boundary",
    "trusted-input-provider", "authorization-service", "authorization-api",
)
FORMAL = AUTH / "formalization/cases/AF-EXACT-SESSION-ROLE-PERMISSION-001/ExactSessionRolePermission.v2.lean"


def canonical(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


def file_ref(path: Path) -> dict:
    data = path.read_bytes()
    return {"path": str(path.relative_to(REPOSITORY)), "sha256": sha256(data), "bytes": len(data)}


def inputs() -> dict:
    freezer = module("api_freezer", IMPL / "authorization-api/scripts/freeze_candidate.py")
    paths = set(freezer.selected_files())
    paths.update(path for path in (CLI / "src").rglob("*") if path.is_file())
    paths.update(path for path in (CLI / "lean").rglob("*") if path.is_file())
    paths.update((CLI / name) for name in ("package.json", "package-lock.json", "lean-toolchain", "PROVENANCE.json"))
    paths.update({FORMAL, Path(__file__).resolve(), HERE / "README.md"})
    paths.update(HERE.glob("*.py"))
    for pattern in ("*.lean", "*.rs", "*.lock"):
        paths.update(HERE.glob(pattern))
    paths.update(path for path in (HERE / "graph-certificate").rglob("*") if path.is_file())
    paths.update(path for path in (HERE / "graph-scaffolds").rglob("*") if path.is_file())
    paths.update(HERE / name for name in (
        "FORMAL-CLAIM-LEAN-BINDING.json", "FORMAL-CORRESPONDENCE-BINDING.json",
        "PRESERVATION-BINDING.json", "LEAN-ENVIRONMENT.json", "RUST-CORRESPONDENCE.json"))
    paths.add(HERE / "IMPLEMENTATION-MAP.json")
    derivation_root = HERE.parent / "evf-production-v2/auth-evf-01"
    paths.update(derivation_root / name for name in (
        "AUTH-EVF-DERIVATION-CONTRACT.v1-candidate.json",
        "AUTH-EVF-OBLIGATION-DENOMINATOR.v1-candidate.json",
        "ontology/nodes/business.json", "ontology/nodes/system.json", "ontology/scripts/validate.py"))
    paths.add(FORMAL.parent / "FORMAL-CLAIM.v5-lean-candidate.json")
    paths.add(REPOSITORY / "projects/domainspec-v2/formalization/profiles/formal-language-profiles.json")
    tools = []
    for name in ("python3", "node", "cargo", "rustc", "rustfmt", "cargo-clippy", "lean", "cc", "ar"):
        executable = shutil.which(name)
        if executable:
            path = Path(executable).resolve()
            tools.append({"name": name, "path": str(path), "sha256": sha256(path.read_bytes())})
        else:
            tools.append({"name": name, "state": "missing"})
    payload = {
        "schema_version": "auth-completion-input-candidate/v1",
        "status": "proposed-successor-inputs",
        "subject": "Auth Service and socket-free Authorization API",
        "files": [file_ref(path) for path in sorted(paths)],
        "host_tool_entrypoints": tools,
        "input_selection": "owner-directed-current-prototype; not human product approval",
        "authority_effect": "none",
        "claim_ceiling": "Exact proposed local inputs, not the complete F0 freeze or product approval. Host entrypoint hashes do not close transitive toolchain identity.",
    }
    return {**payload, "input_digest": sha256(canonical(payload))}


def command(argv: list[str], cwd: Path, environment: dict, log_root: Path) -> dict:
    try:
        result = subprocess.run(argv, cwd=cwd, env=environment, text=True,
                                capture_output=True, timeout=600, check=False)
        output = result.stdout + "\n" + result.stderr
        status = "pass" if result.returncode == 0 else "fail"
        code = result.returncode
    except (OSError, subprocess.TimeoutExpired) as error:
        output, status, code = str(error), "not_evaluable", None
    data = output.encode()
    digest = sha256(data)
    (log_root / f"{digest}.log").write_bytes(data)
    counts = re.findall(r"test result: ok\. (\d+) passed; (\d+) failed; (\d+) ignored", output)
    return {
        "argv": argv, "working_directory": str(cwd.relative_to(REPOSITORY)) if cwd.is_relative_to(REPOSITORY) else f"isolated-copy/{cwd.name}",
        "status": status, "exit_code": code, "log_sha256": digest,
        "passed_tests": sum(int(row[0]) for row in counts),
        "ignored_tests": sum(int(row[2]) for row in counts),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="save proposed inputs, raw logs, and current local report")
    args = parser.parse_args()
    before = inputs()
    validator = module("api_validator", IMPL / "authorization-api/scripts/validate.py")
    validator.CLI = CLI / "src/cli/main.ts"
    validator.TSX_LOADER = CLI / "node_modules/tsx/dist/loader.mjs"
    with tempfile.TemporaryDirectory(prefix="auth-completion-") as directory:
        scratch = Path(directory)
        logs = scratch / "logs"
        logs.mkdir()
        env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1", "RUSTFLAGS": "-Dwarnings"}
        env.setdefault("CARGO_TARGET_DIR", str(scratch / "cargo-target"))
        checks = []
        checks.append({"id": "compiled-graph-replay", **command(
            [sys.executable, "-B", str(HERE / "graph_replay.py")], REPOSITORY, env, logs)})
        checks.append({"id": "implementation-map-current", **command(
            [sys.executable, "-B", str(HERE / "bind_implementation.py"), "--verify"], REPOSITORY, env, logs)})
        try:
            replay = validator.replay_domainspec(scratch)
            checks.append({"id": "generated-replay", "status": "pass", "runtimes": replay})
        except (OSError, RuntimeError, ValueError) as error:
            checks.append({"id": "generated-replay", "status": "not_evaluable", "detail": str(error)})
        for crate in CRATES:
            root = IMPL / crate
            if crate in CRATES[:3]:
                # Generated crates have no local workspace boundary. Test exact
                # copies outside the unrelated umbrella workspace, without
                # modifying the generated manifests to change their ownership.
                root = scratch / crate
                shutil.copytree(IMPL / crate, root, ignore=shutil.ignore_patterns("target", "__pycache__"))
                checks.append({"id": f"{crate}/isolated-lock", **command(
                    ["cargo", "generate-lockfile", "--offline"], root, env, logs)})
            for label, argv in (
                ("format", ["cargo", "fmt", "--check"]),
                ("check", ["cargo", "check", "--locked", "--offline", "--all-targets"]),
                ("clippy", ["cargo", "clippy", "--locked", "--offline", "--all-targets", "--", "-D", "warnings"]),
                ("tests", ["cargo", "test", "--locked", "--offline", "--all-targets"]),
            ):
                if crate in CRATES[:3] and label in {"format", "clippy"}:
                    # Generated-source style belongs to the DomainSpec compiler.
                    # Auth checks exact replay and strict rustc compilation;
                    # fmt/clippy apply to the six authored runtime crates.
                    continue
                checks.append({"id": f"{crate}/{label}", **command(argv, root, env, logs)})
        checks.append({"id": "historical-policy-lean-regression", **command(["lean", str(FORMAL)], REPOSITORY, env, logs)})
        checks.append({"id": "auth-rust-structural-correspondence", **command(
            [sys.executable, "-B", str(HERE / "formal_correspondence.py")], REPOSITORY, env, logs)})
        checks.append({"id": "exact-permission-policy-lemmas", **command(
            ["lean", str(HERE / "ExactPermissionPolicy.lean")], REPOSITORY, env, logs)})
        checks.append({"id": "formal-binding-current", **command(
            [sys.executable, "-B", str(HERE / "bind_formal.py"), "--verify"], REPOSITORY, env, logs)})
        checks.append({"id": "evidence-provider-contract-tests", **command(
            [sys.executable, "-B", "-m", "unittest", "discover", "-s", str(HERE), "-p", "test_*.py"], REPOSITORY, env, logs)})
        after = inputs()
        checks.append({"id": "inputs-unchanged-during-validation", "status": "pass" if before == after else "fail"})
        report = {
            "schema_version": "auth-completion-local-report/v1",
            "input_digest": before["input_digest"],
            "local_validation": "pass" if all(c["status"] == "pass" for c in checks) else "non-pass",
            "checks": checks,
            "rust_test_count": sum(c.get("passed_tests", 0) for c in checks if c["id"].endswith("/tests")),
            "full_product_completion": "not-evaluated-by-this-local-validator",
            "remaining_required_work": [
                "complete.py owns the current F0/PT0 freeze, EVF runs, hostile controls, complete evidence join, and product-review eligibility.",
                "The product owner owns any later digest-bound approval; this local validator cannot supply it.",
            ],
            "authority_effect": "none",
            "claim_ceiling": "Local checks only. No historical receipt is refreshed or treated as current; no product approval or operational authority is granted.",
        }
        if args.write:
            target = HERE / "evidence" / before["input_digest"]
            target.mkdir(parents=True, exist_ok=True)
            for path in logs.iterdir():
                destination = target / path.name
                if destination.exists() and destination.read_bytes() != path.read_bytes():
                    raise RuntimeError("content-addressed log collision")
                shutil.copyfile(path, destination)
            for name, value in (("INPUT-CANDIDATE.json", before), ("LOCAL-VALIDATION.json", report)):
                encoded = json.dumps(value, sort_keys=True, indent=2) + "\n"
                (HERE / name).write_text(encoded)
        print(json.dumps(report, sort_keys=True, indent=2))
        return 0 if report["local_validation"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
