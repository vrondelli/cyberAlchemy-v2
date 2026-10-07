#!/usr/bin/env python3
"""Evaluator-only hit audit of sealed r11 Python import-neighbor ranking."""

import argparse
import hashlib
import json
import os
from collections import Counter
from pathlib import Path

import pyarrow.parquet as parquet


GRAPH_SHA256 = "777f9d69cc65be69d472ed3a7633f75483e01134c5298527b99fd22f5c490384"
RANKED_SHA256 = "55f3175c54d683cf9d4fac907fa34cff4982782e092acf9a2d35a50f0fb8e7db"
PRIOR_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"


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
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("parquet", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if (sha(args.graph_seal) != GRAPH_SHA256 or sha(args.ranked_seal) != RANKED_SHA256 or
            sha(args.prior_seal) != PRIOR_SHA256 or sha(args.parquet) != PARQUET_SHA256):
        raise SystemExit("sealed input drift")
    graph = json.loads(args.graph_seal.read_text())
    ranked = json.loads(args.ranked_seal.read_text())
    prior = json.loads(args.prior_seal.read_text())
    if (ranked.get("schema_version") != "g02.r11-python-import-neighbor-ranked-exposed-seal/v1" or
            ranked.get("posture") != "source-only-exposed-development-no-gold-dsh-or-score" or
            ranked.get("graph_seal_sha256") != GRAPH_SHA256 or ranked.get("fixed_read_budget") != 3 or
            [row["ordinal"] for row in ranked["rows"]] != [1, 2, 3, 5, 6, 7, 9, 10, 11]):
        raise SystemExit("unexpected ranked seal")
    table = parquet.read_table(args.parquet, columns=["instance_id", "gold_context"])
    ids = table.column("instance_id").to_pylist()
    if len(ids) != len(set(ids)):
        raise SystemExit("duplicate native instance id")
    positions = {value: index for index, value in enumerate(ids)}
    graph_rows = {row["ordinal"]: row for row in graph["rows"]}
    prior_rows = {row["ordinal"]: row for row in prior["rows"]}
    rows = []
    totals = Counter()
    for row in ranked["rows"]:
        source = graph_rows[row["ordinal"]]
        old = prior_rows[row["ordinal"]]
        pool = {item["path"] for item in source["candidates"] if item["bytes"] <= 262144}
        paths = [item["path"] for item in row["ranked"]]
        if (row["instance_id"] != source["instance_id"] or set(paths) != pool or
                len(paths) != len(pool) or row["top3"] != paths[:3] or len(row["top3"]) != 3):
            raise SystemExit("ranked/pool mismatch")
        gold_context = json.loads(table.column("gold_context")[positions[row["instance_id"]]].as_py())
        gold = {item["file"] for item in gold_context}
        undelivered = gold - set(source["delivered_paths"])
        selected = set(row["top3"])
        raw = set(old["raw_new3"])
        structured = set(old["structured_new3"])
        record = {"ordinal": row["ordinal"], "undelivered_gold": len(undelivered),
                  "top3_slots": len(selected), "top3_new_gold": len(selected & undelivered),
                  "top3_false_positive": len(selected - gold),
                  "pool_new_gold": len(pool & undelivered),
                  "raw_bm25_new_gold": len(raw & undelivered),
                  "structured_bm25_new_gold": len(structured & undelivered)}
        rows.append(record)
        for key, value in record.items():
            if key != "ordinal":
                totals[key] += value
    output = {"schema_version": "g02.r11-python-import-neighbor-ranked-exposed-audit/v1",
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
