#!/usr/bin/env python3
"""Independently assess exact local Rust bytes against accepted binding 002."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
V1_ROOT = HERE.parents[2]
PRODUCT_ROOT = V1_ROOT.parents[4]
RUNTIME_ROOT = PRODUCT_ROOT / "runtime"
POLICY_PATH = HERE / "policy.json"
ASSESSMENT_PATH = HERE / "generated" / "conformance-assessment.json"
PREACCEPTANCE_PATH = HERE / "generated" / "preacceptance-001.json"
TEST_PATH = HERE / "tests" / "test_assess.py"


class AssessmentError(RuntimeError):
    pass


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def sha256_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssessmentError(message)


def v1_file(relative: str) -> Path:
    return V1_ROOT / relative


def verify_exact_json(relative: str, expected_sha: str, label: str) -> dict[str, Any]:
    path = v1_file(relative)
    require(path.is_file(), f"missing {label}: {relative}")
    require(sha256_file(path) == expected_sha, f"{label} drift: {relative}")
    return load_json(path)


def material_digest(root: Path, artifacts: list[dict[str, str]], path_key: str = "path") -> str:
    digest = hashlib.sha256()
    for item in sorted(artifacts, key=lambda entry: entry[path_key]):
        relative = item[path_key]
        path = root / relative
        require(path.is_file(), f"missing material artifact: {relative}")
        raw = path.read_bytes()
        if "sha256" in item:
            require(sha256_bytes(raw) == item["sha256"], f"material artifact drift: {relative}")
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(raw)
        digest.update(b"\0")
    return digest.hexdigest()


def verify_inputs(policy: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    accepted = policy["accepted_binding"]
    binding = verify_exact_json(accepted["binding_path"], accepted["binding_sha256"], "accepted binding")
    decision = verify_exact_json(
        accepted["acceptance_decision_path"], accepted["acceptance_decision_sha256"], "binding acceptance decision"
    )
    require(binding["binding_id"] == accepted["binding_id"], "accepted binding identity mismatch")
    require(decision["decision_id"] == accepted["acceptance_decision_id"], "acceptance decision identity mismatch")
    require(decision["acceptance"]["lifecycle_status"] == "accepted", "binding decision is not accepted")
    require(
        decision["acceptance"]["accepted_binding_material_digest"] == accepted["binding_material_digest"],
        "accepted binding material digest mismatch",
    )
    decision_path = v1_file(accepted["acceptance_decision_path"])
    decision_material = [
        {"path": item["material_digest_path"], "sha256": item["sha256"]}
        for item in decision["subject"]["artifacts"]
    ]
    binding_root = V1_ROOT / "implementation/rust-binding/successors/002"
    require(
        material_digest(binding_root, decision_material) == accepted["binding_material_digest"],
        "accepted binding material bytes drift",
    )
    require(
        decision["acceptance"]["bound_implementation_material_digest"] == policy["implementation"]["material_digest"],
        "acceptance decision binds a different implementation digest",
    )

    implementation = policy["implementation"]
    prior_candidate = verify_exact_json(
        implementation["candidate_path"], implementation["candidate_sha256"], "prior implementation candidate"
    )
    prior_preacceptance = verify_exact_json(
        implementation["prior_preacceptance_path"],
        implementation["prior_preacceptance_sha256"],
        "prior implementation preacceptance",
    )
    require(prior_candidate["implementation_id"] == implementation["implementation_id"], "implementation identity mismatch")
    require(
        prior_candidate["implementation_material"]["digest"] == implementation["material_digest"],
        "prior candidate implementation digest mismatch",
    )
    require(
        prior_preacceptance["candidate"]["implementation_material_digest"] == implementation["material_digest"],
        "prior preacceptance implementation digest mismatch",
    )
    require(
        binding["implementation_material"]["digest"] == implementation["material_digest"],
        "binding implementation digest mismatch",
    )
    require(
        material_digest(PRODUCT_ROOT, binding["implementation_material"]["artifacts"])
        == implementation["material_digest"],
        "current implementation bytes do not reproduce the authorized digest",
    )

    workstream = policy["workstream"]
    plan = verify_exact_json(workstream["plan_path"], workstream["plan_sha256"], "formal evidence plan")
    require(plan["plan_id"] == workstream["plan_id"], "formal evidence plan identity mismatch")
    streams = {item["workstream_id"]: item for item in plan["workstreams"]}
    require(workstream["workstream_id"] in streams, "FE-W2 workstream missing")
    providers = {item["provider_id"]: item for item in plan["evidence_providers"]}
    require(workstream["provider_id"] in providers, "FE-W2 provider missing")

    require(len(binding["node_mappings"]) == 89, "accepted node mapping count drift")
    require(len(binding["relation_mappings"]) == 204, "accepted relation mapping count drift")
    require(len(binding["proof_mappings"]) == 13, "accepted proof mapping count drift")
    require(len(binding["boundary_bindings"]) == 9, "accepted boundary count drift")
    proof_ids = {item["proof_requirement_id"] for item in binding["proof_mappings"]}
    rule_ids = {item["proof_requirement_id"] for item in policy["proof_rules"]}
    require(len(rule_ids) == 13 and rule_ids == proof_ids, "proof policy does not close over accepted proof mappings")

    artifact_hashes = {item["path"]: item["sha256"] for item in binding["implementation_material"]["artifacts"]}
    for mapping in binding["node_mappings"]:
        for target in mapping["implementation_targets"]:
            require(target["path"] in artifact_hashes, f"node target outside implementation material: {target['path']}")
            require(target["sha256"] == artifact_hashes[target["path"]], f"node target hash mismatch: {mapping['system_id']}")
            source = (PRODUCT_ROOT / target["path"]).read_text(encoding="utf-8")
            require(target["symbol"].split("::")[-1] in source, f"node target symbol missing: {target['symbol']}")
    for mapping in binding["relation_mappings"]:
        target = mapping["required_test_target"]
        require(target["path"] in artifact_hashes, f"relation target outside implementation material: {mapping['system_relation_id']}")
        require(target["sha256"] == artifact_hashes[target["path"]], f"relation target hash mismatch: {mapping['system_relation_id']}")
    for mapping in binding["proof_mappings"]:
        target = mapping["required_test_target"]
        require(target["path"] in artifact_hashes, f"proof target outside implementation material: {mapping['proof_requirement_id']}")
        require(target["sha256"] == artifact_hashes[target["path"]], f"proof target hash mismatch: {mapping['proof_requirement_id']}")
    return binding, decision, prior_candidate


def rust_test_names_from_source() -> list[str]:
    names: list[str] = []
    for path in sorted((RUNTIME_ROOT / "tests").glob("*.rs")):
        source = path.read_text(encoding="utf-8")
        names.extend(re.findall(r"#\[test\]\s*\n\s*fn\s+([A-Za-z0-9_]+)\s*\(", source))
    return sorted(names)


def run_command(command: list[str], env: dict[str, str]) -> str:
    result = subprocess.run(
        command,
        cwd=RUNTIME_ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    combined = result.stdout + result.stderr
    require(result.returncode == 0, f"command failed ({' '.join(command)}): {combined[-2000:]}")
    return combined


def run_cargo_validation(policy: dict[str, Any]) -> dict[str, Any]:
    cargo = policy["cargo_validation"]
    with tempfile.TemporaryDirectory(prefix="ca2-fe-w2-") as target_dir:
        env = os.environ.copy()
        env["CARGO_TARGET_DIR"] = target_dir
        env["CARGO_NET_OFFLINE"] = "true"
        command_outputs = []
        for command in cargo["commands"]:
            command_outputs.append(run_command(command, env))
        cargo_version = run_command(["cargo", "--version"], env).strip()
        rustc_version = run_command(["rustc", "--version"], env).strip()

    list_output = command_outputs[2]
    observed_tests = sorted(set(re.findall(r"^([A-Za-z0-9_:]+): test$", list_output, re.MULTILINE)))
    result_output = command_outputs[3]
    passed = sum(int(value) for value in re.findall(r"test result: ok\. (\d+) passed", result_output))
    failed = sum(int(value) for value in re.findall(r"test result: (?:ok|FAILED)\. \d+ passed; (\d+) failed", result_output))
    require(len(observed_tests) == cargo["expected_test_count"], "observed Cargo test count mismatch")
    require(passed == cargo["expected_test_count"], "executed Cargo test count mismatch")
    require(failed == 0, "Cargo test failures observed")
    require(observed_tests == rust_test_names_from_source(), "Cargo test list and exact Rust source test declarations disagree")
    return {
        "cargo_version": cargo_version,
        "rustc_version": rustc_version,
        "cargo_mode": "offline-and-locked",
        "target_directory": "fresh-temporary-outside-repository",
        "commands": [
            {"command": command, "status": "PASS"}
            for command in cargo["commands"]
        ],
        "observed_test_count": len(observed_tests),
        "tests_passed": passed,
        "tests_failed": failed,
        "observed_tests": observed_tests,
    }


def verify_local_capability_ceiling(policy: dict[str, Any], binding: dict[str, Any]) -> dict[str, Any]:
    rust_paths = [
        PRODUCT_ROOT / item["path"]
        for item in binding["implementation_material"]["artifacts"]
        if item["path"].endswith(".rs")
    ]
    combined = "\n".join(path.read_text(encoding="utf-8") for path in rust_paths)
    hits = [pattern for pattern in policy["executable_forbidden_patterns"] if pattern in combined]
    require(not hits, f"forbidden executable capability token(s): {', '.join(hits)}")
    manifest = tomllib.loads((RUNTIME_ROOT / "Cargo.toml").read_text(encoding="utf-8"))
    unsafe_lint = manifest.get("lints", {}).get("rust", {}).get("unsafe_code")
    require(unsafe_lint in {"deny", "forbid"}, "unsafe_code is not denied by the exact manifest")
    require(not re.search(r"\bunsafe\s+(?:fn|impl|trait|\{)", combined), "executable unsafe code found")
    dependency_count = sum(
        len(manifest.get(section, {}))
        for section in ("dependencies", "dev-dependencies", "build-dependencies")
    )
    require(dependency_count == 0, "unexpected Cargo dependencies present")
    return {
        "dependency_count": dependency_count,
        "unsafe_code": f"{unsafe_lint}-by-manifest-and-no-executable-unsafe-found",
        "executable_forbidden_capability_scan": "PASS",
        "network": "absent",
        "filesystem_or_external_storage": "absent-from-runtime; in-memory test fixture only",
        "production_cryptography": "absent; injected interface and explicit non-cryptographic fixture only",
        "credentials_wallets_rpc_submission_deployment": "absent",
        "external_effect": "none",
    }


def build_assessment(
    policy_override: dict[str, Any] | None = None,
    validation_override: dict[str, Any] | None = None,
) -> dict[str, Any]:
    policy = copy.deepcopy(policy_override) if policy_override is not None else load_json(POLICY_PATH)
    binding, decision, prior_candidate = verify_inputs(policy)
    validation = copy.deepcopy(validation_override) if validation_override is not None else run_cargo_validation(policy)
    observed_tests = set(validation["observed_tests"])
    require(validation["observed_test_count"] == 26, "assessment validation did not observe 26 tests")
    require(validation["tests_passed"] == 26 and validation["tests_failed"] == 0, "assessment validation is not 26/26 PASS")
    capability_ceiling = verify_local_capability_ceiling(policy, binding)

    proof_assessments: list[dict[str, Any]] = []
    for rule in sorted(policy["proof_rules"], key=lambda item: item["proof_requirement_id"]):
        missing = sorted(set(rule["required_tests"]) - observed_tests)
        require(not missing, f"required proof test(s) not observed for {rule['proof_requirement_id']}: {missing}")
        assessment = {
            "proof_requirement_id": rule["proof_requirement_id"],
            "assessment_status": rule["assessment_status"],
            "observed_tests": rule["required_tests"],
        }
        if "evidence" in rule:
            assessment["evidence"] = rule["evidence"]
        if "causal_blocker" in rule:
            assessment["causal_blocker"] = rule["causal_blocker"]
        assessment["acceptance_status"] = "not-accepted-by-this-assessment"
        proof_assessments.append(assessment)

    summary = {
        "local_conformance_supported": sum(item["assessment_status"] == "local-conformance-supported" for item in proof_assessments),
        "partial_local_conformance": sum(item["assessment_status"] == "partial-local-conformance" for item in proof_assessments),
        "not_evaluable": sum(item["assessment_status"] == "not_evaluable" for item in proof_assessments),
        "accepted_conformance": 0,
    }
    require(summary == {
        "local_conformance_supported": 7,
        "partial_local_conformance": 4,
        "not_evaluable": 2,
        "accepted_conformance": 0,
    }, "proof assessment summary drift")

    prior_summary = prior_candidate["proof_summary"]
    require(
        [prior_summary["local_candidate_pass"], prior_summary["partial_local_candidate"], prior_summary["not_evaluable"]]
        == [summary["local_conformance_supported"], summary["partial_local_conformance"], summary["not_evaluable"]],
        "independent proof summary disagrees with prior evidence",
    )
    return {
        "schema_version": "cav2-kep-sol2-independent-local-conformance-assessment/v1-candidate",
        "assessment_id": policy["assessment_id"],
        "route_id": policy["route_id"],
        "lifecycle_status": "independent-assessment-candidate",
        "source_authorization": policy["source_authorization"],
        "policy": {
            "policy_id": policy["policy_id"],
            "path": "../policy.json",
            "sha256": sha256_file(POLICY_PATH),
        },
        "selected_dependencies": {
            "dependency_path_root": policy["dependency_path_root"],
            "accepted_binding_id": policy["accepted_binding"]["binding_id"],
            "accepted_binding_material_digest": policy["accepted_binding"]["binding_material_digest"],
            "acceptance_decision_id": decision["decision_id"],
            "acceptance_decision_sha256": policy["accepted_binding"]["acceptance_decision_sha256"],
            "implementation_id": policy["implementation"]["implementation_id"],
            "implementation_material_digest": policy["implementation"]["material_digest"],
            "workstream_id": policy["workstream"]["workstream_id"],
            "provider_id": policy["workstream"]["provider_id"],
        },
        "independence": {
            "byte_identity": "recomputed-directly-from-12-current-files",
            "cargo_execution": "fresh-temporary-target-no-reuse-of-repository-target",
            "mapping_evaluation": "directly-recomputed-from-accepted-binding-and-current-exact-bytes",
            "prior_candidate_role": policy["implementation"]["prior_evidence_role"],
            "prior_summary_comparison": "agrees-with-independent-result",
        },
        "environment": {
            "cargo_version": validation["cargo_version"],
            "rustc_version": validation["rustc_version"],
            "network_mode": validation["cargo_mode"],
            "target_directory": validation["target_directory"],
        },
        "implementation_material": binding["implementation_material"],
        "validation": {
            "commands": validation["commands"],
            "tests_run": validation["observed_test_count"],
            "tests_passed": validation["tests_passed"],
            "tests_failed": validation["tests_failed"],
            "successor_tests": policy["cargo_validation"]["expected_successor_tests"],
            "existing_kernel_regressions": policy["cargo_validation"]["expected_existing_kernel_tests"],
            "observed_tests": validation["observed_tests"],
        },
        "mapping_assessment": {
            "exact_node_targets": "89/89 PASS",
            "compile_time_bound_relation_records": "204/204 PASS",
            "relation_specific_behavioral_conformance": "not_evaluable",
            "relation_causal_blocker": "Compile-time binding does not provide 204 independent relation-specific behavioral observations.",
            "proof_records": "13/13 assessed",
            "system_boundaries": "9/9 represented",
        },
        "capability_ceiling": capability_ceiling,
        "proof_assessments": proof_assessments,
        "proof_summary": summary,
        "aggregate_assessment": {
            "result": policy["aggregate_rule"]["result"],
            "causal_blockers": policy["aggregate_rule"]["causal_blockers"],
            "acceptance_status": "not-accepted",
        },
        "successor_state": {
            "exact_assessment_candidate": "ready-for-separate-owner-decision",
            "formal_claim_authorship": "requires-separate-FE-W1-authorization",
            "production_cryptography_and_sql": "requires-separate-FE-W3-authorization",
            "solana_program_test": "blocked-on-FE-W2-decision-and-FE-W3",
            "devnet_trial": "blocked",
        },
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": (
            "Independent local conformance assessment candidate for accepted binding "
            f"{policy['accepted_binding']['binding_material_digest']} and implementation material "
            f"{policy['implementation']['material_digest']} only. Seven obligations are locally supported, four are partial, "
            "two are not evaluable, and aggregate conformance is indeterminate; no result is accepted and no external effect is authorized."
        ),
    }


def assessment_material(assessment_raw: bytes) -> tuple[str, list[dict[str, str]]]:
    artifacts = [
        {"path": "policy.json", "sha256": sha256_file(POLICY_PATH)},
        {"path": "generated/conformance-assessment.json", "sha256": sha256_bytes(assessment_raw)},
    ]
    digest = hashlib.sha256()
    for item in sorted(artifacts, key=lambda entry: entry["path"]):
        raw = POLICY_PATH.read_bytes() if item["path"] == "policy.json" else assessment_raw
        digest.update(item["path"].encode("utf-8"))
        digest.update(b"\0")
        digest.update(raw)
        digest.update(b"\0")
    return digest.hexdigest(), artifacts


def build_preacceptance(assessment_raw: bytes) -> dict[str, Any]:
    assessment = json.loads(assessment_raw)
    digest, artifacts = assessment_material(assessment_raw)
    return {
        "schema_version": "cav2-kep-sol2-independent-local-conformance-preacceptance/v1",
        "receipt_id": "CA2-RECEIPT-KEP-SOL2-INDEPENDENT-LOCAL-CONFORMANCE-PREACCEPTANCE-001",
        "route_id": "CA2-ROUTE-VALIDATE",
        "source_authorization": assessment["source_authorization"],
        "candidate": {
            "assessment_id": assessment["assessment_id"],
            "lifecycle_status": assessment["lifecycle_status"],
            "assessment_material_digest_algorithm": "sha256-path-null-bytes-null/v1",
            "assessment_material_digest": digest,
            "artifacts": artifacts,
            "accepted_binding_material_digest": assessment["selected_dependencies"]["accepted_binding_material_digest"],
            "implementation_material_digest": assessment["selected_dependencies"]["implementation_material_digest"],
        },
        "checks": [
            {"check_id": "accepted-binding-exact", "status": "PASS"},
            {"check_id": "implementation-material-exact", "status": "PASS"},
            {"check_id": "fresh-isolated-cargo-validation", "status": "PASS", "evidence": "26/26 tests pass offline and locked in a fresh temporary target directory."},
            {"check_id": "node-mapping-closure", "status": "PASS", "evidence": "89/89 exact node targets resolve."},
            {"check_id": "relation-record-closure", "status": "PASS", "evidence": "204/204 relation records are compile-time bound."},
            {"check_id": "relation-specific-behavioral-conformance", "status": "not_evaluable", "causal_blocker": "No independent observation exists for every individual relation."},
            {"check_id": "proof-assessment-closure", "status": "PASS", "evidence": "All 13 proof obligations are assessed without omission."},
            {"check_id": "aggregate-conformance", "status": "indeterminate", "causal_blocker": "Four partial and two not_evaluable obligations plus missing production and environment providers prevent aggregate conformance."}
        ],
        "proof_summary": assessment["proof_summary"],
        "aggregate_result": assessment["aggregate_assessment"]["result"],
        "assessor": {"path": "../assess.py", "sha256": sha256_file(Path(__file__))},
        "tests": {"path": "../tests/test_assess.py", "sha256": sha256_file(TEST_PATH)},
        "decision_gate": {
            "status": "ready-for-exact-assessment-candidate-decision",
            "required_digest": digest,
            "admissible_option_ids": [
                "ACCEPT-EXACT-LOCAL-CONFORMANCE-ASSESSMENT",
                "REJECT-EXACT-LOCAL-CONFORMANCE-ASSESSMENT",
                "DEFER-EXACT-LOCAL-CONFORMANCE-ASSESSMENT"
            ],
            "decision_limit": "Acceptance may bind only these exact assessment findings; it cannot convert the indeterminate aggregate into conformance or authorize implementation or external effects."
        },
        "preacceptance": {
            "status": "PASS",
            "meaning": "The exact independent assessment candidate is dependency-closed, byte-identified, collect-all, and ready for a separate owner decision.",
            "authority_effect": "none"
        },
        "authority_effect": "none",
        "implementation_effect": "none",
        "enforcement_effect": "none",
        "external_effect": "none",
        "claim_ceiling": "Preaccepted independent assessment candidate only; aggregate conformance remains indeterminate and no implementation, publication, deployment, Devnet, or external effect is authorized."
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        assessment_raw = canonical_bytes(build_assessment())
        preacceptance_raw = canonical_bytes(build_preacceptance(assessment_raw))
        if args.check:
            require(ASSESSMENT_PATH.is_file(), f"missing generated assessment: {ASSESSMENT_PATH}")
            require(PREACCEPTANCE_PATH.is_file(), f"missing generated preacceptance: {PREACCEPTANCE_PATH}")
            require(ASSESSMENT_PATH.read_bytes() == assessment_raw, "generated assessment drift")
            require(PREACCEPTANCE_PATH.read_bytes() == preacceptance_raw, "generated preacceptance drift")
            mode = "check"
        else:
            ASSESSMENT_PATH.parent.mkdir(parents=True, exist_ok=True)
            ASSESSMENT_PATH.write_bytes(assessment_raw)
            PREACCEPTANCE_PATH.write_bytes(preacceptance_raw)
            mode = "write"
        digest, _ = assessment_material(assessment_raw)
        assessment = json.loads(assessment_raw)
        print(json.dumps({
            "schema_version": "cav2-kep-sol2-independent-local-conformance-command/v1",
            "result": "pass",
            "mode": mode,
            "assessment_id": assessment["assessment_id"],
            "assessment_sha256": sha256_bytes(assessment_raw),
            "assessment_material_digest": digest,
            "preacceptance_sha256": sha256_bytes(preacceptance_raw),
            "aggregate_result": assessment["aggregate_assessment"]["result"],
            "tests": assessment["validation"]["tests_passed"],
            "authority_effect": "none",
            "external_effect": "none"
        }, indent=2))
        return 0
    except (AssessmentError, KeyError, ValueError, OSError, subprocess.SubprocessError, tomllib.TOMLDecodeError) as exc:
        print(json.dumps({"result": "fail", "error": str(exc), "authority_effect": "none"}, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
