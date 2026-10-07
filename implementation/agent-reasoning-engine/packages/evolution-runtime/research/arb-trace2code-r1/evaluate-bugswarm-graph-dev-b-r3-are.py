#!/usr/bin/env python3
"""Evaluator-only score of the sealed cohort-B ARE baseline."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
RULE = HERE / "evaluate-bugswarm-graph-dev-r2-are.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2")
SEAL = BASE / "code-only/ARE-SEAL-B-R3.json"
GOLD = BASE / "evaluator-only/DEV-GOLD-AUDIT-B-R3.json"
PROJECTION = BASE / "evaluator-only/PROJECTION-GOLD-AUDIT-B-R3.json"
RANKINGS = BASE / "code-only/are-rankings"
OUTPUT = BASE / "evaluator-only/ARE-EVALUATION-B-R3.json"
PINS = {"seal": "d6555bb758b3f974c516ab23ae29cf6e8ddfa493804feb5fb247bc13395fd2ed",
        "gold": "ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e",
        "projection": "0a72eb4e9c44f2776bceb72ec602b59c897f41dea227cf122ad00a9ce3f9af7d"}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    inputs = {"seal": SEAL, "gold": GOLD, "projection": PROJECTION}
    if OUTPUT.exists() or any(sha(path.read_bytes()) != PINS[name]
                              for name, path in inputs.items()):
        raise SystemExit("output-exists-or-input-pin-drift")
    spec = importlib.util.spec_from_file_location("g01_graph_r2_are_eval", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("evaluator-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.PINS = PINS
    sys.argv = [str(RULE), "--seal", str(SEAL), "--gold", str(GOLD),
                "--projection", str(PROJECTION), "--rankings", str(RANKINGS),
                "--output", str(OUTPUT)]
    module.main()
    receipt = json.loads(OUTPUT.read_bytes())
    receipt["schema_version"] = "are.g01-bugswarm-graph-dev-b-are-evaluation-r3/v1"
    receipt["driver_sha256"] = sha(Path(__file__).read_bytes())
    receipt["claim_ceiling"] = "Private second development cohort; HTTP labels/logs provisional; no independent confirmation, ContextBench, live ARE episode, or superiority claim."
    encoded = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    OUTPUT.write_bytes(encoded)
    print(json.dumps({"cohort": "B-r2", "aggregate": receipt["aggregate"],
                      "evaluation_sha256": sha(encoded)}), flush=True)


if __name__ == "__main__":
    main()
