#!/usr/bin/env python3
"""Evaluator-only BugsInPy patch-file scoring after sealed predictions."""

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
FREEZE_SHA256 = "888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33"
PREDICTION_SHA256 = "f72dc04c2d4305c6a2544dcbfe1fe0c4af362833f3349417c5959344100f27e9"
PREFIX = "BugsInPy-316b95e2353ecda832bad9b42f86fa7c2fcec8ac/"
DIFF = re.compile(r"^diff --git a/(.+) b/(.+)$")
ARMS = ("proposal", "are", "chunk")
METRICS = ("mrr_at_8", "hit_at_3", "recall_at_20")


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def parse_changed_paths(patch: bytes) -> set[str]:
    changed = set()
    for line in patch.decode("utf-8", errors="replace").splitlines():
        match = DIFF.fullmatch(line)
        if match is None:
            continue
        for path in match.groups():
            rel = pathlib.PurePosixPath(path)
            if rel.is_absolute() or ".." in rel.parts or not path or "\\" in path:
                raise ValueError("unsafe patch path")
            changed.add(path)
    return changed


def score(ranking: list[str], gold: set[str]) -> dict:
    if not gold:
        return {name: 0.0 for name in METRICS}
    first = min((ranking.index(path) + 1 for path in gold if path in ranking), default=None)
    return {"mrr_at_8": 1.0 / first if first is not None and first <= 8 else 0.0,
            "hit_at_3": float(first is not None and first <= 3),
            "recall_at_20": len(gold.intersection(ranking[:20])) / len(gold)}


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
    ranking_seal = json.loads(args.ranking_seal.read_text())
    if ranking_seal["prediction_sha256"] != PREDICTION_SHA256 or \
            ranking_seal["valid_responses"] != 24 or ranking_seal["gold_opened"]:
        raise SystemExit("prediction seal invalid")
    cohort = json.loads(args.freeze.read_text())["selected"]
    predictions = {row["id"]: row for row in
                   (json.loads(line) for line in args.predictions.read_text().splitlines())}
    if len(cohort) != 24 or len(predictions) != 24 or \
            {f"{row['repo']}/{row['bugid']}" for row in cohort} != set(predictions):
        raise SystemExit("cohort denominator drift")
    records = []
    with tarfile.open(args.archive, "r:gz") as archive:
        for item in cohort:
            case = f"{item['repo']}/{item['bugid']}"
            prediction = predictions[case]
            if prediction["repo"] != item["repo"] or \
                    prediction["base_commit"] != item["buggy_commit_id"]:
                raise SystemExit(f"identity drift: {case}")
            universe = set(prediction["are_ranked_files"])
            if any(set(prediction[f"{arm}_ranked_files"]) != universe or
                   len(prediction[f"{arm}_ranked_files"]) != len(universe) for arm in ARMS):
                raise SystemExit(f"ranking universe drift: {case}")
            member = archive.getmember(PREFIX +
                f"projects/{item['repo']}/bugs/{item['bugid']}/bug_patch.txt")
            if not member.isfile() or member.size > 2_000_000:
                raise SystemExit(f"patch member invalid: {case}")
            stream = archive.extractfile(member)
            if stream is None:
                raise SystemExit(f"patch member missing: {case}")
            raw = stream.read()
            changed = parse_changed_paths(raw)
            admitted = changed & universe
            invalid = not changed or not admitted
            records.append({"id": case, "repo": item["repo"],
                            "patch_sha256": hashlib.sha256(raw).hexdigest(),
                            "changed_paths": sorted(changed),
                            "admitted_paths": sorted(admitted),
                            "outside_universe_paths": sorted(changed - universe),
                            "label_valid": not invalid,
                            "metrics": {arm: score(prediction[f"{arm}_ranked_files"], admitted)
                                        for arm in ARMS}})
    aggregate = {arm: {name: statistics.mean(row["metrics"][arm][name] for row in records)
                       for name in METRICS} for arm in ARMS}
    grouped = collections.defaultdict(list)
    for row in records:
        grouped[row["repo"]].append(row)
    if len(grouped) != 12 or any(len(items) != 2 for items in grouped.values()):
        raise SystemExit("repository cluster drift")
    by_repo = {repo: {arm: statistics.mean(row["metrics"][arm]["mrr_at_8"] for row in items)
                      for arm in ARMS} for repo, items in sorted(grouped.items())}
    stronger = max(("are", "chunk"), key=lambda arm: aggregate[arm]["mrr_at_8"])
    seed = int(FREEZE_SHA256[:8], 16)
    rng = random.Random(seed)
    repos = sorted(grouped)
    draws = [[repos[rng.randrange(len(repos))] for _ in repos] for _ in range(20_000)]
    interval = {}
    for baseline in ("are", "chunk"):
        values = []
        for picked in draws:
            values.append(statistics.mean(
                row["metrics"]["proposal"]["mrr_at_8"] - row["metrics"][baseline]["mrr_at_8"]
                for repo in picked for row in grouped[repo]))
        interval[baseline] = [percentile(values, 0.025), percentile(values, 0.975)]
    wins = sum(by_repo[repo]["proposal"] > by_repo[repo][stronger] for repo in repos)
    ties = sum(by_repo[repo]["proposal"] == by_repo[repo][stronger] for repo in repos)
    gates = {"valid_model_attempts_24": ranking_seal["valid_responses"] == 24,
             "valid_labels_24": sum(row["label_valid"] for row in records) == 24,
             "mrr_gain_at_least_point_10": aggregate["proposal"]["mrr_at_8"] -
                 aggregate[stronger]["mrr_at_8"] >= 0.10,
             "repo_bootstrap_lower_above_zero_both": all(interval[arm][0] > 0 for arm in ("are", "chunk")),
             "repo_wins_at_least_8": wins >= 8}
    report = {"schema": "are.g01-bugsinpy-fresh-r1-evaluator-audit/v1",
              "posture": "fresh source-projected BugsInPy trace retrieval; no live ARE, ContextBench or product superiority",
              "archive_sha256": ARCHIVE_SHA256, "freeze_sha256": FREEZE_SHA256,
              "ranking_seal_sha256": digest(args.ranking_seal),
              "prediction_sha256": PREDICTION_SHA256,
              "cases": len(records), "valid_labels": sum(row["label_valid"] for row in records),
              "aggregate": aggregate, "per_repo": by_repo,
              "stronger_standalone": stronger,
              "paired_mrr_difference": {arm: aggregate["proposal"]["mrr_at_8"] -
                                        aggregate[arm]["mrr_at_8"] for arm in ("are", "chunk")},
              "repository_bootstrap_seed": seed, "repository_bootstrap_draws": 20_000,
              "paired_mrr_95pct_intervals": interval,
              "repo_win_tie_loss_vs_stronger": [wins, ties, len(repos) - wins - ties],
              "gates": gates, "advancement_passed": all(gates.values()),
              "per_case_private": records}
    args.output.mkdir(parents=True)
    path = args.output / "EVALUATOR-AUDIT.json"
    path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_case_private"}, sort_keys=True))


if __name__ == "__main__":
    main()
