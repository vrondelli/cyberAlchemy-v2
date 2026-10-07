#!/usr/bin/env python3
"""Materialize only frozen, eligible buggy-commit source files; never gold."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import subprocess
import tarfile


FREEZE_SHA256 = "888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33"
MAX_FILE_BYTES = 1024 * 1024
MAX_INDEX_BYTES = 64 * 1024 * 1024


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
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.freeze) != FREEZE_SHA256:
        raise SystemExit("output exists or freeze drift")
    rows = json.loads(args.freeze.read_text())["selected"]
    if len(rows) != 24:
        raise SystemExit("cohort denominator drift")
    args.output.mkdir(parents=True)
    records = []
    for row in rows:
        repo, bugid, commit = row["repo"], row["bugid"], row["buggy_commit_id"]
        archive_path = args.snapshots / f"{repo}-{commit}.tar.gz"
        if not archive_path.is_file() or archive_path.stat().st_size > 100_000_000:
            raise SystemExit(f"source archive missing or too large: {repo}/{bugid}")
        root = args.output / f"{repo}-{bugid}-{commit}"
        root.mkdir()
        members = {}
        with tarfile.open(archive_path, "r:gz") as archive:
            for member in archive:
                parts = pathlib.PurePosixPath(member.name).parts
                if not parts or not parts[0].endswith(commit) or ".." in parts or "\\" in member.name:
                    raise SystemExit(f"archive path or commit drift: {repo}/{bugid}")
                if len(parts) < 2 or ".git" in parts or not member.isfile() or member.size > MAX_FILE_BYTES:
                    continue
                rel = pathlib.PurePosixPath(*parts[1:]).as_posix()
                if rel in members:
                    raise SystemExit(f"duplicate source path: {repo}/{bugid} {rel}")
                stream = archive.extractfile(member)
                if stream is None:
                    raise SystemExit("missing source stream")
                content = stream.read()
                if b"\0" in content[:8192]:
                    continue
                members[rel] = content
        if not members or sum(len(content) for content in members.values()) > MAX_INDEX_BYTES:
            raise SystemExit(f"source index admission failed: {repo}/{bugid}")
        tree_digest = hashlib.sha256()
        for rel, content in sorted(members.items()):
            target = root.joinpath(*pathlib.PurePosixPath(rel).parts)
            if not target.resolve().is_relative_to(root.resolve()):
                raise SystemExit("projected path escape")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
            tree_digest.update(rel.encode() + b"\0" + hashlib.sha256(content).digest())
        subprocess.run(["git", "init", "-q", str(root)], check=True, timeout=30)
        subprocess.run(["git", "add", "-f", "--all"], cwd=root, check=True, timeout=120)
        tracked = subprocess.run(["git", "ls-files", "-z"], cwd=root, check=True,
                                 capture_output=True, timeout=30).stdout.split(b"\0")
        if len([item for item in tracked if item]) != len(members):
            raise SystemExit(f"git-index file count drift: {repo}/{bugid}")
        records.append({"case": f"{repo}/{bugid}", "repo": repo, "bugid": bugid,
                        "commit": commit, "archive_sha256": digest(archive_path),
                        "projected_files": len(members),
                        "projected_bytes": sum(len(content) for content in members.values()),
                        "projected_tree_sha256": tree_digest.hexdigest(),
                        "root": str(root)})
        print(json.dumps({"case": f"{repo}/{bugid}", "projected_files": len(members),
                          "projected_bytes": records[-1]["projected_bytes"]}), flush=True)
    receipt = {"schema": "are.g01-bugsinpy-source-projection-r1/v1",
               "freeze_sha256": FREEZE_SHA256, "cases": len(records),
               "records": records, "gold_opened": False, "fixed_output_opened": False}
    (args.output / "SOURCE-PROJECTION-RECEIPT.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"cases": len(records), "receipt_sha256": digest(
        args.output / "SOURCE-PROJECTION-RECEIPT.json")}, sort_keys=True))


if __name__ == "__main__":
    main()
