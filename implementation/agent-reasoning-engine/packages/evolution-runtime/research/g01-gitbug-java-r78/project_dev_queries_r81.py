#!/usr/bin/env python3
"""Seal bounded, failure-side-only queries for r80 development cases."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

SUPPLY_SHA = "eef0efa22d78160613f20d09157b8dc0397bbd81f0a0277f613818cb2bb72002"
DEV_SHA = "cc16c5576f31b67b270df33949a8dc5452c5ae2f9af75eae752f085069992301"
RULE_SHA = "6aa2d5b98b70b7529345d3176f686e23cfa1e59ff58cb697f190f792f6e36872"
RULE_PATH = Path(__file__).resolve().parents[1] / "arb-trace2code-r1/project-bugswarm-graph-dev-r2-queries.py"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main():
    parser = argparse.ArgumentParser()
    for name in ("metadata", "supply", "dev", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.supply.read_bytes()) != SUPPLY_SHA
            or sha(args.dev.read_bytes()) != DEV_SHA or sha(RULE_PATH.read_bytes()) != RULE_SHA):
        raise SystemExit("output-or-input-drift")
    spec = importlib.util.spec_from_file_location("r37_query_rule", RULE_PATH)
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    supply = json.loads(args.supply.read_bytes())
    cases = json.loads(args.dev.read_bytes())["results"]
    if len(cases) != 12 or not all(row["accepted"] for row in cases):
        raise SystemExit("development-source-drift")
    args.output.mkdir(parents=True, mode=0o700)
    records = []
    for row, case in zip(supply["rows"][:12], cases, strict=True):
        if (case["ordinal"] != row["ordinal"] or case["repo"] != row["repo"]
                or case["buggy_commit"] != row["buggy_commit"]):
            raise SystemExit("case-binding-drift")
        path = args.metadata / "data/bugs" / row["metadata_file"]
        if sha(path.read_bytes()) != supply["source_files_sha256"][path.name]:
            raise SystemExit("metadata-bytes-drift")
        item = json.loads(path.read_text().splitlines()[row["metadata_line"] - 1])
        if (item["repository"].lower() != row["repo"]
                or item["previous_commit_hash"] != row["buggy_commit"]
                or item["strategy"] != row["strategy"]):
            raise SystemExit("metadata-identity-drift")
        phase = 0 if row["strategy"] == "FAIL_PASS" else 1
        tests = []
        for run in item["actions_runs"][phase]:
            for test in run.get("tests") or []:
                results = test.get("results") or []
                if results and results[0].get("result") in ("Failure", "Error"):
                    tests.append(test)
        if len(tests) != row["failing_test_count"] or not tests:
            raise SystemExit("failure-count-drift")
        names = "\n".join(f"{t['classname']}#{t['name']}" for t in tests)
        names = rule.bounded_prefix(names, rule.MAX_TEST_BYTES).strip()
        messages = "\n".join(
            f"{t['results'][0].get('type') or ''}: {t['results'][0].get('message') or ''}"
            for t in tests)
        messages = rule.ANSI.sub("", messages)
        heading = f"failing tests:\n{names}\nfailure:\n"
        tail = rule.bounded_suffix(messages, rule.MAX_QUERY_BYTES - len(heading.encode())).strip()
        query, redactions = rule.SENSITIVE.subn("[REDACTED]", (heading + tail).strip())
        if not query or len(query.encode()) > rule.MAX_QUERY_BYTES:
            raise SystemExit("query-size-drift")
        records.append({"schema_version": "are.g01-gitbug-r81-query/v1",
                        "ordinal": row["ordinal"], "repo": row["repo"],
                        "base_commit": row["buggy_commit"],
                        "input_type": "parsed-failing-test",
                        "failing_test_count": len(tests), "query": query,
                        "query_sha256": sha(query.encode()), "redactions": redactions})
    data = "".join(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n" for r in records).encode()
    save_new(args.output / "QUERIES.jsonl", data)
    save_new(args.output / "QUERY-SEAL.json", (json.dumps({
        "schema_version": "are.g01-gitbug-r81-query-seal/v1",
        "cases": len(records), "supply_sha256": SUPPLY_SHA, "dev_source_sha256": DEV_SHA,
        "rule_sha256": RULE_SHA,
        "script_sha256": sha(Path(__file__).read_bytes()),
        "protocol_sha256": sha(Path(__file__).with_name("R81-DEV-QUERY-PROTOCOL.md").read_bytes()),
        "queries_sha256": sha(data),
        "max_query_bytes": max(len(r["query"].encode()) for r in records),
        "redactions": sum(r["redactions"] for r in records),
        "gold_values_used": False, "passing_source_opened": False,
        "model_calls": 0, "scores_computed": False}, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"cases": len(records), "queries_sha256": sha(data),
                      "redactions": sum(r["redactions"] for r in records)}))


if __name__ == "__main__":
    main()
