#!/usr/bin/env python3
"""Source-only census of files admissible to the frozen ARE text index."""

from __future__ import annotations

import argparse
import json
import pathlib
import tarfile


MAX_FILE_BYTES = 1024 * 1024
MAX_INDEX_BYTES = 64 * 1024 * 1024


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--freeze", type=pathlib.Path, required=True)
    parser.add_argument("--snapshots", type=pathlib.Path, required=True)
    args = parser.parse_args()
    rows = json.loads(args.freeze.read_text())["selected"]
    records = []
    for row in rows:
        path = args.snapshots / f"{row['repo']}-{row['buggy_commit_id']}.tar.gz"
        eligible = []
        skipped = {"nonregular": 0, "large": 0, "binary": 0, "unsafe": 0}
        with tarfile.open(path, "r:gz") as archive:
            for member in archive:
                parts = pathlib.PurePosixPath(member.name).parts
                if len(parts) < 2 or ".." in parts or ".git" in parts or "\\" in member.name:
                    skipped["unsafe"] += 1
                    continue
                rel = pathlib.PurePosixPath(*parts[1:]).as_posix()
                if not member.isfile():
                    skipped["nonregular"] += 1
                    continue
                if member.size > MAX_FILE_BYTES:
                    skipped["large"] += 1
                    continue
                stream = archive.extractfile(member)
                if stream is None:
                    raise SystemExit("missing regular member stream")
                content = stream.read()
                if b"\0" in content[:8192]:
                    skipped["binary"] += 1
                    continue
                eligible.append((rel, len(content)))
        eligible.sort()
        total_bytes = sum(size for _, size in eligible)
        if not eligible or len({rel for rel, _ in eligible}) != len(eligible):
            raise SystemExit(f"empty or duplicate eligible source: {row['repo']}/{row['bugid']}")
        records.append({"case": f"{row['repo']}/{row['bugid']}",
                        "eligible_files": len(eligible), "eligible_bytes": total_bytes,
                        "within_64mib_index": total_bytes <= MAX_INDEX_BYTES,
                        "skipped": skipped})
    print(json.dumps({"schema": "are.g01-bugsinpy-index-preflight-r1/v1",
                      "cases": len(records),
                      "fully_indexable_64mib": sum(r["within_64mib_index"] for r in records),
                      "max_eligible_files": max(r["eligible_files"] for r in records),
                      "max_eligible_bytes": max(r["eligible_bytes"] for r in records),
                      "records": records, "gold_opened": False}, sort_keys=True))


if __name__ == "__main__":
    main()
