#!/usr/bin/env python3
"""Post-confirmation numeric diagnosis of ARE file versus ARB chunk retrieval."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import pathlib
import statistics
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
SOURCE_AUDIT_SHA256 = "1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f"
ARB_SHA256 = "6dabb71899d0b3e8d35dae30658e8f803aec09fd67dbd973a06ad3f67b6d82f7"
ARE_SHA256 = "3a024e28c5abaeefdbc7db0ea056e8bc3a002a0d31f1589b754014f161236bcd"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def mean(rows: list[dict], key: str) -> float | None:
    return statistics.mean(row[key] for row in rows) if rows else None


def summarize(rows: list[dict]) -> dict:
    return {"gold_files": len(rows), "mean_file_bytes": mean(rows, "file_bytes"),
            "median_file_bytes": statistics.median(row["file_bytes"] for row in rows) if rows else None,
            "mean_size_percentile": mean(rows, "size_percentile"),
            "mean_chunk_count": mean(rows, "chunk_count"),
            "mean_arb_rank": mean(rows, "arb_rank"), "mean_are_rank": mean(rows, "are_rank")}


def snapshot_stats(source: pathlib.Path, entry: dict) -> tuple[dict, list[int]]:
    relative = entry["chunks_path"].removeprefix("data/")
    if not relative.startswith("corpus/v2_trace2code/") or ".." in pathlib.PurePosixPath(relative).parts:
        raise SystemExit("unsafe source path")
    stats = collections.defaultdict(lambda: {"file_bytes": None, "chunk_count": 0})
    for line in (source / relative).read_text().splitlines():
        row = json.loads(line)
        if row["repo"] != entry["repo"] or row["base_commit"] != entry["base_commit"]:
            raise SystemExit("source identity drift")
        item = stats[row["path"]]
        item["chunk_count"] += 1
        if row["kind"] == "file":
            if item["file_bytes"] is not None:
                raise SystemExit("duplicate file chunk")
            item["file_bytes"] = len(str(row.get("text") or "").encode())
    if len(stats) != entry["file_count"] or any(item["file_bytes"] is None for item in stats.values()):
        raise SystemExit("source file count drift")
    return stats, sorted(item["file_bytes"] for item in stats.values())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--arb", type=pathlib.Path, required=True)
    parser.add_argument("--are", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive, source, arb_path, are_path = (path.resolve(strict=True) for path in
                                           (args.archive, args.source, args.arb, args.are))
    if args.output.exists() or tuple(map(sha256_file, (archive, source / "SOURCE-CORPUS-AUDIT.json",
                                                     arb_path, are_path))) != (
            ARCHIVE_SHA256, SOURCE_AUDIT_SHA256, ARB_SHA256, ARE_SHA256):
        raise SystemExit("output exists or input pin drift")
    arb = {row["id"]: row for row in (json.loads(line) for line in arb_path.read_text().splitlines())}
    are = {row["id"]: row for row in (json.loads(line) for line in are_path.read_text().splitlines())}
    if len(arb) != 45 or set(arb) != set(are):
        raise SystemExit("case-set drift")
    manifest = {(row["repo"], row["base_commit"]): row for row in
                (json.loads(line) for line in
                 (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines())}
    cache = {}
    numeric = []
    with tarfile.open(archive, "r:zst") as tar:
        stream = tar.extractfile("./benchmark/v2_trace2code/samples.jsonl")
        if stream is None:
            raise SystemExit("samples missing")
        for line in stream:
            row = json.loads(line)
            if row["repo"] == "gin-gonic/gin":
                continue
            key = (row["repo"], row["base_commit"])
            if key not in cache:
                cache[key] = snapshot_stats(source, manifest[key])
            files, sorted_sizes = cache[key]
            a, r = arb[row["id"]], are[row["id"]]
            if r["status"] != "ranked_all_files" or a["base_commit"] != key[1] or r["base_commit"] != key[1]:
                raise SystemExit("ranked identity drift")
            arb_rank = {path: index for index, path in enumerate(a["rankings"]["edge_failure"], 1)}
            are_rank = {path: index for index, path in enumerate(r["trace_text_ranked_files"], 1)}
            if set(arb_rank) != set(are_rank) or set(arb_rank) != set(files):
                raise SystemExit("candidate universe drift")
            gold = set(row["gold"]["root_cause_files"])
            if not gold or not gold.issubset(files):
                raise SystemExit("gold path drift")
            for path in gold:
                stats = files[path]
                size = stats["file_bytes"]
                numeric.append({"repo": key[0], "case_id": row["id"],
                                "arb_rank": arb_rank[path], "are_rank": are_rank[path],
                                "file_bytes": size, "chunk_count": stats["chunk_count"],
                                "size_percentile": sum(value <= size for value in sorted_sizes) / len(sorted_sizes)})
    if len(numeric) != 59:
        raise SystemExit("gold entry denominator drift")
    groups = {"arb_better": [item for item in numeric if item["arb_rank"] < item["are_rank"]],
              "are_better": [item for item in numeric if item["are_rank"] < item["arb_rank"]],
              "tied": [item for item in numeric if item["arb_rank"] == item["are_rank"]]}
    per_repo = {repo: {group: summarize([item for item in rows if item["repo"] == repo])
                       for group, rows in groups.items()}
                for repo in sorted({item["repo"] for item in numeric})}
    report = {"schema": "are.arb-nongin-file-chunk-gap-diagnostic-r1/v1",
              "posture": "post-confirmation exploratory association; not causal proof or independent claim",
              "archive_sha256": ARCHIVE_SHA256, "source_audit_sha256": SOURCE_AUDIT_SHA256,
              "arb_rankings_sha256": ARB_SHA256, "are_rankings_sha256": ARE_SHA256,
              "cases": len({item["case_id"] for item in numeric}), "gold_files": len(numeric),
              "overall": {group: summarize(rows) for group, rows in groups.items()},
              "per_repo": per_repo, "per_gold_numeric_only": sorted(numeric, key=lambda item: (item["case_id"], item["arb_rank"]))}
    args.output.mkdir(parents=True, exist_ok=False)
    (args.output / "DIAGNOSTIC-AUDIT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "per_gold_numeric_only"}, sort_keys=True))


if __name__ == "__main__":
    main()
