#!/usr/bin/env python3
"""Open r67 direct-tree labels only after r72 source rankings are sealed."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import random

GOLD_SHA = "91c2c3665f1e94ef9e3106d9ece699f313a92eb6ba145b27572ff33989caba27"
BOOTSTRAP_DRAWS = 100000
BOOTSTRAP_SEED = 720024


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def metrics(ranked, labels):
    hit_positions = [position for position, path in enumerate(ranked, 1) if path in labels]
    first = min(hit_positions) if hit_positions else None
    return {"first_rank": first, "rr8": 1 / first if first is not None and first <= 8 else 0.0,
            "hit3": int(first is not None and first <= 3),
            "recall20": sum(position <= 20 for position in hit_positions) / len(labels)}


def mean(values):
    return sum(values) / len(values)


def summary(rows):
    return {key: {"baseline": mean([r["baseline"][key] for r in rows]),
                  "treatment": mean([r["treatment"][key] for r in rows])}
            for key in ("rr8", "hit3", "recall20")}


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
    labels = json.loads(args.gold.read_bytes())
    selected = labels["selected_original_ordinals"]
    if (fusion["cases"] != 24 or fusion["gold_opened"] or len(ranks) != 24
            or sha(ranks_path.read_bytes()) != fusion["rankings_sha256"]
            or len(selected) != 24 or selected != list(range(1, 25))):
        raise SystemExit("source-seal-or-population-drift")
    gold_by_ordinal = {row["ordinal"]: row for row in labels["results"]}
    args.output.mkdir(parents=True, mode=0o700)
    save(args.output / "EVALUATION-FREEZE.json", {
        "schema_version": "are.g01-r72-evaluation-freeze/v1", "gold_sha256": GOLD_SHA,
        "fusion_seal_sha256": sha((args.fusion / "FUSION-SEAL.json").read_bytes()),
        "rankings_sha256": fusion["rankings_sha256"], "script_sha256": sha(Path(__file__).read_bytes()),
        "protocol_sha256": sha(Path(__file__).with_name("R72-MIXED-INPUT-PROTOCOL.md").read_bytes()),
        "bootstrap_draws": BOOTSTRAP_DRAWS, "bootstrap_seed": BOOTSTRAP_SEED})
    cases = []
    for ordinal, ranked in enumerate(ranks, 1):
        gold = gold_by_ordinal[ordinal]
        if (ranked["ordinal"] != ordinal or gold["ordinal"] != ordinal
                or not gold["admissible"] or ranked["id"] != gold["image_tag"]
                or ranked["repo"] != gold["repo"] or ranked["input_type"] not in ("complete-log", "metadata-only")):
            raise SystemExit(f"case-identity:{ordinal}")
        paths = set(gold["direct_old_source_paths"])
        if not paths or not paths <= set(ranked["base"]) or set(ranked["base"]) != set(ranked["treatment"]):
            raise SystemExit(f"label-coverage:{ordinal}")
        base = metrics(ranked["base"], paths)
        treatment = metrics(ranked["treatment"], paths)
        cases.append({"ordinal": ordinal, "id": ranked["id"], "repo": ranked["repo"],
                      "input_type": ranked["input_type"], "gold_paths": sorted(paths),
                      "baseline": base, "treatment": treatment,
                      "delta_rr8": treatment["rr8"] - base["rr8"]})
    deltas = [row["delta_rr8"] for row in cases]
    rng = random.Random(BOOTSTRAP_SEED)
    draws = sorted(mean([deltas[rng.randrange(24)] for _ in range(24)])
                   for _ in range(BOOTSTRAP_DRAWS))
    lower, upper = draws[2499], draws[97499]
    all_scores = summary(cases)
    strata = {kind: summary([row for row in cases if row["input_type"] == kind])
              for kind in ("complete-log", "metadata-only")}
    wins = sum(delta > 0 for delta in deltas)
    losses = sum(delta < 0 for delta in deltas)
    uplift = all_scores["rr8"]["treatment"] - all_scores["rr8"]["baseline"]
    gates = {"valid_case_receipts": len(cases) == 24,
             "valid_summaries": fusion["valid_summaries"] >= 22,
             "mrr8_uplift": uplift >= 0.05,
             "bootstrap_lower_positive": lower > 0,
             "hit3_nonregression": all_scores["hit3"]["treatment"] >= all_scores["hit3"]["baseline"],
             "recall20_nonregression": all_scores["recall20"]["treatment"] >= all_scores["recall20"]["baseline"],
             "repository_wins": wins >= 14}
    result = {"schema_version": "are.g01-r72-evaluation/v1", "cases": 24,
              "valid_summaries": fusion["valid_summaries"], "scores": all_scores,
              "strata": strata, "mrr8_uplift": uplift,
              "paired_bootstrap_95_interval": [lower, upper],
              "wins": wins, "ties": 24-wins-losses, "losses": losses,
              "gates": gates, "bounded_gate_pass": all(gates.values()),
              "claim_ceiling": "fresh label-shape-selected BugSwarm Python mixed-input file-localization only; no product superiority",
              "rows": cases}
    save(args.output / "EVALUATION-RESULT.json", result)
    print(json.dumps({key: value for key, value in result.items() if key != "rows"}, sort_keys=True))


if __name__ == "__main__":
    main()
