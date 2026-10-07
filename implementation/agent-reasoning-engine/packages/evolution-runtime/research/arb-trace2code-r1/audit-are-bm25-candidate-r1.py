#!/usr/bin/env python3
"""Evaluator-only development audit of ARE-compatible BM25/trace-text hints."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
BASE_HINTS_SHA256 = "62272a5ca0cf2a3f4e7fc80c18c03b07725c882b93684ae64a5f6039bc51c92d"
CANDIDATE_SHA256 = "b2dbdbfc3145d0d313aa9aa3bf70162e97467f7f6bf51bd286bb0a82968335b7"
DEV_ID_SET_SHA256 = "603170065f9e8bc4d6334d16e073ac528bb29d5b61d0b02809208315c774e641"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def metrics(ranking: list[str], gold: set[str]) -> dict[str, float]:
    first = min(ranking.index(path) + 1 for path in gold if path in ranking)
    return {"mrr": 1 / first, "mrr_at_8": 1 / first if first <= 8 else 0.0,
            "hit_at_8": float(first <= 8),
            "recall_at_8": len(gold.intersection(ranking[:8])) / len(gold),
            "recall_at_20": len(gold.intersection(ranking[:20])) / len(gold)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--baseline-hints", type=pathlib.Path, required=True)
    parser.add_argument("--candidate", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, base_path, candidate_path = (path.resolve(strict=True) for path in
                                          (args.archive, args.baseline_hints, args.candidate))
    output = args.output.absolute()
    if output.exists() or (sha256_file(archive), sha256_file(base_path), sha256_file(candidate_path)) != (
            ARCHIVE_SHA256, BASE_HINTS_SHA256, CANDIDATE_SHA256):
        raise SystemExit("output exists or input hash mismatch")
    base_rows = [json.loads(line) for line in base_path.read_text().splitlines()]
    candidate_rows = [json.loads(line) for line in candidate_path.read_text().splitlines()]
    base = {row["id"]: row for row in base_rows}
    candidate = {row["id"]: row for row in candidate_rows}
    ids = set(base)
    if (len(base_rows), len(candidate_rows), len(base), len(candidate)) != (56, 56, 56, 56) or \
            ids != set(candidate) or hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest() != DEV_ID_SET_SHA256:
        raise SystemExit("development denominator or identity drift")
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("benchmark samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] != "gin-gonic/gin":
                continue  # Never inspect other-repository labels.
            a, c = base.get(row["id"]), candidate.get(row["id"])
            if a is None or c is None or a["base_commit"] != row["base_commit"] or c["base_commit"] != row["base_commit"]:
                raise SystemExit("development sample identity drift")
            rankings = {"are_line_tail": [hint["path"] for hint in a["tail_hints"]],
                        "candidate_bm25": c["bm25_ranked_files"],
                        "candidate_trace_text": c["trace_text_ranked_files"]}
            complete = set(rankings["candidate_bm25"])
            if len(complete) != c["candidate_count"] or len(rankings["candidate_trace_text"]) != len(complete) or \
                    set(rankings["candidate_trace_text"]) != complete or \
                    a["indexed_files"] != len(complete):
                raise SystemExit("candidate set drift")
            for name, hints in (("candidate_bm25", c["bm25_hints"]),
                                ("candidate_trace_text", c["trace_text_hints"])):
                if [hint["path"] for hint in hints] != rankings[name][:8]:
                    raise SystemExit("hint/ranking mismatch")
            if len(rankings["are_line_tail"]) != len(set(rankings["are_line_tail"])) or \
                    not set(rankings["are_line_tail"]).issubset(complete):
                raise SystemExit("base hints outside candidate corpus")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(complete):
                raise SystemExit("gold outside source corpus")
            case = {"id": row["id"], "gold_file_count": len(gold), "metrics": {}}
            for name, ranking in rankings.items():
                if name == "are_line_tail":
                    # The existing tool produces only eight hints, not a full ranking.
                    first = min((ranking.index(path) + 1 for path in gold if path in ranking), default=None)
                    case["metrics"][name] = {"mrr_at_8": 1 / first if first else 0.0,
                                              "hit_at_8": float(first is not None),
                                              "recall_at_8": len(gold.intersection(ranking)) / len(gold)}
                else:
                    case["metrics"][name] = metrics(ranking, gold)
            scored.append(case)
    if len(scored) != 56 or {row["id"] for row in scored} != ids:
        raise SystemExit("scored denominator drift")
    aggregates = {}
    for name in ("are_line_tail", "candidate_bm25", "candidate_trace_text"):
        keys = scored[0]["metrics"][name]
        aggregates[name] = {key: statistics.mean(row["metrics"][name][key] for row in scored) for key in keys}
    comparisons = {}
    for left, right in (("are_line_tail", "candidate_bm25"),
                        ("candidate_bm25", "candidate_trace_text")):
        diffs = [row["metrics"][right]["mrr_at_8"] - row["metrics"][left]["mrr_at_8"]
                 for row in scored]
        comparisons[f"{right}_minus_{left}"] = {"mean_mrr_at_8_delta": statistics.mean(diffs),
                                                "improved": sum(x > 0 for x in diffs),
                                                "regressed": sum(x < 0 for x in diffs),
                                                "tied": sum(x == 0 for x in diffs)}
    report = {"schema": "are.arb-trace2code-gin-bm25-candidate-audit-r1/v1",
              "posture": "exposed development on ARB source projections; not full ARE or official ARB evaluation",
              "archive_sha256": ARCHIVE_SHA256, "baseline_hints_sha256": BASE_HINTS_SHA256,
              "candidate_sha256": CANDIDATE_SHA256, "development_cases": 56,
              "gold_file_entries": sum(row["gold_file_count"] for row in scored),
              "heldout_gold_inspected": False, "aggregates": aggregates, "comparisons": comparisons,
              "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    output.mkdir(parents=True, exist_ok=False)
    (output / "EVALUATOR-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
