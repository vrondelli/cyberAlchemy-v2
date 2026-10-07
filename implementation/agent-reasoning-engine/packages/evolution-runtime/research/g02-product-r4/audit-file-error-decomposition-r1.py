#!/usr/bin/env python3
"""Evaluator-only file-error decomposition of frozen, exposed G02 r2/r3 pairs.

No prediction is modified and no native gold paths are exported.
"""

import argparse
import hashlib
import json
import os
import statistics
import sys
from collections import defaultdict
from pathlib import Path


PLAN_SHA256 = {
    "r2": "bfc92b5a331fc462834d5dd2bb1d93643a5dfaa5dc0817558c0a2c80bf8db808",
    "r3": "0ccc9f027000682bbe950e8d8561ff150714aeb9610608149b0c26e4d41da53a",
}
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
COUNT_FIELDS = ("gold_files", "delivered_gold", "undelivered_gold", "delivered_omitted_gold",
                "selected_gold", "selected_false", "selected_not_delivered",
                "dsh_gold", "dsh_false", "dsh_gold_unseen_by_are")
MEAN_FIELDS = ("are_file_f1", "dsh_file_f1", "file_f1_gap", "drop_false_oracle_f1",
               "delivered_oracle_f1")


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_f1(true_positive, gold_count, selected_count):
    denominator = gold_count + selected_count
    return 2 * true_positive / denominator if denominator else 1.0


def verify_native(prediction, native, gold):
    selected = set(prediction["traj_data"]["pred_files"])
    metric = native["native"]["final"]["file"]
    if metric["intersection"] != len(selected & gold) or \
            metric["gold_size"] != len(gold) or metric["pred_size"] != len(selected):
        raise ValueError("native file metric/prediction/gold mismatch")
    return selected


def analyze(pair, loader):
    root = Path(pair["root"])
    files = {"are_prediction": root / "evidence/run/prediction.json",
             "are_score": root / "evidence/run/native-score.json",
             "dsh_prediction": root / "dsh-export/prediction.json",
             "dsh_score": root / "dsh-export/native-score.json"}
    if not all(path.is_file() for path in files.values()):
        return None
    data = {key: json.loads(path.read_text()) for key, path in files.items()}
    instance_id = pair["instance_id"]
    if data["are_prediction"]["instance_id"] != instance_id or \
            data["dsh_prediction"]["instance_id"] != instance_id:
        raise ValueError("pair prediction identity mismatch")
    gold = set(loader.get(instance_id).files())
    are = verify_native(data["are_prediction"], data["are_score"], gold)
    dsh = verify_native(data["dsh_prediction"], data["dsh_score"], gold)
    delivered = {path for step in data["are_prediction"]["traj_data"]["pred_steps"]
                 for path in step["files"]}
    tp = len(are & gold)
    observed = len(delivered & gold)
    if tp > observed:
        # Keep receipt-bound selection violations explicit, never silently
        # treat an unobserved selected file as a delivered observation.
        raise ValueError("selected gold file absent from delivered reads")
    dsh_tp = len(dsh & gold)
    return {"id": instance_id.split("__")[-1], "repo": pair["suffix"].split("-")[1],
            "input_sha256": {key: sha(path) for key, path in files.items()},
            "gold_files": len(gold), "delivered_gold": observed,
            "undelivered_gold": len(gold - delivered),
            "delivered_omitted_gold": len((gold & delivered) - are),
            "selected_gold": tp, "selected_false": len(are - gold),
            "selected_not_delivered": len(are - delivered),
            "dsh_gold": dsh_tp, "dsh_false": len(dsh - gold),
            "dsh_gold_unseen_by_are": len((dsh & gold) - delivered),
            "are_file_f1": file_f1(tp, len(gold), len(are)),
            "dsh_file_f1": file_f1(dsh_tp, len(gold), len(dsh)),
            "file_f1_gap": file_f1(tp, len(gold), len(are)) - file_f1(dsh_tp, len(gold), len(dsh)),
            "drop_false_oracle_f1": file_f1(tp, len(gold), tp),
            "delivered_oracle_f1": file_f1(observed, len(gold), observed)}


def summarize(rows):
    result = {"pairs": len(rows)}
    result.update({key: sum(row[key] for row in rows) for key in COUNT_FIELDS})
    result.update({"mean_" + key: round(statistics.mean(row[key] for row in rows), 6)
                   for key in MEAN_FIELDS})
    result["pairs_undelivered_gold"] = sum(row["undelivered_gold"] > 0 for row in rows)
    result["pairs_delivered_omitted_gold"] = sum(row["delivered_omitted_gold"] > 0 for row in rows)
    result["pairs_selected_false"] = sum(row["selected_false"] > 0 for row in rows)
    result["pairs_drop_false_oracle_beats_dsh"] = sum(row["drop_false_oracle_f1"] > row["dsh_file_f1"] for row in rows)
    result["pairs_delivered_oracle_beats_dsh"] = sum(row["delivered_oracle_f1"] > row["dsh_file_f1"] for row in rows)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("r2_plan", type=Path)
    parser.add_argument("r3_plan", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    plans = {"r2": args.r2_plan, "r3": args.r3_plan}
    for name, path in plans.items():
        if sha(path) != PLAN_SHA256[name]:
            raise SystemExit(f"{name} plan hash drift")
    parquet = UPSTREAM / "data/full.parquet"
    if sha(parquet) != PARQUET_SHA256:
        raise SystemExit("native gold parquet drift")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(parquet))
    cohorts = {}
    for name, path in plans.items():
        plan = json.loads(path.read_text())
        pairs = plan["ordered_pairs"]
        expected = 24 if name == "r2" else 12
        if len(pairs) != expected or len({pair["instance_id"] for pair in pairs}) != expected:
            raise SystemExit(f"unexpected {name} plan denominator")
        rows = []
        unscored = []
        for pair in pairs:
            row = analyze(pair, loader)
            if row is None:
                unscored.append(pair["instance_id"].split("__")[-1])
            else:
                rows.append(row)
        expected_scored = 23 if name == "r2" else 9
        if len(rows) != expected_scored:
            raise SystemExit(f"unexpected {name} scored denominator")
        by_repo = defaultdict(list)
        for row in rows:
            by_repo[row["repo"]].append(row)
        cohorts[name] = {"attempted": expected, "scored": len(rows), "unscored_ids": unscored,
                         "rows": rows, "totals": summarize(rows),
                         "by_repo": {repo: summarize(items) for repo, items in sorted(by_repo.items())}}
    receipt = {"schema_version": "g02.exposed-file-error-decomposition/v1",
               "posture": "evaluator-only-exposed-development-no-model-no-prediction-mutation",
               "plan_sha256": PLAN_SHA256, "gold_parquet_sha256": PARQUET_SHA256,
               "cohorts": cohorts,
               "claim_ceiling": "Error anatomy on two exposed scored cohorts; gold-based oracle rows are diagnostic ceilings, not deployable candidate performance, fresh holdout, or superiority.",
               "open_questions": ["Which source-only or receipt-backed signal can correct false final file selections without losing already-correct files?",
                                  "Which acquisition mechanism can recover never-delivered gold files at an acceptable false-read and token cost?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"status": "audited", "receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "r2": cohorts["r2"]["totals"], "r3": cohorts["r3"]["totals"]}, sort_keys=True))


if __name__ == "__main__":
    main()
