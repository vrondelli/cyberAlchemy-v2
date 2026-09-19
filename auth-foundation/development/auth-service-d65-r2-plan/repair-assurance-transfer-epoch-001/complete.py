#!/usr/bin/env python3
"""Freeze and test the local Auth candidate through product-review eligibility."""

import copy
from contextlib import nullcontext
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

from build_profile import ref

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[4]
DENOMINATOR = HERE.parent / "w4/AUTH-SERVICE-PRODUCT-TEST-DENOMINATOR.v1.json"


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def load(path):
    return json.loads(Path(path).read_text())


def save(path, value):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(value, sort_keys=True, indent=2) + "\n")


def invoke(argv, require_success=True):
    result = subprocess.run(argv, cwd=REPO, capture_output=True, text=True, timeout=3600)
    if require_success and result.returncode:
        raise RuntimeError(result.stdout[-6000:] + result.stderr[-6000:])
    text = result.stdout if result.returncode == 0 else result.stderr
    try:
        value = json.loads(text)
    except ValueError:
        if require_success:
            raise RuntimeError("non-JSON tool result:" + text[-1500:])
        value = {"status": "not_evaluable", "detail": text[-1500:]}
    return result.returncode, value


def construct():
    for name, arguments in (
        ("graph_replay.py", ["--materialize"]),
        ("bind_implementation.py", []),
        ("formal_correspondence.py", ["--write"]),
        ("bind_formal.py", []),
        ("validate.py", ["--write"]),
        ("mutations.py", ["--write"]),
        ("build_profile.py", []),
    ):
        print("Auth completion: " + name, file=sys.stderr, flush=True)
        invoke([sys.executable, "-B", str(HERE / name), *arguments])


def exact_refs(value):
    if isinstance(value, dict):
        if {"path", "sha256", "size_bytes", "location", "current"}.issubset(value):
            yield value
        else:
            for child in value.values():
                yield from exact_refs(child)
    elif isinstance(value, list):
        for child in value:
            yield from exact_refs(child)


def frozen_candidate():
    manifest = load(HERE / "INPUT-CANDIDATE.json")
    selected = [ref(REPO / row["path"]) for row in manifest["files"]]
    selected += [ref(HERE / "INPUT-CANDIDATE.json"), ref(DENOMINATOR)]
    for path in (HERE / "evf/profile.json", HERE / "evf/theorem-profile.json"):
        selected.append(ref(path))
        selected.extend(exact_refs(load(path)))
    distinct = {}
    for item in selected:
        key = (item["location"], item["path"])
        actual = ref(REPO / item["path"] if item["location"] == "repository" else item["path"])
        if actual != item:
            raise ValueError("candidate input drift:" + item["path"])
        if key in distinct and distinct[key] != item:
            raise ValueError("conflicting candidate reference:" + item["path"])
        distinct[key] = item
    payload = {
        "schema_version": "auth-complete-product-candidate/v1",
        "subject": "In-process Auth Service and socket-free Authorization API",
        "input_digest": manifest["input_digest"],
        "refs": [distinct[key] for key in sorted(distinct)],
        "scope": "Current local source, generated graphs and runtimes, proof inputs, test/provider tools, exact EVF profiles, and declared local environment.",
        "exclusions": ["credential verification", "tokens", "listener activation", "TLS/client identity", "production load fitness", "publication", "deployment"],
        "authority_effect": "none", "product_approval": "not-requested",
        "open_questions_ref": "README.md",
    }
    return {**payload, "candidate_digest": hashlib.sha256(canonical(payload)).hexdigest()}


def require_verified_aggregate(aggregate, verification):
    embedded = aggregate.get("verification_receipt", {})
    if (verification.get("schema_version") != "evf.final-verification-result/v1"
            or verification.get("verdict") != "passed"
            or verification.get("aggregate_state") != "passed"
            or verification.get("evidence_payload_digest") != aggregate.get("evidence_payload_digest")
            or verification.get("verified_stage_ids") != [f"S{i}" for i in range(13)]
            or aggregate.get("aggregate_state") != "passed"
            or embedded.get("verdict") != "passed"
            or embedded.get("all_refs_current") is not True
            or embedded.get("replay_equal") is not True):
        raise ValueError("independent EVF verification did not pass")


