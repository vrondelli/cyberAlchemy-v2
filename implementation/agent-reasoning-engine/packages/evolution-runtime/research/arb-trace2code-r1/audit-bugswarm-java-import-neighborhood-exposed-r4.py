#!/usr/bin/env python3
"""Evaluator-only gold reach for the sealed Java import neighborhood pool."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
SOURCE_DIR = ARCHIVE / "exposed-java-import-neighborhood-r4"
OUTPUT = SOURCE_DIR / "EVALUATOR-AUDIT.json"
EVALUATION_SHA = "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3"
PACKETS_SHA = "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"
STEMS_SHA = "c594e02045ab104e656eb00b4d9c3bfc2a41bb0b81feb67169c288bf9d622dd2"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    source_path = SOURCE_DIR / "SOURCE-POOL.jsonl"
    seal_path = SOURCE_DIR / "SOURCE-SEAL.json"
    eval_path = ARCHIVE / "evaluator-only-r1" / "EVALUATION-R1.json"
    packet_path = ARCHIVE / "exposed-cue-packets-r1" / "PACKETS.jsonl"
    stems_path = ARCHIVE / "exposed-java-class-stems-r3" / "SOURCE-CUES.jsonl"
    if (OUTPUT.exists() or digest(eval_path) != EVALUATION_SHA
            or digest(packet_path) != PACKETS_SHA or digest(stems_path) != STEMS_SHA):
        raise SystemExit("input-pin-or-output-drift")
    seal = json.loads(seal_path.read_bytes())
    if (seal["schema_version"] != "are.g01-bugswarm-java-import-neighborhood-source-r4/v1"
            or seal["cases"] != 24 or seal["gold_opened"]
            or digest(source_path) != seal["source_rows_sha256"]):
        raise SystemExit("source-seal-drift")
    pools = [json.loads(line) for line in source_path.read_text().splitlines()]
    packets = [json.loads(line) for line in packet_path.read_text().splitlines()]
    stems = [json.loads(line) for line in stems_path.read_text().splitlines()]
    evaluated = json.loads(eval_path.read_bytes())["cases"]
    if not (len(pools) == len(packets) == len(stems) == len(evaluated) == 24):
        raise SystemExit("denominator-drift")
    rows = []
    for ordinal, (pool, packet, stem, case) in enumerate(zip(pools, packets, stems, evaluated), 1):
        if (not (pool["ordinal"] == packet["ordinal"] == stem["ordinal"] == case["ordinal"] == ordinal)
                or not (pool["id"] == packet["id"] == stem["id"] == case["id"])
                or pool["language"] != case["language"] or pool["gold_opened"]
                or len(set(pool["pool_paths"])) != len(pool["pool_paths"])
                or set(pool["pool_paths"]) != set(pool["direct_paths"]) | set(pool["reverse_paths"])
                or not set(pool["pool_paths"]).issubset(packet["are_ranked_files"])):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        gold = set(case["gold_paths"])
        before = {entry["path"] for entry in packet["candidates"]} | set(stem["cue_paths"])
        direct = set(pool["direct_paths"])
        reverse = set(pool["reverse_paths"])
        added = set(pool["pool_paths"])
        rows.append({"ordinal": ordinal, "language": case["language"],
                     "seed_count": pool["seed_count"], "pool_count": len(added),
                     "before_reach": bool(gold & before),
                     "direct_new_gold": bool(gold & direct),
                     "reverse_new_gold": bool(gold & reverse),
                     "pool_new_gold": bool(gold & added),
                     "expanded_reach": bool(gold & (before | added))})
    result = {"schema_version": "are.g01-bugswarm-java-import-neighborhood-exposed-audit-r4/v1",
              "posture": "post-score exposed unranked-pool diagnosis; not a packet or claim",
              "source_seal_sha256": digest(seal_path),
              "source_rows_sha256": digest(source_path),
              "evaluation_sha256": EVALUATION_SHA, "packets_sha256": PACKETS_SHA,
              "class_stems_sha256": STEMS_SHA, "cases": rows,
              "before_reach": sum(row["before_reach"] for row in rows),
              "newly_reached": sum(row["pool_new_gold"] and not row["before_reach"] for row in rows),
              "expanded_reach": sum(row["expanded_reach"] for row in rows)}
    data = (json.dumps(result, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(rows), "before_reach": result["before_reach"],
                      "newly_reached": result["newly_reached"],
                      "expanded_reach": result["expanded_reach"],
                      "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
