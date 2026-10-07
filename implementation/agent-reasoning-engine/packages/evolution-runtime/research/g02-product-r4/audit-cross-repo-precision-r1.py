#!/usr/bin/env python3
"""Evaluator-only, leave-one-repository-out G02 selected-file precision test.

Source-only features were sealed before labels. No prediction is written or
native scorer rerun. This is exposed development, not an independent holdout.
"""

import argparse
import hashlib
import importlib.util
import json
import math
import os
import statistics
import sys
from collections import defaultdict
from pathlib import Path


FEATURE_SEAL_SHA256 = "f5d346a4b72ec9f6dee0fc95f81f91b0de97f8f0818d2c9e1c414ce88c8db3fc"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
THRESHOLD = 0.60
EPOCHS = 400
LEARNING_RATE = 0.10
L2 = 0.05


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_f1(true_positive, gold_count, selected_count):
    denominator = gold_count + selected_count
    return 2 * true_positive / denominator if denominator else 1.0


def sigmoid(value):
    if value >= 0:
        return 1 / (1 + math.exp(-value))
    exp_value = math.exp(value)
    return exp_value / (1 + exp_value)


def train(samples):
    dimensions = len(samples[0]["features"])
    centers = [statistics.mean(item["features"][i] for item in samples) for i in range(dimensions)]
    scales = [statistics.pstdev(item["features"][i] for item in samples) or 1.0 for i in range(dimensions)]
    normalized = [[1.0] + [(item["features"][i] - centers[i]) / scales[i]
                           for i in range(dimensions)] for item in samples]
    weights = [0.0] * (dimensions + 1)
    for _ in range(EPOCHS):
        gradient = [0.0] * len(weights)
        for item, values in zip(samples, normalized):
            residual = sigmoid(sum(w * x for w, x in zip(weights, values))) - item["label"]
            for i, value in enumerate(values):
                gradient[i] += residual * value
        for i in range(len(weights)):
            gradient[i] = gradient[i] / len(samples) + (L2 * weights[i] if i else 0.0)
            weights[i] -= LEARNING_RATE * gradient[i]
    return centers, scales, weights


def predict(model, features):
    centers, scales, weights = model
    values = [1.0] + [(value - centers[i]) / scales[i] for i, value in enumerate(features)]
    return sigmoid(sum(w * x for w, x in zip(weights, values)))


