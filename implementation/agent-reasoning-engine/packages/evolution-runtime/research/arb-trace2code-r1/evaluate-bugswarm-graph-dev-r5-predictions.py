#!/usr/bin/env python3
"""Evaluator-only frozen 24-case G01 r5 score and gate."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import random


BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-r2")
RUN = BASE / "source-only/normalized-selector-r5-vps-run"
EVAL = BASE / "evaluator-only"
PINS = {
    "prediction_seal": (RUN / "PREDICTION-SEAL.json",
                        "7a5d0ec9359fca2f52d9cff23ca308d6c11b63b597e5e429967519e998c7b330"),
    "predictions": (RUN / "PREDICTIONS-R5.jsonl",
                    "f008f4fbeef4530e00c597f23df45ad0834c77a7a5a5ba63768e806ee41d2919"),
    "r2": (BASE / "source-only/graph-rankings/GRAPH-RANKINGS-R2.jsonl",
           "e3bd92f75b1fa3dfc95a43dfa29c69e8ebc6dc92e1e7bc5ba12565541586361a"),
    "gold": (EVAL / "DEV-GOLD-AUDIT-R2.json",
             "454c8d74fb30f4a0dcaeea4eb7fd2a0fdf8d77b3d46c0f568a86a3e74a90322d"),
    "projection": (EVAL / "DEV-GOLD-PROJECTION-R2.json",
                   "c4d2c61f61028c9abbef6f41bc37c455223aa6fd84fceb3793704dcf72e93093"),
    "are": (EVAL / "ARE-BASELINE-R2.json",
            "81ad5eff53849c5e31c0825c8548abd1682088947e046d19820f3bb4068e73bf"),
    "generation": (RUN / "GENERATION-RESULT.json",
                   "ebb2b4d2fa93b8f0bf8880fe567b5e68de9954ee0e9f59ad01d9e6b4b77d50f2"),
}
DRAW_COUNT = 20_000


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def metric(order: list[str], gold: set[str]) -> dict:
    first = next((index for index, path in enumerate(order[:8], 1) if path in gold), None)
    return {"rr8": 1 / first if first else 0.0,
            "hit3": int(bool(gold.intersection(order[:3]))),
            "reach30": int(bool(gold.intersection(order[:30])))}


def interval(values: list[float], seed: int) -> list[float]:
    rng = random.Random(seed)
    draws = sorted(sum(values[rng.randrange(24)] for _ in range(24)) / 24
                   for _ in range(DRAW_COUNT))
    return [draws[int((DRAW_COUNT - 1) * 0.025)],
            draws[int((DRAW_COUNT - 1) * 0.975)]]


def main() -> None:
    output = EVAL / "NORMALIZED-SELECTOR-EVALUATION-R5.json"
    if output.exists():
        raise SystemExit("output-exists")
    blobs = {}
    for name, (path, expected) in PINS.items():
        blob = path.read_bytes()
        if sha(blob) != expected:
            raise SystemExit(f"input-pin-drift:{name}")
        blobs[name] = blob
    seal = json.loads(blobs["prediction_seal"])
    generation = json.loads(blobs["generation"])
    r5 = [json.loads(line) for line in blobs["predictions"].splitlines()]
    r2 = [json.loads(line) for line in blobs["r2"].splitlines()]
    gold = json.loads(blobs["gold"])["results"]
    projected = json.loads(blobs["projection"])["results"]
    are = json.loads(blobs["are"])["cases"]
    if (any(len(rows) != 24 for rows in (r5, r2, gold, projected, are)) or
            seal["cases"] != 24 or seal["valid"] != 24 or seal["gold_opened"] or
            seal["reserved_confirmation_opened"] or
            seal["predictions_sha256"] != PINS["predictions"][1] or
            generation["status"] != "completed-valid" or
            generation["attempts"] != 24 or generation["valid"] != 24):
        raise SystemExit("denominator-or-seal-drift")
    cases, delta_are, delta_r2 = [], [], []
    prompt_tokens = completion_tokens = elapsed_ms = 0
    for index, (new, old, label, projection, baseline) in enumerate(zip(
            r5, r2, gold, projected, are), 1):
        if (not (new["ordinal"] == old["ordinal"] == label["ordinal"] ==
                 projection["ordinal"] == baseline["ordinal"] == index) or
                not (new["id"] == old["id"] == label["image_tag"] ==
                     projection["image_tag"] == baseline["id"]) or
                not label["gold_admissible"] or not projection["all_projected"] or
                new["gold_opened"] or new["reserved_confirmation_opened"]):
            raise SystemExit(f"case-identity-or-admission:{index}")
        gold_paths = {item["path"] for item in label["source_gold_paths"]}
        if not gold_paths or gold_paths != {item["path"] for item in projection["source_gold_paths"]}:
            raise SystemExit(f"gold-projection-drift:{index}")
        if (len(new["ranked_files"]) != len(old["ranked_files"]) or
                set(new["ranked_files"]) != set(old["ranked_files"])):
            raise SystemExit(f"coverage-drift:{index}")
        response_path = RUN / f"GENERATION-{index:02d}.json"
        response_data = response_path.read_bytes()
        response = json.loads(response_data)
        if (sha(response_data) != seal["response_receipts"][index - 1]["response_sha256"] or
                response["status"] != "valid" or response["selected_ids"] != new["selected_ids"] or
                response["http_status"] != 200 or response["ordinal"] != index):
            raise SystemExit(f"response-drift:{index}")
        usage = response["provider_payload"]["usage"]
        if (not isinstance(usage.get("prompt_tokens"), int) or
                not isinstance(usage.get("completion_tokens"), int) or
                usage["completion_tokens"] > 512):
            raise SystemExit(f"usage-shape:{index}")
        prompt_tokens += usage["prompt_tokens"]
        completion_tokens += usage["completion_tokens"]
        elapsed_ms += response["elapsed_ms"]
        a, b, c = (metric(baseline["are_ranked_files"], gold_paths)
                   if "are_ranked_files" in baseline else
                   {"rr8": baseline["are_rr8"], "hit3": baseline["are_hit3"],
                    "reach30": int(baseline["are_candidate_reach30"])},
                   metric(old["ranked_files"], gold_paths),
                   metric(new["ranked_files"], gold_paths))
        if (a["rr8"] != baseline["are_rr8"] or
                a["hit3"] != baseline["are_hit3"] or
                b["reach30"] != int(bool(gold_paths.intersection(old["ranked_files"][:30])))):
            raise SystemExit(f"baseline-score-drift:{index}")
        delta_are.append(c["rr8"] - a["rr8"])
        delta_r2.append(c["rr8"] - b["rr8"])
        cases.append({"ordinal": index, "id": new["id"], "repo": new["repo"],
                      "language": new["language"], "gold_paths": sorted(gold_paths),
                      "are": a, "r2": b, "r5": c,
                      "delta_vs_are": delta_are[-1], "delta_vs_r2": delta_r2[-1]})
    mean = lambda values: sum(values) / len(values)
    aggregate = {arm: {"mrr8": mean([case[arm]["rr8"] for case in cases]),
                       "hit3": sum(case[arm]["hit3"] for case in cases),
                       "reach30": sum(case[arm]["reach30"] for case in cases)}
                 for arm in ("are", "r2", "r5")}
    paired = {name: {"delta_mrr8": mean(values),
                     "bootstrap_95_percentile": interval(values, int(PINS["prediction_seal"][1][:8], 16)),
                     "wins": sum(v > 0 for v in values),
                     "ties": sum(v == 0 for v in values),
                     "losses": sum(v < 0 for v in values)}
              for name, values in (("versus_are", delta_are), ("versus_r2", delta_r2))}
    gate = {"valid_24": True,
            "mrr8_at_least_0_43234": aggregate["r5"]["mrr8"] >= 0.43234,
            "wins_at_least_16_vs_are": paired["versus_are"]["wins"] >= 16,
            "positive_bootstrap_lower_vs_are": paired["versus_are"]["bootstrap_95_percentile"][0] > 0,
            "reach30_at_least_20": aggregate["r5"]["reach30"] >= 20,
            "prompt_tokens_at_most_130000": prompt_tokens <= 130000,
            "completion_tokens_per_call_at_most_512": True}
    gate["passed"] = all(gate.values())
    result = {"schema_version": "are.g01-graph-dev-r5-evaluation/v1",
              "pins": {name: expected for name, (_, expected) in PINS.items()},
              "script_sha256": sha(Path(__file__).read_bytes()),
              "aggregate": aggregate, "paired": paired, "gate": gate,
              "cost": {"prompt_tokens": prompt_tokens,
                       "completion_tokens": completion_tokens,
                       "generation_elapsed_ms_sum": elapsed_ms},
              "cases": cases,
              "claim_ceiling": "Exposed development only; HTTP source evidence provisional; no independent confirmation, ContextBench, live ARE, or product superiority"}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"aggregate": aggregate, "paired": paired, "gate": gate,
                      "cost": result["cost"], "evaluation_sha256": sha(data)}))


if __name__ == "__main__":
    main()
