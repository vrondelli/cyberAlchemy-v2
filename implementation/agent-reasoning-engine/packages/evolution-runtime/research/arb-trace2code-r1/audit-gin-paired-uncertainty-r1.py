#!/usr/bin/env python3
"""Evaluator-side paired uncertainty for the exposed Gin edge-window contrast."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import random
import statistics


QUERY_SHA256 = "19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a"
BCY_SHA256 = "519c5729f13c757bd7e40f87059c86f9c68dab460847d34e52b6e3859344357f"
RANK_SHA256 = "6bac22a2d8ed6368b65e466277cd6c4472360c84d441c6fa078e461fc04e2ab5"
PACKET_SHA256 = "8bfe36a9f0207a580505ca6a91b4aee976b192b2e3cfacc659154fd9d8d2aa3c"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"
SEED = 20261004
BOOTSTRAPS = 20000


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def quantile(sorted_values: list[float], probability: float) -> float:
    position = (len(sorted_values) - 1) * probability
    lower = int(position)
    fraction = position - lower
    if fraction == 0:
        return sorted_values[lower]
    return sorted_values[lower] * (1 - fraction) + sorted_values[lower + 1] * fraction


def interval(values: list[float], groups: list[list[int]]) -> dict[str, float]:
    rng = random.Random(SEED)
    boot = []
    for _ in range(BOOTSTRAPS):
        selected = [groups[rng.randrange(len(groups))] for _ in groups]
        total = sum(values[index] for group in selected for index in group)
        count = sum(len(group) for group in selected)
        boot.append(total / count)
    boot.sort()
    return {"mean_delta": statistics.mean(values), "cluster_percentile_95_low": quantile(boot, 0.025),
            "cluster_percentile_95_high": quantile(boot, 0.975),
            "improved_cases": sum(value > 0 for value in values),
            "regressed_cases": sum(value < 0 for value in values),
            "tied_cases": sum(value == 0 for value in values),
            "bootstrap_replicates": BOOTSTRAPS}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--queries", type=pathlib.Path, required=True)
    parser.add_argument("--bcy", type=pathlib.Path, required=True)
    parser.add_argument("--rank", type=pathlib.Path, required=True)
    parser.add_argument("--packet", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    query_path, bcy_path, rank_path, packet_path = (path.resolve(strict=True) for path in
                                                    (args.queries, args.bcy, args.rank, args.packet))
    output = args.output.absolute()
    if output.exists() or tuple(map(sha256_file, (query_path, bcy_path, rank_path, packet_path))) != (
            QUERY_SHA256, BCY_SHA256, RANK_SHA256, PACKET_SHA256):
        raise SystemExit("output exists or input pin drift")
    queries = [json.loads(line) for line in query_path.read_text().splitlines()]
    audits = [json.loads(path.read_text()) for path in (bcy_path, rank_path, packet_path)]
    indexed = [{row["id"]: row for row in audit["per_case_numeric_only"]} for audit in audits]
    ids = {row["id"] for row in queries}
    if len(queries) != 56 or any(len(rows) != 56 or set(rows) != ids for rows in indexed) or \
            hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest() != DEV_ID_SET_SHA256:
        raise SystemExit("development case-set drift")
    ordered = sorted(queries, key=lambda row: row["id"])
    if any(row["repo"] != "gin-gonic/gin" for row in ordered):
        raise SystemExit("query outside exposed Gin")
    changed = [len(row["query"]["failure_excerpt"].encode("utf-8")) > 1024 for row in ordered]
    if sum(changed) != 28:
        raise SystemExit("changed-window denominator drift")
    series = {}
    for name, source, key in (
        ("bcy_at_8000", indexed[0], lambda row: row["metrics"]["edge_trace_text"]["8000"]["bcy"] - row["metrics"]["tail_trace_text"]["8000"]["bcy"]),
        ("bcy_at_32000", indexed[0], lambda row: row["metrics"]["edge_trace_text"]["32000"]["bcy"] - row["metrics"]["tail_trace_text"]["32000"]["bcy"]),
        ("mrr_at_8", indexed[1], lambda row: row["metrics"]["edge_trace_text"]["mrr_at_8"] - row["metrics"]["tail_trace_text"]["mrr_at_8"]),
        ("packet_hit_at_3", indexed[2], lambda row: row["metrics"]["edge_trace_text"]["hit_at_3"] - row["metrics"]["tail_trace_text"]["hit_at_3"]),
    ):
        values = [key(source[row["id"]]) for row in ordered]
        if any(value != 0 for value, did_change in zip(values, changed) if not did_change):
            raise SystemExit("unchanged query changed score")
        series[name] = values
    by_commit = {}
    for index, row in enumerate(ordered):
        by_commit.setdefault(row["base_commit"], []).append(index)
    groups = list(by_commit.values())
    changed_indices = [index for index, did_change in enumerate(changed) if did_change]
    changed_groups = [[index for index in group if index in changed_indices]
                      for group in groups]
    changed_groups = [group for group in changed_groups if group]
    report = {"schema": "are.arb-trace2code-gin-paired-uncertainty-r1/v1",
              "posture": "exposed single-repository development; cluster bootstrap is descriptive, not a superiority claim",
              "query_sha256": QUERY_SHA256, "bcy_audit_sha256": BCY_SHA256,
              "rank_audit_sha256": RANK_SHA256, "packet_audit_sha256": PACKET_SHA256,
              "development_cases": 56, "changed_window_cases": 28,
              "unchanged_window_cases": 28, "snapshot_clusters": len(groups),
              "seed": SEED, "bootstrap_replicates": BOOTSTRAPS,
              "full_exposed": {name: interval(values, groups) for name, values in series.items()},
              "changed_only": {name: interval([values[index] for index in changed_indices],
                                              [[changed_indices.index(index) for index in group]
                                               for group in changed_groups]) for name, values in series.items()},
              "heldout_gold_inspected": False, "model_calls": 0}
    output.mkdir(parents=True, exist_ok=False)
    (output / "PAIRED-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
