#!/usr/bin/env python3
"""Replace two source-unavailable G01 graph-development cases without scores."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


PINS = {
    "raw": "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d",
    "order": "63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c",
    "cohort": "6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85",
    "preflight": "03ec15d02446aef5d47d1a190b640a16876732d2498f1ebcb59578ef22aecd34",
    "prior": "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d",
}
SEED = b"are-g01-bugswarm-graph-dev-partition-r1\0"
COMMIT = re.compile(r"[0-9a-f]{40}\Z")
MAX_LOG_RESPONSE = 8 * 1024 * 1024


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(url: str, limit: int) -> tuple[int, bytes]:
    try:
        with urlopen(Request(url, headers={"User-Agent": "ARE-G01-graph-dev-repair/2",
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
    parser = argparse.ArgumentParser(description=__doc__)
    for name in (*PINS, "output_dir"):
        parser.add_argument("--" + name.replace("_", "-"), required=True, type=Path)
    args = parser.parse_args()
    inputs = {name: getattr(args, name).read_bytes() for name in PINS}
    if (not args.output_dir.is_dir() or any(sha(inputs[name]) != pin
            for name, pin in PINS.items())
            or (args.output_dir / "DEV-METADATA-R2.json").exists()):
        raise SystemExit("input-pin-drift-or-output-unavailable")
    raw, order, cohort, preflight, prior = (json.loads(inputs[name]) for name in PINS)
    by_tag = {row["image_tag"]: row for row in raw}
    if len(raw) != 4388 or len(by_tag) != 4388:
        raise SystemExit("raw-population-shape-drift")
    development = cohort["cohorts"]["development"]
    reserved = cohort["cohorts"]["reserved_confirmation"]
    original = [*development["Python"], *development["Java"]]
    prior_results = preflight["results"]
    if (len(original) != len(prior_results) or len(original) != 24
            or any(row["image_tag"] != result["image_tag"]
                   for row, result in zip(original, prior_results))):
        raise SystemExit("preflight-cohort-identity-drift")
    failed_positions = [row["position"] for row in prior_results
                        if not row["exact_failed_commit_available"]]
    if (failed_positions != [11, 21]
            or any(prior_results[pos - 1]["source_http_status"] != 404
                   or not prior_results[pos - 1]["log_job_id_matched"]
                   for pos in failed_positions)):
        raise SystemExit("unexpected-r1-failure-set")
    occupied = {row["repo"].lower() for row in original}
    occupied |= {row["repo"].lower() for lang in reserved for row in reserved[lang]}
    occupied |= {row["repo"].lower() for row in prior["selected"]}
    attempts, replacement = [], {}
    last_log_request = 0.0
    for position in failed_positions:
        language = original[position - 1]["language"]
        floor = max(row["source_order_position"] for row in development[language])
        for source_position, candidate in enumerate(order["ordered"][language], 1):
            if source_position <= floor:
                continue
            row = by_tag.get(candidate["image_tag"])
            if (row is None or row["repo"] != candidate["repo"]
                    or row["lang"] != language
                    or row["failed_job"]["job_id"] != candidate["failure_job_id"]
                    or row["failed_job"]["trigger_sha"] != candidate["failure_commit"]):
                raise SystemExit("source-order-identity-drift")
            repo = candidate["repo"].lower()
            if (repo in occupied or not eligible(row)
                    or int(sha(SEED + repo.encode()), 16) % 2 != 0):
                continue
            commit = candidate["failure_commit"]
            source_status, source_body = fetch(
                f"https://api.github.com/repos/{candidate['repo']}/git/commits/{commit}",
                128 * 1024)
            source_exact = False
            if source_status == 200 and len(source_body) <= 128 * 1024:
                try:
                    source_exact = json.loads(source_body).get("sha") == commit
                except (ValueError, AttributeError):
                    pass
            log_status, log_valid, log_data = None, False, None
            if source_exact:
                wait = 4.1 - (time.monotonic() - last_log_request)
                if wait > 0:
                    time.sleep(wait)
                last_log_request = time.monotonic()
                log_status, body = fetch(
                    f"http://www.api.bugswarm.org/v1/logs/{candidate['failure_job_id']}",
                    MAX_LOG_RESPONSE)
                if log_status == 200 and len(body) <= MAX_LOG_RESPONSE:
                    try:
                        payload = json.loads(body)
                        log = payload.get("build_log")
                        log_valid = (str(payload.get("job_id")) ==
                                     str(candidate["failure_job_id"])
                                     and isinstance(log, str) and bool(log.strip()))
                        if log_valid:
                            log_data = log.encode("utf-8")
                    except (ValueError, AttributeError):
                        pass
            attempts.append({"failed_position": position, "language": language,
                             "source_order_position": source_position,
                             "image_tag": candidate["image_tag"], "repo": candidate["repo"],
                             "source_http_status": source_status,
                             "source_exact": source_exact, "log_http_status": log_status,
                             "log_job_id_matched": log_valid})
            print(json.dumps(attempts[-1]), flush=True)
            if not log_valid:
                continue
            target = args.output_dir / (f"HTTP-PROVISIONAL-REPLACEMENT-LOG-"
                                        f"{position:02d}-{candidate['failure_job_id']}.txt")
            fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "wb") as stream:
                stream.write(log_data)
            replacement[position] = {"position": position, "source_order_position": source_position,
                                     **candidate, "log_sha256": sha(log_data),
                                     "log_utf8_bytes": len(log_data)}
            occupied.add(repo)
            break
        if position not in replacement:
            raise SystemExit("no-source-and-log-admitted-replacement:" + str(position))
    repaired = [replacement.get(position, row) for position, row in enumerate(original, 1)]
    if len(repaired) != 24 or len({row["repo"].lower() for row in repaired}) != 24:
        raise SystemExit("repaired-denominator-or-repository-drift")
    result = {"schema_version": "are.g01-bugswarm-graph-dev-metadata-r2/v1",
              "status": "source-and-log-preflight-only-not-label-admitted",
              "input_sha256": PINS,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "rule": "Retain 22 exact-source r1 cases; for each r1 404 use first subsequent metadata-eligible, development-parity, repository-disjoint source-order candidate with exact GitHub commit and job-matched nonempty original log; no scores, patch paths, or confirmation source",
              "failed_r1_positions": failed_positions,
              "attempts": attempts,
              "replacement_logs": {str(pos): {"sha256": row["log_sha256"],
                                              "bytes": row["log_utf8_bytes"]}
                                   for pos, row in replacement.items()},
              "development": repaired,
              "reserved_confirmation_sha256": sha(json.dumps(reserved, sort_keys=True).encode()),
              "reserved_confirmation_opened": False,
              "gold_paths_opened": False, "model_calls": 0,
              "claim_ceiling": "Development source/log preflight only; exact source archives and evaluator labels not yet admitted; no superiority claim."}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    target = args.output_dir / "DEV-METADATA-R2.json"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"output_sha256": sha(data), "development_cases": len(repaired),
                      "replacements": len(replacement)}), flush=True)


if __name__ == "__main__":
    main()
