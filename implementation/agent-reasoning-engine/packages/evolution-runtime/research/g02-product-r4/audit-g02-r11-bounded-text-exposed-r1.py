#!/usr/bin/env python3
"""Evaluator-only comparison of pre-sealed bounded-text r11 file proposals."""

import argparse
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path


PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("bounded_seal", type=Path)
    parser.add_argument("bounded_seal_sha256")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{64}", args.bounded_seal_sha256):
        raise SystemExit("invalid expected seal digest")
    if sha(args.bounded_seal) != args.bounded_seal_sha256:
        raise SystemExit("bounded-text seal drift")
    bounded = json.loads(args.bounded_seal.read_text())
    if (bounded.get("schema_version") != "g02.r11-bounded-text-exposed-seal/v1" or
            bounded.get("posture") != "source-only-exposed-development-no-gold-dsh-or-score" or
            bounded.get("fixed_new_read_budget") != 3 or len(bounded["rows"]) != 12):
        raise SystemExit("unexpected bounded-text cohort")
    if sha(args.prior_seal) != bounded["prior_seal_sha256"] or sha(UPSTREAM / "data/full.parquet") != PARQUET_SHA256:
        raise SystemExit("prior/gold input drift")
    prior = json.loads(args.prior_seal.read_text())
    if len(prior["rows"]) != 12:
        raise SystemExit("unexpected prior cohort")
    by_id = {row["instance_id"]: row for row in prior["rows"]}
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    totals = Counter()
    by_source = defaultdict(Counter)
    for row in bounded["rows"]:
        old = by_id[row["instance_id"]]
        if row["ordinal"] != old["ordinal"] or row["base_commit"] != old["base_commit"] or \
                row["issue_sha256"] != old["issue_sha256"] or row["delivered_paths"] != old["delivered_paths"]:
            raise SystemExit("source identity drift")
        gold = set(loader.get(row["instance_id"]).files())
        delivered = set(row["delivered_paths"])
        baseline = old["raw_new3"]
        ranked = [item["path"] for item in row["bounded_text_top30"]]
        proposed = row["bounded_text_new3"]
        if len(ranked) != len(set(ranked)) or proposed != [path for path in ranked if path not in delivered][:3]:
            raise SystemExit("ranking/budget mismatch")
        record = {"ordinal": row["ordinal"], "source": row["source"],
                  "undelivered_gold": len(gold - delivered),
                  "baseline_new3_gold": len(set(baseline) & (gold - delivered)),
                  "bounded_new3_slots": len(proposed),
                  "bounded_new3_gold": len(set(proposed) & (gold - delivered)),
                  "bounded_new3_false_positive": len(set(proposed) - gold),
                  "bounded_top30_new_gold": len((set(ranked) - delivered) & (gold - delivered)),
                  "bounded_top30_false_positive": len((set(ranked) - delivered) - gold)}
        rows.append(record)
        for key, value in record.items():
            if isinstance(value, int) and key != "ordinal":
                totals[key] += value
                by_source[row["source"]][key] += value
        by_source[row["source"]]["tasks"] += 1
    output = {"schema_version": "g02.r11-bounded-text-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-model-no-native-score",
              "prior_seal_sha256": bounded["prior_seal_sha256"],
              "bounded_seal_sha256": args.bounded_seal_sha256,
              "native_gold_parquet_sha256": PARQUET_SHA256,
              "rows": rows, "totals": dict(sorted(totals.items())),
              "by_source": {key: dict(sorted(value.items())) for key, value in sorted(by_source.items())},
              "claim_ceiling": "Exposed file-hit diagnostic only. Proposed files were not read by ARE; no native F1, cost, independent test, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"totals": output["totals"], "by_source": output["by_source"],
                      "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
