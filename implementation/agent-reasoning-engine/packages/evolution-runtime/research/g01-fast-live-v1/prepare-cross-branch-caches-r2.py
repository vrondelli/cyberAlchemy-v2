#!/usr/bin/env python3
"""Build new, repo-grouped G01 source caches before any campaign freeze.

The only network traffic is public Git fetch. The cache's exact origin URL is
part of the runner contract; never reuse or modify a prior campaign cache.
"""
import argparse
from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


MIN_FREE_BYTES = 2_000_000_000


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def run(*args: str, timeout: int = 240) -> str:
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout, check=False)
    if result.returncode:
        raise RuntimeError(f"git command failed: {args[0]} {args[1]}: exit {result.returncode}: {result.stderr[-350:]}")
    return result.stdout.strip()


def prepare(candidate: dict, candidate_sha: str, root: Path) -> dict:
    tasks = candidate.get("ordered_tasks")
    if (candidate.get("status") != "preflight-only-not-frozen" or
            candidate.get("source_commit_join_verified") is not True or
            candidate.get("model_calls") != 0 or
            not isinstance(tasks, list) or len(tasks) != 24 or
            len({task["instance_id"] for task in tasks}) != 24):
        raise ValueError("candidate shape")
    groups = defaultdict(list)
    for task in tasks:
        repo, url, commit = task["repo"], task["repo_url"], task["base_commit"]
        if (not re.fullmatch(r"[A-Za-z0-9._-]+/[A-Za-z0-9._-]+", repo) or
                not re.fullmatch(r"https://github\.com/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\.git", url) or
                not re.fullmatch(r"[a-f0-9]{40}", commit)):
            raise ValueError("task repository identity")
        groups[repo].append(task)
    if root.exists() or not root.is_absolute() or not root.parent.is_dir():
        raise ValueError("fresh absolute root required")
    root.mkdir(mode=0o700)
    rows = []
    for repo, group in groups.items():
        free = os.statvfs(root).f_bavail * os.statvfs(root).f_frsize
        if free < MIN_FREE_BYTES:
            raise RuntimeError(f"space floor before {repo}: {free}")
        url = group[0]["repo_url"]
        if any(task["repo_url"] != url for task in group):
            raise ValueError("inconsistent source URL within repository group")
        path = root / repo.replace("/", "--")
        if path.exists():
            raise ValueError("cache path collision")
        run("git", "init", "--quiet", str(path))
        run("git", "-C", str(path), "remote", "add", "origin", url)
        if run("git", "-C", str(path), "remote", "get-url", "origin") != url:
            raise RuntimeError("origin identity drift")
        commits = list(dict.fromkeys(task["base_commit"] for task in group))
        for commit in commits:
            run("git", "-C", str(path), "-c", "protocol.version=2", "fetch", "--depth=1", "--no-tags", "origin", commit)
            if run("git", "-C", str(path), "cat-file", "-t", f"{commit}^{{commit}}") != "commit":
                raise RuntimeError("fetched commit unavailable")
            tree = run("git", "-C", str(path), "rev-parse", f"{commit}^{{tree}}")
            if not re.fullmatch(r"[a-f0-9]{40}", tree):
                raise RuntimeError("fetched tree unavailable")
        run("git", "-C", str(path), "checkout", "--detach", "--quiet", commits[0])
        if run("git", "-C", str(path), "status", "--porcelain"):
            raise RuntimeError("cache worktree not clean")
        rows.append({"repo": repo, "repository_path": str(path), "origin": url,
                     "commits": commits, "task_count": len(group), "free_bytes_after": os.statvfs(root).f_bavail * os.statvfs(root).f_frsize})
        print(json.dumps({"repo": repo, "status": "ready", "commits": len(commits), "free_bytes_after": rows[-1]["free_bytes_after"]}), flush=True)
    receipt = {"schema_version": "are.g01-cross-branch-source-caches/v2", "status": "passed",
               "candidate_sha256": candidate_sha, "model_calls": 0, "gold_loaded": False,
               "repositories": rows, "claim_ceiling": "Source-cache readiness only, not model quality or benchmark superiority.",
               "open_questions": ["Will all task-specific indexes pass?", "Will the four-checkout campaign fit the remaining space?"]}
    path = root / "SOURCE-CACHES.json"
    with path.open("x") as stream:
        json.dump(receipt, stream, indent=2)
        stream.write("\n")
    path.chmod(0o600)
    return {"status": "passed", "path": str(path), "sha256": sha(path.read_bytes()),
            "repositories": len(rows), "tasks": len(tasks), "free_bytes": rows[-1]["free_bytes_after"]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--candidate-sha256", required=True)
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    data = args.candidate.read_bytes()
    if sha(data) != args.candidate_sha256:
        raise ValueError("candidate digest drift")
    print(json.dumps(prepare(json.loads(data), args.candidate_sha256, args.root)))


if __name__ == "__main__":
    main()
