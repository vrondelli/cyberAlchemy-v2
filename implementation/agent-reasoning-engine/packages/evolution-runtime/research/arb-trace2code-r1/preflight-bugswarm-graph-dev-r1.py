#!/usr/bin/env python3
"""Check only the sealed BugSwarm graph-development cohort's source and logs."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


COHORT_SHA = "6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85"
MAX_LOG_RESPONSE = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(url: str, limit: int) -> tuple[int, bytes]:
    try:
        with urlopen(Request(url, headers={"User-Agent": "ARE-G01-graph-dev-preflight/1",
                                           "Accept": "application/json"}), timeout=30) as response:
            return response.status, response.read(limit + 1)
    except HTTPError as error:
        return error.code, b""
    except (URLError, TimeoutError):
        return 0, b""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cohorts", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    if sha(args.cohorts.read_bytes()) != COHORT_SHA or not args.output_dir.is_dir():
        raise SystemExit("cohort-pin-drift-or-output-dir-missing")
    cohort = json.loads(args.cohorts.read_bytes())
    if cohort["schema_version"] != "are.g01-bugswarm-graph-dev-metadata-r1/v1":
        raise SystemExit("cohort-schema-drift")
    cases = [*cohort["cohorts"]["development"]["Python"],
             *cohort["cohorts"]["development"]["Java"]]
    if len(cases) != 24 or len({row["repo"].lower() for row in cases}) != 24:
        raise SystemExit("development-denominator-drift")
    results = []
    last_log_request = 0.0
    for position, row in enumerate(cases, 1):
        repo, commit, job = row["repo"], row["failure_commit"], row["failure_job_id"]
        if repo.count("/") != 1 or len(commit) != 40 or type(job) is not int:
            raise SystemExit("source-identity-shape-drift")
        source_status, source_body = fetch(f"https://api.github.com/repos/{repo}/git/commits/{commit}", 128 * 1024)
        source_exact = False
        if source_status == 200 and len(source_body) <= 128 * 1024:
            try:
                source_exact = json.loads(source_body).get("sha") == commit
            except (ValueError, AttributeError):
                pass
        wait = 4.1 - (time.monotonic() - last_log_request)
        if wait > 0:
            time.sleep(wait)
        last_log_request = time.monotonic()
        log_status, log_body = fetch(f"http://www.api.bugswarm.org/v1/logs/{job}", MAX_LOG_RESPONSE)
        log_valid, log_length, log_sha, log_oversize = False, 0, None, len(log_body) > MAX_LOG_RESPONSE
        if log_status == 200 and not log_oversize:
            try:
                payload = json.loads(log_body)
                build_log = payload.get("build_log")
                log_valid = (str(payload.get("job_id")) == str(job)
                             and isinstance(build_log, str) and bool(build_log.strip()))
                if log_valid:
                    data = build_log.encode("utf-8")
                    log_length, log_sha = len(data), sha(data)
                    target = args.output_dir / f"HTTP-PROVISIONAL-FAILURE-LOG-{position:02d}-{job}.txt"
                    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                    with os.fdopen(fd, "wb") as stream:
                        stream.write(data)
            except (ValueError, AttributeError):
                pass
        results.append({"position": position, "image_tag": row["image_tag"],
                        "repo": repo, "language": row["language"], "failure_commit": commit,
                        "failure_job_id": job, "source_http_status": source_status,
                        "exact_failed_commit_available": source_exact,
                        "log_http_status": log_status, "log_job_id_matched": log_valid,
                        "log_response_oversize": log_oversize,
                        "log_utf8_bytes": log_length, "log_sha256": log_sha})
        print(json.dumps({"position": position, "source_exact": source_exact,
                          "log_valid": log_valid, "log_oversize": log_oversize}), flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-preflight-r1/v1",
               "cohort_sha256": COHORT_SHA,
               "script_sha256": sha(Path(__file__).read_bytes()),
               "source_provenance": "GitHub HTTPS commit API exact-SHA response",
               "log_provenance": "BugSwarm unauthenticated HTTP API; transport-provisional",
               "reserved_confirmation_opened": False, "gold_opened": False, "model_calls": 0,
               "results": results}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    target = args.output_dir / "DEV-PREFLIGHT-R1.json"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"receipt_sha256": sha(data),
                      "source_exact": sum(row["exact_failed_commit_available"] for row in results),
                      "logs_valid": sum(row["log_job_id_matched"] for row in results)}), flush=True)


if __name__ == "__main__":
    main()
