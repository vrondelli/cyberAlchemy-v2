#!/usr/bin/env python3
"""Evaluator-only Bears patch-label shape audit before any rankings."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import tarfile

METADATA_SHA = "a59f8b1a5a330a3ba993fada2318b168f61c5fd2dc247cd1119922f743f76a3d"
SOURCE_SHA = "0ca3ae28df203a1fc271461876c5bc8c568ed84d874c7e6a6fbb68cddae99513"
DIFF_HEADER = re.compile(r"^diff --git a/(.+) b/(.+)$", re.MULTILINE)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def source_paths(archive_path, expected_sha, expected_root):
    data = archive_path.read_bytes()
    if sha(data) != expected_sha:
        raise ValueError("archive-sha-drift")
    paths = set()
    with tarfile.open(archive_path, "r:gz") as archive:
        for member in archive:
            parts = PurePosixPath(member.name).parts
            if not parts or parts[0] != expected_root:
                raise ValueError("archive-root-drift")
            if not member.isfile() or len(parts) < 2 or not member.name.endswith(".java"):
                continue
            if member.size > 1024 * 1024:
                continue
            paths.add(PurePosixPath(*parts[1:]).as_posix())
    return paths


def label_paths(item, paths):
    diff = item["diff"]
    if not isinstance(diff, str):
        return None, "not-text-diff"
    headers = DIFF_HEADER.findall(diff)
    counts = item["patchDiff"]["files"]
    expected = counts["numberAdded"] + counts["numberChanged"] + counts["numberDeleted"]
    if not headers or len(headers) != expected:
        return None, "header-count"
    accepted = []
    for old, new in headers:
        rel = PurePosixPath(old)
        if (old != new or rel.is_absolute() or ".." in rel.parts or "\\" in old
                or not old.endswith(".java") or old not in paths):
            return None, "non-old-side-java"
        accepted.append(old)
    if len(set(accepted)) != len(accepted):
        return None, "duplicate-path"
    return sorted(accepted), None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", required=True, type=Path)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--archives", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.metadata.read_bytes()) != METADATA_SHA
            or sha(args.source.read_bytes()) != SOURCE_SHA):
        raise SystemExit("output-or-input-drift")
    metadata = {row["bugId"]: row for row in json.loads(args.metadata.read_bytes())}
    selected = json.loads(args.source.read_bytes())["selected"]
    if len(selected) != 24:
        raise SystemExit("source-denominator-drift")
    args.output.mkdir(parents=True, mode=0o700)
    save(args.output / "LABEL-FREEZE.json", {
        "schema_version": "are.g01-bears-r76-label-freeze/v1", "cases": 24,
        "metadata_sha256": METADATA_SHA, "source_sha256": SOURCE_SHA,
        "protocol_sha256": sha(Path(__file__).with_name("R76-LABEL-PROTOCOL.md").read_bytes()),
        "script_sha256": sha(Path(__file__).read_bytes()),
        "rankings_opened": False, "model_calls": 0, "scores_computed": False})
    results = []
    for ordinal, source in enumerate(selected, 1):
        item = metadata[source["bug_id"]]
        if source["repo"] != item["repository"]["url"].removeprefix("https://github.com/").lower():
            raise SystemExit("case-repository-drift")
        archive_path = args.archives / source["archive"]
        paths = source_paths(archive_path, source["archive_sha256"], source["archive_root"])
        if len(paths) != source["java_files"]:
            raise SystemExit("source-file-count-drift")
        labels, reason = label_paths(item, paths)
        results.append({"selection_ordinal": ordinal, "source_ordinal": source["ordinal"],
                        "bug_id": source["bug_id"], "repo": source["repo"],
                        "admissible": labels is not None, "reason": reason,
                        "gold_paths": labels, "rankings_opened": False,
                        "model_calls": 0, "scores_computed": False})
        print(json.dumps({"selection_ordinal": ordinal, "bug_id": source["bug_id"],
                          "admissible": labels is not None, "reason": reason}), flush=True)
    save(args.output / "LABEL-RESULT.json", {
        "schema_version": "are.g01-bears-r76-label-result/v1", "attempted": 24,
        "admitted": sum(row["admissible"] for row in results),
        "all_24_admitted": all(row["admissible"] for row in results),
        "results": results, "rankings_opened": False,
        "model_calls": 0, "scores_computed": False})
    save(args.output / "SOURCE-COHORT.json", {
        "schema_version": "are.g01-bears-r76-source-cohort/v1",
        "cases": 24, "all_24_admitted": all(row["admissible"] for row in results),
        "rows": [{"ordinal": i, "source_ordinal": source["ordinal"],
                  "bug_id": source["bug_id"], "repo": source["repo"],
                  "buggy_commit": source["buggy_commit"],
                  "archive": str(args.archives / source["archive"]),
                  "archive_sha256": source["archive_sha256"]}
                 for i, source in enumerate(selected, 1)],
        "gold_values_exported": False, "model_calls": 0})
    print(json.dumps({"admitted": sum(row["admissible"] for row in results),
                      "all_24_admitted": all(row["admissible"] for row in results)}), flush=True)


if __name__ == "__main__":
    main()
