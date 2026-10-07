"""Read-only exposed G01 source-index replay; prints compact parity evidence."""

import argparse
import hashlib
import json
from pathlib import Path
import sys

from ranked_source_hints_r8 import digest, encoded
from ranked_source_worker_r7 import run_index


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", type=Path, required=True)
    parser.add_argument("--repository", type=Path, required=True)
    parser.add_argument("--reference-index", type=Path, required=True)
    parser.add_argument("--query-source", choices=("task", "empty"),
                        default="task")
    args = parser.parse_args()
    task = json.loads(args.task.read_text(encoding="utf-8"))
    reference = json.loads(args.reference_index.read_text(encoding="utf-8"))
    query = task["problem_statement"] if args.query_source == "task" else ""
    if digest({"query": query}) != reference["query_result"]["query_digest"]:
        parser.error("reference query digest does not match --query-source")
    request = {"repository": str(args.repository.resolve()),
               "base_commit": task["base_commit"],
               "query": query}
    outcome = run_index(request)
    current = outcome["result"]
    identity_equal = bool(current and reference["base_commit"] == current["base_commit"]
                          == task["base_commit"] and
                          reference["index_digest"] == current["index_digest"])
    full_equal = bool(current and
                      reference["manifest"] == current["manifest"] and
                      reference["query_result"] == current["query_result"])
    projection = ({"manifest": current["manifest"],
                   "query_result": current["query_result"]} if current else None)
    report = {"schema": "g01.exposed-index-r8-probe/v1",
              "task_id": task["instance_id"],
              "task_sha256": hashlib.sha256(args.task.read_bytes()).hexdigest(),
              "reference_sha256": hashlib.sha256(args.reference_index.read_bytes()).hexdigest(),
              "query_source": args.query_source,
              "ok": outcome["ok"] and identity_equal and full_equal,
              "worker_ok": outcome["ok"], "worker_error": outcome["error"],
              "identity_equal": identity_equal, "full_output_equal": full_equal,
              "projection_sha256": hashlib.sha256(encoded(projection)).hexdigest()
              if projection else None,
              "elapsed_seconds": outcome["elapsed_seconds"],
              "max_rss_kib": current["max_rss_kib"] if current else None,
              "git_blob_requests": current["git_blob_requests"] if current else None,
              "settlement": outcome["settlement"]}
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
