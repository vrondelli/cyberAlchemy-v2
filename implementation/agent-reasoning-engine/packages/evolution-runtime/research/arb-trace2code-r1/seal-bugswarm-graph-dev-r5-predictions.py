#!/usr/bin/env python3
"""Seal complete source-only G01 r5 rankings before evaluator access."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-r2")
R4 = BASE / "source-only/union-selector-r4-vps-run"
R5 = BASE / "source-only/normalized-selector-r5-vps-run"
PINS = {
    "packets": (R4 / "PACKETS.jsonl",
                "2eab7cd9858421eaca78f6e13c7f6209eec29adf1e6224b5a0e0701b3728d33f"),
    "r2": (BASE / "source-only/graph-rankings/GRAPH-RANKINGS-R2.jsonl",
           "e3bd92f75b1fa3dfc95a43dfa29c69e8ebc6dc92e1e7bc5ba12565541586361a"),
    "result": (R5 / "GENERATION-RESULT.json",
               "ebb2b4d2fa93b8f0bf8880fe567b5e68de9954ee0e9f59ad01d9e6b4b77d50f2"),
    "protocol": (R5 / "G01-BUGSWARM-GRAPH-DEV-R5-NORMALIZED-SELECTOR-PROTOCOL-2026-10-04.md",
                 "8265d321d814ff2d71b4b3984e943f623f02d87996aa8a1ddcc4f14b52bd6325"),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    prediction_path = R5 / "PREDICTIONS-R5.jsonl"
    seal_path = R5 / "PREDICTION-SEAL.json"
    if prediction_path.exists() or seal_path.exists():
        raise SystemExit("output-exists")
    blobs = {}
    for name, (path, expected) in PINS.items():
        blob = path.read_bytes()
        if sha(blob) != expected:
            raise SystemExit(f"input-pin-drift:{name}")
        blobs[name] = blob
    packets = [json.loads(line) for line in blobs["packets"].splitlines()]
    prior = [json.loads(line) for line in blobs["r2"].splitlines()]
    result = json.loads(blobs["result"])
    if (len(packets) != 24 or len(prior) != 24 or result["status"] != "completed-valid"
            or result["attempts"] != 24 or result["valid"] != 24
            or result["packets_sha256"] != PINS["packets"][1]):
        raise SystemExit("denominator-or-result-drift")
    predictions, receipts = [], []
    for index, (packet, baseline) in enumerate(zip(packets, prior), 1):
        path = R5 / f"GENERATION-{index:02d}.json"
        data = path.read_bytes()
        response = json.loads(data)
        if (not (packet["ordinal"] == baseline["ordinal"] == response["ordinal"] == index)
                or not (packet["id"] == baseline["id"] == response["id"])
                or response["status"] != "valid" or response["http_status"] != 200
                or response["prompt_sha256"] != sha(packet["prompt"].encode())
                or packet["gold_opened"] or baseline["gold_opened"]
                or len(packet["candidates"]) != packet["candidate_count"]):
            raise SystemExit(f"case-identity-or-posture:{index}")
        ids = response["selected_ids"]
        if (not isinstance(ids, list) or len(ids) > 8 or
                any(type(n) is not int or n < 1 or n > packet["candidate_count"] for n in ids)
                or len(set(ids)) != len(ids)):
            raise SystemExit(f"selected-ids-shape:{index}")
        chosen = [packet["candidates"][n - 1]["path"] for n in ids]
        chosen_set = set(chosen)
        order = chosen + [item for item in baseline["ranked_files"] if item not in chosen_set]
        if (len(order) != len(baseline["ranked_files"]) or
                set(order) != set(baseline["ranked_files"]) or
                len(order) != len(set(order))):
            raise SystemExit(f"complete-coverage:{index}")
        predictions.append({"schema_version": "are.g01-graph-dev-r5-prediction/v1",
                            "ordinal": index, "id": packet["id"], "repo": packet["repo"],
                            "language": packet["language"], "base_commit": packet["base_commit"],
                            "source_tree_sha256": packet["source_tree_sha256"],
                            "selected_ids": ids, "ranked_files": order,
                            "gold_opened": False, "reserved_confirmation_opened": False})
        receipts.append({"ordinal": index, "id": packet["id"],
                         "response_sha256": sha(data), "selected_ids": ids})
    prediction_blob = ("".join(json.dumps(row) + "\n" for row in predictions)).encode()
    seal = {"schema_version": "are.g01-graph-dev-r5-prediction-seal/v1",
            "posture": "source-only exposed development; evaluator unopened",
            "cases": 24, "valid": 24, "input_sha256": {name: pin for name, (_, pin) in PINS.items()},
            "response_receipts": receipts, "predictions_sha256": sha(prediction_blob),
            "script_sha256": sha(Path(__file__).read_bytes()),
            "gold_opened": False, "reserved_confirmation_opened": False}
    exclusive(prediction_path, prediction_blob)
    seal_blob = (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode()
    exclusive(seal_path, seal_blob)
    print(json.dumps({"cases": 24, "predictions_sha256": sha(prediction_blob),
                      "prediction_seal_sha256": sha(seal_blob)}))


if __name__ == "__main__":
    main()
