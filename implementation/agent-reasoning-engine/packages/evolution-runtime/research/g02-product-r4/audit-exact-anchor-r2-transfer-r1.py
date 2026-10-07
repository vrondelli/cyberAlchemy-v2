#!/usr/bin/env python3
"""Evaluator-only audit of sealed G02 exact-anchor transfer on exposed r2."""

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


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
    parser.add_argument("source_seal", type=Path)
    parser.add_argument("plan", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("anchor_rule", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    sealed = json.loads(args.source_seal.read_text())
    plan = json.loads(args.plan.read_text())
    if sealed.get("schema_version") != "g02.exact-anchor-r2-transfer-source-seal/v1" or \
            sealed.get("posture") != "source-only-exposed-development-no-gold-or-native-score-opened" or \
            sealed.get("plan_sha256") != sha(args.plan) or \
            sealed.get("ranker_sha256") != sha(args.ranker) or \
            sealed.get("anchor_rule_sha256") != sha(args.anchor_rule) or \
            len(sealed["rows"]) != 24 or len(plan["ordered_pairs"]) != 24:
        raise SystemExit("source seal provenance mismatch")
    anchor = module_at(args.anchor_rule)
    for pair, row in zip(plan["ordered_pairs"], sealed["rows"]):
        ranked = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), pair["root"]], text=True))
        if ranked != row["ranking"] or anchor.choose(ranked) != row["choice"]:
            raise SystemExit("source-only transfer replay mismatch")
    parquet = UPSTREAM / "data/full.parquet"
    if sha(parquet) != PARQUET_SHA256:
        raise SystemExit("native gold parquet drift")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(parquet))
    rows = []
    for pair, sealed_row in zip(plan["ordered_pairs"], sealed["rows"]):
        ranked, choice = sealed_row["ranking"], sealed_row["choice"]
        gold = set(loader.get(pair["instance_id"]).files())
        delivered = set(ranked["delivered_paths"])
        selected = set(choice["selected_paths"])
        repo = pair["suffix"].split("-")[1]
        rows.append({"id": pair["instance_id"].split("__")[-1], "repo": repo,
                     "read_slots": len(selected),
                     "new_gold_hits": len(selected & (gold - delivered)),
                     "false_positive_files": len(selected - gold),
                     "undelivered_gold_files": len(gold - delivered)})
    fields = ("read_slots", "new_gold_hits", "false_positive_files", "undelivered_gold_files")
    totals = {key: sum(row[key] for row in rows) for key in fields}
    totals["tasks_with_new_gold"] = sum(row["new_gold_hits"] > 0 for row in rows)
    by_repo = defaultdict(lambda: {key: 0 for key in fields})
    for row in rows:
        for key in fields:
            by_repo[row["repo"]][key] += row[key]
    receipt = {"schema_version": "g02.exact-anchor-r2-transfer-exposed-audit/v1",
               "posture": "evaluator-only-exposed-development-no-model-no-native-score",
               "source_seal_sha256": sha(args.source_seal),
               "gold_parquet_sha256": PARQUET_SHA256,
               "source_only_replay": "24/24 exact rows",
               "rows": rows, "totals": totals, "by_repo": dict(by_repo),
               "claim_ceiling": "Acquisition label diagnostic only; not actual ARE reads, native F1, cost, independent holdout, or superiority.",
               "open_questions": ["Can a prospective receipt-backed acquisition/selection mechanism improve native quality while preserving G02 cost advantage?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"status": "audited", "receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "totals": totals, "by_repo": dict(by_repo)}, sort_keys=True))


if __name__ == "__main__":
    main()
