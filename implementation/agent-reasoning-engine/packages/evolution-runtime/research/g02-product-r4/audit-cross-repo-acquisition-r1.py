#!/usr/bin/env python3
"""Evaluator-only leave-one-repository-out test of sealed G02 acquisition features."""

import argparse
import hashlib
import json
import math
import os
import sys
from collections import defaultdict
from pathlib import Path


EXPECTED_FEATURE_SEAL_SHA256 = "2f946fcdbc8b522572880677b8b2d1e0aa9b42d5b312b648029ad545a848a1bc"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repository(row):
    return row["pair_root"].split("/g02-cross-layer-pr3-")[-1].split("-")[0]


def sigmoid(value):
    if value >= 0:
        part = math.exp(-value)
        return 1 / (1 + part)
    part = math.exp(value)
    return part / (1 + part)


def vector(candidate):
    return [1.0, *candidate["features"], 1 / (1 + candidate["raw_rank"])]


def train(candidates):
    positives = sum(candidate["is_gold"] for candidate in candidates)
    negatives = len(candidates) - positives
    if not positives or not negatives:
        raise ValueError("training fold needs both classes")
    positive_weight = len(candidates) / (2 * positives)
    negative_weight = len(candidates) / (2 * negatives)
    weights = [0.0] * len(vector(candidates[0]))
    # Fixed full-batch weighted logistic fit, no random initialization, model
    # search, or access to labels from the held-out repository.
    for _ in range(400):
        gradient = [0.0] * len(weights)
        for candidate in candidates:
            values = vector(candidate)
            prediction = sigmoid(sum(a * b for a, b in zip(weights, values)))
            sample_weight = positive_weight if candidate["is_gold"] else negative_weight
            for index, value in enumerate(values):
                gradient[index] += sample_weight * (prediction - candidate["is_gold"]) * value
        for index in range(len(weights)):
            regularization = 0.0 if index == 0 else 0.03 * weights[index]
            weights[index] -= 0.2 * (gradient[index] / len(candidates) + regularization)
    return weights


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("feature_seal", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.feature_seal) != EXPECTED_FEATURE_SEAL_SHA256:
        raise SystemExit("feature seal hash mismatch")
    sealed = json.loads(args.feature_seal.read_text())
    if sealed["schema_version"] != "g02.cross-repo-acquisition-features/v1" or len(sealed["rows"]) != 12:
        raise SystemExit("feature seal schema or denominator mismatch")
    if len({row["instance_id"] for row in sealed["rows"]}) != 12:
        raise SystemExit("duplicate tasks")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    for row in sealed["rows"]:
        gold = set(loader.get(row["instance_id"]).files())
        candidates = [{**candidate, "is_gold": int(candidate["path"] in gold)}
                      for candidate in row["candidates"]]
        if len(candidates) != row["undelivered_top30"]:
            raise ValueError("candidate denominator drift")
        rows.append({"repository": repository(row), "instance_id": row["instance_id"],
                     "candidates": candidates})
    repos = sorted({row["repository"] for row in rows})
    if repos != ["elem", "nav", "open", "qut"] or any(sum(row["repository"] == repo for row in rows) != 3 for repo in repos):
        raise ValueError("unexpected repository folds")
    fold_results = []
    totals = defaultdict(int)
    for repo in repos:
        training = [candidate for row in rows if row["repository"] != repo
                    for candidate in row["candidates"]]
        weights = train(training)
        fold = {"repository": repo, "train_tasks": 9, "test_tasks": 3,
                "train_candidates": len(training), "train_gold": sum(x["is_gold"] for x in training),
                "weights": [round(weight, 6) for weight in weights], "task_results": []}
        for row in rows:
            if row["repository"] != repo:
                continue
            candidates = row["candidates"]
            raw = candidates[:3]
            learned = sorted(candidates,
                             key=lambda candidate: (-sum(a * b for a, b in zip(weights, vector(candidate))),
                                                    candidate["raw_rank"], candidate["path"]))[:3]
            record = {"instance_id": row["instance_id"], "candidate_count": len(candidates),
                      "candidate_gold": sum(x["is_gold"] for x in candidates),
                      "raw_top3_gold": sum(x["is_gold"] for x in raw),
                      "learned_top3_gold": sum(x["is_gold"] for x in learned),
                      "raw_top3_count": len(raw), "learned_top3_count": len(learned)}
            fold["task_results"].append(record)
            for key in ("candidate_count", "candidate_gold", "raw_top3_gold",
                        "learned_top3_gold", "raw_top3_count", "learned_top3_count"):
                totals[key] += record[key]
        fold_results.append(fold)
    output = {"schema_version": "g02.cross-repo-acquisition-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-native-rescore-or-new-reads",
              "feature_seal_sha256": EXPECTED_FEATURE_SEAL_SHA256,
              "training": "four leave-one-repository-out folds; fixed balanced logistic loss, 400 full-batch steps, learning rate 0.2, L2 0.03; three reads per task",
              "totals": dict(sorted(totals.items())), "folds": fold_results,
              "claim_ceiling": "Cross-repository source-acquisition ranking diagnostic only; not actual reads, final selections, native F1, cost, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
    print(json.dumps({"totals": output["totals"], "result_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
