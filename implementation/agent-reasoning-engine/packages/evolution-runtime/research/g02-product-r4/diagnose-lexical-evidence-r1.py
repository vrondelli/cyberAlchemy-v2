#!/usr/bin/env python3
"""Exposed-only G02 diagnostic: issue-to-delivered-source lexical ranking."""

import json
import math
import re
import statistics
import sys
from collections import Counter
from pathlib import Path


BASE = Path("/opt/are/evolution-runtime")
PLANS = (
    ("r3", BASE / "g02-product-replication-r3/EXECUTION-PLAN.json"),
    ("r2", BASE / "g02-product-replication-execution-r2.json"),
)
UPSTREAM = BASE / "hen-11-contextbench-intent-anchor-r3-v22-dev/upstream"
STOP = set("about after again also and are been before being between both could does each from have into issue more must need only other over same should some than that their then there these this those through under using when where which while with would".split())


def words(value):
    value = re.sub(r"([a-z])([A-Z])", r"\1 \2", value).replace("_", " ")
    return {word for word in re.findall(r"[a-z][a-z0-9]{2,}", value.casefold())
            if word not in STOP}


def delivered_text(root, trajectory):
    checkout = root / "sources/session/base"
    ranges = {}
    for step in trajectory["pred_steps"]:
        for path in step["files"]:
            ranges.setdefault(path, []).extend(step["spans"][path])
    result = {}
    for path, spans in ranges.items():
        source = checkout / path
        if not source.is_file():
            raise ValueError(f"missing delivered source: {source}")
        lines = source.read_text(errors="replace").splitlines()
        line_ids = {line for span in spans for line in range(span["start"], min(span["end"], len(lines)) + 1)}
        result[path] = words(path + " " + " ".join(lines[line - 1] for line in sorted(line_ids)))
    return result


def main():
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    cohort_pairs = Counter()
    bins = Counter()
    best = Counter()
    weakest = Counter()
    margins = {key: [] for key in ("selected_correct", "selected_incorrect",
                                     "unselected_correct", "unselected_incorrect")}
    for cohort, plan_path in PLANS:
        for pair in json.loads(plan_path.read_text())["ordered_pairs"]:
            root = Path(pair["root"])
            prediction_path = root / "evidence/run/prediction.json"
            if not prediction_path.is_file() or not all((root / p).is_file() for p in
                ("evidence/run/native-score.json", "dsh-export/native-score.json")):
                continue
            pred = json.loads(prediction_path.read_text())
            task_path = next((root / "tasks").glob("SWE-Bench-Pro__*.json"))
            issue = words(json.loads(task_path.read_text())["problem_statement"])
            corpus = delivered_text(root, pred["traj_data"])
            df = Counter(word for text in corpus.values() for word in text & issue)
            weights = {word: math.log((len(corpus) + 1) / (df[word] + 1)) + 1 for word in issue}
            scores = {path: sum(weights[word] for word in text & issue) for path, text in corpus.items()}
            selected = set(pred["traj_data"]["pred_files"])
            gold = set(loader.get(pred["instance_id"]).files())
            for path, score in scores.items():
                position = "selected" if path in selected else "unselected"
                key = position + ("_correct" if path in gold else "_incorrect")
                margins[key].append(score)
                bins[(position, path in gold, int(score == 0), int(score >= 5), int(score >= 10))] += 1
            unselected = [(score, path) for path, score in scores.items() if path not in selected]
            if unselected:
                top = max(score for score, _ in unselected)
                leaders = [path for score, path in unselected if score == top]
                best[(cohort, "top_tie_any_correct")] += int(any(path in gold for path in leaders))
                best[(cohort, "top_unique_correct")] += int(len(leaders) == 1 and leaders[0] in gold)
                best[(cohort, "top_unique_false")] += int(len(leaders) == 1 and leaders[0] not in gold)
            selected_scored = [(scores[path], path) for path in selected if path in scores]
            if len(selected_scored) >= 2:
                low = min(score for score, _ in selected_scored)
                high = max(score for score, _ in selected_scored)
                losers = [path for score, path in selected_scored if score == low]
                if low < 0.5 * high and len(losers) == 1:
                    weakest[(cohort, pair["repo"], "correct" if losers[0] in gold else "incorrect")] += 1
            cohort_pairs[cohort] += 1
    summary = [{"group": key, "n": len(values), "median": statistics.median(values),
                "mean": statistics.mean(values)} for key, values in margins.items()]
    print(json.dumps({"posture": "exposed-read-only-diagnostic", "pairs": cohort_pairs,
                      "score_summary": summary,
                      "best": [{"cohort": k[0], "kind": k[1], "count": v} for k, v in sorted(best.items())],
                      "weakest_selected": [{"cohort": k[0], "repo": k[1], "kind": k[2], "count": v}
                                           for k, v in sorted(weakest.items())],
                      "bins": [{"position": k[0], "correct": k[1], "zero": k[2],
                                "at_least_5": k[3], "at_least_10": k[4], "count": v}
                               for k, v in sorted(bins.items())],
                      "candidate_authority": "none"}, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()
