#!/usr/bin/env python3
"""Evaluator-only replay of a source-sealed exposed C++ abstention rule."""

import argparse
import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


GATE_SHA = "d89ede44360af4b120b96592a34efbf6078f49926b399e71777cee940d502cd9"
PRIOR_COUNTERFACTUAL_SHA = "2b25709505a73ea0aaaefe2b64ea0199c7b9912c3abb0ae56ae527cc6571fa61"
PRIOR_SHA = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
PARQUET_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalize(path):
    path = path.replace("\\", "/")
    if path.startswith("/testbed/"):
        return path[len("/testbed/"):]
    if path.startswith("/workspace/"):
        parts = path[len("/workspace/"):].split("/", 1)
        return parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip("/").removeprefix("./")


def f1(predicted, gold):
    return 2 * len(predicted & gold) / (len(predicted) + len(gold)) if predicted or gold else 1.0


def mean(values):
    return sum(values) / len(values)


def main():
    ap = argparse.ArgumentParser()
    for name in ("gate", "prior_counterfactual", "prior_seal", "parquet", "output"):
        ap.add_argument(name, type=Path)
    args = ap.parse_args()
    for path, pin in ((args.gate, GATE_SHA), (args.prior_counterfactual, PRIOR_COUNTERFACTUAL_SHA),
                      (args.prior_seal, PRIOR_SHA), (args.parquet, PARQUET_SHA)):
        if sha(path) != pin:
            raise SystemExit(f"input drift: {path.name}")
    gate = json.loads(args.gate.read_text())
    before = json.loads(args.prior_counterfactual.read_text())
    prior = json.loads(args.prior_seal.read_text())
    if ([row["ordinal"] for row in gate["rows"]] != [4, 8, 12] or
            [row["ordinal"] for row in before["rows"]] != [4, 8, 12] or
            gate["posture"] != "source-and-sealed-choice-only-exposed-development-no-gold-dsh-or-score"):
        raise SystemExit("source gate shape drift")
    reference = parquet.read_table(args.parquet, columns=["instance_id", "gold_context"]).to_pylist()
    if len(reference) != len({row["instance_id"] for row in reference}):
        raise SystemExit("duplicate native id")
    by_id = {row["instance_id"]: row for row in reference}
    prior_rows = {row["ordinal"]: row for row in prior["rows"]}
    rows = []
    for gate_row, old in zip(gate["rows"], before["rows"]):
        ordinal = gate_row["ordinal"]
        source = prior_rows[ordinal]
        pair = (Path(prior["archive"]) / "pairs" /
                f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw")
        prediction = json.loads((pair / "policy-pruning/prediction.json").read_text())
        are_score = json.loads((pair / "policy-pruning/native-score.json").read_text())["native"]["final"]["file"]
        selected = {normalize(path) for path in prediction["traj_data"]["pred_files"]}
        proposed = {normalize(path) for path in gate_row["selected_paths"]}
        gold = {normalize(item["file"]) for item in json.loads(by_id[source["instance_id"]]["gold_context"])}
        if (prediction["instance_id"] != source["instance_id"] or proposed & selected or
                len(proposed) != len(gate_row["selected_paths"]) or
                are_score["pred_size"] != len(selected) or are_score["gold_size"] != len(gold) or
                are_score["intersection"] != len(selected & gold) or
                abs(f1(selected, gold) - old["baseline_file_f1"]) > 1e-12):
            raise SystemExit(f"native or gate parity failed: {ordinal}")
        expanded = f1(selected | proposed, gold)
        rows.append({"ordinal": ordinal, "admitted": gate_row["admitted"],
                     "added_read_slots": len(proposed), "new_gold_hits": len(proposed & gold),
                     "false_positive_files": len(proposed - gold),
                     "baseline_file_f1": old["baseline_file_f1"],
                     "gated_file_f1": expanded, "dsh_file_f1": old["dsh_file_f1"],
                     "delta_vs_baseline": expanded - old["baseline_file_f1"]})
    summary = {"tasks": len(rows), "admitted_tasks": sum(row["admitted"] for row in rows),
               "added_read_slots": sum(row["added_read_slots"] for row in rows),
               "new_gold_hits": sum(row["new_gold_hits"] for row in rows),
               "false_positive_files": sum(row["false_positive_files"] for row in rows),
               "baseline_mean_file_f1": mean([row["baseline_file_f1"] for row in rows]),
               "gated_mean_file_f1": mean([row["gated_file_f1"] for row in rows]),
               "dsh_mean_file_f1": mean([row["dsh_file_f1"] for row in rows]),
               "improved_tasks": sum(row["delta_vs_baseline"] > 0 for row in rows),
               "regressed_tasks": sum(row["delta_vs_baseline"] < 0 for row in rows)}
    result = {"schema_version": "g02.r11-code-anchor-gate-exposed-audit/v2",
              "posture": "evaluator-only-posthoc-exposed-counterfactual-no-actual-read",
              "gate_seal_sha256": GATE_SHA,
              "prior_counterfactual_sha256": PRIOR_COUNTERFACTUAL_SHA,
              "prior_seal_sha256": PRIOR_SHA,
              "native_gold_parquet_sha256": PARQUET_SHA,
              "rows": rows, "summary": summary,
              "claim_ceiling": "Post-hoc three-task File-F1 replay only; no actual ARE read, Span-F1, downstream cost, independent test, or superiority."}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"summary": summary, "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
