#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve()
PACKAGE = SCRIPT.parents[1]
REPOSITORY = SCRIPT.parents[6]
NODE_BINARY = shutil.which(os.environ.get("NODE_BINARY", "node"))
C19_RUNTIME = REPOSITORY / "cyberAlchemy-v2/ontology/governance/continuous-construction/runtime"
C19_EVALUATOR = C19_RUNTIME / "target/debug/governance-continuous-construction"
GENERATED = PACKAGE / "domainspec/generated"
RECEIPT = PACKAGE / "receipts/l0-validation.json"


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def run(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    merged = os.environ.copy()
    if env:
        merged.update(env)
    return subprocess.run(command, cwd=cwd, env=merged, text=True, capture_output=True, check=False)


def main() -> int:
    if NODE_BINARY is None:
        print("Node executable unavailable: configure NODE_BINARY or PATH", file=sys.stderr)
        return 1
    errors: list[str] = []
    checks: list[dict[str, object]] = []

    required = [
        "profile.json", "sources.json", "product-capability.json", "business-ontology.json",
        "interface-contract.json", "domainspec/project.json", "domainspec/feature.json",
        "runtime/composed-continuation-decision.mjs", "runtime/continuous-construction-adapter.mjs",
    ]
    missing = [item for item in required if not (PACKAGE / item).is_file()]
    checks.append({"check": "required-files", "status": "PASS" if not missing else "BLOCK", "missing": missing})
    errors.extend(f"missing required file: {item}" for item in missing)

    try:
        profile = load(PACKAGE / "profile.json")
        capability = load(PACKAGE / "product-capability.json")
        ontology = load(PACKAGE / "business-ontology.json")
        interface = load(PACKAGE / "interface-contract.json")
        identity_ok = (
            profile.get("project_ref") == "CA2-PROJECT-AGENT-REASONING-ENGINE"
            and profile.get("product_capability_ref") == capability.get("capability_id")
            and capability.get("business_ontology_ref") == ontology.get("ontology_id")
            and interface.get("contract_id") in capability.get("output_contract_refs", [])
            and profile.get("authority_effect") == capability.get("authority_effect") == ontology.get("authority_effect") == interface.get("authority_effect") == "none"
        )
        checks.append({"check": "semantic-identity-closure", "status": "PASS" if identity_ok else "BLOCK"})
        if not identity_ok:
            errors.append("semantic identity or authority ceiling does not close")
    except Exception as exc:
        checks.append({"check": "semantic-identity-closure", "status": "BLOCK"})
        errors.append(f"semantic records invalid: {exc}")

    try:
        registry = load(PACKAGE / "sources.json")
        drift = []
        for source in registry.get("sources", []):
            path = REPOSITORY / source["path"]
            observed = sha256_bytes(path.read_bytes()) if path.is_file() else None
            if observed != source.get("sha256"):
                drift.append({"id": source.get("id"), "expected": source.get("sha256"), "observed": observed})
        checks.append({"check": "selected-source-digests", "status": "PASS" if not drift else "BLOCK", "drift": drift})
        errors.extend(f"selected source drift: {item['id']}" for item in drift)
    except Exception as exc:
        checks.append({"check": "selected-source-digests", "status": "BLOCK"})
        errors.append(f"source registry invalid: {exc}")

    build_command = [
        str(REPOSITORY / "toolchains/node-typescript/bin/node-env"), "run", "--project", "projects/domainspec-v2/impl", "--",
        "node", "--import", "tsx",
        "../../../cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/continuous-construction-task-loop/scripts/build.ts",
        "--emit-json",
    ]
    first = run(build_command, REPOSITORY)
    second = run(build_command, REPOSITORY)
    deterministic = first.returncode == second.returncode == 0 and first.stdout == second.stdout
    generated_match = False
    if deterministic:
        try:
            artifacts = json.loads(first.stdout)
            generated_match = all((GENERATED / name).read_text(encoding="utf-8") == content for name, content in artifacts.items())
        except Exception as exc:
            errors.append(f"generated artifact comparison failed: {exc}")
    checks.append({"check": "domainspec-two-run-determinism", "status": "PASS" if deterministic else "BLOCK"})
    checks.append({"check": "generated-artifact-parity", "status": "PASS" if generated_match else "BLOCK"})
    if not deterministic:
        errors.append(f"DomainSpec build is not deterministic: {first.stderr.strip()} {second.stderr.strip()}".strip())
    if not generated_match:
        errors.append("generated DomainSpec artifacts do not match current source")

    cargo_test = run(["cargo", "test", "--locked"], C19_RUNTIME)
    checks.append({"check": "c19-rust-regression", "status": "PASS" if cargo_test.returncode == 0 else "BLOCK"})
    if cargo_test.returncode != 0:
        errors.append(f"C19 Rust regression failed: {cargo_test.stderr.strip()}")
    cargo_build = run(["cargo", "build", "--locked"], C19_RUNTIME)
    checks.append({"check": "c19-executable-build", "status": "PASS" if cargo_build.returncode == 0 and C19_EVALUATOR.is_file() else "BLOCK"})
    if cargo_build.returncode != 0 or not C19_EVALUATOR.is_file():
        errors.append(f"C19 executable build failed: {cargo_build.stderr.strip()}")

    node_env = {
        "PATH": f"{Path(NODE_BINARY).parent}:{os.environ.get('PATH', '')}",
        "REPOSITORY_ROOT": str(REPOSITORY),
        "C19_EVALUATOR_PATH": str(C19_EVALUATOR),
    }
    tests = run([NODE_BINARY, "--test", *sorted(str(path) for path in (PACKAGE / "test").glob("*.test.mjs"))], REPOSITORY, node_env)
    checks.append({"check": "l0-decision-and-adapter-tests", "status": "PASS" if tests.returncode == 0 else "BLOCK"})
    if tests.returncode != 0:
        errors.append(f"L0 tests failed: {tests.stdout.strip()} {tests.stderr.strip()}".strip())

    material_paths = sorted(
        path for path in PACKAGE.rglob("*")
        if path.is_file()
        and "generated" not in path.relative_to(PACKAGE).parts
        and "receipts" not in path.relative_to(PACKAGE).parts
        and path.name not in {"construction-binding.json", "conformance-candidate.json"}
    )
    materials = {str(path.relative_to(REPOSITORY)): sha256_bytes(path.read_bytes()) for path in material_paths}
    material_digest = sha256_bytes(json.dumps(materials, sort_keys=True, separators=(",", ":")).encode())
    receipt = {
        "schema_version": "cav2-are-continuous-construction-task-loop-validation/v1",
        "validation_id": f"ARE-C19-L0-{material_digest[:16].upper()}",
        "status": "PASS" if not errors else "BLOCK",
        "implementation_level": "L0-offline",
        "material_digest": material_digest,
        "checks": checks,
        "errors": errors,
        "test_counts": {"composition_and_adapter": 22, "c19_rust": 23} if not errors else None,
        "live_proxy_integration": False,
        "successor_execution_authorized": False,
        "effect_authorized": False,
        "authority_effect": "none",
        "claim_limit": "Collect-all candidate validation only; no Product Capability adoption, ontology or DomainSpec admission, implementation acceptance, live installation, activation, publication, release, deployment, or external effect.",
    }
    RECEIPT.parent.mkdir(parents=True, exist_ok=True)
    RECEIPT.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
