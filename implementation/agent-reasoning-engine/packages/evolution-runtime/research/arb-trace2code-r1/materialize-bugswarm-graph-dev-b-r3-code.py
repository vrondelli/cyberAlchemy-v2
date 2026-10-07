#!/usr/bin/env python3
"""Materialize the pinned second-development BugSwarm code-only cohort.

This versioned driver reuses the unchanged r2 projection rule while binding
the B-r2 cohort and its B-r3 archive-validation receipt. It opens no gold.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
RULE = HERE / "materialize-bugswarm-graph-dev-r2-code.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
CANDIDATE = BASE / "graph-dev-b-r1/METADATA-COHORT-B-R2.json"
SOURCE = BASE / "graph-dev-b-r2/source-archives/SOURCE-ARCHIVES-VALIDATED-B-R3.json"
ARCHIVES = BASE / "graph-dev-b-r2/source-archives"
OUTPUT = BASE / "graph-dev-b-r2/code-only"
CANDIDATE_SHA = "53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8"
SOURCE_SHA = "b8ba45df6f3e9a6e3440c85291814173304a95ad0c378fed9d10d7114ad91f7c"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    if (OUTPUT.exists() or sha(CANDIDATE.read_bytes()) != CANDIDATE_SHA
            or sha(SOURCE.read_bytes()) != SOURCE_SHA):
        raise SystemExit("output-exists-or-input-pin-drift")
    spec = importlib.util.spec_from_file_location("g01_graph_r2_materializer", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("projection-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.CANDIDATE_SHA = CANDIDATE_SHA
    module.SOURCE_SHA = SOURCE_SHA
    sys.argv = [str(RULE), "--candidate", str(CANDIDATE), "--source-receipt",
                str(SOURCE), "--archives", str(ARCHIVES), "--output", str(OUTPUT)]
    module.main()
    receipt_path = OUTPUT / "SOURCE-PROJECTION-RECEIPT.json"
    receipt = json.loads(receipt_path.read_bytes())
    receipt["schema_version"] = "are.g01-bugswarm-graph-dev-b-code-projection-r3/v1"
    receipt["driver_sha256"] = sha(Path(__file__).read_bytes())
    encoded = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    receipt_path.write_bytes(encoded)
    print(json.dumps({"cohort": "B-r2", "projection_receipt_sha256": sha(encoded),
                      "projected_cases": len(receipt["records"])}), flush=True)


if __name__ == "__main__":
    main()
