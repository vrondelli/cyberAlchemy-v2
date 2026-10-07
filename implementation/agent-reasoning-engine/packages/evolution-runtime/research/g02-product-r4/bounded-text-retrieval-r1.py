#!/usr/bin/env python3
"""Source-only G02 retrieval over all bounded tracked UTF-8 text files.

The file type rule is generic and fixed before evaluator-only scoring. No gold,
DSH output, or native score is read here.
"""

import argparse
import hashlib
import importlib.util
import json
import subprocess
from collections import Counter
from pathlib import Path


EXPECTED_PRIOR_SEAL_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
EXPECTED_OLD_RANKER_SHA256 = "58838344fd19274387440748122e7e3086590304eb53dec8ecab3def4bfa8eed"
MAX_FILE_BYTES = 262144


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_ranker(path):
    if sha(path.read_bytes()) != EXPECTED_OLD_RANKER_SHA256:
        raise ValueError("old ranker hash mismatch")
    spec = importlib.util.spec_from_file_location("old_file_bm25", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def rank_root(prior, old):
    root = Path(prior["pair_root"])
    base = root / "sources/session/base"
    task_files = list((root / "tasks").glob("SWE-Bench-Pro__*.json"))
    if len(task_files) != 1 or not base.is_dir():
        raise ValueError("bad exposed root")
    issue = json.loads(task_files[0].read_text())["problem_statement"]
    if sha(issue.encode()) != prior["issue_sha256"]:
        raise ValueError("issue identity drift")
    git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
    if subprocess.check_output(git + ["rev-parse", "HEAD"], text=True).strip() != prior["base_commit"]:
        raise ValueError("base commit drift")
    tracked = subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0")
    documents = []
    counters = Counter()
    digest = hashlib.sha256()
    for raw in tracked:
        if not raw:
            continue
        relative = raw.decode("utf-8", "surrogateescape")
        source = base / relative
        if not source.is_file() or source.is_symlink():
            counters["non_regular"] += 1
            continue
        data = source.read_bytes()
        digest.update(relative.encode("utf-8", "surrogateescape") + b"\0")
        digest.update(hashlib.sha256(data).digest())
        if len(data) > MAX_FILE_BYTES:
            counters["over_size_cap"] += 1
            continue
        if b"\0" in data:
            counters["binary_nul"] += 1
            continue
        try:
            decoded = data.decode("utf-8")
        except UnicodeDecodeError:
            counters["non_utf8"] += 1
            continue
        tokens = old.terms(relative + " " + decoded)
        if not tokens:
            counters["no_terms"] += 1
            continue
        documents.append((relative, Counter(tokens), len(tokens)))
    old_query = Counter(old.terms(issue))
    ranked = old.rank(documents, old_query)
    return {"instance_id": prior["instance_id"], "pair_root": str(root),
            "issue_sha256": prior["issue_sha256"], "base_commit": prior["base_commit"],
            "tracked_regular_corpus_sha256": digest.hexdigest(),
            "indexed_files": len(documents), "skipped": dict(sorted(counters.items())),
            "delivered_paths": prior["delivered_paths"],
            "code_only_top30": [item["path"] for item in prior["raw_top30"]],
            "bounded_text_top30": ranked}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("old_ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.prior_seal.read_bytes()) != EXPECTED_PRIOR_SEAL_SHA256:
        raise SystemExit("prior source-only seal hash mismatch")
    old = load_ranker(args.old_ranker)
    prior = json.loads(args.prior_seal.read_text())
    if len(prior["results"]) != 12 or prior["script_sha256"] != EXPECTED_OLD_RANKER_SHA256:
        raise SystemExit("unexpected source-only denominator")
    rows = [rank_root(row, old) for row in prior["results"]]
    if len({row["instance_id"] for row in rows}) != 12:
        raise SystemExit("duplicate task")
    output = {"schema_version": "g02.bounded-text-retrieval-exposed-seal/v1",
              "posture": "source-only-exposed-development-no-score",
              "prior_seal_sha256": EXPECTED_PRIOR_SEAL_SHA256,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "old_ranker_sha256": EXPECTED_OLD_RANKER_SHA256,
              "file_policy": "tracked regular UTF-8 text, <=262144 bytes, nonempty term set",
              "candidate_read_budget_per_task": 3,
              "results": rows}
    with args.output.open("x") as handle:
        json.dump(output, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"tasks": len(rows), "indexed_file_range": [min(r["indexed_files"] for r in rows),
                      max(r["indexed_files"] for r in rows)],
                      "output_sha256": sha(args.output.read_bytes())}))


if __name__ == "__main__":
    main()
