#!/usr/bin/env python3
"""Evaluator-only score for sealed G01 development test-edge r3."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import random


PINS = {
    "r3_seal": "13ff95addf7ac81580dbe8ed5919bd65a0445f85e636b547e6f1f8009e5f2765",
    "r2_seal": "7b5f5e7e88b04d0244fa9650c1f24e87ac01e1780214343cae002f7e7ade067c",
    "gold": "454c8d74fb30f4a0dcaeea4eb7fd2a0fdf8d77b3d46c0f568a86a3e74a90322d",
    "projection": "c4d2c61f61028c9abbef6f41bc37c455223aa6fd84fceb3793704dcf72e93093",
    "are_evaluation": "81ad5eff53849c5e31c0825c8548abd1682088947e046d19820f3bb4068e73bf",
}
BOOTSTRAP_DRAWS = 20_000


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def metric(order: list[str], gold: set[str]) -> dict:
    first = next((index for index, path in enumerate(order[:8], 1) if path in gold), None)
    return {"rr8": 1 / first if first else 0.0,
            "hit3": int(bool(gold.intersection(order[:3]))),
            "reach30": bool(gold.intersection(order[:30]))}


def interval(values: list[float], seed: int) -> list[float]:
    rng = random.Random(seed)
    draws = sorted(sum(values[rng.randrange(24)] for _ in range(24)) / 24
                   for _ in range(BOOTSTRAP_DRAWS))
    return [draws[int((BOOTSTRAP_DRAWS - 1) * 0.025)],
            draws[int((BOOTSTRAP_DRAWS - 1) * 0.975)]]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in (*PINS, "r3_rankings", "r2_rankings", "output"):
        parser.add_argument("--" + name.replace("_", "-"), required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or any(sha(getattr(args, name).read_bytes()) != pin
                                   for name, pin in PINS.items()):
        raise SystemExit("input-pin-drift-or-output-exists")
    r3_seal = json.loads(args.r3_seal.read_bytes())
    r2_seal = json.loads(args.r2_seal.read_bytes())
    r3_data, r2_data = args.r3_rankings.read_bytes(), args.r2_rankings.read_bytes()
    if (sha(r3_data) != r3_seal["rankings_sha256"]
            or sha(r2_data) != r2_seal["rankings_sha256"]):
        raise SystemExit("ranking-pin-drift")
    r3 = [json.loads(line) for line in r3_data.splitlines()]
    r2 = [json.loads(line) for line in r2_data.splitlines()]
    gold = json.loads(args.gold.read_bytes())["results"]
    projected = json.loads(args.projection.read_bytes())["results"]
    are_eval = json.loads(args.are_evaluation.read_bytes())["cases"]
    if not all(len(rows) == 24 for rows in (r3, r2, gold, projected, are_eval)):
        raise SystemExit("denominator-drift")
    cases, delta_are, delta_r2 = [], [], []
    for ordinal, (new, old, label, projection, baseline) in enumerate(zip(
            r3, r2, gold, projected, are_eval), 1):
        if (new["ordinal"] != ordinal or old["ordinal"] != ordinal
                or label["ordinal"] != ordinal or projection["ordinal"] != ordinal
                or baseline["ordinal"] != ordinal or new["id"] != old["id"]
                or new["id"] != label["image_tag"] or new["id"] != baseline["id"]
                or new["r2_ranking_sha256"] != r2_seal["rankings_sha256"]
                or not label["gold_admissible"] or not projection["all_projected"]
                or new["gold_opened"] is not False or new["model_calls"] != 0):
            raise SystemExit("case-identity-or-admission-drift:" + str(ordinal))
        gold_paths = {item["path"] for item in label["source_gold_paths"]}
        if not gold_paths or gold_paths != {item["path"] for item in projection["source_gold_paths"]}:
            raise SystemExit("gold-path-projection-drift")
        old_order, new_order = old["ranked_files"], new["ranked_files"]
        if len(new_order) != len(old_order) or set(new_order) != set(old_order):
            raise SystemExit("coverage-drift")
        old_metric, new_metric = metric(old_order, gold_paths), metric(new_order, gold_paths)
        are_metric = {"rr8": baseline["are_rr8"], "hit3": baseline["are_hit3"],
                      "reach30": baseline["are_candidate_reach30"]}
        delta_are.append(new_metric["rr8"] - are_metric["rr8"])
        delta_r2.append(new_metric["rr8"] - old_metric["rr8"])
        cases.append({"ordinal": ordinal, "id": new["id"], "repo": new["repo"],
                      "language": new["language"], "gold_paths": sorted(gold_paths),
                      "are": are_metric, "r2": old_metric, "r3": new_metric,
                      "delta_vs_are": delta_are[-1], "delta_vs_r2": delta_r2[-1],
                      "test_seed_count": new["test_seed_count"],
                      "edge_target_count": new["edge_target_count"]})
    mean = lambda values: sum(values) / len(values)
    aggregate = {arm: {"mrr8": mean([case[arm]["rr8"] for case in cases]),
                       "hit3": sum(case[arm]["hit3"] for case in cases),
                       "reach30": sum(case[arm]["reach30"] for case in cases)}
                 for arm in ("are", "r2", "r3")}
    paired = {name: {"delta_mrr8": mean(values),
                     "bootstrap_95_percentile": interval(values, int(PINS["r3_seal"][:8], 16)),
                     "wins": sum(value > 0 for value in values),
                     "ties": sum(value == 0 for value in values),
                     "losses": sum(value < 0 for value in values)}
              for name, values in (("versus_are", delta_are), ("versus_r2", delta_r2))}
    gate = {"complete_rankings": len(cases) == 24,
            "reach30_at_least_20": aggregate["r3"]["reach30"] >= 20,
            "mrr8_at_least_0_43234": aggregate["r3"]["mrr8"] >= 0.43234,
            "wins_at_least_16_vs_are": paired["versus_are"]["wins"] >= 16,
            "bootstrap_lower_above_zero_vs_are": paired["versus_are"]["bootstrap_95_percentile"][0] > 0,
            "incremental_time_at_most_30s": r3_seal["incremental_elapsed_ms_sum"] <= 30_000}
    gate["passed"] = all(gate.values())
    result = {"schema_version": "are.g01-bugswarm-graph-dev-test-edges-evaluation-r3/v1",
              "pins": PINS, "r3_rankings_sha256": sha(r3_data),
              "script_sha256": sha(Path(__file__).read_bytes()),
              "aggregate": aggregate, "paired": paired, "gate": gate,
              "r3_incremental_elapsed_ms_sum": r3_seal["incremental_elapsed_ms_sum"],
              "cases": cases,
              "claim_ceiling": "Exposed source-only development only; HTTP payloads provisional; no GLM, independent confirmation, ContextBench, live ARE, or product superiority."}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"aggregate": aggregate, "paired": paired,
                      "gate": gate, "evaluation_sha256": sha(data)}), flush=True)


if __name__ == "__main__":
    main()
