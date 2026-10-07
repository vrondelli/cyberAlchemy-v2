#!/usr/bin/env python3
"""Evaluator-only coverage audit of the sealed r11 Python import neighborhood."""

import argparse
import hashlib
import json
import os
from collections import Counter
from pathlib import Path

import pyarrow.parquet as parquet


SEAL_SHA256 = "777f9d69cc65be69d472ed3a7633f75483e01134c5298527b99fd22f5c490384"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
MAX_READ_BYTES = 262144


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("seal", type=Path)
    parser.add_argument("parquet", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != SEAL_SHA256 or sha(args.parquet) != PARQUET_SHA256:
        raise SystemExit("sealed input drift")
    sealed = json.loads(args.seal.read_text())
    if (sealed.get("schema_version") != "g02.r11-python-import-neighbors-exposed-seal/v1" or
            sealed.get("posture") != "source-only-exposed-development-no-gold-dsh-or-score" or
            [row["ordinal"] for row in sealed["rows"]] != [1, 2, 3, 5, 6, 7, 9, 10, 11]):
        raise SystemExit("unexpected source-only rows")
    table = parquet.read_table(args.parquet, columns=["instance_id", "gold_context"])
    ids = table.column("instance_id").to_pylist()
    if len(ids) != len(set(ids)):
        raise SystemExit("duplicate native instance id")
    positions = {value: index for index, value in enumerate(ids)}
    rows = []
    totals = Counter()
    for row in sealed["rows"]:
        gold_context = json.loads(table.column("gold_context")[positions[row["instance_id"]]].as_py())
        gold = {item["file"] for item in gold_context}
        delivered = set(row["delivered_paths"])
        missing = gold - delivered
        candidates = row["candidates"]
        paths = [item["path"] for item in candidates]
        if len(paths) != len(set(paths)) or set(paths) & delivered:
            raise SystemExit("candidate uniqueness/delivery mismatch")
        pool = set(paths)
        eligible = {item["path"] for item in candidates if item["bytes"] <= MAX_READ_BYTES}
        outgoing = {item["path"] for item in candidates if item["imported_by_delivered"]}
        incoming = {item["path"] for item in candidates if item["imports_delivered"]}
        record = {"ordinal": row["ordinal"], "source": row["repo"],
                  "undelivered_gold": len(missing), "undelivered_python_gold": sum(path.endswith(".py") for path in missing),
                  "neighbor_pool": len(pool), "neighbor_gold": len(pool & missing),
                  "eligible_pool": len(eligible), "eligible_gold": len(eligible & missing),
                  "outgoing_neighbor_gold": len(outgoing & missing),
                  "incoming_neighbor_gold": len(incoming & missing)}
        rows.append(record)
        for key, value in record.items():
            if key not in ("ordinal", "source"):
                totals[key] += value
    output = {"schema_version": "g02.r11-python-import-neighbors-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-model-no-native-score",
              "source_seal_sha256": SEAL_SHA256,
              "native_gold_parquet_sha256": PARQUET_SHA256,
              "rows": rows, "totals": dict(sorted(totals.items())),
              "claim_ceiling": "Unranked candidate-pool coverage only; no actual reads, native F1, cost, independent cohort, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"totals": output["totals"], "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
