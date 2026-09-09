#!/usr/bin/env python3
"""Send one schema-constrained agent request to a local OpenAI-compatible API."""

from __future__ import annotations

import argparse
import copy
import fcntl
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jsonschema import ValidationError, validate


ROOT = Path(__file__).resolve().parent
CONTRACT_ALIASES = {
    "extractor": "micro_extractor",
    "micro_extractor": "micro_extractor",
    "reducer": "angle_reducer",
    "angle_reducer": "angle_reducer",
    "synthesizer": "dataset_synthesizer",
    "dataset_synthesizer": "dataset_synthesizer",
    "judge": "judge",
}
SCHEMA_FILES = {
    "micro_extractor": "extractor.schema.json",
    "angle_reducer": "reducer.schema.json",
    "dataset_synthesizer": "synthesizer.schema.json",
    "judge": "judge.schema.json",
}
OUTPUT_LIMIT_ENV = {
    "micro_extractor": "MAX_OUTPUT_TOKENS_EXTRACTOR",
    "angle_reducer": "MAX_OUTPUT_TOKENS_REDUCER",
    "dataset_synthesizer": "MAX_OUTPUT_TOKENS_SYNTHESIZER",
    "judge": "MAX_OUTPUT_TOKENS_JUDGE",
}
OUTPUT_LIMIT_DEFAULT = {
    "micro_extractor": 3600,
    "angle_reducer": 6000,
    "dataset_synthesizer": 5000,
    "judge": 4096,
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def configured_api_bases() -> list[str]:
    multi = os.getenv("API_BASES")
    if multi is None:
        return [os.getenv("API_BASE", "http://127.0.0.1:8000/v1").rstrip("/")]
    parts = [part.strip() for part in multi.split(",")]
    if not parts or any(not part for part in parts):
        raise ValueError("API_BASES must contain only non-empty comma-separated endpoints")
    return [part.rstrip("/") for part in parts]


def select_api_base(
    role_id: str,
    api_bases: list[str],
    strategy: str = "stable-hash",
    counter_file: Path | None = None,
) -> str:
    if not api_bases:
        raise ValueError("at least one API endpoint is required")
    if strategy == "stable-hash":
        stable_value = int.from_bytes(hashlib.sha256(role_id.encode("utf-8")).digest(), "big")
        return api_bases[stable_value % len(api_bases)].rstrip("/")
    if strategy != "round-robin":
        raise ValueError(f"unsupported API_BASE_STRATEGY: {strategy}")
    if counter_file is None:
        raise ValueError("round-robin selection requires a counter file")
    counter_file.parent.mkdir(parents=True, exist_ok=True)
    with counter_file.open("a+", encoding="utf-8") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            handle.seek(0)
            raw = handle.read().strip()
            try:
                counter = int(raw) if raw else 0
            except ValueError as error:
                raise ValueError(f"API base counter is not an integer: {counter_file}") from error
            if counter < 0:
                raise ValueError(f"API base counter cannot be negative: {counter_file}")
            selected = api_bases[counter % len(api_bases)].rstrip("/")
            handle.seek(0)
            handle.truncate()
            handle.write(f"{counter + 1}\n")
            handle.flush()
            os.fsync(handle.fileno())
            return selected
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def resolve_api_base(role_id: str, explicit_api_base: str | None) -> tuple[str, str]:
    if explicit_api_base is not None:
        return explicit_api_base.rstrip("/"), "explicit"
    api_bases = configured_api_bases()
    if os.getenv("API_BASES") is None:
        return api_bases[0], "single"
    strategy = os.getenv("API_BASE_STRATEGY", "round-robin").strip()
    counter_file = None
    if strategy == "round-robin":
        counter_text = os.getenv(
            "API_BASE_COUNTER_FILE",
            f"/tmp/cav2-structured-agent-api-base-{os.getuid()}.counter",
        ).strip()
        if not counter_text:
            raise ValueError("API_BASE_COUNTER_FILE cannot be empty")
        counter_file = Path(counter_text)
    return select_api_base(role_id, api_bases, strategy, counter_file), strategy


def load_schema(contract: str, role_id: str) -> dict[str, Any]:
    path = ROOT / "schemas" / SCHEMA_FILES[contract]
    schema = json.loads(path.read_text(encoding="utf-8"))
    schema["properties"]["role_id"] = {"type": "string", "const": role_id}
    return schema


def request_payload(contract: str, role_id: str, input_text: str, schema: dict[str, Any]) -> dict[str, Any]:
    model = os.getenv("SERVED_MODEL_NAME", "qwen-27b-microshard")
    max_tokens = int(os.getenv(OUTPUT_LIMIT_ENV[contract], OUTPUT_LIMIT_DEFAULT[contract]))
    schema_name = re.sub(r"[^A-Za-z0-9_-]", "_", f"{contract}_result")
    return {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are one bounded research agent. Fill the supplied JSON schema from the "
                    "input evidence. Preserve exact values, evidence anchors, proof status, conflicts, "
                    "and non-claims. Do not invent missing information."
                ),
            },
            {
                "role": "user",
                "content": f"ROLE_ID: {role_id}\nCONTRACT: {contract}\n\nINPUT:\n{input_text}",
            },
        ],
        "temperature": float(os.getenv("TEMPERATURE", "0")),
        "top_p": float(os.getenv("TOP_P", "1")),
        "max_tokens": max_tokens,
        "seed": int(os.getenv("SEED", "20260901")),
        "reasoning_effort": os.getenv("REASONING_EFFORT", "medium"),
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": schema_name, "strict": True, "schema": copy.deepcopy(schema)},
        },
    }


