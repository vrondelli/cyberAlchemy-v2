#!/usr/bin/env python3
"""Read-only safety and identity audit of the frozen r2 source archives."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import tarfile


FREEZE_SHA256 = "77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--freeze", type=pathlib.Path, required=True)
    parser.add_argument("--snapshots", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if digest(args.freeze) != FREEZE_SHA256:
        raise SystemExit("r2 freeze digest drift")
    cohort = json.loads(args.freeze.read_text())["selected"]
    if len(cohort) != 24:
        raise SystemExit("r2 denominator drift")
    records = []
    for row in cohort:
        case = f"{row['repo']}/{row['bugid']}"
        commit = row["buggy_commit_id"]
        path = args.snapshots / f"{row['repo']}-{commit}.tar.gz"
        if not path.is_file() or path.stat().st_size > 100_000_000:
            raise SystemExit(f"archive missing or oversized: {case}")
        roots = set()
        members = links = regular_bytes = 0
        with tarfile.open(path, "r:gz") as archive:
            for member in archive:
                members += 1
                name = pathlib.PurePosixPath(member.name)
                if name.is_absolute() or ".." in name.parts or "\\" in member.name:
                    raise SystemExit(f"unsafe member path: {case}")
                roots.add(name.parts[0])
                if member.isfile():
                    regular_bytes += member.size
                elif member.issym() or member.islnk():
                    links += 1
                elif not member.isdir():
                    raise SystemExit(f"special member: {case}")
                if members > 200_000 or regular_bytes > 1_000_000_000:
                    raise SystemExit(f"archive expansion cap: {case}")
        if len(roots) != 1 or not next(iter(roots)).endswith(commit):
            raise SystemExit(f"root-commit binding drift: {case}")
        records.append({"case": case, "archive_sha256": digest(path),
                        "compressed_bytes": path.stat().st_size,
                        "regular_bytes": regular_bytes, "members": members,
                        "links_not_extracted": links})
    print(json.dumps({"schema": "are.g01-bugsinpy-r2-snapshot-audit/v1",
                      "freeze_sha256": FREEZE_SHA256, "archives": len(records),
                      "total_compressed_bytes": sum(row["compressed_bytes"] for row in records),
                      "total_regular_bytes": sum(row["regular_bytes"] for row in records),
                      "archives_with_links": sum(row["links_not_extracted"] > 0 for row in records),
                      "records": records, "gold_opened": False,
                      "source_extracted": False}, sort_keys=True))


if __name__ == "__main__":
    main()
