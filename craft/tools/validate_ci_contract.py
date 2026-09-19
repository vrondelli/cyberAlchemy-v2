#!/usr/bin/env python3
"""Fail closed on CI setup assumptions that prevent repository validation."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path


SCHEMA_VERSION = "domainspec.ci-contract-validation/v2"
ELAN_VERSION = "v4.2.4"
ELAN_ARCHIVE_SHA256 = "42b94d4244e8353142c456ec0e4ca6528fd898a6c604d4059f494e706e431f63"
DOMAINSPEC_WORKFLOW = ".github/workflows/domainspec-v2-product.yml"
DRIFT_WORKFLOW = ".github/workflows/drift-check.yml"
DRIFT_SCRIPT = "tools/check_github_drift.sh"
REQUIRED_DRIFT_SUBMODULES = ("implementation/domainspec", "validation/poker-team")
CI_REQUIREMENTS = "projects/domainspec-v2/impl/cli/requirements-ci.txt"
CI_REQUIREMENTS_SHA256 = "22dace3169d2eb64cbefd7cc52a0711742087c60563238715b717de0b133b9a6"
CLI_PACKAGE = "projects/domainspec-v2/impl/cli/package.json"
CLI_PACKAGE_LOCK = "projects/domainspec-v2/impl/cli/package-lock.json"
CLI_PACKAGE_LOCK_SHA256 = "4405de4acb45bdb5440d098850bc21be73450e384fef0e223d1cee58ca06be4b"
POSTGRES_TEST = "projects/domainspec-v2/impl/cli/test/runtime-l3-postgres.test.ts"
POSTGRES_IMAGE = "postgres:16@sha256:71e27bf60b70bded003791b5573f8b808365613f341df20ffcf0c1ed7bc13ddf"
QUALIFICATION_DOCKER_ADAPTER = "projects/domainspec-v2/impl/cli/tools/recipe-qualification/docker"
NODE_VERSION = "26.8.1"
PYTHON_VERSION = "3.12.14"
PNPM_VERSION = "10.34.5"
PNPM_SHA256 = "69a535476f407fb0f64427913c2b592ca2ed6bf93f92e2cb82a32349e31f36eb"
PINNED_ACTIONS = {
    "actions/checkout": "11d5960a326750d5838078e36cf38b85af677262",
    "actions/setup-node": "49933ea5288caeca8642d1e84afbd3f7d6820020",
    "actions/setup-python": "ece7cb06caefa5fff74198d8649806c4678c61a1",
    "actions/upload-artifact": "ea165f8d65b6e75b540449e92b4886f43607fa02",
    "dtolnay/rust-toolchain": "6bed0761d98439e5a578e2877258200ad565ba87",
}
DOMAINSPEC_TRIGGER_PATHS = (
    "projects/domainspec-v2/impl/cli/**",
    "projects/domainspec-v2/impl/system-integration/**",
    "projects/domainspec-v2/impl/architecture-conformance/**",
    "projects/domainspec-v2/impl/package.json",
    "projects/domainspec-v2/development/first-production-release/decisions/**",
    "projects/domainspec-v2/development/meta-type-instantiation-cli/**",
    "projects/domainspec-v2/README.md",
    "projects/domainspec-v2/ARCHITECTURE.md",
    "projects/domainspec-v2/formalization/README.md",
    "projects/auth-foundation/implementation/operation-source/**",
    "projects/auth-foundation/implementation/trusted-input-source/**",
    "cyberAlchemy-v2/development/examples/smallest-governance-program/domainspec/**",
    "cyberAlchemy-v2/language/realization-bindings.json",
    "cyberAlchemy-v2/ontology/governance/product/nodes.json",
    "toolchains/node-typescript/**",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    DOMAINSPEC_WORKFLOW,
    "tools/validate_ci_contract.py",
)


def scalar(value: str) -> str:
    candidate = value.split("#", 1)[0].strip()
    if len(candidate) >= 2 and candidate[0] == candidate[-1] and candidate[0] in {"'", '"'}:
        return candidate[1:-1]
    return candidate


def action_step(lines: list[str], index: int, indent: int) -> list[str]:
    end = index + 1
    while end < len(lines):
        line = lines[end]
        stripped = line.lstrip()
        current_indent = len(line) - len(stripped)
        if stripped.startswith("- ") and current_indent <= indent:
            break
        end += 1
    return lines[index:end]


def folded_command(text: str, needle: str) -> str | None:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if needle not in line:
            continue
        indent = len(line) - len(line.lstrip())
        command_lines = [line.strip()]
        for continuation in lines[index + 1 :]:
            stripped = continuation.strip()
            if not stripped:
                continue
            continuation_indent = len(continuation) - len(continuation.lstrip())
            if continuation_indent < indent:
                break
            command_lines.append(stripped)
        return " ".join(command_lines)
    return None


def validate_lean_actions(root: Path, workflow: Path, text: str, violations: list[str]) -> None:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        match = re.match(r"^(\s*)-\s+uses:\s*leanprover/lean-action@", line)
        if match is None:
            continue
        step = action_step(lines, index, len(match.group(1)))
        package_directory = "."
        for step_line in step:
            directory_match = re.match(r"^\s*lake-package-directory:\s*(.+?)\s*$", step_line)
            if directory_match is not None:
                package_directory = scalar(directory_match.group(1))
                break
        package_root = root / package_directory
        if not (package_root / "lake-manifest.json").is_file():
            violations.append(
                f"{workflow.relative_to(root)}: lean-action package {package_directory!r} has no lake-manifest.json"
            )
        if not any((package_root / filename).is_file() for filename in ("lakefile.lean", "lakefile.toml")):
            violations.append(
                f"{workflow.relative_to(root)}: lean-action package {package_directory!r} has no lakefile"
            )


def validate_working_directories(root: Path, workflow: Path, text: str, violations: list[str]) -> None:
    gitmodules = (root / ".gitmodules").read_text(encoding="utf-8")
    for line_number, line in enumerate(text.splitlines(), start=1):
        match = re.match(r"^\s*working-directory:\s*(.+?)\s*$", line)
        if match is None:
            continue
        directory = scalar(match.group(1))
        if "${{" in directory:
            continue
        if directory in REQUIRED_DRIFT_SUBMODULES and f"path = {directory}" in gitmodules:
            continue
        if not (root / directory).is_dir():
            violations.append(
                f"{workflow.relative_to(root)}:{line_number}: working-directory {directory!r} does not exist"
            )


def validate_runner_and_action_pins(workflow: Path, root: Path, text: str, violations: list[str]) -> None:
    relative = workflow.relative_to(root)
    for line_number, line in enumerate(text.splitlines(), start=1):
        runner_match = re.match(r"^\s*runs-on:\s*(.+?)\s*$", line)
        if runner_match is not None:
            runner = scalar(runner_match.group(1))
            if runner == "ubuntu-latest":
                violations.append(f"{relative}:{line_number}: ubuntu-latest is mutable; pin ubuntu-24.04")
            elif runner.startswith("ubuntu-") and runner != "ubuntu-24.04":
                violations.append(f"{relative}:{line_number}: unsupported Ubuntu runner pin {runner!r}")

        action_match = re.match(r"^\s*(?:-\s*)?uses:\s*([^@\s]+)@([^\s#]+)", line)
        if action_match is None:
            continue
        action, reference = action_match.groups()
        if action.startswith("./"):
            continue
        if re.fullmatch(r"[0-9a-f]{40}", reference) is None:
            violations.append(f"{relative}:{line_number}: action {action!r} must use a full commit SHA")
            continue
        expected = PINNED_ACTIONS.get(action)
        if expected is None:
            violations.append(f"{relative}:{line_number}: action {action!r} is not on the reviewed allowlist")
        elif reference != expected:
            violations.append(f"{relative}:{line_number}: action {action!r} does not match the reviewed commit")


def validate_workflow(root: Path, workflow: Path, violations: list[str]) -> str:
    text = workflow.read_text(encoding="utf-8")
    for line_number, line in enumerate(text.splitlines(), start=1):
        if re.match(r"^\s*submodules:\s*recursive\s*(?:#.*)?$", line):
            violations.append(
                f"{workflow.relative_to(root)}:{line_number}: recursive submodule checkout is forbidden; initialize exact dependencies"
            )
        if "pip install" in line and "--require-hashes" not in line:
            violations.append(
                f"{workflow.relative_to(root)}:{line_number}: Python dependencies must be hash locked"
            )
    if not re.search(r"^permissions:\s*\n\s+contents:\s*read\s*$", text, re.MULTILINE):
        violations.append(f"{workflow.relative_to(root)}: workflow permissions must be read-only")
    validate_runner_and_action_pins(workflow, root, text, violations)
    validate_lean_actions(root, workflow, text, violations)
    validate_working_directories(root, workflow, text, violations)
    return text


def validate_standalone_pnpm(workflow: str, text: str, expected_count: int, violations: list[str]) -> None:
    fragments = (
        "name: Install standalone pnpm",
        f'PNPM_VERSION: "{PNPM_VERSION}"',
        f"PNPM_SHA256: {PNPM_SHA256}",
        '"https://github.com/pnpm/pnpm/releases/download/v${PNPM_VERSION}/pnpm-linux-x64"',
        '"$PNPM_SHA256" "$pnpm_binary" | sha256sum --check',
        'echo "$RUNNER_TEMP" >> "$GITHUB_PATH"',
    )
    for fragment in fragments:
        if text.count(fragment) != expected_count:
            violations.append(f"{workflow}: standalone pnpm binding {fragment!r} must occur {expected_count} time(s)")
    if "pnpm/action-setup@" in text:
        violations.append(f"{workflow}: pnpm action bootstrap is forbidden; use the checksum-pinned standalone binary")


def validate_domainspec_workflow(root: Path, text: str, violations: list[str]) -> None:
    for path in DOMAINSPEC_TRIGGER_PATHS:
        if text.count(f'- "{path}"') != 2:
            violations.append(f"{DOMAINSPEC_WORKFLOW}: pull_request and push filters must both include {path!r}")
    required_fragments = (
        f"ELAN_VERSION: {ELAN_VERSION}",
        f"ELAN_ARCHIVE_SHA256: {ELAN_ARCHIVE_SHA256}",
        "projects/domainspec-v2/impl/cli/lean-toolchain",
        "sha256sum --check",
        f"node-version: {NODE_VERSION}",
        f'python-version: "{PYTHON_VERSION}"',
        f"cache-dependency-path: {CI_REQUIREMENTS}",
        "cache-dependency-path: pnpm-lock.yaml",
        "python -m pip install --disable-pip-version-check --require-hashes --only-binary=:all: -r projects/domainspec-v2/impl/cli/requirements-ci.txt",
        "sudo apt-get install --no-install-recommends -y postgresql-client",
        "if-no-files-found: error",
        "npm run release-candidate:prepare --",
        '--source-commit "$GITHUB_SHA"',
        "name: domainspec-v2-release-candidate-1.0.0",
    )
    for fragment in required_fragments:
        if fragment not in text:
            violations.append(f"{DOMAINSPEC_WORKFLOW}: missing standalone Lean binding {fragment!r}")
    validate_standalone_pnpm(DOMAINSPEC_WORKFLOW, text, 2, violations)
    if text.count("pnpm install --frozen-lockfile --filter @domainspec-v2/impl") != 2:
        violations.append(f"{DOMAINSPEC_WORKFLOW}: both jobs must install only the owning implementation workspace")
    if text.count("python3 tools/validate_ci_contract.py") != 1:
        violations.append(f"{DOMAINSPEC_WORKFLOW}: CI contract validator must run exactly once")

    package = root / CLI_PACKAGE
    if not package.is_file():
        violations.append(f"{DOMAINSPEC_WORKFLOW}: missing {CLI_PACKAGE}")
    else:
        package_json = json.loads(package.read_text(encoding="utf-8"))
        if "dependencies" in package_json or "devDependencies" in package_json:
            violations.append(f"{DOMAINSPEC_WORKFLOW}: publishable CLI package must remain dependency-free")
        if package_json.get("packageManager") != "npm@11.19.0":
            violations.append(f"{DOMAINSPEC_WORKFLOW}: CLI package manager must be npm@11.19.0")
        scripts = package_json.get("scripts", {})
        if scripts.get("release-candidate:prepare") != "node tools/build-release-candidate.mjs":
            violations.append(f"{DOMAINSPEC_WORKFLOW}: release-candidate builder command is not exact")
        if scripts.get("release-candidate:verify") != "node tools/verify-release-candidate.mjs":
            violations.append(f"{DOMAINSPEC_WORKFLOW}: release-candidate verifier command is not exact")
        if "contracts/release-candidate-manifest.schema.json" not in package_json.get("files", []):
            violations.append(f"{DOMAINSPEC_WORKFLOW}: release-candidate manifest contract is absent from package files")
        admitted_test_commands = " ".join(str(command) for name, command in scripts.items() if name == "test" or name.startswith("test:"))
        test_root = package.parent / "test"
        for test_path in sorted((*test_root.rglob("*.test.ts"), *test_root.rglob("*.test.mjs"))):
            relative_test = test_path.relative_to(package.parent).as_posix()
            if relative_test not in admitted_test_commands:
                violations.append(f"{DOMAINSPEC_WORKFLOW}: committed test {relative_test!r} is not admitted by product verification")
        proof_command = scripts.get("test:proof", "")
        if "--test-concurrency=1" not in proof_command:
            violations.append(f"{DOMAINSPEC_WORKFLOW}: proof-bearing tests must run serially")
        for proof_test in ("test/assurance/certify.test.ts", "test/formalization/projection.test.ts"):
            if proof_test not in proof_command:
                violations.append(f"{DOMAINSPEC_WORKFLOW}: serial proof lane must include {proof_test!r}")

    package_lock = root / CLI_PACKAGE_LOCK
    if not package_lock.is_file():
        violations.append(f"{DOMAINSPEC_WORKFLOW}: missing {CLI_PACKAGE_LOCK}")
    elif hashlib.sha256(package_lock.read_bytes()).hexdigest() != CLI_PACKAGE_LOCK_SHA256:
        violations.append(f"{DOMAINSPEC_WORKFLOW}: {CLI_PACKAGE_LOCK} differs from its reviewed lock")

    requirements = root / CI_REQUIREMENTS
    if not requirements.is_file():
        violations.append(f"{DOMAINSPEC_WORKFLOW}: missing {CI_REQUIREMENTS}")
    elif hashlib.sha256(requirements.read_bytes()).hexdigest() != CI_REQUIREMENTS_SHA256:
        violations.append(f"{DOMAINSPEC_WORKFLOW}: {CI_REQUIREMENTS} differs from its reviewed lock")

    postgres_test = root / POSTGRES_TEST
    if not postgres_test.is_file():
        violations.append(f"{DOMAINSPEC_WORKFLOW}: missing {POSTGRES_TEST}")
    else:
        postgres_text = postgres_test.read_text(encoding="utf-8")
        if POSTGRES_IMAGE not in postgres_text or re.search(r'"postgres:16"', postgres_text):
            violations.append(f"{DOMAINSPEC_WORKFLOW}: PostgreSQL test image must use the reviewed digest")

    docker_adapter = root / QUALIFICATION_DOCKER_ADAPTER
    if not docker_adapter.is_file():
        violations.append(f"{DOMAINSPEC_WORKFLOW}: missing {QUALIFICATION_DOCKER_ADAPTER}")
    else:
        adapter_text = docker_adapter.read_text(encoding="utf-8")
        stream_binding = 'tar -C "$PWD" -cf - . | docker start --attach --interactive "$container_id"'
        if stream_binding not in adapter_text or '--volume "$PWD:/workspace"' in adapter_text:
            violations.append(f"{QUALIFICATION_DOCKER_ADAPTER}: checked tree must be streamed across nested Docker boundaries")


def validate_drift_workflow(root: Path, text: str, violations: list[str]) -> None:
    if not re.search(r"^\s*submodules:\s*false\s*$", text, re.MULTILINE):
        violations.append(f"{DRIFT_WORKFLOW}: root checkout must explicitly disable ambient submodules")
    expected_update = "git submodule update --init --depth=1 " + " ".join(REQUIRED_DRIFT_SUBMODULES)
    if folded_command(text, "git submodule update --init --depth=1") != expected_update:
        violations.append(f"{DRIFT_WORKFLOW}: must initialize exactly {', '.join(REQUIRED_DRIFT_SUBMODULES)}")
    if "python3 tools/validate_ci_contract.py" not in text:
        violations.append(f"{DRIFT_WORKFLOW}: CI contract validator is not executed")
    required_fragments = (
        f"node-version: {NODE_VERSION}",
        "cache-dependency-path: implementation/domainspec/pnpm-lock.yaml",
        "pnpm install --frozen-lockfile --filter domainspec-runtime-workspace",
        "run: bash tools/check_github_drift.sh",
        "run: pnpm run check:code-tags",
    )
    for fragment in required_fragments:
        if fragment not in text:
            violations.append(f"{DRIFT_WORKFLOW}: missing deterministic drift binding {fragment!r}")
    validate_standalone_pnpm(DRIFT_WORKFLOW, text, 1, violations)
    if "corepack enable" in text:
        violations.append(f"{DRIFT_WORKFLOW}: Node 26 does not guarantee bundled Corepack; use the pinned pnpm action")
    gitmodules = (root / ".gitmodules").read_text(encoding="utf-8")
    for path in REQUIRED_DRIFT_SUBMODULES:
        if f"path = {path}" not in gitmodules:
            violations.append(f"{DRIFT_WORKFLOW}: required submodule {path!r} is not declared in .gitmodules")
    drift_script = root / DRIFT_SCRIPT
    if not drift_script.is_file():
        violations.append(f"{DRIFT_WORKFLOW}: missing {DRIFT_SCRIPT}")
    else:
        script_text = drift_script.read_text(encoding="utf-8")
        exact_hint = "git submodule update --init --depth=1 " + " ".join(REQUIRED_DRIFT_SUBMODULES)
        if exact_hint not in script_text or "git submodule update --init --recursive" in script_text:
            violations.append(f"{DRIFT_SCRIPT}: recovery hint must initialize only the exact required submodules")


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    workflow_root = root / ".github" / "workflows"
    workflows = sorted((*workflow_root.glob("*.yml"), *workflow_root.glob("*.yaml")))
    violations: list[str] = []
    texts = {str(path.relative_to(root)): validate_workflow(root, path, violations) for path in workflows}

    domainspec_text = texts.get(DOMAINSPEC_WORKFLOW)
    if domainspec_text is None:
        violations.append(f"missing required workflow {DOMAINSPEC_WORKFLOW}")
    else:
        validate_domainspec_workflow(root, domainspec_text, violations)

    drift_text = texts.get(DRIFT_WORKFLOW)
    if drift_text is None:
        violations.append(f"missing required workflow {DRIFT_WORKFLOW}")
    else:
        validate_drift_workflow(root, drift_text, violations)

    receipt = {
        "schema_version": SCHEMA_VERSION,
        "result": "fail" if violations else "pass",
        "workflow_count": len(workflows),
        "checks": [
            "no-recursive-submodules",
            "lean-action-requires-lake-package",
            "literal-or-declared-submodule-working-directories-exist",
            "ubuntu-runners-are-pinned",
            "actions-use-reviewed-commit-shas",
            "actions-are-on-the-reviewed-allowlist",
            "workflow-permissions-are-read-only",
            "domainspec-standalone-lean-is-pinned",
            "domainspec-source-paths-trigger-both-events",
            "domainspec-workspace-install-is-owner-filtered",
            "domainspec-publishable-package-remains-dependency-free",
            "domainspec-all-committed-tests-are-admitted",
            "domainspec-proof-tests-run-serially",
            "domainspec-python-dependencies-are-hash-locked",
            "domainspec-postgres-image-is-digest-pinned",
            "domainspec-docker-adapter-is-nested-daemon-portable",
            "domainspec-release-candidate-is-clean-source-bound-and-uploaded",
            "pnpm-bootstrap-is-standalone-and-checksum-pinned",
            "drift-submodules-are-exact",
            "drift-recovery-hint-is-exact",
            "drift-toolchain-and-dependencies-are-installed",
        ],
        "violations": violations,
        "authority_effect": "none",
    }
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())
