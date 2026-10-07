#!/usr/bin/env python3
"""Score-blind r8 source-index transfer on the 12 exposed G02 r11 pairs.

Freeze exactly the first three distinct not-yet-delivered paths from the r8
worker's five returned issue-query windows. No native reference is opened.
"""

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys


HERE = Path(__file__).resolve().parent
R8 = HERE.parent / "g01-fast-live-v1/source-index-capacity-r8"
sys.path.insert(0, str(R8))
from ranked_source_worker_r7 import run_index  # noqa: E402

PRIOR = Path("/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002/SEAL.json")
ARCHIVE = Path("/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002/pairs")
OUTPUT = Path("/home/vlad_/are-benchmark-archive/g02-r11-r8-transfer-exposed-r1/SOURCE-SEAL.json")
PINS = {
    PRIOR: "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901",
    R8 / "ranked_source_worker_r7.py": "b06d6a4d2291a96a3d51978058ca6c4b53208c4882780dd7dd629149604dfb6a",
    R8 / "ranked_source_hints_r8.py": "e934ac458c1566fe0e7483dd9107d2cef5a98aa4df0662b73f6c23fb0afa88d1",
}


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def issue_query(statement):
    value = statement.encode("utf-8")[:1024].decode("utf-8", "replace")
    if value.endswith("\ufffd"):
        value = value[:-1]
    return value.strip()


def git(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], check=True,
                            capture_output=True, text=True, timeout=10)
    return result.stdout.strip()


def main():
    if sys.argv[1:]:
        raise ValueError("arguments-not-supported")
    if OUTPUT.exists():
        raise ValueError("fresh-output-required")
    for path, digest in PINS.items():
        if sha(path) != digest:
            raise ValueError("pinned-input-drift:" + path.name)
    prior = json.loads(PRIOR.read_text(encoding="utf-8"))
    source_rows = prior["rows"]
    if (prior["schema_version"] != "g02.r11-retrieval-exposed-seal/v1"
            or prior["posture"] != "source-only-exposed-development-no-gold-dsh-or-score"
            or len(source_rows) != 12
            or [row["ordinal"] for row in source_rows] != list(range(1, 13))):
        raise ValueError("prior-seal-shape")
    rows = []
    for source in source_rows:
        ordinal = source["ordinal"]
        root = ARCHIVE / ("%02d-pr11-mixed-%02d" % (ordinal, ordinal)) / "raw"
        base = root / "sources/session/base"
        task_paths = [path for path in (root / "tasks").glob("*.json")
                      if path.name != "binding.json"]
        if len(task_paths) != 1 or not base.is_dir() or not (base / ".git").exists():
            raise ValueError("archived-pair-shape:" + str(ordinal))
        task = json.loads(task_paths[0].read_text(encoding="utf-8"))
        statement = task["problem_statement"]
        if (task["instance_id"] != source["instance_id"]
                or task["base_commit"] != source["base_commit"]
                or task["repo"] != source["repo"]
                or hashlib.sha256(statement.encode("utf-8")).hexdigest()
                != source["issue_sha256"]
                or git(base, "rev-parse", "--verify", task["base_commit"] + "^{commit}")
                != task["base_commit"]):
            raise ValueError("source-identity-drift:" + str(ordinal))
        query = issue_query(statement)
        outcome = run_index({"repository": str(base), "base_commit": task["base_commit"],
                             "query": query})
        result = outcome.get("result")
        if (outcome.get("ok") is not True or not result
                or result["base_commit"] != task["base_commit"]
                or result["model_calls"] != 0
                or result["query_result"]["index_digest"] != result["index_digest"]
                or outcome["settlement"]["forced"]
                or not outcome["settlement"]["process_group_absent"]):
            raise ValueError("r8-index-failure:" + str(ordinal) + ":" + str(outcome.get("error")))
        hints = result["query_result"]["hints"]
        if len(hints) > 5:
            raise ValueError("hint-limit:" + str(ordinal))
        delivered = set(source["delivered_paths"])
        proposals = []
        for hint in hints:
            path = hint["path"]
            if path not in delivered and path not in proposals:
                proposals.append(path)
            if len(proposals) == 3:
                break
        row = {"ordinal": ordinal, "instance_id": task["instance_id"],
               "repo": task["repo"], "base_commit": task["base_commit"],
               "issue_sha256": source["issue_sha256"],
               "query_sha256": hashlib.sha256(query.encode("utf-8")).hexdigest(),
               "index_digest": result["index_digest"],
               "query_digest": result["query_result"]["query_digest"],
               "returned_windows": len(hints),
               "matching_windows": result["query_result"]["matching_windows"],
               "partial_index": result["query_result"]["partial_index"],
               "new_proposals": proposals,
               "elapsed_seconds": round(outcome["elapsed_seconds"], 6),
               "max_rss_kib": result["max_rss_kib"],
               "process_group_absent": True, "forced": False}
        rows.append(row)
        print(json.dumps({"kind": "task", "ordinal": ordinal,
                          "new_proposal_count": len(proposals),
                          "elapsed_seconds": row["elapsed_seconds"],
                          "max_rss_kib": row["max_rss_kib"]}, sort_keys=True), flush=True)
    receipt = {"schema_version": "g02.r11-r8-transfer-exposed-source-seal/v1",
               "posture": "source-only-exposed-development-no-gold-model-or-score",
               "prior_seal_sha256": PINS[PRIOR],
               "r8_worker_sha256": PINS[R8 / "ranked_source_worker_r7.py"],
               "r8_core_sha256": PINS[R8 / "ranked_source_hints_r8.py"],
               "script_sha256": sha(Path(__file__)),
               "fixed_rule": "issue first 1024 UTF-8 bytes; first three distinct undelivered paths among r8's first five returned windows; no replacement",
               "rows": rows,
               "summary": {"tasks": 12, "proposals": sum(len(row["new_proposals"]) for row in rows),
                           "max_elapsed_seconds": max(row["elapsed_seconds"] for row in rows),
                           "max_rss_kib": max(row["max_rss_kib"] for row in rows),
                           "model_calls": 0, "gold_loaded": False},
               "claim_ceiling": "Source-only G02 exposed development transfer proposal; no actual ARE read, native F1, cost comparison or superiority",
               "open_questions": ["Do sealed proposals hit previously undelivered gold files?",
                                  "Would actual reads improve native Span-F1 and all-in cost on untouched tasks?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode("utf-8")
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"kind": "summary", **receipt["summary"],
                      "receipt_sha256": hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"kind": "failure", "error": str(error)}, sort_keys=True), file=sys.stderr)
        raise SystemExit(2)
