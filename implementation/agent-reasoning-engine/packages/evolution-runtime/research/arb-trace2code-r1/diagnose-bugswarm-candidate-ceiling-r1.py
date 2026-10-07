#!/usr/bin/env python3
"""Evaluator-only exposed diagnosis of gold reach in frozen candidate ranks."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path


EVALUATION_SHA = "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3"
KS = (10, 20, 50, 100, 200)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def first_rank(order: list[str], gold: set[str]) -> int | None:
    return next((index for index, path in enumerate(order, 1) if path in gold), None)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evaluation", type=Path, required=True)
    parser.add_argument("--run", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or sha(args.evaluation) != EVALUATION_SHA:
        raise SystemExit("output-or-evaluation-pin-drift")
    evaluated = json.loads(args.evaluation.read_bytes())["cases"]
    if len(evaluated) != 24:
        raise SystemExit("denominator-drift")
    rows = []
    for case in evaluated:
        ordinal = case["ordinal"]
        gold = set(case["gold_paths"])
        ar = json.loads((args.run / "are-rankings-r1" / f"ARE-RANKING-{ordinal:02d}.json").read_bytes())
        br = json.loads((args.run / "chunk-rankings-r1" / f"CHUNK-RANKING-{ordinal:02d}.json").read_bytes())
        if ar["id"] != br["id"] != case["id"] or not gold:
            raise SystemExit("case-identity-drift")
        are, chunk = ar["ranked_files"], br["ranked_files"]
        union = {k: bool(gold & (set(are[:k]) | set(chunk[:k]))) for k in KS}
        rows.append({"ordinal": ordinal, "language": case["language"],
                     "are_first_gold_rank": first_rank(are, gold),
                     "chunk_first_gold_rank": first_rank(chunk, gold),
                     "union_reaches_gold": union})
    receipt = {"schema_version": "are.g01-bugswarm-exposed-candidate-ceiling-r1/v1",
               "posture": "post-score exposed diagnosis, not fresh confirmation",
               "evaluation_sha256": EVALUATION_SHA, "cases": rows}
    encoded = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cases": len(rows), "union_gold_reach": {
        str(k): sum(row["union_reaches_gold"][k] for row in rows) for k in KS},
        "are_gold_reach": {str(k): sum(row["are_first_gold_rank"] is not None
                                      and row["are_first_gold_rank"] <= k for row in rows) for k in KS},
        "chunk_gold_reach": {str(k): sum(row["chunk_first_gold_rank"] is not None
                                        and row["chunk_first_gold_rank"] <= k for row in rows) for k in KS},
        "receipt_sha256": hashlib.sha256(encoded).hexdigest()}), flush=True)


if __name__ == "__main__":
    main()
