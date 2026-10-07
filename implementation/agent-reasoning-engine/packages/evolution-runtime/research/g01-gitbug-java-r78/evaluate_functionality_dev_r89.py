#!/usr/bin/env python3
"""Evaluate r84/r87 sealed development ranks with common source-role filter."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath

LABEL_SHA = "63ebd2880c6f12304052db8d83705afaf2dcab6e9136f4807c359a90cd51572f"
R84_SHA = "e1ef342e646806d223b3e8bf02c06c45f2f9b4f116b064aeaa708bf8cd6e774d"
R87_SHA = "f7e8deb85671d36eff4b5ed8cfc4373a30f543511a5210c3ede834076d43eb75"
PROVIDER_SHA = "b3fc8257762144611313368d002bf1717ee5ea285402008115d755245b230b85"
ARMS = ("are", "raw_bm25", "a_are_raw", "b_raw_symbol", "c_safe",
        "d_four_channel", "d_safe")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def score(ranking, gold):
    first = min(ranking.index(path) + 1 for path in gold)
    return {"first_rank": first, "rr8": 1 / first if first <= 8 else 0,
            "hit3": int(first <= 3),
            "recall20": sum(path in ranking[:20] for path in gold) / len(gold)}


def main():
    parser = argparse.ArgumentParser()
    for name in ("labels", "r84", "r87", "provider", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.labels.read_bytes()) != LABEL_SHA
            or sha(args.r84.read_bytes()) != R84_SHA
            or sha(args.r87.read_bytes()) != R87_SHA
            or sha(args.provider.read_bytes()) != PROVIDER_SHA):
        raise SystemExit("output-or-input-drift")
    labels = json.loads(args.labels.read_bytes())["results"]
    old = [json.loads(x) for x in args.r84.read_text().splitlines()]
    new = [json.loads(x) for x in args.r87.read_text().splitlines()]
    provider = json.loads(args.provider.read_bytes())
    if (len(labels) != 12 or len(old) != 12 or len(new) != 12
            or provider["status"] != "complete" or provider["attempts"] != 12):
        raise SystemExit("population-or-provider-drift")
    rows = []
    for i, (lab, a, d) in enumerate(zip(labels, old, new, strict=True), 1):
        if (not lab["admissible"] or
                not (lab["ordinal"] == a["ordinal"] == d["ordinal"] == i) or
                not (lab["repo"] == a["repo"] == d["repo"])):
            raise SystemExit("case-binding-drift")
        gold = lab["gold_paths"]
        modes = {}
        for mode in ("all", "production"):
            modes[mode] = {}
            for arm in ARMS:
                rank = (a if arm in a else d)[arm]
                if mode == "production":
                    rank = [path for path in rank
                            if "test" not in PurePosixPath(path).parts
                            and "tests" not in PurePosixPath(path).parts]
                if any(path not in rank for path in gold):
                    raise SystemExit("gold-excluded-by-source-role")
                modes[mode][arm] = score(rank, gold)
        rows.append({"ordinal": i, "repo": lab["repo"], "scores": modes})
    aggregate = {mode: {arm: {metric: sum(row["scores"][mode][arm][metric] for row in rows) / 12
                             for metric in ("rr8", "hit3", "recall20")}
                        for arm in ARMS}
                 for mode in ("all", "production")}
    comparisons = {}
    for mode in aggregate:
        comparisons[mode] = {}
        for candidate in ("c_safe", "d_four_channel", "d_safe"):
            ref = [row["scores"][mode]["b_raw_symbol"]["rr8"] for row in rows]
            val = [row["scores"][mode][candidate]["rr8"] for row in rows]
            comparisons[mode][candidate] = {
                "delta_mrr8_vs_strong_b": sum(y-x for x,y in zip(ref,val,strict=True)) / 12,
                "wins": sum(y>x for x,y in zip(ref,val,strict=True)),
                "ties": sum(y==x for x,y in zip(ref,val,strict=True)),
                "losses": sum(y<x for x,y in zip(ref,val,strict=True))}
    result = {"schema_version": "are.g01-gitbug-r89-exposed-development/v1",
              "cases": 12, "input_sha256": {"labels": LABEL_SHA, "r84": R84_SHA,
                                            "r87": R87_SHA, "provider": PROVIDER_SHA},
              "scores": aggregate, "comparisons": comparisons,
              "provider_usage": provider["usage"], "rows": rows,
              "claim_eligible": False, "confirmation_scores_computed": False}
    args.output.mkdir(mode=0o700, parents=True)
    fd = os.open(args.output / "DEV-EVALUATION.json", os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write("\n")
    print(json.dumps({"scores": aggregate["production"],
                      "comparisons": comparisons["production"],
                      "provider_usage": provider["usage"]}, sort_keys=True))


if __name__ == "__main__":
    main()
