#!/usr/bin/env python3
"""Final evaluator-only File-F1 audit for sealed G02 r3 guarded decisions."""

import argparse
import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path("/home/vlad_/are-benchmark-archive")
RUN = ROOT / "g02-r11-guarded-delta-exposed-r3-20261004"
SEAL = RUN / "SEALED-DECISIONS.json"
PACKETS = ROOT / "g02-r11-guarded-delta-packets-exposed-r3-20261004/PACKETS.json"
PACKETS_SHA = "a9dc4039a4d859423ab33265c8283a13c4bb79aa6eefa28bd35b2876f5d63e61"
PARQUET = ROOT / "g01-r8-eight-task-evaluator-r1/full.parquet"
PARQUET_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
OUTPUT = RUN / "EVALUATOR-AUDIT.json"


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
    parser = argparse.ArgumentParser()
    parser.add_argument("--seal-sha256", required=True)
    args = parser.parse_args()
    pins = {SEAL: args.seal_sha256, PACKETS: PACKETS_SHA, PARQUET: PARQUET_SHA}
    if OUTPUT.exists() or any(sha(path) != expected for path, expected in pins.items()):
        raise SystemExit("output-exists-or-input-drift")
    seal = json.loads(SEAL.read_text())
    packets = json.loads(PACKETS.read_text())["ordered_packets"]
    references = parquet.read_table(PARQUET, columns=["instance_id", "base_commit", "gold_context"]).to_pylist()
    native = {row["instance_id"]: row for row in references}
    if ([row["ordinal"] for row in seal["rows"]] != list(range(1, 13))
            or [row["ordinal"] for row in packets] != list(range(1, 13))):
        raise SystemExit("cohort-shape")
    rows = []
    repository_hits = defaultdict(int)
    for decision, packet in zip(seal["rows"], packets):
        ordinal = packet["ordinal"]
        reference = native[packet["instance_id"]]
        if reference["base_commit"] != packet["base_commit"]:
            raise SystemExit(f"identity-drift:{ordinal}")
        raw = ROOT / "g02-product-replication-r11-20261002/pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw"
        prediction_path = raw / "policy-pruning/prediction.json"
        are_score_path = raw / "policy-pruning/native-score.json"
        dsh_score_path = raw / "dsh-export/native-score.json"
        prediction = json.loads(prediction_path.read_text())
        selected = {normalize(path) for path in prediction["traj_data"]["pred_files"]}
        proposal = {normalize(decision["proposal_path"])} if decision["proposal_path"] else set()
        eligible = {candidate["path"] for candidate in packet["candidates"]}
        if len(proposal) > 1 or not proposal.issubset(eligible) or proposal & selected:
            raise SystemExit(f"proposal-invalid:{ordinal}")
        gold = {normalize(item["file"]) for item in json.loads(reference["gold_context"])}
        are = json.loads(are_score_path.read_text())["native"]["final"]["file"]
        dsh = json.loads(dsh_score_path.read_text())["native"]["final"]["file"]
        baseline = f1(selected, gold)
        if (are["pred_size"] != len(selected) or are["gold_size"] != len(gold)
                or are["intersection"] != len(selected & gold)):
            raise SystemExit(f"score-parity:{ordinal}")
        expanded = f1(selected | proposal, gold)
        hits = proposal & gold
        repository_hits[packet["repo"]] += len(hits)
        rows.append({"ordinal": ordinal, "repo": packet["repo"],
                     "proposal_path": decision["proposal_path"], "new_gold_paths": sorted(hits),
                     "new_gold_hits": len(hits), "false_positive_files": len(proposal - gold),
                     "baseline_file_f1": baseline, "expanded_file_f1": expanded,
                     "dsh_file_f1": 2 * dsh["intersection"] / (dsh["pred_size"] + dsh["gold_size"]),
                     "delta_vs_baseline": expanded - baseline,
                     "prediction_sha256": sha(prediction_path),
                     "are_score_sha256": sha(are_score_path), "dsh_score_sha256": sha(dsh_score_path)})
    mean = lambda key: sum(row[key] for row in rows) / len(rows)
    proposals = sum(row["proposal_path"] is not None for row in rows)
    hits = sum(row["new_gold_hits"] for row in rows)
    summary = {
        "tasks": 12, "primary_responses": seal["primary_responses"],
        "invalid_primary_responses": seal["invalid_primary_responses"],
        "confirmation_responses": seal["confirmation_responses"],
        "invalid_confirmation_responses": seal["invalid_confirmation_responses"],
        "proposals": proposals, "new_gold_hits": hits,
        "false_positive_files": proposals - hits,
        "proposal_precision": hits / proposals if proposals else 0.0,
        "repositories_with_hit": sum(value > 0 for value in repository_hits.values()),
        "by_repository_hits": dict(sorted(repository_hits.items())),
        "baseline_mean_file_f1": mean("baseline_file_f1"),
        "expanded_mean_file_f1": mean("expanded_file_f1"),
        "dsh_mean_file_f1": mean("dsh_file_f1"),
        "counterfactual_mean_delta": mean("delta_vs_baseline"),
        "improved_tasks": sum(row["delta_vs_baseline"] > 0 for row in rows),
        "regressed_tasks": sum(row["delta_vs_baseline"] < 0 for row in rows),
        "known_verifier_tokens": seal["known_verifier_tokens"],
        "summed_verifier_elapsed_ms": seal["summed_verifier_elapsed_ms"],
    }
    gate = seal["advancement_gate"]
    gate_pass = (summary["invalid_primary_responses"] == 0
                 and summary["invalid_confirmation_responses"] == 0
                 and summary["new_gold_hits"] >= gate["minimum_new_gold_hits"]
                 and summary["repositories_with_hit"] >= gate["minimum_repositories_with_hit"]
                 and summary["proposal_precision"] >= gate["minimum_proposal_precision"]
                 and summary["counterfactual_mean_delta"] > 0
                 and summary["improved_tasks"] > summary["regressed_tasks"])
    report = {
        "schema_version": "g02.r11-guarded-delta-evaluator-exposed-r3/v1",
        "posture": "evaluator-only-exposed-set-file-f1-counterfactual-no-actual-reads",
        "input_sha256": {str(path): expected for path, expected in pins.items()},
        "script_sha256": sha(Path(__file__)), "gate": gate, "gate_pass": gate_pass,
        "summary": summary, "rows": rows,
        "claim_ceiling": "Exposed counterfactual File-F1 only; no actual ARE reads, Span-F1, independent transfer, DSH superiority, or product superiority.",
    }
    encoded = (json.dumps(report, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"summary": summary, "gate_pass": gate_pass,
                      "sha256": hashlib.sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
