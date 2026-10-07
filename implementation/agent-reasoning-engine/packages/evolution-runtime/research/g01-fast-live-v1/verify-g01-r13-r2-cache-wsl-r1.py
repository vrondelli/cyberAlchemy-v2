#!/usr/bin/env python3
"""Bind 23 retained r13 caches and one exact Astropy replacement on WSL."""
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

ROOT = Path("/home/vlad_/are-benchmark-archive")
CANDIDATE = ROOT / "g01-r13-clean-cohort-candidate-r2-20261002/COHORT-CANDIDATE.json"
PRIOR = ROOT / "g01-r13-source-caches-r1-20261002/SOURCE-CACHES.json"
NEW = ROOT / "g01-r13-source-caches-r2-20261002/astropy--astropy.git"
OUTPUT = NEW.parent / "SOURCE-CACHES.json"
PINS = {
    CANDIDATE: "e2a7a96ab1da7de1e0e7dba26a19a82ae8661ae481cefad1f504209cadadfe1d",
    PRIOR: "9630e86fc498bdf774d97acb4497f834a7bbcc2f45ecbd1008901de6e507648d",
}
REPLACEMENT = "SWE-Bench-Verified__python__maintenance__bugfix__6ed8d38b"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(path, *args):
    env = dict(os.environ, GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL="/dev/null",
               GIT_NO_LAZY_FETCH="1", GIT_TERMINAL_PROMPT="0", GIT_ALLOW_PROTOCOL="")
    value = subprocess.run(["git", f"--git-dir={path}", *args],
                           text=True, capture_output=True, timeout=30, env=env)
    if value.returncode:
        raise ValueError("git-identity:" + str(path))
    return value.stdout.strip()


def main():
    if OUTPUT.exists() or NEW.is_symlink() or not NEW.is_dir():
        raise ValueError("output-or-cache-boundary")
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError("pinned-input-drift")
    candidate = json.loads(CANDIDATE.read_text())
    prior = json.loads(PRIOR.read_text())
    tasks = candidate["ordered_tasks"]
    if (candidate["status"] != "preflight-only-not-frozen" or len(tasks) != 24 or
            candidate["replacement_instance_id"] != REPLACEMENT or
            candidate["model_calls"] != 0 or candidate["gold_values_or_paths_used"] is not False or
            prior["status"] != "passed" or len(prior["task_bindings"]) != 24 or
            prior["candidate_sha256"] != candidate["parent_candidate_sha256"]):
        raise ValueError("candidate-lineage")
    old = {row["instance_id"]: row for row in prior["task_bindings"]}
    if len(old) != 24:
        raise ValueError("old-bindings")
    replacement = next(task for task in tasks if task["instance_id"] == REPLACEMENT)
    if (replacement["repo_url"] != "https://github.com/astropy/astropy.git" or
            git(NEW, "remote", "get-url", "origin") != replacement["repo_url"] or
            git(NEW, "rev-parse", replacement["base_commit"] + "^{commit}") != replacement["base_commit"]):
        raise ValueError("replacement-identity")
    new_tree = git(NEW, "rev-parse", replacement["base_commit"] + "^{tree}")
    if not re.fullmatch(r"[a-f0-9]{40}", new_tree):
        raise ValueError("replacement-tree")
    bindings = []
    for task in tasks:
        identifier = task["instance_id"]
        if identifier == REPLACEMENT:
            bindings.append({"instance_id": identifier, "repo": task["repo"],
                             "origin": task["repo_url"], "base_commit": task["base_commit"],
                             "repository_path": str(NEW), "tree": new_tree,
                             "provenance": "r13-r2-new-exact-commit"})
            continue
        row = old.get(identifier)
        if (not row or row["origin"] != task["repo_url"] or
                row["base_commit"] != task["base_commit"]):
            raise ValueError("retained-binding")
        path = Path(row["repository_path"])
        if (path.is_symlink() or not path.is_dir() or
                git(path, "remote", "get-url", "origin") != task["repo_url"] or
                git(path, "rev-parse", task["base_commit"] + "^{commit}") != task["base_commit"] or
                git(path, "rev-parse", task["base_commit"] + "^{tree}") != row["tree"]):
            raise ValueError("retained-cache-drift")
        bindings.append({**row, "provenance": "r13-r1-retained-exact-cache"})
    origins = Counter(row["origin"] for row in bindings)
    if len(bindings) != 24 or len(origins) != 18 or max(origins.values()) > 2:
        raise ValueError("binding-count")
    receipt = {"schema_version": "are.g01-r13-r2-wsl-source-caches/v1",
               "status": "passed", "candidate_sha256": PINS[CANDIDATE],
               "prior_cache_receipt_sha256": PINS[PRIOR],
               "script_sha256": sha(Path(__file__)),
               "task_bindings": bindings, "verified_tasks": len(bindings),
               "verified_origins": len(origins),
               "new_cache_root": str(NEW), "new_cache_commit": replacement["base_commit"],
               "new_cache_tree": new_tree,
               "model_calls": 0, "gold_loaded": False,
               "claim_ceiling": "WSL exact-commit cache binding only; VPS/index/native-gold/storage/score/superiority unproven",
               "open_questions": ["Does the exact replacement transfer and qualify on the VPS?"]}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"status": "passed", "tasks": len(bindings), "origins": len(origins),
                      "new_tree": new_tree, "receipt_sha256": sha(OUTPUT)}, sort_keys=True))


if __name__ == "__main__":
    main()
