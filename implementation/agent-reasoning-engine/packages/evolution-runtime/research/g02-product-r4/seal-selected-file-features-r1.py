#!/usr/bin/env python3
"""Seal source/receipt-only features for exposed G02 selected-file precision research.

All 36 original ARE predictions are included. No DSH, native scores, gold, or
work-tree source is opened here. This seal does not change any prediction.
"""

import argparse
import hashlib
import json
import math
import os
import re
from pathlib import Path


PLAN_SHA256 = {
    "r2": "bfc92b5a331fc462834d5dd2bb1d93643a5dfaa5dc0817558c0a2c80bf8db808",
    "r3": "0ccc9f027000682bbe950e8d8561ff150714aeb9610608149b0c26e4d41da53a",
}
TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,}")
STOP = set("a about after all an and are as at be been before by can do does for from have if in into is it its of on or our should that the their these this to was were what when where which while with would".split())
FEATURE_NAMES = ["log_read_count", "log_read_line_sum", "log_selected_line_sum",
                 "selected_to_read_line_ratio", "issue_path_token_overlap",
                 "issue_read_token_overlap", "first_read_fraction", "last_read_fraction",
                 "selected_file_fraction", "path_depth"]


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def terms(value):
    value = re.sub(r"([a-z])([A-Z])", r"\1 \2", value)
    return {word for word in (part.casefold() for part in TOKEN_RE.findall(value))
            if word not in STOP}


def span_lines(spans):
    total = 0
    for span in spans:
        start, end = span["start"], span["end"]
        if not isinstance(start, int) or not isinstance(end, int) or start < 1 or end < start:
            raise ValueError("invalid span")
        total += end - start + 1
    return total


def selected_features(root, prediction, issue):
    base = root / "sources/session/base"
    trajectory = prediction["traj_data"]
    steps = trajectory["pred_steps"]
    selected = trajectory["pred_files"]
    if len(set(selected)) != len(selected) or not steps:
        raise ValueError("selected/step structure")
    issue_terms = terms(issue)
    rows = []
    for path in selected:
        relative = Path(path)
        if relative.is_absolute() or ".." in relative.parts:
            raise ValueError("unsafe selected path")
        source = base / relative
        if not source.is_file() or source.is_symlink() or source.stat().st_size > 2_000_000:
            raise ValueError("selected base source unavailable or too large")
        source_lines = source.read_text(errors="replace").splitlines()
        observations = [(index, step["spans"].get(path, []))
                        for index, step in enumerate(steps) if path in step["files"]]
        if not observations:
            raise ValueError("selected file without delivered receipt")
        read_text = []
        read_line_sum = 0
        for _, spans in observations:
            read_line_sum += span_lines(spans)
            for span in spans:
                read_text.extend(source_lines[span["start"] - 1:span["end"]])
        selected_spans = trajectory["pred_spans"].get(path, [])
        selected_line_sum = span_lines(selected_spans)
        path_terms = terms(path)
        read_terms = terms("\n".join(read_text))
        feature_values = [math.log1p(len(observations)), math.log1p(read_line_sum),
                          math.log1p(selected_line_sum), selected_line_sum / (read_line_sum + 1),
                          len(issue_terms & path_terms) / max(len(path_terms), 1),
                          len(issue_terms & read_terms) / max(len(issue_terms), 1),
                          observations[0][0] / max(len(steps) - 1, 1),
                          observations[-1][0] / max(len(steps) - 1, 1),
                          selected_line_sum / max(len(source_lines), 1),
                          len(relative.parts)]
        rows.append({"path": path, "features": [round(value, 8) for value in feature_values]})
    return rows


def extract_pair(pair):
    root = Path(pair["root"])
    prediction_path = root / "evidence/run/prediction.json"
    task_files = list((root / "tasks").glob("SWE-Bench-Pro__*.json"))
    if not prediction_path.is_file() or len(task_files) != 1:
        return {"instance_id": pair["instance_id"], "root": str(root), "status": "source-unavailable"}
    prediction = json.loads(prediction_path.read_text())
    issue = json.loads(task_files[0].read_text())["problem_statement"]
    if prediction["instance_id"] != pair["instance_id"]:
        raise ValueError("pair identity mismatch")
    return {"instance_id": pair["instance_id"], "root": str(root),
            "repo": pair["suffix"].split("-")[1], "status": "features-sealed",
            "prediction_sha256": sha(prediction_path), "issue_sha256": hashlib.sha256(issue.encode()).hexdigest(),
            "selected": selected_features(root, prediction, issue)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("r2_plan", type=Path)
    parser.add_argument("r3_plan", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    plans = {"r2": args.r2_plan, "r3": args.r3_plan}
    for name, path in plans.items():
        if sha(path) != PLAN_SHA256[name]:
            raise SystemExit(f"{name} plan hash drift")
    cohorts = {}
    for name, path in plans.items():
        plan = json.loads(path.read_text())
        expected = 24 if name == "r2" else 12
        if len(plan["ordered_pairs"]) != expected:
            raise SystemExit(f"{name} denominator mismatch")
        cohorts[name] = [extract_pair(pair) for pair in plan["ordered_pairs"]]
    receipt = {"schema_version": "g02.selected-file-source-features/v1",
               "posture": "source-and-ARE-receipt-only-exposed-no-gold-no-DSH-no-native-score",
               "plan_sha256": PLAN_SHA256, "script_sha256": sha(Path(__file__)),
               "feature_names": FEATURE_NAMES, "cohorts": cohorts,
               "claim_ceiling": "Feature seal only; no trained model, native score, holdout, or superiority.",
               "open_questions": ["Can a fixed training procedure distinguish incorrect selected files on an entirely unseen repository?"]}
    data = (json.dumps(receipt, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"status": "sealed", "receipt_sha256": hashlib.sha256(data).hexdigest(),
                      "pairs": sum(len(rows) for rows in cohorts.values()),
                      "feature_pairs": sum(row["status"] == "features-sealed" for rows in cohorts.values() for row in rows),
                      "selected_files": sum(len(row.get("selected", [])) for rows in cohorts.values() for row in rows)}, sort_keys=True))


if __name__ == "__main__":
    main()
