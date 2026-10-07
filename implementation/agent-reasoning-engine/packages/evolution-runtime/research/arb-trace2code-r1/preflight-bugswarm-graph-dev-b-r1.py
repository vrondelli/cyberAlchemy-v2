#!/usr/bin/env python3
"""Preflight only second-development failing commits and original logs."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


COHORT_SHA = "d3f1dbef2443752290cfe917f75d15a229f4a176d2708c2764fcf7886df25b92"
MAX_LOG_RESPONSE = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(url: str, limit: int) -> tuple[int, bytes]:
    try:
        with urlopen(Request(url, headers={"User-Agent": "ARE-G01-graph-dev-b-preflight/1",
                                           "Accept": "application/json"}), timeout=30) as response:
            return response.status, response.read(limit + 1)
    except HTTPError as error:
        return error.code, b""
    except (URLError, TimeoutError):
        return 0, b""


def main() -> None:
    root = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r1")
    cohort_path = root / "METADATA-COHORT-B-R1.json"
    target = root / "DEV-PREFLIGHT-B-R1.json"
    if (not root.is_dir() or target.exists() or
            sha(cohort_path.read_bytes()) != COHORT_SHA):
        raise SystemExit("cohort-pin-drift-or-output-exists")
    cohort = json.loads(cohort_path.read_bytes())
    cases = cohort["selected"]
    if (cohort["schema_version"] != "are.g01-bugswarm-graph-dev-b-metadata-r1/v1" or
            len(cases) != 24 or len({row["repo"].lower() for row in cases}) != 24 or
            cohort["gold_paths_opened"] or cohort["reserved_confirmation_opened"]):
        raise SystemExit("cohort-shape-or-posture")
    results = []
    last_log_request = 0.0
    for index, row in enumerate(cases, 1):
        repo, commit, job = row["repo"], row["failure_commit"], row["failure_job_id"]
        if (row["ordinal"] != index or repo.count("/") != 1 or len(commit) != 40 or
                type(job) is not int):
            raise SystemExit("source-identity-shape-drift")
        status, body = fetch(f"https://api.github.com/repos/{repo}/git/commits/{commit}",
                             128 * 1024)
        source_exact = False
        if status == 200 and len(body) <= 128 * 1024:
            try:
                source_exact = json.loads(body).get("sha") == commit
            except (ValueError, AttributeError):
                pass
        wait = 4.1 - (time.monotonic() - last_log_request)
        if wait > 0:
            time.sleep(wait)
        last_log_request = time.monotonic()
        log_status, log_body = fetch(f"http://www.api.bugswarm.org/v1/logs/{job}",
                                     MAX_LOG_RESPONSE)
        log_valid, log_size, log_sha = False, 0, None
        oversize = len(log_body) > MAX_LOG_RESPONSE
        if log_status == 200 and not oversize:
            try:
                payload = json.loads(log_body)
                log = payload.get("build_log")
                log_valid = (str(payload.get("job_id")) == str(job) and
                             isinstance(log, str) and bool(log.strip()))
                if log_valid:
                    data = log.encode("utf-8")
                    log_size, log_sha = len(data), sha(data)
                    log_path = root / f"HTTP-PROVISIONAL-FAILURE-LOG-{index:02d}-{job}.txt"
                    fd = os.open(log_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                    with os.fdopen(fd, "wb") as stream:
                        stream.write(data)
            except (ValueError, AttributeError):
                pass
        result = {"ordinal": index, "image_tag": row["image_tag"], "repo": repo,
                  "language": row["language"], "failure_commit": commit,
                  "failure_job_id": job, "source_http_status": status,
                  "exact_failed_commit_available": source_exact,
                  "log_http_status": log_status, "log_job_id_matched": log_valid,
                  "log_response_oversize": oversize,
                  "log_utf8_bytes": log_size, "log_sha256": log_sha}
        results.append(result)
        print(json.dumps({"ordinal": index, "source_exact": source_exact,
                          "log_valid": log_valid, "log_oversize": oversize}), flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-b-preflight-r1/v1",
               "cohort_sha256": COHORT_SHA,
               "script_sha256": sha(Path(__file__).read_bytes()),
               "source_provenance": "GitHub HTTPS exact failing commit API",
               "log_provenance": "BugSwarm unauthenticated HTTP; transport-provisional",
               "reserved_confirmation_opened": False, "gold_opened": False,
               "model_calls": 0, "results": results}
    data = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"receipt_sha256": sha(data),
                      "source_exact": sum(row["exact_failed_commit_available"] for row in results),
                      "logs_valid": sum(row["log_job_id_matched"] for row in results)}))


if __name__ == "__main__":
    main()
