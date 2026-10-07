#!/usr/bin/env python3
"""Seal unchanged G02 exact-anchor decisions on the separate exposed r2 cohort."""

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def module_at(path):
    spec = importlib.util.spec_from_file_location("g02_exact_anchor", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("plan", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("anchor_rule", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    plan = json.loads(args.plan.read_text())
    if plan.get("schema_version") != "are.g02-product-replication-execution/v1" or \
            len(plan["ordered_pairs"]) != 24:
        raise SystemExit("unexpected exposed r2 plan")
    anchor = module_at(args.anchor_rule)
    rows = []
    for pair in plan["ordered_pairs"]:
        ranked = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), pair["root"]], text=True))
        if ranked["instance_id"] != pair["instance_id"] or \
                ranked["pair_root"] != pair["root"]:
            raise SystemExit("r2 pair/ranker identity mismatch")
        choice = anchor.choose(ranked)
        rows.append({"ranking": ranked, "choice": choice})
    if len({row["choice"]["instance_id"] for row in rows}) != 24:
        raise SystemExit("duplicate r2 task")
    receipt = {"schema_version": "g02.exact-anchor-r2-transfer-source-seal/v1",
               "posture": "source-only-exposed-development-no-gold-or-native-score-opened",
               "plan_sha256": sha(args.plan), "ranker_sha256": sha(args.ranker),
               "anchor_rule_sha256": sha(args.anchor_rule),
               "rule": "Unchanged r3 exact-anchor rule: raw top30, first ten undelivered; exact code-like issue identifier of length >=5, present in <=2 of ten candidate files; at most two selected in rank order",
               "rows": rows,
               "claim_ceiling": "Source-only transfer choices on exposed r2. No native quality or cost result.",
               "open_questions": ["Does r3's narrow precision signal transfer across the separate r2 exposed cohort?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"status": "sealed", "receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "tasks": len(rows),
                      "selected_count": sum(len(row["choice"]["selected_paths"]) for row in rows),
                      "tasks_with_selection": sum(bool(row["choice"]["selected_paths"]) for row in rows)}, sort_keys=True))


if __name__ == "__main__":
    main()
