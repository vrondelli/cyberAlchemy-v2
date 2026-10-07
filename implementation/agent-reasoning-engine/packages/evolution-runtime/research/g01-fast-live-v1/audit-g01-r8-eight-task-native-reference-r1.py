#!/usr/bin/env python3
"""Score-free native-reference admission for the eight-task r8 development set.

Gold file paths are used only in memory for membership checks. Stdout contains
counts and status, never gold paths, spans, answers, or model output.
"""

from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import pyarrow.parquet as parquet


HERE = Path(__file__).resolve().parent
CAPACITY = HERE / "source-index-capacity-r8"
sys.path.insert(0, str(CAPACITY))
from ranked_source_worker_r7 import run_index  # noqa: E402

CANDIDATE = HERE / "g01-r8-eight-task-transfer-r1/CANDIDATE.json"
PREFLIGHT = HERE / "g01-r8-eight-task-transfer-r1/INDEX-PREFLIGHT.json"
PARQUET = Path("/home/vlad_/are-benchmark-archive/g01-r8-eight-task-evaluator-r1/full.parquet")
CACHES = Path("/home/vlad_/are-benchmark-archive/g01-r8-eight-task-caches-r1")
PINS = {
    CANDIDATE: "a134c8f7df6f4165c4053576365ccfb03d2c8b2c2d57d7dcf1a21848ec3bc0a2",
    PREFLIGHT: "8cbd61dbb4fca0891c7cef781c1c0ddfacc09be7a4021c6b59a66d3aee3def7e",
    PARQUET: "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8",
    CAPACITY / "ranked_source_worker_r7.py": "b06d6a4d2291a96a3d51978058ca6c4b53208c4882780dd7dd629149604dfb6a",
    CAPACITY / "ranked_source_hints_r8.py": "e934ac458c1566fe0e7483dd9107d2cef5a98aa4df0662b73f6c23fb0afa88d1",
}


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalize_rel_path(path):
    """Match the pinned ContextBench GoldLoader path normalization."""
    if not path:
        return ""
    path = path.replace("\\", "/")
    if path.startswith("/testbed/"):
        return path[len("/testbed/"):]
    if path.startswith("/workspace/"):
        rest = path[len("/workspace/"):]
        pieces = rest.split("/", 1)
        return pieces[1] if len(pieces) == 2 else pieces[0]
    if path.startswith("/"):
        return path.lstrip("/")
    return path.lstrip("./")


def git(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], check=True,
                            capture_output=True, text=True, timeout=10)
    return result.stdout.strip()


