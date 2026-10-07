#!/usr/bin/env python3
"""Evaluator-only gold coverage of the sealed r11 C++ include neighborhood."""

import argparse
import hashlib
import json
import os
import sys
from collections import Counter
from pathlib import Path


SEAL_SHA256 = "031c44de02388b89261a921ef3def5a17eecae5c5faa8f308594e9b3a645c15d"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")
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
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.seal) != SEAL_SHA256 or sha(UPSTREAM / "data/full.parquet") != PARQUET_SHA256:
        raise SystemExit("sealed input drift")
    sealed = json.loads(args.seal.read_text())
    if (sealed.get("schema_version") != "g02.r11-include-neighbors-exposed-seal/v1" or
            sealed.get("posture") != "source-only-exposed-development-no-gold-dsh-or-score" or
            [row["ordinal"] for row in sealed["rows"]] != [4, 8, 12]):
        raise SystemExit("unexpected source-only rows")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    totals = Counter()
    for row in sealed["rows"]:
        gold = set(loader.get(row["instance_id"]).files())
        delivered = set(row["delivered_paths"])
        undelivered = gold - delivered
        candidates = row["candidates"]
        paths = [item["path"] for item in candidates]
        if len(paths) != len(set(paths)) or set(paths) & delivered:
            raise SystemExit("candidate uniqueness/delivery mismatch")
        eligible = {item["path"] for item in candidates if item["bytes"] <= MAX_READ_BYTES}
        outbound = {item["path"] for item in candidates if item["included_by_delivered"]}
        inbound = {item["path"] for item in candidates if item["includes_delivered"]}
        record = {"ordinal": row["ordinal"], "undelivered_gold": len(undelivered),
                  "neighbor_pool": len(paths), "neighbor_gold": len(set(paths) & undelivered),
                  "eligible_pool": len(eligible), "eligible_gold": len(eligible & undelivered),
                  "outgoing_neighbor_gold": len(outbound & undelivered),
                  "incoming_neighbor_gold": len(inbound & undelivered)}
        rows.append(record)
        for key, value in record.items():
            if key != "ordinal":
                totals[key] += value
    output = {"schema_version": "g02.r11-include-neighbors-exposed-audit/v1",
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
