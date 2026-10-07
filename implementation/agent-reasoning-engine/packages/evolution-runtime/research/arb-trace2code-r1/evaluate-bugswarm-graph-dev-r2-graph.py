#!/usr/bin/env python3
"""Evaluator-only paired ARE versus graph treatment on development r2."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import random


PINS = {
    "graph_seal": "7b5f5e7e88b04d0244fa9650c1f24e87ac01e1780214343cae002f7e7ade067c",
    "are_seal": "45600cfba313f530d2357fb30ec3304fe8ea23ea02c0fcb21b30d210c9a95824",
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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in (*PINS, "graph_rankings", "are_rankings", "output"):
        parser.add_argument("--" + name.replace("_", "-"), required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or any(sha(getattr(args, name).read_bytes()) != pin
                                   for name, pin in PINS.items()):
        raise SystemExit("input-pin-drift-or-output-exists")
    graph_seal = json.loads(args.graph_seal.read_bytes())
    graph_data = args.graph_rankings.read_bytes()
    if sha(graph_data) != graph_seal["rankings_sha256"]:
        raise SystemExit("graph-prediction-drift")
    graph = [json.loads(line) for line in graph_data.splitlines()]
    are_seal = json.loads(args.are_seal.read_bytes())["rankings"]
    gold = json.loads(args.gold.read_bytes())["results"]
    projected = json.loads(args.projection.read_bytes())["results"]
    are_eval = json.loads(args.are_evaluation.read_bytes())
    if not all(len(rows) == 24 for rows in (graph, are_seal, gold, projected,
                                            are_eval["cases"])):
        raise SystemExit("denominator-drift")
    cases, deltas = [], []
    for ordinal, (treatment, baseline, label, projection, old_score) in enumerate(zip(
            graph, are_seal, gold, projected, are_eval["cases"]), 1):
        baseline_path = args.are_rankings / f"ARE-RANKING-{ordinal:02d}.json"
        baseline_data = baseline_path.read_bytes()
        old = json.loads(baseline_data)
        if (treatment["ordinal"] != ordinal or baseline["ordinal"] != ordinal
                or label["ordinal"] != ordinal or projection["ordinal"] != ordinal
                or old_score["ordinal"] != ordinal or not label["gold_admissible"]
                or not projection["all_projected"]
                or sha(baseline_data) != baseline["ranking_sha256"]
                or treatment["are_ranking_sha256"] != baseline["ranking_sha256"]
                or treatment["id"] != old["id"] or treatment["id"] != label["image_tag"]
                or treatment["id"] != projection["image_tag"]
                or treatment["gold_opened"] is not False
                or treatment["model_calls"] != 0):
            raise SystemExit("prediction-or-label-identity-drift:" + str(ordinal))
        gold_paths = {item["path"] for item in label["source_gold_paths"]}
        projected_paths = {item["path"] for item in projection["source_gold_paths"]}
        if not gold_paths or gold_paths != projected_paths:
            raise SystemExit("gold-projection-path-drift")
        old_order, new_order = old["ranked_files"], treatment["ranked_files"]
        if (len(new_order) != len(old_order) or set(new_order) != set(old_order)
                or len(new_order) != len(set(new_order))):
            raise SystemExit("candidate-coverage-drift:" + str(ordinal))
        a, b = metric(old_order, gold_paths), metric(new_order, gold_paths)
        if (a["rr8"] != old_score["are_rr8"] or a["hit3"] != old_score["are_hit3"]
                or a["reach30"] != old_score["are_candidate_reach30"]):
            raise SystemExit("baseline-recomputation-drift:" + str(ordinal))
        delta = b["rr8"] - a["rr8"]
        deltas.append(delta)
        cases.append({"ordinal": ordinal, "id": treatment["id"],
                      "repo": treatment["repo"], "language": treatment["language"],
                      "gold_paths": sorted(gold_paths), "are": a, "graph": b,
                      "delta_rr8": delta,
                      "filename_seeds": treatment["filename_seed_count"],
                      "symbol_seeds": treatment["symbol_seed_count"],
                      "graph_neighbors": treatment["graph_neighbor_count"]})
    mean = lambda values: sum(values) / len(values)
    rng = random.Random(int(PINS["graph_seal"][:8], 16))
    draws = sorted(mean([deltas[rng.randrange(24)] for _ in range(24)])
                   for _ in range(BOOTSTRAP_DRAWS))
    interval = [draws[int((BOOTSTRAP_DRAWS - 1) * 0.025)],
                draws[int((BOOTSTRAP_DRAWS - 1) * 0.975)]]
    aggregate = {arm: {"mrr8": mean([case[arm]["rr8"] for case in cases]),
                       "hit3": sum(case[arm]["hit3"] for case in cases),
                       "reach30": sum(case[arm]["reach30"] for case in cases)}
                 for arm in ("are", "graph")}
    paired = {"delta_mrr8": mean(deltas), "bootstrap_95_percentile": interval,
              "wins": sum(value > 0 for value in deltas),
              "ties": sum(value == 0 for value in deltas),
              "losses": sum(value < 0 for value in deltas)}
    quality_gate = {"complete_rankings": len(cases) == 24,
                    "reach30_at_least_20": aggregate["graph"]["reach30"] >= 20,
                    "mrr8_at_least_0_31875": aggregate["graph"]["mrr8"] >= 0.31875,
                    "wins_at_least_16": paired["wins"] >= 16,
                    "bootstrap_lower_above_zero": interval[0] > 0}
    quality_gate["passed"] = all(quality_gate.values())
    result = {"schema_version": "are.g01-bugswarm-graph-dev-evaluation-r2/v1",
              "pins": PINS, "graph_rankings_sha256": sha(graph_data),
              "script_sha256": sha(Path(__file__).read_bytes()),
              "cases": cases, "aggregate": aggregate, "paired": paired,
              "quality_gate": quality_gate,
              "cost_gate": "not prospectively frozen; measured runtime descriptive only",
              "graph_ranker_elapsed_ms_sum": graph_seal["total_ranker_elapsed_ms"],
              "claim_ceiling": "Private exposed-development source-only comparison; not an admitted end-to-end cost gate, fresh confirmation, ContextBench, live ARE, or product superiority."}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"cases": len(cases), "aggregate": aggregate,
                      "paired": paired, "quality_gate": quality_gate,
                      "evaluation_sha256": sha(data)}), flush=True)


if __name__ == "__main__":
    main()
