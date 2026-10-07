#!/usr/bin/env python3
"""Evaluator-only r43 native-reference coverage. No paths, gold, or scores exported."""
from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

BASE = Path("/opt/are/evolution-runtime")
SOURCE = BASE / "g01-source-r13-prospective-r43"
WORKER = SOURCE / ("development/agent-reasoning-engine/planning/"
                   "representation-preferences/dual-benchmark-8k-v2/contextbench/"
                   "ranked_source_worker_r2.py")
CANDIDATE = BASE / "g01-r13-clean-cohort-candidate-r1/COHORT-CANDIDATE.json"
TRANSFER = BASE / "g01-r13-cache-transfer-r1/VERIFY.json"
PREFLIGHT = BASE / "g01-r13-r43-index-qualification-r1/SOURCE-INDEX-QUALIFICATION.json"
UPSTREAM = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"
OUTPUT = BASE / "g01-r13-r43-gold-index-coverage-r1/GOLD-INDEX-COVERAGE.json"
PINS = {
    CANDIDATE: "86b3841d0169a2b339d483aad6f0e6e5e8993980c929f11128139f4ff1e04cc5",
    TRANSFER: "11d30a85aebb31b1bb6304fb8dbe6371d9b098f02188a8052ebecbb8ceec44f5",
    PREFLIGHT: "daa451bcc0f83624905dbfbae9449dd1918953d2ca2a32a32a49b27d94e86947",
    UPSTREAM / "data/full.parquet": "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8",
}
SOURCE_SHA = "b59c8474e5a04b5b2ff2033c83ca62df8c4fa5de0d4439c176e8b6ffe12de13d"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def priority_context(statement):
    value = statement.encode("utf-8")[:1024].decode("utf-8", "replace")
    if value.endswith("\ufffd"):
        value = value[:-1]
    return value.strip()


