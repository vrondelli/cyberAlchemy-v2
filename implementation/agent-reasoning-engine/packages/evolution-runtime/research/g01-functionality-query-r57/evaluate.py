#!/usr/bin/env python3
"""Evaluate the sealed G01 r57 functionality query comparison."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

LABEL_PINS = {"r1": "c614d7d92a5901654ee0dde4f1e62ebd6bb43cb4a6807f39b66db3ab39cf68c0",
              "r2b": "b8a2d0829aba9d4838af53677d2503cb1c976c5cd3f55d3347f625e513ce1ae2"}
ARMS = ("base", "raw_swerank", "functionality_swerank")
METRICS = ("mrr_at_8", "hit_at_3", "recall_at_20")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metrics(ranking, gold):
    positions = [i+1 for i, path in enumerate(ranking) if path in gold]
    first = min(positions) if positions else 10**9
    return {"mrr_at_8": 1/first if first <= 8 else 0.0,
            "hit_at_3": 1.0 if first <= 3 else 0.0,
            "recall_at_20": sum(path in gold for path in ranking[:20])/len(gold)}


def ci(values, seed):
    values = np.asarray(values, dtype=np.float64)
    rng = np.random.default_rng(seed)
    draws = rng.integers(0, len(values), size=(100000, len(values)))
    return [float(x) for x in np.quantile(values[draws].mean(axis=1), [0.025, 0.975])]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--archive", type=Path, required=True)
    p.add_argument("--source", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    a = p.parse_args()
    seal_file = a.source / "SOURCE-SEAL.json"
    source_file = a.source / "RANKINGS.jsonl"
    seal = json.loads(seal_file.read_text())
    if seal["status"] != "complete" or seal["cases"] != 48 or seal["rankings_sha256"] != sha(source_file):
        raise SystemExit("source not sealed")
    labels = {}
    for cohort in ("r1", "r2b"):
        path = a.archive / f"evaluator-{cohort}/EVALUATOR-AUDIT.json"
        if sha(path) != LABEL_PINS[cohort]:
            raise SystemExit("label drift")
        for x in json.loads(path.read_text())["per_case_private"]:
            if not x["label_valid"]:
                raise SystemExit("invalid label")
            labels[(cohort, x["id"])] = set(x["admitted_paths"])
    source = [json.loads(x) for x in source_file.read_text().splitlines()]
    if len(source) != 48 or len(labels) != 48:
        raise SystemExit("denominator drift")
    per = []
    for case in source:
        gold = labels[(case["cohort"], case["id"])]
        per.append({"cohort": case["cohort"], "id": case["id"], "repo": case["repo"],
                    "summary_valid": case["summary_valid"], "gold": sorted(gold),
                    "metrics": {arm: metrics(case[arm], gold) for arm in ARMS}})
    aggregate = {arm: {name: float(np.mean([x["metrics"][arm][name] for x in per])) for name in METRICS} for arm in ARMS}
    clusters = sorted({(x["cohort"], x["repo"]) for x in per})
    differences = {}
    for comparator, seed in (("base", 5701), ("raw_swerank", 5702)):
        values = []
        for cluster in clusters:
            group = [x for x in per if (x["cohort"], x["repo"]) == cluster]
            values.append(float(np.mean([x["metrics"]["functionality_swerank"]["mrr_at_8"]
                - x["metrics"][comparator]["mrr_at_8"] for x in group])))
        differences[comparator] = {"mean": aggregate["functionality_swerank"]["mrr_at_8"] - aggregate[comparator]["mrr_at_8"],
            "cluster_interval_95": ci(values, seed), "cluster_wins": sum(x > 0 for x in values),
            "cluster_ties": sum(x == 0 for x in values), "cluster_losses": sum(x < 0 for x in values)}
    treatment = aggregate["functionality_swerank"]
    gate = {"all_48_sealed": len(per) == 48,
            "at_least_42_valid_summaries": sum(x["summary_valid"] for x in per) >= 42,
            "mrr_plus_0_05_vs_base": differences["base"]["mean"] >= 0.05,
            "mrr_plus_0_03_vs_raw_swerank": differences["raw_swerank"]["mean"] >= 0.03,
            "both_cluster_lower_bounds_positive": all(x["cluster_interval_95"][0] > 0 for x in differences.values()),
            "hit3_not_lower": all(treatment["hit_at_3"] >= aggregate[arm]["hit_at_3"] for arm in ("base", "raw_swerank")),
            "recall20_not_lower": all(treatment["recall_at_20"] >= aggregate[arm]["recall_at_20"] for arm in ("base", "raw_swerank")),
            "at_least_14_cluster_wins_vs_base": differences["base"]["cluster_wins"] >= 14}
    result = {"schema_version": "are.g01-r57-evaluation/v1", "status": "complete", "claim_ceiling": "exposed mechanism selection only",
              "cases": 48, "clusters": len(clusters), "valid_summaries": sum(x["summary_valid"] for x in per),
              "aggregate": aggregate, "paired_differences": differences, "gate": gate,
              "advancement_passed": all(gate.values()), "source_seal_sha256": sha(seal_file),
              "label_sha256": LABEL_PINS, "per_case_private": per}
    if a.output.exists():
        raise SystemExit("output exists")
    a.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")
    print(json.dumps({k: result[k] for k in ("valid_summaries", "aggregate", "paired_differences", "gate", "advancement_passed")}, sort_keys=True))


if __name__ == "__main__":
    main()
