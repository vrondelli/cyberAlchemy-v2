#!/usr/bin/env python3
"""Materialize only failed-commit Python files for sealed G01 r72 cases."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import tarfile

COHORT_SHA = "4e779481382a57b99e0075bdad801fb15bf122275f20a409bac2264d48c528be"
MAX_FILE = 1024 * 1024
MAX_TOTAL = 64 * 1024 * 1024


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cohort", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.cohort.read_bytes()) != COHORT_SHA:
        raise SystemExit("output-exists-or-cohort-drift")
    cohort = json.loads(args.cohort.read_bytes())
    if cohort["cases"] != 24 or len(cohort["rows"]) != 24:
        raise SystemExit("population-drift")
    args.output.mkdir(parents=True, mode=0o700)
    records = []
    for ordinal, case in enumerate(cohort["rows"], 1):
        if case["ordinal"] != ordinal:
            raise SystemExit("ordinal-drift")
        archive_path = Path(case["failed_archive"])
        if "source-only-failed-archives" not in archive_path.parts or sha(archive_path.read_bytes()) != case["failed_archive_sha256"]:
            raise SystemExit("failed-archive-drift")
        root = args.output / f"{ordinal:02d}-{case['image_tag']}"
        root.mkdir(mode=0o700)
        seen = set()
        projected_bytes = 0
        with tarfile.open(archive_path, "r:gz") as archive:
            root_name = None
            for member in archive:
                parts = PurePosixPath(member.name).parts
                if root_name is None:
                    root_name = parts[0]
                    if not root_name.endswith(case["failed_commit"]):
                        raise SystemExit("archive-root-drift")
                if (not parts or parts[0] != root_name or ".." in parts or
                        "\\" in member.name or member.name.startswith("/")):
                    raise SystemExit("unsafe-archive")
                if not member.isfile() or len(parts) < 2 or not member.name.endswith(".py"):
                    continue
                if member.size > MAX_FILE:
                    continue
                rel = PurePosixPath(*parts[1:]).as_posix()
                if rel in seen:
                    raise SystemExit("duplicate-source")
                seen.add(rel)
                stream = archive.extractfile(member)
                if stream is None:
                    raise SystemExit("missing-member")
                data = stream.read(MAX_FILE + 1)
                if len(data) != member.size:
                    raise SystemExit("member-size-drift")
                projected_bytes += len(data)
                if projected_bytes > MAX_TOTAL:
                    raise SystemExit("projection-cap")
                dest = root.joinpath(*PurePosixPath(rel).parts)
                dest.parent.mkdir(parents=True, exist_ok=True)
                fd = os.open(dest, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                with os.fdopen(fd, "wb") as output:
                    output.write(data)
        subprocess.run(["git", "init", "-q", str(root)], check=True, timeout=30)
        subprocess.run(["git", "add", "-f", "--all"], cwd=root, check=True, timeout=240)
        tracked = subprocess.run(["git", "ls-files", "-z"], cwd=root, check=True,
                                 capture_output=True, timeout=30).stdout.split(b"\0")
        paths = sorted(item.decode() for item in tracked if item)
        if len(paths) != len(seen) or set(paths) != seen:
            raise SystemExit("tracked-file-drift")
        tree = hashlib.sha256()
        for rel in paths:
            tree.update(rel.encode() + b"\0" + hashlib.sha256((root / rel).read_bytes()).digest())
        records.append({"ordinal": ordinal, "id": case["image_tag"], "repo": case["repo"],
                        "base_commit": case["failed_commit"], "root": str(root),
                        "projected_files": len(paths), "projected_bytes": projected_bytes,
                        "projected_tree_sha256": tree.hexdigest()})
        print(json.dumps({"ordinal": ordinal, "projected_files": len(paths),
                          "projected_bytes": projected_bytes}), flush=True)
    receipt = {"schema_version": "are.g01-r72-source-projection/v1", "cases": 24,
               "cohort_sha256": COHORT_SHA, "script_sha256": sha(Path(__file__).read_bytes()),
               "records": records, "gold_opened": False, "passing_source_opened": False,
               "model_calls": 0}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output / "SOURCE-PROJECTION.json", os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as output:
        output.write(data)
    print(json.dumps({"cases": 24, "receipt_sha256": sha(data)}), flush=True)


if __name__ == "__main__":
    main()
