#!/usr/bin/env python3
"""Evaluator-only paired BugsInPy r2b patch-file scoring after prediction seal."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import random
import re
import statistics
import tarfile


ARCHIVE_SHA256 = "8b242a0a62b91002fedaff64e112ba8b761d15e805d4635098f51b173fff5548"
FREEZE_SHA256 = "77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c"
PREDICTION_SHA256 = "45b0abd6cfa39d14299c3cd2e069458c82d84573b1406b8b9d9066f8f89a1130"
PREFIX = "BugsInPy-316b95e2353ecda832bad9b42f86fa7c2fcec8ac/"
DIFF = re.compile(r"^diff --git a/(.+) b/(.+)$")
ARMS = ("hinted", "unhinted", "are", "chunk")
METRICS = ("mrr_at_8", "hit_at_3", "recall_at_20")


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def changed_paths(patch: bytes) -> set[str]:
    paths = set()
    for line in patch.decode("utf-8", errors="replace").splitlines():
        match = DIFF.fullmatch(line)
        if match is None:
            continue
        for value in match.groups():
            rel = pathlib.PurePosixPath(value)
            if rel.is_absolute() or ".." in rel.parts or not value or "\\" in value:
                raise ValueError("unsafe patch path")
            paths.add(value)
    return paths


def score(ranking: list[str], gold: set[str]) -> dict:
    if not gold:
        return {metric: 0.0 for metric in METRICS}
    positions = {path: index + 1 for index, path in enumerate(ranking)}
    first = min((positions[path] for path in gold if path in positions), default=None)
    return {"mrr_at_8": 1.0 / first if first is not None and first <= 8 else 0.0,
            "hit_at_3": float(first is not None and first <= 3),
            "recall_at_20": sum(positions.get(path, 10**9) <= 20 for path in gold) / len(gold)}


def percentile(values: list[float], fraction: float) -> float:
    ordered = sorted(values)
    place = (len(ordered) - 1) * fraction
    lower = int(place)
    upper = min(lower + 1, len(ordered) - 1)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (place - lower)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("archive", "freeze", "predictions", "ranking-seal", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.archive) != ARCHIVE_SHA256 or \
            digest(args.freeze) != FREEZE_SHA256 or digest(args.predictions) != PREDICTION_SHA256:
        raise SystemExit("output exists or input drift")
    seal = json.loads(args.ranking_seal.read_text())
    if seal["prediction_sha256"] != PREDICTION_SHA256 or \
            seal["valid_responses"] != 48 or seal["gold_opened"]:
        raise SystemExit("prediction seal invalid")
    cohort = json.loads(args.freeze.read_text())["selected"]
    rows = [json.loads(line) for line in args.predictions.read_text().splitlines()]
    by_case = collections.defaultdict(dict)
    for row in rows:
        if row["arm"] in by_case[row["case_id"]]:
            raise SystemExit("duplicate paired arm")
        by_case[row["case_id"]][row["arm"]] = row
    if len(cohort) != 24 or len(rows) != 48 or len(by_case) != 24 or \
            any(set(pair) != {"hinted", "unhinted"} for pair in by_case.values()) or \
            {f"{row['repo']}/{row['bugid']}" for row in cohort} != set(by_case):
        raise SystemExit("cohort denominator drift")
    records = []
    with tarfile.open(args.archive, "r:gz") as archive:
        for item in cohort:
            case = f"{item['repo']}/{item['bugid']}"
            pair = by_case[case]
            h, u = pair["hinted"], pair["unhinted"]
            if h["repo"] != item["repo"] or u["repo"] != item["repo"] or \
                    h["base_commit"] != item["buggy_commit_id"] or \
                    u["base_commit"] != item["buggy_commit_id"] or \
                    h["query_sha256"] != u["query_sha256"] or \
                    h["are_ranked_files"] != u["are_ranked_files"] or \
                    h["chunk_ranked_files"] != u["chunk_ranked_files"]:
                raise SystemExit(f"paired identity drift: {case}")
            universe = set(h["are_ranked_files"])
            if any(set(ranking) != universe or len(ranking) != len(universe) for ranking in
                   (h["proposal_ranked_files"], u["proposal_ranked_files"],
                    h["chunk_ranked_files"])):
                raise SystemExit(f"ranking universe drift: {case}")
            member = archive.getmember(PREFIX +
                f"projects/{item['repo']}/bugs/{item['bugid']}/bug_patch.txt")
            if not member.isfile() or member.size > 2_000_000:
                raise SystemExit(f"patch member invalid: {case}")
            stream = archive.extractfile(member)
            if stream is None:
                raise SystemExit(f"patch member missing: {case}")
            raw = stream.read()
            changed = changed_paths(raw)
            gold = changed & universe
            rankings = {"hinted": h["proposal_ranked_files"],
                        "unhinted": u["proposal_ranked_files"],
                        "are": h["are_ranked_files"], "chunk": h["chunk_ranked_files"]}
            records.append({"id": case, "repo": item["repo"],
                            "patch_sha256": hashlib.sha256(raw).hexdigest(),
                            "changed_paths": sorted(changed), "admitted_paths": sorted(gold),
                            "outside_universe_paths": sorted(changed - universe),
                            "label_valid": bool(changed and gold),
                            "union_hit": {arm: bool(gold.intersection(pair[arm]["candidate_paths"]))
                                          for arm in ("hinted", "unhinted")},
                            "metrics": {arm: score(ranking, gold) for arm, ranking in rankings.items()}})
    aggregate = {arm: {metric: statistics.mean(row["metrics"][arm][metric] for row in records)
                       for metric in METRICS} for arm in ARMS}
    grouped = collections.defaultdict(list)
    for row in records:
        grouped[row["repo"]].append(row)
    if len(grouped) != 12 or any(len(items) != 2 for items in grouped.values()):
        raise SystemExit("repository cluster drift")
    by_repo = {repo: {arm: statistics.mean(row["metrics"][arm]["mrr_at_8"] for row in items)
                      for arm in ARMS} for repo, items in sorted(grouped.items())}
    union = {arm: sum(row["union_hit"][arm] for row in records) for arm in ("hinted", "unhinted")}
    seed = int(FREEZE_SHA256[:8], 16)
    rng = random.Random(seed)
    repos = sorted(grouped)
    differences = []
    for _ in range(20_000):
        picked = [repos[rng.randrange(len(repos))] for _ in repos]
        differences.append(statistics.mean(
            row["metrics"]["hinted"]["mrr_at_8"] - row["metrics"]["unhinted"]["mrr_at_8"]
            for repo in picked for row in grouped[repo]))
    interval = [percentile(differences, 0.025), percentile(differences, 0.975)]
    effect = aggregate["hinted"]["mrr_at_8"] - aggregate["unhinted"]["mrr_at_8"]
    gates = {"valid_model_attempts_48": seal["valid_responses"] == 48,
             "valid_labels_24": sum(row["label_valid"] for row in records) == 24,
             "union_gain_at_least_2_cases": union["hinted"] - union["unhinted"] >= 2,
             "mrr_gain_at_least_point_05": effect >= 0.05,
             "repo_bootstrap_lower_above_zero": interval[0] > 0}
    report = {"schema": "are.g01-bugsinpy-hints-r2b-evaluator-audit/v1",
              "posture": "task/commit-disjoint paired source-projected retrieval; not fully repository-disjoint or live ARE",
              "archive_sha256": ARCHIVE_SHA256, "freeze_sha256": FREEZE_SHA256,
              "ranking_seal_sha256": digest(args.ranking_seal),
              "prediction_sha256": PREDICTION_SHA256,
              "cases": 24, "valid_labels": sum(row["label_valid"] for row in records),
              "aggregate": aggregate, "per_repo": by_repo,
              "candidate_union_gold_cases": union,
              "paired_mrr_difference": effect,
              "repository_bootstrap_seed": seed, "repository_bootstrap_draws": 20_000,
              "paired_mrr_95pct_interval": interval,
              "gates": gates, "advancement_passed": all(gates.values()),
              "per_case_private": records}
    args.output.mkdir(parents=True)
    path = args.output / "EVALUATOR-AUDIT.json"
    path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_private"}, sort_keys=True))


if __name__ == "__main__":
    main()
