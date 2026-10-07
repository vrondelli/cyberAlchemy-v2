#!/usr/bin/env python3
"""Materialize only r77 failed-side Java source from admitted Bears archives."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import tarfile

COHORT_SHA = "9d6d9111addf1bc860830dc4633dda27b9b7348d693a369830d4c6395dcf2f78"
SOURCE_SHA = "0ca3ae28df203a1fc271461876c5bc8c568ed84d874c7e6a6fbb68cddae99513"
MAX_FILE = 1024 * 1024
MAX_TOTAL = 64 * 1024 * 1024


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cohort", required=True, type=Path)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.cohort.read_bytes()) != COHORT_SHA
            or sha(args.source.read_bytes()) != SOURCE_SHA):
        raise SystemExit("output-or-input-drift")
    cohort = json.loads(args.cohort.read_bytes())
    admitted = {row["ordinal"]: row for row in json.loads(args.source.read_bytes())["selected"]}
    if cohort["cases"] != 24 or not cohort["all_24_admitted"] or len(admitted) != 24:
        raise SystemExit("population-drift")
    args.output.mkdir(parents=True, mode=0o700)
    records = []
    for ordinal, case in enumerate(cohort["rows"], 1):
        selected = admitted[case["source_ordinal"]]
        if (case["ordinal"] != ordinal or case["bug_id"] != selected["bug_id"]
                or case["repo"] != selected["repo"] or case["buggy_commit"] != selected["buggy_commit"]
                or case["archive_sha256"] != selected["archive_sha256"]):
            raise SystemExit(f"case-identity:{ordinal}")
        archive_path = Path(case["archive"])
        if ("source-only-archives" not in archive_path.parts
                or sha(archive_path.read_bytes()) != case["archive_sha256"]):
            raise SystemExit(f"archive-drift:{ordinal}")
        root = args.output / f"{ordinal:02d}-{case['bug_id']}"
        root.mkdir(mode=0o700)
        seen = set()
        archive_tree = hashlib.sha256()
        projected_bytes = 0
        with tarfile.open(archive_path, "r:gz") as archive:
            for member in archive:
                parts = PurePosixPath(member.name).parts
                if (not parts or parts[0] != selected["archive_root"] or ".." in parts
                        or "\\" in member.name or member.name.startswith("/")):
                    raise SystemExit("unsafe-archive")
                if not member.isfile() or len(parts) < 2 or not member.name.endswith(".java"):
                    continue
                if member.size > MAX_FILE:
                    continue
                rel = PurePosixPath(*parts[1:]).as_posix()
                if rel in seen:
                    raise SystemExit("duplicate-java")
                seen.add(rel)
                stream = archive.extractfile(member)
                if stream is None:
                    raise SystemExit("missing-java-member")
                data = stream.read(MAX_FILE + 1)
                if len(data) != member.size:
                    raise SystemExit("java-member-size")
                projected_bytes += len(data)
                if projected_bytes > MAX_TOTAL:
                    raise SystemExit("java-projection-cap")
                archive_tree.update(rel.encode() + b"\0" + hashlib.sha256(data).digest())
                dest = root.joinpath(*PurePosixPath(rel).parts)
                dest.parent.mkdir(parents=True, exist_ok=True)
                fd = os.open(dest, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                with os.fdopen(fd, "wb") as output:
                    output.write(data)
        if (len(seen) != selected["java_files"] or projected_bytes != selected["java_bytes"]
                or archive_tree.hexdigest() != selected["java_scan_sha256"]):
            raise SystemExit(f"java-projection-drift:{ordinal}")
        subprocess.run(["git", "init", "-q", str(root)], check=True, timeout=30)
        subprocess.run(["git", "add", "-f", "--all"], cwd=root, check=True, timeout=240)
        tracked = subprocess.run(["git", "ls-files", "-z"], cwd=root,
                                 check=True, capture_output=True, timeout=30).stdout.split(b"\0")
        paths = sorted(item.decode() for item in tracked if item)
        if len(paths) != len(seen) or set(paths) != seen:
            raise SystemExit("tracked-path-drift")
        tree = hashlib.sha256()
        for rel in paths:
            tree.update(rel.encode() + b"\0" + hashlib.sha256((root / rel).read_bytes()).digest())
        records.append({"ordinal": ordinal, "id": case["bug_id"], "repo": case["repo"],
                        "base_commit": case["buggy_commit"], "root": str(root),
                        "projected_files": len(paths), "projected_bytes": projected_bytes,
                        "projected_tree_sha256": tree.hexdigest()})
        print(json.dumps({"ordinal": ordinal, "projected_files": len(paths),
                          "projected_bytes": projected_bytes}), flush=True)
    receipt = {"schema_version": "are.g01-bears-r77-source-projection/v1", "cases": 24,
               "cohort_sha256": COHORT_SHA, "source_sha256": SOURCE_SHA,
               "protocol_sha256": sha(Path(__file__).with_name("R77-JAVA-TRANSFER-PROTOCOL.md").read_bytes()),
               "script_sha256": sha(Path(__file__).read_bytes()),
               "records": records, "gold_values_used": False, "model_calls": 0}
    save(args.output / "SOURCE-PROJECTION.json", receipt)
    print(json.dumps({"cases": 24, "receipt_sha256": sha((args.output / "SOURCE-PROJECTION.json").read_bytes())}), flush=True)


if __name__ == "__main__":
    main()
