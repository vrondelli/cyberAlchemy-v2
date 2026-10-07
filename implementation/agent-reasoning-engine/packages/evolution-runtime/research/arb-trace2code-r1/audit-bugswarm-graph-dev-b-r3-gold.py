#!/usr/bin/env python3
"""Run the unchanged evaluator-only gold rule on graph development cohort B."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
RULE = HERE / "audit-bugswarm-graph-dev-r2-gold.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
CANDIDATE = BASE / "graph-dev-b-r1/METADATA-COHORT-B-R2.json"
RAW = BASE / "1.3.1-bugswarm.json"
OUTPUT = BASE / "graph-dev-b-r2/evaluator-only"
CANDIDATE_SHA = "53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8"
RAW_SHA = "c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    if (OUTPUT.exists() or sha(CANDIDATE.read_bytes()) != CANDIDATE_SHA
            or sha(RAW.read_bytes()) != RAW_SHA):
        raise SystemExit("output-exists-or-input-pin-drift")
    spec = importlib.util.spec_from_file_location("g01_graph_r2_gold", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("gold-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.CANDIDATE_SHA = CANDIDATE_SHA
    OUTPUT.mkdir(mode=0o700)
    sys.argv = [str(RULE), "--candidate", str(CANDIDATE), "--raw", str(RAW),
                "--output-dir", str(OUTPUT)]
    module.main()
    receipt_path = OUTPUT / "DEV-GOLD-AUDIT-R2.json"
    receipt = json.loads(receipt_path.read_bytes())
    receipt["schema_version"] = "are.g01-bugswarm-graph-dev-b-gold-audit-r3/v1"
    receipt["driver_sha256"] = sha(Path(__file__).read_bytes())
    encoded = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    final = OUTPUT / "DEV-GOLD-AUDIT-B-R3.json"
    fd = os.open(final, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cohort": "B-r2", "gold_receipt_sha256": sha(encoded),
                      "gold_admissible": sum(row["gold_admissible"]
                                             for row in receipt["results"])}), flush=True)


if __name__ == "__main__":
    main()
