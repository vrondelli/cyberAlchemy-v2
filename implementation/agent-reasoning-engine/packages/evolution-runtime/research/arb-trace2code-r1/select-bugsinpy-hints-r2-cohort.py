#!/usr/bin/env python3
"""Freeze fresh BugsInPy cases excluding every r1 bug and commit."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib


SOURCE_SHA256 = "5cf0241fa5d50118007f55e937ef0e74c7e7ea427c807f6819266378e7256523"
R1_FREEZE_SHA256 = "888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33"
SEED = b"are-g01-bugsinpy-trace-hints-r2\0"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def order(value: str) -> str:
    return digest(SEED + value.encode())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--r1-freeze", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.source.read_bytes()) != SOURCE_SHA256 or \
            digest(args.r1_freeze.read_bytes()) != R1_FREEZE_SHA256:
        raise SystemExit("output exists or input drift")
    source = [json.loads(line) for line in args.source.read_text().splitlines()]
    r1 = json.loads(args.r1_freeze.read_text())["selected"]
    if len(source) != 312 or len(r1) != 24:
        raise SystemExit("population denominator drift")
    old_cases = {(row["repo"], row["bugid"]) for row in r1}
    old_commits = {(row["repo"], row["buggy_commit_id"]) for row in r1}
    old_repos = {row["repo"] for row in r1}
    by_repo: dict[str, list[dict]] = collections.defaultdict(list)
    for row in source:
        if (row["repo"], row["bugid"]) not in old_cases and \
                (row["repo"], row["buggy_commit_id"]) not in old_commits:
            by_repo[row["repo"]].append(row)
    eligible_repos = [repo for repo, entries in by_repo.items()
                      if len({row["buggy_commit_id"] for row in entries}) >= 2]
    repos = sorted(eligible_repos, key=lambda repo: (repo in old_repos, order(repo)))[:12]
    if len(repos) != 12:
        raise SystemExit("insufficient repository diversity")
    selected = []
    for repo in repos:
        commits = set()
        for row in sorted(by_repo[repo], key=lambda item: order(repo + "/" + item["bugid"])):
            if row["buggy_commit_id"] in commits:
                continue
            selected.append(row)
            commits.add(row["buggy_commit_id"])
            if len(commits) == 2:
                break
        if len(commits) != 2:
            raise SystemExit("insufficient distinct commits")
    if len(selected) != 24 or any((row["repo"], row["bugid"]) in old_cases or
                                  (row["repo"], row["buggy_commit_id"]) in old_commits
                                  for row in selected):
        raise SystemExit("r1 overlap")
    freeze = {"schema": "are.g01-bugsinpy-hints-r2-cohort-freeze/v1",
              "status": "source-only-frozen-before-r2-source-or-gold",
              "population_source_sha256": SOURCE_SHA256,
              "r1_freeze_sha256": R1_FREEZE_SHA256,
              "selection_seed_sha256": digest(SEED),
              "selection_rule": "Exclude every r1 bug and repo-commit; prefer new repositories, then SHA256(seed+repo); choose two distinct commits per repository by SHA256(seed+repo/bugid)",
              "cases": 24, "repositories": 12,
              "new_repositories_vs_r1": sorted(set(repos) - old_repos),
              "selected": selected, "gold_opened": False,
              "claim_ceiling": "Task- and commit-disjoint from r1, only partially repository-disjoint; not guaranteed model-training unseen."}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(freeze, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"freeze_sha256": digest(args.output.read_bytes()),
                      "repositories": repos,
                      "new_repositories": freeze["new_repositories_vs_r1"],
                      "cases": [f"{row['repo']}/{row['bugid']}" for row in selected]}, sort_keys=True))


if __name__ == "__main__":
    main()
