#!/usr/bin/env python3
"""Validate all sealed failing-source archives and estimate code-only projection."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import tarfile


CANDIDATE_SHA256 = "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"
MAX_FILE_BYTES = 1024 * 1024
MAX_PROJECTED_BYTES = 64 * 1024 * 1024


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--archives", type=Path, required=True)
    args = parser.parse_args()
    if digest(args.candidate) != CANDIDATE_SHA256 or not args.archives.is_dir():
        raise SystemExit("candidate-pin-or-archive-dir-drift")
    selected = json.loads(args.candidate.read_bytes())["selected"]
    if len(selected) != 24:
        raise SystemExit("candidate-denominator-drift")
    results = []
    for row in selected:
        ordinal, repo, commit = row["ordinal"], row["repo"], row["failure_commit"]
        name = f"{ordinal:02d}-{repo.replace('/', '-')}-{commit}.tar.gz"
        archive_path = args.archives / name
        if not archive_path.is_file() or archive_path.stat().st_mode & 0o077:
            raise SystemExit(f"archive-missing-or-open-permissions:{ordinal}")
        root = f"{repo.replace('/', '-')}-{commit[:7]}"
        extension = ".py" if row["language"] == "Python" else ".java"
        files, bytes_total, skipped_large, unsafe = 0, 0, 0, False
        with tarfile.open(archive_path, "r:gz") as archive:
            for member in archive:
                parts = PurePosixPath(member.name).parts
                if (not parts or parts[0] != root or ".." in parts or "\\" in member.name
                        or member.name.startswith("/")):
                    unsafe = True
                    break
                if not member.isfile() or len(parts) < 2 or not member.name.endswith(extension):
                    continue
                if member.size > MAX_FILE_BYTES:
                    skipped_large += 1
                    continue
                files += 1
                bytes_total += member.size
        admissible = not unsafe and files > 0 and bytes_total <= MAX_PROJECTED_BYTES
        result = {"ordinal": ordinal, "repo": repo, "commit": commit,
                  "archive": name, "archive_bytes": archive_path.stat().st_size,
                  "archive_sha256": digest(archive_path), "code_files": files,
                  "code_member_bytes": bytes_total,
                  "skipped_over_1m_code_files": skipped_large,
                  "unsafe_path": unsafe, "code_projection_admissible": admissible}
        results.append(result)
        print(json.dumps({"ordinal": ordinal, "archive_bytes": result["archive_bytes"],
                          "code_files": files, "code_member_bytes": bytes_total,
                          "code_projection_admissible": admissible}), flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-source-archive-validation-r1/v1",
               "candidate_sha256": CANDIDATE_SHA256,
               "source_rule": "Only exact failed-commit .py/.java regular files <=1 MiB each; <=64 MiB total per case; no path escape; no gold input",
               "gold_opened": False, "model_calls": 0, "results": results}
    encoded = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    target = args.archives / "SOURCE-ARCHIVES-VALIDATED-R1.json"
    fd = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"receipt_sha256": hashlib.sha256(encoded).hexdigest(),
                      "admissible": sum(row["code_projection_admissible"] for row in results)}), flush=True)


if __name__ == "__main__":
    main()
