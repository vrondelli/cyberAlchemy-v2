#!/usr/bin/env python3
"""Open Bears r76 evaluator paths only after r77 source rankings are sealed."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import random

GOLD_SHA = "1ec15024bda4e39528c6e9971d6911569e4e38431f94ed700d0319032ef11460"
BOOTSTRAP_DRAWS = 100000
BOOTSTRAP_SEED = 770024


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def metrics(ranked, labels):
    positions = [position for position, path in enumerate(ranked, 1) if path in labels]
    first = min(positions) if positions else None
    return {"first_rank": first, "rr8": 1 / first if first is not None and first <= 8 else 0.0,
            "hit3": int(first is not None and first <= 3),
            "recall20": sum(position <= 20 for position in positions) / len(labels)}


def mean(values):
    return sum(values) / len(values)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--gold", required=True, type=Path)
    parser.add_argument("--fusion", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists() or sha(args.gold.read_bytes()) != GOLD_SHA:
        raise SystemExit("output-exists-or-gold-drift")
    fusion = json.loads((args.fusion / "FUSION-SEAL.json").read_bytes())
    ranks_path = args.fusion / "RANKINGS.jsonl"
    ranks = [json.loads(line) for line in ranks_path.read_text().splitlines()]
    label_set = json.loads(args.gold.read_bytes())
    labels = label_set["results"]
    if (fusion["cases"] != 24 or fusion["gold_values_used"] or len(ranks) != 24
            or sha(ranks_path.read_bytes()) != fusion["rankings_sha256"]
            or not label_set["all_24_admitted"] or len(labels) != 24):
        raise SystemExit("source-seal-or-population-drift")
    args.output.mkdir(parents=True, mode=0o700)
    save(args.output / "EVALUATION-FREEZE.json", {
        "schema_version": "are.g01-bears-r77-evaluation-freeze/v1", "gold_sha256": GOLD_SHA,
        "fusion_seal_sha256": sha((args.fusion / "FUSION-SEAL.json").read_bytes()),
        "rankings_sha256": fusion["rankings_sha256"], "script_sha256": sha(Path(__file__).read_bytes()),
        "protocol_sha256": sha(Path(__file__).with_name("R77-JAVA-TRANSFER-PROTOCOL.md").read_bytes()),
        "bootstrap_draws": BOOTSTRAP_DRAWS, "bootstrap_seed": BOOTSTRAP_SEED})
    rows = []
    for ordinal, (ranked, gold) in enumerate(zip(ranks, labels, strict=True), 1):
        if (ranked["ordinal"] != ordinal or gold["selection_ordinal"] != ordinal
                or not gold["admissible"] or ranked["id"] != gold["bug_id"]
                or ranked["repo"] != gold["repo"]):
            raise SystemExit(f"case-identity:{ordinal}")
        paths = set(gold["gold_paths"])
        universe = set(ranked["base"])
        if (not paths or not paths <= universe
                or any(set(ranked[name]) != universe or len(ranked[name]) != len(universe)
                       for name in ("are", "raw_bm25", "treatment"))):
            raise SystemExit(f"label-coverage:{ordinal}")
        scores = {name: metrics(ranked[name], paths)
                  for name in ("are", "raw_bm25", "base", "treatment")}
        rows.append({"ordinal": ordinal, "id": ranked["id"], "repo": ranked["repo"],
                     "gold_paths": sorted(paths), **scores,
                     "delta_rr8": scores["treatment"]["rr8"] - scores["base"]["rr8"]})
    aggregate = {name: {metric: mean([row[name][metric] for row in rows])
                        for metric in ("rr8", "hit3", "recall20")}
                 for name in ("are", "raw_bm25", "base", "treatment")}
    deltas = [row["delta_rr8"] for row in rows]
    rng = random.Random(BOOTSTRAP_SEED)
    draws = sorted(mean([deltas[rng.randrange(24)] for _ in range(24)])
                   for _ in range(BOOTSTRAP_DRAWS))
    lower, upper = draws[2499], draws[97499]
    uplift = aggregate["treatment"]["rr8"] - aggregate["base"]["rr8"]
    wins = sum(delta > 0 for delta in deltas)
    losses = sum(delta < 0 for delta in deltas)
    gates = {"valid_case_receipts": len(rows) == 24,
             "valid_summaries": fusion["valid_summaries"] >= 22,
             "mrr8_uplift": uplift >= 0.05,
             "bootstrap_lower_positive": lower > 0,
             "hit3_nonregression": aggregate["treatment"]["hit3"] >= aggregate["base"]["hit3"],
             "recall20_nonregression": aggregate["treatment"]["recall20"] >= aggregate["base"]["recall20"],
             "repository_wins": wins >= 14}
    result = {"schema_version": "are.g01-bears-r77-evaluation/v1", "cases": 24,
              "valid_summaries": fusion["valid_summaries"], "scores": aggregate,
              "mrr8_uplift": uplift, "paired_bootstrap_95_interval": [lower, upper],
              "wins": wins, "ties": 24-wins-losses, "losses": losses,
              "gates": gates, "bounded_gate_pass": all(gates.values()),
              "claim_ceiling": "label-shape-selected Bears Java structured-failure file-localization vs matched baseline only; no product superiority",
              "rows": rows}
    save(args.output / "EVALUATION-RESULT.json", result)
    print(json.dumps({key: value for key, value in result.items() if key != "rows"}, sort_keys=True))


if __name__ == "__main__":
    main()
