#!/usr/bin/env python3
"""Run sealed Bears Java functionality packets on the private VPS."""

import json
import os
from pathlib import Path
import time

import run_vps_r72 as common  # Exact inherited transport and validity helpers.

ROOT = Path("/opt/are-benchmark-runs/g01-bears-functionality-r77")
SECRET = Path("/opt/are-keld-presentation/secrets/model_api_key")
MODEL = "glm-5.3-flash"
TOKENIZER = "https://api.z.ai/api/paas/v4/tokenizer"
CHAT = "https://api.z.ai/api/paas/v4/chat/completions"
CASES = 24


def save(name, value):
    fd = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def main():
    packets_file = ROOT / "PACKETS.jsonl"
    protocol_file = ROOT / "R77-JAVA-TRANSFER-PROTOCOL.md"
    freeze_file = ROOT / "PACKET-FREEZE.json"
    freeze = json.loads(freeze_file.read_text())
    packets = [json.loads(line) for line in packets_file.read_text().splitlines()]
    if ((ROOT / "RUN-FREEZE.json").exists() or len(packets) != CASES
            or freeze["packets"] != CASES or freeze["status"] != "sealed-before-provider"
            or common.sha(packets_file.read_bytes()) != freeze["packets_sha256"]
            or common.sha(protocol_file.read_bytes()) != freeze["protocol_sha256"]):
        raise SystemExit("provider-preflight-drift")
    if any(row["ordinal"] != i or row["gold_opened"] or row["language"] != "Java"
           or common.sha(row["prompt"].encode()) != row["prompt_sha256"]
           for i, row in enumerate(packets, 1)):
        raise SystemExit("packet-integrity")
    key = SECRET.read_text().strip()
    if not 8 <= len(key) <= 8192:
        raise SystemExit("missing-secret")
    save("RUN-FREEZE.json", {"schema_version": "are.g01-bears-r77-provider-freeze/v1",
         "model": MODEL, "packets_sha256": freeze["packets_sha256"],
         "protocol_sha256": freeze["protocol_sha256"],
         "runner_sha256": common.sha(Path(__file__).read_bytes()),
         "transport_helper_sha256": common.sha(Path(common.__file__).read_bytes()),
         "max_tokenizer_calls": CASES, "max_generation_calls": CASES,
         "max_output_tokens": 192, "context_cap": 8192,
         "total_prompt_cap": 60000, "automatic_retries": 0, "gold_available": False})
    prompt_sum = 0
    for i, packet in enumerate(packets, 1):
        body = common.stable({"model": MODEL, "messages": [{"role": "user", "content": packet["prompt"]}]})
        started = time.monotonic()
        status, raw, failure = common.post(TOKENIZER, body, key, 30)
        reply = common.parsed(raw)
        usage = reply.get("usage") if reply else None
        tokens = usage.get("prompt_tokens") if isinstance(usage, dict) else None
        if not isinstance(tokens, int) or isinstance(tokens, bool):
            tokens = None
        if tokens is not None:
            prompt_sum += tokens
        admitted = (status == 200 and failure is None and tokens is not None
                    and tokens + 192 <= 8192 and prompt_sum <= 60000)
        save(f"TOKENIZER-{i:03d}.json", {"id": packet["id"], "status": status,
             "failure": failure, "request_sha256": common.sha(body), "response_sha256": common.sha(raw),
             "prompt_tokens": tokens, "elapsed_ms": round((time.monotonic()-started)*1000),
             "admitted": admitted})
        print(json.dumps({"phase": "tokenizer", "sequence": i, "admitted": admitted}), flush=True)
        if not admitted:
            raise SystemExit("tokenizer-admission-failed")
    save("TOKENIZER-RESULT.json", {"admitted": CASES, "prompt_tokens": prompt_sum})
    valid = 0
    usage_sum = {"prompt_tokens": 0, "completion_tokens": 0}
    for i, packet in enumerate(packets, 1):
        body = common.stable({"model": MODEL, "messages": [{"role": "user", "content": packet["prompt"]}],
                              "stream": False, "max_tokens": 192, "reasoning_effort": "low"})
        started = time.monotonic()
        status, raw, failure = common.post(CHAT, body, key, 120)
        reply = common.parsed(raw)
        choice = reply.get("choices", [{}])[0] if reply and reply.get("choices") else {}
        usage = reply.get("usage", {}) if reply else {}
        for name in usage_sum:
            if isinstance(usage, dict) and isinstance(usage.get(name), int):
                usage_sum[name] += usage[name]
        message = choice.get("message", {})
        summary = (common.valid_summary(message.get("content"))
                   if status == 200 and failure is None and choice.get("finish_reason") == "stop" else None)
        valid += summary is not None
        save(f"GENERATION-{i:03d}.json", {"id": packet["id"], "status": status,
             "failure": failure, "request_sha256": common.sha(body), "response_sha256": common.sha(raw),
             "elapsed_ms": round((time.monotonic()-started)*1000), "usage": usage,
             "provider_payload": reply})
        save(f"SUMMARY-{i:03d}.json", {"schema_version": "are.g01-bears-r77-summary/v1",
             "id": packet["id"], "ordinal": packet["ordinal"], "repo": packet["repo"],
             "query_sha256": packet["query_sha256"], "valid": summary is not None,
             "summary": summary, "fallback": "raw-query" if summary is None else None})
        print(json.dumps({"phase": "generation", "sequence": i,
                          "valid": summary is not None}), flush=True)
    result = {"schema_version": "are.g01-bears-r77-provider-result/v1", "status": "complete",
              "attempts": CASES, "valid_summaries": valid, "fallbacks": CASES-valid,
              "usage": usage_sum, "packets_sha256": freeze["packets_sha256"]}
    save("RUN-RESULT.json", result)
    print(json.dumps(result, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
