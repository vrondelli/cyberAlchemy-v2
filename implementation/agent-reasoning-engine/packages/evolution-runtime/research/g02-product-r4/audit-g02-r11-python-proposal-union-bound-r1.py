#!/usr/bin/env python3
"""Evaluator-only bound on selecting from two sealed G02 Python proposal sets."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path("/home/vlad_/are-benchmark-archive")
RANKED = ROOT / "g02-r11-python-import-neighbors-exposed-r1-20261002/RANKED-SEAL.json"
RARE = ROOT / "g02-r11-rare-exact-symbol-exposed-r1/SOURCE-SEAL.json"
PRIOR = ROOT / "g02-r11-retrieval-exposed-r1-20261002/SEAL.json"
PARQUET = ROOT / "g01-r8-eight-task-evaluator-r1/full.parquet"
OUTPUT = ROOT / "g02-r11-python-proposal-union-bound-r1/AUDIT.json"
PINS = {RANKED: "55f3175c54d683cf9d4fac907fa34cff4982782e092acf9a2d35a50f0fb8e7db",
        RARE: "265e8dbb499bfc88e14a41a390296995af12b110c73d39b6a974306fb0835536",
        PRIOR: "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901",
        PARQUET: "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"}
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
        raise ValueError("output-exists-or-pinned-input-drift")
    ranked = json.loads(RANKED.read_text())
    rare = json.loads(RARE.read_text())
    prior = json.loads(PRIOR.read_text())
    if ([row["ordinal"] for row in ranked["rows"]] != ORDINALS or
            [row["ordinal"] for row in rare["rows"]] != ORDINALS or
            ranked["fixed_read_budget"] != 3 or
            rare["summary"]["model_calls"] != 0 or rare["summary"]["gold_loaded"] is not False):
        raise ValueError("source-seal-shape")
    by_rare = {row["ordinal"]: row for row in rare["rows"]}
    by_prior = {row["ordinal"]: row for row in prior["rows"]}
    table = parquet.read_table(PARQUET, columns=["instance_id", "base_commit", "gold_context"]).to_pylist()
    gold_by_id = {row["instance_id"]: row for row in table}
    if len(gold_by_id) != len(table):
        raise ValueError("duplicate-evaluator-id")
    rows = []
    for row in ranked["rows"]:
        ordinal = row["ordinal"]
        other = by_rare[ordinal]
        source = by_prior[ordinal]
        native = gold_by_id[row["instance_id"]]
        if (row["instance_id"] != other["instance_id"] or
                row["instance_id"] != source["instance_id"] or
                source["base_commit"] != other["base_commit"] or
                source["base_commit"] != native["base_commit"]):
            raise ValueError("task-identity-drift")
        original = {normalize(path) for path in row["top3"]}
        sparse = {normalize(path) for path in other["proposed"]}
        union = original | sparse
        delivered = {normalize(path) for path in source["delivered_paths"]}
        if len(original) != 3 or len(sparse) != len(other["proposed"]) or union & delivered:
            raise ValueError("source-proposal-invariant")
        raw = Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
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
        if (are["instance_id"] != row["instance_id"] or dsh["instance_id"] != row["instance_id"] or
                union & selected or not gold or
                are_score["pred_size"] != len(selected) or dsh_score["pred_size"] != len(control) or
                are_score["gold_size"] != len(gold) or dsh_score["gold_size"] != len(gold) or
                are_score["intersection"] != len(selected & gold) or
                dsh_score["intersection"] != len(control & gold)):
            raise ValueError("native-score-parity-or-identity")
        missing = gold - delivered
        oracle_selected = selected | (union & missing)
        rows.append({"ordinal": ordinal, "repo": source["repo"],
                     "ranked_proposals": len(original), "rare_proposals": len(sparse),
                     "union_proposals": len(union), "union_new_gold_hits": len(union & missing),
                     "union_false_positive_count": len(union - gold),
                     "ranked_new_gold_hits": len(original & missing),
                     "rare_new_gold_hits": len(sparse & missing),
                     "are_file_f1": file_f1(selected, gold),
                     "dsh_file_f1": file_f1(control, gold),
                     "perfect_selector_over_union_file_f1": file_f1(oracle_selected, gold),
                     "are_prediction_sha256": sha(are_path),
                     "dsh_prediction_sha256": sha(dsh_path),
                     "are_native_score_sha256": sha(are_score_path),
                     "dsh_native_score_sha256": sha(dsh_score_path)})
    summary = {"tasks": len(rows),
               "union_proposals": sum(row["union_proposals"] for row in rows),
               "union_new_gold_hits": sum(row["union_new_gold_hits"] for row in rows),
               "union_false_positive_count": sum(row["union_false_positive_count"] for row in rows),
               "ranked_new_gold_hits": sum(row["ranked_new_gold_hits"] for row in rows),
               "rare_new_gold_hits": sum(row["rare_new_gold_hits"] for row in rows),
               "are_mean_file_f1": sum(row["are_file_f1"] for row in rows) / len(rows),
               "dsh_mean_file_f1": sum(row["dsh_file_f1"] for row in rows) / len(rows),
               "perfect_selector_over_union_mean_file_f1":
                   sum(row["perfect_selector_over_union_file_f1"] for row in rows) / len(rows)}
    receipt = {"schema_version": "g02.r11-python-proposal-union-bound-exposed-audit/v1",
               "posture": "evaluator-only-exposed-development-oracle-selector-no-model-no-read",
               "ranked_seal_sha256": PINS[RANKED], "rare_seal_sha256": PINS[RARE],
               "prior_seal_sha256": PINS[PRIOR], "native_gold_parquet_sha256": PINS[PARQUET],
               "script_sha256": sha(Path(__file__)),
               "counterfactual": "Choose only native-gold files from union of previously sealed ranked top-three and rare exact-symbol proposals; keep original ARE selections and false positives.",
               "rows": rows, "summary": summary,
               "claim_ceiling": "Exposed candidate-pool and label-aware selector bound only; no source-only selector, actual reads, Span-F1, cost, independent cohort, or superiority."}
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"summary": summary, "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
