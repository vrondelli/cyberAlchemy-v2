"""Dedicated process bridge for one bounded local secret consumption.

The request is JSON on stdin. On success stdout contains only the exact secret
bytes. All failures are silent and non-zero so callers cannot accidentally
serialize store details, logical names, or material into normal receipts.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from .store import SopsAgeStore, _clear


SCHEMA_VERSION = "secret-management.process-bridge-request/v1"
MAX_REQUEST_BYTES = 16 * 1024
REQUEST_KEYS = frozenset(
    {
        "consumer_id",
        "key_file",
        "locator",
        "request_digest",
        "schema_version",
        "timeout_seconds",
        "vault_file",
    }
)


def _request() -> dict[str, Any]:
    raw = sys.stdin.buffer.read(MAX_REQUEST_BYTES + 1)
    if not raw or len(raw) > MAX_REQUEST_BYTES:
        raise ValueError("invalid request")
    value = json.loads(raw)
    if type(value) is not dict or set(value) != REQUEST_KEYS:
        raise ValueError("invalid request")
    if value["schema_version"] != SCHEMA_VERSION:
        raise ValueError("invalid request")
    for key in ("consumer_id", "locator", "request_digest"):
        if type(value[key]) is not str or not value[key]:
            raise ValueError("invalid request")
    for key in ("key_file", "vault_file"):
        if value[key] is not None and (type(value[key]) is not str or not value[key]):
            raise ValueError("invalid request")
    timeout = value["timeout_seconds"]
    if type(timeout) is not int or timeout < 1 or timeout > 300:
        raise ValueError("invalid request")
    return value


def main() -> int:
    material = bytearray()
    try:
        request = _request()
        options: dict[str, object] = {"timeout_seconds": request["timeout_seconds"]}
        if request["key_file"] is not None:
            options["key_file"] = Path(request["key_file"])
        if request["vault_file"] is not None:
            options["vault_file"] = Path(request["vault_file"])
        store = SopsAgeStore(**options)

        def capture(view: memoryview) -> None:
            material.extend(view)

        store.consume(
            request["locator"],
            capture,
            consumer_id=request["consumer_id"],
            request_digest=request["request_digest"],
        )
        sys.stdout.buffer.write(material)
        sys.stdout.buffer.flush()
        return 0
    except BaseException:
        return 1
    finally:
        _clear(material)


if __name__ == "__main__":
    raise SystemExit(main())
