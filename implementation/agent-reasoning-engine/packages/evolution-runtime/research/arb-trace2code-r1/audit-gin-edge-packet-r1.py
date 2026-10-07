#!/usr/bin/env python3
"""Evaluator-only audit of tail versus edge projected initial packets."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
TAIL_DELIVERY_SHA256 = "dd08238e038cdb7431fb8c0943a6bdf2dafeb0a6a43a91204f727448789e2c79"
EDGE_DELIVERY_SHA256 = "017f65598750edf88eef5ebfd0de94c76569c76613a8365d60fd2295f3e804a2"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_rows(path: pathlib.Path) -> dict[str, dict]:
    rows = [json.loads(line) for line in path.read_text().splitlines()]
    indexed = {row["id"]: row for row in rows}
    if len(rows) != 56 or len(indexed) != 56:
        raise SystemExit("delivery denominator drift")
    return indexed


def checked_packet(packet: dict, gold: set[str]) -> dict[str, float]:
    paths = packet["selected_paths"]
    reads = packet["reads"]
    if len(paths) != 3 or len(set(paths)) != 3 or [read["path"] for read in reads] != paths or \
            any(read["bytes"] < 0 or read["start_line"] < 1 or
                read["end_line"] < read["start_line"] or
                len(read["content_sha256"]) != 64 for read in reads) or \
            sum(read["bytes"] for read in reads) != packet["delivered_bytes"] or \
            packet["delivered_bytes"] > 49152:
        raise SystemExit("packet contract drift")
    hits = len(gold.intersection(paths))
    return {"hit_at_3": float(hits > 0), "recall_at_3": hits / len(gold),
            "delivered_bytes": float(packet["delivered_bytes"])}


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
            ARCHIVE_SHA256, TAIL_DELIVERY_SHA256, EDGE_DELIVERY_SHA256):
        raise SystemExit("output exists or input pin drift")
    tail, edge = load_rows(tail_path), load_rows(edge_path)
    ids = set(tail)
    if ids != set(edge) or hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest() != DEV_ID_SET_SHA256:
        raise SystemExit("development case-set drift")
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] != "gin-gonic/gin":
                continue  # Do not inspect held-out gold.
            t, e = tail.get(row["id"]), edge.get(row["id"])
            if t is None or e is None or t["base_commit"] != row["base_commit"] or e["base_commit"] != row["base_commit"]:
                raise SystemExit("sample identity drift")
            gold = set(row["gold"]["root_cause_files"])
            if not gold:
                raise SystemExit("empty development gold")
            variants = {"tail_bm25": t["variants"]["candidate_bm25"],
                        "tail_trace_text": t["variants"]["candidate_trace_text"],
                        "edge_bm25": e["variants"]["edge_bm25"],
                        "edge_trace_text": e["variants"]["edge_trace_text"]}
            scored.append({"id": row["id"], "gold_file_count": len(gold),
                           "metrics": {name: checked_packet(packet, gold)
                                       for name, packet in variants.items()}})
    if len(scored) != 56 or {row["id"] for row in scored} != ids:
        raise SystemExit("scored denominator drift")
    names = ("tail_bm25", "tail_trace_text", "edge_bm25", "edge_trace_text")
    aggregates = {name: {metric: statistics.mean(row["metrics"][name][metric] for row in scored)
                         for metric in scored[0]["metrics"][name]} for name in names}
    comparisons = {}
    for mode in ("bm25", "trace_text"):
        comparisons[mode] = {"extra_hit_cases": sum(
            row["metrics"][f"edge_{mode}"]["hit_at_3"] > row["metrics"][f"tail_{mode}"]["hit_at_3"]
            for row in scored), "lost_hit_cases": sum(
            row["metrics"][f"edge_{mode}"]["hit_at_3"] < row["metrics"][f"tail_{mode}"]["hit_at_3"]
            for row in scored), "mean_extra_bytes": statistics.mean(
            row["metrics"][f"edge_{mode}"]["delivered_bytes"] -
            row["metrics"][f"tail_{mode}"]["delivered_bytes"] for row in scored)}
    report = {"schema": "are.arb-trace2code-gin-edge-packet-audit-r1/v1",
              "posture": "exposed Gin projected packet simulation; not live ARE or official ARB context metric",
              "archive_sha256": ARCHIVE_SHA256, "tail_delivery_sha256": TAIL_DELIVERY_SHA256,
              "edge_delivery_sha256": EDGE_DELIVERY_SHA256, "development_cases": len(scored),
              "gold_file_entries": sum(row["gold_file_count"] for row in scored),
              "heldout_gold_inspected": False, "aggregates": aggregates,
              "comparisons": comparisons, "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    output.mkdir(parents=True, exist_ok=False)
    (output / "EVALUATOR-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
