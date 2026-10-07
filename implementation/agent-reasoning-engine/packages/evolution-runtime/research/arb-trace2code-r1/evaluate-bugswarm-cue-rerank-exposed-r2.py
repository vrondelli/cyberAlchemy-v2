#!/usr/bin/env python3
"""Evaluator-only paired score of sealed exposed BugSwarm cue rerank responses."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import random


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
OUTPUT = ARCHIVE / "exposed-cue-packets-r1" / "evaluator-only-r2" / "EVALUATION-R2.json"
PINS = {
    "predictions": "c1b27f1ce896a020e1c526c36960c1f38ec2583fbb048775d1ac5b31d9ea2d96",
    "prediction_seal": "889219fcfc5f0a9ff3edb62e1d09c577e1a3a427c3758e6af465fbc6708d001b",
    "expanded_packets": "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7",
    "original_packets": "ee0d6ff047426241b6533e5938f7da97219a6f64336b13e354b739c68e6baa76",
    "original_evaluation": "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3",
    "cue_audit": "fe9c20efb2b3b4f212919417999cd6e003cb3dd908b592d6ff2e7efe5b6969af",
}
DRAW_COUNT = 20_000
COHORT_SEED = int("fc099fb2", 16)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metric(order: list[str], gold: set[str]) -> dict:
    first = next((index for index, path in enumerate(order[:8], 1) if path in gold), None)
    return {"rr8": 1 / first if first else 0.0,
            "hit3": int(bool(gold & set(order[:3]))),
            "recall20": len(gold & set(order[:20])) / len(gold)}


def mean(values: list[float]) -> float:
    return sum(values) / len(values)


def interval(differences: list[float]) -> list[float]:
    rng = random.Random(COHORT_SEED)
    n = len(differences)
    draws = sorted(mean([differences[rng.randrange(n)] for _ in range(n)])
                   for _ in range(DRAW_COUNT))
    return [draws[int((DRAW_COUNT - 1) * 0.025)],
            draws[int((DRAW_COUNT - 1) * 0.975)]]


def paired(differences: list[float]) -> dict:
    return {"delta_mrr8": mean(differences), "bootstrap_95_percentile": interval(differences),
            "wins": sum(value > 0 for value in differences),
            "ties": sum(value == 0 for value in differences),
            "losses": sum(value < 0 for value in differences)}


def main() -> None:
    private = ARCHIVE / "exposed-cue-packets-r1"
    paths = {
        "predictions": private / "predictions-r2" / "PREDICTIONS.jsonl",
        "prediction_seal": private / "predictions-r2" / "PREDICTION-SEAL.json",
        "expanded_packets": private / "PACKETS.jsonl",
        "original_packets": ARCHIVE / "vps-run-r1" / "packets-r1" / "PACKETS.jsonl",
        "original_evaluation": ARCHIVE / "evaluator-only-r1" / "EVALUATION-R1.json",
        "cue_audit": ARCHIVE / "exposed-full-log-cues-r1" / "EVALUATOR-AUDIT.json",
    }
    if OUTPUT.exists() or any(digest(paths[name]) != expected for name, expected in PINS.items()):
        raise SystemExit("output-exists-or-input-pin-drift")
    predictions = [json.loads(line) for line in paths["predictions"].read_text().splitlines()]
    expanded = [json.loads(line) for line in paths["expanded_packets"].read_text().splitlines()]
    original = [json.loads(line) for line in paths["original_packets"].read_text().splitlines()]
    original_result = json.loads(paths["original_evaluation"].read_bytes())
    audit = json.loads(paths["cue_audit"].read_bytes())
    seal = json.loads(paths["prediction_seal"].read_bytes())
    old_cases = original_result["cases"]
    if (not all(len(items) == 24 for items in (predictions, expanded, original, old_cases,
                                                audit["cases"]))
            or seal["cases"] != 24 or seal["predictions_sha256"] != PINS["predictions"]
            or seal["gold_opened"] or original_result["candidate_union_ceiling_cases"] != 13
            or audit["original_reach"] != 13 or audit["expanded_reach"] != 20
            or audit["newly_reached"] != 7):
        raise SystemExit("cohort-or-seal-drift")
    cases = []
    for ordinal, (prediction, packet, old_packet, old, cue) in enumerate(
            zip(predictions, expanded, original, old_cases, audit["cases"]), 1):
        if (not (prediction["ordinal"] == packet["ordinal"] == old_packet["ordinal"]
                 == old["ordinal"] == cue["ordinal"] == ordinal)
                or not (prediction["id"] == packet["id"] == old_packet["id"] == old["id"])
                or packet["are_ranked_files"] != old_packet["are_ranked_files"]
                or packet["chunk_ranked_files"] != old_packet["chunk_ranked_files"]
                or packet["candidates"][:len(old_packet["candidates"])] != old_packet["candidates"]
                or prediction["selected_paths"] != [packet["candidates"][index - 1]["path"]
                                                      for index in prediction["selected_ids"]]
                or len(set(prediction["selected_paths"])) != len(prediction["selected_paths"])):
            raise SystemExit(f"prediction-identity-drift:{ordinal}")
        gold = set(old["gold_paths"])
        are_order = old_packet["are_ranked_files"]
        original_paths = [old_packet["candidates"][index - 1]["path"]
                          for index in old["selected_ids"]]
        original_order = list(dict.fromkeys(original_paths + are_order))
        new_order = list(dict.fromkeys(prediction["selected_paths"] + are_order))
        if (not gold or len(new_order) != len(are_order)
                or set(new_order) != set(are_order)
                or metric(are_order, gold) != old["arms"]["are"]
                or metric(original_order, gold) != old["arms"]["glm"]
                or cue["expanded_reach"] != bool(gold & {entry["path"] for entry in packet["candidates"]})):
            raise SystemExit(f"baseline-or-ceiling-drift:{ordinal}")
        scored = metric(new_order, gold)
        cases.append({"ordinal": ordinal, "id": old["id"], "repo": old["repo"],
                      "language": old["language"], "original_reach": cue["original_reach"],
                      "newly_reached_by_cue": cue["cue_reach"] and not cue["original_reach"],
                      "are": old["arms"]["are"], "original_glm": old["arms"]["glm"],
                      "cue_glm": scored, "selected_ids": prediction["selected_ids"],
                      "prompt_tokens": prediction["prompt_tokens"],
                      "completion_tokens": prediction["completion_tokens"],
                      "generation_elapsed_ms": prediction["generation_elapsed_ms"]})
    aggregate = {arm: {name: mean([case[arm][name] for case in cases])
                       for name in ("rr8", "hit3", "recall20")}
                 for arm in ("are", "original_glm", "cue_glm")}
    comparisons = {arm: paired([case["cue_glm"]["rr8"] - case[arm]["rr8"]
                               for case in cases]) for arm in ("are", "original_glm")}
    newly_reached = [case for case in cases if case["newly_reached_by_cue"]]
    newly_positive = sum(case["cue_glm"]["rr8"] > 0 for case in newly_reached)
    prompt_total = sum(case["prompt_tokens"] for case in cases)
    completion_total = sum(case["completion_tokens"] for case in cases)
    elapsed_total = sum(case["generation_elapsed_ms"] for case in cases)
    gate = {"valid_generations_and_labels": len(cases) == 24,
            "are_delta_at_least_0_10": comparisons["are"]["delta_mrr8"] >= 0.10,
            "are_bootstrap_lower_above_zero": comparisons["are"]["bootstrap_95_percentile"][0] > 0,
            "at_least_16_are_wins": comparisons["are"]["wins"] >= 16,
            "original_glm_delta_at_least_0_10": comparisons["original_glm"]["delta_mrr8"] >= 0.10,
            "at_least_four_newly_reachable_positive": newly_positive >= 4,
            "prompt_at_most_1_5x_original": prompt_total <= 56410 * 1.5,
            "generation_calls_at_most_24": len(cases) <= 24}
    gate["passed"] = all(gate.values())
    result = {"schema_version": "are.g01-bugswarm-cue-rerank-exposed-r2-evaluation/v1",
              "posture": "already-exposed development, not independent confirmation or product claim",
              "pins": PINS, "prediction_response_sha256": seal["generation_response_sha256"],
              "cases": cases, "aggregate": aggregate, "paired": comparisons,
              "newly_reachable_cases": len(newly_reached),
              "newly_reachable_mrr_positive": newly_positive,
              "known_prompt_tokens": prompt_total,
              "known_completion_tokens": completion_total,
              "summed_generation_elapsed_ms": elapsed_total,
              "gate": gate,
              "claim_ceiling": "Exposed source-projected BugSwarm development only; HTTP log/diff provenance unresolved; no ContextBench, official RepoMap, live ARE, efficiency, or product superiority."}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    encoded = (json.dumps(result, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cases": len(cases), "aggregate_mrr8": {arm: item["rr8"]
                         for arm, item in aggregate.items()},
                      "paired_are": comparisons["are"],
                      "paired_original_glm": comparisons["original_glm"],
                      "newly_reachable_mrr_positive": newly_positive,
                      "gate": gate, "evaluation_sha256": hashlib.sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
