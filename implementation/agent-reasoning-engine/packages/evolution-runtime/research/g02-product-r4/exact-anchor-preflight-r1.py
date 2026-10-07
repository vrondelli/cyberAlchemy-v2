#!/usr/bin/env python3
"""Seal a source-only, precision-biased file acquisition rule on exposed G02 r3.

No native gold, score, or DSH output is read. This is not a benchmark score.
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
CODE_PATTERN = re.compile(r"`([^`\n]{3,120})`|\b[A-Za-z][A-Za-z0-9]*(?:[._/][A-Za-z][A-Za-z0-9]*)+\b")
IDENTIFIER = re.compile(r"[A-Za-z_][A-Za-z0-9_]*(?:[./:_-][A-Za-z_][A-Za-z0-9_]*)*")


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def anchors(issue):
    found = set()
    for match in CODE_PATTERN.finditer(issue):
        value = match.group(1) or match.group(0)
        if not IDENTIFIER.fullmatch(value) or len(value) < 5:
            continue
        if not (re.search(r"[./:_-]", value) or re.search(r"[a-z][A-Z]", value)):
            continue
        found.add(value.casefold())
    return sorted(found)


def exact_match(anchor, value):
    return re.search(r"(?<![A-Za-z0-9_])" + re.escape(anchor) + r"(?![A-Za-z0-9_])",
                     value.casefold()) is not None


def choose(row):
    root = Path(row["pair_root"])
    base = root / "sources/session/base"
    task_files = list((root / "tasks").glob("SWE-Bench-Pro__*.json"))
    if len(task_files) != 1:
        raise ValueError("unexpected task count")
    issue = json.loads(task_files[0].read_text())["problem_statement"]
    if hashlib.sha256(issue.encode()).hexdigest() != row["issue_sha256"]:
        raise ValueError("issue drift")
    terms = anchors(issue)
    delivered = set(row["delivered_paths"])
    pool = [entry["path"] for entry in row["raw_top30"] if entry["path"] not in delivered][:10]
    matched = {}
    for path in pool:
        source = base / path
        if source.is_symlink() or not source.is_file() or source.stat().st_size > 262144:
            raise ValueError("ranked source drift")
        value = path + "\n" + source.read_text(errors="replace")
        matched[path] = {term for term in terms if exact_match(term, value)}
    frequency = {term: sum(term in values for values in matched.values()) for term in terms}
    # A candidate needs an exact code-like issue anchor rare among the ten
    # highest-ranked files. Limit new read slots to two per task.
    selected = [path for path in pool if any(frequency[term] <= 2 for term in matched[path])][:2]
    return {"instance_id": row["instance_id"], "pair_root": row["pair_root"],
            "source_issue_sha256": row["issue_sha256"],
            "issue_anchor_count": len(terms), "eligible_pool_size": len(pool),
            "selected_paths": selected}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("ranking_seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.ranking_seal) != RANKING_SHA256:
        raise SystemExit("ranking seal mismatch")
    sealed = json.loads(args.ranking_seal.read_text())
    if sha(args.ranker) != sealed["script_sha256"] or len(sealed["results"]) != 12:
        raise SystemExit("ranking provenance mismatch")
    rows = []
    for row in sealed["results"]:
        replay = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), row["pair_root"]], text=True))
        if replay != row:
            raise SystemExit("source-only ranking replay mismatch")
        rows.append(choose(row))
    if len({row["instance_id"] for row in rows}) != 12:
        raise SystemExit("duplicate task")
    result = {"schema_version": "g02.exact-anchor-source-seal/v1",
              "posture": "source-only-exposed-development-no-gold-or-native-score-opened",
              "ranking_seal_sha256": RANKING_SHA256,
              "ranker_sha256": sealed["script_sha256"],
              "source_script_sha256": sha(Path(__file__)),
              "rule": "raw top30, first ten undelivered; exact code-like issue identifier of length >=5, present in <=2 of ten candidate files; at most two selected in rank order",
              "rows": rows,
              "claim_ceiling": "Source-only diagnostic choices. No native score or superiority claim.",
              "open_questions": ["Are selected files native-gold hits without excessive false positives?"]}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"status": "sealed", "receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "selected_count": sum(len(row["selected_paths"]) for row in rows),
                      "tasks_with_selection": sum(bool(row["selected_paths"]) for row in rows)}))


if __name__ == "__main__":
    main()
