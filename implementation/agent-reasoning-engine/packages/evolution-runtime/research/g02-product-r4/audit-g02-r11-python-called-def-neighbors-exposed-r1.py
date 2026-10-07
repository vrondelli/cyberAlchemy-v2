#!/usr/bin/env python3
"""Evaluator-only counts and file-set replay for a sealed source-only proposal."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path("/home/vlad_/are-benchmark-archive")
SEAL = ROOT / "g02-r11-python-called-def-neighbors-exposed-r1-20261003/SOURCE-SEAL.json"
GRAPH = ROOT / "g02-r11-python-import-neighbors-exposed-r1-20261002/SOURCE-SEAL.json"
PARQUET = ROOT / "g01-r8-eight-task-evaluator-r1/full.parquet"
OUTPUT = ROOT / "g02-r11-python-called-def-neighbors-exposed-r1-20261003/AUDIT.json"
PINS = {
    SEAL: "ceaea1351298880fddd75c697aabaf7f0c38d77c4e8add8582619039cf2875e5",
    GRAPH: "777f9d69cc65be69d472ed3a7633f75483e01134c5298527b99fd22f5c490384",
    PARQUET: "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8",
}
ORDINALS = [1, 2, 3, 5, 6, 7, 9, 10, 11]


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
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


def file_f1(selected, gold):
    return 2 * len(selected & gold) / (len(selected) + len(gold)) if selected or gold else 1.0


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise ValueError("output-exists-or-sealed-input-drift")
    source = json.loads(SEAL.read_text())
    graph = json.loads(GRAPH.read_text())
    if ([row["ordinal"] for row in source["rows"]] != ORDINALS or
            source["posture"] != "source-only-exposed-development-no-gold-dsh-or-score"):
        raise ValueError("source-seal-shape")
    graph_by_ordinal = {row["ordinal"]: row for row in graph["rows"]}
    table = parquet.read_table(PARQUET, columns=["instance_id", "base_commit", "gold_context"]).to_pylist()
    native_by_id = {row["instance_id"]: row for row in table}
    if len(native_by_id) != len(table):
        raise ValueError("duplicate-native-id")
    rows = []
    for row in source["rows"]:
        ordinal = row["ordinal"]
        graph_row = graph_by_ordinal[ordinal]
        native = native_by_id[row["instance_id"]]
        proposals = {normalize(path) for path in row["proposed_paths"]}
        pool = {normalize(item["path"]) for item in graph_row["candidates"] if item["bytes"] <= 262144}
        delivered = {normalize(path) for path in graph_row["delivered_paths"]}
        if (len(proposals) != len(row["proposed_paths"]) or len(proposals) > 3 or
                not proposals <= pool or proposals & delivered or
                row["instance_id"] != graph_row["instance_id"] or
                row["base_commit"] != graph_row["base_commit"] or
                row["base_commit"] != native["base_commit"] or
                row["issue_sha256"] != graph_row["issue_sha256"]):
            raise ValueError(f"source/native-identity-or-pool-drift:{ordinal}")
        raw = ROOT / "g02-product-replication-r11-20261002/pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
        pred_path = raw / "policy-pruning/prediction.json"
        score_path = raw / "policy-pruning/native-score.json"
        pred = json.loads(pred_path.read_text())
        score = json.loads(score_path.read_text())["native"]["final"]["file"]
        selected = {normalize(path) for path in pred["traj_data"]["pred_files"]}
        gold = {normalize(item["file"]) for item in json.loads(native["gold_context"])}
        if (pred["instance_id"] != row["instance_id"] or not gold or
                score["pred_size"] != len(selected) or score["gold_size"] != len(gold) or
                score["intersection"] != len(selected & gold)):
            raise ValueError(f"native-score-parity:{ordinal}")
        added = selected | proposals
        rows.append({"ordinal": ordinal, "repo": graph_row["repo"],
                     "proposals": len(proposals), "new_gold_hits": len(proposals & (gold - delivered)),
                     "false_positives": len(proposals - gold),
                     "already_selected_proposals": len(proposals & selected),
                     "are_file_f1": file_f1(selected, gold),
                     "additive_file_f1": file_f1(added, gold),
                     "prediction_sha256": sha(pred_path), "native_score_sha256": sha(score_path)})
    summary = {"tasks": len(rows), "proposal_slots": sum(row["proposals"] for row in rows),
               "new_gold_hits": sum(row["new_gold_hits"] for row in rows),
               "false_positives": sum(row["false_positives"] for row in rows),
               "abstained_tasks": sum(row["proposals"] == 0 for row in rows),
               "are_mean_file_f1": sum(row["are_file_f1"] for row in rows) / len(rows),
               "additive_mean_file_f1": sum(row["additive_file_f1"] for row in rows) / len(rows),
               "improved_tasks": sum(row["additive_file_f1"] > row["are_file_f1"] for row in rows),
               "regressed_tasks": sum(row["additive_file_f1"] < row["are_file_f1"] for row in rows)}
    receipt = {"schema_version": "g02.r11-python-called-def-neighbors-exposed-audit/v1",
               "posture": "evaluator-only-exposed-development-no-model-no-read",
               "source_seal_sha256": PINS[SEAL], "graph_seal_sha256": PINS[GRAPH],
               "native_gold_parquet_sha256": PINS[PARQUET],
               "script_sha256": sha(Path(__file__)), "rows": rows, "summary": summary,
               "claim_ceiling": "Exposed source-only candidate diagnostic and additive file-set replay only; no actual reads, Span-F1, full-episode cost, independent cohort, or superiority."}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"summary": summary, "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
