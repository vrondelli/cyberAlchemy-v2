#!/usr/bin/env python3
"""Evaluator-only native file-hit and set-F1 audit of a sealed source rule."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path("/home/vlad_/are-benchmark-archive/g02-r11-rare-exact-symbol-exposed-r1")
SEAL = ROOT / "SOURCE-SEAL.json"
PRIOR = Path("/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002/SEAL.json")
PARQUET = Path("/home/vlad_/are-benchmark-archive/g01-r8-eight-task-evaluator-r1/full.parquet")
OUTPUT = ROOT / "AUDIT.json"
PINS = {SEAL: "265e8dbb499bfc88e14a41a390296995af12b110c73d39b6a974306fb0835536",
        PRIOR: "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901",
        PARQUET: "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"}
ORDINALS = [1, 2, 3, 5, 6, 7, 9, 10, 11]


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def f1(prediction, gold):
    return 2 * len(prediction & gold) / (len(prediction) + len(gold)) if prediction or gold else 1.0


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise ValueError("output-exists-or-pinned-input-drift")
    seal = json.loads(SEAL.read_text())
    prior = json.loads(PRIOR.read_text())
    if (seal["schema_version"] != "g02.r11-rare-exact-symbol-exposed-source-seal/v1" or
            seal["posture"] != "source-only-exposed-development-no-gold-model-or-score" or
            seal["summary"] != {"tasks": 9, "proposals": 9, "model_calls": 0, "gold_loaded": False} or
            [row["ordinal"] for row in seal["rows"]] != ORDINALS):
        raise ValueError("source-seal-shape")
    old_rows = {row["ordinal"]: row for row in prior["rows"]}
    table = parquet.read_table(PARQUET, columns=["instance_id", "base_commit", "gold_context"]).to_pylist()
    by_id = {row["instance_id"]: row for row in table}
    if len(by_id) != len(table):
        raise ValueError("duplicate-native-id")
    rows = []
    by_repo = defaultdict(list)
    for row in seal["rows"]:
        ordinal = row["ordinal"]
        old = old_rows[ordinal]
        native_row = by_id[row["instance_id"]]
        if (row["instance_id"] != old["instance_id"] or row["base_commit"] != old["base_commit"] or
                row["base_commit"] != native_row["base_commit"] or
                row["issue_sha256"] != old["issue_sha256"] or row["repo"] != old["repo"]):
            raise ValueError("task-identity-drift")
        proposed = set(row["proposed"])
        if (len(proposed) != len(row["proposed"]) or len(proposed) > 3 or
                proposed & set(old["delivered_paths"])):
            raise ValueError("proposal-invariant")
        raw = (Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw")
        prediction_path = raw / "policy-pruning/prediction.json"
        score_path = raw / "policy-pruning/native-score.json"
        prediction = json.loads(prediction_path.read_text())
        score = json.loads(score_path.read_text())["native"]["final"]["file"]
        selected = set(prediction["traj_data"]["pred_files"])
        if prediction["instance_id"] != row["instance_id"] or proposed & selected:
            raise ValueError("prediction-identity-or-overlap")
        gold = {item["file"] for item in json.loads(native_row["gold_context"])}
        if (score["pred_size"] != len(selected) or score["gold_size"] != len(gold) or
                score["intersection"] != len(selected & gold)):
            raise ValueError("native-score-parity")
        baseline = f1(selected, gold)
        expanded = f1(selected | proposed, gold)
        record = {"ordinal": ordinal, "repo": row["repo"],
                  "proposed_count": len(proposed), "new_gold_hits": len(proposed & (gold - set(old["delivered_paths"]))),
                  "false_positive_count": len(proposed - gold),
                  "baseline_file_f1": baseline, "expanded_file_f1": expanded,
                  "file_f1_delta": expanded - baseline,
                  "prediction_sha256": sha(prediction_path), "native_score_sha256": sha(score_path)}
        rows.append(record)
        by_repo[row["repo"]].append(record)
    summary = {"tasks": len(rows), "proposals": sum(row["proposed_count"] for row in rows),
               "new_gold_hits": sum(row["new_gold_hits"] for row in rows),
               "false_positive_count": sum(row["false_positive_count"] for row in rows),
               "baseline_mean_file_f1": sum(row["baseline_file_f1"] for row in rows) / len(rows),
               "expanded_mean_file_f1": sum(row["expanded_file_f1"] for row in rows) / len(rows),
               "mean_file_f1_delta": sum(row["file_f1_delta"] for row in rows) / len(rows),
               "improved_tasks": sum(row["file_f1_delta"] > 0 for row in rows),
               "regressed_tasks": sum(row["file_f1_delta"] < 0 for row in rows),
               "tied_tasks": sum(row["file_f1_delta"] == 0 for row in rows),
               "repo_mean_deltas": {repo: sum(item["file_f1_delta"] for item in group) / len(group)
                                    for repo, group in sorted(by_repo.items())}}
    receipt = {"schema_version": "g02.r11-rare-exact-symbol-exposed-audit/v1",
               "posture": "evaluator-only-exposed-development-no-model-no-actual-read",
               "source_seal_sha256": PINS[SEAL], "prior_seal_sha256": PINS[PRIOR],
               "native_gold_parquet_sha256": PINS[PARQUET], "script_sha256": sha(Path(__file__)),
               "rows": rows, "summary": summary,
               "claim_ceiling": "Set-based File-F1 development counterfactual only; no actual delivered read, Span-F1, token/time cost, independent cohort, or superiority."}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"summary": summary, "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
