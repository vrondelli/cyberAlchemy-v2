#!/usr/bin/env python3
"""Source-only G02 retrieval preflight on an already exposed pair root.

Emits rankings, not scores. Never reads native gold, DSH output, or score files.
"""

import argparse
import hashlib
import json
import math
import re
import subprocess
from collections import Counter
from pathlib import Path


SOURCE_EXTS = {".c", ".cc", ".cpp", ".go", ".h", ".java", ".js", ".jsx",
               ".kt", ".py", ".rs", ".ts", ".tsx"}
STOP = set("a about after all an and are as at be been before by can do does for from have if in into is it its of on or our should that the their these this to was were what when where which while with would".split())
MAX_FILE_BYTES = 262144
TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,}")
CODE_RE = re.compile(r"`([^`\n]{3,120})`|\b[A-Za-z][A-Za-z0-9]*(?:[._/][A-Za-z][A-Za-z0-9]*)+\b")


def terms(value):
    value = re.sub(r"([a-z])([A-Z])", r"\1 \2", value)
    return [word for word in (part.casefold() for part in TOKEN_RE.findall(value))
            if len(word) >= 3 and word not in STOP]


def read_json(path):
    return json.loads(path.read_text())


def rank(documents, query):
    n = len(documents)
    if not n:
        return []
    df = Counter(token for _, counts, _ in documents for token in counts)
    avg_len = sum(length for _, _, length in documents) / n
    scores = []
    for path, counts, length in documents:
        score = 0.0
        for token, weight in query.items():
            frequency = counts.get(token, 0)
            if not frequency:
                continue
            idf = math.log(1 + (n - df[token] + 0.5) / (df[token] + 0.5))
            score += weight * idf * (frequency * 2.2) / (frequency + 1.2 * (0.25 + 0.75 * length / avg_len))
        if score > 0:
            scores.append((score, path))
    scores.sort(key=lambda row: (-row[0], row[1]))
    return [{"path": path, "score": round(score, 6)} for score, path in scores[:30]]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pair_root", type=Path)
    args = parser.parse_args()
    root = args.pair_root.resolve()
    base = root / "sources/session/base"
    task_files = list((root / "tasks").glob("SWE-Bench-Pro__*.json"))
    if not base.is_dir() or len(task_files) != 1:
        raise SystemExit("invalid exposed pair root or task count")
    task = read_json(task_files[0])
    prediction = read_json(root / "evidence/run/prediction.json")
    issue = task["problem_statement"]
    git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
    head = subprocess.check_output(git + ["rev-parse", "HEAD"], text=True).strip()
    tracked = subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0")
    corpus_digest = hashlib.sha256()
    documents = []
    skipped_large = 0
    for raw in tracked:
        if not raw:
            continue
        relative = raw.decode("utf-8", "surrogateescape")
        if Path(relative).suffix.casefold() not in SOURCE_EXTS:
            continue
        source = base / relative
        if not source.is_file() or source.is_symlink():
            continue
        data = source.read_bytes()
        corpus_digest.update(relative.encode("utf-8", "surrogateescape") + b"\0")
        corpus_digest.update(hashlib.sha256(data).digest())
        if len(data) > MAX_FILE_BYTES:
            skipped_large += 1
            continue
        tokens = terms(relative + " " + data.decode("utf-8", "replace"))
        documents.append((relative, Counter(tokens), len(tokens)))
    raw_query = Counter(terms(issue))
    structured_query = Counter(token for match in CODE_RE.finditer(issue)
                               for token in terms(match.group(0)))
    for token, count in raw_query.items():
        structured_query[token] += min(count, 2) * 0.25
    delivered = sorted({path for step in prediction["traj_data"]["pred_steps"]
                        for path in step["files"]})
    print(json.dumps({
        "schema_version": "g02.retrieval-first-preflight/v1",
        "posture": "source-only-exposed-development-no-score",
        "pair_root": str(root),
        "instance_id": prediction["instance_id"],
        "base_commit": head,
        "issue_sha256": hashlib.sha256(issue.encode()).hexdigest(),
        "corpus_sha256": corpus_digest.hexdigest(),
        "indexed_files": len(documents),
        "skipped_large_files": skipped_large,
        "delivered_paths": delivered,
        "selected_paths": sorted(prediction["traj_data"]["pred_files"]),
        "raw_top30": rank(documents, raw_query),
        "structured_top30": rank(documents, structured_query),
    }, sort_keys=True))


if __name__ == "__main__":
    main()
