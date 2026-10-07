#!/usr/bin/env python3
"""Read-only audit of frozen exact-commit GitHub source archives."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import tarfile


FREEZE_SHA256 = "888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33"


def sha256(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--freeze", type=pathlib.Path, required=True)
    parser.add_argument("--snapshots", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if sha256(args.freeze) != FREEZE_SHA256:
        raise SystemExit("freeze digest drift")
    freeze = json.loads(args.freeze.read_text())
    if freeze["case_count"] != 24 or freeze["repository_count"] != 12:
        raise SystemExit("cohort shape drift")
    records = []
    for row in freeze["selected"]:
        repo, bugid, commit = row["repo"], row["bugid"], row["buggy_commit_id"]
        path = args.snapshots / f"{repo}-{commit}.tar.gz"
        if not path.is_file() or path.stat().st_size > 100_000_000:
            raise SystemExit(f"missing or oversized archive: {repo}/{bugid}")
        member_count = 0
        regular_bytes = 0
        link_count = 0
        roots = set()
        with tarfile.open(path, "r:gz") as archive:
            for member in archive:
                member_count += 1
                name = pathlib.PurePosixPath(member.name)
                if name.is_absolute() or ".." in name.parts or "\\" in member.name:
                    raise SystemExit(f"unsafe archive path: {repo}/{bugid}")
                roots.add(name.parts[0])
                if member.isfile():
                    regular_bytes += member.size
                elif member.issym() or member.islnk():
                    link_count += 1
                elif not member.isdir():
                    raise SystemExit(f"special archive member: {repo}/{bugid}")
                if member_count > 200_000 or regular_bytes > 1_000_000_000:
                    raise SystemExit(f"archive expansion cap: {repo}/{bugid}")
        if len(roots) != 1 or not next(iter(roots)).endswith(commit):
            raise SystemExit(f"archive root does not bind commit: {repo}/{bugid}")
        records.append({"case": f"{repo}/{bugid}", "commit": commit,
                        "archive_sha256": sha256(path), "compressed_bytes": path.stat().st_size,
                        "members": member_count, "regular_bytes": regular_bytes,
                        "links_not_extracted": link_count})
    report = {"schema": "are.g01-bugsinpy-source-snapshot-audit-r1/v1",
              "freeze_sha256": FREEZE_SHA256, "archive_count": len(records),
              "total_compressed_bytes": sum(r["compressed_bytes"] for r in records),
              "total_regular_bytes": sum(r["regular_bytes"] for r in records),
              "archives_with_links": sum(r["links_not_extracted"] > 0 for r in records),
              "records": records, "gold_opened": False, "extracted": False}
    print(json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
