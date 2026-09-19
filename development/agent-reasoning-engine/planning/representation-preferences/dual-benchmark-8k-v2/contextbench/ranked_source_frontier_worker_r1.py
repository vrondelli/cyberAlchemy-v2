"""One-shot, multi-facet source index worker. No model calls.

Build the pinned repository index once, then evaluate up to eight independent
label-blind queries. Open questions: RECENT-EVIDENCE-POSTRUN-R1.md.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import resource
import subprocess
import sys

from ranked_source_hints_r3 import Blob, encoded
from ranked_source_frontier_hints_r1 import FrontierSourceHintIndex

ADDRESS_BYTES = 512 * 1024**2
OUTPUT_BYTES = 128 * 1024**2


def main():
    resource.setrlimit(resource.RLIMIT_AS, (ADDRESS_BYTES, ADDRESS_BYTES))
    if resource.getrlimit(resource.RLIMIT_AS) != (ADDRESS_BYTES, ADDRESS_BYTES):
        raise RuntimeError("address-space-limit-not-applied")
    raw = sys.stdin.buffer.read(65537)
    if len(raw) > 65536:
        raise ValueError("input-limit")
    request = json.loads(raw)
    if set(request) != {"repository", "base_commit", "queries"}:
        raise ValueError("request-fields")
    repo = Path(request["repository"])
    base = request["base_commit"]
    queries = request["queries"]
    if not repo.is_absolute() or repo.resolve() != repo or not repo.is_dir():
        raise ValueError("repository-path")
    if not isinstance(base, str) or not re.fullmatch(r"[a-f0-9]{40}", base):
        raise ValueError("base-commit")
    if (not isinstance(queries, dict) or not 1 <= len(queries) <= 8
            or any(not isinstance(key, str) or not key or len(key) > 64
                   or not isinstance(query, str) or len(query.encode("utf-8")) > 4096
                   for key, query in queries.items())):
        raise ValueError("query-envelope")
    env = dict(os.environ, GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL="/dev/null",
               GIT_NO_LAZY_FETCH="1", GIT_ALLOW_PROTOCOL="", GIT_TERMINAL_PROMPT="0")

    def git(args, maximum):
        child = subprocess.Popen(["git", "--no-optional-locks", "-c", "core.hooksPath=/dev/null",
                                  "-c", "core.fsmonitor=false", "-C", str(repo), *args],
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
        try:
            value = child.stdout.read(maximum + 1)
            if len(value) > maximum:
                raise ValueError("git-output-limit")
            error = child.stderr.read(4097)
            if len(error) > 4096:
                raise ValueError("git-stderr-limit")
            if child.wait(timeout=5) != 0:
                raise ValueError("git-command-failed:" + args[0])
            return value
        finally:
            if child.poll() is None:
                child.kill()
            child.wait()
            child.stdout.close()
            child.stderr.close()

    if git(["rev-parse", "--verify", base + "^{commit}"], 128).decode().strip() != base:
        raise ValueError("base-identity")
    top = Path(git(["rev-parse", "--show-toplevel"], 4096).decode().strip())
    if top.resolve() != repo:
        raise ValueError("worktree-root-required")
    inventory = git(["ls-tree", "-rlz", base], 8 * 1024**2)
    rows = []
    for row in inventory.split(b"\0"):
        if not row:
            continue
        head, path = row.split(b"\t", 1)
        mode, kind, oid, size = head.split()
        if not re.fullmatch(rb"[a-f0-9]{40}", oid):
            raise ValueError("object-identity")
        rows.append((path, mode.decode("ascii"), oid.decode("ascii"),
                     int(size) if kind == b"blob" else 0))
        if len(rows) > 10000:
            raise ValueError("inventory-entry-limit")
    rows.sort(key=lambda row: row[0])
    # Read the exact objects named by the pinned tree. Worktree cleanliness is
    # insufficient: assume-unchanged can hide substitutions and checkout
    # filters can normalize bytes (for example CRLF). One batch process keeps
    # this bounded without spawning a process for every admitted blob.
    batch = subprocess.Popen(
        ["git", "--no-optional-locks", "-c", "core.hooksPath=/dev/null",
         "-c", "core.fsmonitor=false", "-C", str(repo), "cat-file", "--batch"],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        env=env,
    )

    def read_exact(stream, size):
        chunks, remaining = [], size
        while remaining:
            chunk = stream.read(remaining)
            if not chunk:
                raise ValueError("object-truncated")
            chunks.append(chunk)
            remaining -= len(chunk)
        return b"".join(chunks)

    def load(oid, expected_size):
        batch.stdin.write(oid.encode("ascii") + b"\n")
        batch.stdin.flush()
        header = batch.stdout.readline(256)
        fields = header.rstrip(b"\n").split()
        if (len(fields) != 3 or fields[0].decode("ascii") != oid
                or fields[1] != b"blob" or int(fields[2]) != expected_size):
            raise ValueError("object-header-identity")
        data = read_exact(batch.stdout, expected_size)
        if batch.stdout.read(1) != b"\n":
            raise ValueError("object-delimiter")
        return data

    def blobs():
        for path, mode, oid, object_size in rows:
            yield Blob(path, mode, object_size,
                       lambda oid=oid, size=object_size: load(oid, size))

    try:
        index = FrontierSourceHintIndex(blobs(), base)
    finally:
        batch.stdin.close()
        if batch.wait(timeout=5) != 0:
            raise ValueError("cat-file-failed")
        batch.stdout.close()
    result = {"schema": "are.ranked-source-frontier-worker/v1", "ok": True,
              "base_commit": base, "index_digest": index.index_digest,
              "inventory_sha256": hashlib.sha256(inventory).hexdigest(),
              "manifest": index.manifest,
              "query_results": {key: index.query(query, maximum_hints=10)
                                for key, query in queries.items()},
              "runtime": {"python": sys.version, "executable": sys.executable},
              "max_rss_kib": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
              "post_verification_required": True, "model_calls": 0}
    wire = encoded(result)
    if len(wire) > OUTPUT_BYTES:
        raise ValueError("worker-output-limit")
    sys.stdout.buffer.write(wire)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        sys.stderr.write(type(error).__name__ + ": " + str(error)[:1024] + "\n")
        raise SystemExit(2)
