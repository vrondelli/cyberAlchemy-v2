#!/usr/bin/env python3
"""Minimal causal replay of AUTH-TRANSFER-PIPELINE-COPY-001."""

import hashlib
import json
from pathlib import Path
import shutil
import socket
import tempfile


def inventory(root: Path, ignored: set[str]):
    return [
        {"path": str(path.relative_to(root)), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
        for path in sorted(root.rglob("*"))
        if path.is_file() and not ignored.intersection(path.relative_to(root).parts)
    ]


with tempfile.TemporaryDirectory(prefix="auth-copy-counterexample-") as raw:
    base = Path(raw)
    source = base / "implementation"
    source.mkdir()
    (source / "source.rs").write_text("fn main() {}\n")
    runtime = source / "unrelated-auth" / ".runtime"
    runtime.mkdir(parents=True)
    sock = socket.socket(socket.AF_UNIX)
    sock.bind(str(runtime / "process.sock"))
    old_error = None
    try:
        shutil.copytree(source, base / "old-copy", ignore=shutil.ignore_patterns("target", "__pycache__"))
    except shutil.Error as error:
        old_error = str(error)
    repaired_ignored = {"target", "__pycache__", ".runtime"}
    shutil.copytree(source, base / "repaired-copy", ignore=shutil.ignore_patterns(*sorted(repaired_ignored)))
    original_inventory = inventory(source, repaired_ignored)
    copied_inventory = inventory(base / "repaired-copy", repaired_ignored)
    result = {
        "schema_version": "auth-copy-boundary-causal-replay/v1",
        "old_boundary_raised_shutil_error": old_error is not None,
        "old_error_mentions_runtime_socket": old_error is not None and ".runtime" in old_error and "process.sock" in old_error,
        "repaired_boundary_copied": (base / "repaired-copy/source.rs").is_file(),
        "repaired_boundary_excluded_runtime": not (base / "repaired-copy/unrelated-auth/.runtime").exists(),
        "shared_inventory_equal": original_inventory == copied_inventory,
        "source_inventory": original_inventory,
        "authority_effect": "none",
        "claim_ceiling": "Causal replay of the copy-boundary mechanism only; not an Auth product counterexample.",
    }
    result["status"] = "pass" if all(result[key] for key in (
        "old_boundary_raised_shutil_error", "old_error_mentions_runtime_socket",
        "repaired_boundary_copied", "repaired_boundary_excluded_runtime", "shared_inventory_equal"
    )) else "non-pass"
    print(json.dumps(result, indent=2, sort_keys=True))
    sock.close()
    raise SystemExit(0 if result["status"] == "pass" else 1)
