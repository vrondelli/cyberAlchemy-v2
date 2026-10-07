#!/usr/bin/env python3
"""Apply the frozen r62 all-17 label-admission gate; do not compute scores."""

import argparse
import hashlib
import json
from pathlib import Path

SOURCE_SEAL_SHA = "10b0fbc0b3be589a755879b3751210eaf0086ebc838f1a84c799326612aa6a89"
RANKINGS_SHA = "bbf94499a5e49016507dc957d6a8f2ec51a5ea9876417109c3ce165f77693858"
CENSUS_SHA = "88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e"
PROJECTION_SHA = "14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=Path, required=True)
    ap.add_argument("--census", type=Path, required=True)
    ap.add_argument("--projection", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    seal_path = args.source / "SOURCE-SEAL.json"
    ranking_path = args.source / "RANKINGS.jsonl"
    if (sha(seal_path) != SOURCE_SEAL_SHA or sha(ranking_path) != RANKINGS_SHA or
            sha(args.census) != CENSUS_SHA or sha(args.projection) != PROJECTION_SHA):
        raise SystemExit("input drift")
    source_seal = json.loads(seal_path.read_text())
    if source_seal["status"] != "complete" or source_seal["cases"] != 17 or source_seal["gold_opened"]:
        raise SystemExit("source not sealed")
    rankings = [json.loads(line) for line in ranking_path.read_text().splitlines()]
    census = json.loads(args.census.read_text())
    labels = {row["ordinal"]: row for row in census["combined_results"]}
    projection = {row["slot"]: row for row in json.loads(args.projection.read_text())["records"]}
    if len(rankings) != 17 or len(labels) != 24:
        raise SystemExit("denominator drift")
    per = []
    for prediction in rankings:
        label = labels[prediction["ordinal"]]
        if (prediction["id"] != label["id"] or prediction["repo"] != label["repo"] or
                label["failed_sha"] != projection[prediction["ordinal"]]["failed_commit"]):
            raise SystemExit("label identity mismatch")
        per.append({"ordinal": prediction["ordinal"], "id": prediction["id"],
                    "repo": prediction["repo"], "admissible": label["gold_admissible"],
                    "reason": label.get("inadmissible_reason")})
    admitted = sum(row["admissible"] for row in per)
    result = {"schema_version": "are.g01-r62-label-admission/v1",
              "status": "passed" if admitted == 17 else "terminal-label-admission-failed",
              "population": 17, "admissible": admitted, "inadmissible": 17-admitted,
              "source_seal_sha256": SOURCE_SEAL_SHA, "rankings_sha256": RANKINGS_SHA,
              "census_sha256": CENSUS_SHA, "projection_sha256": PROJECTION_SHA,
              "scores_computed": 0,
              "claim_ceiling": "admission diagnosis only; no transfer or superiority score",
              "cases": per}
    if args.output.exists():
        raise SystemExit("output exists")
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")
    print(json.dumps({key: result[key] for key in ("status", "population", "admissible", "inadmissible", "scores_computed")}, sort_keys=True))


if __name__ == "__main__":
    main()
