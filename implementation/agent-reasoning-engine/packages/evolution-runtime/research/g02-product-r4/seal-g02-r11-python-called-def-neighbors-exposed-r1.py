#!/usr/bin/env python3
"""Seal exact issue-called definitions among exposed Python import neighbors.

This candidate generator reads issue text and pinned base source only. It does
not read native labels, scores, prior audits, or comparator output.
"""

import argparse
import ast
import builtins
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path


GRAPH_SHA = "777f9d69cc65be69d472ed3a7633f75483e01134c5298527b99fd22f5c490384"
RANKED_SHA = "55f3175c54d683cf9d4fac907fa34cff4982782e092acf9a2d35a50f0fb8e7db"
ARCHIVE = Path("/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002")
CALL_RE = re.compile(r"\b([A-Za-z_][A-Za-z0-9_]*)\s*\(")
BACKTICK_RE = re.compile(r"`([A-Za-z_][A-Za-z0-9_]*)`")
BUILTINS = set(dir(builtins))
MAX_BYTES = 262144


def sha(data):
    return hashlib.sha256(data).hexdigest()


def anchors(issue):
    names = set(CALL_RE.findall(issue)) | set(BACKTICK_RE.findall(issue))
    return sorted(name for name in names if len(name) >= 4 and name not in BUILTINS)


def definitions(path):
    tree = ast.parse(path.read_bytes(), filename=str(path))
    return {node.name for node in ast.walk(tree) if isinstance(
        node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)
    )}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("graph", type=Path)
    parser.add_argument("ranked", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if sha(args.graph.read_bytes()) != GRAPH_SHA or sha(args.ranked.read_bytes()) != RANKED_SHA:
        raise SystemExit("source input drift")
    graph = json.loads(args.graph.read_text())
    ranked = json.loads(args.ranked.read_text())
    rank_rows = {row["ordinal"]: row for row in ranked["rows"]}
    rows = []
    for row in graph["rows"]:
        ordinal = row["ordinal"]
        root = ARCHIVE / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
        base = root / "sources/session/base"
        task_files = [p for p in (root / "tasks").glob("*.json") if p.name != "binding.json"]
        if len(task_files) != 1:
            raise SystemExit(f"task count: {ordinal}")
        task = json.loads(task_files[0].read_text())
        issue = task["problem_statement"]
        commit = subprocess.check_output(
            ["git", "-c", f"safe.directory={base}", "-C", str(base), "rev-parse", "HEAD"],
            text=True,
        ).strip()
        if (task["instance_id"] != row["instance_id"] or
                sha(issue.encode()) != row["issue_sha256"] or commit != row["base_commit"]):
            raise SystemExit(f"task/base identity drift: {ordinal}")
        rank = rank_rows[ordinal]
        if {x["path"] for x in rank["ranked"]} != {
                x["path"] for x in row["candidates"] if x["bytes"] <= MAX_BYTES}:
            raise SystemExit(f"candidate pool drift: {ordinal}")
        issue_anchors = anchors(issue)
        matches = []
        for item in rank["ranked"]:
            path = base / item["path"]
            if (not path.is_file() or path.is_symlink() or
                    path.stat().st_size > MAX_BYTES):
                raise SystemExit(f"candidate file drift: {ordinal}:{item['path']}")
            try:
                matched = sorted(set(issue_anchors) & definitions(path))
            except (SyntaxError, UnicodeError, ValueError):
                continue
            if matched:
                matches.append({"path": item["path"], "matched_symbols": matched,
                                "prior_source_rank_units": item["score_units"]})
        matches.sort(key=lambda item: (-len(item["matched_symbols"]),
                                       -item["prior_source_rank_units"], item["path"]))
        rows.append({"ordinal": ordinal, "instance_id": row["instance_id"],
                     "base_commit": commit, "issue_sha256": row["issue_sha256"],
                     "issue_called_anchors": issue_anchors,
                     "matched_candidate_count": len(matches), "matches": matches,
                     "proposed_paths": [item["path"] for item in matches[:3]]})
    output = {
        "schema_version": "g02.r11-python-called-def-neighbors-exposed-seal/v1",
        "posture": "source-only-exposed-development-no-gold-dsh-or-score",
        "graph_seal_sha256": GRAPH_SHA,
        "ranked_seal_sha256": RANKED_SHA,
        "script_sha256": sha(Path(__file__).read_bytes()),
        "rule": "Among prior direct-import neighbor candidates <=262144 bytes, require exact issue call/backtick identifier (length>=4, not Python builtin) to equal a Python AST function/class definition; rank by number of exact matches, then prior source-only rank, then path; up to three per task, otherwise abstain.",
        "rows": rows,
        "claim_ceiling": "Exposed source-only proposals only; evaluator audit follows seal; no actual read, native score, cost, or superiority.",
    }
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"status": "sealed-source-only", "seal_sha256": sha(data),
                      "tasks": len(rows), "proposal_counts": [len(row["proposed_paths"]) for row in rows]}))


if __name__ == "__main__":
    main()
