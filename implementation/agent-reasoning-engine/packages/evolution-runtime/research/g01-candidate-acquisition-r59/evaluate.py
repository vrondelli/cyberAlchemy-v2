#!/usr/bin/env python3
"""Evaluate sealed r59 candidate reach against pinned evaluator labels."""

import argparse
import hashlib
import json
from pathlib import Path

LABEL_SHA = {"r1": "c614d7d92a5901654ee0dde4f1e62ebd6bb43cb4a6807f39b66db3ab39cf68c0",
             "r2b": "b8a2d0829aba9d4838af53677d2503cb1c976c5cd3f55d3347f625e513ce1ae2"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", type=Path, required=True)
    ap.add_argument("--source", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    seal_path = args.source / "SOURCE-SEAL.json"
    candidate_path = args.source / "CANDIDATES.jsonl"
    seal = json.loads(seal_path.read_text())
    if seal["status"] != "complete" or seal["cases"] != 48 or seal["gold_opened"] or seal["candidate_sha256"] != sha(candidate_path):
        raise SystemExit("source not sealed")
    labels = {}
    for cohort in ("r1", "r2b"):
        label_path = args.archive / f"evaluator-{cohort}/EVALUATOR-AUDIT.json"
        if sha(label_path) != LABEL_SHA[cohort]:
            raise SystemExit("label drift")
        for row in json.loads(label_path.read_text())["per_case_private"]:
            if not row["label_valid"]:
                raise SystemExit("invalid label")
            labels[(cohort, row["id"])] = set(row["admitted_paths"])
    source = [json.loads(line) for line in candidate_path.read_text().splitlines()]
    if len(source) != 48 or len(labels) != 48:
        raise SystemExit("denominator drift")
    per = []
    for row in source:
        gold = labels[(row["cohort"], row["id"])]
        arm = {}
        for name in ("a", "b", "c"):
            candidates = row[name]
            arm[name] = {"hit": bool(gold.intersection(candidates)),
                         "gold_recall": len(gold.intersection(candidates)) / len(gold),
                         "candidates": len(candidates)}
        per.append({"cohort": row["cohort"], "id": row["id"], "repo": row["repo"],
                    "gold": sorted(gold), "arms": arm})
    aggregate = {}
    for name in ("a", "b", "c"):
        aggregate[name] = {"hit": sum(row["arms"][name]["hit"] for row in per),
                           "mean_gold_recall": sum(row["arms"][name]["gold_recall"] for row in per) / 48,
                           "mean_candidates": sum(row["arms"][name]["candidates"] for row in per) / 48,
                           "max_candidates": max(row["arms"][name]["candidates"] for row in per),
                           "new_vs_a": sum(row["arms"][name]["hit"] and not row["arms"]["a"]["hit"] for row in per),
                           "lost_vs_a": sum(row["arms"]["a"]["hit"] and not row["arms"][name]["hit"] for row in per)}
    gate = {name: {"all_48_sealed": len(per) == 48,
                   "at_least_4_new_reaches": aggregate[name]["new_vs_a"] >= 4,
                   "no_reach_losses": aggregate[name]["lost_vs_a"] == 0,
                   "at_most_30_candidates": aggregate[name]["max_candidates"] <= 30}
            for name in ("b", "c")}
    result = {"schema_version": "are.g01-r59-evaluation/v1", "status": "complete",
              "claim_ceiling": "exposed acquisition mechanism only", "cases": 48,
              "aggregate": aggregate, "gate": gate,
              "advancing_arms": [name for name in gate if all(gate[name].values())],
              "source_seal_sha256": sha(seal_path), "label_sha256": LABEL_SHA,
              "per_case_private": per}
    if args.output.exists():
        raise SystemExit("output exists")
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")
    print(json.dumps({key: result[key] for key in ("aggregate", "gate", "advancing_arms")}, sort_keys=True))


if __name__ == "__main__":
    main()