def post_json(url: str, payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": "Bearer local-experiment"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code}: {body[:2000]}") from error


def write_json(path_text: str, value: Any) -> None:
    encoded = json.dumps(value, indent=2, ensure_ascii=False) + "\n"
    if path_text == "-":
        sys.stdout.write(encoded)
        return
    path = Path(path_text)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(encoded, encoding="utf-8")


def run(args: argparse.Namespace) -> int:
    contract = CONTRACT_ALIASES[args.contract]
    input_bytes = sys.stdin.buffer.read() if args.input == "-" else Path(args.input).read_bytes()
    input_text = input_bytes.decode("utf-8")
    schema = load_schema(contract, args.role_id)
    payload = request_payload(contract, args.role_id, input_text, schema)
    api_base = args.api_base.rstrip("/")
    started_at = utc_now()
    start = time.monotonic()
    response = post_json(
        f"{api_base}/chat/completions",
        payload,
        float(os.getenv("REQUEST_TIMEOUT_SECONDS", "240")),
    )
    choice = response["choices"][0]
    content = choice["message"].get("content", "")
    try:
        result = json.loads(content)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"model returned invalid JSON: {error}") from error
    try:
        validate(instance=result, schema=schema)
    except ValidationError as error:
        raise RuntimeError(f"model output failed schema validation at {list(error.path)}: {error.message}") from error

    write_json(args.output, result)
    if args.output != "-":
        receipt = {
            "schema_version": "cav2.structured-agent-receipt.v1",
            "status": "complete",
            "contract": contract,
            "role_id": args.role_id,
            "started_at": started_at,
            "finished_at": utc_now(),
            "elapsed_ms": round((time.monotonic() - start) * 1000, 3),
            "input_sha256": sha256(input_bytes),
            "schema_sha256": sha256(json.dumps(schema, sort_keys=True).encode("utf-8")),
            "output_sha256": sha256((json.dumps(result, indent=2, ensure_ascii=False) + "\n").encode("utf-8")),
            "finish_reason": choice.get("finish_reason"),
            "usage": response.get("usage", {}),
            "response_id": response.get("id"),
            "model": payload["model"],
            "selected_api_base": api_base,
            "api_base_strategy": args.api_base_strategy,
        }
        write_json(f"{args.output}.receipt.json", receipt)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run one schema-constrained micro-swarm agent against local vLLM."
    )
    parser.add_argument("contract", choices=sorted(CONTRACT_ALIASES))
    parser.add_argument("role_id")
    parser.add_argument("input", help="UTF-8 input file, or - for stdin")
    parser.add_argument("output", nargs="?", default="-", help="JSON output file, or - for stdout")
    parser.add_argument(
        "--api-base",
        default=None,
        help="single endpoint override; otherwise API_BASES, API_BASE, or the localhost default",
    )
    args = parser.parse_args()
    try:
        args.api_base, args.api_base_strategy = resolve_api_base(args.role_id, args.api_base)
        return run(args)
    except Exception as error:
        print(f"structured-agent: {type(error).__name__}: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