def main():
    if OUTPUT.exists() or not OUTPUT.parent.is_dir():
        raise ValueError("fresh-exact-output-required")
    if any(sha(path) != digest for path, digest in PINS.items()):
        raise ValueError("pinned-input-drift")
    candidate, transfer, preflight = (json.loads(path.read_text()) for path in
                                      (CANDIDATE, TRANSFER, PREFLIGHT))
    if (candidate.get("status") != "preflight-only-not-frozen" or
            candidate.get("model_calls") != 0 or
            candidate.get("gold_values_or_paths_used") is not False or
            transfer.get("status") != "passed" or
            transfer.get("candidate_sha256") != PINS[CANDIDATE] or
            preflight.get("status") != "source-index-qualified-not-campaign-frozen" or
            preflight.get("source_tree_sha256") != SOURCE_SHA or
            preflight.get("candidate_sha256") != PINS[CANDIDATE] or
            preflight.get("transfer_sha256") != PINS[TRANSFER] or
            preflight.get("model_calls") != 0 or preflight.get("gold_loaded") is not False or
            len(candidate["ordered_tasks"]) != 24):
        raise ValueError("source-preflight-binding")
    by_cache = {row["instance_id"]: row for row in transfer["verified_task_bindings"]}
    by_index = {row["instance_id"]: row for row in preflight["result"]["results"]}
    if len(by_cache) != 24 or len(by_index) != 24:
        raise ValueError("task-binding-count")
    spec = importlib.util.spec_from_file_location("g01_r43_worker", WORKER)
    worker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(worker)
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path
    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    for task in candidate["ordered_tasks"]:
        identifier = task["instance_id"]
        cache, index = by_cache[identifier], by_index[identifier]
        if (cache["origin"] != task["repo_url"] or
                cache["base_commit"] != task["base_commit"] or
                index["status"] != "passed" or
                index["base_commit"] != task["base_commit"] or
                index["repository_path"] != cache["repository_path"]):
            raise ValueError("task-index-cache-binding")
        report = worker.run_index({"repository": cache["repository_path"],
                                   "base_commit": task["base_commit"], "query": "",
                                   "index_context": priority_context(task["problem_statement"]),
                                   "source_language": task["language"]})
        if report["ok"] is not True or report["result"] is None:
            rows.append({"instance_id": identifier, "repo": task["repo"],
                         "language": task["language"], "status": "worker-unavailable",
                         "error_code": "ranked-worker-unavailable"})
            continue
        value = report["result"]
        if (value["index_digest"] != index["index_digest"] or
                value["base_commit"] != task["base_commit"] or
                value["manifest"]["priority"]["version"] != "issue-overlap-source-suffix-r1"):
            raise ValueError("source-index-digest-drift")
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
        if gold is None or gold.commit != task["base_commit"] or gold._data["language"] != task["language"]:
            raise ValueError("gold-identity-drift")
        paths = {_normalize_rel_path(item.get("file", "")) for item in gold.init + gold.add}
        if not paths or any(not path or path.startswith("/") or ".." in Path(path).parts for path in paths):
            raise ValueError("invalid-gold-path")
        statuses = Counter(manifest.get(path, ("absent", None))[0] for path in paths)
        reasons = Counter(manifest.get(path, ("absent", "absent"))[1]
                          for path in paths if manifest.get(path, ("absent", None))[0] != "admitted")
        if set(statuses) - {"admitted", "excluded", "absent"}:
            raise ValueError("manifest-status-shape")
        rows.append({"instance_id": identifier, "repo": task["repo"], "language": task["language"],
                     "status": "audited", "gold_file_count": len(paths),
                     "admitted_gold_files": statuses["admitted"],
                     "excluded_gold_files": statuses["excluded"],
                     "absent_gold_files": statuses["absent"],
                     "exclusion_reasons": dict(reasons), "index_digest_matches": True})
    audited = [row for row in rows if row["status"] == "audited"]
    by_language = defaultdict(Counter)
    for row in audited:
        group = by_language[row["language"]]
        group["tasks"] += 1
        group["gold_files"] += row["gold_file_count"]
        group["admitted"] += row["admitted_gold_files"]
        group["excluded"] += row["excluded_gold_files"]
        group["absent"] += row["absent_gold_files"]
    summary = {"tasks": len(rows), "audited": len(audited),
               "worker_unavailable": len(rows) - len(audited),
               "gold_files": sum(row["gold_file_count"] for row in audited),
               "admitted": sum(row["admitted_gold_files"] for row in audited),
               "excluded": sum(row["excluded_gold_files"] for row in audited),
               "absent": sum(row["absent_gold_files"] for row in audited),
               "by_language": {key: dict(value) for key, value in sorted(by_language.items())}}
    status = ("passed" if summary["audited"] == 24 and
              summary["admitted"] == summary["gold_files"] and
              summary["excluded"] == summary["absent"] == 0 else "failed")
    receipt = {"schema_version": "are.g01-r13-r43-gold-index-coverage/v1",
               "status": status, "posture": "evaluator-only-no-model-no-scores",
               "candidate_sha256": PINS[CANDIDATE], "transfer_sha256": PINS[TRANSFER],
               "preflight_sha256": PINS[PREFLIGHT], "source_tree_sha256": SOURCE_SHA,
               "worker_sha256": sha(WORKER), "hints_sha256": sha(WORKER.with_name("ranked_source_hints_r3.py")),
               "gold_parquet_sha256": PINS[UPSTREAM / "data/full.parquet"],
               "script_sha256": sha(Path(__file__)), "rows": rows, "summary": summary,
               "gold_paths_or_content_exported": False, "model_calls": 0,
               "claim_ceiling": "Evaluator-only native-reference/index coverage; no campaign freeze, model quality, or superiority",
               "open_questions": ["Can a separate r13 r2 replacement pass all admission and storage gates?"]}
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write((json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"status": status, "summary": summary, "receipt_sha256": sha(OUTPUT)}, sort_keys=True))
    if status != "passed":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
