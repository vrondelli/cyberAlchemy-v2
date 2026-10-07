#!/usr/bin/env python3
"""Evaluator-only paired scoring of the sealed 24-case BugSwarm transfer."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import random


PINS = {
    "freeze": "f3d46be103d8917a8f8e9e755b05d8a7da1e7d7a09181fec3c00d1158ec14151",
    "packets": "ee0d6ff047426241b6533e5938f7da97219a6f64336b13e354b739c68e6baa76",
    "packet_seal": "be138a42969914a63a719b7ac50f5aa86f59c5a6ae5b9f6a4bd990ad23409bc4",
    "gold": "962da35d492866ce6e587f82863ce6fda7969645be0b615ab07c8b315df957f8",
    "gold_projection": "46ee78cabe65f4df304971fdab3640e0141aa6c5a87b2b0cc22a122a47f9c524",
}
BOOTSTRAP_DRAWS = 20_000


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metric(order: list[str], gold: set[str]) -> dict:
    first = next((index for index, path in enumerate(order[:8], 1) if path in gold), None)
    return {"rr8": 1 / first if first else 0.0,
            "hit3": int(bool(gold.intersection(order[:3]))),
            "recall20": len(gold.intersection(order[:20])) / len(gold)}


def mean(values: list[float]) -> float:
    return sum(values) / len(values)


def interval(deltas: list[float], seed: int) -> list[float]:
    rng = random.Random(seed)
    n = len(deltas)
    draws = sorted(mean([deltas[rng.randrange(n)] for _ in range(n)])
                   for _ in range(BOOTSTRAP_DRAWS))
    return [draws[int((BOOTSTRAP_DRAWS - 1) * 0.025)],
            draws[int((BOOTSTRAP_DRAWS - 1) * 0.975)]]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in PINS:
        parser.add_argument("--" + name.replace("_", "-"), type=Path, required=True)
    parser.add_argument("--run", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("evaluation-output-exists")
    for name, expected in PINS.items():
        if sha(getattr(args, name)) != expected:
            raise SystemExit("input-pin-drift:" + name)
    frozen = json.loads(args.freeze.read_bytes())
    packets = [json.loads(line) for line in args.packets.read_text().splitlines()]
    seal = json.loads(args.packet_seal.read_bytes())
    gold = json.loads(args.gold.read_bytes())["results"]
    projected = json.loads(args.gold_projection.read_bytes())["results"]
    result = json.loads((args.run / "RUN-RESULT.json").read_bytes())
    preflight = json.loads((args.run / "PREFLIGHT.json").read_bytes())
    if (len(packets) != len(gold) or len(gold) != len(projected) or len(packets) != 24
            or result.get("status") != "completed-valid" or result.get("valid") != 24
            or preflight.get("status") != "ready" or len(preflight.get("admission", [])) != 24
            or not all(row["admitted"] for row in preflight["admission"])):
        raise SystemExit("run-or-label-completeness-failed")
    cases, response_hashes = [], []
    for ordinal, (packet, label, in_projection) in enumerate(zip(packets, gold, projected), 1):
        if (packet["ordinal"] != ordinal or frozen["case_ids"][ordinal - 1] != packet["id"]
                or label["ordinal"] != ordinal or in_projection["ordinal"] != ordinal
                or not label["gold_admissible"] or not in_projection["all_projected"]):
            raise SystemExit("case-or-label-identity-drift")
        gold_paths = {item["path"] for item in label["source_gold_paths"]}
        if not gold_paths or gold_paths != {item["path"] for item in in_projection["gold_paths"]}:
            raise SystemExit("gold-path-projection-drift")
        are_path = args.run / "are-rankings-r1" / f"ARE-RANKING-{ordinal:02d}.json"
        chunk_path = args.run / "chunk-rankings-r1" / f"CHUNK-RANKING-{ordinal:02d}.json"
        ar, br = json.loads(are_path.read_bytes()), json.loads(chunk_path.read_bytes())
        if (sha(are_path) != seal["are_ranking_sha256"][ordinal - 1]
                or sha(chunk_path) != seal["chunk_ranking_sha256"][ordinal - 1]
                or ar["id"] != br["id"] != packet["id"]
                or ar["ranked_files"] != packet["are_ranked_files"]
                or br["ranked_files"] != packet["chunk_ranked_files"]):
            raise SystemExit("ranking-pin-or-identity-drift")
        started_path = args.run / f"STARTED-{ordinal}.json"
        response_path = args.run / f"RESPONSE-{ordinal}.json"
        started = json.loads(started_path.read_bytes())
        response = json.loads(response_path.read_bytes())
        response_hashes.append(sha(response_path))
        choice = response.get("provider_payload", {}).get("choices", [{}])[0]
        try:
            parsed = json.loads(choice["message"]["content"])["candidate_ids"]
        except (KeyError, IndexError, TypeError, ValueError):
            raise SystemExit("provider-selection-invalid:" + str(ordinal))
        if (started["ordinal"] != ordinal or response["ordinal"] != ordinal
                or started["request_sha256"] != response["request_sha256"]
                or response["id"] != packet["id"] or response["status"] != "valid"
                or response["http_status"] != 200 or choice["finish_reason"] != "stop"
                or parsed != response["selected_ids"] or not isinstance(parsed, list)
                or len(parsed) > 8 or len(set(parsed)) != len(parsed)
                or any(not isinstance(index, int) or isinstance(index, bool)
                       or not 1 <= index <= len(packet["candidates"]) for index in parsed)):
            raise SystemExit("response-integrity-drift:" + str(ordinal))
        selected_paths = [packet["candidates"][index - 1]["path"] for index in parsed]
        treatment = list(dict.fromkeys(selected_paths + ar["ranked_files"]))
        if len(treatment) != len(ar["ranked_files"]) or set(treatment) != set(ar["ranked_files"]):
            raise SystemExit("treatment-coverage-drift")
        arms = {"are": metric(ar["ranked_files"], gold_paths),
                "chunk": metric(br["ranked_files"], gold_paths),
                "glm": metric(treatment, gold_paths)}
        union = {entry["path"] for entry in packet["candidates"]}
        usage = response["provider_payload"].get("usage", {})
        cases.append({"ordinal": ordinal, "id": packet["id"], "repo": packet["repo"],
                      "language": packet["language"], "gold_paths": sorted(gold_paths),
                      "selected_ids": parsed, "candidate_union_has_gold": bool(union & gold_paths),
                      "arms": arms, "prompt_tokens": usage.get("prompt_tokens"),
                      "completion_tokens": usage.get("completion_tokens"),
                      "generation_elapsed_ms": response["elapsed_ms"],
                      "are_ranker_elapsed_ms": ar["ranker_elapsed_ms"],
                      "chunk_ranker_elapsed_ms": br["ranker_elapsed_ms"]})
    aggregate = {arm: {metric_name: mean([case["arms"][arm][metric_name] for case in cases])
                       for metric_name in ("rr8", "hit3", "recall20")}
                 for arm in ("are", "chunk", "glm")}
    stronger = max(("are", "chunk"), key=lambda arm: aggregate[arm]["rr8"])
    seed = int(PINS["freeze"][:8], 16)
    deltas = {arm: [case["arms"]["glm"]["rr8"] - case["arms"][arm]["rr8"]
                    for case in cases] for arm in ("are", "chunk")}
    paired = {arm: {"delta_mrr8": mean(values), "bootstrap_95_percentile": interval(values, seed),
                    "wins": sum(value > 0 for value in values),
                    "ties": sum(value == 0 for value in values),
                    "losses": sum(value < 0 for value in values)}
              for arm, values in deltas.items()}
    gate = {"valid_attempts": 24, "valid_labels": 24, "stronger_standalone": stronger,
            "delta_at_least_0_10": paired[stronger]["delta_mrr8"] >= 0.10,
            "bootstrap_lower_above_zero": paired[stronger]["bootstrap_95_percentile"][0] > 0,
            "at_least_16_repository_wins": paired[stronger]["wins"] >= 16}
    gate["passed"] = all(value for key, value in gate.items() if key in (
        "delta_at_least_0_10", "bootstrap_lower_above_zero", "at_least_16_repository_wins"))
    evaluation = {"schema_version": "are.g01-bugswarm-transfer-evaluation-r1/v1",
                  "pins": PINS, "run_result_sha256": sha(args.run / "RUN-RESULT.json"),
                  "preflight_sha256": sha(args.run / "PREFLIGHT.json"),
                  "response_sha256": response_hashes, "cases": cases,
                  "aggregate": aggregate, "paired": paired, "gate": gate,
                  "candidate_union_ceiling_cases": sum(case["candidate_union_has_gold"] for case in cases),
                  "known_prompt_tokens": sum(case["prompt_tokens"] for case in cases),
                  "known_completion_tokens": sum(case["completion_tokens"] for case in cases),
                  "known_generation_elapsed_ms": sum(case["generation_elapsed_ms"] for case in cases),
                  "known_are_ranker_elapsed_ms": sum(case["are_ranker_elapsed_ms"] for case in cases),
                  "known_chunk_ranker_elapsed_ms": sum(case["chunk_ranker_elapsed_ms"] for case in cases),
                  "claim_ceiling": "Private provisional BugSwarm source-projected transfer; HTTP log/diff provenance unresolved; not ContextBench, official RepoMap, live ARE, efficiency, or product superiority."}
    encoded = (json.dumps(evaluation, indent=2, sort_keys=True) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cases": len(cases), "aggregate_mrr8": {arm: aggregate[arm]["rr8"] for arm in aggregate},
                      "stronger_control": stronger, "paired": paired[stronger], "gate_passed": gate["passed"],
                      "evaluation_sha256": hashlib.sha256(encoded).hexdigest()}), flush=True)


if __name__ == "__main__":
    main()
