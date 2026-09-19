#!/usr/bin/env python3
"""Join the fresh reviewer replay to the sealed author result without modifying it."""

import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
EPOCH = HERE.parent


def load(path):
    return json.loads(Path(path).read_text())


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


errors = []


def require(condition, message):
    if not condition:
        errors.append(message)


author = load(EPOCH / "MUTATION-RESULT.json")
fresh = load(HERE / "mutation-replay.stdout.json")
toolchain_fresh = load(HERE / "mutation-replay-toolchain.stdout.json")
require(fresh.get("status") == "pass", "fresh mutation campaign is non-pass")
require(len(fresh.get("observations", [])) == 6, "fresh campaign did not produce six observations")
author_by_id = {row["id"]: row for row in author["observations"]}
fresh_by_id = {row["id"]: row for row in fresh["observations"]}
require(set(fresh_by_id) == set(author["denominator"]) == set(author_by_id), "fresh mutation denominator differs")
fields = ["id", "state", "expected_cause", "oracle_test", "oracle_marker", "neutral_runs",
          "neutral_passed", "target", "before_sha256", "after_sha256"]
for case_id in sorted(author_by_id):
    require({key: fresh_by_id[case_id].get(key) for key in fields} ==
            {key: author_by_id[case_id].get(key) for key in fields},
            f"fresh semantic observation differs for {case_id}")
    require(all(fresh_by_id[case_id]["logs"][label]["exit_code"] == expected for label, expected in
                (("neutral-1", 0), ("neutral-2", 0), ("build", 0), ("mutant", 101))),
            f"fresh exit-code pattern differs for {case_id}")
require((HERE / "source-before.sha256").read_bytes() == (HERE / "source-after.sha256").read_bytes(),
        "source inventory changed during fresh replay")
require((HERE / "source-toolchain-before.sha256").read_bytes() ==
        (HERE / "source-toolchain-after.sha256").read_bytes(),
        "source inventory changed during mandated-toolchain replay")
require([{key: row.get(key) for key in fields} for row in toolchain_fresh.get("observations", [])] ==
        [{key: row.get(key) for key in fields} for row in fresh.get("observations", [])],
        "mandated-toolchain replay semantic observations differ from package-bound replay")
require(toolchain_fresh.get("status") == "pass", "mandated-toolchain mutation replay is non-pass")

regression = (HERE / "regression-tests-attempt-002.stderr.log").read_text()
require("Ran 10 tests" in regression and regression.rstrip().endswith("OK"), "corrected package regression run is non-pass")
require("ModuleNotFoundError" in (HERE / "regression-tests-attempt-001.stderr.log").read_text(),
        "reviewer harness attempt-001 failure was not preserved")

for route in ("executable", "theorem"):
    fresh_verification = load(HERE / f"{route}-verifier.stdout.json")
    stored_verification = load(EPOCH / "evf" / f"{route}-3ed9cbef5a9e0eae-verification.json")
    require(fresh_verification == stored_verification, f"fresh {route} verifier output differs from sealed output")
    require(fresh_verification["verified_stage_ids"] == [f"S{i}" for i in range(13)],
            f"fresh {route} verification does not contain exact S0-S12")

counter = load(HERE / "copy-counterexample-replay.json")
require(counter.get("status") == "pass", "minimal copy-boundary counterexample replay is non-pass")
historical = EPOCH.parent / "completion-v1/mutations.py"
require(sha(historical) == "3489a5af44d50d9c2267e1654ee35f2f4c8b1c13f68c212a2d8f3c934489e034",
        "historical completion-v1 runner differs from recorded pre-repair hash")

result = {
    "schema_version": "auth-repair-assurance-independent-fresh-replay/v1",
    "status": "pass" if not errors else "non-pass",
    "authority_effect": "none",
    "fresh_behavioral_mutants_killed": sum(row.get("state") == "killed-for-declared-cause" for row in fresh.get("observations", [])),
    "mandated_toolchain_behavioral_mutants_killed": sum(row.get("state") == "killed-for-declared-cause" for row in toolchain_fresh.get("observations", [])),
    "fresh_neutral_passes": sum(row.get("neutral_runs", 0) for row in fresh.get("observations", []) if row.get("neutral_passed")),
    "fresh_evf_verifications": 2,
    "fresh_package_regression_tests": 10,
    "source_unchanged": not errors or (HERE / "source-before.sha256").read_bytes() == (HERE / "source-after.sha256").read_bytes(),
    "counterexample_mechanism_reproduced": counter.get("status") == "pass",
    "errors": errors,
    "claim_ceiling": "Fresh replay evidence for the sealed epoch's declared campaign and verifier inputs only; no product approval or operational authority.",
}
print(json.dumps(result, indent=2, sort_keys=True))
raise SystemExit(0 if not errors else 1)
