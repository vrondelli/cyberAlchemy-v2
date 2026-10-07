#!/usr/bin/env python3
"""Select disjoint BugSwarm development and reserved cohorts before graph tests."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re


RAW_SHA = "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d"
ORDER_SHA = "63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c"
PRIOR_SHA = "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"
SEED = b"are-g01-bugswarm-graph-dev-partition-r1\0"
COMMIT = re.compile(r"[0-9a-f]{40}\Z")


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def eligible(row: dict) -> bool:
    failed, passed = row["failed_job"], row["passed_job"]
    changed = row.get("metrics", {}).get("num_of_changed_files")
    failures = failed.get("num_tests_failed")
    return (row.get("status") == "active"
            and row.get("reproducibility_status", {}).get("status") == "Reproducible"
            and row.get("is_error_pass") is False
            and row.get("classification", {}).get("code") == "Yes"
            and type(changed) is int and 1 <= changed <= 3
            and type(failures) is int and failures > 0
            and type(failed.get("job_id")) is int
            and isinstance(failed.get("trigger_sha"), str)
            and COMMIT.fullmatch(failed["trigger_sha"]) is not None
            and isinstance(passed.get("trigger_sha"), str)
            and COMMIT.fullmatch(passed["trigger_sha"]) is not None)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("raw", "order", "prior", "output"):
        parser.add_argument(f"--{name}", required=True, type=Path)
    args = parser.parse_args()
    inputs = {name: getattr(args, name).read_bytes() for name in ("raw", "order", "prior")}
    if (args.output.exists() or sha(inputs["raw"]) != RAW_SHA
            or sha(inputs["order"]) != ORDER_SHA or sha(inputs["prior"]) != PRIOR_SHA):
        raise SystemExit("output-exists-or-input-pin-drift")
    raw = json.loads(inputs["raw"])
    order = json.loads(inputs["order"])
    prior = json.loads(inputs["prior"])
    by_tag = {row["image_tag"]: row for row in raw}
    if len(raw) != 4388 or len(by_tag) != len(raw) or len(prior["selected"]) != 24:
        raise SystemExit("population-shape-drift")
    excluded_repos = {row["repo"].lower() for row in prior["selected"]}
    selected = {cohort: {lang: [] for lang in ("Python", "Java")}
                for cohort in ("development", "reserved_confirmation")}
    selected_repos: set[str] = set()
    screened = {lang: 0 for lang in ("Python", "Java")}
    for lang in ("Python", "Java"):
        for position, candidate in enumerate(order["ordered"][lang], 1):
            row = by_tag.get(candidate["image_tag"])
            if (row is None or row["repo"] != candidate["repo"]
                    or row["lang"] != lang
                    or row["failed_job"]["job_id"] != candidate["failure_job_id"]
                    or row["failed_job"]["trigger_sha"] != candidate["failure_commit"]):
                raise SystemExit("source-order-identity-drift")
            screened[lang] += 1
            repo = candidate["repo"].lower()
            if repo in excluded_repos or repo in selected_repos or not eligible(row):
                continue
            partition = int(sha(SEED + repo.encode()), 16) % 2
            cohort = ("development", "reserved_confirmation")[partition]
            items = selected[cohort][lang]
            if len(items) == 12:
                continue
            items.append({"ordinal": len(items) + 1, "source_order_position": position,
                          **candidate})
            selected_repos.add(repo)
            if all(len(selected[c][lang]) == 12 for c in selected):
                break
        else:
            raise SystemExit("insufficient-disjoint-metadata-candidates:" + lang)
    if len(selected_repos) != 48 or selected_repos & excluded_repos:
        raise SystemExit("cohort-overlap-or-denominator-drift")
    result = {
        "schema_version": "are.g01-bugswarm-graph-dev-metadata-r1/v1",
        "status": "metadata-candidates-only-not-source-log-or-label-admitted",
        "input_sha256": {"raw": RAW_SHA, "order": ORDER_SHA, "prior": PRIOR_SHA},
        "script_sha256": sha(Path(__file__).read_bytes()),
        "partition_seed_sha256": sha(SEED),
        "rule": "Existing failure-side SHA order; repository hash parity partitions metadata-eligible Python/Java cases; first 12 distinct repos per language and partition; exclude prior 24 repos; no outcome replacement",
        "screened_source_positions": screened,
        "cohorts": selected,
        "prior_repositories_excluded": 24,
        "gold_paths_opened": False,
        "logs_opened": False,
        "model_calls": 0,
        "claim_ceiling": "Metadata candidates only. Development may be exposed after separate source/log/label admission; reserved confirmation must remain unopened to treatment tuning."
    }
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"output_sha256": sha(data), "selected_repositories": len(selected_repos),
                      "screened_source_positions": screened}))


if __name__ == "__main__":
    main()
