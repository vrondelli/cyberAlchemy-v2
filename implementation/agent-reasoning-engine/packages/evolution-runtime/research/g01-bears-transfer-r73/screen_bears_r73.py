#!/usr/bin/env python3
"""Project active, independent Bears failure-side cases in original order."""

import argparse
import hashlib
import json
import os
from pathlib import Path

PINS = {
    "bears_metadata": "a59f8b1a5a330a3ba993fada2318b168f61c5fd2dc247cd1119922f743f76a3d",
    "bears_active": "444c6c3f1f8bd60079576dc2625c77269fd9df36968961d8e7b45e2ad75b54dd",
}
EXTRA_EXPOSED = {
    "psf/black", "cookiecutter/cookiecutter", "scrapy/scrapy", "explosion/spacy",
    "pallets/click", "pytest-dev/pytest", "caddyserver/caddy", "clap-rs/clap",
    "etcd-io/etcd", "gin-gonic/gin", "tokio-rs/tokio",
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    return json.loads(path.read_bytes())


def save(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def occupied_repositories(archive):
    occupied = set()

    def add(rows):
        occupied.update(row["repo"].lower() for row in rows)

    add(read(archive / "METADATA-CANDIDATE-24-R1.json")["selected"])
    development = read(archive / "graph-dev-r1/METADATA-COHORTS-R1.json")
    for partition in ("development", "reserved_confirmation"):
        for language in ("Python", "Java"):
            add(development["cohorts"][partition][language])
    for relative, keys in (
        ("graph-dev-r2/DEV-METADATA-R2.json", ("development", "attempts")),
        ("graph-dev-b-r1/METADATA-COHORT-B-R1.json", ("selected",)),
        ("graph-dev-b-r1/METADATA-COHORT-B-R2.json", ("development", "attempts")),
        ("graph-confirm-r4/code-only/RESULT.json", ("records",)),
        ("fresh-r11/METADATA-COHORT.json", ("selected",)),
    ):
        data = read(archive / relative)
        for key in keys:
            add(data[key])
    for path in sorted((archive / "graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair").glob("ATTEMPT-*.json")):
        add([read(path)])
    for path in sorted((archive / "fresh-r11/repair-r14/run").glob("*-ATTEMPT.json")):
        add([read(path)])
    if len(occupied) != 180:
        raise SystemExit("historical-overlap-drift")
    add(read(archive / "selective-r28/METADATA-CENSUS.json")["selected"])
    if len(occupied) != 204:
        raise SystemExit("r28-overlap-drift")
    queue = read(archive / "selective-r28/repair-r32/QUEUE.json")["queues"]
    add(queue["Python"])
    add(queue["Java"])
    add(read(archive / "selective-r28/final-r34/RESULT.json")["rows"])
    add(read(archive / "fresh-functionality-r64/source-preflight/SOURCE-RESULT.json")["results"])
    if len(occupied) != 246:
        raise SystemExit("r71-overlap-drift")
    return occupied


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bears", required=True, type=Path)
    parser.add_argument("--bugswarm", required=True, type=Path)
    parser.add_argument("--bugsinpy", required=True, type=Path)
    parser.add_argument("--arb", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output-exists")
    metadata_path = args.bears / "docs/data/bears-bugs.json"
    active_path = args.bears / "scripts/data/bug_id_and_branch.json"
    if (sha(metadata_path.read_bytes()) != PINS["bears_metadata"]
            or sha(active_path.read_bytes()) != PINS["bears_active"]):
        raise SystemExit("bears-input-drift")
    if not (args.bears / ".git").is_dir():
        raise SystemExit("bears-checkout-missing")
    occupied = occupied_repositories(args.bugswarm)
    for name in ("source-only-r2/EXACT-COHORT-24-FREEZE.json",
                 "source-only-r3/EXACT-COHORT-24-R2-FREEZE.json"):
        occupied.update(row["repo"].lower() for row in read(args.bugsinpy / name)["selected"])
    exposed_arb = set(read(args.arb / "EXPOSED-RERANK-101-JOIN.json")["per_repo"])
    if exposed_arb != {"caddyserver/caddy", "clap-rs/clap", "etcd-io/etcd",
                       "gin-gonic/gin", "pallets/click", "pytest-dev/pytest", "tokio-rs/tokio"}:
        raise SystemExit("arb-overlap-drift")
    occupied.update(exposed_arb)
    occupied.update(EXTRA_EXPOSED)
    metadata = read(metadata_path)
    active_rows = read(active_path)
    active = {row["bugId"]: row["bugBranch"] for row in active_rows}
    if len(metadata) != 251 or len(active_rows) != 118 or len(active) != 118:
        raise SystemExit("bears-population-drift")
    seen = set(occupied)
    rows = []
    for position, item in enumerate(metadata, 1):
        bug_id = item["bugId"]
        if bug_id not in active:
            continue
        url = item["repository"]["url"]
        if not url.startswith("https://github.com/"):
            raise SystemExit("repository-url-drift")
        repo = url.removeprefix("https://github.com/").lower()
        if repo in seen:
            continue
        seen.add(repo)
        failures = item["tests"]["failureDetails"]
        buggy = item["commits"]["buggyBuild"]
        if (not failures or not isinstance(buggy["sha"], str) or len(buggy["sha"]) != 40
                or item["bugName"] != active[bug_id]):
            raise SystemExit("failure-side-shape-drift")
        # Never project metadata diff, patchDiff, fixerBuild, or passing source.
        rows.append({"source_position": position, "ordinal": len(rows) + 1,
                     "bug_id": bug_id, "repo": repo, "branch": active[bug_id],
                     "buggy_commit": buggy["sha"],
                     "failure_details": [{"failure_name": f["failureName"],
                                          "test_method": f["testMethod"],
                                          "test_class": f["testClass"],
                                          "detail": f.get("detail", "")} for f in failures]})
    if len(rows) != 37 or len({row["repo"] for row in rows}) != 37:
        raise SystemExit(f"independent-repo-count-drift:{len(rows)}")
    args.output.mkdir(parents=True, mode=0o700)
    projected = {"schema_version": "are.g01-bears-r73-source-order/v1", "source_cases": 251,
                 "active_cases": 118, "active_repositories": 39,
                 "prior_bugswarm_occupied": 246, "independent_repositories": 37,
                 "rows": rows, "gold_values_used": False, "fixer_content_exported": False,
                 "model_calls": 0, "scores_computed": False}
    save(args.output / "SOURCE-ORDER.json", projected)
    save(args.output / "SCREEN-RECEIPT.json", {"schema_version": "are.g01-bears-r73-screen-receipt/v1",
         "bears_metadata_sha256": PINS["bears_metadata"],
         "bears_active_sha256": PINS["bears_active"],
         "source_order_sha256": sha((args.output / "SOURCE-ORDER.json").read_bytes()),
         "protocol_sha256": sha(Path(__file__).with_name("SCREEN-PROTOCOL.md").read_bytes()),
         "script_sha256": sha(Path(__file__).read_bytes()),
         "cases": len(rows), "gold_values_used": False, "model_calls": 0})
    print(json.dumps({"active_repositories": 39, "independent_repositories": len(rows),
                      "first_24_ids": [row["bug_id"] for row in rows[:24]]}))


if __name__ == "__main__":
    main()
