#!/usr/bin/env python3
"""Seal source-only features for exposed G02 r3 undelivered retrieval candidates."""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path


RANKING_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
WORD_RE = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,}")
CODE_RE = re.compile(r"`([^`\n]{3,120})`|\b[A-Za-z][A-Za-z0-9]*(?:[._/][A-Za-z][A-Za-z0-9]*)+\b")
STOP = set("a about after all an and are as at be been before by can do does for from have if in into is it its of on or our should that the their these this to was were what when where which while with would".split())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def words(value):
    value = re.sub(r"([a-z])([A-Z])", r"\1 \2", value)
    return {word for word in (item.casefold() for item in WORD_RE.findall(value))
            if len(word) >= 3 and word not in STOP}


def code_anchors(issue):
    return {match.group(1) or match.group(0) for match in CODE_RE.finditer(issue)
            if len(match.group(1) or match.group(0)) >= 5}


def prefix_depth(left, right):
    depth = 0
    for a, b in zip(left, right):
        if a != b:
            break
        depth += 1
    return depth


def features(row):
    root = Path(row["pair_root"])
    base = root / "sources/session/base"
    tasks = list((root / "tasks").glob("SWE-Bench-Pro__*.json"))
    if len(tasks) != 1:
        raise ValueError("wrong task count")
    issue = json.loads(tasks[0].read_text())["problem_statement"]
    if hashlib.sha256(issue.encode()).hexdigest() != row["issue_sha256"]:
        raise ValueError("issue drift")
    issue_words = words(issue)
    anchors = code_anchors(issue)
    delivered = set(row["delivered_paths"])
    selected = set(row["selected_paths"])
    candidates = [entry for entry in row["raw_top30"] if entry["path"] not in delivered]
    max_score = max((entry["score"] for entry in candidates), default=1.0)
    selected_parts = [Path(path).parts[:-1] for path in selected]
    output = []
    for rank, entry in enumerate(candidates, 1):
        path = entry["path"]
        source = base / path
        if source.is_symlink() or not source.is_file() or source.stat().st_size > 262144:
            raise ValueError("candidate source drift")
        body = source.read_text(errors="replace")
        path_words = words(path)
        content_words = words(body)
        same_parent = any(Path(path).parts[:-1] == parts for parts in selected_parts)
        common_depth = max((prefix_depth(Path(path).parts[:-1], parts)
                            for parts in selected_parts), default=0)
        anchor_hits = sum(re.search(r"(?<![A-Za-z0-9_])" + re.escape(anchor) +
                                    r"(?![A-Za-z0-9_])", body, re.I) is not None
                          for anchor in anchors)
        output.append({"path": path, "raw_rank": rank,
                       "features": [round(entry["score"] / max_score, 6),
                                    round(len(path_words & issue_words) / max(1, len(path_words)), 6),
                                    round(len(content_words & issue_words) / max(1, len(issue_words)), 6),
                                    round(anchor_hits / max(1, len(anchors)), 6),
                                    int(same_parent), min(common_depth, 4) / 4]})
    return {"instance_id": row["instance_id"], "pair_root": row["pair_root"],
            "issue_sha256": row["issue_sha256"], "candidates": output,
            "undelivered_top30": len(candidates)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("ranking_seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.ranking_seal) != RANKING_SHA256:
        raise SystemExit("ranking seal mismatch")
    ranking = json.loads(args.ranking_seal.read_text())
    if sha(args.ranker) != ranking["script_sha256"] or len(ranking["results"]) != 12:
        raise SystemExit("ranking provenance mismatch")
    rows = []
    for row in ranking["results"]:
        replay = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), row["pair_root"]], text=True))
        if replay != row:
            raise ValueError("source ranking replay mismatch")
        rows.append(features(row))
    if len({row["instance_id"] for row in rows}) != 12:
        raise ValueError("duplicate task")
    output = {"schema_version": "g02.cross-repo-acquisition-features/v1",
              "posture": "source-only-exposed-development-no-gold-or-score-opened",
              "ranking_seal_sha256": RANKING_SHA256,
              "ranker_sha256": ranking["script_sha256"],
              "source_script_sha256": sha(Path(__file__)),
              "feature_names": ["normalized_bm25", "issue_path_word_fraction",
                                "issue_content_word_fraction", "issue_code_anchor_fraction",
                                "same_selected_parent", "selected_directory_depth"],
              "rows": rows,
              "claim_ceiling": "Feature seal only; labels and comparator not accessed."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
    print(json.dumps({"rows": len(rows), "candidates": sum(len(row["candidates"]) for row in rows),
                      "seal_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
