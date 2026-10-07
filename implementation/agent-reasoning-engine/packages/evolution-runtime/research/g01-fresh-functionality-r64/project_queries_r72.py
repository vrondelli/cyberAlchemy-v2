#!/usr/bin/env python3
"""Seal r72 mixed-input failure queries without reading evaluator labels."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

COHORT_SHA = "4e779481382a57b99e0075bdad801fb15bf122275f20a409bac2264d48c528be"
META_SHA = "5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686"
R68_SHA = "ca6a78626cef456243b46b4b57a5e3a30737a14ccd8b60f1a9f0ce75a4940441"
R70_SHA = "98e7a4a45364769193e6592510e5579d3aa660c2d9cebf4aa4291329164c21ef"
RULE_SHA = "6aa2d5b98b70b7529345d3176f686e23cfa1e59ff58cb697f190f792f6e36872"
MISSING = {1, 12, 22, 23}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main():
    parser = argparse.ArgumentParser()
    for name in ("cohort", "metadata", "r68", "r70", "rule", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output-exists")
    paths = {"cohort": args.cohort, "metadata": args.metadata,
             "r68": args.r68 / "LOG-RESULT.json", "r70": args.r70 / "R70-RESULT.json",
             "rule": args.rule}
    pins = {"cohort": COHORT_SHA, "metadata": META_SHA, "r68": R68_SHA,
            "r70": R70_SHA, "rule": RULE_SHA}
    if any(sha(path.read_bytes()) != pins[name] for name, path in paths.items()):
        raise SystemExit("input-drift")
    spec = importlib.util.spec_from_file_location("g01_query_rule", args.rule)
    if spec is None or spec.loader is None:
        raise SystemExit("query-rule-unavailable")
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    cohort = json.loads(args.cohort.read_bytes())
    metadata = {row["image_tag"]: row for row in
                (json.loads(line) for line in args.metadata.read_text().splitlines())}
    r68 = {row["ordinal"]: row for row in json.loads(paths["r68"].read_bytes())["results"]}
    r70 = {row["ordinal"]: row for row in json.loads(paths["r70"].read_bytes())["results"]}
    if cohort["cases"] != 24 or len(cohort["rows"]) != 24 or len(r68) != 24 or len(r70) != 5:
        raise SystemExit("population-drift")
    args.output.mkdir(mode=0o700, parents=True)
    records = []
    for ordinal, case in enumerate(cohort["rows"], 1):
        item = metadata[case["image_tag"]]
        failure = item["failure"]
        if (case["ordinal"] != ordinal or case["repo"] != item["repo"]
                or case["failed_commit"] != failure["trigger_sha"]
                or r68[ordinal]["image_tag"] != case["image_tag"]
                or r68[ordinal]["job_id"] != failure["job_id"]):
            raise SystemExit(f"identity-drift:{ordinal}")
        tests = failure["failed_tests"]
        if not isinstance(tests, str):
            raise SystemExit(f"test-type:{ordinal}")
        test_part = rule.bounded_prefix(tests.replace("#", "\n"), rule.MAX_TEST_BYTES).strip()
        if ordinal in MISSING:
            if r68[ordinal]["admitted"] or (ordinal in r70 and r70[ordinal]["admitted"]):
                raise SystemExit(f"unexpected-admitted-log:{ordinal}")
            if not test_part:
                raise SystemExit(f"empty-metadata-query:{ordinal}")
            query = f"failed tests:\n{test_part}"
            log_receipt = None
            input_type = "metadata-only"
        else:
            receipt = r70[ordinal] if ordinal == 10 else r68[ordinal]
            log_root = args.r70 if ordinal == 10 else args.r68
            if not receipt["admitted"] or receipt["image_tag"] != case["image_tag"]:
                raise SystemExit(f"log-admission:{ordinal}")
            log = (log_root / f"HTTPS-LOG-{ordinal:02d}.txt").read_bytes()
            if (sha(log) != (receipt["sha256"] if ordinal == 10 else receipt["log_sha256"])
                    or len(log) != receipt["expected_bytes"]):
                raise SystemExit(f"log-drift:{ordinal}")
            heading = f"failed tests:\n{test_part}\n" if test_part else ""
            log_text = rule.ANSI.sub("", log.decode("utf-8", errors="strict"))
            tail = rule.bounded_suffix(log_text, rule.MAX_QUERY_BYTES - len(heading.encode()) - 16).strip()
            query = f"{heading}log tail:\n{tail}".strip()
            log_receipt = sha((log_root / ("R70-RESULT.json" if ordinal == 10 else "LOG-RESULT.json")).read_bytes())
            input_type = "complete-log"
        query, redactions = rule.SENSITIVE.subn("[REDACTED]", query)
        if not query or len(query.encode()) > rule.MAX_QUERY_BYTES:
            raise SystemExit(f"query-size:{ordinal}")
        records.append({"schema_version": "are.g01-r72-query/v1", "ordinal": ordinal,
                        "id": case["image_tag"], "repo": case["repo"],
                        "language": "Python", "base_commit": case["failed_commit"],
                        "input_type": input_type, "log_receipt_sha256": log_receipt,
                        "query": query, "query_sha256": sha(query.encode()),
                        "redactions": redactions})
    data = "".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n" for row in records).encode()
    save(args.output / "QUERIES.jsonl", data)
    seal = {"schema_version": "are.g01-r72-query-seal/v1", "status": "sealed-before-ranking-and-provider",
            "cases": 24, "complete_logs": 20, "metadata_only": 4,
            "input_sha256": pins, "protocol_sha256": sha(Path(__file__).with_name("R72-MIXED-INPUT-PROTOCOL.md").read_bytes()),
            "script_sha256": sha(Path(__file__).read_bytes()), "queries_sha256": sha(data),
            "max_query_bytes": max(len(row["query"].encode()) for row in records),
            "gold_opened": False, "passing_source_opened": False, "model_calls": 0}
    save(args.output / "QUERY-SEAL.json", (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode())
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
