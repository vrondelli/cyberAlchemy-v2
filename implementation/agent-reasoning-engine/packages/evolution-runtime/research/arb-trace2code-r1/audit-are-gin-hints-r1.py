#!/usr/bin/env python3
"""Evaluator-only eight-hint development audit; never inspect held-out gold."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
ARE_HINTS_SHA256 = "62272a5ca0cf2a3f4e7fc80c18c03b07725c882b93684ae64a5f6039bc51c92d"
PROTOTYPE_SHA256 = "0ea333c9305e037df600c108b8fc67bfb67e26f686a352e518fe9b996e5e5b01"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def id_digest(ids: set[str]) -> str:
    return hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest()


def metrics(top: list[str], gold: set[str]) -> dict[str, float]:
    hits = gold.intersection(top)
    first = min((top.index(path) + 1 for path in hits), default=None)
    return {"mrr_at_8": 1 / first if first else 0.0,
            "recall_at_8": len(hits) / len(gold), "hit_at_8": float(bool(hits))}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--are-hints", type=pathlib.Path, required=True)
    parser.add_argument("--prototype", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, hints, prototype = (path.resolve(strict=True) for path in
                                 (args.archive, args.are_hints, args.prototype))
    output = args.output.absolute()
    if output.exists() or (sha256_file(archive), sha256_file(hints), sha256_file(prototype)) != (
            ARCHIVE_SHA256, ARE_HINTS_SHA256, PROTOTYPE_SHA256):
        raise SystemExit("output exists or input hash mismatch")
    predictions = {}
    for line in hints.read_text().splitlines():
        row = json.loads(line)
        if row["id"] in predictions or row["repo"] != "gin-gonic/gin":
            raise SystemExit("ARE hint identity violation")
        predictions[row["id"]] = row
    prototype_rows = {}
    for line in prototype.read_text().splitlines():
        row = json.loads(line)
        if row["id"] in prototype_rows or row["repo"] != "gin-gonic/gin":
            raise SystemExit("prototype identity violation")
        prototype_rows[row["id"]] = row
    if (len(predictions) != 56 or set(predictions) != set(prototype_rows) or
            id_digest(set(predictions)) != DEV_ID_SET_SHA256):
        raise SystemExit("development denominator drift")

    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] != "gin-gonic/gin":
                continue  # Held-out rows are skipped before touching gold.
            are = predictions.get(row["id"])
            proto = prototype_rows.get(row["id"])
            if are is None or proto is None or are["base_commit"] != row["base_commit"] or \
                    proto["base_commit"] != row["base_commit"]:
                raise SystemExit("development sample identity drift")
            candidates = set(proto["baseline_ranked_files"])
            if len(candidates) != proto["candidate_count"] or are["indexed_files"] != len(candidates):
                raise SystemExit("candidate set size drift")
            rankings = {
                "are_primer": [hint["path"] for hint in are["primer_hints"]],
                "are_tail_query": [hint["path"] for hint in are["tail_hints"]],
                "local_bm25": proto["baseline_ranked_files"][:8],
                "local_trace_aware": proto["trace_aware_ranked_files"][:8],
            }
            for paths in rankings.values():
                if len(paths) > 8 or len(paths) != len(set(paths)) or not set(paths).issubset(candidates):
                    raise SystemExit("invalid hint paths")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(candidates):
                raise SystemExit("native gold outside corpus")
            scored.append({"id": row["id"], "gold_file_count": len(gold),
                           "metrics": {name: metrics(paths, gold) for name, paths in rankings.items()}})
    if len(scored) != 56 or id_digest({row["id"] for row in scored}) != DEV_ID_SET_SHA256:
        raise SystemExit("development gold denominator drift")

    aggregate = {}
    for strategy in ("are_primer", "are_tail_query", "local_bm25", "local_trace_aware"):
        aggregate[strategy] = {metric: statistics.mean(row["metrics"][strategy][metric] for row in scored)
                               for metric in ("mrr_at_8", "recall_at_8", "hit_at_8")}
    comparisons = {}
    for left, right in (("are_primer", "are_tail_query"), ("are_tail_query", "local_trace_aware"),
                        ("local_bm25", "local_trace_aware")):
        differences = [row["metrics"][right]["mrr_at_8"] - row["metrics"][left]["mrr_at_8"]
                       for row in scored]
        comparisons[f"{right}_minus_{left}"] = {
            "mrr_at_8_mean_delta": statistics.mean(differences),
            "improved": sum(value > 0 for value in differences),
            "regressed": sum(value < 0 for value in differences),
            "tied": sum(value == 0 for value in differences),
        }
    report = {
        "schema": "are.arb-trace2code-gin-are-hint-audit-r1/v1",
        "posture": "exposed development simulation; not official ARB, pinned-Git ARE, or full ARE episode",
        "comparability_limit": "ARE queries use 1024-byte head/tail windows; local BM25 and trace-aware use full failure plus command",
        "archive_sha256": ARCHIVE_SHA256, "are_hints_sha256": ARE_HINTS_SHA256,
        "prototype_sha256": PROTOTYPE_SHA256, "development_cases": len(scored),
        "gold_file_entries": sum(row["gold_file_count"] for row in scored),
        "heldout_gold_inspected": False, "aggregates": aggregate, "comparisons": comparisons,
        "per_case_numeric_only": sorted(scored, key=lambda row: row["id"]),
    }
    output.mkdir(parents=True, exist_ok=False)
    path = output / "EVALUATOR-AUDIT.json"
    path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
