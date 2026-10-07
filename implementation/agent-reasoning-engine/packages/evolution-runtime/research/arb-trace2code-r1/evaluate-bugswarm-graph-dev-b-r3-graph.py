#!/usr/bin/env python3
"""Evaluator-only paired graph-vs-ARE transfer score for cohort B."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
RULE = HERE / "evaluate-bugswarm-graph-dev-r2-graph.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2")
INPUTS = {
    "graph_seal": (BASE / "code-only/graph-r2/GRAPH-RANKING-SEAL-B-R3.json", "bef3ad37a6c4f87d08e3254df47a7ae1c52e641b58a672859511a47737639813"),
    "are_seal": (BASE / "code-only/ARE-SEAL-B-R3.json", "d6555bb758b3f974c516ab23ae29cf6e8ddfa493804feb5fb247bc13395fd2ed"),
    "gold": (BASE / "evaluator-only/DEV-GOLD-AUDIT-B-R3.json", "ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e"),
    "projection": (BASE / "evaluator-only/PROJECTION-GOLD-AUDIT-B-R3.json", "0a72eb4e9c44f2776bceb72ec602b59c897f41dea227cf122ad00a9ce3f9af7d"),
    "are_evaluation": (BASE / "evaluator-only/ARE-EVALUATION-B-R3.json", "0be6977ed77ed3c958d8f6e6018850a31310f0ae785dc2b1441b350b82600861"),
}
GRAPH = BASE / "code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl"
ARE = BASE / "code-only/are-rankings"
OUTPUT = BASE / "evaluator-only/GRAPH-EVALUATION-B-R3.json"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    if OUTPUT.exists() or any(sha(path.read_bytes()) != pin
                              for path, pin in INPUTS.values()):
        raise SystemExit("output-exists-or-input-pin-drift")
    spec = importlib.util.spec_from_file_location("g01_graph_r2_eval", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("evaluator-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.PINS = {name: pin for name, (_, pin) in INPUTS.items()}
    sys.argv = [str(RULE)]
    for name, (path, _) in INPUTS.items():
        sys.argv += ["--" + name.replace("_", "-"), str(path)]
    sys.argv += ["--graph-rankings", str(GRAPH), "--are-rankings", str(ARE),
                 "--output", str(OUTPUT)]
    module.main()
    receipt = json.loads(OUTPUT.read_bytes())
    receipt["schema_version"] = "are.g01-bugswarm-graph-dev-b-evaluation-r3/v1"
    receipt["driver_sha256"] = sha(Path(__file__).read_bytes())
    receipt.pop("quality_gate")
    receipt["quality_gate"] = "not frozen for the second development cohort; paired scores are exploratory transfer evidence"
    receipt["claim_ceiling"] = "Repository-disjoint private development transfer only; HTTP labels/logs provisional; not independent confirmation, ContextBench, live ARE, or superiority."
    encoded = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    OUTPUT.write_bytes(encoded)
    print(json.dumps({"cohort": "B-r2", "aggregate": receipt["aggregate"],
                      "paired": receipt["paired"], "evaluation_sha256": sha(encoded)}),
          flush=True)


if __name__ == "__main__":
    main()
