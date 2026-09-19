#!/usr/bin/env python3
"""Run cause-specific Auth mutations in disposable copies of the implementation."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


HERE = Path(__file__).resolve().parent
IMPL = HERE.parents[2] / "implementation"
CASES = [
    {
        "id": "second-connection", "path": "authorization-service/src/lib.rs",
        "old": "    let authorization_state =\n        match resolve_authorization_state_in_transaction(epoch.transaction(), &kernel_command) {",
        "new": "    let mut split_connection = Connection::open(epoch.transaction().path().expect(\"database path\")).expect(\"second connection\");\n    let split_transaction = split_connection.transaction().expect(\"second transaction\");\n    let authorization_state =\n        match resolve_authorization_state_in_transaction(&split_transaction, &kernel_command) {",
        "crate": "authorization-service", "target": ["--lib"],
        "test": "tests::one_sqlite_snapshot_survives_a_concurrent_writer_and_retry_gets_a_new_view",
        "marker": "AUTH_EPOCH_SNAPSHOT_SPLIT", "cause": "AUTH_EPOCH_TRANSACTION_SPLIT",
    },
    {
        "id": "caller-authority", "path": "authorization-api/src/lib.rs",
        "old": "#[serde(deny_unknown_fields)]\nstruct AuthorizationApiRequest",
        "new": "struct AuthorizationApiRequest",
        "crate": "authorization-api", "target": ["--test", "http_api"],
        "test": "caller_authority_fields_are_rejected_before_engine_dispatch",
        "marker": "AUTH_CALLER_AUTHORITY_ACCEPTED", "cause": "CALLER_AUTHORITY_FIELD_ACCEPTED",
    },
    {
        "id": "relaxed-currentness", "path": "trusted-input-provider/src/lib.rs",
        "old": "\n                expires_at: to_u64(expires_at)?,",
        "new": "\n                expires_at: to_u64(expires_at)?.saturating_add(1),",
        "crate": "authorization-service", "target": ["--test", "integration"],
        "test": "authentication_expiry_is_exclusive",
        "marker": "AUTH_EXPIRED_EVIDENCE_ACCEPTED", "cause": "STALE_OR_REVOKED_EVIDENCE_SURVIVED",
    },
    {
        "id": "missing-authorization-revision", "path": "sqlite-provider/src/lib.rs",
        "old": '"SELECT revision\n                 FROM auth_authorization_revisions\n                 WHERE session_id = ?1"',
        "new": '"SELECT authorization_revision\n                 FROM auth_sessions\n                 WHERE session_id = ?1 LIMIT 1"',
        "crate": "authorization-service", "target": ["--test", "integration"],
        "test": "missing_authorization_revision_denies",
        "marker": "AUTH_MISSING_REVISION_ACCEPTED", "cause": "AUTHORIZATION_REVISION_JOIN_REMOVED",
    },
    {
        "id": "duplicate-scope-evidence", "path": "sqlite-provider/src/lib.rs",
        "old": "        Ok(count == 1)", "new": "        Ok(count >= 1)",
        "crate": "authorization-service", "target": ["--test", "integration"],
        "test": "duplicate_scope_evidence_denies",
        "marker": "AUTH_DUPLICATE_SCOPE_ACCEPTED", "cause": "DUPLICATE_SCOPE_EVIDENCE_SURVIVED",
    },
    {
        "id": "early-transaction-end", "path": "authorization-service/src/lib.rs",
        "old": "    after_trusted_input(epoch.transaction());",
        "new": '    epoch.transaction().execute_batch("ROLLBACK; BEGIN DEFERRED;").expect("premature transaction end");\n    after_trusted_input(epoch.transaction());',
        "crate": "authorization-service", "target": ["--lib"],
        "test": "tests::one_sqlite_snapshot_survives_a_concurrent_writer_and_retry_gets_a_new_view",
        "marker": "AUTH_EPOCH_SNAPSHOT_SPLIT", "cause": "AUTH_TRANSACTION_ENDED_EARLY",
    },
]

IGNORED_COPY_PARTS = {"target", "__pycache__", ".runtime"}
COPY_IGNORE = shutil.ignore_patterns(*sorted(IGNORED_COPY_PARTS))


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def inventory(root: Path) -> list[dict]:
    return [{"path": str(p.relative_to(root)), "sha256": digest(p.read_bytes())}
            for p in sorted(root.rglob("*")) if p.is_file()
            and not IGNORED_COPY_PARTS.intersection(p.relative_to(root).parts)]


def invoke(argv: list[str], environment: dict) -> dict:
    try:
        result = subprocess.run(argv, env=environment, capture_output=True, text=True, timeout=300)
        return {"exit_code": result.returncode, "output": result.stdout + "\n" + result.stderr}
    except (OSError, subprocess.TimeoutExpired) as error:
        return {"exit_code": None, "output": str(error)}


def adjudicate(case: dict, build: dict, test: dict, mutated: bool) -> str:
    if not mutated or build["exit_code"] != 0:
        return "not_evaluable"
    output = test["output"]
    if (test["exit_code"] == 101 and case["marker"] in output
            and f"test {case['test']} ... FAILED" in output
            and "0 passed; 1 failed; 0 ignored" in output):
        return "killed-for-declared-cause"
    if test["exit_code"] == 0 and "1 passed; 0 failed; 0 ignored" in output:
        return "survived"
    return "not_evaluable"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--case", choices=[case["id"] for case in CASES])
    args = parser.parse_args()
    if args.case and args.write:
        parser.error("partial runs cannot overwrite the complete campaign report")
    selected = [case for case in CASES if not args.case or case["id"] == args.case]
    before = inventory(IMPL)
    results = []
    raw = {}
    with tempfile.TemporaryDirectory(prefix="auth-mutations-") as directory:
        scratch = Path(directory)
        env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
        env.setdefault("CARGO_TARGET_DIR", str(scratch / "target"))
        for case in selected:
            root = scratch / case["id"]
            shutil.copytree(IMPL, root, ignore=COPY_IGNORE)
            path = root / case["path"]
            source = path.read_text()
            if source.count(case["old"]) != 1:
                results.append({"id": case["id"], "state": "not_evaluable", "reason": "mutation anchor is not unique"})
                continue
            base = ["cargo", "test", "--locked", "--offline", "--manifest-path",
                    str(root / case["crate"] / "Cargo.toml"), *case["target"]]
            neutral = [invoke([*base, case["test"], "--", "--exact", "--nocapture"], env) for _ in range(2)]
            neutral_ok = all(r["exit_code"] == 0 and "1 passed; 0 failed; 0 ignored" in r["output"] for r in neutral)
            mutated = source.replace(case["old"], case["new"])
            path.write_text(mutated)
            build = invoke([*base, "--no-run"], env)
            test = invoke([*base, case["test"], "--", "--exact", "--nocapture"], env) if build["exit_code"] == 0 else {"exit_code": None, "output": "build failed; mutant not run"}
            state = adjudicate(case, build, test, source != mutated) if neutral_ok else "not_evaluable"
            logs = {}
            for label, result in [("neutral-1", neutral[0]), ("neutral-2", neutral[1]), ("build", build), ("mutant", test)]:
                data = result["output"].encode()
                key = digest(data)
                raw[key] = data
                logs[label] = {"sha256": key, "exit_code": result["exit_code"]}
            results.append({
                "id": case["id"], "state": state, "expected_cause": case["cause"],
                "oracle_test": case["test"], "oracle_marker": case["marker"],
                "neutral_runs": 2, "neutral_passed": neutral_ok,
                "target": case["path"], "before_sha256": digest(source.encode()),
                "after_sha256": digest(mutated.encode()), "logs": logs,
            })
    unchanged = before == inventory(IMPL)
    result = {
        "schema_version": "auth-behavioral-mutation-report/v1",
        "implementation_inputs": before, "runner_sha256": digest(Path(__file__).read_bytes()),
        "denominator": [c["id"] for c in selected], "observations": results,
        "source_unchanged": unchanged,
        "status": "pass" if unchanged and len(results) == len(selected) and all(r["state"] == "killed-for-declared-cause" for r in results) else "non-pass",
        "authority_effect": "none",
        "claim_ceiling": "The explicitly selected local behavioral mutation controls only; not the complete EVF seam campaign, formal correspondence, or product approval.",
    }
    if args.write:
        target = HERE / "mutation-logs"
        target.mkdir(exist_ok=True)
        for key, data in raw.items():
            destination = target / f"{key}.log"
            if destination.exists() and destination.read_bytes() != data:
                raise RuntimeError("content-addressed log collision")
            destination.write_bytes(data)
        (HERE / "MUTATION-RESULT.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"status": result["status"], "observations": results}, sort_keys=True, indent=2))
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
