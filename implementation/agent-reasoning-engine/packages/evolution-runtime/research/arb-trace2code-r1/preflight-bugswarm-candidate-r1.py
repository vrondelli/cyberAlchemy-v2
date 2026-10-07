#!/usr/bin/env python3
"""Check sealed BugSwarm candidate source/log availability without opening gold."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


CANDIDATE_SHA256 = "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"
MAX_LOG_BYTES = 4 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(url: str, limit: int) -> tuple[int, bytes]:
    try:
        with urlopen(Request(url, headers={"User-Agent": "ARE-G01-BugSwarm-preflight/1", "Accept": "application/json"}), timeout=25) as response:
            content = response.read(limit + 1)
            return response.status, content
    except HTTPError as error:
        return error.code, b""
    except (URLError, TimeoutError):
        return 0, b""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    if sha(args.candidate.read_bytes()) != CANDIDATE_SHA256:
        raise SystemExit("candidate-pin-drift")
    if not args.output_dir.is_dir():
        raise SystemExit("output-dir-missing")
    candidate = json.loads(args.candidate.read_bytes())
    selected = candidate["selected"]
    if len(selected) != 24 or len({row["image_tag"] for row in selected}) != 24:
        raise SystemExit("candidate-shape-drift")
    results = []
    last_log_request = 0.0
    for row in selected:
        ordinal, job = row["ordinal"], row["failure_job_id"]
        if ordinal != len(results) + 1 or not isinstance(job, int):
            raise SystemExit("candidate-order-drift")
        repo, commit = row["repo"], row["failure_commit"]
        if repo.count("/") != 1 or len(commit) != 40:
            raise SystemExit("candidate-source-shape-drift")
        source_url = f"https://api.github.com/repos/{repo}/git/commits/{commit}"
        source_status, source_body = fetch(source_url, 128 * 1024)
        source_exact = False
        if source_status == 200 and len(source_body) <= 128 * 1024:
            try:
                source_exact = json.loads(source_body).get("sha") == commit
            except (ValueError, AttributeError):
                pass
        # Unauthenticated BugSwarm API: at most 15 requests/minute, under its 20/minute limit.
        wait = 4.1 - (time.monotonic() - last_log_request)
        if wait > 0:
            time.sleep(wait)
        last_log_request = time.monotonic()
        log_url = f"http://www.api.bugswarm.org/v1/logs/{job}"
        log_status, log_body = fetch(log_url, MAX_LOG_BYTES)
        log_valid, log_length, log_sha = False, 0, None
        if log_status == 200 and len(log_body) <= MAX_LOG_BYTES:
            try:
                payload = json.loads(log_body)
                build_log = payload.get("build_log")
                log_valid = (str(payload.get("job_id")) == str(job)
                             and isinstance(build_log, str) and bool(build_log.strip()))
                if log_valid:
                    data = build_log.encode("utf-8")
                    log_length, log_sha = len(data), sha(data)
                    target = args.output_dir / f"HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{job}.txt"
                    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                    with os.fdopen(fd, "wb") as stream:
                        stream.write(data)
            except (ValueError, AttributeError):
                pass
        result = {"ordinal": ordinal, "image_tag": row["image_tag"], "repo": repo,
                  "language": row["language"], "source_http_status": source_status,
                  "exact_failed_commit_available": source_exact,
                  "log_http_status": log_status, "log_job_id_matched": log_valid,
                  "log_utf8_bytes": log_length, "log_sha256": log_sha}
        results.append(result)
        print(json.dumps({"ordinal": ordinal, "source_exact": source_exact,
                          "log_valid": log_valid, "log_bytes": log_length}), flush=True)
    receipt = {"schema_version": "are.g01-bugswarm-candidate-preflight-r1/v1",
               "candidate_sha256": CANDIDATE_SHA256,
               "source_provenance": "GitHub HTTPS commit API exact-SHA response",
               "log_provenance": "BugSwarm unauthenticated HTTP API; provisional, not authenticated transport",
               "gold_opened": False, "model_calls": 0,
               "results": results}
    encoded = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    target = args.output_dir / "CANDIDATE-PREFLIGHT-R1.json"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"receipt_sha256": sha(encoded), "source_exact": sum(r["exact_failed_commit_available"] for r in results),
                      "logs_valid": sum(r["log_job_id_matched"] for r in results)}), flush=True)


if __name__ == "__main__":
    main()
