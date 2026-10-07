#!/usr/bin/env python3
"""Evaluator-only File-F1 counterfactual for sealed r11 Python neighbor reads."""

import argparse
import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


RANKED_SHA256 = "55f3175c54d683cf9d4fac907fa34cff4982782e092acf9a2d35a50f0fb8e7db"
PRIOR_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_f1(prediction, gold):
    return 2 * len(prediction & gold) / (len(prediction) + len(gold)) if prediction or gold else 1.0


def mean(values):
    return sum(values) / len(values)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("ranked_seal", type=Path)
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("parquet", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if (sha(args.ranked_seal) != RANKED_SHA256 or sha(args.prior_seal) != PRIOR_SHA256 or
            sha(args.parquet) != PARQUET_SHA256):
        raise SystemExit("sealed input drift")
    ranked = json.loads(args.ranked_seal.read_text())
    prior = json.loads(args.prior_seal.read_text())
    if ([row["ordinal"] for row in ranked["rows"]] != [1, 2, 3, 5, 6, 7, 9, 10, 11] or
            ranked.get("fixed_read_budget") != 3 or
            ranked.get("posture") != "source-only-exposed-development-no-gold-dsh-or-score"):
        raise SystemExit("unexpected ranked source seal")
    table = parquet.read_table(args.parquet, columns=["instance_id", "gold_context"])
    ids = table.column("instance_id").to_pylist()
    if len(ids) != len(set(ids)):
        raise SystemExit("duplicate native instance id")
    positions = {value: index for index, value in enumerate(ids)}
    prior_rows = {row["ordinal"]: row for row in prior["rows"]}
    rows = []
    for row in ranked["rows"]:
        ordinal = row["ordinal"]
        old = prior_rows[ordinal]
        if row["instance_id"] != old["instance_id"]:
            raise SystemExit("task identity mismatch")
        root = Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
        prediction_path = root / "policy-pruning/prediction.json"
        score_path = root / "policy-pruning/native-score.json"
        prediction = json.loads(prediction_path.read_text())
        native = json.loads(score_path.read_text())["native"]["final"]["file"]
        if prediction["instance_id"] != row["instance_id"]:
            raise SystemExit("prediction task mismatch")
        selected = set(prediction["traj_data"]["pred_files"])
        additional = set(row["top3"])
        if len(additional) != 3 or additional & selected or additional & set(old["delivered_paths"]):
            raise SystemExit("non-new proposal")
        gold_context = json.loads(table.column("gold_context")[positions[row["instance_id"]]].as_py())
        gold = {item["file"] for item in gold_context}
        hits = len(selected & gold)
        if (native["pred_size"] != len(selected) or native["gold_size"] != len(gold) or
                native["intersection"] != hits or
                abs(native["precision"] - hits / len(selected)) > 1e-12 or
                abs(native["coverage"] - hits / len(gold)) > 1e-12):
            raise SystemExit("native scorer mismatch")
        baseline = file_f1(selected, gold)
        expanded = file_f1(selected | additional, gold)
        rows.append({"ordinal": ordinal, "repo": old["repo"],
                     "prediction_sha256": sha(prediction_path), "native_score_sha256": sha(score_path),
                     "gold_count": len(gold), "baseline_selected_count": len(selected),
                     "baseline_gold_hits": hits, "added_count": len(additional),
                     "added_gold_hits": len(additional & gold),
                     "baseline_file_f1": baseline, "expanded_file_f1": expanded,
                     "file_f1_delta": expanded - baseline})
    groups = defaultdict(list)
    for row in rows:
        groups[row["repo"]].append(row)
    summary = {"tasks": len(rows), "added_read_slots": sum(row["added_count"] for row in rows),
               "new_gold_hits": sum(row["added_gold_hits"] for row in rows),
               "baseline_mean_file_f1": mean([row["baseline_file_f1"] for row in rows]),
               "expanded_mean_file_f1": mean([row["expanded_file_f1"] for row in rows]),
               "mean_file_f1_delta": mean([row["file_f1_delta"] for row in rows]),
               "improved_tasks": sum(row["file_f1_delta"] > 0 for row in rows),
               "regressed_tasks": sum(row["file_f1_delta"] < 0 for row in rows),
               "tied_tasks": sum(row["file_f1_delta"] == 0 for row in rows),
               "repo_mean_deltas": {repo: mean([row["file_f1_delta"] for row in members])
                                    for repo, members in sorted(groups.items())}}
    output = {"schema_version": "g02.r11-python-neighbor-file-counterfactual/v1",
              "posture": "evaluator-only-exposed-development-no-model-no-actual-read",
              "ranked_seal_sha256": RANKED_SHA256, "prior_seal_sha256": PRIOR_SHA256,
              "native_gold_parquet_sha256": PARQUET_SHA256,
              "rows": rows, "summary": summary,
              "claim_ceiling": "Set-based File-F1 counterfactual only; no actual delivered reads, Span-F1, token/time cost, independent cohort, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"summary": summary, "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
