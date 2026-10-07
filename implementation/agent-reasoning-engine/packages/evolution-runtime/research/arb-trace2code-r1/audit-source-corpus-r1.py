#!/usr/bin/env python3
"""Validate isolated ARB source chunks without opening benchmark labels."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    args = parser.parse_args()
    root = args.source.resolve(strict=True)
    receipt_path = root / "SOURCE-ISOLATION-RECEIPT.json"
    receipt = json.loads(receipt_path.read_text())
    if receipt.get("schema") != "are.arb-trace2code-source-isolation/v1":
        raise SystemExit("missing pinned isolation receipt")
    expected = {item["path"]: item for item in receipt["files"]}
    actual = {str(path.relative_to(root)) for path in root.rglob("*") if path.is_file()}
    if actual != set(expected) | {receipt_path.name}:
        raise SystemExit("source directory contains missing or unexpected files")
    for relative, item in expected.items():
        path = root / relative
        if path.stat().st_size != item["bytes"] or sha256_file(path) != item["sha256"]:
            raise SystemExit(f"source file hash mismatch: {relative}")

    manifest_path = root / "corpus/v2_trace2code/corpus_manifest.jsonl"
    entries = [json.loads(line) for line in manifest_path.read_text().splitlines() if line.strip()]
    if len(entries) != 98:
        raise SystemExit("corpus manifest does not contain 98 snapshots")
    seen_snapshots = set()
    repo_counts = collections.Counter()
    total_rows = 0
    unique_file_entries = 0
    empty_file_text_rows = 0
    for entry in entries:
        repo, commit = entry["repo"], entry["base_commit"]
        if (repo, commit) in seen_snapshots:
            raise SystemExit("duplicate snapshot")
        seen_snapshots.add((repo, commit))
        relative = entry["chunks_path"].removeprefix("data/")
        if relative not in expected or not relative.startswith("corpus/v2_trace2code/"):
            raise SystemExit("missing or unsafe declared chunk path")
        paths = set()
        rows = 0
        with (root / relative).open(encoding="utf-8") as stream:
            for line in stream:
                row = json.loads(line)
                rows += 1
                if row.get("repo") != repo or row.get("base_commit") != commit:
                    raise SystemExit("chunk snapshot identity mismatch")
                path = row.get("path")
                if not isinstance(path, str) or not path or path.startswith("/") or ".." in pathlib.PurePosixPath(path).parts:
                    raise SystemExit("unsafe or missing chunk file path")
                text = row.get("text")
                if not isinstance(text, str):
                    raise SystemExit("non-string chunk text")
                if not text:
                    if row.get("kind") != "file":
                        raise SystemExit("empty non-file chunk text")
                    empty_file_text_rows += 1
                start, end = row.get("start_line"), row.get("end_line")
                if not isinstance(start, int) or not isinstance(end, int) or start < 1 or end < start:
                    raise SystemExit("invalid chunk line interval")
                paths.add(path)
        if rows != entry["chunk_count"] or len(paths) != entry["file_count"]:
            raise SystemExit(f"snapshot count mismatch: {repo} {commit}")
        repo_counts[repo] += 1
        total_rows += rows
        unique_file_entries += len(paths)
    release = json.loads((root / "release_manifest.json").read_text())
    if total_rows != release["corpus_chunk_count"] or unique_file_entries != release["corpus_file_count"]:
        raise SystemExit("aggregate source counts differ from release manifest")
    result = {
        "schema": "are.arb-trace2code-source-audit/v1",
        "isolation_receipt_sha256": sha256_file(receipt_path),
        "snapshot_count": len(entries),
        "chunk_rows": total_rows,
        "snapshot_file_entries": unique_file_entries,
        "empty_file_text_rows": empty_file_text_rows,
        "repo_snapshot_counts": dict(sorted(repo_counts.items())),
        "all_snapshot_identities_and_paths_valid": True,
        "benchmark_labels_opened": False,
    }
    output = root / "SOURCE-CORPUS-AUDIT.json"
    if output.exists():
        raise SystemExit("refusing to overwrite existing audit")
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
