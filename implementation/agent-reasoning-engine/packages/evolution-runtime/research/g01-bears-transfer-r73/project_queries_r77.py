#!/usr/bin/env python3
"""Project Bears structured failure details without evaluator gold."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

COHORT_SHA = "9d6d9111addf1bc860830dc4633dda27b9b7348d693a369830d4c6395dcf2f78"
ORDER_SHA = "b4a07e64c2cbe4fc018ce70efce5ad728945e88e9150ea8d5241b7c754f186b2"
RULE_SHA = "6aa2d5b98b70b7529345d3176f686e23cfa1e59ff58cb697f190f792f6e36872"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main():
    parser = argparse.ArgumentParser()
    for name in ("cohort", "order", "rule", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.cohort.read_bytes()) != COHORT_SHA
            or sha(args.order.read_bytes()) != ORDER_SHA
            or sha(args.rule.read_bytes()) != RULE_SHA):
        raise SystemExit("output-or-input-drift")
    spec = importlib.util.spec_from_file_location("g01_query_rule", args.rule)
    if spec is None or spec.loader is None:
        raise SystemExit("query-rule-unavailable")
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    cohort = json.loads(args.cohort.read_bytes())
    order = {row["ordinal"]: row for row in json.loads(args.order.read_bytes())["rows"]}
    if cohort["cases"] != 24 or not cohort["all_24_admitted"] or len(cohort["rows"]) != 24:
        raise SystemExit("cohort-drift")
    records = []
    for ordinal, case in enumerate(cohort["rows"], 1):
        original = order[case["source_ordinal"]]
        if (case["ordinal"] != ordinal or case["bug_id"] != original["bug_id"]
                or case["repo"] != original["repo"] or case["buggy_commit"] != original["buggy_commit"]):
            raise SystemExit(f"case-identity:{ordinal}")
        failures = original["failure_details"]
        if not failures:
            raise SystemExit(f"no-failure-details:{ordinal}")
        names = "\n".join(f"{row['test_class']}#{row['test_method']}" for row in failures)
        names = rule.bounded_prefix(names, rule.MAX_TEST_BYTES).strip()
        details = "\n".join(f"{row['failure_name']}: {row['detail']}" for row in failures)
        details = rule.ANSI.sub("", details)
        heading = f"failing tests:\n{names}\nfailure:\n"
        tail = rule.bounded_suffix(details, rule.MAX_QUERY_BYTES-len(heading.encode())).strip()
        query = (heading + tail).strip()
        query, redactions = rule.SENSITIVE.subn("[REDACTED]", query)
        if not query or len(query.encode()) > rule.MAX_QUERY_BYTES:
            raise SystemExit(f"query-size:{ordinal}")
        records.append({"schema_version": "are.g01-bears-r77-query/v1", "ordinal": ordinal,
                        "id": case["bug_id"], "repo": case["repo"],
                        "language": "Java", "base_commit": case["buggy_commit"],
                        "input_type": "structured-failure-detail", "query": query,
                        "query_sha256": sha(query.encode()), "redactions": redactions})
    args.output.mkdir(parents=True, mode=0o700)
    data = "".join(json.dumps(row, sort_keys=True, ensure_ascii=False) + "\n" for row in records).encode()
    save(args.output / "QUERIES.jsonl", data)
    seal = {"schema_version": "are.g01-bears-r77-query-seal/v1",
            "status": "sealed-before-source-ranking-and-provider", "cases": 24,
            "cohort_sha256": COHORT_SHA, "source_order_sha256": ORDER_SHA,
            "query_rule_sha256": RULE_SHA,
            "protocol_sha256": sha(Path(__file__).with_name("R77-JAVA-TRANSFER-PROTOCOL.md").read_bytes()),
            "script_sha256": sha(Path(__file__).read_bytes()),
            "queries_sha256": sha(data),
            "max_query_bytes": max(len(row["query"].encode()) for row in records),
            "redactions": sum(row["redactions"] for row in records),
            "gold_values_used": False, "model_calls": 0}
    save(args.output / "QUERY-SEAL.json", (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode())
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
