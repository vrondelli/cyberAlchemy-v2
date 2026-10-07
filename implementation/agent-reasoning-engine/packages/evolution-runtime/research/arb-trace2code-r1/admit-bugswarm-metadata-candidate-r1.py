#!/usr/bin/env python3
"""Admit a prospective 24-case BugSwarm metadata candidate from a sealed order."""

from __future__ import annotations

from collections import Counter
import argparse
import hashlib
import json
import os
from pathlib import Path
import re


RAW_SHA256 = "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d"
ORDER_SHA256 = "63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c"
SHA = re.compile(r"[0-9a-f]{40}\Z")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def admitted(row: dict) -> bool:
    failed, passed = row["failed_job"], row["passed_job"]
    changed = row.get("metrics", {}).get("num_of_changed_files")
    return (row.get("status") == "active"
            and row.get("reproducibility_status", {}).get("status") == "Reproducible"
            and row.get("is_error_pass") is False
            and row.get("classification", {}).get("code") == "Yes"
            and isinstance(changed, int) and not isinstance(changed, bool) and 1 <= changed <= 3
            and isinstance(failed.get("num_tests_failed"), int)
            and not isinstance(failed["num_tests_failed"], bool)
            and failed["num_tests_failed"] > 0
            and isinstance(failed.get("job_id"), int)
            and isinstance(failed.get("trigger_sha"), str)
            and SHA.fullmatch(failed["trigger_sha"]) is not None
            and isinstance(passed.get("trigger_sha"), str)
            and SHA.fullmatch(passed["trigger_sha"]) is not None)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("raw", "order", "output"):
        parser.add_argument(f"--{name}", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.raw.read_bytes()) != RAW_SHA256 or \
            digest(args.order.read_bytes()) != ORDER_SHA256:
        raise SystemExit("output-exists-or-input-pin-drift")
    raw = json.loads(args.raw.read_bytes())
    order = json.loads(args.order.read_text())
    by_tag = {row["image_tag"]: row for row in raw}
    if len(raw) != 4388 or len(by_tag) != 4388 or \
            set(order["ordered"]) != {"Python", "Java"}:
        raise SystemExit("population-shape-drift")
    selected, seen_repos = [], set()
    screened = Counter()
    for language in ("Python", "Java"):
        language_count = 0
        for position, candidate in enumerate(order["ordered"][language], 1):
            row = by_tag.get(candidate["image_tag"])
            if (row is None or row["repo"] != candidate["repo"]
                    or row["lang"] != language
                    or row["failed_job"]["job_id"] != candidate["failure_job_id"]
                    or row["failed_job"]["trigger_sha"] != candidate["failure_commit"]):
                raise SystemExit("source-order-identity-drift")
            screened[language] += 1
            if not admitted(row) or row["repo"] in seen_repos:
                continue
            selected.append({"ordinal": len(selected) + 1, "source_order_position": position,
                             **candidate})
            seen_repos.add(row["repo"])
            language_count += 1
            if language_count == 12:
                break
        if language_count != 12:
            raise SystemExit("insufficient-metadata-admitted-repositories:" + language)
    if len(selected) != 24 or len(seen_repos) != 24 or \
            len({item["failure_job_id"] for item in selected}) != 24:
        raise SystemExit("selected-denominator-drift")
    result = {"schema_version": "are.g01-bugswarm-metadata-candidate-24-r1/v1",
              "status": "prospective-metadata-candidate-not-source-log-or-gold-admitted",
              "raw_sha256": RAW_SHA256, "source_order_sha256": ORDER_SHA256,
              "script_sha256": digest(Path(__file__).read_bytes()),
              "rule": "Follow sealed failure-side order; admit active reproducible code-classified 1-3-file fail-pass cases with complete SHAs and failing tests; take first 12 unique repositories per language, Python then Java; no substitution after this candidate",
              "screened_source_positions": dict(screened), "cases": 24,
              "repositories": 24, "selected": selected,
              "gold_paths_opened": False, "logs_opened": False, "model_calls": 0,
              "claim_ceiling": "Metadata candidate only. All 24 need independent log, exact-source and patch-path admission before a campaign freeze or model call."}
    data = (json.dumps(result, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(selected), "repositories": len(seen_repos),
                      "screened_source_positions": dict(screened),
                      "candidate_sha256": digest(data)}))


if __name__ == "__main__":
    main()