def run_evf(profile, name):
    binary = str(Path(os.environ["AUTH_EVF_BIN"]) / "evf-run")
    code, value = invoke([binary, "--repo-root", str(REPO), "--profile", str(profile),
                          "--store", str(HERE / "evf/runs"), "--attempt-id", name])
    if value["status"] != "passed":
        raise ValueError("EVF did not pass:" + json.dumps(value))
    evidence = Path(value["run_path"]) / "EVIDENCE.json"
    _, verification = invoke([str(Path(os.environ["AUTH_EVF_BIN"]) / "evf-independent-verifier"),
                              "--repo-root", str(REPO), "--evidence", str(evidence)])
    aggregate = load(evidence)
    require_verified_aggregate(aggregate, verification)
    save(HERE / "evf" / (name + "-verification.json"), verification)
    return {"evidence": ref(evidence), "verification": ref(HERE / "evf" / (name + "-verification.json")), "aggregate": aggregate}


def hostile_controls():
    profile = load(HERE / "evf/profile.json")
    scenarios = []
    for name, path, code in (
        ("stale-rust-projection", "AuthRustProjection.lean", "EXACT_REF_DIGEST_MISMATCH"),
        ("stale-compiler", "src/cli/main.ts", "EXACT_REF_DIGEST_MISMATCH"),
    ):
        mutant = copy.deepcopy(profile)
        targets = [r for r in mutant["binding_refs"] if r["path"].endswith(path)]
        if not targets:
            raise ValueError("missing hostile reference target:" + path)
        targets[0]["sha256"] = "0" * 64
        scenarios.append((name, mutant, code))
    for name, key, value, code in (
        ("denominator-drift", "obligation_denominator", 999, "OBLIGATION_DENOMINATOR_MISMATCH"),
        ("empty-denominator", "obligation_ids", [], "OBLIGATION_DENOMINATOR_MISMATCH"),
        ("zero-observations", "repetitions", 0, "PROFILE_REPETITION_DENOMINATOR_INVALID"),
    ):
        mutant = copy.deepcopy(profile); mutant[key] = value
        scenarios.append((name, mutant, code))
    mutant = copy.deepcopy(profile)
    mutant["stages"][0], mutant["stages"][1] = mutant["stages"][1], mutant["stages"][0]
    scenarios.append(("unordered-lineage", mutant, "PROFILE_STAGE_ORDER_INVALID"))
    expected = profile["checks"][0]["expected_output"]
    for name, code in (
        ("extra-provider-field", "print(" + repr(json.dumps({**expected, "extra": True})) + ")"),
        ("malformed-provider-output", "print('{')"),
        ("truncated-provider-output", "print('{\"status\":',end='')"),
        ("provider-crash", "raise SystemExit(7)"),
        ("caller-supplied-pass", "print('{\"status\":\"PASS\"}')"),
        ("surviving-mutant", "print(" + repr(json.dumps(expected)) + ")"),
    ):
        mutant = copy.deepcopy(profile)
        mutant["checks"][0]["runtime"]["argv"] = ["-c", code]
        # These diagnostic providers execute Python only.
        mutant["checks"][0]["runtime"]["tool_refs"] = []
        scenarios.append((name, mutant, "failed-aggregate"))
    observations = []
    hostile_root = HERE / "evf/hostile"
    hostile_root.mkdir(parents=True, exist_ok=True)
    with nullcontext(tempfile.mkdtemp(prefix="attempt-", dir=hostile_root)) as directory:
        for name, profile_value, expected_failure in scenarios:
            path = Path(directory) / (name + ".json")
            save(path, profile_value)
            _, result = invoke([str(Path(os.environ["AUTH_EVF_BIN"]) / "evf-run"), "--repo-root", str(REPO),
                                "--profile", str(path), "--store", str(Path(directory) / "runs"), "--attempt-id", name], False)
            detected = (result.get("status") == "failed" if expected_failure == "failed-aggregate"
                        else result.get("reason_code") == expected_failure and result.get("status") == "blocked")
            result_path = Path(directory) / (name + "-result.json")
            save(result_path, result)
            observations.append({"id": name, "state": "pass" if detected else "fail", "expected": expected_failure,
                                 "actual": {k: v for k, v in result.items() if k != "run_path"},
                                 "profile_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                                 "profile_ref": ref(path), "result_ref": ref(result_path)})
    if not all(item["state"] == "pass" for item in observations):
        save(HERE / "HOSTILE-CONTROLS.json", {"status": "non-pass", "observations": observations})
        raise ValueError("hostile profile control did not reject its fault")
    result = {"status": "pass", "observations": observations, "authority_effect": "none", "open_questions_ref": "README.md"}
    save(HERE / "HOSTILE-CONTROLS.json", result)
    return result


def product_checks(local, executable, theorem, hostile, freeze_evidence):
    checks = {row["id"]: row for row in local["checks"]}
    def passed(name):
        return checks.get(name, {}).get("status") == "pass"
    def rust_test(crate, name):
        check = checks.get(crate + "/tests", {})
        if check.get("status") != "pass":
            return False
        path = HERE / "evidence" / local["input_digest"] / (check["log_sha256"] + ".log")
        return re.search(r"^test " + re.escape(name) + r" \.\.\. ok$", path.read_text(), re.M) is not None
    negative = {row["id"]: row["state"] == "pass" for row in hostile["observations"]}
    behavior = load(HERE / "MUTATION-RESULT.json")
    mutations = {row["id"]: row["state"] == "killed-for-declared-cause" for row in behavior["observations"]}
    if behavior["runner_sha256"] != ref(HERE / "mutations.py")["sha256"]:
        raise ValueError("stale mutation runner")
    if any(ref(HERE.parents[2] / "implementation" / row["path"])["sha256"] != row["sha256"] for row in behavior["implementation_inputs"]):
        raise ValueError("stale behavioral mutation evidence")
    e0 = {
        "ALLOW-COMPLETE": "one_complete_epoch_allows",
        "DENY-MISSING-EVIDENCE": "missing_untrusted_revoked_or_disabled_trusted_input_denies",
        "DENY-DUPLICATE-EVIDENCE": "duplicate_trusted_input_rows_deny",
        "DENY-INVALID-EVIDENCE": "missing_untrusted_revoked_or_disabled_trusted_input_denies",
        "DENY-MISSING-ROUTE": "missing_untrusted_revoked_or_disabled_trusted_input_denies",
        "DENY-DUPLICATE-ROUTE": "duplicate_trusted_input_rows_deny",
        "DENY-INACTIVE-ROUTE": "missing_untrusted_revoked_or_disabled_trusted_input_denies",
        "DENY-SUBJECT-MISMATCH": "subject_and_revision_join_failures_deny",
        "DENY-SESSION-REVISION": "subject_and_revision_join_failures_deny",
        "DENY-ROLE-REVISION": "subject_and_revision_join_failures_deny",
        "DENY-GRANT-REVISION": "subject_and_revision_join_failures_deny",
        "DENY-PERMISSION-MISMATCH": "permission_and_scope_evidence_mismatches_deny",
        "DENY-SCOPE-EVIDENCE": "permission_and_scope_evidence_mismatches_deny",
        "DENY-PROVIDER-FAILURE": "clock_and_live_provider_failures_deny",
        "DENY-TRANSACTION-FAILURE": "tests::transaction_begin_and_end_failures_deny",
    }
    outcomes = {"AUTH-E0-" + key: rust_test("authorization-service", value) for key, value in e0.items()}
    outcomes.update({"AUTH-E1-" + key: value for key, value in {
        "DOMAINSPEC-REPLAY": passed("compiled-graph-replay"), "GENERATED-RUST-REPLAY": passed("generated-replay"),
        "IMPLEMENTATION-MAP": passed("implementation-map-current"),
        "CANDIDATE-REPLAY": freeze_evidence["reproduced"], "TOOLCHAIN-CURRENT": freeze_evidence["current"],
        "STALE-INPUT-REJECTION": negative["stale-rust-projection"] and negative["stale-compiler"],
    }.items()})
    outcomes.update({"AUTH-E2-" + key: value for key, value in {
        "SEAM-BINDING": negative["stale-rust-projection"],
        "SEAM-DERIVATION": passed("evidence-provider-contract-tests") and negative["denominator-drift"],
        "SEAM-LINEAGE": negative["unordered-lineage"], "SEAM-OBSERVATION": negative["zero-observations"],
        "SEAM-PROVIDER": negative["extra-provider-field"] and negative["provider-crash"],
        "SEAM-SCOPE": mutations["caller-authority"], "SEAM-SEMANTIC": mutations["relaxed-currentness"],
        "NONEMPTY-DENOMINATOR": negative["empty-denominator"],
        "OBSERVATION-CARDINALITY": executable["aggregate"]["denominator"] == {"stages": 13, "checks": 1, "mutations": 7},
        "SURVIVOR-REJECTION": negative["surviving-mutant"], "ZERO-ROW-REJECTION": negative["zero-observations"],
        "CALLER-PASS-REJECTION": negative["caller-supplied-pass"], "STALE-BYTE-REJECTION": negative["stale-rust-projection"],
    }.items()})
    for suffix, check in {
        "AUTHORIZATION-CHARACTERIZATION": "exact-permission-policy-lemmas", "EXACT-MISMATCH-DENY": "exact-permission-policy-lemmas",
        "KERNEL-REGRESSION": "standard-runtime/tests", "ADAPTER-REGRESSION": "runtime-adapter/tests",
        "AUTHORIZATION-PROVIDER-REGRESSION": "sqlite-provider/tests", "TRUSTED-BOUNDARY-REGRESSION": "trusted-boundary/tests",
        "TRUSTED-INPUT-REGRESSION": "trusted-input-provider/tests", "SERVICE-REGRESSION": "authorization-service/tests",
    }.items():
        outcomes["AUTH-E3-" + suffix] = passed(check)
    outcomes["AUTH-E3-STALE-PROJECTION-REJECTION"] = negative["stale-rust-projection"] and passed("auth-rust-structural-correspondence")
    expected = {c["test_id"] for branch in load(DENOMINATOR)["branches"] for c in branch["checks"]}
    if len(expected) != 43 or set(outcomes) != expected:
        raise ValueError("complete service test denominator does not close")
    for suffix, test in {
        "BOUNDARY": "caller_authority_fields_are_rejected_before_engine_dispatch",
        "CONCURRENCY": "distinct_pool_engines_execute_authorizations_in_parallel",
        "TIMEOUT": "evaluation_timeout_returns_504_deny_and_worker_finishes_safely",
        "SATURATION": "pool_saturation_returns_503_deny_with_bounded_wait",
        "SQL-BINDING": "sql_injection_payloads_are_bound_values_and_leave_schema_intact",
    }.items():
        outcomes["AUTH-API-" + suffix] = rust_test("authorization-api", test)
    if theorem["aggregate"]["denominator"] != {"stages": 13, "checks": 3, "mutations": 1}:
        raise ValueError("theorem denominator mismatch")
    return [{"test_id": key, "state": "pass" if value else "fail"} for key, value in sorted(outcomes.items())]


def main():
    construct()
    candidate = frozen_candidate()
    if candidate != frozen_candidate():
        raise ValueError("candidate freeze did not reproduce")
    immutable = HERE / "candidates" / candidate["candidate_digest"] / "PRODUCT-CANDIDATE.json"
    if immutable.exists() and load(immutable) != candidate:
        raise ValueError("immutable candidate collision")
    save(immutable, candidate)
    save(HERE / "PRODUCT-CANDIDATE.json", candidate)
    attempt = candidate["candidate_digest"][:16]
    print("Auth completion: executable EVF", file=sys.stderr, flush=True)
    executable = run_evf(HERE / "evf/profile.json", "executable-" + attempt)
    print("Auth completion: theorem EVF", file=sys.stderr, flush=True)
    theorem = run_evf(HERE / "evf/theorem-profile.json", "theorem-" + attempt)
    print("Auth completion: hostile profile controls", file=sys.stderr, flush=True)
    hostile = hostile_controls()
    if frozen_candidate() != candidate:
        raise ValueError("frozen candidate changed during product tests")
    local = load(HERE / "LOCAL-VALIDATION.json")
    checks = product_checks(local, executable, theorem, hostile, {"reproduced": True, "current": True})
    eligible = local["local_validation"] == "pass" and all(row["state"] == "pass" for row in checks)
    result = {
        "schema_version": "auth-complete-product-test-result/v1", "candidate_digest": candidate["candidate_digest"],
        "candidate_ref": ref(immutable), "required_checks": checks, "required_check_count": len(checks),
        "local_validation_ref": ref(HERE / "LOCAL-VALIDATION.json"), "behavioral_mutations_ref": ref(HERE / "MUTATION-RESULT.json"),
        "hostile_controls_ref": ref(HERE / "HOSTILE-CONTROLS.json"),
        "executable_evidence_ref": executable["evidence"], "executable_verification_ref": executable["verification"],
        "theorem_evidence_ref": theorem["evidence"], "theorem_verification_ref": theorem["verification"],
        "status": "pass" if eligible else "non-pass", "product_approval_eligible": eligible,
        "product_approval": "not-requested", "authority_effect": "none", "open_questions_ref": "README.md",
        "claim_ceiling": "Current local evidence for one exact Auth Service/API candidate. Bounded policy and structural theorems are not universal compiler or runtime proofs. Product approval and all operational decisions remain separate.",
    }
    save(HERE / "PRODUCT-TEST-RESULT.json", result)
    if not eligible:
        raise ValueError("complete product-test join did not pass")
    print(json.dumps({"status": "pass", "candidate_digest": candidate["candidate_digest"], "rust_tests": local["rust_test_count"], "required_checks": len(checks), "product_approval_eligible": True}, sort_keys=True))


if __name__ == "__main__":
    main()
