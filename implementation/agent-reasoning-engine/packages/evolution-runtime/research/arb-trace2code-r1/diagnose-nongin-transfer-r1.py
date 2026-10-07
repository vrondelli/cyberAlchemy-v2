#!/usr/bin/env python3
"""Post-confirmation diagnostic: separate ARE BM25 from trace-text adjustment."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
ARB_SHA256 = "6dabb71899d0b3e8d35dae30658e8f803aec09fd67dbd973a06ad3f67b6d82f7"
ARE_SHA256 = "3a024e28c5abaeefdbc7db0ea056e8bc3a002a0d31f1589b754014f161236bcd"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def rank_score(paths: list[str], gold: set[str]) -> dict[str, float]:
    first = min(paths.index(path) + 1 for path in gold)
    return {"mrr_at_8": 1 / first if first <= 8 else 0.0,
            "hit_at_3": float(first <= 3),
            "recall_at_20": len(gold.intersection(paths[:20])) / len(gold)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--arb", type=pathlib.Path, required=True)
    parser.add_argument("--are", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, arb_path, are_path = (path.resolve(strict=True) for path in
                                   (args.archive, args.arb, args.are))
    if args.output.exists() or tuple(map(sha256_file, (archive, arb_path, are_path))) != (
            ARCHIVE_SHA256, ARB_SHA256, ARE_SHA256):
        raise SystemExit("output exists or ranking pin drift")
    arb = {row["id"]: row for row in (json.loads(line) for line in arb_path.read_text().splitlines())}
    are = {row["id"]: row for row in (json.loads(line) for line in are_path.read_text().splitlines())}
    if len(arb) != 45 or len(are) != 45 or set(arb) != set(are):
        raise SystemExit("case-set drift")
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] == "gin-gonic/gin":
                continue
            a, r = arb[row["id"]], are[row["id"]]
            if r["status"] != "ranked_all_files" or row["base_commit"] != r["base_commit"] or \
                    row["base_commit"] != a["base_commit"]:
                raise SystemExit("case identity or coverage drift")
            rankings = {"arb_edge_bm25": a["rankings"]["edge_failure"],
                        "are_edge_bm25": r["bm25_ranked_files"],
                        "are_edge_trace_text": r["trace_text_ranked_files"]}
            universe = set(rankings["arb_edge_bm25"])
            if any(len(paths) != len(universe) or set(paths) != universe for paths in rankings.values()):
                raise SystemExit("candidate universe drift")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(universe):
                raise SystemExit("gold outside candidates")
            scored.append({"id": row["id"], "repo": row["repo"],
                           "metrics": {name: rank_score(paths, gold) for name, paths in rankings.items()}})
    if len(scored) != 45:
        raise SystemExit("scored denominator drift")
    names = tuple(scored[0]["metrics"])
    aggregate = {name: {metric: statistics.mean(row["metrics"][name][metric] for row in scored)
                        for metric in scored[0]["metrics"][name]} for name in names}
    repos = sorted({row["repo"] for row in scored})
    per_repo = {repo: {"cases": sum(row["repo"] == repo for row in scored),
                       "bm25_minus_arb_mrr_at_8": statistics.mean(
                           row["metrics"]["are_edge_bm25"]["mrr_at_8"] -
                           row["metrics"]["arb_edge_bm25"]["mrr_at_8"]
                           for row in scored if row["repo"] == repo),
                       "trace_minus_bm25_mrr_at_8": statistics.mean(
                           row["metrics"]["are_edge_trace_text"]["mrr_at_8"] -
                           row["metrics"]["are_edge_bm25"]["mrr_at_8"]
                           for row in scored if row["repo"] == repo)} for repo in repos}
    report = {"schema": "are.arb-trace2code-nongin-postconfirmation-diagnostic-r1/v1",
              "posture": "exploratory after non-Gin gold exposure; no independent claim or retest",
              "archive_sha256": ARCHIVE_SHA256, "arb_rankings_sha256": ARB_SHA256,
              "are_rankings_sha256": ARE_SHA256, "cases": len(scored),
              "aggregate": aggregate, "per_repo": per_repo,
              "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    args.output.mkdir(parents=True, exist_ok=False)
    (args.output / "DIAGNOSTIC-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
