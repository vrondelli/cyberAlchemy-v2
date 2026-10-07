#!/usr/bin/env python3
"""Evaluator-only join of cohort B labels against the sealed code projection."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
RULE = HERE / "audit-bugswarm-graph-dev-r2-projection-gold.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
SOURCE = BASE / "graph-dev-b-r2/source-archives/SOURCE-ARCHIVES-VALIDATED-B-R3.json"
GOLD = BASE / "graph-dev-b-r2/evaluator-only/DEV-GOLD-AUDIT-B-R3.json"
ARCHIVES = BASE / "graph-dev-b-r2/source-archives"
OUTPUT = BASE / "graph-dev-b-r2/evaluator-only/PROJECTION-GOLD-AUDIT-B-R3.json"
SOURCE_SHA = "b8ba45df6f3e9a6e3440c85291814173304a95ad0c378fed9d10d7114ad91f7c"
GOLD_SHA = "ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    if (OUTPUT.exists() or sha(SOURCE.read_bytes()) != SOURCE_SHA
            or sha(GOLD.read_bytes()) != GOLD_SHA):
        raise SystemExit("output-exists-or-input-pin-drift")
    spec = importlib.util.spec_from_file_location("g01_graph_r2_projection_gold", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("projection-gold-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.SOURCE_SHA = SOURCE_SHA
    module.GOLD_SHA = GOLD_SHA
    sys.argv = [str(RULE), "--source", str(SOURCE), "--gold", str(GOLD),
                "--archives", str(ARCHIVES), "--output", str(OUTPUT)]
    module.main()
    receipt = json.loads(OUTPUT.read_bytes())
    receipt["schema_version"] = "are.g01-bugswarm-graph-dev-b-projection-gold-r3/v1"
    receipt["driver_sha256"] = sha(Path(__file__).read_bytes())
    encoded = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    OUTPUT.write_bytes(encoded)
    print(json.dumps({"cohort": "B-r2", "projection_gold_receipt_sha256": sha(encoded),
                      "cases_projected": sum(row["all_projected"] for row in receipt["results"])}),
          flush=True)


if __name__ == "__main__":
    main()
