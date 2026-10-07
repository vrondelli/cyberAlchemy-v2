#!/usr/bin/env python3
"""Send a bounded secret-free healthy-state heartbeat to an external HTTPS receiver."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


SCHEMA = "keld-staging-heartbeat/v1"
MONITOR_SCHEMA = "keld-staging-monitor/v1"
SHA256 = re.compile(r"[0-9a-f]{64}")


class HeartbeatError(RuntimeError):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        raise urllib.error.HTTPError(request.full_url, code, message, headers, file_pointer)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_url(path: Path) -> str:
    if not path.is_file() or path.is_symlink() or path.stat().st_size > 4096:
        raise HeartbeatError("heartbeat-url-credential-invalid")
    value = path.read_text(encoding="utf-8").strip()
    parsed = urllib.parse.urlsplit(value)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.fragment
    ):
        raise HeartbeatError("heartbeat-url-https-required")
    return value


def load_payload(path: Path) -> dict:
    if not path.is_file() or path.is_symlink() or path.stat().st_size > 64 * 1024:
        raise HeartbeatError("monitor-state-invalid")
    try:
        state = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise HeartbeatError("monitor-state-invalid") from error
    release = state.get("release") or {}
    quote = state.get("quoteBrl") or {}
    digest = release.get("sha256")
    if (
        state.get("schema") != MONITOR_SCHEMA
        or state.get("healthy") is not True
        or state.get("failures") != []
        or not isinstance(state.get("observedAt"), str)
        or not isinstance(digest, str)
        or SHA256.fullmatch(digest) is None
        or type(quote.get("expiresAt")) is not int
        or quote.get("refreshRequired") is not False
    ):
        raise HeartbeatError("monitor-state-not-healthy")
    return {
        "schema": SCHEMA,
        "sentAt": utc_now(),
        "monitorObservedAt": state["observedAt"],
        "healthy": True,
        "releaseSha256": digest,
        "quoteExpiresAt": quote["expiresAt"],
    }


def send(url: str, payload: dict) -> int:
    encoded = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    request = urllib.request.Request(
        url,
        data=encoded,
        method="POST",
        headers={"Content-Type": "application/json", "User-Agent": "keld-staging-heartbeat/1"},
    )
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(request, timeout=10) as response:
            status = response.status
            response.read(1024)
    except urllib.error.HTTPError as error:
        raise HeartbeatError(f"heartbeat-delivery-http-{error.code}") from error
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise HeartbeatError("heartbeat-delivery-unreachable") from error
    if not 200 <= status < 300:
        raise HeartbeatError(f"heartbeat-delivery-http-{status}")
    return status


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url-credential", type=Path, required=True)
    parser.add_argument("--state-file", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        status = send(load_url(args.url_credential), load_payload(args.state_file))
        print(json.dumps({"ok": True, "status": status}, separators=(",", ":")))
        return 0
    except (HeartbeatError, OSError, UnicodeError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
