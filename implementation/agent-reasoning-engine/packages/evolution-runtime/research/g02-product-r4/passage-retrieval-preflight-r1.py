#!/usr/bin/env python3
"""Seal source-only passage-BM25 file rankings for exposed G02 r3 roots.

No native gold, DSH output, or score file is read. This is a retrieval diagnostic,
not a prediction rewrite or a live ARE run.
"""

import argparse
import hashlib
import json
import math
import re
import subprocess
from collections import Counter
from pathlib import Path


EXPECTED_PRIOR_SEAL_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
SOURCE_EXTS = {".c", ".cc", ".cpp", ".go", ".h", ".java", ".js", ".jsx",
               ".kt", ".py", ".rs", ".ts", ".tsx"}
STOP = set("a about after all an and are as at be been before by can do does for from have if in into is it its of on or our should that the their these this to was were what when where which while with would".split())
TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,}")
MAX_FILE_BYTES = 262144
WINDOW_LINES = 80
STRIDE_LINES = 40


def sha(data):
    return hashlib.sha256(data).hexdigest()


def terms(value):
    value = re.sub(r"([a-z])([A-Z])", r"\1 \2", value)
    return [word for word in (part.casefold() for part in TOKEN_RE.findall(value))
            if len(word) >= 3 and word not in STOP]


def rank_root(prior):
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
    query = Counter(terms(issue))
    tracked = subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0")
    corpus_digest = hashlib.sha256()
    passages = []
    indexed_files = skipped_large = 0
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
        indexed_files += 1
        lines = data.decode("utf-8", "replace").splitlines()
        path_tokens = terms(relative)
        for start in range(0, max(1, len(lines)), STRIDE_LINES):
            chunk = lines[start:start + WINDOW_LINES]
            if not chunk:
                continue
            tokens = path_tokens + terms("\n".join(chunk))
            counts = Counter(token for token in tokens if token in query)
            passages.append((relative, start + 1, counts, len(tokens)))
    if corpus_digest.hexdigest() != prior["corpus_sha256"] or indexed_files != prior["indexed_files"] or skipped_large != prior["skipped_large_files"]:
        raise ValueError("corpus identity drift")
    n = len(passages)
    df = Counter(token for _, _, counts, _ in passages for token in counts)
    avg_len = sum(length for _, _, _, length in passages) / n
    by_file = {}
    for path, line, counts, length in passages:
        score = 0.0
        for token, weight in query.items():
            frequency = counts.get(token, 0)
            if not frequency:
                continue
            idf = math.log(1 + (n - df[token] + 0.5) / (df[token] + 0.5))
            score += weight * idf * (frequency * 2.2) / (frequency + 1.2 * (0.25 + 0.75 * length / avg_len))
        current = by_file.get(path)
        if score > 0 and (current is None or score > current[0]):
            by_file[path] = (score, line)
    top30 = sorted(((score, path, line) for path, (score, line) in by_file.items()),
                   key=lambda row: (-row[0], row[1]))[:30]
    return {"instance_id": prior["instance_id"], "pair_root": str(root),
            "issue_sha256": prior["issue_sha256"], "corpus_sha256": prior["corpus_sha256"],
            "indexed_files": indexed_files, "passage_count": n,
            "delivered_paths": prior["delivered_paths"],
            "raw_top30": [item["path"] for item in prior["raw_top30"]],
            "passage_top30": [{"path": path, "score": round(score, 6), "start_line": line}
                              for score, path, line in top30]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.prior_seal.read_bytes()) != EXPECTED_PRIOR_SEAL_SHA256:
        raise SystemExit("prior source-only seal hash mismatch")
    prior = json.loads(args.prior_seal.read_text())
    if len(prior["results"]) != 12:
        raise SystemExit("unexpected denominator")
    rows = [rank_root(row) for row in prior["results"]]
    if len({row["instance_id"] for row in rows}) != 12:
        raise SystemExit("duplicate task")
    output = {"schema_version": "g02.passage-retrieval-exposed-seal/v1",
              "posture": "source-only-exposed-development-no-score",
              "prior_seal_sha256": EXPECTED_PRIOR_SEAL_SHA256,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "window_lines": WINDOW_LINES, "stride_lines": STRIDE_LINES,
              "candidate_read_budget_per_task": 3,
              "results": rows}
    with args.output.open("x") as handle:
        json.dump(output, handle, sort_keys=True, indent=2)
        handle.write("\n")
    print(json.dumps({"tasks": len(rows), "output_sha256": sha(args.output.read_bytes())}))


if __name__ == "__main__":
    main()
