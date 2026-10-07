#!/usr/bin/env python3
"""Select one score-blind clean replacement for the r13 r1 Catch2 admission failure."""
from collections import Counter
import hashlib
import json
import os
from pathlib import Path

BASE = Path("/opt/are/evolution-runtime")
PARENT = BASE / "g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json"
MANIFEST = BASE / "g01-r13-fresh-supply-screen-r1/SOURCE-ONLY-MANIFEST.json"
ELIGIBILITY = BASE / "g01-r13-fresh-supply-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json"
AUDIT = BASE / "g01-r13-r44-gold-index-coverage-r1/GOLD-INDEX-COVERAGE.json"
OUTPUT = BASE / "g01-r13-clean-cohort-candidate-r2/COHORT-CANDIDATE.json"
SEED = "are-g01-r13-r2-encoding-replacement-20261002"
PINS = {
    PARENT: "86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5",
    MANIFEST: "9a6ac987ad8d100584d782b33a3a240ecf5c479d8c402ce3aa550d46c57a20e6",
    ELIGIBILITY: "67adff14486363ab1216720a03c3a692fa6b93c4e381d7ddc90a8bec3da9e9bc",
    AUDIT: "8e419cb6076797c54b3949dc4a7d2ab76640484d903eaf5d8590458cd7ded596",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def id_sha(ids):
    return hashlib.sha256(("\n".join(sorted(ids)) + "\n").encode()).hexdigest()


def main():
    if OUTPUT.exists() or OUTPUT.parent.exists():
        raise ValueError("fresh-output-root-required")
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError("pinned-input-drift")
    parent, manifest, eligibility, audit = (json.loads(path.read_text()) for path in
                                             (PARENT, MANIFEST, ELIGIBILITY, AUDIT))
    tasks = parent["ordered_tasks"]
    if (len(tasks) != 24 or parent["status"] != "preflight-only-not-frozen" or
            parent["model_calls"] != 0 or parent["gold_values_or_paths_used"] is not False or
            parent["fresh_screen_manifest_sha256"] != PINS[MANIFEST] or
            parent["fresh_screen_receipt_sha256"] != PINS[ELIGIBILITY] or
            audit["candidate_sha256"] != PINS[PARENT] or
            audit["summary"]["audited"] != 24 or
            audit["summary"]["worker_unavailable"] != 0 or
            audit["summary"]["absent"] != 0 or
            audit["summary"]["excluded"] != 3 or
            audit["model_calls"] != 0 or
            audit["gold_paths_or_content_exported"] is not False or
            manifest["source_parquet_sha256"] != parent["source_parquet_sha256"] or
            eligibility["source_manifest_sha256"] != PINS[MANIFEST]):
        raise ValueError("input-shape")
    failed = [row for row in audit["rows"] if row["excluded_gold_files"] or row["absent_gold_files"]]
    if (len(failed) != 1 or failed[0]["repo"] != "catchorg/Catch2" or
            failed[0]["language"] != "cpp" or failed[0]["excluded_gold_files"] != 3 or
            failed[0]["exclusion_reasons"] != {"encoding": 3}):
        raise ValueError("exact-failure")
    excluded_id = failed[0]["instance_id"]
    if sum(task["instance_id"] == excluded_id for task in tasks) != 1:
        raise ValueError("excluded-task-not-unique")
    retained = [task for task in tasks if task["instance_id"] != excluded_id]
    used = {task["instance_id"] for task in tasks}
    origins = Counter(task["repo_url"] for task in retained)
    repos = Counter(task["repo"] for task in retained)
    clean = {row["instance_id"] for row in eligibility["tasks"] if row["gold_lineage_clean"] is True}
    source_rows = {row["instance_id"]: row for row in manifest["ordered_tasks"]}
    eligible = [source_rows[identifier] for identifier in clean - used
                if identifier in source_rows and source_rows[identifier]["language"] == "python" and
                origins[source_rows[identifier]["repo_url"]] < 2 and
                repos[source_rows[identifier]["repo"]] < 2]
    eligible.sort(key=lambda row: (hashlib.sha256((SEED + "\0" + row["instance_id"]).encode()).hexdigest(),
                                   row["instance_id"]))
    if not eligible:
        raise ValueError("no-eligible-replacement")
    replacement = eligible[0]
    ordered = retained + [replacement]
    ids = {task["instance_id"] for task in ordered}
    by_language = Counter(task["language"] for task in ordered)
    by_origin = Counter(task["repo_url"] for task in ordered)
    by_repo = Counter(task["repo"] for task in ordered)
    if (len(ordered) != 24 or len(ids) != 24 or
            by_language != Counter({"cpp": 1, "java": 1, "javascript": 1,
                                    "typescript": 2, "python": 19}) or
            max(by_origin.values()) > 2 or max(by_repo.values()) > 2 or
            not (used - {excluded_id}) <= ids):
        raise ValueError("candidate-shape")
    candidate = {**parent,
                 "status": "preflight-only-not-frozen",
                 "seed": SEED, "parent_candidate_sha256": PINS[PARENT],
                 "r44_source_tree_sha256": audit["source_tree_sha256"],
                 "r44_failed_admission_receipt_sha256": PINS[AUDIT],
                 "exposure_rule": "replace-only-native-encoding-ineligible-task",
                 "excluded_instance_id": excluded_id,
                 "replacement_rule": "first sha256(seed + NUL + id) among unused fresh-screen clean Python rows respecting two-per-origin/repo",
                 "replacement_eligible_count": len(eligible),
                 "replacement_instance_id": replacement["instance_id"],
                 "language_quota": dict(by_language),
                 "ordered_tasks": ordered, "task_id_set_sha256": id_sha(ids),
                 "selected_git_origins": len(by_origin),
                 "selected_repositories": len(by_repo),
                 "selector_sha256": sha(Path(__file__)),
                 "model_calls": 0, "gold_values_or_paths_used": False,
                 "claim_ceiling": "Score-blind r13 r2 source-only replacement; no cache/index/gold/storage/provider admission, freeze, score, or superiority",
                 "open_questions": ["Can the replacement exact cache and r44 index pass full preflight?",
                                    "Can independent evaluator-only native-reference admission pass all 24 tasks?",
                                    "Can storage, provider readiness, and matched run pass strict gates?"]}
    OUTPUT.parent.mkdir(mode=0o700)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write((json.dumps(candidate, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"status": candidate["status"], "tasks": len(ordered),
                      "replacement_instance_id": replacement["instance_id"],
                      "eligible_count": len(eligible), "by_language": dict(by_language),
                      "git_origins": len(by_origin), "candidate_sha256": sha(OUTPUT),
                      "task_id_set_sha256": candidate["task_id_set_sha256"],
                      "model_calls": 0}, sort_keys=True))


if __name__ == "__main__":
    main()
