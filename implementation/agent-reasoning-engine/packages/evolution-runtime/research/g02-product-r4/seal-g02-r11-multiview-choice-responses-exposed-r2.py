#!/usr/bin/env python3
"""Seal all G02 multi-view chooser responses before evaluator access."""

import hashlib
import json
import os
from pathlib import Path


ROOT = Path("/home/vlad_/are-benchmark-archive/g02-r11-multiview-choice-exposed-r2-20261004")
PACKETS = Path("/home/vlad_/are-benchmark-archive/g02-r11-multiview-choice-packets-exposed-r2-20261004/PACKETS.json")
PACKET_SHA = "f2a41a3f269dcf16085c82a118de39e0e8fa25aef96425db7d6befbf1ec58682"
FREEZE_SHA = "fd6d8ff0405c687e1580975a06fbebb02bcbcf181700c0412120ab59eef80d25"
OUTPUT = ROOT / "SEALED-RESPONSES.json"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if (OUTPUT.exists() or sha(PACKETS) != PACKET_SHA
            or sha(ROOT / "FREEZE.json") != FREEZE_SHA):
        raise SystemExit("output-exists-or-frozen-input-drift")
    packets = json.loads(PACKETS.read_text())["ordered_packets"]
    if [packet["ordinal"] for packet in packets] != list(range(1, 13)):
        raise SystemExit("packet-order")
    preflight = json.loads((ROOT / "PREFLIGHT.json").read_text())
    run = json.loads((ROOT / "RUN-RESULT.json").read_text())
    if (preflight.get("status") != "ready" or len(preflight.get("admissions", [])) != 12
            or not all(row.get("admitted") for row in preflight["admissions"])):
        raise SystemExit("preflight-not-admitted")
    if run.get("status") != "completed-exposed-diagnostic" or run.get("completed") != 12:
        raise SystemExit("run-not-complete")

    rows = []
    total_tokens = 0
    total_elapsed = 0
    for packet in packets:
        ordinal = packet["ordinal"]
        started_path = ROOT / f"STARTED-{ordinal}.json"
        response_path = ROOT / f"RESPONSE-{ordinal}.json"
        started = json.loads(started_path.read_text())
        response = json.loads(response_path.read_text())
        if (started.get("ordinal") != ordinal or response.get("ordinal") != ordinal
                or response.get("packet_sha256") != started.get("packet_sha256")
                or response.get("request_sha256") != started.get("request_sha256")
                or response.get("http_status") != 200 or response.get("finish_reason") != "stop"
                or response.get("failure_code") is not None or response.get("status") != "valid"):
            raise SystemExit(f"response-identity-validity-or-transport:{ordinal}")
        usage = response.get("usage") or {}
        prompt_tokens = usage.get("prompt_tokens")
        completion_tokens = usage.get("completion_tokens")
        if (not isinstance(prompt_tokens, int) or prompt_tokens <= 0
                or not isinstance(completion_tokens, int) or completion_tokens <= 0):
            raise SystemExit(f"usage:{ordinal}")
        ids = response.get("ids")
        paths = response.get("paths")
        if (not isinstance(ids, list) or not isinstance(paths, list) or len(ids) != len(paths)
                or len(ids) > 3 or len(ids) != len(set(ids)) or len(paths) != len(set(paths))
                or any(not isinstance(item, int) or item < 1 or item > 24 for item in ids)
                or paths != [packet["candidates"][item - 1]["path"] for item in ids]):
            raise SystemExit(f"choice:{ordinal}")
        known_tokens = prompt_tokens + completion_tokens
        total_tokens += known_tokens
        total_elapsed += response["elapsed_ms"]
        rows.append({"ordinal": ordinal, "selected_ids": ids, "selected_paths": paths,
                     "known_tokens": known_tokens, "elapsed_ms": response["elapsed_ms"],
                     "started_sha256": sha(started_path), "response_sha256": sha(response_path)})

    report = {
        "schema_version": "g02.r11-multiview-choice-response-seal-r2/v1",
        "posture": "exposed-development-model-output-sealed-before-gold",
        "packet_sha256": PACKET_SHA,
        "freeze_sha256": FREEZE_SHA,
        "preflight_sha256": sha(ROOT / "PREFLIGHT.json"),
        "run_result_sha256": sha(ROOT / "RUN-RESULT.json"),
        "rows": rows,
        "valid_responses": len(rows),
        "invalid_responses": 0,
        "selected_paths": sum(len(row["selected_paths"]) for row in rows),
        "known_chooser_tokens": total_tokens,
        "summed_chooser_elapsed_ms": total_elapsed,
        "claim_ceiling": "Sealed exposed read choices only; no actual ARE reads, native score, independent transfer, or superiority.",
    }
    data = (json.dumps(report, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"valid": len(rows), "selected_paths": report["selected_paths"],
                      "known_chooser_tokens": total_tokens,
                      "summed_chooser_elapsed_ms": total_elapsed,
                      "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
