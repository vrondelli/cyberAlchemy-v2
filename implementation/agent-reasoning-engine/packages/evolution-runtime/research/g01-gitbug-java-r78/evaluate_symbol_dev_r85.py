#!/usr/bin/env python3
"""Evaluate sealed r84 variants on exposed r82 development labels only."""

import argparse
import hashlib
import json
import os
from pathlib import Path

LABEL_SHA = "63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f"
RANK_SHA = "e1ef342e646806d223b3e8bf02c06c45f2f9b4f116b064aeaa708bf8cd6e774d"
SEAL_SHA = "06f3fa35f0d3191f36c26f3ea535def11b548808d8f0a619bc5854a478e5439f"
ARMS = ("are", "raw_bm25", "a_are_raw", "b_raw_symbol", "c_are_raw_symbol", "c_safe")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def score(ranking, gold):
    first = min(ranking.index(path) + 1 for path in gold)
    return {"first_rank": first, "rr8": 1 / first if first <= 8 else 0,
            "hit3": int(first <= 3),
            "recall20": sum(path in ranking[:20] for path in gold) / len(gold)}


def main():
    parser = argparse.ArgumentParser()
    for name in ("labels", "rankings", "seal", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.labels.read_bytes()) != LABEL_SHA
            or sha(args.rankings.read_bytes()) != RANK_SHA
            or sha(args.seal.read_bytes()) != SEAL_SHA):
        raise SystemExit("output-or-input-drift")
    labels = json.loads(args.labels.read_bytes())["results"]
    rankings = [json.loads(line) for line in args.rankings.read_text().splitlines()]
    seal = json.loads(args.seal.read_bytes())
    if len(labels) != 12 or len(rankings) != 12 or seal["rankings_sha256"] != RANK_SHA:
        raise SystemExit("population-drift")
    rows = []
    for i, (label, row) in enumerate(zip(labels, rankings, strict=True), 1):
        if (not label["admissible"] or label["ordinal"] != row["ordinal"] or
                label["ordinal"] != i or label["repo"] != row["repo"]):
            raise SystemExit("case-binding-drift")
        gold = label["gold_paths"]
        if not gold or any(set(row[arm]) != set(row["are"]) for arm in ARMS):
            raise SystemExit("label-or-universe-drift")
        scores = {arm: score(row[arm], gold) for arm in ARMS}
        rows.append({"ordinal": i, "repo": row["repo"], "gold_paths": gold,
                     "symbol_positive": row["symbol_positive"], "scores": scores})
    summary = {arm: {metric: sum(r["scores"][arm][metric] for r in rows) / len(rows)
                     for metric in ("rr8", "hit3", "recall20")} for arm in ARMS}
    pairs = {}
    for arm in ("b_raw_symbol", "c_are_raw_symbol", "c_safe"):
        a = [r["scores"]["a_are_raw"]["rr8"] for r in rows]
        b = [r["scores"][arm]["rr8"] for r in rows]
        pairs[arm] = {"delta_mrr8_vs_a": sum(y-x for x,y in zip(a,b,strict=True)) / len(a),
                      "wins": sum(y>x for x,y in zip(a,b,strict=True)),
                      "ties": sum(y==x for x,y in zip(a,b,strict=True)),
                      "losses": sum(y<x for x,y in zip(a,b,strict=True))}
    result = {"schema_version": "are.g01-gitbug-r85-exposed-development/v1",
              "cases": 12, "source_rankings_sealed_before_label_access": True,
              "labels_sha256": LABEL_SHA, "rankings_sha256": RANK_SHA,
              "seal_sha256": SEAL_SHA, "arms": summary, "comparisons": pairs,
              "rows": rows, "claim_eligible": False,
              "confirmation_scores_computed": False, "model_calls": 0}
    args.output.mkdir(mode=0o700, parents=True)
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output / "DEV-EVALUATION.json", os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"arms": summary, "comparisons": pairs}, sort_keys=True))


if __name__ == "__main__":
    main()
