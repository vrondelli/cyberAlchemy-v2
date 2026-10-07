#!/usr/bin/env python3
"""Evaluator-only file-hit audit of fixed, source-sealed G02 r11 rankings."""

import argparse
import hashlib
import json
import os
import sys
from collections import defaultdict
from pathlib import Path


SEAL_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != SEAL_SHA256:
        raise SystemExit("source-only seal drift")
    sealed = json.loads(args.seal.read_text())
    if (sealed.get("schema_version") != "g02.r11-retrieval-exposed-seal/v1" or
            sealed.get("posture") != "source-only-exposed-development-no-gold-dsh-or-score" or
            sealed.get("fixed_new_read_budget") != 3):
        raise SystemExit("unexpected source-only seal")
    rows = sealed["rows"]
    if len(rows) != 12 or sorted(row["ordinal"] for row in rows) != list(range(1, 13)):
        raise SystemExit("unexpected exposed denominator")
    if sha(UPSTREAM / "data/full.parquet") != PARQUET_SHA256:
        raise SystemExit("native gold parquet drift")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    results = []
    totals = defaultdict(int)
    by_source = defaultdict(lambda: defaultdict(int))
    for row in rows:
        if any("gold" in key or "score" in key or "dsh" in key for key in row):
            raise SystemExit("evaluator/comparator data in source-only row")
        gold = set(loader.get(row["instance_id"]).files())
        delivered = set(row["delivered_paths"])
        record = {"ordinal": row["ordinal"], "source": row["source"],
                  "gold_files": len(gold), "undelivered_gold_files": len(gold - delivered)}
        for name in ("raw", "structured"):
            ranking = [item["path"] for item in row[f"{name}_top30"]]
            chosen = row[f"{name}_new3"]
            if (len(ranking) != len(set(ranking)) or len(chosen) > 3 or
                    chosen != [path for path in ranking if path not in delivered][:3]):
                raise SystemExit(f"ranking/budget mismatch at {row['ordinal']}")
            record[f"{name}_slots"] = len(chosen)
            record[f"{name}_new_gold_hits"] = len(set(chosen) & (gold - delivered))
            record[f"{name}_false_positive_files"] = len(set(chosen) - gold)
            record[f"{name}_task_hit"] = int(record[f"{name}_new_gold_hits"] > 0)
        results.append(record)
        for key, value in record.items():
            if isinstance(value, int) and key != "ordinal":
                totals[key] += value
                by_source[row["source"]][key] += value
        by_source[row["source"]]["tasks"] += 1
    output = {"schema_version": "g02.r11-retrieval-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-model-no-native-score",
              "source_seal_sha256": SEAL_SHA256,
              "native_gold_parquet_sha256": PARQUET_SHA256,
              "rows": results, "totals": dict(sorted(totals.items())),
              "by_source": {key: dict(sorted(value.items())) for key, value in sorted(by_source.items())},
              "claim_ceiling": "File-hit and false-positive diagnostic only; proposed files were not read by ARE. No native F1, cost, holdout, or superiority claim.",
              "open_questions": ["Do any fixed three-file proposals justify actual reads and a fresh cohort test?"]}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"totals": output["totals"], "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
