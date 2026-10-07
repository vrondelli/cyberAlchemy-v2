#!/usr/bin/env python3
"""Source-only census of unopened GitBug-Java repositories."""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

BEARS_SCRIPT = Path(__file__).resolve().parents[1] / "g01-bears-transfer-r73"
sys.path.insert(0, str(BEARS_SCRIPT))
from screen_bears_r73 import EXTRA_EXPOSED, occupied_repositories, read  # noqa: E402

HEX40 = re.compile(r"^[0-9a-f]{40}$")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_new(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def failing_tests(item):
    names = set()
    for group in item.get("actions_runs") or []:
        for run in group or []:
            for test in run.get("tests") or []:
                if any(result.get("result") in ("Failure", "Error")
                       for result in test.get("results") or []):
                    names.add(f"{test.get('classname', '')}#{test.get('name', '')}")
    return sorted(names)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--gitbug", required=True, type=Path)
    parser.add_argument("--bugswarm", required=True, type=Path)
    parser.add_argument("--bugsinpy", required=True, type=Path)
    parser.add_argument("--arb", required=True, type=Path)
    parser.add_argument("--bears", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output-exists")
    if not (args.gitbug / ".git").is_dir():
        raise SystemExit("gitbug-checkout-missing")
    actual_head = subprocess.check_output(
        ["git", "-C", str(args.gitbug), "rev-parse", "HEAD"], text=True
    ).strip()
    expected_head = "fe986fb7919be62c2a6f611ee16659e849646798"
    if actual_head != expected_head:
        raise SystemExit("gitbug-head-drift")
    occupied = occupied_repositories(args.bugswarm)
    for relative in ("source-only-r2/EXACT-COHORT-24-FREEZE.json",
                     "source-only-r3/EXACT-COHORT-24-R2-FREEZE.json"):
        occupied.update(row["repo"].lower()
                        for row in read(args.bugsinpy / relative)["selected"])
    occupied.update(read(args.arb / "EXPOSED-RERANK-101-JOIN.json")["per_repo"])
    occupied.update(EXTRA_EXPOSED)
    occupied.update(row["repo"].lower() for row in
                    read(args.bears / "source-only-screen-r73/SOURCE-ORDER.json")["rows"])
    inputs = sorted((args.gitbug / "data/bugs").glob("*.json"))
    if len(inputs) != 55:
        raise SystemExit("gitbug-file-count-drift")
    rows = []
    seen = set()
    total = 0
    candidates = 0
    for path in inputs:
        for line_number, line in enumerate(path.open(), 1):
            if not line.strip():
                continue
            total += 1
            item = json.loads(line)
            repo = item["repository"].lower()
            if repo in seen:
                continue
            seen.add(repo)
            if (item.get("language") != "java"
                    or "java" not in (item.get("bug_patch_file_extensions") or [])
                    or not HEX40.fullmatch(item.get("previous_commit_hash") or "")):
                continue
            failures = failing_tests(item)
            if not failures:
                continue
            candidates += 1
            if repo in occupied:
                continue
            rows.append({"ordinal": len(rows) + 1, "repo": repo,
                         "metadata_file": path.name, "metadata_line": line_number,
                         "buggy_commit": item["previous_commit_hash"],
                         "strategy": item["strategy"],
                         "failing_test_count": len(failures)})
    if total != 199 or len(seen) != 55 or candidates != 55 or len(rows) != 53:
        raise SystemExit(f"population-drift:{total}/{len(seen)}/{candidates}/{len(rows)}")
    args.output.mkdir(mode=0o700, parents=True)
    manifest = {"schema_version": "are.g01-gitbug-r78-supply/v1",
                "source_commit": expected_head,
                "source_files_sha256": {p.name: digest(p) for p in inputs},
                "bugs": total, "repositories": len(seen),
                "candidate_repositories": candidates, "independent_repositories": len(rows),
                "rows": rows, "gold_values_used": False,
                "fixed_side_exported": False, "model_calls": 0, "scores_computed": False}
    save_new(args.output / "SUPPLY.json", manifest)
    save_new(args.output / "SCREEN-RECEIPT.json", {
        "schema_version": "are.g01-gitbug-r78-screen-receipt/v1",
        "manifest_sha256": digest(args.output / "SUPPLY.json"),
        "protocol_sha256": digest(Path(__file__).with_name("SCREEN-PROTOCOL.md")),
        "script_sha256": digest(Path(__file__)),
        "gitbug_git_head": actual_head,
        "independent_repositories": len(rows), "gold_values_used": False,
        "model_calls": 0})
    print(json.dumps({"independent_repositories": len(rows),
                      "first_24_repositories": [r["repo"] for r in rows[:24]]}))


if __name__ == "__main__":
    main()
