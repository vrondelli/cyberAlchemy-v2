#!/usr/bin/env python3
"""Seal all 24 cohort-B ARE source-only rankings before scoring."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
RULE = HERE / "seal-bugswarm-graph-dev-r2-are.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2/code-only")
SOURCE = BASE / "SOURCE-PROJECTION-RECEIPT.json"
QUERIES = BASE / "QUERIES-B-R3.jsonl"
RANKINGS = BASE / "are-rankings"
OUTPUT = BASE / "ARE-SEAL-B-R3.json"
SOURCE_SHA = "ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92"
QUERIES_SHA = "696c742d96c69f7260f94a70d5159620c3bef8bb82e0d34b44beaddc31cdfe8b"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    if (OUTPUT.exists() or sha(SOURCE.read_bytes()) != SOURCE_SHA
            or sha(QUERIES.read_bytes()) != QUERIES_SHA):
        raise SystemExit("output-exists-or-input-pin-drift")
    spec = importlib.util.spec_from_file_location("g01_graph_r2_are_seal", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("seal-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.SOURCE_SHA = SOURCE_SHA
    module.QUERIES_SHA = QUERIES_SHA
    sys.argv = [str(RULE), "--source", str(SOURCE), "--queries", str(QUERIES),
                "--rankings", str(RANKINGS), "--output", str(OUTPUT)]
    module.main()
    receipt = json.loads(OUTPUT.read_bytes())
    receipt["schema_version"] = "are.g01-bugswarm-graph-dev-b-are-seal-r3/v1"
    receipt["driver_sha256"] = sha(Path(__file__).read_bytes())
    encoded = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    OUTPUT.write_bytes(encoded)
    print(json.dumps({"cohort": "B-r2", "are_seal_sha256": sha(encoded),
                      "rankings": len(receipt["rankings"])}), flush=True)


if __name__ == "__main__":
    main()
