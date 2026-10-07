#!/usr/bin/env python3
"""Materialize sealed pre-fix code-only BugSwarm repositories without gold."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import tarfile


CANDIDATE_SHA256 = "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"
SOURCE_RECEIPT_SHA256 = "c9db3ac9ae7bd4ef32dd9bb3edaef74e85a6ba9bf7abd8a658017939843ce6fc"
MAX_FILE_BYTES = 1024 * 1024
MAX_TOTAL_BYTES = 64 * 1024 * 1024
TAG = re.compile(r"[A-Za-z0-9._-]+\Z")


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--source-receipt", type=Path, required=True)
    parser.add_argument("--archives", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if (args.output.exists() or digest(args.candidate) != CANDIDATE_SHA256
            or digest(args.source_receipt) != SOURCE_RECEIPT_SHA256):
        raise SystemExit("output-or-input-pin-drift")
    candidate = json.loads(args.candidate.read_bytes())["selected"]
    source = json.loads(args.source_receipt.read_bytes())["results"]
    if len(candidate) != len(source) or len(source) != 24:
        raise SystemExit("denominator-drift")
    args.output.mkdir(mode=0o700)
    records = []
    for row, src in zip(candidate, source):
        ordinal, tag, commit = row["ordinal"], row["image_tag"], row["failure_commit"]
        if (src["ordinal"] != ordinal or src["commit"] != commit
                or not src["code_projection_admissible"] or not TAG.fullmatch(tag)):
            raise SystemExit("source-identity-drift")
        archive_path = args.archives / src["archive"]
        if digest(archive_path) != src["archive_sha256"]:
            raise SystemExit("source-archive-drift")
        root_name = f"{row['repo'].replace('/', '-')}-{commit[:7]}"
        extension = ".py" if row["language"] == "Python" else ".java"
        root = args.output / f"{ordinal:02d}-{tag}"
        root.mkdir(mode=0o700)
        seen, tree = set(), hashlib.sha256()
        files, bytes_total = 0, 0
        with tarfile.open(archive_path, "r:gz") as archive:
            for member in archive:
                parts = PurePosixPath(member.name).parts
                if (not parts or parts[0] != root_name or ".." in parts
                        or "\\" in member.name or member.name.startswith("/")):
                    raise SystemExit("unsafe-archive-path")
                if not member.isfile() or len(parts) < 2 or not member.name.endswith(extension):
                    continue
                if member.size > MAX_FILE_BYTES:
                    continue
                rel = PurePosixPath(*parts[1:]).as_posix()
                if rel in seen:
                    raise SystemExit("duplicate-source-path")
                seen.add(rel)
                stream = archive.extractfile(member)
                if stream is None:
                    raise SystemExit("missing-source-stream")
                content = stream.read(MAX_FILE_BYTES + 1)
                if len(content) != member.size:
                    raise SystemExit("source-member-size-drift")
                destination = root.joinpath(*PurePosixPath(rel).parts)
                destination.parent.mkdir(parents=True, exist_ok=True)
                fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                with os.fdopen(fd, "wb") as output:
                    output.write(content)
                files += 1
                bytes_total += len(content)
        if files != src["code_files"] or bytes_total != src["code_member_bytes"] or bytes_total > MAX_TOTAL_BYTES:
            raise SystemExit("projection-count-or-size-drift")
        subprocess.run(["git", "init", "-q", str(root)], check=True, timeout=30)
        subprocess.run(["git", "add", "-f", "--all"], cwd=root, check=True, timeout=240)
        tracked = subprocess.run(["git", "ls-files", "-z"], cwd=root,
                                 check=True, capture_output=True, timeout=30).stdout.split(b"\0")
        paths = sorted(item.decode("utf-8") for item in tracked if item)
        if len(paths) != files or set(paths) != seen:
            raise SystemExit("tracked-source-drift")
        for path in paths:
            content = (root / path).read_bytes()
            tree.update(path.encode() + b"\0" + hashlib.sha256(content).digest())
        records.append({"ordinal": ordinal, "image_tag": tag, "repo": row["repo"],
                        "language": row["language"], "commit": commit, "root": str(root),
                        "projected_files": files, "projected_bytes": bytes_total,
                        "projected_tree_sha256": tree.hexdigest()})
        print(json.dumps({"ordinal": ordinal, "projected_files": files,
                          "projected_bytes": bytes_total}), flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-code-projection-r1/v1",
               "candidate_sha256": CANDIDATE_SHA256,
               "source_receipt_sha256": SOURCE_RECEIPT_SHA256,
               "gold_opened": False, "model_calls": 0, "records": records}
    encoded = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    target = args.output / "SOURCE-PROJECTION-RECEIPT.json"
    fd = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as output:
        output.write(encoded)
    print(json.dumps({"cases": len(records), "receipt_sha256": hashlib.sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
