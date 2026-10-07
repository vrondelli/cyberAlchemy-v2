#!/usr/bin/env python3
"""Evaluator-only paired score of sealed exposed BugSwarm r7 predictions."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import random


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
ROOT = ARCHIVE / "exposed-java-evidence-r7"
OUTPUT = ROOT / "evaluator-only-r7/EVALUATION-R7.json"
INPUTS = {
    "predictions": (ROOT / "predictions-r7/PREDICTIONS.jsonl",
                    "887679c7c1750de0558af9c2943401bb35a53f708563b2ca6d1ffdc1579ca6e4"),
    "prediction_seal": (ROOT / "predictions-r7/PREDICTION-SEAL.json",
                        "f0fd62598591618af6e6a2bcf63005f10cb5096db2c6934e5544a5107a037798"),
    "r7_packets": (ROOT / "PACKETS.jsonl",
                   "23e85916c8d4c214babd93239049882b2fed9543f8eef788db2551552953f37f"),
    "r6_packets": (ARCHIVE / "exposed-hybrid-r6/PACKETS.jsonl",
                   "5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e"),
    "original_packets": (ARCHIVE / "vps-run-r1/packets-r1/PACKETS.jsonl",
                         "ee0d6ff047426241b6533e5938f7da97219a6f64336b13e354b739c68e6baa76"),
    "original_evaluation": (ARCHIVE / "evaluator-only-r1/EVALUATION-R1.json",
                            "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3"),
    "r6_evaluation": (ARCHIVE / "exposed-hybrid-r6/evaluator-only-r6/EVALUATION-R6.json",
                      "7c9dd2e731587c44895aa3bcf5c00009799c3459aafc356d8786a8485a1cbae2"),
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


def paired(differences: list[float]) -> dict:
    rng = random.Random(COHORT_SEED)
    n = len(differences)
    draws = sorted(mean([differences[rng.randrange(n)] for _ in range(n)])
                   for _ in range(DRAW_COUNT))
    return {"delta_mrr8": mean(differences),
            "bootstrap_95_percentile": [draws[int((DRAW_COUNT - 1) * 0.025)],
                                        draws[int((DRAW_COUNT - 1) * 0.975)]],
            "wins": sum(value > 0 for value in differences),
            "ties": sum(value == 0 for value in differences),
            "losses": sum(value < 0 for value in differences)}


def main() -> None:
    if OUTPUT.exists() or any(sha(path) != expected for path, expected in INPUTS.values()):
        raise SystemExit("output-exists-or-input-pin-drift")
    data = {}
    for name, (path, _) in INPUTS.items():
        data[name] = json.loads(path.read_bytes()) if name in {
            "prediction_seal", "original_evaluation", "r6_evaluation"} else [
                json.loads(line) for line in path.read_text().splitlines()]
    seal = data["prediction_seal"]
    old_cases = data["original_evaluation"]["cases"]
    r6_cases = data["r6_evaluation"]["cases"]
    if (any(len(data[name]) != 24 for name in (
            "predictions", "r7_packets", "r6_packets", "original_packets"))
            or len(old_cases) != 24 or len(r6_cases) != 24
            or seal["cases"] != 24 or seal["gold_opened"]
            or seal["predictions_sha256"] != INPUTS["predictions"][1]
            or seal["carried_python_cases"] != 12 or seal["new_java_cases"] != 12
            or seal["known_prompt_tokens"] != 63620):
        raise SystemExit("cohort-or-seal-drift")
    cases = []
    for index in range(24):
        prediction = data["predictions"][index]
        packet = data["r7_packets"][index]
        prior_packet = data["r6_packets"][index]
        original = data["original_packets"][index]
        old = old_cases[index]
        r6 = r6_cases[index]
        ordinal = index + 1
        if (not all(row["ordinal"] == ordinal and row["id"] == old["id"] for row in (
                prediction, packet, prior_packet, original, old, r6))
                or packet["are_ranked_files"] != original["are_ranked_files"]
                or packet["chunk_ranked_files"] != original["chunk_ranked_files"]
                or [row["path"] for row in packet["candidates"]] != [
                    row["path"] for row in prior_packet["candidates"]]
                or prediction["selected_paths"] != [
                    packet["candidates"][candidate_id - 1]["path"]
                    for candidate_id in prediction["selected_ids"]]
                or len(set(prediction["selected_paths"])) != len(prediction["selected_paths"])
                or prediction["carried_from_r6"] != (index < 12)):
            raise SystemExit(f"prediction-identity-drift:{ordinal}")
        gold = set(old["gold_paths"])
        are_order = original["are_ranked_files"]
        old_paths = [original["candidates"][candidate_id - 1]["path"]
                     for candidate_id in old["selected_ids"]]
        old_order = list(dict.fromkeys(old_paths + are_order))
        new_order = list(dict.fromkeys(prediction["selected_paths"] + are_order))
        if (not gold or len(new_order) != len(are_order) or set(new_order) != set(are_order)
                or metric(are_order, gold) != old["arms"]["are"]
                or metric(old_order, gold) != old["arms"]["glm"]
                or r6["are"] != old["arms"]["are"]
                or r6["original_glm"] != old["arms"]["glm"]):
            raise SystemExit(f"baseline-drift:{ordinal}")
        scored = metric(new_order, gold)
        if index < 12 and scored != r6["r6_glm"]:
            raise SystemExit(f"python-carryover-score-drift:{ordinal}")
        cases.append({"ordinal": ordinal, "id": old["id"], "repo": old["repo"],
                      "language": old["language"], "are": old["arms"]["are"],
                      "original_glm": old["arms"]["glm"],
                      "r6_glm": r6["r6_glm"], "r7_glm": scored,
                      "carried_from_r6": index < 12,
                      "selected_ids": prediction["selected_ids"],
                      "prompt_tokens": prediction["prompt_tokens"],
                      "completion_tokens": prediction["completion_tokens"],
                      "generation_elapsed_ms": prediction["generation_elapsed_ms"]})
    aggregate = {arm: {name: mean([case[arm][name] for case in cases])
                       for name in ("rr8", "hit3", "recall20")}
                 for arm in ("are", "original_glm", "r6_glm", "r7_glm")}
    comparisons = {arm: paired([case["r7_glm"]["rr8"] - case[arm]["rr8"]
                               for case in cases])
                   for arm in ("are", "original_glm", "r6_glm")}
    new_java_positive = sum(cases[index - 1]["r7_glm"]["rr8"] > 0
                            for index in (16, 17, 20))
    prompt_total = sum(case["prompt_tokens"] for case in cases)
    completion_total = sum(case["completion_tokens"] for case in cases)
    elapsed_total = sum(case["generation_elapsed_ms"] for case in cases)
    gate = {"valid_combined_selections_and_labels": len(cases) == 24,
            "are_delta_at_least_0_10": comparisons["are"]["delta_mrr8"] >= 0.10,
            "original_glm_delta_at_least_0_10": comparisons["original_glm"]["delta_mrr8"] >= 0.10,
            "at_least_16_are_wins": comparisons["are"]["wins"] >= 16,
            "are_bootstrap_lower_above_zero": comparisons["are"]["bootstrap_95_percentile"][0] > 0,
            "at_least_two_new_java_positive": new_java_positive >= 2,
            "prompt_at_most_1_5x_original": prompt_total <= 84615,
            "new_generation_calls_at_most_12": seal["new_java_cases"] <= 12}
    gate["passed"] = all(gate.values())
    result = {"schema_version": "are.g01-bugswarm-java-evidence-rerank-exposed-r7-evaluation/v1",
              "posture": "already-exposed development; not independent confirmation or product claim",
              "input_sha256": {name: expected for name, (_, expected) in INPUTS.items()},
              "new_java_response_sha256": seal["new_java_response_sha256"],
              "carried_python_response_sha256": seal["carried_python_response_sha256"],
              "cases": cases, "aggregate": aggregate, "paired": comparisons,
              "new_java_mrr_positive": new_java_positive,
              "known_prompt_tokens": prompt_total,
              "known_completion_tokens": completion_total,
              "summed_generation_elapsed_ms": elapsed_total,
              "gate": gate,
              "claim_ceiling": "Exposed source-projected BugSwarm development only; HTTP log/diff provenance unresolved; no ContextBench, official RepoMap, live ARE, efficiency, or product superiority."}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    blob = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(blob)
    print(json.dumps({"cases": 24,
                      "aggregate_mrr8": {arm: row["rr8"] for arm, row in aggregate.items()},
                      "paired_are": comparisons["are"],
                      "paired_original_glm": comparisons["original_glm"],
                      "paired_r6_glm": comparisons["r6_glm"],
                      "new_java_mrr_positive": new_java_positive,
                      "gate": gate, "evaluation_sha256": hashlib.sha256(blob).hexdigest()}))


if __name__ == "__main__":
    main()
