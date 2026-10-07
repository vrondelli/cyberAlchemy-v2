#!/usr/bin/env python3
"""Source-only Java class-stem cues from full exposed BugSwarm failure logs."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
OUTPUT = ARCHIVE / "exposed-java-class-stems-r3"
SOURCE_CUES_SHA = "6b2a645fd525fe96b07acde1baa4b52a588a9af84e0718dcc8eeb8a230b93734"
TOKEN = re.compile(r"(?<![A-Za-z0-9_])[A-Z][A-Za-z0-9_]{4,}\b")
STOP = {"exception", "error", "string", "object", "integer", "boolean", "system",
        "thread", "runtime", "assertion", "failure", "maven", "gradle", "java"}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def is_test(path: str) -> bool:
    parts = PurePosixPath(path).parts
    stem = PurePosixPath(path).stem.lower()
    return any(part.lower() in {"test", "tests", "testing"} for part in parts[:-1]) or (
        stem.startswith("test") or stem.endswith("test") or stem.endswith("tests"))


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    source_cues = ARCHIVE / "exposed-full-log-cues-r1" / "SOURCE-CUES.jsonl"
    if digest(source_cues) != SOURCE_CUES_SHA or OUTPUT.exists():
        raise SystemExit("input-pin-drift-or-output-exists")
    prior = [json.loads(line) for line in source_cues.read_text().splitlines()]
    if len(prior) != 24:
        raise SystemExit("denominator-drift")
    rows = []
    for ordinal, row in enumerate(prior, 1):
        if row["ordinal"] != ordinal:
            raise SystemExit(f"ordinal-drift:{ordinal}")
        ranking_path = ARCHIVE / "vps-run-r1" / "are-rankings-r1" / f"ARE-RANKING-{ordinal:02d}.json"
        ranking = json.loads(ranking_path.read_bytes())
        if (ranking["id"] != row["id"] or ranking["base_commit"] != row["base_commit"]
                or digest(ranking_path) != row["ranking_sha256"]):
            raise SystemExit(f"ranking-drift:{ordinal}")
        if row["language"] != "Java":
            rows.append({"ordinal": ordinal, "id": row["id"], "language": row["language"],
                         "cue_paths": [], "matched_source_stems": 0, "gold_opened": False})
            continue
        candidate = json.loads((ARCHIVE / "METADATA-CANDIDATE-24-R1.json").read_bytes())["selected"][ordinal - 1]
        if candidate["image_tag"] != row["id"] or candidate["ordinal"] != ordinal:
            raise SystemExit(f"candidate-drift:{ordinal}")
        log_path = ARCHIVE / "source-only-r1" / (
            f"HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{candidate['failure_job_id']}.txt")
        if digest(log_path) != row["log_sha256"]:
            raise SystemExit(f"log-drift:{ordinal}")
        stems: dict[str, list[str]] = {}
        for path in ranking["ranked_files"]:
            if path.endswith(".java") and not is_test(path):
                stem = PurePosixPath(path).stem.lower()
                stems.setdefault(stem, []).append(path)
        counts: dict[str, tuple[int, int]] = {}
        for match in TOKEN.finditer(log_path.read_text(errors="replace")):
            stem = match.group().lower()
            paths = stems.get(stem, [])
            if stem in STOP or len(paths) != 1:
                continue
            path = paths[0]
            number, first = counts.get(path, (0, match.start()))
            counts[path] = (number + 1, first)
        ordered = sorted(counts, key=lambda path: (-counts[path][0], counts[path][1], path))
        rows.append({"ordinal": ordinal, "id": row["id"], "language": "Java",
                     "cue_paths": ordered[:10], "matched_source_stems": len(ordered),
                     "gold_opened": False})
    data = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)).encode()
    seal = {"schema_version": "are.g01-bugswarm-java-class-stem-source-r3/v1",
            "posture": "source-only screen on already-exposed cases; not fresh confirmation",
            "rule": "unique non-test Java source basename stem appearing as CamelCase token in full failure log; frequency, first offset, path; top 10",
            "source_cues_sha256": SOURCE_CUES_SHA, "cases": len(rows),
            "java_cases": sum(row["language"] == "Java" for row in rows),
            "source_rows_sha256": hashlib.sha256(data).hexdigest(),
            "gold_opened": False, "model_calls": 0}
    OUTPUT.mkdir(mode=0o700)
    exclusive(OUTPUT / "SOURCE-CUES.jsonl", data)
    seal_data = (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode()
    exclusive(OUTPUT / "SOURCE-SEAL.json", seal_data)
    print(json.dumps({"cases": len(rows), "java_with_cues": sum(
        row["language"] == "Java" and bool(row["cue_paths"]) for row in rows),
        "source_rows_sha256": seal["source_rows_sha256"],
        "source_seal_sha256": hashlib.sha256(seal_data).hexdigest()}))


if __name__ == "__main__":
    main()
