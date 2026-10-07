#!/usr/bin/env python3
"""Evaluator-only GitBug-Java development label audit."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import tarfile

SUPPLY_SHA = "eef0efa22d78160613f20d09157b8dc0397bbd81f0a0277f613818cb2bb72002"
DEV_SHA = "cc16c5576f31b67b270df33949a8dc5452c5ae2f9af75eae752f085069992301"
QUERY_SEAL_SHA = "897c07b60c455da90b5aa7b384bf1a60b9b0b70c2e627fa30b4ef126038c873e"
DIFF_HEADER = re.compile(r"^diff --git a/(.+) b/(.+)$", re.MULTILINE)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def source_paths(path, expected_sha, expected_root):
    if sha(path.read_bytes()) != expected_sha:
        raise SystemExit("archive-sha-drift")
    paths = set()
    with tarfile.open(path, "r:gz") as archive:
        for member in archive:
            parts = PurePosixPath(member.name).parts
            if not parts or parts[0] != expected_root:
                raise SystemExit("archive-root-drift")
            if (not member.isfile() or len(parts) < 2 or member.size > 1024 * 1024
                    or not member.name.endswith(".java")):
                continue
            rel = PurePosixPath(*parts[1:]).as_posix()
            if rel in paths:
                raise SystemExit("duplicate-source-path")
            paths.add(rel)
    return paths


def labels(item, source):
    patch = item.get("bug_patch")
    if not isinstance(patch, str):
        return None, "patch-not-text"
    headers = DIFF_HEADER.findall(patch)
    if not headers:
        return None, "no-diff-headers"
    accepted = []
    for old, new in headers:
        rel = PurePosixPath(old)
        if (old != new or rel.is_absolute() or ".." in rel.parts
                or "\\" in old or not old.endswith(".java") or old not in source):
            return None, "non-old-side-java-path"
        accepted.append(old)
    if len(set(accepted)) != len(accepted):
        return None, "duplicate-label-path"
    return sorted(accepted), None


def main():
    parser = argparse.ArgumentParser()
    for name in ("metadata", "supply", "dev", "queries", "archives", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.supply.read_bytes()) != SUPPLY_SHA
            or sha(args.dev.read_bytes()) != DEV_SHA
            or sha(args.queries.read_bytes()) != QUERY_SEAL_SHA):
        raise SystemExit("output-or-input-drift")
    supply = json.loads(args.supply.read_bytes())
    cases = json.loads(args.dev.read_bytes())["results"]
    if len(cases) != 12 or not all(x["accepted"] for x in cases):
        raise SystemExit("development-source-drift")
    args.output.mkdir(mode=0o700, parents=True)
    save_new(args.output / "LABEL-FREEZE.json", {
        "schema_version": "are.g01-gitbug-r82-dev-label-freeze/v1",
        "supply_sha256": SUPPLY_SHA, "dev_source_sha256": DEV_SHA,
        "query_seal_sha256": QUERY_SEAL_SHA,
        "script_sha256": sha(Path(__file__).read_bytes()),
        "protocol_sha256": sha(Path(__file__).with_name("R82-DEV-LABEL-PROTOCOL.md").read_bytes()),
        "cases": 12, "confirmation_labels_opened": False,
        "rankings_opened": False, "model_calls": 0})
    results = []
    for row, case in zip(supply["rows"][:12], cases, strict=True):
        if (case["ordinal"] != row["ordinal"] or case["repo"] != row["repo"]
                or case["buggy_commit"] != row["buggy_commit"]):
            raise SystemExit("case-binding-drift")
        metadata_path = args.metadata / "data/bugs" / row["metadata_file"]
        if sha(metadata_path.read_bytes()) != supply["source_files_sha256"][metadata_path.name]:
            raise SystemExit("metadata-sha-drift")
        item = json.loads(metadata_path.read_text().splitlines()[row["metadata_line"] - 1])
        if (item["repository"].lower() != row["repo"]
                or item["previous_commit_hash"] != row["buggy_commit"]):
            raise SystemExit("metadata-identity-drift")
        archive = args.archives / case["archive"]
        source = source_paths(archive, case["get_sha256"], case["audit"]["archive_root"])
        if len(source) != case["audit"]["java_files"]:
            raise SystemExit("source-count-drift")
        gold, reason = labels(item, source)
        results.append({"ordinal": row["ordinal"], "repo": row["repo"],
                        "admissible": gold is not None, "reason": reason,
                        "gold_paths": gold, "confirmation_labels_opened": False,
                        "rankings_opened": False, "model_calls": 0})
        print(json.dumps({"ordinal": row["ordinal"],
                          "admissible": gold is not None, "reason": reason}), flush=True)
    save_new(args.output / "DEV-LABEL-RESULT.json", {
        "schema_version": "are.g01-gitbug-r82-dev-label-result/v1",
        "attempted": 12, "admitted": sum(x["admissible"] for x in results),
        "results": results, "confirmation_labels_opened": False,
        "rankings_opened": False, "model_calls": 0})


if __name__ == "__main__":
    main()
