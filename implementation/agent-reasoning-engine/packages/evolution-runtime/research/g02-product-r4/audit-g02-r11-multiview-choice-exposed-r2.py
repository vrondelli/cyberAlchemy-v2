#!/usr/bin/env python3
"""Evaluator-only gold and File-F1 audit for sealed multi-view choices."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
CHOICE = ARCHIVE / "g02-r11-multiview-choice-exposed-r2-20261004"
SEAL = CHOICE / "SEALED-RESPONSES.json"
SEAL_SHA = "b24b6780e93a5bfd57739ba6e8f6bcdce0108a9b3c0523c0deae5211c420305f"
PACKETS = ARCHIVE / "g02-r11-multiview-choice-packets-exposed-r2-20261004/PACKETS.json"
PACKETS_SHA = "f2a41a3f269dcf16085c82a118de39e0e8fa25aef96425db7d6befbf1ec58682"
SOURCE_PACKETS = ARCHIVE / "g02-r11-search-packets-exposed-r1-20261004/PACKETS.json"
SOURCE_PACKETS_SHA = "2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b"
PARQUET = ARCHIVE / "g01-r8-eight-task-evaluator-r1/full.parquet"
PARQUET_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
OUTPUT = CHOICE / "EVALUATOR-AUDIT.json"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalize(path):
    path = path.replace("\\", "/")
    if path.startswith("/testbed/"):
        path = path[len("/testbed/"):]
    elif path.startswith("/workspace/"):
        parts = path[len("/workspace/"):].split("/", 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip("/").removeprefix("./")


def f1(predicted, gold):
    return 2 * len(predicted & gold) / (len(predicted) + len(gold)) if predicted or gold else 1.0


def main():
    pins = {SEAL: SEAL_SHA, PACKETS: PACKETS_SHA,
            SOURCE_PACKETS: SOURCE_PACKETS_SHA, PARQUET: PARQUET_SHA}
    if OUTPUT.exists() or any(sha(path) != expected for path, expected in pins.items()):
        raise SystemExit("output-exists-or-input-drift")
    seal = json.loads(SEAL.read_text())
    packets = json.loads(PACKETS.read_text())["ordered_packets"]
    source_packets = json.loads(SOURCE_PACKETS.read_text())["ordered_packets"]
    references = parquet.read_table(
        PARQUET, columns=["instance_id", "base_commit", "gold_context"]
    ).to_pylist()
    native = {row["instance_id"]: row for row in references}
    if (len(native) != len(references) or [row["ordinal"] for row in seal["rows"]] != list(range(1, 13))
            or [packet["ordinal"] for packet in packets] != list(range(1, 13))):
        raise SystemExit("cohort-shape")

    rows = []
    repository_hits = defaultdict(int)
    for record, packet in zip(seal["rows"], packets):
        ordinal = record["ordinal"]
        reference = native[packet["instance_id"]]
        source_packet = source_packets[ordinal - 1]
        if (source_packet["instance_id"] != packet["instance_id"]
                or source_packet["base_commit"] != reference["base_commit"]
                or source_packet["repo"] != packet["repo"]):
            raise SystemExit(f"identity-drift:{ordinal}")
        raw = (ARCHIVE / "g02-product-replication-r11-20261002/pairs" /
               f"{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw")
        prediction_path = raw / "policy-pruning/prediction.json"
        are_score_path = raw / "policy-pruning/native-score.json"
        dsh_score_path = raw / "dsh-export/native-score.json"
        prediction = json.loads(prediction_path.read_text())
        if prediction["instance_id"] != packet["instance_id"]:
            raise SystemExit(f"prediction-identity:{ordinal}")
        selected = {normalize(path) for path in prediction["traj_data"]["pred_files"]}
        proposed = {normalize(path) for path in record["selected_paths"]}
        eligible = {candidate["path"] for candidate in packet["candidates"]}
        if (len(proposed) != len(record["selected_paths"]) or len(proposed) > 3
                or not proposed.issubset(eligible) or proposed & selected):
            raise SystemExit(f"proposal-invalid:{ordinal}")
        gold = {normalize(item["file"]) for item in json.loads(reference["gold_context"])}
        are = json.loads(are_score_path.read_text())["native"]["final"]["file"]
        dsh = json.loads(dsh_score_path.read_text())["native"]["final"]["file"]
        baseline = f1(selected, gold)
        if (are["pred_size"] != len(selected) or are["gold_size"] != len(gold)
                or are["intersection"] != len(selected & gold)
                or abs(baseline - 2 * are["intersection"] / (are["pred_size"] + are["gold_size"])) > 1e-12
                or dsh["gold_size"] != len(gold)):
            raise SystemExit(f"score-parity:{ordinal}")
        expanded = f1(selected | proposed, gold)
        hits = proposed & gold
        repository_hits[packet["repo"]] += len(hits)
        rows.append({"ordinal": ordinal, "repo": packet["repo"],
                     "selected_paths": sorted(proposed), "new_gold_paths": sorted(hits),
                     "new_gold_hits": len(hits), "false_positive_files": len(proposed - gold),
                     "baseline_file_f1": baseline, "expanded_file_f1": expanded,
                     "dsh_file_f1": 2 * dsh["intersection"] / (dsh["pred_size"] + dsh["gold_size"]),
                     "delta_vs_baseline": expanded - baseline,
                     "prediction_sha256": sha(prediction_path),
                     "are_score_sha256": sha(are_score_path), "dsh_score_sha256": sha(dsh_score_path)})

    total_proposals = sum(len(row["selected_paths"]) for row in rows)
    total_hits = sum(row["new_gold_hits"] for row in rows)
    mean = lambda key: sum(row[key] for row in rows) / len(rows)
    summary = {
        "tasks": 12,
        "valid_responses": seal["valid_responses"],
        "invalid_responses": seal["invalid_responses"],
        "proposals": total_proposals,
        "new_gold_hits": total_hits,
        "false_positive_files": total_proposals - total_hits,
        "proposal_precision": total_hits / total_proposals if total_proposals else 0.0,
        "repositories_with_hit": sum(value > 0 for value in repository_hits.values()),
        "by_repository_hits": dict(sorted(repository_hits.items())),
        "baseline_mean_file_f1": mean("baseline_file_f1"),
        "expanded_mean_file_f1": mean("expanded_file_f1"),
        "dsh_mean_file_f1": mean("dsh_file_f1"),
        "counterfactual_mean_delta": mean("delta_vs_baseline"),
        "improved_tasks": sum(row["delta_vs_baseline"] > 0 for row in rows),
        "regressed_tasks": sum(row["delta_vs_baseline"] < 0 for row in rows),
        "known_chooser_tokens": seal["known_chooser_tokens"],
        "summed_chooser_elapsed_ms": seal["summed_chooser_elapsed_ms"],
    }
    gate = json.loads((CHOICE / "FREEZE.json").read_text())["advancement_gate"]
    gate_pass = (summary["valid_responses"] == 12
                 and summary["new_gold_hits"] >= gate["minimum_new_gold_hits"]
                 and summary["repositories_with_hit"] >= gate["minimum_repositories_with_hit"]
                 and summary["proposal_precision"] >= gate["minimum_proposal_precision"]
                 and summary["counterfactual_mean_delta"] >= 0)
    report = {
        "schema_version": "g02.r11-multiview-choice-evaluator-r2/v1",
        "posture": "evaluator-only-exposed-development-set-replay-no-actual-reads",
        "input_sha256": {str(path): expected for path, expected in pins.items()},
        "script_sha256": sha(Path(__file__)),
        "gate": gate,
        "gate_pass": gate_pass,
        "summary": summary,
        "rows": rows,
        "claim_ceiling": "Exposed set-based File-F1 counterfactual only; no actual ARE reads, Span-F1, independent transfer, or superiority.",
    }
    data = (json.dumps(report, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"summary": summary, "gate_pass": gate_pass,
                      "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
