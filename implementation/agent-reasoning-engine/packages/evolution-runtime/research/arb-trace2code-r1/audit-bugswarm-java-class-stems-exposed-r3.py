#!/usr/bin/env python3
"""Evaluator-only incremental reach audit for sealed Java class-stem cues."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
SOURCE_DIR = ARCHIVE / "exposed-java-class-stems-r3"
OUTPUT = SOURCE_DIR / "EVALUATOR-AUDIT.json"
EVALUATION_SHA = "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3"
PACKETS_SHA = "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    source_path = SOURCE_DIR / "SOURCE-CUES.jsonl"
    seal_path = SOURCE_DIR / "SOURCE-SEAL.json"
    eval_path = ARCHIVE / "evaluator-only-r1" / "EVALUATION-R1.json"
    packet_path = ARCHIVE / "exposed-cue-packets-r1" / "PACKETS.jsonl"
    if OUTPUT.exists() or digest(eval_path) != EVALUATION_SHA or digest(packet_path) != PACKETS_SHA:
        raise SystemExit("input-pin-or-output-drift")
    seal = json.loads(seal_path.read_bytes())
    if (seal["schema_version"] != "are.g01-bugswarm-java-class-stem-source-r3/v1"
            or seal["cases"] != 24 or seal["gold_opened"]
            or digest(source_path) != seal["source_rows_sha256"]):
        raise SystemExit("source-seal-drift")
    cues = [json.loads(line) for line in source_path.read_text().splitlines()]
    packets = [json.loads(line) for line in packet_path.read_text().splitlines()]
    evaluated = json.loads(eval_path.read_bytes())["cases"]
    if not (len(cues) == len(packets) == len(evaluated) == 24):
        raise SystemExit("denominator-drift")
    rows = []
    for ordinal, (cue, packet, case) in enumerate(zip(cues, packets, evaluated), 1):
        if (not (cue["ordinal"] == packet["ordinal"] == case["ordinal"] == ordinal)
                or not (cue["id"] == packet["id"] == case["id"])
                or cue["language"] != case["language"] or cue["gold_opened"]
                or len(cue["cue_paths"]) > 10
                or len(set(cue["cue_paths"])) != len(cue["cue_paths"])
                or not set(cue["cue_paths"]).issubset(packet["are_ranked_files"])):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        gold = set(case["gold_paths"])
        before = {entry["path"] for entry in packet["candidates"]}
        new = set(cue["cue_paths"]) - before
        rows.append({"ordinal": ordinal, "language": case["language"],
                     "source_cue_count": len(cue["cue_paths"]), "new_path_count": len(new),
                     "before_reach": bool(gold & before), "new_gold_reach": bool(gold & new),
                     "expanded_reach": bool(gold & (before | new))})
    result = {"schema_version": "are.g01-bugswarm-java-class-stem-exposed-audit-r3/v1",
              "posture": "post-score exposed reach diagnosis; no rerank or independent claim",
              "source_seal_sha256": digest(seal_path),
              "source_rows_sha256": digest(source_path),
              "evaluation_sha256": EVALUATION_SHA, "packets_sha256": PACKETS_SHA,
              "cases": rows,
              "before_reach": sum(row["before_reach"] for row in rows),
              "newly_reached": sum(row["new_gold_reach"] and not row["before_reach"] for row in rows),
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
