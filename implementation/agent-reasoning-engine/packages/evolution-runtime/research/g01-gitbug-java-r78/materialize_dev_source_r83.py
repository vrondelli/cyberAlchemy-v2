#!/usr/bin/env python3
"""Project 12 exact buggy Java archives to isolated Git indexes."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import tarfile

DEV_SHA = "cc16c5576f31b67b270df33949a8dc5452c5ae2f9af75eae752f085069992301"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save_new(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def main():
    parser = argparse.ArgumentParser()
    for name in ("dev", "archives", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.dev.read_bytes()) != DEV_SHA:
        raise SystemExit("output-or-source-drift")
    cases = json.loads(args.dev.read_bytes())["results"]
    if len(cases) != 12 or not all(x["accepted"] for x in cases):
        raise SystemExit("population-drift")
    args.output.mkdir(parents=True, mode=0o700)
    records = []
    for case in cases:
        ordinal = case["ordinal"]
        archive_path = args.archives / case["archive"]
        if sha(archive_path.read_bytes()) != case["get_sha256"]:
            raise SystemExit("archive-sha-drift")
        root = args.output / f"{ordinal:02d}-source"
        root.mkdir(mode=0o700)
        seen = set()
        scanned = hashlib.sha256()
        projected_bytes = 0
        with tarfile.open(archive_path, "r:gz") as archive:
            for member in archive:
                parts = PurePosixPath(member.name).parts
                if (not parts or parts[0] != case["audit"]["archive_root"]
                        or ".." in parts or "\\" in member.name
                        or member.name.startswith("/")):
                    raise SystemExit("unsafe-archive-path")
                if (not member.isfile() or len(parts) < 2
                        or not member.name.endswith(".java")
                        or member.size > 1024 * 1024):
                    continue
                rel = PurePosixPath(*parts[1:]).as_posix()
                if rel in seen:
                    raise SystemExit("duplicate-java-path")
                seen.add(rel)
                stream = archive.extractfile(member)
                if stream is None:
                    raise SystemExit("missing-java-member")
                data = stream.read(1024 * 1024 + 1)
                if len(data) != member.size:
                    raise SystemExit("java-member-size-drift")
                projected_bytes += len(data)
                if projected_bytes > 64 * 1024 * 1024:
                    raise SystemExit("java-total-cap")
                scanned.update(rel.encode() + b"\0" + hashlib.sha256(data).digest())
                target = root.joinpath(*PurePosixPath(rel).parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                fd = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                with os.fdopen(fd, "wb") as output:
                    output.write(data)
        if (len(seen) != case["audit"]["java_files"]
                or projected_bytes != case["audit"]["java_bytes"]
                or scanned.hexdigest() != case["audit"]["java_scan_sha256"]):
            raise SystemExit("source-scan-drift")
        subprocess.run(["git", "init", "-q", str(root)], check=True, timeout=30)
        subprocess.run(["git", "add", "-f", "--all"], cwd=root, check=True, timeout=120)
        tracked = subprocess.run(["git", "ls-files", "-z"], cwd=root, check=True,
                                 capture_output=True, timeout=30).stdout.split(b"\0")
        paths = sorted(x.decode() for x in tracked if x)
        if set(paths) != seen or len(paths) != len(seen):
            raise SystemExit("git-index-path-drift")
        tree = hashlib.sha256()
        for rel in paths:
            tree.update(rel.encode() + b"\0" + hashlib.sha256((root / rel).read_bytes()).digest())
        records.append({"ordinal": ordinal, "repo": case["repo"],
                        "base_commit": case["buggy_commit"], "root": str(root),
                        "projected_files": len(paths), "projected_bytes": projected_bytes,
                        "projected_tree_sha256": tree.hexdigest()})
        print(json.dumps({"ordinal": ordinal, "files": len(paths),
                          "bytes": projected_bytes}), flush=True)
    save_new(args.output / "SOURCE-PROJECTION.json", {
        "schema_version": "are.g01-gitbug-r83-source/v1", "cases": 12,
        "dev_source_sha256": DEV_SHA,
        "script_sha256": sha(Path(__file__).read_bytes()),
        "protocol_sha256": sha(Path(__file__).with_name("R83-DEV-RANKING-PROTOCOL.md").read_bytes()),
        "records": records, "gold_values_used": False,
        "model_calls": 0, "scores_computed": False})


if __name__ == "__main__":
    main()
