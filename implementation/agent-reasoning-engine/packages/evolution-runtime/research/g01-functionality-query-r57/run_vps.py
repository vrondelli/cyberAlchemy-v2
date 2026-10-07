#!/usr/bin/env python3
"""Execute the frozen r57 functionality-summary calls on the private VPS."""

import hashlib
import json
import os
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path("/opt/are-benchmark-runs/g01-functionality-query-r57")
SECRET = Path("/opt/are-keld-presentation/secrets/model_api_key")
MODEL = "glm-5.3-flash"
TOKENIZER = "https://api.z.ai/api/paas/v4/tokenizer"
CHAT = "https://api.z.ai/api/paas/v4/chat/completions"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def stable(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def save(name, value):
    fd = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(value, f, sort_keys=True, indent=2)
        f.write("\n")


def post(url, body, key, timeout):
    req = Request(url, data=body, method="POST", headers={"Authorization": "Bearer " + key,
        "Content-Type": "application/json", "Accept": "application/json", "User-Agent": "ARE-G01-r57/1"})
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read(262145)
            return resp.status, raw[:262144], None if len(raw) <= 262144 else "response-too-large"
    except HTTPError as error:
        return error.code, error.read(65536), "http-error"
    except (URLError, TimeoutError, OSError) as error:
        return None, b"", type(error).__name__


def parsed(raw):
    try:
        value = json.loads(raw)
        return value if isinstance(value, dict) else None
    except (UnicodeDecodeError, ValueError):
        return None


def valid_summary(content):
    if not isinstance(content, str):
        return None
    summary = " ".join(content.split())
    if not (20 <= len(summary) <= 400) or "```" in summary:
        return None
    return summary


def main():
    packets_file = ROOT / "PACKETS.jsonl"
    protocol_file = ROOT / "PROTOCOL.md"
    freeze_file = ROOT / "PACKET-FREEZE.json"
    freeze = json.loads(freeze_file.read_text())
    packets = [json.loads(x) for x in packets_file.read_text().splitlines()]
    if (ROOT / "RUN-FREEZE.json").exists() or len(packets) != 48 or freeze["packets"] != 48:
        raise SystemExit("preflight output or denominator drift")
    if sha(packets_file.read_bytes()) != freeze["packets_sha256"] or sha(protocol_file.read_bytes()) != freeze["protocol_sha256"]:
        raise SystemExit("packet or protocol drift")
    if any(x["gold_opened"] or sha(x["prompt"].encode()) != x["prompt_sha256"] for x in packets):
        raise SystemExit("packet integrity")
    key = SECRET.read_text().strip()
    if not 8 <= len(key) <= 8192:
        raise SystemExit("missing secret")
    save("RUN-FREEZE.json", {"schema_version": "are.g01-r57-provider-freeze/v1", "model": MODEL,
         "packets_sha256": freeze["packets_sha256"], "protocol_sha256": freeze["protocol_sha256"],
         "runner_sha256": sha(Path(__file__).read_bytes()), "max_tokenizer_calls": 48,
         "max_generation_calls": 48, "max_output_tokens": 192, "context_cap": 8192,
         "total_prompt_cap": 100000, "automatic_retries": 0, "gold_available": False})
    prompt_sum = 0
    for i, packet in enumerate(packets, 1):
        body = stable({"model": MODEL, "messages": [{"role": "user", "content": packet["prompt"]}]})
        started = time.monotonic()
        status, raw, failure = post(TOKENIZER, body, key, 30)
        reply = parsed(raw)
        usage = reply.get("usage") if reply else None
        tokens = usage.get("prompt_tokens") if isinstance(usage, dict) else None
        if not isinstance(tokens, int) or isinstance(tokens, bool):
            tokens = None
        if tokens is not None:
            prompt_sum += tokens
        admitted = status == 200 and failure is None and tokens is not None and tokens + 192 <= 8192 and prompt_sum <= 100000
        save(f"TOKENIZER-{i:03d}.json", {"id": packet["id"], "status": status, "failure": failure,
             "request_sha256": sha(body), "response_sha256": sha(raw), "prompt_tokens": tokens,
             "elapsed_ms": round((time.monotonic()-started)*1000), "admitted": admitted})
        print(json.dumps({"phase": "tokenizer", "sequence": i, "admitted": admitted}), flush=True)
        if not admitted:
            raise SystemExit("tokenizer admission failed")
    save("TOKENIZER-RESULT.json", {"admitted": 48, "prompt_tokens": prompt_sum})
    valid = 0
    usage_sum = {"prompt_tokens": 0, "completion_tokens": 0}
    for i, packet in enumerate(packets, 1):
        body = stable({"model": MODEL, "messages": [{"role": "user", "content": packet["prompt"]}],
             "stream": False, "max_tokens": 192, "reasoning_effort": "low"})
        started = time.monotonic()
        status, raw, failure = post(CHAT, body, key, 120)
        reply = parsed(raw)
        choice = reply.get("choices", [{}])[0] if reply and reply.get("choices") else {}
        usage = reply.get("usage", {}) if reply else {}
        for name in usage_sum:
            if isinstance(usage, dict) and isinstance(usage.get(name), int):
                usage_sum[name] += usage[name]
        summary = valid_summary(choice.get("message", {}).get("content")) if status == 200 and failure is None and choice.get("finish_reason") == "stop" else None
        if summary:
            valid += 1
        save(f"GENERATION-{i:03d}.json", {"id": packet["id"], "status": status, "failure": failure,
             "request_sha256": sha(body), "response_sha256": sha(raw), "elapsed_ms": round((time.monotonic()-started)*1000),
             "usage": usage, "provider_payload": reply})
        save(f"SUMMARY-{i:03d}.json", {"schema_version": "are.g01-r57-summary/v1", "id": packet["id"],
             "cohort": packet["cohort"], "case_id": packet["case_id"], "repo": packet["repo"],
             "query_sha256": packet["query_sha256"], "valid": summary is not None,
             "summary": summary, "fallback": "raw-query" if summary is None else None})
        print(json.dumps({"phase": "generation", "sequence": i, "valid": summary is not None}), flush=True)
    result = {"schema_version": "are.g01-r57-provider-result/v1", "status": "complete", "attempts": 48,
              "valid_summaries": valid, "fallbacks": 48-valid, "usage": usage_sum,
              "packets_sha256": freeze["packets_sha256"]}
    save("RUN-RESULT.json", result)
    print(json.dumps(result, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
