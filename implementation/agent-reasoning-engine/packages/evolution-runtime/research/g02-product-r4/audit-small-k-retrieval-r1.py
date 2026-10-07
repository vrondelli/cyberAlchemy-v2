#!/usr/bin/env python3
"""Evaluator-only small-read-budget audit of the sealed, exposed G02 r3 retrieval lists."""

import argparse
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path


SEAL_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
K_VALUES = (1, 3, 5, 10)


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def analyze_row(row, gold):
    delivered = set(row["delivered_paths"])
    result = {"id": row["instance_id"].split("__")[-1],
              "repo": row["pair_root"].split("/g02-cross-layer-pr3-")[-1].split("-")[0],
              "gold_files": len(gold), "undelivered_gold_files": len(gold - delivered)}
    for name in ("raw", "structured"):
        ranked = [item["path"] for item in row[f"{name}_top30"]]
        if len(ranked) != 30 or len(set(ranked)) != 30:
            raise ValueError("retrieval list length/uniqueness")
        pool = [path for path in ranked if path not in delivered]
        result[f"{name}_available"] = len(pool)
        for k in K_VALUES:
            chosen = pool[:k]
            result[f"{name}_k{k}"] = {"read_slots": len(chosen),
                                      "new_gold_hits": len(set(chosen) & (gold - delivered)),
                                      "false_positive_files": len(set(chosen) - gold)}
    return result


def totals(rows):
    aggregate = {}
    for name in ("raw", "structured"):
        for k in K_VALUES:
            key = f"{name}_k{k}"
            aggregate[key] = {field: sum(row[key][field] for row in rows)
                              for field in ("read_slots", "new_gold_hits", "false_positive_files")}
            aggregate[key]["tasks_with_new_gold"] = sum(row[key]["new_gold_hits"] > 0 for row in rows)
    aggregate["gold_files"] = sum(row["gold_files"] for row in rows)
    aggregate["undelivered_gold_files"] = sum(row["undelivered_gold_files"] for row in rows)
    return aggregate


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != SEAL_SHA256:
        raise SystemExit("sealed source-list hash mismatch")
    sealed = json.loads(args.seal.read_text())
    if sealed.get("schema_version") != "g02.retrieval-first-exposed-seal/v1" or \
            sealed.get("posture") != "source-only-exposed-development-no-gold-or-native-score-opened" or \
            sha(args.ranker) != sealed.get("script_sha256"):
        raise SystemExit("sealed source-list identity mismatch")
    source_rows = sealed["results"]
    if len(source_rows) != 12 or len({row["instance_id"] for row in source_rows}) != 12:
        raise SystemExit("unexpected exposed denominator")
    for row in source_rows:
        if row["posture"] != "source-only-exposed-development-no-score" or \
                any("gold" in key or "score_file" in key for key in row):
            raise SystemExit("evaluator material in source-only row")
        replay = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), row["pair_root"]], text=True))
        if replay != row:
            raise SystemExit("source-only replay mismatch")
    parquet = UPSTREAM / "data/full.parquet"
    if sha(parquet) != PARQUET_SHA256:
        raise SystemExit("native gold parquet drift")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(parquet))
    rows = [analyze_row(row, set(loader.get(row["instance_id"]).files()))
            for row in source_rows]
    output = {"schema_version": "g02.retrieval-small-k-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-model-no-native-score",
              "source_seal_sha256": SEAL_SHA256,
              "ranker_sha256": sealed["script_sha256"],
              "gold_parquet_sha256": PARQUET_SHA256,
              "source_only_replay": "12/12 exact rows",
              "rows": rows, "totals": totals(rows),
              "claim_ceiling": "Acquisition file-hit/false-positive diagnostic only. Retrieved files were not read or selected by ARE; no native F1, cost, holdout, or superiority result.",
              "open_questions": ["Can a source-only precision rule select a small number of new files across repositories without many false positives?"]}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"status": "audited", "receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "totals": output["totals"]}, sort_keys=True))


if __name__ == "__main__":
    main()
