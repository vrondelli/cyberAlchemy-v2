#!/usr/bin/env python3
"""Evaluator-only file-set counterfactual for sealed exposed r11 C++ choices."""

import argparse
import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


RESPONSE_SEAL_SHA = "5ebfe8c89292b071566b099e7af442e3df83022633ba947d36f4f06823439bf0"
EVAL_AUDIT_SHA = "fbe0b392b591be396f22b83707e71b0c64de4daa16903c3dac4a4003b319a458"
PRIOR_SHA = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
PARQUET_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def f1(predicted, gold):
    return 2 * len(predicted & gold) / (len(predicted) + len(gold)) if predicted or gold else 1.0


def normalize(path):
    path = path.replace("\\", "/")
    if path.startswith("/testbed/"):
        return path[len("/testbed/"):]
    if path.startswith("/workspace/"):
        parts = path[len("/workspace/"):].split("/", 1)
        return parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip("/").removeprefix("./")


def mean(values):
    return sum(values) / len(values)


def main():
    ap = argparse.ArgumentParser()
    for name in ("choice_root", "prior_seal", "parquet", "output"):
        ap.add_argument(name, type=Path)
    args = ap.parse_args()
    root = args.choice_root
    if (sha(root / "SEALED-RESPONSES.json") != RESPONSE_SEAL_SHA or
            sha(root / "EVAL-AUDIT.json") != EVAL_AUDIT_SHA or
            sha(args.prior_seal) != PRIOR_SHA or sha(args.parquet) != PARQUET_SHA):
        raise SystemExit("sealed input drift")
    sealed = json.loads((root / "SEALED-RESPONSES.json").read_text())
    audit = json.loads((root / "EVAL-AUDIT.json").read_text())
    packets = json.loads((root / "PACKETS.json").read_text())["ordered_packets"]
    prior = json.loads(args.prior_seal.read_text())
    if ([row["ordinal"] for row in sealed["rows"]] != [4, 8, 12] or
            [row["ordinal"] for row in audit["rows"]] != [4, 8, 12] or
            [row["ordinal"] for row in packets] != [4, 8, 12]):
        raise SystemExit("ordinal binding drift")
    table = parquet.read_table(args.parquet, columns=["instance_id", "gold_context"])
    ids = table.column("instance_id").to_pylist()
    if len(ids) != len(set(ids)):
        raise SystemExit("duplicate gold ids")
    positions = {value: index for index, value in enumerate(ids)}
    prior_rows = {row["ordinal"]: row for row in prior["rows"]}
    rows = []
    for record, checked, packet in zip(sealed["rows"], audit["rows"], packets):
        ordinal = record["ordinal"]
        old = prior_rows[ordinal]
        if packet["instance_id"] != old["instance_id"] or checked["ordinal"] != ordinal:
            raise SystemExit("task identity drift")
        pair_root = (Path(prior["archive"]) / "pairs" /
                     f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw")
        prediction_path = pair_root / "policy-pruning/prediction.json"
        are_score_path = pair_root / "policy-pruning/native-score.json"
        dsh_score_path = pair_root / "dsh-export/native-score.json"
        prediction = json.loads(prediction_path.read_text())
        are = json.loads(are_score_path.read_text())["native"]["final"]["file"]
        dsh = json.loads(dsh_score_path.read_text())["native"]["final"]["file"]
        if prediction["instance_id"] != packet["instance_id"]:
            raise SystemExit("prediction task drift")
        selected = {normalize(path) for path in prediction["traj_data"]["pred_files"]}
        proposed = {normalize(path) for path in record["selected_paths"]}
        if (len(proposed) != len(record["selected_paths"]) or
                proposed & selected or
                proposed & {normalize(path) for path in packet["already_read_paths"]}):
            raise SystemExit("non-new proposal")
        gold_context = json.loads(table.column("gold_context")[positions[packet["instance_id"]]].as_py())
        gold = {normalize(item["file"]) for item in gold_context}
        baseline = f1(selected, gold)
        comparator = 2 * dsh["intersection"] / (dsh["pred_size"] + dsh["gold_size"])
        if (are["pred_size"] != len(selected) or are["gold_size"] != len(gold) or
                are["intersection"] != len(selected & gold) or
                abs(2 * are["intersection"] / (are["pred_size"] + are["gold_size"]) - baseline) > 1e-12 or
                dsh["gold_size"] != len(gold)):
            raise SystemExit(f"native score parity failed: ordinal={ordinal} "
                             f"selected={len(selected)}/{are['pred_size']} "
                             f"gold={len(gold)}/{are['gold_size']} "
                             f"hits={len(selected & gold)}/{are['intersection']}")
        expanded = f1(selected | proposed, gold)
        hits = len(proposed & gold)
        if (hits != checked["new_gold_hits"] or len(proposed - gold) != checked["false_positive_files"]):
            raise SystemExit("sealed evaluator hit drift")
        rows.append({"ordinal": ordinal, "prediction_sha256": sha(prediction_path),
                     "are_score_sha256": sha(are_score_path), "dsh_score_sha256": sha(dsh_score_path),
                     "baseline_file_f1": baseline, "expanded_file_f1": expanded,
                     "dsh_file_f1": comparator, "delta_vs_baseline": expanded - baseline,
                     "delta_vs_dsh": expanded - comparator,
                     "added_read_slots": len(proposed), "new_gold_hits": hits})
    summary = {"tasks": len(rows), "new_gold_hits": sum(row["new_gold_hits"] for row in rows),
               "added_read_slots": sum(row["added_read_slots"] for row in rows),
               "baseline_mean_file_f1": mean([row["baseline_file_f1"] for row in rows]),
               "expanded_mean_file_f1": mean([row["expanded_file_f1"] for row in rows]),
               "dsh_mean_file_f1": mean([row["dsh_file_f1"] for row in rows]),
               "improved_tasks": sum(row["delta_vs_baseline"] > 0 for row in rows),
               "regressed_tasks": sum(row["delta_vs_baseline"] < 0 for row in rows)}
    result = {"schema_version": "g02.r11-relational-choice-file-counterfactual-r5/v1",
              "posture": "evaluator-only-exposed-development-no-actual-reads",
              "response_seal_sha256": RESPONSE_SEAL_SHA,
              "evaluator_audit_sha256": EVAL_AUDIT_SHA,
              "prior_seal_sha256": PRIOR_SHA, "native_gold_parquet_sha256": PARQUET_SHA,
              "rows": rows, "summary": summary,
              "claim_ceiling": "Set-based exposed File-F1 counterfactual only; no actual ARE reads, Span-F1, total episode cost, independent cohort, or superiority."}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"summary": summary, "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
