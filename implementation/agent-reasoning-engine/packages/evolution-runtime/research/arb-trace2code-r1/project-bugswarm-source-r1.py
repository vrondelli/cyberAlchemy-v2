#!/usr/bin/env python3
"""Project pinned BugSwarm metadata to failure-side fields only."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path


INPUT_SHA256 = "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d"
EXPECTED_ROWS = 4388


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output-exists")
    raw = args.input.read_bytes()
    if digest(raw) != INPUT_SHA256:
        raise SystemExit("source-digest-drift")
    rows = json.loads(raw)
    if not isinstance(rows, list) or len(rows) != EXPECTED_ROWS:
        raise SystemExit("source-denominator-drift")
    projected = []
    for item in rows:
        failed = item.get("failed_job")
        if not isinstance(item, dict) or not isinstance(failed, dict):
            raise SystemExit("source-row-shape")
        tag, repo, lang, ci = (item.get(name) for name in
                               ("image_tag", "repo", "lang", "ci_service"))
        job_id, commit, tests, failed_count = (failed.get(name) for name in
                                               ("job_id", "trigger_sha", "failed_tests", "num_tests_failed"))
        if (not all(isinstance(value, str) and value for value in (tag, repo, lang, ci, commit))
                or not isinstance(job_id, int) or isinstance(job_id, bool)
                or not isinstance(tests, str)
                or not isinstance(failed_count, int) or isinstance(failed_count, bool)):
            raise SystemExit("failure-side-field-invalid")
        projected.append({"image_tag": tag, "repo": repo, "language": lang,
                          "ci_service": ci, "failure": {"job_id": job_id,
                          "trigger_sha": commit, "failed_tests": tests,
                          "num_tests_failed": failed_count}})
    if len({row["image_tag"] for row in projected}) != EXPECTED_ROWS:
        raise SystemExit("duplicate-image-tag")
    projected.sort(key=lambda row: row["image_tag"])
    body = "".join(json.dumps(row, sort_keys=True, ensure_ascii=False) + "\n"
                   for row in projected).encode()
    receipt = {"schema_version": "are.g01-bugswarm-source-projection-r1/v1",
               "posture": "public-failure-side-metadata-only-no-passed-job-patch-classification-diff-or-gold",
               "release": "BugSwarm 1.3.1", "input_sha256": INPUT_SHA256,
               "script_sha256": digest(Path(__file__).read_bytes()),
               "rows": EXPECTED_ROWS, "repositories": len({row["repo"] for row in projected}),
               "projection_sha256": digest(body),
               "excluded_fields": ["passed_job", "classification", "metrics", "filtered_reason",
                                   "pr_num", "repo_commits", "repo_prs", "repo_builds"],
               "claim_ceiling": "Source-side feasibility only; no cohort, label admission, exact checkout, log acquisition, model call, score, or superiority."}
    args.output.mkdir(mode=0o700, parents=True, exist_ok=False)
    write_new(args.output / "FAILURE-SIDE-METADATA.jsonl", body)
    write_new(args.output / "SOURCE-PROJECTION-RECEIPT.json",
              (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode())
    print(json.dumps({"rows": receipt["rows"], "repositories": receipt["repositories"],
                      "projection_sha256": receipt["projection_sha256"]}))


if __name__ == "__main__":
    main()
