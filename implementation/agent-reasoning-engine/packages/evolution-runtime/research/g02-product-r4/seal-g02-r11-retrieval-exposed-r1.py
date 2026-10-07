#!/usr/bin/env python3
"""Seal the pre-existing BM25 retrieval rule on the 12 exposed G02 r11 pairs.

This reads issues, base source, and ARE-delivered file paths only. It never
opens native gold, DSH predictions, or scores. The fixed candidate budget is
three new file reads per task; this is a diagnostic, not a campaign amendment.
"""

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
from collections import Counter
from pathlib import Path


RANKER_SHA256 = "58838344fd19274387440748122e7e3086590304eb53dec8ecab3def4bfa8eed"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.ranker.read_bytes()) != RANKER_SHA256:
        raise SystemExit("ranker source drift")
    spec = importlib.util.spec_from_file_location("fixed_retrieval", args.ranker)
    ranker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ranker)
    rows = []
    for ordinal in range(1, 13):
        root = args.archive / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
        tasks = list((root / "tasks").glob("*.json"))
        tasks = [path for path in tasks if path.name != "binding.json"]
        if len(tasks) != 1:
            raise ValueError(f"task count at {ordinal}")
        task = json.loads(tasks[0].read_text())
        prediction = json.loads((root / "evidence/run/prediction.json").read_text())
        if task["instance_id"] != prediction["instance_id"]:
            raise ValueError(f"instance mismatch at {ordinal}")
        base = root / "sources/session/base"
        git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
        head = subprocess.check_output(git + ["rev-parse", "HEAD"], text=True).strip()
        if head != task["base_commit"]:
            raise ValueError(f"base commit mismatch at {ordinal}")
        issue = task["problem_statement"]
        tracked = subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0")
        corpus = hashlib.sha256()
        documents = []
        skipped_large = 0
        for raw_path in tracked:
            if not raw_path:
                continue
            relative = raw_path.decode("utf-8", "surrogateescape")
            if Path(relative).suffix.casefold() not in ranker.SOURCE_EXTS:
                continue
            source = base / relative
            if not source.is_file() or source.is_symlink():
                continue
            data = source.read_bytes()
            corpus.update(raw_path + b"\0" + hashlib.sha256(data).digest())
            if len(data) > ranker.MAX_FILE_BYTES:
                skipped_large += 1
                continue
            tokens = ranker.terms(relative + " " + data.decode("utf-8", "replace"))
            documents.append((relative, Counter(tokens), len(tokens)))
        raw_query = Counter(ranker.terms(issue))
        structured_query = Counter(token for match in ranker.CODE_RE.finditer(issue)
                                   for token in ranker.terms(match.group(0)))
        for token, count in raw_query.items():
            structured_query[token] += min(count, 2) * 0.25
        delivered = sorted({path for step in prediction["traj_data"]["pred_steps"]
                            for path in step["files"]})
        raw_top30 = ranker.rank(documents, raw_query)
        structured_top30 = ranker.rank(documents, structured_query)
        rows.append({"ordinal": ordinal, "instance_id": task["instance_id"],
                     "source": task["source"], "repo": task["repo"],
                     "base_commit": head, "issue_sha256": sha(issue.encode()),
                     "corpus_sha256": corpus.hexdigest(), "indexed_files": len(documents),
                     "skipped_large_files": skipped_large, "delivered_paths": delivered,
                     "raw_top30": raw_top30, "structured_top30": structured_top30,
                     "raw_new3": [item["path"] for item in raw_top30
                                  if item["path"] not in delivered][:3],
                     "structured_new3": [item["path"] for item in structured_top30
                                         if item["path"] not in delivered][:3]})
    if len({row["instance_id"] for row in rows}) != 12:
        raise ValueError("duplicate instance")
    output = {"schema_version": "g02.r11-retrieval-exposed-seal/v1",
              "posture": "source-only-exposed-development-no-gold-dsh-or-score",
              "archive": str(args.archive.resolve()),
              "script_sha256": sha(Path(__file__).read_bytes()),
              "ranker_sha256": RANKER_SHA256,
              "fixed_new_read_budget": 3,
              "rows": rows,
              "claim_ceiling": "Source-only diagnostic; no delivered reads, native F1, cost, or superiority claim."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"tasks": len(rows), "ranked": sum(len(row["raw_top30"]) for row in rows),
                      "seal_sha256": sha(data)}))


if __name__ == "__main__":
    main()
