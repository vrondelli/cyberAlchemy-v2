#!/usr/bin/env python3
"""Fail-closed staging monitor for the exact KELD + ARE release."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request


SCHEMA = "keld-staging-monitor/v1"
ARE_STATUS_URL = "https://are.keld.studio/are/api/are/status"
DEFAULT_HTTP_CHECKS = (
    (
        "storefront",
        "https://staging.keld.studio/",
        "GET",
        200,
        b"Keld is an independent studio making agent gear.",
    ),
    (
        "issuer-discovery",
        "https://auth.staging.keld.studio/realms/keld/.well-known/openid-configuration",
        "GET",
        200,
        b'"issuer":"https://auth.staging.keld.studio/realms/keld"',
    ),
    (
        "are",
        "https://are.keld.studio/",
        "GET",
        200,
        b"<title>A.R.E. \xe2\x80\x94 Agent Reasoning Engine</title>",
    ),
    ("storefront-are-isolation", "https://staging.keld.studio/are/", "GET", 404, None),
    ("are-legacy-page", "https://are.keld.studio/are/", "GET", 308, None),
    ("private-readiness", "https://staging.keld.studio/readyz", "GET", 404, None),
    (
        "dynamic-client-registration",
        "https://auth.staging.keld.studio/realms/keld/clients-registrations/openid-connect",
        "POST",
        404,
        None,
    ),
)
ALLOWED_HTTP_HOSTS = frozenset(
    {
        "are.keld.studio",
        "auth.staging.keld.studio",
        "staging.keld.studio",
    }
)


class MonitorError(RuntimeError):
    pass


class RejectRedirects(urllib.request.HTTPRedirectHandler):
    """Turn redirects into HTTP errors so probes cannot leave the allowlist."""

    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        return None


HTTPS_OPENER = urllib.request.build_opener(RejectRedirects())


def open_https(request: urllib.request.Request, timeout: int):
    """Open one allowlisted HTTPS request without following redirects."""

    parsed = urllib.parse.urlsplit(request.full_url)
    try:
        port = parsed.port
    except ValueError as error:
        raise MonitorError("http:destination-invalid") from error
    if (
        parsed.scheme != "https"
        or parsed.hostname not in ALLOWED_HTTP_HOSTS
        or parsed.username is not None
        or parsed.password is not None
        or port is not None
        or parsed.fragment
    ):
        raise MonitorError("http:destination-invalid")
    return HTTPS_OPENER.open(request, timeout=timeout)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def newest_manifest(directory: Path) -> Path:
    if not directory.is_absolute() or not directory.is_dir() or directory.is_symlink():
        raise MonitorError(f"invalid manifest directory: {directory}")
    candidates = [path for path in directory.glob("*.json") if path.is_file() and not path.is_symlink()]
    if not candidates:
        raise MonitorError("no release manifest available")
    return max(candidates, key=lambda path: (path.stat().st_mtime_ns, path.name))


def verify_release(tool: Path, manifest: Path) -> dict:
    if not tool.is_file() or tool.is_symlink():
        raise MonitorError(f"invalid release verifier: {tool}")
    result = subprocess.run(
        [sys.executable, str(tool), "verify", str(manifest)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=75,
    )
    if result.returncode != 0:
        reason = result.stderr.strip().splitlines()[-1] if result.stderr.strip() else "verification-failed"
        raise MonitorError(f"release-manifest:{reason[:200]}")
    try:
        receipt = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise MonitorError("release-manifest:invalid-receipt") from error
    if receipt.get("ok") is not True or receipt.get("action") != "verify":
        raise MonitorError("release-manifest:rejected-receipt")
    return {"manifest": str(manifest), "sha256": receipt.get("sha256")}


def verify_quote(tool: Path, config: Path) -> dict:
    if not tool.is_file() or tool.is_symlink():
        raise MonitorError(f"invalid quote verifier: {tool}")
    if not config.is_file() or config.is_symlink():
        raise MonitorError(f"invalid quote config: {config}")
    result = subprocess.run(
        [sys.executable, str(tool), str(config), "--status"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=10,
    )
    try:
        receipt = json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise MonitorError("quote:invalid-receipt") from error
    if result.returncode != 0 or receipt.get("ok") is not True:
        raise MonitorError("quote:expired-or-invalid")
    if receipt.get("refreshRequired") is not False:
        raise MonitorError("quote:refresh-required")
    reference = receipt.get("reference")
    fixed = receipt.get("fixed") is True
    expires_at = receipt.get("expiresAt")
    seconds_remaining = receipt.get("secondsRemaining")
    if (
        not isinstance(reference, str)
        or not 1 <= len(reference) <= 256
        or (fixed and (expires_at is not None or seconds_remaining is not None))
        or (not fixed and (type(expires_at) is not int or type(seconds_remaining) is not int or seconds_remaining < 86400))
    ):
        raise MonitorError("quote:invalid-receipt")
    return {
        "reference": reference,
        "fixed": fixed,
        "expiresAt": expires_at,
        "secondsRemaining": seconds_remaining,
        "refreshRequired": False,
    }


def probe_http(name: str, url: str, method: str, expected: int, required_content: bytes | None) -> dict:
    data = b"{}" if method == "POST" else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "User-Agent": "keld-staging-monitor/1",
            "Content-Type": "application/json",
            "X-Forwarded-Client-Cert": "monitor-spoof-sentinel",
        },
    )
    body = b""
    try:
        with open_https(request, timeout=10) as response:
            actual = response.status
            body = response.read(64 * 1024)
    except urllib.error.HTTPError as error:
        actual = error.code
        error.close()
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise MonitorError(f"http:{name}:unreachable:{type(error).__name__}") from error
    if actual != expected:
        raise MonitorError(f"http:{name}:expected-{expected}:actual-{actual}")
    if required_content is not None and required_content not in body:
        raise MonitorError(f"http:{name}:required-content-missing")
    return {
        "name": name,
        "method": method,
        "url": url,
        "expected": expected,
        "actual": actual,
        "contentMatched": required_content is None or required_content in body,
    }


def probe_are_status(expected_retention_seconds: int) -> dict:
    if not 1 <= expected_retention_seconds <= 7 * 24 * 60 * 60:
        raise MonitorError("are-status:expected-retention-invalid")
    request = urllib.request.Request(
        ARE_STATUS_URL,
        method="GET",
        headers={"User-Agent": "keld-staging-monitor/1", "Accept": "application/json"},
    )
    try:
        with open_https(request, timeout=10) as response:
            status = response.status
            body = response.read(64 * 1024)
    except urllib.error.HTTPError as error:
        raise MonitorError(f"are-status:http-{error.code}") from error
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise MonitorError(f"are-status:unreachable:{type(error).__name__}") from error
    if status != 200:
        raise MonitorError(f"are-status:http-{status}")
    try:
        value = json.loads(body)
    except (UnicodeError, json.JSONDecodeError) as error:
        raise MonitorError("are-status:invalid-json") from error
    expected = {
        "configured": True,
        "mode": "live",
        "scope": "conversation-only",
        "persistence": "process-memory",
        "idle_retention_seconds": expected_retention_seconds,
        "available": True,
        "availability_reason": None,
    }
    if not isinstance(value, dict) or any(value.get(key) != item for key, item in expected.items()):
        raise MonitorError("are-status:not-available-or-policy-drift")
    model = value.get("model")
    if not isinstance(model, str) or not 1 <= len(model) <= 128:
        raise MonitorError("are-status:model-invalid")
    return {
        "url": ARE_STATUS_URL,
        "actual": status,
        "configured": True,
        "available": True,
        "mode": "live",
        "scope": "conversation-only",
        "persistence": "process-memory",
        "idleRetentionSeconds": expected_retention_seconds,
        "modelConfigured": True,
        "modelInvoked": False,
    }


def collect_state(
    manifest_dir: Path,
    manifest_tool: Path,
    quote_tool: Path,
    quote_config: Path,
    expected_are_retention_seconds: int,
) -> tuple[dict, int]:
    failures = []
    checks = []
    release = None
    quote = None
    are_status = None
    try:
        release = verify_release(manifest_tool, newest_manifest(manifest_dir))
    except MonitorError as error:
        failures.append(str(error))
    try:
        quote = verify_quote(quote_tool, quote_config)
    except MonitorError as error:
        failures.append(str(error))
    for check in DEFAULT_HTTP_CHECKS:
        try:
            checks.append(probe_http(*check))
        except MonitorError as error:
            failures.append(str(error))
    try:
        are_status = probe_are_status(expected_are_retention_seconds)
    except MonitorError as error:
        failures.append(str(error))
    state = {
        "schema": SCHEMA,
        "observedAt": utc_now(),
        "healthy": not failures,
        "release": release,
        "quoteBrl": quote,
        "areStatus": are_status,
        "http": checks,
        "failures": failures,
    }
    return state, 0 if state["healthy"] else 1


def write_state(path: Path, state: dict) -> None:
    if not path.is_absolute() or not path.parent.is_dir() or path.parent.is_symlink():
        raise MonitorError(f"invalid monitor state path: {path}")
    if path.is_symlink():
        raise MonitorError(f"refusing monitor state symlink: {path}")
    encoded = (json.dumps(state, indent=2, sort_keys=True) + "\n").encode()
    descriptor, partial_name = tempfile.mkstemp(prefix=f".{path.name}.partial.", dir=path.parent)
    partial = Path(partial_name)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "wb") as target:
            target.write(encoded)
            target.flush()
            os.fsync(target.fileno())
        os.replace(partial, path)
    except BaseException:
        partial.unlink(missing_ok=True)
        raise


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest-dir", type=Path, required=True)
    parser.add_argument("--manifest-tool", type=Path, required=True)
    parser.add_argument("--quote-tool", type=Path, required=True)
    parser.add_argument("--quote-config", type=Path, required=True)
    parser.add_argument("--expected-are-retention-seconds", type=int, required=True)
    parser.add_argument("--state-file", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        state, result = collect_state(
            args.manifest_dir,
            args.manifest_tool,
            args.quote_tool,
            args.quote_config,
            args.expected_are_retention_seconds,
        )
        write_state(args.state_file, state)
        print(json.dumps(state, separators=(",", ":")))
        return result
    except (MonitorError, OSError, subprocess.SubprocessError, json.JSONDecodeError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
