#!/usr/bin/env python3
"""Source-only overlap of sealed filename cues and r8 top-five hints."""

import hashlib
import json
import os
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ENGINE = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(HERE / "source-index-capacity-r8"))
from ranked_source_worker_r7 import run_index  # noqa: E402

CANDIDATE = HERE / "g01-r8-eight-task-transfer-r1/CANDIDATE.json"
CANDIDATE_SHA = "a134c8f7df6f4165c4053576365ccfb03d2c8b2c2d57d7dcf1a21848ec3bc0a2"
CUE = Path("/home/vlad_/are-benchmark-archive/g01-eight-task-explicit-cue-screen-r1-20261004/SOURCE-SEAL.json")
CUE_SHA = "9381e29e6da50606983208a4c58a377be98caa999d5bedc2144dab56abe2b568"
TASKS = ENGINE / "benchmarks/contextbench-v1/development-tasks"
CACHES = Path("/home/vlad_/are-benchmark-archive/g01-r8-eight-task-caches-r1")
OUT = Path("/home/vlad_/are-benchmark-archive/g01-eight-task-cue-index-overlap-r1-20261004/RESULT.json")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, sort_keys=True, indent=2, ensure_ascii=False) + "\n").encode()


def main():
    if OUT.exists() or sha(CANDIDATE.read_bytes()) != CANDIDATE_SHA or sha(CUE.read_bytes()) != CUE_SHA:
        raise ValueError("output-exists-or-input-drift")
    candidate = json.loads(CANDIDATE.read_text())
    cue = json.loads(CUE.read_text())
    if len(candidate["selected"]) != 8 or len(cue["rows"]) != 8:
        raise ValueError("cohort-shape")
    rows = []
    for ordinal, (task, cue_row) in enumerate(zip(candidate["selected"], cue["rows"], strict=True), 1):
        if task["instance_id"] != cue_row["instance_id"] or task["base_commit"] != cue_row["base_commit"]:
            raise ValueError("task-binding")
        task_path = TASKS / (task["instance_id"] + ".json")
        raw = task_path.read_bytes()
        if sha(raw) != cue_row["task_sha256"]:
            raise ValueError("task-source-drift")
        issue = json.loads(raw)["problem_statement"]
        if issue.startswith('"') and issue.endswith('"'):
            try:
                decoded = json.loads(issue)
                if isinstance(decoded, str):
                    issue = decoded
            except json.JSONDecodeError:
                pass
        wire = issue.encode("utf-8")
        query = wire[:4096].decode("utf-8", errors="ignore")
        cache = CACHES / (task["repo"].replace("/", "--") + ".git")
        outcome = run_index({"repository": str(cache), "base_commit": task["base_commit"], "query": query})
        if not outcome["ok"] or outcome["settlement"]["forced"] or not outcome["settlement"]["process_group_absent"]:
            raise ValueError("index-failed:" + task["instance_id"])
        result = outcome["result"]
        if result["base_commit"] != task["base_commit"] or result["model_calls"] != 0:
            raise ValueError("index-identity")
        hint_paths = list(dict.fromkeys(h["path"] for h in result["query_result"]["hints"]))
        cue_paths = [c["path"] for c in cue_row["resolved_candidates"]]
        rows.append({"ordinal": ordinal, "instance_id": task["instance_id"], "repo": task["repo"],
                     "query_sha256": sha(query.encode()), "query_bytes": len(query.encode()),
                     "omitted_issue_bytes": len(wire) - len(query.encode()),
                     "index_digest": result["index_digest"],
                     "top_five_paths": hint_paths, "cue_paths": cue_paths,
                     "cue_in_top_five": sorted(set(cue_paths) & set(hint_paths)),
                     "cue_outside_top_five": sorted(set(cue_paths) - set(hint_paths)),
                     "elapsed_seconds": round(outcome["elapsed_seconds"], 3),
                     "max_rss_kib": result["max_rss_kib"]})
        print(json.dumps({"ordinal": ordinal, "index_ok": True,
                          "cue_count": len(cue_paths), "cue_outside_top_five": len(rows[-1]["cue_outside_top_five"])},
                         sort_keys=True), flush=True)
    summary = {"schema_version": "g01.eight-task-cue-index-overlap-r1/v1",
               "posture": "source-only-development-no-gold-no-model-no-vps",
               "candidate_sha256": CANDIDATE_SHA, "cue_source_sha256": CUE_SHA,
               "script_sha256": sha(Path(__file__).read_bytes()),
               "query_policy": "decoded issue statement; UTF-8 prefix up to 4096 bytes, dropping only incomplete terminal codepoint",
               "task_count": len(rows), "tasks_with_cues": sum(bool(r["cue_paths"]) for r in rows),
               "total_cues": sum(len(r["cue_paths"]) for r in rows),
               "cues_in_top_five": sum(len(r["cue_in_top_five"]) for r in rows),
               "cues_outside_top_five": sum(len(r["cue_outside_top_five"]) for r in rows),
               "rows": rows,
               "claim_ceiling": "Source-only top-five overlap; no gold relevance, Span-F1, live GLM, independent confirmation, or superiority."}
    OUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    data = encoded(summary)
    fd = os.open(OUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as file:
        file.write(data)
    print(json.dumps({"status": "sealed", "sha256": sha(data), "total_cues": summary["total_cues"],
                      "cues_outside_top_five": summary["cues_outside_top_five"]}, sort_keys=True))


if __name__ == "__main__":
    main()
