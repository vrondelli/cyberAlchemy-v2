#!/usr/bin/env python3
"""Evaluator-only diagnosis of sealed valid r4 selections; r4 gate already failed."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-r2")
RUN = BASE / "source-only/union-selector-r4-vps-run"
PINS = {
    "prediction_seal": "cdb72f6e155dbe8c123d218365c253954eadc73313787619b5361528bf0af4bb",
    "packets": "2eab7cd9858421eaca78f6e13c7f6209eec29adf1e6224b5a0e0701b3728d33f",
    "r2": "e3bd92f75b1fa3dfc95a43dfa29c69e8ebc6dc92e1e7bc5ba12565541586361a",
    "graph_evaluation": "367f37032acb8c086291de1b4b3b21701acef83a432b0d26cd4e131c46db5c09",
}
PATHS = {
    "prediction_seal": RUN / "PREDICTION-SEAL.json",
    "packets": RUN / "PACKETS.jsonl",
    "r2": BASE / "source-only/graph-rankings/GRAPH-RANKINGS-R2.jsonl",
    "graph_evaluation": BASE / "evaluator-only/GRAPH-EVALUATION-R2.json",
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def metric(order: list[str], gold: set[str]) -> dict:
    first = next((n for n, path in enumerate(order[:8], 1) if path in gold), None)
    return {"rr8": 1 / first if first else 0.0,
            "hit3": int(bool(gold.intersection(order[:3]))),
            "reach30": int(bool(gold.intersection(order[:30])))}


def main() -> None:
    output = BASE / "evaluator-only/UNION-SELECTOR-R4-VALID-DIAGNOSTIC.json"
    if output.exists() or any(sha(PATHS[name].read_bytes()) != pin
                              for name, pin in PINS.items()):
        raise SystemExit("input-pin-drift-or-output-exists")
    seal = json.loads(PATHS["prediction_seal"].read_bytes())
    packets = [json.loads(line) for line in PATHS["packets"].read_bytes().splitlines()]
    r2 = [json.loads(line) for line in PATHS["r2"].read_bytes().splitlines()]
    gold = json.loads(PATHS["graph_evaluation"].read_bytes())["cases"]
    if any(len(rows) != 24 for rows in (seal["responses"], packets, r2, gold)) or \
            seal["valid"] != 20 or seal["invalid"] != 4 or seal["gold_opened"]:
        raise SystemExit("denominator-or-seal-drift")
    cases = []
    for index, (response, packet, prior, label) in enumerate(zip(
            seal["responses"], packets, r2, gold), 1):
        if not (response["ordinal"] == packet["ordinal"] == prior["ordinal"] ==
                label["ordinal"] == index) or not (response["id"] == packet["id"] ==
                prior["id"] == label["id"]):
            raise SystemExit(f"identity-drift:{index}")
        if response["status"] == "invalid":
            cases.append({"ordinal": index, "id": packet["id"], "status": "invalid"})
            continue
        chosen = [packet["candidates"][number - 1]["path"]
                  for number in response["selected_ids"]]
        order = chosen + [path for path in prior["ranked_files"] if path not in set(chosen)]
        if len(order) != len(prior["ranked_files"]) or set(order) != set(prior["ranked_files"]):
            raise SystemExit(f"coverage-drift:{index}")
        gold_paths = set(label["gold_paths"])
        before = metric(prior["ranked_files"], gold_paths)
        after = metric(order, gold_paths)
        if before != {"rr8": label["graph"]["rr8"], "hit3": label["graph"]["hit3"],
                      "reach30": int(label["graph"]["reach30"])}:
            raise SystemExit(f"r2-score-drift:{index}")
        cases.append({"ordinal": index, "id": packet["id"], "status": "valid",
                      "r2": before, "r4": after, "are": label["are"],
                      "delta_vs_r2": after["rr8"] - before["rr8"],
                      "delta_vs_are": after["rr8"] - label["are"]["rr8"]})
    valid = [case for case in cases if case["status"] == "valid"]
    mean = lambda arm: sum(case[arm]["rr8"] for case in valid) / len(valid)
    result = {"schema_version": "are.g01-graph-dev-r4-valid-diagnostic/v1",
              "pins": PINS, "script_sha256": sha(Path(__file__).read_bytes()),
              "posture": "evaluator-only, exposed development; r4 24/24 validity gate failed",
              "attempted": 24, "valid": 20, "invalid": 4,
              "valid_subset_mrr8": {arm: mean(arm) for arm in ("are", "r2", "r4")},
              "valid_subset_wins_vs_are": sum(c["delta_vs_are"] > 0 for c in valid),
              "valid_subset_wins_vs_r2": sum(c["delta_vs_r2"] > 0 for c in valid),
              "valid_subset_losses_vs_r2": sum(c["delta_vs_r2"] < 0 for c in valid),
              "valid_subset_reach30": sum(c["r4"]["reach30"] for c in valid),
              "gate": {"all_24_valid": False, "passed": False},
              "cases": cases,
              "claim_ceiling": "20-case selected-subset diagnosis only; no whole-cohort result, independent confirmation, live ARE, ContextBench, or product superiority"}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"valid_subset_mrr8": result["valid_subset_mrr8"],
                      "wins_vs_r2": result["valid_subset_wins_vs_r2"],
                      "losses_vs_r2": result["valid_subset_losses_vs_r2"],
                      "diagnostic_sha256": sha(data)}))


if __name__ == "__main__":
    main()
