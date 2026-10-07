#!/usr/bin/env python3
"""Bind the r14 score-blind candidate to its exact VPS tmpfs source caches."""
import hashlib
import json
import os
from pathlib import Path
import subprocess


BASE = Path("/opt/are/evolution-runtime")
CANDIDATE = BASE / "g01-r14-clean-cohort-candidate-r1/COHORT-CANDIDATE.json"
CACHES = Path("/tmp/are-g01-r14-source-caches-r1")
SOURCE = CACHES / "SOURCE-CACHES.json"
OUTPUT = BASE / "g01-r14-cache-transfer-r1/VERIFY.json"
CANDIDATE_SHA = "014c2cb62ac545b91adb123aa5a7494fb197d0e826effdad06217c3a48fa7845"
SOURCE_SHA = "803f2ab237263835b262f3f06aac4b6c8542c6f9901d241f57cc88a2afd47333"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(cache, *args):
    env = dict(os.environ, GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL="/dev/null",
               GIT_NO_LAZY_FETCH="1", GIT_TERMINAL_PROMPT="0", GIT_ALLOW_PROTOCOL="")
    result = subprocess.run(["git", f"--git-dir={cache}", *args], text=True,
                            capture_output=True, timeout=30, env=env, check=True)
    return result.stdout.strip()


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir():
        raise ValueError("output-boundary")
    if sha(CANDIDATE) != CANDIDATE_SHA or sha(SOURCE) != SOURCE_SHA:
        raise ValueError("pinned-input-drift")
    candidate = json.loads(CANDIDATE.read_text())
    source = json.loads(SOURCE.read_text())
    tasks = candidate["ordered_tasks"]
    if (candidate["status"] != "preflight-only-not-frozen" or len(tasks) != 24 or
            candidate["model_calls"] != 0 or candidate["gold_values_or_paths_used"] is not False or
            source["status"] != "passed" or source["candidate_sha256"] != CANDIDATE_SHA or
            source["model_calls"] != 0 or source["gold_loaded"] is not False or
            len(source["task_bindings"]) != 24 or len(source["origins"]) != 13):
        raise ValueError("input-shape")
    by_id = {row["instance_id"]: row for row in source["task_bindings"]}
    if len(by_id) != 24 or {row["instance_id"] for row in tasks} != set(by_id):
        raise ValueError("candidate-join")
    verified = []
    for task in tasks:
        row = by_id[task["instance_id"]]
        cache = CACHES / Path(row["repository_path"]).name
        if (cache.is_symlink() or not cache.is_dir() or
                task["repo_url"] != row["origin"] or task["base_commit"] != row["base_commit"] or
                git(cache, "remote", "get-url", "origin") != row["origin"] or
                git(cache, "rev-parse", row["base_commit"] + "^{commit}") != row["base_commit"] or
                git(cache, "rev-parse", row["base_commit"] + "^{tree}") != row["tree"]):
            raise ValueError("cache-binding:" + task["instance_id"])
        verified.append({"instance_id": task["instance_id"], "origin": row["origin"],
                         "base_commit": row["base_commit"], "tree": row["tree"],
                         "repository_path": str(cache)})
    receipt = {"schema_version": "are.g01-r14-vps-cache-transfer-verify/v1", "status": "passed",
               "candidate_sha256": CANDIDATE_SHA, "wsl_cache_receipt_sha256": SOURCE_SHA,
               "script_sha256": sha(Path(__file__)), "verified_task_bindings": verified,
               "verified_tasks": 24, "verified_origins": 13,
               "model_calls": 0, "gold_loaded": False,
               "claim_ceiling": "Exact VPS cache identity only; no index, native-reference, provider, score or superiority evidence",
               "open_questions": ["Will source indexes and native references admit all 24 tasks?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    with OUTPUT.open("xb") as stream:
        stream.write(data)
    print(json.dumps({"status": "passed", "tasks": 24, "origins": 13,
                      "receipt_sha256": hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == "__main__":
    main()
