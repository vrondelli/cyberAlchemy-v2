#!/usr/bin/env python3
"""Evaluator-only hit audit of sealed top-three C++ include-neighbor ranking."""

import argparse
import hashlib
import json
import os
import sys
from collections import Counter
from pathlib import Path


GRAPH_SHA256 = "031c44de02388b89261a921ef3def5a17eecae5c5faa8f308594e9b3a645c15d"
RANKED_SHA256 = "b2a9ebddaec7f8c53a536ce45638275d6b501e0fa35dc5a8e3efc0c25bc89b1d"
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
    parser.add_argument("graph_seal", type=Path)
    parser.add_argument("ranked_seal", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if (sha(args.graph_seal) != GRAPH_SHA256 or sha(args.ranked_seal) != RANKED_SHA256 or
            sha(UPSTREAM / "data/full.parquet") != PARQUET_SHA256):
        raise SystemExit("sealed input drift")
    graph = json.loads(args.graph_seal.read_text())
    ranked = json.loads(args.ranked_seal.read_text())
    if (ranked.get("schema_version") != "g02.r11-include-neighbor-ranked-exposed-seal/v1" or
            ranked.get("posture") != "source-only-exposed-development-no-gold-dsh-or-score" or
            ranked.get("graph_seal_sha256") != GRAPH_SHA256 or ranked.get("fixed_read_budget") != 3 or
            [row["ordinal"] for row in ranked["rows"]] != [4, 8, 12]):
        raise SystemExit("unexpected ranked seal")
    by_ordinal = {row["ordinal"]: row for row in graph["rows"]}
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    totals = Counter()
    for row in ranked["rows"]:
        source = by_ordinal[row["ordinal"]]
        pool = {item["path"] for item in source["candidates"] if item["bytes"] <= 262144}
        paths = [item["path"] for item in row["ranked"]]
        if (row["instance_id"] != source["instance_id"] or set(paths) != pool or
                len(paths) != len(pool) or row["top3"] != paths[:3] or len(row["top3"]) != 3):
            raise SystemExit("ranked/pool mismatch")
        gold = set(loader.get(row["instance_id"]).files())
        undelivered = gold - set(source["delivered_paths"])
        selected = set(row["top3"])
        record = {"ordinal": row["ordinal"], "undelivered_gold": len(undelivered),
                  "top3_slots": len(selected), "top3_new_gold": len(selected & undelivered),
                  "top3_false_positive": len(selected - gold),
                  "pool_new_gold": len(pool & undelivered)}
        rows.append(record)
        for key, value in record.items():
            if key != "ordinal":
                totals[key] += value
    output = {"schema_version": "g02.r11-include-neighbor-ranked-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-model-no-native-score",
              "graph_seal_sha256": GRAPH_SHA256, "ranked_seal_sha256": RANKED_SHA256,
              "native_gold_parquet_sha256": PARQUET_SHA256,
              "rows": rows, "totals": dict(sorted(totals.items())),
              "claim_ceiling": "Exposed top-three file-hit diagnostic only; no actual read, native F1, cost, independent cohort, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"totals": output["totals"], "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
