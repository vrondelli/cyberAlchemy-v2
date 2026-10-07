#!/usr/bin/env python3
"""Supplemental evaluator-only TS coverage after a failed full r43 audit."""
from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

BASE = Path("/opt/are/evolution-runtime")
CANDIDATE = BASE / "g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json"
TRANSFER = BASE / "g01-r13-cache-transfer-r1/VERIFY.json"
PREFLIGHT = BASE / "g01-r13-r43-index-qualification-r1/SOURCE-INDEX-QUALIFICATION.json"
FAILED = BASE / "g01-r13-r43-gold-index-coverage-r1/GOLD-INDEX-COVERAGE.json"
DIAGNOSIS = BASE / "g01-r13-r43-ts-worker-diagnosis-r1/DIAGNOSIS.json"
WORKER = BASE / ("g01-source-r13-prospective-r43/development/agent-reasoning-engine/"
                 "planning/representation-preferences/dual-benchmark-8k-v2/"
                 "contextbench/ranked_source_worker_r2.py")
UPSTREAM = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"
OUTPUT = BASE / "g01-r13-r43-ts-gold-coverage-r1/TS-GOLD-COVERAGE.json"
PINS = {
    CANDIDATE: "86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5",
    TRANSFER: "11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5",
    PREFLIGHT: "daa451bcc0f83624905dbfbae9449dd1918953d2ca2a32a32a49b27d94e86947",
    FAILED: "61c2e8282810a111681836c3e08404cd877981d3731cf172eab0558da5372811",
    DIAGNOSIS: "d5460e9417f4dcaccf9a552ed99fadeef027b8d826400a3ae77c59d1e4e98540",
    UPSTREAM / "data/full.parquet": "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def context(statement):
    value = statement.encode("utf-8")[:1024].decode("utf-8", "replace")
    if value.endswith("\ufffd"):
        value = value[:-1]
    return value.strip()


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir():
        raise ValueError("fresh-exact-output-required")
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError("pinned-input-drift")
    candidate = json.loads(CANDIDATE.read_text())
    transfer = json.loads(TRANSFER.read_text())
    preflight = json.loads(PREFLIGHT.read_text())
    failed = json.loads(FAILED.read_text())
    diagnosis = json.loads(DIAGNOSIS.read_text())
    if (failed["summary"]["worker_unavailable"] != 2 or
            failed["summary"]["excluded"] != 3 or
            failed["summary"]["absent"] != 0 or
            len(diagnosis["results"]) != 2 or
            any(not row["ok"] for row in diagnosis["results"])):
        raise ValueError("prior-audit-shape")
    by_cache = {row["instance_id"]: row for row in transfer["verified_task_bindings"]}
    by_index = {row["instance_id"]: row for row in preflight["result"]["results"]}
    by_diagnosis = {row["instance_id"]: row for row in diagnosis["results"]}
    targets = [task for task in candidate["ordered_tasks"] if task["language"] == "typescript"]
    if len(targets) != 2 or {task["instance_id"] for task in targets} != set(by_diagnosis):
        raise ValueError("target-identity")
    spec = importlib.util.spec_from_file_location("g01_r43_worker", WORKER)
    worker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(worker)
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    for task in targets:
        identifier = task["instance_id"]
        cache, index = by_cache[identifier], by_index[identifier]
        if cache["base_commit"] != task["base_commit"] or index["status"] != "passed":
            raise ValueError("source-binding")
        report = worker.run_index({"repository": cache["repository_path"],
                                   "base_commit": task["base_commit"], "query": "",
                                   "index_context": context(task["problem_statement"]),
                                   "source_language": "typescript"})
        if not report["ok"]:
            rows.append({"instance_id": identifier, "status": "worker-unavailable",
                         "error": report["error"], "elapsed_seconds": report["elapsed_seconds"]})
            continue
        value = report["result"]
        if value["index_digest"] != index["index_digest"] or value["index_digest"] != by_diagnosis[identifier]["index_digest"]:
            raise ValueError("index-digest-drift")
        manifest = {}
        for entry in value["manifest"]["entries"]:
            try:
                path = bytes.fromhex(entry["path_hex"]).decode("utf-8")
            except (ValueError, UnicodeDecodeError):
                continue
            if path in manifest:
                raise ValueError("duplicate-manifest-path")
            manifest[path] = (entry["status"], entry["reason"])
        gold = loader.get(identifier)
        if gold is None or gold.commit != task["base_commit"] or gold._data["language"] != "typescript":
            raise ValueError("gold-identity-drift")
        paths = {_normalize_rel_path(item.get("file", "")) for item in gold.init + gold.add}
        if not paths or any(not path or path.startswith("/") or ".." in Path(path).parts for path in paths):
            raise ValueError("invalid-gold-path")
        statuses = Counter(manifest.get(path, ("absent", None))[0] for path in paths)
        reasons = Counter(manifest.get(path, ("absent", "absent"))[1]
                          for path in paths if manifest.get(path, ("absent", None))[0] != "admitted")
        rows.append({"instance_id": identifier, "status": "audited",
                     "gold_file_count": len(paths), "admitted": statuses["admitted"],
                     "excluded": statuses["excluded"], "absent": statuses["absent"],
                     "exclusion_reasons": dict(reasons), "index_digest_matches": True})
    status = "passed" if len(rows) == 2 and all(
        row["status"] == "audited" and row["admitted"] == row["gold_file_count"]
        for row in rows) else "failed"
    receipt = {"schema_version": "are.g01-r13-r43-ts-gold-coverage/v1",
               "status": status, "posture": "supplemental-evaluator-only-no-model",
               "source_preflight_sha256": PINS[PREFLIGHT],
               "failed_full_audit_sha256": PINS[FAILED],
               "diagnosis_sha256": PINS[DIAGNOSIS],
               "worker_sha256": sha(WORKER), "script_sha256": sha(Path(__file__)),
               "rows": rows, "model_calls": 0, "gold_paths_or_content_exported": False,
               "claim_ceiling": "Supplemental exposed TS coverage only; does not turn failed full audit into a pass"}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"status": status, "admitted": sum(row.get("admitted", 0) for row in rows),
                      "gold_files": sum(row.get("gold_file_count", 0) for row in rows),
                      "receipt_sha256": sha(OUTPUT)}, sort_keys=True))
    if status != "passed":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
