"""Read-only, serial r17 source-index capacity sweep with no model or gold."""

import argparse
import hashlib
import json
from pathlib import Path
import sys

from ranked_source_worker_r7 import run_index


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--campaign-root", type=Path, required=True)
    parser.add_argument("--task-root", type=Path, required=True)
    parser.add_argument("--cache-root", type=Path, required=True)
    parser.add_argument("--delta-cache-root", type=Path)
    parser.add_argument("--first", type=int, default=1)
    parser.add_argument("--last", type=int, default=24)
    args = parser.parse_args()
    if not 1 <= args.first <= args.last <= 24:
        parser.error("task range must be within 1..24")
    counts = {"passed": 0, "failed": 0}
    max_elapsed, max_rss = 0.0, 0
    for number in range(args.first, args.last + 1):
        config_path = args.campaign_root / f"task-{number:02d}" / "CONFIG.json"
        config = json.loads(config_path.read_text(encoding="utf-8"))
        selected = config["tasks"][0]
        task_path = args.task_root / "tasks" / (selected["instance_id"] + ".json")
        task_bytes = task_path.read_bytes()
        if hashlib.sha256(task_bytes).hexdigest() != selected["task_sha256"]:
            raise ValueError(f"task-{number:02d}-source-hash")
        task = json.loads(task_bytes)
        if task["instance_id"] != selected["instance_id"] or task["base_commit"] != selected["base_commit"]:
            raise ValueError(f"task-{number:02d}-identity")
        selected_cache = Path(selected["repository_cache"])
        if selected_cache.parent.name == "are-g01-r16-source-caches-r1":
            cache_root = args.cache_root
        elif selected_cache.parent.name == "are-g01-r16-r2-delta-caches-r1" and args.delta_cache_root:
            cache_root = args.delta_cache_root
        else:
            raise ValueError(f"task-{number:02d}-cache-root-not-mapped")
        repo = cache_root / selected_cache.name
        outcome = run_index({"repository": str(repo.resolve()),
                             "base_commit": task["base_commit"], "query": ""})
        result = outcome["result"]
        row = {"task_number": number, "task_id": task["instance_id"],
               "ok": outcome["ok"], "error": outcome["error"],
               "elapsed_seconds": round(outcome["elapsed_seconds"], 6),
               "max_rss_kib": result["max_rss_kib"] if result else None,
               "index_digest": result["index_digest"] if result else None,
               "admitted_files": result["manifest"]["admitted_files"] if result else None,
               "git_blob_requests": result["git_blob_requests"] if result else None,
               "settlement": outcome["settlement"]}
        print(json.dumps(row, sort_keys=True, separators=(",", ":")), flush=True)
        counts["passed" if outcome["ok"] else "failed"] += 1
        max_elapsed = max(max_elapsed, outcome["elapsed_seconds"])
        if result:
            max_rss = max(max_rss, result["max_rss_kib"])
    summary = {"schema": "g01.exposed-r17-r8-sweep/v1", "first": args.first,
               "last": args.last, **counts,
               "max_elapsed_seconds": round(max_elapsed, 6),
               "max_rss_kib": max_rss, "model_calls": 0,
               "evaluator_access": False}
    print(json.dumps(summary, sort_keys=True, separators=(",", ":")), flush=True)
    return 0 if counts["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
