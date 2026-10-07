#!/usr/bin/env python3
"""r66 exact tar-tree admission, keeping passing content evaluator-only."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import tarfile
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

R65_SHA = "6215ab0c9877581554252c0d1e980614fd74262c05ef0fb990c6a84355e46072"
R64_SHA = "877b040f027375c61af9e23666d3429a4af810e08fac29b359d63e7cd35be30e"
MAX_COMPRESSED = 128 * 1024 * 1024
MAX_FILE = 1 * 1024 * 1024
MAX_PROJECTION = 64 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while block := stream.read(1024 * 1024):
            digest.update(block)
    return digest.hexdigest()


def save(path: Path, value: object) -> None:
    data = (json.dumps(value, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def source_path(path: str) -> bool:
    parsed = PurePosixPath(path)
    if parsed.is_absolute() or ".." in parsed.parts or ".git" in parsed.parts or not path.endswith(".py"):
        return False
    parts = [part.lower() for part in parsed.parts]
    base = parts[-1]
    return not (any(part in ("test", "tests", "testing", "testdata", "fixtures", "examples", "docs")
                    for part in parts[:-1]) or base.startswith("test_") or base.endswith("_test.py"))


def download(url: str, path: Path) -> tuple[int, str | None, int]:
    request = Request(url, headers={"User-Agent": "ARE-G01-r66-direct-tree/1"})
    try:
        with urlopen(request, timeout=90) as response:
            status = response.status
            if status != 200:
                return status, None, 0
            digest = hashlib.sha256()
            size = 0
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "wb") as output:
                while block := response.read(1024 * 1024):
                    size += len(block)
                    if size > MAX_COMPRESSED:
                        return status, None, size
                    output.write(block)
                    digest.update(block)
            return status, digest.hexdigest(), size
    except HTTPError as error:
        return error.code, None, 0
    except (URLError, TimeoutError):
        return 0, None, 0


def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def tree(path: Path, commit: str) -> tuple[dict[str, str], int, str | None]:
    blobs = {}
    projected_bytes = 0
    root_name = None
    try:
        with tarfile.open(path, "r:gz") as archive:
            for member in archive:
                name = PurePosixPath(member.name)
                if name.is_absolute() or ".." in name.parts or not name.parts:
                    return {}, 0, "unsafe-tar-path"
                if root_name is None:
                    root_name = name.parts[0]
                    if not root_name.endswith(commit):
                        return {}, 0, "archive-root-commit-mismatch"
                if name.parts[0] != root_name:
                    return {}, 0, "mixed-archive-roots"
                if not member.isfile():
                    continue
                relative = "/".join(name.parts[1:])
                if not relative.endswith(".py"):
                    continue
                if member.size > MAX_FILE:
                    return {}, 0, "python-file-over-1mib"
                projected_bytes += member.size
                if projected_bytes > MAX_PROJECTION:
                    return {}, projected_bytes, "python-projection-over-64mib"
                stream = archive.extractfile(member)
                if stream is None:
                    return {}, projected_bytes, "archive-file-unreadable"
                data = stream.read(MAX_FILE + 1)
                if len(data) != member.size:
                    return {}, projected_bytes, "archive-file-size-mismatch"
                if relative in blobs:
                    return {}, projected_bytes, "duplicate-source-path"
                blobs[relative] = git_blob(data)
    except (tarfile.TarError, OSError, EOFError):
        return {}, 0, "archive-invalid"
    if not blobs:
        return {}, 0, "no-python-source"
    return blobs, projected_bytes, None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--r65", required=True, type=Path)
    parser.add_argument("--r64", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or file_sha(args.r65) != R65_SHA or file_sha(args.r64) != R64_SHA:
        raise SystemExit("output-exists-or-input-drift")
    web = json.loads(args.r65.read_bytes())
    source = json.loads(args.r64.read_bytes())
    provisional = [row for row in web["results"] if row["provisionally_admissible"]]
    by_source = {row["ordinal"]: row for row in source["results"]}
    if len(provisional) != 26 or len(by_source) != 30:
        raise SystemExit("population-drift")
    args.output.mkdir(mode=0o700, parents=True)
    old_dir = args.output / "source-only-failed-archives"
    pass_dir = args.output / "evaluator-only-passed-archives"
    old_dir.mkdir(mode=0o700)
    pass_dir.mkdir(mode=0o700)
    save(args.output / "DIRECT-TREE-FREEZE.json", {
        "schema_version": "are.g01-r66-direct-tree-freeze/v1",
        "r65_sha256": R65_SHA, "r64_sha256": R64_SHA,
        "protocol_sha256": file_sha(Path(__file__).with_name("DIRECT-TREE-PROTOCOL.md")),
        "script_sha256": file_sha(Path(__file__)),
        "cases": 26, "maximum_archive_requests": 52, "automatic_retries": 0,
        "maximum_compressed_bytes_each": MAX_COMPRESSED,
        "maximum_python_file_bytes": MAX_FILE,
        "maximum_python_projection_bytes": MAX_PROJECTION,
        "gold_export_to_source_side": False, "scores_computed": False, "model_calls": 0,
    })
    results = []
    for ordinal, label in enumerate(provisional, 1):
        source_row = by_source[label["source_ordinal"]]
        if (label["repo"] != source_row["repo"] or label["failed_commit"] != source_row["failed_commit"]):
            raise SystemExit("source-label-identity-drift")
        repo, failed, passed = label["repo"], label["failed_commit"], label["passed_commit"]
        paths = {}
        summaries = {}
        for side, commit, directory in (("failed", failed, old_dir), ("passed", passed, pass_dir)):
            archive = directory / f"{ordinal:02d}-{commit}.tar.gz"
            url = f"https://codeload.github.com/{quote(repo, safe='/')}/tar.gz/{quote(commit, safe='')}"
            status, digest, size = download(url, archive)
            blob_map, projected_bytes, reason = ({}, 0, "download-failed")
            if digest is not None:
                blob_map, projected_bytes, reason = tree(archive, commit)
            paths[side] = blob_map
            summaries[side] = {"http_status": status, "archive_sha256": digest,
                               "compressed_bytes": size, "python_files": len(blob_map),
                               "python_bytes": projected_bytes, "reason": reason}
        changed = sorted(path for path, oid in paths["failed"].items()
                         if source_path(path) and paths["passed"].get(path) != oid)
        added = sorted(path for path in paths["passed"] if source_path(path) and path not in paths["failed"])
        reason = next((summaries[side]["reason"] for side in ("failed", "passed")
                       if summaries[side]["reason"]), None)
        if reason is None and (not 1 <= len(changed) <= 3 or added):
            reason = "direct-tree-label-shape"
        if reason is None and changed != label["old_source_paths"]:
            reason = "web-diff-direct-tree-mismatch"
        record = {"ordinal": ordinal, "source_ordinal": label["source_ordinal"],
                  "image_tag": label["image_tag"], "repo": repo,
                  "failed_commit": failed, "passed_commit": passed,
                  "archives": summaries, "direct_old_source_paths": changed,
                  "direct_added_source_paths": added, "web_diff_old_source_paths": label["old_source_paths"],
                  "admissible": reason is None, "reason": reason,
                  "gold_export_to_source_side": False}
        save(args.output / f"EVALUATOR-{ordinal:02d}.json", record)
        results.append(record)
        print(json.dumps({"ordinal": ordinal, "admissible": record["admissible"],
                          "reason": reason, "failed_bytes": summaries["failed"]["compressed_bytes"],
                          "passed_bytes": summaries["passed"]["compressed_bytes"]}), flush=True)
    selected = [row for row in results if row["admissible"]][:24]
    save(args.output / "EVALUATOR-RESULT.json", {
        "schema_version": "are.g01-r66-direct-tree-result/v1", "attempted": len(results),
        "admissible": sum(row["admissible"] for row in results),
        "selected_24": len(selected) == 24, "selected_ordinals": [row["ordinal"] for row in selected],
        "results": results, "gold_export_to_source_side": False,
        "scores_computed": False, "model_calls": 0,
    })
    if len(selected) == 24:
        save(args.output / "SOURCE-SIDE-COHORT.json", {
            "schema_version": "are.g01-r66-source-cohort/v1", "cases": 24,
            "rows": [{"ordinal": n, "image_tag": row["image_tag"], "repo": row["repo"],
                      "failed_commit": row["failed_commit"],
                      "failed_archive_sha256": row["archives"]["failed"]["archive_sha256"],
                      "failed_archive": str(old_dir / f"{row['ordinal']:02d}-{row['failed_commit']}.tar.gz")}
                     for n, row in enumerate(selected, 1)],
            "gold_paths_opened": False, "passing_content_opened": False,
        })


if __name__ == "__main__":
    main()
