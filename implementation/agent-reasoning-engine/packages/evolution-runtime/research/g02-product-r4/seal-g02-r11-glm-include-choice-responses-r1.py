#!/usr/bin/env python3
"""Seal successful exposed GLM choices before evaluator-only gold access."""

import argparse
import hashlib
import json
import os
from pathlib import Path


PACKET_SHA256 = "8b4c4939cf328374c295864223a2a431f39cdf89881a63728cff013128e464a8"
FREEZE_SHA256 = "20b88e0a1b6cbc26af84820cbf270f631c557dcd8bc0004d5b36628fc5b02644"
ORDINALS = (4, 8, 12)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    args = parser.parse_args()
    root = args.root
    if sha(root / "PACKETS.json") != PACKET_SHA256 or sha(root / "FREEZE.json") != FREEZE_SHA256:
        raise SystemExit("frozen input drift")
    packets = json.loads((root / "PACKETS.json").read_text())["ordered_packets"]
    if [packet["ordinal"] for packet in packets] != list(ORDINALS):
        raise SystemExit("packet order drift")
    result_path = root / "RUN-RESULT.json"
    result = json.loads(result_path.read_text())
    if result.get("status") != "completed-exposed-diagnostic" or result.get("completed") != 3:
        raise SystemExit("run not complete")
    rows = []
    total_tokens = 0
    for packet in packets:
        ordinal = packet["ordinal"]
        started_path = root / f"STARTED-{ordinal}.json"
        response_path = root / f"RESPONSE-{ordinal}.json"
        started = json.loads(started_path.read_text())
        response = json.loads(response_path.read_text())
        if (started.get("ordinal") != ordinal or response.get("ordinal") != ordinal or
                response.get("status") != "valid" or response.get("http_status") != 200 or
                response.get("finish_reason") != "stop" or response.get("failure_code") is not None or
                response.get("request_sha256") != started.get("request_sha256")):
            raise SystemExit(f"invalid response state: {ordinal}")
        paths = response.get("paths")
        eligible = {candidate["path"] for candidate in packet["candidates"]}
        if (not isinstance(paths, list) or len(paths) > 3 or len(set(paths)) != len(paths) or
                any(path not in eligible for path in paths)):
            raise SystemExit(f"invalid choice: {ordinal}")
        usage = response.get("usage") or {}
        prompt = usage.get("prompt_tokens")
        completion = usage.get("completion_tokens")
        if not isinstance(prompt, int) or not isinstance(completion, int) or prompt <= 0 or completion <= 0:
            raise SystemExit(f"unknown usage: {ordinal}")
        total_tokens += prompt + completion
        rows.append({"ordinal": ordinal, "started_sha256": sha(started_path),
                     "response_sha256": sha(response_path), "selected_paths": paths,
                     "known_tokens": prompt + completion, "elapsed_ms": response["elapsed_ms"]})
    output = {"schema_version": "g02.r11-glm-include-choice-response-seal/v1",
              "posture": "exposed-development-model-output-sealed-before-gold",
              "packet_seal_sha256": PACKET_SHA256, "freeze_sha256": FREEZE_SHA256,
              "run_result_sha256": sha(result_path), "rows": rows,
              "known_tokens_total": total_tokens,
              "claim_ceiling": "Sealed model read choices only; no actual ARE reads, native F1, independent cohort, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(root / "SEALED-RESPONSES.json", os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"responses": len(rows), "known_tokens_total": total_tokens,
                      "seal_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
