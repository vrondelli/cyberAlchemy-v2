#!/usr/bin/env python3
"""Seal all 24 private r4 responses before any evaluator-only read."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


ROOT = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-r2/source-only/union-selector-r4-vps-run")
PACKETS_SHA = "2eab7cd9858421eaca78f6e13c7f6209eec29adf1e6224b5a0e0701b3728d33f"
RESULT_SHA = "601bb72aa49547b52730fab73086d8e995174c76785e9b1c56c72ea298630cc6"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    out = ROOT / "PREDICTION-SEAL.json"
    if out.exists() or sha((ROOT / "PACKETS.jsonl").read_bytes()) != PACKETS_SHA or \
            sha((ROOT / "GENERATION-RESULT.json").read_bytes()) != RESULT_SHA:
        raise SystemExit("input-pin-drift-or-output-exists")
    packets = [json.loads(line) for line in (ROOT / "PACKETS.jsonl").read_bytes().splitlines()]
    result = json.loads((ROOT / "GENERATION-RESULT.json").read_bytes())
    if len(packets) != 24 or result["attempts"] != 24 or result["valid"] != 20:
        raise SystemExit("denominator-or-result-drift")
    receipts = []
    for index, packet in enumerate(packets, 1):
        path = ROOT / f"GENERATION-{index:02d}.json"
        data = path.read_bytes()
        row = json.loads(data)
        if (row["ordinal"] != index or row["id"] != packet["id"] or
                row["prompt_sha256"] != sha(packet["prompt"].encode()) or
                row["status"] not in {"valid", "invalid"} or
                (row["status"] == "valid") != (row["selected_ids"] is not None)):
            raise SystemExit(f"response-identity-or-status:{index}")
        if row["selected_ids"] is not None and (len(row["selected_ids"]) > 8 or
                any(not isinstance(number, int) or number < 1 or
                    number > packet["candidate_count"] for number in row["selected_ids"]) or
                len(set(row["selected_ids"])) != len(row["selected_ids"])):
            raise SystemExit(f"response-selection-shape:{index}")
        receipts.append({"ordinal": index, "id": packet["id"], "status": row["status"],
                         "response_sha256": sha(data), "selected_ids": row["selected_ids"]})
    seal = {"schema_version": "are.g01-graph-dev-r4-prediction-seal/v1",
            "posture": "source-only; evaluator unopened; exposed development",
            "packets_sha256": PACKETS_SHA, "generation_result_sha256": RESULT_SHA,
            "cases": 24, "valid": 20, "invalid": 4, "responses": receipts,
            "gold_opened": False, "reserved_confirmation_opened": False}
    data = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(out, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"seal_sha256": sha(data), "cases": 24,
                      "valid": 20, "invalid": 4}))


if __name__ == "__main__":
    main()
