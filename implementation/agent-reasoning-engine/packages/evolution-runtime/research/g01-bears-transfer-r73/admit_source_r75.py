#!/usr/bin/env python3
"""One-shot bounded exact-commit Java source admission for Bears."""

import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import tarfile
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SOURCE_SHA = "b4a07e64c2cbe4fc018ce70efce5ad728945e88e9150ea8d5241b7c754f186b2"
HEAD_SHA = "0c60be52c1e4197c8297cf467ab569be96812044b3224e7984032c3b9b2fc97a"
MAX_COMPRESSED = 128 * 1024 * 1024
MAX_MEMBERS = 100000
MAX_DECLARED = 512 * 1024 * 1024
MAX_JAVA_FILE = 1024 * 1024
MAX_JAVA_TOTAL = 64 * 1024 * 1024


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def save_bytes(path, data):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def download(url):
    req = Request(url, method="GET", headers={"User-Agent": "ARE-G01-Bears-r75/1"})
    try:
        with urlopen(req, timeout=120) as reply:
            data = reply.read(MAX_COMPRESSED + 1)
            return reply.status, data, reply.geturl(), None
    except HTTPError as error:
        return error.code, error.read(65536), error.geturl(), f"http-{error.code}"
    except (URLError, TimeoutError, OSError) as error:
        return None, b"", None, type(error).__name__


def audit_archive(data, commit):
    if not data or len(data) > MAX_COMPRESSED:
        return None, "compressed-cap"
    root = None
    seen = set()
    members = 0
    declared = 0
    java_bytes = 0
    tree = hashlib.sha256()
    try:
        with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as archive:
            for member in archive:
                members += 1
                declared += member.size
                if members > MAX_MEMBERS or declared > MAX_DECLARED:
                    return None, "tar-cap"
                parts = PurePosixPath(member.name).parts
                if not parts or ".." in parts or "\\" in member.name or member.name.startswith("/"):
                    return None, "unsafe-path"
                if root is None:
                    root = parts[0]
                    if not root.endswith(commit):
                        return None, "root-commit-mismatch"
                if parts[0] != root:
                    return None, "mixed-roots"
                if not member.isfile() or len(parts) < 2 or not member.name.endswith(".java"):
                    continue
                if member.size > MAX_JAVA_FILE:
                    continue
                rel = PurePosixPath(*parts[1:]).as_posix()
                if rel in seen:
                    return None, "duplicate-java-path"
                seen.add(rel)
                stream = archive.extractfile(member)
                if stream is None:
                    return None, "missing-java-member"
                content = stream.read(MAX_JAVA_FILE + 1)
                if len(content) != member.size:
                    return None, "java-member-size"
                java_bytes += len(content)
                if java_bytes > MAX_JAVA_TOTAL:
                    return None, "java-total-cap"
                tree.update(rel.encode() + b"\0" + hashlib.sha256(content).digest())
    except (tarfile.TarError, OSError, EOFError):
        return None, "invalid-tar"
    if not seen:
        return None, "no-java-source"
    return {"archive_root": root, "members": members, "declared_bytes": declared,
            "java_files": len(seen), "java_bytes": java_bytes,
            "java_scan_sha256": tree.hexdigest()}, None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--head", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (args.output.exists() or sha(args.source.read_bytes()) != SOURCE_SHA
            or sha(args.head.read_bytes()) != HEAD_SHA):
        raise SystemExit("output-or-input-drift")
    source = json.loads(args.source.read_bytes())["rows"]
    heads = json.loads(args.head.read_bytes())["results"]
    if len(source) != 37 or len(heads) != 37:
        raise SystemExit("population-drift")
    args.output.mkdir(parents=True, mode=0o700)
    archive_root = args.output / "source-only-archives"
    archive_root.mkdir(mode=0o700)
    save(args.output / "SOURCE-FREEZE.json", {
        "schema_version": "are.g01-bears-r75-source-freeze/v1",
        "source_sha256": SOURCE_SHA, "head_sha256": HEAD_SHA,
        "protocol_sha256": sha(Path(__file__).with_name("R75-SOURCE-PROTOCOL.md").read_bytes()),
        "script_sha256": sha(Path(__file__).read_bytes()),
        "maximum_compressed_bytes": MAX_COMPRESSED, "maximum_members": MAX_MEMBERS,
        "maximum_declared_bytes": MAX_DECLARED, "maximum_java_file_bytes": MAX_JAVA_FILE,
        "maximum_java_projection_bytes": MAX_JAVA_TOTAL,
        "minimum_admitted_repositories": 24, "automatic_retries": 0,
        "gold_values_used": False, "model_calls": 0})
    results = []
    admitted = []
    for row, head in zip(source, heads, strict=True):
        ordinal = row["ordinal"]
        if head["ordinal"] != ordinal or head["repo"] != row["repo"] or head["buggy_commit"] != row["buggy_commit"]:
            raise SystemExit("head-identity-drift")
        if len(admitted) >= 24:
            break
        url = head["url"]
        status, body, final_url, error = (None, b"", None, "head-not-200")
        audit = None
        if head["status"] == 200:
            status, body, final_url, error = download(url)
            if status == 200 and error is None and final_url == url:
                audit, error = audit_archive(body, row["buggy_commit"])
            elif error is None:
                error = "status-or-redirect"
        accepted = audit is not None and error is None
        archive_name = f"{ordinal:02d}-{row['buggy_commit']}.tar.gz" if accepted else None
        if accepted:
            save_bytes(archive_root / archive_name, body)
            admitted.append({"ordinal": ordinal, "bug_id": row["bug_id"],
                             "repo": row["repo"], "buggy_commit": row["buggy_commit"],
                             "archive": archive_name, "archive_sha256": sha(body), **audit})
        result = {"ordinal": ordinal, "bug_id": row["bug_id"], "repo": row["repo"],
                  "head_status": head["status"], "get_status": status,
                  "get_bytes": len(body), "get_sha256": sha(body),
                  "accepted": accepted, "reason": error, "archive": archive_name,
                  "audit": audit, "gold_values_used": False, "model_calls": 0}
        save(args.output / f"CASE-{ordinal:02d}.json", result)
        results.append(result)
        print(json.dumps({"ordinal": ordinal, "accepted": accepted,
                          "reason": error, "get_bytes": len(body)}), flush=True)
    save(args.output / "SOURCE-RESULT.json", {
        "schema_version": "are.g01-bears-r75-source-result/v1",
        "attempted": len(results), "admitted": len(admitted),
        "target_24_admitted": len(admitted) == 24, "results": results,
        "selected": admitted, "gold_values_used": False,
        "model_calls": 0, "scores_computed": False})
    print(json.dumps({"attempted": len(results), "admitted": len(admitted),
                      "target_24_admitted": len(admitted) == 24}), flush=True)


if __name__ == "__main__":
    main()
