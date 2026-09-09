#!/usr/bin/env python3
"""Validate the prepared local-only Define research tower."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
REQUIRED = [
    "README.md",
    "CONTAINER.md",
    "Containerfile",
    "Containerfile.dockerignore",
    "container-provenance.json",
    "TOWER.md",
    "SOURCE-RECORDS.md",
    "GLOSSARY.md",
    "DEFINITIONS.md",
    "DISTILLED-KNOWLEDGE.md",
    "FINAL-LEARNING-PACK.md",
    "levels/L0-corpus.md",
    "levels/L1-residue-map.md",
    "levels/L2-closure-plan.md",
    "gates/closure-gates.md",
    "residue/open-residue.md",
    "tracks/source-claim-ledger.md",
    "tracks/subagent-closeout-ledger.md",
    "distill/STANDARD-DISTILL.md",
    "experiment/README.md",
    "experiment/PROTOCOL.md",
    "experiment/runtime/RUNTIME-DESIGN.md",
    "experiment/runtime/README.md",
    "experiment/runtime/BENCHMARK-ADMISSION.md",
    "experiment/runtime/cli/define.mjs",
    "experiment/runtime/cli/runtime.mjs",
    "experiment/runtime/cli/isolation.mjs",
    "experiment/runtime/cli/block.mjs",
    "experiment/runtime/tests/prepare-cli.test.mjs",
    "experiment/runtime/tests/isolation-core.test.mjs",
    "experiment/runtime/tests/synthetic-chain.test.mjs",
    "experiment/runtime/schemas/task-runtime-profile.schema.json",
    "experiment/runtime/schemas/synthetic-task-block.schema.json",
    "experiment/runtime/profiles/ui-prototyping-studio-html-canonicalization.profile.json",
    "experiment/runtime/fixtures/html-canonicalization/agent/canonicalize.ts",
    "experiment/runtime/fixtures/html-canonicalization/baseline-receipt.fixture.json",
    "experiment/runtime/fixtures/html-canonicalization/l3/materials.json",
    "experiment/FACT-SET-CONTRACT.md",
    "experiment/TASK-SELECTION.md",
    "experiment/METRICS.md",
    "experiment/CLAIM-BOUNDARY.md",
    "experiment/evidence/run-row.schema.json",
    "experiment/evidence/condition-manifest.schema.json",
    "experiment/evidence/task-selection.schema.json",
    "experiment/evidence/validate_run.py",
    "experiment/evidence/validate_condition_manifest.py",
    "experiment/evidence/validate_task_selection.py",
    "experiment/evidence/validate_experiment_bundle.py",
    "experiment/evidence/test_run_contract.py",
    "experiment/evidence/test_condition_manifest.py",
    "experiment/evidence/test_task_selection.py",
    "experiment/evidence/test_experiment_bundle.py",
    "experiment/evidence/calculate_metrics.py",
    "experiment/evidence/dry-run/VALIDATION.md",
    "experiment/evidence/fixtures/pass.jsonl",
    "experiment/evidence/fixtures/condition-manifest-pass.json",
    "experiment/evidence/fixtures/task-selection-pass.json",
    "experiment/evidence/fixtures/fail-missing-metadata.jsonl",
    "experiment/evidence/fixtures/fail-invalid-outcome.jsonl",
]
LOCAL_HASHES = {
    "cyberAlchemy-v2/define/docs/DEFINE.md": "bde8a4dd172738b15c28390ae49fdaae836999a7b3c6d2c1f32a944b52e15743",
    "cyberAlchemy-v2/define/docs/DEFINITION-PACK.md": "42fb13db5f090f167e7a25079a6e3a98d9762b707f92a0a6dbee4bc181a53906",
    "cyberAlchemy-v2/define/docs/INTERACTION.md": "abc1feb9889c7487673a4b02bc931e884dc104a2f370dd090940c50b1eb7f383",
    "cyberAlchemy-v2/product/PRODUCT-THESIS.md": "d41a227adf6323da0518e8b51b9e49e8b98ae3166a5a1ee802169c510600efa4",
    "cyberAlchemy-v2/product/OUTCOME-MODEL.md": "9596fd0464f25b36beb952143fdfac33360d43f873033ea77e26fddf744ec6c5",
    "research/projects/domainspec/experiments/E10-developer-productivity/context.md": "1b63468478443307ab3b16cd9d96c95105e8215e93d71d852eac90f2c4bc3c65",
    "research/projects/domainspec/experiments/E10-developer-productivity/protocol.md": "95c88af12165e77d3954e96857a99d4b13f3776bef7a67f343e962a7a3b7cfc2",
}
ARXIV_IDS = {
    "2607.28815", "2605.07769", "2607.21832", "2602.11988",
    "2607.27250", "2605.29442", "2604.09409", "2607.26375",
    "2607.17286", "2607.03316", "2602.09185", "2608.12355",
    "2511.12884", "2512.14012", "2507.09089",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=REPO, text=True, capture_output=True, check=False)


def main() -> int:
    errors: list[str] = []
    for relative in REQUIRED:
        if not (ROOT / relative).is_file():
            errors.append(f"MISSING:{relative}")

    for relative in (
        "experiment/evidence/run-row.schema.json",
        "experiment/evidence/condition-manifest.schema.json",
        "experiment/evidence/task-selection.schema.json",
        "experiment/evidence/fixtures/condition-manifest-pass.json",
        "experiment/evidence/fixtures/task-selection-pass.json",
        "container-provenance.json",
        "experiment/runtime/schemas/task-runtime-profile.schema.json",
        "experiment/runtime/schemas/synthetic-task-block.schema.json",
        "experiment/runtime/profiles/ui-prototyping-studio-html-canonicalization.profile.json",
        "experiment/runtime/fixtures/html-canonicalization/baseline-receipt.fixture.json",
        "experiment/runtime/fixtures/html-canonicalization/l3/materials.json",
    ):
        schema_path = ROOT / relative
        if schema_path.is_file():
            try:
                json.loads(schema_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                errors.append(f"JSON:{relative}:{exc}")

    corpus = (ROOT / "levels/L0-corpus.md").read_text(encoding="utf-8") if (ROOT / "levels/L0-corpus.md").is_file() else ""
    records = (ROOT / "SOURCE-RECORDS.md").read_text(encoding="utf-8") if (ROOT / "SOURCE-RECORDS.md").is_file() else ""
    for arxiv_id in sorted(ARXIV_IDS):
        if arxiv_id not in corpus:
            errors.append(f"SOURCE_MISSING_CORPUS:{arxiv_id}")
    for source_id in (
        "SRC-ARXIV-ECL", "SRC-ARXIV-ACT", "SRC-ARXIV-APR",
        "SRC-ARXIV-CTX1", "SRC-ARXIV-CTX2", "SRC-ARXIV-MIS",
        "SRC-ARXIV-LOG", "SRC-ARXIV-COMP", "SRC-ARXIV-ISSUE",
        "SRC-ARXIV-REVIEW", "SRC-ARXIV-AIDEV", "SRC-ARXIV-HUMAN",
        "SRC-ARXIV-READMES", "SRC-ARXIV-PRO", "SRC-ARXIV-METR",
    ):
        if source_id not in records:
            errors.append(f"SOURCE_MISSING_RECORD:{source_id}")

    for relative, expected in LOCAL_HASHES.items():
        path = REPO / relative
        if not path.is_file():
            errors.append(f"LOCAL_SOURCE_MISSING:{relative}")
        elif sha256(path) != expected:
            errors.append(f"LOCAL_SOURCE_DRIFT:{relative}")

    containerfile = ROOT / "Containerfile"
    if containerfile.is_file():
        container_text = containerfile.read_text(encoding="utf-8")
        for required_text in (
            "ARG NODE_TOOLCHAIN_IMAGE=domainspec-node-toolchain:26.8.1-ts7.0.2",
            "node:26.8.1-bookworm-slim@sha256:367679cf9792759492a486e4aa4b421764d71a9546a6dae8aab81a99eb797b3e",
            "sha256:27f5e13512830beb5d9a574108daa6701a0a0b91528aeaf1ee84ecdcddaeeaae",
            "apt-get install -y --no-install-recommends git python3 tar",
            "git --version",
            "tar --version",
            "PYTHONDONTWRITEBYTECODE=1",
            "USER 65532:65532",
            'ENTRYPOINT ["python3"]',
            "validate_package.py",
        ):
            if required_text not in container_text:
                errors.append(f"CONTAINER_CONTRACT:{required_text}")

    provenance_path = ROOT / "container-provenance.json"
    toolchain_path = REPO / "toolchains/node-typescript/toolchain.json"
    if provenance_path.is_file() and toolchain_path.is_file():
        provenance = json.loads(provenance_path.read_text(encoding="utf-8"))
        toolchain = json.loads(toolchain_path.read_text(encoding="utf-8"))
        expected = {
            "version": toolchain["node"]["version"],
            "source_image": toolchain["node"]["image"],
            "linux_amd64_manifest_digest": toolchain["node"]["linux_amd64_manifest_digest"],
            "toolchain_image": toolchain["container_image"],
        }
        if provenance.get("node") != expected:
            errors.append("CONTAINER_PROVENANCE:NODE_AUTHORITY_DRIFT")
        if provenance.get("authority", {}).get("sha256") != sha256(toolchain_path):
            errors.append("CONTAINER_PROVENANCE:TOOLCHAIN_DIGEST_DRIFT")
        extensions = provenance.get("isolation_runtime_extensions", [])
        if [item.get("package") for item in extensions] != ["git", "tar"]:
            errors.append("CONTAINER_PROVENANCE:ISOLATION_TOOL_DRIFT")

    container_docs = ROOT / "CONTAINER.md"
    if container_docs.is_file() and "--tmpfs /tmp:rw,noexec,nosuid,size=16m" not in container_docs.read_text(encoding="utf-8"):
        errors.append("CONTAINER_RUNTIME:TMPFS_MISSING")

    dockerignore = ROOT / "Containerfile.dockerignore"
    if dockerignore.is_file():
        dockerignore_text = dockerignore.read_text(encoding="utf-8")
        for required_text in (
            "container-build-receipt.json",
            "experiment/runtime/runs/",
        ):
            if required_text not in dockerignore_text:
                errors.append(f"CONTAINER_DOCKERIGNORE:{required_text}")

    profile_path = ROOT / "experiment/runtime/profiles/ui-prototyping-studio-html-canonicalization.profile.json"
    if profile_path.is_file():
        profile = json.loads(profile_path.read_text(encoding="utf-8"))
        profile_toolchain_digest = None
        if provenance_path.is_file():
            profile_toolchain_digest = json.loads(
                provenance_path.read_text(encoding="utf-8")
            ).get("authority", {}).get("sha256")
        if profile.get("repository_commit") != "1a9281557258b7182c6793859d8c2bf77a9c1d0d":
            errors.append("ISOLATION_PROFILE:COMMIT_DRIFT")
        if profile.get("network_policy") != "none":
            errors.append("ISOLATION_PROFILE:NETWORK_POLICY")
        if profile.get("agent_runtime_image_or_toolchain_digest") != profile_toolchain_digest:
            errors.append("ISOLATION_PROFILE:AGENT_TOOLCHAIN_DRIFT")
        if profile.get("evaluator_runtime_image_or_toolchain_digest") != profile_toolchain_digest:
            errors.append("ISOLATION_PROFILE:EVALUATOR_TOOLCHAIN_DRIFT")
        for key in ("stub_fixture_path", "baseline_receipt_path"):
            target = REPO / profile.get(key, "")
            expected = profile.get("stub_fixture_sha256" if key == "stub_fixture_path" else "baseline_receipt_digest")
            if not target.is_file() or sha256(target) != expected:
                errors.append(f"ISOLATION_PROFILE:{key.upper()}_DRIFT")
        baseline_path = REPO / profile.get("baseline_receipt_path", "")
        if baseline_path.is_file():
            baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
            if baseline.get("task_id") != profile.get("task_id"):
                errors.append("ISOLATION_PROFILE:BASELINE_TASK_DRIFT")
            if baseline.get("repository_commit") != profile.get("repository_commit"):
                errors.append("ISOLATION_PROFILE:BASELINE_COMMIT_DRIFT")
            if baseline.get("dependency_closure_digest") != profile.get("dependency_closure_digest"):
                errors.append("ISOLATION_PROFILE:DEPENDENCY_CLOSURE_DRIFT")

    validator = ROOT / "experiment/evidence/validate_run.py"
    fixtures = ROOT / "experiment/evidence/fixtures"
    if validator.is_file():
        passed = run([sys.executable, str(validator), str(fixtures / "pass.jsonl")])
        if passed.returncode != 0:
            errors.append(f"PASS_FIXTURE:{passed.stderr.strip() or passed.stdout.strip()}")
        for name in ("fail-missing-metadata.jsonl", "fail-invalid-outcome.jsonl"):
            failed = run([sys.executable, str(validator), str(fixtures / name)])
            if failed.returncode == 0:
                errors.append(f"FAIL_FIXTURE_FALSE_PASS:{name}")
        metrics = run([
            sys.executable,
            str(ROOT / "experiment/evidence/calculate_metrics.py"),
            str(fixtures / "pass.jsonl"),
        ])
        if metrics.returncode != 0:
            errors.append(f"METRICS:{metrics.stderr.strip() or metrics.stdout.strip()}")
        else:
            try:
                payload = json.loads(metrics.stdout)
                if payload.get("claim_status") != "synthetic_fixture_no_product_claim":
                    errors.append("METRICS_CLAIM_BOUNDARY")
                if set(payload.get("stratum_condition_summary", {})) != {
                    "low_ambiguity_control", "high_ambiguity"
                }:
                    errors.append("METRICS_STRATA")
                comparisons = payload.get("comparisons", {})
                for name in (
                    "selected_information", "define_structure",
                    "evidence_enforcement", "combined_system",
                ):
                    comparison = comparisons.get(name, {})
                    if "task_deltas" not in comparison or "median_left_minus_right" not in comparison:
                        errors.append(f"METRICS_PAIRED:{name}")
            except json.JSONDecodeError as exc:
                errors.append(f"METRICS_JSON:{exc}")

        live_shape = run([
            sys.executable,
            str(validator),
            "--live-pilot",
            str(fixtures / "pass.jsonl"),
        ])
        combined = live_shape.stderr + live_shape.stdout
        if live_shape.returncode == 0:
            errors.append("LIVE_SHAPE_FALSE_PASS")
        for marker in ("LIVE_PILOT_EVIDENCE_KIND", "LIVE_PILOT_CARDINALITY", "LIVE_PILOT_STRATA"):
            if marker not in combined:
                errors.append(f"LIVE_SHAPE_MISSING:{marker}")

    manifest_validator = ROOT / "experiment/evidence/validate_condition_manifest.py"
    if manifest_validator.is_file():
        manifest = run([
            sys.executable,
            str(manifest_validator),
            str(fixtures / "condition-manifest-pass.json"),
        ])
        if manifest.returncode != 0:
            errors.append(f"CONDITION_MANIFEST:{manifest.stderr.strip() or manifest.stdout.strip()}")

    selection_validator = ROOT / "experiment/evidence/validate_task_selection.py"
    if selection_validator.is_file():
        selection = run([
            sys.executable,
            str(selection_validator),
            str(fixtures / "task-selection-pass.json"),
        ])
        if selection.returncode != 0:
            errors.append(f"TASK_SELECTION:{selection.stderr.strip() or selection.stdout.strip()}")

    bundle_validator = ROOT / "experiment/evidence/validate_experiment_bundle.py"
    if bundle_validator.is_file():
        bundle = run([
            sys.executable,
            str(bundle_validator),
            str(fixtures / "task-selection-pass.json"),
            str(fixtures / "pass.jsonl"),
            str(fixtures / "condition-manifest-pass.json"),
        ])
        if bundle.returncode != 0:
            errors.append(f"EXPERIMENT_BUNDLE:{bundle.stderr.strip() or bundle.stdout.strip()}")

    for relative in (
        "experiment/evidence/test_run_contract.py",
        "experiment/evidence/test_condition_manifest.py",
        "experiment/evidence/test_task_selection.py",
        "experiment/evidence/test_experiment_bundle.py",
    ):
        test = run([sys.executable, str(ROOT / relative)])
        if test.returncode != 0:
            errors.append(f"REGRESSION:{relative}:{test.stderr.strip() or test.stdout.strip()}")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(json.dumps({"status": "fail", "errors": len(errors)}))
        return 1
    print(json.dumps({
        "status": "pass",
        "required_files": len(REQUIRED),
        "arxiv_sources": len(ARXIV_IDS),
        "local_sources": len(LOCAL_HASHES),
        "fixture_expectations": {
            "run_pass": 1,
            "manifest_pass": 1,
            "selection_pass": 1,
            "bundle_join_pass": 1,
            "run_fail": 2,
        },
        "regression_contracts": 4,
        "container_contract": "node26-git-tar-source-provenance-static-pass",
        "runtime_contract": "l1-prepare-l2-isolation-l3-synthetic-node26-tests-separate",
        "claim_boundary": "synthetic_fixture_no_product_claim",
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
