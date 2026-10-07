#!/usr/bin/env python3
"""Apply unchanged r3 acquisition features to exposed G02 r2, before labels."""

import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def module_at(path):
    spec = importlib.util.spec_from_file_location("g02_acquisition_features", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("plan", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("feature_script", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    plan = json.loads(args.plan.read_text())
    if plan.get("schema_version") != "are.g02-product-replication-execution/v1" or len(plan["ordered_pairs"]) != 24:
        raise SystemExit("unexpected r2 execution plan")
    feature_module = module_at(args.feature_script)
    rows = []
    for pair in plan["ordered_pairs"]:
        ranked = json.loads(subprocess.check_output(
            [sys.executable, str(args.ranker), pair["root"]], text=True))
        if ranked["instance_id"] != pair["instance_id"] or ranked["pair_root"] != pair["root"]:
            raise ValueError("r2 ranker/plan identity mismatch")
        rows.append(feature_module.features(ranked))
    if len({row["instance_id"] for row in rows}) != 24:
        raise ValueError("duplicate task")
    output = {"schema_version": "g02.cross-repo-acquisition-r2-feature-transfer/v1",
              "posture": "source-only-exposed-development-no-gold-or-score-opened",
              "plan_sha256": sha(args.plan), "ranker_sha256": sha(args.ranker),
              "feature_script_sha256": sha(args.feature_script),
              "feature_names": ["normalized_bm25", "issue_path_word_fraction",
                                "issue_content_word_fraction", "issue_code_anchor_fraction",
                                "same_selected_parent", "selected_directory_depth"],
              "rows": rows,
              "claim_ceiling": "Source-only transfer feature seal; no quality, native score, or superiority claim."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
    print(json.dumps({"rows": len(rows), "candidates": sum(len(row["candidates"]) for row in rows),
                      "seal_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
