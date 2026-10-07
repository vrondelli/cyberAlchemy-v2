#!/usr/bin/env python3
"""Source-only screen of failure-bearing logs and Java behavior excerpts."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
OUTPUT = ARCHIVE / "exposed-java-evidence-r7"
INPUTS = {
    "packets": (ARCHIVE / "exposed-hybrid-r6/PACKETS.jsonl",
                "5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e"),
    "queries": (ARCHIVE / "source-only-r1/QUERIES.jsonl",
                "4dafeef345483b050df368efc6f3ec636b0b1bca5681950c08ab5da5846ce8e3"),
    "sources": (ARCHIVE / "source-only-r1/code-projection-r1/SOURCE-PROJECTION-RECEIPT.json",
                "29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818"),
    "log_cues": (ARCHIVE / "exposed-full-log-cues-r1/SOURCE-CUES.jsonl",
                 "6b2a645fd525fe96b07acde1baa4b52a588a9af84e0718dcc8eeb8a230b93734"),
    "metadata": (ARCHIVE / "METADATA-CANDIDATE-24-R1.json",
                 "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"),
}
ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
TIME = re.compile(r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z\s+")
TOKEN = re.compile(r"[A-Za-z_][A-Za-z_0-9]{2,}")
DECL = re.compile(r"\b(class|interface|enum|public|private|protected|static|void)\b")
STOP = {"the", "and", "for", "with", "from", "this", "that", "file", "error",
        "test", "tests", "run", "failures", "skipped", "time", "elapsed", "java",
        "org", "com", "src", "main", "core", "project", "build", "info", "warning"}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def words(text: str) -> set[str]:
    return {match.group().lower() for match in TOKEN.finditer(text)
            if match.group().lower() not in STOP}


def clean_line(line: str) -> str:
    return TIME.sub("", ANSI.sub("", line)).strip()


def failure_summary(log: str) -> tuple[str, int]:
    candidates: list[tuple[int, int, str]] = []
    for index, raw in enumerate(log.splitlines()):
        line = clean_line(raw)
        if not line or len(line) > 800:
            continue
        low = line.lower()
        if any(noise in low for noise in ("please refer", "for more information", "to see the full",
                                             "help 1", "re-run maven", "deprecated", "skiptests")):
            continue
        score = 0
        if "<<< failure" in low or "<<< error" in low:
            score = 8
        elif "constraintviolation" in low or "exception" in low or "assertionerror" in low:
            score = 7
        elif "build failure" in low or "tests failed" in low:
            score = 6
        elif "[error]" in low and ("»" in line or "failed to execute" in low):
            score = 5
        elif re.search(r"tests run:\s*\d+.*(?:failures|errors):\s*[1-9]", low):
            score = 4
        if score:
            candidates.append((score, index, line))
    chosen: list[tuple[int, str]] = []
    seen: set[str] = set()
    for _, index, line in sorted(candidates, key=lambda row: (-row[0], row[1])):
        key = line.lower()
        if key not in seen:
            chosen.append((index, line[:220]))
            seen.add(key)
        if len(chosen) == 8:
            break
    chosen.sort()
    return "\n".join(line for _, line in chosen)[:1400], len(candidates)


def code_lines(text: str) -> list[tuple[int, str]]:
    result = []
    in_block = False
    for line_number, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if in_block:
            if "*/" in line:
                in_block = False
            continue
        if line.startswith("/*"):
            if "*/" not in line:
                in_block = True
            continue
        if (not line or line.startswith("//") or line.startswith("*")
                or line.startswith("package ") or line.startswith("import ")):
            continue
        result.append((line_number, line))
    return result


def behavior_excerpt(root: Path, relative: str, query_words: set[str]) -> tuple[str, int, int]:
    posix = PurePosixPath(relative)
    if posix.is_absolute() or ".." in posix.parts or ".git" in posix.parts:
        raise SystemExit("unsafe-source-path")
    target = root.joinpath(*posix.parts).resolve(strict=True)
    if not target.is_relative_to(root) or not target.is_file():
        raise SystemExit("source-path-escape-or-missing")
    lines = code_lines(target.read_text(encoding="utf-8", errors="replace"))
    if not lines:
        return "", 1, 0
    ranked = sorted(range(len(lines)), key=lambda index: (
        -len(words(lines[index][1]) & query_words),
        -int(bool(DECL.search(lines[index][1]))), index))
    selected = ranked[0]
    line_number = lines[selected][0]
    snippet = " ".join(line for _, line in lines[selected:selected + 3])
    overlap = len(words(lines[selected][1]) & query_words)
    return re.sub(r"\s+", " ", snippet).strip()[:260], line_number, overlap


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    if OUTPUT.exists():
        raise SystemExit("output-exists")
    data = {}
    for name, (path, expected) in INPUTS.items():
        blob = path.read_bytes()
        if sha(blob) != expected:
            raise SystemExit(f"input-pin-drift:{name}")
        data[name] = json.loads(blob) if name in {"sources", "metadata"} else [
            json.loads(line) for line in blob.splitlines()]
    if (any(len(data[name]) != 24 for name in ("packets", "queries", "log_cues"))
            or len(data["sources"]["records"]) != 24
            or len(data["metadata"]["selected"]) != 24):
        raise SystemExit("denominator-drift")
    source_root = ARCHIVE / "source-only-r1/code-projection-r1"
    rows = []
    for index in range(24):
        packet, query, cue = (data[name][index] for name in ("packets", "queries", "log_cues"))
        source = data["sources"]["records"][index]
        metadata = data["metadata"]["selected"][index]
        ordinal = index + 1
        if (not (packet["ordinal"] == cue["ordinal"] == source["ordinal"]
                 == metadata["ordinal"] == ordinal)
                or not (packet["id"] == query["id"] == cue["id"]
                        == source["image_tag"] == metadata["image_tag"])
                or packet["gold_opened"] or cue["gold_opened"]):
            raise SystemExit(f"identity-drift:{ordinal}")
        if packet["language"] != "Java":
            rows.append({"ordinal": ordinal, "id": packet["id"], "language": "Python",
                         "failure_summary": "", "failure_markers": 0,
                         "candidates": [], "gold_opened": False})
            continue
        log_path = ARCHIVE / "source-only-r1" / (
            f"HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{metadata['failure_job_id']}.txt")
        log_blob = log_path.read_bytes()
        if sha(log_blob) != cue["log_sha256"]:
            raise SystemExit(f"log-drift:{ordinal}")
        summary, marker_count = failure_summary(log_blob.decode(errors="replace"))
        root = (source_root / Path(source["root"]).name).resolve(strict=True)
        if root != Path(source["root"]).resolve(strict=True) or not root.is_relative_to(
                source_root.resolve(strict=True)):
            raise SystemExit(f"source-root-drift:{ordinal}")
        query_words = words(query["query"] + "\n" + summary)
        evidence = []
        for candidate in packet["candidates"]:
            excerpt, line, overlap = behavior_excerpt(root, candidate["path"], query_words)
            evidence.append({"path": candidate["path"], "excerpt": excerpt,
                             "excerpt_start_line": line, "query_overlap": overlap})
        rows.append({"ordinal": ordinal, "id": packet["id"], "language": "Java",
                     "failure_summary": summary, "failure_markers": marker_count,
                     "candidates": evidence, "gold_opened": False})
    blob = ("".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n"
                    for row in rows)).encode()
    stats = {"java_cases": sum(row["language"] == "Java" for row in rows),
             "java_with_failure_markers": sum(row["language"] == "Java" and
                                               row["failure_markers"] > 0 for row in rows),
             "candidate_excerpts": sum(len(row["candidates"]) for row in rows),
             "excerpts_with_query_overlap": sum(item["query_overlap"] > 0
                                                for row in rows for item in row["candidates"]),
             "boilerplate_starts": sum(item["excerpt"].startswith(("package ", "import ", "/*", "*"))
                                       for row in rows for item in row["candidates"])}
    seal = {"schema_version": "are.g01-bugswarm-java-evidence-source-r7/v1",
            "posture": "source-only exposed screen; not a model packet or claim",
            "rule": "eight failure-bearing full-log lines, capped 1400 characters; for each r6 Java candidate choose highest query-term-overlap non-comment non-package non-import source line plus two following code lines, capped 260 characters; Python unchanged",
            "input_sha256": {name: expected for name, (_, expected) in INPUTS.items()},
            "cases": 24, "stats": stats, "source_rows_sha256": sha(blob),
            "gold_opened": False, "model_calls": 0}
    OUTPUT.mkdir(mode=0o700)
    exclusive(OUTPUT / "SOURCE-EVIDENCE.jsonl", blob)
    seal_blob = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    exclusive(OUTPUT / "SOURCE-SEAL.json", seal_blob)
    print(json.dumps(stats | {"source_rows_sha256": sha(blob),
                              "source_seal_sha256": sha(seal_blob)}))


if __name__ == "__main__":
    main()
