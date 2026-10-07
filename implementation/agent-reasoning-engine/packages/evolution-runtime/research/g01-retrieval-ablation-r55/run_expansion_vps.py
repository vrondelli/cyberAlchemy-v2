#!/usr/bin/env python3
"""Run frozen r55 structured-query expansion packets on the private VPS."""

from __future__ import annotations

import hashlib
import json
import os
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path("/opt/are-benchmark-runs/g01-retrieval-ablation-r55")
SECRET = Path("/opt/are-keld-presentation/secrets/model_api_key")
MODEL = "glm-5.3-flash"
TOKENIZER_URL = "https://api.z.ai/api/paas/v4/tokenizer"
GENERATION_URL = "https://api.z.ai/api/paas/v4/chat/completions"
PACKETS = 48
TOKEN_CAP = 100_000


def stable(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def need(ok: bool, why: str) -> None:
    if not ok:
        raise ValueError("g01-r55." + why)


def save(name: str, value: object) -> None:
    descriptor = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def post(url: str, body: bytes, key: str, timeout: int):
    request = Request(url, data=body, method="POST", headers={
        "Authorization": "Bearer " + key, "Content-Type": "application/json",
        "Accept": "application/json", "User-Agent": "ARE-G01-r55/1",
    })
    try:
        with urlopen(request, timeout=timeout) as response:
            raw = response.read(262_145)
            return response.status, raw if len(raw) <= 262_144 else b"", \
                None if len(raw) <= 262_144 else "response-too-large"
    except HTTPError as error:
        return error.code, error.read(65_536), "http-error"
    except (URLError, TimeoutError, OSError) as error:
        return None, b"", type(error).__name__


def doc(raw: bytes):
    try:
        value = json.loads(raw)
        return value if isinstance(value, dict) else None
    except (ValueError, UnicodeDecodeError):
        return None


def expansion(content: object, raw_query: str) -> dict:
    need(isinstance(content, str), "content")
    value = json.loads(content)
    keys = {"identifiers", "error_types", "concepts", "causal_hypothesis"}
    need(isinstance(value, dict) and set(value) == keys, "shape")
    limits = {"identifiers": (16, 128), "error_types": (8, 128), "concepts": (12, 160)}
    for key, (count, width) in limits.items():
        values = value[key]
        need(isinstance(values, list) and len(values) <= count, key + "-shape")
        need(all(isinstance(item, str) and 0 < len(item) <= width for item in values), key + "-value")
        need(len(values) == len(set(values)), key + "-duplicate")
    lower = raw_query.lower()
    need(all(item.lower() in lower for item in value["identifiers"]), "identifier-not-verbatim")
    need(all(item.lower() in lower for item in value["error_types"]), "error-not-verbatim")
    need(isinstance(value["causal_hypothesis"], str)
         and len(value["causal_hypothesis"]) <= 512, "hypothesis")
    return value


def main() -> None:
    packet_path = ROOT / "PACKETS.jsonl"
    freeze_path = ROOT / "PACKET-FREEZE.json"
    protocol_path = ROOT / "PROTOCOL.md"
    freeze = json.loads(freeze_path.read_text())
    need(not (ROOT / "RUN-FREEZE.json").exists()
         and freeze["packets"] == PACKETS
         and freeze["packets_sha256"] == sha(packet_path.read_bytes())
         and freeze["protocol_sha256"] == sha(protocol_path.read_bytes()), "input-integrity")
    packets = [json.loads(line) for line in packet_path.read_text().splitlines()]
    need(len(packets) == PACKETS and all(not row["gold_opened"] for row in packets), "packets")
    key = SECRET.read_text().strip()
    need(8 <= len(key) <= 8192, "secret")
    save("RUN-FREEZE.json", {
        "schema_version": "are.g01-r55-expansion-run-freeze/v1",
        "packets_sha256": freeze["packets_sha256"], "packet_freeze_sha256": sha(freeze_path.read_bytes()),
        "protocol_sha256": freeze["protocol_sha256"], "runner_sha256": sha(Path(__file__).read_bytes()),
        "model": MODEL, "response_format": {"type": "json_object"},
        "maximum_tokenizer_calls": PACKETS, "maximum_generation_calls": PACKETS,
        "maximum_output_tokens": 256, "reasoning_effort": "low", "total_prompt_cap": TOKEN_CAP,
        "automatic_retries": 0, "gold_available": False,
    })
    token_sum = 0
    for sequence, packet in enumerate(packets, 1):
        body = stable({"model": MODEL, "messages": [{"role": "user", "content": packet["prompt"]}]})
        started = time.monotonic(); status, raw, failure = post(TOKENIZER_URL, body, key, 30)
        provider = doc(raw); tokens = provider.get("usage", {}).get("prompt_tokens") if provider else None
        tokens = tokens if isinstance(tokens, int) and not isinstance(tokens, bool) else None
        if tokens is not None: token_sum += tokens
        admitted = status == 200 and failure is None and tokens is not None \
            and tokens + 256 <= 8192 and token_sum <= TOKEN_CAP
        save(f"TOKENIZER-{sequence:03d}.json", {
            "schema_version": "are.g01-r55-expansion-tokenizer/v1", "sequence": sequence,
            "id": packet["id"], "prompt_sha256": sha(packet["prompt"].encode()),
            "request_sha256": sha(body), "response_sha256": sha(raw), "http_status": status,
            "failure_code": failure, "prompt_tokens": tokens,
            "elapsed_ms": round((time.monotonic() - started) * 1000), "admitted": admitted,
        })
        print(json.dumps({"phase": "tokenizer", "sequence": sequence, "admitted": admitted}), flush=True)
        if not admitted: raise SystemExit("tokenizer rejected")
    save("TOKENIZER-RESULT.json", {"schema_version": "are.g01-r55-expansion-tokenizer-result/v1",
         "status": "admitted", "attempts": PACKETS, "admitted": PACKETS,
         "summed_prompt_tokens": token_sum, "packets_sha256": freeze["packets_sha256"]})

    valid = prompt_tokens = completion_tokens = elapsed_sum = 0
    for sequence, packet in enumerate(packets, 1):
        body = stable({"model": MODEL, "messages": [{"role": "user", "content": packet["prompt"]}],
                       "stream": False, "max_tokens": 256, "reasoning_effort": "low",
                       "response_format": {"type": "json_object"}})
        started = time.monotonic(); status, raw, failure = post(GENERATION_URL, body, key, 120)
        provider = doc(raw); elapsed = round((time.monotonic() - started) * 1000); elapsed_sum += elapsed
        choice = provider.get("choices", [{}])[0] if provider and provider.get("choices") else {}
        usage = provider.get("usage") if provider else None
        if isinstance(usage, dict):
            prompt_tokens += usage.get("prompt_tokens", 0) if isinstance(usage.get("prompt_tokens"), int) else 0
            completion_tokens += usage.get("completion_tokens", 0) if isinstance(usage.get("completion_tokens"), int) else 0
        save(f"GENERATION-{sequence:03d}.json", {
            "schema_version": "are.g01-r55-expansion-call/v1", "sequence": sequence, "id": packet["id"],
            "request_sha256": sha(body), "response_sha256": sha(raw), "http_status": status,
            "failure_code": failure, "elapsed_ms": elapsed, "usage": usage, "provider_payload": provider,
        })
        parsed = None; error = None
        try:
            need(status == 200 and failure is None and choice.get("finish_reason") == "stop", "provider")
            parsed = expansion(choice.get("message", {}).get("content"), packet["query"]); valid += 1
        except (ValueError, TypeError, json.JSONDecodeError) as exception:
            error = str(exception)[:200]
        save(f"EXPANSION-{sequence:03d}.json", {
            "schema_version": "are.g01-r55-expansion/v1", "sequence": sequence, "id": packet["id"],
            "cohort": packet["cohort"], "case_id": packet["case_id"], "repo": packet["repo"],
            "query_sha256": packet["query_sha256"], "valid": parsed is not None,
            "error": error, "expansion": parsed,
        })
        print(json.dumps({"phase": "generation", "sequence": sequence, "valid": parsed is not None}), flush=True)
    result = {"schema_version": "are.g01-r55-expansion-run-result/v1", "status": "complete",
              "attempts": PACKETS, "valid_responses": valid, "known_prompt_tokens": prompt_tokens,
              "known_completion_tokens": completion_tokens, "summed_elapsed_ms": elapsed_sum,
              "packets_sha256": freeze["packets_sha256"]}
    save("RUN-RESULT.json", result); print(json.dumps(result, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
