#!/usr/bin/env python3
"""Evaluator-only depth diagnostic for the sealed G02 r11 source rankings."""

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
K_VALUES = (3, 5, 10, 20, 30)


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
    if sha(args.seal) != SEAL_SHA256 or sha(UPSTREAM / "data/full.parquet") != PARQUET_SHA256:
        raise SystemExit("sealed input drift")
    sealed = json.loads(args.seal.read_text())
    if len(sealed["rows"]) != 12 or sealed["schema_version"] != "g02.r11-retrieval-exposed-seal/v1":
        raise SystemExit("unexpected source rows")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    totals = defaultdict(int)
    for source_row in sealed["rows"]:
        gold = set(loader.get(source_row["instance_id"]).files())
        delivered = set(source_row["delivered_paths"])
        row = {"ordinal": source_row["ordinal"], "source": source_row["source"],
               "undelivered_gold": len(gold - delivered)}
        totals["undelivered_gold"] += row["undelivered_gold"]
        for name in ("raw", "structured"):
            ranked = [item["path"] for item in source_row[f"{name}_top30"]]
            if len(ranked) != len(set(ranked)):
                raise SystemExit("duplicate ranking path")
            candidates = [path for path in ranked if path not in delivered]
            for k in K_VALUES:
                chosen = set(candidates[:k])
                for suffix, value in (("slots", len(chosen)),
                                      ("new_gold", len(chosen & (gold - delivered))),
                                      ("false_positive", len(chosen - gold))):
                    key = f"{name}_k{k}_{suffix}"
                    row[key] = value
                    totals[key] += value
        rows.append(row)
    output = {"schema_version": "g02.r11-retrieval-depth-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-model-no-native-score",
              "source_seal_sha256": SEAL_SHA256,
              "native_gold_parquet_sha256": PARQUET_SHA256,
              "rows": rows, "totals": dict(sorted(totals.items())),
              "claim_ceiling": "Ranking-depth diagnostic only; no actual added reads, native F1, cost, independent cohort, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "totals": output["totals"]}))


if __name__ == "__main__":
    main()
