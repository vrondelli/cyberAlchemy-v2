#!/usr/bin/env python3
"""Evaluator-only reach screen for sealed cohort-B stratified candidates."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
RULE = HERE / "evaluate-bugswarm-graph-dev-b-r6-stems.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2")
CANDIDATES = BASE / "code-only/stratified-r7/CANDIDATES-B-R7.jsonl"
SEAL = BASE / "code-only/stratified-r7/SEAL-B-R7.json"
GOLD = BASE / "evaluator-only/DEV-GOLD-AUDIT-B-R3.json"
OUTPUT = BASE / "evaluator-only/STRATIFIED-REACH-B-R7.json"
PINS = {"candidates": "a9d9d73daa1cd05318583c525cec899edad6c4a84dc48b411b135befe9227ef3",
        "seal": "21c87da11d3cb31163f0ac87c3109537a41a7852a5e259d6fc4692b42ee5fecb",
        "gold": "ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e"}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    inputs = {"candidates": CANDIDATES, "seal": SEAL, "gold": GOLD}
    if OUTPUT.exists() or any(sha(path.read_bytes()) != PINS[name]
                              for name, path in inputs.items()):
        raise SystemExit("output-exists-or-input-pin-drift")
    spec = importlib.util.spec_from_file_location("g01_b_r6_reach_eval", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("evaluator-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.CANDIDATES = CANDIDATES
    module.SEAL = SEAL
    module.GOLD = GOLD
    module.OUTPUT = OUTPUT
    module.PINS = PINS
    module.main()
    result = json.loads(OUTPUT.read_bytes())
    result["schema_version"] = "are.g01-bugswarm-graph-dev-b-stratified-evaluation-r7/v1"
    result["driver_sha256"] = sha(Path(__file__).read_bytes())
    result["newly_reached"] = [row["ordinal"] for row in result["cases"]
                               if not row["prior_reach"] and row["new_reach"]]
    result["claim_ceiling"] = "Private score-exposed development reach only; no model ranking, independent confirmation, ContextBench, live ARE, or superiority."
    encoded = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    OUTPUT.write_bytes(encoded)
    print(json.dumps({"cohort": "B-r2", "new_reach": result["new_reach"],
                      "newly_reached": result["newly_reached"],
                      "evaluation_sha256": sha(encoded)}), flush=True)


if __name__ == "__main__":
    main()
