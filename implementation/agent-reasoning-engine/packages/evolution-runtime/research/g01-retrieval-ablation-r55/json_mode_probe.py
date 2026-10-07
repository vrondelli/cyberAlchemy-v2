#!/usr/bin/env python3
"""One-call GLM-5.3-Flash JSON-mode feasibility probe for G01 r55."""

from __future__ import annotations

import hashlib
import json
import os
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path("/opt/are-benchmark-runs/g01-r55-json-mode-probe")
SECRET = Path("/opt/are-keld-presentation/secrets/model_api_key")
URL = "https://api.z.ai/api/paas/v4/chat/completions"
MODEL = "glm-5.3-flash"
PROMPT = (
    "Return one closed JSON object with exactly the key candidate_ids. Its value must be "
    "an array containing one or more distinct integers chosen only from 1, 2, and 3. "
    "Choose the candidate most directly associated with parsing JSON. Candidates: "
    "1 parser.py; 2 image.png; 3 README.md."
)


def stable(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode()


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def save(name: str, value: object) -> None:
    descriptor = os.open(ROOT / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def main() -> None:
    if not ROOT.is_dir() or any(path.name != Path(__file__).name for path in ROOT.iterdir()):
        raise SystemExit("probe root has prior run state")
    key = SECRET.read_text().strip()
    if not 8 <= len(key) <= 8192:
        raise SystemExit("secret invalid")
    body = stable({
        "model": MODEL,
        "messages": [{"role": "user", "content": PROMPT}],
        "stream": False,
        "max_tokens": 128,
        "reasoning_effort": "low",
        "response_format": {"type": "json_object"},
    })
    started = time.monotonic()
    request = Request(URL, data=body, method="POST", headers={
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "ARE-G01-r55-json-probe/1",
    })
    status, raw, failure = None, b"", None
    try:
        with urlopen(request, timeout=120) as response:
            status = response.status
            raw = response.read(262_145)
            if len(raw) > 262_144:
                failure = "response-too-large"
    except HTTPError as error:
        status = error.code
        raw = error.read(65_536)
        failure = "http-error"
    except (URLError, TimeoutError, OSError) as error:
        failure = type(error).__name__
    elapsed = round((time.monotonic() - started) * 1000)
    try:
        provider = json.loads(raw)
    except (ValueError, UnicodeDecodeError):
        provider = None
    content = None
    if isinstance(provider, dict) and provider.get("choices"):
        content = provider["choices"][0].get("message", {}).get("content")
    strict = False
    parsed = None
    try:
        parsed = json.loads(content)
        values = parsed["candidate_ids"]
        strict = (isinstance(parsed, dict) and set(parsed) == {"candidate_ids"}
                  and isinstance(values, list) and bool(values)
                  and all(isinstance(value, int) and not isinstance(value, bool)
                          and value in {1, 2, 3} for value in values)
                  and len(values) == len(set(values)))
    except (TypeError, ValueError, KeyError):
        pass
    receipt = {
        "schema_version": "are.g01-r55-json-mode-probe/v1",
        "model": MODEL,
        "response_format": {"type": "json_object"},
        "prompt_sha256": sha(PROMPT.encode()),
        "request_sha256": sha(body),
        "response_sha256": sha(raw),
        "http_status": status,
        "failure_code": failure,
        "elapsed_ms": elapsed,
        "provider_payload": provider,
        "strict_valid": strict,
        "parsed_candidate_ids": parsed.get("candidate_ids") if strict else None,
        "gold_opened": False,
        "model_calls": 1,
        "script_sha256": sha(Path(__file__).read_bytes()),
    }
    save("PROBE-RECEIPT.json", receipt)
    print(json.dumps({key: value for key, value in receipt.items()
                      if key != "provider_payload"}, sort_keys=True))
    if status != 200 or failure is not None or not strict:
        raise SystemExit("json-mode probe failed")


if __name__ == "__main__":
    main()
