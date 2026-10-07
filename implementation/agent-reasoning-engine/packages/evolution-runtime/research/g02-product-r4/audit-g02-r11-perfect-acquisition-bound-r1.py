#!/usr/bin/env python3
"""Evaluator-only upper bound for perfect acquisition on exposed G02 r11.

Exports counts and metrics only. Native gold paths remain in memory. This is
not a source-only policy, an ARE read, or a model result.
"""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


PRIOR = Path("/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002/SEAL.json")
PARQUET = Path("/home/vlad_/are-benchmark-archive/g01-r8-eight-task-evaluator-r1/full.parquet")
OUTPUT = Path("/home/vlad_/are-benchmark-archive/g02-r11-perfect-acquisition-bound-r1/AUDIT.json")
PINS = {PRIOR: "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901",
        PARQUET: "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"}


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


def mean(rows, field):
    return sum(row[field] for row in rows) / len(rows)


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise ValueError("output-exists-or-input-drift")
    prior = json.loads(PRIOR.read_text())
    if (prior["schema_version"] != "g02.r11-retrieval-exposed-seal/v1" or
            [row["ordinal"] for row in prior["rows"]] != list(range(1, 13))):
        raise ValueError("source-seal-shape")
    table = parquet.read_table(PARQUET, columns=["instance_id", "base_commit", "gold_context"]).to_pylist()
    reference = {row["instance_id"]: row for row in table}
    if len(reference) != len(table):
        raise ValueError("duplicate-native-id")
    rows = []
    by_repo = defaultdict(list)
    for source in prior["rows"]:
        ordinal = source["ordinal"]
        native = reference[source["instance_id"]]
        if native["base_commit"] != source["base_commit"]:
            raise ValueError("base-commit-drift")
        raw = (Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw")
        are_path = raw / "policy-pruning/prediction.json"
        dsh_path = raw / "dsh-export/prediction.json"
        are_score_path = raw / "policy-pruning/native-score.json"
        dsh_score_path = raw / "dsh-export/native-score.json"
        are = json.loads(are_path.read_text())
        dsh = json.loads(dsh_path.read_text())
        are_score = json.loads(are_score_path.read_text())["native"]["final"]["file"]
        dsh_score = json.loads(dsh_score_path.read_text())["native"]["final"]["file"]
        gold = {normalize(item["file"]) for item in json.loads(native["gold_context"])}
        selected = {normalize(path) for path in are["traj_data"]["pred_files"]}
        control = {normalize(path) for path in dsh["traj_data"]["pred_files"]}
        delivered = {normalize(path) for path in source["delivered_paths"]}
        if (are["instance_id"] != source["instance_id"] or
                dsh["instance_id"] != source["instance_id"] or
                any(not path or ".." in Path(path).parts for path in gold | selected | control | delivered) or
                are_score["pred_size"] != len(selected) or dsh_score["pred_size"] != len(control) or
                are_score["gold_size"] != len(gold) or dsh_score["gold_size"] != len(gold) or
                are_score["intersection"] != len(selected & gold) or
                dsh_score["intersection"] != len(control & gold)):
            raise ValueError("native-score-parity-or-identity")
        missing = gold - delivered
        perfect_addition = selected | missing
        record = {"ordinal": ordinal, "repo": source["repo"],
                  "gold_files": len(gold), "delivered_gold_files": len(gold & delivered),
                  "undelivered_gold_files": len(missing),
                  "already_selected_missing_files": len(missing & selected),
                  "are_selected_files": len(selected), "are_selected_gold_files": len(selected & gold),
                  "dsh_selected_files": len(control), "dsh_selected_gold_files": len(control & gold),
                  "are_file_f1": file_f1(selected, gold),
                  "dsh_file_f1": file_f1(control, gold),
                  "perfect_acquisition_file_f1": file_f1(perfect_addition, gold),
                  "are_prediction_sha256": sha(are_path), "dsh_prediction_sha256": sha(dsh_path),
                  "are_native_score_sha256": sha(are_score_path),
                  "dsh_native_score_sha256": sha(dsh_score_path)}
        rows.append(record)
        by_repo[source["repo"]].append(record)
    summary = {"tasks": len(rows),
               "gold_files": sum(row["gold_files"] for row in rows),
               "undelivered_gold_files": sum(row["undelivered_gold_files"] for row in rows),
               "already_selected_missing_files": sum(row["already_selected_missing_files"] for row in rows),
               "are_mean_file_f1": mean(rows, "are_file_f1"),
               "dsh_mean_file_f1": mean(rows, "dsh_file_f1"),
               "perfect_acquisition_mean_file_f1": mean(rows, "perfect_acquisition_file_f1"),
               "perfect_acquisition_above_dsh_tasks": sum(row["perfect_acquisition_file_f1"] > row["dsh_file_f1"] + 1e-12 for row in rows),
               "perfect_acquisition_tied_dsh_tasks": sum(abs(row["perfect_acquisition_file_f1"] - row["dsh_file_f1"]) <= 1e-12 for row in rows),
               "perfect_acquisition_below_dsh_tasks": sum(row["perfect_acquisition_file_f1"] < row["dsh_file_f1"] - 1e-12 for row in rows),
               "repo_means": {repo: {field: mean(group, field) for field in
                                     ("are_file_f1", "dsh_file_f1", "perfect_acquisition_file_f1")}
                              for repo, group in sorted(by_repo.items())}}
    receipt = {"schema_version": "g02.r11-perfect-acquisition-bound-exposed-audit/v1",
               "posture": "evaluator-only-exposed-development-oracle-upper-bound-no-model-no-read",
               "prior_seal_sha256": PINS[PRIOR], "native_gold_parquet_sha256": PINS[PARQUET],
               "script_sha256": sha(Path(__file__)),
               "counterfactual": "Add every and only native gold file missing from ARE-delivered paths to archived ARE selected-file set; preserve every ARE false positive and all original selections. This uses evaluator labels and is not executable as a source-only policy.",
               "rows": rows, "summary": summary,
               "claim_ceiling": "Exposed File-F1 potential bound only, not actual acquisition, Span-F1, tokens/time, independent confirmation, or superiority."}
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"summary": summary, "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
