#!/usr/bin/env python3
"""Evaluator-only gold rank of the sealed direct-edge-first Java import pool."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
POOL_DIR = ARCHIVE / "exposed-java-import-neighborhood-r4"
EVALUATION_SHA = "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3"
RANKED_SHA = "611d1149db7d8734f83120af245ff1d9ed5aa94997b5dcdba72c37113b54ead0"
RANK_SEAL_SHA = "c9fe27dc49387470cf71863791ca11effd6b30bc70ff49a16b981ae3be00056b"
PACKETS_SHA = "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"
STEMS_SHA = "c594e02045ab104e656eb00b4d9c3bfc2a41bb0b81feb67169c288bf9d622dd2"
KS = (3, 10, 20, 50)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    eval_path = ARCHIVE / "evaluator-only-r1" / "EVALUATION-R1.json"
    ranked_path = POOL_DIR / "RANKED-POOL.jsonl"
    seal_path = POOL_DIR / "RANK-SEAL.json"
    packet_path = ARCHIVE / "exposed-cue-packets-r1" / "PACKETS.jsonl"
    stems_path = ARCHIVE / "exposed-java-class-stems-r3" / "SOURCE-CUES.jsonl"
    output = POOL_DIR / "RANK-EVALUATOR-AUDIT.json"
    if (output.exists() or digest(eval_path) != EVALUATION_SHA
            or digest(ranked_path) != RANKED_SHA or digest(seal_path) != RANK_SEAL_SHA
            or digest(packet_path) != PACKETS_SHA or digest(stems_path) != STEMS_SHA):
        raise SystemExit("input-pin-or-output-drift")
    rank_seal = json.loads(seal_path.read_bytes())
    if (rank_seal["ranked_rows_sha256"] != RANKED_SHA or rank_seal["gold_opened"]
            or rank_seal["cases"] != 24):
        raise SystemExit("rank-seal-drift")
    ranked = [json.loads(line) for line in ranked_path.read_text().splitlines()]
    packets = [json.loads(line) for line in packet_path.read_text().splitlines()]
    stems = [json.loads(line) for line in stems_path.read_text().splitlines()]
    evaluated = json.loads(eval_path.read_bytes())["cases"]
    if not (len(ranked) == len(packets) == len(stems) == len(evaluated) == 24):
        raise SystemExit("denominator-drift")
    rows = []
    for ordinal, (rank, packet, stem, case) in enumerate(zip(ranked, packets, stems, evaluated), 1):
        if (not (rank["ordinal"] == packet["ordinal"] == stem["ordinal"] == case["ordinal"] == ordinal)
                or not (rank["id"] == packet["id"] == stem["id"] == case["id"])
                or rank["language"] != case["language"] or rank["gold_opened"]
                or rank["pool_count"] != len(rank["ordered_paths"])
                or len(set(rank["ordered_paths"])) != rank["pool_count"]
                or not set(rank["ordered_paths"]).issubset(packet["are_ranked_files"])):
            raise SystemExit(f"rank-identity-drift:{ordinal}")
        gold = set(case["gold_paths"])
        baseline = {entry["path"] for entry in packet["candidates"]} | set(stem["cue_paths"])
        first = next((index for index, path in enumerate(rank["ordered_paths"], 1)
                      if path in gold), None)
        rows.append({"ordinal": ordinal, "language": case["language"],
                     "before_reach": bool(gold & baseline), "first_pool_gold_rank": first,
                     "new_reach": first is not None and not bool(gold & baseline),
                     "top_k_new_reach": {str(k): first is not None and first <= k
                                         and not bool(gold & baseline) for k in KS}})
    result = {"schema_version": "are.g01-bugswarm-java-import-rank-exposed-audit-r4/v1",
              "posture": "post-score exposed top-k diagnosis, not a delivered read or claim",
              "ranked_sha256": RANKED_SHA, "rank_seal_sha256": RANK_SEAL_SHA,
              "evaluation_sha256": EVALUATION_SHA, "cases": rows,
              "new_pool_reach": sum(row["new_reach"] for row in rows),
              "new_top_k_reach": {str(k): sum(row["top_k_new_reach"][str(k)] for row in rows)
                                  for k in KS}}
    data = (json.dumps(result, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"new_pool_reach": result["new_pool_reach"],
                      "new_top_k_reach": result["new_top_k_reach"],
                      "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
