#!/usr/bin/env python3
"""Evaluate sealed G01 r58 rankings against pinned evaluator-only labels."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

LABEL_SHA = {"r1": "c614d7d92a5901654ee0dde4f1e62ebd6bb43cb4a6807f39b66db3ab39cf68c0",
             "r2b": "b8a2d0829aba9d4838af53677d2503cb1c976c5cd3f55d3347f625e513ce1ae2"}
ARMS = ("base", "raw_swerank", "functionality_swerank", "dual_view")
METRICS = ("mrr_at_8", "hit_at_3", "recall_at_20")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metrics(ranking, gold):
    positions = [i for i, path in enumerate(ranking, 1) if path in gold]
    first = min(positions) if positions else 10**9
    return {"mrr_at_8": 1 / first if first <= 8 else 0.0,
            "hit_at_3": float(first <= 3),
            "recall_at_20": sum(path in gold for path in ranking[:20]) / len(gold)}


def interval(values, seed):
    values = np.asarray(values, dtype=np.float64)
    rng = np.random.default_rng(seed)
    draws = rng.integers(0, len(values), size=(100000, len(values)))
    return [float(x) for x in np.quantile(values[draws].mean(axis=1), [0.025, 0.975])]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", type=Path, required=True)
    ap.add_argument("--source", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    seal_file = args.source / "SOURCE-SEAL.json"
    ranking_file = args.source / "RANKINGS.jsonl"
    seal = json.loads(seal_file.read_text())
    if seal["status"] != "complete" or seal["cases"] != 48 or seal["gold_opened"] or seal["rankings_sha256"] != sha(ranking_file):
        raise SystemExit("source not sealed")
    labels = {}
    for cohort in ("r1", "r2b"):
        path = args.archive / f"evaluator-{cohort}/EVALUATOR-AUDIT.json"
        if sha(path) != LABEL_SHA[cohort]:
            raise SystemExit("label drift")
        for row in json.loads(path.read_text())["per_case_private"]:
            if not row["label_valid"]:
                raise SystemExit("invalid label")
            labels[(cohort, row["id"])] = set(row["admitted_paths"])
    source = [json.loads(line) for line in ranking_file.read_text().splitlines()]
    if len(source) != 48 or len(labels) != 48:
        raise SystemExit("denominator drift")
    per = []
    for row in source:
        gold = labels[(row["cohort"], row["id"])]
        per.append({"cohort": row["cohort"], "id": row["id"], "repo": row["repo"],
                    "summary_valid": row["summary_valid"], "gold": sorted(gold),
                    "metrics": {arm: metrics(row[arm], gold) for arm in ARMS}})
    aggregate = {arm: {name: float(np.mean([row["metrics"][arm][name] for row in per]))
                       for name in METRICS} for arm in ARMS}
    clusters = sorted({(row["cohort"], row["repo"]) for row in per})
    if len(clusters) != 24:
        raise SystemExit("cluster denominator drift")
    paired = {}
    for comparator, seed in (("base", 5801), ("functionality_swerank", 5802)):
        values = []
        for cluster in clusters:
            group = [row for row in per if (row["cohort"], row["repo"]) == cluster]
            values.append(float(np.mean([row["metrics"]["dual_view"]["mrr_at_8"]
                                         - row["metrics"][comparator]["mrr_at_8"] for row in group])))
        paired[comparator] = {"mean": aggregate["dual_view"]["mrr_at_8"] - aggregate[comparator]["mrr_at_8"],
                              "cluster_interval_95": interval(values, seed),
                              "cluster_wins": sum(value > 0 for value in values),
                              "cluster_ties": sum(value == 0 for value in values),
                              "cluster_losses": sum(value < 0 for value in values)}
    treatment = aggregate["dual_view"]
    gate = {"all_48_sealed": len(per) == 48,
            "all_48_prior_summaries_valid": all(row["summary_valid"] for row in per),
            "mrr_plus_0_05_vs_base": paired["base"]["mean"] >= 0.05,
            "mrr_plus_0_02_vs_functionality": paired["functionality_swerank"]["mean"] >= 0.02,
            "both_cluster_lower_bounds_positive": all(row["cluster_interval_95"][0] > 0 for row in paired.values()),
            "hit3_not_lower": all(treatment["hit_at_3"] >= aggregate[arm]["hit_at_3"]
                                  for arm in ("base", "functionality_swerank")),
            "recall20_not_lower": all(treatment["recall_at_20"] >= aggregate[arm]["recall_at_20"]
                                     for arm in ("base", "functionality_swerank")),
            "at_least_14_cluster_wins_vs_base": paired["base"]["cluster_wins"] >= 14}
    result = {"schema_version": "are.g01-r58-evaluation/v1", "status": "complete",
              "claim_ceiling": "exposed mechanism selection only", "cases": 48, "clusters": len(clusters),
              "aggregate": aggregate, "paired_differences": paired, "gate": gate,
              "advancement_passed": all(gate.values()), "source_seal_sha256": sha(seal_file),
              "label_sha256": LABEL_SHA, "per_case_private": per}
    if args.output.exists():
        raise SystemExit("output exists")
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")
    print(json.dumps({key: result[key] for key in ("aggregate", "paired_differences", "gate", "advancement_passed")}, sort_keys=True))


if __name__ == "__main__":
    main()
