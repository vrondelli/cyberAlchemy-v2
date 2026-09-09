#!/usr/bin/env python3
"""Run the protocol-local CAV2-D65 construction loop without external effects."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import secrets
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
V1 = HERE.parents[1]
REPO = next(parent for parent in HERE.parents if (parent / "cyberAlchemy-v2").is_dir())
RUNTIME = REPO / "cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime"
OUTPUT = HERE / "generated/stable-local-cycle.json"
POSTGRES_IMAGE = "docker.io/library/postgres:17-alpine@sha256:18cfe3ef5e6815560c98237d6216d1e5119702fb0f3894c8785dd58b8bbe5d73"
AGAVE_ROOT = Path("/home/vrondelli/.cache/cyberalchemy-v2/solana/v3.1.11/solana-release")
AGAVE_ARCHIVE = AGAVE_ROOT.parent / "solana-release-x86_64-unknown-linux-gnu.tar.bz2"
AGAVE_ARCHIVE_SHA256 = "5978d621fe2582fc2403fa13f3c06502020bcb42e806ddd4612150049d1a3fbb"
SBF_OUTPUT = Path("/tmp/ca2-kep-sbf/cyberalchemy_kep_solana_program.so")

ADMITTED_DOMAINSPEC_PARSER = {
    "commit": "7a704e97a93ecf89fd5aae31f79f89f1608e2725",
    "path": "projects/domainspec-v2/impl/cli/src/input/project-model.ts",
    "sha256": "2a4e5de81f3714649ed296446e9aad8d9fd73ebcc632f8d9f14105227a00ce34",
}

PINNED_PREDECESSORS = {
    "implementation/rust-binding/successors/002/generated/implementation-binding.json": "d2d7fdc314676f1795f682760fa8f05b58cd097436fee3afba844d557c9fb6b3",
    "decisions/rust-binding-acceptance-002.json": "56d3dbe773bee25ac59d245728c58db636090c8d3f68e779ae6f0ab27038207a",
    "formal-evidence/local-conformance/001/generated/conformance-assessment.json": "d0f71ea337216455262ab68d889c7b7c9997eb9127e802a1d51bd23f677c4dab",
    "decisions/local-conformance-assessment-acceptance-001.json": "8fe41ab442f047b6ad5207056a55eaf1b4f86b2aa55a8966256596134ac139a7",
    "implementation/rust-binding/successors/010/generated/implementation-binding.json": "48f19f79e19ec93ac8abe1547a75d22e672d0b0d181c6dc1a218d1780914413b",
    "decisions/rust-binding-acceptance-005.json": "d3b107d0bc2e9d154522ba1f0489faf3e35181466c609a674f15d15c88a87c52",
    "evidence/independent-review/008/review.json": "5944ae5391a413adcdf2d389f2a595e98ff816bd822a05aaff08a409e667a8f7",
    "evidence/relation-coverage/relation-evidence-matrix.json": "86326e0fb95140d0afb6de3a87333374c28b83e9260b55e7eb6a2823948bd19f",
    "formal-evidence/conformance-v2/generated/provider-receipt.json": "3c8553c4fe1694ca8e4021c2178e4628bfa0eeef3177b5ec0434c89e79933b38",
}

EXPECTED_IDENTITIES = {
    "system_ontology_candidate_set_digest": "0af0efd436cf447e01fc1082fed3794f9690a9e2bc4367679a9c9385961ba168",
    "accepted_binding_material_digest": "809075ec3d64e44bcf36cde22c80d22b822b322ecc22eb423db128671552ad0f",
    "bound_implementation_material_digest": "877caaa3865870a5310db88f5fe951b15b4e164e7185cb2d814459febdc22b3b",
    "accepted_assessment_material_digest": "e844154f1caae759a889f79f1e94447e86e9e47ac08f70142e1d92dc39ce6487",
}


class LoopBlock(RuntimeError):
    pass


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(value: object) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise LoopBlock(message)


def verify_predecessors() -> dict[str, str]:
    observed = {}
    for relative, expected in PINNED_PREDECESSORS.items():
        path = V1 / relative
        require(path.is_file(), f"selected predecessor missing: {relative}")
        digest = sha256(path.read_bytes())
        require(digest == expected, f"selected predecessor drift: {relative}")
        observed[relative] = digest

    system_decision = json.loads((V1 / "decisions/system-ontology-admission-001.json").read_text())
    binding_decision = json.loads((V1 / "decisions/rust-binding-acceptance-002.json").read_text())
    assessment_decision = json.loads((V1 / "decisions/local-conformance-assessment-acceptance-001.json").read_text())
    require(
        system_decision["admission"]["admitted_candidate_set_digest"]
        == EXPECTED_IDENTITIES["system_ontology_candidate_set_digest"],
        "admitted system ontology identity drift",
    )
    require(
        binding_decision["acceptance"]["accepted_binding_material_digest"]
        == EXPECTED_IDENTITIES["accepted_binding_material_digest"],
        "accepted Rust binding identity drift",
    )
    require(
        binding_decision["acceptance"]["bound_implementation_material_digest"]
        == EXPECTED_IDENTITIES["bound_implementation_material_digest"],
        "accepted bound implementation identity drift",
    )
    require(
        assessment_decision["acceptance"]["accepted_assessment_material_digest"]
        == EXPECTED_IDENTITIES["accepted_assessment_material_digest"],
        "accepted assessment identity drift",
    )
    return observed


def run(
    command: list[str],
    *,
    cwd: Path = REPO,
    env: dict[str, str] | None = None,
    output_replacements: dict[str, str] | None = None,
    fail_on_nonzero: bool = True,
) -> dict[str, object]:
    process = subprocess.run(
        command,
        cwd=cwd,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    output = process.stdout
    if process.returncode and fail_on_nonzero:
        sys.stdout.write(output)
        raise LoopBlock(f"command failed ({process.returncode}): {' '.join(command)}")
    normalized_output = output
    for observed, replacement in (output_replacements or {}).items():
        normalized_output = normalized_output.replace(observed, replacement)
    print(f"{'PASS' if process.returncode == 0 else 'DIAGNOSTIC_FAIL'} {' '.join(command)}")
    return {
        "command": command,
        "exit_code": process.returncode,
        "result": "pass" if process.returncode == 0 else "diagnostic-fail",
        "output_sha256": sha256(normalized_output.encode()),
    }


def admitted_domainspec_checks(environment: dict[str, str]) -> list[dict[str, object]]:
    """Reproduce the exact parser bytes bound by the admitted DomainSpec source."""
    parser_ref = f"{ADMITTED_DOMAINSPEC_PARSER['commit']}:{ADMITTED_DOMAINSPEC_PARSER['path']}"
    historical = subprocess.run(
        ["git", "show", parser_ref],
        cwd=REPO,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    require(historical.returncode == 0, f"cannot resolve admitted DomainSpec parser: {parser_ref}")
    require(
        sha256(historical.stdout) == ADMITTED_DOMAINSPEC_PARSER["sha256"],
        "reproduced admitted DomainSpec parser digest drift",
    )

    with tempfile.TemporaryDirectory(prefix="ca2-kep-admitted-domainspec-") as temp_name:
        temp_root = Path(temp_name)
        isolated_v1 = temp_root / V1.relative_to(REPO)
        shutil.copytree(
            V1,
            isolated_v1,
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc"),
        )
        sources = json.loads((V1 / "ontology/sources.json").read_text(encoding="utf-8"))["sources"]
        for source in sources:
            if source.get("location") != "working-tree":
                continue
            relative = Path(source["path"])
            source_path = REPO / relative
            target_path = temp_root / relative
            require(source_path.is_file(), f"selected DomainSpec dependency missing: {relative}")
            if not target_path.exists():
                target_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, target_path)
        (temp_root / ".git").symlink_to(REPO / ".git", target_is_directory=True)
        parser_path = temp_root / ADMITTED_DOMAINSPEC_PARSER["path"]
        parser_path.parent.mkdir(parents=True, exist_ok=True)
        parser_path.write_bytes(historical.stdout)
        replacement = {str(temp_root): "<isolated-admitted-domainspec-root>"}

        checks = []
        for relative_command in (
            ["python3", "domainspec/author.py", "--check"],
            ["python3", "domainspec/validate.py", "--skip-native"],
        ):
            executable = [relative_command[0], str(isolated_v1 / relative_command[1]), *relative_command[2:]]
            receipt = run(
                executable,
                cwd=temp_root,
                env=environment,
                output_replacements=replacement,
            )
            receipt["command"] = relative_command
            receipt["toolchain_binding"] = ADMITTED_DOMAINSPEC_PARSER
            receipt["execution_mode"] = "isolated-exact-admitted-parser"
            checks.append(receipt)
        return checks


def runtime_material() -> tuple[str, list[dict[str, str]]]:
    paths = [RUNTIME / "Cargo.toml", RUNTIME / "Cargo.lock"]
    for relative in ("src", "tests", "adapters", "solana-program", "trial-cli"):
        root = RUNTIME / relative
        paths.extend(
            path
            for path in root.rglob("*")
            if path.is_file()
            and "target" not in path.parts
            and (path.suffix == ".rs" or path.name == "Cargo.toml")
        )
    records = []
    digest = hashlib.sha256()
    for path in sorted(set(paths)):
        relative = path.relative_to(RUNTIME).as_posix()
        raw = path.read_bytes()
        file_digest = sha256(raw)
        records.append({"path": relative, "sha256": file_digest})
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(raw)
        digest.update(b"\0")
    return digest.hexdigest(), records


def secret_surface_scan() -> dict[str, object]:
    forbidden = (
        b"ontology knowledge fixture",
        b"ontology knowledge is never public state",
        b"BEGIN PRIVATE KEY",
        b"CA2_DEVNET_AUTHORIZATION_DIGEST=",
        b"KEP_POSTGRES_TEST_URL=",
    )
    selected = [
        V1 / "formal-evidence/conformance-v2/generated",
        V1 / "evidence/relation-coverage/relation-evidence-matrix.json",
        V1 / "domainspec/generated/system-ontology.json",
    ]
    scanned = 0
    for target in selected:
        paths = sorted(target.rglob("*")) if target.is_dir() else [target]
        for path in paths:
            if not path.is_file():
                continue
            raw = path.read_bytes()
            scanned += 1
            for marker in forbidden:
                require(marker not in raw, f"secret/plaintext canary reached evidence surface: {path}")
    return {"result": "PASS_BOUNDED", "files_scanned": scanned}


def postgres_test(environment: dict[str, str]) -> dict[str, object]:
    password = secrets.token_urlsafe(32)
    name = f"ca2-kep-d65-{secrets.token_hex(6)}"
    container_id = ""
    try:
        result = subprocess.run(
            [
                "docker", "run", "--detach", "--rm", "--pull=never", "--name", name,
                "--env", f"POSTGRES_PASSWORD={password}", "--publish", "127.0.0.1::5432", POSTGRES_IMAGE,
            ],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        require(result.returncode == 0, f"cannot start pinned disposable PostgreSQL: {result.stdout.strip()}")
        container_id = result.stdout.strip()
        port_result = subprocess.run(
            ["docker", "port", container_id, "5432/tcp"], text=True, capture_output=True, check=False
        )
        require(port_result.returncode == 0, "cannot resolve disposable PostgreSQL port")
        port = port_result.stdout.strip().rsplit(":", 1)[-1]
        ready = False
        for _ in range(40):
            probe = subprocess.run(
                ["docker", "exec", container_id, "pg_isready", "-U", "postgres"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
            if probe.returncode == 0:
                ready = True
                break
            time.sleep(0.25)
        require(ready, "disposable PostgreSQL did not become ready")
        test_env = dict(environment)
        test_env["KEP_POSTGRES_TEST_URL"] = f"postgres://postgres:{password}@127.0.0.1:{port}/postgres"
        receipt = run(
            ["cargo", "test", "-p", "cyberalchemy-kep-adapters", "--test", "postgres_conformance", "--locked", "--", "--ignored"],
            cwd=RUNTIME,
            env=test_env,
        )
        receipt["provider_identity"] = POSTGRES_IMAGE
        return receipt
    finally:
        if container_id:
            subprocess.run(
                ["docker", "stop", container_id],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )


def sbf_test(environment: dict[str, str]) -> dict[str, object]:
    require(AGAVE_ARCHIVE.is_file(), "pinned Agave archive is missing")
    require(
        sha256(AGAVE_ARCHIVE.read_bytes()) == AGAVE_ARCHIVE_SHA256,
        "pinned Agave archive drift",
    )
    build_env = dict(environment)
    build_env["PATH"] = f"{AGAVE_ROOT / 'bin'}:{build_env['PATH']}"
    build_env["CARGO_TARGET_DIR"] = "/tmp/ca2-kep-sbf-target"
    Path("/tmp/ca2-kep-sbf").mkdir(parents=True, exist_ok=True)
    build = run(
        [
            "cargo-build-sbf",
            "--manifest-path",
            str(RUNTIME / "solana-program/Cargo.toml"),
            "--sbf-out-dir",
            str(SBF_OUTPUT.parent),
        ],
        env=build_env,
    )
    require(SBF_OUTPUT.is_file(), "cargo-build-sbf did not produce the exact program")
    raw = SBF_OUTPUT.read_bytes()
    test_env = dict(environment)
    test_env["BPF_OUT_DIR"] = str(SBF_OUTPUT.parent)
    load = run(
        [
            "cargo",
            "test",
            "-p",
            "cyberalchemy-kep-solana-program",
            "--test",
            "sbf_program_test",
            "--locked",
            "--",
            "--ignored",
        ],
        cwd=RUNTIME,
        env=test_env,
    )
    absolute_minimum_submissions = (len(raw) + 1_231) // 1_232
    exact_deployment_submission_bound = (len(raw) + 767) // 768 + 2
    return {
        "build": build,
        "load_test": load,
        "agave_version": "3.1.11",
        "agave_archive_sha256": AGAVE_ARCHIVE_SHA256,
        "sbf_sha256": sha256(raw),
        "sbf_size_bytes": len(raw),
        "absolute_minimum_deployment_submissions": absolute_minimum_submissions,
        "exact_fixed_chunk_deployment_submission_bound": exact_deployment_submission_bound,
        "original_total_submission_cap": 24,
        "original_total_submission_cap_state": (
            "BLOCK" if absolute_minimum_submissions > 24 else "within-absolute-lower-bound"
        ),
        "candidate_split_budget": {
            "protocol_signed_submissions": 24,
            "deployment_signed_submissions": 192,
            "deployment_max_sign_attempts": 1,
            "state": (
                "fits-local-bound-pending-owner-authorization"
                if exact_deployment_submission_bound <= 192
                else "BLOCK"
            ),
        },
    }


def cycle(with_postgres: bool) -> dict[str, object]:
    predecessors = verify_predecessors()
    environment = dict(os.environ)
    environment["PATH"] = f"/home/vrondelli/.cargo/bin:{environment.get('PATH', '')}"
    environment["CARGO_TARGET_DIR"] = "/tmp/ca2-kep-d65-target"
    commands = [
        ["python3", str(V1 / "ontology/validate.py")],
        ["python3", str(V1 / "formal-evidence/conformance-v2/validate.py")],
        ["python3", str(V1 / "formal-evidence/conformance-v2/author.py"), "--check"],
    ]
    receipts = [run(commands[0], env=environment)]
    receipts.extend(admitted_domainspec_checks(environment))
    current_lint = run(
        [
            "toolchains/node-typescript/bin/node-env",
            "run",
            "--project",
            "projects/domainspec-v2/impl",
            "--",
            "pnpm",
            "exec",
            "tsx",
            "cli/src/cli/main.ts",
            "lint",
            "/workspace/" + (V1 / "domainspec").relative_to(REPO).as_posix(),
        ],
        env=environment,
        fail_on_nonzero=False,
    )
    current_parser = REPO / ADMITTED_DOMAINSPEC_PARSER["path"]
    current_lint["evidence_role"] = "diagnostic-current-parser-compatibility-only"
    current_lint["current_parser_sha256"] = sha256(current_parser.read_bytes())
    current_lint["admission_effect"] = "none"
    receipts.append(current_lint)
    receipts.extend(run(command, env=environment) for command in commands[1:])
    receipts.extend(
        [
            run(["cargo", "fmt", "--all", "--check"], cwd=RUNTIME, env=environment),
            run(["cargo", "test", "--workspace", "--locked"], cwd=RUNTIME, env=environment),
            run(
                ["cargo", "clippy", "--workspace", "--all-targets", "--locked", "--", "-D", "warnings"],
                cwd=RUNTIME,
                env=environment,
            ),
        ]
    )
    if with_postgres:
        receipts.append(postgres_test(environment))
    sbf = sbf_test(environment)
    material_digest, material_files = runtime_material()
    return {
        "result": "PASS_BOUNDED",
        "selected_predecessors": predecessors,
        "commands": receipts,
        "secret_surface_scan": secret_surface_scan(),
        "sbf": sbf,
        "runtime_material_digest": material_digest,
        "runtime_material_file_count": len(material_files),
        "runtime_material": material_files,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeat", type=int, default=1)
    parser.add_argument("--without-postgres", action="store_true")
    parser.add_argument("--materialize", action="store_true")
    args = parser.parse_args()
    try:
        require(args.repeat > 0, "repeat must be positive")
        cycles = [cycle(not args.without_postgres) for _ in range(args.repeat)]
        require(
            len({item["runtime_material_digest"] for item in cycles}) == 1,
            "runtime material changed between validation cycles",
        )
        document = {
            "schema_version": "cav2-kep-d65-local-cycle/v1-candidate",
            "cycle_id": "CA2-KEP-SOL2-D65-LOCAL-STABLE-001",
            "result": "PASS_BOUNDED",
            "deterministic_cycle_count": len(cycles),
            "cycles": cycles,
            "devnet_state": "not_evaluable-not-authorized",
            "authority_effect": "none",
            "claim_ceiling": "Exact local bounded construction evidence only; no binding acceptance, Devnet effect, independent-review result, or aggregate conformance.",
        }
        if args.materialize:
            OUTPUT.parent.mkdir(parents=True, exist_ok=True)
            OUTPUT.write_bytes(canonical(document))
            print(f"materialized {OUTPUT}")
        print(json.dumps({
            "result": document["result"],
            "cycles": len(cycles),
            "runtime_material_digest": cycles[0]["runtime_material_digest"],
            "runtime_material_files": cycles[0]["runtime_material_file_count"],
            "materialized": args.materialize,
        }, indent=2))
        return 0
    except (LoopBlock, OSError, KeyError, json.JSONDecodeError) as exc:
        print(json.dumps({"result": "BLOCK", "error": str(exc), "authority_effect": "none"}, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
