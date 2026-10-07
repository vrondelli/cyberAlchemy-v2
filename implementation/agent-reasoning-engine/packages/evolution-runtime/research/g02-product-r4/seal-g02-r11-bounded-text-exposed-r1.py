#!/usr/bin/env python3
"""Transfer the pre-existing bounded-text BM25 corpus rule to exposed r11."""

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
from collections import Counter
from pathlib import Path


PRIOR_SEAL_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
PRIOR_RULE_SHA256 = "a39eff11ae5ae29e18ca7e5594a7273520a7f40f2e24d76f3b8d00d9b9e79eea"
RANKER_SHA256 = "58838344fd19274387440748122e7e3086590304eb53dec8ecab3def4bfa8eed"
MAX_FILE_BYTES = 262144


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("prior_rule", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if (sha(args.prior_seal.read_bytes()) != PRIOR_SEAL_SHA256 or
            sha(args.prior_rule.read_bytes()) != PRIOR_RULE_SHA256 or
            sha(args.ranker.read_bytes()) != RANKER_SHA256):
        raise SystemExit("fixed source input drift")
    spec = importlib.util.spec_from_file_location("fixed_file_bm25", args.ranker)
    old = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(old)
    prior = json.loads(args.prior_seal.read_text())
    if len(prior["rows"]) != 12 or prior["schema_version"] != "g02.r11-retrieval-exposed-seal/v1":
        raise SystemExit("unexpected exposed cohort")
    rows = []
    for source_row in prior["rows"]:
        ordinal = source_row["ordinal"]
        root = Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
        base = root / "sources/session/base"
        task_files = [path for path in (root / "tasks").glob("*.json") if path.name != "binding.json"]
        if len(task_files) != 1:
            raise ValueError(f"task count at {ordinal}")
        task = json.loads(task_files[0].read_text())
        issue = task["problem_statement"]
        if task["instance_id"] != source_row["instance_id"] or sha(issue.encode()) != source_row["issue_sha256"]:
            raise ValueError(f"task identity drift at {ordinal}")
        git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
        if subprocess.check_output(git + ["rev-parse", "HEAD"], text=True).strip() != source_row["base_commit"]:
            raise ValueError(f"base commit drift at {ordinal}")
        tracked = subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0")
        documents = []
        counters = Counter()
        digest = hashlib.sha256()
        for raw_path in tracked:
            if not raw_path:
                continue
            relative = raw_path.decode("utf-8", "surrogateescape")
            source = base / relative
            if not source.is_file() or source.is_symlink():
                counters["non_regular"] += 1
                continue
            data = source.read_bytes()
            digest.update(raw_path + b"\0" + hashlib.sha256(data).digest())
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
        ranked = old.rank(documents, Counter(old.terms(issue)))
        delivered = set(source_row["delivered_paths"])
        rows.append({"ordinal": ordinal, "instance_id": source_row["instance_id"],
                     "source": source_row["source"], "repo": source_row["repo"],
                     "base_commit": source_row["base_commit"], "issue_sha256": source_row["issue_sha256"],
                     "tracked_regular_corpus_sha256": digest.hexdigest(),
                     "indexed_files": len(documents), "skipped": dict(sorted(counters.items())),
                     "delivered_paths": source_row["delivered_paths"],
                     "bounded_text_top30": ranked,
                     "bounded_text_new3": [item["path"] for item in ranked
                                           if item["path"] not in delivered][:3]})
    output = {"schema_version": "g02.r11-bounded-text-exposed-seal/v1",
              "posture": "source-only-exposed-development-no-gold-dsh-or-score",
              "prior_seal_sha256": PRIOR_SEAL_SHA256,
              "prior_rule_sha256": PRIOR_RULE_SHA256,
              "ranker_sha256": RANKER_SHA256,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "file_policy": "tracked regular UTF-8 text, <=262144 bytes, nonempty term set",
              "fixed_new_read_budget": 3,
              "rows": rows,
              "claim_ceiling": "Source-only exposed transfer seal; no native score, cost, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"tasks": len(rows), "indexed_file_range": [min(row["indexed_files"] for row in rows),
                      max(row["indexed_files"] for row in rows)], "seal_sha256": sha(data)}))


if __name__ == "__main__":
    main()
