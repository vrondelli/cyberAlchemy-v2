#!/usr/bin/env python3
"""Acquire bounded, exact failed-commit source archives for graph development r2."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import tarfile
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


CANDIDATE_SHA = "c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332"
MAX_ARCHIVE_BYTES = 200 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    if sha(args.candidate.read_bytes()) != CANDIDATE_SHA or not args.output_dir.is_dir():
        raise SystemExit("candidate-pin-drift-or-output-dir-missing")
    cases = json.loads(args.candidate.read_bytes())["development"]
    if len(cases) != 24 or len({row["repo"].lower() for row in cases}) != 24:
        raise SystemExit("candidate-denominator-drift")
    results = []
    for ordinal, row in enumerate(cases, 1):
        repo, commit = row["repo"], row["failure_commit"]
        if repo.count("/") != 1 or len(commit) != 40:
            raise SystemExit("candidate-identity-drift")
        filename = f"{ordinal:02d}-{repo.replace('/', '-')}-{commit}.tar.gz"
        target = args.output_dir / filename
        url = f"https://codeload.github.com/{repo}/legacy.tar.gz/{commit}"
        if target.exists():
            blob, status = target.read_bytes(), "preexisting"
        else:
            try:
                with urlopen(Request(url, headers={"User-Agent": "ARE-G01-graph-dev-source/2"}),
                             timeout=120) as stream:
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
        results.append({"ordinal": ordinal, "repo": repo, "commit": commit,
                        "status": status, "admissible": valid, "archive": filename,
                        "archive_bytes": len(blob), "archive_sha256": sha(blob),
                        "tar_root_matches_commit_prefix": root_ok,
                        "members": member_count, "regular_member_bytes": regular_bytes})
        print(json.dumps({"ordinal": ordinal, "archive_bytes": len(blob),
                          "root_ok": root_ok, "regular_bytes": regular_bytes}), flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-source-archives-r2/v1",
               "candidate_sha256": CANDIDATE_SHA,
               "script_sha256": sha(Path(__file__).read_bytes()),
               "provenance": "GitHub codeload HTTPS at exact failing commits",
               "gold_opened": False, "reserved_confirmation_opened": False,
               "model_calls": 0, "results": results}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    target = args.output_dir / "SOURCE-ARCHIVES-R2.json"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"receipt_sha256": sha(data),
                      "admissible": sum(row["admissible"] for row in results)}), flush=True)


if __name__ == "__main__":
    main()
