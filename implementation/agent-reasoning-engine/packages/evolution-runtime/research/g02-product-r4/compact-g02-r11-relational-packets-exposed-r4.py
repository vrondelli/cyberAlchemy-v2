#!/usr/bin/env python3
"""Predeclared compact source-only projection of exposed r11 C++ packets."""

import argparse
import hashlib
import json
import os
from pathlib import Path

SOURCE_SHA = "b0f556d5cbb4a102164e49ca9745dedb92ee54182a59505759def643f38c33bd"


def sha(value):
    return hashlib.sha256(value).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    raw = args.source.read_bytes()
    if sha(raw) != SOURCE_SHA:
        raise SystemExit("source packet drift")
    source = json.loads(raw)
    packets = []
    for row in source["ordered_packets"]:
        candidates = []
        for item in row["candidates"]:
            candidates.append({"path": item["path"],
                               "included_by_delivered": item["included_by_delivered"][:1],
                               "includes_delivered": item["includes_delivered"][:1],
                               "code_windows": [{"line": window["line"],
                                                 "text": window["text"][:110]}
                                                for window in item["code_windows"][:2]]})
        packet = {"ordinal": row["ordinal"], "instance_id": row["instance_id"],
                  "issue": row["issue"], "already_read_paths": row["already_read_paths"],
                  "maximum_new_reads": 3, "candidates": candidates}
        if len(json.dumps(packet).encode()) > 14000:
            raise SystemExit(f"compact packet byte cap exceeded: {row['ordinal']} {len(json.dumps(packet).encode())}")
        packets.append(packet)
    output = {"schema_version": "g02.r11-relational-packets-exposed-r4/v1",
              "posture": "source-only-exposed-development-no-gold-dsh-or-score",
              "source_packet_sha256": SOURCE_SHA,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "policy": "all eligible direct-include candidates; first include edge per direction and first two previously source-ranked windows truncated to 110 characters; <=14000 JSON bytes per task",
              "ordered_packets": packets,
              "claim_ceiling": "Exposed read-choice development only; no independent quality or superiority claim."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"sha256": sha(data), "packet_bytes": [len(json.dumps(p).encode()) for p in packets],
                      "candidates": [len(p["candidates"]) for p in packets]}))


if __name__ == "__main__":
    main()
