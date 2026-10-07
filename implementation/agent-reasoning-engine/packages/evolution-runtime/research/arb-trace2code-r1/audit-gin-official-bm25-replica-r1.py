#!/usr/bin/env python3
"""Evaluator-only comparison of pinned ARB BM25 replica with ARE candidates."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
REPLICA_SHA256 = "1d8b81e146fa0d01911e4a03d75db64e79af8020030cbead889beadb44505e78"
TAIL_SHA256 = "b2dbdbfc3145d0d313aa9aa3bf70162e97467f7f6bf51bd286bb0a82968335b7"
EDGE_SHA256 = "1e6d8d4170163318b05a693950db6609c21f7aef2d11911747e4f29c0cc30bcd"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load(path: pathlib.Path) -> dict[str, dict]:
    rows = [json.loads(line) for line in path.read_text().splitlines()]
    by_id = {row["id"]: row for row in rows}
    if len(rows) != 56 or len(by_id) != 56:
        raise SystemExit("development denominator drift")
    return by_id


def score(ranking: list[str], gold: set[str]) -> dict[str, float]:
    first = min(ranking.index(path) + 1 for path in gold)
    return {"mrr": 1 / first, "mrr_at_8": 1 / first if first <= 8 else 0.0,
            "hit_at_3": float(first <= 3), "hit_at_8": float(first <= 8),
            "recall_at_3": len(gold.intersection(ranking[:3])) / len(gold),
            "recall_at_20": len(gold.intersection(ranking[:20])) / len(gold)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--replica", type=pathlib.Path, required=True)
    parser.add_argument("--tail", type=pathlib.Path, required=True)
    parser.add_argument("--edge", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, replica_path, tail_path, edge_path = (path.resolve(strict=True) for path in
                                                  (args.archive, args.replica, args.tail, args.edge))
    if args.output.exists() or tuple(map(sha256_file, (archive, replica_path, tail_path, edge_path))) != (
            ARCHIVE_SHA256, REPLICA_SHA256, TAIL_SHA256, EDGE_SHA256):
        raise SystemExit("output exists or input pin drift")
    replica, tail, edge = (load(path) for path in (replica_path, tail_path, edge_path))
    ids = set(replica)
    if ids != set(tail) or ids != set(edge) or hashlib.sha256(
            ("\n".join(sorted(ids)) + "\n").encode()).hexdigest() != DEV_ID_SET_SHA256:
        raise SystemExit("case-set drift")
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] != "gin-gonic/gin":
                continue  # No held-out label access.
            item_id = row["id"]
            r, t, e = replica.get(item_id), tail.get(item_id), edge.get(item_id)
            if any(item is None or item["base_commit"] != row["base_commit"] for item in (r, t, e)):
                raise SystemExit("case identity drift")
            rankings = {"replica_full_json": r["rankings"]["full_json"],
                        "replica_tail_failure": r["rankings"]["tail_failure"],
                        "replica_edge_failure": r["rankings"]["edge_failure"],
                        "are_tail_bm25": t["bm25_ranked_files"],
                        "are_tail_trace_text": t["trace_text_ranked_files"],
                        "are_edge_bm25": e["edge_bm25"],
                        "are_edge_trace_text": e["edge_trace_text"]}
            common = set(rankings["replica_full_json"])
            if len(common) != r["candidate_count"] or any(
                    len(paths) != len(common) or set(paths) != common for paths in rankings.values()):
                raise SystemExit("candidate universe drift")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(common):
                raise SystemExit("gold outside candidates")
            scored.append({"id": item_id, "gold_file_count": len(gold),
                           "metrics": {name: score(paths, gold) for name, paths in rankings.items()}})
    if len(scored) != 56 or {row["id"] for row in scored} != ids:
        raise SystemExit("scored denominator drift")
    names = tuple(scored[0]["metrics"])
    aggregates = {name: {metric: statistics.mean(row["metrics"][name][metric] for row in scored)
                         for metric in scored[0]["metrics"][name]} for name in names}
    comparisons = {}
    for name, reference in (("are_tail_bm25", "replica_tail_failure"),
                            ("are_tail_trace_text", "replica_tail_failure"),
                            ("are_edge_bm25", "replica_edge_failure"),
                            ("are_edge_trace_text", "replica_edge_failure")):
        diffs = [row["metrics"][name]["mrr_at_8"] - row["metrics"][reference]["mrr_at_8"]
                 for row in scored]
        comparisons[f"{name}_minus_{reference}"] = {
            "mean_mrr_at_8_delta": statistics.mean(diffs),
            "improved": sum(delta > 0 for delta in diffs),
            "regressed": sum(delta < 0 for delta in diffs),
            "tied": sum(delta == 0 for delta in diffs)}
    report = {"schema": "are.arb-trace2code-gin-official-bm25-replica-audit-r1/v1",
              "posture": "local official-method replica and ARE candidate on exposed Gin; not official executable, holdout, or live ARE",
              "archive_sha256": ARCHIVE_SHA256, "replica_sha256": REPLICA_SHA256,
              "tail_sha256": TAIL_SHA256, "edge_sha256": EDGE_SHA256,
              "development_cases": 56, "gold_file_entries": sum(row["gold_file_count"] for row in scored),
              "heldout_gold_inspected": False, "aggregates": aggregates,
              "comparisons": comparisons, "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    args.output.mkdir(parents=True, exist_ok=False)
    (args.output / "EVALUATOR-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
