#!/usr/bin/env python3
"""Freeze a source-only, cross-repository BugsInPy trace cohort."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib


INPUT_SHA256 = "5cf0241fa5d50118007f55e937ef0e74c7e7ea427c807f6819266378e7256523"
SEED = b"are-g01-bugsinpy-trace-exact-commit-r1\0"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def rank(value: str) -> str:
    return digest(SEED + value.encode())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("refusing existing output")
    raw = args.source.read_bytes()
    if digest(raw) != INPUT_SHA256:
        raise SystemExit("source-only census digest drift")
    rows = [json.loads(line) for line in raw.splitlines()]
    if len(rows) != 312:
        raise SystemExit("eligible count drift")
    by_repo: dict[str, list[dict]] = collections.defaultdict(list)
    for row in rows:
        if len(row["buggy_commit_id"]) != 40 or row["buggy_status"] != "fail":
            raise SystemExit("invalid source admission")
        by_repo[row["repo"]].append(row)
    repos = sorted((repo for repo, entries in by_repo.items() if len(entries) >= 2), key=rank)[:12]
    if len(repos) != 12:
        raise SystemExit("insufficient repository diversity")
    selected = []
    for repo in repos:
        seen_commits = set()
        for row in sorted(by_repo[repo], key=lambda item: rank(repo + "/" + item["bugid"])):
            if row["buggy_commit_id"] in seen_commits:
                continue
            selected.append(row)
            seen_commits.add(row["buggy_commit_id"])
            if len(seen_commits) == 2:
                break
        if len(seen_commits) != 2:
            raise SystemExit("insufficient distinct commits")
    freeze = {
        "schema": "are.g01-bugsinpy-exact-cohort-freeze-r1/v1",
        "status": "source-only-frozen-before-snapshot-acquisition-or-gold",
        "selection_seed_sha256": digest(SEED),
        "input_metadata_sha256": INPUT_SHA256,
        "population_exact_commit": len(rows),
        "repository_count": len(repos),
        "case_count": len(selected),
        "selection_rule": "SHA256(seed+repo) first 12 repositories with >=2 eligible cases; SHA256(seed+repo/bugid) first 2 distinct commits each",
        "selected": selected,
        "gold_patch_opened": False,
        "fixed_output_opened": False,
        "claim_ceiling": "Fresh source-only selection; no source snapshots, predictions, scores, or superiority inference yet.",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(freeze, sort_keys=True, indent=2) + "\n")
    print(json.dumps({"freeze_sha256": digest(args.output.read_bytes()),
                      "repos": repos, "cases": [(row["repo"], row["bugid"])
                                              for row in selected]}, sort_keys=True))


if __name__ == "__main__":
    main()
