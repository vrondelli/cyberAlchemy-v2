#!/usr/bin/env python3
"""Read-only, exposed-cohort G02 diagnostic. Never use gold in a selector."""

import json
import re
import statistics
import sys
from collections import Counter
from pathlib import Path


BASE = Path("/opt/are/evolution-runtime")
PLANS = (
    BASE / "g02-product-replication-r3/EXECUTION-PLAN.json",
    BASE / "g02-product-replication-execution-r2.json",
)
UPSTREAM = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"
GOLD = UPSTREAM / "data/full.parquet"


def mentioned(issue, path):
    base = Path(path).name
    return {
        "full_path": path.casefold() in issue,
        "basename": bool(re.search(r"(?<![\w.])" + re.escape(base.casefold()) + r"(?![\w.])", issue)),
    }


def score_counts(sets, gold_files, issue, totals):
    for position, paths in sets.items():
        for path in paths:
            correct = path in gold_files
            marks = mentioned(issue, path)
            totals[(position, "total", correct)] += 1
            for signal, matched in marks.items():
                if matched:
                    totals[(position, signal, correct)] += 1


def main():
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(GOLD))
    totals = Counter()
    pairs = Counter()
    read_signal = {key: [] for key in (("selected", True), ("selected", False),
                                      ("delivered_unselected", True), ("delivered_unselected", False))}
    for cohort, plan_path in (("r3", PLANS[0]), ("r2", PLANS[1])):
        for pair in json.loads(plan_path.read_text())["ordered_pairs"]:
            root = Path(pair["root"])
            prediction_path = root / "evidence/run/prediction.json"
            scores = (root / "evidence/run/native-score.json", root / "dsh-export/native-score.json")
            if not prediction_path.is_file() or not all(path.is_file() for path in scores):
                continue
            prediction = json.loads(prediction_path.read_text())
            traj = prediction["traj_data"]
            selected = set(traj["pred_files"])
            delivered = {path for step in traj["pred_steps"] for path in step["files"]}
            gold = loader.get(prediction["instance_id"])
            if gold is None:
                raise ValueError(f"gold missing: {prediction['instance_id']}")
            task_path = next((root / "tasks").glob("SWE-Bench-Pro__*.json"))
            issue = json.loads(task_path.read_text())["problem_statement"].casefold()
            score_counts({"selected": selected, "delivered_unselected": delivered - selected,
                          "never_delivered_gold": set(gold.files()) - delivered}, set(gold.files()), issue, totals)
            for position, paths in (("selected", selected), ("delivered_unselected", delivered - selected)):
                for path in paths:
                    steps = [step for step in traj["pred_steps"] if path in step["files"]]
                    read_signal[(position, path in gold.files())].append({
                        "cohort": cohort,
                        "repo": pair["repo"],
                        "read_count": len(steps),
                        "read_line_sum": sum(span["end"] - span["start"] + 1
                                             for step in steps for span in step["spans"][path]),
                    })
            pairs[cohort] += 1
    rows = []
    for position in ("selected", "delivered_unselected", "never_delivered_gold"):
        for signal in ("total", "full_path", "basename"):
            rows.append({"position": position, "signal": signal,
                         "correct": totals[(position, signal, True)],
                         "incorrect": totals[(position, signal, False)]})
    signals = []
    for (position, correct), values in read_signal.items():
        signals.append({"position": position, "correct": correct, "files": len(values),
                        "median_read_count": statistics.median(v["read_count"] for v in values),
                        "mean_read_count": statistics.mean(v["read_count"] for v in values),
                        "median_read_line_sum": statistics.median(v["read_line_sum"] for v in values),
                        "mean_read_line_sum": statistics.mean(v["read_line_sum"] for v in values)})
    thresholds = []
    for min_count, min_lines in ((2, 0), (3, 0), (4, 0), (1, 20), (1, 40), (2, 20), (2, 40)):
        for repo in sorted({v["repo"] for values in read_signal.values() for v in values} | {"ALL"}):
            matched = {correct: [v for v in read_signal[("delivered_unselected", correct)]
                                 if (repo == "ALL" or v["repo"] == repo)
                                 and v["read_count"] >= min_count and v["read_line_sum"] >= min_lines]
                       for correct in (True, False)}
            thresholds.append({"repo": repo, "min_read_count": min_count,
                               "min_read_line_sum": min_lines,
                               "correct": len(matched[True]), "incorrect": len(matched[False])})
    prune_bins = []
    for max_count, max_lines in ((1, 999999), (2, 999999), (1, 20), (1, 50), (2, 20), (2, 50)):
        for repo in sorted({v["repo"] for values in read_signal.values() for v in values} | {"ALL"}):
            matched = {correct: [v for v in read_signal[("selected", correct)]
                                 if (repo == "ALL" or v["repo"] == repo)
                                 and v["read_count"] <= max_count and v["read_line_sum"] <= max_lines]
                       for correct in (True, False)}
            prune_bins.append({"repo": repo, "max_read_count": max_count,
                               "max_read_line_sum": max_lines,
                               "correct": len(matched[True]), "incorrect": len(matched[False])})
    print(json.dumps({"posture": "exposed-read-only-diagnostic", "pairs": pairs,
                      "rows": rows, "read_signals": signals, "thresholds": thresholds,
                      "prune_bins": prune_bins,
                      "candidate_authority": "none"}, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()
