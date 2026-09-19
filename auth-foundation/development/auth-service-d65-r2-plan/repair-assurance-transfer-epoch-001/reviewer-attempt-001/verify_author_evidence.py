#!/usr/bin/env python3
"""Independent structural and raw-evidence verification for the sealed Auth epoch."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
EPOCH = HERE.parent
REPO = Path("/home/vrondelli/projects/domainspec-core")
IMPL = REPO / "projects/auth-foundation/implementation"
EXPECTED_MANIFEST_SHA = "64c93f2e8d31cc7c51ff412b721d41462979075724186ba6af4f6bccc5099f9a"
STAGES = [f"S{i}" for i in range(13)]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path):
    return json.loads(path.read_text())


def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


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


def resolve(ref: dict) -> Path:
    return REPO / ref["path"] if ref["location"] == "repository" else Path(ref["path"])


errors: list[str] = []
facts: dict = {}


def require(condition: bool, message: str):
    if not condition:
        errors.append(message)


manifest_path = EPOCH / "AUTHOR-MANIFEST.json"
require(sha(manifest_path) == EXPECTED_MANIFEST_SHA, "AUTHOR-MANIFEST digest mismatch")
manifest = load(manifest_path)
require(len(manifest["files"]) == 18, "author manifest does not contain 18 refs")
for item in manifest["files"]:
    path = EPOCH / item["path"]
    require(path.is_file(), f"manifest ref missing: {item['path']}")
    if path.is_file():
        require(sha(path) == item["sha256"], f"manifest digest mismatch: {item['path']}")
        require(path.stat().st_size == item["size_bytes"], f"manifest size mismatch: {item['path']}")
facts["author_manifest_refs_verified"] = len(manifest["files"]) if not errors else 0

candidate = load(EPOCH / "PRODUCT-CANDIDATE.json")
payload = {key: value for key, value in candidate.items() if key != "candidate_digest"}
derived_candidate_digest = hashlib.sha256(canonical(payload)).hexdigest()
require(derived_candidate_digest == candidate["candidate_digest"], "candidate digest does not reproduce")
require(candidate["authority_effect"] == "none", "candidate authority effect is not none")
require(candidate["product_approval"] == "not-requested", "candidate product approval posture changed")

ref_sources = [
    ("PRODUCT-CANDIDATE.json", candidate),
    ("PRODUCT-TEST-RESULT.json", load(EPOCH / "PRODUCT-TEST-RESULT.json")),
    ("HOSTILE-CONTROLS.json", load(EPOCH / "HOSTILE-CONTROLS.json")),
    ("evf/profile.json", load(EPOCH / "evf/profile.json")),
    ("evf/theorem-profile.json", load(EPOCH / "evf/theorem-profile.json")),
]
seen = {}
for source_name, value in ref_sources:
    for ref in exact_refs(value):
        key = (ref["location"], ref["path"])
        path = resolve(ref)
        require(ref["current"] is True, f"ref not marked current in {source_name}: {ref['path']}")
        require(path.is_file(), f"exact ref missing from {source_name}: {ref['path']}")
        if path.is_file():
            require(sha(path) == ref["sha256"], f"exact ref digest mismatch from {source_name}: {ref['path']}")
            require(path.stat().st_size == ref["size_bytes"], f"exact ref size mismatch from {source_name}: {ref['path']}")
        if key in seen:
            require(seen[key] == ref, f"conflicting exact ref: {ref['path']}")
        seen[key] = ref
facts["distinct_exact_refs_verified"] = len(seen)

product = load(EPOCH / "PRODUCT-TEST-RESULT.json")
require(product["candidate_digest"] == candidate["candidate_digest"], "result candidate digest mismatch")
candidate_ref_value = load(resolve(product["candidate_ref"]))
require(candidate_ref_value == candidate, "immutable candidate ref differs from PRODUCT-CANDIDATE")
checks = product["required_checks"]
require(product["required_check_count"] == 48 == len(checks), "required product check count is not 48")
require(len({row["test_id"] for row in checks}) == 48, "product check IDs are not unique")
require(all(row["state"] == "pass" for row in checks), "one or more product checks is non-pass")

local = load(EPOCH / "LOCAL-VALIDATION.json")
require(local["local_validation"] == "pass", "local validation is non-pass")
require(local["rust_test_count"] == 64, "declared Rust test count is not 64")
require(sum(row.get("passed_tests", 0) for row in local["checks"]) == 64,
        "raw local check test counts do not sum to 64")
require(len(local["checks"]) == 42 and all(row["status"] == "pass" for row in local["checks"]),
        "local check set is not 42/42 pass")
log_root = EPOCH / "evidence" / local["input_digest"]
logs_verified = 0
for check in local["checks"]:
    if check.get("log_sha256"):
        path = log_root / (check["log_sha256"] + ".log")
        require(path.is_file(), f"local validation log missing: {check['id']}")
        if path.is_file():
            require(sha(path) == check["log_sha256"], f"local validation log digest mismatch: {check['id']}")
            logs_verified += 1
        require(check.get("exit_code") == 0, f"local command exit nonzero: {check['id']}")
facts["local_validation_logs_verified"] = logs_verified


def rust_test(crate: str, test_name: str) -> bool:
    check = next(row for row in local["checks"] if row["id"] == crate + "/tests")
    path = log_root / (check["log_sha256"] + ".log")
    return re.search(r"^test " + re.escape(test_name) + r" \.\.\. ok$", path.read_text(), re.M) is not None


def passed(check_id: str) -> bool:
    return any(row["id"] == check_id and row["status"] == "pass" for row in local["checks"])


mutation = load(EPOCH / "MUTATION-RESULT.json")
require(mutation["status"] == "pass", "mutation report is non-pass")
require(mutation["runner_sha256"] == sha(EPOCH / "mutations.py"), "mutation runner digest mismatch")
require(len(mutation["denominator"]) == 6 == len(mutation["observations"]), "mutation denominator is not six")
require(mutation["source_unchanged"] is True, "mutation report source_unchanged is not true")
mutation_map = {}
mutation_logs_verified = 0
for row in mutation["observations"]:
    require(row["id"] in mutation["denominator"], f"mutation outside denominator: {row['id']}")
    require(row["state"] == "killed-for-declared-cause", f"mutant not killed for declared cause: {row['id']}")
    require(row["neutral_runs"] == 2 and row["neutral_passed"] is True, f"neutral pair failed: {row['id']}")
    target = IMPL / row["target"]
    require(sha(target) == row["before_sha256"], f"current source differs from mutation before hash: {row['id']}")
    for label, log_ref in row["logs"].items():
        path = EPOCH / "mutation-logs" / (log_ref["sha256"] + ".log")
        require(path.is_file(), f"mutation log missing: {row['id']}/{label}")
        if path.is_file():
            text = path.read_text(errors="replace")
            require(sha(path) == log_ref["sha256"], f"mutation log digest mismatch: {row['id']}/{label}")
            if label.startswith("neutral"):
                require(log_ref["exit_code"] == 0 and "1 passed; 0 failed; 0 ignored" in text,
                        f"neutral raw log is not a one-test pass: {row['id']}/{label}")
            elif label == "build":
                require(log_ref["exit_code"] == 0, f"mutant build failed: {row['id']}")
            elif label == "mutant":
                require(log_ref["exit_code"] == 101, f"mutant exit is not Cargo test failure: {row['id']}")
                require(row["oracle_marker"] in text, f"declared marker absent from mutant log: {row['id']}")
                require(f"test {row['oracle_test']} ... FAILED" in text, f"declared test absent from mutant log: {row['id']}")
                require("0 passed; 1 failed; 0 ignored" in text, f"mutant log is not exactly one failed test: {row['id']}")
            mutation_logs_verified += 1
    mutation_map[row["id"]] = row["state"] == "killed-for-declared-cause"
facts["mutation_logs_verified"] = mutation_logs_verified

inventory = []
for path in sorted(IMPL.rglob("*")):
    if path.is_file() and not {"target", "__pycache__", ".runtime"}.intersection(path.relative_to(IMPL).parts):
        inventory.append({"path": str(path.relative_to(IMPL)), "sha256": sha(path)})
require(inventory == mutation["implementation_inputs"], "current implementation inventory differs from mutation input inventory")

hostile = load(EPOCH / "HOSTILE-CONTROLS.json")
require(hostile["status"] == "pass", "hostile control aggregate is non-pass")
require(len(hostile["observations"]) == 12, "hostile denominator is not twelve")
negative = {}
for row in hostile["observations"]:
    require(row["state"] == "pass", f"hostile control non-pass: {row['id']}")
    raw = load(resolve(row["result_ref"]))
    reduced = {key: value for key, value in raw.items() if key != "run_path"}
    require(reduced == row["actual"], f"hostile raw result differs from recorded actual: {row['id']}")
    detected = (raw.get("status") == "failed" if row["expected"] == "failed-aggregate"
                else raw.get("status") == "blocked" and raw.get("reason_code") == row["expected"])
    require(detected, f"hostile raw result did not detect expected fault: {row['id']}")
    negative[row["id"]] = detected

aggregates = {}
for route in ("executable", "theorem"):
    evidence_ref = product[f"{route}_evidence_ref"]
    verification_ref = product[f"{route}_verification_ref"]
    evidence = load(resolve(evidence_ref))
    verification = load(resolve(verification_ref))
    require(evidence["aggregate_state"] == "passed", f"{route} EVF aggregate is non-pass")
    require(verification["verdict"] == "passed" and verification["aggregate_state"] == "passed",
            f"{route} EVF verification is non-pass")
    require(verification["verified_stage_ids"] == STAGES, f"{route} EVF does not verify S0-S12 exactly")
    require(verification["evidence_payload_digest"] == evidence["evidence_payload_digest"],
            f"{route} EVF payload digest mismatch")
    receipt = evidence.get("verification_receipt", {})
    require(receipt.get("verdict") == "passed" and receipt.get("all_refs_current") is True
            and receipt.get("replay_equal") is True, f"{route} EVF embedded verification receipt incomplete")
    aggregates[route] = evidence

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
    "DOMAINSPEC-REPLAY": passed("compiled-graph-replay"),
    "GENERATED-RUST-REPLAY": passed("generated-replay"),
    "IMPLEMENTATION-MAP": passed("implementation-map-current"),
    "CANDIDATE-REPLAY": derived_candidate_digest == candidate["candidate_digest"],
    "TOOLCHAIN-CURRENT": all(resolve(ref).is_file() and sha(resolve(ref)) == ref["sha256"] for ref in candidate["refs"]),
    "STALE-INPUT-REJECTION": negative["stale-rust-projection"] and negative["stale-compiler"],
}.items()})
outcomes.update({"AUTH-E2-" + key: value for key, value in {
    "SEAM-BINDING": negative["stale-rust-projection"],
    "SEAM-DERIVATION": passed("evidence-provider-contract-tests") and negative["denominator-drift"],
    "SEAM-LINEAGE": negative["unordered-lineage"],
    "SEAM-OBSERVATION": negative["zero-observations"],
    "SEAM-PROVIDER": negative["extra-provider-field"] and negative["provider-crash"],
    "SEAM-SCOPE": mutation_map["caller-authority"],
    "SEAM-SEMANTIC": mutation_map["relaxed-currentness"],
    "NONEMPTY-DENOMINATOR": negative["empty-denominator"],
    "OBSERVATION-CARDINALITY": aggregates["executable"]["denominator"] == {"stages": 13, "checks": 1, "mutations": 7},
    "SURVIVOR-REJECTION": negative["surviving-mutant"],
    "ZERO-ROW-REJECTION": negative["zero-observations"],
    "CALLER-PASS-REJECTION": negative["caller-supplied-pass"],
    "STALE-BYTE-REJECTION": negative["stale-rust-projection"],
}.items()})
for suffix, check_id in {
    "AUTHORIZATION-CHARACTERIZATION": "exact-permission-policy-lemmas",
    "EXACT-MISMATCH-DENY": "exact-permission-policy-lemmas",
    "KERNEL-REGRESSION": "standard-runtime/tests",
    "ADAPTER-REGRESSION": "runtime-adapter/tests",
    "AUTHORIZATION-PROVIDER-REGRESSION": "sqlite-provider/tests",
    "TRUSTED-BOUNDARY-REGRESSION": "trusted-boundary/tests",
    "TRUSTED-INPUT-REGRESSION": "trusted-input-provider/tests",
    "SERVICE-REGRESSION": "authorization-service/tests",
}.items():
    outcomes["AUTH-E3-" + suffix] = passed(check_id)
outcomes["AUTH-E3-STALE-PROJECTION-REJECTION"] = negative["stale-rust-projection"] and passed("auth-rust-structural-correspondence")
for suffix, test_name in {
    "BOUNDARY": "caller_authority_fields_are_rejected_before_engine_dispatch",
    "CONCURRENCY": "distinct_pool_engines_execute_authorizations_in_parallel",
    "TIMEOUT": "evaluation_timeout_returns_504_deny_and_worker_finishes_safely",
    "SATURATION": "pool_saturation_returns_503_deny_with_bounded_wait",
    "SQL-BINDING": "sql_injection_payloads_are_bound_values_and_leave_schema_intact",
}.items():
    outcomes["AUTH-API-" + suffix] = rust_test("authorization-api", test_name)
reported = {row["test_id"]: row["state"] == "pass" for row in checks}
require(len(outcomes) == 48, "independently derived product outcome set is not 48")
require(outcomes == reported, "reported 48 product checks differ from raw-evidence derivation")
require(all(outcomes.values()), "one or more independently derived product checks is non-pass")
facts["product_checks_rederived_from_raw_evidence"] = sum(outcomes.values())
facts["behavioral_mutants_killed"] = sum(mutation_map.values())
facts["neutral_passes_verified"] = 12
facts["hostile_controls_verified"] = sum(negative.values())
facts["evf_routes_verified_with_S0_S12"] = 2
facts["candidate_digest"] = candidate["candidate_digest"]

counter = load(EPOCH / "counterexamples/mutation-copy-runtime-state.json")
stderr = (EPOCH / "counterexamples/mutation-copy-runtime-state.stderr.log").read_text()
exit_code = int((EPOCH / "counterexamples/mutation-copy-runtime-state.exit-code").read_text())
runner_text = (EPOCH / "mutations.py").read_text()
test_text = (EPOCH / "test_mutations.py").read_text()
require(counter["counterexample_id"] == "AUTH-TRANSFER-PIPELINE-COPY-001", "counterexample ID mismatch")
require(exit_code == 1 and "shutil.Error" in stderr, "counterexample is not a copytree shutil.Error")
require("/.runtime/" in stderr and "sock'" in stderr, "counterexample stderr does not contain runtime socket failures")
require('IGNORED_COPY_PARTS = {"target", "__pycache__", ".runtime"}' in runner_text,
        "repaired runner lacks shared runtime exclusion")
require("ignore=COPY_IGNORE" in runner_text and "not IGNORED_COPY_PARTS.intersection" in runner_text,
        "shared exclusion does not govern both copy and inventory")
require("test_copy_excludes_ephemeral_runtime_state" in test_text, "copy repair regression test missing")
facts["real_counterexample_verified"] = counter["counterexample_id"]
facts["counterexample_class"] = "evidence-pipeline copy-boundary defect"
facts["seeded_product_mutants"] = list(mutation["denominator"])

result = {
    "schema_version": "auth-repair-assurance-independent-structural-review/v1",
    "status": "pass" if not errors else "non-pass",
    "authority_effect": "none",
    "facts": facts,
    "errors": errors,
    "claim_ceiling": "Independent local replay and integrity evidence for the sealed epoch only; no product approval, admission, publication, release, deployment, universal compiler proof, or arbitrary authorization proof.",
}
print(json.dumps(result, indent=2, sort_keys=True))
raise SystemExit(0 if not errors else 1)
