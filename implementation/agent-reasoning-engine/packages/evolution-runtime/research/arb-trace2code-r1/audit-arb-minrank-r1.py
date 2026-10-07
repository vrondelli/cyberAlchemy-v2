#!/usr/bin/env python3
"""Evaluator-only audit of fixed min-rank on exposed ARB cases."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
PREDICTION_SHA256 = "8350c000fa52e34e619656127c7a37168a9a8296f1d75618fa92844c4538724e"
NAMES = ("arb_edge_bm25", "are_edge_trace_text", "fixed_rrf_k60", "fixed_minrank")


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def score(ranking: list[str], gold: set[str]) -> dict[str, float]:
    first = min(ranking.index(path) + 1 for path in gold)
    return {"mrr_at_8": 1 / first if first <= 8 else 0.0,
            "mrr": 1 / first, "hit_at_3": float(first <= 3),
            "hit_at_8": float(first <= 8),
            "recall_at_20": len(gold.intersection(ranking[:20])) / len(gold)}


def aggregate(items: list[dict]) -> dict:
    return {name: {metric: statistics.mean(item["metrics"][name][metric] for item in items)
                   for metric in items[0]["metrics"][name]} for name in NAMES}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--rankings", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, prediction_path = (path.resolve(strict=True) for path in (args.archive, args.rankings))
    if args.output.exists() or (sha256_file(archive), sha256_file(prediction_path)) != (
            ARCHIVE_SHA256, PREDICTION_SHA256):
        raise SystemExit("output exists or input pin drift")
    seal = json.loads((prediction_path.parent / "SOURCE-SEAL.json").read_text())
    if seal.get("prediction_sha256") != PREDICTION_SHA256 or seal.get("gold_opened") is not False:
        raise SystemExit("source seal drift")
    predictions = {row["id"]: row for row in
                   (json.loads(line) for line in prediction_path.read_text().splitlines())}
    if len(predictions) != 101:
        raise SystemExit("prediction denominator drift")
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("sample member missing")
        for line in stream:
            row = json.loads(line)
            prediction = predictions.get(row["id"])
            if prediction is None or prediction["repo"] != row["repo"] or \
                    prediction["base_commit"] != row["base_commit"]:
                raise SystemExit("case identity drift")
            gold = set(row["gold"]["root_cause_files"])
            universe = set(prediction[NAMES[0]])
            if not gold or not gold.issubset(universe) or len(universe) != prediction["candidate_count"] or \
                    any(len(prediction[name]) != len(universe) or set(prediction[name]) != universe
                        for name in NAMES):
                raise SystemExit("candidate or gold drift")
            scored.append({"id": row["id"], "repo": row["repo"], "gold_count": len(gold),
                           "metrics": {name: score(prediction[name], gold) for name in NAMES}})
    if len(scored) != 101 or {item["id"] for item in scored} != set(predictions):
        raise SystemExit("scored denominator drift")
    gin = [item for item in scored if item["repo"] == "gin-gonic/gin"]
    nongin = [item for item in scored if item["repo"] != "gin-gonic/gin"]
    if len(gin) != 56 or len(nongin) != 45:
        raise SystemExit("split drift")
    report = {"schema": "are.arb-exposed-minrank-evaluator-r1/v1",
              "posture": "post-confirmation exposed development; source-only fixed min-rank, no independent claim",
              "archive_sha256": ARCHIVE_SHA256, "prediction_sha256": PREDICTION_SHA256,
              "cases": len(scored), "gold_file_entries": sum(item["gold_count"] for item in scored),
              "all_101": aggregate(scored), "gin_56": aggregate(gin), "nongin_45": aggregate(nongin),
              "per_repo": {repo: {"cases": sum(item["repo"] == repo for item in scored),
                                  "aggregate": aggregate([item for item in scored if item["repo"] == repo])}
                           for repo in sorted({item["repo"] for item in scored})},
              "per_case_numeric_only": sorted(scored, key=lambda item: item["id"])}
    args.output.mkdir(parents=True, exist_ok=False)
    (args.output / "EVALUATOR-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key not in ("per_case_numeric_only", "per_repo")}, sort_keys=True))


if __name__ == "__main__":
    main()
