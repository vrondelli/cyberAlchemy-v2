#!/usr/bin/env python3
"""Verify 23 retained VPS exact caches plus one r13 r2 Astropy cache."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

BASE = Path("/opt/are/evolution-runtime")
CANDIDATE = BASE / "g01-r13-clean-cohort-candidate-r2/COHORT-CANDIDATE.json"
PRIOR = BASE / "g01-r13-cache-transfer-r1/VERIFY.json"
NEW = Path("/tmp/are-g01-r13-source-caches-r2/astropy--astropy.git")
WSL = NEW.parent / "SOURCE-CACHES.json"
OUTPUT = BASE / "g01-r13-cache-transfer-r2/VERIFY.json"
PINS = {
    CANDIDATE: "e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d",
    PRIOR: "11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5",
    WSL: "52d6d7b2541c90900b0ef71a959451eaeeae4f8c3a830903b9f6d72d804a3343",
}
REPLACEMENT = "SWE-Bench-Verified__python__maintenance__bugfix__6ed8d38b"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(path, *args):
    env = dict(os.environ, GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL="/dev/null",
               GIT_NO_LAZY_FETCH="1", GIT_TERMINAL_PROMPT="0", GIT_ALLOW_PROTOCOL="")
    result = subprocess.run(["git", f"--git-dir={path}", *args], text=True,
                            capture_output=True, timeout=30, env=env)
    if result.returncode:
        raise ValueError("git-identity:" + str(path))
    return result.stdout.strip()


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir() or NEW.is_symlink() or not NEW.is_dir():
        raise ValueError("output-or-cache-boundary")
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError("pinned-input-drift")
    candidate, prior, wsl = (json.loads(path.read_text()) for path in (CANDIDATE, PRIOR, WSL))
    if (candidate["status"] != "preflight-only-not-frozen" or len(candidate["ordered_tasks"]) != 24 or
            candidate["model_calls"] != 0 or candidate["gold_values_or_paths_used"] is not False or
            prior["status"] != "passed" or len(prior["verified_task_bindings"]) != 24 or
            wsl["status"] != "passed" or wsl["candidate_sha256"] != PINS[CANDIDATE] or
            wsl["verified_tasks"] != 24 or wsl["new_cache_tree"] !=
            "297e87811e2b68fccb5ae5f78cc9765187e737f5"):
        raise ValueError("source-shape")
    old = {row["instance_id"]: row for row in prior["verified_task_bindings"]}
    if len(old) != 24:
        raise ValueError("old-bindings")
    replacement = next(task for task in candidate["ordered_tasks"] if task["instance_id"] == REPLACEMENT)
    if (git(NEW, "remote", "get-url", "origin") != replacement["repo_url"] or
            git(NEW, "rev-parse", replacement["base_commit"] + "^{commit}") !=
            replacement["base_commit"] or
            git(NEW, "rev-parse", replacement["base_commit"] + "^{tree}") != wsl["new_cache_tree"]):
        raise ValueError("new-commit-or-tree")
    verified = []
    for task in candidate["ordered_tasks"]:
        identifier = task["instance_id"]
        if identifier == REPLACEMENT:
            verified.append({"instance_id": identifier, "origin": task["repo_url"],
                             "base_commit": task["base_commit"], "tree": wsl["new_cache_tree"],
                             "repository_path": str(NEW), "provenance": "r13-r2-new-cache"})
            continue
        row = old.get(identifier)
        if not row or row["origin"] != task["repo_url"] or row["base_commit"] != task["base_commit"]:
            raise ValueError("retained-binding")
        path = Path(row["repository_path"])
        if (path.is_symlink() or not path.is_dir() or
                git(path, "remote", "get-url", "origin") != task["repo_url"] or
                git(path, "rev-parse", task["base_commit"] + "^{commit}") != task["base_commit"] or
                git(path, "rev-parse", task["base_commit"] + "^{tree}") != row["tree"]):
            raise ValueError("retained-cache-drift")
        verified.append({**row, "provenance": "r13-r1-retained-cache"})
    if len(verified) != 24 or len({row["origin"] for row in verified}) != 18:
        raise ValueError("verified-count")
    stat = os.statvfs(NEW.parent)
    receipt = {"schema_version": "are.g01-r13-r2-vps-cache-transfer-verify/v1",
               "status": "passed", "candidate_sha256": PINS[CANDIDATE],
               "prior_transfer_sha256": PINS[PRIOR], "wsl_cache_receipt_sha256": PINS[WSL],
               "script_sha256": sha(Path(__file__)),
               "verified_task_bindings": verified, "verified_tasks": 24,
               "verified_origins": 18,
               "tmpfs_available_bytes_after_transfer": stat.f_bavail * stat.f_frsize,
               "model_calls": 0, "gold_loaded": False,
               "claim_ceiling": "VPS exact-commit/tree identity only; no r44 index/native-reference/storage/provider/score/superiority evidence",
               "open_questions": ["Can full r44 index, native-reference and storage admission pass?"]}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"status": "passed", "tasks": 24, "origins": 18,
                      "receipt_sha256": sha(OUTPUT)}, sort_keys=True))


if __name__ == "__main__":
    main()
