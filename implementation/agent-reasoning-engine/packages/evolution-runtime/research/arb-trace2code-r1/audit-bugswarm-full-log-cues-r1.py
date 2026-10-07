#!/usr/bin/env python3
"""Evaluator-only exposed reach audit for sealed BugSwarm full-log filename cues."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path


EVALUATION_SHA = "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive-root", type=Path, required=True)
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    evaluation = args.archive_root / "evaluator-only-r1" / "EVALUATION-R1.json"
    cues_path = args.source_dir / "SOURCE-CUES.jsonl"
    seal_path = args.source_dir / "SOURCE-SEAL.json"
    if args.output.exists() or digest(evaluation) != EVALUATION_SHA:
        raise SystemExit("output-exists-or-evaluation-pin-drift")
    seal = json.loads(seal_path.read_bytes())
    if (seal["schema_version"] != "are.g01-bugswarm-full-log-cues-source-r1/v1"
            or seal["cases"] != 24 or seal["max_cues"] != 10 or seal["gold_opened"]
            or digest(cues_path) != seal["cue_rows_sha256"]):
        raise SystemExit("source-seal-drift")
    cues = [json.loads(line) for line in cues_path.read_text().splitlines()]
    evaluated = json.loads(evaluation.read_bytes())["cases"]
    if not (len(cues) == len(evaluated) == 24):
        raise SystemExit("denominator-drift")
    rows = []
    for cue, case in zip(cues, evaluated):
        ordinal = case["ordinal"]
        ranking_path = args.archive_root / "vps-run-r1" / "are-rankings-r1" / f"ARE-RANKING-{ordinal:02d}.json"
        ranking = json.loads(ranking_path.read_bytes())
        if (cue["ordinal"] != ordinal or not (cue["id"] == case["id"] == ranking["id"])
                or cue["ranking_sha256"] != digest(ranking_path)
                or cue["cue_count"] != len(cue["cue_paths"])
                or len(set(cue["cue_paths"])) != cue["cue_count"]
                or cue["cue_count"] > 10 or cue["gold_opened"]
                or not set(cue["cue_paths"]).issubset(ranking["ranked_files"])):
            raise SystemExit(f"case-identity-or-cue-drift:{ordinal}")
        gold = set(case["gold_paths"])
        original = case["candidate_union_has_gold"]
        are_top10 = bool(gold & set(ranking["ranked_files"][:10]))
        if original != are_top10:
            raise SystemExit(f"original-union-parity-drift:{ordinal}")
        cue_hit = bool(gold & set(cue["cue_paths"]))
        rows.append({"ordinal": ordinal, "language": case["language"],
                     "original_reach": original, "cue_reach": cue_hit,
                     "expanded_reach": original or cue_hit, "cue_count": cue["cue_count"]})
    receipt = {"schema_version": "are.g01-bugswarm-full-log-cues-exposed-audit-r1/v1",
               "posture": "post-score exposed reach diagnosis only; no rerank score or independent confirmation",
               "evaluation_sha256": EVALUATION_SHA, "source_seal_sha256": digest(seal_path),
               "source_cues_sha256": digest(cues_path), "cases": rows,
               "original_reach": sum(row["original_reach"] for row in rows),
               "cue_reach": sum(row["cue_reach"] for row in rows),
               "newly_reached": sum(row["cue_reach"] and not row["original_reach"] for row in rows),
               "expanded_reach": sum(row["expanded_reach"] for row in rows)}
    encoded = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cases": len(rows), "original_reach": receipt["original_reach"],
                      "newly_reached": receipt["newly_reached"],
                      "expanded_reach": receipt["expanded_reach"],
                      "receipt_sha256": hashlib.sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
