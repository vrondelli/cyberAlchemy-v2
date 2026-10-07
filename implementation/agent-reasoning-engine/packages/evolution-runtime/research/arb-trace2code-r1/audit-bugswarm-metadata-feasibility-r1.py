#!/usr/bin/env python3
"""Evaluator-only counts for a pinned BugSwarm trace-to-code candidate pool."""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import re


PINS = {
    "raw": "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d",
    "source": "5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686",
    "r1": "888952ed833231141fe3c9f86efd357a7f84bcbeeafdcdb790a775f6e9f7df33",
    "r2": "77774d6aeffe6d32dd5d12ad512086ef613384909fa853c169b49baf11e5743c",
}
SHA = re.compile(r"[0-9a-f]{40}\Z")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("raw", "source", "r1", "r2", "output"):
        parser.add_argument(f"--{name}", type=Path, required=True)
    args = parser.parse_args()
    paths = {name: getattr(args, name) for name in PINS}
    if args.output.exists() or any(digest(path.read_bytes()) != PINS[name]
                                   for name, path in paths.items()):
        raise SystemExit("output-exists-or-input-pin-drift")
    raw = json.loads(args.raw.read_bytes())
    source = [json.loads(line) for line in args.source.read_text().splitlines()]
    if len(raw) != 4388 or len(source) != 4388:
        raise SystemExit("population-denominator-drift")
    by_tag = {row["image_tag"]: row for row in source}
    if len(by_tag) != len(source):
        raise SystemExit("source-duplicate-tag")
    prior = [*json.loads(args.r1.read_text())["selected"],
             *json.loads(args.r2.read_text())["selected"]]
    if len(prior) != 48:
        raise SystemExit("prior-cohort-drift")
    prior_basenames = {row["repo"].lower() for row in prior}
    eligible = []
    for row in raw:
        failure = row["failed_job"]
        passing = row["passed_job"]
        source_row = by_tag.get(row["image_tag"])
        if source_row is None or source_row["repo"] != row["repo"] or \
                source_row["failure"]["job_id"] != failure["job_id"] or \
                source_row["failure"]["trigger_sha"] != failure["trigger_sha"]:
            raise SystemExit("source-identity-mismatch")
        if (row.get("status") != "active"
                or row.get("reproducibility_status", {}).get("status") != "Reproducible"
                or row.get("is_error_pass") is not False
                or row.get("classification", {}).get("code") != "Yes"
                or not isinstance(row.get("metrics", {}).get("num_of_changed_files"), int)
                or not 1 <= row["metrics"]["num_of_changed_files"] <= 3
                or not isinstance(failure.get("num_tests_failed"), int)
                or failure["num_tests_failed"] <= 0
                or not isinstance(failure.get("job_id"), int)
                or not isinstance(failure.get("trigger_sha"), str)
                or not SHA.fullmatch(failure["trigger_sha"])
                or not isinstance(passing.get("trigger_sha"), str)
                or not SHA.fullmatch(passing["trigger_sha"])):
            continue
        eligible.append(row)
    if len({row["failed_job"]["job_id"] for row in eligible}) != len(eligible):
        raise SystemExit("eligible-failure-job-duplicate")
    disjoint = [row for row in eligible
                if row["repo"].split("/")[-1].lower() not in prior_basenames]
    counts = Counter(row["lang"] for row in eligible)
    disjoint_counts = Counter(row["lang"] for row in disjoint)
    receipt = {
        "schema_version": "are.g01-bugswarm-metadata-feasibility-r1/v1",
        "posture": "evaluator-only-counts-no-cohort-selection-log-checkout-or-model",
        "release": "BugSwarm 1.3.1",
        "input_sha256": PINS,
        "script_sha256": digest(Path(__file__).read_bytes()),
        "population_records": len(raw),
        "strict_preliminary_eligible": {
            "cases": len(eligible),
            "repositories": len({row["repo"] for row in eligible}),
            "languages": dict(sorted(counts.items())),
        },
        "basename_disjoint_from_bugsinpy_r1_r2b": {
            "cases": len(disjoint),
            "repositories": len({row["repo"] for row in disjoint}),
            "languages": dict(sorted(disjoint_counts.items())),
            "excluded_prior_basenames": len(prior_basenames),
        },
        "eligibility_rule": "active, Reproducible, fail-pass not error-pass, code classification Yes, 1-3 changed files, failing tests >0, complete 40-hex failed/passed SHAs, unique failed job ID",
        "claim_ceiling": "Metadata supply only; no log/source availability, gold-path or patch validity, independent selection, actual ranking, live ARE episode, cost or superiority.",
    }
    data = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"eligible": receipt["strict_preliminary_eligible"],
                      "disjoint": receipt["basename_disjoint_from_bugsinpy_r1_r2b"],
                      "receipt_sha256": digest(data)}))


if __name__ == "__main__":
    main()
