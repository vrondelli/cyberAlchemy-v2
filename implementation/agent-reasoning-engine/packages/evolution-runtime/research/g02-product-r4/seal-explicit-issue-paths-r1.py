#!/usr/bin/env python3
"""Seal explicit issue-path acquisition on the exposed G02 r3 source cohort.

This reads only issues, tracked base files, and a replayed source-only ranking seal.
It never reads native gold, DSH, or native scores.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path


RANKING_SHA256 = "2fa8eb65ed0d6467d9738d5384746ff06c4af8a067f19897bf3cd7854405dff4"
SOURCE_EXTS = {".c", ".cc", ".cpp", ".go", ".h", ".java", ".js", ".jsx",
               ".kt", ".py", ".rs", ".ts", ".tsx"}
PATH_RE = re.compile(r"(?<![A-Za-z0-9_./-])(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+\.(?:c|cc|cpp|go|h|java|js|jsx|kt|py|rs|ts|tsx)(?![A-Za-z0-9_./-])", re.I)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def choose(row):
    root = Path(row["pair_root"])
    base = root / "sources/session/base"
    tasks = list((root / "tasks").glob("SWE-Bench-Pro__*.json"))
    if len(tasks) != 1 or not base.is_dir():
        raise ValueError("unexpected source or task count")
    issue = json.loads(tasks[0].read_text())["problem_statement"]
    if hashlib.sha256(issue.encode()).hexdigest() != row["issue_sha256"]:
        raise ValueError("issue drift")
    git = ["git", "-c", f"safe.directory={base}", "-C", str(base)]
    if subprocess.check_output(git + ["rev-parse", "HEAD"], text=True).strip() != row["base_commit"]:
        raise ValueError("base commit drift")
    tracked = {raw.decode("utf-8", "surrogateescape") for raw in
               subprocess.check_output(git + ["ls-files", "-z"]).split(b"\0") if raw}
    source_paths = {path for path in tracked if Path(path).suffix.casefold() in SOURCE_EXTS
                    and (base / path).is_file() and not (base / path).is_symlink()}
    mentioned = sorted({value.group(0).removeprefix("./") for value in PATH_RE.finditer(issue)})
    delivered = set(row["delivered_paths"])
    selected = []
    ambiguous = 0
    for mention in mentioned:
        exact = [path for path in source_paths if path.casefold() == mention.casefold()]
        suffix = [path for path in source_paths if path.casefold().endswith("/" + mention.casefold())]
        # A bare basename is accepted only when unique in the tracked tree.
        candidates = exact or suffix
        if len(candidates) != 1:
            ambiguous += 1
            continue
        path = candidates[0]
        if path not in delivered and path not in selected:
            selected.append(path)
    selected.sort()
    return {"instance_id": row["instance_id"], "pair_root": row["pair_root"],
            "issue_sha256": row["issue_sha256"], "base_commit": row["base_commit"],
            "explicit_path_mentions": len(mentioned), "ambiguous_or_unresolved_mentions": ambiguous,
            "selected_undelivered_paths": selected[:3], "overflow_count": max(0, len(selected) - 3)}


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
            raise ValueError("ranking replay mismatch")
        rows.append(choose(row))
    if len({row["instance_id"] for row in rows}) != 12:
        raise ValueError("duplicate task")
    output = {"schema_version": "g02.explicit-issue-paths-source-seal/v1",
              "posture": "source-only-exposed-development-no-gold-or-native-score-opened",
              "ranking_seal_sha256": RANKING_SHA256,
              "ranker_sha256": ranking["script_sha256"],
              "source_script_sha256": sha(Path(__file__)),
              "rule": "exact tracked source path or unique tracked suffix/basename explicitly in issue; exclude delivered; at most three new reads per task",
              "rows": rows,
              "claim_ceiling": "Source-only acquisition suggestions; no actual reads, native score, or superiority claim."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
    print(json.dumps({"rows": len(rows), "selected": sum(len(row["selected_undelivered_paths"]) for row in rows),
                      "tasks_with_selection": sum(bool(row["selected_undelivered_paths"]) for row in rows),
                      "seal_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
