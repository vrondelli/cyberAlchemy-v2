"""Serial WSL-only source-index preflight for the pinned eight-task transfer set."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "source-index-capacity-r8"))
from ranked_source_worker_r7 import run_index  # noqa: E402

CANDIDATE = HERE / "g01-r8-eight-task-transfer-r1/CANDIDATE.json"
CANDIDATE_SHA = "a134c8f7df6f4165c4053576365ccfb03d2c8b2c2d57d7dcf1a21848ec3bc0a2"
CACHE_ROOT = Path("/home/vlad_/are-benchmark-archive/g01-r8-eight-task-caches-r1")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], check=True,
                            capture_output=True, text=True, timeout=10)
    return result.stdout.strip()


def main():
    if sys.argv[1:]:
        raise ValueError("arguments")
    if sha(CANDIDATE) != CANDIDATE_SHA:
        raise ValueError("candidate-drift")
    candidate = json.loads(CANDIDATE.read_text(encoding="utf-8"))
    if candidate["status"] != "source-only-not-frozen" or len(candidate["selected"]) != 8:
        raise ValueError("candidate-shape")
    rows = []
    for task in candidate["selected"]:
        repo = CACHE_ROOT / (task["repo"].replace("/", "--") + ".git")
        if repo.resolve() != repo or not repo.is_dir() or git(repo, "rev-parse", "--is-bare-repository") != "true":
            raise ValueError("cache-shape:" + task["instance_id"])
        if git(repo, "config", "--get", "remote.origin.url") != task["repo_url"]:
            raise ValueError("cache-origin:" + task["instance_id"])
        if git(repo, "rev-parse", "--verify", task["base_commit"] + "^{commit}") != task["base_commit"]:
            raise ValueError("cache-base:" + task["instance_id"])
        outcome = run_index({"repository": str(repo), "base_commit": task["base_commit"], "query": ""})
        result = outcome["result"]
        row = {"instance_id": task["instance_id"], "repo": task["repo"],
               "passed": bool(outcome["ok"] and result and result["base_commit"] == task["base_commit"] and
                              result["model_calls"] == 0 and outcome["settlement"]["process_group_absent"] and
                              not outcome["settlement"]["forced"]),
               "error": outcome["error"], "elapsed_seconds": round(outcome["elapsed_seconds"], 6),
               "index_digest": result["index_digest"] if result else None,
               "max_rss_kib": result["max_rss_kib"] if result else None,
               "git_blob_requests": result["git_blob_requests"] if result else None,
               "settlement": outcome["settlement"]}
        rows.append(row)
        print(json.dumps({"kind": "task", **row}, sort_keys=True, separators=(",", ":")), flush=True)
    summary = {"schema_version": "are.g01-r8-eight-task-local-index-preflight/v1",
               "status": "passed-local-source-only" if all(row["passed"] for row in rows) else "failed",
               "candidate_sha256": CANDIDATE_SHA, "selected_count": 8,
               "passed": sum(row["passed"] for row in rows), "failed": sum(not row["passed"] for row in rows),
               "max_elapsed_seconds": max(row["elapsed_seconds"] for row in rows),
               "max_rss_kib": max(row["max_rss_kib"] or 0 for row in rows),
               "model_calls": 0, "gold_loaded": False, "reserved_confirmation_opened": False,
               "claim_ceiling": "WSL-only source/index admission for eight development-transfer tasks; no native score, 24-pair campaign or superiority",
               "open_questions": ["Will all eight pass native-reference admission?",
                                  "Can a separately admitted full cohort pass the live 24-pair gates?"]}
    print(json.dumps({"kind": "summary", **summary}, sort_keys=True, separators=(",", ":")), flush=True)
    return 0 if summary["failed"] == 0 else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"kind": "failure", "error": str(error)}, sort_keys=True), file=sys.stderr)
        raise SystemExit(2)
