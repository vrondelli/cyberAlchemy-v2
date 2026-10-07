#!/usr/bin/env python3
"""Evaluator-only top-k audit for sealed source-only import-degree ordering."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
ROOT = ARCHIVE / "exposed-java-import-neighborhood-r4"
EVALUATION_SHA = "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3"
POOL_SHA = "119922f2e00ac099cf87c582f39f44a8f50886ab8839850003a7cd4a89a70234"
RANKED_SHA = "112629fa2351330d9a79dc81826c082740e9a2f94f05a12026928d8d789f6c89"
SEAL_SHA = "44c2edb17e8278e0601b5e0e39b07b06305f943afc467ed8280af75c2d37fd0a"
PACKETS_SHA = "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"
STEMS_SHA = "c594e02045ab104e656eb00b4d9c3bfc2a41bb0b81feb67169c288bf9d622dd2"
KS = (3, 10, 20, 50)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    paths = {
        "evaluation": ARCHIVE / "evaluator-only-r1" / "EVALUATION-R1.json",
        "pool": ROOT / "SOURCE-POOL.jsonl",
        "ranked": ROOT / "RANKED-DEGREE.jsonl",
        "seal": ROOT / "DEGREE-RANK-SEAL.json",
        "packets": ARCHIVE / "exposed-cue-packets-r1" / "PACKETS.jsonl",
        "stems": ARCHIVE / "exposed-java-class-stems-r3" / "SOURCE-CUES.jsonl",
    }
    output = ROOT / "DEGREE-EVALUATOR-AUDIT.json"
    pins = {"evaluation": EVALUATION_SHA, "pool": POOL_SHA,
            "ranked": RANKED_SHA, "seal": SEAL_SHA,
            "packets": PACKETS_SHA, "stems": STEMS_SHA}
    if output.exists() or any(digest(paths[key]) != expected for key, expected in pins.items()):
        raise SystemExit("input-pin-or-output-drift")
    seal = json.loads(paths["seal"].read_bytes())
    if (seal["schema_version"] != "are.g01-bugswarm-java-import-degree-rank-r5/v1"
            or seal["cases"] != 24 or seal["gold_opened"]
            or seal["ranked_rows_sha256"] != RANKED_SHA):
        raise SystemExit("rank-seal-drift")
    evaluated = json.loads(paths["evaluation"].read_bytes())["cases"]
    pool = [json.loads(line) for line in paths["pool"].read_text().splitlines()]
    ranked = [json.loads(line) for line in paths["ranked"].read_text().splitlines()]
    packets = [json.loads(line) for line in paths["packets"].read_text().splitlines()]
    stems = [json.loads(line) for line in paths["stems"].read_text().splitlines()]
    if not all(len(items) == 24 for items in (evaluated, pool, ranked, packets, stems)):
        raise SystemExit("denominator-drift")
    rows = []
    for ordinal, (case, candidate_pool, rank, packet, stem) in enumerate(
            zip(evaluated, pool, ranked, packets, stems), 1):
        if (not (case["ordinal"] == candidate_pool["ordinal"] == rank["ordinal"]
                 == packet["ordinal"] == stem["ordinal"] == ordinal)
                or not (case["id"] == candidate_pool["id"] == rank["id"]
                        == packet["id"] == stem["id"])
                or set(rank["ordered_paths"]) != set(candidate_pool["pool_paths"])
                or len(rank["ordered_paths"]) != len(set(rank["ordered_paths"]))
                or rank["gold_opened"]):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        gold = set(case["gold_paths"])
        before = {entry["path"] for entry in packet["candidates"]} | set(stem["cue_paths"])
        first = next((index for index, path in enumerate(rank["ordered_paths"], 1)
                      if path in gold), None)
        new = first is not None and not bool(gold & before)
        rows.append({"ordinal": ordinal, "language": case["language"],
                     "before_reach": bool(gold & before),
                     "first_pool_gold_rank": first, "new_reach": new,
                     "top_k_new_reach": {str(k): new and first <= k for k in KS}})
    result = {"schema_version": "are.g01-bugswarm-java-import-degree-exposed-audit-r5/v1",
              "posture": "post-score exposed rank diagnosis; not a delivered read or claim",
              "pins": pins, "cases": rows,
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