def main():
    if sys.argv[1:]:
        raise ValueError("arguments-not-supported")
    for path, pinned in PINS.items():
        if sha(path) != pinned:
            raise ValueError("pinned-input-drift:" + path.name)
    candidate = json.loads(CANDIDATE.read_text(encoding="utf-8"))
    preflight = json.loads(PREFLIGHT.read_text(encoding="utf-8"))
    tasks = candidate["selected"]
    if (candidate["schema_version"] != "are.g01-r8-eight-task-development-transfer-candidate/v1"
            or candidate["status"] != "source-only-not-frozen"
            or candidate["model_calls"] != 0
            or candidate["gold_values_or_paths_used"] is not False
            or candidate["reserved_confirmation_opened"] is not False
            or len(tasks) != 8 or len({t["instance_id"] for t in tasks}) != 8
            or preflight["status"] != "passed-local-source-only"
            or preflight["candidate_sha256"] != PINS[CANDIDATE]
            or preflight["passed"] != 8 or preflight["failed"] != 0
            or preflight["model_calls"] != 0 or preflight["gold_loaded"] is not False):
        raise ValueError("source-preflight-binding")
    indexes = {row["instance_id"]: row for row in preflight["tasks"]}
    if len(indexes) != 8 or set(indexes) != {t["instance_id"] for t in tasks}:
        raise ValueError("preflight-task-set")
    table = parquet.read_table(PARQUET, columns=["instance_id", "repo_url", "base_commit",
                                                "language", "gold_context"]).to_pylist()
    gold = {row["instance_id"]: row for row in table}
    if len(gold) != len(table):
        raise ValueError("duplicate-evaluator-id")
    rows = []
    for task in tasks:
        identifier = task["instance_id"]
        reference = gold.get(identifier)
        if (reference is None or reference["repo_url"] != task["repo_url"]
                or reference["base_commit"] != task["base_commit"]
                or reference["language"] != task["language"]):
            raise ValueError("evaluator-identity-drift:" + identifier)
        cache = CACHES / (task["repo"].replace("/", "--") + ".git")
        if (cache.resolve() != cache or not cache.is_dir()
                or git(cache, "rev-parse", "--is-bare-repository") != "true"
                or git(cache, "config", "--get", "remote.origin.url") != task["repo_url"]
                or git(cache, "rev-parse", "--verify", task["base_commit"] + "^{commit}")
                != task["base_commit"]):
            raise ValueError("cache-binding:" + identifier)
        outcome = run_index({"repository": str(cache), "base_commit": task["base_commit"],
                             "query": ""})
        value = outcome.get("result")
        if (outcome.get("ok") is not True or not value
                or value["index_digest"] != indexes[identifier]["index_digest"]
                or value["base_commit"] != task["base_commit"]
                or value["model_calls"] != 0
                or not outcome["settlement"]["process_group_absent"]
                or outcome["settlement"]["forced"]):
            raise ValueError("index-binding:" + identifier)
        manifest = {}
        for entry in value["manifest"]["entries"]:
            try:
                path = bytes.fromhex(entry["path_hex"]).decode("utf-8")
            except (ValueError, UnicodeDecodeError):
                continue
            if path in manifest:
                raise ValueError("duplicate-manifest-path:" + identifier)
            manifest[path] = (entry["status"], entry.get("reason"))
        annotations = json.loads(reference["gold_context"])
        if not isinstance(annotations, list):
            raise ValueError("gold-context-shape:" + identifier)
        paths = {normalize_rel_path(item.get("file", "")) for item in annotations
                 if isinstance(item, dict)}
        if (not paths or "" in paths or any(p.startswith("/") or ".." in Path(p).parts
                                            for p in paths)):
            raise ValueError("unsafe-gold-path:" + identifier)
        statuses = Counter(manifest.get(path, ("absent", None))[0] for path in paths)
        reasons = Counter(manifest.get(path, ("absent", "absent"))[1] for path in paths
                          if manifest.get(path, ("absent", None))[0] != "admitted")
        if set(statuses) - {"admitted", "excluded", "absent"}:
            raise ValueError("manifest-status-shape:" + identifier)
        rows.append({"instance_id": identifier, "language": task["language"],
                     "gold_file_count": len(paths), "admitted": statuses["admitted"],
                     "excluded": statuses["excluded"], "absent": statuses["absent"],
                     "exclusion_reasons": dict(sorted(reasons.items())),
                     "index_digest_matches_preflight": True})
        print(json.dumps({"kind": "task", **rows[-1]}, sort_keys=True), flush=True)
    summary = {"tasks": len(rows), "gold_files": sum(r["gold_file_count"] for r in rows),
               "admitted": sum(r["admitted"] for r in rows),
               "excluded": sum(r["excluded"] for r in rows),
               "absent": sum(r["absent"] for r in rows)}
    receipt = {"schema_version": "are.g01-r8-eight-task-native-reference-audit/v1",
               "status": "passed" if summary["tasks"] == 8 and summary["admitted"] == summary["gold_files"]
               and summary["excluded"] == summary["absent"] == 0 else "failed",
               "posture": "evaluator-only-no-model-no-scores", "inputs_sha256":
               {path.name: digest for path, digest in PINS.items()},
               "script_sha256": sha(Path(__file__)), "rows": rows, "summary": summary,
               "gold_paths_or_content_exported": False, "model_calls": 0,
               "claim_ceiling": "Eight-task development native-reference admission only; no freeze, live score, 24-pair campaign or superiority",
               "open_questions": ["Can an actual-layout VPS rehearsal clear capacity and deadline gates?",
                                  "What independent population can support a fresh 24-pair G01 claim?"]}
    print(json.dumps({"kind": "receipt", **receipt}, sort_keys=True), flush=True)
    return 0 if receipt["status"] == "passed" else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"kind": "failure", "error": str(error)}, sort_keys=True), file=sys.stderr)
        raise SystemExit(2)
