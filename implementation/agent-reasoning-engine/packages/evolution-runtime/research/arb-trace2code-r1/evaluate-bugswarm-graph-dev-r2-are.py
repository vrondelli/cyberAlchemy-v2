#!/usr/bin/env python3
"""Evaluator-only ARE baseline score on the sealed graph-development cohort."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path


PINS = {
    "seal": "45600cfba313f530d2357fb30ec3304fe8ea23ea02c0fcb21b30d210c9a95824",
    "gold": "454c8d74fb30f4a0dcaeea4eb7fd2a0fdf8d77b3d46c0f568a86a3e74a90322d",
    "projection": "c4d2c61f61028c9abbef6f41bc37c455223aa6fd84fceb3793704dcf72e93093",
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in (*PINS, "rankings", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or any(sha(getattr(args, name).read_bytes()) != pin
                                   for name, pin in PINS.items()):
        raise SystemExit("input-pin-drift-or-output-exists")
    seal = json.loads(args.seal.read_bytes())["rankings"]
    gold = json.loads(args.gold.read_bytes())["results"]
    projected = json.loads(args.projection.read_bytes())["results"]
    if len(seal) != len(gold) or len(gold) != len(projected) or len(gold) != 24:
        raise SystemExit("denominator-drift")
    cases = []
    for ordinal, (rank, label, projection) in enumerate(zip(seal, gold, projected), 1):
        path = args.rankings / f"ARE-RANKING-{ordinal:02d}.json"
        data = path.read_bytes()
        row = json.loads(data)
        if (rank["ordinal"] != ordinal or label["ordinal"] != ordinal
                or projection["ordinal"] != ordinal or row["ordinal"] != ordinal
                or sha(data) != rank["ranking_sha256"] or row["id"] != label["image_tag"]
                or row["id"] != projection["image_tag"] or not label["gold_admissible"]
                or not projection["all_projected"]):
            raise SystemExit("ranking-label-identity-drift:" + str(ordinal))
        gold_paths = {item["path"] for item in label["source_gold_paths"]}
        projected_paths = {item["path"] for item in projection["source_gold_paths"]}
        if not gold_paths or gold_paths != projected_paths:
            raise SystemExit("gold-path-projection-drift")
        order = row["ranked_files"]
        first = next((i for i, item in enumerate(order[:8], 1) if item in gold_paths), None)
        cases.append({"ordinal": ordinal, "id": row["id"], "repo": row["repo"],
                      "language": row["language"], "gold_paths": sorted(gold_paths),
                      "are_rr8": 1 / first if first else 0.0,
                      "are_hit3": int(bool(gold_paths.intersection(order[:3]))),
                      "are_recall20": len(gold_paths.intersection(order[:20])) / len(gold_paths),
                      "are_candidate_reach30": bool(gold_paths.intersection(order[:30])),
                      "are_ranker_elapsed_ms": row["ranker_elapsed_ms"]})
    mean = lambda key: sum(row[key] for row in cases) / len(cases)
    result = {"schema_version": "are.g01-bugswarm-graph-dev-are-evaluation-r2/v1",
              "pins": PINS, "script_sha256": sha(Path(__file__).read_bytes()),
              "cases": cases,
              "aggregate": {"mrr8": mean("are_rr8"), "hit3": mean("are_hit3"),
                            "recall20": mean("are_recall20"),
                            "candidate_reach30": sum(row["are_candidate_reach30"] for row in cases)},
              "claim_ceiling": "Exposed private development baseline on source-projected BugSwarm; HTTP labels/logs provisional; no treatment, fresh confirmation, live ARE, ContextBench, or superiority claim."}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(cases), "aggregate": result["aggregate"],
                      "evaluation_sha256": sha(data)}))


if __name__ == "__main__":
    main()
