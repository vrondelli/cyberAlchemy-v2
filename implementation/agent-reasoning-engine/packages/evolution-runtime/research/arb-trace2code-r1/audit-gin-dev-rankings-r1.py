#!/usr/bin/env python3
"""Evaluator-only Gin development audit; skip held-out rows before gold access."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
PREDICTION_SHA256 = "0ea333c9305e037df600c108b8fc67bfb67e26f686a352e518fe9b996e5e5b01"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def id_digest(ids: set[str]) -> str:
    return hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest()


def metrics(ranking: list[str], gold: set[str]) -> dict[str, float]:
    first = min(ranking.index(path) + 1 for path in gold)
    return {
        "mrr": 1 / first,
        "recall_at_3": len(gold.intersection(ranking[:3])) / len(gold),
        "recall_at_20": len(gold.intersection(ranking[:20])) / len(gold),
        "hit_at_20": float(first <= 20),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--predictions", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive = args.archive.resolve(strict=True)
    predictions = args.predictions.resolve(strict=True)
    output = args.output.absolute()
    if output.exists() or sha256_file(archive) != ARCHIVE_SHA256 or sha256_file(predictions) != PREDICTION_SHA256:
        raise SystemExit("output exists or input hash mismatch")
    ranked = {}
    for line in predictions.read_text().splitlines():
        row = json.loads(line)
        identity = row["id"]
        if identity in ranked or row["repo"] != "gin-gonic/gin":
            raise SystemExit("prediction identity violation")
        a, b = row["baseline_ranked_files"], row["trace_aware_ranked_files"]
        if len(a) != row["candidate_count"] or len(set(a)) != len(a) or set(a) != set(b) or len(b) != len(a):
            raise SystemExit("rankings do not cover the same complete candidate set")
        ranked[identity] = row
    if len(ranked) != 56 or id_digest(set(ranked)) != DEV_ID_SET_SHA256:
        raise SystemExit("development prediction denominator drift")

    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] != "gin-gonic/gin":
                continue  # Held-out labels are never selected or inspected.
            prediction = ranked.get(row["id"])
            if prediction is None or prediction["base_commit"] != row["base_commit"]:
                raise SystemExit("development sample identity drift")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(prediction["baseline_ranked_files"]):
                raise SystemExit("native gold missing from full candidate ranking")
            base = metrics(prediction["baseline_ranked_files"], gold)
            trace = metrics(prediction["trace_aware_ranked_files"], gold)
            scored.append({"id": row["id"], "gold_file_count": len(gold), "baseline": base, "trace_aware": trace})
    if len(scored) != 56 or id_digest({row["id"] for row in scored}) != DEV_ID_SET_SHA256:
        raise SystemExit("development gold denominator drift")

    aggregate = {}
    for metric in ("mrr", "recall_at_3", "recall_at_20", "hit_at_20"):
        base = [row["baseline"][metric] for row in scored]
        trace = [row["trace_aware"][metric] for row in scored]
        diffs = [b - a for a, b in zip(base, trace)]
        aggregate[metric] = {
            "baseline_mean": statistics.mean(base),
            "trace_aware_mean": statistics.mean(trace),
            "trace_minus_baseline": statistics.mean(diffs),
            "improved": sum(delta > 0 for delta in diffs),
            "regressed": sum(delta < 0 for delta in diffs),
            "tied": sum(delta == 0 for delta in diffs),
        }
    report = {
        "schema": "are.arb-trace2code-gin-dev-audit-r1/v1",
        "posture": "exposed-development-only; not official ARB evaluator or ARE runtime performance",
        "archive_sha256": ARCHIVE_SHA256,
        "prediction_sha256": PREDICTION_SHA256,
        "development_count": len(scored),
        "gold_file_entries": sum(row["gold_file_count"] for row in scored),
        "heldout_gold_inspected": False,
        "metrics": aggregate,
        "per_case_numeric_only": sorted(scored, key=lambda row: row["id"]),
    }
    output.mkdir(parents=True, exist_ok=False)
    path = output / "EVALUATOR-AUDIT.json"
    path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
