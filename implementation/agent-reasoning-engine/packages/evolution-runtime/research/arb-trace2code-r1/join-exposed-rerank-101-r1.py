#!/usr/bin/env python3
"""Counts-only 101-case join of the separately sealed ARB rerank pilot and transfer."""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import pathlib
import statistics

PILOT_SHA256 = "65918b6db77adbc71727ea440999b304ce5e1ab5bb3026e25fdd449575b848b9"
TRANSFER_SHA256 = "7b4815ee74c36b28225ef232b00bf6dff9045e8b361a896884c35e6f6542c24c"


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pilot", type=pathlib.Path, required=True)
    parser.add_argument("--transfer", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or digest(args.pilot) != PILOT_SHA256 or \
            digest(args.transfer) != TRANSFER_SHA256:
        raise SystemExit("output exists or input audit drift")
    pilot, transfer = json.loads(args.pilot.read_text()), json.loads(args.transfer.read_text())
    if pilot["cases"] != 12 or transfer["cases"] != 89 or not pilot["advancement_passed"] or \
            not transfer["advancement_passed"]:
        raise SystemExit("cohort or gate drift")
    rows = pilot["per_case_numeric_only"] + transfer["per_case_numeric_only"]
    if len(rows) != 101 or len({row["id"] for row in rows}) != 101 or \
            any(row["status"] != "valid" for row in rows):
        raise SystemExit("joined denominator or validity drift")
    arms = ("proposal", "are", "arb")
    metrics = ("mrr_at_8", "hit_at_3", "recall_at_20")
    aggregate = {arm: {metric: statistics.mean(row["metrics"][arm][metric] for row in rows)
                       for metric in metrics} for arm in arms}
    per_repo = {}
    for repo in sorted({row["repo"] for row in rows}):
        subset = [row for row in rows if row["repo"] == repo]
        per_repo[repo] = {"cases": len(subset), "mrr_at_8": {
            arm: statistics.mean(row["metrics"][arm]["mrr_at_8"] for row in subset)
            for arm in arms}}
    deltas = [value["mrr_at_8"]["proposal"] - value["mrr_at_8"]["are"]
              for value in per_repo.values()]
    observed = statistics.mean(deltas)
    null = [statistics.mean(sign * value for sign, value in zip(signs, deltas))
            for signs in itertools.product((-1, 1), repeat=len(deltas))]
    pvalue = sum(abs(value) >= abs(observed) - 1e-15 for value in null) / len(null)
    report = {"schema": "are.arb-exposed-rerank-101-join-r1/v1",
              "posture": "exploratory, fully exposed 101-case development; no independent inference or superiority",
              "pilot_audit_sha256": PILOT_SHA256, "transfer_audit_sha256": TRANSFER_SHA256,
              "cases": 101, "repositories": len(per_repo), "aggregate": aggregate,
              "per_repo": per_repo,
              "paired_vs_are": {"wins": sum(row["metrics"]["proposal"]["mrr_at_8"] >
                                           row["metrics"]["are"]["mrr_at_8"] for row in rows),
                                "losses": sum(row["metrics"]["proposal"]["mrr_at_8"] <
                                             row["metrics"]["are"]["mrr_at_8"] for row in rows),
                                "ties": sum(row["metrics"]["proposal"]["mrr_at_8"] ==
                                           row["metrics"]["are"]["mrr_at_8"] for row in rows)},
              "exploratory_equal_repo_mean_mrr_delta_vs_are": observed,
              "exploratory_exact_repo_signflip_p_two_sided": pvalue,
              "claim_ceiling": "Source-projected ARB development only; official RepoMap, independent population, live ARE, and ContextBench remain untested."}
    args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
