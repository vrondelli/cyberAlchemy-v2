#!/usr/bin/env python3
"""Replace one source-404 second-development case without scores or labels."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
ROOT = BASE / "graph-dev-b-r1"
PINS = {
    "raw": (BASE / "1.3.1-bugswarm.json",
            "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d"),
    "order": (BASE / "source-only-r1/ORDERED-CANDIDATES.json",
              "63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c"),
    "prior": (BASE / "METADATA-CANDIDATE-24-R1.json",
              "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d"),
    "split": (BASE / "graph-dev-r1/METADATA-COHORTS-R1.json",
              "6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85"),
    "development": (BASE / "graph-dev-r2/DEV-METADATA-R2.json",
                    "c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332"),
    "cohort_b": (ROOT / "METADATA-COHORT-B-R1.json",
                 "d3f1dbef2443752290cfe917f75d15a229f4a176d2708c2764fcf7886df25b92"),
    "preflight_b": (ROOT / "DEV-PREFLIGHT-B-R1.json",
                    "cc8adb5e427659794cfc6334797b759fd7dc9884346968bb74ac2dfea21f98dd"),
}
SEED = b"are-g01-bugswarm-graph-dev-partition-r1\0"
COMMIT = re.compile(r"[0-9a-f]{40}\Z")
MAX_LOG_RESPONSE = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(url: str, limit: int) -> tuple[int, bytes]:
    try:
        with urlopen(Request(url, headers={"User-Agent": "ARE-G01-graph-dev-b-repair/2",
                                           "Accept": "application/json"}), timeout=30) as response:
            return response.status, response.read(limit + 1)
    except HTTPError as error:
        return error.code, b""
    except (URLError, TimeoutError):
        return 0, b""


def eligible(row: dict) -> bool:
    failed, passed = row["failed_job"], row["passed_job"]
    changed = row.get("metrics", {}).get("num_of_changed_files")
    failures = failed.get("num_tests_failed")
    return (row.get("status") == "active"
            and row.get("reproducibility_status", {}).get("status") == "Reproducible"
            and row.get("is_error_pass") is False
            and row.get("classification", {}).get("code") == "Yes"
            and type(changed) is int and 1 <= changed <= 3
            and type(failures) is int and failures > 0
            and type(failed.get("job_id")) is int
            and isinstance(failed.get("trigger_sha"), str)
            and COMMIT.fullmatch(failed["trigger_sha"]) is not None
            and isinstance(passed.get("trigger_sha"), str)
            and COMMIT.fullmatch(passed["trigger_sha"]) is not None)


def main() -> None:
    out = ROOT / "METADATA-COHORT-B-R2.json"
    if out.exists():
        raise SystemExit("output-exists")
    blobs = {}
    for name, (path, expected) in PINS.items():
        blob = path.read_bytes()
        if sha(blob) != expected:
            raise SystemExit(f"input-pin-drift:{name}")
        blobs[name] = blob
    raw, order, prior, split, development, b, preflight = (
        json.loads(blobs[name]) for name in PINS)
    original = b["selected"]
    checks = preflight["results"]
    if (len(original) != 24 or len(checks) != 24 or
            [(item["ordinal"], item["image_tag"]) for item in original] !=
            [(item["ordinal"], item["image_tag"]) for item in checks] or
            [item["ordinal"] for item in checks if not item["exact_failed_commit_available"]] != [12]
            or checks[11]["source_http_status"] != 404 or
            not all(item["log_job_id_matched"] for item in checks) or
            original[11]["language"] != "Python" or
            original[11]["source_order_position"] != 325 or
            b["gold_paths_opened"] or b["reserved_confirmation_opened"]):
        raise SystemExit("r1-failure-set-or-posture-drift")
    by_tag = {row["image_tag"]: row for row in raw}
    if len(by_tag) != 4388:
        raise SystemExit("raw-population-shape-drift")
    excluded = {row["repo"].lower() for row in prior["selected"]}
    excluded |= {row["repo"].lower() for cohort in split["cohorts"].values()
                 for language in ("Python", "Java") for row in cohort[language]}
    excluded |= {row["repo"].lower() for row in development["development"]}
    excluded |= {row["repo"].lower() for row in original}
    attempts, replacement = [], None
    last_log_request = 0.0
    for position, candidate in enumerate(order["ordered"]["Python"], 1):
        if position <= 325:
            continue
        row = by_tag.get(candidate["image_tag"])
        if (row is None or row["repo"] != candidate["repo"] or row["lang"] != "Python"
                or row["failed_job"]["job_id"] != candidate["failure_job_id"]
                or row["failed_job"]["trigger_sha"] != candidate["failure_commit"]):
            raise SystemExit("source-order-identity-drift")
        repo = candidate["repo"].lower()
        if (repo in excluded or not eligible(row) or
                int(sha(SEED + repo.encode()), 16) % 2 != 0):
            continue
        commit = candidate["failure_commit"]
        status, body = fetch(f"https://api.github.com/repos/{candidate['repo']}/git/commits/{commit}",
                             128 * 1024)
        exact = False
        if status == 200 and len(body) <= 128 * 1024:
            try:
                exact = json.loads(body).get("sha") == commit
            except (ValueError, AttributeError):
                pass
        log_status, log_valid, log_data = None, False, None
        if exact:
            wait = 4.1 - (time.monotonic() - last_log_request)
            if wait > 0:
                time.sleep(wait)
            last_log_request = time.monotonic()
            log_status, log_body = fetch(
                f"http://www.api.bugswarm.org/v1/logs/{candidate['failure_job_id']}",
                MAX_LOG_RESPONSE)
            if log_status == 200 and len(log_body) <= MAX_LOG_RESPONSE:
                try:
                    payload = json.loads(log_body)
                    log = payload.get("build_log")
                    log_valid = (str(payload.get("job_id")) ==
                                 str(candidate["failure_job_id"]) and
                                 isinstance(log, str) and bool(log.strip()))
                    if log_valid:
                        log_data = log.encode("utf-8")
                except (ValueError, AttributeError):
                    pass
        attempt = {"source_order_position": position, "image_tag": candidate["image_tag"],
                   "repo": candidate["repo"], "source_http_status": status,
                   "source_exact": exact, "log_http_status": log_status,
                   "log_job_id_matched": log_valid}
        attempts.append(attempt)
        print(json.dumps(attempt), flush=True)
        if log_valid:
            target = ROOT / (f"HTTP-PROVISIONAL-REPLACEMENT-LOG-12-"
                             f"{candidate['failure_job_id']}.txt")
            fd = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            with os.fdopen(fd, "wb") as stream:
                stream.write(log_data)
            replacement = {"ordinal": 12, "source_order_position": position,
                           **candidate, "log_sha256": sha(log_data),
                           "log_utf8_bytes": len(log_data)}
            break
    if replacement is None:
        raise SystemExit("no-source-and-log-admitted-replacement")
    repaired = [replacement if index == 12 else row
                for index, row in enumerate(original, 1)]
    if (len(repaired) != 24 or len({row["repo"].lower() for row in repaired}) != 24
            or replacement["repo"].lower() in excluded):
        raise SystemExit("repaired-denominator-or-repository-drift")
    receipt = {"schema_version": "are.g01-bugswarm-graph-dev-b-metadata-r2/v1",
               "status": "source-and-log-preflight-only-not-label-admitted",
               "input_sha256": {name: expected for name, (_, expected) in PINS.items()},
               "script_sha256": sha(Path(__file__).read_bytes()),
               "rule": "Retain 23 r1 cases; replace Python position 12 with first later eligible development-parity repository disjoint from all used and reserved repositories with exact HTTPS failed commit and job-matched nonempty original HTTP log; no scores or patch paths",
               "failed_r1_positions": [12], "attempts": attempts,
               "replacement_log": {"sha256": replacement["log_sha256"],
                                   "bytes": replacement["log_utf8_bytes"]},
               "development": repaired, "gold_paths_opened": False,
               "reserved_confirmation_opened": False, "model_calls": 0,
               "claim_ceiling": "Second development source/log preflight only; archives, projection and evaluator-only labels not yet admitted."}
    data = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(out, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"development_cases": len(repaired), "replacements": 1,
                      "output_sha256": sha(data)}))


if __name__ == "__main__":
    main()
