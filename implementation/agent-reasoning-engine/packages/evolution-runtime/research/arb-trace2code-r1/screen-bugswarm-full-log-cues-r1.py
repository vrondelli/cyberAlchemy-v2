#!/usr/bin/env python3
"""Seal source-only filename cues from the exposed BugSwarm failure logs.

This script deliberately has no evaluator input or gold-path dependency.
The output is a development candidate list, not a fresh benchmark prediction.
"""

from __future__ import annotations

import argparse
from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re


CANDIDATE_SHA = "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"
PREFLIGHT_SHA = "aab056dd6156051b9807d2e0c5b171310a92323899f9570842ee18a5adb98710"
QUERIES_SHA = "4dafeef345483b050df368efc6f3ec636b0b1bca5681950c08ab5da5846ce8e3"
NORMALIZED_LOG_19_SHA = "4fcf8cbf0d042f5ff373804317786d5fc7312b9c0856fa7de5d0ff4ea130961d"
FILENAME = re.compile(r"(?<![A-Za-z0-9_])[/A-Za-z0-9_$.-]+\.(?:py|java)\b", re.I)
TOP_K = 10


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def is_test(path: str) -> bool:
    parts = PurePosixPath(path).parts
    basename = parts[-1].lower()
    return any(part.lower() in {"test", "tests", "testing"} for part in parts[:-1]) or (
        basename.startswith("test_") or basename.endswith("_test.py")
        or basename.endswith("_test.java")
    )


def resolve_cues(log: str, files: list[str]) -> tuple[list[str], int]:
    by_basename: dict[str, list[str]] = defaultdict(list)
    for path in files:
        if not is_test(path):
            by_basename[PurePosixPath(path).name.lower()].append(path)
    counts: dict[str, tuple[int, int]] = {}
    tokens = 0
    for match in FILENAME.finditer(log):
        tokens += 1
        token = match.group().replace("\\", "/").lower()
        options = by_basename.get(PurePosixPath(token).name, [])
        suffix = [path for path in options if token.endswith(path.lower()) or path.lower().endswith(token)]
        resolved = suffix if len(suffix) == 1 else options if len(options) == 1 else []
        for path in resolved:
            count, first = counts.get(path, (0, match.start()))
            counts[path] = (count + 1, first)
    ordered = sorted(counts, key=lambda path: (-counts[path][0], counts[path][1], path))
    return ordered[:TOP_K], tokens


def exclusive_write(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive-root", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    root, output = args.archive_root, args.output_dir
    source = root / "source-only-r1"
    run = root / "vps-run-r1"
    candidate = root / "METADATA-CANDIDATE-24-R1.json"
    preflight = source / "CANDIDATE-PREFLIGHT-R1.json"
    queries = source / "QUERIES.jsonl"
    if (digest(candidate) != CANDIDATE_SHA or digest(preflight) != PREFLIGHT_SHA
            or digest(queries) != QUERIES_SHA):
        raise SystemExit("source-input-pin-drift")
    if not output.is_dir() or any(output.iterdir()):
        raise SystemExit("output-dir-missing-or-not-empty")
    selected = json.loads(candidate.read_bytes())["selected"]
    checks = json.loads(preflight.read_bytes())["results"]
    query_rows = [json.loads(line) for line in queries.read_text().splitlines()]
    if not (len(selected) == len(checks) == len(query_rows) == 24):
        raise SystemExit("source-denominator-drift")
    rows = []
    ranking_hashes = []
    for ordinal, (case, check, query) in enumerate(zip(selected, checks, query_rows), 1):
        if (not (case["ordinal"] == check["ordinal"] == ordinal)
                or not (case["image_tag"] == check["image_tag"] == query["id"])
                or not (case["repo"] == check["repo"] == query["repo"])
                or case["failure_commit"] != query["base_commit"]):
            raise SystemExit(f"source-identity-drift:{ordinal}")
        ranking_path = run / "are-rankings-r1" / f"ARE-RANKING-{ordinal:02d}.json"
        ranking = json.loads(ranking_path.read_bytes())
        if (ranking["id"] != case["image_tag"] or ranking["base_commit"] != case["failure_commit"]
                or ranking["query_sha256"] != query["query_sha256"]
                or len(ranking["ranked_files"]) != ranking["candidate_count"]
                or len(set(ranking["ranked_files"])) != ranking["candidate_count"]):
            raise SystemExit(f"ranking-identity-drift:{ordinal}")
        ranking_hashes.append(digest(ranking_path))
        log_path = source / f"HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{case['failure_job_id']}.txt"
        expected_log = NORMALIZED_LOG_19_SHA if ordinal == 19 else check["log_sha256"]
        if digest(log_path) != expected_log:
            raise SystemExit(f"log-pin-drift:{ordinal}")
        cues, token_count = resolve_cues(log_path.read_text(errors="replace"), ranking["ranked_files"])
        rows.append({"ordinal": ordinal, "id": case["image_tag"], "repo": case["repo"],
                     "language": case["language"], "base_commit": case["failure_commit"],
                     "log_sha256": expected_log, "ranking_sha256": ranking_hashes[-1],
                     "filename_tokens": token_count, "cue_paths": cues,
                     "cue_count": len(cues), "gold_opened": False})
    encoded = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)).encode()
    seal = {"schema_version": "are.g01-bugswarm-full-log-cues-source-r1/v1",
            "posture": "exposed source-only development; HTTP log payloads transport-provisional",
            "rule": "unique source-file basename or exact suffix; exclude test files; frequency, first offset, path order; top 10",
            "candidate_sha256": CANDIDATE_SHA, "preflight_sha256": PREFLIGHT_SHA,
            "queries_sha256": QUERIES_SHA, "cases": len(rows), "max_cues": TOP_K,
            "cue_rows_sha256": hashlib.sha256(encoded).hexdigest(),
            "ranking_sha256": ranking_hashes, "gold_opened": False, "model_calls": 0}
    seal_data = (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode()
    exclusive_write(output / "SOURCE-CUES.jsonl", encoded)
    exclusive_write(output / "SOURCE-SEAL.json", seal_data)
    print(json.dumps({"cases": len(rows), "with_cues": sum(bool(row["cue_paths"]) for row in rows),
                      "cue_rows_sha256": seal["cue_rows_sha256"],
                      "seal_sha256": hashlib.sha256(seal_data).hexdigest()}))


if __name__ == "__main__":
    main()
