#!/usr/bin/env python3
"""r68 authenticated, byte-complete BugSwarm HTTPS log admission."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

COHORT_SHA = "4e779481382a57b99e0075bdad801fb15bf122275f20a409bac2264d48c528be"
RAW_SHA = "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d"
LOG_CAP = 8 * 1024 * 1024
PAGE_CAP = 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def save(path: Path, value: object) -> None:
    data = (json.dumps(value, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def save_bytes(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def request(url: str, method: str, limit: int) -> tuple[int, bytes, dict, str, str | None]:
    req = Request(url, method=method, headers={"User-Agent": "ARE-G01-r68-https-log/1"})
    try:
        with urlopen(req, timeout=60) as response:
            return response.status, response.read(limit + 1), dict(response.headers), response.geturl(), None
    except HTTPError as error:
        return error.code, error.read(min(limit, 65536)), dict(error.headers), error.geturl(), f"http-{error.code}"
    except (URLError, TimeoutError) as error:
        return 0, b"", {}, url, type(error).__name__


def page_identity(body: bytes, repo: str, job: int) -> tuple[bool, str | None]:
    try:
        text = body.decode("utf-8", errors="strict")
    except UnicodeDecodeError:
        return False, None
    header = text.split("View raw log", 1)[0]
    escaped_repo = re.escape(repo)
    github = bool(re.search(rf"<li>\s*GitHub Actions job {job}\s*</li>", header)
                  and re.search(rf"https://github\.com/{escaped_repo}/actions/runs/[^\s'\"]+/job/{job}", header))
    travis = bool(re.search(rf"<li>\s*Travis-CI job {job}\s*</li>", header)
                  and re.search(rf"https://(?:app\.travis-ci\.com|travis-ci\.org)/{escaped_repo}/jobs/{job}", header))
    return github or travis, "github-actions" if github else "travis-ci" if travis else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cohort", required=True, type=Path)
    parser.add_argument("--raw", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.cohort.read_bytes()) != COHORT_SHA or sha(args.raw.read_bytes()) != RAW_SHA:
        raise SystemExit("output-exists-or-input-drift")
    cohort = json.loads(args.cohort.read_bytes())
    metadata = {row["image_tag"]: row for row in json.loads(args.raw.read_bytes())}
    cases = cohort["rows"]
    if cohort["cases"] != len(cases) or len(cases) != 24 or cohort["gold_paths_opened"]:
        raise SystemExit("cohort-drift")
    args.output.mkdir(mode=0o700, parents=True)
    save(args.output / "LOG-FREEZE.json", {
        "schema_version": "are.g01-r68-log-freeze/v1", "cohort_sha256": COHORT_SHA,
        "raw_sha256": RAW_SHA, "protocol_sha256": sha(Path(__file__).with_name("LOG-PREFLIGHT-PROTOCOL.md").read_bytes()),
        "script_sha256": sha(Path(__file__).read_bytes()),
        "cases": 24, "automatic_retries": 0, "maximum_requests": 72,
        "maximum_log_bytes": LOG_CAP, "gold_opened": False,
        "rankings_opened": False, "scores_computed": False, "model_calls": 0,
    })
    rows = []
    for case in cases:
        ordinal = case["ordinal"]
        item = metadata[case["image_tag"]]
        job = item["failed_job"]["job_id"]
        if ordinal != len(rows) + 1 or case["repo"] != item["repo"] or case["failed_commit"] != item["failed_job"]["trigger_sha"]:
            raise SystemExit("case-identity-drift")
        page_url = f"https://www.bugswarm.org/artifact-logs/{job}/"
        raw_url = page_url + "raw/"
        page_status, page, _, page_final, page_error = request(page_url, "GET", PAGE_CAP)
        identity, provider = page_identity(page, case["repo"], job) if page_status == 200 else (False, None)
        head_status, _, head_headers, head_final, head_error = request(raw_url, "HEAD", 0)
        try:
            expected_bytes = int(head_headers.get("Content-Length", ""))
        except ValueError:
            expected_bytes = None
        if expected_bytes is not None and not 0 < expected_bytes <= LOG_CAP:
            expected_bytes = None
        log_status, log, log_headers, log_final, log_error = (None, b"", {}, raw_url, None)
        if (page_status == 200 and identity and head_status == 200 and expected_bytes is not None
                and page_final == page_url and head_final == raw_url):
            log_status, log, log_headers, log_final, log_error = request(raw_url, "GET", LOG_CAP)
        try:
            log.decode("utf-8", errors="strict")
            utf8 = True
        except UnicodeDecodeError:
            utf8 = False
        admitted = (log_status == 200 and log_error is None and log_final == raw_url
                    and len(log) == expected_bytes and utf8 and bool(log))
        if log_status == 200 and len(log) <= LOG_CAP:
            save_bytes(args.output / f"HTTPS-LOG-{ordinal:02d}.txt", log)
        row = {"ordinal": ordinal, "image_tag": case["image_tag"], "repo": case["repo"],
               "failed_commit": case["failed_commit"], "job_id": job,
               "page_status": page_status, "page_bytes": len(page), "page_sha256": sha(page),
               "page_identity": identity, "provider": provider, "page_error": page_error,
               "head_status": head_status, "expected_bytes": expected_bytes,
               "head_error": head_error, "log_status": log_status, "log_bytes": len(log),
               "log_sha256": sha(log), "log_error": log_error,
               "log_content_length": log_headers.get("Content-Length"),
               "utf8": utf8, "admitted": admitted,
               "gold_opened": False, "model_calls": 0}
        save(args.output / f"CASE-{ordinal:02d}.json", row)
        rows.append(row)
        print(json.dumps({"ordinal": ordinal, "admitted": admitted,
                          "page_identity": identity, "expected_bytes": expected_bytes,
                          "log_bytes": len(log), "log_error": log_error}), flush=True)
    save(args.output / "LOG-RESULT.json", {
        "schema_version": "are.g01-r68-log-result/v1", "attempted": len(rows),
        "admitted": sum(row["admitted"] for row in rows),
        "all_24_admitted": len(rows) == 24 and all(row["admitted"] for row in rows),
        "results": rows, "gold_opened": False, "rankings_opened": False,
        "scores_computed": False, "model_calls": 0,
    })


if __name__ == "__main__":
    main()
