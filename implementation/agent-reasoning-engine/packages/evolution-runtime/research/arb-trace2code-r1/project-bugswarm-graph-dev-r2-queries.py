#!/usr/bin/env python3
"""Project sealed graph-development r2 failure-side queries without gold."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re


CANDIDATE_SHA = "c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332"
SOURCE_METADATA_SHA = "5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686"
PREFLIGHT_SHA = "03ec15d02446aef5d47d1a190b640a16876732d2498f1ebcb59578ef22aecd34"
PROJECTION_SHA = "201f4ba4d31d93dbfbff5f808307c079d46f4db2319cb40a4df08e7d0bb9bf51"
MAX_QUERY_BYTES = 1024
MAX_TEST_BYTES = 256
ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
SENSITIVE = re.compile(
    r"(?i)(?:\b(?:api[_-]?key|access[_-]?token|password|secret|authorization)\b\s*[:=]\s*['\"]?\S{8,}|"
    r"gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)"
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def bounded_prefix(value: str, size: int) -> str:
    return value.encode("utf-8")[:size].decode("utf-8", errors="ignore")


def bounded_suffix(value: str, size: int) -> str:
    return value.encode("utf-8")[-size:].decode("utf-8", errors="ignore")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("candidate", "source_metadata", "preflight", "projection",
                 "r1_logs", "r2_logs", "output_dir"):
        parser.add_argument("--" + name.replace("_", "-"), required=True, type=Path)
    args = parser.parse_args()
    pins = {"candidate": CANDIDATE_SHA, "source_metadata": SOURCE_METADATA_SHA,
            "preflight": PREFLIGHT_SHA, "projection": PROJECTION_SHA}
    if (not args.output_dir.is_dir() or any(
            sha(getattr(args, name).read_bytes()) != pin for name, pin in pins.items())):
        raise SystemExit("input-pin-or-output-dir-drift")
    output = args.output_dir / "QUERIES-R2.jsonl"
    seal_path = args.output_dir / "QUERY-SEAL-R2.json"
    if output.exists() or seal_path.exists():
        raise SystemExit("query-output-exists")
    cases = json.loads(args.candidate.read_bytes())["development"]
    prior = json.loads(args.preflight.read_bytes())["results"]
    projection = json.loads(args.projection.read_bytes())["records"]
    metadata = {row["image_tag"]: row for row in
                (json.loads(line) for line in args.source_metadata.read_text().splitlines())}
    if len(cases) != len(prior) or len(prior) != len(projection) or len(cases) != 24:
        raise SystemExit("denominator-drift")
    rows, redactions, missing_test_names = [], 0, 0
    for ordinal, (candidate, pf, src) in enumerate(zip(cases, prior, projection), 1):
        tag, job = candidate["image_tag"], candidate["failure_job_id"]
        item = metadata[tag]
        if (src["ordinal"] != ordinal or src["image_tag"] != tag
                or src["commit"] != candidate["failure_commit"]
                or item["failure"]["job_id"] != job
                or item["failure"]["trigger_sha"] != candidate["failure_commit"]):
            raise SystemExit("source-identity-drift")
        if ordinal in (11, 21):
            log_path = args.r2_logs / f"HTTP-PROVISIONAL-REPLACEMENT-LOG-{ordinal:02d}-{job}.txt"
            expected = candidate["log_sha256"]
        else:
            if pf["position"] != ordinal or pf["image_tag"] != tag or not pf["log_job_id_matched"]:
                raise SystemExit("r1-log-identity-drift")
            log_path = args.r1_logs / f"HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{job}.txt"
            expected = pf["log_sha256"]
        log = log_path.read_bytes()
        if sha(log) != expected:
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
        rows.append({"id": tag, "repo": candidate["repo"],
                     "language": candidate["language"],
                     "base_commit": candidate["failure_commit"], "query": query,
                     "query_sha256": sha(query.encode()), "query_bytes": len(query.encode()),
                     "redactions": count})
    data = ("".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n"
                    for row in rows)).encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    seal = {"schema_version": "are.g01-bugswarm-graph-dev-query-projection-r2/v1",
            "candidate_sha256": CANDIDATE_SHA,
            "source_metadata_sha256": SOURCE_METADATA_SHA,
            "preflight_sha256": PREFLIGHT_SHA,
            "code_projection_sha256": PROJECTION_SHA,
            "query_rule": "First 256 UTF-8 bytes of failure-side failed-test names, if present, plus ANSI-stripped original log tail in <=1 KiB; redact sensitive-looking tokens",
            "cases": len(rows), "max_query_bytes": max(row["query_bytes"] for row in rows),
            "missing_test_names": missing_test_names, "redactions": redactions,
            "queries_sha256": sha(data), "gold_opened": False,
            "reserved_confirmation_opened": False, "model_calls": 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(seal_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cases": len(rows), "max_query_bytes": seal["max_query_bytes"],
                      "missing_test_names": missing_test_names,
                      "redactions": redactions, "queries_sha256": sha(data),
                      "seal_sha256": sha(encoded)}))


if __name__ == "__main__":
    main()
