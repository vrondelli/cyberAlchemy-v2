#!/usr/bin/env python3
"""Freeze a fresh G02 source-only 12-pair cohort; never read gold columns."""
import glob
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import pyarrow.parquet as pq

ROOT = Path("/opt/are/evolution-runtime")
PARQUET = ROOT / "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet"
PRIOR = ROOT / "g02-product-replication-cohort-r1.json"
TOOLS = ROOT / "g02-product-replication-tools-r2"
OUT = ROOT / "g02-product-replication-r3"
REPOS = ["qutebrowser/qutebrowser", "internetarchive/openlibrary", "navidrome/navidrome", "element-hq/element-web"]
CACHES = dict(zip(REPOS, ["qutebrowser", "openlibrary", "navidrome", "elementweb"]))
SEED = b"are-product-replication-g02-r3\0"
FIELDS = ["instance_id", "repo", "repo_url", "language", "base_commit", "source"]

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def main():
    if OUT.exists():
        raise ValueError("fresh output root required")
    previous = json.loads(PRIOR.read_text())
    exposed = {row["instance_id"] for row in previous["ordered_tasks"]}
    for pattern in ("/opt/are-benchmark-runs/g02-*/tasks/*.json", str(ROOT / "g02-*/tasks/*.json")):
        for path in glob.glob(pattern):
            row = json.loads(Path(path).read_text())
            if "instance_id" in row:
                exposed.add(row["instance_id"])
            elif "tasks" in row and isinstance(row["tasks"], dict):
                exposed.update(row["tasks"])
            else:
                raise ValueError(f"unknown prior exposure shape: {path}")
    rows = pq.read_table(PARQUET, columns=FIELDS).to_pylist()
    buckets = {}
    exclusions = []
    for repo in REPOS:
        eligible = sorted((row for row in rows if row["repo"] == repo and row["source"] == "Pro" and row["instance_id"] not in exposed),
                          key=lambda row: hashlib.sha256(SEED + row["instance_id"].encode()).hexdigest())
        available = []
        for row in eligible:
            cache = Path("/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926/cache") / CACHES[repo]
            check = subprocess.run(["git", "-C", str(cache), "cat-file", "-e", row["base_commit"] + "^{commit}"], capture_output=True)
            if check.returncode == 0:
                available.append(row)
            else:
                exclusions.append({"instance_id": row["instance_id"], "reason": "base-commit-unavailable"})
        if len(available) < 3:
            raise ValueError(f"{repo}: only {len(available)} eligible cached commits")
        buckets[repo] = available[:3]
    selected = [buckets[repo][index] for index in range(3) for repo in REPOS]
    if len({row["instance_id"] for row in selected}) != 12:
        raise ValueError("duplicate task")
    OUT.mkdir(mode=0o700)
    cohort = {"schema_version": "are.g02-product-replication-cohort/v1", "status": "frozen-before-model-dispatch",
              "objective": "Fresh 12-pair ARE versus DSH large-window source-localization replication; three tasks per four repositories.",
              "source_parquet_sha256": digest(PARQUET), "source_only_fields": FIELDS,
              "selection": {"seed_hex": SEED.hex(), "method": "SHA-256(seed + instance_id) ascending within each repository; three commit-eligible tasks each; round-robin order",
                            "repositories": REPOS, "prior_exposed_distinct_ids": len(exposed), "gold_or_patch_used": False,
                            "commit_exclusions": exclusions},
              "candidate": previous["candidate"], "comparator": "DSH fixed-pair source-only control", "model": "glm-5.3-flash",
              "large_window_context_tokens": 1000000, "are_token_cap_per_task": 650000, "dsh_token_cap_per_task": 1000000,
              "ordered_tasks": selected, "claim_ceiling": "Fresh 12-pair four-repository G02 comparison only; not the prior 24-pair population or a product superiority claim.",
              "open_questions": ["Will all 12 pairs complete native scoring?", "Will paired quality and efficiency support a bounded claim?"]}
    cohort_path = OUT / "COHORT.json"
    cohort_path.write_text(json.dumps(cohort, indent=2) + "\n")
    cohort_path.chmod(0o600)
    abbreviations = ["qut", "open", "nav", "elem"]
    plan = {"schema_version": "are.g02-product-replication-execution/v1", "status": "pre-dispatch-new-cohort",
            "cohort_sha256": digest(cohort_path), "cohort_path": str(cohort_path), "tools_root": str(TOOLS),
            "tool_bindings": {"prepare_prospective_sha256": digest(TOOLS / "prepare-prospective.mjs"),
                              "run_and_score_pair_sha256": digest(TOOLS / "run-and-score-pair.mjs")},
            "env_policy": {"G02_OWN_EXPANSIONS": "1", "G02_GO_PACKET": "0", "G02_RETENTION": "0", "G02_SELECTIVE_RETENTION": "0",
                           "G02_EXPOSED": "0", "G02_RETRY_CONTROL": "0"},
            "ordered_pairs": [{"instance_id": row["instance_id"], "repo": row["repo"],
                               "suffix": f"pr3-{abbreviations[REPOS.index(row['repo'])]}-{row['instance_id'][-8:]}",
                               "root": f"/opt/are-benchmark-runs/g02-cross-layer-pr3-{abbreviations[REPOS.index(row['repo'])]}-{row['instance_id'][-8:]}"}
                              for row in selected],
            "run_policy": "One dispatch per fresh task; two pair workers; invalid and failed pairs retained; no score-adaptive replacement.",
            "claim_ceiling": "Execution mapping only; no product claim.", "open_questions": ["Are all four repository caches and pinned provider paths operational?"]}
    plan_path = OUT / "EXECUTION-PLAN.json"
    plan_path.write_text(json.dumps(plan, indent=2) + "\n")
    plan_path.chmod(0o600)
    print(json.dumps({"cohort_path": str(cohort_path), "cohort_sha256": digest(cohort_path), "plan_path": str(plan_path),
                      "plan_sha256": digest(plan_path), "tasks": len(selected), "excluded_commits": len(exclusions)}))

if __name__ == "__main__":
    main()
