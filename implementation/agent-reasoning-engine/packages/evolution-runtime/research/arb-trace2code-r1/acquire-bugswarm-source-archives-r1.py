#!/usr/bin/env python3
"""Acquire bounded exact failing GitHub source archives for a sealed candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import tarfile
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


CANDIDATE_SHA256 = "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"
MAX_ARCHIVE_BYTES = 100 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    if sha(args.candidate.read_bytes()) != CANDIDATE_SHA256 or not args.output_dir.is_dir():
        raise SystemExit("candidate-pin-or-output-dir-drift")
    rows = json.loads(args.candidate.read_bytes())["selected"]
    if len(rows) != 24:
        raise SystemExit("candidate-denominator-drift")
    results = []
    for row in rows:
        ordinal, repo, commit = row["ordinal"], row["repo"], row["failure_commit"]
        if ordinal != len(results) + 1 or repo.count("/") != 1 or len(commit) != 40:
            raise SystemExit("candidate-order-or-identity-drift")
        filename = f"{ordinal:02d}-{repo.replace('/', '-')}-{commit}.tar.gz"
        target = args.output_dir / filename
        url = f"https://codeload.github.com/{repo}/legacy.tar.gz/{commit}"
        if target.exists():
            blob = target.read_bytes()
            status = "preexisting"
        else:
            try:
                with urlopen(Request(url, headers={"User-Agent": "ARE-G01-BugSwarm-source/1"}), timeout=90) as stream:
                    blob = stream.read(MAX_ARCHIVE_BYTES + 1)
                    status = str(stream.status)
            except (HTTPError, URLError, TimeoutError) as error:
                results.append({"ordinal": ordinal, "repo": repo, "commit": commit,
                                "status": type(error).__name__, "admissible": False})
                print(json.dumps({"ordinal": ordinal, "status": type(error).__name__}), flush=True)
                continue
        if len(blob) > MAX_ARCHIVE_BYTES or not blob.startswith(b"\x1f\x8b"):
            results.append({"ordinal": ordinal, "repo": repo, "commit": commit,
                            "status": "size-or-gzip-denial", "admissible": False,
                            "archive_bytes": len(blob)})
            print(json.dumps({"ordinal": ordinal, "status": "size-or-gzip-denial"}), flush=True)
            continue
        if not target.exists():
            fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "wb") as stream:
                stream.write(blob)
        try:
            with tarfile.open(target, "r:gz") as archive:
                members = archive.getmembers()
                roots = {member.name.split("/", 1)[0] for member in members}
                expected = f"{repo.replace('/', '-')}-{commit[:7]}"
                root_ok = roots == {expected}
                member_count = len(members)
                regular_bytes = sum(member.size for member in members if member.isfile())
        except tarfile.TarError:
            root_ok, member_count, regular_bytes = False, 0, 0
        valid = root_ok and member_count > 1 and regular_bytes > 0
        result = {"ordinal": ordinal, "repo": repo, "commit": commit,
                  "status": status, "admissible": valid, "archive": filename,
                  "archive_bytes": len(blob), "archive_sha256": sha(blob),
                  "tar_root_matches_commit_prefix": root_ok,
                  "members": member_count, "regular_member_bytes": regular_bytes}
        results.append(result)
        print(json.dumps({"ordinal": ordinal, "archive_bytes": len(blob),
                          "tar_root_matches_commit_prefix": root_ok,
                          "regular_member_bytes": regular_bytes}), flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-source-archive-acquisition-r1/v1",
               "candidate_sha256": CANDIDATE_SHA256,
               "provenance": "GitHub codeload HTTPS, exact failed commit URLs",
               "gold_opened": False, "model_calls": 0, "results": results}
    encoded = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    output = args.output_dir / "SOURCE-ARCHIVES-R1.json"
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"receipt_sha256": sha(encoded),
                      "admissible": sum(row["admissible"] for row in results)}), flush=True)


if __name__ == "__main__":
    main()
