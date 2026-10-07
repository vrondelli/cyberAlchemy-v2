#!/usr/bin/env python3
"""Seal and natively score one G02 r4 ARE-only exposed diagnostic."""

import argparse
import hashlib
import json
import subprocess
from pathlib import Path


ALLOWED = {"r4-prompt-open-f6521a2a", "r4-prompt-qut-20f502e0"}
ROOT_BASE = Path("/opt/are-benchmark-runs")
SCORER_BASE = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev")
SCORER = SCORER_BASE / "repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py"
UPSTREAM = SCORER_BASE / "upstream"
CACHE = SCORER_BASE / "scoring-cache"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def write_once(path, value):
    with path.open("x") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def require(value, reason):
    if not value:
        raise ValueError(reason)


def f1(metric):
    coverage, precision = metric["coverage"], metric["precision"]
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def seal(root):
    path = root / "ARE-ONLY-PRE-SCORE-SEAL.json"
    require(not path.exists(), "already-sealed")
    freeze = read(root / "FREEZE.json")
    binding = read(root / "tasks/binding.json")
    settlement = read(root / "ARE-SETTLEMENT.json")
    result = read(root / "evidence/RESULTS.json")
    prediction_path = root / "evidence/run/prediction.json"
    prediction = read(prediction_path)
    require(freeze["task_posture"] == "exposed-diagnostic", "not-exposed-diagnostic")
    for relative, expected in freeze["source_hashes"].items():
        require(digest(root / relative) == expected, "source-drift:" + relative)
    require(settlement["status"] == "completed" and settlement["exit_code"] == 0, "are-unsettled")
    require(result["status"] == "final_context_selected", "no-final-selection")
    require(result["known_total_tokens"] > 0, "unknown-usage")
    require(prediction["instance_id"] == binding["instance_id"], "prediction-instance-mismatch")
    require(prediction["commit"] == binding["base_commit"], "prediction-commit-mismatch")
    value = {
        "schema_version": "are.g02-r4-exposed-are-only-seal/v1",
        "posture": "exposed-development-only",
        "task_id": binding["instance_id"],
        "freeze_sha256": digest(root / "FREEZE.json"),
        "prediction_sha256": digest(prediction_path),
        "are_result_sha256": digest(root / "evidence/RESULTS.json"),
        "are_settlement_sha256": digest(root / "ARE-SETTLEMENT.json"),
        "ranker_sha256": freeze["source_hashes"]["code/ranked-source-acquisition.mjs"],
        "known_model_tokens": result["known_total_tokens"],
        "elapsed_seconds": settlement["elapsed_seconds"],
        "scorer_sha256": digest(SCORER),
        "claim_ceiling": "Exposed ARE-only development diagnostic; cannot support a matched or prospective superiority claim.",
    }
    write_once(path, value)
    print(json.dumps({"seal_sha256": digest(path), "task_id": value["task_id"]}))


def score(root):
    seal_path = root / "ARE-ONLY-PRE-SCORE-SEAL.json"
    seal_value = read(seal_path)
    require(seal_value["posture"] == "exposed-development-only", "seal-posture")
    require(digest(root / "FREEZE.json") == seal_value["freeze_sha256"], "freeze-drift")
    require(digest(root / "evidence/run/prediction.json") == seal_value["prediction_sha256"], "prediction-drift")
    require(digest(root / "evidence/RESULTS.json") == seal_value["are_result_sha256"], "result-drift")
    require(digest(root / "ARE-SETTLEMENT.json") == seal_value["are_settlement_sha256"], "settlement-drift")
    require(digest(SCORER) == seal_value["scorer_sha256"], "scorer-drift")
    score_path = root / "evidence/run/native-score.json"
    require(not score_path.exists(), "already-scored")
    cmd = ["python3", str(SCORER), "--upstream", str(UPSTREAM), "--gold", str(UPSTREAM / "data/full.parquet"),
           "--pred", str(root / "evidence/run/prediction.json"), "--cache", str(CACHE), "--out", str(score_path)]
    completed = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    require(completed.returncode == 0 and score_path.exists(), "native-score-failed:" + completed.stderr[-500:])
    metrics = read(score_path)["native"]["final"]
    value = {
        "schema_version": "are.g02-r4-exposed-are-only-result/v1",
        "posture": "exposed-development-only",
        "task_id": seal_value["task_id"],
        "seal_sha256": digest(seal_path),
        "native_score_sha256": digest(score_path),
        "span_f1": f1(metrics["span"]),
        "file_f1": f1(metrics["file"]),
        "known_model_tokens": seal_value["known_model_tokens"],
        "elapsed_seconds": seal_value["elapsed_seconds"],
        "claim_ceiling": seal_value["claim_ceiling"],
    }
    write_once(root / "ARE-ONLY-DIAGNOSTIC-RESULT.json", value)
    print(json.dumps(value))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=("seal", "score"))
    parser.add_argument("suffix", choices=sorted(ALLOWED))
    args = parser.parse_args()
    {"seal": seal, "score": score}[args.operation](ROOT_BASE / ("g02-cross-layer-" + args.suffix))
