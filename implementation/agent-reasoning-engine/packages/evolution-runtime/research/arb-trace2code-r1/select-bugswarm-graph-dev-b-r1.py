#!/usr/bin/env python3
"""Select a second BugSwarm development cohort, disjoint from reserved cases."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re


PINS = {
    "raw": "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d",
    "order": "63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c",
    "prior": "fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d",
    "split": "6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85",
    "development": "c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332",
}
SEED = b"are-g01-bugswarm-graph-dev-partition-r1\0"
COMMIT = re.compile(r"[0-9a-f]{40}\Z")


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


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
    for name in (*PINS, "protocol", "output"):
        parser.add_argument("--" + name.replace("_", "-"), type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output-exists")
    blobs = {name: getattr(args, name).read_bytes() for name in PINS}
    if any(sha(blobs[name]) != expected for name, expected in PINS.items()):
        raise SystemExit("input-pin-drift")
    raw, order, prior, split, development = (json.loads(blobs[name]) for name in PINS)
    by_tag = {row["image_tag"]: row for row in raw}
    if (len(raw) != 4388 or len(by_tag) != len(raw) or
            len(prior["selected"]) != 24 or len(development["development"]) != 24 or
            any(len(split["cohorts"][cohort][language]) != 12
                for cohort in ("development", "reserved_confirmation")
                for language in ("Python", "Java"))):
        raise SystemExit("population-or-cohort-shape-drift")
    sources = {
        "original_exposed": prior["selected"],
        "r1_development": [*split["cohorts"]["development"]["Python"],
                           *split["cohorts"]["development"]["Java"]],
        "reserved_confirmation": [*split["cohorts"]["reserved_confirmation"]["Python"],
                                  *split["cohorts"]["reserved_confirmation"]["Java"]],
        "r2_development": development["development"],
    }
    excluded = {item["repo"].lower() for rows in sources.values() for item in rows}
    selected, seen = [], set()
    screened = {}
    for language in ("Python", "Java"):
        attempts = 0
        count = 0
        for position, candidate in enumerate(order["ordered"][language], 1):
            row = by_tag.get(candidate["image_tag"])
            if (row is None or row["repo"] != candidate["repo"] or
                    row["lang"] != language or
                    row["failed_job"]["job_id"] != candidate["failure_job_id"] or
                    row["failed_job"]["trigger_sha"] != candidate["failure_commit"]):
                raise SystemExit("source-order-identity-drift")
            attempts += 1
            repo = candidate["repo"].lower()
            if (repo in excluded or repo in seen or not eligible(row) or
                    int(sha(SEED + repo.encode()), 16) % 2 != 0):
                continue
            selected.append({"ordinal": len(selected) + 1,
                             "source_order_position": position, **candidate})
            seen.add(repo)
            count += 1
            if count == 12:
                break
        else:
            raise SystemExit("insufficient-disjoint-candidates:" + language)
        screened[language] = attempts
    if (len(selected) != 24 or len(seen) != 24 or seen & excluded or
            sum(row["language"] == "Python" for row in selected) != 12):
        raise SystemExit("selected-denominator-or-disjointness-drift")
    result = {
        "schema_version": "are.g01-bugswarm-graph-dev-b-metadata-r1/v1",
        "status": "metadata-candidates-only-not-source-log-or-label-admitted",
        "input_sha256": PINS,
        "protocol_sha256": sha(args.protocol.read_bytes()),
        "script_sha256": sha(Path(__file__).read_bytes()),
        "rule": "Pinned source order; original r1 development hash parity; first 12 remaining eligible repository-disjoint Python and Java cases after excluding prior exposed, original and repaired development, and reserved confirmation repositories; no patch path or score",
        "excluded_repositories": len(excluded),
        "exclusion_source_counts": {name: len({row["repo"].lower() for row in rows})
                                    for name, rows in sources.items()},
        "screened_source_positions": screened,
        "selected": selected,
        "gold_paths_opened": False,
        "logs_opened": False,
        "reserved_confirmation_opened": False,
        "model_calls": 0,
        "claim_ceiling": "Second development metadata candidates only; exact source/log/gold admission remains before ranking, provider calls, or claims."
    }
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"selected": len(selected), "excluded_repositories": len(excluded),
                      "screened_source_positions": screened, "output_sha256": sha(data)}))


if __name__ == "__main__":
    main()
