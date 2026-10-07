#!/usr/bin/env python3
"""Source-only direct-edge-first ordering of sealed Java import pools."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
POOL_DIR = ARCHIVE / "exposed-java-import-neighborhood-r4"
POOL_SHA = "119922f2e00ac099cf87c582f39f44a8f50886ab8839850003a7cd4a89a70234"
POOL_SEAL_SHA = "98f5d024decff20a19359b3618751740f85fbb1a3e8a3a0815fe00d8b9c781c9"
PACKETS_SHA = "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    pool_path = POOL_DIR / "SOURCE-POOL.jsonl"
    pool_seal_path = POOL_DIR / "SOURCE-SEAL.json"
    packet_path = ARCHIVE / "exposed-cue-packets-r1" / "PACKETS.jsonl"
    output = POOL_DIR / "RANKED-POOL.jsonl"
    seal_output = POOL_DIR / "RANK-SEAL.json"
    if (output.exists() or seal_output.exists() or digest(pool_path) != POOL_SHA
            or digest(pool_seal_path) != POOL_SEAL_SHA or digest(packet_path) != PACKETS_SHA):
        raise SystemExit("input-pin-or-output-drift")
    pools = [json.loads(line) for line in pool_path.read_text().splitlines()]
    packets = [json.loads(line) for line in packet_path.read_text().splitlines()]
    if not (len(pools) == len(packets) == 24):
        raise SystemExit("denominator-drift")
    rows = []
    for ordinal, (pool, packet) in enumerate(zip(pools, packets), 1):
        if (not (pool["ordinal"] == packet["ordinal"] == ordinal)
                or pool["id"] != packet["id"]
                or set(pool["pool_paths"]) != set(pool["direct_paths"]) | set(pool["reverse_paths"])):
            raise SystemExit(f"case-drift:{ordinal}")
        are_rank = {path: index for index, path in enumerate(packet["are_ranked_files"], 1)}
        direct = set(pool["direct_paths"])
        ordered = sorted(pool["pool_paths"], key=lambda path: (
            0 if path in direct else 1, are_rank[path], path))
        rows.append({"ordinal": ordinal, "id": pool["id"], "language": pool["language"],
                     "ordered_paths": ordered, "pool_count": len(ordered),
                     "gold_opened": False})
    data = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)).encode()
    seal = {"schema_version": "are.g01-bugswarm-java-import-neighborhood-rank-r4/v1",
            "posture": "source-only exposed rank; no gold, model calls, or packet amendment",
            "rule": "direct-import pool paths first, then reverse-only; within each tier use full original ARE file rank and path tie-break",
            "source_pool_sha256": POOL_SHA, "source_pool_seal_sha256": POOL_SEAL_SHA,
            "packets_sha256": PACKETS_SHA, "cases": len(rows),
            "ranked_rows_sha256": hashlib.sha256(data).hexdigest(),
            "gold_opened": False, "model_calls": 0}
    exclusive(output, data)
    seal_data = (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode()
    exclusive(seal_output, seal_data)
    print(json.dumps({"cases": len(rows), "ranked_rows_sha256": seal["ranked_rows_sha256"],
                      "rank_seal_sha256": hashlib.sha256(seal_data).hexdigest()}))


if __name__ == "__main__":
    main()
