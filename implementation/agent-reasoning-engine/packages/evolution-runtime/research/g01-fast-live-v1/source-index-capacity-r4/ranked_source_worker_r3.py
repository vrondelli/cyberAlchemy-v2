"""Isolated, one-shot pinned-source index/query worker.

No model calls. Parent bounds wall time, output and process-group settlement.
Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import selectors
import signal
import subprocess
import sys
import time
import threading

ADDRESS_BYTES = 1536 * 1024**2
OUTPUT_BYTES = 128 * 1024**2
FAILURE_RESERVE = 64 * 1024


def limits_for_inventory(entry_count):
    """Choose only from bounded source-size tiers; never inspect query or gold."""
    from ranked_source_hints_r4 import Limits
    if not isinstance(entry_count, int) or not 0 <= entry_count <= 50000:
        raise ValueError("inventory-entry-limit")
    if entry_count > 10000:
        return Limits(admitted_bytes=64 * 1024**2, postings=2000000)
    return Limits()


def _worker():
    resource.setrlimit(resource.RLIMIT_AS, (ADDRESS_BYTES, ADDRESS_BYTES))
    if resource.getrlimit(resource.RLIMIT_AS) != (ADDRESS_BYTES, ADDRESS_BYTES):
        raise RuntimeError("address-space-limit-not-applied")
    from ranked_source_hints_r4 import SourceHintIndex, Blob, encoded
    raw = sys.stdin.buffer.read(65537)
    if len(raw) > 65536:
        raise ValueError("input-limit")
    request = json.loads(raw)
    if set(request) != {"repository", "base_commit", "query"}:
        raise ValueError("request-fields")
    repo = Path(request["repository"])
    base = request["base_commit"]
    if not repo.is_absolute() or repo.resolve() != repo or not repo.is_dir():
        raise ValueError("repository-path")
    if not isinstance(base, str) or not re.fullmatch(r"[a-f0-9]{40}", base):
        raise ValueError("base-commit")
    query = request["query"]
    if not isinstance(query, str) or len(query.encode("utf-8")) > 4096:
        raise ValueError("query-limit")
    env = dict(os.environ, GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL="/dev/null",
               GIT_NO_LAZY_FETCH="1", GIT_ALLOW_PROTOCOL="", GIT_TERMINAL_PROMPT="0")

    def git(args, maximum):
        child = subprocess.Popen(["git", "--no-optional-locks", "-c", "core.hooksPath=/dev/null",
                                  "-c", "core.fsmonitor=false", "-c", f"safe.directory={repo}", "-C", str(repo), *args],
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
        try:
            value = child.stdout.read(maximum + 1)
            if len(value) > maximum:
                raise ValueError("git-output-limit")
            error = child.stderr.read(4097)
            if len(error) > 4096:
                raise ValueError("git-stderr-limit")
            if child.wait(timeout=5) != 0:
                raise ValueError("git-command-failed")
            return value
        finally:
            if child.poll() is None:
                child.kill()
            child.wait()
            child.stdout.close()
            child.stderr.close()

    if git(["rev-parse", "--verify", base + "^{commit}"], 128).decode().strip() != base:
        raise ValueError("base-identity")
    inventory = git(["ls-tree", "-rlz", base], 8 * 1024**2)
    rows = []
    for row in inventory.split(b"\0"):
        if not row:
            continue
        head, path = row.split(b"\t", 1)
        mode, kind, oid, size = head.split()
        if not re.fullmatch(rb"[a-f0-9]{40}", oid):
            raise ValueError("object-identity")
        length = int(size) if kind == b"blob" else 0
        rows.append((path, mode.decode("ascii"), oid.decode("ascii"), length))
        if len(rows) > 50000:
            raise ValueError("inventory-entry-limit")
    rows.sort(key=lambda row: row[0])
    records = (Blob(path, mode, size, lambda oid=oid, size=size: git(["cat-file", "blob", oid], size))
               for path, mode, oid, size in rows)
    selected_limits = limits_for_inventory(len(rows))
    index = SourceHintIndex(records, base, selected_limits, query_terms=query)
    result = {"schema": "are.ranked-source-worker/v1", "ok": True,
              "base_commit": base, "index_digest": index.index_digest,
              "inventory_sha256": hashlib.sha256(inventory).hexdigest(),
              "manifest": index.manifest, "query_result": index.query(query),
              "index_limits": vars(selected_limits),
              "limits": {"address_space_bytes": ADDRESS_BYTES, "inventory_bytes": 8 * 1024**2},
              "runtime": {"python": sys.version, "executable": sys.executable},
              "max_rss_kib": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
              "model_calls": 0}
    wire = encoded(result)
    if len(wire) > OUTPUT_BYTES - FAILURE_RESERVE:
        raise ValueError("worker-output-limit")
    sys.stdout.buffer.write(wire)


def _run_index(request, *, deadline_seconds=60, maximum_output=OUTPUT_BYTES - FAILURE_RESERVE,
               worker=None, cancelled=lambda: False):
    """Lower test bounds allowed; production cannot expand the registered envelope."""
    if not 0 < deadline_seconds <= 60 or not 1 <= maximum_output <= OUTPUT_BYTES - FAILURE_RESERVE:
        raise ValueError("supervision-limits")
    data = json.dumps(request, ensure_ascii=False).encode()
    if len(data) > 65536:
        raise ValueError("input-limit")
    command = [sys.executable, "-B", str(Path(__file__).resolve()), "--worker"] if worker is None else worker
    started = time.monotonic()
    child = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE, start_new_session=True)
    chunks, errors, reason, forced = [], bytearray(), None, False
    total = 0
    selector = selectors.DefaultSelector()
    try:
        os.set_blocking(child.stdin.fileno(), False)
        selector.register(child.stdin, selectors.EVENT_WRITE)
        written = 0
        for stream in (child.stdout, child.stderr):
            os.set_blocking(stream.fileno(), False)
            selector.register(stream, selectors.EVENT_READ)
        while selector.get_map():
            if cancelled():
                raise InterruptedError("worker-cancelled")
            remaining = deadline_seconds - (time.monotonic() - started)
            if remaining <= 0:
                raise TimeoutError("worker-deadline")
            for key, _ in selector.select(min(remaining, 0.1)):
                if key.fileobj is child.stdin:
                    written += os.write(child.stdin.fileno(), data[written:])
                    if written == len(data):
                        selector.unregister(child.stdin)
                        child.stdin.close()
                    continue
                chunk = os.read(key.fileobj.fileno(), 65536)
                if not chunk:
                    selector.unregister(key.fileobj)
                elif key.fileobj is child.stdout:
                    total += len(chunk)
                    if total > maximum_output:
                        raise ValueError("worker-output-limit")
                    chunks.append(chunk)
                else:
                    errors.extend(chunk)
                    if len(errors) > FAILURE_RESERVE:
                        raise ValueError("worker-stderr-limit")
        while child.poll() is None:
            if cancelled():
                raise InterruptedError("worker-cancelled")
            if time.monotonic() - started >= deadline_seconds:
                raise TimeoutError("worker-deadline")
            time.sleep(0.01)
        if child.returncode != 0:
            reason = "worker-exit-" + str(child.returncode)
    except (OSError, ValueError, TimeoutError, subprocess.TimeoutExpired) as error:
        reason = str(error)
    finally:
        selector.close()
        try:
            os.killpg(child.pid, 0)
        except ProcessLookupError:
            pass
        else:
            # Also settle descendants retaining pipes after the worker exits.
            try:
                os.killpg(child.pid, signal.SIGKILL)
                forced = True
            except ProcessLookupError:
                pass
        child.wait()
        child.stdout.close()
        child.stderr.close()
        if not child.stdin.closed:
            child.stdin.close()
    try:
        os.killpg(child.pid, 0)
        absent = False
    except ProcessLookupError:
        absent = True
    value = None
    if cancelled():
        reason = "worker-cancelled"
    if reason is None:
        try:
            value = json.loads(b"".join(chunks))
            if value.get("schema") != "are.ranked-source-worker/v1" or value.get("ok") is not True:
                reason = "worker-result-invalid"
        except (ValueError, AttributeError):
            reason = "worker-json-invalid"
    return {"ok": reason is None and absent and not forced, "error": reason,
            "result": value, "stdout_bytes": total, "stderr_bytes": len(errors),
            "settlement": {"child_pid": child.pid, "exit_code": child.returncode,
                           "process_group_absent": absent, "forced": forced},
            "elapsed_seconds": time.monotonic() - started}


def run_index(request, *, deadline_seconds=60, maximum_output=OUTPUT_BYTES - FAILURE_RESERVE,
              worker=None, cancelled=None):
    """Scope signal handlers to the supervised call; restore caller handlers."""
    if threading.current_thread() is not threading.main_thread():
        raise ValueError("worker-supervisor-main-thread-required")
    if cancelled is not None and not callable(cancelled):
        raise ValueError("worker-cancellation-callback")
    received = []
    previous = {sig: signal.getsignal(sig) for sig in (signal.SIGTERM, signal.SIGINT)}
    def handle(signum, frame):
        received.append(signum)
    def is_cancelled():
        return bool(received) or (cancelled is not None and bool(cancelled()))
    try:
        for sig in previous:
            signal.signal(sig, handle)
        result = _run_index(request, deadline_seconds=deadline_seconds,
                            maximum_output=maximum_output, worker=worker,
                            cancelled=is_cancelled)
        result["cancel_signal"] = received[0] if received else None
        return result
    finally:
        for sig, handler in previous.items():
            signal.signal(sig, handler)


if __name__ == "__main__":
    if sys.argv[1:] == ["--worker"]:
        try:
            _worker()
        except Exception as error:
            # Fixed small error remains available; parent owns durable failure evidence.
            sys.stderr.write(type(error).__name__ + ": " + str(error)[:1024] + "\n")
            sys.exit(2)
    else:
        raise SystemExit("Use run_index from the supervised caller")
