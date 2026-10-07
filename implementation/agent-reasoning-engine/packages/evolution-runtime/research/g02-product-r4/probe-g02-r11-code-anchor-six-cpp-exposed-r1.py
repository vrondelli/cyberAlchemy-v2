#!/usr/bin/env python3
"""Source-column-only admission probe on all six selected r11 C++ tasks."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


DEFINITION_SHA = "0ec225f9df7cc0140dffeee53da9e57c4f2b92176b7b15c8c6fb48728bd46ddf"
PARQUET_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    for name in ("definition", "parquet", "gate_script", "output"):
        ap.add_argument(name, type=Path)
    args = ap.parse_args()
    if sha(args.definition) != DEFINITION_SHA or sha(args.parquet) != PARQUET_SHA:
        raise SystemExit("source drift")
    spec = importlib.util.spec_from_file_location("anchor_gate", args.gate_script)
    gate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gate)
    definition = json.loads(args.definition.read_text())
    selected = [row for row in definition["ordered_pairs"] if row["language"] == "cpp"]
    if [row["ordinal"] for row in selected] != [4, 8, 12, 16, 20, 24]:
        raise SystemExit("selected C++ identity drift")
    # Column projection intentionally excludes gold_context, patch, and scores.
    table = parquet.read_table(args.parquet,
                               columns=["instance_id", "base_commit", "problem_statement"])
    lookup = {row["instance_id"]: row for row in table.to_pylist()}
    rows = []
    for item in selected:
        task = lookup[item["instance_id"]]
        if task["base_commit"] != item["base_commit"]:
            raise SystemExit("task base drift")
        issue = task["problem_statement"]
        anchors = gate.code_anchor(issue)
        rows.append({"ordinal": item["ordinal"],
                     "issue_sha256": hashlib.sha256(issue.encode()).hexdigest(),
                     "issue_word_count": len(issue.split()),
                     "anchor_count": len(anchors),
                     "admitted": bool(anchors)})
    output = {"schema_version": "g02.r11-code-anchor-six-cpp-source-probe/v1",
              "posture": "selected-exposed-source-columns-only-no-gold-patch-or-score",
              "definition_sha256": DEFINITION_SHA,
              "parquet_sha256": PARQUET_SHA,
              "gate_script_sha256": sha(args.gate_script),
              "script_sha256": sha(Path(__file__)),
              "rows": rows,
              "claim_ceiling": "Source-only coverage of a post-hoc gate across selected C++ issues; no independent quality, model result, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"tasks": len(rows), "admitted": sum(row["admitted"] for row in rows),
                      "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
