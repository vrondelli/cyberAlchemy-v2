#!/usr/bin/env python3
"""Source-only replay of the two r43 TypeScript worker failures."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path

BASE = Path("/opt/are/evolution-runtime")
CANDIDATE = BASE / "g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json"
TRANSFER = BASE / "g01-r13-cache-transfer-r1/VERIFY.json"
WORKER = BASE / ("g01-source-r13-prospective-r43/development/agent-reasoning-engine/"
                 "planning/representation-preferences/dual-benchmark-8k-v2/"
                 "contextbench/ranked_source_worker_r2.py")
OUTPUT = BASE / "g01-r13-r43-ts-worker-diagnosis-r1/DIAGNOSIS.json"
PINS = {
    CANDIDATE: "86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5",
    TRANSFER: "11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def priority_context(statement):
    value = statement.encode("utf-8")[:1024].decode("utf-8", "replace")
    if value.endswith("\ufffd"):
        value = value[:-1]
    return value.strip()


def main():
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError("pinned-input-drift")
    candidate = json.loads(CANDIDATE.read_text())
    transfer = json.loads(TRANSFER.read_text())
    by_cache = {row["instance_id"]: row for row in transfer["verified_task_bindings"]}
    spec = importlib.util.spec_from_file_location("g01_r43_worker", WORKER)
    worker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(worker)
    results = []
    for task in candidate["ordered_tasks"]:
        if task["language"] != "typescript":
            continue
        report = worker.run_index({
            "repository": by_cache[task["instance_id"]]["repository_path"],
            "base_commit": task["base_commit"], "query": "",
            "index_context": priority_context(task["problem_statement"]),
            "source_language": task["language"]})
        results.append({"instance_id": task["instance_id"], "ok": report["ok"],
                        "error": report["error"], "stderr_bytes": report["stderr_bytes"],
                        "elapsed_seconds": report["elapsed_seconds"],
                        "settlement": report["settlement"],
                        "index_digest": report["result"]["index_digest"] if report["ok"] else None})
    receipt = {"schema_version": "are.g01-r43-ts-worker-diagnosis/v1",
               "model_calls": 0, "gold_loaded": False,
               "worker_sha256": sha(WORKER), "results": results}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"ok": sum(row["ok"] for row in results), "count": len(results),
                      "errors": [row["error"] for row in results if not row["ok"]],
                      "receipt_sha256": sha(OUTPUT)}, sort_keys=True))


if __name__ == "__main__":
    main()
