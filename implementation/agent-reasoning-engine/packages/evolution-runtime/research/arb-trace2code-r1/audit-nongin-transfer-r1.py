#!/usr/bin/env python3
"""Evaluator-only paired non-Gin transfer audit after both rankings are sealed."""

from __future__ import annotations

import argparse
import collections
import hashlib
import itertools
import json
import pathlib
import random
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
SPLIT_SHA256 = "dc562df2664fcab9bca079ab502d4402aefec1f1eba48f366ad093bd9c783107"
BOOTSTRAPS = 20000
SEED = 20261004


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def score(ranking: list[str] | None, gold: set[str]) -> dict[str, float]:
    if ranking is None:
        return {"mrr_at_8": 0.0, "mrr": 0.0, "hit_at_3": 0.0, "hit_at_8": 0.0,
                "recall_at_20": 0.0}
    first = min(ranking.index(path) + 1 for path in gold)
    return {"mrr_at_8": 1 / first if first <= 8 else 0.0, "mrr": 1 / first,
            "hit_at_3": float(first <= 3), "hit_at_8": float(first <= 8),
            "recall_at_20": len(gold.intersection(ranking[:20])) / len(gold)}


def load_sealed(path: pathlib.Path, seal_name: str, prediction_key: str) -> tuple[dict, dict]:
    seal = json.loads((path.parent / seal_name).read_text())
    if seal.get(prediction_key) != sha256_file(path) or seal.get("cases") != 45:
        raise SystemExit("ranking seal drift")
    rows = [json.loads(line) for line in path.read_text().splitlines()]
    by_id = {row["id"]: row for row in rows}
    if len(rows) != 45 or len(by_id) != 45:
        raise SystemExit("ranking denominator drift")
    return by_id, seal


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--split", type=pathlib.Path, required=True)
    parser.add_argument("--arb", type=pathlib.Path, required=True)
    parser.add_argument("--are", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, split, arb_path, are_path = (path.resolve(strict=True) for path in
                                          (args.archive, args.split, args.arb, args.are))
    if args.output.exists() or sha256_file(archive) != ARCHIVE_SHA256 or sha256_file(split) != SPLIT_SHA256:
        raise SystemExit("output exists or input pin drift")
    split_receipt = json.loads(split.read_text())
    arb, arb_seal = load_sealed(arb_path, "SOURCE-SEAL.json", "prediction_sha256")
    are, are_seal = load_sealed(are_path, "SOURCE-SEAL.json", "prediction_sha256")
    if set(arb) != set(are) or hashlib.sha256(("\n".join(sorted(arb)) + "\n").encode()).hexdigest() != \
            split_receipt["heldout_id_set_sha256"]:
        raise SystemExit("confirmation case-set drift")
    scored = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("sample member missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] == "gin-gonic/gin":
                continue  # Never inspect development gold in this evaluator.
            item_id = row["id"]
            a, r = arb.get(item_id), are.get(item_id)
            if a is None or r is None or any(item["base_commit"] != row["base_commit"] or
                                               item["repo"] != row["repo"] for item in (a, r)):
                raise SystemExit("case identity drift")
            baseline = a["rankings"]["edge_failure"]
            full_json = a["rankings"]["full_json"]
            candidate = r["trace_text_ranked_files"]
            if a["candidate_count"] != r["candidate_count"] or \
                    a["query_sha256"]["edge_failure"] != r["query_sha256"] or \
                    len(baseline) != a["candidate_count"] or set(baseline) != set(full_json):
                raise SystemExit("input or candidate-set drift")
            if r["status"] == "ranked_all_files":
                if candidate is None or len(candidate) != len(baseline) or set(candidate) != set(baseline):
                    raise SystemExit("candidate all-files drift")
            elif r["status"] == "coverage_failed":
                if candidate is not None:
                    raise SystemExit("failed candidate supplied ranking")
            else:
                raise SystemExit("unexpected candidate status")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(set(baseline)):
                raise SystemExit("gold outside all-files candidates")
            metrics = {"arb_edge_bm25": score(baseline, gold),
                       "arb_full_json_bm25": score(full_json, gold),
                       "are_edge_trace_text": score(candidate, gold)}
            scored.append({"id": item_id, "repo": row["repo"], "gold_count": len(gold),
                           "candidate_status": r["status"], "metrics": metrics})
    if len(scored) != 45 or {row["id"] for row in scored} != set(arb):
        raise SystemExit("scored denominator drift")
    repos = sorted({row["repo"] for row in scored})
    if len(repos) != 6:
        raise SystemExit("repository denominator drift")
    aggregates = {name: {metric: statistics.mean(row["metrics"][name][metric] for row in scored)
                         for metric in scored[0]["metrics"][name]}
                  for name in scored[0]["metrics"]}
    by_repo = {repo: [row for row in scored if row["repo"] == repo] for repo in repos}
    per_repo = {repo: {"cases": len(rows),
                       "coverage_failed": sum(row["candidate_status"] == "coverage_failed" for row in rows),
                       "mean_mrr_at_8_delta": statistics.mean(
                           row["metrics"]["are_edge_trace_text"]["mrr_at_8"] -
                           row["metrics"]["arb_edge_bm25"]["mrr_at_8"] for row in rows)}
                for repo, rows in by_repo.items()}
    differences = [row["metrics"]["are_edge_trace_text"]["mrr_at_8"] -
                   row["metrics"]["arb_edge_bm25"]["mrr_at_8"] for row in scored]
    observed = statistics.mean(differences)
    cluster_sums = [sum(row["metrics"]["are_edge_trace_text"]["mrr_at_8"] -
                        row["metrics"]["arb_edge_bm25"]["mrr_at_8"] for row in by_repo[repo])
                    for repo in repos]
    randomization = [sum(sign * total for sign, total in zip(signs, cluster_sums)) / len(scored)
                     for signs in itertools.product((-1, 1), repeat=len(repos))]
    exact_two_sided_p = sum(abs(value) >= abs(observed) - 1e-12 for value in randomization) / len(randomization)
    rng = random.Random(SEED)
    bootstrap = []
    for _ in range(BOOTSTRAPS):
        sampled = [row for repo in (rng.choice(repos) for _ in repos) for row in by_repo[repo]]
        bootstrap.append(statistics.mean(row["metrics"]["are_edge_trace_text"]["mrr_at_8"] -
                                         row["metrics"]["arb_edge_bm25"]["mrr_at_8"] for row in sampled))
    bootstrap.sort()
    report = {"schema": "are.arb-trace2code-nongin-transfer-audit-r1/v1",
              "posture": "repository-separated source-only confirmation; not live ARE, exact Git, or official package evaluator",
              "archive_sha256": ARCHIVE_SHA256, "split_sha256": SPLIT_SHA256,
              "arb_rankings_sha256": arb_seal["prediction_sha256"],
              "are_rankings_sha256": are_seal["prediction_sha256"],
              "cases": len(scored), "repositories": len(repos),
              "gold_file_entries": sum(row["gold_count"] for row in scored),
              "coverage_failed_cases": sum(row["candidate_status"] == "coverage_failed" for row in scored),
              "primary": "paired ARE edge trace-text minus ARB edge BM25 MRR@8 over all 45 cases",
              "primary_mean_delta": observed, "repo_cluster_exact_sign_flip_two_sided_p": exact_two_sided_p,
              "repo_cluster_bootstrap_95_percentile_interval": [bootstrap[499], bootstrap[19499]],
              "bootstrap_seed": SEED, "bootstrap_draws": BOOTSTRAPS,
              "aggregates": aggregates, "per_repo": per_repo,
              "per_case_numeric_only": sorted(scored, key=lambda row: row["id"])}
    args.output.mkdir(parents=True, exist_ok=False)
    (args.output / "EVALUATOR-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
