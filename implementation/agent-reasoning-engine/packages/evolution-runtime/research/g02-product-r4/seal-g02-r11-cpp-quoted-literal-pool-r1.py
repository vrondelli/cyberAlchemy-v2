#!/usr/bin/env python3
"""Source-only C++ candidate pool from issue-quoted exact code phrases."""

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path


ROOT = Path("/home/vlad_/are-benchmark-archive")
PRIOR = ROOT / "g02-r11-retrieval-exposed-r1-20261002/SEAL.json"
OUTPUT = ROOT / "g02-r11-cpp-quoted-literal-pool-r1/SOURCE-SEAL.json"
PRIOR_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
ORDINALS = [4, 8, 12]
CODE_SUFFIXES = {".h", ".hh", ".hpp", ".hxx", ".c", ".cc", ".cpp", ".cxx"}
MAX_BYTES = 262144


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def quoted_phrases(issue):
    # Keep only a code-shaped backtick phrase, not natural-language quotations.
    phrases = [text.strip() for text in re.findall(r"`([^`]+)`", issue)
               if len(text.strip()) >= 8 and any(char in text for char in (":", "_", "#"))]
    return list(dict.fromkeys(phrases))


def main():
    if OUTPUT.exists() or sha(PRIOR) != PRIOR_SHA256:
        raise ValueError("output-exists-or-prior-drift")
    prior = json.loads(PRIOR.read_text())
    by_ordinal = {row["ordinal"]: row for row in prior["rows"]}
    if len(by_ordinal) != 12 or prior["schema_version"] != "g02.r11-retrieval-exposed-seal/v1":
        raise ValueError("prior-shape")
    rows = []
    for ordinal in ORDINALS:
        source = by_ordinal[ordinal]
        if source["source"] != "Multi":
            raise ValueError("non-cpp-source")
        raw = Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
        base = raw / "sources/session/base"
        tasks = [path for path in (raw / "tasks").glob("*.json") if path.name != "binding.json"]
        if len(tasks) != 1:
            raise ValueError("task-count")
        task = json.loads(tasks[0].read_text())
        issue = task["problem_statement"]
        if (task["instance_id"] != source["instance_id"] or
                hashlib.sha256(issue.encode()).hexdigest() != source["issue_sha256"]):
            raise ValueError("issue-identity")
        git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
        head = subprocess.check_output(git + ["rev-parse", "HEAD"], text=True).strip()
        if head != source["base_commit"]:
            raise ValueError("base-commit-drift")
        tracked = [path.decode("utf-8", "surrogateescape") for path in
                   subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0") if path]
        phrases = quoted_phrases(issue)
        delivered = set(source["delivered_paths"])
        candidates = []
        code_files = 0
        skipped_large = 0
        for path in sorted(tracked):
            if Path(path).suffix.lower() not in CODE_SUFFIXES:
                continue
            file = base / path
            if not file.is_file() or file.is_symlink():
                continue
            if file.stat().st_size > MAX_BYTES:
                skipped_large += 1
                continue
            code_files += 1
            if path in delivered or not phrases:
                continue
            data = file.read_bytes().decode("utf-8", "replace")
            hits = [phrase for phrase in phrases if phrase in data]
            if hits:
                candidates.append({"path": path, "bytes": file.stat().st_size,
                                   "matched_phrases": hits})
        rows.append({"ordinal": ordinal, "instance_id": source["instance_id"],
                     "repo": source["repo"], "base_commit": source["base_commit"],
                     "issue_sha256": source["issue_sha256"],
                     "phrases": phrases, "tracked_files": len(tracked),
                     "eligible_code_files": code_files, "skipped_large_code_files": skipped_large,
                     "delivered_paths": source["delivered_paths"],
                     "candidates": candidates})
    receipt = {"schema_version": "g02.r11-cpp-quoted-literal-pool-exposed-source-seal/v1",
               "posture": "source-only-exposed-development-no-gold-model-or-score",
               "prior_seal_sha256": PRIOR_SHA256, "script_sha256": sha(Path(__file__)),
               "rule": "case-sensitive issue backtick phrase length>=8 containing colon, underscore, or hash, exact substring in tracked regular C/C++ code <=262144 bytes, excluding already delivered paths; no rank/read policy",
               "rows": rows,
               "summary": {"tasks": len(rows), "candidate_files": sum(len(row["candidates"]) for row in rows),
                           "model_calls": 0, "gold_loaded": False},
               "claim_ceiling": "Source-only candidate-pool coverage diagnostic; no selected read, native score, cost, independent cohort, or superiority."}
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"summary": receipt["summary"], "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
