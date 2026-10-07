#!/usr/bin/env python3
"""Project sealed failure-side BugSwarm test names and log tails to 1 KiB queries."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re


CANDIDATE_SHA256 = "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"
SOURCE_METADATA_SHA256 = "5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686"
PREFLIGHT_SHA256 = "aab056dd6156051b9807d2e0c5b171310a92323899f9570842ee18a5adb98710"
PROJECTION_SHA256 = "29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818"
EXCEPTION_LOG_SHA256 = "4fcf8cbf0d042f5ff373804317786d5fc7312b9c0856fa7de5d0ff4ea130961d"
MAX_QUERY_BYTES = 1024
MAX_TEST_BYTES = 256
ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
SENSITIVE = re.compile(
    r"(?i)(?:\b(?:api[_-]?key|access[_-]?token|password|secret|authorization)\b\s*[:=]\s*['\"]?\S{8,}|"
    r"gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)"
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def bounded_prefix(value: str, size: int) -> str:
    return value.encode("utf-8")[:size].decode("utf-8", errors="ignore")


def bounded_suffix(value: str, size: int) -> str:
    return value.encode("utf-8")[-size:].decode("utf-8", errors="ignore")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--source-metadata", type=Path, required=True)
    parser.add_argument("--preflight", type=Path, required=True)
    parser.add_argument("--projection", type=Path, required=True)
    parser.add_argument("--logs", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    if (not args.output_dir.is_dir() or digest(args.candidate) != CANDIDATE_SHA256
            or digest(args.source_metadata) != SOURCE_METADATA_SHA256
            or digest(args.preflight) != PREFLIGHT_SHA256
            or digest(args.projection) != PROJECTION_SHA256):
        raise SystemExit("input-pin-or-output-dir-drift")
    output = args.output_dir / "QUERIES.jsonl"
    seal_path = args.output_dir / "QUERY-SEAL.json"
    if output.exists() or seal_path.exists():
        raise SystemExit("query-output-exists")
    candidate = json.loads(args.candidate.read_bytes())["selected"]
    preflight = json.loads(args.preflight.read_bytes())["results"]
    projection = json.loads(args.projection.read_bytes())["records"]
    metadata = {row["image_tag"]: row for row in
                (json.loads(line) for line in args.source_metadata.read_text().splitlines())}
    if len(candidate) != len(preflight) or len(preflight) != len(projection) or len(projection) != 24:
        raise SystemExit("denominator-drift")
    rows, redactions, missing_test_names = [], 0, 0
    for candidate_row, pf, src in zip(candidate, preflight, projection):
        ordinal, tag = candidate_row["ordinal"], candidate_row["image_tag"]
        item = metadata[tag]
        if (pf["ordinal"] != ordinal or src["ordinal"] != ordinal or src["image_tag"] != tag
                or item["failure"]["job_id"] != candidate_row["failure_job_id"]
                or item["failure"]["trigger_sha"] != candidate_row["failure_commit"]):
            raise SystemExit("source-identity-drift")
        job = candidate_row["failure_job_id"]
        log_path = args.logs / f"HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{job}.txt"
        log = log_path.read_bytes()
        expected = EXCEPTION_LOG_SHA256 if ordinal == 19 else pf["log_sha256"]
        if hashlib.sha256(log).hexdigest() != expected:
            raise SystemExit("failure-log-drift")
        tests = item["failure"]["failed_tests"]
        if not isinstance(tests, str):
            raise SystemExit(f"failed-tests-type-drift:{ordinal}")
        test_part = bounded_prefix(tests.replace("#", "\n"), MAX_TEST_BYTES).strip()
        missing_test_names += not bool(test_part)
        log_text = ANSI.sub("", log.decode("utf-8", errors="replace"))
        heading = f"failed tests:\n{test_part}\n" if test_part else ""
        log_tail = bounded_suffix(log_text, MAX_QUERY_BYTES - len(heading.encode()) - 16).strip()
        query = f"{heading}log tail:\n{log_tail}".strip()
        query, count = SENSITIVE.subn("[REDACTED]", query)
        redactions += count
        if not query or len(query.encode()) > MAX_QUERY_BYTES:
            raise SystemExit("query-size-or-content-denial")
        rows.append({"id": tag, "repo": candidate_row["repo"], "language": candidate_row["language"],
                     "base_commit": candidate_row["failure_commit"], "query": query,
                     "query_sha256": hashlib.sha256(query.encode()).hexdigest(),
                     "query_bytes": len(query.encode()), "redactions": count})
    data = ("".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n" for row in rows)).encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    seal = {"schema_version": "are.g01-bugswarm-query-projection-r1/v1",
            "candidate_sha256": CANDIDATE_SHA256, "source_metadata_sha256": SOURCE_METADATA_SHA256,
            "preflight_sha256": PREFLIGHT_SHA256, "code_projection_sha256": PROJECTION_SHA256,
            "query_rule": "Up to first 256 UTF-8 bytes of failure-side failed-test names, if present, plus ANSI-stripped original log tail in <=1 KiB; redact sensitive-looking tokens",
            "cases": len(rows), "max_query_bytes": max(row["query_bytes"] for row in rows),
            "missing_test_names": missing_test_names,
            "redactions": redactions, "queries_sha256": hashlib.sha256(data).hexdigest(),
            "gold_opened": False, "model_calls": 0}
    encoded = (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(seal_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cases": len(rows), "max_query_bytes": seal["max_query_bytes"],
                      "missing_test_names": missing_test_names,
                      "redactions": redactions, "queries_sha256": seal["queries_sha256"],
                      "seal_sha256": hashlib.sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
