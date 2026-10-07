#!/usr/bin/env python3
"""Evaluator-only comparison of fixed tail and edge windows on exposed Gin."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
TAIL_SHA256 = "b2dbdbfc3145d0d313aa9aa3bf70162e97467f7f6bf51bd286bb0a82968335b7"
EDGE_SHA256 = "1e6d8d4170163318b05a693950db6609c21f7aef2d11911747e4f29c0cc30bcd"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def score(ranking: list[str], gold: set[str]) -> dict[str, float]:
    first = min(ranking.index(path) + 1 for path in gold)
    return {"mrr": 1 / first, "mrr_at_8": 1 / first if first <= 8 else 0.0,
            "hit_at_3": float(first <= 3),
            "hit_at_8": float(first <= 8),
            "recall_at_3": len(gold.intersection(ranking[:3])) / len(gold),
            "recall_at_20": len(gold.intersection(ranking[:20])) / len(gold)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--tail", type=pathlib.Path, required=True)
    parser.add_argument("--edge", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, tail_path, edge_path = (path.resolve(strict=True) for path in
                                     (args.archive, args.tail, args.edge))
    output = args.output.absolute()
    if output.exists() or (sha256_file(archive), sha256_file(tail_path), sha256_file(edge_path)) != (
            ARCHIVE_SHA256, TAIL_SHA256, EDGE_SHA256):
        raise SystemExit("output exists or input pin drift")
    tail_rows = [json.loads(line) for line in tail_path.read_text().splitlines()]
    edge_rows = [json.loads(line) for line in edge_path.read_text().splitlines()]
    tail, edge = ({row["id"]: row for row in rows} for rows in (tail_rows, edge_rows))
    ids = set(tail)
    if (len(tail_rows), len(edge_rows), len(tail), len(edge)) != (56, 56, 56, 56) or \
            ids != set(edge) or hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest() != DEV_ID_SET_SHA256:
        raise SystemExit("development denominator drift")
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] != "gin-gonic/gin":
                continue  # Never access held-out gold.
            t, e = tail.get(row["id"]), edge.get(row["id"])
            if t is None or e is None or t["base_commit"] != row["base_commit"] or e["base_commit"] != row["base_commit"]:
                raise SystemExit("case identity drift")
            rankings = {"tail_bm25": t["bm25_ranked_files"],
                        "tail_trace_text": t["trace_text_ranked_files"],
                        "edge_bm25": e["edge_bm25"],
                        "edge_trace_text": e["edge_trace_text"]}
            common = set(rankings["tail_bm25"])
            if len(common) != t["candidate_count"] or e["candidate_count"] != t["candidate_count"] or any(
                    len(paths) != len(common) or set(paths) != common for paths in rankings.values()):
                raise SystemExit("all-files candidate drift")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(common):
                raise SystemExit("gold outside candidate set")
            scored.append({"id": row["id"], "gold_file_count": len(gold),
                           "metrics": {name: score(paths, gold) for name, paths in rankings.items()}})
    if len(scored) != 56 or {row["id"] for row in scored} != ids:
        raise SystemExit("scored denominator drift")
    names = ("tail_bm25", "tail_trace_text", "edge_bm25", "edge_trace_text")
    aggregates = {name: {metric: statistics.mean(row["metrics"][name][metric] for row in scored)
                         for metric in scored[0]["metrics"][name]} for name in names}
    comparisons = {}
    for mode in ("bm25", "trace_text"):
        diffs = [row["metrics"][f"edge_{mode}"]["mrr_at_8"] -
                 row["metrics"][f"tail_{mode}"]["mrr_at_8"] for row in scored]
        comparisons[mode] = {"mean_mrr_at_8_delta": statistics.mean(diffs),
                             "improved": sum(value > 0 for value in diffs),
                             "regressed": sum(value < 0 for value in diffs),
                             "tied": sum(value == 0 for value in diffs)}
    report = {"schema": "are.arb-trace2code-gin-edge-window-audit-r1/v1",
              "posture": "exposed Gin development on ARB file projections; not live ARE or official ARB evaluation",
              "archive_sha256": ARCHIVE_SHA256, "tail_sha256": TAIL_SHA256, "edge_sha256": EDGE_SHA256,
              "development_cases": 56, "gold_file_entries": sum(row["gold_file_count"] for row in scored),
              "heldout_gold_inspected": False, "aggregates": aggregates,
              "comparisons": comparisons, "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    output.mkdir(parents=True, exist_ok=False)
    (output / "EVALUATOR-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
