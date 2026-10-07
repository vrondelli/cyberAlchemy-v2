#!/usr/bin/env python3
"""Validate graph-development r2 source archives and code-only projection bounds."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import tarfile


CANDIDATE_SHA = "c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332"
ACQUISITION_SHA = "4c3b553195a9edd3c5d61457592a8c75ef5d203c130cb70382012b529b054a68"
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
    parser.add_argument("--candidate", required=True, type=Path)
    parser.add_argument("--archives", required=True, type=Path)
    args = parser.parse_args()
    receipt_path = args.archives / "SOURCE-ARCHIVES-R2.json"
    if (digest(args.candidate) != CANDIDATE_SHA or not args.archives.is_dir()
            or digest(receipt_path) != ACQUISITION_SHA):
        raise SystemExit("candidate-or-acquisition-pin-drift")
    cases = json.loads(args.candidate.read_bytes())["development"]
    acquired = json.loads(receipt_path.read_bytes())["results"]
    if len(cases) != len(acquired) or len(cases) != 24:
        raise SystemExit("denominator-drift")
    results = []
    for ordinal, (row, source) in enumerate(zip(cases, acquired), 1):
        repo, commit = row["repo"], row["failure_commit"]
        if (source["ordinal"] != ordinal or source["repo"] != repo
                or source["commit"] != commit or not source["admissible"]):
            raise SystemExit("archive-identity-or-admission-drift")
        name = source["archive"]
        archive_path = args.archives / name
        if (name != f"{ordinal:02d}-{repo.replace('/', '-')}-{commit}.tar.gz"
                or not archive_path.is_file() or archive_path.stat().st_mode & 0o077
                or digest(archive_path) != source["archive_sha256"]):
            raise SystemExit("archive-path-hash-or-permission-drift")
        root = f"{repo.replace('/', '-')}-{commit[:7]}"
        extension = ".py" if row["language"] == "Python" else ".java"
        files, bytes_total, skipped_large, unsafe = 0, 0, 0, False
        with tarfile.open(archive_path, "r:gz") as archive:
            for member in archive:
                parts = PurePosixPath(member.name).parts
                if (not parts or parts[0] != root or ".." in parts
                        or "\\" in member.name or member.name.startswith("/")):
                    unsafe = True
                    break
                if not member.isfile() or len(parts) < 2 or not member.name.endswith(extension):
                    continue
                if member.size > MAX_FILE_BYTES:
                    skipped_large += 1
                    continue
                files += 1
                bytes_total += member.size
        valid = not unsafe and files > 0 and bytes_total <= MAX_PROJECTED_BYTES
        results.append({"ordinal": ordinal, "repo": repo, "commit": commit,
                        "archive": name, "archive_bytes": archive_path.stat().st_size,
                        "archive_sha256": source["archive_sha256"], "code_files": files,
                        "code_member_bytes": bytes_total,
                        "skipped_over_1m_code_files": skipped_large,
                        "unsafe_path": unsafe, "code_projection_admissible": valid})
        print(json.dumps({"ordinal": ordinal, "code_files": files,
                          "code_bytes": bytes_total, "projection_admissible": valid}), flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-source-validation-r2/v1",
               "candidate_sha256": CANDIDATE_SHA,
               "acquisition_sha256": ACQUISITION_SHA,
               "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
               "source_rule": "Exact failed-commit .py/.java regular files <=1 MiB each; <=64 MiB total per case; no path escape; no gold input",
               "gold_opened": False, "reserved_confirmation_opened": False,
               "model_calls": 0, "results": results}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    target = args.archives / "SOURCE-ARCHIVES-VALIDATED-R2.json"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "admissible": sum(row["code_projection_admissible"] for row in results)}),
          flush=True)


if __name__ == "__main__":
    main()
