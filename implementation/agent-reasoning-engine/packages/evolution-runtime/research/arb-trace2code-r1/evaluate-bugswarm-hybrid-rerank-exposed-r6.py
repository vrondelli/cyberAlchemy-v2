#!/usr/bin/env python3
"""Evaluator-only paired score of sealed exposed BugSwarm r6 predictions."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import random


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
ROOT = ARCHIVE / "exposed-hybrid-r6"
OUTPUT = ROOT / "evaluator-only-r6/EVALUATION-R6.json"
INPUTS = {
    "predictions": (ROOT / "predictions-r6/PREDICTIONS.jsonl",
                    "c6a42d5e12b2c193797f0a287c9c8e087ca79ce7b6af442db6d5c9e61c2658ab"),
    "prediction_seal": (ROOT / "predictions-r6/PREDICTION-SEAL.json",
                        "386174a416c1e9ceb71bd0ce3d48b0fe357273ec1af3a10ab31f0c7307980751"),
    "r6_packets": (ROOT / "PACKETS.jsonl",
                   "5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e"),
    "r6_rank": (ROOT / "RANKED.jsonl",
                "a6d456a8d998df85164412a1b344ddf79f0716853cb93d22b46a8f54ee66c764"),
    "original_packets": (ARCHIVE / "vps-run-r1/packets-r1/PACKETS.jsonl",
                         "ee0d6ff047426241b6533e5938f7da97219a6f64336b13e354b739c68e6baa76"),
    "original_evaluation": (ARCHIVE / "evaluator-only-r1/EVALUATION-R1.json",
                            "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3"),
    "r2_evaluation": (ARCHIVE / "exposed-cue-packets-r1/evaluator-only-r2/EVALUATION-R2.json",
                      "845b89e244dbe24d08a5271948486b7dd20f01f6df43bb7e5a7d403fc447e877"),
}
DRAW_COUNT = 20_000
COHORT_SEED = int("fc099fb2", 16)


def sha(path: Path) -> str:
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
    if OUTPUT.exists() or any(sha(path) != expected for path, expected in INPUTS.values()):
        raise SystemExit("output-exists-or-input-pin-drift")
    data = {}
    for name, (path, _) in INPUTS.items():
        data[name] = json.loads(path.read_bytes()) if name in {
            "prediction_seal", "original_evaluation", "r2_evaluation"} else [
                json.loads(line) for line in path.read_text().splitlines()]
    prediction_seal = data["prediction_seal"]
    original_cases = data["original_evaluation"]["cases"]
    r2_cases = data["r2_evaluation"]["cases"]
    if (any(len(data[name]) != 24 for name in (
            "predictions", "r6_packets", "r6_rank", "original_packets"))
            or len(original_cases) != 24 or len(r2_cases) != 24
            or prediction_seal["cases"] != 24 or prediction_seal["gold_opened"]
            or prediction_seal["predictions_sha256"] != INPUTS["predictions"][1]
            or prediction_seal["known_prompt_tokens"] != 70279):
        raise SystemExit("cohort-or-seal-drift")
    cases = []
    for index in range(24):
        prediction = data["predictions"][index]
        packet = data["r6_packets"][index]
        rank = data["r6_rank"][index]
        old_packet = data["original_packets"][index]
        old = original_cases[index]
        r2 = r2_cases[index]
        ordinal = index + 1
        if (not all(row["ordinal"] == ordinal and row["id"] == old["id"]
                    for row in (prediction, packet, rank, old_packet, old, r2))
                or packet["are_ranked_files"] != old_packet["are_ranked_files"]
                or packet["chunk_ranked_files"] != old_packet["chunk_ranked_files"]
                or [entry["path"] for entry in packet["candidates"]] != rank["ordered_paths"]
                or prediction["selected_paths"] != [packet["candidates"][candidate_id - 1]["path"]
                                                      for candidate_id in prediction["selected_ids"]]
                or len(set(prediction["selected_paths"])) != len(prediction["selected_paths"])):
            raise SystemExit(f"prediction-identity-drift:{ordinal}")
        gold = set(old["gold_paths"])
        are_order = old_packet["are_ranked_files"]
        original_paths = [old_packet["candidates"][candidate_id - 1]["path"]
                          for candidate_id in old["selected_ids"]]
        original_order = list(dict.fromkeys(original_paths + are_order))
        new_order = list(dict.fromkeys(prediction["selected_paths"] + are_order))
        if (not gold or len(new_order) != len(are_order)
                or set(new_order) != set(are_order)
                or metric(are_order, gold) != old["arms"]["are"]
                or metric(original_order, gold) != old["arms"]["glm"]
                or r2["are"] != old["arms"]["are"]
                or r2["original_glm"] != old["arms"]["glm"]):
            raise SystemExit(f"baseline-drift:{ordinal}")
        scored = metric(new_order, gold)
        cases.append({"ordinal": ordinal, "id": old["id"], "repo": old["repo"],
                      "language": old["language"], "packet_reach": bool(gold & {
                          entry["path"] for entry in packet["candidates"]}),
                      "are": old["arms"]["are"], "original_glm": old["arms"]["glm"],
                      "r2_glm": r2["cue_glm"], "r6_glm": scored,
                      "selected_ids": prediction["selected_ids"],
                      "prompt_tokens": prediction["prompt_tokens"],
                      "completion_tokens": prediction["completion_tokens"],
                      "generation_elapsed_ms": prediction["generation_elapsed_ms"]})
    aggregate = {arm: {name: mean([case[arm][name] for case in cases])
                       for name in ("rr8", "hit3", "recall20")}
                 for arm in ("are", "original_glm", "r2_glm", "r6_glm")}
    comparisons = {arm: paired([case["r6_glm"]["rr8"] - case[arm]["rr8"]
                               for case in cases])
                   for arm in ("are", "original_glm", "r2_glm")}
    newly_positive = sum(cases[index - 1]["r6_glm"]["rr8"] > 0 for index in (16, 17, 20))
    prompt_total = sum(case["prompt_tokens"] for case in cases)
    completion_total = sum(case["completion_tokens"] for case in cases)
    elapsed_total = sum(case["generation_elapsed_ms"] for case in cases)
    gate = {"valid_generations_and_labels": len(cases) == 24,
            "are_delta_at_least_0_10": comparisons["are"]["delta_mrr8"] >= 0.10,
            "original_glm_delta_at_least_0_10": comparisons["original_glm"]["delta_mrr8"] >= 0.10,
            "at_least_16_are_wins": comparisons["are"]["wins"] >= 16,
            "are_bootstrap_lower_above_zero": comparisons["are"]["bootstrap_95_percentile"][0] > 0,
            "at_least_two_new_java_positive": newly_positive >= 2,
            "prompt_at_most_1_5x_original": prompt_total <= 84615,
            "generation_calls_at_most_24": len(cases) <= 24}
    gate["passed"] = all(gate.values())
    result = {"schema_version": "are.g01-bugswarm-hybrid-rerank-exposed-r6-evaluation/v1",
              "posture": "already-exposed development; not independent confirmation or product claim",
              "input_sha256": {name: expected for name, (_, expected) in INPUTS.items()},
              "prediction_response_sha256": prediction_seal["generation_response_sha256"],
              "cases": cases, "aggregate": aggregate, "paired": comparisons,
              "new_java_mrr_positive": newly_positive,
              "known_prompt_tokens": prompt_total,
              "known_completion_tokens": completion_total,
              "summed_generation_elapsed_ms": elapsed_total,
              "gate": gate,
              "claim_ceiling": "Exposed source-projected BugSwarm development only; HTTP log/diff provenance unresolved; no ContextBench, official RepoMap, live ARE, efficiency, or product superiority."}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    blob = (json.dumps(result, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(blob)
    print(json.dumps({"cases": len(cases),
                      "aggregate_mrr8": {arm: row["rr8"] for arm, row in aggregate.items()},
                      "paired_are": comparisons["are"],
                      "paired_original_glm": comparisons["original_glm"],
                      "paired_r2_glm": comparisons["r2_glm"],
                      "new_java_mrr_positive": newly_positive,
                      "gate": gate, "evaluation_sha256": hashlib.sha256(blob).hexdigest()}))


if __name__ == "__main__":
    main()