def summarize(rows):
    return {"pairs": len(rows),
            "files_removed": sum(row["files_removed"] for row in rows),
            "correct_removed": sum(row["correct_removed"] for row in rows),
            "false_removed": sum(row["false_removed"] for row in rows),
            "mean_original_file_f1": round(statistics.mean(row["original_file_f1"] for row in rows), 6),
            "mean_pruned_file_f1": round(statistics.mean(row["pruned_file_f1"] for row in rows), 6),
            "mean_dsh_file_f1": round(statistics.mean(row["dsh_file_f1"] for row in rows), 6),
            "mean_file_f1_delta": round(statistics.mean(row["file_f1_delta"] for row in rows), 6),
            "improved_pairs": sum(row["file_f1_delta"] > 1e-9 for row in rows),
            "regressed_pairs": sum(row["file_f1_delta"] < -1e-9 for row in rows)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("feature_seal", type=Path)
    parser.add_argument("source_script", type=Path)
    parser.add_argument("r2_plan", type=Path)
    parser.add_argument("r3_plan", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.feature_seal) != FEATURE_SEAL_SHA256:
        raise SystemExit("feature seal hash mismatch")
    sealed = json.loads(args.feature_seal.read_text())
    if sealed.get("schema_version") != "g02.selected-file-source-features/v1" or \
            sealed.get("posture") != "source-and-ARE-receipt-only-exposed-no-gold-no-DSH-no-native-score" or \
            sha(args.source_script) != sealed["script_sha256"]:
        raise SystemExit("feature provenance mismatch")
    spec = importlib.util.spec_from_file_location("g02_selected_features", args.source_script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    plans = {"r2": args.r2_plan, "r3": args.r3_plan}
    pairs = []
    for cohort, plan_path in plans.items():
        if sha(plan_path) != sealed["plan_sha256"][cohort]:
            raise SystemExit("plan drift")
        plan = json.loads(plan_path.read_text())
        feature_rows = sealed["cohorts"][cohort]
        expected = 24 if cohort == "r2" else 12
        if len(feature_rows) != expected or len(plan["ordered_pairs"]) != expected:
            raise SystemExit("plan/feature denominator mismatch")
        for pair, row in zip(plan["ordered_pairs"], feature_rows):
            if module.extract_pair(pair) != row:
                raise SystemExit("source-only feature replay mismatch")
            pairs.append((cohort, pair, row))
    parquet = UPSTREAM / "data/full.parquet"
    if sha(parquet) != PARQUET_SHA256:
        raise SystemExit("native gold parquet drift")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(parquet))
    tasks = []
    unscored = {"r2": [], "r3": []}
    for cohort, pair, row in pairs:
        root = Path(pair["root"])
        are_score = root / "evidence/run/native-score.json"
        dsh_score = root / "dsh-export/native-score.json"
        if not are_score.is_file() or not dsh_score.is_file():
            unscored[cohort].append(pair["instance_id"].split("__")[-1])
            continue
        if row["status"] != "features-sealed":
            raise SystemExit("scored task without source features")
        gold = set(loader.get(pair["instance_id"]).files())
        selected = {item["path"] for item in row["selected"]}
        are_metric = json.loads(are_score.read_text())["native"]["final"]["file"]
        dsh_metric = json.loads(dsh_score.read_text())["native"]["final"]["file"]
        if are_metric["intersection"] != len(selected & gold) or \
                are_metric["gold_size"] != len(gold) or are_metric["pred_size"] != len(selected) or \
                dsh_metric["gold_size"] != len(gold):
            raise SystemExit("native score/prediction/gold mismatch")
        files = [{"path": item["path"], "features": item["features"],
                  "label": int(item["path"] in gold)} for item in row["selected"]]
        tasks.append({"cohort": cohort, "id": pair["instance_id"].split("__")[-1],
                      "repo": row["repo"], "gold_count": len(gold), "files": files,
                      "dsh_file_f1": file_f1(dsh_metric["intersection"], len(gold), dsh_metric["pred_size"]),
                      "score_sha256": {"are": sha(are_score), "dsh": sha(dsh_score)}})
    if sum(task["cohort"] == "r2" for task in tasks) != 23 or \
            sum(task["cohort"] == "r3" for task in tasks) != 9:
        raise SystemExit("scored denominator mismatch")
    repositories = sorted({task["repo"] for task in tasks})
    if repositories != ["elem", "nav", "open", "qut"]:
        raise SystemExit("repository fold mismatch")
    rows = []
    fold_training = {}
    for heldout in repositories:
        training = [{"features": item["features"], "label": item["label"]}
                    for task in tasks if task["repo"] != heldout for item in task["files"]]
        if not training or len({item["label"] for item in training}) != 2:
            raise SystemExit("training label collapse")
        model = train(training)
        fold_training[heldout] = {"training_files": len(training),
                                  "training_correct": sum(item["label"] for item in training)}
        for task in tasks:
            if task["repo"] != heldout:
                continue
            kept = [item for item in task["files"] if predict(model, item["features"]) >= THRESHOLD]
            removed = len(task["files"]) - len(kept)
            correct_removed = sum(item["label"] for item in task["files"]) - sum(item["label"] for item in kept)
            original_f1 = file_f1(sum(item["label"] for item in task["files"]),
                                  task["gold_count"], len(task["files"]))
            pruned_f1 = file_f1(sum(item["label"] for item in kept), task["gold_count"], len(kept))
            rows.append({"cohort": task["cohort"], "id": task["id"], "repo": heldout,
                         "selected_files": len(task["files"]), "files_removed": removed,
                         "correct_removed": correct_removed, "false_removed": removed - correct_removed,
                         "original_file_f1": round(original_f1, 8),
                         "pruned_file_f1": round(pruned_f1, 8),
                         "dsh_file_f1": round(task["dsh_file_f1"], 8),
                         "file_f1_delta": round(pruned_f1 - original_f1, 8),
                         "score_sha256": task["score_sha256"]})
    by_cohort = {cohort: summarize([row for row in rows if row["cohort"] == cohort])
                 for cohort in ("r2", "r3")}
    by_repo = {repo: summarize([row for row in rows if row["repo"] == repo]) for repo in repositories}
    total = summarize(rows)
    development_gate = (all(by_cohort[name]["mean_file_f1_delta"] >= 0.03 for name in ("r2", "r3"))
                        and all(by_repo[name]["mean_file_f1_delta"] >= 0 for name in repositories)
                        and total["false_removed"] >= 8 and total["correct_removed"] <= 4)
    receipt = {"schema_version": "g02.cross-repo-selected-file-precision-audit/v1",
               "posture": "evaluator-only-exposed-development-no-model-no-native-rescore",
               "feature_seal_sha256": FEATURE_SEAL_SHA256,
               "source_script_sha256": sha(args.source_script),
               "gold_parquet_sha256": PARQUET_SHA256,
               "procedure": {"heldout_unit": "entire repository", "threshold": THRESHOLD,
                             "training_epochs": EPOCHS, "learning_rate": LEARNING_RATE,
                             "l2_penalty": L2, "feature_standardization": "training-fold only"},
               "source_only_replay": "36/36 exact rows", "unscored": unscored,
               "fold_training": fold_training, "rows": rows, "totals": total,
               "by_cohort": by_cohort, "by_repo": by_repo,
               "development_gate": {"passed": development_gate,
                                    "rule": "mean File-F1 delta >=0.03 in each exposed cohort, nonnegative in every held-out repository, >=8 false files removed and <=4 correct files removed"},
               "claim_ceiling": "Cross-repository exposed diagnostic only. Does not replace live terminal decisions, native span scores, fresh holdout, or superiority evidence.",
               "open_questions": ["If the gate passes, can a receipt-backed live final selector reproduce the cross-repository signal and preserve Span-F1/cost?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"status": "audited", "receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "totals": total, "by_cohort": by_cohort, "by_repo": by_repo,
                      "development_gate": development_gate}, sort_keys=True))


if __name__ == "__main__":
    main()
