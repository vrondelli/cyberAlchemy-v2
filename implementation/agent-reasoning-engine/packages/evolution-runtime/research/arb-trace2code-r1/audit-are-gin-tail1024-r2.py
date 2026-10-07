#!/usr/bin/env python3
"""Evaluator-only, equal-tail-input comparison on exposed Gin development cases."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
ARE_HINTS_SHA256 = "62272a5ca0cf2a3f4e7fc80c18c03b07725c882b93684ae64a5f6039bc51c92d"
TAIL_RANKINGS_SHA256 = "541791cf826edb8bb3be7e4aa71981a6f01e517abeeee8470b709c1bcf41fff5"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def metrics(top: list[str], gold: set[str]) -> dict[str, float]:
    hits = gold.intersection(top)
    first = min((top.index(path) + 1 for path in hits), default=None)
    return {"mrr_at_8": 1 / first if first else 0.0,
            "recall_at_8": len(hits) / len(gold), "hit_at_8": float(bool(hits))}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--are-hints", type=pathlib.Path, required=True)
    parser.add_argument("--tail-rankings", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, hints, rankings = (path.resolve(strict=True) for path in
                                (args.archive, args.are_hints, args.tail_rankings))
    output = args.output.absolute()
    if output.exists() or (sha256_file(archive), sha256_file(hints), sha256_file(rankings)) != (
            ARCHIVE_SHA256, ARE_HINTS_SHA256, TAIL_RANKINGS_SHA256):
        raise SystemExit("output exists or input hash mismatch")
    are = {row["id"]: row for row in (json.loads(line) for line in hints.read_text().splitlines())}
    tail = {row["id"]: row for row in (json.loads(line) for line in rankings.read_text().splitlines())}
    ids = set(are)
    if (len(are), len(tail), len(ids)) != (56, 56, 56) or ids != set(tail) or \
            hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest() != DEV_ID_SET_SHA256:
        raise SystemExit("development identity drift")
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] != "gin-gonic/gin":
                continue  # Held-out rows skipped before gold access.
            a, t = are.get(row["id"]), tail.get(row["id"])
            if not a or not t or a["base_commit"] != row["base_commit"] or t["base_commit"] != row["base_commit"]:
                raise SystemExit("sample identity drift")
            candidates = set(t["baseline_ranked_files"])
            if len(candidates) != t["candidate_count"] or a["indexed_files"] != len(candidates):
                raise SystemExit("candidate count drift")
            top = {"are_tail": [hint["path"] for hint in a["tail_hints"]],
                   "bm25_tail": t["baseline_ranked_files"][:8],
                   "trace_tail": t["trace_aware_ranked_files"][:8]}
            if any(len(paths) > 8 or len(paths) != len(set(paths)) or not set(paths).issubset(candidates)
                   for paths in top.values()):
                raise SystemExit("invalid ranked paths")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(candidates):
                raise SystemExit("gold outside source corpus")
            scored.append({"id": row["id"], "gold_file_count": len(gold),
                           "metrics": {name: metrics(paths, gold) for name, paths in top.items()}})
    if len(scored) != 56 or set(row["id"] for row in scored) != ids:
        raise SystemExit("scored denominator drift")
    aggregate = {name: {metric: statistics.mean(row["metrics"][name][metric] for row in scored)
                        for metric in ("mrr_at_8", "recall_at_8", "hit_at_8")}
                 for name in ("are_tail", "bm25_tail", "trace_tail")}
    comparisons = {}
    for left, right in (("are_tail", "bm25_tail"), ("bm25_tail", "trace_tail"), ("are_tail", "trace_tail")):
        diffs = [row["metrics"][right]["mrr_at_8"] - row["metrics"][left]["mrr_at_8"]
                 for row in scored]
        comparisons[f"{right}_minus_{left}"] = {"mrr_at_8_mean_delta": statistics.mean(diffs),
                                                "improved": sum(x > 0 for x in diffs),
                                                "regressed": sum(x < 0 for x in diffs),
                                                "tied": sum(x == 0 for x in diffs)}
    report = {"schema": "are.arb-trace2code-gin-tail1024-audit-r2/v1",
              "posture": "exposed development simulation; equal 1024-byte tail query, same ARB file snapshot corpus",
              "limit": "ARE line hints vs local file BM25; not pinned Git/full ARE episode or official ARB evaluation",
              "archive_sha256": ARCHIVE_SHA256, "are_hints_sha256": ARE_HINTS_SHA256,
              "tail_rankings_sha256": TAIL_RANKINGS_SHA256,
              "development_cases": len(scored), "gold_file_entries": sum(row["gold_file_count"] for row in scored),
              "heldout_gold_inspected": False, "aggregates": aggregate, "comparisons": comparisons,
              "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    output.mkdir(parents=True, exist_ok=False)
    path = output / "EVALUATOR-AUDIT.json"
    path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
