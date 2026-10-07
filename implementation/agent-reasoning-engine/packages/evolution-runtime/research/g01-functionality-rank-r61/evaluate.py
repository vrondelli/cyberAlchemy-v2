#!/usr/bin/env python3
"""Evaluate sealed r61 rankings against pinned evaluator labels."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

LABEL_SHA = {"r1": "c614d7d92a5901654ee0dde4f1e62ebd6bb43cb4a6807f39b66db3ab39cf68c0",
             "r2b": "b8a2d0829aba9d4838af53677d2503cb1c976c5cd3f55d3347f625e513ce1ae2"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metrics(ranking, gold):
    positions = [i for i, path in enumerate(ranking, 1) if path in gold]
    first = min(positions) if positions else 10**9
    return {"mrr_at_8": 1 / first if first <= 8 else 0.0,
            "hit_at_3": float(first <= 3),
            "recall_at_20": len(gold.intersection(ranking[:20])) / len(gold)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", type=Path, required=True)
    ap.add_argument("--source", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    seal_path = args.source / "SOURCE-SEAL.json"
    ranking_path = args.source / "RANKINGS.jsonl"
    seal = json.loads(seal_path.read_text())
    if seal["status"] != "complete" or seal["cases"] != 48 or seal["gold_opened"] or seal["rankings_sha256"] != sha(ranking_path):
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
    source = [json.loads(line) for line in ranking_path.read_text().splitlines()]
    if len(source) != 48 or len(labels) != 48:
        raise SystemExit("denominator drift")
    per = []
    for row in source:
        gold = labels[(row["cohort"], row["id"])]
        per.append({"cohort": row["cohort"], "id": row["id"], "repo": row["repo"],
                    "gold": sorted(gold), "candidate_count": row["candidate_count"],
                    "metrics": {arm: metrics(row[arm], gold) for arm in ("base", "treatment")}})
    aggregate = {arm: {metric: float(np.mean([row["metrics"][arm][metric] for row in per]))
                       for metric in ("mrr_at_8", "hit_at_3", "recall_at_20")}
                 for arm in ("base", "treatment")}
    clusters = sorted({(row["cohort"], row["repo"]) for row in per})
    if len(clusters) != 24:
        raise SystemExit("cluster denominator drift")
    differences = []
    for cluster in clusters:
        group = [row for row in per if (row["cohort"], row["repo"]) == cluster]
        differences.append(float(np.mean([row["metrics"]["treatment"]["mrr_at_8"]
                                          - row["metrics"]["base"]["mrr_at_8"] for row in group])))
    rng = np.random.default_rng(6101)
    values = np.asarray(differences, dtype=np.float64)
    draws = rng.integers(0, len(values), size=(100000, len(values)))
    paired = {"mean": aggregate["treatment"]["mrr_at_8"] - aggregate["base"]["mrr_at_8"],
              "cluster_interval_95": [float(x) for x in np.quantile(values[draws].mean(axis=1), [0.025, 0.975])],
              "cluster_wins": sum(value > 0 for value in differences),
              "cluster_ties": sum(value == 0 for value in differences),
              "cluster_losses": sum(value < 0 for value in differences)}
    gate = {"all_48_sealed": len(per) == 48,
            "mrr_plus_0_05": paired["mean"] >= 0.05,
            "cluster_lower_bound_positive": paired["cluster_interval_95"][0] > 0,
            "hit3_not_lower": aggregate["treatment"]["hit_at_3"] >= aggregate["base"]["hit_at_3"],
            "recall20_not_lower": aggregate["treatment"]["recall_at_20"] >= aggregate["base"]["recall_at_20"],
            "at_least_14_cluster_wins": paired["cluster_wins"] >= 14}
    result = {"schema_version": "are.g01-r61-evaluation/v1", "status": "complete",
              "claim_ceiling": "exposed ranking mechanism only", "cases": 48,
              "clusters": len(clusters), "aggregate": aggregate, "paired_difference": paired,
              "gate": gate, "advancement_passed": all(gate.values()),
              "source_seal_sha256": sha(seal_path), "label_sha256": LABEL_SHA,
              "per_case_private": per}
    if args.output.exists():
        raise SystemExit("output exists")
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")
    print(json.dumps({key: result[key] for key in ("aggregate", "paired_difference", "gate", "advancement_passed")}, sort_keys=True))


if __name__ == "__main__":
    main()
