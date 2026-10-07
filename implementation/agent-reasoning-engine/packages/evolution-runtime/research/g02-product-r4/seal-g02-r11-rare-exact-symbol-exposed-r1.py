#!/usr/bin/env python3
"""Source-only, sparse Python import-neighbor proposals for exposed G02 r11.

An issue identifier must exactly name a Python function/class defined in only
one eligible one-hop import neighbor. The eight-character minimum rejects
short generic names; this is a development hypothesis, not a learned score.
"""

import ast
import hashlib
import json
import os
import re
from collections import Counter
from pathlib import Path


ROOT = Path("/home/vlad_/are-benchmark-archive/g02-r11-python-import-neighbors-exposed-r1-20261002")
RANKED = ROOT / "RANKED-SEAL.json"
PRIOR = Path("/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002/SEAL.json")
OUTPUT = Path("/home/vlad_/are-benchmark-archive/g02-r11-rare-exact-symbol-exposed-r1/SOURCE-SEAL.json")
PINS = {RANKED: "55f3175c54d683cf9d4fac907fa34cff4982782e092acf9a2d35a50f0fb8e7db",
        PRIOR: "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"}
ORDINALS = [1, 2, 3, 5, 6, 7, 9, 10, 11]
IDENT = re.compile(r"\b[A-Za-z_][A-Za-z_0-9]{7,}\b")


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise ValueError("output-exists-or-input-drift")
    ranked = json.loads(RANKED.read_text())
    prior = json.loads(PRIOR.read_text())
    if ([row["ordinal"] for row in ranked["rows"]] != ORDINALS or
            ranked["fixed_read_budget"] != 3 or
            ranked["posture"] != "source-only-exposed-development-no-gold-dsh-or-score"):
        raise ValueError("ranked-seal-shape")
    old_rows = {row["ordinal"]: row for row in prior["rows"]}
    rows = []
    for row in ranked["rows"]:
        ordinal = row["ordinal"]
        old = old_rows[ordinal]
        raw = (Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw")
        base = raw / "sources/session/base"
        task_files = [path for path in (raw / "tasks").glob("*.json") if path.name != "binding.json"]
        if len(task_files) != 1 or row["instance_id"] != old["instance_id"]:
            raise ValueError("task-binding")
        task = json.loads(task_files[0].read_text())
        issue = task["problem_statement"]
        if (task["instance_id"] != row["instance_id"] or
                hashlib.sha256(issue.encode()).hexdigest() != old["issue_sha256"]):
            raise ValueError("issue-drift")
        issue_names = set(IDENT.findall(issue))
        members = []
        frequency = Counter()
        for item in row["ranked"]:
            path = item["path"]
            file = base / path
            if not path.endswith(".py") or not file.is_file() or file.is_symlink() or file.stat().st_size > 262144:
                raise ValueError("candidate-source-drift")
            try:
                tree = ast.parse(file.read_bytes(), filename=path)
            except (SyntaxError, UnicodeError, ValueError):
                names = set()
            else:
                names = issue_names & {node.name for node in ast.walk(tree)
                                       if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))}
            members.append((item, names))
            frequency.update(names)
        eligible = []
        for item, names in members:
            unique = sorted(name for name in names if frequency[name] == 1)
            if unique:
                eligible.append({"path": item["path"], "matched_unique_symbols": unique,
                                 "max_symbol_length": max(map(len, unique)),
                                 "prior_score_units": item["score_units"]})
        eligible.sort(key=lambda item: (-item["max_symbol_length"],
                                        -item["prior_score_units"], item["path"]))
        proposed = [item["path"] for item in eligible[:3]]
        if len(proposed) != len(set(proposed)) or set(proposed) & set(old["delivered_paths"]):
            raise ValueError("new-read-invariant")
        rows.append({"ordinal": ordinal, "instance_id": row["instance_id"],
                     "repo": old["repo"], "base_commit": old["base_commit"],
                     "issue_sha256": old["issue_sha256"],
                     "eligible_count": len(eligible), "proposed": proposed,
                     "proposal_signals": eligible[:3]})
    receipt = {"schema_version": "g02.r11-rare-exact-symbol-exposed-source-seal/v1",
               "posture": "source-only-exposed-development-no-gold-model-or-score",
               "ranked_seal_sha256": PINS[RANKED], "prior_seal_sha256": PINS[PRIOR],
               "script_sha256": sha(Path(__file__)),
               "rule": "issue exact case-sensitive identifiers length>=8 intersect AST function/class definitions in exactly one eligible direct-import neighbor; rank by longest identifier, prior source-only score, then path; at most three new reads",
               "rows": rows,
               "summary": {"tasks": len(rows), "proposals": sum(len(row["proposed"]) for row in rows),
                           "model_calls": 0, "gold_loaded": False},
               "claim_ceiling": "Source-only exposed development proposal, not delivered reads, native quality, independent validation, or superiority."}
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"summary": receipt["summary"], "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
